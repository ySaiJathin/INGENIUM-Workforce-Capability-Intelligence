// Shared HTTP wrapper around fetch — every real backend call in services/api.ts goes through
// this, so error classification (network vs 4xx vs 5xx) and the base URL are handled in one place.

export type ApiErrorKind = 'network' | 'client' | 'server';

export class ApiError extends Error {
  kind: ApiErrorKind;
  status?: number;

  constructor(kind: ApiErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8000';

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  // When body is FormData, Content-Type is left for the browser to set (multipart boundary).
  body?: BodyInit | Record<string, unknown> | null;
}

async function parseErrorDetail(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.detail === 'string') return data.detail;
    if (data?.detail && typeof data.detail === 'object' && typeof data.detail.detail === 'string') {
      return data.detail.detail;
    }
    return response.statusText || `Request failed with status ${response.status}`;
  } catch {
    return response.statusText || `Request failed with status ${response.status}`;
  }
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  let finalBody: BodyInit | null | undefined;
  const finalHeaders: HeadersInit = { ...(headers || {}) };

  if (isFormData) {
    finalBody = body as FormData;
  } else if (body !== undefined && body !== null) {
    finalBody = JSON.stringify(body);
    (finalHeaders as Record<string, string>)['Content-Type'] = 'application/json';
  } else {
    finalBody = body as BodyInit | null | undefined;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: finalBody,
    });
  } catch (err) {
    throw new ApiError('network', "Couldn't reach the server — check the backend is running.");
  }

  if (!response.ok) {
    const message = await parseErrorDetail(response);
    const kind: ApiErrorKind = response.status >= 500 ? 'server' : 'client';
    throw new ApiError(kind, message, response.status);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return (await response.json()) as T;
}
