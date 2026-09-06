/**
 * Smithery MCP Registry Client
 * BYOK: users supply their own API key from smithery.ai
 * Docs: https://smithery.ai/docs/api
 */

export const SMITHERY_BASE_URL = 'https://api.smithery.ai';

export interface SmitheryServer {
  qualifiedName: string;   // e.g. "@smithery-ai/fetch"
  displayName: string;
  description: string;
  homepage?: string;
  useCount: number;
  isDeployed: boolean;
  tools?: SmitheryTool[];
}

export interface SmitheryTool {
  name: string;
  description: string;
}

export interface SmitheryListResponse {
  servers: SmitheryServer[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

/** List available MCP servers from Smithery registry (via server-side proxy to avoid CORS) */
export async function listSmitheryServers(
  apiKey: string,
  opts?: { query?: string; page?: number; pageSize?: number }
): Promise<SmitheryListResponse> {
  const params = new URLSearchParams();
  if (opts?.query) params.set('q', opts.query);
  if (opts?.page) params.set('page', String(opts.page));
  params.set('pageSize', String(opts?.pageSize ?? 20));

  const targetUrl = `${SMITHERY_BASE_URL}/servers?${params}`;

  const res = await fetch('/api/connectors/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: targetUrl,
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Smithery API error ${res.status}: ${text}`);
  }

  return res.json();
}

/** Test Smithery API key validity */
export async function testSmitheryKey(apiKey: string): Promise<boolean> {
  try {
    await listSmitheryServers(apiKey, { pageSize: 1 });
    return true;
  } catch {
    return false;
  }
}

/** Get a Smithery WebSocket URL for a specific MCP server (hosted mode) */
export function getSmitheryWsUrl(
  qualifiedName: string,
  apiKey: string,
  serverConfig?: Record<string, string>
): string {
  const encoded = encodeURIComponent(JSON.stringify(serverConfig ?? {}));
  const serverEncoded = encodeURIComponent(qualifiedName);
  return `wss://server.smithery.ai/${serverEncoded}/ws?config=${encoded}&api_key=${apiKey}`;
}

/** Get an HTTP stream URL for a Smithery MCP server */
export function getSmitheryStreamUrl(
  qualifiedName: string,
  apiKey: string,
  serverConfig?: Record<string, string>
): string {
  const params = new URLSearchParams({
    config: JSON.stringify(serverConfig ?? {}),
    api_key: apiKey,
  });
  const serverEncoded = encodeURIComponent(qualifiedName);
  return `${SMITHERY_BASE_URL}/${serverEncoded}/mcp?${params}`;
}

/** Test Smithery API key validity */
export async function testSmitheryKey(apiKey: string): Promise<boolean> {
  try {
    await listSmitheryServers(apiKey, { pageSize: 1 });
    return true;
  } catch {
    return false;
  }
}
