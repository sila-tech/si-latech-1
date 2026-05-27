const fs = require('fs');

const DEFAULTS = {
  blockLength: 0.40,
  blockWidth: 0.20,
  beamSpacing: 0.40,
  beamSectionW: 0.15,
  beamSectionH: 0.04,
  toppingThickness: 0.05,
  brcRollLength: 48,
  brcRollWidth: 2.4,
  concreteMixRatioCement: 1,
  concreteMixRatioSand: 2,
  concreteMixRatioBallast: 4,
  wastagePercentage: 10,
  dryVolumeFactor: 1.54,
  cementBulkDensity: 1440,
  sandBulkDensity: 1600,
  aggregateBulkDensity: 1500,
  cementBagWeight: 50,
  wheelbarrowVolume: 0.065,
  wheelbarrowsPerTonne: 6,
  profitBeamsPerRoom: 2,
  blockCommissionRate: 5,
};

const ceil = (v) => Math.ceil(v);

function calcRoomBlocksAndBeams(lengthMeters, widthMeters, roomName = '') {
  const shorter = Math.min(lengthMeters, widthMeters);
  const longer = Math.max(lengthMeters, widthMeters);
  const area = lengthMeters * widthMeters;

  let actualBeamCount = 0;
  let endGap = 0;

  const isBalcony = roomName.toLowerCase().includes('balcony') || 
                    roomName.toLowerCase().includes('verandah') || 
                    roomName.toLowerCase().includes('velander') || 
                    roomName.toLowerCase().includes('veranda') || 
                    roomName.toLowerCase().includes('velanda');

  if (longer > 0) {
    if (isBalcony) {
      actualBeamCount = Math.ceil(shorter / 0.55);
      const lastBeamEnd = (actualBeamCount - 1) * 0.55 + 0.15;
      endGap = Math.max(0, shorter - lastBeamEnd);
    } else {
      actualBeamCount = Math.ceil(longer / 0.55);
      const lastBeamEnd = (actualBeamCount - 1) * 0.55 + 0.15;
      endGap = Math.max(0, longer - lastBeamEnd);
    }
  }

  actualBeamCount = Math.max(0, actualBeamCount);
  const clearBeamLength = isBalcony ? longer : shorter;
  const individualBeamLength = clearBeamLength > 0 ? clearBeamLength + 0.20 : 0;
  const blocksPerBeamRow = clearBeamLength > 0 ? clearBeamLength * 4 : 0;

  const actualTotalBlocks = actualBeamCount * blocksPerBeamRow;
  const actualTotalBeamLength = actualBeamCount * individualBeamLength;

  let invoiceBeamCount = actualBeamCount + 2; // ROOM MODE: +2 beams
  let invoiceTotalBeamLength = invoiceBeamCount * individualBeamLength;

  if (isBalcony) {
    invoiceBeamCount = actualBeamCount;
    invoiceTotalBeamLength = actualTotalBeamLength;
  }

  const totalBlocks = actualTotalBlocks;

  return {
    length: lengthMeters,
    width: widthMeters,
    shorter,
    longer,
    area,
    individualBeamLength,
    actualBeamCount,
    invoiceBeamCount,
    blocksPerBeamRow,
    totalBlocks,
    actualTotalBeamLength,
    invoiceTotalBeamLength,
  };
}

function calcConcrete(roomCalc) {
  const C = DEFAULTS;
  const area = roomCalc.length * roomCalc.width;

  const beamRibVolume = roomCalc.actualTotalBeamLength * C.beamSectionW * C.beamSectionH;
  const toppingVolume = area * C.toppingThickness;
  const V_wet = beamRibVolume + toppingVolume;

  const totalParts = C.concreteMixRatioCement + C.concreteMixRatioSand + C.concreteMixRatioBallast;
  const V_dry = V_wet * C.dryVolumeFactor;
  const wastage_factor = 1 + (C.wastagePercentage / 100);

  const V_cement = (C.concreteMixRatioCement / totalParts) * V_dry;
  const V_sand = (C.concreteMixRatioSand / totalParts) * V_dry;
  const V_agg = (C.concreteMixRatioBallast / totalParts) * V_dry;

  const m_cement_w = V_cement * C.cementBulkDensity * wastage_factor;
  const m_sand_w = V_sand * C.sandBulkDensity * wastage_factor;
  const m_agg_w = V_agg * C.aggregateBulkDensity * wastage_factor;

  const bags = ceil(m_cement_w / C.cementBagWeight);
  const sand_t = m_sand_w / 1000;
  const agg_t = m_agg_w / 1000;

  return {
    area,
    wetVolume: V_wet,
    dryVolume: V_dry,
    cementBags: bags,
    sandTonnes: sand_t,
    ballastTonnes: agg_t,
  };
}

