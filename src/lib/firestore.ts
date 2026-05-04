
import { 
    Firestore, 
    collection, 
    addDoc, 
    updateDoc, 
    doc, 
    serverTimestamp, 
    arrayUnion,
    increment,
    getDoc,
    deleteDoc
} from 'firebase/firestore';

// Investor Management
export async function addInvestor(db: Firestore, data: { name: string, initialInvestment: number }) {
    const colRef = collection(db, 'investors');
    return await addDoc(colRef, {
        ...data,
        currentBalance: data.initialInvestment,
        interestRate: 10, // Default 10% monthly
        createdAt: serverTimestamp(),
        interestEntries: [],
        withdrawals: [],
        deposits: []
    });
}

export async function applyInterestToPortfolio(db: Firestore, investorId: string, amount: number, description: string) {
    const docRef = doc(db, 'investors', investorId);
    return await updateDoc(docRef, {
        currentBalance: increment(amount),
        interestEntries: arrayUnion({
            entryId: crypto.randomUUID(),
            date: new Date(),
            amount: amount,
            description: description
        })
    });
}

export async function processWithdrawal(db: Firestore, investorId: string, withdrawalId: string) {
    const docRef = doc(db, 'investors', investorId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error("Investor not found");
    
    const data = docSnap.data();
    const withdrawals = data.withdrawals || [];
    const withdrawal = withdrawals.find((w: any) => w.withdrawalId === withdrawalId);
    
    if (!withdrawal) throw new Error("Withdrawal request not found");
    if (withdrawal.status !== 'pending') throw new Error("Withdrawal already processed or rejected");

    const updatedWithdrawals = withdrawals.map((w: any) => 
        w.withdrawalId === withdrawalId ? { ...w, status: 'processed' } : w
    );

    return await updateDoc(docRef, {
        withdrawals: updatedWithdrawals,
        currentBalance: increment(-withdrawal.amount)
    });
}

export async function rejectWithdrawal(db: Firestore, investorId: string, withdrawalId: string) {
    const docRef = doc(db, 'investors', investorId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error("Investor not found");
    
    const data = docSnap.data();
    const withdrawals = data.withdrawals || [];
    
    const updatedWithdrawals = withdrawals.map((w: any) => 
        w.withdrawalId === withdrawalId ? { ...w, status: 'rejected' } : w
    );

    return await updateDoc(docRef, {
        withdrawals: updatedWithdrawals
    });
}

export async function approveDeposit(db: Firestore, investorId: string, depositId: string) {
    const docRef = doc(db, 'investors', investorId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error("Investor not found");
    
    const data = docSnap.data();
    const deposits = data.deposits || [];
    const deposit = deposits.find((d: any) => d.depositId === depositId);
    
    if (!deposit) throw new Error("Deposit request not found");
    if (deposit.status !== 'pending') throw new Error("Deposit already processed or rejected");

    const updatedDeposits = deposits.map((d: any) => 
        d.depositId === depositId ? { ...d, status: 'approved' } : d
    );

    return await updateDoc(docRef, {
        deposits: updatedDeposits,
        currentBalance: increment(deposit.amount)
    });
}

export async function rejectDeposit(db: Firestore, investorId: string, depositId: string) {
    const docRef = doc(db, 'investors', investorId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error("Investor not found");
    
    const data = docSnap.data();
    const deposits = data.deposits || [];
    
    const updatedDeposits = deposits.map((d: any) => 
        d.depositId === depositId ? { ...d, status: 'rejected' } : d
    );

    return await updateDoc(docRef, {
        deposits: updatedDeposits
    });
}

export async function deleteInvestor(db: Firestore, investorId: string) {
    const docRef = doc(db, 'investors', investorId);
    return await deleteDoc(docRef);
}

// Invoices
export async function saveGeneratedInvoice(db: Firestore, data: any) {
    const colRef = collection(db, 'invoices');
    return await addDoc(colRef, {
        ...data,
        createdAt: serverTimestamp()
    });
}
