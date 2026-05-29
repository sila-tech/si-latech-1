
/**
 * @fileoverview Core calculation logic for the SI-LATECH Beam and Block Slab system.
 */

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
  num_longitudinal: number;
  dia_longitudinal: number;
  dia_stirrup: number;
  stirrup_spacing: number;
  cover: number;
  hook_length: number;
  steel_wastage_pct: number;
  standard_bar_length: number;
  beamType?: 'flat' | 'tbeam';
}

export interface RoomCalculation {
  length: number;
  width: number;
  shorter: number;
  longer: number;
  actualBeamCount: number;
  profitBeams: number;
  invoiceBeamCount: number;
  beamSpaces: number;
  blocksPerBeamRow: number;
  totalBlocks: number;
  individualBeamLength: number;
  actualTotalBeamLength: number;
  invoiceTotalBeamLength: number;
  profitBeamLength: number;
  beamProfitValue: number;
  blockCommission: number;
  totalRoomProfit: number;
  layout: {
    gapAtEnd: number;
    needsExtraBeam: boolean;
    needsHalfBlock: boolean;
    beamSpacing: number;
    beamWidth: number;
    unitSpan: number;
    beamCount: number;
    blocksPerRow: number;
  };
  // Validation and Physical Layout fields
  physicalBeamCount: number;
  excessBeamCount: number;
  excessBlockCount: number;
  physicalEndGap: number;
  remainingVoidSpaceMm: number;
  structuralWarning?: string;
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
  beamSpacing: 0.40,
  beamSectionW: 0.15,  // beam is 150mm wide
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
  blockCommissionRate: 5, 
  lintelHeight: 0.40,
  lintelWidth: 0.20,
  timber3x2Spacing: 0.6,
  timber6x1PerimeterMultiplier: 6,
  propSpacing: 0.6,
  num_longitudinal: 4,
  dia_longitudinal: 12,
  dia_stirrup: 8,
  stirrup_spacing: 0.20,
  cover: 0.03,
  hook_length: 0.10,
  steel_wastage_pct: 5,
  standard_bar_length: 12.0,
  beamType: 'flat',
};

const ceil = (v: number) => Math.ceil(v);
const METERS_TO_FEET = 3.28084;

