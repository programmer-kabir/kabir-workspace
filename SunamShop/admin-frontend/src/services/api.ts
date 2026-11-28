const API_BASE_URL = 'http://localhost:8000/api/v1';

export async function adminFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('sunam_admin_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response.json();
}
