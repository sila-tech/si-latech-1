
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
  blockName?: string;
  apartmentName?: string;
  sequenceInApartment?: number;
  boundingBox?: [number, number, number, number];
}

export interface PlanData {
  imageUri?: string;
  parsedRooms?: PlanRoomData[];
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
