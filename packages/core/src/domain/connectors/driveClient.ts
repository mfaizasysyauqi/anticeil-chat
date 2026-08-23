import { DriveFile } from './types';

const INITIAL_SANDBOX_FILES: DriveFile[] = [
  {
    id: 'drive-file-001',
    name: 'Q3_2026_Strategic_Roadmap.md',
    mimeType: 'text/markdown',
    size: 14200,
    webViewLink: 'https://drive.google.com/file/d/drive-file-001/view',
    modifiedTime: new Date(Date.now() - 3600000 * 5).toISOString(),
    starred: true,
    content: `# Q3 2026 AI Product & Architecture Roadmap\n\n## 1. Executive Summary\nOur priority this quarter is zero-latency client inference, BYOK security architecture, and cross-platform native agents.\n\n## 2. Key Initiatives\n- **Grok & Workspace Connectors**: Full CRUD for Gmail, Calendar, Google Drive.\n- **Sub-second TTFT**: Optimized SSE streaming pipelines across Groq, Claude, OpenAI.\n- **Enterprise Security**: Zero-server key storage with AES-GCM 256-bit client encryption.`,
  },
  {
    id: 'drive-file-002',
    name: 'Financial_Projections_FY2026.csv',
    mimeType: 'text/csv',
    size: 28400,
    webViewLink: 'https://drive.google.com/file/d/drive-file-002/view',
    modifiedTime: new Date(Date.now() - 3600000 * 24).toISOString(),
    starred: false,
    content: `Quarter,Revenue_Target,API_Costs,Gross_Margin,Active_Users\nQ1_2026,120000,14200,88.1%,45000\nQ2_2026,195000,21800,88.8%,82000\nQ3_2026,310000,34000,89.0%,140000\nQ4_2026,480000,49000,89.7%,220000`,
  },
  {
    id: 'drive-file-003',
    name: 'Engineering_System_Design.txt',
    mimeType: 'text/plain',
    size: 8900,
    webViewLink: 'https://drive.google.com/file/d/drive-file-003/view',
    modifiedTime: new Date(Date.now() - 3600000 * 48).toISOString(),
    starred: false,
    content: `Anticeil Monorepo Architecture Overview\n- packages/core: Pure TypeScript domain models, token estimator, connectors\n- apps/web: Next.js 15+ App Router, Grok-inspired UI, Zustand storage\n- apps/mobile: Expo React Native Feature-First Clean Architecture\n- apps/desktop: Tauri 2.0 Native Shell`,
  },
];

let sandboxFiles: DriveFile[] = [...INITIAL_SANDBOX_FILES];

export interface DriveClientOptions {
  accessToken?: string;
  isSandboxMode?: boolean;
}

export class GoogleDriveConnectorClient {
  private accessToken?: string;
  private isSandbox: boolean;

  constructor(options: DriveClientOptions) {
    this.accessToken = options.accessToken;
    this.isSandbox = options.isSandboxMode ?? (!options.accessToken);
  }

  /**
   * List / Search Files in Google Drive (CRUD - Read)
   */
  async listFiles(params: {
    query?: string;
    maxResults?: number;
    mimeType?: string;
  }): Promise<{ files: DriveFile[]; totalCount: number }> {
    const { query = '', maxResults = 10, mimeType } = params;

    if (this.isSandbox) {
      let filtered = sandboxFiles.filter((f) => !f.trashed);

      if (mimeType) {
        filtered = filtered.filter((f) => f.mimeType.includes(mimeType));
      }

      if (query.trim()) {
        const q = query.toLowerCase();
        filtered = filtered.filter(
          (f) =>
            f.name.toLowerCase().includes(q) ||
            (f.content && f.content.toLowerCase().includes(q))
        );
      }

      return {
        files: filtered.slice(0, maxResults),
        totalCount: filtered.length,
      };
    }

    // Live Google Drive REST API
    try {
      const url = new URL('https://www.googleapis.com/drive/v3/files');
      url.searchParams.set('pageSize', String(Math.min(maxResults, 20)));
      url.searchParams.set('fields', 'files(id, name, mimeType, size, webViewLink, modifiedTime, starred, trashed)');

      let qClause = 'trashed = false';
      if (query) qClause += ` and (name contains '${query}' or fullText contains '${query}')`;
      if (mimeType) qClause += ` and mimeType contains '${mimeType}'`;
      url.searchParams.set('q', qClause);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });

      if (!res.ok) throw new Error(`Google Drive API error: ${res.status} ${res.statusText}`);
      const data = await res.json();

