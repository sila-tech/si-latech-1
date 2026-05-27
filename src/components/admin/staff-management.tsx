'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2, Loader2, ShieldCheck, UserCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function StaffManagement() {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [pin, setPin] = useState('');
    const [role, setRole] = useState('staff');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const firestore = useFirestore();
    const { toast } = useToast();

    const staffQuery = useMemoFirebase(
        () => query(collection(firestore, 'staff'), orderBy('createdAt', 'desc')),
        [firestore]
    );
    const { data: staff, isLoading } = useCollection<any>(staffQuery);

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !username || !pin) {
            toast({ title: 'Error', description: 'All fields are required.', variant: 'destructive' });
            return;
        }
        
        setIsSubmitting(true);
        try {
            await addDoc(collection(firestore, 'staff'), {
                name,
                username: username.toLowerCase().trim(),
                pin,
                role,
                createdAt: serverTimestamp()
            });
            toast({ title: 'Success', description: `Staff account for ${name} created.` });
            setName('');
            setUsername('');
            setPin('');
        } catch (error) {
            toast({ title: 'Error', description: 'Could not create staff account.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this staff account?')) return;
        try {
            await deleteDoc(doc(firestore, 'staff', id));
            toast({ title: 'Deleted', description: 'Staff account removed.' });
        } catch (error) {
            toast({ title: 'Error', description: 'Could not delete account.', variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-headline text-slate-900">Team Management</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 border-slate-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <UserPlus size={18} /> Add New Member
                        </CardTitle>
                        <CardDescription>Create an account for field staff or administrators.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddStaff} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="username">Login Username</Label>
                                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="johndoe" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pin">Secret PIN</Label>
                                <Input id="pin" type="text" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="4-digit pin or password" />
                            </div>
                            <div className="space-y-2">
                                <Label>Account Role</Label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="staff">Field Staff</SelectItem>
                                        <SelectItem value="admin">Administrator</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                                Create Account
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg">Active Team Members</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Username</TableHead>
                                        <TableHead>PIN</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {staff?.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} className="text-center text-slate-500 py-8">No team accounts found.</TableCell></TableRow>
                                    ) : (
                                        staff?.map(s => (
                                            <TableRow key={s.id}>
                                                <TableCell className="font-bold flex items-center gap-2">
                                                    {s.role === 'admin' ? <UserCog size={14} className="text-primary" /> : <ShieldCheck size={14} className="text-slate-500" />} {s.name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={s.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-slate-100 text-slate-600'}>
                                                        {s.role === 'admin' ? 'Admin' : 'Staff'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{s.username}</TableCell>
                                                <TableCell className="font-mono text-xs">{s.pin}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} className="text-destructive hover:bg-destructive/10">
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
