
export interface Room {
  id: string;
  name: string;
  length: number;
  width: number;
}

export interface CalculationDefaults {
  blockLength: number;
  blockWidth: number;
  beamSpacing: number;
  beamSectionW: number;
  beamSectionH: number;
  toppingThickness: number;
  brcRollLength: number;
  brcRollWidth: number;
  concreteMixRatioCement: number;
  concreteMixRatioSand: number;
  concreteMixRatioBallast: number;
  wastagePercentage: number;
  wheelbarrowVolume: number;
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
  cementBags: number;
  sandTonnes: number;
  ballastTonnes: number;
  sandWheelbarrows: number;
  ballastWheelbarrows: number;
}

export interface BrcCalculation {
  areaPerRoll: number;
  rollsNeeded: number;
  metresOfBRC: number;
}

const m = (mm: number) => mm / 1000;

export const DEFAULTS: CalculationDefaults = {
  blockLength: m(400),
  blockWidth: m(200),
  beamSpacing: 0.6,
  beamSectionW: m(120),
  beamSectionH: m(40),
  toppingThickness: 0.05,
  brcRollLength: 48,
  brcRollWidth: 2.4,
  concreteMixRatioCement: 1,
  concreteMixRatioSand: 2,
  concreteMixRatioBallast: 4,
  wastagePercentage: 10,
  wheelbarrowVolume: 0.065,
  wheelbarrowsPerTonne: 6,
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

  const beamSpaces = longer > 0 && C.beamSpacing > 0 ? ceil(longer / C.beamSpacing) : 0;
  const beamCount = beamSpaces > 0 ? beamSpaces + 1 : 0;
  const totalBeamLength = beamCount * shorter;
  const blocksPerBeamRow = shorter > 0 && C.blockWidth > 0 ? ceil(shorter / C.blockWidth) : 0;
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

  const beamRibVolume = roomCalc.totalBeamLength * C.beamSectionW * C.beamSectionH;
  const toppingVolume = area * C.toppingThickness;
  const totalConcreteVolume = beamRibVolume + toppingVolume;
  
  const wastageFactor = 1 + (C.wastagePercentage / 100);

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
  let sandWheelbarrows = 0;
  let ballastWheelbarrows = 0;

  if (totalConcreteVolume > 0 && wheelbarrowVolume > 0) {
    const totalRatioParts = concreteMixRatioCement + concreteMixRatioSand + concreteMixRatioBallast;
    const oneBatchVolume = totalRatioParts * wheelbarrowVolume;
    
    const bagsPerM3 = oneBatchVolume > 0 ? (1 / oneBatchVolume) * concreteMixRatioCement : 0;
    const sandWBPerM3 = bagsPerM3 * concreteMixRatioSand;
    const ballastWBPerM3 = bagsPerM3 * concreteMixRatioBallast;

    const rawCementBags = totalConcreteVolume * bagsPerM3;
    const rawSandWB = totalConcreteVolume * sandWBPerM3;
    const rawBallastWB = totalConcreteVolume * ballastWBPerM3;

    cementBags = ceil(rawCementBags * wastageFactor);
    sandWheelbarrows = ceil(rawSandWB * wastageFactor);
    ballastWheelbarrows = ceil(rawBallastWB * wastageFactor);

    sandTonnes = wheelbarrowsPerTonne > 0 ? sandWheelbarrows / wheelbarrowsPerTonne : 0;
    ballastTonnes = wheelbarrowsPerTonne > 0 ? ballastWheelbarrows / wheelbarrowsPerTonne : 0;
  }
  
  return { 
    area, 
    beamsVolume: beamRibVolume, 
    toppingVolume, 
    totalConcrete: totalConcreteVolume,
    cementBags,
    sandTonnes,
    ballastTonnes,
    sandWheelbarrows,
    ballastWheelbarrows,
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
