const API_BASE = import.meta.env.VITE_API_BASE || '';

const ACCESS_TOKEN_KEY = 'fluxocash_access_token';

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token) {
  if (!token) {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    return;
  }
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

async function rawFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  return response;
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : await response.text().catch(() => null);

  if (!response.ok) {
    const message = payload?.message || payload?.error || (typeof payload === 'string' ? payload : null) || `HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function apiRequest(path, { method = 'GET', body, auth = true, retryOn401 = true } = {}) {
  const headers = {};
  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await rawFetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  if (response.status === 401 && auth && retryOn401) {
    try {
      const refreshResponse = await rawFetch('/auth/refresh', { method: 'POST' });
      const refreshPayload = await parseResponse(refreshResponse);
      if (refreshPayload?.accessToken) {
        setAccessToken(refreshPayload.accessToken);
        return apiRequest(path, { method, body, auth, retryOn401: false });
      }
    } catch {
      setAccessToken(null);
      throw new Error('Sessão expirada. Faça login novamente.');
    }
  }

  return parseResponse(response);
}

export const api = {
  signup: (email, password) => apiRequest('/auth/signup', { method: 'POST', body: { email, password }, auth: false }),
  login: (email, password) => apiRequest('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  refresh: () => apiRequest('/auth/refresh', { method: 'POST', auth: false }),
  logout: () => apiRequest('/auth/logout', { method: 'POST', auth: false }),
  me: () => apiRequest('/api/me', { method: 'GET', auth: true }),
};
