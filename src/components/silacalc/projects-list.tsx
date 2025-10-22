'use client';
import { useMemo } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCalculator } from '@/context/calculator-context';
import type { ProjectData } from '@/firebase/data-manager';
import { Loader2, FilePlus } from 'lucide-react';
import { format } from 'date-fns';

export function ProjectsList() {
  const { firestore, user, isUserLoading } = useFirebase();
  const { setRooms, setSettings, setLintelLength, clearCalculator } = useCalculator();

  const projectsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'customers', user.uid, 'projects');
  }, [firestore, user]);

  const { data: projects, isLoading } = useCollection<ProjectData>(projectsQuery);

  const sortedProjects = useMemo(() => {
    if (!projects) return [];
    return [...projects].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [projects]);


  const handleLoadProject = (project: ProjectData) => {
    setRooms(project.rooms || []);
    setSettings(project.settings);
    setLintelLength(project.lintelLength || 0);
  };
  
  if (isUserLoading || isLoading) {
    return (
        <Card className="mb-8">
            <CardHeader>
                <CardTitle>My Projects</CardTitle>
                <CardDescription>Your saved projects will appear here.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center p-8">
                <Loader2 className="animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Loading projects...</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>My Projects</CardTitle>
          <CardDescription>Load a previously saved project or start a new one.</CardDescription>
        </div>
        <Button onClick={clearCalculator} variant="outline">
            <FilePlus/>
            New Project
        </Button>
      </CardHeader>
      <CardContent>
        {sortedProjects && sortedProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortedProjects.map((project) => (
              <Button
                key={project.id}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start justify-between"
                onClick={() => handleLoadProject(project)}
              >
                <div className="font-semibold text-base">{project.name}</div>
                <div className="text-xs text-muted-foreground mt-2">
                  Saved on {format(new Date(project.createdAt), 'PP')}
                </div>
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">You have no saved projects yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
