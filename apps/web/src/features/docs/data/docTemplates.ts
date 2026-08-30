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
    description: 'Format standar paper ilmiah dengan rumus KaTeX, abstrak, tabel, dan sitasi BibTeX.',
    icon: 'GraduationCap',
    content: `# Optimasi Model Jaringan Saraf Konvolusional Menggunakan Algoritma Genetika

**Penulis:** Muhammad Faiza Asysyauqi, Dr. Ir. H. Ahmad Dahlan  
**Afiliasi:** Departemen Ilmu Komputer & Kecerdasan Buatan  
**Tanggal:** Maret 2026  

---

### Abstrak
*Penelitian ini menyajikan pendekatan hibrida baru untuk optimasi hiperparameter pada Deep Convolutional Neural Networks (CNN) menggunakan algoritma genetika adaptif. Hasil eksperimen menunjukkan peningkatan akurasi sebesar $4.82\\%$ dengan pengurangan waktu inferensi sebesar $23.5\\%$.*

---

## 1. Pendahuluan
Dalam beberapa tahun terakhir, arsitektur *deep learning* telah merevolusi bidang visi komputer. Namun, penentuan hiperparameter optimal tetap menjadi tantangan komputasi non-trivial:

$$\\min_{\\theta \\in \\Theta} \\mathcal{L}(\\theta; \\mathcal{D}_{\\text{val}}) = \\frac{1}{N} \\sum_{i=1}^N \\ell(f(x_i; \\theta), y_i)$$

di mana $\\Theta$ adalah ruang pencarian hiperparameter dan $\\mathcal{L}$ adalah fungsi *loss cross-entropy*.

---

## 2. Formulasi Matematis & Teori

### 2.1 Fungsi Aktivasi Adaptif
Kami mendefinisikan fungsi aktivasi termodifikasi $\\psi(x)$ sebagai berikut:

$$\\psi(x) = \\sigma(\\alpha x) \\cdot \\tanh(\\beta x) + \\gamma x$$

dengan gradien turunan terhadap input:

$$\\frac{\\partial \\psi}{\\partial x} = \\alpha \\sigma(\\alpha x)(1 - \\sigma(\\alpha x))\\tanh(\\beta x) + \\beta \\sigma(\\alpha x)(1 - \\tanh^2(\\beta x)) + \\gamma$$

### 2.2 Konvergensi Algoritma
Tingkat konvergensi dijamin melalui ketaksamaan Cauchy-Schwarz pada ruang Hilbert $L^2(\\Omega)$:

$$\\left| \\int_{\\Omega} f(x)g(x) dx \\right|^2 \\le \\left( \\int_{\\Omega} |f(x)|^2 dx \\right) \\left( \\int_{\\Omega} |g(x)|^2 dx \\right)$$

---

## 3. Hasil Eksperimen

| Model Arsitektur | Top-1 Accuracy (%) | Latency (ms) | FLOPs (G) | Parameter (M) |
| :--- | :--- | :--- | :--- | :--- |
| **ResNet-50 (Baseline)** | 76.12 | 14.2 | 4.12 | 25.6 |
| **EfficientNet-B2** | 79.80 | 18.5 | 1.05 | 9.2 |
| **Metode Usulan (Ours)** | **84.62** | **10.9** | **0.88** | **7.4** |

---

## 4. Kesimpulan
Metode yang diusulkan berhasil membuktikan efektivitas pencarian arsitektur terpandu dengan penalti komputasi minimal.

---

### Referensi (BibTeX)
1. **LeCun, Y., Bengio, Y., & Hinton, G.** (2015). *Deep learning*. Nature, 521(7553), 436-444.
2. **Vaswani, A., et al.** (2017). *Attention is all you need*. Advances in Neural Information Processing Systems, 30.
3. **Goodfellow, I., et al.** (2016). *Deep Learning*. MIT Press.
`,
  },
  {
    id: 'technical-rfc',
    title: 'Technical Specification & RFC',
    category: 'technical',
    description: 'Spesifikasi arsitektur sistem dengan alur Mermaid, endpoint REST, dan matrix keamanan.',
    icon: 'Cpu',
    content: `# RFC 042: High-Throughput Token Streaming & Client-Side Encryption Gateway

* **Status:** PROPOSED
* **Author:** Anticeil Core Architecture Team
* **Created:** 2026-03-30
* **Target Release:** v2.4.0

---

## 1. Executive Summary
Dokumen ini menguraikan arsitektur *Zero-Proxy Token Gateway* yang menghubungkan antarmuka web client langsung ke provider AI (*OpenAI, Anthropic, Google, Ollama, DeepSeek*) dengan enkripsi AES-GCM 256-bit di sisi browser.

---

## 2. System Architecture Workflow

\`\`\`mermaid
graph TD
    Client([Browser Client]) -->|1. AES-256 Encrypted Vault| LocalStore[(Local IndexedDB)]
    Client -->|2. Direct BYOK Request| Provider{Multi-Model Gateway}
    
    Provider -->|SSE Stream| OpenAI[OpenAI Direct API]
    Provider -->|SSE Stream| Claude[Anthropic Direct API]
    Provider -->|SSE Stream| Gemini[Google AI Studio]
    Provider -->|Local IPC| Ollama[Local Ollama Engine]
    
    OpenAI -->|Chunknized Buffering| Parser[Stream Parser Engine]
    Claude -->|Chunknized Buffering| Parser
    Gemini -->|Chunknized Buffering| Parser
    Ollama -->|Chunknized Buffering| Parser
    
    Parser -->|60fps UI Dispatch| View([Live Canvas Renderer])
\`\`\`

---

## 3. Performance & Latency SLA

* **Time to First Token (TTFT):** $\\le 120\\text{ ms}$
* **Throughput Target:** $\\ge 150\\text{ tokens/s}$
* **Client Memory Ceiling:** $\\le 45\\text{ MB}$ footprint

$$\\text{Total Latency} = T_{\\text{DNS}} + T_{\\text{TLS}} + T_{\\text{TTFT}} + \\sum_{k=1}^M \\frac{\\text{Tokens}_k}{\\text{Speed}}$$
`,
  },
  {
    id: 'math-physics-notes',
    title: 'Math & Quantum Physics Notes',
    category: 'notes',
    description: 'Catatan kuliah matematika & fisika kuantum dengan persamaan matriks dan integral ganda.',
    icon: 'Sigma',
    content: `# Catatan Teori Kuantum: Persamaan Schrödinger & Mekanika Matriks

## 1. Persamaan Schrödinger Bergantung Waktu
Persamaan fundamental dinamika keadaan kuantum $|\\psi(t)\\rangle$:

$$i\\hbar \\frac{\\partial}{\\partial t} \\Psi(\\mathbf{r}, t) = \\left[ -\\frac{\\hbar^2}{2m} \\nabla^2 + V(\\mathbf{r}, t) \\right] \\Psi(\\mathbf{r}, t)$$

di mana Hamiltonian $\\hat{H}$ didefinisikan sebagai operator energi total:

$$\\hat{H} = \\frac{\\hat{\\mathbf{p}}^2}{2m} + \\hat{V}(\\mathbf{r})$$

---

## 2. Matriks Pauli & Spin-$\\frac{1}{2}$
Operator spin elektron memenuhi aljabar Lie $\\mathfrak{su}(2)$:

$$\\sigma_x = \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}, \\quad \\sigma_y = \\begin{pmatrix} 0 & -i \\\\ i & 0 \\end{pmatrix}, \\quad \\sigma_z = \\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}$$

Komutator antar operator:

$$[\\sigma_a, \\sigma_b] = 2i \\sum_{c} \\epsilon_{abc} \\sigma_c$$

---

## 3. Transformasi Fourier pada Fungsi Gelombang

$$\\Phi(p) = \\frac{1}{\\sqrt{2\\pi \\hbar}} \\int_{-\\infty}^{\\infty} \\Psi(x) e^{-i px / \\hbar} dx$$

Prinsip Ketidakpastian Heisenberg:

$$\\Delta x \\cdot \\Delta p \\ge \\frac{\\hbar}{2}$$
`,
  },
  {
    id: 'academic-cv',
    title: 'Academic & Executive Curriculum Vitae',
    category: 'business',
    description: 'Template CV akademik / profesional berstandar internasional dengan tata letak bersih.',
    icon: 'FileText',
    content: `# Muhammad Faiza Asysyauqi
**Senior AI Systems Architect & Software Engineer**  
📧 faiza@anticeil.com | 🌐 [anticeil.com](https://anticeil.com) | 📍 Jakarta, Indonesia  

---

## 🎯 Ringkasan Eksekutif
*Software Engineer dengan spesialisasi dalam arsitektur AI terdesentralisasi, model inference streaming, dan performa tinggi pada aplikasi web modern. Berpengalaman memimpin tim engineering skala regional.*

---

## 💼 Pengalaman Profesional

### Lead AI Engineer — Anticeil Labs *(2024 – Sekarang)*
* Merancang sistem **Zero-Proxy BYOK Architecture** yang memproses 1.2M+ token streaming harian dengan latensi $<100\\text{ms}$.
* Membangun editor dokumen interaktif **Agentic Docs** dengan rendering KaTeX real-time 60fps.

### Senior Frontend Architect — Cloud Enterprise *(2022 – 2024)*
* Memodernisasi monorepo Next.js + React 19 untuk 50,000+ pengguna aktif bulanan.
* Mengurangi bundle size sebesar $42\\%$ dan meningkatkan Web Vitals Core Score menjadi $99/100$.

---

## 🎓 Pendidikan
* **Sarjana Ilmu Komputer (S.Kom)** — Universitas Indonesia *(IPK: 3.92 / 4.00)*

---

## 🛠️ Keahlian Teknis
* **Languages:** TypeScript, Rust, Python, Go, SQL, LaTeX
* **Frameworks:** Next.js 15, React 19, Tailwind CSS, GSAP, WebSockets
* **AI / ML:** OpenAI API, Anthropic SDK, Google AI Studio, Ollama, LangChain, Transformers
`,
  },
];
