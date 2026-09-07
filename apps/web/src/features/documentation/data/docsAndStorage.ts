import { DocCategory } from '../types';

export const docsStudioCategory: DocCategory = {
  id: 'docs-studio-guide',
  titleId: 'Docs Studio & AntSheet',
  titleEn: 'Docs Studio & AntSheet',
  icon: 'FileText',
  collapsible: true,
  sections: [
    {
      id: 'latex-editor',
      titleId: 'LaTeX & Overleaf Multi-File Studio',
      titleEn: 'LaTeX & Multi-File Overleaf Studio',
      icon: 'Sigma',
      badge: 'LaTeX Live',
      summaryId: 'Penyuntingan dokumen riset, jurnal IEEE/ACM, dan tesis dengan kompilasi instan.',
      summaryEn: 'Author research papers, IEEE/ACM journals, and thesis documents with instant preview.',
      contentId: `
### Fitur Utama Docs Studio

1. **Multi-File Project**: Dukungan file \`main.tex\`, \`references.bib\`, serta sub-dokumen dalam satu folder proyek.
2. **Live Math Preview**: Rumus matematika KaTeX/LaTeX dirender seketika tanpa perlu antrean build server yang lambat.
3. **AI Co-Authoring**: Dampingi penulisan Anda dengan asisten AI di sidebar untuk memoles abstrak, memperbaiki sitasi, atau menyusun tabel data.
4. **Ekspor Fleksibel**: Ekspor ke format **PDF Berkualitas Tinggi**, **LaTeX Source Code (.zip)**, **DOCX**, atau **Markdown**.
`,
      contentEn: `
### Docs Studio Highlights

1. **Multi-File Architecture**: Support for \`main.tex\`, \`references.bib\`, and modular sub-files within a unified project folder.
2. **Live Math Preview**: Instant KaTeX/LaTeX math formula rendering without laggy build queues.
3. **AI Co-Authoring**: Sidekick assistant to refine abstracts, format citations, and generate complex tables.
4. **Flexible Export**: One-click download as **High-Res PDF**, **LaTeX ZIP Bundle**, **DOCX**, or **Markdown**.
`,
    },
    {
      id: 'antsheet-formula',
      titleId: 'AntSheet: Spreadsheet Cerdas & Visual Chart',
      titleEn: 'AntSheet: Smart Spreadsheet & Charts',
      icon: 'Table',
      badge: 'Excel + AI',
      summaryId: 'Olah data tabular, jalankan formula matematika, dan generate chart interaktif dengan bantuan AI.',
      summaryEn: 'Process tabular datasets, execute spreadsheet formulas, and generate interactive charts with AI.',
      contentId: `
### Cara Menggunakan AntSheet

**AntSheet** adalah modul spreadsheet modern bawaan Anticeil yang menggabungkan kemudahan Excel dengan kecerdasan AI:

- **Formula Standar**: Mendukung \`=SUM(A1:A10)\`, \`=AVERAGE(B1:B20)\`, \`=COUNT\`, \`=MAX\`, \`=MIN\`, dll.
- **AI Data Generator**: Minta AI membuatkan tabel simulasi keuangan, proyeksi anggaran, atau matriks perbandingan produk secara otomatis.
- **Visual Chart Otomatis**: Ubah tabel data menjadi Bar Chart, Line Chart, atau Pie Chart hanya dengan satu klik.
- **Import / Export**: Buka dan simpan file \`.csv\`, \`.tsv\`, atau salin-tempel langsung dari Google Sheets / Excel.
`,
      contentEn: `
### Getting Started with AntSheet

**AntSheet** is a modern spreadsheet engine integrated directly into Anticeil, fusing Excel functionality with AI assistance:

- **Standard Formula Engine**: Supports \`=SUM(A1:A10)\`, \`=AVERAGE(B1:B20)\`, \`=COUNT\`, \`=MAX\`, \`=MIN\`, etc.
- **AI Data Generation**: Prompt AI to craft complex financial forecasts, budget sheets, or product comparison matrices.
- **Instant Visual Charts**: Transform raw rows into Bar, Line, or Pie Charts with one click.
- **Import & Export**: Seamlessly import/export \`.csv\`, \`.tsv\`, or copy-paste directly from Google Sheets / Excel.
`,
    },
  ],
};

export const storageCategory: DocCategory = {
  id: 'storage-privacy',
  titleId: 'Penyimpanan & Privasi',
  titleEn: 'Storage & Privacy',
  icon: 'ShieldCheck',
  sections: [
    {
      id: 'storage-models',
      titleId: 'Local Browser Storage vs Cloud Sync',
      titleEn: 'Local Browser Storage vs Cloud Sync',
      icon: 'Database',
      summaryId: 'Pahami bagaimana data Anda disimpan di browser atau disinkronkan ke cloud secara aman.',
      summaryEn: 'Understand how your data is saved locally in browser memory or securely synced to cloud.',
      contentId: `
### Arsitektur Penyimpanan Anticeil

1. **Free Tier (Local Browser Storage / IndexedDB)**:
   - Semua riwayat chat, dokumen, dan media tersimpan secara lokal di browser Anda.
   - **Kapasitas Tanpa Batas**: Selama harddisk komputer/HP Anda memiliki ruang, Anticeil tidak membatasi kuota simpan Anda.
   - **Privasi 100%**: Tidak ada data percakapan Anda yang disimpan di database server kami.

2. **Starter & Pro Tier (Cloud Sync Supabase + R2 Storage)**:
   - Data otomatis tersinkronisasi antar perangkat (Laptop, Tablet, Smartphone) begitu Anda masuk ke akun.
   - Backup otomatis berulang untuk mencegah kehilangan dokumen penting.
   - File attachment disimpan di Cloudflare R2 dengan enkripsi saat transit (*in-transit*) dan saat diam (*at-rest*).
`,
      contentEn: `
### Anticeil Storage Architecture

1. **Free Tier (Local Browser Storage / IndexedDB)**:
   - Chat histories, documents, and media remain strictly on your local browser engine.
   - **Unlimited Capacity**: Limited only by your local hard drive disk quota.
   - **100% Private**: Zero conversation logs or attachments are recorded on our backend database.

2. **Starter & Pro Tiers (Supabase Cloud Sync + Cloudflare R2)**:
   - Real-time synchronization across all logged-in devices (Laptop, Tablet, Phone).
   - Automated continuous backups preventing accidental data loss.
   - Attachments stored securely in Cloudflare R2 with military-grade encryption at-rest and in-transit.
`,
    },
  ],
};
