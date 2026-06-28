import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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

// ─────────────────────────────────────────────
// KAMUHUHA LAYOUT (as described by the user)
// 14 one-bedroom apartments, each has 2 rooms
// Grouped into 4 SEPARATE blocks
// Blocks are physically separate → NO shared wall between blocks
//
// Block 1 → Apt 1(Rm1+2),  Apt 2(Rm3+4),  Apt 3(Rm5+6)
// Block 2 → Apt 4(Rm7+8),  Apt 5(Rm9+10), Apt 6(Rm11+12), Apt 7(Rm13+14)
// Block 3 → Apt 8(Rm15+16),Apt 9(Rm17+18),Apt 10(Rm19+20),Apt 11(Rm21+22)
// Block 4 → Apt 12(Rm23+24),Apt 13(Rm25+26),Apt 14(Rm27+28)
// Room 29  → standalone / corridor
// ─────────────────────────────────────────────

const BLOCKS = [
  {
    name: "Block 1",
    apartments: [
      { name: "Apt 1",  roomIndices: [0, 1]   },  // Rooms 1+2
      { name: "Apt 2",  roomIndices: [2, 3]   },  // Rooms 3+4
      { name: "Apt 3",  roomIndices: [4, 5]   },  // Rooms 5+6
    ]
  },
  {
    name: "Block 2",
    apartments: [
      { name: "Apt 4",  roomIndices: [6, 7]   },  // Rooms 7+8
      { name: "Apt 5",  roomIndices: [8, 9]   },  // Rooms 9+10
      { name: "Apt 6",  roomIndices: [10, 11] },  // Rooms 11+12
      { name: "Apt 7",  roomIndices: [12, 13] },  // Rooms 13+14
    ]
  },
  {
    name: "Block 3",
    apartments: [
      { name: "Apt 8",  roomIndices: [14, 15] },  // Rooms 15+16
      { name: "Apt 9",  roomIndices: [16, 17] },  // Rooms 17+18
      { name: "Apt 10", roomIndices: [18, 19] },  // Rooms 19+20
      { name: "Apt 11", roomIndices: [20, 21] },  // Rooms 21+22
    ]
  },
  {
    name: "Block 4",
    apartments: [
      { name: "Apt 12", roomIndices: [22, 23] },  // Rooms 23+24
      { name: "Apt 13", roomIndices: [24, 25] },  // Rooms 25+26
      { name: "Apt 14", roomIndices: [26, 27] },  // Rooms 27+28
    ]
  }
  // Room 29 (index 28) is standalone — full perimeter counted
];

