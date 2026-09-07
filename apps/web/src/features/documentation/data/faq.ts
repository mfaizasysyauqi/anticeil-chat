import { DocCategory } from '../types';

export const faqCategory: DocCategory = {
  id: 'faq-section',
  titleId: 'Pertanyaan Umum (FAQ)',
  titleEn: 'Frequently Asked Questions (FAQ)',
  icon: 'HelpCircle',
  sections: [
    {
      id: 'faq-list',
      titleId: 'Tanya Jawab Populer',
      titleEn: 'Popular Questions & Answers',
      icon: 'MessageCircle',
      summaryId: 'Jawaban atas pertanyaan yang paling sering diajukan seputar akun, privasi, batas upload berkas, dan kredit.',
      summaryEn: 'Answers to the most common questions regarding accounts, privacy, file upload limits, and credits.',
      contentId: `
### FAQ — Pertanyaan yang Sering Diajukan

#### Q: Apakah Anticeil melatih model AI menggunakan data saya?
**A:** **Sama sekali TIDAK.** Anticeil beroperasi dengan koneksi API langsung (*zero-data retention*). Provider AI terkemuka seperti OpenAI, Anthropic, DeepSeek, dan Google memiliki kebijakan resmi bahwa data yang dikirim melalui jalur API resmi tidak digunakan untuk melatih model publik mereka.

---

#### Q: Apakah saldo kredit top-up memiliki masa kadaluarsa?
**A:** **Tidak.** Saldo kredit top-up (Paid Credits) berlaku selamanya (*lifetime non-expiring*). Saldo tersebut hanya akan berkurang saat Anda menggunakannya.

---

#### Q: Berapa banyak berkas yang bisa saya unggah dalam satu chat?
**A:** Anda dapat mengunggah hingga **5 berkas sekaligus** per pesan chat. Format yang didukung meliputi PDF, TXT, DOCX, XLSX, CSV, gambar (PNG, JPG, WEBP), dan berkas source code. Batas ukuran per berkas adalah 10MB (Free), 50MB (Starter), 250MB (Pro), hingga 1GB (Enterprise).

---

#### Q: Bagaimana keamanan transaksi pembayaran di Anticeil?
**A:** Semua transaksi diproses secara aman melalui **Midtrans** (bagian dari GoTo Group), payment gateway berlisensi resmi di Indonesia. Anticeil tidak pernah menyimpan informasi kartu kredit atau detail pembayaran sensitif Anda.

---

#### Q: Bagaimana jika saya ingin berpindah perangkat pada Free tier?
**A:** Anda dapat menggunakan fitur **Ekspor Data** di menu Pengaturan untuk mengunduh berkas cadangan JSON, lalu memilih **Impor Data** di perangkat baru Anda. Jika ingin sinkronisasi otomatis tanpa ekspor manual, Anda dapat berlangganan paket Starter atau Pro.
`,
      contentEn: `
### FAQ — Frequently Asked Questions

#### Q: Does Anticeil train AI models on my personal data?
**A:** **Absolutely NOT.** Anticeil interacts via direct official API streams. Tier-1 providers (OpenAI, Anthropic, DeepSeek, Google) adhere to strict zero-data retention policies where API payload data is never used to train public foundation models.

---

#### Q: Do purchased top-up credits expire?
**A:** **No.** All top-up credits are lifetime and non-expiring. They will remain intact in your account indefinitely until used.

---

#### Q: How many files can I upload per chat interaction?
**A:** You can attach up to **5 files simultaneously** per message. Supported formats include PDF, TXT, DOCX, XLSX, CSV, Images (PNG, JPG, WEBP), and source code files. Per-file size limits are 10MB (Free), 50MB (Starter), 250MB (Pro), and 1GB (Enterprise).

---

#### Q: How secure are payments on Anticeil?
**A:** All transactions are processed securely via **Midtrans** (part of GoTo Group), a licensed payment gateway. Anticeil never stores your credit card information or sensitive payment details.

---

#### Q: How can I transfer my data to another device on the Free tier?
**A:** You can use the **Export Data** feature in Settings to download a single JSON backup file and click **Import Data** on your new device. For automated cloud sync across all devices, upgrade to Starter or Pro.
`,
    },
  ],
};
