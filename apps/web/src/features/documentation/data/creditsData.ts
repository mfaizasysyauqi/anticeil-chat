import { DocCategory } from '../types';

export const creditsCategory: DocCategory = {
  id: 'credits-system',
  titleId: 'Sistem Kredit & Model AI',
  titleEn: 'Credits & AI Model Tiers',
  icon: 'Zap',
  sections: [
    {
      id: 'how-credits-work',
      titleId: 'Cara Kerja Kredit AI & Multiplier',
      titleEn: 'How AI Credits & Multipliers Work',
      icon: 'Coins',
      badge: 'Smart Soft-Cap',
      summaryId: 'Struktur pemotongan kredit harian vs kredit top-up permanen yang tidak pernah hangus.',
      summaryEn: 'Breakdown of daily replenishable credits vs non-expiring permanent top-up credits.',
      contentId: `
### Dua Jenis Saldo Kredit di Anticeil

1. **Kredit Harian (Daily Credits)**:
   - Diberikan otomatis setiap hari (50 kredit untuk Free tier).
   - Direset kembali setiap 24 jam.
   - Ideal untuk percakapan harian, coding cepat, dan riset ringan.
2. **Kredit Top-Up (Paid Credits)**:
   - Diperoleh dari pembelian paket kredit (misal 500, 1.500, atau 5.000 kredit).
   - **TIDAK PERNAH HANGUS (Non-Expiring)**. Saldo akan tersimpan selamanya sampai Anda menggunakannya.
   - Sistem akan otomatis menghabiskan kuota kredit harian terlebih dahulu sebelum memotong saldo kredit top-up Anda.

---

### Cara Top-Up Kredit AI

Jika kuota harian Anda habis atau Anda membutuhkan lebih banyak komputasi untuk model Flagship, Anda bisa menambah kredit kapan saja:
1. Klik meteran kredit di pojok kiri bawah (**Bottom Rail**) atau buka menu profil dan pilih **Pricing & Plans**.
2. Masuk ke tab **Top-up Kredit**.
3. Pilih paket yang sesuai:
   - **500 Kredit** (~500 Chat Standar / ~100 Gambar)
   - **1.500 Kredit** (Paling Populer)
   - **5.000 Kredit** (Power User & Developer)
4. Klik **Top-up Sekarang**. Anda akan diarahkan ke pop-up pembayaran **Midtrans**.
5. Pilih metode pembayaran yang diinginkan (QRIS, GoPay, ShopeePay, atau Bank Transfer/Virtual Account).
6. Selesaikan transaksi. Saldo Anda akan bertambah secara instan tanpa perlu memuat ulang (refresh) halaman.

---

### Sistem Multiplier Berdasarkan Model AI

Setiap model AI memiliki bobot kredit berbeda tergantung pada spesifikasi komputasinya:

- **Tier 1 (Ekonomis & Cepat) — 1 Kredit / Request**:
  - \`Google Gemini 2.0 Flash\`
  - \`DeepSeek-V3\`
  - \`Meta Llama 3.3 70B\`
  - \`Qwen 2.5 72B\`
  - \`Mistral Nemo\`

- **Tier 2 (Reasoning & Deep Thinking) — 3 Kredit / Request**:
  - \`DeepSeek-R1\` (Full CoT Reasoning)
  - \`Google Gemini 2.5 Pro\`
  - \`Qwen 2.5 Coder 32B\`
  - \`Claude 3.5 Haiku\`

- **Tier 3 (Flagship Premium) — 8 Kredit / Request**:
  - \`Anthropic Claude 3.7 Sonnet\`
  - \`Anthropic Claude 3.5 Sonnet\`
  - \`OpenAI GPT-4o\`
  - \`OpenAI o1 / o3-mini\`

---

### Smart Context Soft-Cap (Proteksi Dokumen Panjang)

Untuk menjaga ekosistem tetap sehat dan adil:
- Setiap prompt standar dengan konteks dokumen **hingga 4.000 token (~16.000 karakter)** dikenakan tarif dasar model di atas.
- Jika Anda mengunggah dokumen tebal (PDF/buku) atau konteks percakapan melebihi 4.000 token, sistem menambahkan **+1 kredit per 4.000 token ekstra**.
- **Pengguna BYOK (Custom API Key)**: Dikenakan **0 Kredit Anticeil** berapa pun panjang konteks yang dikirimkan.
`,
      contentEn: `
### Two Types of Credit Balances in Anticeil

1. **Daily Credits**:
   - Refreshed automatically every 24 hours (50 credits/day on Free tier).
   - Ideal for daily interactions, rapid coding, and quick research.
2. **Top-Up Credits (Paid Credits)**:
   - Purchased via one-off top-up packages (e.g., 500, 1,500, or 5,000 credits).
   - **NEVER EXPIRE (Non-Expiring)**. Your balance stays active indefinitely until consumed.
   - The engine automatically exhausts daily quota first before touching your permanent balance.

---

### How to Top-up AI Credits

If you've hit your daily limit or need more compute for Flagship models, you can top-up your credits anytime:
1. Click the credit meter in the bottom-left corner (**Bottom Rail**) or open the profile menu and select **Pricing & Plans**.
2. Navigate to the **Top-up Credits** tab.
3. Choose your desired package:
   - **500 Credits** (~500 Standard Chats / ~100 Images)
   - **1,500 Credits** (Most Popular)
   - **5,000 Credits** (Power User & Developer)
4. Click **Top-up Now**. A **Midtrans** payment popup will appear.
5. Select your preferred payment method (QRIS, E-Wallets like GoPay/ShopeePay, or Virtual Accounts).
6. Complete the transaction. Your balance updates instantly without needing a page refresh.

---

### Tiered Model Multipliers

AI models carry weighted credit costs matching their underlying compute:

- **Tier 1 (Economy & Fast) — 1 Credit / Request**:
  - \`Google Gemini 2.0 Flash\`
  - \`DeepSeek-V3\`
  - \`Meta Llama 3.3 70B\`
  - \`Qwen 2.5 72B\`
  - \`Mistral Nemo\`

- **Tier 2 (Reasoning & Deep Thinking) — 3 Credits / Request**:
  - \`DeepSeek-R1\` (Full CoT Reasoning)
  - \`Google Gemini 2.5 Pro\`
  - \`Qwen 2.5 Coder 32B\`
  - \`Claude 3.5 Haiku\`

- **Tier 3 (Flagship Premium) — 8 Credits / Request**:
  - \`Anthropic Claude 3.7 Sonnet\`
  - \`Anthropic Claude 3.5 Sonnet\`
  - \`OpenAI GPT-4o\`
  - \`OpenAI o1 / o3-mini\`

---

### Smart Context Soft-Cap

To ensure sustainability and fair usage:
- Standard prompts with context **up to 4,000 tokens (~16,000 characters)** consume the baseline model multiplier.
- Context exceeding 4,000 tokens carries an adaptive surcharge of **+1 credit per 4,000 extra tokens**.
- **BYOK Users**: Incur **0 Anticeil Credits** regardless of token size.
`,
    },
  ],
};
