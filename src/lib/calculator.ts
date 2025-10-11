
export interface Room {
  id: string;
  name: string;
  length: number;
  width: number;
}

export interface CalculationDefaults {
  blockLength: number;
  blockWidth: number;
  beamSectionW: number;
  beamSectionH: number;
  toppingThickness: number;
  brcRollLength: number;
  brcRollWidth: number;

  // Concrete Calculation Defaults
  concreteMixRatioCement: number;
  concreteMixRatioSand: number;
  concreteMixRatioBallast: number;
  concreteUnitWeight: number; // kg/m³
  sandDensity: number; // kg/m³
  ballastDensity: number; // kg/m³
  wastagePercentage: number; // e.g., 10 for 10%
  cementBagWeight: number; // kg
}

export interface RoomCalculation {
  length: number;
  width: number;
  shorter: number;
  longer: number;
  beamCount: number;
  beamSpaces: number;
  blocksPerBeamRow: number;
  totalBlocks: number;
  totalBeamLength: number;
}

export interface ConcreteCalculation {
  area: number;
  beamsVolume: number;
  toppingVolume: number;
  totalConcrete: number;
  // Raw materials
  cementBags: number; // 50kg bags
  sandTonnes: number;
  ballastTonnes: number;
}

export interface BrcCalculation {
  areaPerRoll: number;
  rollsNeeded: number;
  metresOfBRC: number;
}

const m = (mm: number) => mm / 1000; // convert mm to meters

export const DEFAULTS: CalculationDefaults = {
  blockLength: m(400),
  blockWidth: m(200),
  beamSectionW: m(120), // Common width of a T-beam stem
  beamSectionH: m(40), // Common height of a T-beam stem below the slab
  toppingThickness: 0.05, // 50mm
  brcRollLength: 48,
  brcRollWidth: 2.4,

  // Concrete Defaults
  concreteMixRatioCement: 1,
  concreteMixRatioSand: 2,
  concreteMixRatioBallast: 4,
  concreteUnitWeight: 2400, // kg/m³
  sandDensity: 1600, // kg/m³
  ballastDensity: 1600, // kg/m³
  wastagePercentage: 10, // 10%
  cementBagWeight: 50, // kg
};

const ceil = (v: number) => Math.ceil(v);

export function calcRoomBlocksAndBeams(
  lengthMeters: number,
  widthMeters: number,
  opts: Partial<CalculationDefaults> = {}
): RoomCalculation {
  const C = { ...DEFAULTS, ...opts };

  const shorter = Math.min(lengthMeters, widthMeters);
  const longer = Math.max(lengthMeters, widthMeters);

  // The spacing for flat beams is determined by the length of the blocks.
  const beamSpacing = C.blockLength;

  // 1a. Number of Flat Beams
  // Placed parallel to the shorter side, running across the longer side.
  const beamSpaces = longer > 0 && beamSpacing > 0 ? ceil(longer / beamSpacing) : 0;
  const beamCount = beamSpaces + 1;
  
  // 1b. Length of each flat beam is the shorter side of the room.
  const beamLengthEach = shorter;
  const totalBeamLength = beamCount * beamLengthEach;

  // 2a. Blocks per Beam Row
  // This is the number of blocks that fit along the shorter side.
  // This is based on the block width (200mm default).
  const blocksPerBeamRow = shorter > 0 && C.blockWidth > 0 ? ceil(shorter / C.blockWidth) : 0;

  // 3. Total Blocks for the room
  // This is the number of rows of blocks (beamSpaces) times the number of blocks in each row.
  const totalBlocks = beamSpaces * blocksPerBeamRow;


  return {
    length: lengthMeters,
    width: widthMeters,
    shorter,
    longer,
    beamCount,
    beamSpaces,
    blocksPerBeamRow,
    totalBlocks,
    totalBeamLength,
  };
}

export function calcConcrete(
  roomCalc: RoomCalculation,
  opts: Partial<CalculationDefaults> = {}
): ConcreteCalculation {
  const C = { ...DEFAULTS, ...opts };
  const area = roomCalc.length * roomCalc.width;

  // This volume is for the concrete in the T-beam ribs below the slab topping
  const beamRibVolume =
    roomCalc.totalBeamLength * C.beamSectionW * C.beamSectionH;
  const toppingVolume = area * C.toppingThickness;
  const totalConcreteVolume = beamRibVolume + toppingVolume;

  // --- Mass-based Raw Material Calculation ---
  const totalRatioParts = C.concreteMixRatioCement + C.concreteMixRatioSand + C.concreteMixRatioBallast;
  const wastageFactor = 1 + (C.wastagePercentage / 100);

  let cementBags = 0;
  let sandTonnes = 0;
  let ballastTonnes = 0;

  if (totalConcreteVolume > 0 && totalRatioParts > 0) {
    // Step B: Determine mass per m³
    const cementMassPerM3 = (C.concreteMixRatioCement / totalRatioParts) * C.concreteUnitWeight;
    const sandMassPerM3 = (C.concreteMixRatioSand / totalRatioParts) * C.concreteUnitWeight;
    const ballastMassPerM3 = (C.concreteMixRatioBallast / totalRatioParts) * C.concreteUnitWeight;

    // Step C: Scale by total volume
    const totalCementMass = cementMassPerM3 * totalConcreteVolume;
    const totalSandMass = sandMassPerM3 * totalConcreteVolume;
    const totalBallastMass = ballastMassPerM3 * totalConcreteVolume;

    // Step E (part 1): Apply wastage
    const totalCementMassWithWastage = totalCementMass * wastageFactor;
    const totalSandMassWithWastage = totalSandMass * wastageFactor;
    const totalBallastMassWithWastage = totalBallastMass * wastageFactor;

    // Step D & E (part 2): Convert to practical units and final rounding
    cementBags = C.cementBagWeight > 0 ? ceil(totalCementMassWithWastage / C.cementBagWeight) : 0;
    sandTonnes = totalSandMassWithWastage / 1000;
    ballastTonnes = totalBallastMassWithWastage / 1000;
  }
  
  return { 
    area, 
    beamsVolume: beamRibVolume, 
    toppingVolume, 
    totalConcrete: totalConcreteVolume,
    cementBags,
    sandTonnes,
    ballastTonnes,
  };
}

export function calcBRC(
  totalArea: number,
  opts: Partial<CalculationDefaults> = {}
): BrcCalculation {
  const C = { ...DEFAULTS, ...opts };
  const areaPerRoll = C.brcRollWidth * C.brcRollLength;
  const rollsNeeded = areaPerRoll > 0 ? ceil(totalArea / areaPerRoll) : 0;
  const metresOfBRC = rollsNeeded * C.brcRollLength;
  return { areaPerRoll, rollsNeeded, metresOfBRC };
}
