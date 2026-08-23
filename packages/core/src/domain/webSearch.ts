export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

/**
 * Performs client-side live web search and webpage content reader.
 * Uses real-time search gateways (Jina Search API, Jina Reader for direct domains/URLs, and DuckDuckGo).
 */
export async function performWebSearch(query: string): Promise<WebSearchResult[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const results: WebSearchResult[] = [];

  // 1. Check if the query mentions a specific domain or URL (e.g. "anticeil.com", "https://example.com")
  const urlMatch = cleanQuery.match(/(https?:\/\/[^\s]+|[\w-]+\.(?:com|org|net|io|id|dev|ai|app|co|xyz)[\/\w-.]*)/i);
  if (urlMatch) {
    const rawUrl = urlMatch[0];
    const targetUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

    try {
      const readerController = new AbortController();
      const readerTimeout = setTimeout(() => readerController.abort(), 6000);

      const readerRes = await fetch(`https://r.jina.ai/${targetUrl}`, {
        headers: {
          'Accept': 'text/plain',
          'X-Return-Format': 'text',
        },
        signal: readerController.signal,
      });

      clearTimeout(readerTimeout);

      if (readerRes.ok) {
        const text = await readerRes.text();
        if (text && text.length > 50) {
          const firstLine = text.split('\n')[0] || rawUrl;
          results.push({
            title: firstLine.replace(/^Title:\s*/i, '').slice(0, 80) || rawUrl,
            url: targetUrl,
            snippet: text.slice(0, 1200),
          });
        }
      }
    } catch {
      // Ignore reader fallback and proceed to search
    }
  }

  // 2. Query Jina Open Live Web Search Gateway
  try {
    const searchController = new AbortController();
    const searchTimeout = setTimeout(() => searchController.abort(), 7000);

    const jinaEndpoint = `https://s.jina.ai/${encodeURIComponent(cleanQuery)}`;
    const jinaRes = await fetch(jinaEndpoint, {
      headers: {
        'Accept': 'application/json',
        'X-Respond-With': 'json',
      },
      signal: searchController.signal,
    });

    clearTimeout(searchTimeout);

    if (jinaRes.ok) {
      const jinaData = await jinaRes.json();
      if (Array.isArray(jinaData.data)) {
        for (const item of jinaData.data.slice(0, 5)) {
          if (item.url && (item.description || item.content)) {
            // Avoid duplicate URLs
            if (!results.some((r) => r.url === item.url)) {
              results.push({
                title: item.title || cleanQuery,
                url: item.url,
                snippet: (item.description || item.content || '').slice(0, 500),
              });
            }
          }
        }
      }
    }
  } catch {
    // Proceed to fallback
  }

  // 3. Fallback: DuckDuckGo Instant Answer API
  if (results.length === 0) {
    try {
      const ddgRes = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanQuery)}&format=json&no_html=1&skip_disambig=1`
      );
      if (ddgRes.ok) {
        const data = await ddgRes.json();
        if (data.AbstractText && data.AbstractURL) {
          results.push({
            title: data.Heading || cleanQuery,
            url: data.AbstractURL,
            snippet: data.AbstractText,
          });
        }
        if (Array.isArray(data.RelatedTopics)) {
          for (const topic of data.RelatedTopics.slice(0, 4)) {
            if (topic.Text && topic.FirstURL) {
              results.push({
                title: topic.Text.split(' - ')[0] || topic.Text.slice(0, 60),
                url: topic.FirstURL,
                snippet: topic.Text,
              });
            }
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  return results.slice(0, 5);
}

/**
 * Formats web search results into a clean markdown prompt context for LLMs.
 */
export function formatWebSearchResults(query: string, results: WebSearchResult[]): string {
  if (results.length === 0) {
    return `[Live Web Search: No immediate web results found for "${query}"]`;
  }

  const formatted = results
    .map(
      (r, i) =>
        `[${i + 1}] Title: ${r.title}\nURL: ${r.url}\nSummary / Content:\n${r.snippet}`
    )
    .join('\n\n');

  return `[Live Web Search Context for "${query}"]:\n${formatted}\n\nCRITICAL INSTRUCTION: Always respond in the EXACT same language as the user's question (e.g. if the user asks in Indonesian, respond in Indonesian; if English, respond in English; if another language, respond in that language). Base your answer directly on the live web search results above and cite the relevant source URLs.`;
}
