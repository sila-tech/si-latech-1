import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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
    console.log("Fetching projects...");
    const projectsSnapshot = await getDocs(collection(db, "projects"));
    console.log(`Found ${projectsSnapshot.size} projects.`);
    
    let foundProjects = [];
    projectsSnapshot.forEach(doc => {
        const data = doc.data();
        const strData = JSON.stringify(data).toLowerCase();
        if (strData.includes("kamahuha")) {
            foundProjects.push({ id: doc.id, ...data });
        }
    });

    console.log("\nMatching Projects:");
    console.log(JSON.stringify(foundProjects, null, 2));

    console.log("\nFetching quotes...");
    const quotesSnapshot = await getDocs(collection(db, "quotes"));
    console.log(`Found ${quotesSnapshot.size} quotes.`);
    
    let foundQuotes = [];
    quotesSnapshot.forEach(doc => {
        const data = doc.data();
        const strData = JSON.stringify(data).toLowerCase();
        if (strData.includes("kamahuha")) {
            foundQuotes.push({ id: doc.id, ...data });
        }
    });

    console.log("\nMatching Quotes:");
    console.log(JSON.stringify(foundQuotes, null, 2));

    process.exit(0);
}

run().catch((e) => {
    console.error(e);
    process.exit(1);
});
