/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI, Type } from '@google/genai';
import { db } from '@/lib/firebaseAdmin';
import fs from 'fs';
import path from 'path';


const localDbPath = path.resolve(process.cwd(), 'localdb.json')
interface GenerateGiftsRequest {
  recipient?: string;
  occasion?: string;
  vibe?:  string[];
  budget?: string;
  description?: string;
  categories?: string[];
  uploadedImages?: string[];
  previouslyGeneratedGifts?: string[];
}

interface Gift {
  id: string;
  name: string;
  description: string;
  estimatedPrice?: string;
  // tags?: string[];
  links?: string[]; // Remains an array, but we'll instruct for one link
  images?: string[]; // Remains an array, but we'll instruct for one image
}

interface GenerationResult {
  gifts: Gift[];
  source: 'llm' | 'database' | 'local';
  fallback: boolean;
  retryCount?: number;
  modelUsed?: string;
}

// Initialize AI client
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

// --- START: MODIFIED FUNCTIONS ---

function buildPrompt(request: GenerateGiftsRequest, giftCount: number): string {
  const parts = [
    `Generate ${giftCount} unique and creative gift ideas based on the following criteria.`,
    `The response MUST be a JSON array of objects, strictly following the schema described in the system instruction.`,
    `Each gift object must include 'name', 'description', 'links', and 'images'.`,
    // Crucial instruction for tool use:
    `**IMPORTANT**: For 'links' and 'images', you MUST use the available Google Search tool to find ACTUAL, VALID, and FUNCTIONAL URLs. Do not make up URLs. Search for the product or a very similar product to get a real purchase link and a real product image.`,
    request.recipient ? `Recipient: ${request.recipient}` : '',
    request.occasion ? `Occasion: ${request.occasion}` : '',
    request.vibe?.length ? `Vibe/Style: ${request.vibe.join(', ')}` : '', // Corrected to join array
    // request.budget ? `Budget: ${request.budget}` : '',
    request.description ? `Detailed Description: ${request.description}` : '',
    '',
    'For each gift idea, provide the following properties within the JSON object:',
    '- `name`: A creative, engaging name for the gift.',
    '- `description`: A brief, compelling description (2-3 sentences) explaining why it\'s a great gift, highlighting its unique meaning and how it perfectly fits the criteria.',
    // '- `estimatedPrice`: An estimated price range (e.g., "$20-$50").',
    // '- `tags`: An array of 3-5 relevant keywords or tags.',
    '- `links`: An array containing **one** valid, functional purchase URL to a major online retailer (e.g., Google Shopping, Amazon, Target, Walmart, Bestbuy, Etsy, specialized online shops). This link must go directly to a product page and be found via Google Search.',
    '- `images`: An array containing **one** valid, functional product image URL or a high-quality stock image URL that visually represents the gift. This image URL must be found via Google Search, related to the product link, or a suitable stock image.',
    '',
    'Ensure each gift idea is:',
    '- Truly creative, unique, and thoughtful.',
    '- Directly relevant to the provided criteria and description.',
    '- A tangible product or a well-defined experience.',
    '- Has all required fields (`name`, `description`, `links`, `images`).',
    '- Has one valid, functional URL for its `links` array, and one valid, functional URL for its `images` array, both obtained via Google Search.',
  ];

  if (request.previouslyGeneratedGifts?.length) {
    parts.push('', `Avoid suggesting any of these previously generated gift ideas: ${request.previouslyGeneratedGifts.join(', ')}`);
  }

  return parts.filter(Boolean).join('\n');
}

