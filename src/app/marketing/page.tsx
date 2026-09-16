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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Marketing Header */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 h-18 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-white border border-slate-200 p-1 shadow-xs">
              <img src="/logo.png" alt="SI-LATECH Logo" className="h-full w-full object-contain" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-950 text-lg tracking-tight leading-none">SI-LATECH</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#095388] bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                  Marketing Portal
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 block mt-0.5">
                Signed in as <span className="font-bold text-slate-700">{username}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button asChild variant="outline" size="sm" className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs h-9 rounded-xl gap-1.5 shadow-xs">
              <Link href="/portfolio" target="_blank">
                <ExternalLink className="w-3.5 h-3.5 text-[#095388]" /> View Public Portfolio
              </Link>
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-xs h-9 rounded-xl gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Log Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Title Bar & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight font-headline">
              Project Media &amp; Showcase Hub
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Upload, organize, and manage photos of ongoing and completed precast slab construction sites.
            </p>
          </div>
          <Button
            onClick={handleOpenNewDialog}
            className="bg-[#095388] hover:bg-[#073f67] text-white font-bold text-xs h-10 px-5 rounded-xl shadow-md gap-2 shrink-0 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" /> Add Project Showcase
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white border-slate-200/80 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Projects</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{projects?.length || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#095388] flex items-center justify-center border border-sky-100">
                <Layers className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200/80 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Ongoing Sites</p>
                <p className="text-2xl font-black text-amber-600 mt-1">{totalOngoing}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60">
                <Clock className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200/80 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Completed Sites</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">{totalCompleted}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200/80 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-[#095388] uppercase tracking-wider">Photos &amp; Videos</p>
                <p className="text-2xl font-black text-[#095388] mt-1">{totalMedia}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#095388] flex items-center justify-center border border-sky-200/60">
                <Camera className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/80 p-3 rounded-2xl shadow-xs">
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
            {(['all', 'ongoing', 'completed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                  statusFilter === s
                    ? 'bg-white text-[#095388] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s === 'all' ? `All (${projects?.length || 0})` : `${s} (${(projects || []).filter(p => p.status === s).length})`}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or location..."
              className="bg-slate-50 border-slate-200 text-slate-900 text-xs h-9 pl-9 rounded-xl placeholder:text-slate-400 focus-visible:ring-[#095388]"
            />
          </div>
        </div>

        {/* Project Showcase Cards Grid */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#095388]" />
            <p className="text-xs font-semibold text-slate-500">Loading portfolio projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card className="bg-white border border-dashed border-slate-300 text-center py-16 rounded-2xl">
            <CardContent className="space-y-3">
              <Camera className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-slate-600 text-sm font-medium">No showcase projects found.</p>
              <Button onClick={handleOpenNewDialog} className="bg-[#095388] hover:bg-[#073f67] text-white text-xs font-bold rounded-xl">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const coverMedia = project.media && project.media.length > 0 ? project.media[0] : null;

              return (
                <Card key={project.id} className="bg-white border-slate-200/80 shadow-xs text-slate-900 overflow-hidden rounded-2xl flex flex-col justify-between hover:shadow-md transition-all group">
                  <div>
                    {/* Media Cover */}
                    <div className="relative h-48 bg-slate-100 overflow-hidden border-b border-slate-100">
                      {coverMedia ? (
                        coverMedia.type === 'image' ? (
                          <img
                            src={coverMedia.url}
                            alt={project.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white">
                            <Film className="w-10 h-10 text-sky-400" />
                          </div>
                        )
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1 bg-slate-100">
                          <ImageIcon className="w-8 h-8" />
                          <span className="text-[11px] font-medium">No photo uploaded</span>
                        </div>
                      )}

                      <div className="absolute top-3 left-3">
                        <Badge className={`text-[10px] font-black uppercase shadow-xs ${
                          project.status === 'ongoing' 
                            ? 'bg-amber-500 text-slate-950 hover:bg-amber-500' 
                            : 'bg-emerald-600 text-white hover:bg-emerald-600'
                        }`}>
                          {project.status === 'ongoing' ? 'Ongoing Site' : 'Completed Project'}
                        </Badge>
                      </div>

                      <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1.5">
                        <Camera className="w-3 h-3 text-amber-400" />
                        <span>{project.media?.length || 0} media</span>
                      </div>
                    </div>

                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base font-bold text-slate-900 line-clamp-1">
                        {project.title}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[#095388] shrink-0" />
                        <span className="truncate">{project.location}</span>
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-4 pt-1">
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {project.description || 'No description provided.'}
                      </p>
                    </CardContent>
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                    <Button
                      onClick={() => handleOpenEditDialog(project)}
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-white hover:bg-slate-100 text-slate-800 border-slate-200 text-xs font-semibold h-8 rounded-xl gap-1 shadow-xs"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#095388]" /> Manage Photos
                    </Button>
                    <Button
                      onClick={() => handleDeleteProject(project.id, project.title)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0 rounded-xl"
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
        <DialogContent className="max-w-2xl bg-white text-slate-900 border-slate-200 max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-50 text-[#095388] flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
              {editingProject ? 'Edit Showcase Project & Photos' : 'Add New Project to Showcase'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Project Title *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., 5-Bedroom Luxury Slab - Runda"
                  className="bg-white border-slate-200 text-slate-900 text-xs h-9 rounded-xl focus-visible:ring-[#095388]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Site Location *</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Runda, Nairobi"
                  className="bg-white border-slate-200 text-slate-900 text-xs h-9 rounded-xl focus-visible:ring-[#095388]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Project Stage / Status</Label>
              <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                <SelectTrigger className="bg-white border-slate-200 text-slate-900 text-xs h-9 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900 text-xs">
                  <SelectItem value="ongoing">Ongoing Construction Site</SelectItem>
                  <SelectItem value="completed">Completed Precast Slab Project</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Highlight beam types used, spans, delivery logistics, or customer feedback..."
                className="bg-white border-slate-200 text-slate-900 text-xs rounded-xl min-h-[70px] focus-visible:ring-[#095388]"
              />
            </div>

            {/* Photo & Video Upload Section */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <Label className="text-xs font-bold text-[#095388] uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4" /> Upload Project Photos &amp; Media
              </Label>

              {/* Direct File Upload */}
              <div className="border border-dashed border-slate-300 bg-slate-50/60 rounded-2xl p-4 text-center space-y-2">
                <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-700 font-semibold">Upload photos directly from your phone or computer</p>
                <p className="text-[10px] text-slate-400">Supports PNG, JPG, WEBP, and MP4 video</p>

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
                    className="border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs h-8 rounded-xl shadow-xs"
                  >
                    {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
                    {isUploading ? `Uploading... ${uploadProgress}%` : 'Choose Photos / Videos'}
                  </Button>
                </div>

                {isUploading && (
                  <div className="w-full max-w-xs mx-auto pt-2">
                    <Progress value={uploadProgress} className="h-1.5 bg-slate-200" />
                  </div>
                )}
              </div>

              {/* URL Option */}
              <div className="flex gap-2">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Or paste an image/video URL link..."
                  className="bg-white border-slate-200 text-slate-900 text-xs h-9 rounded-xl flex-1 focus-visible:ring-[#095388]"
                />
                <Button
                  type="button"
                  onClick={handleAddMediaUrl}
                  disabled={!urlInput.trim()}
                  variant="outline"
                  className="border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs h-9 rounded-xl px-3"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Media Preview Gallery */}
              {media.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] font-semibold text-slate-500">Attached Photos ({media.length}):</span>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1">
                    {media.map((item, idx) => (
                      <div key={idx} className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
                        {item.type === 'image' ? (
                          <img src={item.url} alt="Media" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white">
                            <Film className="w-5 h-5 text-sky-400" />
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

          <DialogFooter className="border-t border-slate-100 pt-3 flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-slate-900 text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveProject}
              disabled={isSaving || isUploading}
              className="bg-[#095388] hover:bg-[#073f67] text-white font-bold text-xs rounded-xl h-9 px-4 shadow-sm"
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
