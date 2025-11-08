

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

const LOCAL_PROJECTS_KEY = 'silacalc_projects';

export interface LocalProjectData {
  id: string;
  name: string;
  rooms: Room[];
  settings: CalculationDefaults;
  lintelLength: number;
  createdAt: string;
}

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
  logoUrl: string | null;
  setLogoUrl: (url: string | null) => void;
  // Project management
  localProjects: LocalProjectData[];
  loadProject: (project: LocalProjectData) => void;
  saveProject: (name?: string) => void;
}

const CalculatorContext = createContext<CalculatorContextType | undefined>(undefined);

const LOGO_STORAGE_KEY = 'silacalc-logo';

export const CalculatorProvider = ({ children }: { children: ReactNode }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [settings, setSettings] = useState<CalculationDefaults>(DEFAULTS);
  const [lintelLength, setLintelLength] = useState<number>(0);
  const [loadedProjectId, setLoadedProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('');
  const [logoUrl, setLogoUrlState] = useState<string | null>(null);
  const [localProjects, setLocalProjects] = useState<LocalProjectData[]>([]);
  const { toast } = useToast();

  // Load projects from local storage on initial mount
  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem(LOCAL_PROJECTS_KEY);
      if (savedProjects) {
        setLocalProjects(JSON.parse(savedProjects));
      }
      const storedLogo = localStorage.getItem(LOGO_STORAGE_KEY);
      if (storedLogo) {
        setLogoUrlState(storedLogo);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
      toast({ title: 'Error', description: 'Could not load saved projects.', variant: 'destructive'});
    }
  }, [toast]);
  
  // Real-time auto-saving effect
  useEffect(() => {
    // Only auto-save if a project is loaded (i.e., has an ID).
    if (!loadedProjectId) {
      return;
    }
    
    // This is the auto-save logic
    const currentProjectData: LocalProjectData = {
      id: loadedProjectId,
      name: projectName,
      rooms,
      settings,
      lintelLength,
      createdAt: localProjects.find(p => p.id === loadedProjectId)?.createdAt || new Date().toISOString(),
    };

    const updatedProjects = localProjects.map(p => p.id === loadedProjectId ? currentProjectData : p);
    
    // Check if there are actual changes to avoid unnecessary writes
    if (JSON.stringify(localProjects) !== JSON.stringify(updatedProjects)) {
        setLocalProjects(updatedProjects);
        try {
            localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(updatedProjects));
        } catch (error) {
            console.error("Auto-save failed:", error);
            // Optionally, inform the user that auto-save isn't working
        }
    }
    
  }, [rooms, settings, lintelLength, projectName, loadedProjectId, localProjects]);


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

  const loadProject = useCallback((project: LocalProjectData) => {
    setRooms(project.rooms || []);
    setSettings(project.settings);
    setLintelLength(project.lintelLength || 0);
    setLoadedProjectId(project.id);
    setProjectName(project.name);
    toast({ title: 'Project Loaded', description: `Loaded "${project.name}".`});
  }, [toast]);

  const saveProject = useCallback((nameForProject?: string) => {
    const finalProjectName = nameForProject || projectName;

    if (!finalProjectName) {
      toast({ title: 'Error', description: 'Project name is required.', variant: 'destructive' });
      return;
    }

    let updatedProjects: LocalProjectData[];
    let message = '';
    
    if (loadedProjectId) {
      // Update existing project
      const projectData: LocalProjectData = {
        id: loadedProjectId,
        name: finalProjectName,
        rooms,
        settings,
        lintelLength,
        createdAt: localProjects.find(p => p.id === loadedProjectId)?.createdAt || new Date().toISOString(),
      };
      updatedProjects = localProjects.map(p => p.id === loadedProjectId ? projectData : p);
      message = `Project "${finalProjectName}" has been saved.`;
    } else {
      // Create new project
      const newId = crypto.randomUUID();
      const projectData: LocalProjectData = {
        id: newId,
        name: finalProjectName,
        rooms,
        settings,
        lintelLength,
        createdAt: new Date().toISOString(),
      };
      updatedProjects = [...localProjects, projectData];
      setLoadedProjectId(newId); // Set the ID for the newly created project
      message = `Project "${finalProjectName}" has been created and saved.`;
    }
    
    setProjectName(finalProjectName);
    setLocalProjects(updatedProjects);
    try {
      localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(updatedProjects));
      toast({ title: 'Project Saved', description: message });
    } catch (error) {
      console.error("Failed to save projects to localStorage:", error);
      toast({ title: 'Error', description: 'Could not save project.', variant: 'destructive'});
    }
  }, [projectName, loadedProjectId, rooms, settings, lintelLength, localProjects, toast]);


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
  
  const clearCalculator = () => {
    setRooms([]);
    setSettings(DEFAULTS);
    setLintelLength(0);
    setLoadedProjectId(null);
    setProjectName('');
  }

  const perRoomCalculations: PerRoomCalculation[] = useMemo(() => {
    const BEAM_PRICE_PER_METER = 545; // TODO: Make configurable
    return rooms.map((r) => {
      const roomCalcs = calcRoomBlocksAndBeams(r.length, r.width, settings, BEAM_PRICE_PER_METER);
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
        logoUrl,
        setLogoUrl,
        localProjects,
        loadProject,
        saveProject,
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
