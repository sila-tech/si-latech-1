

'use client';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Download,
  FileText,
  Loader2,
  Wand2,
  List,
  FileDown,
  Warehouse,
  Sheet,
  Save,
  Hammer,
  FilePlus,
  Search,
  Trash2,
} from 'lucide-react';
import { handleGenerateQuote, QuoteState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '../ui/textarea';
import type { Room, CalculationDefaults } from '@/lib/calculator';
import { calculateProjectTotals } from '@/lib/calculator';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useCalculator } from '@/context/calculator-context';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '../ui/scroll-area';
import { useCollection, useFirebase, useMemoFirebase, initializeFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { saveGeneratedQuote } from '@/lib/firestore';
import type { ProjectData } from '@/context/calculator-context';


type ClientInfo = {
  clientName: string;
  projectName: string;
  projectLocation: string;
  clientContact: string;
  contactPerson: string;
  selectedFloor?: string;
};

function SubmitButton({
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button {...props} disabled={pending}>
      {pending && <Loader2 className="mr-2 animate-spin" />}
      {children}
    </Button>
  );
}

const ClientInfoDialog = ({ onGenerateClick, title, description, open, onOpenChange }: { onGenerateClick: (clientInfo: ClientInfo) => void; title: string; description: string; open: boolean, onOpenChange: (open: boolean) => void; }) => {
  const { projectName, clientName, clientContact, projectLocation, contactPerson, rooms } = useCalculator();

  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    clientName: clientName || '',
    projectName: projectName || '',
    projectLocation: projectLocation || '',
    clientContact: clientContact || '',
    contactPerson: contactPerson || '',
    selectedFloor: 'all',
  });

  const uniqueFloors = useMemo(() => {
    const floorsSet = new Set<string>();
    rooms.forEach(r => {
      if (r.name.includes(':')) {
        floorsSet.add(r.name.split(':')[0].trim());
      }
    });
    return Array.from(floorsSet);
  }, [rooms]);

  useEffect(() => {
    setClientInfo({
        clientName: clientName || '',
        projectName: projectName || '',
        projectLocation: projectLocation || '',
        clientContact: clientContact || '',
        contactPerson: contactPerson || '',
        selectedFloor: uniqueFloors.length > 0 ? 'separate' : 'all',
    });
  }, [projectName, clientName, clientContact, projectLocation, contactPerson, open, uniqueFloors]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setClientInfo(prev => ({ ...prev, [id]: value }));
  };

  const handleGenerate = () => {
    onGenerateClick(clientInfo);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input id="clientName" value={clientInfo.clientName} onChange={handleChange} placeholder="e.g., John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientContact">Client Contact</Label>
              <Input id="clientContact" value={clientInfo.clientContact} onChange={handleChange} placeholder="e.g., +254 7..."/>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input id="projectName" value={clientInfo.projectName} onChange={handleChange} placeholder="e.g., Residential House"/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="projectLocation">Project Location</Label>
            <Input id="projectLocation" value={clientInfo.projectLocation} onChange={handleChange} placeholder="e.g., Karen, Nairobi" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPerson">Site Contact Person</Label>
            <Input id="contactPerson" value={clientInfo.contactPerson} onChange={handleChange} placeholder="e.g., Site Foreman" />
          </div>
          
          {uniqueFloors.length > 0 && (
            <div className="space-y-3 p-3.5 border border-amber-500/20 bg-amber-500/5 rounded-lg shadow-inner">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Plan Reader Intelligence</p>
              </div>
              <p className="text-sm text-foreground font-medium">
                I can see {uniqueFloors.length} floor{uniqueFloors.length > 1 ? 's' : ''} on the plan ({uniqueFloors.join(', ')}). Which quote do you want?
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="selectedFloor" className="text-xs text-muted-foreground font-bold">Choose Quote Scope</Label>
                <select
                  id="selectedFloor"
                  value={clientInfo.selectedFloor}
                  onChange={(e) => setClientInfo(prev => ({ ...prev, selectedFloor: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="separate">All Floors (Separate Pages in One PDF)</option>
                  <option value="all">All Floors (Combined Summary Page Only)</option>
                  {uniqueFloors.map(floor => (
                    <option key={floor} value={floor}>{floor} Only</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Cancel</Button>
          </DialogClose>
          <Button onClick={handleGenerate}>Generate & Download</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const addLogoToPdf = (doc: jsPDF, color: string) => {
    try {
        // Reduced size and adjusted position to avoid header overlap
        doc.addImage('/logo.png', 'PNG', 14, 5, 18, 18);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(color);
        doc.text('SI-LATECH', 35, 18);
    } catch (e) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(color);
        doc.text('SI-LATECH', 14, 22);
    }
};


let fadedLogoBase64 = '';

if (typeof window !== 'undefined') {
  const img = new window.Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.globalAlpha = 0.025; // 2.5% opacity for perfect faded watermark look
        ctx.drawImage(img, 0, 0);
        fadedLogoBase64 = canvas.toDataURL('image/png');
      }
    } catch (e) {
      console.error('Failed to pre-fade watermark logo:', e);
    }
  };
  img.src = '/logo.png';
}

const addPdfBackground = (doc: jsPDF) => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        try {
            if (fadedLogoBase64) {
                // Pre-faded base64 has baked-in transparency, rendering perfectly on all mobile phones & laptops
                doc.addImage(fadedLogoBase64, 'PNG', 45, 90, 120, 120, undefined, 'FAST');
            } else {
                // Fallback to GState if base64 is not yet loaded
                if ((doc as any).setGState) {
                    const gState = new (doc as any).GState({ opacity: 0.03 });
                    (doc as any).setGState(gState);
                }
                doc.addImage('/logo.png', 'PNG', 45, 90, 120, 120, undefined, 'FAST');
                if ((doc as any).setGState) {
                    const gStateReset = new (doc as any).GState({ opacity: 1.0 });
                    (doc as any).setGState(gStateReset);
                }
            }
        } catch (e) {
            // Skip watermark if image or GState is missing
        }
    }
};

const LoadProjectDialog = () => {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const { firestore } = useFirebase();

    const projectsQuery = useMemoFirebase(
      () => firestore ? query(collection(firestore, 'projects'), orderBy('createdAt', 'desc')) : null,
      [firestore]
    );

    const { data: projects, isLoading } = useCollection<ProjectData>(projectsQuery);

    const handleLoad = (id: string) => {
        router.push(`/project/${id}`);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                    <Search /> Load Project
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Load Project</DialogTitle>
                    <DialogDescription>
                        Select a project from the list below to continue working.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-96 -mx-6 px-6">
                    <div className="space-y-2 py-4">
                        {isLoading && <p className="text-center text-muted-foreground">Loading projects...</p>}
                        {!isLoading && projects && projects.length > 0 ? (
                            projects.map((proj) => (
                                <div key={proj.id} className="group flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                    <div className="flex-1 cursor-pointer" onClick={() => handleLoad(proj.id)}>
                                        <p className="font-semibold">{proj.name}</p>
                                        {proj.createdAt && (
                                            <p className="text-xs text-muted-foreground">
                                                Created {formatDistanceToNow(proj.createdAt.toDate(), { addSuffix: true })}
                                            </p>
                                        )}
                                    </div>
                                    {/* Optional: Add delete button here if needed in the future */}
                                </div>
                            ))
                        ) : (
                           !isLoading && <p className="text-center text-muted-foreground py-8">No saved projects found.</p>
                        )}
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export function ActionsCard() {
  const router = useRouter();
  const {
    rooms,
    totals,
    settings,
    perRoomCalculations,
    aggregatedBreakdown,
    loadedProjectId,
    projectName,
    clientName,
    clientContact,
    projectLocation,
    contactPerson,
    clearCalculator,
    saveProject,
  } = useCalculator();
  const { toast } = useToast();

  const [aiQuoteFloor, setAiQuoteFloor] = useState<string>('all');

  const uniqueFloors = useMemo(() => {
    const floorsSet = new Set<string>();
    rooms.forEach(r => {
      if (r.name.includes(':')) {
        floorsSet.add(r.name.split(':')[0].trim());
      }
    });
    return Array.from(floorsSet);
  }, [rooms]);

  const activeQuoteTotals = useMemo(() => {
    if (aiQuoteFloor === 'all') return totals;
    const floorRooms = rooms.filter(r => r.name.startsWith(aiQuoteFloor + ':'));
    return calculateProjectTotals(floorRooms, settings, 0);
  }, [aiQuoteFloor, rooms, totals, settings]);



  const [isInvoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [isBreakdownDialogOpen, setBreakdownDialogOpen] = useState(false);
  const [isAggregatedDialogOpen, setAggregatedDialogOpen] = useState(false);
  const [isTimberScheduleOpen, setTimberScheduleOpen] = useState(false);
  
  const [isSaveDialogOpen, setSaveDialogOpen] = useState(false);
  
  const [projectDetails, setProjectDetails] = useState({
      name: '',
      clientName: '',
      clientContact: '',
      projectLocation: '',
      contactPerson: ''
  });

  useEffect(() => {
    if (isSaveDialogOpen) {
      setProjectDetails({
        name: projectName || `Project on ${format(new Date(), 'PP')}`,
        clientName: clientName || '',
        clientContact: clientContact || '',
        projectLocation: projectLocation || '',
        contactPerson: contactPerson || ''
      });
    }
  }, [isSaveDialogOpen, projectName, clientName, clientContact, projectLocation, contactPerson]);

  const handleSaveClick = async () => {
    setSaveDialogOpen(true);
  };

  const handleCreateNew = () => {
    router.push('/');
    clearCalculator();
  }

  const handleDownloadInvoice = (clientInfo: ClientInfo, isOptimized: boolean = false) => {
    const doc = new jsPDF();
    const primaryColor = '#095388';
    const invoiceDate = new Date().toLocaleDateString('en-GB');
    const invoiceNumber = `SILA-${String(Date.now()).slice(-6)}`;
    
    const BLOCK_PRICE = settings.beamType === 'tbeam' ? 110 : 85;
    const BEAM_PRICE_PER_METER = settings.beamType === 'tbeam' ? 1250 : 545;

    const renderFloorQuotePage = (pageTitle: string, pageTotals: any) => {
      addLogoToPdf(doc, primaryColor);
      
      const blocksTotal = pageTotals.totalBlocks * BLOCK_PRICE;
      const beamsTotal = pageTotals.totalInvoiceBeamLength * BEAM_PRICE_PER_METER;
      const grandTotal = blocksTotal + beamsTotal;

      // --- Header ---
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(primaryColor);
      doc.text(pageTitle, 75, 22);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text('Head Office: Juja, Kenya', 140, 22);
      doc.text('Tel: +254 701 792088', 140, 27);
      doc.text('Email: info.silatechsolutions@gmail.com', 140, 32);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text('@si-latech, a better simpler and cost effective way to build.', 14, 38);

      let currentY = 60;
      const invoiceToX = 14;
      const shipToX = 110;
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor);
      doc.text('QUOTE TO', invoiceToX, currentY);
      doc.text('SHIP / SITE TO', shipToX, currentY);
      currentY += 6;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50);
      doc.text(`Client Name: ${clientInfo.clientName}`, invoiceToX, currentY);
      doc.text(`Site Name: ${clientInfo.projectName}`, shipToX, currentY);
      currentY += 5;
      doc.text(`Project Name: ${clientInfo.projectName}`, invoiceToX, currentY);
      doc.text(`Address: ${clientInfo.projectLocation}`, shipToX, currentY);
      currentY += 5;
      doc.text(`Location: ${clientInfo.projectLocation}`, invoiceToX, currentY);
      doc.text(`Contact Person: ${clientInfo.contactPerson}`, shipToX, currentY);
      currentY += 5;
      doc.text(`Contact: ${clientInfo.clientContact}`, invoiceToX, currentY);
      
      const metaY = currentY + 10;
      doc.text(`Quote No.:`, 14, metaY);
      doc.text(`Date:`, 14, metaY + 5);
      
      doc.setFont('helvetica', 'bold');
      doc.text(`${invoiceNumber}`, 44, metaY);
      doc.text(`${invoiceDate}`, 44, metaY + 5);

      const tableRows = [
        [
          settings.beamType === 'tbeam' ? 'Total Invoiced T-Beams (m)' : 'Total Invoiced Beams (m)',
          pageTotals.totalInvoiceBeamLength.toFixed(2),
          BEAM_PRICE_PER_METER.toFixed(2),
          beamsTotal.toFixed(2)
        ],
        [
          settings.beamType === 'tbeam' ? 'Total Blocks for T-Beams (pcs)' : 'Total Blocks (pcs)',
          pageTotals.totalBlocks.toString(),
          BLOCK_PRICE.toFixed(2),
          blocksTotal.toFixed(2)
        ]
      ];

      (doc as any).autoTable({
        head: [['DESCRIPTION', 'QTY / MTRS', 'RATE (KSH)', 'AMOUNT (KSH)']],
        body: tableRows,
        startY: metaY + 15,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, fontStyle: 'bold' },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
        }
      });

      let finalY = (doc as any).lastAutoTable.finalY;
      const totalsX = 145;
      const totalsValueX = 200;
      
      finalY += 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor('#D32F2F');
      doc.text('NB: Transportation of all materials is to be paid for by the customer.', 14, finalY);

      finalY += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(50);
      doc.setFillColor(240,240,240);
      doc.roundedRect(totalsX - 60, finalY - 1, 85, 10, 3, 3, 'F');
      doc.text('BALANCE DUE: ', totalsX, finalY + 5, { align: 'right' });
      doc.text(`Ksh ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, totalsValueX, finalY + 5, { align: 'right' });

      finalY += 15;

      let notesY = finalY + 15;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor);
      doc.text('NOTES', 14, notesY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50);
      notesY += 5;
      doc.text(`1. BRC Mesh: Based on your calculations, you may require ${pageTotals.brc.rollsNeeded} roll(s) of BRC mesh. This is not included in the total.`, 14, notesY);
      notesY += 5;
      doc.text('2. Payment: All payments for beam and blocks are to be made to Promax Kenya Ltd. Account details will be provided.', 14, notesY);
      notesY += 5;
      doc.text('3. We provide a technician paid by the client.', 14, notesY);
      notesY += 5;
      doc.text('4. Disclaimer: This quote was generated by an AI assistant based on the provided plan.', 14, notesY);
      notesY += 5;
      doc.text('It may contain errors. Please countercheck with a SI-LATECH technician for an official quote.', 14, notesY);
    };

    const selectedFloor = clientInfo.selectedFloor || 'all';

    const uniqueFloors = Array.from(new Set(rooms.map(r => {
      if (r.name.includes(':')) {
        return r.name.split(':')[0].trim();
      }
      return '';
    }).filter(Boolean)));

    let activeTotals = calculateProjectTotals(rooms, settings, lintelLength, isOptimized);
    let activeRooms = rooms;

    if (selectedFloor === 'separate' && uniqueFloors.length > 1) {
      uniqueFloors.forEach((floor, idx) => {
        if (idx > 0) {
          doc.addPage();
        }
        const floorRooms = rooms.filter(r => r.name.startsWith(floor + ':'));
        const floorTotals = calculateProjectTotals(floorRooms, settings, 0, isOptimized);
        renderFloorQuotePage(`OFFICIAL QUOTE - ${floor.toUpperCase()}`, floorTotals);
      });

      // Add combined summary page at the end
      doc.addPage();
      const combinedTotals = calculateProjectTotals(rooms, settings, lintelLength, isOptimized);
      renderFloorQuotePage('OFFICIAL QUOTE - COMBINED SUMMARY', combinedTotals);
      activeTotals = combinedTotals;
      activeRooms = rooms;
    } else if (selectedFloor !== 'all' && selectedFloor !== 'separate') {
      // Single specific floor
      const floorRooms = rooms.filter(r => r.name.startsWith(selectedFloor + ':'));
      const floorTotals = calculateProjectTotals(floorRooms, settings, 0, isOptimized);
      renderFloorQuotePage(`OFFICIAL QUOTE - ${selectedFloor.toUpperCase()}`, floorTotals);
      activeTotals = floorTotals;
      activeRooms = floorRooms;
    } else {
      // Combined quote (single page)
      const combinedTotals = calculateProjectTotals(rooms, settings, lintelLength, isOptimized);
      renderFloorQuotePage('OFFICIAL QUOTE', combinedTotals);
      activeTotals = combinedTotals;
      activeRooms = rooms;
    }

    addPdfBackground(doc);
    
    const blocksTotal = activeTotals.totalBlocks * BLOCK_PRICE;
    const beamsTotal = activeTotals.totalInvoiceBeamLength * BEAM_PRICE_PER_METER;
    const grandTotal = blocksTotal + beamsTotal;

    doc.save(`SI-LATECH-Quote-${invoiceNumber}.pdf`);
    setInvoiceDialogOpen(false);


    // Save to Admin section
    const { firestore } = initializeFirebase();
    saveGeneratedQuote(firestore, {
        invoiceNumber,
        clientName: clientInfo.clientName,
        projectName: clientInfo.projectName,
        projectLocation: clientInfo.projectLocation,
        clientContact: clientInfo.clientContact,
        contactPerson: clientInfo.contactPerson,
        grandTotal,
        totals: activeTotals, // Filtered floor totals or combined totals
        rooms: activeRooms,  // Filtered floor rooms or combined rooms
        items: {
            blocks: activeTotals.totalBlocks,
            beamsLength: activeTotals.totalInvoiceBeamLength
        }
    }).then(() => {
        // Also save to Project Management section
        saveProject({
            name: clientInfo.projectName,
            clientName: clientInfo.clientName,
            clientContact: clientInfo.clientContact,
            projectLocation: clientInfo.projectLocation,
            contactPerson: clientInfo.contactPerson
        });
    }).catch((err) => {
        console.error(err);
        toast({
            title: "Archiving Failed",
            description: "Quote was downloaded but could not be saved to the database.",
            variant: "destructive",
        });
    });
  };

  const handleDownloadMaterialSchedule = (clientInfo: ClientInfo, isOptimized: boolean = false) => {
    const doc = new jsPDF();
    const primaryColor = '#095388';
    const scheduleDate = new Date().toLocaleDateString('en-GB');
    const scheduleNumber = `MAT-${String(Date.now()).slice(-6)}`;

    const renderFloorMaterialPage = (pageTitle: string, pageTotals: any) => {
      const { totalConcreteVolume, totalCementBags, totalSandTonnes, totalBallastTonnes, brc, lintel, timber, lintelSteel } = pageTotals;
      
      const combinedCementBags = totalCementBags + lintel.cementBags;
      const combinedSandTonnes = totalSandTonnes + lintel.sandTonnes;
      const combinedBallastTonnes = totalBallastTonnes + lintel.ballastTonnes;
      const combinedWetVolume = totalConcreteVolume + lintel.wetVolume;

      addLogoToPdf(doc, primaryColor);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(primaryColor);
      doc.text(pageTitle, 60, 22);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor);
      doc.text('PROJECT DETAILS', 14, 55);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50);
      doc.text(`Client: ${clientInfo.clientName}`, 14, 61);
      doc.text(`Project: ${clientInfo.projectName}`, 14, 66);
      doc.text(`Location: ${clientInfo.projectLocation}`, 14, 71);

      doc.text(`Schedule No.: ${scheduleNumber}`, 145, 61);
      doc.text(`Date: ${scheduleDate}`, 145, 66);

      const tableColumn = ['MATERIAL', 'QUANTITY', 'UNIT', 'NOTES'];
      const tableRows = [
        ['Cement (50kg bags)', combinedCementBags, 'bags', 'Includes slab & lintels, plus 10% wastage'],
        ['Sand', combinedSandTonnes.toFixed(2), 'tonnes', 'Includes slab & lintels, plus 10% wastage'],
        ['Ballast / Coarse Aggregate', combinedBallastTonnes.toFixed(2), 'tonnes', 'Includes slab & lintels, plus 10% wastage'],
        ['BRC Mesh A98', brc.rollsNeeded, 'rolls', `For a total slab area of ${pageTotals.totalArea.toFixed(2)} m²`],
        ['Total Wet Concrete Volume', combinedWetVolume.toFixed(3), 'm³', 'Excludes wastage, for mixing reference'],
        [`D${lintelSteel.longitudinal.diameter} Steel Bars`, lintelSteel.longitudinal.barsToOrder, 'pcs', `12m lengths for lintel longitudinals`],
        [`D${lintelSteel.stirrups.diameter} Steel Bars`, lintelSteel.stirrups.barsToOrder, 'pcs', `12m lengths for lintel stirrups`],
        ['3x2 Timber', `${timber.total3x2m.toFixed(2)}m (${timber.total3x2ft.toFixed(2)} ft)`, 'length', `${timber.total3x2pieces} total pieces`],
        ['6x1 Timber', `${timber.total6x1m.toFixed(2)}m (${timber.total6x1ft.toFixed(2)} ft)`, 'length', 'For slab side shuttering'],
        ['Props', timber.totalProps, 'pcs', 'For supporting 3x2 timbers'],
      ];

      (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 80,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10 },
        columnStyles: {
          1: { halign: 'right' },
        }
      });

      let finalY = (doc as any).lastAutoTable.finalY;
      
      finalY += 15;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor);
      doc.text('NOTES', 14, finalY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50);
      finalY += 6;
      doc.text('1. All quantities are estimates. Verify with site measurements before ordering.', 14, finalY);
      finalY += 6;
      doc.text('2. This schedule includes materials for the beam & block slab, wall lintels, and timber formwork.', 14, finalY);
      finalY += 6;
      doc.text('3. Steel bar quantities are for lintels only and include 5% wastage. Order standard 12m lengths.', 14, finalY);
    };

    const selectedFloor = clientInfo.selectedFloor || 'all';

    const uniqueFloors = Array.from(new Set(rooms.map(r => {
      if (r.name.includes(':')) {
        return r.name.split(':')[0].trim();
      }
      return '';
    }).filter(Boolean)));

    const activeTotals = calculateProjectTotals(rooms, settings, lintelLength, isOptimized);

    if (selectedFloor === 'separate' && uniqueFloors.length > 1) {
      uniqueFloors.forEach((floor, idx) => {
        if (idx > 0) {
          doc.addPage();
        }
        const floorRooms = rooms.filter(r => r.name.startsWith(floor + ':'));
        const floorTotals = calculateProjectTotals(floorRooms, settings, 0, isOptimized);
        renderFloorMaterialPage(`Materials Schedule - ${floor.toUpperCase()}`, floorTotals);
      });

      // Add combined summary page at the end
      doc.addPage();
      const combinedTotals = calculateProjectTotals(rooms, settings, lintelLength, isOptimized);
      renderFloorMaterialPage('Consolidated Materials Schedule (Combined)', combinedTotals);
    } else if (selectedFloor !== 'all' && selectedFloor !== 'separate') {
      // Single specific floor
      const floorRooms = rooms.filter(r => r.name.startsWith(selectedFloor + ':'));
      const floorTotals = calculateProjectTotals(floorRooms, settings, 0, isOptimized);
      renderFloorMaterialPage(`Materials Schedule - ${selectedFloor.toUpperCase()}`, floorTotals);
    } else {
      // Combined quote (single page)
      const combinedTotals = calculateProjectTotals(rooms, settings, lintelLength, isOptimized);
      renderFloorMaterialPage('Consolidated Materials Schedule', combinedTotals);
    }

    addPdfBackground(doc);
    doc.save(`SI-LATECH-Material-Schedule-${scheduleNumber}.pdf`);
    setScheduleDialogOpen(false);
  };

  const handleDownloadPromaxBreakdown = (clientInfo: ClientInfo, isOptimized: boolean = false) => {
    const doc = new jsPDF();
    const primaryColor = '#0f172a'; // Slate-900
    const reportDate = new Date().toLocaleDateString('en-GB');
    const reportNumber = `PROMAX-${String(Date.now()).slice(-6)}`;
    
    const renderFloorPromaxPage = (pageTitle: string, pageRooms: Room[], pageTotals: any) => {
      addLogoToPdf(doc, primaryColor);
      
      const activePerRoomCalcs = pageRooms.map((r) => {
        const roomCalcs = calcRoomBlocksAndBeams(r.length, r.width, settings, settings.beamType === 'tbeam' ? 1250 : 545, r.name, isOptimized);
        return { room: r, roomCalcs };
      });

      const beamAggregates = new Map<number, number>();
      pageRooms.forEach(r => {
          const p = activePerRoomCalcs.find(pr => pr.room.id === r.id);
          if (p) {
              const length = p.roomCalcs.individualBeamLength || p.roomCalcs.shorter;
              const count = p.roomCalcs.actualBeamCount;
              beamAggregates.set(length, (beamAggregates.get(length) || 0) + count);
          }
      });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(primaryColor);
      doc.text(pageTitle, 14, 40);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50);
      doc.text(`Project: ${clientInfo.projectName}`, 14, 50);
      doc.text(`Location: ${clientInfo.projectLocation}`, 14, 55);
      doc.text(`Date: ${reportDate}`, 14, 60);
      doc.text(`Order ID: ${reportNumber}`, 145, 60);

      // Beams Table
      const beamColumn = ['DESCRIPTION', 'LENGTH (M)', 'QUANTITY', 'TOTAL LM'];
      const beamRows = Array.from(beamAggregates.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([length, count]) => ([
              'Prestressed Beam',
              length.toFixed(2),
              `${count} pcs`,
              (length * count).toFixed(2)
          ]));

      (doc as any).autoTable({
          head: [beamColumn],
          body: beamRows,
          startY: 70,
          theme: 'grid',
          headStyles: { fillColor: primaryColor, textColor: 255 },
          styles: { fontSize: 10 },
          columnStyles: {
              1: { halign: 'center' },
              2: { halign: 'center' },
              3: { halign: 'right' },
          }
      });

      let finalY = (doc as any).lastAutoTable.finalY + 15;

      // Blocks Section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(primaryColor);
      doc.text('TOTAL BLOCK REQUIREMENTS:', 14, finalY);
      doc.text(`${pageTotals.totalBlocks.toLocaleString()} pcs`, 196, finalY, { align: 'right' });
      
      finalY += 10;
      doc.setDrawColor(200);
      doc.line(14, finalY, 196, finalY);

      finalY += 15;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100);
      doc.text('Note: Beam quantities are based on actual physical room spans. Block quantities include standard project allowance.', 14, finalY);
    };

    const selectedFloor = clientInfo.selectedFloor || 'all';

    const uniqueFloors = Array.from(new Set(rooms.map(r => {
      if (r.name.includes(':')) {
        return r.name.split(':')[0].trim();
      }
      return '';
    }).filter(Boolean)));

    const activeTotals = calculateProjectTotals(rooms, settings, lintelLength, isOptimized);

    if (selectedFloor === 'separate' && uniqueFloors.length > 1) {
      uniqueFloors.forEach((floor, idx) => {
        if (idx > 0) {
          doc.addPage();
        }
        const floorRooms = rooms.filter(r => r.name.startsWith(floor + ':'));
        const floorTotals = calculateProjectTotals(floorRooms, settings, 0, isOptimized);
        renderFloorPromaxPage(`PROMAX MFG ORDER - ${floor.toUpperCase()}`, floorRooms, floorTotals);
      });

      // Add combined summary page at the end
      doc.addPage();
      const combinedTotals = calculateProjectTotals(rooms, settings, lintelLength, isOptimized);
      renderFloorPromaxPage('PROMAX MFG ORDER - COMBINED SUMMARY', rooms, combinedTotals);
    } else if (selectedFloor !== 'all' && selectedFloor !== 'separate') {
      // Single specific floor
      const floorRooms = rooms.filter(r => r.name.startsWith(selectedFloor + ':'));
      const floorTotals = calculateProjectTotals(floorRooms, settings, 0, isOptimized);
      renderFloorPromaxPage(`PROMAX MFG ORDER - ${selectedFloor.toUpperCase()}`, floorRooms, floorTotals);
    } else {
      // Combined (single page)
      const combinedTotals = calculateProjectTotals(rooms, settings, lintelLength, isOptimized);
      renderFloorPromaxPage('PROMAX MANUFACTURING ORDER', rooms, combinedTotals);
    }

    addPdfBackground(doc);
    doc.save(`Promax-Breakdown-${reportNumber}.pdf`);
    setBreakdownDialogOpen(false);
  };
  
  const handleDownloadAggregatedBreakdown = (clientInfo: ClientInfo, isOptimized: boolean = false) => {
    const doc = new jsPDF();
    const primaryColor = '#095388';
    const reportDate = new Date().toLocaleDateString('en-GB');
    const reportNumber = `AGGR-${String(Date.now()).slice(-6)}`;

    const renderFloorAggregatedPage = (pageTitle: string, pageRooms: Room[], pageTotals: any) => {
      addLogoToPdf(doc, primaryColor);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(primaryColor);
      doc.text(pageTitle, 60, 22);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50);
      doc.text(`Project Name: ${clientInfo.projectName}`, 14, 55);
      doc.text(`Client: ${clientInfo.clientName}`, 14, 60);
      doc.text(`Date: ${reportDate}`, 14, 65);

      let currentY = 75;
      
      const pageAggBreakdown = getAggregatedRoomBreakdown(pageRooms, settings, isOptimized);

      pageAggBreakdown.forEach(group => {
          if (currentY > 240) {
              doc.addPage();
              addLogoToPdf(doc, primaryColor);
              currentY = 35;
          }
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(primaryColor);
          doc.text(`Room Size: ${group.shorter.toFixed(2)} m × ${group.longer.toFixed(2)} m — Count: ${group.roomCount} rooms`, 14, currentY);
          currentY += 6;

          const body = [
              [`Beams:`, `${group.beamLengthEach.toFixed(2)} m × ${group.beamsPerRoom} beams × ${group.roomCount} rooms`],
              [`Total beams (group):`, `${group.totalBeams} beams`],
              [`Total beam length (group):`, `${group.totalBeamLength.toFixed(2)} m`],
              [],
              [`Blocks:`, `${group.blocksPerRoom} pcs × ${group.roomCount} rooms`],
              [`Total blocks (group):`, `${group.totalBlocks} pcs`],
          ];
          
          (doc as any).autoTable({
              startY: currentY,
              body: body,
              theme: 'plain',
              styles: { fontSize: 9, cellPadding: 1, overflow: 'linebreak' },
              columnStyles: {
                  0: { fontStyle: 'bold', cellWidth: 70 },
                  1: { cellWidth: 'auto' }
              },
          });
          currentY = (doc as any).lastAutoTable.finalY;
          doc.setDrawColor(220);
          doc.line(14, currentY + 3, 196, currentY + 3);
          currentY += 8;
      });

      if (currentY > 230) {
        doc.addPage();
        addLogoToPdf(doc, primaryColor);
        currentY = 35;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(primaryColor);
      doc.text('PROJECT TOTALS (ACTUALS)', 14, currentY);
      currentY += 6;

      const totalBeams = pageAggBreakdown.reduce((sum, g) => sum + g.totalBeams, 0);
      const totalBeamLength = pageAggBreakdown.reduce((sum, g) => sum + g.totalBeamLength, 0);
      const totalBlocks = pageAggBreakdown.reduce((sum, g) => sum + g.totalBlocks, 0);

      const totalsBody = [
          ['Total distinct room sizes:', `${pageAggBreakdown.length}`],
          ['Total beams (all groups):', `${totalBeams} beams`],
          ['Total beam length (all):', `${totalBeamLength.toFixed(2)} m`],
          ['Total blocks (all):', `${totalBlocks} pcs`],
      ];

      (doc as any).autoTable({
          startY: currentY,
          body: totalsBody,
          theme: 'plain',
          styles: { fontSize: 10, cellPadding: 1 },
          columnStyles: {
              0: { fontStyle: 'bold', cellWidth: 70 },
              1: { cellWidth: 'auto' }
          }
      });
    };

    const selectedFloor = clientInfo.selectedFloor || 'all';

    const uniqueFloors = Array.from(new Set(rooms.map(r => {
      if (r.name.includes(':')) {
        return r.name.split(':')[0].trim();
      }
      return '';
    }).filter(Boolean)));

    const activeTotals = calculateProjectTotals(rooms, settings, lintelLength, isOptimized);

    if (selectedFloor === 'separate' && uniqueFloors.length > 1) {
      uniqueFloors.forEach((floor, idx) => {
        if (idx > 0) {
          doc.addPage();
        }
        const floorRooms = rooms.filter(r => r.name.startsWith(floor + ':'));
        const floorTotals = calculateProjectTotals(floorRooms, settings, 0, isOptimized);
        renderFloorAggregatedPage(`Aggregated Breakdown - ${floor.toUpperCase()}`, floorRooms, floorTotals);
      });

      // Add combined summary page at the end
      doc.addPage();
      const combinedTotals = calculateProjectTotals(rooms, settings, lintelLength, isOptimized);
      renderFloorAggregatedPage('Aggregated Breakdown - COMBINED SUMMARY', rooms, combinedTotals);
    } else if (selectedFloor !== 'all' && selectedFloor !== 'separate') {
      // Single specific floor
      const floorRooms = rooms.filter(r => r.name.startsWith(selectedFloor + ':'));
      const floorTotals = calculateProjectTotals(floorRooms, settings, 0, isOptimized);
      renderFloorAggregatedPage(`Aggregated Breakdown - ${selectedFloor.toUpperCase()}`, floorRooms, floorTotals);
    } else {
      // Combined (single page)
      const combinedTotals = calculateProjectTotals(rooms, settings, lintelLength, isOptimized);
      renderFloorAggregatedPage('Aggregated Beams & Blocks Breakdown', rooms, combinedTotals);
    }

    addPdfBackground(doc);
    doc.save(`SI-LATECH-Aggregated-Report-${reportNumber}.pdf`);
    setAggregatedDialogOpen(false);
  };
    
  const handleDownloadTimberSchedule = (clientInfo: ClientInfo, isOptimized: boolean = false) => {
    const doc = new jsPDF();
    const primaryColor = '#095388';
    const reportDate = new Date().toLocaleDateString('en-GB');
    const reportNumber = `TIMBER-${String(Date.now()).slice(-6)}`;
    
    const activePerRoomCalcs = rooms.map((r) => {
      const roomCalcs = calcRoomBlocksAndBeams(r.length, r.width, settings, settings.beamType === 'tbeam' ? 1250 : 545, r.name, isOptimized);
      const concreteCalcs = calcConcrete(roomCalcs, settings);
      const brcCalcs = calcBRC(concreteCalcs.area, settings);
      const timberCalcs = calcTimberAndProps(r, settings);
      return { room: r, roomCalcs, concreteCalcs, brcCalcs, timberCalcs };
    });

    const renderFloorTimberPage = (pageTitle: string, pageRooms: Room[], pageTotals: any) => {
      addLogoToPdf(doc, primaryColor);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(primaryColor);
      doc.text(pageTitle, 60, 22);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50);
      doc.text(`Project: ${clientInfo.projectName}`, 14, 55);
      doc.text(`Date: ${reportDate}`, 14, 60);

      let currentY = 70;

      pageRooms.forEach((r) => {
          const p = activePerRoomCalcs.find(pr => pr.room.id === r.id);
          if (!p) return;

          if (currentY > 240) { 
              doc.addPage();
              addLogoToPdf(doc, primaryColor);
              currentY = 35;
          }

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(primaryColor);
          doc.text(`${p.room.name} (${p.room.width}m x ${p.room.length}m)`, 14, currentY);
          currentY += 6;

          const body = [
              ['3x2 Timbers', `${p.timberCalcs.pieces3x2} pcs × ${p.timberCalcs.lengthEach3x2.toFixed(2)}m = ${p.timberCalcs.total3x2m.toFixed(2)}m (${p.timberCalcs.total3x2ft.toFixed(2)} ft)`],
              ['6x1 Timbers', `Perimeter ${p.timberCalcs.perimeter.toFixed(2)}m = ${p.timberCalcs.total6x1m.toFixed(2)}m (${p.timberCalcs.total6x1ft.toFixed(2)} ft)`],
          ];

          (doc as any).autoTable({
              startY: currentY,
              body: body,
              theme: 'plain',
              styles: { fontSize: 9, cellPadding: 1, overflow: 'linebreak' },
              columnStyles: {
                  0: { fontStyle: 'bold', cellWidth: 40 },
                  1: { cellWidth: 'auto' }
              },
          });
          
          currentY = (doc as any).lastAutoTable.finalY + 4;
      });

      if (currentY > 230) { 
          doc.addPage();
          addLogoToPdf(doc, primaryColor);
          currentY = 35;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(primaryColor);
      doc.text('PROJECT TOTALS', 14, currentY);
      currentY += 8;

      const totalsBody = [
          ['Total 3x2 Pieces', `${pageTotals.timber.total3x2pieces} pcs`],
          ['Total 3x2 Length', `${pageTotals.timber.total3x2m.toFixed(2)}m (${pageTotals.timber.total3x2ft.toFixed(2)} ft)`],
          [],
          ['Total 6x1 Length', `${pageTotals.timber.total6x1m.toFixed(2)}m (${pageTotals.timber.total6x1ft.toFixed(2)} ft)`],
          [],
          ['Total Props Required', `${pageTotals.timber.totalProps} pcs`],
      ];

       (doc as any).autoTable({
          startY: currentY,
          body: totalsBody,
          theme: 'plain',
          styles: { fontSize: 9, cellPadding: 1 },
          columnStyles: {
              0: { fontStyle: 'bold', cellWidth: 60 },
              1: { cellWidth: 'auto', halign: 'right' }
          },
      });
    };

    const selectedFloor = clientInfo.selectedFloor || 'all';

    const uniqueFloors = Array.from(new Set(rooms.map(r => {
      if (r.name.includes(':')) {
        return r.name.split(':')[0].trim();
      }
      return '';
    }).filter(Boolean)));

    const activeTotals = calculateProjectTotals(rooms, settings, lintelLength, isOptimized);

    if (selectedFloor === 'separate' && uniqueFloors.length > 1) {
      uniqueFloors.forEach((floor, idx) => {
        if (idx > 0) {
          doc.addPage();
        }
        const floorRooms = rooms.filter(r => r.name.startsWith(floor + ':'));
        const floorTotals = calculateProjectTotals(floorRooms, settings, 0, isOptimized);
        renderFloorTimberPage(`Timber Schedule - ${floor.toUpperCase()}`, floorRooms, floorTotals);
      });

      // Add combined summary page at the end
      doc.addPage();
      const combinedTotals = calculateProjectTotals(rooms, settings, lintelLength, isOptimized);
      renderFloorTimberPage('Timber Schedule - COMBINED SUMMARY', rooms, combinedTotals);
    } else if (selectedFloor !== 'all' && selectedFloor !== 'separate') {
      // Single specific floor
      const floorRooms = rooms.filter(r => r.name.startsWith(selectedFloor + ':'));
      const floorTotals = calculateProjectTotals(floorRooms, settings, 0, isOptimized);
      renderFloorTimberPage(`Timber Schedule - ${selectedFloor.toUpperCase()}`, floorRooms, floorTotals);
    } else {
      // Combined (single page)
      const combinedTotals = calculateProjectTotals(rooms, settings, lintelLength, isOptimized);
      renderFloorTimberPage('Timber & Props Schedule', rooms, combinedTotals);
    }

    addPdfBackground(doc);
    doc.save(`Timber-Props-Schedule-${reportNumber}.pdf`);
    setTimberScheduleOpen(false);
  };


  const [quoteState, setQuoteState] = useState<QuoteState>({});
  const [isQuoteResultOpen, setQuoteResultOpen] = useState(false);

  async function handleQuoteFormSubmit(formData: FormData) {
    const result = await handleGenerateQuote(formData);
    setQuoteState(result);
    if (result.data) {
        toast({ title: 'Success', description: result.message });
        setQuoteResultOpen(true);
    } else if (result.error) {
        toast({ title: 'Quote Error', description: result.error, variant: 'destructive' });
    }
  }

  const handleDocumentDownload = (
    docType: 'invoice' | 'material' | 'promax' | 'aggregated' | 'timber'
  ) => {
    // We always open the dialogs so that the user can confirm client details AND choose the floor scope!
    if (docType === 'invoice') setInvoiceDialogOpen(true);
    else if (docType === 'material') setScheduleDialogOpen(true);
    else if (docType === 'promax') setBreakdownDialogOpen(true);
    else if (docType === 'aggregated') setAggregatedDialogOpen(true);
    else if (docType === 'timber') setTimberScheduleOpen(true);
  };


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-slate-900">Project Actions</CardTitle>
          <CardDescription>
            Generate documents, analyze plans, or manage your project.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Button variant="outline" className="w-full bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100 font-bold" onClick={handleCreateNew}>
            <FilePlus className="mr-2 h-4 w-4" /> New Project
          </Button>

          <LoadProjectDialog />

          <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold" onClick={handleSaveClick}>
            <Save className="mr-2 h-4 w-4" />
            {loadedProjectId ? 'Save / Edit Details' : 'Save Project'}
          </Button>
          
          <Button id="real-invoice-btn" className="w-full bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold shadow-md" onClick={() => handleDocumentDownload('invoice')}>
            <Download className="mr-2 h-4 w-4" /> Download Quote
          </Button>


          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100 font-bold">
                <FileText className="mr-2 h-4 w-4" /> Generate Quote (AI)
              </Button>
            </DialogTrigger>
            <DialogContent>
               <form action={handleQuoteFormSubmit}>
                  <DialogHeader>
                    <DialogTitle className="text-slate-900">Generate Monetary Quote</DialogTitle>
                    <DialogDescription>
                      Enter your region to get an AI-generated quote based on the
                      calculated material quantities.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="my-4">
                    {uniqueFloors.length > 0 && (
                      <div className="mb-4">
                        <Label htmlFor="aiQuoteFloor" className="text-slate-900 font-bold">Select Floor Scope</Label>
                        <select
                          id="aiQuoteFloor"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                          value={aiQuoteFloor}
                          onChange={(e) => setAiQuoteFloor(e.target.value)}
                        >
                          <option value="all">All Floors (Combined)</option>
                          {uniqueFloors.map(floor => (
                            <option key={floor} value={floor}>{floor} Only</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <Label htmlFor="region" className="text-slate-900 font-bold">Region</Label>
                    <Input id="region" name="region" placeholder="e.g., Nairobi, Kenya" required/>
                    {quoteState?.error && <p className="text-sm text-destructive mt-1">{quoteState.error}</p>}
                  </div>
                  <input type="hidden" name="blocks" value={activeQuoteTotals.totalBlocks} />
                  <input type="hidden" name="beamLength" value={activeQuoteTotals.totalInvoiceBeamLength} />
                  <input type="hidden" name="brcRolls" value={activeQuoteTotals.brc.rollsNeeded} />
                  <DialogFooter>
                     <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                     <SubmitButton className="bg-primary hover:bg-primary/90 text-white"><Wand2/> Generate</SubmitButton>
                  </DialogFooter>
               </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Dialog open={isQuoteResultOpen} onOpenChange={setQuoteResultOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your Generated Quote</DialogTitle>
            <DialogDescription>
              Here is the estimated quote based on your project details and region.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4 rounded-md border bg-muted p-4">
            <Textarea
                readOnly
                value={quoteState.data?.quote || 'No quote available.'}
                className="h-64 font-code text-sm"
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setQuoteResultOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ClientInfoDialog
        open={isInvoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        onGenerateClick={(clientInfo) => handleDownloadInvoice(clientInfo, true)}
        title="Download Customer Quote"
        description="Please confirm or update the client details for the quote."
      />
      <ClientInfoDialog
        open={isScheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        onGenerateClick={(clientInfo) => handleDownloadMaterialSchedule(clientInfo, true)}
        title="Download Material Schedule"
        description="Please confirm or update the client details for the schedule."
      />
      <ClientInfoDialog
        open={isBreakdownDialogOpen}
        onOpenChange={setBreakdownDialogOpen}
        onGenerateClick={(clientInfo) => handleDownloadPromaxBreakdown(clientInfo, true)}
        title="Download Promax Breakdown Report"
        description="Please confirm or update the project details for the manufacturing report."
      />
       <ClientInfoDialog
        open={isAggregatedDialogOpen}
        onOpenChange={setAggregatedDialogOpen}
        onGenerateClick={(clientInfo) => handleDownloadAggregatedBreakdown(clientInfo, true)}
        title="Download Aggregated Report"
        description="Please confirm or update the client details for the report."
      />
      <ClientInfoDialog
        open={isTimberScheduleOpen}
        onOpenChange={setTimberScheduleOpen}
        onGenerateClick={(clientInfo) => handleDownloadTimberSchedule(clientInfo, true)}
        title="Download Timber & Props Schedule"
        description="Please confirm or update the project details for the timber report."
      />

      <Dialog open={isSaveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{loadedProjectId ? 'Update Project Details' : 'Save New Project'}</DialogTitle>
            <DialogDescription>
                {loadedProjectId 
                    ? 'Update the name and client details for this project.'
                    : 'Enter the project and client details. A unique ID will be generated to access it later.'
                }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input id="projectName" value={projectDetails.name} onChange={e => setProjectDetails(prev => ({...prev, name: e.target.value}))} placeholder="e.g., Karen Residential"/>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="clientName">Client Name</Label>
                    <Input id="clientName" value={projectDetails.clientName} onChange={e => setProjectDetails(prev => ({...prev, clientName: e.target.value}))} placeholder="e.g., John Doe" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="clientContact">Client Contact</Label>
                    <Input id="clientContact" value={projectDetails.clientContact} onChange={e => setProjectDetails(prev => ({...prev, clientContact: e.target.value}))} placeholder="e.g., +254 7..."/>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="projectLocation">Project Location</Label>
                <Input id="projectLocation" value={projectDetails.projectLocation} onChange={e => setProjectDetails(prev => ({...prev, projectLocation: e.target.value}))} placeholder="e.g., Karen, Nairobi" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="contactPerson">Site Contact Person</Label>
                <Input id="contactPerson" value={projectDetails.contactPerson} onChange={e => setProjectDetails(prev => ({...prev, contactPerson: e.target.value}))} placeholder="e.g., Site Foreman" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button onClick={async () => {
                if (projectDetails.name.trim()) {
                    const newId = await saveProject(projectDetails);
                    if (newId && !loadedProjectId) {
                      router.push(`/project/${newId}`);
                    }
                    setSaveDialogOpen(false);
                } else {
                    toast({ title: 'Error', description: 'Project name is required.', variant: 'destructive' });
                }
            }}>
              {loadedProjectId ? 'Update Project' : 'Save Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      
    </>
  );
}
