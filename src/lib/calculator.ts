
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
  wastagePercentage: number; // e.g., 10 for 10%
  wheelbarrowVolume: number; // m³
  wheelbarrowsPerTonne: number;
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
  beamSectionW: m(120),
  beamSectionH: m(40),
  toppingThickness: 0.05, // 50mm
  brcRollLength: 48,
  brcRollWidth: 2.4,

  // Concrete Defaults (Local Ratio Method)
  concreteMixRatioCement: 1,
  concreteMixRatioSand: 2,
  concreteMixRatioBallast: 4,
  wastagePercentage: 10, // 10%
  wheelbarrowVolume: 0.065, // m³
  wheelbarrowsPerTonne: 6, // 1 tonne = 6 wheelbarrows
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

  const beamRibVolume =
    roomCalc.totalBeamLength * C.beamSectionW * C.beamSectionH;
  const toppingVolume = area * C.toppingThickness;
  const totalConcreteVolume = beamRibVolume + toppingVolume;
  
  const wastageFactor = 1 + (C.wastagePercentage / 100);

  // --- Local Wheelbarrow Ratio Method ---
  const { 
    concreteMixRatioCement, 
    concreteMixRatioSand, 
    concreteMixRatioBallast,
    wheelbarrowVolume,
    wheelbarrowsPerTonne,
  } = C;

  let cementBags = 0;
  let sandTonnes = 0;
  let ballastTonnes = 0;

  if (totalConcreteVolume > 0) {
    // Total parts in one batch (1 bag cement is 1 part)
    const totalRatioParts = concreteMixRatioCement + concreteMixRatioSand + concreteMixRatioBallast;
    
    // Volume of one batch of concrete in m³
    const oneBatchVolume = totalRatioParts * wheelbarrowVolume;
    
    // How many bags of cement are needed per m³ of concrete
    const bagsPerM3 = oneBatchVolume > 0 ? (1 / oneBatchVolume) * concreteMixRatioCement : 0;
    
    // How many wheelbarrows of sand are needed per m³ of concrete
    const sandWBPerM3 = bagsPerM3 * concreteMixRatioSand;
    
    // How many wheelbarrows of ballast are needed per m³ of concrete
    const ballastWBPerM3 = bagsPerM3 * concreteMixRatioBallast;

    // Calculate total materials for the given concrete volume, including wastage
    const totalCementBags = totalConcreteVolume * bagsPerM3 * wastageFactor;
    const totalSandWB = totalConcreteVolume * sandWBPerM3 * wastageFactor;
    const totalBallastWB = totalConcreteVolume * ballastWBPerM3 * wastageFactor;

    // Convert to final units
    cementBags = ceil(totalCementBags);
    sandTonnes = wheelbarrowsPerTonne > 0 ? totalSandWB / wheelbarrowsPerTonne : 0;
    ballastTonnes = wheelbarrowsPerTonne > 0 ? totalBallastWB / wheelbarrowsPerTonne : 0;
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
