'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Wand2, 
  UploadCloud, 
  Plus, 
  Trash2, 
  Download, 
  Layers, 
  DollarSign, 
  CreditCard, 
  Check, 
  Loader2, 
  ImageIcon, 
  Building,
  User,
  MapPin,
  Phone,
  Tag,
  Percent,
  Coins
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { doc, setDoc, addDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { analyzePlan } from '@/ai/flows/analyze-plan-flow';
import type { Room, CalculationDefaults } from '@/lib/calculator';
import { DEFAULTS, calcRoomBlocksAndBeams, calculateProjectTotals } from '@/lib/calculator';
import { generateQuotePdf, generatePromaxPdf } from '@/lib/pdf-utils';
import type { ProjectData, PlanData, PlanRoomData } from '@/firebase/data-manager';

interface AdminProjectEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectData | null;
  staffList?: any[];
  pricingRates?: Record<string, number>;
  onSaveSuccess?: () => void;
}

const compressImage = (dataUri: string, maxWidth = 1600, maxHeight = 1600, quality = 0.85): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = dataUri;
    img.onload = () => {
      if (dataUri.startsWith('data:application/pdf')) {
        resolve(dataUri);
        return;
      }
      let width = img.width;
      let height = img.height;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUri);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUri);
  });
};

