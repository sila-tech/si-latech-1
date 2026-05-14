import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAFGP49gapYCyHkJhyqKhQXKy8gxs_KLT0",
    authDomain: "si-latech.firebaseapp.com",
    projectId: "si-latech",
    storageBucket: "si-latech.appspot.com",
    messagingSenderId: "930374267549",
    appId: "1:930374267549:web:6d1bd560e7bdd549069a74"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    const quotesSnapshot = await getDocs(collection(db, "quotes"));
    console.log(`Found ${quotesSnapshot.size} quotes.`);
    
    let updatedCount = 0;

    for (const d of quotesSnapshot.docs) {
        const data = d.data();
        const beamLength = data.totals?.totalInvoiceBeamLength || 0;
        const blocks = data.totals?.totalBlocks || 0;
        
        // Calculate what it should be with 545
        const expectedGrandTotal = (beamLength * 545) + (blocks * 85);
        
        if (data.grandTotal !== expectedGrandTotal) {
            console.log(`Updating Quote ${data.invoiceNumber}: stored grandTotal=${data.grandTotal}, new=${expectedGrandTotal}`);
            await updateDoc(d.ref, {
                grandTotal: expectedGrandTotal
            });
            updatedCount++;
        }
    }
    console.log(`Successfully updated ${updatedCount} quotes.`);
    process.exit(0);
}

run().catch((e) => {
    console.error(e);
    process.exit(1);
});
