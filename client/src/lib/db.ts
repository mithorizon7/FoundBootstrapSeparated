import { apiRequest } from "./queryClient";
import { PHASE_CONFIG } from "@shared/constants";

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

// Re-export storage utilities for backward compatibility
export { 
  savePhaseToStorage as saveToLocalStorage,
  getPhaseFromStorage as getFromLocalStorage,
  getAllPhasesFromStorage as getAllLocalStorageData
} from './storageUtils';
