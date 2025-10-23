
'use client';
import { useMemo } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCalculator } from '@/context/calculator-context';
import type { ProjectData } from '@/firebase/data-manager';
import { updateProjectStatus } from '@/firebase/data-manager';
import { Loader2, FilePlus, BadgeCheck, BadgeHelp } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export function ProjectsList() {
  const { firestore, user, isUserLoading } = useFirebase();
  const { setRooms, setSettings, setLintelLength, clearCalculator, setLoadedProjectId } = useCalculator();
  const { toast } = useToast();

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
    setLoadedProjectId(project.id!);
    toast({ title: 'Project Loaded', description: `Loaded "${project.name}".`});
  };

  const handleMarkAsPurchased = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation(); // Prevent the project from loading when the button is clicked
    if (!firestore || !user || !projectId) return;

    const projectRef = doc(firestore, 'customers', user.uid, 'projects', projectId);
    updateProjectStatus(projectRef, 'purchased');
    toast({ title: 'Project Updated', description: `Marked project as purchased.`});
  };
  
  if (isUserLoading || (isLoading && !projects)) {
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
              <Card 
                key={project.id} 
                className="flex flex-col cursor-pointer hover:bg-muted/50"
                onClick={() => handleLoadProject(project)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex justify-between items-start">
                    {project.name}
                    {project.status === 'purchased' ? (
                       <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-600/30">
                         <BadgeCheck /> Purchased
                       </Badge>
                    ) : (
                       <Badge variant="secondary">
                         <BadgeHelp /> Pending
                       </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                   <p className="text-xs text-muted-foreground">
                    Saved on {format(new Date(project.createdAt), 'PP')}
                  </p>
                  {project.purchasedAt && (
                     <p className="text-xs text-green-400 mt-1">
                      Purchased on {format(new Date(project.purchasedAt), 'PP')}
                    </p>
                  )}
                </CardContent>
                <CardContent>
                  {project.status === 'pending' && (
                    <Button 
                      variant="default" 
                      className="w-full"
                      onClick={(e) => handleMarkAsPurchased(e, project.id!)}
                    >
                      <BadgeCheck />
                      Mark as Purchased
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">You have no saved projects yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
