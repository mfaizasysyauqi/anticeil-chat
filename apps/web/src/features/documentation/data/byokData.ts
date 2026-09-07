import { DocCategory } from '../types';

export const byokCategory: DocCategory = {
  id: 'byok-guide',
  titleId: 'Panduan Bring Your Own Key (BYOK)',
  titleEn: 'Bring Your Own Key (BYOK)',
  icon: 'KeyRound',
  sections: [
    {
      id: 'what-is-byok',
      titleId: 'Keuntungan Menggunakan Kunci Sendiri',
      titleEn: 'Benefits of Bring Your Own Key',
      icon: 'Shield',
      badge: 'Rp 0 Anticeil Cost',
      summaryId: 'Gunakan kunci API developer resmi dari provider favorit Anda dengan bebas biaya perantara.',
      summaryEn: 'Connect official developer API keys directly from your favorite providers with zero middleman markup.',
      contentId: `
### Keuntungan Menggunakan BYOK di Anticeil

**BYOK (Bring Your Own Key)** memungkinkan Anda menghubungkan API Key langsung dari provider AI (seperti OpenRouter, Google AI Studio, DeepSeek, Groq Cloud, OpenAI, atau Anthropic):

1. **Biaya Anticeil = Rp 0**: Semua konsumsi chat, eksekusi kode, dan reasoning tidak memotong kredit Anticeil Anda sama sekali.
2. **Tarif Grosir Asli Provider**: Anda hanya membayar tarif API langsung ke penyedia resmi (misal: Gemini 2.0 Flash di Google AI Studio memiliki kuota gratis yang sangat melimpah).
3. **Kecepatan & Rate Limit Tertinggi**: Anda menggunakan kuota tier developer akun Anda sendiri tanpa antrean bersama pengguna lain.
4. **100% Client-Side Enkripsi**: Kunci API Anda dienkripsi dengan standar industri (AES-256) dan hanya tersimpan di memori browser perangkat Anda.
`,
      contentEn: `
### Advantages of BYOK in Anticeil

**BYOK (Bring Your Own Key)** allows you to plug your official developer API keys (OpenRouter, Google AI Studio, DeepSeek, Groq Cloud, OpenAI, Anthropic) directly:

1. **Zero Anticeil Fees**: All chats, code executions, and reasoning runs consume 0 Anticeil credits.
2. **Direct Provider Pricing**: Pay pure wholesale API rates (e.g. Gemini 2.0 Flash offers massive free tiers in Google AI Studio).
3. **Dedicated Rate Limits**: Benefit from your developer account quotas without shared queue delays.
4. **Client-Side Encryption**: Encrypted locally with AES-256 standard and stored only on your machine.
`,
    },
    {
      id: 'getting-api-keys',
      titleId: 'Langkah Mendapatkan Kunci API Resmi',
      titleEn: 'Step-by-Step API Key Setup',
      icon: 'FileCode',
      summaryId: 'Panduan step-by-step mendapatkan API Key dari OpenRouter, Google, DeepSeek, dan Groq.',
      summaryEn: 'Step-by-step instructions for obtaining keys from OpenRouter, Google, DeepSeek, and Groq.',
      contentId: `
### 1. OpenRouter (Rekomendasi Utama — 1 Kunci untuk Semua Model)
1. Buka situs [openrouter.ai](https://openrouter.ai).
2. Masuk / Daftar akun.
3. Buka menu **Keys** -> Klik **Create Key**.
4. Salin kunci yang diawali \`sk-or-v1-...\`.
5. Di Anticeil, buka **Pengaturan** (ikon gerigi) -> Tab **Kunci API (BYOK)** -> Tempelkan pada kolom **OpenRouter Key**.

---

### 2. Google AI Studio (Gratis untuk Gemini 2.0 Flash & Pro)
1. Buka [aistudio.google.com](https://aistudio.google.com).
2. Login dengan akun Google Anda.
3. Klik tombol **Get API Key** di sidebar kiri.
4. Klik **Create API Key in new project**.
5. Salin kunci dan tempelkan ke kolom **Google Gemini Key** di Anticeil.

---

### 3. DeepSeek Platform (Sangat Hemat untuk R1 & V3)
1. Buka [platform.deepseek.com](https://platform.deepseek.com).
2. Daftar dan lakukan verifikasi akun.
3. Buka menu **API Keys** -> Klik **Create API Key**.
4. Salin kunci dan tempelkan ke kolom **DeepSeek Key** di Anticeil.

---

### 4. Groq Cloud (Ultra Cepat / Low-Latency Inference)
1. Buka [console.groq.com](https://console.groq.com).
2. Masuk dan buka tab **API Keys**.
3. Klik **Create API Key**, beri nama, lalu salin kunci \`gsk_...\`.
4. Tempelkan ke kolom **Groq Key** di Anticeil.
`,
      contentEn: `
### 1. OpenRouter (Top Recommendation — One Key for All Models)
1. Visit [openrouter.ai](https://openrouter.ai).
2. Sign in or register.
3. Go to **Keys** -> Click **Create Key**.
4. Copy the key starting with \`sk-or-v1-...\`.
5. In Anticeil, open **Settings** (gear icon) -> **API Keys (BYOK)** tab -> Paste into **OpenRouter Key**.

---

### 2. Google AI Studio (Free Tier for Gemini 2.0 Flash & Pro)
1. Visit [aistudio.google.com](https://aistudio.google.com).
2. Sign in with your Google account.
3. Click **Get API Key** in the sidebar.
4. Select **Create API Key in new project**.
5. Copy and paste into the **Google Gemini Key** field in Anticeil.

---

### 3. DeepSeek Platform (High Performance R1 & V3)
1. Visit [platform.deepseek.com](https://platform.deepseek.com).
2. Sign in and open **API Keys** menu.
3. Click **Create API Key**, copy it, and paste into **DeepSeek Key** in Anticeil.

---

### 4. Groq Cloud (Ultra Low-Latency Inference)
1. Visit [console.groq.com](https://console.groq.com).
2. Sign in and navigate to **API Keys**.
3. Generate a key starting with \`gsk_...\` and paste it into **Groq Key** in Anticeil.
`,
    },
  ],
};