export function AdminProjectEditorModal({
  open,
  onOpenChange,
  project,
  staffList = [],
  pricingRates,
  onSaveSuccess
}: AdminProjectEditorModalProps) {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  // Project Info State
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [status, setStatus] = useState<string>('pending');
  const [assignedTo, setAssignedTo] = useState<string>('unassigned');

  // Calculator Rooms State
  const [rooms, setRooms] = useState<Room[]>([
    { id: '1', name: 'Room 1', length: 4.0, width: 3.5 }
  ]);
  const [beamType, setBeamType] = useState<'flat' | 'tbeam'>('tbeam');

  // AI Plan Reader State
  const [blueprintFile, setBlueprintFile] = useState<File | null>(null);
  const [blueprintUri, setBlueprintUri] = useState<string | null>(null);
  const [parsedRooms, setParsedRooms] = useState<PlanRoomData[]>([]);
  const [isScanningPlan, setIsScanningPlan] = useState(false);

  // Bargain & Payment Methods State
  const [discountType, setDiscountType] = useState<'none' | 'percent' | 'amount'>('none');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['mpesa', 'bank']);
  const [customPaymentNotes, setCustomPaymentNotes] = useState('');
  const [clientChangeRequestNotes, setClientChangeRequestNotes] = useState('');

  // Unit Rates Override State
  const [customBeamRate, setCustomBeamRate] = useState<number | ''>('');
  const [customBlockRate, setCustomBlockRate] = useState<number | ''>('');

  const [isSaving, setIsSaving] = useState(false);

  // Populate state on project load
  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setClientName(project.clientName || '');
      setClientContact(project.clientContact || '');
      setProjectLocation(project.projectLocation || '');
      setContactPerson(project.contactPerson || '');
      setStatus(project.status || 'pending');
      setAssignedTo(project.assignedTo || 'unassigned');
      setRooms(project.rooms && project.rooms.length > 0 ? project.rooms : [{ id: '1', name: 'Room 1', length: 4.0, width: 3.5 }]);
      setBeamType(project.settings?.beamType || 'tbeam');
      
      setCustomBeamRate(project.totals?.beamPrice ?? '');
      setCustomBlockRate(project.totals?.blockPrice ?? '');

      setBlueprintUri(project.planData?.imageUri || null);
      setParsedRooms(project.planData?.parsedRooms || []);

      setDiscountType(project.discountType || 'none');
      setDiscountValue(project.discountValue || 0);
      setPaymentMethods(project.paymentMethods || ['mpesa', 'bank']);
      setCustomPaymentNotes(project.customPaymentNotes || '');
      setClientChangeRequestNotes(project.clientChangeRequestNotes || '');
    } else {
      setName('New Project');
      setClientName('');
      setClientContact('');
      setProjectLocation('');
      setContactPerson('');
      setStatus('pending');
      setAssignedTo('unassigned');
      setRooms([{ id: '1', name: 'Room 1', length: 4.0, width: 3.5 }]);
      setBeamType('tbeam');
      setCustomBeamRate('');
      setCustomBlockRate('');
      setBlueprintUri(null);
      setParsedRooms([]);
      setDiscountType('none');
      setDiscountValue(0);
      setPaymentMethods(['mpesa', 'bank']);
      setCustomPaymentNotes('');
      setClientChangeRequestNotes('');
    }
  }, [project, open]);

  // Recalculate Totals
  const activeSettings: CalculationDefaults = useMemo(() => ({
    ...DEFAULTS,
    beamType,
  }), [beamType]);

  const calculatedTotals = useMemo(() => {
    return calculateProjectTotals(rooms, activeSettings, 0, false);
  }, [rooms, activeSettings]);

  const defaultBeamPrice = beamType === 'tbeam' ? (pricingRates?.beamTbeamRate || 950) : (pricingRates?.beamFlatRate || 500);
  const defaultBlockPrice = beamType === 'tbeam' ? (pricingRates?.blockTbeamRate || 95) : (pricingRates?.blockFlatRate || 80);

  const beamPrice = typeof customBeamRate === 'number' && customBeamRate > 0 ? customBeamRate : defaultBeamPrice;
  const blockPrice = typeof customBlockRate === 'number' && customBlockRate > 0 ? customBlockRate : defaultBlockPrice;

  const beamsCost = (calculatedTotals.totalInvoiceBeamLength || 0) * beamPrice;
  const blocksCost = (calculatedTotals.totalBlocks || 0) * blockPrice;
  const grossTotal = beamsCost + blocksCost;

  const discountAmount = useMemo(() => {
    if (discountType === 'percent' && discountValue > 0) {
      return (grossTotal * discountValue) / 100;
    }
    if (discountType === 'amount' && discountValue > 0) {
      return discountValue;
    }
    return 0;
  }, [discountType, discountValue, grossTotal]);

  const netGrandTotal = Math.max(0, grossTotal - discountAmount);

  // Room Editing Handlers
  const handleAddRoom = () => {
    const nextNum = rooms.length + 1;
    setRooms(prev => [
      ...prev,
      { id: Date.now().toString(), name: `Room ${nextNum}`, length: 4.0, width: 3.5 }
    ]);
  };

  const handleUpdateRoom = (id: string, field: 'name' | 'length' | 'width', val: string | number) => {
    setRooms(prev => prev.map(r => {
      if (r.id !== id) return r;
      if (field === 'name') return { ...r, name: String(val) };
      return { ...r, [field]: Number(val) || 0 };
    }));
  };

  const handleDeleteRoom = (id: string) => {
    if (rooms.length <= 1) {
      toast({ title: 'Minimum Room Limit', description: 'At least one room is required for calculations.', variant: 'destructive' });
      return;
    }
    setRooms(prev => prev.filter(r => r.id !== id));
  };

  // AI Plan Reader Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBlueprintFile(file);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setBlueprintUri(reader.result as string);
    };
  };

  const handleScanBlueprint = async () => {
    if (!blueprintUri) {
      toast({ title: 'No File Selected', description: 'Please select a blueprint image or PDF CAD file first.', variant: 'destructive' });
      return;
    }
    setIsScanningPlan(true);
    toast({ title: 'Scanning Blueprint with AI...', description: 'Extracting room dimensions and bounding boxes.' });

    try {
      const compressedUri = await compressImage(blueprintUri);
      const result = await analyzePlan({ photoDataUri: compressedUri });

      if (result.success && result.rooms && result.rooms.length > 0) {
        setParsedRooms(result.rooms as PlanRoomData[]);
        setBlueprintUri(compressedUri);

        const newRoomsList: Room[] = result.rooms.map((pr: any, idx: number) => ({
          id: `ai-${Date.now()}-${idx}`,
          name: pr.name || `Scanned Room ${idx + 1}`,
          length: Number(pr.length) || 4.0,
          width: Number(pr.width) || 3.5
        }));
        setRooms(newRoomsList);

        toast({ title: 'AI Blueprint Parsed!', description: `Detected ${result.rooms.length} room spaces. Rooms imported successfully.` });
      } else {
        throw new Error(result.error || 'Could not detect room dimensions in blueprint.');
      }
    } catch (err: any) {
      toast({ title: 'Blueprint Scan Failed', description: err.message || 'An error occurred during AI analysis.', variant: 'destructive' });
    } finally {
      setIsScanningPlan(false);
    }
  };

  // Save Project & Quote Handler
  const handleSave = async () => {
    if (!firestore) return;
    if (!name.trim()) {
      toast({ title: 'Validation Error', description: 'Project Name is required.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const planDataPayload: PlanData = {
        imageUri: blueprintUri || undefined,
        parsedRooms: parsedRooms.length > 0 ? parsedRooms : undefined
      };

      const projectPayload: Partial<ProjectData> = {
        name: name.trim(),
        clientName: clientName.trim(),
        clientContact: clientContact.trim(),
        projectLocation: projectLocation.trim(),
        contactPerson: contactPerson.trim(),
        status: status as any,
        assignedTo: assignedTo === 'unassigned' ? '' : assignedTo,
        rooms,
        settings: activeSettings,
        lintelLength: 0,
        planData: planDataPayload,
        discountType,
        discountValue,
        paymentMethods,
        customPaymentNotes,
        clientChangeRequestNotes,
        updatedAt: serverTimestamp()
      };

      let currentProjId = project?.id;

      if (currentProjId) {
        await updateDoc(doc(firestore, 'projects', currentProjId), projectPayload as any);
      } else {
        const newDocRef = await addDoc(collection(firestore, 'projects'), {
          ...projectPayload,
          createdAt: serverTimestamp()
        });
        currentProjId = newDocRef.id;
      }

      const quoteNumber = `ADMIN-${currentProjId.slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      await addDoc(collection(firestore, 'quotes'), {
        invoiceNumber: quoteNumber,
        projectId: currentProjId,
        clientName: clientName || 'N/A',
        projectName: name || 'N/A',
        projectLocation: projectLocation || 'N/A',
        clientContact: clientContact || 'N/A',
        contactPerson: contactPerson || 'N/A',
        grandTotal: netGrandTotal,
        grossTotal,
        discountAmount,
        discountType,
        discountValue,
        paymentMethods,
        customPaymentNotes,
        clientChangeRequestNotes,
        totals: {
          ...calculatedTotals,
          beamType,
          beamPrice,
          blockPrice
        },
        rooms,
        createdAt: serverTimestamp()
      });

      toast({ title: 'Success!', description: 'Project & Quote updated and saved successfully.' });
      if (onSaveSuccess) onSaveSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Error saving project:', err);
      toast({ title: 'Error', description: 'Failed to save project changes.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadQuote = () => {
    generateQuotePdf({
      invoiceNumber: `QUOTE-${(project?.id || 'NEW').slice(0, 6).toUpperCase()}`,
      clientInfo: {
        clientName: clientName || 'Client',
        projectName: name || 'Project',
        projectLocation: projectLocation || 'N/A',
        clientContact: clientContact || 'N/A',
        contactPerson: contactPerson || 'N/A'
      },
      totals: {
        ...calculatedTotals,
        beamType,
        beamPrice,
        blockPrice
      },
      perRoomCalculations: rooms,
      discountType,
      discountValue,
      paymentMethods,
      customPaymentNotes,
      clientChangeRequestNotes
    });
  };

  const handleDownloadPromax = () => {
    generatePromaxPdf({
      clientInfo: {
        projectName: name || 'Project',
        projectLocation: projectLocation || 'N/A'
      },
      totals: {
        totalBlocks: calculatedTotals.totalBlocks
      },
      perRoomCalculations: rooms.map(r => {
        const roomCalcs = calcRoomBlocksAndBeams(r.length, r.width, activeSettings, beamPrice, r.name);
        return { room: r, roomCalcs };
      })
    });
  };

  const togglePaymentMethod = (method: string) => {
    setPaymentMethods(prev => 
      prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto flex flex-col p-0 gap-0 bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-2xl">
        
        {/* Modal Header */}
        <DialogHeader className="p-6 border-b border-slate-100 bg-slate-50/80 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-black text-[#095388] flex items-center gap-2">
                <Building className="h-5 w-5 text-[#095388]" />
                {project ? `Admin Edit: ${project.name}` : 'Create New Admin Project & Quote'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Modify quote details, bargain discounts, payment methods, rooms, or scan AI floor plans directly inside Admin.
              </DialogDescription>
            </div>
            {project?.status && (
              <Badge className="bg-sky-50 text-sky-700 border border-sky-200 uppercase text-[10px] font-bold px-2.5 py-1">
                {project.status}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto bg-slate-50/40">
          <Tabs defaultValue="rooms" className="w-full space-y-6">
            <TabsList className="grid grid-cols-3 bg-slate-100 p-1 border border-slate-200 rounded-xl">
              <TabsTrigger value="rooms" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-[#095388] data-[state=active]:shadow-2xs">
                <Layers className="h-3.5 w-3.5 mr-1.5" /> Rooms & AI Plan Reader
              </TabsTrigger>
              <TabsTrigger value="bargain" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-2xs">
                <Coins className="h-3.5 w-3.5 mr-1.5" /> Bargain & Payment Methods
              </TabsTrigger>
              <TabsTrigger value="details" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-2xs">
                <User className="h-3.5 w-3.5 mr-1.5" /> Project & Client Info
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: ROOMS & AI PLAN READER */}
            <TabsContent value="rooms" className="space-y-6 mt-0">
              
              {/* AI Plan Reader Section */}
              <Card className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <CardHeader className="bg-slate-50/80 p-4 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-[#095388] flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Wand2 className="h-4 w-4 text-[#095388]" /> AI Blueprint CAD Scanner
                    </span>
                    {parsedRooms.length > 0 && (
                      <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 text-[10px]">
                        {parsedRooms.length} Scanned Spaces
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    
                    {/* File Upload Zone */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-700">Upload Floor Plan (Image / PDF)</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="file" 
                          accept="image/*,application/pdf" 
                          onChange={handleFileChange}
                          className="bg-slate-50 border-slate-200 text-xs h-9 text-slate-700 file:bg-[#095388] file:text-white file:border-0 file:text-xs file:font-bold file:px-3 file:py-1 file:rounded"
                        />
                        <Button 
                          onClick={handleScanBlueprint}
                          disabled={isScanningPlan || !blueprintUri}
                          className="bg-[#095388] hover:bg-[#07426c] text-white font-bold text-xs h-9 px-4 shrink-0 shadow-2xs"
                        >
                          {isScanningPlan ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4 mr-1.5" />}
                          Scan AI
                        </Button>
                      </div>
                    </div>

                    {/* Blueprint Preview Canvas */}
                    {blueprintUri ? (
                      <div className="relative h-36 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center">
                        <img src={blueprintUri} alt="Blueprint Plan" className="max-h-full max-w-full object-contain" />
                        {parsedRooms.length > 0 && (
                          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 1000" preserveAspectRatio="none">
                            {parsedRooms.map((pr, i) => {
                              if (!pr.boundingBox) return null;
                              const [ymin, xmin, ymax, xmax] = pr.boundingBox;
                              return (
                                <g key={i}>
                                  <rect x={xmin} y={ymin} width={xmax - xmin} height={ymax - ymin} fill="rgba(14, 165, 233, 0.2)" stroke="#0ea5e9" strokeWidth={2} rx="4" />
                                  <foreignObject x={xmin + 4} y={ymin + 4} width={Math.max(80, xmax - xmin - 8)} height="20">
                                    <div className="bg-[#095388] text-white text-[8px] font-bold px-1 rounded truncate">
                                      {pr.name} ({pr.length}m x {pr.width}m)
                                    </div>
                                  </foreignObject>
                                </g>
                              );
                            })}
                          </svg>
                        )}
                      </div>
                    ) : (
                      <div className="h-36 border border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 text-xs gap-1 bg-slate-50/50">
                        <ImageIcon className="h-6 w-6 text-slate-400" />
                        <span>No blueprint uploaded</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Room Manager Section */}
              <Card className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <CardHeader className="bg-slate-50/80 p-4 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-800">Room & Slab Areas ({rooms.length})</CardTitle>
                    <CardDescription className="text-xs text-slate-500">Add, edit, or remove room dimensions directly.</CardDescription>
                  </div>
                  <Button onClick={handleAddRoom} size="sm" className="bg-[#095388] hover:bg-[#07426c] text-white font-bold text-xs h-8 px-3">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Room
                  </Button>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {rooms.map((r, index) => (
                      <div key={r.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span className="col-span-1 text-xs font-bold text-slate-500 text-center">#{index + 1}</span>
                        <div className="col-span-4">
                          <Input 
                            value={r.name} 
                            onChange={e => handleUpdateRoom(r.id, 'name', e.target.value)} 
                            placeholder="Room Name" 
                            className="h-8 text-xs bg-white border-slate-200 text-slate-900 font-medium"
                          />
                        </div>
                        <div className="col-span-3 flex items-center gap-1">
                          <Input 
                            type="number" 
                            step="0.1" 
                            value={r.length} 
                            onChange={e => handleUpdateRoom(r.id, 'length', e.target.value)} 
                            className="h-8 text-xs bg-white border-slate-200 text-slate-900 font-bold text-center"
                          />
                          <span className="text-xs text-slate-500 font-bold">m</span>
                        </div>
                        <div className="col-span-3 flex items-center gap-1">
                          <Input 
                            type="number" 
                            step="0.1" 
                            value={r.width} 
                            onChange={e => handleUpdateRoom(r.id, 'width', e.target.value)} 
                            className="h-8 text-xs bg-white border-slate-200 text-slate-900 font-bold text-center"
                          />
                          <span className="text-xs text-slate-500 font-bold">m</span>
                        </div>
                        <div className="col-span-1 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteRoom(r.id)} 
                            className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* System Beam Type Selector */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <span className="font-bold text-slate-700">Beam System Type:</span>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant={beamType === 'tbeam' ? 'default' : 'outline'}
                        onClick={() => setBeamType('tbeam')}
                        className={beamType === 'tbeam' ? 'bg-[#095388] text-white font-bold text-xs h-7 px-3 shadow-2xs' : 'border-slate-200 text-slate-600 text-xs h-7 px-3'}
                      >
                        T-Beam (KSh {pricingRates?.beamTbeamRate || 950}/m)
                      </Button>
                      <Button 
                        variant={beamType === 'flat' ? 'default' : 'outline'}
                        onClick={() => setBeamType('flat')}
                        className={beamType === 'flat' ? 'bg-[#095388] text-white font-bold text-xs h-7 px-3 shadow-2xs' : 'border-slate-200 text-slate-600 text-xs h-7 px-3'}
                      >
                        Flat Beam (KSh {pricingRates?.beamFlatRate || 500}/m)
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </TabsContent>

            {/* TAB 2: BARGAIN & PAYMENT METHODS */}
            <TabsContent value="bargain" className="space-y-6 mt-0">
              
              {/* Discount / Bargain Manager */}
              <Card className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <CardHeader className="bg-slate-50/80 p-4 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-amber-600 flex items-center gap-2">
                    <Coins className="h-4 w-4 text-amber-600" /> Custom Unit Rates & Price Bargain
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  {/* Unit Rate Overrides */}
                  <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/80 space-y-2">
                    <p className="font-bold text-amber-900 text-xs">Edit Unit Rates (Negotiated Price per Meter / Block)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-slate-700 font-medium text-[11px]">Beam Rate (KSh / meter)</Label>
                        <Input 
                          type="number" 
                          value={customBeamRate} 
                          onChange={e => setCustomBeamRate(e.target.value === '' ? '' : Number(e.target.value))} 
                          placeholder={`Default: KSh ${defaultBeamPrice}`}
                          className="h-8 text-xs bg-white border-slate-200 text-slate-900 font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-slate-700 font-medium text-[11px]">Infill Block Rate (KSh / pcs)</Label>
                        <Input 
                          type="number" 
                          value={customBlockRate} 
                          onChange={e => setCustomBlockRate(e.target.value === '' ? '' : Number(e.target.value))} 
                          placeholder={`Default: KSh ${defaultBlockPrice}`}
                          className="h-8 text-xs bg-white border-slate-200 text-slate-900 font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-slate-700 font-semibold">Discount Type</Label>
                      <Select value={discountType} onValueChange={(val: any) => setDiscountType(val)}>
                        <SelectTrigger className="h-9 bg-slate-50 border-slate-200 text-slate-900 text-xs">
                          <SelectValue placeholder="No Discount" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 text-slate-900 text-xs">
                          <SelectItem value="none">No Discount</SelectItem>
                          <SelectItem value="percent">Percentage Discount (%)</SelectItem>
                          <SelectItem value="amount">Fixed Amount Discount (KSh)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {discountType !== 'none' && (
                      <div className="space-y-1.5">
                        <Label className="text-slate-700 font-semibold">
                          {discountType === 'percent' ? 'Discount Percentage (%)' : 'Discount Amount (KSh)'}
                        </Label>
                        <Input 
                          type="number"
                          value={discountValue}
                          onChange={e => setDiscountValue(Number(e.target.value) || 0)}
                          placeholder="0"
                          className="h-9 bg-slate-50 border-slate-200 text-slate-900 font-bold text-xs"
                        />
                      </div>
                    )}

                    <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <span className="text-[11px] text-slate-500 uppercase font-bold block">Gross Subtotal</span>
                      <span className="text-base font-black text-slate-900">KSh {grossTotal.toLocaleString()}</span>
                      {discountAmount > 0 && (
                        <div className="text-[11px] text-red-600 font-bold mt-1">
                          Discount: -KSh {discountAmount.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-xs text-amber-900 font-bold block">Net Grand Total After Discount:</span>
                      <span className="text-xs text-slate-500">Reflected in updated quote PDF & invoice records.</span>
                    </div>
                    <span className="text-xl font-black text-amber-700">KSh {netGrandTotal.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods & Special Notes */}
              <Card className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <CardHeader className="bg-slate-50/80 p-4 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-[#095388] flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-[#095388]" /> Included Payment Methods & Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'mpesa', label: 'M-PESA Paybill', sub: 'Paybill 400200' },
                      { id: 'bank', label: 'Bank Wire', sub: 'NCBA Bank Acc' },
                      { id: 'cash', label: 'Cash / Cheque', sub: 'On Delivery' },
                      { id: 'installments', label: 'Installments', sub: '50% / 50% Terms' }
                    ].map(pm => {
                      const active = paymentMethods.includes(pm.id);
                      return (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => togglePaymentMethod(pm.id)}
                          className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                            active 
                              ? 'bg-sky-50 border-sky-500 text-sky-950 shadow-2xs font-bold' 
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-xs">{pm.label}</span>
                            {active && <Check className="h-3.5 w-3.5 text-[#095388]" />}
                          </div>
                          <span className="text-[10px] opacity-75 mt-1">{pm.sub}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-700 font-semibold">Custom Payment Notes</Label>
                    <Input 
                      value={customPaymentNotes} 
                      onChange={e => setCustomPaymentNotes(e.target.value)} 
                      placeholder="e.g. Account Number: SI-LATECH / Customer Name" 
                      className="h-9 bg-slate-50 border-slate-200 text-slate-900 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-700 font-semibold">Client Bargain / Change Request Notes</Label>
                    <Textarea 
                      value={clientChangeRequestNotes} 
                      onChange={e => setClientChangeRequestNotes(e.target.value)} 
                      placeholder="Record client negotiation requests, room modifications requested by client, or special discount terms..." 
                      className="bg-slate-50 border-slate-200 text-slate-900 text-xs min-h-[70px]"
                    />
                  </div>
                </CardContent>
              </Card>

            </TabsContent>

            {/* TAB 3: PROJECT & CLIENT INFO */}
            <TabsContent value="details" className="space-y-4 mt-0">
              <Card className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <CardHeader className="bg-slate-50/80 p-4 border-b border-slate-100">
                  <CardTitle className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-600" /> Client & Project Identity
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <Label className="text-slate-700 font-semibold">Project Name <span className="text-red-500">*</span></Label>
                    <Input 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      placeholder="Project Name" 
                      className="h-9 bg-slate-50 border-slate-200 text-slate-900 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-700 font-semibold">Client Name</Label>
                    <Input 
                      value={clientName} 
                      onChange={e => setClientName(e.target.value)} 
                      placeholder="Client Full Name" 
                      className="h-9 bg-slate-50 border-slate-200 text-slate-900 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-700 font-semibold">Project Location</Label>
                    <Input 
                      value={projectLocation} 
                      onChange={e => setProjectLocation(e.target.value)} 
                      placeholder="Location (e.g. Westlands, Nairobi)" 
                      className="h-9 bg-slate-50 border-slate-200 text-slate-900 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-700 font-semibold">Client Contact Phone / Email</Label>
                    <Input 
                      value={clientContact} 
                      onChange={e => setClientContact(e.target.value)} 
                      placeholder="+254 700 000 000" 
                      className="h-9 bg-slate-50 border-slate-200 text-slate-900 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-700 font-semibold">Site Contact Person</Label>
                    <Input 
                      value={contactPerson} 
                      onChange={e => setContactPerson(e.target.value)} 
                      placeholder="Site Foreman or Representative" 
                      className="h-9 bg-slate-50 border-slate-200 text-slate-900 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-700 font-semibold">Project Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="h-9 bg-slate-50 border-slate-200 text-slate-900 text-xs">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900 text-xs">
                        <SelectItem value="pending" className="text-amber-600 font-semibold">Pending</SelectItem>
                        <SelectItem value="running" className="text-blue-600 font-semibold">Running</SelectItem>
                        <SelectItem value="finished" className="text-emerald-600 font-semibold">Finished</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-slate-700 font-semibold">Assigned Staff Member</Label>
                    <Select value={assignedTo} onValueChange={setAssignedTo}>
                      <SelectTrigger className="h-9 bg-slate-50 border-slate-200 text-slate-900 text-xs">
                        <SelectValue placeholder="Assign Staff" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200 text-slate-900 text-xs">
                        <SelectItem value="unassigned" className="text-slate-400 italic">Unassigned</SelectItem>
                        {staffList.map((s: any) => (
                          <SelectItem key={s.id} value={s.username}>{s.name} (@{s.username})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Quick Summary Bar */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs shadow-2xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Slab Area</span>
              <span className="font-extrabold text-slate-900 text-sm">{(calculatedTotals.totalArea || 0).toFixed(2)} m²</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Invoice Beams</span>
              <span className="font-extrabold text-[#095388] text-sm">{(calculatedTotals.totalInvoiceBeamLength || 0).toFixed(2)} LM</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Hollow Blocks</span>
              <span className="font-extrabold text-[#095388] text-sm">{calculatedTotals.totalBlocks || 0} pcs</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Estimated Profit</span>
              <span className="font-extrabold text-emerald-600 text-sm">KSh {(calculatedTotals.totalProjectProfit || 0).toLocaleString()}</span>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <DialogFooter className="p-4 border-t border-slate-100 bg-slate-50/80 sticky bottom-0 z-20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadQuote} 
              className="border-slate-200 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs h-9"
            >
              <Download className="h-3.5 w-3.5 mr-1 text-[#095388]" /> Download Quote PDF
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadPromax} 
              className="border-slate-200 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs h-9"
            >
              <Download className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Manufacturing Order
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={() => onOpenChange(false)} 
              className="text-slate-500 hover:text-slate-900 text-xs h-9"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              size="sm" 
              onClick={handleSave} 
              disabled={isSaving} 
              className="bg-[#095388] hover:bg-[#07426c] text-white font-bold text-xs h-9 px-5 shadow-sm"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Check className="h-4 w-4 mr-1.5" />}
              Save & Sync Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
