
'use client';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Download,
  Upload,
  FileText,
  Loader2,
  Wand2,
  List,
  FileDown,
  Warehouse,
  Sheet,
  Save,
  Hammer,
  ChevronDown,
  FilePlus,
} from 'lucide-react';
import { handlePlanUpload, handleGenerateQuote, QuoteState } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '../ui/textarea';
import type { Room, AggregatedRoomGroup } from '@/lib/calculator';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useCalculator } from '@/context/calculator-context';
import Link from 'next/link';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { saveProject, type ProjectData } from '@/firebase/data-manager';
import { format } from 'date-fns';

type ClientInfo = {
  clientName: string;
  projectName: string;
  projectLocation: string;
  clientContact: string;
  contactPerson: string;
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
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    clientName: '',
    projectName: '',
    projectLocation: '',
    clientContact: '',
    contactPerson: '',
  });

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


export function ActionsCard() {
  const { 
    rooms, 
    setRooms, 
    settings,
    setSettings,
    lintelLength,
    setLintelLength,
    totals, 
    perRoomCalculations, 
    aggregatedBreakdown,
    loadedProjectId,
    setLoadedProjectId,
    projectName,
    setProjectName,
    clearCalculator,
    logoUrl,
  } = useCalculator();
  const { toast } = useToast();
  const { firestore, user, isUserLoading } = useFirebase();

  const [isInvoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [isBreakdownDialogOpen, setBreakdownDialogOpen] = useState(false);
  const [isAggregatedDialogOpen, setAggregatedDialogOpen] = useState(false);
  const [isTimberScheduleOpen, setTimberScheduleOpen] = useState(false);
  
  const [isUploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);

  const [isSaveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // --- Project Loading Logic ---
  const projectsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'customers', user.uid, 'projects');
  }, [firestore, user]);

  const { data: projects, isLoading: areProjectsLoading } = useCollection<ProjectData>(projectsQuery);

  const sortedProjects = useMemo(() => {
    if (!projects) return [];
    return [...projects].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [projects]);

  const handleLoadProject = (project: ProjectData) => {
    setRooms(project.rooms || []);
    setSettings(project.settings);
    setLintelLength(project.lintelLength || 0);
    setLoadedProjectId(project.id!);
    setProjectName(project.name);
    toast({ title: 'Project Loaded', description: `Loaded "${project.name}".`});
  };

  const handleSaveProject = async (nameForProject?: string) => {
    if (!user || !firestore) {
      toast({ title: 'Authentication Error', description: 'You must be logged in to save a project.', variant: 'destructive' });
      return;
    }
  
    const finalProjectName = nameForProject || projectName;
  
    if (!finalProjectName) {
      setSaveDialogOpen(true);
      return;
    }
  
    const projectData = {
      name: finalProjectName,
      rooms,
      settings,
      lintelLength,
      status: 'pending' as const,
    };
  
    if (loadedProjectId) {
      const existingProject = projects?.find(p => p.id === loadedProjectId);
      saveProject(firestore, user.uid, { ...projectData, name: finalProjectName, id: loadedProjectId, createdAt: existingProject?.createdAt || new Date().toISOString() });
      toast({ title: 'Project Updated', description: `Your changes to project "${finalProjectName}" have been saved.` });
    } else {
      const newId = await saveProject(firestore, user.uid, { ...projectData, name: finalProjectName, createdAt: new Date().toISOString() });
      if (newId) {
        setLoadedProjectId(newId);
        setProjectName(finalProjectName);
      }
      toast({ title: 'Project Saved', description: `Project "${finalProjectName}" has been saved.` });
    }
  
    setSaveDialogOpen(false);
    setNewProjectName('');
  };


  const handleDownloadInvoice = (clientInfo: ClientInfo) => {
    const doc = new jsPDF();
    const invoiceDate = new Date().toLocaleDateString('en-GB');
    const invoiceNumber = `SILA-${String(Date.now()).slice(-6)}`;
    const primaryColor = '#2563EB';
    
    const BLOCK_PRICE = 85;
    const BEAM_PRICE_PER_METER = 545;

    const blocksTotal = totals.totalBlocks * BLOCK_PRICE;
    const beamsTotal = totals.totalInvoiceBeamLength * BEAM_PRICE_PER_METER;
    const grandTotal = blocksTotal + beamsTotal;

    if (logoUrl) {
      doc.addImage(logoUrl, 'PNG', 14, 15, 45, 10);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(primaryColor);
      doc.text('SI-LATECH', 14, 22);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Beam & Block Slab Quotation', 14, 30);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Head Office: Juja, Kenya', 145, 20);
    doc.text('Tel: +254 741 557960', 145, 25);
    doc.text('Email: info@silatech.co.ke', 145, 30);

    const invoiceToX = 14;
    const shipToX = 110;
    const startY = 45;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('INVOICE TO', invoiceToX, startY);
    doc.text('SHIP / SITE TO', shipToX, startY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50);
    doc.text(`Client Name: ${clientInfo.clientName}`, invoiceToX, startY + 6);
    doc.text(`Project Name: ${clientInfo.projectName}`, invoiceToX, startY + 11);
    doc.text(`Location: ${clientInfo.projectLocation}`, invoiceToX, startY + 16);
    doc.text(`Contact: ${clientInfo.clientContact}`, invoiceToX, startY + 21);

    doc.text(`Site Name: ${clientInfo.projectName}`, shipToX, startY + 6);
    doc.text(`Address: ${clientInfo.projectLocation}`, shipToX, startY + 11);
    doc.text(`Contact Person: ${clientInfo.contactPerson}`, shipToX, startY + 16);
    
    const metaX = 14;
    const metaY = startY + 30;
    doc.text(`Invoice No.:`, metaX, metaY);
    doc.text(`Date:`, metaX, metaY + 5);
    doc.text(`Terms:`, metaX, metaY + 10);
    doc.text(`Due Date:`, metaX, metaY + 15);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`${invoiceNumber}`, metaX + 30, metaY);
    doc.text(`${invoiceDate}`, metaX + 30, metaY + 5);
    doc.text(`Due on Receipt`, metaX + 30, metaY + 10);
    doc.text(`${invoiceDate}`, metaX + 30, metaY + 15);

    const tableRows = [
      [
        'Total Invoiced Beams (m)',
        totals.totalInvoiceBeamLength.toFixed(2),
        BEAM_PRICE_PER_METER.toFixed(2),
        beamsTotal.toFixed(2)
      ],
      [
        'Total Blocks (pcs)',
        totals.totalBlocks.toString(),
        BLOCK_PRICE.toFixed(2),
        blocksTotal.toFixed(2)
      ]
    ];


    (doc as any).autoTable({
      head: [['DESCRIPTION', 'QTY / MTRS', 'RATE (KSH)', 'AMOUNT (KSH)']],
      body: tableRows,
      startY: metaY + 25,
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
    doc.setTextColor('#D32F2F'); // A red color for attention
    doc.text('NB: Transportation of all materials is to be paid for by the customer.', 14, finalY);

    finalY += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50);
    doc.setFillColor(240,240,240);
    doc.roundedRect(totalsX - 60, finalY - 1, 85, 10, 3, 3, 'F');
    doc.text('BALANCE DUE: ', totalsX, finalY + 5, { align: 'right' });
    doc.text(`Ksh ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, totalsValueX, finalY + 5, { align: 'right' });

    let notesY = finalY + 15;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('NOTES', 14, notesY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50);
    notesY += 5;
    doc.text(`1. BRC Mesh: Based on your calculations, you may require ${totals.brc.rollsNeeded} roll(s) of BRC mesh. This is not included in the total.`, 14, notesY);
    notesY += 5;
    doc.text('2. Payment: All payments for beam and blocks are to be made to Promax Kenya Ltd. Account details will be provided.', 14, notesY);
    notesY += 5;
    doc.text('3. We provide a technician paid by the customer to help in the installation process.', 14, notesY);
    notesY += 5;
    doc.text('4. We do regular site visits paid by the customer to check on the progress of the project.', 14, notesY);
    notesY += 5;
    doc.setFont('helvetica', 'italic');
    doc.text('5. Optional: We can provide a plumber or electrician to be paid by the client if the client is interested.', 14, notesY);


    doc.save(`SI-LATECH-Invoice-${invoiceNumber}.pdf`);
    setInvoiceDialogOpen(false);
  };

  const handleDownloadMaterialSchedule = (clientInfo: ClientInfo) => {
    const { totalConcreteVolume, totalCementBags, totalSandTonnes, totalBallastTonnes, brc, lintel, timber, lintelSteel } = totals;
    
    const combinedCementBags = totalCementBags + lintel.cementBags;
    const combinedSandTonnes = totalSandTonnes + lintel.sandTonnes;
    const combinedBallastTonnes = totalBallastTonnes + lintel.ballastTonnes;
    const combinedWetVolume = totalConcreteVolume + lintel.wetVolume;

    const doc = new jsPDF();
    const scheduleDate = new Date().toLocaleDateString('en-GB');
    const scheduleNumber = `MAT-${String(Date.now()).slice(-6)}`;
    const primaryColor = '#2563EB';

    if (logoUrl) {
      doc.addImage(logoUrl, 'PNG', 14, 15, 45, 10);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(primaryColor);
      doc.text('SI-LATECH', 14, 22);
    }
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Consolidated Materials Schedule (Slab, Lintels, & Timber)', 14, 30);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor);
    doc.text('PROJECT DETAILS', 14, 45);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50);
    doc.text(`Client: ${clientInfo.clientName}`, 14, 51);
    doc.text(`Project: ${clientInfo.projectName}`, 14, 56);
    doc.text(`Location: ${clientInfo.projectLocation}`, 14, 61);

    doc.text(`Schedule No.: ${scheduleNumber}`, 145, 51);
    doc.text(`Date: ${scheduleDate}`, 145, 56);

    const tableColumn = ['MATERIAL', 'QUANTITY', 'UNIT', 'NOTES'];
    const tableRows = [
      ['Cement (50kg bags)', combinedCementBags, 'bags', 'Includes slab & lintels, plus 10% wastage'],
      ['Sand', combinedSandTonnes.toFixed(2), 'tonnes', 'Includes slab & lintels, plus 10% wastage'],
      ['Ballast / Coarse Aggregate', combinedBallastTonnes.toFixed(2), 'tonnes', 'Includes slab & lintels, plus 10% wastage'],
      ['BRC Mesh A98', brc.rollsNeeded, 'rolls', `For a total slab area of ${totals.totalArea.toFixed(2)} m²`],
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
      startY: 70,
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

    doc.save(`SI-LATECH-Material-Schedule-${scheduleNumber}.pdf`);
    setScheduleDialogOpen(false);
  };

  const handleDownloadPromaxBreakdown = (clientInfo: ClientInfo) => {
    const doc = new jsPDF();
    const reportDate = new Date().toLocaleDateString('en-GB');
    const reportNumber = `PROMAX-${String(Date.now()).slice(-6)}`;
    const primaryColor = '#2563EB';

    const beamAggregates = new Map<number, number>();
    perRoomCalculations.forEach(p => {
        const length = p.roomCalcs.shorter;
        const count = p.roomCalcs.actualBeamCount;
        beamAggregates.set(length, (beamAggregates.get(length) || 0) + count);
    });

    const tableColumn = ['BEAM LENGTH (m)', 'TOTAL PIECES'];
    const tableRows = Array.from(beamAggregates.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([length, count]) => ([
            length.toFixed(2),
            count.toString()
        ]));

    const totalPieces = tableRows.reduce((sum, row) => sum + parseInt(row[1]), 0);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(primaryColor);
    doc.text('Promax Manufacturing Order', 14, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Project Name: ${clientInfo.projectName}`, 14, 32);
    doc.text(`Date: ${reportDate}`, 14, 37);

    (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10 },
        columnStyles: {
            1: { halign: 'right' },
        }
    });

    let finalY = (doc as any).lastAutoTable.finalY;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Beam Pieces:', 14, finalY + 10);
    doc.text(`${totalPieces} pcs`, 196, finalY + 10, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('This breakdown is for manufacturing purposes and contains the exact beam quantities and lengths to be produced.', 14, finalY + 20);

    doc.save(`Promax-Breakdown-${reportNumber}.pdf`);
    setBreakdownDialogOpen(false);
  };
  
  const handleDownloadAggregatedBreakdown = (clientInfo: ClientInfo) => {
    const doc = new jsPDF();
    const reportDate = new Date().toLocaleDateString('en-GB');
    const reportNumber = `AGGR-${String(Date.now()).slice(-6)}`;
    const primaryColor = '#2563EB';

    if (logoUrl) {
      doc.addImage(logoUrl, 'PNG', 14, 15, 45, 10);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(primaryColor);
      doc.text('SI-LATECH CONSTRUCTION LTD', 14, 22);
    }
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('Aggregated Beams & Blocks Breakdown', 14, 30);
    
    doc.setFontSize(10);
    doc.text(`Project Name: ${clientInfo.projectName}`, 14, 40);
    doc.text(`Client: ${clientInfo.clientName}`, 14, 45);
    doc.text(`Date: ${reportDate}`, 14, 50);

    let currentY = 60;

    aggregatedBreakdown.forEach(group => {
        if (currentY > 240) {
            doc.addPage();
            currentY = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(primaryColor);
        doc.text(`Room Size: ${group.shorter.toFixed(2)} m × ${group.longer.toFixed(2)} m — Count: ${group.roomCount} rooms`, 14, currentY);
        currentY += 8;

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
            styles: { fontSize: 10, cellPadding: 1, overflow: 'linebreak' },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 80 },
                1: { cellWidth: 'auto' }
            },
        });
        currentY = (doc as any).lastAutoTable.finalY;
        doc.setDrawColor(200);
        doc.line(14, currentY + 5, 196, currentY + 5);
        currentY += 10;
    });

    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor);
    doc.text('PROJECT TOTALS (ACTUALS)', 14, currentY);
    currentY += 7;

    const totalBeams = aggregatedBreakdown.reduce((sum, g) => sum + g.totalBeams, 0);
    const totalBeamLength = aggregatedBreakdown.reduce((sum, g) => sum + g.totalBeamLength, 0);
    const totalBlocks = aggregatedBreakdown.reduce((sum, g) => sum + g.totalBlocks, 0);

    const totalsBody = [
        ['Total distinct room sizes:', `${aggregatedBreakdown.length}`],
        ['Total actual beams (all groups):', `${totalBeams} beams`],
        ['Total actual beam length (all):', `${totalBeamLength.toFixed(2)} m`],
        ['Total blocks (all):', `${totalBlocks} pcs`],
    ];

    (doc as any).autoTable({
        startY: currentY,
        body: totalsBody,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 1 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 80 },
            1: { cellWidth: 'auto' }
        }
    });

    doc.save(`SI-LATECH-Aggregated-Report-${reportNumber}.pdf`);
    setAggregatedDialogOpen(false);
  };
    
  const handleDownloadTimberSchedule = (clientInfo: ClientInfo) => {
    const doc = new jsPDF();
    const reportDate = new Date().toLocaleDateString('en-GB');
    const reportNumber = `TIMBER-${String(Date.now()).slice(-6)}`;
    const primaryColor = '#D97706'; // Amber color for timber

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(primaryColor);
    doc.text('Timber & Props Schedule', 14, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Project: ${clientInfo.projectName}`, 14, 32);
    doc.text(`Date: ${reportDate}`, 14, 37);

    let currentY = 45;

    perRoomCalculations.forEach((p) => {
        if (currentY > 240) { 
            doc.addPage();
            currentY = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(primaryColor);
        doc.text(`${p.room.name} (${p.room.width}m x ${p.room.length}m)`, 14, currentY);
        currentY += 8;

        const body = [
            ['3x2 Timbers', `${p.timberCalcs.pieces3x2} pcs × ${p.timberCalcs.lengthEach3x2.toFixed(2)}m = ${p.timberCalcs.total3x2m.toFixed(2)}m (${p.timberCalcs.total3x2ft.toFixed(2)} ft)`],
            ['6x1 Timbers', `Perimeter ${p.timberCalcs.perimeter.toFixed(2)}m = ${p.timberCalcs.total6x1m.toFixed(2)}m (${p.timberCalcs.total6x1ft.toFixed(2)} ft)`],
        ];

        (doc as any).autoTable({
            startY: currentY,
            body: body,
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 1, overflow: 'linebreak' },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 40 },
                1: { cellWidth: 'auto' }
            },
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 5;
    });

    if (currentY > 230) { 
        doc.addPage();
        currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(primaryColor);
    doc.text('PROJECT TOTALS', 14, currentY);
    currentY += 10;

    const totalsBody = [
        ['Total 3x2 Pieces', `${totals.timber.total3x2pieces} pcs`],
        ['Total 3x2 Length', `${totals.timber.total3x2m.toFixed(2)}m (${totals.timber.total3x2ft.toFixed(2)} ft)`],
        [],
        ['Total 6x1 Length', `${totals.timber.total6x1m.toFixed(2)}m (${totals.timber.total6x1ft.toFixed(2)} ft)`],
        [],
        ['Total Props Required', `${totals.timber.totalProps} pcs`],
    ];

     (doc as any).autoTable({
        startY: currentY,
        body: totalsBody,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 1 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 60 },
            1: { cellWidth: 'auto', halign: 'right' }
        },
    });

    doc.save(`Timber-Props-Schedule-${reportNumber}.pdf`);
    setTimberScheduleOpen(false);
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setFilePreview(loadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };
  
  const handleUploadDialogChange = (open: boolean) => {
    if (!open) {
      setFilePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      formRef.current?.reset();
    }
    setUploadDialogOpen(open);
  }

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

  async function handlePlanFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmittingPlan(true);
    
    if (!formRef.current) {
      setIsSubmittingPlan(false);
      return;
    };
    
    const formData = new FormData(formRef.current);
    const result = await handlePlanUpload(formData);
    
    if (result.data) {
        if (result.data.floors) {
          const allRooms = result.data.floors.flatMap(floor => 
              floor.rooms.map(room => ({...room, id: crypto.randomUUID(), name: `${floor.floorName} - ${room.name}`}))
          );
          setRooms(allRooms);
        }
        if (result.data.lintelLength) {
          setLintelLength(result.data.lintelLength);
        }
        toast({ title: 'Success', description: result.message });
        handleUploadDialogChange(false);
    } else if (result.error) {
        toast({ title: 'Upload Error', description: result.error, variant: 'destructive' });
    }
    
    setIsSubmittingPlan(false);
  }

  const handleDocumentDownload = (
    docType: 'invoice' | 'material' | 'promax' | 'aggregated' | 'timber'
  ) => {
    const loadedProject = projects?.find(p => p.id === loadedProjectId);

    if (loadedProject) {
      const info = {
        projectName: loadedProject.name,
        clientName: '', // These fields aren't saved yet
        projectLocation: '',
        clientContact: '',
        contactPerson: '',
      };
      if (docType === 'invoice') handleDownloadInvoice(info);
      else if (docType === 'material') handleDownloadMaterialSchedule(info);
      else if (docType === 'promax') handleDownloadPromaxBreakdown(info);
      else if (docType === 'aggregated') handleDownloadAggregatedBreakdown(info);
      else if (docType === 'timber') handleDownloadTimberSchedule(info);
    } else {
      if (docType === 'invoice') setInvoiceDialogOpen(true);
      else if (docType === 'material') setScheduleDialogOpen(true);
      else if (docType === 'promax') setBreakdownDialogOpen(true);
      else if (docType === 'aggregated') setAggregatedDialogOpen(true);
      else if (docType === 'timber') setTimberScheduleOpen(true);
    }
  };


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Project Actions</CardTitle>
          <CardDescription>
            Generate documents, use AI to analyze plans, or get a quote.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full" disabled={!user || areProjectsLoading}>
                {areProjectsLoading ? <Loader2 className="mr-2 animate-spin" /> : <ChevronDown />}
                Load Project
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              <DropdownMenuLabel>Your Saved Projects</DropdownMenuLabel>
              <DropdownMenuItem onSelect={clearCalculator}>
                <FilePlus /> New Project
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {sortedProjects.length > 0 ? (
                sortedProjects.map(p => (
                  <DropdownMenuItem key={p.id} onSelect={() => handleLoadProject(p)}>
                    <div className="flex flex-col">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-xs text-muted-foreground">Saved: {format(new Date(p.createdAt), 'PP')}</span>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuLabel className="text-center font-normal text-muted-foreground">No projects saved</DropdownMenuLabel>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="default" className="w-full" onClick={() => handleSaveProject()} disabled={!user}>
            <Save /> {loadedProjectId ? 'Save Changes' : 'Save Project'}
          </Button>
          
          <Button variant="secondary" className="w-full" onClick={() => handleDocumentDownload('invoice')}>
            <Download /> Customer Invoice
          </Button>
          
          <Button variant="outline" className="w-full" onClick={() => handleDocumentDownload('material')}>
            <List /> Material Schedule
          </Button>

          <Button variant="outline" className="w-full" onClick={() => handleDocumentDownload('promax')}>
              <FileDown /> Promax Breakdown
          </Button>
          
          <Button variant="outline" className="w-full" onClick={() => handleDocumentDownload('aggregated')}>
              <Warehouse /> Aggregated Report
          </Button>

          <Button variant="outline" className="w-full" onClick={() => handleDocumentDownload('timber')}>
              <Hammer /> Timber Schedule
          </Button>
          
          <Button variant="outline" className="w-full text-green-600 border-green-600/50 hover:bg-green-100 hover:text-green-700" asChild>
            <Link href="/purchases">
              <Sheet /> Purchases
            </Link>
          </Button>

          <Dialog open={isUploadDialogOpen} onOpenChange={handleUploadDialogChange}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Upload /> Upload Plan (AI)
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Analyze Building Plan</DialogTitle>
                <DialogDescription>
                  Upload a PDF or image of your building plan. Our AI will analyze
                  it and automatically populate the room dimensions.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handlePlanFormSubmit} ref={formRef} className="space-y-4">
                {filePreview && (
                  <div className="my-4 rounded-md border bg-muted p-2 max-h-[400px] overflow-auto">
                    {filePreview.startsWith('data:image') ? (
                       <Image src={filePreview} alt="Plan preview" width={550} height={300} className="w-full h-auto object-contain" />
                    ) : (
                      <iframe src={filePreview} width="100%" height="400px" title="PDF Preview">
                        <p>PDF preview is not available in your browser. You can still upload the file.</p>
                      </iframe>
                    )}
                  </div>
                )}
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="planFile">Plan File</Label>
                  <Input 
                    id="planFile" 
                    name="planFile" 
                    type="file" 
                    required 
                    accept=".pdf,image/*"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmittingPlan}>
                    {isSubmittingPlan && <Loader2 className="mr-2 animate-spin" />}
                    <Wand2 /> Analyze
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="accent" className="w-full col-span-2 lg:col-span-1">
                <FileText /> Generate Quote (AI)
              </Button>
            </DialogTrigger>
            <DialogContent>
               <form action={handleQuoteFormSubmit}>
                  <DialogHeader>
                    <DialogTitle>Generate Monetary Quote</DialogTitle>
                    <DialogDescription>
                      Enter your region to get an AI-generated quote based on the
                      calculated material quantities.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="my-4">
                    <Label htmlFor="region">Region</Label>
                    <Input id="region" name="region" placeholder="e.g., Nairobi, Kenya" required/>
                    {quoteState?.error && <p className="text-sm text-destructive mt-1">{quoteState.error}</p>}
                  </div>
                  <input type="hidden" name="blocks" value={totals.totalBlocks} />
                  <input type="hidden" name="beamLength" value={totals.totalInvoiceBeamLength} />
                  <input type="hidden" name="concreteVolume" value={totals.totalConcreteVolume} />
                  <input type="hidden" name="brcRolls" value={totals.brc.rollsNeeded} />
                  <DialogFooter>
                     <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                     <SubmitButton><Wand2/> Generate</SubmitButton>
                  </DialogFooter>
               </form>
            </DialogContent>
          </Dialog>

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

        </CardContent>
      </Card>

      <ClientInfoDialog
        open={isInvoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        onGenerateClick={handleDownloadInvoice}
        title="Download Customer Invoice"
        description="Please fill in client details for the invoice."
      />
      <ClientInfoDialog
        open={isScheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        onGenerateClick={handleDownloadMaterialSchedule}
        title="Download Material Schedule"
        description="Please fill in client details for the schedule."
      />
      <ClientInfoDialog
        open={isBreakdownDialogOpen}
        onOpenChange={setBreakdownDialogOpen}
        onGenerateClick={handleDownloadPromaxBreakdown}
        title="Download Promax Breakdown Report"
        description="Please fill in project details for the manufacturing report."
      />
       <ClientInfoDialog
        open={isAggregatedDialogOpen}
        onOpenChange={setAggregatedDialogOpen}
        onGenerateClick={handleDownloadAggregatedBreakdown}
        title="Download Aggregated Report"
        description="Please fill in client details for the report."
      />
      <ClientInfoDialog
        open={isTimberScheduleOpen}
        onOpenChange={setTimberScheduleOpen}
        onGenerateClick={handleDownloadTimberSchedule}
        title="Download Timber & Props Schedule"
        description="Please fill in project details for the timber report."
      />

      <Dialog open={isSaveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save New Project</DialogTitle>
            <DialogDescription>Enter a name for your new project to save it for later.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="projectNameDialog">Project Name</Label>
            <Input id="projectNameDialog" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="e.g., Karen Residential"/>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button onClick={() => {
                if (newProjectName.trim()) {
                    handleSaveProject(newProjectName.trim());
                } else {
                    toast({ title: 'Error', description: 'Project name is required.', variant: 'destructive' });
                }
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

    