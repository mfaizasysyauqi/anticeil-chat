/**
 * Safe fetch for workspace connector clients.
 * When running in a browser client, routes requests through /api/connectors/proxy to bypass CORS restrictions.
 * When running in Node.js / edge server, uses native fetch directly.
 */
export async function connectorFetch(url: string, init?: RequestInit): Promise<Response> {
  if (typeof window !== 'undefined') {
    let bodyPayload: unknown = undefined;
    if (init?.body) {
      if (typeof init.body === 'string') {
        try {
          bodyPayload = JSON.parse(init.body);
        } catch {
          bodyPayload = init.body;
        }
      } else {
        bodyPayload = init.body;
      }
    }

    const headersRecord: Record<string, string> = {};
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((val, key) => {
          headersRecord[key] = val;
        });
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([key, val]) => {
          headersRecord[key] = val;
        });
      } else {
        Object.assign(headersRecord, init.headers);
      }
    }

    return fetch('/api/connectors/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        method: init?.method || 'GET',
        headers: headersRecord,
        body: bodyPayload,
      }),
    });
  }

  return fetch(url, init);
}
