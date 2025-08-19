/**
 * Comprehensive URL utilities for consistent parameter handling across the application
 */

// Get URL search parameters from current location
export function getUrlParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

// Get a specific URL parameter by name
export function getUrlParam(name: string): string | null {
  return getUrlParams().get(name);
}

// Get multiple URL parameters by name
export function getMultipleUrlParams(...names: string[]): Record<string, string | null> {
  const params = getUrlParams();
  const result: Record<string, string | null> = {};
  
  for (const name of names) {
    result[name] = params.get(name);
  }
  
  return result;
}

// Remove specific parameters from current URL and update browser history
export function removeUrlParams(...paramNames: string[]): void {
  try {
    const url = new URL(window.location.href);
    
    for (const paramName of paramNames) {
      if (paramName) {
        url.searchParams.delete(paramName);
      }
    }
    
    window.history.replaceState({}, '', url.toString());
  } catch (error) {
    // Silently fail if URL manipulation is not possible
  }
}

// Add or update URL parameters and navigate to new URL
export function navigateWithParams(basePath: string, params: Record<string, string | number>): void {
  try {
    const url = new URL(basePath, window.location.origin);
    
    for (const [key, value] of Object.entries(params)) {
      if (key && value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
    
    window.location.href = url.toString();
  } catch (error) {
    // Fallback to basic navigation if URL construction fails
    window.location.href = basePath;
  }
}

// Construct URL with parameters (useful for sharing links)
export function buildUrlWithParams(basePath: string, params: Record<string, string | number>): string {
  try {
    const url = new URL(basePath, window.location.origin);
    
    for (const [key, value] of Object.entries(params)) {
      if (key && value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
    
    return url.toString();
  } catch (error) {
    // Fallback to base path if URL construction fails
    return basePath.startsWith('http') ? basePath : `${window.location.origin}${basePath}`;
  }
}

// Get current origin for URL construction
export function getOrigin(): string {
  return window.location.origin;
}

// Check if specific URL parameters exist
export function hasUrlParams(...paramNames: string[]): boolean {
  const params = getUrlParams();
  return paramNames.every(name => params.has(name));
}

// Get all URL parameters as an object
export function getAllUrlParams(): Record<string, string> {
  const params = getUrlParams();
  const result: Record<string, string> = {};
  
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
}