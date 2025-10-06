
'use server';

import { db, isConfigured } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import type { CreditNote, CreditNoteDetail, Customer } from '@/lib/types';
import { getCustomers } from './customers';

const DATA_PATH = 'app-data/cellsmart-data';
const CREDIT_NOTES_COLLECTION = 'credit_notes';
const CUSTOMERS_COLLECTION = 'customers';

export async function getLatestCreditNoteNumber(): Promise<number> {
  if (!isConfigured) {
    return 2000; // Start credit notes at 2000 to distinguish from invoices
  }
  
  try {
    const dataDocRef = doc(db, DATA_PATH);
    const creditNotesCollectionRef = collection(dataDocRef, CREDIT_NOTES_COLLECTION);
    const snapshot = await getDocs(creditNotesCollectionRef);

    if (snapshot.empty) {
      return 2000;
    }

    let maxNumber = 1999;
    snapshot.docs.forEach(doc => {
      const creditNoteData = doc.data();
      if (creditNoteData.creditNoteNumber) {
        const currentNumber = parseInt(creditNoteData.creditNoteNumber, 10);
        if (!isNaN(currentNumber) && currentNumber > maxNumber) {
          maxNumber = currentNumber;
        }
      }
    });

    return maxNumber + 1;
  } catch (error) {
    console.error('Error fetching latest credit note number:', error);
    return 2000; // Fallback in case of error
  }
}

export async function getCreditNotes(): Promise<CreditNoteDetail[]> {
  if (!isConfigured) {
    return [];
  }

  try {
    const dataDocRef = doc(db, DATA_PATH);
    const creditNotesRef = collection(dataDocRef, CREDIT_NOTES_COLLECTION);
    const snapshot = await getDocs(creditNotesRef);

    if (snapshot.empty) {
      return [];
    }

    // Get all customers
    const customers = await getCustomers();
    const customerMap = new Map(customers.map(c => [c.id, c]));

    const creditNotes: CreditNoteDetail[] = [];
    
    snapshot.forEach(doc => {
      const creditNoteData = doc.data() as CreditNote;
      const customer = customerMap.get(creditNoteData.customerId);
      
      if (customer) {
        creditNotes.push({
          ...creditNoteData,
          id: doc.id,
          customerName: customer.name
        });
      }
    });

    // Sort by credit note number (descending)
    return creditNotes.sort((a, b) => {
      const aNum = parseInt(a.creditNoteNumber || '0', 10);
      const bNum = parseInt(b.creditNoteNumber || '0', 10);
      return bNum - aNum;
    });
  } catch (error) {
    console.error('Error fetching credit notes:', error);
    return [];
  }
}

export async function getCreditNoteById(id: string): Promise<CreditNoteDetail | null> {
  if (!isConfigured) {
    return null;
  }
  try {
    const dataDocRef = doc(db, DATA_PATH);
    const creditNoteRef = doc(dataDocRef, `${CREDIT_NOTES_COLLECTION}/${id}`);
    const creditNoteSnap = await getDoc(creditNoteRef);

    if (!creditNoteSnap.exists()) {
      return null;
    }

    const creditNoteData = creditNoteSnap.data();

    // Fetch all customers once
    const customers = await getCustomers();
    const customerMap = new Map(customers.map(c => [c.id, c]));

    const customer = customerMap.get(creditNoteData.customerId);
    if (!customer) {
        throw new Error(`Customer with ID ${creditNoteData.customerId} not found.`);
    }

    return {
      id: creditNoteSnap.id,
      ...creditNoteData,
      customerName: customer.name,
      issueDate: creditNoteData.issueDate,
    } as CreditNoteDetail;

  } catch (error) {
    console.error('Error fetching credit note by ID:', error);
    return null;
  }
}
