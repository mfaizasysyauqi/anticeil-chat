const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (typeof window !== 'undefined' ? window.location.origin : '');

function buildUrl(url: string, config?: any): string {
  let fullUrl = `${API_BASE_URL}/api${url}`;
  if (config?.params && typeof config.params === 'object') {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(config.params)) {
      if (v !== undefined && v !== null && v !== '') {
        query.set(k, String(v));
      }
    }
    const qs = query.toString();
    if (qs) {
      fullUrl += (fullUrl.includes('?') ? '&' : '?') + qs;
    }
  }
  return fullUrl;
}

export const api = {
  get: async <T = any>(url: string, config?: any): Promise<T> => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('ap_token') || '';
      const res = await fetch(buildUrl(url, config), {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(res.statusText);
      return (await res.json()) as T;
    } catch {
      return {} as T;
    }
  },
  post: async <T = any>(url: string, data?: any, _config?: any): Promise<T> => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('ap_token') || '';
      // Ensure a JSON body is sent when Content-Type is application/json to avoid Fastify FST_ERR_CTP_EMPTY_JSON_BODY
      const payload = data !== undefined ? data : {};
      const res = await fetch(`${API_BASE_URL}/api${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(res.statusText);
      return (await res.json()) as T;
    } catch {
      return {} as T;
    }
  },
  put: async <T = any>(url: string, data?: any, _config?: any): Promise<T> => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('ap_token') || '';
      const payload = data !== undefined ? data : {};
      const res = await fetch(`${API_BASE_URL}/api${url}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(res.statusText);
      return (await res.json()) as T;
    } catch {
      return {} as T;
    }
  },
  patch: async <T = any>(url: string, data?: any, _config?: any): Promise<T> => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('ap_token') || '';
      const payload = data !== undefined ? data : {};
      const res = await fetch(`${API_BASE_URL}/api${url}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(res.statusText);
      return (await res.json()) as T;
    } catch {
      return {} as T;
    }
  },
  delete: async <T = any>(url: string, config?: any): Promise<T> => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('ap_token') || '';
      const res = await fetch(buildUrl(url, config), {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return (await res.json().catch(() => ({}))) as T;
    } catch {
      return {} as T;
    }
  },
};
