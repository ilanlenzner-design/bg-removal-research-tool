// API Configuration
// Set this to your Google Apps Script web app URL after deployment
// Or leave as empty string to use the local/Render server

// Using Google Apps Script backend (CORS issues with POST - not working):
// export const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbwLqUrcQc6CnlJUMNf01Aw2fOU4NvH_8Wk1v4eT_g1bevHMuiBtv3jAwfaCkfliwf7YQQ/exec';

// Using integrated frontend + backend on same Render service (recommended - no CORS issues):
export const API_BASE_URL = '';

// Helper function to build API URLs
export function getApiUrl(path) {
  if (API_BASE_URL) {
    // Check if it's Google Apps Script or Render
    if (API_BASE_URL.includes('script.google.com')) {
      // Google Apps Script - use query parameter
      return `${API_BASE_URL}?path=${path}`;
    } else {
      // Render or other server - use regular path
      return `${API_BASE_URL}/api/${path}`;
    }
  } else {
    // Local server - use relative path
    return `/api/${path}`;
  }
}

// Helper for making API requests with proper method handling
export async function apiRequest(path, options = {}) {
  const url = getApiUrl(path);

  if (API_BASE_URL) {
    // Google Apps Script - convert PUT/DELETE to POST with special handling
    const method = options.method || 'GET';

    if (method === 'PUT' || method === 'DELETE') {
      // For PUT/DELETE, we need to use POST and send the method info
      return fetch(url, {
        ...options,
        method: 'POST',
        headers: {
          ...options.headers,
          'X-HTTP-Method-Override': method
        }
      });
    }
  }

  // Normal fetch for GET/POST or local server
  return fetch(url, options);
}
