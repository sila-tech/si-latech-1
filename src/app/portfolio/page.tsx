'use client';

import React, { useState } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { MobileQuoteBar } from '@/components/mobile-quote-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Loader2, 
  MapPin, 
  ImageIcon, 
  Film, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2,
  Calendar,
  Construction,
  CheckCircle2
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
}

export default function PortfolioPage() {
  const firestore = useFirestore();

  // Selected project for lightbox modal
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  // Filter state: 'all' | 'completed' | 'ongoing'
  const [filter, setFilter] = useState<'all' | 'completed' | 'ongoing'>('all');

  // Fetch portfolio projects
  const portfolioQuery = useMemoFirebase(
    () => query(collection(firestore, 'portfolio'), orderBy('createdAt', 'desc')),
    [firestore]
  );
  const { data: projects, isLoading } = useCollection<PortfolioProject>(portfolioQuery);

  // Filtered projects
  const filteredProjects = projects?.filter((proj) => {
    if (filter === 'all') return true;
    return proj.status === filter;
  });

  const handleOpenLightbox = (project: PortfolioProject) => {
    setSelectedProject(project);
    setActiveMediaIndex(0);
  };

  const handlePrevMedia = () => {
    if (!selectedProject) return;
    setActiveMediaIndex((prev) => 
      prev === 0 ? selectedProject.media.length - 1 : prev - 1
    );
  };

  const handleNextMedia = () => {
    if (!selectedProject) return;
    setActiveMediaIndex((prev) => 
      prev === selectedProject.media.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50">
      <Header />
      
      <main className="flex-1 pb-24">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-slate-950 text-white py-20 px-4">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
          
          <div className="container mx-auto max-w-7xl relative z-10 text-center sm:text-left">
            <span className="text-[#f59e0b] text-xs font-black uppercase tracking-widest mb-3 block">
              SI-LATECH Showcase
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4 max-w-3xl leading-tight font-headline">
              Our Construction <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-sky-400">Portfolio</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
              Explore our completed slab installations and ongoing building works across Kenya. 
              See the efficiency and quality of our precast beam and block flooring systems.
            </p>
          </div>
        </section>

        {/* Portfolio Filter & Grid Section */}
        <section className="container mx-auto max-w-7xl px-4 py-12">
          
          {/* Filters */}
          <div className="flex justify-center sm:justify-start gap-2 mb-10 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: 'all', label: 'All Projects', icon: null },
              { id: 'completed', label: 'Completed', icon: <CheckCircle2 size={14} className="text-emerald-500" /> },
              { id: 'ongoing', label: 'Ongoing Works', icon: <Construction size={14} className="text-amber-500 animate-spin" style={{ animationDuration: '4s' }} /> },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFilter(btn.id as any)}
                className={`rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 border flex items-center gap-1.5 shrink-0 ${
                  filter === btn.id
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350 hover:bg-slate-50'
                }`}
              >
                {btn.icon}
                {btn.label}
              </button>
            ))}
          </div>

          {/* Loader */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400 gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Loading portfolio...</p>
            </div>
          ) : !filteredProjects || filteredProjects.length === 0 ? (
            <div className="text-center py-24 border border-slate-200 rounded-3xl bg-white max-w-lg mx-auto shadow-sm">
              <ImageIcon className="mx-auto h-14 w-14 text-slate-300 mb-4" />
              <h3 className="text-lg font-black text-slate-800">No Projects Found</h3>
              <p className="text-slate-500 text-xs mt-1.5 max-w-xs mx-auto">
                We haven't added any projects under this category yet. Please check back soon or consult our calculators.
              </p>
            </div>
          ) : (
            /* Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map((proj) => {
                const coverImage = proj.media?.find((m) => m.type === 'image')?.url || '/placeholder.png';
                const hasVideo = proj.media?.some((m) => m.type === 'video');
                const imageCount = proj.media?.filter((m) => m.type === 'image').length || 0;
                const videoCount = proj.media?.filter((m) => m.type === 'video').length || 0;

                return (
                  <div 
                    key={proj.id}
                    onClick={() => handleOpenLightbox(proj)}
                    className="group bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:border-primary/20 hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer"
                  >
                    {/* Media Thumbnail Container */}
                    <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden">
                      <img 
                        src={coverImage} 
                        alt={proj.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      
                      {/* Dark overlay on hover */}
                      <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/40 transition-colors flex items-center justify-center">
                        <span className="w-10 h-10 rounded-full bg-white/95 text-slate-900 flex items-center justify-center shadow-lg opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300">
                          <Maximize2 size={16} />
                        </span>
                      </div>

                      {/* Top Badges */}
                      <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
                        <Badge 
                          className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                            proj.status === 'completed' 
                              ? 'bg-emerald-500 text-white' 
                              : 'bg-amber-500 text-slate-950'
                          }`}
                        >
                          {proj.status}
                        </Badge>
                      </div>

                      {/* Location Badge (Bottom Left) */}
                      <div className="absolute bottom-4 left-4">
                        <span className="bg-slate-950/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                          <MapPin size={11} className="text-amber-400" />
                          {proj.location}
                        </span>
                      </div>

                      {/* Media counts indicator */}
                      <div className="absolute bottom-4 right-4">
                        <span className="bg-slate-950/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
                          {imageCount > 0 && <span className="flex items-center gap-0.5"><ImageIcon size={10} /> {imageCount}</span>}
                          {videoCount > 0 && <span className="flex items-center gap-0.5"><Film size={10} /> {videoCount}</span>}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <h3 className="font-headline font-black text-slate-900 text-lg leading-tight group-hover:text-primary transition-colors">
                          {proj.title}
                        </h3>
                        <p className="text-slate-600 text-xs leading-relaxed line-clamp-3">
                          {proj.description}
                        </p>
                      </div>

                      <div className="border-t border-slate-100 pt-4 mt-5 flex items-center justify-between text-xs font-black text-primary uppercase tracking-wider">
                        <span>View Project Gallery</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Call to Action section */}
        <section className="container mx-auto max-w-7xl px-4 mt-8">
          <div className="bg-gradient-to-r from-slate-900 to-slate-950 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden border border-slate-800 shadow-xl">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="max-w-2xl mx-auto space-y-6 relative z-10">
              <h2 className="text-3xl md:text-4xl font-headline font-black tracking-tight">
                Ready to Build Your Next Floor Slab?
              </h2>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                Use our automated SilaCalc™ calculator to instantly estimate your beam and block materials, 
                and get an official quotation sent straight to your phone.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button asChild className="bg-primary hover:bg-primary/95 text-white font-bold h-12 px-6 rounded-xl w-full sm:w-auto">
                  <Link href="/">Use SilaCalc™ Calculator</Link>
                </Button>
                <Button asChild variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-900 hover:text-white h-12 px-6 rounded-xl w-full sm:w-auto">
                  <Link href="/contact">Get Custom Quote</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Lightbox / Media Slider Dialog */}
      <Dialog open={selectedProject !== null} onOpenChange={() => setSelectedProject(null)}>
        {selectedProject && (
          <DialogContent className="max-w-3xl bg-slate-950 border border-slate-900 p-0 overflow-hidden rounded-2xl flex flex-col focus:outline-none">
            
            {/* Gallery Media Viewport */}
            <div className="relative bg-black flex items-center justify-center min-h-[300px] md:h-[450px]">
              {selectedProject.media && selectedProject.media.length > 0 ? (
                selectedProject.media[activeMediaIndex].type === 'video' ? (
                  <video 
                    key={selectedProject.media[activeMediaIndex].url}
                    src={selectedProject.media[activeMediaIndex].url}
                    controls
                    autoPlay
                    muted
                    className="w-full h-full max-h-[450px] object-contain"
                  />
                ) : (
                  <img 
                    src={selectedProject.media[activeMediaIndex].url}
                    alt="" 
                    className="w-full h-full max-h-[450px] object-contain"
                  />
                )
              ) : (
                <div className="text-slate-500 text-xs flex flex-col items-center gap-2">
                  <ImageIcon size={32} />
                  <span>No media loaded.</span>
                </div>
              )}

              {/* Slider Navigation Arrows (only show if more than 1 item) */}
              {selectedProject.media && selectedProject.media.length > 1 && (
                <>
                  <button 
                    onClick={handlePrevMedia}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-sm transition-colors border border-white/10"
                    title="Previous media"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    onClick={handleNextMedia}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-sm transition-colors border border-white/10"
                    title="Next media"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Top counter index (Top Right) */}
              {selectedProject.media && selectedProject.media.length > 1 && (
                <div className="absolute top-4 right-4 bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                  {activeMediaIndex + 1} / {selectedProject.media.length}
                </div>
              )}
            </div>

            {/* Project description detail in Lightbox */}
            <div className="p-6 bg-slate-900 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
                <DialogTitle className="font-headline font-black text-xl text-slate-100">
                  {selectedProject.title}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Badge 
                    className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest shrink-0 ${
                      selectedProject.status === 'completed' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/10' 
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/10'
                    }`}
                  >
                    {selectedProject.status}
                  </Badge>
                  <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                    <MapPin size={10} className="text-amber-400" />
                    {selectedProject.location}
                  </span>
                </div>
              </div>
              
              <p className="text-xs text-slate-400 leading-relaxed font-normal whitespace-pre-wrap">
                {selectedProject.description}
              </p>
            </div>

          </DialogContent>
        )}
      </Dialog>

      <Footer />
      <MobileQuoteBar />
    </div>
  );
}
