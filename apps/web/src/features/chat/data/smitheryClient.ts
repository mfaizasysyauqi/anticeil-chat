/**
 * Smithery MCP Registry Client
 * BYOK: users supply their own API key from smithery.ai
 * Docs: https://smithery.ai/docs/api
 */

import { ToolCallResult } from '@anticeil/core';

export const SMITHERY_BASE_URL = 'https://api.smithery.ai';
export const SMITHERY_SERVER_URL = 'https://server.smithery.ai';

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
  inputSchema?: {
    type?: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
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

// In-memory cache for server tool schemas to avoid redundant network calls during chat sessions
const serverToolsCache = new Map<string, { tools: SmitheryTool[]; fetchedAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

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

/** Fetch details and tool list for a specific Smithery MCP server */
export async function fetchSmitheryServerDetails(
  qualifiedName: string,
  apiKey: string
): Promise<SmitheryServer> {
  const cached = serverToolsCache.get(qualifiedName);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return {
      qualifiedName,
      displayName: qualifiedName,
      description: '',
      useCount: 0,
      isDeployed: true,
      tools: cached.tools,
    };
  }

  const serverEncoded = encodeURIComponent(qualifiedName);
  const targetUrl = `${SMITHERY_BASE_URL}/servers/${serverEncoded}`;

  try {
    const res = await fetch('/api/connectors/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: targetUrl,
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}` },
      }),
    });

    if (res.ok) {
      const data: SmitheryServer = await res.json();
      if (data.tools && Array.isArray(data.tools)) {
        serverToolsCache.set(qualifiedName, { tools: data.tools, fetchedAt: Date.now() });
      }
      return data;
    }
  } catch (e) {
    console.warn(`[Smithery] Failed to fetch server details for ${qualifiedName}:`, e);
  }

  // Fallback: try MCP tools/list via JSON-RPC endpoint
  try {
    const tools = await fetchMcpToolsViaRpc(qualifiedName, apiKey);
    if (tools.length > 0) {
      serverToolsCache.set(qualifiedName, { tools, fetchedAt: Date.now() });
      return {
        qualifiedName,
        displayName: qualifiedName,
        description: '',
        useCount: 0,
        isDeployed: true,
        tools,
      };
    }
  } catch {
    // Ignore fallback failure
  }

  return {
    qualifiedName,
    displayName: qualifiedName,
    description: '',
    useCount: 0,
    isDeployed: true,
    tools: [],
  };
}

/** Fallback to query tools/list via JSON-RPC 2.0 */
async function fetchMcpToolsViaRpc(qualifiedName: string, apiKey: string): Promise<SmitheryTool[]> {
  const serverEncoded = encodeURIComponent(qualifiedName);
  const targetUrl = `${SMITHERY_SERVER_URL}/${serverEncoded}/mcp`;

  const res = await fetch('/api/connectors/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: targetUrl,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {},
      },
    }),
  });

  if (!res.ok) return [];
  const data = await res.json();
  const rawTools = data?.result?.tools;
  if (Array.isArray(rawTools)) {
    return rawTools.map((t: Record<string, unknown>) => ({
      name: String(t.name || ''),
      description: String(t.description || ''),
      inputSchema: (t.inputSchema as SmitheryTool['inputSchema']) || undefined,
    }));
  }
  return [];
}

/** Fetch tools for all selected active Smithery servers */
export async function fetchActiveSmitheryTools(
  serverNames: string[],
  apiKey: string
): Promise<Array<{ serverName: string; tools: SmitheryTool[] }>> {
  if (!serverNames || serverNames.length === 0 || !apiKey) return [];

  const results = await Promise.allSettled(
    serverNames.map(async (name) => {
      const server = await fetchSmitheryServerDetails(name, apiKey);
      return {
        serverName: name,
        tools: server.tools || [],
      };
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<{ serverName: string; tools: SmitheryTool[] }> => r.status === 'fulfilled')
    .map((r) => r.value);
}

/** Sanitize server name to create unique tool identifier */
export function formatSmitheryToolName(serverName: string, toolName: string): string {
  const cleanServer = serverName.replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '_');
  return `mcp_${cleanServer}_${toolName}`;
}

/** Map of registered dynamic tools to their source server */
const dynamicToolToSmitheryMap = new Map<string, { serverName: string; originalToolName: string }>();

export function registerSmitheryToolMapping(
  mappedName: string,
  serverName: string,
  originalToolName: string
) {
  dynamicToolToSmitheryMap.set(mappedName, { serverName, originalToolName });
  // Also register direct originalToolName as fallback if unique
  if (!dynamicToolToSmitheryMap.has(originalToolName)) {
    dynamicToolToSmitheryMap.set(originalToolName, { serverName, originalToolName });
  }
}

export function resolveSmitheryTool(
  toolName: string
): { serverName: string; originalToolName: string } | null {
  return dynamicToolToSmitheryMap.get(toolName) || null;
}

/** Execute a tool call on a Smithery MCP server */
export async function executeSmitheryTool(
  serverQualifiedName: string,
  toolName: string,
  args: Record<string, unknown>,
  apiKey: string,
  toolCallId?: string
): Promise<ToolCallResult> {
  const startedAt = Date.now();
  const resolvedCallId = toolCallId || `mcp-call-${startedAt}-${Math.random().toString(36).slice(2, 6)}`;
  const serverEncoded = encodeURIComponent(serverQualifiedName);
  const targetUrl = `${SMITHERY_SERVER_URL}/${serverEncoded}/mcp`;

  try {
    const res = await fetch('/api/connectors/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: targetUrl,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: {
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: args,
          },
        },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      return {
        toolCallId: resolvedCallId,
        toolName,
        connectorId: 'smithery',
        status: 'error',
        error: `HTTP ${res.status}: ${errorText}`,
        summary: `Gagal mengeksekusi tool MCP "${toolName}" pada server "${serverQualifiedName}" (${res.status}).`,
        executedAt: startedAt,
      };
    }

    const json = await res.json();

    if (json.error) {
      return {
        toolCallId: resolvedCallId,
        toolName,
        connectorId: 'smithery',
        status: 'error',
        error: json.error.message || JSON.stringify(json.error),
        summary: `Error dari MCP server ${serverQualifiedName}: ${json.error.message || 'Unknown error'}`,
        executedAt: startedAt,
      };
    }

    const result = json.result;
    let extractedText = '';
    let isError = result?.isError ?? false;

    if (result && Array.isArray(result.content)) {
      extractedText = result.content
        .map((c: { type?: string; text?: string; data?: unknown }) => c.text || JSON.stringify(c.data || c))
        .join('\n');
    } else if (typeof result === 'string') {
      extractedText = result;
    } else {
      extractedText = JSON.stringify(result ?? {}, null, 2);
    }

    return {
      toolCallId: resolvedCallId,
      toolName,
      connectorId: 'smithery',
      status: isError ? 'error' : 'success',
      data: result,
      summary: extractedText.slice(0, 300) || `Berhasil mengeksekusi tool MCP ${toolName}`,
      executedAt: startedAt,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      toolCallId: resolvedCallId,
      toolName,
      connectorId: 'smithery',
      status: 'error',
      error: message,
      summary: `Gagal memanggil MCP tool ${toolName}: ${message}`,
      executedAt: startedAt,
    };
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
