import backendConfig from '../../backend.config.json';

export function getBackendUrl() {
  if (typeof window === 'undefined') {
    return `http://localhost:${backendConfig.BACKEND_PORT}`;
  }

  return `${window.location.protocol}//${window.location.hostname}:${backendConfig.BACKEND_PORT}`;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT';
  token?: string;
  body?: unknown;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${getBackendUrl()}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) as T | { error?: string } : {} as T;

  if (!response.ok) {
    const errorMessage = typeof data === 'object' && data && 'error' in data && typeof data.error === 'string'
      ? data.error
      : 'Request failed';
    throw new Error(errorMessage);
  }

  return data as T;
}
