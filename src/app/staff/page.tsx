'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, HardHat, MapPin, Layers, Download, Image as ImageIcon, Wallet, LogOut, FileText, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { generateMaterialSchedulePdf } from '@/lib/pdf-utils';
import { calcRoomBlocksAndBeams } from '@/lib/calculator';
import { RoomLayoutVisualizer } from '@/components/silacalc/room-layout-visualizer';
import { StaffAiAssistant } from '@/components/staff/staff-ai-assistant';
import { StaffSidebar, type StaffSection } from '@/components/staff/staff-sidebar';

const STAFF_SESSION_KEY = 'sila-staff-auth';

export default function StaffDashboardPage() {
    const [user, setUser] = useState<{username: string, name: string} | null>(null);
    const [activeSection, setActiveSection] = useState<StaffSection>('projects');
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [isLayoutViewOpen, setIsLayoutViewOpen] = useState(false);
    
    // Facilitation state
    const [facAmount, setFacAmount] = useState('');
    const [facReason, setFacReason] = useState('');
    const [isRequesting, setIsRequesting] = useState(false);

    const router = useRouter();
    const firestore = useFirestore();
    const { toast } = useToast();

    useEffect(() => {
        const stored = sessionStorage.getItem(STAFF_SESSION_KEY);
        if (!stored) {
            router.push('/staff/login');
        } else {
            setUser(JSON.parse(stored));
        }
    }, [router]);

    const projectsQuery = useMemoFirebase(
        () => user?.username ? query(collection(firestore, 'projects'), where('assignedTo', '==', user.username)) : null,
        [firestore, user?.username]
    );
    const { data: projects, isLoading: projectsLoading } = useCollection<any>(projectsQuery);

    const myFinancesQuery = useMemoFirebase(
        () => user?.username ? query(collection(firestore, 'finances'), where('requestedBy', '==', user.username)) : null,
        [firestore, user?.username]
    );
    const { data: rawRequests, isLoading: requestsLoading } = useCollection<any>(myFinancesQuery);
    
    const myRequests = React.useMemo(() => {
        if (!rawRequests) return [];
        return [...rawRequests].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }, [rawRequests]);

    const handleLogout = () => {
        sessionStorage.removeItem(STAFF_SESSION_KEY);
        router.push('/staff/login');
    };

    const handleRequestFacilitation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!facAmount || !facReason) {
            toast({ title: 'Error', description: 'Please fill out all fields.', variant: 'destructive' });
            return;
        }

        setIsRequesting(true);
        try {
            await addDoc(collection(firestore, 'finances'), {
                type: 'facilitation_request',
                amount: parseFloat(facAmount),
                reason: facReason,
                requestedBy: user?.username,
                status: 'pending',
                createdAt: serverTimestamp()
            });
            toast({ title: 'Request Sent', description: 'Your facilitation request has been submitted for approval.' });
            setFacAmount('');
            setFacReason('');
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to submit request.', variant: 'destructive' });
        } finally {
            setIsRequesting(false);
        }
    };

    if (!user) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-[#095388]" /></div>;

    const renderSection = () => {
        switch (activeSection) {
            case 'projects':
                return (
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight font-headline">Assigned Projects</h1>
                            <p className="text-slate-500 text-sm mt-1">View project specs, material schedules, and room layout diagrams.</p>
                        </div>
                        
                        {projectsLoading ? (
                            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#095388]" /></div>
                        ) : projects?.length === 0 ? (
                            <Card className="border-dashed border-2 bg-white shadow-2xs">
                                <CardContent className="flex flex-col items-center justify-center p-16 text-center text-slate-400">
                                    <MapPin size={48} className="mb-4 opacity-30 text-amber-500" />
                                    <p className="font-bold text-slate-700">No projects assigned to you yet</p>
                                    <p className="text-xs text-slate-400 mt-1">Once an administrator assigns a project to @{user.username}, it will show up here.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {projects?.map((proj: any) => (
                                    <Card key={proj.id} className="bg-blue-600 text-white border-0 hover:bg-blue-700 shadow-sm hover:shadow-lg transition-all rounded-2xl cursor-pointer group flex flex-col justify-between overflow-hidden" onClick={() => setSelectedProject(proj)}>
                                        <CardHeader className="pb-3 border-b border-white/10 bg-white/10 p-4">
                                            <CardTitle className="text-base font-black text-white">{proj.name}</CardTitle>
                                            <CardDescription className="text-xs text-white/80 font-medium">{proj.clientName || 'No Client'}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-2">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
                                                <MapPin size={14} className="opacity-80 shrink-0" />
                                                <span className="truncate">{proj.projectLocation || 'Unknown Location'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-semibold text-white/90">
                                                <Layers size={14} className="opacity-80 shrink-0" />
                                                <span>{proj.rooms?.length || 0} Project Areas</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case 'facilitation':
                return (
                    <div className="space-y-6 max-w-3xl">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight font-headline">Site Facilitation</h1>
                            <p className="text-slate-500 text-sm mt-1">Request transport, meals, or operational site funds from management.</p>
                        </div>

                        <Card className="border border-slate-200 bg-white shadow-2xs rounded-2xl overflow-hidden">
                            <CardHeader className="bg-slate-900 text-white p-5">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Wallet className="text-amber-400" size={18} /> Request Operations Funds
                                </CardTitle>
                                <CardDescription className="text-slate-400 text-xs">Submitted requests go directly to Super Admin for approval.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form onSubmit={handleRequestFacilitation} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-700">Amount Required (KSh)</Label>
                                        <Input type="number" value={facAmount} onChange={(e) => setFacAmount(e.target.value)} placeholder="e.g. 2500" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-700">Reason / Purpose</Label>
                                        <Input value={facReason} onChange={(e) => setFacReason(e.target.value)} placeholder="e.g. Fuel for site visit, lunch for fundis" />
                                    </div>
                                    <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-10" disabled={isRequesting}>
                                        {isRequesting ? <Loader2 className="animate-spin mr-2" size={15} /> : null}
                                        Submit Request
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">My Request History</h3>
                            {requestsLoading ? (
                                <Loader2 className="animate-spin mx-auto text-primary" />
                            ) : myRequests?.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">No previous requests submitted.</p>
                            ) : (
                                <div className="space-y-2">
                                    {myRequests?.map((req: any) => (
                                        <div key={req.id} className="bg-white p-3.5 rounded-xl border border-slate-200 text-sm flex justify-between items-center shadow-2xs">
                                            <div>
                                                <p className="font-bold text-slate-900">KSh {req.amount?.toLocaleString()}</p>
                                                <p className="text-xs text-slate-500">{req.reason}</p>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                                req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                req.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                                {req.status?.toUpperCase()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'ai':
                return (
                    <div className="space-y-6 max-w-3xl">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight font-headline flex items-center gap-2">
                                <Bot className="text-purple-600" /> Field Assistant
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">Smart recommendations for your assigned site tasks.</p>
                        </div>
                        <StaffAiAssistant 
                            staffName={user?.name}
                            assignedProjects={projects?.map((p: any) => ({ name: p.name, projectLocation: p.projectLocation, roomsCount: p.rooms?.length }))}
                            onApplyFacilitation={(amt, rsn) => {
                                setFacAmount(amt.toString());
                                setFacReason(rsn);
                                setActiveSection('facilitation');
                                toast({ title: 'AI Suggestion Applied', description: 'Switching to Facilitation form with pre-filled details.' });
                            }}
                        />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50/60">
            <StaffSidebar
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                staffName={user.name}
                username={user.username}
                onLogout={handleLogout}
            />

            {/* Main Content Area */}
            <main className="flex-1 min-h-screen p-6 lg:p-10 overflow-y-auto">
                <div className="max-w-5xl mx-auto">
                    {renderSection()}
                </div>
            </main>

            {/* Project Details Dialog */}
            <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
                <DialogContent className="max-w-2xl bg-white border border-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-[#095388]">{selectedProject?.name}</DialogTitle>
                        <p className="text-sm text-slate-500">{selectedProject?.clientName} — {selectedProject?.projectLocation}</p>
                    </DialogHeader>
                    
                    <div className="py-4 space-y-5">
                        <div className="bg-sky-50 p-4 rounded-xl border border-sky-200 text-sky-900 text-xs flex gap-3 items-start font-medium">
                            <FileText className="shrink-0 text-sky-600 mt-0.5" size={18} />
                            <p>You are assigned as technician for this project. Access material requirements or technical layout sheets below.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Button 
                                className="h-14 bg-slate-900 hover:bg-slate-800 text-white flex flex-col items-center justify-center gap-0.5 rounded-xl"
                                onClick={() => generateMaterialSchedulePdf({
                                    clientInfo: {
                                        projectName: selectedProject.name,
                                        projectLocation: selectedProject.projectLocation || 'N/A',
                                        clientName: selectedProject.clientName || 'N/A'
                                    },
                                    rooms: selectedProject.rooms || [],
                                    settings: selectedProject.settings || { beamSpacing: 0.55, blockWidth: 0.2, wastagePercentage: 10 }
                                })}
                            >
                                <Download size={18} />
                                <span className="text-xs font-bold">Download Material Breakdown</span>
                            </Button>
                            
                            <Button 
                                variant="outline"
                                className="h-14 border-primary text-primary hover:bg-primary/5 flex flex-col items-center justify-center gap-0.5 rounded-xl font-bold"
                                onClick={() => setIsLayoutViewOpen(true)}
                            >
                                <ImageIcon size={18} />
                                <span className="text-xs font-bold">View Technical Diagrams</span>
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Layout Diagrams Dialog */}
            <Dialog open={isLayoutViewOpen} onOpenChange={setIsLayoutViewOpen}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col print-dialog-content bg-white">
                    <DialogHeader className="print:hidden">
                        <DialogTitle className="text-2xl font-black text-slate-900">Technical Layout Diagrams</DialogTitle>
                        <CardDescription>Visual guide for site technicians.</CardDescription>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto pr-2 print:overflow-visible print:h-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6 print:grid-cols-1 print:gap-12 print:py-0">
                            {selectedProject?.rooms?.map((r: any, idx: number) => {
                                const BEAM_PRICE_PER_METER = selectedProject.settings?.beamType === 'tbeam' ? 950 : 500;
                                const roomCalcs = calcRoomBlocksAndBeams(r.length, r.width, selectedProject.settings || { beamSpacing: 0.55, blockWidth: 0.2, wastagePercentage: 10 }, BEAM_PRICE_PER_METER, r.name);
                                return (
                                    <RoomLayoutVisualizer key={idx} calc={roomCalcs} roomName={r.name} showInternal={true} />
                                );
                            })}
                        </div>
                    </div>
                    
                    <div className="flex justify-between border-t pt-4 print:hidden">
                        <p className="text-xs text-slate-400 italic">SI-LATECH Internal Staff Document</p>
                        <Button onClick={() => window.print()} className="bg-primary font-bold">
                            <Download size={16} className="mr-2" /> Print Technical Diagram
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
