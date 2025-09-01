/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getFromDatabase, getFromLocalDatabase } from '../../../lib/database';
import { GenerateGiftsRequest, Gift } from '../../../lib/types';

interface GenerationResult {
  gifts: Gift[];
  source: 'llm' | 'database' | 'local';
  fallback: boolean;
  retryCount?: number;
  modelUsed?: string;
}

// Initialize AI client
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenerativeAI(geminiApiKey);

function buildPrompt(request: GenerateGiftsRequest, giftCount: number): string {
  const parts = [
    `Generate ${giftCount} unique and creative gift ideas based on the following criteria.`, 
    `The response MUST be a JSON array of objects.`, 
    `Each gift object must include 'name', 'description', 'links', and 'images'.`, 
    `**IMPORTANT**: For 'links' and 'images', you MUST use the available Google Search tool to find ACTUAL, VALID, and FUNCTIONAL URLs. Do not make up URLs. Search for the product or a very similar product to get a real purchase link and a real product image.`, 
    request.recipient ? `Recipient: ${request.recipient}` : '',
    request.occasion ? `Occasion: ${request.occasion}` : '',
    request.vibe?.length ? `Vibe/Style: ${request.vibe.join(', ')}` : '',
    request.description ? `Detailed Description: ${request.description}` : '',
    '',
    'For each gift idea, provide the following properties within the JSON object:',
    '- `name`: A creative, engaging name for the gift.',
    '- `description`: A brief, compelling description (2-3 sentences) explaining why it\'s a great gift.',
    '- `links`: An array containing **one** valid, functional purchase URL.',
    '- `images`: An array containing **one** valid, functional product image URL.',
    '',
    'Ensure each gift idea is:',
    '- Creative, unique, and thoughtful.',
    '- Relevant to the provided criteria.',
    '- A tangible product or a well-defined experience.',
    '- Has all required fields.',
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
    jsonString = response.replace(/```json\n?/, '').replace(/\n?```/, '').trim();
    parsedResponse = JSON.parse(jsonString);
  } catch (directParseError) {
    console.warn('Direct JSON parse failed. Attempting regex extraction. Error:', (directParseError as Error).message);
    
    const jsonMatch = jsonString.match(/[\[]\s*\{[\s\S]*\}\s*[\]]/);
    if (jsonMatch && jsonMatch[0]) {
      jsonString = jsonMatch[0];
      try {
        parsedResponse = JSON.parse(jsonString);
      } catch {
        throw new Error('Failed to parse LLM response after regex extraction due to malformed JSON.');
      }
    } else {
      throw new Error('Failed to extract and parse JSON from LLM response.');
    }
  }
    
  if (!Array.isArray(parsedResponse)) {
    throw new Error('Invalid response structure - expected array at top level.');
  }

  const validGifts = parsedResponse
    .filter((giftData: any) => { 
      const isValid = giftData && 
        typeof giftData.name === 'string' &&
        typeof giftData.description === 'string' &&
        Array.isArray(giftData.links) && giftData.links.length > 0 && giftData.links.every((link: any) => typeof link === 'string' && link.startsWith('http')) &&
        Array.isArray(giftData.images) && giftData.images.length > 0 && giftData.images.every((image: any) => typeof image === 'string' && image.startsWith('http'));
      
      if (!isValid) {
        console.warn('Skipping invalid gift entry:', giftData);
      }
      return isValid;
    })
    .slice(0, giftCount)
    .map((giftData: any) => ({
      id: uuidv4(),
      name: giftData.name,
      description: giftData.description,
      estimatedPrice: giftData.estimatedPrice,
      links: Array.isArray(giftData.links) ? giftData.links : [],
      images: Array.isArray(giftData.images) ? giftData.images : [],
    }));

  if (validGifts.length === 0) {
    throw new Error('No valid gifts in response after filtering.');
  }

  return validGifts;
}

async function generateGifts(request: GenerateGiftsRequest): Promise<GenerationResult> {
  const cleanRequest = validateRequest(request); 
  try {
    console.log('🤖 Attempting LLM generation');
    const {gifts, retryCount, modelUsed} = await generateWithLLM(cleanRequest);
    return { gifts, source: 'llm', fallback: false, retryCount, modelUsed };
  } catch (error) {
    console.log('❌ LLM failed:', error instanceof Error ? error.message : 'Unknown error');
  }

  try {
    console.log('🗄️ Attempting database retrieval');
    const gifts = await getFromDatabase(cleanRequest);
    if (gifts.length > 0) {
      return { gifts, source: 'database', fallback: true };
    }
  } catch (error) {
    console.log('❌ Database failed:', error instanceof Error ? error.message : 'Unknown error');
  }

  console.log('📁 Using local database fallback');
  const gifts = await getFromLocalDatabase(cleanRequest);
  return { gifts, source: 'local', fallback: true };
}

function validateRequest(request: GenerateGiftsRequest): GenerateGiftsRequest {
  const cleaned = { ...request };
  
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

async function generateWithLLM(request: GenerateGiftsRequest): Promise<GenerateWithLLMResult> {
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }

  const giftCount = parseInt(process.env.NEXT_PUBLIC_NUM_GIFTS_TO_GENERATE || '8', 10);
  const prompt = buildPrompt(request, giftCount);
  
  const models = [
    process.env.GOOGLE_MODEL_1 || 'gemini-1.5-pro',
  ];

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < models.length; attempt++) {
    const currentModel = models[attempt];
    
    try {
      console.log(`ℹ️ Attempt ${attempt + 1}/${models.length} - Using model: ${currentModel}`);

      const model = ai.getGenerativeModel({ model: currentModel });
      const result = await model.generateContent(prompt);

      const response = result.response;
      const text = response.text();

      if (!text) {
        throw new Error(`No text response from Gemini API using model: ${currentModel}`);
      }

      const parsedResponse = parseGeminiResponse(text, giftCount);
      return {
        gifts: parsedResponse,
        modelUsed: currentModel,
        retryCount: attempt
      };

    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Attempt ${attempt + 1} failed with model ${currentModel}:`, error);
      if (attempt < models.length - 1) {
        console.log(`🔄 Retrying with next model...`);
        continue;
      }
    }
  }

  throw new Error(`Failed to generate gifts after ${models.length} attempts. Last error: ${lastError?.message}`);
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateGiftsRequest = await request.json();
    
    console.log('ℹ️ Gift generation request received');

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
