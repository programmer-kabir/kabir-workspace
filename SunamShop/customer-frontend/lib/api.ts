import { ApiResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      cache: 'no-store',
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`API error (${response.status}): ${text.slice(0, 100)}`);
    }

    return JSON.parse(text);
  } catch (err: any) {
    // Return a safe fallback rather than crashing SSR during build
    return {
      success: false,
      status_code: 500,
      message: err.message || 'API fetch failed',
      data: [] as unknown as T,
      errors: null,
      meta: { timestamp: new Date().toISOString(), version: 'v1' },
    };
  }
}
