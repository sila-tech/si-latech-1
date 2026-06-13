
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
  BuildingBlock,
  ApartmentGroup,
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
  calculateProjectTotals,
  calcSharedWallDeduction,
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
  buildingBlocks?: BuildingBlock[];
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
  rawLintelLength: number;
  sharedWallDeduction: number;
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
  // Building Blocks
  buildingBlocks: BuildingBlock[];
  setBuildingBlocks: (blocks: BuildingBlock[]) => void;
  addBlock: () => void;
  updateBlockName: (blockId: string, name: string) => void;
  deleteBlock: (blockId: string) => void;
  addApartmentToBlock: (blockId: string) => void;
  updateApartmentName: (blockId: string, aptId: string, name: string) => void;
  deleteApartment: (blockId: string, aptId: string) => void;
  assignRoomToApartment: (blockId: string, aptId: string, roomId: string) => void;
  unassignRoomFromApartment: (blockId: string, aptId: string, roomId: string) => void;
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
  displayUnit: 'm' | 'ft';
  setDisplayUnit: (unit: 'm' | 'ft') => void;
}

const CalculatorContext = createContext<CalculatorContextType | undefined>(undefined);

const LOGO_STORAGE_KEY = 'silacalc-logo';

export const CalculatorProvider = ({ children }: { children: ReactNode }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [settings, setSettings] = useState<CalculationDefaults>(DEFAULTS);
  const [lintelLength, setLintelLength] = useState<number>(0);
  const [buildingBlocks, setBuildingBlocks] = useState<BuildingBlock[]>([]);
  const [loadedProjectId, setLoadedProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientContact, setClientContact] = useState<string>('');
  const [projectLocation, setProjectLocation] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [logoUrl, setLogoUrlState] = useState<string | null>(null);
  const [displayUnit, setDisplayUnit] = useState<'m' | 'ft'>('m');
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
      buildingBlocks,
    };
    
    const handler = setTimeout(() => {
      updateProjectData(projectRef, projectData);
    }, 1000); // Save 1 second after the last change

    return () => {
      clearTimeout(handler);
    };
  }, [rooms, settings, lintelLength, buildingBlocks, projectName, clientName, clientContact, projectLocation, contactPerson, loadedProjectId, firestore]);

  const clearCalculator = useCallback(() => {
    setRooms([]);
    setSettings(DEFAULTS);
    setLintelLength(0);
    setBuildingBlocks([]);
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
    setBuildingBlocks(projectData.buildingBlocks || []);
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

  // ─── Building Block Management ───────────────────────────────────────────────

  const addBlock = useCallback(() => {
    setBuildingBlocks(prev => [
      ...prev,
      { id: crypto.randomUUID(), name: `Block ${prev.length + 1}`, apartments: [] }
    ]);
  }, []);

  const updateBlockName = useCallback((blockId: string, name: string) => {
    setBuildingBlocks(prev => prev.map(b => b.id === blockId ? { ...b, name } : b));
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    setBuildingBlocks(prev => prev.filter(b => b.id !== blockId));
  }, []);

  const addApartmentToBlock = useCallback((blockId: string) => {
    setBuildingBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      return {
        ...b,
        apartments: [
          ...b.apartments,
          { id: crypto.randomUUID(), name: `Apt ${b.apartments.length + 1}`, roomIds: [] }
        ]
      };
    }));
  }, []);

  const updateApartmentName = useCallback((blockId: string, aptId: string, name: string) => {
    setBuildingBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      return {
        ...b,
        apartments: b.apartments.map(a => a.id === aptId ? { ...a, name } : a)
      };
    }));
  }, []);

  const deleteApartment = useCallback((blockId: string, aptId: string) => {
    setBuildingBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      return { ...b, apartments: b.apartments.filter(a => a.id !== aptId) };
    }));
  }, []);

  const assignRoomToApartment = useCallback((blockId: string, aptId: string, roomId: string) => {
    setBuildingBlocks(prev => {
      // First remove the room from any existing apartment
      const cleaned = prev.map(b => ({
        ...b,
        apartments: b.apartments.map(a => ({
          ...a,
          roomIds: a.roomIds.filter(id => id !== roomId)
        }))
      }));
      // Then assign to the target apartment
      return cleaned.map(b => {
        if (b.id !== blockId) return b;
        return {
          ...b,
          apartments: b.apartments.map(a => {
            if (a.id !== aptId) return a;
            return { ...a, roomIds: [...a.roomIds, roomId] };
          })
        };
      });
    });
  }, []);

  const unassignRoomFromApartment = useCallback((blockId: string, aptId: string, roomId: string) => {
    setBuildingBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      return {
        ...b,
        apartments: b.apartments.map(a => {
          if (a.id !== aptId) return a;
          return { ...a, roomIds: a.roomIds.filter(id => id !== roomId) };
        })
      };
    }));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────

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
        buildingBlocks,
        profit: calculateProjectTotals(rooms, settings, lintelLength, true, buildingBlocks).totalProjectProfit,
    };
    
    if (loadedProjectId) {
      const projectRef = doc(firestore, 'projects', loadedProjectId);
      updateProjectData(projectRef, projectDataToSave);
      toast({ title: 'Project Updated', description: `Project "${name}" has been updated.` });
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
  }, [loadedProjectId, rooms, settings, lintelLength, buildingBlocks, firestore, toast]);


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
    // Also remove from any apartment assignments
    setBuildingBlocks(prev => prev.map(b => ({
      ...b,
      apartments: b.apartments.map(a => ({
        ...a,
        roomIds: a.roomIds.filter(rid => rid !== id)
      }))
    })));
    setRooms(rooms.filter((room) => room.id !== id));
  };
  

  const perRoomCalculations: PerRoomCalculation[] = useMemo(() => {
    const BEAM_PRICE_PER_METER = settings.beamType === 'tbeam' ? 1250 : 520; 
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
    return calculateProjectTotals(rooms, settings, lintelLength, true, buildingBlocks);
  }, [rooms, settings, lintelLength, buildingBlocks]);
  
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
        buildingBlocks,
        setBuildingBlocks,
        addBlock,
        updateBlockName,
        deleteBlock,
        addApartmentToBlock,
        updateApartmentName,
        deleteApartment,
        assignRoomToApartment,
        unassignRoomFromApartment,
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
        displayUnit,
        setDisplayUnit,
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
