import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  writeBatch, 
  doc,
  getDoc 
} from 'firebase/firestore';

const OLD_PATH = 'cellphone-inventory-system/data';
const NEW_PATH = 'app-data/cellsmart-data';

const COLLECTIONS = [
  'customers',
  'inventory', 
  'invoices',
  'parts',
  'payments',
  'credit-notes',
  'repair-jobs',
  'edit-history'
];

export async function POST(request: NextRequest) {
  try {
    const { action, collection: targetCollection } = await request.json();
    
    if (action === 'check') {
      return await checkDataDistribution();
    }
    
    if (action === 'migrate' && targetCollection) {
      return await migrateCollection(targetCollection);
    }
    
    if (action === 'migrate-all') {
      return await migrateAllCollections();
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

async function checkDataDistribution() {
  const results: Record<string, { old: number; new: number; status: string }> = {};
  
  for (const collectionName of COLLECTIONS) {
    try {
      // Check old path
      const oldRef = collection(db, OLD_PATH, collectionName, 'items');
      const oldSnapshot = await getDocs(oldRef);
      const oldCount = oldSnapshot.size;
      
      // Check new path
      const newRef = collection(db, NEW_PATH, collectionName, 'items');
      const newSnapshot = await getDocs(newRef);
      const newCount = newSnapshot.size;
      
      let status = 'empty';
      if (oldCount > 0 && newCount === 0) {
        status = 'data_in_old_path';
      } else if (oldCount === 0 && newCount > 0) {
        status = 'data_in_new_path';
      } else if (oldCount > 0 && newCount > 0) {
        status = 'data_split';
      }
      
      results[collectionName] = {
        old: oldCount,
        new: newCount,
        status
      };
    } catch (error) {
      console.error(`Error checking ${collectionName}:`, error);
      results[collectionName] = {
        old: 0,
        new: 0,
        status: 'error'
      };
    }
  }
  
  return NextResponse.json({ results });
}

async function migrateCollection(collectionName: string) {
  try {
    console.log(`Starting migration for ${collectionName}...`);
    
    // Get all documents from old path
    const oldRef = collection(db, OLD_PATH, collectionName, 'items');
    const oldSnapshot = await getDocs(oldRef);
    
    if (oldSnapshot.empty) {
      return NextResponse.json({ 
        success: true, 
        message: `No data found in old path for ${collectionName}`,
        migrated: 0
      });
    }
    
    const batch = writeBatch(db);
    let count = 0;
    
    oldSnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const docId = docSnapshot.id;
      
      // Create document in new path
      const newDocRef = doc(db, NEW_PATH, collectionName, 'items', docId);
      batch.set(newDocRef, {
        ...data,
        migratedAt: new Date(),
        originalPath: `${OLD_PATH}/${collectionName}/items/${docId}`
      });
      
      count++;
    });
    
    // Commit the batch
    await batch.commit();
    
    console.log(`Successfully migrated ${count} documents from ${collectionName}`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully migrated ${count} documents from ${collectionName}`,
      migrated: count
    });
  } catch (error) {
    console.error(`Migration error for ${collectionName}:`, error);
    return NextResponse.json({ 
      error: `Failed to migrate ${collectionName}`, 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

async function migrateAllCollections() {
  const results: Record<string, any> = {};
  let totalMigrated = 0;
  
  for (const collectionName of COLLECTIONS) {
    try {
      console.log(`Processing ${collectionName}...`);
      
      // Get all documents from old path
      const oldRef = collection(db, OLD_PATH, collectionName, 'items');
      const oldSnapshot = await getDocs(oldRef);
      
      if (oldSnapshot.empty) {
        results[collectionName] = { migrated: 0, status: 'no_data' };
        continue;
      }
      
      const batch = writeBatch(db);
      let count = 0;
      
      oldSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const docId = docSnapshot.id;
        
        // Create document in new path
        const newDocRef = doc(db, NEW_PATH, collectionName, 'items', docId);
        batch.set(newDocRef, {
          ...data,
          migratedAt: new Date(),
          originalPath: `${OLD_PATH}/${collectionName}/items/${docId}`
        });
        
        count++;
      });
      
      // Commit the batch
      await batch.commit();
      
      results[collectionName] = { migrated: count, status: 'success' };
      totalMigrated += count;
      
      console.log(`✓ ${collectionName}: ${count} documents`);
    } catch (error) {
      console.error(`Error migrating ${collectionName}:`, error);
      results[collectionName] = { 
        migrated: 0, 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  return NextResponse.json({ 
    success: true,
    message: `Migration completed. Total documents migrated: ${totalMigrated}`,
    results,
    totalMigrated
  });
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Database Migration API',
    endpoints: {
      'POST /api/migrate-database': {
        'check': 'Check data distribution across paths',
        'migrate': 'Migrate specific collection (requires collection parameter)',
        'migrate-all': 'Migrate all collections'
      }
    }
  });
}