export interface PartnerCompany {
  id: string;
  name: string;
  email: string;
  phone?: string;
  contactPerson?: string;
  defaultProfitMargin: number; // e.g. 15
  createdAt?: string;
}

export interface PartnerProject {
  id: string;
  partnerId: string;
  name: string;
  clientName: string;
  clientContact?: string;
  projectLocation?: string;
  contactPerson?: string;
  rooms: Array<{
    id: string;
    name: string;
    length: number;
    width: number;
  }>;
  profitPercentage: number;
  beamType: 'flat' | 'tbeam';
  createdAt: number;
  updatedAt: number;
}

const SESSION_KEY = 'sila_partner_session';
const PROJECTS_PREFIX = 'sila_partner_projects_';
const ACTIVE_PROJECT_KEY = 'sila_partner_active_project_';

export function getPartnerSession(): PartnerCompany | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Failed to read partner session:', e);
    return null;
  }
}

export function setPartnerSession(company: PartnerCompany): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(company));
  } catch (e) {
    console.error('Failed to write partner session:', e);
  }
}

export function clearPartnerSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.error('Failed to clear partner session:', e);
  }
}

export function getOfflinePartnerProjects(partnerId: string): PartnerProject[] {
  if (typeof window === 'undefined' || !partnerId) return [];
  try {
    const raw = localStorage.getItem(`${PROJECTS_PREFIX}${partnerId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load offline partner projects:', e);
    return [];
  }
}

export function saveOfflinePartnerProject(project: PartnerProject): void {
  if (typeof window === 'undefined' || !project.partnerId) return;
  try {
    const existing = getOfflinePartnerProjects(project.partnerId);
    const index = existing.findIndex(p => p.id === project.id);
    const updated = [...existing];
    if (index >= 0) {
      updated[index] = { ...project, updatedAt: Date.now() };
    } else {
      updated.unshift({ ...project, createdAt: Date.now(), updatedAt: Date.now() });
    }
    localStorage.setItem(`${PROJECTS_PREFIX}${project.partnerId}`, JSON.stringify(updated));
    localStorage.setItem(`${ACTIVE_PROJECT_KEY}${project.partnerId}`, project.id);
  } catch (e) {
    console.error('Failed to save offline partner project:', e);
  }
}

export function deleteOfflinePartnerProject(partnerId: string, projectId: string): void {
  if (typeof window === 'undefined' || !partnerId) return;
  try {
    const existing = getOfflinePartnerProjects(partnerId);
    const updated = existing.filter(p => p.id !== projectId);
    localStorage.setItem(`${PROJECTS_PREFIX}${partnerId}`, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete offline partner project:', e);
  }
}

export function getActivePartnerProjectId(partnerId: string): string | null {
  if (typeof window === 'undefined' || !partnerId) return null;
  return localStorage.getItem(`${ACTIVE_PROJECT_KEY}${partnerId}`);
}
