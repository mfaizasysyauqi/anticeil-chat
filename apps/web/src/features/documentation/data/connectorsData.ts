import { DocCategory } from '../types';

export const connectorsCategory: DocCategory = {
  id: 'connectors-guide',
  titleId: 'Connectors & Integrasi',
  titleEn: 'Connectors & Integrations',
  icon: 'Link',
  collapsible: true,
  sections: [
    {
      id: 'connectors-overview',
      titleId: 'Apa itu Connectors?',
      titleEn: 'What are Connectors?',
      icon: 'Puzzle',
      badge: 'Beta',
      summaryId: 'Hubungkan Anticeil dengan Google Drive, Notion, GitHub, dan Gmail secara langsung.',
      summaryEn: 'Connect Anticeil directly with Google Drive, Notion, GitHub, and Gmail.',
      contentId: `
### Connectors Overview

**Connectors** memungkinkan AI mengakses data dari platform eksternal Anda secara langsung dan aman.

#### Platform yang Didukung
- **Google Drive** — Akses file Google Docs, Sheets, Slides
- **Notion** — Query database dan halaman Notion
- **GitHub** — Akses repository, issues, dan pull requests
- **Gmail** — Baca dan analisis email

#### Cara Kerja
1. Semua koneksi bersifat **client-side** — data tidak melewati server Anticeil
2. OAuth 2.0 untuk autentikasi yang aman
3. Anda dapat mencabut akses kapan saja dari masing-masing platform

#### Keamanan
- Kredensial disimpan hanya di browser Anda
- Tidak ada data yang disimpan di server Anticeil
- Komunikasi langsung antara browser dan API provider
`,
      contentEn: `
### Connectors Overview

**Connectors** allow AI to directly and securely access data from your external platforms.

#### Supported Platforms
- **Google Drive** — Access Google Docs, Sheets, Slides files
- **Notion** — Query Notion databases and pages
- **GitHub** — Access repositories, issues, and pull requests
- **Gmail** — Read and analyze emails

#### How It Works
1. All connections are **client-side** — data doesn't pass through Anticeil servers
2. OAuth 2.0 for secure authentication
3. You can revoke access anytime from each platform

#### Security
- Credentials stored only in your browser
- No data stored on Anticeil servers
- Direct communication between browser and provider API
`,
    },
    {
      id: 'google-drive-connector',
      titleId: 'Google Drive Connector',
      titleEn: 'Google Drive Connector',
      icon: 'FileText',
      summaryId: 'Akses file Google Docs, Sheets, dan Slides langsung dari chat.',
      summaryEn: 'Access Google Docs, Sheets, and Slides files directly from chat.',
      contentId: `
### Google Drive Integration

#### Setup
1. Buka **Settings** → **Connectors**
2. Klik **Connect Google Drive**
3. Login dengan akun Google Anda
4. Berikan izin yang diperlukan

#### Kemampuan
- **Read Files**: Baca isi Google Docs, Sheets, Slides
- **Search**: Cari file berdasarkan nama atau konten
- **Analyze**: AI dapat menganalisis data dari Sheets
- **Summarize**: Ringkas dokumen panjang

#### Contoh Penggunaan
- *"Baca file 'Q4 Report' di Google Drive saya dan buat ringkasan"*
- *"Analisis data dari spreadsheet 'Sales Data'"*
- *"Cari dokumen yang mengandung kata 'budget'"*

#### Privacy
- Hanya file yang Anda reference yang diakses
- Tidak ada file yang disimpan di server Anticeil
`,
      contentEn: `
### Google Drive Integration

#### Setup
1. Open **Settings** → **Connectors**
2. Click **Connect Google Drive**
3. Log in with your Google account
4. Grant required permissions

#### Capabilities
- **Read Files**: Read Google Docs, Sheets, Slides content
- **Search**: Search files by name or content
- **Analyze**: AI can analyze data from Sheets
- **Summarize**: Summarize long documents

#### Example Usage
- *"Read the file 'Q4 Report' in my Google Drive and create a summary"*
- *"Analyze data from spreadsheet 'Sales Data'"*
- *"Search for documents containing 'budget'"*

#### Privacy
- Only files you reference are accessed
- No files stored on Anticeil servers
`,
    },
    {
      id: 'github-connector',
      titleId: 'GitHub Connector',
      titleEn: 'GitHub Connector',
      icon: 'Github',
      summaryId: 'Akses repository, issues, dan pull requests langsung dari chat.',
      summaryEn: 'Access repositories, issues, and pull requests directly from chat.',
      contentId: `
### GitHub Integration

#### Setup
1. Buka **Settings** → **Connectors**
2. Klik **Connect GitHub**
3. Authorize akses ke akun GitHub Anda
4. Pilih repository yang ingin diakses

#### Kemampuan
- **Browse Repos**: Lihat struktur repository
- **Read Code**: Baca file source code
- **Issues**: Baca dan analisis issues
- **Pull Requests**: Review PR dan diskusi

#### Contoh Penggunaan
- *"Tunjukkan struktur folder dari repo 'my-project'"*
- *"Baca file src/utils.ts dan jelaskan fungsinya"*
- *"Apa issue terbuka di repo saya?"*
- *"Review pull request #42"*

#### Tips
- Gunakan untuk code review dengan AI
- Analisis codebase untuk refactoring
- Debug issues dengan konteks repository
`,
      contentEn: `
### GitHub Integration

#### Setup
1. Open **Settings** → **Connectors**
2. Click **Connect GitHub**
3. Authorize access to your GitHub account
4. Select repositories to access

#### Capabilities
- **Browse Repos**: View repository structure
- **Read Code**: Read source code files
- **Issues**: Read and analyze issues
- **Pull Requests**: Review PRs and discussions

#### Example Usage
- *"Show the folder structure of repo 'my-project'"*
- *"Read file src/utils.ts and explain its functions"*
- *"What are the open issues in my repo?"*
- *"Review pull request #42"*

#### Tips
- Use for AI-assisted code review
- Analyze codebase for refactoring
- Debug issues with repository context
`,
    },
  ],
};
