import { DocFormat } from '../store/useDocsStore';

export interface DocTemplateFile {
  name: string;
  content: string;
  isMain?: boolean;
}

export interface DocTemplate {
  id: string;
  title: string;
  category: 'academic' | 'technical' | 'notes' | 'business';
  description: string;
  descriptionEn?: string;
  icon: string;
  format?: DocFormat;
  content: string;
  files?: DocTemplateFile[];
}

export const DOC_TEMPLATES: DocTemplate[] = [
  {
    id: 'typst-paper',
    title: 'Typst Academic & Technical Paper',
    category: 'academic',
    description: 'Dokumen akademis & teknis modern format Typst dengan konfigurasi #set page, math, dan struktur bersih.',
    descriptionEn: 'Modern academic & technical Typst paper with #set page, KaTeX/math formulas, and clean layout.',
    icon: 'FileCode',
    format: 'typst',
    content: `#set page(paper: "a4", margin: (x: 2cm, y: 2.5cm))
#set text(font: "Plus Jakarta Sans", size: 11pt)

= Anticeil Core Platform: Typst Technical Paper
#v(0.5em)
*Penulis:* Engineering & Architecture Team \\
*Tanggal:* Maret 2026

#v(1em)
== Abstract
Dokumen ini merupakan contoh spesifikasi teknis dan makalah ilmiah menggunakan bahasa markup modern Typst. Typst menawarkan kompilasi instan dan sintaks yang sangat bersih.

== Pendahuluan
Typst dirancang untuk menggantikan kerumitan LaTeX tanpa mengorbankan kualitas tipografi akademis.

=== Keunggulan Typst
- Sintaks 3x lebih ringkas daripada LaTeX.
- Tidak membutuhkan tag penutup \`\\end{...}\`.
- Formula matematika intuitif: $ f(x) = a x^2 + b x + c $.

== Kesimpulan
Typst sangat cocok digunakan untuk dokumen teknis, makalah riset, dan laporan praktikum di Anticeil.
`,
    files: [
      {
        name: 'main.typ',
        isMain: true,
        content: `#set page(paper: "a4", margin: (x: 2cm, y: 2.5cm))
#set text(font: "Plus Jakarta Sans", size: 11pt)

= Anticeil Core Platform: Typst Technical Paper
#v(0.5em)
*Penulis:* Engineering & Architecture Team \\
*Tanggal:* Maret 2026

#v(1em)
== Abstract
Dokumen ini merupakan contoh spesifikasi teknis dan makalah ilmiah menggunakan bahasa markup modern Typst. Typst menawarkan kompilasi instan dan sintaks yang sangat bersih.

== Pendahuluan
Typst dirancang untuk menggantikan kerumitan LaTeX tanpa mengorbankan kualitas tipografi akademis.

=== Keunggulan Typst
- Sintaks 3x lebih ringkas daripada LaTeX.
- Tidak membutuhkan tag penutup \`\\end{...}\`.
- Formula matematika intuitif: $ f(x) = a x^2 + b x + c $.

== Kesimpulan
Typst sangat cocok digunakan untuk dokumen teknis, makalah riset, dan laporan praktikum di Anticeil.
`,
      },
    ],
  },
  {
    id: 'software-docs',
    title: 'Software Documentation & REST API Specs',
    category: 'technical',
    description: 'Dokumentasi teknis modular software & REST API dengan arsitektur sistem, authentication, dan endpoint schemas.',
    descriptionEn: 'Modular technical documentation & REST API specs with system architecture, authentication, and endpoint schemas.',
    icon: 'FileCode',
    format: 'latex',
    content: `\\documentclass[11pt,a4paper]{article}

\\usepackage{amsmath}
\\usepackage{hyperref}
\\usepackage{booktabs}
\\usepackage{listings}

\\title{Anticeil Core Platform: Developer Documentation \\& REST API Specification}
\\author{Engineering \\& Platform Architecture Team}
\\date{Maret 2026}

\\begin{document}

\\maketitle

\\begin{abstract}
Dokumentasi teknis resmi dan spesifikasi RESTful API platform Anticeil. Dokumen ini mencakup arsitektur sistem, protokol autentikasi token, rate limiting, serta referensi lengkap seluruh endpoint data dan AI stream.
\\end{abstract}

\\tableofcontents

\\input{sections/01_overview.tex}
\\input{sections/02_architecture.tex}
\\input{sections/03_authentication.tex}
\\input{sections/04_api_reference.tex}

\\end{document}
`,
    files: [
      {
        name: 'main.tex',
        isMain: true,
        content: `\\documentclass[11pt,a4paper]{article}

\\usepackage{amsmath}
\\usepackage{hyperref}
\\usepackage{booktabs}
\\usepackage{listings}

\\title{Anticeil Core Platform: Developer Documentation \\& REST API Specification}
\\author{Engineering \\& Platform Architecture Team}
\\date{Maret 2026}

\\begin{document}

\\maketitle

\\begin{abstract}
Dokumentasi teknis resmi dan spesifikasi RESTful API platform Anticeil. Dokumen ini mencakup arsitektur sistem, protokol autentikasi token, rate limiting, serta referensi lengkap seluruh endpoint data dan AI stream.
\\end{abstract}

\\tableofcontents

\\input{sections/01_overview.tex}
\\input{sections/02_architecture.tex}
\\input{sections/03_authentication.tex}
\\input{sections/04_api_reference.tex}

\\end{document}
`,
      },
      {
        name: 'sections/01_overview.tex',
        content: `\\section{Gambaran Umum Platform}
Anticeil adalah platform kolaborasi dokumen, slide, spreadsheet, dan percakapan AI multi-model yang mengedepankan privasi \\textit{client-side encryption} dan efisiensi \\textit{feature-first}.

\\subsection{Prinsip Desain Utama}
\\begin{itemize}
\\item \\textbf{Zero-Data Retention:} Seluruh kunci API provider disimpan terenkripsi di browser pengguna.
\\item \\textbf{High Throughput Streaming:} Server-Sent Events (SSE) dengan latensi awal di bawah 100ms.
\\item \\textbf{Modular File System:} Dukungan multi-file Overleaf-style dengan preview live 60fps.
\\end{itemize}
`,
      },
      {
        name: 'sections/02_architecture.tex',
        content: `\\section{Arsitektur Sistem}
Sistem dibangun di atas arsitektur web modern dengan Next.js App Router, Zustand reactive state, KaTeX mathematical typesetting engine, dan Web Worker parser.

\\begin{table}[htbp]
\\centering
\\begin{tabular}{|l|l|l|}
\\hline
Komponen & Teknologi & Fungsi Utama \\\\
\\hline
Frontend UI & React 19 / Next.js & Interface Studio interaktif \\\\
State Management & Zustand + Immer & State granular & sub-file tracking \\\\
Compiler & KaTeX + Marked & Render cepat LaTeX \& Markdown \\\\
Storage & IndexedDB / LocalStorage & Offline-first cache & enkripsi \\\\
\\hline
\\end{tabular}
\\caption{Komponen Inti Arsitektur Anticeil}
\\end{table}
`,
      },
      {
        name: 'sections/03_authentication.tex',
        content: `\\section{Autentikasi \\& Keamanan}
Setiap panggilan API memerlukan header autentikasi Bearer token yang valid atau konfigurasi kunci API BYOK (Bring Your Own Key):

\\begin{verbatim}
Authorization: Bearer ant_sec_live_9f83a02b4e81c7d
Content-Type: application/json
X-Client-Version: 2026.3.0
\\end{verbatim}

\\subsection{Rate Limiting Policy}
Tiap tingkatan pengguna memiliki kuota request per menit (RPM):
\\begin{itemize}
\\item \\textbf{Free Tier:} 60 RPM, batas burst 10 request/detik.
\\item \\textbf{Pro Tier:} 300 RPM, burst tidak terbatas.
\\item \\textbf{Enterprise:} Dedicated throughput SLA 99.99\\%.
\\end{itemize}
`,
      },
      {
        name: 'sections/04_api_reference.tex',
        content: `\\section{Referensi REST API Endpoints}

\\subsection{POST /api/v1/documents/generate}
Membuat dan menginisiasi generasi dokumen multi-file menggunakan model AI yang dipilih.

\\subsubsection{Request Body Parameter}
\\begin{itemize}
\\item \\texttt{prompt} (string, required): Deskripsi kebutuhan dokumen.
\\item \\texttt{format} (string, required): Pilihan \\texttt{"latex"}, \\texttt{"slide"}, \\texttt{"sheet"}, atau \\texttt{"markdown"}.
\\item \\texttt{modelId} (string, optional): ID model provider (misal: \\texttt{"anthropic/claude-3-7-sonnet"}).
\\end{itemize}

\\subsubsection{Response Format (200 OK)}
\\begin{verbatim}
{
  "status": "success",
  "data": {
    "documentId": "doc_928103",
    "title": "Cloud Architecture Guide",
    "filesCount": 4
  }
}
\\end{verbatim}
`,
      },
    ],
  },
  {
    id: 'prd-specification',
    title: 'Product Requirement Document (PRD)',
    category: 'business',
    description: 'Spesifikasi produk menyeluruh dengan user personas, user stories, functional requirements, dan success metrics.',
    descriptionEn: 'Comprehensive product specifications with user personas, user stories, functional requirements, and success metrics.',
    icon: 'Layers',
    format: 'latex',
    content: `\\documentclass[11pt,a4paper]{article}

\\usepackage{amsmath}
\\usepackage{hyperref}
\\usepackage{booktabs}

\\title{Product Requirement Document: Real-Time Collaborative Docs Studio}
\\author{Product Management Team \\& Design Guild}
\\date{Maret 2026}

\\begin{document}

\\maketitle

\\begin{abstract}
PRD ini mendefinisikan visi produk, target persona pengguna, kebutuhan fungsional (FR) dan non-fungsional (NFR), serta target metrik keberhasilan untuk fitur Docs Studio v2.5.
\\end{abstract}

\\tableofcontents

\\input{sections/01_problem.tex}
\\input{sections/02_user_stories.tex}
\\input{sections/03_requirements.tex}
\\input{sections/04_metrics.tex}

\\end{document}
`,
    files: [
      {
        name: 'main.tex',
        isMain: true,
        content: `\\documentclass[11pt,a4paper]{article}

\\usepackage{amsmath}
\\usepackage{hyperref}
\\usepackage{booktabs}

\\title{Product Requirement Document: Real-Time Collaborative Docs Studio}
\\author{Product Management Team \\& Design Guild}
\\date{Maret 2026}

\\begin{document}

\\maketitle

\\begin{abstract}
PRD ini mendefinisikan visi produk, target persona pengguna, kebutuhan fungsional (FR) dan non-fungsional (NFR), serta target metrik keberhasilan untuk fitur Docs Studio v2.5.
\\end{abstract}

\\tableofcontents

\\input{sections/01_problem.tex}
\\input{sections/02_user_stories.tex}
\\input{sections/03_requirements.tex}
\\input{sections/04_metrics.tex}

\\end{document}
`,
      },
      {
        name: 'sections/01_problem.tex',
        content: `\\section{Latar Belakang \\& Masalah Pengguna}
Pengguna profesional saat ini terfragmentasi antara tool dokumen monolitik (Google Docs), editor LaTeX rumit (Overleaf tanpa AI native), dan aplikasi presentasi konvensional. Mereka membutuhkan satu workspace terpadu yang mampu menghasilkan dokumen teknis, slide, dan kalkulasi dengan struktur modular feature-first.
`,
      },
      {
        name: 'sections/02_user_stories.tex',
        content: `\\section{User Personas \\& Stories}

\\subsection{Persona: Alex (Lead Software Engineer)}
\\begin{itemize}
\\item \\textbf{Kebutuhan:} Ingin menulis dokumentasi API dan RFC sistem dengan cepat tanpa pusing mengatur syntax LaTeX dari awal.
\\item \\textbf{User Story:} \\textit{Sebagai engineer, saya ingin AI membuat kerangka multi-file lengkap agar tim saya langsung fokus pada isi teknis.}
\\end{itemize}

\\subsection{Persona: Sarah (Product Manager)}
\\begin{itemize}
\\item \\textbf{Kebutuhan:} Menyusun PRD dan pitch deck ringkas dengan tabel metrik yang tersinkronisasi.
\\item \\textbf{User Story:} \\textit{Sebagai PM, saya ingin daftar isi dan outline selalu terupdate otomatis saat dokumen bertambah.}
\\end{itemize}
`,
      },
      {
        name: 'sections/03_requirements.tex',
        content: `\\section{Spesifikasi Kebutuhan}

\\subsection{Functional Requirements (FR)}
\\begin{itemize}
\\item \\textbf{FR-01:} Sidebar file explorer mendukung pembuatan, rename, hapus, dan switch sub-file secara instan.
\\item \\textbf{FR-02:} AI Co-Author dapat memodifikasi satu sub-file spesifik dengan action tag \\texttt{<edit\\_file>}.
\\item \\textbf{FR-03:} Table of Contents (Daftar Isi) otomatis me-render hierarki heading tanpa halaman kosong.
\\end{itemize}

\\subsection{Non-Functional Requirements (NFR)}
\\begin{itemize}
\\item \\textbf{NFR-01:} Waktu render preview di bawah 16ms (60 fps smoothness).
\\item \\textbf{NFR-02:} Zero telemetry pada API keys pengguna.
\\end{itemize}
`,
      },
      {
        name: 'sections/04_metrics.tex',
        content: `\\section{Metrik Keberhasilan (OKRs)}
\\begin{table}[htbp]
\\centering
\\begin{tabular}{|l|c|c|}
\\hline
Indikator Metrik & Baseline & Target Q2 \\\\
\\hline
Dokumen Berhasil Dibuat / User & 2.1 & $\\ge 5.8$ \\\\
Efisiensi Edit Sub-File (Waktu) & 4.5 min & $\\le 1.2$ min \\\\
CSAT Score Docs Studio & 4.1 / 5.0 & $\\ge 4.8$ / 5.0 \\\\
\\hline
\\end{tabular}
\\caption{Target KPI Kinerja Fitur Docs Studio}
\\end{table}
`,
      },
    ],
  },
  {
    id: 'academic-paper',
    title: 'Academic Research Paper (Feature-First)',
    category: 'academic',
    description: 'Format paper ilmiah IEEE modular dengan struktur folder sections/ (intro, theory, results) dan references.bib.',
    descriptionEn: 'Modular IEEE research paper format with sections/ directory structure (intro, theory, results) and references.bib.',
    icon: 'GraduationCap',
    format: 'latex',
    content: `\\documentclass[11pt,journal,compsoc]{IEEEtran}

\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{amsfonts}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{booktabs}
\\usepackage{microtype}

\\begin{document}

\\title{Optimasi Model Jaringan Saraf Konvolusional Menggunakan Algoritma Genetika Adaptif}
\\author{Muhammad Faiza Asysyauqi, \\textit{Member, IEEE}, dan Dr. Ir. H. Ahmad Dahlan}

\\begin{abstract}
Penelitian ini menyajikan pendekatan hibrida baru untuk optimasi hiperparameter pada Deep Convolutional Neural Networks (CNN) menggunakan algoritma genetika adaptif. Kami membuktikan batas konvergensi teoritis dan mendemonstrasikan evaluasi empiris pada dataset benchmark. Hasil eksperimen menunjukkan peningkatan akurasi sebesar 4.82\\% dengan pengurangan waktu inferensi sebesar 23.5\\%.
\\end{abstract}

\\begin{IEEEkeywords}
Deep Learning, Convolutional Neural Networks, Genetic Algorithms, Hyperparameter Optimization.
\\end{IEEEkeywords}

\\input{sections/01_introduction.tex}
\\input{sections/02_theory.tex}
\\input{sections/03_results.tex}
\\input{sections/04_conclusion.tex}

\\bibliographystyle{IEEEtran}
\\bibliography{references}

\\end{document}
`,
    files: [
      {
        name: 'main.tex',
        isMain: true,
        content: `\\documentclass[11pt,journal,compsoc]{IEEEtran}

\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{amsfonts}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{booktabs}
\\usepackage{microtype}

\\begin{document}

\\title{Optimasi Model Jaringan Saraf Konvolusional Menggunakan Algoritma Genetika Adaptif}
\\author{Muhammad Faiza Asysyauqi, \\textit{Member, IEEE}, dan Dr. Ir. H. Ahmad Dahlan}

\\begin{abstract}
Penelitian ini menyajikan pendekatan hibrida baru untuk optimasi hiperparameter pada Deep Convolutional Neural Networks (CNN) menggunakan algoritma genetika adaptif. Kami membuktikan batas konvergensi teoritis dan mendemonstrasikan evaluasi empiris pada dataset benchmark. Hasil eksperimen menunjukkan peningkatan akurasi sebesar 4.82\\% dengan pengurangan waktu inferensi sebesar 23.5\\%.
\\end{abstract}

\\begin{IEEEkeywords}
Deep Learning, Convolutional Neural Networks, Genetic Algorithms, Hyperparameter Optimization.
\\end{IEEEkeywords}

\\input{sections/01_introduction.tex}
\\input{sections/02_theory.tex}
\\input{sections/03_results.tex}
\\input{sections/04_conclusion.tex}

\\bibliographystyle{IEEEtran}
\\bibliography{references}

\\end{document}
`,
      },
      {
        name: 'sections/01_introduction.tex',
        content: `\\section{Pendahuluan}
\\IEEEPARstart{D}{alam} beberapa tahun terakhir, arsitektur \\textit{deep learning} telah merevolusi bidang visi komputer. Namun, penentuan hiperparameter optimal tetap menjadi tantangan komputasi non-trivial:

\\begin{equation}
\\min_{\\theta \\in \\Theta} \\mathcal{L}(\\theta; \\mathcal{D}_{\\text{val}}) = \\frac{1}{N} \\sum_{i=1}^N \\ell(f(x_i; \\theta), y_i)
\\end{equation}

di mana $\\Theta$ adalah ruang pencarian hiperparameter dan $\\mathcal{L}$ adalah fungsi \\textit{loss cross-entropy}.
`,
      },
      {
        name: 'sections/02_theory.tex',
        content: `\\section{Formulasi Matematis \\& Teori}
\\subsection{Fungsi Aktivasi Adaptif}
Kami mendefinisikan fungsi aktivasi termodifikasi $\\psi(x)$ sebagai berikut:

\\begin{equation}
\\psi(x) = \\sigma(\\alpha x) \\cdot \\tanh(\\beta x) + \\gamma x
\\end{equation}

dengan gradien turunan terhadap input:

\\begin{equation}
\\frac{\\partial \\psi}{\\partial x} = \\alpha \\sigma(\\alpha x)(1 - \\sigma(\\alpha x))\\tanh(\\beta x) + \\beta \\sigma(\\alpha x)(1 - \\tanh^2(\\beta x)) + \\gamma
\\end{equation}

\\subsection{Konvergensi Algoritma}
Tingkat konvergensi dijamin melalui ketaksamaan Cauchy-Schwarz pada ruang Hilbert $L^2(\\Omega)$:

\\begin{equation}
\\left| \\int_{\\Omega} f(x)g(x) \\, dx \\right|^2 \\le \\left( \\int_{\\Omega} |f(x)|^2 \\, dx \\right) \\left( \\int_{\\Omega} |g(x)|^2 \\, dx \\right)
\\end{equation}
`,
      },
      {
        name: 'sections/03_results.tex',
        content: `\\section{Hasil Eksperimen}
Performa model dievaluasi secara komprehensif sebagaimana dirangkum pada Tabel I.

\\begin{table}[htbp]
\\centering
\\begin{tabular}{|l|c|c|c|c|}
\\hline
Model Arsitektur & Top-1 Acc (\\%) & Latency (ms) & FLOPs (G) & Param (M) \\\\
\\hline
ResNet-50 Baseline & 76.12 & 14.2 & 4.12 & 25.6 \\\\
EfficientNet-B2 & 79.80 & 18.5 & 1.05 & 9.2 \\\\
Metode Usulan (Ours) & \\textbf{84.62} & \\textbf{10.9} & \\textbf{0.88} & \\textbf{7.4} \\\\
\\hline
\\end{tabular}
\\caption{Perbandingan Kinerja Model pada Dataset Benchmark}
\\label{tab:benchmark}
\\end{table}
`,
      },
      {
        name: 'sections/04_conclusion.tex',
        content: `\\section{Kesimpulan}
Metode yang diusulkan berhasil membuktikan efektivitas pencarian arsitektur terpandu dengan penalti komputasi minimal. Pendekatan modular mempermudah pengujian berulang dan validasi parameter.
`,
      },
      {
        name: 'references.bib',
        content: `@article{lecun2015,
  author = {Y. LeCun and Y. Bengio and G. Hinton},
  title = {Deep learning},
  journal = {Nature},
  volume = {521},
  number = {7553},
  pages = {436--444},
  year = {2015}
}

@inproceedings{vaswani2017,
  author = {A. Vaswani and others},
  title = {Attention is all you need},
  booktitle = {Advances in Neural Information Processing Systems},
  volume = {30},
  year = {2017}
}

@book{goodfellow2016,
  author = {I. Goodfellow and Y. Bengio and A. Courville},
  title = {Deep Learning},
  publisher = {MIT Press},
  year = {2016}
}
`,
      },
    ],
  },
  {
    id: 'technical-rfc',
    title: 'Technical Specification & RFC',
    category: 'technical',
    description: 'Spesifikasi arsitektur sistem dan RFC teknis berstandar IETF/ACM dalam format LaTeX murni.',
    descriptionEn: 'System architecture specifications and RFC standard technical documents in pure LaTeX format.',
    icon: 'Cpu',
    format: 'latex',
    content: `\\documentclass[11pt,a4paper]{article}

\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{hyperref}
\\usepackage{booktabs}

\\title{RFC 042: High-Throughput Token Streaming \\& Client-Side Encryption Gateway}
\\author{Anticeil Core Architecture Team}
\\date{Maret 2026}

\\begin{document}

\\maketitle

\\begin{abstract}
Dokumen ini menguraikan spesifikasi teknis arsitektur \\textit{Zero-Proxy Token Gateway} yang menghubungkan antarmuka web client langsung ke provider model AI dengan enkripsi AES-GCM 256-bit di sisi browser.
\\end{abstract}

\\input{sections/01_status.tex}
\\input{sections/02_sla.tex}
\\input{sections/03_security.tex}

\\end{document}
`,
    files: [
      {
        name: 'main.tex',
        isMain: true,
        content: `\\documentclass[11pt,a4paper]{article}

\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{hyperref}
\\usepackage{booktabs}

\\title{RFC 042: High-Throughput Token Streaming \\& Client-Side Encryption Gateway}
\\author{Anticeil Core Architecture Team}
\\date{Maret 2026}

\\begin{document}

\\maketitle

\\begin{abstract}
Dokumen ini menguraikan spesifikasi teknis arsitektur \\textit{Zero-Proxy Token Gateway} yang menghubungkan antarmuka web client langsung ke provider model AI dengan enkripsi AES-GCM 256-bit di sisi browser.
\\end{abstract}

\\input{sections/01_status.tex}
\\input{sections/02_sla.tex}
\\input{sections/03_security.tex}

\\end{document}
`,
      },
      {
        name: 'sections/01_status.tex',
        content: `\\section{Status Dokumen}
\\textbf{Status:} PROPOSED \\\\
\\textbf{Target Rilis:} v2.4.0 \\\\
\\textbf{Kategori:} Standard Track Architecture

\\section{Ringkasan Eksekutif}
Sistem gerbang token menyediakan saluran streaming \\textit{Server-Sent Events (SSE)} berkecepatan tinggi dengan overhead serialisasi di bawah 5 milidetik.
`,
      },
      {
        name: 'sections/02_sla.tex',
        content: `\\section{Spesifikasi Kinerja \\& SLA}
Tingkat layanan (Service Level Agreement) sistem didefinisikan sebagai berikut:

\\begin{itemize}
\\item \\textbf{Time to First Token (TTFT):} $\\le 120\\text{ ms}$
\\item \\textbf{Throughput Target:} $\\ge 150\\text{ tokens/s}$
\\item \\textbf{Client Memory Ceiling:} $\\le 45\\text{ MB}$ footprint
\\end{itemize}

Formulasi total latensi jaringan dinyatakan dengan:

\\begin{equation}
\\text{Total Latency} = T_{\\text{DNS}} + T_{\\text{TLS}} + T_{\\text{TTFT}} + \\sum_{k=1}^M \\frac{\\text{Tokens}_k}{\\text{Speed}}
\\end{equation}
`,
      },
      {
        name: 'sections/03_security.tex',
        content: `\\section{Matrix Keamanan}
\\begin{table}[htbp]
\\centering
\\begin{tabular}{|l|l|l|}
\\hline
Lapisan & Algoritma & Manajemen Kunci \\\\
\\hline
Penyimpanan Lokal & AES-GCM 256-bit & PBKDF2 (100,000 iterasi) \\\\
Transmisi & TLS 1.3 Strict & Zero-Trust Ephemeral \\\\
Payload Stream & Base64 UTF-8 & Direct BYOK Vault \\\\
\\hline
\\end{tabular}
\\caption{Matrix Protokol Enkripsi}
\\end{table}
`,
      },
    ],
  },
  {
    id: 'feature-first-slides',
    title: 'Pitch Deck & Architecture Presentation',
    category: 'business',
    description: 'Presentasi Slide modular dengan direktori slides/ (title, problem, solution, metrics, roadmap).',
    descriptionEn: 'Modular slide deck presentation with slides/ directory (title, problem, solution, metrics, roadmap).',
    icon: 'Presentation',
    format: 'slide',
    content: `# Anticeil Platform Overview
<!-- theme: midnight -->
<!-- transition: slide -->

@[include](slides/01_title.md)
---
@[include](slides/02_problem.md)
---
@[include](slides/03_solution.md)
---
@[include](slides/04_metrics.md)
---
@[include](slides/05_roadmap.md)
`,
    files: [
      {
        name: 'main.slide',
        isMain: true,
        content: `# Anticeil Platform Overview
<!-- theme: midnight -->
<!-- transition: slide -->

@[include](slides/01_title.md)
---
@[include](slides/02_problem.md)
---
@[include](slides/03_solution.md)
---
@[include](slides/04_metrics.md)
---
@[include](slides/05_roadmap.md)
`,
      },
      {
        name: 'slides/01_title.md',
        content: `# Anticeil AI Studio
### Generasi Dokumen, Slide, & Spreadsheet Generatif
**Pembicara:** Tim Arsitektur Anticeil
**Waktu:** Q1 2026
`,
      },
      {
        name: 'slides/02_problem.md',
        content: `## Tantangan Saat Ini
- **Monolithic Documents**: Mengedit satu dokumen besar membuang ribuan token dan lambat.
- **Context Limits**: Sulit menargetkan perubahan pada bagian spesifik tanpa merusak format lain.
- **Kurang Terstruktur**: Dokumen, slide, dan sheet tercampur tanpa layer feature-first yang rapi.
`,
      },
      {
        name: 'slides/03_solution.md',
        content: `## Solusi: Feature-First Architecture
1. **Modular Folders**: Direktori \`sections/\`, \`slides/\`, \`sheets/\` yang terisolasi.
2. **Targeted AI Patching**: Model hanya mem-patch sub-file tertentu dengan presisi tinggi.
3. **Overleaf-Style Tree**: File explorer visual dengan drag, create, rename, dan tabs.
`,
      },
      {
        name: 'slides/04_metrics.md',
        content: `## Metrik & Peningkatan Kinerja
- **Efisiensi Token**: Hemat hingga **65%** token per prompt pengeditan.
- **Kecepatan Live Preview**: Rendering instant 60fps tanpa re-render keseluruhan.
- **Skalabilitas Proyek**: Mendukung ratusan sub-file dalam 1 ruang kerja.
`,
      },
      {
        name: 'slides/05_roadmap.md',
        content: `## Rencana Pengembangan
- [x] Engine Feature-First Docs, Slides, Sheets
- [ ] Integrasi Git Sync & Remote Branching
- [ ] AI Agentic Auto-Refactoring & Linter
`,
      },
    ],
  },
  {
    id: 'feature-first-sheet',
    title: 'Financial & Growth Model (AntSheet)',
    category: 'business',
    description: 'Model spreadsheet komprehensif dengan dashboard eksekutif, sheet opex, dan kamus data.',
    descriptionEn: 'Comprehensive spreadsheet model with executive dashboard, OPEX calculation sheet, and data dictionary.',
    icon: 'FileSpreadsheet',
    format: 'sheet',
    content: `# Financial & Growth Model

## Meta
columnWidth: A=200, B=140, C=140, D=140
rowHeight: 1=36
freezeRow: 1

## Cells
A1 = "Kategori Indikator" | fontWeight: bold, fontSize: 13, backgroundColor: #1e293b, color: #ffffff, textAlign: center
B1 = "Target Q1 (IDR)"   | fontWeight: bold, fontSize: 13, backgroundColor: #1e293b, color: #ffffff, textAlign: center
C1 = "Realisasi Q1 (IDR)" | fontWeight: bold, fontSize: 13, backgroundColor: #1e293b, color: #ffffff, textAlign: center
D1 = "Capaian (%)"        | fontWeight: bold, fontSize: 13, backgroundColor: #1e293b, color: #ffffff, textAlign: center

A2 = "Pendapatan Langganan"
B2 = 250000000 | format: currency:IDR, textAlign: right
C2 = 285000000 | format: currency:IDR, textAlign: right
D2 = "=C2/B2"  | format: percentage, textAlign: right, color: #16a34a, fontWeight: bold

A3 = "Enterprise Consulting"
B3 = 150000000 | format: currency:IDR, textAlign: right
C3 = 160000000 | format: currency:IDR, textAlign: right
D3 = "=C3/B3"  | format: percentage, textAlign: right, color: #16a34a, fontWeight: bold

A4 = "Biaya Operasional (OPEX)"
B4 = 120000000 | format: currency:IDR, textAlign: right
C4 = 105000000 | format: currency:IDR, textAlign: right
D4 = "=C4/B4"  | format: percentage, textAlign: right, color: #2563eb, fontWeight: bold

A5 = "Laba Bersih Operasional"
B5 = "=(B2+B3)-B4" | format: currency:IDR, textAlign: right, fontWeight: bold
C5 = "=(C2+C3)-C4" | format: currency:IDR, textAlign: right, fontWeight: bold
D5 = "=C5/B5"      | format: percentage, textAlign: right, color: #16a34a, fontWeight: bold

## Charts
chart1 = bar | title: "Perbandingan Target vs Realisasi Q1", x: A, series: [B, C], position: F2:N14
`,
    files: [
      {
        name: 'sheet1.antsheet',
        isMain: true,
        content: `# Financial & Growth Model

## Meta
columnWidth: A=200, B=140, C=140, D=140
rowHeight: 1=36
freezeRow: 1

## Cells
A1 = "Kategori Indikator" | fontWeight: bold, fontSize: 13, backgroundColor: #1e293b, color: #ffffff, textAlign: center
B1 = "Target Q1 (IDR)"   | fontWeight: bold, fontSize: 13, backgroundColor: #1e293b, color: #ffffff, textAlign: center
C1 = "Realisasi Q1 (IDR)" | fontWeight: bold, fontSize: 13, backgroundColor: #1e293b, color: #ffffff, textAlign: center
D1 = "Capaian (%)"        | fontWeight: bold, fontSize: 13, backgroundColor: #1e293b, color: #ffffff, textAlign: center

A2 = "Pendapatan Langganan"
B2 = 250000000 | format: currency:IDR, textAlign: right
C2 = 285000000 | format: currency:IDR, textAlign: right
D2 = "=C2/B2"  | format: percentage, textAlign: right, color: #16a34a, fontWeight: bold

A3 = "Enterprise Consulting"
B3 = 150000000 | format: currency:IDR, textAlign: right
C3 = 160000000 | format: currency:IDR, textAlign: right
D3 = "=C3/B3"  | format: percentage, textAlign: right, color: #16a34a, fontWeight: bold

A4 = "Biaya Operasional (OPEX)"
B4 = 120000000 | format: currency:IDR, textAlign: right
C4 = 105000000 | format: currency:IDR, textAlign: right
D4 = "=C4/B4"  | format: percentage, textAlign: right, color: #2563eb, fontWeight: bold

A5 = "Laba Bersih Operasional"
B5 = "=(B2+B3)-B4" | format: currency:IDR, textAlign: right, fontWeight: bold
C5 = "=(C2+C3)-C4" | format: currency:IDR, textAlign: right, fontWeight: bold
D5 = "=C5/B5"      | format: percentage, textAlign: right, color: #16a34a, fontWeight: bold

## Charts
chart1 = bar | title: "Perbandingan Target vs Realisasi Q1", x: A, series: [B, C], position: F2:N14
`,
      },
      {
        name: 'sheets/operational_costs.antsheet',
        content: `# Rincian Biaya Operasional (OPEX)

## Meta
columnWidth: A=220, B=150, C=150
rowHeight: 1=34

## Cells
A1 = "Komponen Biaya" | fontWeight: bold, backgroundColor: #0f172a, color: #ffffff
B1 = "Alokasi Bulanan" | fontWeight: bold, backgroundColor: #0f172a, color: #ffffff, textAlign: right
C1 = "Total Kuartal (Q1)" | fontWeight: bold, backgroundColor: #0f172a, color: #ffffff, textAlign: right

A2 = "Cloud Hosting & GPU Compute"
B2 = 18000000 | format: currency:IDR, textAlign: right
C2 = "=B2*3"  | format: currency:IDR, textAlign: right, fontWeight: bold

A3 = "Software Licenses & SaaS"
B3 = 7000000  | format: currency:IDR, textAlign: right
C3 = "=B3*3"  | format: currency:IDR, textAlign: right, fontWeight: bold

A4 = "Maintenance & Support"
B4 = 10000000 | format: currency:IDR, textAlign: right
C4 = "=B4*3"  | format: currency:IDR, textAlign: right, fontWeight: bold

A5 = "Total Pengeluaran"
B5 = "=SUM(B2:B4)" | format: currency:IDR, textAlign: right, fontWeight: bold
C5 = "=SUM(C2:C4)" | format: currency:IDR, textAlign: right, fontWeight: bold
`,
      },
      {
        name: 'data/dictionary.md',
        content: `# Data Dictionary & Assumptions

### Definisi Indikator
1. **Target Q1**: Estimasi anggaran dasar berdasarkan forecast keuangan Q4 tahun sebelumnya.
2. **Realisasi Q1**: Angka riil yang telah teraudit dan terverifikasi dari payment gateway.
3. **Capaian (%)**: Formula \`=Realisasi / Target * 100%\`.

### Catatan Model Keuangan
- Nilai mata uang menggunakan denominasi IDR (Rupiah).
- Perhitungan laba bersih operasional: \`(Pendapatan Langganan + Consulting) - Biaya OPEX\`.
`,
      },
    ],
  },
  {
    id: 'math-physics-notes',
    title: 'Math & Quantum Physics Notes',
    category: 'notes',
    description: 'Catatan kuliah matematika & fisika kuantum dengan persamaan Schrödinger, matriks Pauli, dan integral Fourier.',
    descriptionEn: 'Mathematics & quantum physics notes featuring Schrödinger equation, Pauli matrices, and Fourier integrals.',
    icon: 'Sigma',
    format: 'latex',
    content: `\\documentclass[11pt,a4paper]{article}

\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{physics}

\\title{Catatan Teori Kuantum: Persamaan Schr\\\"odinger \\& Mekanika Matriks}
\\author{Departemen Fisika Teoretis}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
Dokumen referensi ringkas mengenai dinamika keadaan kuantum, aljabar operator spin elektron, dan transformasi ruang momentum.
\\end{abstract}

\\section{Persamaan Schr\\\"odinger Bergantung Waktu}
Persamaan fundamental dinamika keadaan kuantum $|\\psi(t)\\rangle$:

\\begin{equation}
i\\hbar \\frac{\\partial}{\\partial t} \\Psi(\\mathbf{r}, t) = \\left[ -\\frac{\\hbar^2}{2m} \\nabla^2 + V(\\mathbf{r}, t) \\right] \\Psi(\\mathbf{r}, t)
\\end{equation}

di mana Hamiltonian $\\hat{H}$ didefinisikan sebagai operator energi total:

\\begin{equation}
\\hat{H} = \\frac{\\hat{\\mathbf{p}}^2}{2m} + \\hat{V}(\\mathbf{r})
\\end{equation}

\\section{Matriks Pauli \\& Spin-$\\frac{1}{2}$}
Operator spin elektron memenuhi aljabar Lie $\\mathfrak{su}(2)$:

\\begin{equation}
\\sigma_x = \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}, \\quad \\sigma_y = \\begin{pmatrix} 0 & -i \\\\ i & 0 \\end{pmatrix}, \\quad \\sigma_z = \\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}
\\end{equation}

\\section{Transformasi Fourier pada Fungsi Gelombang}
Representasi ruang momentum fungsi gelombang $\\Phi(p)$:

\\begin{equation}
\\Phi(p) = \\frac{1}{\\sqrt{2\\pi \\hbar}} \\int_{-\\infty}^{\\infty} \\Psi(x) e^{-i px / \\hbar} \\, dx
\\end{equation}

\\end{document}
`,
  },
  {
    id: 'academic-cv',
    title: 'Academic & Executive Curriculum Vitae',
    category: 'business',
    description: 'Template CV akademik / profesional berstandar internasional dengan tata letak bersih berformat LaTeX.',
    descriptionEn: 'International standard academic and professional CV template with clean LaTeX typography.',
    icon: 'FileText',
    format: 'latex',
    content: `\\documentclass[11pt,a4paper]{article}

\\usepackage{hyperref}
\\usepackage{geometry}
\\geometry{margin=1in}

\\title{Curriculum Vitae: Muhammad Faiza Asysyauqi}
\\author{Senior AI Systems Architect \\& Software Engineer}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
Kontak: faiza@anticeil.com \\quad | \\quad Web: \\url{https://anticeil.com} \\quad | \\quad Lokasi: Jakarta, Indonesia
\\end{abstract}

\\section{Ringkasan Eksekutif}
Software Engineer dengan spesialisasi dalam arsitektur AI terdesentralisasi, model inference streaming, dan performa tinggi pada aplikasi web modern.

\\section{Pengalaman Profesional}
\\subsection{Lead AI Engineer --- Anticeil Labs (2024 -- Sekarang)}
\\begin{itemize}
\\item Merancang sistem \\textbf{Zero-Proxy BYOK Architecture} yang memproses 1.2M+ token streaming harian dengan latensi $<100\\text{ ms}$.
\\item Membangun editor dokumen interaktif \\textbf{Agentic Docs} dengan rendering KaTeX real-time 60fps.
\\end{itemize}

\\section{Pendidikan}
\\begin{itemize}
\\item \\textbf{Sarjana Ilmu Komputer (S.Kom)} --- Universitas Indonesia (IPK: 3.92 / 4.00)
\\end{itemize}

\\end{document}
`,
  },
];
