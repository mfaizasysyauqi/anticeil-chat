import { connectorFetch } from './proxyFetch';

export interface NotionPage {
  id: string;
  title: string;
  url: string;
  lastEditedTime: string;
  createdTime: string;
  archived: boolean;
  parent?: { type: string; id?: string };
  properties?: Record<string, unknown>;
}

export interface NotionBlock {
  id: string;
  type: string;
  content: string;
}

export interface NotionDatabase {
  id: string;
  title: string;
  url: string;
  lastEditedTime: string;
}

export interface NotionClientOptions {
  accessToken?: string;
}

export class NotionConnectorClient {
  private accessToken: string;
  private baseUrl = 'https://api.notion.com/v1';
  private notionVersion = '2022-06-28';

  constructor(options: NotionClientOptions) {
    this.accessToken = options.accessToken ?? '';
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'Notion-Version': this.notionVersion,
    };
  }

  private extractTitle(page: Record<string, unknown>): string {
    const props = (page.properties ?? {}) as Record<string, unknown>;
    for (const key of ['title', 'Title', 'Name', 'name']) {
      const prop = props[key] as Record<string, unknown> | undefined;
      if (!prop) continue;
      const titleArr = prop.title as Array<{ plain_text: string }> | undefined;
      if (titleArr?.[0]?.plain_text) return titleArr[0].plain_text;
    }
    // fallback to page's own title array (for databases returned as page objects)
    const titleArr = (page as Record<string, unknown>).title as
      | Array<{ plain_text: string }>
      | undefined;
    if (titleArr?.[0]?.plain_text) return titleArr[0].plain_text;
    return 'Untitled';
  }

  /**
   * Search pages and databases (Read)
   */
  async search(params: {
    query?: string;
    filter?: 'page' | 'database';
    maxResults?: number;
  }): Promise<{ results: NotionPage[]; totalCount: number }> {
    const { query = '', filter, maxResults = 10 } = params;

    const body: Record<string, unknown> = {
      page_size: Math.min(maxResults, 100),
    };
    if (query) body.query = query;
    if (filter) body.filter = { value: filter, property: 'object' };

    const res = await connectorFetch(`${this.baseUrl}/search`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Notion search failed: ${res.status} ${err}`);
    }

    const data = await res.json();
    const results: NotionPage[] = (data.results ?? []).map((item: Record<string, unknown>) => ({
      id: item.id as string,
      title: this.extractTitle(item),
      url: item.url as string,
      lastEditedTime: item.last_edited_time as string,
      createdTime: item.created_time as string,
      archived: item.archived as boolean,
      parent: item.parent as NotionPage['parent'],
    }));

    return { results, totalCount: results.length };
  }

  /**
   * Get full page content as plain text (Read)
   */
  async getPageContent(pageId: string): Promise<{ page: NotionPage; content: string }> {
    // Get page metadata
    const pageRes = await connectorFetch(`${this.baseUrl}/pages/${pageId}`, {
      headers: this.headers,
    });
    if (!pageRes.ok) throw new Error(`Failed to get Notion page: ${pageRes.statusText}`);
    const pageData = await pageRes.json();

    const page: NotionPage = {
      id: pageData.id,
      title: this.extractTitle(pageData),
      url: pageData.url,
      lastEditedTime: pageData.last_edited_time,
      createdTime: pageData.created_time,
      archived: pageData.archived,
    };

    // Get blocks (page body)
    const blocksRes = await connectorFetch(`${this.baseUrl}/blocks/${pageId}/children?page_size=100`, {
      headers: this.headers,
    });
    if (!blocksRes.ok) throw new Error(`Failed to get page blocks: ${blocksRes.statusText}`);
    const blocksData = await blocksRes.json();

    const lines: string[] = [];
    for (const block of blocksData.results ?? []) {
      const type = block.type as string;
      const blockContent = block[type] as Record<string, unknown> | undefined;
      const richText = (blockContent?.rich_text ?? []) as Array<{ plain_text: string }>;
      const text = richText.map((rt) => rt.plain_text).join('');

      if (type === 'heading_1') lines.push(`# ${text}`);
      else if (type === 'heading_2') lines.push(`## ${text}`);
      else if (type === 'heading_3') lines.push(`### ${text}`);
      else if (type === 'bulleted_list_item') lines.push(`- ${text}`);
      else if (type === 'numbered_list_item') lines.push(`1. ${text}`);
      else if (type === 'to_do') {
        const checked = (blockContent?.checked as boolean) ? '[x]' : '[ ]';
        lines.push(`${checked} ${text}`);
      } else if (type === 'code') {
        const lang = (blockContent?.language as string) ?? '';
        lines.push(`\`\`\`${lang}\n${text}\n\`\`\``);
      } else if (type === 'divider') {
        lines.push('---');
      } else if (text) {
        lines.push(text);
      }
    }

    return { page, content: lines.join('\n') };
  }

  /**
   * Create a new page (Create)
   */
  async createPage(params: {
    parentPageId?: string;
    parentDatabaseId?: string;
    title: string;
    content: string;
  }): Promise<{ success: boolean; page: NotionPage; message: string }> {
    const { parentPageId, parentDatabaseId, title, content } = params;

    if (!parentPageId && !parentDatabaseId) {
      throw new Error('Either parentPageId or parentDatabaseId is required to create a Notion page.');
    }

    // Build parent object
    const parent: Record<string, unknown> = parentDatabaseId
      ? { type: 'database_id', database_id: parentDatabaseId }
      : { type: 'page_id', page_id: parentPageId };

    // Build title property
    const properties: Record<string, unknown> = {
      title: {
        title: [{ type: 'text', text: { content: title } }],
      },
    };

    // Convert markdown-ish content to Notion blocks
    const children = content
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        if (line.startsWith('# ')) {
          return { object: 'block', type: 'heading_1', heading_1: { rich_text: [{ type: 'text', text: { content: line.slice(2) } }] } };
        }
        if (line.startsWith('## ')) {
          return { object: 'block', type: 'heading_2', heading_2: { rich_text: [{ type: 'text', text: { content: line.slice(3) } }] } };
        }
        if (line.startsWith('- ')) {
          return { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: line.slice(2) } }] } };
        }
        return {
          object: 'block',
          type: 'paragraph',
          paragraph: { rich_text: [{ type: 'text', text: { content: line } }] },
        };
      });

    const res = await connectorFetch(`${this.baseUrl}/pages`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ parent, properties, children }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to create Notion page: ${res.status} ${err}`);
    }

    const data = await res.json();
    const page: NotionPage = {
      id: data.id,
      title,
      url: data.url,
      lastEditedTime: data.last_edited_time,
      createdTime: data.created_time,
      archived: false,
    };

    return { success: true, page, message: `Page "${title}" created in Notion.` };
  }

  /**
   * Update page title and/or append content blocks (Update)
   */
  async updatePage(params: {
    pageId: string;
    title?: string;
    appendContent?: string;
  }): Promise<{ success: boolean; page: NotionPage; message: string }> {
    const { pageId, title, appendContent } = params;

    if (title) {
      const res = await connectorFetch(`${this.baseUrl}/pages/${pageId}`, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify({
          properties: {
            title: { title: [{ type: 'text', text: { content: title } }] },
          },
        }),
      });
      if (!res.ok) throw new Error(`Failed to update Notion page title: ${res.statusText}`);
    }

    if (appendContent) {
      const blocks = appendContent
        .split('\n')
        .filter((l) => l.trim())
        .map((line) => ({
          object: 'block',
          type: 'paragraph',
          paragraph: { rich_text: [{ type: 'text', text: { content: line } }] },
        }));

      const res = await connectorFetch(`${this.baseUrl}/blocks/${pageId}/children`, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify({ children: blocks }),
      });
      if (!res.ok) throw new Error(`Failed to append to Notion page: ${res.statusText}`);
    }

    const { page } = await this.getPageContent(pageId);
    return { success: true, page, message: `Notion page "${page.title}" updated.` };
  }

  /**
   * Archive (soft-delete) a page (Delete)
   */
  async archivePage(pageId: string): Promise<{ success: boolean; message: string }> {
    const res = await connectorFetch(`${this.baseUrl}/pages/${pageId}`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify({ archived: true }),
    });

    if (!res.ok) throw new Error(`Failed to archive Notion page: ${res.statusText}`);
    return { success: true, message: `Notion page ${pageId} archived.` };
  }

  /**
   * Query a database (Read)
   */
  async queryDatabase(params: {
    databaseId: string;
    filter?: Record<string, unknown>;
    maxResults?: number;
  }): Promise<{ results: NotionPage[]; totalCount: number }> {
    const { databaseId, filter, maxResults = 10 } = params;

    const body: Record<string, unknown> = { page_size: Math.min(maxResults, 100) };
    if (filter) body.filter = filter;

    const res = await connectorFetch(`${this.baseUrl}/databases/${databaseId}/query`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Failed to query Notion database: ${res.statusText}`);
    const data = await res.json();

    const results: NotionPage[] = (data.results ?? []).map((item: Record<string, unknown>) => ({
      id: item.id as string,
      title: this.extractTitle(item),
      url: item.url as string,
      lastEditedTime: item.last_edited_time as string,
      createdTime: item.created_time as string,
      archived: item.archived as boolean,
    }));

    return { results, totalCount: results.length };
  }
}
