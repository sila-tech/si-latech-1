export interface Room {
  id: string;
  name: string;
  length: number;
  width: number;
}

export interface CalculationDefaults {
  blockLength: number;
  blockWidth: number;
  // beamSpacing is now derived from blockLength, so it's commented out but kept for reference
  // beamSpacing: number; 
  beamSectionW: number;
  beamSectionH: number;
  toppingThickness: number;
  brcRollLength: number;
  brcRollWidth: number;
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
  // beamSpacing: m(400),
  beamSectionW: m(120), // Common width of a T-beam stem
  beamSectionH: m(40), // Common height of a T-beam stem below the slab
  toppingThickness: 0.05, // 50mm
  brcRollLength: 48,
  brcRollWidth: 2.4,
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
  const beamSpaces = ceil(longer / beamSpacing);
  const beamCount = beamSpaces + 1;
  
  // 1b. Length of each flat beam is the shorter side of the room.
  const beamLengthEach = shorter;
  const totalBeamLength = beamCount * beamLengthEach;

  // 2a. Blocks per Beam Row
  // This is the number of blocks that fit along the shorter side.
  // This is based on the block width (200mm default).
  const blocksPerBeamRow = ceil(shorter / C.blockWidth);

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
  const totalConcrete = beamRibVolume + toppingVolume;

  // --- Raw Material Calculation (Mix Ratio 1:2:4) ---
  const CEMENT_RATIO = 1;
  const SAND_RATIO = 2;
  const BALLAST_RATIO = 4;
  const TOTAL_RATIO = CEMENT_RATIO + SAND_RATIO + BALLAST_RATIO; // 7

  // Constants for material properties
  const DENSITY_CEMENT = 1440; // kg/m³
  const DENSITY_SAND = 1450; // kg/m³ (loose bulk density)
  const DENSITY_BALLAST = 1500; // kg/m³ (loose bulk density)
  const CEMENT_BAG_WEIGHT = 50; // kg
  
  // Bulking factor and shrinkage
  const WET_TO_DRY_FACTOR = 1.54; // Volume of dry materials is ~54% more than wet concrete

  const dryVolume = totalConcrete * WET_TO_DRY_FACTOR;

  // Volume of each material
  const cementVolume = (dryVolume * CEMENT_RATIO) / TOTAL_RATIO;
  const sandVolume = (dryVolume * SAND_RATIO) / TOTAL_RATIO;
  const ballastVolume = (dryVolume * BALLAST_RATIO) / TOTAL_RATIO;

  // Convert volumes to practical units
  const cementWeight = cementVolume * DENSITY_CEMENT;
  const cementBags = ceil(cementWeight / CEMENT_BAG_WEIGHT);

  const sandWeight = sandVolume * DENSITY_SAND;
  const sandTonnes = sandWeight / 1000;

  const ballastWeight = ballastVolume * DENSITY_BALLAST;
  const ballastTonnes = ballastWeight / 1000;

  return { 
    area, 
    beamsVolume: beamRibVolume, 
    toppingVolume, 
    totalConcrete,
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
