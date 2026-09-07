import { DocCategory } from '../types';

export const promptsCategory: DocCategory = {
  id: 'prompts-library',
  titleId: 'Prompt Library & Templates',
  titleEn: 'Prompt Library & Templates',
  icon: 'FileCode',
  collapsible: true,
  sections: [
    {
      id: 'prompts-overview',
      titleId: 'Apa itu Prompt Library?',
      titleEn: 'What is Prompt Library?',
      icon: 'BookOpen',
      summaryId: 'Simpan, organisir, dan gunakan kembali prompt favorit Anda.',
      summaryEn: 'Save, organize, and reuse your favorite prompts.',
      contentId: `
### Prompt Library

**Prompt Library** adalah tempat menyimpan dan mengorganisir prompt yang sering digunakan.

#### Fitur Utama
- **Save Prompts**: Simpan prompt dengan judul dan deskripsi
- **Categories**: Organisir ke dalam kategori kustom
- **Quick Access**: Akses cepat dari sidebar atau command
- **Share**: Bagikan prompt dengan tim (Pro tier)

#### Cara Menggunakan
1. Buka **Prompts** dari sidebar
2. Klik **New Prompt** untuk membuat baru
3. Isi judul, deskripsi, dan isi prompt
4. Gunakan variabel seperti \`{topic}\` untuk template dinamis

#### Contoh Template
- **Code Review**: "Review code berikut dan berikan saran improvement..."
- **Email Writer**: "Tulis email profesional tentang {topic}..."
- **Summarizer**: "Ringkas artikel berikut dalam 5 poin utama..."
`,
      contentEn: `
### Prompt Library

**Prompt Library** is a place to store and organize frequently used prompts.

#### Key Features
- **Save Prompts**: Save prompts with title and description
- **Categories**: Organize into custom categories
- **Quick Access**: Quick access from sidebar or command
- **Share**: Share prompts with team (Pro tier)

#### How to Use
1. Open **Prompts** from sidebar
2. Click **New Prompt** to create new
3. Fill title, description, and prompt content
4. Use variables like \`{topic}\` for dynamic templates

#### Example Templates
- **Code Review**: "Review the following code and provide improvement suggestions..."
- **Email Writer**: "Write a professional email about {topic}..."
- **Summarizer**: "Summarize the following article in 5 key points..."
`,
    },
    {
      id: 'prompt-variables',
      titleId: 'Variabel & Template Dinamis',
      titleEn: 'Variables & Dynamic Templates',
      icon: 'Variable',
      summaryId: 'Gunakan variabel untuk membuat prompt yang fleksibel dan reusable.',
      summaryEn: 'Use variables to create flexible and reusable prompts.',
      contentId: `
### Variabel dalam Prompt

Gunakan sintaks \`{variable_name}\` untuk membuat template dinamis.

#### Variabel yang Didukung
- \`{topic}\` — Topik utama
- \`{language}\` — Bahasa pemrograman
- \`{style}\` — Gaya penulisan
- \`{length}\` — Panjang output

#### Contoh Penggunaan
**Template:**
\`\`\`
Buat tutorial {language} tentang {topic} dengan gaya {style}.
\`\`\`

**Saat digunakan:**
- topic: "React Hooks"
- language: "JavaScript"
- style: "beginner-friendly"

**Hasil:**
"Buat tutorial JavaScript tentang React Hooks dengan gaya beginner-friendly."

#### Tips
- Gunakan nama variabel yang deskriptif
- Tambahkan default value jika perlu
- Dokumentasikan variabel di deskripsi prompt
`,
      contentEn: `
### Variables in Prompts

Use \`{variable_name}\` syntax to create dynamic templates.

#### Supported Variables
- \`{topic}\` — Main topic
- \`{language}\` — Programming language
- \`{style}\` — Writing style
- \`{length}\` — Output length

#### Example Usage
**Template:**
\`\`\`
Create a {language} tutorial about {topic} with {style} style.
\`\`\`

**When used:**
- topic: "React Hooks"
- language: "JavaScript"
- style: "beginner-friendly"

**Result:**
"Create a JavaScript tutorial about React Hooks with beginner-friendly style."

#### Tips
- Use descriptive variable names
- Add default values if needed
- Document variables in prompt description
`,
    },
  ],
};