async function run() {
    const docRef = doc(db, "quotes", "uewNbr5e9UaprdqqPdHJ");
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) { console.log("Not found"); process.exit(1); }

    const data = docSnap.data();
    const allRooms = data.rooms.filter(r => !r.name.toLowerCase().includes('balcony'));
    console.log(`Total rooms (no balconies): ${allRooms.length}\n`);

    let totalInternalDeduction = 0;
    let totalPartyDeduction = 0;

    for (const block of BLOCKS) {
        console.log(`\n╔══ ${block.name} ══╗`);

        // 1. Internal shared walls (within each apartment)
        for (const apt of block.apartments) {
            const rooms = apt.roomIndices.map(i => allRooms[i]);
            if (rooms.length >= 2) {
                for (let i = 0; i < rooms.length - 1; i++) {
                    const rA = rooms[i], rB = rooms[i+1];
                    const sharedWall = Math.min(rA.width, rB.width);
                    totalInternalDeduction += sharedWall;
                    console.log(`  ${apt.name} internal wall: ${rA.name}(${rA.length}×${rA.width}) | ${rB.name}(${rB.length}×${rB.width})  → deduct ${sharedWall}m`);
                }
            }
        }

        // 2. Party walls (between adjacent apartments in the SAME block)
        for (let i = 0; i < block.apartments.length - 1; i++) {
            const aptA = block.apartments[i];
            const aptB = block.apartments[i + 1];
            // Party wall = between last room of AptA and first room of AptB
            const lastRoomA = allRooms[aptA.roomIndices[aptA.roomIndices.length - 1]];
            const firstRoomB = allRooms[aptB.roomIndices[0]];
            const partyWall = Math.min(lastRoomA.width, firstRoomB.width);
            totalPartyDeduction += partyWall;
            console.log(`  Party wall ${aptA.name}↔${aptB.name}: ${lastRoomA.name}(${lastRoomA.width}w) | ${firstRoomB.name}(${firstRoomB.width}w)  → deduct ${partyWall}m`);
        }
    }

    // Room 29 standalone (no deductions)
    const room29 = allRooms[28];
    console.log(`\n  Room 29 (${room29.name} ${room29.length}×${room29.width}) → standalone, no deductions`);

    // Current lintel total (system's calculation)
    const currentLintelTotal = allRooms.reduce((sum, r) => sum + 2 * (r.length + r.width), 0);
    const totalDeduction = totalInternalDeduction + totalPartyDeduction;
    const adjustedLintel = currentLintelTotal - totalDeduction;

    // Steel constants
    const waste = 1.05, numLong = 4, barLen = 12;
    const stirrupSpacing = 0.20, lintelW = 0.20, lintelH = 0.40, cover = 0.03, hook = 0.10;
    const stirrupLen = 2*((lintelW - 2*cover) + (lintelH - 2*cover)) + 2*hook;
    const wLong = 0.006165 * 144, wStirrup = 0.006165 * 64;

    const calcSteel = (lintelLen) => {
        const lm_long = lintelLen * numLong * waste;
        const bars_long = Math.ceil(lm_long / barLen);
        const n_stirrups = Math.ceil(lintelLen / stirrupSpacing);
        const lm_stirrup = n_stirrups * stirrupLen * waste;
        const bars_stirrup = Math.ceil(lm_stirrup / barLen);
        return { bars_long, bars_stirrup, kg_long: bars_long * barLen * wLong, kg_stirrup: bars_stirrup * barLen * wStirrup };
    };

    const original = calcSteel(currentLintelTotal);
    const adjusted = calcSteel(adjustedLintel);

    console.log(`\n${'═'.repeat(55)}`);
    console.log(`SHARED WALL SUMMARY`);
    console.log(`${'─'.repeat(55)}`);
    console.log(`Internal walls (within apartments): ${totalInternalDeduction.toFixed(2)}m deducted`);
    console.log(`Party walls (between apts in same block): ${totalPartyDeduction.toFixed(2)}m deducted`);
    console.log(`TOTAL DEDUCTION: ${totalDeduction.toFixed(2)}m`);
    console.log(`${'═'.repeat(55)}`);
    console.log(`LINTEL LENGTH`);
    console.log(`  System (current, wrong): ${currentLintelTotal.toFixed(2)}m`);
    console.log(`  Corrected:               ${adjustedLintel.toFixed(2)}m`);
    console.log(`${'═'.repeat(55)}`);
    console.log(`STEEL BARS COMPARISON`);
    console.log(`${'─'.repeat(55)}`);
    console.log(`D12 Longitudinal:  ${original.bars_long} bars → should be ${adjusted.bars_long} bars  (save ${original.bars_long - adjusted.bars_long} bars, ${(original.kg_long - adjusted.kg_long).toFixed(1)}kg)`);
    console.log(`D8 Stirrups:       ${original.bars_stirrup} bars → should be ${adjusted.bars_stirrup} bars  (save ${original.bars_stirrup - adjusted.bars_stirrup} bars, ${(original.kg_stirrup - adjusted.kg_stirrup).toFixed(1)}kg)`);
    console.log(`TOTAL BARS SAVED:  ${(original.bars_long + original.bars_stirrup) - (adjusted.bars_long + adjusted.bars_stirrup)} bars`);
    console.log(`TOTAL WEIGHT SAVED: ${((original.kg_long + original.kg_stirrup) - (adjusted.kg_long + adjusted.kg_stirrup)).toFixed(1)}kg`);
    console.log(`${'═'.repeat(55)}`);

    process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
