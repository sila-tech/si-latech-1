
'use client';

import {
  doc,
  collection,
  Firestore,
  DocumentReference,
  serverTimestamp,
} from 'firebase/firestore';
import { updateDocumentNonBlocking } from './non-blocking-updates';
import type { Room, CalculationDefaults } from '@/lib/calculator';

export interface PlanRoomData {
  name: string;
  length: number;
  width: number;
  shape?: 'rectangular' | 'trapezium';
  trapezium?: {
    startSpan: number;
    endSpan: number;
    runLength: number;
    slantEdge?: number;
  };
  blockName?: string;
  apartmentName?: string;
  sequenceInApartment?: number;
  boundingBox?: [number, number, number, number] | number[];
  confidence?: number;
  aspectRatioWarning?: boolean;
}

export interface PlanData {
  imageUri?: string;
  parsedRooms?: PlanRoomData[];
  detectedScale?: string;
  detectedUnits?: string;
  scalePixelsPerMeter?: number;
}

export interface ProjectData {
  id?: string;
  name: string;
  clientName?: string;
  clientContact?: string;
  projectLocation?: string;
  contactPerson?: string;
  rooms: Room[];
  settings: CalculationDefaults;
  lintelLength: number;
  buildingBlocks?: any[];
  planData?: PlanData;
  displayUnit?: 'm' | 'ft';
  costEstimationEnabled?: boolean;
  pricingRates?: Record<string, number>;
  calculatedTotals?: Record<string, any>;
  totals?: Record<string, any>;
  status?: 'pending' | 'expected' | 'running' | 'finished' | 'purchased';
  assignedTo?: string;
  salesRep?: string;
  salesRepName?: string;
  leadStatus?: 'measurement_booked' | 'measured' | 'quoted' | 'negotiation' | 'won' | 'lost';
  conversionStatus?: 'pending' | 'in_progress' | 'converted' | 'lost';
  bookedAt?: any;
  measurementDate?: string | null;
  conversations?: any[];
  discountType?: 'none' | 'percent' | 'amount';
  discountValue?: number;
  paymentMethods?: string[];
  customPaymentNotes?: string;
  clientChangeRequestNotes?: string;
  createdAt?: any;
  updatedAt?: any;
  purchasedAt?: string;
}

export function updateProjectStatus(
  projectRef: DocumentReference,
  status: 'pending' | 'purchased'
) {
  const updateData: { status: string; purchasedAt?: string, updatedAt: any } = {
    status,
    updatedAt: serverTimestamp(),
  };
  if (status === 'purchased') {
    updateData.purchasedAt = new Date().toISOString();
  }
  updateDocumentNonBlocking(projectRef, updateData);
}

export function updateProjectData(
  projectRef: DocumentReference,
  data: Partial<ProjectData>
) {
  const updateData = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  updateDocumentNonBlocking(projectRef, updateData);
}
