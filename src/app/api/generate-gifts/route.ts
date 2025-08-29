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
  vibe?: string;
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
  tags?: string[];
  links?: string[];
  images?: string[];
}

interface GenerationResult {
  gifts: Gift[];
  source: 'llm' | 'database' | 'local';
  fallback: boolean;
  retryCount?: number;
  modelUsed?: string;
}

// Initialize AI client
// Initialize AI client
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

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
    cleaned.description = `A ${cleaned.vibe || ''} gift for a ${cleaned.recipient || ''} for ${cleaned.occasion || 'a special occasion'}`.trim();
  }

  return cleaned;
}

interface GenerateWithLLMResult {
  gifts: Gift[];
  modelUsed: string;
  retryCount: number;
}

async function generateWithLLM(request: GenerateGiftsRequest): Promise<GenerateWithLLMResult> {
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }

  const giftCount = parseInt(process.env.NEXT_PUBLIC_TOP_GIFTS || '5', 10);
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
        contents: prompt,
        config: {
          temperature: 0.9,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                estimatedPrice: { type: Type.STRING },
                tags: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                links: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                images: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              propertyOrdering: ["name", "description", "estimatedPrice", "tags", "links", "images"]
            }
          },
          systemInstruction: "You are a helpful gift recommendation assistant that responds with thoughtful, personalized gift suggestions in structured JSON format. For each gift, you should provide relevant and valid purchase links and product image URLs."
        }
      });

      if (!result.text) {
        throw new Error(`No response from Gemini API using model: ${currentModel}`);
      }

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

function buildPrompt(request: GenerateGiftsRequest, giftCount: number): string {
  const parts = [
    `Generate ${giftCount} unique and creative gift ideas based on the following criteria:`,
    request.recipient ? `Recipient: ${request.recipient}` : '',
    request.occasion ? `Occasion: ${request.occasion}` : '',
    request.vibe ? `Vibe/Style: ${request.vibe}` : '',
    request.budget ? `Budget: ${request.budget}` : '',
    request.description ? `Description: ${request.description}` : '',
    '',
    'For each gift idea, provide:',
    '- A creative name',
    '- A brief description explaining why it\'s a great gift',
    '- An estimated price range',
    '- Relevant tags/keywords',
    '- Valid purchase links (URLs to major retailers like Amazon, Target, Walmart, Bestbuy, other popular online retailers etc.)',
    '- Valid product image URLs when available',
    '',
    'Ensure each gift idea:',
    '- Is creative and unique',
    '- Is relevant to the provided criteria',
    '- Is a tangible product or a well-defined experience',
    '- Includes at least 1-2 valid purchase links',
    '- Has relevant valid product images urls'
  ];

  if (request.previouslyGeneratedGifts?.length) {
    parts.push('', `Avoid these previously generated gift ideas: ${request.previouslyGeneratedGifts.join(', ')}`);
  }

  return parts.filter(Boolean).join('\n');
}

function parseGeminiResponse(response: string, giftCount: number): Gift[] {
  try {
    // The response is expected to be a JSON string, sometimes it may have ```json markdown, so we remove it
    const cleanedResponse = response.replace(/```json/g, '').replace(/```/g, '');
    const parsedResponse = JSON.parse(cleanedResponse);
    
    if (!Array.isArray(parsedResponse)) {
      throw new Error('Invalid response structure - expected array');
    }

    const validGifts = parsedResponse
      .filter(giftData => 
        giftData && 
        typeof giftData.name === 'string' &&
        typeof giftData.description === 'string'
      )
      .slice(0, giftCount)
      .map(giftData => ({
        id: uuidv4(),
        name: giftData.name,
        description: giftData.description,
        estimatedPrice: giftData.estimatedPrice,
        tags: Array.isArray(giftData.tags) ? giftData.tags : [],
        links: Array.isArray(giftData.links) ? giftData.links : [],
        images: Array.isArray(giftData.images) ? giftData.images : [],
      }));

    if (validGifts.length === 0) {
      throw new Error('No valid gifts in response');
    }

    return validGifts;
  } catch (e) {
    console.error('Error parsing the gemini response', e, response);
    throw new Error('Failed to parse LLM response');
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