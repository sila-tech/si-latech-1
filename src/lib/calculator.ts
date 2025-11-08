

export interface Room {
  id: string;
  name: string;
  length: number;
  width: number;
}

export interface LocalProject {
  id: string;
  name: string;
  savedAt: string;
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
  dryVolumeFactor: number;
  cementBulkDensity: number;
  sandBulkDensity: number;
  aggregateBulkDensity: number;
  cementBagWeight: number;
  profitBeamsPerRoom: number;
  blockCommissionRate: number;
  lintelHeight: number;
  lintelWidth: number;
  timber3x2Spacing: number;
  timber6x1PerimeterMultiplier: number;
  propSpacing: number;
  // Lintel Steel
  num_longitudinal: number;
  dia_longitudinal: number;
  dia_stirrup: number;
  stirrup_spacing: number;
  cover: number;
  hook_length: number;
  steel_wastage_pct: number;
  standard_bar_length: number;
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
  
  beamProfitValue: number;
  blockCommission: number;
  totalRoomProfit: number;
}

export interface ConcreteCalculation {
  area: number;
  wetVolume: number; 
  dryVolume: number;
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

export interface LintelCalculation {
    totalLintelLength: number;
    crossSectionalArea: number;
    wetVolume: number;
    dryVolume: number;
    cementVolume: number;
    sandVolume: number;
    ballastVolume: number;
    cementMassWastage: number;
    sandMassWastage: number;
    ballastMassWastage: number;
    cementBags: number;
    sandTonnes: number;
    ballastTonnes: number;
}

export interface TimberAndPropsCalculation {
  pieces3x2: number;
  lengthEach3x2: number;
  total3x2m: number;
  total3x2ft: number;
  perimeter: number;
  total6x1m: number;
  total6x1ft: number;
}

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

export interface LintelSteelBarCalculation {
    diameter: number;
    unitWeight: number;
    linearMetersRequired: number;
    linearMetersWithWastage: number;
    massRequired: number;
    massWithWastage: number;
    barsToOrder: number;
    orderedLength: number;
    orderedMass: number;
    leftoverLength: number;
}

export interface LintelSteelCalculation {
    longitudinal: LintelSteelBarCalculation;
    stirrups: LintelSteelBarCalculation & {
        count: number;
        lengthEach: number;
    };
    totals: {
        lm_with_waste: number;
        kg_with_waste: number;
        ordered_kg: number;
        total_bars_ordered: number;
        total_leftover_length: number;
    };
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
  dryVolumeFactor: 1.54,
  cementBulkDensity: 1440, 
  sandBulkDensity: 1600, 
  aggregateBulkDensity: 1500, 
  cementBagWeight: 50, 
  wheelbarrowVolume: 0.065, 
  wheelbarrowsPerTonne: 6,
  profitBeamsPerRoom: 2,
  blockCommissionRate: 10, 
  lintelHeight: 0.40,
  lintelWidth: 0.20,
  timber3x2Spacing: 0.6,
  timber6x1PerimeterMultiplier: 6,
  propSpacing: 0.6,
  // Lintel Steel Defaults
  num_longitudinal: 4,
  dia_longitudinal: 12,
  dia_stirrup: 8,
  stirrup_spacing: 0.20,
  cover: 0.03,
  hook_length: 0.10,
  steel_wastage_pct: 5,
  standard_bar_length: 12.0,
};

const ceil = (v: number) => Math.ceil(v);
const METERS_TO_FEET = 3.28084;


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

  const beamRibVolume = roomCalc.actualTotalBeamLength * C.beamSectionW * C.beamSectionH;
  const toppingVolume = area * C.toppingThickness;
  const V_wet = beamRibVolume + toppingVolume;

  const F_dry = C.dryVolumeFactor;
  const pC = C.concreteMixRatioCement;
  const pS = C.concreteMixRatioSand;
  const pA = C.concreteMixRatioBallast;
  const rho_c = C.cementBulkDensity;
  const rho_s = C.sandBulkDensity;
  const rho_a = C.aggregateBulkDensity;
  const bag_kg = C.cementBagWeight;
  const wastage_factor = 1 + (C.wastagePercentage / 100);

