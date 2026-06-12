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
import { Loader2, HardHat, MapPin, Layers, Download, Image as ImageIcon, Wallet, LogOut, FileText } from 'lucide-react';
import { Header } from '@/components/header';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { generateMaterialSchedulePdf } from '@/lib/pdf-utils';
import { calcRoomBlocksAndBeams } from '@/lib/calculator';
import { RoomLayoutVisualizer } from '@/components/silacalc/room-layout-visualizer';

const STAFF_SESSION_KEY = 'sila-staff-auth';

export default function StaffDashboardPage() {
    const [user, setUser] = useState<{username: string, name: string} | null>(null);
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
    
    // Sort client-side to avoid needing a Firestore composite index
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

    if (!user) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <Header />
            <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-100 p-3 rounded-full text-amber-700">
                            <HardHat size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black font-headline text-slate-900">Welcome, {user.name}</h1>
                            <p className="text-slate-500 text-sm">Staff & Technician Portal</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={handleLogout} className="text-slate-500 border-slate-200 hover:bg-slate-100">
                        <LogOut size={16} className="mr-2" /> Sign Out
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Projects Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-bold font-headline flex items-center gap-2">
                            <Layers className="text-primary" /> My Assigned Projects
                        </h2>
                        
                        {projectsLoading ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
                        ) : projects?.length === 0 ? (
                            <Card className="border-dashed border-2 bg-transparent shadow-none">
                                <CardContent className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
                                    <MapPin size={48} className="mb-4 opacity-20" />
                                    <p>You have no projects assigned to you at the moment.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {projects?.map((proj) => (
                                    <Card key={proj.id} className="border border-slate-200 hover:border-primary/50 hover:shadow-md transition-all bg-white cursor-pointer" onClick={() => setSelectedProject(proj)}>
                                        <CardHeader className="pb-2 border-b bg-slate-50">
                                            <CardTitle className="text-lg font-bold">{proj.name}</CardTitle>
                                            <CardDescription>{proj.clientName || 'No Client'}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-4 space-y-2">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <MapPin size={14} className="text-primary" />
                                                {proj.projectLocation || 'Unknown Location'}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Layers size={14} className="text-primary" />
                                                {proj.rooms?.length || 0} Project Areas
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Finances Section */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold font-headline flex items-center gap-2">
                            <Wallet className="text-amber-600" /> Site Facilitation
                        </h2>
                        
                        <Card className="border-slate-200 shadow-sm">
                            <CardHeader className="bg-slate-900 text-white rounded-t-xl pb-4">
                                <CardTitle className="text-lg">Request Funds</CardTitle>
                                <CardDescription className="text-slate-400">Request money for site operations.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <form onSubmit={handleRequestFacilitation} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Amount Required (KSh)</Label>
                                        <Input type="number" value={facAmount} onChange={(e) => setFacAmount(e.target.value)} placeholder="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Reason / Purpose</Label>
                                        <Input value={facReason} onChange={(e) => setFacReason(e.target.value)} placeholder="e.g. Transport, Lunch for fundis" />
                                    </div>
                                    <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={isRequesting}>
                                        {isRequesting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                                        Submit Request
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Recent Requests</h3>
                            {requestsLoading ? (
                                <Loader2 className="animate-spin mx-auto text-primary" />
                            ) : myRequests?.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">No previous requests found.</p>
                            ) : (
                                <div className="space-y-2">
                                    {myRequests?.slice(0, 5).map(req => (
                                        <div key={req.id} className="bg-white p-3 rounded-lg border text-sm flex justify-between items-center shadow-sm">
                                            <div>
                                                <p className="font-bold text-slate-900">KSh {req.amount?.toLocaleString()}</p>
                                                <p className="text-xs text-slate-500">{req.reason}</p>
                                            </div>
                                            <div>
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                                    req.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                    req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {req.status?.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Restricted Project Details Dialog for Staff */}
            <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-primary">{selectedProject?.name}</DialogTitle>
                        <p className="text-sm text-slate-500">{selectedProject?.clientName} — {selectedProject?.projectLocation}</p>
                    </DialogHeader>
                    
                    <div className="py-6 space-y-6">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-blue-800 text-sm flex gap-3 items-start">
                            <FileText className="shrink-0 mt-0.5" size={18} />
                            <p>You have been assigned to this project. You can download the required material breakdown and view the technical layout diagrams below.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Button 
                                className="h-16 bg-slate-900 hover:bg-slate-800 flex flex-col items-center justify-center gap-1"
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
                                <Download size={20} />
                                <span className="text-xs font-bold">Download Material Breakdown</span>
                            </Button>
                            
                            <Button 
                                variant="outline"
                                className="h-16 border-primary text-primary hover:bg-primary/5 flex flex-col items-center justify-center gap-1"
                                onClick={() => setIsLayoutViewOpen(true)}
                            >
                                <ImageIcon size={20} />
                                <span className="text-xs font-bold">View Layout Diagrams</span>
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Layout Diagrams Dialog */}
            <Dialog open={isLayoutViewOpen} onOpenChange={setIsLayoutViewOpen}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col print-dialog-content">
                    <DialogHeader className="print:hidden">
                        <DialogTitle className="text-2xl font-black text-slate-900">Technical Layout Diagrams</DialogTitle>
                        <CardDescription>Visual guide for staff and site technicians.</CardDescription>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto pr-2 print:overflow-visible print:h-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6 print:grid-cols-1 print:gap-12 print:py-0">
                            {selectedProject?.rooms?.map((r: any, idx: number) => {
                                const BEAM_PRICE_PER_METER = selectedProject.settings?.beamType === 'tbeam' ? 1250 : 520;
                                const settings = selectedProject.settings || {
                                    beamSpacing: 0.55,
                                    blockWidth: 0.2,
                                    wastagePercentage: 10
                                };
                                const roomCalcs = calcRoomBlocksAndBeams(r.length, r.width, settings, BEAM_PRICE_PER_METER, r.name);
                                return (
                                    <RoomLayoutVisualizer key={idx} calc={roomCalcs} roomName={r.name} showInternal={true} />
                                );
                            })}
                        </div>
                    </div>
                    
                    <div className="flex justify-between border-t pt-4 print:hidden">
                        <p className="text-xs text-slate-400 italic">SI-LATECH Internal Staff Document</p>
                        <Button onClick={() => window.print()} className="bg-primary font-bold">
                            <Download size={16} className="mr-2" /> Print for Site Technician
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
