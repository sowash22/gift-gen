import { db } from '@/lib/firebaseAdmin';
import { Gift, GenerateGiftsRequest } from './types';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const localDbPath = path.resolve(process.cwd(), 'localdb.json');

export async function saveToDatabase(gifts: Gift[], request: GenerateGiftsRequest): Promise<void> {
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
  }
}

export async function saveToLocalDatabase(gifts: Gift[], request: GenerateGiftsRequest) {
  try {
    const snapshot = await db.collection('gifts').get();
    const firestoreRecords = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

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

    const allRecords = [...firestoreRecords, ...newRecords];
    const uniqueRecords = Object.values(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      allRecords.reduce((acc: Record<string, any>, rec: any) => {
        const recordId = rec.id || uuidv4();
        acc[recordId] = rec;
        return acc;
      }, {})
    );

    await fs.promises.writeFile(localDbPath, JSON.stringify(uniqueRecords, null, 2));
    console.log(`✅ Dumped ${uniqueRecords.length} records from Firestore into local database`);

  } catch (err) {
    console.error('❌ Failed to dump Firestore into local database:', err);
  }
}

export async function getFromLocalDatabase(request: GenerateGiftsRequest): Promise<Gift[]> {
  try {
    if (!fs.existsSync(localDbPath)) return [];

    const content = await fs.promises.readFile(localDbPath, 'utf-8');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const records: any[] = JSON.parse(content || '[]');

    const giftCount = parseInt(process.env.NEXT_PUBLIC_TOP_GIFTS || '5', 10);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filtered = records.filter((rec: any) => {
      if (request.recipient && rec.recipient !== request.recipient) return false;
      if (request.occasion && rec.occasion !== request.occasion) return false;
      if (request.vibe && rec.vibe !== request.vibe) return false;
      if (request.budget && rec.budget !== request.budget) return false;
      return true;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export async function getFromDatabase(request: GenerateGiftsRequest): Promise<Gift[]> {
  const giftCount = parseInt(process.env.NEXT_PUBLIC_TOP_GIFTS || '5', 10);
  let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('gifts');
  
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
