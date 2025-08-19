/**
 * Centralized storage utilities with comprehensive error handling and data validation
 */

import { PHASE_CONFIG } from "../../../shared/constants";

// Storage availability check
function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
}

// Safe JSON operations with error handling
function safeJsonStringify(data: any): string | null {
  try {
    return JSON.stringify(data);
  } catch (error) {
    return null;
  }
}

function safeJsonParse<T = any>(jsonString: string | null): T | null {
  if (!jsonString) return null;
  
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    return null;
  }
}

// Generate consistent storage keys
function getPhaseDataKey(phaseNumber: number): string {
  return `phase${phaseNumber}_data`;
}

function getWorkspaceMetaKey(): string {
  return 'workspace_meta';
}

// Core storage operations with error handling
export function setStorageItem(key: string, value: any): boolean {
  if (!isStorageAvailable()) return false;
  
  const serialized = safeJsonStringify(value);
  if (serialized === null) return false;
  
  try {
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    // Handle quota exceeded or other storage errors
    return false;
  }
}

export function getStorageItem<T = any>(key: string): T | null {
  if (!isStorageAvailable()) return null;
  
  try {
    const item = localStorage.getItem(key);
    return safeJsonParse<T>(item);
  } catch (error) {
    return null;
  }
}

export function removeStorageItem(key: string): boolean {
  if (!isStorageAvailable()) return false;
  
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    return false;
  }
}

export function clearAllStorage(): boolean {
  if (!isStorageAvailable()) return false;
  
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    return false;
  }
}

// Phase-specific storage operations
export function savePhaseToStorage(phaseNumber: number, data: Record<string, any>): boolean {
  if (!Number.isInteger(phaseNumber) || phaseNumber < 1 || phaseNumber > PHASE_CONFIG.TOTAL_PHASES) {
    return false;
  }
  
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return false;
  }
  
  const key = getPhaseDataKey(phaseNumber);
  return setStorageItem(key, data);
}

export function getPhaseFromStorage(phaseNumber: number): Record<string, any> | null {
  if (!Number.isInteger(phaseNumber) || phaseNumber < 1 || phaseNumber > PHASE_CONFIG.TOTAL_PHASES) {
    return null;
  }
  
  const key = getPhaseDataKey(phaseNumber);
  const result = getStorageItem<Record<string, any>>(key);
  
  // Validate returned data is an object
  if (result && typeof result === 'object' && !Array.isArray(result)) {
    return result;
  }
  
  return null;
}

export function getAllPhasesFromStorage(): Record<string, any> {
  const allData: Record<string, any> = {};
  
  for (let i = 1; i <= PHASE_CONFIG.TOTAL_PHASES; i++) {
    const data = getPhaseFromStorage(i);
    if (data) {
      allData[`phase${i}`] = data;
    }
  }
  
  return allData;
}

export function removePhaseFromStorage(phaseNumber: number): boolean {
  if (!Number.isInteger(phaseNumber) || phaseNumber < 1 || phaseNumber > PHASE_CONFIG.TOTAL_PHASES) {
    return false;
  }
  
  const key = getPhaseDataKey(phaseNumber);
  return removeStorageItem(key);
}

// Check if any phase data exists (for workspace detection)
export function hasAnyPhaseData(): boolean {
  for (let i = 1; i <= PHASE_CONFIG.TOTAL_PHASES; i++) {
    if (getPhaseFromStorage(i)) {
      return true;
    }
  }
  return false;
}

// Workspace metadata operations
interface WorkspaceMeta {
  lastAccessed: string;
  version: string;
  [key: string]: any;
}

export function saveWorkspaceMeta(meta: Partial<WorkspaceMeta>): boolean {
  const existing = getWorkspaceMeta() || {};
  const updated = {
    ...existing,
    ...meta,
    lastAccessed: new Date().toISOString(),
    version: '1.0'
  };
  
  return setStorageItem(getWorkspaceMetaKey(), updated);
}

export function getWorkspaceMeta(): WorkspaceMeta | null {
  return getStorageItem<WorkspaceMeta>(getWorkspaceMetaKey());
}

// Storage migration and cleanup utilities
export function migrateStorageFormat(): boolean {
  if (!isStorageAvailable()) return false;
  
  try {
    let migrated = false;
    const keysToMigrate: string[] = [];
    
    // Safely collect keys that need migration
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('phase') && !key.endsWith('_data')) {
        keysToMigrate.push(key);
      }
    }
    
    // Process migration for collected keys
    for (const key of keysToMigrate) {
      const data = getStorageItem(key);
      if (data) {
        const phaseMatch = key.match(/^phase(\d+)$/);
        if (phaseMatch) {
          const phaseNumber = parseInt(phaseMatch[1], 10);
          if (phaseNumber >= 1 && phaseNumber <= PHASE_CONFIG.TOTAL_PHASES) {
            if (savePhaseToStorage(phaseNumber, data)) {
              removeStorageItem(key);
              migrated = true;
            }
          }
        }
      }
    }
    
    return migrated;
  } catch (error) {
    return false;
  }
}

// Get storage info for debugging and analytics
export function getStorageInfo(): {
  available: boolean;
  phaseCount: number;
  totalKeys: number;
  storageUsed?: number;
  phaseDetails: Array<{ phase: number; hasData: boolean; dataSize?: number }>;
} {
  const info = {
    available: isStorageAvailable(),
    phaseCount: 0,
    totalKeys: 0,
    storageUsed: undefined as number | undefined,
    phaseDetails: [] as Array<{ phase: number; hasData: boolean; dataSize?: number }>
  };
  
  if (info.available) {
    try {
      info.totalKeys = localStorage.length;
      
      // Count phase data with detailed breakdown
      for (let i = 1; i <= PHASE_CONFIG.TOTAL_PHASES; i++) {
        const data = getPhaseFromStorage(i);
        const hasData = !!data;
        let dataSize: number | undefined;
        
        if (hasData) {
          info.phaseCount++;
          const serialized = safeJsonStringify(data);
          dataSize = serialized?.length;
        }
        
        info.phaseDetails.push({
          phase: i,
          hasData,
          dataSize
        });
      }
      
      // Safely calculate storage usage
      let totalSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        try {
          const key = localStorage.key(i);
          if (key) {
            const value = localStorage.getItem(key);
            totalSize += key.length + (value?.length || 0);
          }
        } catch (itemError) {
          // Skip this item if there's an error accessing it
        }
      }
      info.storageUsed = totalSize;
    } catch (error) {
      // Gracefully handle errors while gathering storage info
    }
  }
  
  return info;
}