export function calcRoomBlocksAndBeams(
  lengthMeters: number,
  widthMeters: number,
  opts: Partial<CalculationDefaults> = {},
  beamPricePerMeter: number = 545,
  roomName: string = '',
  optimizeExcess: boolean = true
): RoomCalculation {
  const C = { ...DEFAULTS, ...opts };
  const area = lengthMeters * widthMeters;
  const beamPrice = C.beamType === 'tbeam' ? 1250 : (beamPricePerMeter === 545 ? 545 : beamPricePerMeter);

  const shorter = Math.min(lengthMeters, widthMeters);
  const longer = Math.max(lengthMeters, widthMeters);

  // --- 1. GEOMETRIC PHYSICAL CALCULATION ---
  // 0.55m is the CLEAR gap between beam faces (not centre-to-centre).
  // Beam width = 0.20m, so each beam+gap unit along the longer span = 0.75m.
  //
  // Layout pattern:
  //   Wall | 0.55m gap | 0.20m beam | 0.55m gap | 0.20m beam | ... | end gap | Wall
  //
  // First gap is always 0.55m. After that, each beam costs 0.75m.
  // beamCount = floor((longer - clearGap) / unitSpan)
  const clearGap = C.beamSpacing;        // clear face-to-face gap (0.40m)
  const beamWidth = C.beamSectionW;      // beam width (0.15m)
  const unitSpan = 0.55;                 // 0.55m standard spacing unit (clearGap + beamWidth)

  let actualBeamCount = 0;
  let endGap = 0;

  const isBalcony = roomName.toLowerCase().includes('balcony') || 
                    roomName.toLowerCase().includes('verandah') || 
                    roomName.toLowerCase().includes('velander') || 
                    roomName.toLowerCase().includes('veranda') || 
                    roomName.toLowerCase().includes('velanda');

  if (longer > 0) {
    if (isBalcony) {
      // Balcony / Verandah: Beams run parallel to the longer side, laid across the shorter side
      actualBeamCount = Math.ceil(shorter / 0.55);
      
      const lastBeamEnd = (actualBeamCount - 1) * 0.55 + 0.15;
      endGap = Math.max(0, shorter - lastBeamEnd);
    } else {
      // Standard rooms: Beams run parallel to the shorter side, laid across the longer side
      actualBeamCount = Math.ceil(longer / 0.55);
      
      const lastBeamEnd = (actualBeamCount - 1) * 0.55 + 0.15;
      endGap = Math.max(0, longer - lastBeamEnd);
    }
  }

  actualBeamCount = Math.max(0, actualBeamCount);

  // --- Layout Validation and Physical Checks ---
  const spanLength = isBalcony ? shorter : longer;
  const physicalBeamCount = spanLength > 0 ? Math.max(0, Math.floor(((spanLength - 0.15) / 0.55) + 1e-9) + 1) : 0;

  const excessBeamCount = optimizeExcess ? 0 : Math.max(0, actualBeamCount - physicalBeamCount);
  const clearBeamLength = isBalcony ? longer : shorter;
  const blocksPerBeamRow = clearBeamLength > 0 ? clearBeamLength * 4 : 0;
  const excessBlockCount = optimizeExcess ? 0 : excessBeamCount * blocksPerBeamRow;

  const lastPhysicalBeamEnd = physicalBeamCount > 0 ? (physicalBeamCount - 1) * 0.55 + 0.15 : 0;
  const physicalEndGap = spanLength > 0 ? Math.max(0, spanLength - lastPhysicalBeamEnd) : 0;

  let remainingVoidSpaceMm = 0;
  let structuralWarning = "";

  if (physicalEndGap >= 0.40) {
    remainingVoidSpaceMm = Math.round((physicalEndGap - 0.40) * 1000);
  } else if (physicalEndGap >= 0.20) {
    remainingVoidSpaceMm = Math.round((physicalEndGap - 0.20) * 1000);
  } else {
    remainingVoidSpaceMm = Math.round(physicalEndGap * 1000);
  }

  if (excessBeamCount > 0) {
    const overflow = (actualBeamCount - 1) * 0.55 + 0.15 - spanLength;
    structuralWarning = `This room has ${excessBeamCount} excess beam(s) and ${excessBlockCount} excess block(s) that extend beyond the room boundary by ${(overflow * 1000).toFixed(0)}mm.`;
  }

  // Determine whether to use optimized physical counts or standard counts for calculations
  const effectiveBeamCount = optimizeExcess ? physicalBeamCount : actualBeamCount;

  // Owner's master formula for blocks: total blocks = total beam metres * 4
  // For Balcony, beam length is `longer`. For Standard, beam length is `shorter`.
  const individualBeamLength = clearBeamLength > 0 ? clearBeamLength + 0.20 : 0;

  // Blocks are laid between the walls (clear span)
  const actualTotalBlocks = effectiveBeamCount * blocksPerBeamRow;
  const actualTotalBeamLength = effectiveBeamCount * individualBeamLength;

  // --- 2. HARDCODED CONDITIONAL BILLING ---
  let invoiceTotalBeamLength: number;
  let invoiceBeamCount: number;
  
  // Detect if this is a "Quick Quote" (Meter Square) or a manual "Room"
  const isAreaMode = roomName.toLowerCase().includes('project area');

  if (isAreaMode) {
    // METRE SQUARE MODE: Multiply Area by 2.4
    invoiceTotalBeamLength = area * 2.4;
    invoiceBeamCount = shorter > 0 ? ceil(invoiceTotalBeamLength / shorter) : 0;
  } else if (isBalcony) {
    // BALCONY / VERANDAH MODE: Add 1 profit beam
    const profitBeamsPerBalcony = 1;
    invoiceBeamCount = effectiveBeamCount + profitBeamsPerBalcony;
    invoiceTotalBeamLength = invoiceBeamCount * individualBeamLength;
  } else {
    // ROOM MODE: Actual Beams + 2 Beams
    const profitBeamsPerRoom = 2;
    invoiceBeamCount = effectiveBeamCount + profitBeamsPerRoom;
    invoiceTotalBeamLength = invoiceBeamCount * individualBeamLength;
  }

  // Blocks: geometric count — every space between supports × blocks per space
  const totalBlocks = actualTotalBlocks;

  // --- 3. PROFIT CALCULATION ---
  const profitBeamLength = invoiceTotalBeamLength - actualTotalBeamLength;
  const beamProfitValue = profitBeamLength * beamPrice;
  const blockCommission = totalBlocks * C.blockCommissionRate;
  const totalRoomProfit = beamProfitValue + blockCommission;
  
  return {
    length: lengthMeters,
    width: widthMeters,
    shorter,
    longer,
    individualBeamLength,
    actualBeamCount: effectiveBeamCount, // Report optimized count if optimized
    profitBeams: invoiceBeamCount - effectiveBeamCount,
    invoiceBeamCount,
    beamSpaces: effectiveBeamCount > 0 ? effectiveBeamCount - 1 : 0,
    blocksPerBeamRow,
    totalBlocks,
    actualTotalBeamLength,
    invoiceTotalBeamLength,
    profitBeamLength,
    beamProfitValue,
    blockCommission,
    totalRoomProfit,
    layout: {
      gapAtEnd: optimizeExcess ? physicalEndGap : endGap,
      needsExtraBeam: (optimizeExcess ? physicalEndGap : endGap) > clearGap,
      needsHalfBlock: (optimizeExcess ? physicalEndGap : endGap) > 0 && (optimizeExcess ? physicalEndGap : endGap) <= clearGap,
      beamSpacing: clearGap,
      beamWidth: beamWidth,
      unitSpan: unitSpan,
      beamCount: effectiveBeamCount,
      blocksPerRow: blocksPerBeamRow,
    },
    physicalBeamCount,
    excessBeamCount,
    excessBlockCount,
    physicalEndGap,
    remainingVoidSpaceMm,
    structuralWarning
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

  const totalParts = C.concreteMixRatioCement + C.concreteMixRatioSand + C.concreteMixRatioBallast;
  const V_dry = V_wet * C.dryVolumeFactor;
  const wastage_factor = 1 + (C.wastagePercentage / 100);

  if (totalParts === 0) {
    return { area, wetVolume: V_wet, dryVolume: 0, cementBags: 0, sandTonnes: 0, ballastTonnes: 0, sandWheelbarrows: 0, ballastWheelbarrows: 0 };
  }

  const V_cement = (C.concreteMixRatioCement / totalParts) * V_dry;
  const V_sand = (C.concreteMixRatioSand / totalParts) * V_dry;
  const V_agg = (C.concreteMixRatioBallast / totalParts) * V_dry;
  
  const m_cement_w = V_cement * C.cementBulkDensity * wastage_factor;
  const m_sand_w = V_sand * C.sandBulkDensity * wastage_factor;
  const m_agg_w = V_agg * C.aggregateBulkDensity * wastage_factor;

  const bags = C.cementBagWeight > 0 ? ceil(m_cement_w / C.cementBagWeight) : 0;
  const sand_t = m_sand_w / 1000;
  const agg_t = m_agg_w / 1000;

  return { 
    area, wetVolume: V_wet, dryVolume: V_dry, cementBags: bags, sandTonnes: sand_t, ballastTonnes: agg_t,
    sandWheelbarrows: ceil(sand_t * C.wheelbarrowsPerTonne),
    ballastWheelbarrows: ceil(agg_t * C.wheelbarrowsPerTonne)
  };
}

export function calcLintelConcrete(
    totalLintelLength: number,
    opts: Partial<CalculationDefaults> = {}
): LintelCalculation {
    const C = { ...DEFAULTS, ...opts };
    const wetVolume = totalLintelLength * C.lintelHeight * C.lintelWidth;
    const dryVolume = wetVolume * C.dryVolumeFactor;
    const totalParts = C.concreteMixRatioCement + C.concreteMixRatioSand + C.concreteMixRatioBallast;
    const wastageFactor = 1 + (C.wastagePercentage / 100);

    const cementVolume = totalParts > 0 ? (C.concreteMixRatioCement / totalParts) * dryVolume : 0;
    const sandVolume = totalParts > 0 ? (C.concreteMixRatioSand / totalParts) * dryVolume : 0;
    const ballastVolume = totalParts > 0 ? (C.concreteMixRatioBallast / totalParts) * dryVolume : 0;

    const cementMassWastage = cementVolume * C.cementBulkDensity * wastageFactor;
    const sandMassWastage = sandVolume * C.sandBulkDensity * wastageFactor;
    const ballastMassWastage = ballastVolume * C.aggregateBulkDensity * wastageFactor;

    return {
        totalLintelLength, crossSectionalArea: C.lintelHeight * C.lintelWidth, wetVolume, dryVolume,
        cementVolume, sandVolume, ballastVolume,
        cementMassWastage, sandMassWastage, ballastMassWastage,
        cementBags: C.cementBagWeight > 0 ? ceil(cementMassWastage / C.cementBagWeight) : 0,
        sandTonnes: sandMassWastage / 1000,
        ballastTonnes: ballastMassWastage / 1000
    };
}

export function calcBRC(totalArea: number, opts: Partial<CalculationDefaults> = {}): BrcCalculation {
  const C = { ...DEFAULTS, ...opts };
  const areaPerRoll = C.brcRollWidth * C.brcRollLength;
  const rollsNeeded = areaPerRoll > 0 ? ceil(totalArea / areaPerRoll) : 0;
  return { areaPerRoll, rollsNeeded, metresOfBRC: rollsNeeded * C.brcRollLength };
}

export function calcTimberAndProps(room: Room, opts: Partial<CalculationDefaults> = {}): TimberAndPropsCalculation {
  const C = { ...DEFAULTS, ...opts };
  const shorter = Math.min(room.length, room.width);
  const longer = Math.max(room.length, room.width);
  const pieces3x2 = C.timber3x2Spacing > 0 ? ceil(shorter / C.timber3x2Spacing) + 1 : 0;
  const total3x2m = pieces3x2 * longer;
  const total6x1m = 2 * (room.length + room.width) * C.timber6x1PerimeterMultiplier;
  return { pieces3x2, lengthEach3x2: longer, total3x2m, total3x2ft: total3x2m * METERS_TO_FEET, perimeter: 2 * (room.length + room.width), total6x1m, total6x1ft: total6x1m * METERS_TO_FEET };
}

const calcUnitWeight = (diameter: number) => 0.006165 * Math.pow(diameter, 2);

export function calcLintelSteel(totalLintelLength: number, opts: Partial<CalculationDefaults> = {}): LintelSteelCalculation {
  const C = { ...DEFAULTS, ...opts };
  const wastageFactor = 1 + C.steel_wastage_pct / 100;
  
  const w_long = calcUnitWeight(C.dia_longitudinal);
  const lm_long_w = totalLintelLength * C.num_longitudinal * wastageFactor;
  const n_bars_long = C.standard_bar_length > 0 ? ceil(lm_long_w / C.standard_bar_length) : 0;

  const w_stirrup = calcUnitWeight(C.dia_stirrup);
  const stirrups_count = C.stirrup_spacing > 0 ? ceil(totalLintelLength / C.stirrup_spacing) : 0;
  const stirrup_perim = 2 * ((C.lintelWidth - 2 * C.cover) + (C.lintelHeight - 2 * C.cover));
  const lm_stirrup_w = stirrups_count * (stirrup_perim + 2 * C.hook_length) * wastageFactor;
  const n_bars_stirrup = C.standard_bar_length > 0 ? ceil(lm_stirrup_w / C.standard_bar_length) : 0;

  return {
      longitudinal: { diameter: C.dia_longitudinal, unitWeight: w_long, linearMetersRequired: totalLintelLength * C.num_longitudinal, linearMetersWithWastage: lm_long_w, massRequired: totalLintelLength * C.num_longitudinal * w_long, massWithWastage: lm_long_w * w_long, barsToOrder: n_bars_long, orderedLength: n_bars_long * C.standard_bar_length, orderedMass: n_bars_long * C.standard_bar_length * w_long, leftoverLength: (n_bars_long * C.standard_bar_length) - lm_long_w },
      stirrups: { diameter: C.dia_stirrup, count: stirrups_count, lengthEach: stirrup_perim + 2 * C.hook_length, unitWeight: w_stirrup, linearMetersRequired: stirrups_count * (stirrup_perim + 2 * C.hook_length), linearMetersWithWastage: lm_stirrup_w, massRequired: stirrups_count * (stirrup_perim + 2 * C.hook_length) * w_stirrup, massWithWastage: lm_stirrup_w * w_stirrup, barsToOrder: n_bars_stirrup, orderedLength: n_bars_stirrup * C.standard_bar_length, orderedMass: n_bars_stirrup * C.standard_bar_length * w_stirrup, leftoverLength: (n_bars_stirrup * C.standard_bar_length) - lm_stirrup_w },
      totals: { lm_with_waste: lm_long_w + lm_stirrup_w, kg_with_waste: (lm_long_w * w_long) + (lm_stirrup_w * w_stirrup), ordered_kg: (n_bars_long * C.standard_bar_length * w_long) + (n_bars_stirrup * C.standard_bar_length * w_stirrup), total_bars_ordered: n_bars_long + n_bars_stirrup, total_leftover_length: (n_bars_long * C.standard_bar_length - lm_long_w) + (n_bars_stirrup * C.standard_bar_length - lm_stirrup_w) }
  };
}

export function getAggregatedRoomBreakdown(rooms: Room[], settings: CalculationDefaults, optimizeExcess: boolean = true): AggregatedRoomGroup[] {
  const roomGroups = new Map<string, { rooms: Room[], calcs: RoomCalculation }>();
  rooms.forEach(room => {
      const calcs = calcRoomBlocksAndBeams(room.length, room.width, settings, settings.beamType === 'tbeam' ? 1250 : 545, room.name, optimizeExcess);
      const sizeKey = `${calcs.shorter.toFixed(2)}x${calcs.longer.toFixed(2)}`;
      if (!roomGroups.has(sizeKey)) roomGroups.set(sizeKey, { rooms: [], calcs });
      roomGroups.get(sizeKey)!.rooms.push(room);
  });
  return Array.from(roomGroups.entries()).map(([sizeKey, group]) => ({
      sizeKey, shorter: group.calcs.shorter, longer: group.calcs.longer, roomCount: group.rooms.length,
      beamsPerRoom: group.calcs.actualBeamCount, beamLengthEach: group.calcs.individualBeamLength, totalBeams: group.calcs.actualBeamCount * group.rooms.length, totalBeamLength: group.calcs.actualBeamCount * group.rooms.length * group.calcs.individualBeamLength,
      blocksPerRoom: group.calcs.totalBlocks, totalBlocks: group.calcs.totalBlocks * group.rooms.length
  })).sort((a, b) => (b.shorter * b.longer) - (a.shorter * a.longer));
}

export function calculateProjectTotals(
  rooms: Room[],
  settings: CalculationDefaults,
  lintelLength: number = 0,
  optimizeExcess: boolean = true
): any {
  const initialTotals = {
    totalArea: 0,
    totalBlocks: 0,
    totalActualBeamLength: 0,
    totalInvoiceBeamLength: 0,
    totalProfitBeamLength: 0,
    totalBeamProfitValue: 0,
    totalBlockCommission: 0,
    totalProjectProfit: 0,
    totalConcreteVolume: 0,
    totalCementBags: 0,
    totalSandTonnes: 0,
    totalBallastTonnes: 0,
    wastagePercentage: settings.wastagePercentage || 0,
    beamType: settings.beamType || 'flat',
    timber: {
      total3x2pieces: 0,
      total3x2m: 0,
      total3x2ft: 0,
      total6x1m: 0,
      total6x1ft: 0,
      totalProps: 0,
    }
  };

  const perRoomCalculations = rooms.map((r) => {
    const roomCalcs = calcRoomBlocksAndBeams(r.length, r.width, settings, settings.beamType === 'tbeam' ? 1250 : 545, r.name, optimizeExcess);
    const concreteCalcs = calcConcrete(roomCalcs, settings);
    const brcCalcs = calcBRC(concreteCalcs.area, settings);
    const timberCalcs = calcTimberAndProps(r, settings);
    return { room: r, roomCalcs, concreteCalcs, brcCalcs, timberCalcs };
  });

  const totalLintelLength = lintelLength > 0 ? lintelLength : rooms.reduce((sum, room) => {
      return sum + 2 * (room.length + room.width);
  }, 0);

  const aggregated = perRoomCalculations.reduce((acc, p) => {
    acc.totalArea += p.concreteCalcs.area;
    acc.totalBlocks += p.roomCalcs.totalBlocks;
    acc.totalActualBeamLength += p.roomCalcs.actualTotalBeamLength;
    acc.totalInvoiceBeamLength += p.roomCalcs.invoiceTotalBeamLength;
    acc.totalConcreteVolume += p.concreteCalcs.wetVolume;
    acc.totalCementBags += p.concreteCalcs.cementBags;
    acc.totalSandTonnes += p.concreteCalcs.sandTonnes;
    acc.totalBallastTonnes += p.concreteCalcs.ballastTonnes;
    
    acc.totalBeamProfitValue += p.roomCalcs.beamProfitValue;
    acc.totalBlockCommission += p.roomCalcs.blockCommission;
    acc.totalProjectProfit += p.roomCalcs.totalRoomProfit;

    acc.timber.total3x2pieces += p.timberCalcs.pieces3x2;
    acc.timber.total3x2m += p.timberCalcs.total3x2m;
    acc.timber.total3x2ft += p.timberCalcs.total3x2ft;
    acc.timber.total6x1m += p.timberCalcs.total6x1m;
    acc.timber.total6x1ft += p.timberCalcs.total6x1ft;
    
    return acc;
  }, initialTotals);

  aggregated.totalProfitBeamLength = aggregated.totalInvoiceBeamLength - aggregated.totalActualBeamLength;
  
  if (settings.propSpacing > 0) {
    aggregated.timber.totalProps = Math.ceil(aggregated.timber.total3x2m / settings.propSpacing);
  }

  const brc = calcBRC(aggregated.totalArea, settings);
  const lintel = calcLintelConcrete(totalLintelLength, settings);
  const lintelSteel = calcLintelSteel(totalLintelLength, settings);
  aggregated.totalCementBags = Math.ceil(aggregated.totalCementBags);

  return {
    ...aggregated,
    brc,
    totalLintelLength,
    lintel,
    lintelSteel,
  };
}

