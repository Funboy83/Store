import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  doc,
  getDoc,
  query,
  limit
} from 'firebase/firestore';

const OLD_PATH = 'cellphone-inventory-system/data';
const NEW_PATH = 'app-data/cellsmart-data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkType = searchParams.get('type') || 'customers';
    
    const results = {
      oldPath: {
        path: `${OLD_PATH}/${checkType}/items`,
        data: [] as any[],
        count: 0
      },
      newPath: {
        path: `${NEW_PATH}/${checkType}/items`,
        data: [] as any[],
        count: 0
      },
      timestamp: new Date().toISOString()
    };
    
    // Check old path
    try {
      const oldRef = collection(db, OLD_PATH, checkType, 'items');
      const oldQuery = query(oldRef, limit(5)); // Get first 5 items as sample
      const oldSnapshot = await getDocs(oldQuery);
      
      results.oldPath.count = oldSnapshot.size;
      oldSnapshot.forEach((doc) => {
        results.oldPath.data.push({
          id: doc.id,
          ...doc.data()
        });
      });
    } catch (error) {
      console.error('Error reading old path:', error);
      results.oldPath.data = [{ error: 'Failed to read old path' }];
    }
    
    // Check new path
    try {
      const newRef = collection(db, NEW_PATH, checkType, 'items');
      const newQuery = query(newRef, limit(5)); // Get first 5 items as sample
      const newSnapshot = await getDocs(newQuery);
      
      results.newPath.count = newSnapshot.size;
      newSnapshot.forEach((doc) => {
        results.newPath.data.push({
          id: doc.id,
          ...doc.data()
        });
      });
    } catch (error) {
      console.error('Error reading new path:', error);
      results.newPath.data = [{ error: 'Failed to read new path' }];
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ 
      error: 'Failed to check paths', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { customerId } = await request.json();
    
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }
    
    const results = {
      customerId,
      oldPath: null as any,
      newPath: null as any,
      found: {
        old: false,
        new: false
      }
    };
    
    // Check old path
    try {
      const oldDocRef = doc(db, OLD_PATH, 'customers', 'items', customerId);
      const oldDoc = await getDoc(oldDocRef);
      
      if (oldDoc.exists()) {
        results.oldPath = { id: oldDoc.id, ...oldDoc.data() };
        results.found.old = true;
      }
    } catch (error) {
      console.error('Error checking old path:', error);
    }
    
    // Check new path
    try {
      const newDocRef = doc(db, NEW_PATH, 'customers', 'items', customerId);
      const newDoc = await getDoc(newDocRef);
      
      if (newDoc.exists()) {
        results.newPath = { id: newDoc.id, ...newDoc.data() };
        results.found.new = true;
      }
    } catch (error) {
      console.error('Error checking new path:', error);
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Customer lookup error:', error);
    return NextResponse.json({ 
      error: 'Failed to lookup customer', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}