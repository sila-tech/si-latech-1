'use client';

import {
  doc,
  collection,
  Firestore,
  DocumentReference,
} from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from './non-blocking-updates';
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

export function saveProject(
  db: Firestore,
  userId: string,
  projectData: Omit<ProjectData, 'id' | 'updatedAt' | 'purchasedAt' | 'status'> & { id?: string; createdAt: string, status?: 'pending' | 'purchased' }
): Promise<string | undefined> {
  const { id, ...dataToSave } = projectData;
  const timestamp = new Date().toISOString();
  
  if (id) {
    // Update existing project
    const projectRef = doc(db, 'customers', userId, 'projects', id);
    updateDocumentNonBlocking(projectRef, { ...dataToSave, updatedAt: timestamp });
    return Promise.resolve(id);
  } else {
    // Create new project
    const projectsColRef = collection(db, 'customers', userId, 'projects');
    const docPromise = addDocumentNonBlocking(projectsColRef, { ...dataToSave, status: 'pending', createdAt: timestamp });
    return docPromise.then(docRef => docRef?.id);
  }
}

export function updateProjectStatus(
  projectRef: DocumentReference,
  status: 'pending' | 'purchased'
) {
  const updateData: { status: string; purchasedAt?: string, updatedAt: string } = {
    status,
    updatedAt: new Date().toISOString(),
  };
  if (status === 'purchased') {
    updateData.purchasedAt = new Date().toISOString();
  }
  updateDocumentNonBlocking(projectRef, updateData);
}
