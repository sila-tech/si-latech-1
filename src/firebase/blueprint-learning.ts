'use client';

/**
 * @fileOverview Active Learning & Dataset Logger for AI Blueprint Analysis.
 *
 * Logs user-verified ground-truth rooms, image URI, and scale data to Firestore
 * to build an accurate training and evaluation dataset for future ML model fine-tuning.
 */

import { addDoc, collection, serverTimestamp, Firestore } from 'firebase/firestore';
import type { PlanRoomData } from './data-manager';

export interface BlueprintTrainingSample {
  detectedScale?: string;
  detectedUnits?: string;
  scalePixelsPerMeter?: number;
  originalAiRooms?: PlanRoomData[];
  verifiedRooms: PlanRoomData[];
  roomCount: number;
  totalFloorAreaM2: number;
  hasUserCorrections: boolean;
  timestamp?: any;
}

export async function logBlueprintActiveLearning(
  firestore: Firestore | null | undefined,
  sample: {
    detectedScale?: string;
    detectedUnits?: string;
    scalePixelsPerMeter?: number;
    originalAiRooms?: PlanRoomData[];
    verifiedRooms: PlanRoomData[];
  }
) {
  if (!firestore) return;

  try {
    const verifiedRooms = sample.verifiedRooms || [];
    const originalRooms = sample.originalAiRooms || [];
    
    // Calculate total floor area
    const totalFloorAreaM2 = verifiedRooms.reduce((sum, r) => sum + (r.length * r.width), 0);
    
    // Determine if user modified the AI detections
    const hasUserCorrections = 
      verifiedRooms.length !== originalRooms.length ||
      verifiedRooms.some((vr, idx) => {
        const ar = originalRooms[idx];
        if (!ar) return true;
        return vr.name !== ar.name || vr.length !== ar.length || vr.width !== ar.width;
      });

    const payload: BlueprintTrainingSample = {
      detectedScale: sample.detectedScale || 'Unspecified',
      detectedUnits: sample.detectedUnits || 'mm',
      scalePixelsPerMeter: sample.scalePixelsPerMeter,
      originalAiRooms: originalRooms.map(r => ({
        name: r.name,
        length: r.length,
        width: r.width,
        blockName: r.blockName,
        apartmentName: r.apartmentName,
        boundingBox: r.boundingBox,
      })),
      verifiedRooms: verifiedRooms.map(r => ({
        name: r.name,
        length: r.length,
        width: r.width,
        blockName: r.blockName,
        apartmentName: r.apartmentName,
        boundingBox: r.boundingBox,
      })),
      roomCount: verifiedRooms.length,
      totalFloorAreaM2: Math.round(totalFloorAreaM2 * 100) / 100,
      hasUserCorrections,
      timestamp: serverTimestamp(),
    };

    const colRef = collection(firestore, 'blueprint_training_samples');
    await addDoc(colRef, payload);
    console.log('Successfully logged blueprint active learning sample for ML continuous improvement.');
  } catch (err) {
    // Non-blocking background log
    console.warn('Active learning sample log skipped:', err);
  }
}
