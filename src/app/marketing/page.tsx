'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useFirestore, useCollection, useMemoFirebase, useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Loader2, 
  Upload, 
  Link as LinkIcon, 
  MapPin, 
  Film, 
  Image as ImageIcon, 
  X, 
  ExternalLink,
  Camera,
  LogOut,
  Layers,
  CheckCircle2,
  Clock,
  Sparkles,
  Search
} from 'lucide-react';
import Link from 'next/link';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
}

interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  location: string;
  status: 'ongoing' | 'completed';
  media: MediaItem[];
  createdAt: any;
  updatedAt?: any;
}

export default function MarketingDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { firebaseApp } = useFirebase();

  const [authChecked, setAuthChecked] = useState(false);
  const [username, setUsername] = useState('Marketing Team');

  // Verify authentication
  useEffect(() => {
    const session = sessionStorage.getItem('sila-marketing-auth');
    if (!session) {
      router.push('/marketing/login');
    } else {
      try {
        const parsed = JSON.parse(session);
        setUsername(parsed.username || 'Marketing Team');
        setAuthChecked(true);
      } catch {
        router.push('/marketing/login');
      }
    }
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem('sila-marketing-auth');
    router.push('/marketing/login');
  };

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ongoing' | 'completed'>('all');

  // Dialog State
  const [isOpen, setIsOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);

  // Form Fields State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'ongoing' | 'completed'>('completed');
  const [media, setMedia] = useState<MediaItem[]>([]);

  // Media Url Addition State
  const [urlInput, setUrlInput] = useState('');
  const [urlType, setUrlType] = useState<'image' | 'video'>('image');

  // File Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch portfolio projects
  const portfolioQuery = useMemoFirebase(
    () => query(collection(firestore, 'portfolio'), orderBy('createdAt', 'desc')),
    [firestore]
  );
  const { data: projects, isLoading } = useCollection<PortfolioProject>(portfolioQuery);

  const handleOpenNewDialog = () => {
    setEditingProject(null);
    setTitle('');
    setDescription('');
    setLocation('');
    setStatus('ongoing');
    setMedia([]);
    setUrlInput('');
    setIsOpen(true);
  };

  const handleOpenEditDialog = (project: PortfolioProject) => {
    setEditingProject(project);
    setTitle(project.title);
    setDescription(project.description || '');
    setLocation(project.location || '');
    setStatus(project.status);
    setMedia(project.media || []);
    setUrlInput('');
    setIsOpen(true);
  };

  const handleAddMediaUrl = () => {
    if (!urlInput.trim()) return;
    setMedia(prev => [...prev, { type: urlType, url: urlInput.trim() }]);
    setUrlInput('');
  };

  const handleRemoveMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!firebaseApp) {
      toast({
        title: 'Error',
        description: 'Firebase is not initialized.',
        variant: 'destructive'
      });
      return;
    }

    const storage = getStorage(firebaseApp);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileType: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';
        const storageRef = ref(storage, `portfolio/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise<MediaItem>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(Math.round(progress));
            },
            (error) => reject(error),
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve({ type: fileType, url: downloadURL });
            }
          );
        });
      });

      const newMediaItems = await Promise.all(uploadPromises);
      setMedia(prev => [...prev, ...newMediaItems]);
      toast({
        title: 'Upload Complete',
        description: `Successfully uploaded ${newMediaItems.length} photo(s)/video(s).`
      });
    } catch (err: any) {
      toast({
        title: 'Upload Failed',
        description: err.message || 'Error uploading file.',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleSaveProject = async () => {
    if (!title.trim() || !location.trim()) {
      toast({
        title: 'Missing Fields',
        description: 'Please provide both a project title and location.',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      if (editingProject) {
        await updateDoc(doc(firestore, 'portfolio', editingProject.id), {
          title,
          description,
          location,
          status,
          media,
          updatedAt: serverTimestamp()
        });
        toast({ title: 'Updated', description: 'Showcase project updated successfully.' });
      } else {
        await addDoc(collection(firestore, 'portfolio'), {
          title,
          description,
          location,
          status,
          media,
          createdAt: serverTimestamp()
        });
        toast({ title: 'Created', description: 'Showcase project published to portfolio.' });
      }
      setIsOpen(false);
    } catch (err: any) {
      toast({
        title: 'Save Failed',
        description: err.message || 'Could not save project.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from the portfolio showcase?`)) return;
    try {
      await deleteDoc(doc(firestore, 'portfolio', id));
      toast({ title: 'Deleted', description: 'Project removed from showcase gallery.' });
    } catch (err: any) {
      toast({ title: 'Error', description: 'Could not delete project.', variant: 'destructive' });
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  // Filtered projects
  const filteredProjects = (projects || []).filter(p => {
    const matchesQuery = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const totalOngoing = (projects || []).filter(p => p.status === 'ongoing').length;
  const totalCompleted = (projects || []).filter(p => p.status === 'completed').length;
  const totalMedia = (projects || []).reduce((acc, p) => acc + (p.media?.length || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Marketing Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-600 to-amber-500 flex items-center justify-center shadow-md">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-white text-base tracking-tight">SI-LATECH</span>
              <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-md border border-pink-500/20">
                Marketing Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm" className="border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-300 text-xs h-9 rounded-xl gap-1.5">
              <Link href="/portfolio" target="_blank">
                <ExternalLink className="w-3.5 h-3.5" /> View Live Showcase
              </Link>
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white hover:bg-slate-800 text-xs h-9 rounded-xl gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Log Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Title Bar & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-headline">
              Project Media &amp; Showcase Hub
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Upload, organize, and manage photos of ongoing and completed precast slab construction sites.
            </p>
          </div>
          <Button
            onClick={handleOpenNewDialog}
            className="bg-gradient-to-r from-pink-600 to-amber-500 hover:from-pink-500 hover:to-amber-400 text-white font-bold text-xs h-10 px-5 rounded-xl shadow-lg gap-2 shrink-0 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" /> Add Project Showcase
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-900/60 border-slate-800 text-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Projects</p>
                <p className="text-2xl font-black text-white mt-1">{projects?.length || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800 text-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Ongoing Sites</p>
                <p className="text-2xl font-black text-amber-400 mt-1">{totalOngoing}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800 text-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Completed Sites</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">{totalCompleted}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800 text-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-pink-400 uppercase tracking-wider">Photos &amp; Videos</p>
                <p className="text-2xl font-black text-pink-400 mt-1">{totalMedia}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
          <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
            {(['all', 'ongoing', 'completed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                  statusFilter === s
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s === 'all' ? `All (${projects?.length || 0})` : `${s} (${(projects || []).filter(p => p.status === s).length})`}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or location..."
              className="bg-slate-950 border-slate-800 text-white text-xs h-9 pl-9 rounded-xl placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Project Showcase Cards Grid */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            <p className="text-xs text-slate-400">Loading portfolio projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card className="bg-slate-900/40 border-slate-800 text-center py-16">
            <CardContent className="space-y-3">
              <Camera className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-400 text-sm">No showcase projects found.</p>
              <Button onClick={handleOpenNewDialog} className="bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold rounded-xl">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const coverMedia = project.media && project.media.length > 0 ? project.media[0] : null;

              return (
                <Card key={project.id} className="bg-slate-900/80 border-slate-800 text-white overflow-hidden rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-all group">
                  <div>
                    {/* Media Cover */}
                    <div className="relative h-48 bg-slate-950 overflow-hidden">
                      {coverMedia ? (
                        coverMedia.type === 'image' ? (
                          <img
                            src={coverMedia.url}
                            alt={project.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-900">
                            <Film className="w-10 h-10 text-pink-400" />
                          </div>
                        )
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-1">
                          <ImageIcon className="w-8 h-8" />
                          <span className="text-[11px]">No photo uploaded</span>
                        </div>
                      )}

                      <div className="absolute top-3 left-3">
                        <Badge className={`text-[10px] font-black uppercase border-0 ${
                          project.status === 'ongoing' 
                            ? 'bg-amber-500 text-slate-950' 
                            : 'bg-emerald-600 text-white'
                        }`}>
                          {project.status === 'ongoing' ? 'Ongoing Site' : 'Completed Project'}
                        </Badge>
                      </div>

                      <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-bold text-slate-300 flex items-center gap-1.5">
                        <Camera className="w-3 h-3 text-pink-400" />
                        <span>{project.media?.length || 0} media</span>
                      </div>
                    </div>

                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base font-bold text-white line-clamp-1">
                        {project.title}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                        <span className="truncate">{project.location}</span>
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-4 pt-1">
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {project.description || 'No description provided.'}
                      </p>
                    </CardContent>
                  </div>

                  <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex gap-2">
                    <Button
                      onClick={() => handleOpenEditDialog(project)}
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700 text-xs font-semibold h-8 rounded-xl gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-sky-400" /> Manage Photos
                    </Button>
                    <Button
                      onClick={() => handleDeleteProject(project.id, project.title)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0 rounded-xl"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Add / Edit Project Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl bg-slate-900 text-white border-slate-800 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-pink-400" />
              {editingProject ? 'Edit Showcase Project & Photos' : 'Add New Project to Showcase'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">Project Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., 5-Bedroom Luxury Slab - Runda"
                  className="bg-slate-950 border-slate-800 text-white text-xs h-9 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-300">Site Location *</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Runda, Nairobi"
                  className="bg-slate-950 border-slate-800 text-white text-xs h-9 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-300">Project Stage / Status</Label>
              <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                <SelectTrigger className="bg-slate-950 border-slate-800 text-white text-xs h-9 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white text-xs">
                  <SelectItem value="ongoing">Ongoing Construction Site</SelectItem>
                  <SelectItem value="completed">Completed Precast Slab Project</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-300">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Highlight beam types used, spans, delivery logistics, or customer feedback..."
                className="bg-slate-950 border-slate-800 text-white text-xs rounded-xl min-h-[70px]"
              />
            </div>

            {/* Photo & Video Upload Section */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <Label className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4" /> Upload Project Photos &amp; Media
              </Label>

              {/* Direct File Upload */}
              <div className="border border-dashed border-slate-700 bg-slate-950/60 rounded-2xl p-4 text-center space-y-2">
                <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-300 font-semibold">Upload photos directly from your phone or computer</p>
                <p className="text-[10px] text-slate-500">Supports PNG, JPG, WEBP, and MP4 video</p>

                <div className="pt-1">
                  <input
                    type="file"
                    id="marketing-file-upload"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    onClick={() => document.getElementById('marketing-file-upload')?.click()}
                    className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs h-8 rounded-xl"
                  >
                    {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
                    {isUploading ? `Uploading... ${uploadProgress}%` : 'Choose Photos / Videos'}
                  </Button>
                </div>

                {isUploading && (
                  <div className="w-full max-w-xs mx-auto pt-2">
                    <Progress value={uploadProgress} className="h-1.5 bg-slate-800" />
                  </div>
                )}
              </div>

              {/* URL Option */}
              <div className="flex gap-2">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Or paste an image/video URL link..."
                  className="bg-slate-950 border-slate-800 text-white text-xs h-9 rounded-xl flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddMediaUrl}
                  disabled={!urlInput.trim()}
                  variant="outline"
                  className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs h-9 rounded-xl px-3"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Media Preview Gallery */}
              {media.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] font-semibold text-slate-400">Attached Photos ({media.length}):</span>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1">
                    {media.map((item, idx) => (
                      <div key={idx} className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 group">
                        {item.type === 'image' ? (
                          <img src={item.url} alt="Media" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-900">
                            <Film className="w-5 h-5 text-pink-400" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(idx)}
                          className="absolute top-1 right-1 bg-red-600/90 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t border-slate-800 pt-3 flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveProject}
              disabled={isSaving || isUploading}
              className="bg-gradient-to-r from-pink-600 to-amber-500 hover:from-pink-500 hover:to-amber-400 text-white font-bold text-xs rounded-xl h-9 px-4"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              {editingProject ? 'Save Changes' : 'Publish Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