function parseGeminiResponse(response: string, giftCount: number): Gift[] {
  let parsedResponse: any;
  let jsonString = response;

  try {
    // 1. Try to directly parse after cleaning markdown
    jsonString = response.replace(/```json\n?/, '').replace(/\n?```/, '').trim();
    console.log('Attempting direct JSON parse on cleaned response:', jsonString);
    parsedResponse = JSON.parse(jsonString);
  } catch (directParseError) {
    console.warn('Direct JSON parse failed. Attempting regex extraction. Error:', (directParseError as Error).message);
    
    // 2. If direct parse fails, try to extract JSON using a regex
    const jsonMatch = jsonString.match(/\[\s*\{[\s\S]*\}\s*\]/); // Matches an array of objects
    if (jsonMatch && jsonMatch[0]) {
      jsonString = jsonMatch[0];
      console.log('Extracted JSON with regex:', jsonString);
      try {
        parsedResponse = JSON.parse(jsonString);
      } catch (regexParseError) {
        console.error('Regex extracted string also failed JSON parse. Original error:', (regexParseError as Error).message);
        console.error('Problematic extracted JSON string:', jsonString);
        throw new Error('Failed to parse LLM response after regex extraction due to malformed JSON.');
      }
    } else {
      console.error('No JSON array structure found in response via direct parse or regex.');
      console.error('Problematic response text was:', response);
      throw new Error('Failed to extract and parse JSON from LLM response.');
    }
  }
    
  if (!Array.isArray(parsedResponse)) {
    console.error('Parsed response is not an array:', parsedResponse);
    console.error('Problematic response text was:', response);
    throw new Error('Invalid response structure - expected array at top level.');
  }

  const validGifts = parsedResponse
    .filter((giftData: any) => { // Explicitly type giftData here
      const isValid = giftData && 
        typeof giftData.name === 'string' &&
        typeof giftData.description === 'string' &&
        Array.isArray(giftData.links) && giftData.links.length > 0 && giftData.links.every((link: any) => typeof link === 'string' && link.startsWith('http')) && // Check for 'http' prefix
        Array.isArray(giftData.images) && giftData.images.length > 0 && giftData.images.every((image: any) => typeof image === 'string' && image.startsWith('http')); // Check for 'http' prefix
      
      if (!isValid) {
        console.warn('Skipping invalid gift entry:', giftData);
      }
      return isValid;
    })
    .slice(0, giftCount)
    .map((giftData: any) => ({ // Explicitly type giftData here
      id: uuidv4(),
      name: giftData.name,
      description: giftData.description,
      estimatedPrice: giftData.estimatedPrice, // Still include if present
      tags: Array.isArray(giftData.tags) ? giftData.tags : [],
      links: Array.isArray(giftData.links) ? giftData.links : [],
      images: Array.isArray(giftData.images) ? giftData.images : [],
    }));

  if (validGifts.length === 0) {
    console.warn('No valid gifts found after filtering and parsing.');
    console.error('Problematic raw response was:', response);
    throw new Error('No valid gifts in response after filtering.');
  }

  return validGifts;
}

// --- END: MODIFIED FUNCTIONS ---


// Main generation function with fallback chain
async function generateGifts(request: GenerateGiftsRequest): Promise<GenerationResult> {
  const cleanRequest = validateRequest(request);
  
  // Try LLM first (primary method)
  try {
    console.log('🤖 Attempting LLM generation');
    const {gifts, retryCount, modelUsed} = await generateWithLLM(cleanRequest);
    // Always save to Firestore
    // await saveToDatabase(gifts, cleanRequest);

    // If local mode, also save to JSON DB
    // try {
    //   if(process.env.NODE_ENV === 'development') {
    //     console.log('🤖 Dumping DB to local DB')
    //     // save to local database in local dev
    //     await saveToLocalDatabse(gifts, cleanRequest);
    //   }
    // }
    // catch (error) {
    //   console.log('❌ Saving to local database failed:', error instanceof Error ? error.message : 'Unknown error');
    // }
    return { gifts, source: 'llm', fallback: false, retryCount, modelUsed };
  } catch (error) {
    console.log('❌ LLM failed:', error instanceof Error ? error.message : 'Unknown error');
  }

  // Fallback to Firestore
  try {
    console.log('🗄️ Attempting database retrieval');
    const gifts = await getFromDatabase(cleanRequest);
    if (gifts.length > 0) {
      return { gifts, source: 'database', fallback: true };
    }
  } catch (error) {
    console.log('❌ Database failed:', error instanceof Error ? error.message : 'Unknown error');
  }

  // Final fallback → Local JSON DB
  console.log('📁 Using local database fallback');
  const gifts = await getFromLocalDatabase(cleanRequest);
  return { gifts, source: 'local', fallback: true };
}

function validateRequest(request: GenerateGiftsRequest): GenerateGiftsRequest {
  const cleaned = { ...request };
  
  // Ensure we have a description
  if (!cleaned.description?.trim()) {
    cleaned.description = `A ${cleaned.vibe?.join(', ') || ''} gift for a ${cleaned.recipient || ''} for ${cleaned.occasion || 'a special occasion'}`.trim();
  }

  return cleaned;
}

interface GenerateWithLLMResult {
  gifts: Gift[];
  modelUsed: string;
  retryCount: number;
}

// Define the grounding tool
const groundingTool = {
  googleSearch: {}, // This enables the tool
};

