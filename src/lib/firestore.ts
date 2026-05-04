
import { 
    Firestore, 
    collection, 
    addDoc, 
    serverTimestamp
} from 'firebase/firestore';

// Invoices
export async function saveGeneratedInvoice(db: Firestore, data: any) {
    const colRef = collection(db, 'invoices');
    return await addDoc(colRef, {
        ...data,
        createdAt: serverTimestamp()
    });
}
