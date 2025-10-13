
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
  beamSpaces: number; // This is the 'Rows' in the spec
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

// New type for aggregated breakdown
export interface AggregatedRoomGroup {
  sizeKey: string;
  shorter: number;
  longer: number;
  roomCount: number;
  beamsPerRoom: number;
  beamLengthEach: number;
  totalBeams: number;
  totalBeamLength: number;
  blocksPerRoom: number;
  totalBlocks: number;
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
  concreteMixRatioBallast: 3,
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
  const blocksPerBeamRow = shorter > 0 && C.blockWidth > 0 ? ceil(shorter / C.blockWidth) : 0;
  const totalBlocks = beamSpaces * blocksPerBeamRow;
  const totalBeamLength = beamCount * shorter;
  

  return {
    length: lengthMeters,
    width: widthMeters,
    shorter,
    longer,
    beamCount,
    beamSpaces, // rows
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

  const totalRatioParts = concreteMixRatioCement + concreteMixRatioSand + concreteMixRatioBallast;
  const batchVolume = totalRatioParts * wheelbarrowVolume;

  const bagsPerM3 = batchVolume > 0 ? (1 / batchVolume) * concreteMixRatioCement : 0;
  const sandWBPerM3 = batchVolume > 0 ? (bagsPerM3 * concreteMixRatioSand) : 0;
  const ballastWBPerM3 = batchVolume > 0 ? (bagsPerM3 * concreteMixRatioBallast) : 0;

  const rawCementBags = totalConcreteVolume * bagsPerM3;
  const rawSandWB = totalConcreteVolume * sandWBPerM3;
  const rawBallastWB = totalConcreteVolume * ballastWBPerM3;

  const cementBags = ceil(rawCementBags * wastageFactor);
  const sandWheelbarrows = ceil(rawSandWB * wastageFactor);
  const ballastWheelbarrows = ceil(rawBallastWB * wastageFactor);
  
  const sandTonnes = wheelbarrowsPerTonne > 0 ? sandWheelbarrows / wheelbarrowsPerTonne : 0;
  const ballastTonnes = wheelbarrowsPerTonne > 0 ? ballastWheelbarrows / wheelbarrowsPerTonne : 0;
  
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

export function getAggregatedRoomBreakdown(rooms: Room[], settings: CalculationDefaults): AggregatedRoomGroup[] {
  const roomGroups = new Map<string, { rooms: Room[], calcs: RoomCalculation }>();

  rooms.forEach(room => {
      const roomCalcs = calcRoomBlocksAndBeams(room.length, room.width, settings);
      const { shorter, longer } = roomCalcs;
      const sizeKey = `${shorter.toFixed(2)}x${longer.toFixed(2)}`;

      if (!roomGroups.has(sizeKey)) {
          roomGroups.set(sizeKey, { rooms: [], calcs: roomCalcs });
      }
      roomGroups.get(sizeKey)!.rooms.push(room);
  });

  const aggregated: AggregatedRoomGroup[] = [];

  for (const [sizeKey, group] of roomGroups.entries()) {
      const { calcs, rooms: groupedRooms } = group;
      const roomCount = groupedRooms.length;

      const beamsPerRoom = calcs.beamCount;
      const beamLengthEach = calcs.shorter;
      const totalGroupBeams = beamsPerRoom * roomCount;
      const totalGroupBeamLength = totalGroupBeams * beamLengthEach;

      const blocksPerRoom = calcs.totalBlocks;
      const totalGroupBlocks = blocksPerRoom * roomCount;

      aggregated.push({
          sizeKey,
          shorter: calcs.shorter,
          longer: calcs.longer,
          roomCount,
          beamsPerRoom,
          beamLengthEach,
          totalBeams: totalGroupBeams,
          totalBeamLength: totalGroupBeamLength,
          blocksPerRoom,
          totalBlocks: totalGroupBlocks,
      });
  }

  return aggregated.sort((a, b) => (b.shorter * b.longer) - (a.shorter * a.longer));
}