  const V_dry = V_wet * F_dry;

  const totalParts = pC + pS + pA;
  if (totalParts === 0) {
    return {
      area, wetVolume: V_wet, dryVolume: 0, cementBags: 0, sandTonnes: 0, ballastTonnes: 0, sandWheelbarrows: 0, ballastWheelbarrows: 0
    };
  }

  const V_cement = (pC / totalParts) * V_dry;
  const V_sand = (pS / totalParts) * V_dry;
  const V_agg = (pA / totalParts) * V_dry;
  
  const m_cement = V_cement * rho_c;
  const m_sand = V_sand * rho_s;
  const m_agg = V_agg * rho_a;

  const m_cement_w = m_cement * wastage_factor;
  const m_sand_w = m_sand * wastage_factor;
  const m_agg_w = m_agg * wastage_factor;

  const bags = bag_kg > 0 ? ceil(m_cement_w / bag_kg) : 0;
  const sand_t = m_sand_w / 1000;
  const agg_t = m_agg_w / 1000;

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

export function calcLintelConcrete(
    totalLintelLength: number,
    opts: Partial<CalculationDefaults> = {}
): LintelCalculation {
    const C = { ...DEFAULTS, ...opts };

    if (totalLintelLength <= 0) {
        return {
            totalLintelLength: 0, crossSectionalArea: 0, wetVolume: 0, dryVolume: 0,
            cementVolume: 0, sandVolume: 0, ballastVolume: 0,
            cementMassWastage: 0, sandMassWastage: 0, ballastMassWastage: 0,
            cementBags: 0, sandTonnes: 0, ballastTonnes: 0
        };
    }
    
    const crossSectionalArea = C.lintelHeight * C.lintelWidth;
    const wetVolume = totalLintelLength * crossSectionalArea;
    const dryVolume = wetVolume * C.dryVolumeFactor;
    
    const totalParts = C.concreteMixRatioCement + C.concreteMixRatioSand + C.concreteMixRatioBallast;
    
    const cementVolume = totalParts > 0 ? (C.concreteMixRatioCement / totalParts) * dryVolume : 0;
    const sandVolume = totalParts > 0 ? (C.concreteMixRatioSand / totalParts) * dryVolume : 0;
    const ballastVolume = totalParts > 0 ? (C.concreteMixRatioBallast / totalParts) * dryVolume : 0;

    const cementMass = cementVolume * C.cementBulkDensity;
    const sandMass = sandVolume * C.sandBulkDensity;
    const ballastMass = ballastVolume * C.aggregateBulkDensity;

    const wastageFactor = 1 + (C.wastagePercentage / 100);
    const cementMassWastage = cementMass * wastageFactor;
    const sandMassWastage = sandMass * wastageFactor;
    const ballastMassWastage = ballastMass * wastageFactor;

    const cementBags = C.cementBagWeight > 0 ? ceil(cementMassWastage / C.cementBagWeight) : 0;
    const sandTonnes = sandMassWastage / 1000;
    const ballastTonnes = ballastMassWastage / 1000;

    return {
        totalLintelLength,
        crossSectionalArea,
        wetVolume,
        dryVolume,
        cementVolume,
        sandVolume,
        ballastVolume,
        cementMassWastage,
        sandMassWastage,
        ballastMassWastage,
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

export function calcTimberAndProps(
  room: Room,
  opts: Partial<CalculationDefaults> = {}
): TimberAndPropsCalculation {
  const C = { ...DEFAULTS, ...opts };
  const shorter = Math.min(room.length, room.width);
  const longer = Math.max(room.length, room.width);

  const rows = C.timber3x2Spacing > 0 ? ceil(shorter / C.timber3x2Spacing) : 0;
  const pieces3x2 = rows + 1;
  const lengthEach3x2 = longer;
  const total3x2m = pieces3x2 * lengthEach3x2;
  const total3x2ft = total3x2m * METERS_TO_FEET;

  const perimeter = 2 * (longer + shorter);
  const total6x1m = perimeter * C.timber6x1PerimeterMultiplier;
  const total6x1ft = total6x1m * METERS_TO_FEET;

  return {
    pieces3x2,
    lengthEach3x2,
    total3x2m,
    total3x2ft,
    perimeter,
    total6x1m,
    total6x1ft,
  };
}

const calcUnitWeight = (diameter: number) => 0.006165 * Math.pow(diameter, 2);

export function calcLintelSteel(
  totalLintelLength: number,
  opts: Partial<CalculationDefaults> = {}
): LintelSteelCalculation {
  const C = { ...DEFAULTS, ...opts };
  const wastageFactor = 1 + C.steel_wastage_pct / 100;
  
  // Longitudinal Bars
  const w_long = calcUnitWeight(C.dia_longitudinal);
  const lm_long = totalLintelLength * C.num_longitudinal;
  const kg_long = lm_long * w_long;
  const lm_long_w = lm_long * wastageFactor;
  const kg_long_w = kg_long * wastageFactor;
  const n_bars_long = C.standard_bar_length > 0 ? ceil(lm_long_w / C.standard_bar_length) : 0;
  const ordered_length_long = n_bars_long * C.standard_bar_length;
  const ordered_kg_long = ordered_length_long * w_long;

  // Stirrups
  const w_stirrup = calcUnitWeight(C.dia_stirrup);
  const stirrups_count = C.stirrup_spacing > 0 ? ceil(totalLintelLength / C.stirrup_spacing) : 0;
  const internal_width = C.lintelWidth - 2 * C.cover;
  const internal_height = C.lintelHeight - 2 * C.cover;
  const stirrup_perim = 2 * (internal_width + internal_height);
  const stirrup_length = stirrup_perim + 2 * C.hook_length;
  const lm_stirrup = stirrups_count * stirrup_length;
  const kg_stirrup = lm_stirrup * w_stirrup;
  const lm_stirrup_w = lm_stirrup * wastageFactor;
  const kg_stirrup_w = kg_stirrup * wastageFactor;
  const n_bars_stirrup = C.standard_bar_length > 0 ? ceil(lm_stirrup_w / C.standard_bar_length) : 0;
  const ordered_length_stirrup = n_bars_stirrup * C.standard_bar_length;
  const ordered_kg_stirrup = ordered_length_stirrup * w_stirrup;

  const longitudinalResult: LintelSteelBarCalculation = {
      diameter: C.dia_longitudinal,
      unitWeight: w_long,
      linearMetersRequired: lm_long,
      linearMetersWithWastage: lm_long_w,
      massRequired: kg_long,
      massWithWastage: kg_long_w,
      barsToOrder: n_bars_long,
      orderedLength: ordered_length_long,
      orderedMass: ordered_kg_long,
      leftoverLength: ordered_length_long - lm_long_w,
  };

  const stirrupsResult: LintelSteelBarCalculation & { count: number, lengthEach: number } = {
      diameter: C.dia_stirrup,
      count: stirrups_count,
      lengthEach: stirrup_length,
      unitWeight: w_stirrup,
      linearMetersRequired: lm_stirrup,
      linearMetersWithWastage: lm_stirrup_w,
      massRequired: kg_stirrup,
      massWithWastage: kg_stirrup_w,
      barsToOrder: n_bars_stirrup,
      orderedLength: ordered_length_stirrup,
      orderedMass: ordered_kg_stirrup,
      leftoverLength: ordered_length_stirrup - lm_stirrup_w,
  };
  
  return {
      longitudinal: longitudinalResult,
      stirrups: stirrupsResult,
      totals: {
        lm_with_waste: lm_long_w + lm_stirrup_w,
        kg_with_waste: kg_long_w + kg_stirrup_w,
        ordered_kg: ordered_kg_long + ordered_kg_stirrup,
        total_bars_ordered: n_bars_long + n_bars_stirrup,
        total_leftover_length: (ordered_length_long - lm_long_w) + (ordered_length_stirrup - lm_stirrup_w),
      }
  };
}


export function getAggregatedRoomBreakdown(rooms: Room[], settings: CalculationDefaults): AggregatedRoomGroup[] {
  const roomGroups = new Map<string, { rooms: Room[], calcs: RoomCalculation }>();

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
