export interface DocTemplate {
  id: string;
  title: string;
  category: 'academic' | 'technical' | 'notes' | 'business';
  description: string;
  icon: string;
  content: string;
}

export const DOC_TEMPLATES: DocTemplate[] = [
  {
    id: 'academic-paper',
    title: 'Academic Research Paper',
    category: 'academic',
    description: 'Format standar paper ilmiah IEEE dengan abstrak, persamaan matematika, tabel perbandingan, dan sitasi.',
    icon: 'GraduationCap',
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

\\section{Pendahuluan}
\\IEEEPARstart{D}{alam} beberapa tahun terakhir, arsitektur \\textit{deep learning} telah merevolusi bidang visi komputer. Namun, penentuan hiperparameter optimal tetap menjadi tantangan komputasi non-trivial:

\\begin{equation}
\\min_{\\theta \\in \\Theta} \\mathcal{L}(\\theta; \\mathcal{D}_{\\text{val}}) = \\frac{1}{N} \\sum_{i=1}^N \\ell(f(x_i; \\theta), y_i)
\\end{equation}

di mana $\\Theta$ adalah ruang pencarian hiperparameter dan $\\mathcal{L}$ adalah fungsi \\textit{loss cross-entropy}.

\\section{Formulasi Matematis \\& Teori}
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

\\section{Hasil Eksperimen}
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

\\section{Kesimpulan}
Metode yang diusulkan berhasil membuktikan efektivitas pencarian arsitektur terpandu dengan penalti komputasi minimal.

\\begin{thebibliography}{10}
\\bibitem{lecun2015} Y. LeCun, Y. Bengio, and G. Hinton, \`\`Deep learning,'''' \\textit{Nature}, vol. 521, no. 7553, pp. 436--444, 2015.
\\bibitem{vaswani2017} A. Vaswani \\textit{et al.}, \`\`Attention is all you need,'''' in \\textit{Advances in Neural Information Processing Systems}, vol. 30, 2017.
\\bibitem{goodfellow2016} I. Goodfellow, Y. Bengio, and A. Courville, \\textit{Deep Learning}. MIT Press, 2016.
\\end{thebibliography}

\\end{document}
`,
  },
  {
    id: 'technical-rfc',
    title: 'Technical Specification & RFC',
    category: 'technical',
    description: 'Spesifikasi arsitektur sistem dan RFC teknis berstandar IETF/ACM dalam format LaTeX murni.',
    icon: 'Cpu',
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

\\section{Status Dokumen}
\\textbf{Status:} PROPOSED \\\\
\\textbf{Target Rilis:} v2.4.0 \\\\
\\textbf{Kategori:} Standard Track Architecture

\\section{Ringkasan Eksekutif}
Sistem gerbang token menyediakan saluran streaming \\textit{Server-Sent Events (SSE)} berkecepatan tinggi dengan overhead serialisasi di bawah 5 milidetik.

\\section{Spesifikasi Kinerja \\& SLA}
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

\\section{Matrix Keamanan}
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

\\end{document}
`,
  },
  {
    id: 'math-physics-notes',
    title: 'Math & Quantum Physics Notes',
    category: 'notes',
    description: 'Catatan kuliah matematika & fisika kuantum dengan persamaan Schrödinger, matriks Pauli, dan integral Fourier.',
    icon: 'Sigma',
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

Komutator antar operator spin:

\\begin{equation}
[\\sigma_a, \\sigma_b] = 2i \\sum_{c} \\epsilon_{abc} \\sigma_c
\\end{equation}

\\section{Transformasi Fourier pada Fungsi Gelombang}
Representasi ruang momentum fungsi gelombang $\\Phi(p)$:

\\begin{equation}
\\Phi(p) = \\frac{1}{\\sqrt{2\\pi \\hbar}} \\int_{-\\infty}^{\\infty} \\Psi(x) e^{-i px / \\hbar} \\, dx
\\end{equation}

Prinsip Ketidakpastian Heisenberg:

\\begin{equation}
\\Delta x \\cdot \\Delta p \\ge \\frac{\\hbar}{2}
\\end{equation}

\\end{document}
`,
  },
  {
    id: 'academic-cv',
    title: 'Academic & Executive Curriculum Vitae',
    category: 'business',
    description: 'Template CV akademik / profesional berstandar internasional dengan tata letak bersih berformat LaTeX.',
    icon: 'FileText',
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
Software Engineer dengan spesialisasi dalam arsitektur AI terdesentralisasi, model inference streaming, dan performa tinggi pada aplikasi web modern. Berpengalaman memimpin tim engineering skala regional.

\\section{Pengalaman Profesional}

\\subsection{Lead AI Engineer --- Anticeil Labs (2024 -- Sekarang)}
\\begin{itemize}
\\item Merancang sistem \\textbf{Zero-Proxy BYOK Architecture} yang memproses 1.2M+ token streaming harian dengan latensi $<100\\text{ ms}$.
\\item Membangun editor dokumen interaktif \\textbf{Agentic Docs} dengan rendering KaTeX real-time 60fps.
\\end{itemize}

\\subsection{Senior Frontend Architect --- Cloud Enterprise (2022 -- 2024)}
\\begin{itemize}
\\item Memodernisasi monorepo Next.js + React 19 untuk 50,000+ pengguna aktif bulanan.
\\item Mengurangi bundle size sebesar 42\\% dan meningkatkan Web Vitals Core Score menjadi 99/100.
\\end{itemize}

\\section{Pendidikan}
\\begin{itemize}
\\item \\textbf{Sarjana Ilmu Komputer (S.Kom)} --- Universitas Indonesia (IPK: 3.92 / 4.00)
\\end{itemize}

\\section{Keahlian Teknis}
\\begin{itemize}
\\item \\textbf{Bahasa:} TypeScript, Rust, Python, Go, SQL, LaTeX
\\item \\textbf{Frameworks:} Next.js 15, React 19, Tailwind CSS, GSAP, WebSockets
\\item \\textbf{AI / ML:} OpenAI API, Anthropic SDK, Google AI Studio, Ollama, LangChain
\\end{itemize}

\\end{document}
`,
  },
];
