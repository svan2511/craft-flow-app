import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'km.token';

//export const API_BASE_URL = 'http://192.168.1.10:8000/api/v1';
export const API_BASE_URL = 'https://craft-flow.onrender.com/api/v1'; 

const DEFAULT_TIMEOUT_MS = 30000;

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string | null): Promise<void> {
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  authenticated?: boolean;
  timeout?: number;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, authenticated = false, timeout = DEFAULT_TIMEOUT_MS } = options;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (authenticated) {
    const token = await getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new ApiError(0, 'The server took too long to respond. Please try again.');
    }
    throw new ApiError(0, 'Could not connect to the server. Check your connection and try again.');
  } finally {
    clearTimeout(timer);
  }

  let payload: { success?: boolean; message?: string; data?: T; errors?: Record<string, string[]> } | null = null;
  try {
    payload = (await response.json()) as { success?: boolean; message?: string; data?: T; errors?: Record<string, string[]> } | null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    if (
      authenticated &&
      (response.status === 401 || response.status === 403) &&
      onUnauthorized
    ) {
      onUnauthorized();
    }

    if (response.status >= 500) {
      throw new ApiError(response.status, 'Something went wrong on the server. Please try again.');
    }

    const serverMessage = payload?.message?.trim();
    const errorDetail = payload?.errors
      ? Object.entries(payload.errors)
          .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
          .join('; ')
      : '';

    throw new ApiError(
      response.status,
      errorDetail
        ? `${serverMessage ?? 'Request failed.'} ${errorDetail}`
        : serverMessage ?? 'Request failed. Please try again.',
      payload?.errors,
    );
  }

  return payload?.data as T;
}