// Define rooms for the floor plan
const rooms = [
  // Middle Units (Top Row - 4 Units)
  ...[1, 2, 3, 4].flatMap(i => [
    { name: `Unit T${i} - Bedroom`, length: 3.33, width: 2.80 },
    { name: `Unit T${i} - Lounge`, length: 3.33, width: 2.70 },
  ]),
  // Middle Units (Bottom Row - 5 Units)
  ...[1, 2, 3, 4, 5].flatMap(i => [
    { name: `Unit B${i} - Bedroom`, length: 2.84, width: 2.80 },
    { name: `Unit B${i} - Lounge`, length: 2.84, width: 2.70 },
  ]),
  // Left Wing Rooms (3 Rooms)
  { name: "Left Room 1", length: 3.00, width: 2.80 },
  { name: "Left Room 2", length: 3.00, width: 2.40 },
  { name: "Left Room 3", length: 3.00, width: 2.80 },
  // Right Wing Rooms (4 Rooms)
  { name: "Right Room 1", length: 3.00, width: 2.80 },
  { name: "Right Room 2", length: 3.00, width: 2.40 },
  { name: "Right Room 3", length: 3.00, width: 2.80 },
  { name: "Right Room 4", length: 3.00, width: 2.80 },
  // Common Washrooms
  { name: "Left Common Washrooms", length: 2.80, width: 1.80 },
  { name: "Right Common Washrooms", length: 2.80, width: 1.80 },
  // Corridor (Central corridor spanning middle section)
  { name: "Corridor", length: 22.00, width: 1.20 },
];

console.log(`Calculating for ${rooms.length} rooms...`);

let totals = {
  totalArea: 0,
  totalBlocks: 0,
  totalActualBeamLength: 0,
  totalInvoiceBeamLength: 0,
  totalWetVolume: 0,
  totalCementBags: 0,
  totalSandTonnes: 0,
  totalBallastTonnes: 0,
};

const results = rooms.map(r => {
  const roomCalcs = calcRoomBlocksAndBeams(r.length, r.width, r.name);
  const concreteCalcs = calcConcrete(roomCalcs);

  totals.totalArea += roomCalcs.area;
  totals.totalBlocks += roomCalcs.totalBlocks;
  totals.totalActualBeamLength += roomCalcs.actualTotalBeamLength;
  totals.totalInvoiceBeamLength += roomCalcs.invoiceTotalBeamLength;
  totals.totalWetVolume += concreteCalcs.wetVolume;
  totals.totalCementBags += concreteCalcs.cementBags;
  totals.totalSandTonnes += concreteCalcs.sandTonnes;
  totals.totalBallastTonnes += concreteCalcs.ballastTonnes;

  return {
    name: r.name,
    area: roomCalcs.area,
    actualBeamCount: roomCalcs.actualBeamCount,
    invoiceBeamCount: roomCalcs.invoiceBeamCount,
    beamLengthEach: roomCalcs.individualBeamLength,
    totalBlocks: roomCalcs.totalBlocks,
    actualTotalBeamLength: roomCalcs.actualTotalBeamLength,
    invoiceTotalBeamLength: roomCalcs.invoiceTotalBeamLength,
  };
});

console.log("\n=================== TOTALS PER SUSPENDED FLOOR ===================");
console.log(`Total Slab Area: ${totals.totalArea.toFixed(2)} m²`);
console.log(`Total Actual Blocks: ${totals.totalBlocks} pcs`);
console.log(`Total Actual Beam Length: ${totals.totalActualBeamLength.toFixed(2)} m`);
console.log(`Total Invoice Beam Length: ${totals.totalInvoiceBeamLength.toFixed(2)} m`);
console.log(`Total Wet Concrete Topping Volume: ${totals.totalWetVolume.toFixed(2)} m³`);
console.log(`Total Cement Bags (50kg): ${totals.totalCementBags} bags`);
console.log(`Total Sand: ${totals.totalSandTonnes.toFixed(2)} tonnes`);
console.log(`Total Coarse Aggregate (Ballast): ${totals.totalBallastTonnes.toFixed(2)} tonnes`);

console.log("\n=================== PRICING ===================");
const BLOCK_PRICE = 85;
const BEAM_PRICE = 545;
const blocksCost = totals.totalBlocks * BLOCK_PRICE;
const beamsCost = totals.totalInvoiceBeamLength * BEAM_PRICE;
const totalCost = blocksCost + beamsCost;
console.log(`Blocks Cost: Ksh ${blocksCost.toLocaleString()}`);
console.log(`Beams Cost: Ksh ${beamsCost.toLocaleString()}`);
console.log(`Total Cost (Beams & Blocks): Ksh ${totalCost.toLocaleString()}`);
