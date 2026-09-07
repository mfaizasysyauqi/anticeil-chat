import { DocCategory } from '../types';

export const chatStudioCategory: DocCategory = {
  id: 'chat-studio-guide',
  titleId: 'Chat Studio & Multi-Model AI',
  titleEn: 'Chat Studio & Multi-Model AI',
  icon: 'MessageSquare',
  collapsible: true,
  sections: [
    {
      id: 'chat-basics',
      titleId: 'Dasar-Dasar Chat Studio',
      titleEn: 'Chat Studio Fundamentals',
      icon: 'MessageCircle',
      badge: 'Core',
      summaryId: 'Pelajari cara memulai percakapan, mengirim pesan, dan berinteraksi dengan AI.',
      summaryEn: 'Learn how to start conversations, send messages, and interact with AI models.',
      contentId: `
### Memulai Percakapan di Chat Studio

**Chat Studio** adalah pusat interaksi AI utama di Anticeil.

#### 1. Memilih Model AI
Klik nama model di bagian atas chat untuk membuka Model Selector:
- **Claude 3.7 Sonnet** — Reasoning mendalam, coding, analisis kompleks
- **GPT-4o** — General-purpose flagship dari OpenAI
- **Gemini 2.0 Flash** — Cepat dan efisien untuk tugas sehari-hari
- **DeepSeek R1/V3** — Reasoning tingkat tinggi, biaya ekonomis
- **Llama 3.3 70B** — Open-source model dari Meta

#### 2. Mengirim Pesan
- Ketik pesan di kolom input bagian bawah
- Tekan Enter untuk mengirim, Shift+Enter untuk baris baru
- Gunakan ikon paperclip untuk mengunggah file lampiran

#### 3. Streaming Response
AI merespons secara streaming — teks muncul real-time.
`,
      contentEn: `
### Getting Started with Chat Studio

**Chat Studio** is the primary AI interaction hub in Anticeil.

#### 1. Selecting an AI Model
Click the model name at the top to open the Model Selector:
- **Claude 3.7 Sonnet** — Deep reasoning, coding, complex analysis
- **GPT-4o** — General-purpose flagship from OpenAI
- **Gemini 2.0 Flash** — Fast and efficient for daily tasks
- **DeepSeek R1/V3** — High-level reasoning, economical cost
- **Llama 3.3 70B** — Open-source model from Meta

#### 2. Sending Messages
- Type in the input field at the bottom
- Press Enter to send, Shift+Enter for new line
- Use paperclip icon to upload attachments

#### 3. Streaming Response
AI responds in streaming mode — text appears in real-time.
`,
    },
    {
      id: 'code-execution',
      titleId: 'Eksekusi Kode & Artifacts',
      titleEn: 'Code Execution & Artifacts',
      icon: 'Code',
      badge: 'Pro',
      summaryId: 'Jalankan kode Python, JavaScript, dan generate artifacts interaktif.',
      summaryEn: 'Execute Python, JavaScript code, and generate interactive artifacts.',
      contentId: `
### Eksekusi Kode Real-Time

Anticeil mendukung eksekusi kode langsung dalam percakapan AI.

#### Bahasa yang Didukung
- **Python** — Data analysis, scripting, ML/AI prototyping
- **JavaScript/TypeScript** — Web development, Node.js
- **HTML/CSS** — Frontend prototyping

#### Cara Menggunakan
1. Minta AI menulis kode
2. AI menghasilkan blok kode dengan tombol Run
3. Klik Run untuk mengeksekusi kode di browser
4. Hasil output ditampilkan di bawah blok kode
`,
      contentEn: `
### Real-Time Code Execution

Anticeil supports direct code execution within AI conversations.

#### Supported Languages
- **Python** — Data analysis, scripting, ML/AI prototyping
- **JavaScript/TypeScript** — Web development, Node.js
- **HTML/CSS** — Frontend prototyping

#### How to Use
1. Ask AI to write code
2. AI generates a code block with Run button
3. Click Run to execute code in browser
4. Output appears below the code block
`,
    },
    {
      id: 'file-attachments',
      titleId: 'Lampiran File & Document Analysis',
      titleEn: 'File Attachments & Document Analysis',
      icon: 'Paperclip',
      summaryId: 'Unggah dan analisis dokumen PDF, gambar, spreadsheet, dan file code.',
      summaryEn: 'Upload and analyze PDF documents, images, spreadsheets, and code files.',
      contentId: `
### Mengunggah Lampiran File

#### Format yang Didukung
- Dokumen: PDF, TXT, DOCX, MD (10-250MB)
- Spreadsheet: XLSX, CSV, TSV (10-250MB)
- Gambar: PNG, JPG, WEBP, GIF (10-250MB)
- Code: JS, TS, PY, JAVA, dll (10-250MB)

#### Cara Mengunggah
1. Klik ikon paperclip di samping kolom input
2. Pilih file (maksimal 5 file sekaligus)
3. File siap dianalisis oleh AI

#### Use Cases
- Analisis PDF, OCR Gambar, Review Code, Data Analysis
`,
      contentEn: `
### Uploading File Attachments

#### Supported Formats
- Documents: PDF, TXT, DOCX, MD (10-250MB)
- Spreadsheets: XLSX, CSV, TSV (10-250MB)
- Images: PNG, JPG, WEBP, GIF (10-250MB)
- Code: JS, TS, PY, JAVA, etc. (10-250MB)

#### How to Upload
1. Click paperclip icon next to input field
2. Select files (max 5 files at once)
3. Files ready for AI analysis

#### Use Cases
- PDF Analysis, Image OCR, Code Review, Data Analysis
`,
    },
  ],
};
