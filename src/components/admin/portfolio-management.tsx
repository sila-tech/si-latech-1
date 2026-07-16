'use client';

import React, { useState, useEffect } from 'react';
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
  ExternalLink 
} from 'lucide-react';

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

export function PortfolioManagement() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { firebaseApp } = useFirebase();

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
  
  // Submit Loading State
  const [isSaving, setIsSaving] = useState(false);

  // Fetch portfolio projects
  const portfolioQuery = useMemoFirebase(
    () => query(collection(firestore, 'portfolio'), orderBy('createdAt', 'desc')),
    [firestore]
  );
  const { data: projects, isLoading: projectsLoading } = useCollection<PortfolioProject>(portfolioQuery);

  // Reset form when dialog opens/closes
  const handleOpenNew = () => {
    setEditingProject(null);
    setTitle('');
    setDescription('');
    setLocation('');
    setStatus('completed');
    setMedia([]);
    setUrlInput('');
    setIsOpen(true);
  };

  const handleOpenEdit = (project: PortfolioProject) => {
    setEditingProject(project);
    setTitle(project.title);
    setDescription(project.description);
    setLocation(project.location);
    setStatus(project.status);
    setMedia(project.media || []);
    setUrlInput('');
    setIsOpen(true);
  };

  // Upload file to Firebase Storage
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const storage = getStorage(firebaseApp);
      const storageRef = ref(storage, `portfolio/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          console.error('Firebase Storage upload failed:', error);
          setIsUploading(false);
          toast({
            title: 'Upload Failed',
            description: 'Could not upload the file. Verify Firebase Storage is configured in your project.',
            variant: 'destructive',
          });
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const type = file.type.startsWith('video/') ? 'video' : 'image';
          setMedia((prev) => [...prev, { type, url: downloadUrl }]);
          setIsUploading(false);
          toast({
            title: 'Upload Success',
            description: `Successfully uploaded ${file.name}.`,
          });
        }
      );
    } catch (err) {
      console.error('Storage Initialization error:', err);
      setIsUploading(false);
      toast({
        title: 'Storage Error',
        description: 'Failed to access Firebase Storage. Use the URL input fallback.',
        variant: 'destructive',
      });
    }
  };

  // Add external media URL
  const handleAddMediaUrl = () => {
    if (!urlInput.trim()) return;
    setMedia((prev) => [...prev, { type: urlType, url: urlInput.trim() }]);
    setUrlInput('');
    toast({
      title: 'Media Added',
      description: 'External media URL added successfully.',
    });
  };

  // Remove media item
  const handleRemoveMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit / Save Project
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim() || !description.trim()) {
      toast({
        title: 'Required Fields Missing',
        description: 'Please fill in the title, location, and description fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      const projectData = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        status,
        media,
        updatedAt: serverTimestamp(),
      };

      if (editingProject) {
        // Edit existing project
        const projectRef = doc(firestore, 'portfolio', editingProject.id);
        await updateDoc(projectRef, projectData);
        toast({
          title: 'Project Updated',
          description: `"${title}" has been updated in the gallery.`,
        });
      } else {
        // Create new project
        const projectsColRef = collection(firestore, 'portfolio');
        await addDoc(projectsColRef, {
          ...projectData,
          createdAt: serverTimestamp(),
        });
        toast({
          title: 'Project Created',
          description: `"${title}" has been added to the gallery.`,
        });
      }
      setIsOpen(false);
    } catch (err: any) {
      console.error('Error saving portfolio project:', err);
      toast({
        title: 'Error Saving Project',
        description: err.message || 'An error occurred while saving. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Project
  const handleDeleteProject = async (projectId: string, projectTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${projectTitle}" from the gallery?`)) {
      return;
    }

    try {
      const projectRef = doc(firestore, 'portfolio', projectId);
      await deleteDoc(projectRef);
      toast({
        title: 'Project Deleted',
        description: `"${projectTitle}" has been removed.`,
      });
    } catch (err: any) {
      console.error('Error deleting project:', err);
      toast({
        title: 'Delete Failed',
        description: err.message || 'Could not delete project.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="border border-slate-200 shadow-sm bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-slate-100">
        <div>
          <CardTitle className="text-xl font-headline font-black text-[#095388]">Projects Gallery</CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-1">
            Manage your completed and ongoing projects shown on the public site.
          </CardDescription>
        </div>
        <Button 
          onClick={handleOpenNew}
          className="bg-primary hover:bg-primary/95 text-white font-bold text-xs h-10 px-4 rounded-xl flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} />
          Add Project
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        {projectsLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-semibold">Loading gallery projects...</p>
          </div>
        ) : !projects || projects.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <ImageIcon className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h3 className="font-bold text-slate-700 text-sm">No Projects Uploaded Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              Share images and videos of your ongoing construction works and completed slab installations with your customers.
            </p>
            <Button onClick={handleOpenNew} variant="outline" size="sm" className="rounded-xl border-slate-350 hover:bg-slate-100">
              <Plus size={14} className="mr-1.5" /> Add Your First Project
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-150">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-150">
                <TableRow>
                  <TableHead className="w-[100px] text-xs font-bold text-slate-500">Preview</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500">Project Details</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500">Location</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500">Status</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500">Media Count</TableHead>
                  <TableHead className="text-right text-xs font-bold text-slate-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((proj) => {
                  const coverImage = proj.media?.find((m) => m.type === 'image')?.url || '/placeholder.png';
                  return (
                    <TableRow key={proj.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="align-middle">
                        <div className="relative w-16 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                          {proj.media && proj.media.length > 0 ? (
                            proj.media[0].type === 'video' ? (
                              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 text-white">
                                <Film size={16} />
                              </div>
                            ) : (
                              <img src={coverImage} alt="" className="w-full h-full object-cover" />
                            )
                          ) : (
                            <ImageIcon className="text-slate-300" size={18} />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-middle max-w-[280px]">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{proj.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{proj.description}</p>
                      </TableCell>
                      <TableCell className="align-middle text-xs font-medium text-slate-700">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} className="text-slate-400" />
                          {proj.location}
                        </span>
                      </TableCell>
                      <TableCell className="align-middle">
                        <Badge 
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                            proj.status === 'completed' 
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          }`}
                        >
                          {proj.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-middle text-xs font-semibold text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <ImageIcon size={13} className="text-slate-400" /> {proj.media?.filter(m => m.type === 'image').length || 0} Images
                          <span className="text-slate-300">•</span>
                          <Film size={13} className="text-slate-400" /> {proj.media?.filter(m => m.type === 'video').length || 0} Videos
                        </span>
                      </TableCell>
                      <TableCell className="align-middle text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button 
                            onClick={() => handleOpenEdit(proj)}
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg text-slate-500 hover:text-primary hover:bg-slate-100"
                            title="Edit details"
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button 
                            onClick={() => handleDeleteProject(proj.id, proj.title)}
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg text-slate-500 hover:text-destructive hover:bg-destructive/10"
                            title="Delete project"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Add / Edit Dialog Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto bg-white rounded-2xl p-6 sm:p-8 scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="font-headline font-black text-slate-900 text-lg">
              {editingProject ? 'Edit Gallery Project' : 'Add Gallery Project'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveProject} className="space-y-5 pt-4">
            
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="proj-title" className="text-xs font-bold text-slate-700">Project Title</Label>
              <Input 
                id="proj-title"
                placeholder="e.g. Completed T-Beam slab in Ruiru, 350sqm" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="h-10 rounded-xl border-slate-200 text-xs focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>

            {/* Location & Status in Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="proj-location" className="text-xs font-bold text-slate-700">Location</Label>
                <Input 
                  id="proj-location"
                  placeholder="e.g. Ruiru, Kiambu" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  className="h-10 rounded-xl border-slate-200 text-xs focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="proj-status" className="text-xs font-bold text-slate-700">Status</Label>
                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                  <SelectTrigger id="proj-status" className="h-10 rounded-xl border-slate-200 text-xs focus:ring-1 focus:ring-primary">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="ongoing" className="text-xs">Ongoing Project</SelectItem>
                    <SelectItem value="completed" className="text-xs">Completed Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="proj-desc" className="text-xs font-bold text-slate-700">Project Description</Label>
              <Textarea 
                id="proj-desc"
                placeholder="Describe the scope of work, slab size, system type (T-Beam or Flat beam), materials used, and time taken..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                className="rounded-xl border-slate-200 text-xs focus-visible:ring-1 focus-visible:ring-primary resize-none"
              />
            </div>

            {/* Media Upload Section */}
            <div className="space-y-3.5 border-t border-slate-100 pt-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Project Media Gallery</h4>
              
              {/* Media Previews */}
              {media.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 border border-slate-150 p-2.5 rounded-xl bg-slate-50/50 max-h-36 overflow-y-auto scrollbar-none">
                  {media.map((item, idx) => (
                    <div key={idx} className="group relative aspect-video rounded-lg border border-slate-200 bg-slate-900 overflow-hidden flex items-center justify-center">
                      {item.type === 'video' ? (
                        <div className="text-white text-[10px] flex flex-col items-center gap-0.5">
                          <Film size={14} />
                          <span>Video</span>
                        </div>
                      ) : (
                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                      )}
                      
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(idx)}
                        className="absolute top-1 right-1 h-5 w-5 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-md scale-0 group-hover:scale-100 transition-transform duration-200"
                        title="Remove media"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload controls */}
              <div className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {/* File selector input */}
                  <div className="w-full sm:flex-1">
                    <Label htmlFor="media-file" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Upload Photos/Videos
                    </Label>
                    <div className="relative">
                      <Input
                        id="media-file"
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                      <Label
                        htmlFor="media-file"
                        className={`h-9 border border-dashed border-slate-300 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold hover:bg-slate-100 hover:border-primary/50 transition-all ${
                          isUploading ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        <Upload size={14} className="text-slate-400" />
                        Choose File (Max 20MB)
                      </Label>
                    </div>
                  </div>

                  <div className="hidden sm:block text-slate-300 text-xs font-bold pt-4">OR</div>

                  {/* External URL Input */}
                  <div className="w-full sm:flex-1">
                    <Label htmlFor="media-url" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Add Media URL Fallback
                    </Label>
                    <div className="flex items-center gap-1.5">
                      <Select 
                        value={urlType} 
                        onValueChange={(val: any) => setUrlType(val)}
                      >
                        <SelectTrigger className="h-9 w-20 rounded-lg border-slate-200 text-xs px-2 shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="image" className="text-xs">Image</SelectItem>
                          <SelectItem value="video" className="text-xs">Video</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="relative flex-1">
                        <Input
                          id="media-url"
                          type="url"
                          placeholder="https://..."
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          className="h-9 rounded-lg border-slate-200 text-xs focus-visible:ring-1 pr-8"
                        />
                        <button
                          type="button"
                          onClick={handleAddMediaUrl}
                          disabled={!urlInput.trim()}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors disabled:opacity-20"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Uploading progress bar */}
                {isUploading && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Loader2 size={10} className="animate-spin text-primary" />
                        Uploading to Firebase Storage...
                      </span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-1 bg-slate-200" />
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <DialogFooter className="border-t border-slate-100 pt-4 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSaving}
                className="rounded-xl border-slate-350 hover:bg-slate-50 text-xs h-10 px-5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving || isUploading}
                className="bg-primary hover:bg-primary/95 text-white font-bold text-xs h-10 px-5 rounded-xl flex items-center justify-center shadow-sm"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : (
                  'Save Project'
                )}
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
