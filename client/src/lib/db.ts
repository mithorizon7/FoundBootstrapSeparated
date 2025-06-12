import { apiRequest } from "./queryClient";

export interface TeamData {
  id: number;
  code: string;
  name: string;
  currentPhase: number;
  avatarIcon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PhaseDataType {
  id: number;
  teamId: number;
  phaseNumber: number;
  data: Record<string, any>;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function savePhaseData(teamId: number, phaseNumber: number, data: Record<string, any>): Promise<PhaseDataType> {
  const response = await apiRequest('POST', '/api/phase-data', {
    teamId,
    phaseNumber,
    data
  });
  return response.json();
}

export async function getPhaseData(teamId: number, phaseNumber: number): Promise<PhaseDataType | null> {
  try {
    const response = await apiRequest('GET', `/api/phase-data/${teamId}/${phaseNumber}`);
    return response.json();
  } catch (error) {
    // Return null if not found
    return null;
  }
}

export async function getAllPhaseDataForTeam(teamId: number): Promise<PhaseDataType[]> {
  const response = await apiRequest('GET', `/api/phase-data/${teamId}`);
  return response.json();
}

export async function createTeam(name: string, code: string): Promise<TeamData> {
  const response = await apiRequest('POST', '/api/teams', { name, code });
  return response.json();
}

export async function getTeamByCode(code: string): Promise<TeamData | null> {
  try {
    const response = await apiRequest('GET', `/api/teams/${code}`);
    return response.json();
  } catch (error) {
    return null;
  }
}

export async function updateTeamPhase(teamId: number, currentPhase: number): Promise<TeamData> {
  const response = await apiRequest('PATCH', `/api/teams/${teamId}/phase`, { currentPhase });
  return response.json();
}

export function saveToLocalStorage(phaseNumber: number, data: Record<string, any>): void {
  const key = `phase${phaseNumber}_data`;
  localStorage.setItem(key, JSON.stringify(data));
}

export function getFromLocalStorage(phaseNumber: number): Record<string, any> | null {
  const key = `phase${phaseNumber}_data`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

export function getAllLocalStorageData(): Record<string, any> {
  const allData: Record<string, any> = {};
  
  for (let i = 1; i <= 8; i++) {
    const data = getFromLocalStorage(i);
    if (data) {
      allData[`phase${i}`] = data;
    }
  }
  
  return allData;
}
