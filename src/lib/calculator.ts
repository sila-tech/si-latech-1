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
}

export interface RoomCalculation {
  length: number;
  width: number;
  shorter: number;
  longer: number;
  beamCount: number;
  beamSpaces: number;
  blocksPerBeam: number;
  totalBlocks: number;
  blockArea: number;
  totalBlocksArea: number;
  leftoverAlongLength: number;
  halfBlockNeededAlongLength: boolean;
  totalBeamLength: number;
}

export interface ConcreteCalculation {
  area: number;
  beamsVolume: number;
  toppingVolume: number;
  totalConcrete: number;
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
  beamSpacing: m(400), // This is equivalent to block length for this logic
  beamSectionW: m(400),
  beamSectionH: m(200),
  toppingThickness: 0.05,
  brcRollLength: 48,
  brcRollWidth: 3,
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

  // Per the new formula:
  // Flat beams are placed parallel to the shorter side.
  // They run across the longer side.
  
  // 1a. Number of Flat Beams
  // The spacing is determined by the block length (400mm default).
  const beamSpaces = ceil(longer / C.blockLength);
  const beamCount = beamSpaces + 1;
  
  // 1b. Length of each flat beam is the shorter side of the room.
  const beamLengthEach = shorter;
  const totalBeamLength = beamCount * beamLengthEach;

  // 2a. Blocks per Beam Row
  // This is the number of blocks that fit along one beam (i.e., along the shorter side).
  // This is based on the block width (200mm default).
  const blocksPerBeam = ceil(shorter / C.blockWidth);

  // 3. Total Blocks for the room
  const totalBlocks = beamSpaces * blocksPerBeam;

  // Other calculations for display (can be simplified or removed if not needed)
  const blockArea = C.blockLength * C.blockWidth;
  const totalBlocksArea = totalBlocks * blockArea;
  const leftoverAlongLength = blocksPerBeam * C.blockWidth - shorter;
  const halfBlockNeededAlongLength = false; // This logic might not be relevant anymore

  return {
    length: lengthMeters,
    width: widthMeters,
    shorter,
    longer,
    beamCount,
    beamSpaces,
    blocksPerBeam,
    totalBlocks,
    blockArea,
    totalBlocksArea,
    leftoverAlongLength: Math.abs(leftoverAlongLength),
    halfBlockNeededAlongLength,
    totalBeamLength,
  };
}

export function calcConcrete(
  roomCalc: RoomCalculation,
  opts: Partial<CalculationDefaults> = {}
): ConcreteCalculation {
  const C = { ...DEFAULTS, ...opts };
  const area = roomCalc.length * roomCalc.width;

  const beamSectionArea = C.beamSectionW * C.beamSectionH;
  const beamsVolume = roomCalc.totalBeamLength * beamSectionArea;
  const toppingVolume = area * C.toppingThickness;
  const totalConcrete = beamsVolume + toppingVolume;

  return { area, beamsVolume, toppingVolume, totalConcrete };
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

export function generateInvoiceJSON(
  totalBlocks: number,
  totalBeamLength: number,
  totalConcreteVolume: number,
  brc: BrcCalculation,
  totalArea: number
) {
  return {
    date: new Date().toISOString(),
    company: 'Silatech Solutions',
    items: [
      { desc: 'Blocks (pieces)', qty: totalBlocks, unit: 'pcs' },
      {
        desc: 'Flat Beams (linear m)',
        qty: Number(totalBeamLength.toFixed(2)),
        unit: 'm',
      },
      {
        desc: 'Concrete (m3)',
        qty: Number(totalConcreteVolume.toFixed(3)),
        unit: 'm3',
      },
      { desc: 'BRC rolls', qty: brc.rollsNeeded, unit: 'rolls' },
    ],
    totals: {
      area_m2: Number(totalArea.toFixed(2)),
      blocks: totalBlocks,
      concrete_m3: Number(totalConcreteVolume.toFixed(3)),
    },
  };
}
