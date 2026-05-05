
'use client';

import React, { createContext, useContext, useState, useMemo, ReactNode, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type {
  Room,
  CalculationDefaults,
  RoomCalculation,
  ConcreteCalculation,
  BrcCalculation,
  AggregatedRoomGroup,
  LintelCalculation,
  TimberAndPropsCalculation,
  LintelSteelCalculation,
} from '@/lib/calculator';
import {
  DEFAULTS,
  calcRoomBlocksAndBeams,
  calcConcrete,
  calcBRC,
  calcLintelConcrete,
  getAggregatedRoomBreakdown,
  calcTimberAndProps,
  calcLintelSteel,
} from '@/lib/calculator';
import { useFirebase } from '@/firebase';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { updateProjectData } from '@/firebase/data-manager';


export interface ProjectData {
  id: string;
  name: string;
  clientName?: string;
  clientContact?: string;
  projectLocation?: string;
  contactPerson?: string;
  rooms: Room[];
  settings: CalculationDefaults;
  lintelLength: number;
  createdAt: Timestamp;
}

export type ProjectDetails = {
    name: string;
    clientName?: string;
    clientContact?: string;
    projectLocation?: string;
    contactPerson?: string;
};


type PerRoomCalculation = {
  room: Room;
  roomCalcs: RoomCalculation;
  concreteCalcs: ConcreteCalculation;
  brcCalcs: BrcCalculation;
  timberCalcs: TimberAndPropsCalculation;
};

type ProjectTotals = {
  totalArea: number;
  totalBlocks: number;
  totalActualBeamLength: number;
  totalInvoiceBeamLength: number;
  totalProfitBeamLength: number;
  totalBeamProfitValue: number;
  totalBlockCommission: number;
  totalProjectProfit: number;
  totalLintelLength: number;
  totalConcreteVolume: number;
  totalCementBags: number;
  totalSandTonnes: number;
  totalBallastTonnes: number;
  wastagePercentage: number;
  brc: BrcCalculation;
  lintel: LintelCalculation;
  timber: {
    total3x2pieces: number;
    total3x2m: number;
    total3x2ft: number;
    total6x1m: number;
    total6x1ft: number;
    totalProps: number;
  };
  lintelSteel: LintelSteelCalculation;
};

interface CalculatorContextType {
  rooms: Room[];
  setRooms: (rooms: Room[]) => void;
  addRoom: () => void;
  updateRoom: (id: string, key: 'name' | 'length' | 'width', value: string | number) => void;
  deleteRoom: (id: string) => void;
  settings: CalculationDefaults;
  setSettings: React.Dispatch<React.SetStateAction<CalculationDefaults>>;
  lintelLength: number;
  setLintelLength: (length: number) => void;
  perRoomCalculations: PerRoomCalculation[];
  aggregatedBreakdown: AggregatedRoomGroup[];
  totals: ProjectTotals;
  clearCalculator: () => void;
  loadedProjectId: string | null;
  setLoadedProjectId: (id: string | null) => void;
  projectName: string;
  setProjectName: (name: string) => void;
  clientName: string;
  clientContact: string;
  projectLocation: string;
  contactPerson: string;
  logoUrl: string | null;
  setLogoUrl: (url: string | null) => void;
  saveProject: (details: ProjectDetails) => Promise<string | undefined>;
  loadProjectData: (projectData: ProjectData | null) => void;
}

const CalculatorContext = createContext<CalculatorContextType | undefined>(undefined);

const LOGO_STORAGE_KEY = 'silacalc-logo';

export const CalculatorProvider = ({ children }: { children: ReactNode }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [settings, setSettings] = useState<CalculationDefaults>(DEFAULTS);
  const [lintelLength, setLintelLength] = useState<number>(0);
  const [loadedProjectId, setLoadedProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientContact, setClientContact] = useState<string>('');
  const [projectLocation, setProjectLocation] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [logoUrl, setLogoUrlState] = useState<string | null>(null);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  // Auto-saving effect for Firestore
  useEffect(() => {
    if (!loadedProjectId || !firestore) {
      return;
    }

    const projectRef = doc(firestore, 'projects', loadedProjectId);

    const projectData = {
      name: projectName,
      clientName,
      clientContact,
      projectLocation,
      contactPerson,
      rooms,
      settings,
      lintelLength,
    };
    
    const handler = setTimeout(() => {
      updateProjectData(projectRef, projectData);
    }, 1000); // Save 1 second after the last change

    return () => {
      clearTimeout(handler);
    };
  }, [rooms, settings, lintelLength, projectName, clientName, clientContact, projectLocation, contactPerson, loadedProjectId, firestore]);

  const clearCalculator = useCallback(() => {
    setRooms([]);
    setSettings(DEFAULTS);
    setLintelLength(0);
    setLoadedProjectId(null);
    setProjectName('');
    setClientName('');
    setClientContact('');
    setProjectLocation('');
    setContactPerson('');
  }, []);

  const loadProjectData = useCallback((projectData: ProjectData | null) => {
    if (projectData?.id === loadedProjectId && projectData) return; // Avoid reloading the same project

    if (!projectData) {
      clearCalculator();
      return;
    }

    setRooms(projectData.rooms || []);
    setSettings(projectData.settings || DEFAULTS);
    setLintelLength(projectData.lintelLength || 0);
    setLoadedProjectId(projectData.id);
    setProjectName(projectData.name);
    setClientName(projectData.clientName || '');
    setClientContact(projectData.clientContact || '');
    setProjectLocation(projectData.projectLocation || '');
    setContactPerson(projectData.contactPerson || '');

  }, [clearCalculator, loadedProjectId]);


  useEffect(() => {
    try {
      const storedLogo = localStorage.getItem(LOGO_STORAGE_KEY);
      if (storedLogo) {
        setLogoUrlState(storedLogo);
      }
    } catch (error) {
      console.error("Failed to load logo from localStorage:", error);
    }
  }, []);

  const setLogoUrl = (url: string | null) => {
    try {
      if (url) {
        localStorage.setItem(LOGO_STORAGE_KEY, url);
      } else {
        localStorage.removeItem(LOGO_STORAGE_KEY);
      }
    } catch (error) {
      console.warn("Could not save logo to localStorage", error);
    }
    setLogoUrlState(url);
  };


  const saveProject = useCallback(async (details: ProjectDetails) => {
    if (!firestore) {
      toast({ title: 'Error', description: 'Database connection not available.', variant: 'destructive' });
      return;
    }

    const { name, ...clientDetails } = details;

    if (!name.trim()) {
      toast({ title: 'Error', description: 'Project name is required.', variant: 'destructive' });
      return;
    }

    const projectDataToSave = {
        name,
        ...clientDetails,
        rooms,
        settings,
        lintelLength,
    };
    
    if (loadedProjectId) {
      const projectRef = doc(firestore, 'projects', loadedProjectId);
      updateProjectData(projectRef, projectDataToSave);
      toast({ title: 'Project Updated', description: `Project "${name}" has been updated.` });
      // Update local state as well
      setProjectName(name);
      setClientName(clientDetails.clientName || '');
      setClientContact(clientDetails.clientContact || '');
      setProjectLocation(clientDetails.projectLocation || '');
      setContactPerson(clientDetails.contactPerson || '');
      return loadedProjectId;
    }

    const collectionRef = collection(firestore, 'projects');
    const newProjectData = {
      ...projectDataToSave,
      status: 'pending' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    try {
      const docRef = await addDoc(collectionRef, newProjectData);
      setLoadedProjectId(docRef.id);
      setProjectName(name);
      setClientName(clientDetails.clientName || '');
      setClientContact(clientDetails.clientContact || '');
      setProjectLocation(clientDetails.projectLocation || '');
      setContactPerson(clientDetails.contactPerson || '');
      toast({ title: 'Project Saved', description: `Project "${name}" has been created.` });
      return docRef.id;
    } catch (error) {
      console.error("Failed to create project:", error);
      toast({ title: 'Error', description: 'Could not create new project.', variant: 'destructive' });
    }
  }, [loadedProjectId, rooms, settings, lintelLength, firestore, toast]);


  const addRoom = () => {
    setRooms([
      ...rooms,
      {
        id: crypto.randomUUID(),
        name: `Room ${rooms.length + 1}`,
        length: 0,
        width: 0,
      },
    ]);
  };

  const updateRoom = (id: string, key: 'name' | 'length' | 'width', value: string | number) => {
    setRooms(
      rooms.map((room) =>
        room.id === id ? { ...room, [key]: value } : room
      )
    );
  };

  const deleteRoom = (id: string) => {
    setRooms(rooms.filter((room) => room.id !== id));
  };
  

  const perRoomCalculations: PerRoomCalculation[] = useMemo(() => {
    const BEAM_PRICE_PER_METER = 145; 
    return rooms.map((r) => {
      const roomCalcs = calcRoomBlocksAndBeams(r.length, r.width, settings, BEAM_PRICE_PER_METER, r.name);
      const concreteCalcs = calcConcrete(roomCalcs, settings);
      const brcCalcs = calcBRC(concreteCalcs.area, settings);
      const timberCalcs = calcTimberAndProps(r, settings);
      return { room: r, roomCalcs, concreteCalcs, brcCalcs, timberCalcs };
    });
  }, [rooms, settings]);

  const aggregatedBreakdown: AggregatedRoomGroup[] = useMemo(() => {
    return getAggregatedRoomBreakdown(rooms, settings);
  }, [rooms, settings]);


  const totals: ProjectTotals = useMemo(() => {
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
      wastagePercentage: settings.wastagePercentage,
      timber: {
        total3x2pieces: 0,
        total3x2m: 0,
        total3x2ft: 0,
        total6x1m: 0,
        total6x1ft: 0,
        totalProps: 0,
      }
    };
    
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
  }, [perRoomCalculations, settings, rooms, lintelLength]);
  
  return (
    <CalculatorContext.Provider
      value={{
        rooms,
        setRooms,
        addRoom,
        updateRoom,
        deleteRoom,
        settings,
        setSettings,
        lintelLength,
        setLintelLength,
        perRoomCalculations,
        aggregatedBreakdown,
        totals,
        clearCalculator,
        loadedProjectId,
        setLoadedProjectId,
        projectName,
        setProjectName,
        clientName,
        clientContact,
        projectLocation,
        contactPerson,
        logoUrl,
        setLogoUrl,
        saveProject,
        loadProjectData,
      }}
    >
      {children}
    </CalculatorContext.Provider>
  );
};

export const useCalculator = (): CalculatorContextType => {
  const context = useContext(CalculatorContext);
  if (context === undefined) {
    throw new Error('useCalculator must be used within a CalculatorProvider');
  }
  return context;
};