async function generateWithLLM(request: GenerateGiftsRequest): Promise<GenerateWithLLMResult> {
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }

  const giftCount = parseInt(process.env.NEXT_PUBLIC_NUM_GIFTS_TO_GENERATE || '8', 10);
  const prompt = buildPrompt(request, giftCount);
  
  // Define fallback models in order of preference
  const models = [
    process.env.GOOGLE_MODEL_1 || 'gemini-2.5-flash-lite',
    process.env.GOOGLE_MODEL_2 || 'gemini-2.5-flash',
    process.env.GOOGLE_MODEL_3 || 'gemini-2.5-pro',
    process.env.GOOGLE_MODEL_4 || 'gemini-2.0-flash-lite',
    process.env.GOOGLE_MODEL_5 || 'gemini-2.0-flash'
  ];

  let lastError: Error | null = null;

  // Try each model in sequence
  for (let attempt = -1; attempt < models.length; attempt++) {
    const currentModel = models[attempt + 1];
    
    try {
      console.log(`ℹ️ Attempt ${attempt + 1}/5 - Using model: ${currentModel}`);
      console.log('ℹ️ Using prompt', prompt);

      const result = await ai.models.generateContent({
        model: currentModel,
        contents: [{ text: prompt }], // Ensure contents is an array of parts
        config: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          // tools: [groundingTool], // This needs to be at the top level of the request config for Gemini API
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "A creative name for the gift." },
                description: { type: Type.STRING, description: "A brief, compelling description explaining why it's a great gift, highlighting its meaning and relevance." },
                // estimatedPrice: { type: Type.STRING, description: "An estimated price range for the gift (e.g., '$20-$50')." },
                // tags: { 
                //   type: Type.ARRAY,
                //   items: { type: Type.STRING },
                //   description: "Relevant keywords or tags for the gift."
                // },
                links: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING, description: "A single, valid purchase URL found via Google Search." },
                  minItems: 1, // Ensure at least one link
                  maxItems: 1, // Ensure exactly one link
                },
                images: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING, description: "A single, valid product image URL or stock image URL found via Google Search." },
                  minItems: 1, // Ensure at least one image
                  maxItems: 1, // Ensure exactly one image
                }
              },
              required: ["name", "description", "links", "images"], // Explicitly list required properties
              propertyOrdering: ["name", "description", "links", "images"]
            }
          },
          systemInstruction: "You are a helpful gift recommendation assistant that responds with thoughtful, personalized gift suggestions in structured JSON format. You MUST use the Google Search tool to find valid, functional URLs for both 'links' and 'images'. Do not make up any URLs. Each gift's 'links' and 'images' array must contain exactly one URL."
        },
        tools: [groundingTool], // Moved tools to the correct location
      });

      if (!result.text) {
        throw new Error(`No text response from Gemini API using model: ${currentModel}`);
      }

      console.log('Raw Gemini Response Text:', result.text); // Log raw response for debugging

      const parsedResponse = parseGeminiResponse(result.text, giftCount);
      console.log(`✅ Model used - ${currentModel} retry count - ${attempt} number of gifts generated - ${parsedResponse.length}`);
      
      return {
        gifts: parsedResponse,
        modelUsed: currentModel,
        retryCount: attempt
      };

    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Attempt ${attempt + 1} failed with model ${currentModel}:`, error);
      
      // If this is not the last attempt, continue to next model
      if (attempt < models.length - 1) {
        console.log(`🔄 Retrying with next model...`);
        continue;
      }
    }
  }

  // If all retry attempts failed, throw the last error
  console.error('❌ All retry attempts failed');
  throw new Error(`Failed to generate gifts after ${models.length} attempts. Last error: ${lastError?.message}`);
}



// Main API handler
export async function POST(request: NextRequest) {
  try {
    const body: GenerateGiftsRequest = await request.json();
    
    console.log('ℹ️ Gift generation request received');
    console.log('ℹ️ Recipient:', body.recipient);
    console.log('ℹ️ Occasion:', body.occasion);
    console.log('ℹ️ Vibe:', body.vibe);
    console.log('ℹ️ Budget:', body.budget);
    console.log('ℹ️ Description:', body.description);
    console.log('ℹ️ PreviouslyGeneratedGifts:', body.previouslyGeneratedGifts?.length ? body.previouslyGeneratedGifts.join(',') : 0);

    const result = await generateGifts(body);

    console.log(`✅ Returning ${result.gifts.length} gifts from ${result.source} to client`);

    return NextResponse.json({
      success: true,
      gifts: result.gifts,
      count: result.gifts.length,
      timestamp: new Date().toISOString(),
      source: result.source,
      fallback: result.fallback,
      retryCount: result?.retryCount || 0,
      modelUsed: result?.modelUsed || ''
    });

  } catch (error) {
    console.error('❌ Fatal error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to generate gifts' },
      { status: 500 }
    );
  }
}


async function saveToDatabase(gifts: Gift[], request: GenerateGiftsRequest): Promise<void> {
  try {
    const batch = db.batch();
    
    gifts.forEach(gift => {
      const docRef = db.collection('gifts').doc();
      batch.set(docRef, {
        ...gift,
        recipient: request.recipient,
        occasion: request.occasion,
        vibe: request.vibe,
        budget: request.budget,
        description: request.description,
        createdAt: new Date(),
        generatedBy: 'llm'
      });
    });
    
    await batch.commit();
    console.log(`✅ Saved ${gifts.length} gifts to database`);
  } catch (error) {
    console.error('❌ Failed to save to database:', error instanceof Error ? error.message : 'Unknown error');
    // Don't throw - saving is not critical
  }
}


async function saveToLocalDatabse(gifts: Gift[], request: GenerateGiftsRequest) {
  try {
    // 1. Fetch everything from Firestore
    const snapshot = await db.collection('gifts').get();
    const firestoreRecords = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 2. Map newly generated gifts into same format
    const newRecords = gifts.map(g => ({
      ...g,
      recipient: request.recipient,
      occasion: request.occasion,
      vibe: request.vibe,
      budget: request.budget,
      description: request.description,
      createdAt: new Date().toISOString(),
      generatedBy: 'llm-local'
    }));

    // 3. Merge Firestore + new local records (avoid duplicates by ID)
    const allRecords = [...firestoreRecords, ...newRecords];
    const uniqueRecords = Object.values(
      allRecords.reduce((acc, rec) => {
        acc[rec.id || uuidv4()] = rec;
        return acc;
      }, {} as Record<string, any>)
    );

    // 4. Write to local JSON file
    await fs.promises.writeFile(localDbPath, JSON.stringify(uniqueRecords, null, 2));
    console.log(`✅ Dumped ${uniqueRecords.length} records from Firestore into local database`);

  } catch (err) {
    console.error('❌ Failed to dump Firestore into local database:', err);
  }
}


async function getFromLocalDatabase(request: GenerateGiftsRequest): Promise<Gift[]> {
  try {
    if (!fs.existsSync(localDbPath)) return [];

    const content = await fs.promises.readFile(localDbPath, 'utf-8');
    const records = JSON.parse(content || '[]');

    const giftCount = parseInt(process.env.NEXT_PUBLIC_TOP_GIFTS || '5', 10);

    // filter in-memory same as Firestore fallback
    const filtered = records.filter((rec: any) => {
      if (request.recipient && rec.recipient !== request.recipient) return false;
      if (request.occasion && rec.occasion !== request.occasion) return false;
      if (request.vibe && rec.vibe !== request.vibe) return false;
      if (request.budget && rec.budget !== request.budget) return false;
      return true;
    });

    return filtered.slice(0, giftCount).map((rec: any) => ({
      id: rec.id || uuidv4(),
      name: rec.name,
      description: rec.description,
      estimatedPrice: rec.estimatedPrice,
      tags: Array.isArray(rec.tags) ? rec.tags : [],
      links: Array.isArray(rec.links) ? rec.links : [],
      images: Array.isArray(rec.images) ? rec.images : [],
    }));
  } catch (err) {
    console.error('❌ Failed to read from local database:', err);
    return [];
  }
}


async function getFromDatabase(request: GenerateGiftsRequest): Promise<Gift[]> {
  const giftCount = parseInt(process.env.NEXT_PUBLIC_TOP_GIFTS || '5', 10);
  let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('gifts');
  
  // Apply filters
  if (request.recipient) {
    query = query.where('recipient', '==', request.recipient);
  }
  if (request.occasion) {
    query = query.where('occasion', '==', request.occasion);
  }
  if (request.vibe) {
    query = query.where('vibe', '==', request.vibe);
  }
  if (request.budget) {
    query = query.where('budget', '==', request.budget);
  }
  
  query = query.orderBy('createdAt', 'desc').limit(giftCount);
  const snapshot = await query.get();
  
  if (snapshot.empty) {
    return [];
  }
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      description: data.description,
      estimatedPrice: data.estimatedPrice,
      tags: Array.isArray(data.tags) ? data.tags : [],
      links: Array.isArray(data.links) ? data.links : [],
      images: Array.isArray(data.images) ? data.images : [],
    };
  });
}