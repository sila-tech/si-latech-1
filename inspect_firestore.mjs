
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

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

async function inspect() {
    const collections = ['projects', 'admins', 'settings', 'investors', 'loans', 'deposits'];
    for (const colName of collections) {
        console.log(`\n--- Inspecting collection: ${colName} ---`);
        try {
            const q = query(collection(db, colName), limit(5));
            const snapshot = await getDocs(q);
            if (snapshot.empty) {
                console.log(`No documents found in ${colName}.`);
            } else {
                snapshot.forEach(doc => {
                    console.log(`ID: ${doc.id}`);
                    console.log(JSON.stringify(doc.data(), null, 2));
                });
            }
        } catch (error) {
            console.error(`Error fetching ${colName}:`, error.message);
        }
    }
    process.exit(0);
}

inspect();
