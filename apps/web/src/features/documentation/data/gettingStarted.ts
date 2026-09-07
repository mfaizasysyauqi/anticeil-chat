import { DocCategory } from '../types';

export const gettingStartedCategory: DocCategory = {
  id: 'getting-started',
  titleId: 'Pengenalan & Memulai',
  titleEn: 'Getting Started',
  icon: 'Rocket',
  collapsible: true,
  sections: [
    {
      id: 'overview',
      titleId: 'Apa itu Anticeil?',
      titleEn: 'What is Anticeil?',
      icon: 'Sparkles',
      badge: 'v2.5',
      summaryId: 'Platform AI Work Operating System all-in-one dengan arsitektur client-side first, multi-model AI, dan zero vendor lock-in.',
      summaryEn: 'All-in-one AI Work Operating System with client-side first architecture, multi-model AI, and zero vendor lock-in.',
      contentId: `
### Selamat Datang di Anticeil

**Anticeil** adalah *AI Work Operating System* modern yang menyatukan seluruh kebutuhan produktivitas cerdas dalam satu workspace terpadu:
- **Chat Studio**: Berinteraksi dengan puluhan model AI mutakhir (Claude 3.7 Sonnet, DeepSeek R1/V3, GPT-4o, Gemini 2.0 Flash, Llama 3.3).
- **Docs Studio**: Editor dokumen teknis, riset ilmiah (LaTeX & Overleaf Multi-File), presentasi slide, dan spreadsheet cerdas (**AntSheet**).
- **Media Studio (Imagine)**: Generator gambar, video, dan musik AI dengan sistem galeri terorganisir.
- **Connectors**: Terhubung langsung ke Google Drive, Notion, GitHub, dan Gmail.

---

### Filosofi Inti: Zero-Overhead & Local-First

1. **Privasi Maksimal**: Kunci API Anda disimpan di browser lokal (AES-256-GCM). Pesan chat mengalir langsung dari perangkat Anda ke endpoint AI tanpa perantara server pihak ketiga.
2. **Tanpa Langganan Paksaan**: Gunakan Anticeil secara **100% Gratis** menggunakan kuota harian atau kunci API sendiri (**BYOK**).
3. **Penyimpanan Fleksibel**: Nikmati penyimpanan lokal tanpa batas di browser, atau sinkronkan data ke Cloud Database (Supabase) dan R2 Storage jika berlangganan paket Cloud.
`,
      contentEn: `
### Welcome to Anticeil

**Anticeil** is a modern *AI Work Operating System* uniting all intelligent productivity workflows inside one cohesive interface:
- **Chat Studio**: Interact with top-tier AI models (Claude 3.7 Sonnet, DeepSeek R1/V3, GPT-4o, Gemini 2.0 Flash, Llama 3.3).
- **Docs Studio**: Technical doc authoring, research papers (LaTeX & Overleaf Multi-File), slides, and intelligent spreadsheets (**AntSheet**).
- **Media Studio (Imagine)**: AI image, video, and audio generation with curated collections.
- **Connectors**: Direct client-side connection to Google Drive, Notion, GitHub, and Gmail.

---

### Core Philosophy: Zero-Overhead & Local-First

1. **Maximum Privacy**: Your API keys are encrypted client-side in local browser storage (AES-256-GCM). Chat messages stream directly from your device to AI endpoints.
2. **No Forced Subscriptions**: Use Anticeil completely **Free** using daily credits or Bring Your Own Key (**BYOK**).
3. **Flexible Storage**: Enjoy unlimited local browser storage, or effortlessly sync to Supabase & Cloudflare R2 when upgraded.
`,
    },
    {
      id: 'tier-comparison',
      titleId: 'Paket & Perbandingan Akun',
      titleEn: 'Plans & Tier Comparison',
      icon: 'Crown',
      summaryId: 'Pelajari perbedaan antara paket Free Community, Starter, Pro, dan Enterprise.',
      summaryEn: 'Understand the differences between Free Community, Starter, Pro, and Enterprise tiers.',
      contentId: `
### Perbandingan Paket Akun Anticeil

| Fitur / Layanan | Free Community | Starter Tier | Pro Tier | Enterprise / BYOD |
| :--- | :--- | :--- | :--- | :--- |
| **Harga** | **Gratis $0** | **Rp 49.000 / bln** | **Rp 149.000 / bln** | **Kustom / Kontak** |
| **Kredit AI Harian** | 50 Kredit / hari | 150 Kredit / hari | 500 Kredit / hari | Unlimited BYOK |
| **BYOK (Kunci Sendiri)** | ✅ Gratis Unlimited | ✅ Gratis Unlimited | ✅ Gratis Unlimited | ✅ Multi-Org Vault |
| **Penyimpanan Data** | Browser Lokal (Unlimited) | 5 GB Cloud Supabase | 10 GB Cloud R2 | 100 GB+ Custom BYOD |
| **Batas Ukuran File** | 10 MB / file | 50 MB / file | 250 MB / file | 1 GB / file |
| **Sinkronisasi Multi-Device** | Manual Export/Import | ✅ Otomatis Cloud Sync | ✅ Otomatis Cloud Sync | ✅ Cloud & On-Prem |
| **Docs & LaTeX Studio** | ✅ Lengkap | ✅ Lengkap + History | ✅ Lengkap + Versioning | ✅ Custom Branding |
| **AntSheet Formula AI** | ✅ Termasuk | ✅ Termasuk | ✅ Termasuk | ✅ Custom Integrations |

---

### Cara Upgrade atau Ganti Paket

1. Klik foto profil atau nama Anda di **Profile Bar** (pojok kiri bawah).
2. Pilih menu **Pricing & Plans**.
3. Masuk ke tab **Paket & Storage**.
4. Pilih paket yang Anda inginkan (Starter, Pro, atau Enterprise).
5. Klik **Upgrade** atau **Pilih Paket**.
6. Selesaikan pembayaran menggunakan metode pilihan Anda (QRIS, GoPay, atau Virtual Account).
7. Paket Anda akan aktif seketika setelah pembayaran terverifikasi.

> **Catatan**: Jika Anda ingin kembali ke paket Free, cukup pilih **Free Community** dan klik **Downgrade**. Fitur berbayar akan dinonaktifkan, namun data Anda tetap aman.
`,
      contentEn: `
### Anticeil Tier Comparison

| Feature / Service | Free Community | Starter Tier | Pro Tier | Enterprise / BYOD |
| :--- | :--- | :--- | :--- | :--- |
| **Pricing** | **Free $0** | **$3.50 / mo** | **$9.99 / mo** | **Custom Contact** |
| **Daily AI Credits** | 50 Credits / day | 150 Credits / day | 500 Credits / day | Unlimited BYOK |
| **BYOK (Custom Keys)** | ✅ Free Unlimited | ✅ Free Unlimited | ✅ Free Unlimited | ✅ Multi-Org Vault |
| **Storage Architecture** | Local Browser (Unlimited) | 5 GB Cloud Supabase | 10 GB Cloud R2 | 100 GB+ Custom BYOD |
| **Max File Upload Size** | 10 MB / file | 50 MB / file | 250 MB / file | 1 GB / file |
| **Multi-Device Sync** | Manual Export/Import | ✅ Auto Cloud Sync | ✅ Auto Cloud Sync | ✅ Cloud & On-Prem |
| **Docs & LaTeX Studio** | ✅ Full Access | ✅ Full + History | ✅ Full + Versioning | ✅ Custom Branding |
| **AntSheet Formula AI** | ✅ Included | ✅ Included | ✅ Included | ✅ Custom Integrations |

---

### How to Upgrade or Change Plans

1. Click your profile picture or name in the **Profile Bar** (bottom-left corner).
2. Select **Pricing & Plans** from the menu.
3. Navigate to the **Plans & Storage** tab.
4. Choose your desired plan (Starter, Pro, or Enterprise).
5. Click **Upgrade** or **Select Plan**.
6. Complete the payment using your preferred method (QRIS, GoPay, or Virtual Account).
7. Your new plan will be activated instantly once the payment is verified.

> **Note**: To return to the Free tier, simply select **Free Community** and click **Downgrade**. Paid features will be disabled, but your local data remains safe.
`,
    },
  ],
};
