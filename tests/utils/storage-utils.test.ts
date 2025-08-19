import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  setStorageItem, 
  getStorageItem, 
  removeStorageItem, 
  clearAllStorage,
  savePhaseToStorage,
  getPhaseFromStorage,
  getAllPhasesFromStorage,
  removePhaseFromStorage 
} from '../../client/src/lib/storageUtils';

// Mock localStorage for testing
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock.store[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {};
  }),
  key: vi.fn((index: number) => Object.keys(localStorageMock.store)[index] || null),
  get length() {
    return Object.keys(localStorageMock.store).length;
  }
};

// Mock global localStorage
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('Storage Utils', () => {
  beforeEach(() => {
    // Clear storage before each test
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    localStorageMock.clear();
  });

  describe('setStorageItem', () => {
    it('should store simple values', () => {
      setStorageItem('test-key', 'test-value');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', '"test-value"');
    });

    it('should store complex objects', () => {
      const testObj = { name: 'test', data: [1, 2, 3], nested: { value: true } };
      setStorageItem('test-obj', testObj);
      
      const expectedValue = JSON.stringify(testObj);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('test-obj', expectedValue);
    });

    it('should handle null and undefined values', () => {
      setStorageItem('null-key', null);
      setStorageItem('undefined-key', undefined);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('null-key', 'null');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('undefined-key', 'undefined');
    });

    it('should handle storage quota exceeded error gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      
      // Should not throw error
      expect(() => setStorageItem('test', 'value')).not.toThrow();
    });
  });

  describe('getStorageItem', () => {
    it('should retrieve stored values', () => {
      const testValue = 'stored-value';
      localStorageMock.store['test-key'] = JSON.stringify(testValue);
      
      const result = getStorageItem('test-key');
      expect(result).toBe(testValue);
    });

    it('should retrieve complex objects', () => {
      const testObj = { name: 'test', data: [1, 2, 3] };
      localStorageMock.store['test-obj'] = JSON.stringify(testObj);
      
      const result = getStorageItem('test-obj');
      expect(result).toEqual(testObj);
    });

    it('should return null for non-existent keys', () => {
      const result = getStorageItem('non-existent');
      expect(result).toBeNull();
    });

    it('should handle corrupted JSON gracefully', () => {
      localStorageMock.store['corrupted'] = 'invalid-json-{';
      
      const result = getStorageItem('corrupted');
      expect(result).toBeNull();
    });

    it('should return null for non-existent key', () => {
      const result = getStorageItem('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('removeStorageItem', () => {
    it('should remove existing items', () => {
      localStorageMock.store['test-key'] = 'test-value';
      
      removeStorageItem('test-key');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key');
    });

    it('should handle removing non-existent items gracefully', () => {
      expect(() => removeStorageItem('non-existent')).not.toThrow();
    });
  });

  describe('clearAllStorage', () => {
    it('should clear all localStorage data', () => {
      localStorageMock.store = {
        'item1': 'value1',
        'item2': 'value2',
        'item3': 'value3'
      };
      
      clearAllStorage();
      expect(localStorageMock.clear).toHaveBeenCalled();
    });
  });

  describe('getAllPhasesFromStorage', () => {
    it('should retrieve all phase data from storage', () => {
      // Set up phase data in storage
      localStorageMock.store = {
        'phase1_data': JSON.stringify({ phase1: 'data' }),
        'phase2_data': JSON.stringify({ phase2: 'data' }),
        'other_data': JSON.stringify({ other: true })
      };
      
      const allData = getAllPhasesFromStorage();
      
      expect(typeof allData).toBe('object');
      expect(allData.phase1).toEqual({ phase1: 'data' });
      expect(allData.phase2).toEqual({ phase2: 'data' });
      expect(allData.other_data).toBeUndefined();
    });

    it('should handle empty phase storage', () => {
      const allData = getAllPhasesFromStorage();
      
      expect(typeof allData).toBe('object');
      expect(Object.keys(allData)).toHaveLength(0);
    });
  });
});