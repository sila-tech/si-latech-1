
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

export interface ProjectData {
  id?: string;
  name: string;
  rooms: Room[];
  settings: CalculationDefaults;
  lintelLength: number;
  status: 'pending' | 'purchased';
  createdAt: string;
  updatedAt?: string;
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
