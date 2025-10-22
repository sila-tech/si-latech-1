
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
  wheelbarrowVolume: number; // Note: This is now for display/reference, not core calculation
  wheelbarrowsPerTonne: number; // Note: This is now for display/reference, not core calculation
  dryVolumeFactor: number;
  cementBulkDensity: number;
  sandBulkDensity: number;
  aggregateBulkDensity: number;
  cementBagWeight: number;
  profitBeamsPerRoom: number;
  blockCommissionRate: number;
}

export interface RoomCalculation {
  length: number;
  width: number;
  shorter: number;
  longer: number;
  
  actualBeamCount: number;
  profitBeams: number;
  invoiceBeamCount: number;

  beamSpaces: number; // This is the 'Rows' in the spec
  blocksPerBeamRow: number;
  totalBlocks: number;
  
  actualTotalBeamLength: number;
  invoiceTotalBeamLength: number;
  profitBeamLength: number;
  
  // New Profit Fields
  beamProfitValue: number;
  blockCommission: number;
  totalRoomProfit: number;
}

export interface ConcreteCalculation {
  area: number;
  wetVolume: number; // Was totalConcrete
  dryVolume: number;
  cementBags: number;
  sandTonnes: number;
  ballastTonnes: number;
  // Kept for potential display, but not used in core calculation logic
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
  // Mix ratio
  concreteMixRatioCement: 1,
  concreteMixRatioSand: 2,
  concreteMixRatioBallast: 4, // Changed from 3 to 4 to match example
  wastagePercentage: 10,
  // New density & conversion factors from user spec
  dryVolumeFactor: 1.54,
  cementBulkDensity: 1440, // kg/m³
  sandBulkDensity: 1600, // kg/m³
  aggregateBulkDensity: 1500, // kg/m³
  cementBagWeight: 50, // kg
  // Kept for reference but not used in main calculation now
  wheelbarrowVolume: 0.065, 
  wheelbarrowsPerTonne: 6,
  profitBeamsPerRoom: 2,
  blockCommissionRate: 10, // KSh per block
};

const ceil = (v: number) => Math.ceil(v);

export function calcRoomBlocksAndBeams(
  lengthMeters: number,
  widthMeters: number,
  opts: Partial<CalculationDefaults> = {},
  beamPricePerMeter: number
): RoomCalculation {
  const C = { ...DEFAULTS, ...opts };

  const shorter = Math.min(lengthMeters, widthMeters);
  const longer = Math.max(lengthMeters, widthMeters);

  const beamSpaces = longer > 0 && C.beamSpacing > 0 ? ceil(longer / C.beamSpacing) : 0;
  
  const actualBeamCount = beamSpaces > 0 ? beamSpaces + 1 : 0;
  const profitBeams = C.profitBeamsPerRoom;
  const invoiceBeamCount = actualBeamCount + profitBeams;

  const blocksPerBeamRow = shorter > 0 && C.blockWidth > 0 ? ceil(shorter / C.blockWidth) : 0;
  const totalBlocks = beamSpaces * blocksPerBeamRow;
  
  const actualTotalBeamLength = actualBeamCount * shorter;
  const invoiceTotalBeamLength = invoiceBeamCount * shorter;
  const profitBeamLength = invoiceTotalBeamLength - actualTotalBeamLength;

  // New profit calculations
  const beamProfitValue = profitBeamLength * beamPricePerMeter;
  const blockCommission = totalBlocks * C.blockCommissionRate;
  const totalRoomProfit = beamProfitValue + blockCommission;
  

  return {
    length: lengthMeters,
    width: widthMeters,
    shorter,
    longer,
    actualBeamCount,
    profitBeams,
    invoiceBeamCount,
    beamSpaces, // rows
    blocksPerBeamRow,
    totalBlocks,
    actualTotalBeamLength,
    invoiceTotalBeamLength,
    profitBeamLength,
    beamProfitValue,
    blockCommission,
    totalRoomProfit,
  };
}

export function calcConcrete(
  roomCalc: RoomCalculation,
  opts: Partial<CalculationDefaults> = {}
): ConcreteCalculation {
  const C = { ...DEFAULTS, ...opts };
  const area = roomCalc.length * roomCalc.width;

  // Wet Volume Calculation - Should be based on ACTUAL beams supplied
  const beamRibVolume = roomCalc.actualTotalBeamLength * C.beamSectionW * C.beamSectionH;
  const toppingVolume = area * C.toppingThickness;
  const V_wet = beamRibVolume + toppingVolume;

  // A. Assumptions & Inputs
  const F_dry = C.dryVolumeFactor;
  const pC = C.concreteMixRatioCement;
  const pS = C.concreteMixRatioSand;
  const pA = C.concreteMixRatioBallast;
  const rho_c = C.cementBulkDensity;
  const rho_s = C.sandBulkDensity;
  const rho_a = C.aggregateBulkDensity;
  const bag_kg = C.cementBagWeight;
  const wastage_factor = 1 + (C.wastagePercentage / 100);

  // B. Formulas
  // 1. Dry Volume
  const V_dry = V_wet * F_dry;

  // 2. Total Parts
  const totalParts = pC + pS + pA;
  if (totalParts === 0) {
    return {
      area, wetVolume: V_wet, dryVolume: 0, cementBags: 0, sandTonnes: 0, ballastTonnes: 0, sandWheelbarrows: 0, ballastWheelbarrows: 0
    };
  }

  // 3. Material Volumes (m³)
  const V_cement = (pC / totalParts) * V_dry;
  const V_sand = (pS / totalParts) * V_dry;
  const V_agg = (pA / totalParts) * V_dry;
  
  // 4. Mass (kg) - before wastage
  const m_cement = V_cement * rho_c;
  const m_sand = V_sand * rho_s;
  const m_agg = V_agg * rho_a;

  // 5. Apply Wastage
  const m_cement_w = m_cement * wastage_factor;
  const m_sand_w = m_sand * wastage_factor;
  const m_agg_w = m_agg * wastage_factor;

  // 6. Convert to Purchase Units
  const bags = bag_kg > 0 ? ceil(m_cement_w / bag_kg) : 0;
  const sand_t = m_sand_w / 1000;
  const agg_t = m_agg_w / 1000;

  // For display only
  const sandWheelbarrows = ceil(sand_t * C.wheelbarrowsPerTonne);
  const ballastWheelbarrows = ceil(agg_t * C.wheelbarrowsPerTonne);

  return { 
    area,
    wetVolume: V_wet,
    dryVolume: V_dry,
    cementBags: bags,
    sandTonnes: sand_t,
    ballastTonnes: agg_t,
    sandWheelbarrows: sandWheelbarrows,
    ballastWheelbarrows: ballastWheelbarrows
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

  // Dummy beam price, not used for final profit calcs but needed for function signature
  const BEAM_PRICE = 545; 

  rooms.forEach(room => {
      const roomCalcs = calcRoomBlocksAndBeams(room.length, room.width, settings, BEAM_PRICE);
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

      const beamsPerRoom = calcs.actualBeamCount;
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
