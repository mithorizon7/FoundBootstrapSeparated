import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  getUrlParams, 
  getUrlParam,
  getAllUrlParams,
  buildUrlWithParams, 
  navigateWithParams, 
  removeUrlParams,
  hasUrlParams
} from '../../client/src/lib/urlUtils';

// Mock window.location and history
const mockLocation = {
  href: 'http://localhost:3000/test',
  search: '',
  pathname: '/test',
  hash: '',
  host: 'localhost:3000',
  hostname: 'localhost',
  origin: 'http://localhost:3000',
  port: '3000',
  protocol: 'http:',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn()
};

// Mock window.location.href setter
Object.defineProperty(mockLocation, 'href', {
  value: 'http://localhost:3000/test',
  writable: true
});

const mockHistory = {
  pushState: vi.fn(),
  replaceState: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  go: vi.fn(),
  length: 1,
  scrollRestoration: 'auto' as ScrollRestoration,
  state: null
};

Object.defineProperty(global, 'window', {
  value: {
    location: mockLocation,
    history: mockHistory
  },
  writable: true
});

describe('URL Utils', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    mockLocation.search = '';
    mockLocation.pathname = '/test';
    mockLocation.href = 'http://localhost:3000/test';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getUrlParams', () => {
    it('should return URLSearchParams object', () => {
      mockLocation.search = '?workspace=ABC123&phase=2&debug=true';
      
      const params = getUrlParams();
      
      expect(params).toBeInstanceOf(URLSearchParams);
      expect(params.get('workspace')).toBe('ABC123');
      expect(params.get('phase')).toBe('2');
      expect(params.get('debug')).toBe('true');
    });

    it('should handle empty search params', () => {
      mockLocation.search = '';
      
      const params = getUrlParams();
      
      expect(params).toBeInstanceOf(URLSearchParams);
      expect(params.get('workspace')).toBeNull();
    });
  });

  describe('getAllUrlParams', () => {
    it('should return plain object with all URL parameters', () => {
      mockLocation.search = '?workspace=ABC123&phase=2&debug=true';
      
      const params = getAllUrlParams();
      
      expect(params).toEqual({
        workspace: 'ABC123',
        phase: '2',
        debug: 'true'
      });
    });

    it('should handle empty search params', () => {
      mockLocation.search = '';
      
      const params = getAllUrlParams();
      
      expect(params).toEqual({});
    });

    it('should decode URL-encoded values', () => {
      mockLocation.search = '?name=John%20Doe&email=test%40example.com';
      
      const params = getAllUrlParams();
      
      expect(params.name).toBe('John Doe');
      expect(params.email).toBe('test@example.com');
    });
  });

  describe('buildUrlWithParams', () => {
    it('should build URL with parameters correctly', () => {
      const baseUrl = '/phase/1';
      const params = { workspace: 'ABC123', debug: 'true' };
      
      const url = buildUrlWithParams(baseUrl, params);
      
      expect(url).toBe('/phase/1?workspace=ABC123&debug=true');
    });

    it('should handle empty parameters', () => {
      const baseUrl = '/phase/1';
      const params = {};
      
      const url = buildUrlWithParams(baseUrl, params);
      
      expect(url).toBe('/phase/1');
    });

    it('should handle URL with existing parameters', () => {
      const baseUrl = '/phase/1?existing=value';
      const params = { workspace: 'ABC123' };
      
      const url = buildUrlWithParams(baseUrl, params);
      
      expect(url).toBe('/phase/1?existing=value&workspace=ABC123');
    });

    it('should encode special characters in parameters', () => {
      const baseUrl = '/search';
      const params = { query: 'hello world', email: 'test@example.com' };
      
      const url = buildUrlWithParams(baseUrl, params);
      
      expect(url).toContain('query=hello%20world');
      expect(url).toContain('email=test%40example.com');
    });

    it('should handle empty string values', () => {
      const baseUrl = '/test';
      const params = { 
        valid: 'value', 
        emptyString: ''
      };
      
      const url = buildUrlWithParams(baseUrl, params);
      
      expect(url).toContain('valid=value');
      expect(url).toContain('emptyString=');
    });
  });

  describe('navigateWithParams', () => {
    it('should set window.location.href for navigation', () => {
      const path = '/phase/2';
      const params = { workspace: 'DEF456' };
      
      navigateWithParams(path, params);
      
      // navigateWithParams sets window.location.href directly
      expect(mockLocation.href).toContain('/phase/2');
      expect(mockLocation.href).toContain('workspace=DEF456');
    });

    it('should handle navigation without parameters', () => {
      const path = '/phase/3';
      
      navigateWithParams(path, {});
      
      expect(mockLocation.href).toContain('/phase/3');
    });

    it('should handle navigation with multiple parameters', () => {
      const path = '/phase/4';
      const params = { workspace: 'GHI789', phase: '4' };
      
      navigateWithParams(path, params);
      
      expect(mockLocation.href).toContain('/phase/4');
      expect(mockLocation.href).toContain('workspace=GHI789');
    });
  });

  describe('removeUrlParams', () => {
    it('should remove specific parameters from URL', () => {
      mockLocation.search = '?workspace=ABC123&phase=2&debug=true';
      mockLocation.href = 'http://localhost:3000/test?workspace=ABC123&phase=2&debug=true';
      
      removeUrlParams('debug');
      
      expect(mockHistory.replaceState).toHaveBeenCalledWith(
        {}, 
        '', 
        expect.stringContaining('workspace=ABC123')
      );
    });

    it('should handle removing multiple parameters', () => {
      mockLocation.search = '?workspace=ABC123&phase=2&debug=true';
      mockLocation.href = 'http://localhost:3000/test?workspace=ABC123&phase=2&debug=true';
      
      removeUrlParams('debug', 'phase');
      
      expect(mockHistory.replaceState).toHaveBeenCalled();
    });
  });

  describe('hasUrlParams', () => {
    it('should check if parameters exist', () => {
      mockLocation.search = '?workspace=ABC123&phase=2';
      
      expect(hasUrlParams('workspace')).toBe(true);
      expect(hasUrlParams('workspace', 'phase')).toBe(true);
      expect(hasUrlParams('nonexistent')).toBe(false);
    });
  });

  describe('getUrlParam', () => {
    it('should get specific URL parameter', () => {
      mockLocation.search = '?workspace=ABC123&phase=2';
      
      expect(getUrlParam('workspace')).toBe('ABC123');
      expect(getUrlParam('phase')).toBe('2');
      expect(getUrlParam('nonexistent')).toBeNull();
    });
  });
});