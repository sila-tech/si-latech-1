'use client';

import {
  doc,
  collection,
  Firestore,
} from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from './non-blocking-updates';
import type { Room, CalculationDefaults } from '@/lib/calculator';

export interface ProjectData {
  id?: string;
  name: string;
  rooms: Room[];
  settings: CalculationDefaults;
  lintelLength: number;
  createdAt: string;
  updatedAt?: string;
}

export function saveProject(
  db: Firestore,
  userId: string,
  projectData: Omit<ProjectData, 'id' | 'updatedAt'> & { id?: string }
) {
  const { id, ...dataToSave } = projectData;
  const timestamp = new Date().toISOString();
  
  if (id) {
    // Update existing project
    const projectRef = doc(db, 'customers', userId, 'projects', id);
    updateDocumentNonBlocking(projectRef, { ...dataToSave, updatedAt: timestamp });
  } else {
    // Create new project
    const projectsColRef = collection(db, 'customers', userId, 'projects');
    addDocumentNonBlocking(projectsColRef, { ...dataToSave, createdAt: timestamp });
  }
}
