
'use client';

import { useEffect } from 'react';
import { doc } from 'firebase/firestore';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { useCalculator } from '@/context/calculator-context';
import type { ProjectData } from '@/context/calculator-context';

import { Header } from '@/components/header';
import { CalculatorShell } from '@/components/silacalc/calculator-shell';
import { Skeleton } from '@/components/ui/skeleton';

interface ProjectPageProps {
  params: {
    id: string;
  };
}

function ProjectLoader({ projectId }: { projectId: string }) {
  const { firestore } = useFirebase();
  const { loadProjectData } = useCalculator();

  const projectRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'projects', projectId) : null),
    [firestore, projectId]
  );
  
  const { data: projectData, isLoading, error } = useDoc<ProjectData>(projectRef);
  
  useEffect(() => {
    if (!isLoading) {
      loadProjectData(projectData);
    }
  }, [projectData, isLoading, loadProjectData]);

  if (isLoading) {
    return (
        <div className="container mx-auto max-w-7xl mt-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="space-y-8 lg:col-span-2">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
                <div className="space-y-8 lg:col-span-1">
                    <Skeleton className="h-96 w-full" />
                    <Skeleton className="h-[500px] w-full" />
                </div>
            </div>
      </div>
    );
  }
  
  if (error) {
      // The loadProjectData function handles showing a toast for not found
      return (
        <div className="flex items-center justify-center h-96">
            <p className="text-destructive">Could not load project. It may have been deleted or the ID is incorrect.</p>
        </div>
      );
  }

  return <CalculatorShell />;
}


export default function ProjectPage({ params }: ProjectPageProps) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <ProjectLoader projectId={params.id} />
      </main>
    </div>
  );
}