      const files: DriveFile[] = (data.files || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        size: Number(f.size || 0),
        webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
        modifiedTime: f.modifiedTime,
        starred: f.starred,
        trashed: f.trashed,
      }));

      return { files, totalCount: files.length };
    } catch (err: any) {
      throw new Error(`Failed to list Google Drive files: ${err.message}`);
    }
  }

  /**
   * Get File Content (CRUD - Read)
   */
  async getFileContent(fileId: string): Promise<{ file: DriveFile; content: string }> {
    if (this.isSandbox) {
      const found = sandboxFiles.find((f) => f.id === fileId);
      if (!found) throw new Error(`File ${fileId} not found in sandbox Google Drive.`);
      return { file: found, content: found.content || '' };
    }

    // 1. Get metadata
    const metaRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,webViewLink,modifiedTime`,
      { headers: { Authorization: `Bearer ${this.accessToken}` } }
    );
    if (!metaRes.ok) throw new Error(`Failed to fetch file metadata: ${metaRes.statusText}`);
    const meta = await metaRes.json();

    // 2. Fetch content (or export if Google Doc / Sheet)
    let content = '';
    if (meta.mimeType?.includes('google-apps.document')) {
      const exportRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`,
        { headers: { Authorization: `Bearer ${this.accessToken}` } }
      );
      if (exportRes.ok) content = await exportRes.text();
    } else if (meta.mimeType?.includes('google-apps.spreadsheet')) {
      const exportRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/csv`,
        { headers: { Authorization: `Bearer ${this.accessToken}` } }
      );
      if (exportRes.ok) content = await exportRes.text();
    } else {
      const rawRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        { headers: { Authorization: `Bearer ${this.accessToken}` } }
      );
      if (rawRes.ok) content = await rawRes.text();
    }

    const driveFile: DriveFile = {
      id: meta.id,
      name: meta.name,
      mimeType: meta.mimeType,
      size: Number(meta.size || 0),
      webViewLink: meta.webViewLink,
      modifiedTime: meta.modifiedTime,
      content,
    };

    return { file: driveFile, content };
  }

  /**
   * Create New File / Document (CRUD - Create)
   */
  async createFile(params: {
    name: string;
    content: string;
    mimeType?: string;
  }): Promise<{ success: boolean; file: DriveFile; message: string }> {
    const { name, content, mimeType = 'text/plain' } = params;
    if (!name) throw new Error('File name is required to create a document in Google Drive.');

    if (this.isSandbox) {
      const newFile: DriveFile = {
        id: `drive-sandbox-${Date.now()}`,
        name,
        mimeType,
        size: content.length,
        webViewLink: 'https://drive.google.com',
        modifiedTime: new Date().toISOString(),
        starred: false,
        content,
      };
      sandboxFiles.unshift(newFile);
      return {
        success: true,
        file: newFile,
        message: `File "${name}" created successfully in Google Drive (Sandbox Mode).`,
      };
    }

    const metadata = { name, mimeType };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([content], { type: mimeType }));

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.accessToken}` },
      body: form,
    });

    if (!res.ok) throw new Error(`Failed to upload file to Google Drive: ${res.statusText}`);
    const data = await res.json();

    const created: DriveFile = {
      id: data.id,
      name: data.name,
      mimeType: data.mimeType,
      modifiedTime: new Date().toISOString(),
      content,
    };

    return {
      success: true,
      file: created,
      message: `File "${name}" saved to Google Drive.`,
    };
  }

  /**
   * Update Document Content (CRUD - Update)
   */
  async updateFile(params: {
    fileId: string;
    name?: string;
    content?: string;
  }): Promise<{ success: boolean; file: DriveFile; message: string }> {
    const { fileId, name, content } = params;

    if (this.isSandbox) {
      const file = sandboxFiles.find((f) => f.id === fileId);
      if (!file) throw new Error(`File ${fileId} not found in sandbox.`);

      if (name) file.name = name;
      if (content !== undefined) {
        file.content = content;
        file.size = content.length;
      }
      file.modifiedTime = new Date().toISOString();

      return {
        success: true,
        file,
        message: `File "${file.name}" updated successfully in Google Drive (Sandbox Mode).`,
      };
    }

    if (content !== undefined) {
      const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'text/plain',
        },
        body: content,
      });
      if (!res.ok) throw new Error(`Failed to update file content: ${res.statusText}`);
    }

    if (name) {
      await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
    }

    const updated = await this.getFileContent(fileId);
    return {
      success: true,
      file: updated.file,
      message: `File "${updated.file.name}" updated successfully.`,
    };
  }

  /**
   * Delete / Trash File (CRUD - Delete)
   */
  async deleteFile(fileId: string): Promise<{ success: boolean; message: string }> {
    if (this.isSandbox) {
      const idx = sandboxFiles.findIndex((f) => f.id === fileId);
      if (idx !== -1) {
        const removed = sandboxFiles.splice(idx, 1)[0];
        return {
          success: true,
          message: `File "${removed.name}" moved to Google Drive Trash (Sandbox Mode).`,
        };
      }
      return { success: true, message: `File ${fileId} deleted.` };
    }

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/trash`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    if (!res.ok) throw new Error(`Failed to delete file: ${res.statusText}`);
    return { success: true, message: `File ${fileId} moved to Google Drive Trash.` };
  }
}
