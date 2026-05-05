
import { 
    Firestore, 
    collection, 
    addDoc, 
    serverTimestamp
} from 'firebase/firestore';

// Quotes
export async function saveGeneratedQuote(db: Firestore, data: any) {
    const colRef = collection(db, 'quotes');
    return await addDoc(colRef, {
        ...data,
        createdAt: serverTimestamp()
    });
}
