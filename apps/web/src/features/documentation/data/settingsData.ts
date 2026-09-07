import { DocCategory } from '../types';

export const settingsCategory: DocCategory = {
  id: 'settings-guide',
  titleId: 'Pengaturan & Preferensi',
  titleEn: 'Settings & Preferences',
  icon: 'Settings',
  collapsible: true,
  sections: [
    {
      id: 'settings-overview',
      titleId: 'Panel Pengaturan',
      titleEn: 'Settings Panel',
      icon: 'Sliders',
      summaryId: 'Kelola preferensi akun, tema, bahasa, dan pengaturan AI.',
      summaryEn: 'Manage account preferences, theme, language, and AI settings.',
      contentId: `
### Panel Pengaturan

Akses pengaturan melalui ikon **gear** di navbar atau sidebar.

#### Kategori Pengaturan

**1. Appearance**
- **Theme**: Light, Dark, atau System (mengikuti OS)
- **Accent Color**: Warna aksen untuk UI
- **Font Size**: Ukuran font (kecil, sedang, besar)
- **Compact Mode**: Tampilan lebih ringkas

**2. Language**
- **Interface Language**: Bahasa antarmuka (Indonesia/English)
- **AI Response Language**: Bahasa default respons AI
- **Auto-detect**: Deteksi bahasa input otomatis

**3. AI Settings**
- **Default Model**: Model AI default untuk chat baru
- **Temperature**: Kreativitas respons (0-2)
- **Max Tokens**: Batas panjang respons

**4. Privacy**
- **Data Collection**: Opsi analytics (anonim)
- **Chat History**: Simpan riwayat chat
- **Clear Data**: Hapus semua data lokal
`,
      contentEn: `
### Settings Panel

Access settings via the **gear** icon in navbar or sidebar.

#### Settings Categories

**1. Appearance**
- **Theme**: Light, Dark, or System (follows OS)
- **Accent Color**: UI accent color
- **Font Size**: Font size (small, medium, large)
- **Compact Mode**: More compact display

**2. Language**
- **Interface Language**: Interface language (Indonesia/English)
- **AI Response Language**: Default AI response language
- **Auto-detect**: Auto-detect input language

**3. AI Settings**
- **Default Model**: Default AI model for new chats
- **Temperature**: Response creativity (0-2)
- **Max Tokens**: Response length limit

**4. Privacy**
- **Data Collection**: Analytics options (anonymous)
- **Chat History**: Save chat history
- **Clear Data**: Delete all local data
`,
    },
    {
      id: 'export-import-data',
      titleId: 'Export & Import Data',
      titleEn: 'Export & Import Data',
      icon: 'Download',
      summaryId: 'Backup dan restore semua data Anda dalam format JSON.',
      summaryEn: 'Backup and restore all your data in JSON format.',
      contentId: `
### Export & Import Data

#### Export Data
1. Buka **Settings** → **Data**
2. Klik **Export Data**
3. Pilih data: Chat history, Documents, Prompts, Settings
4. File JSON akan terunduh otomatis

#### Import Data
1. Buka **Settings** → **Data**
2. Klik **Import Data**
3. Pilih file JSON backup
4. Konfirmasi import

#### Use Cases
- **Backup Rutin**: Simpan backup berkala
- **Pindah Perangkat**: Transfer data ke device baru (Free tier)
- **Share Data**: Bagikan prompts atau templates ke tim

#### Catatan
- Import akan merge dengan data existing
- File JSON bisa dibuka di text editor
`,
      contentEn: `
### Export & Import Data

#### Export Data
1. Open **Settings** → **Data**
2. Click **Export Data**
3. Select data: Chat history, Documents, Prompts, Settings
4. JSON file downloads automatically

#### Import Data
1. Open **Settings** → **Data**
2. Click **Import Data**
3. Select backup JSON file
4. Confirm import

#### Use Cases
- **Regular Backup**: Save periodic backups
- **Device Migration**: Transfer data to new device (Free tier)
- **Share Data**: Share prompts or templates with team

#### Notes
- Import merges with existing data
- JSON file can be opened in text editor
`,
    },
  ],
};

export const authCategory: DocCategory = {
  id: 'auth-guide',
  titleId: 'Autentikasi & Akun',
  titleEn: 'Authentication & Account',
  icon: 'User',
  collapsible: true,
  sections: [
    {
      id: 'signup-login',
      titleId: 'Daftar & Login',
      titleEn: 'Sign Up & Login',
      icon: 'LogIn',
      summaryId: 'Cara mendaftar dan login ke akun Anticeil.',
      summaryEn: 'How to sign up and log in to your Anticeil account.',
      contentId: `
### Autentikasi Anticeil

#### Daftar Akun Baru
1. Klik **Sign Up** di pojok kanan atas
2. Masukkan email dan password
3. Verifikasi email melalui link yang dikirim
4. Akun aktif dan siap digunakan

#### Login
1. Klik **Login** di pojok kanan atas
2. Masukkan email dan password
3. Atau gunakan **Google OAuth** untuk login cepat

#### Login dengan Google
1. Klik **Continue with Google**
2. Pilih akun Google Anda
3. Otomatis login tanpa perlu password

#### Free vs Cloud Tier
- **Free Tier**: Bisa tanpa akun (data lokal)
- **Cloud Tier**: Akun diperlukan untuk sync
`,
      contentEn: `
### Anticeil Authentication

#### Sign Up New Account
1. Click **Sign Up** in top right corner
2. Enter email and password
3. Verify email via link sent
4. Account active and ready to use

#### Login
1. Click **Login** in top right corner
2. Enter email and password
3. Or use **Google OAuth** for quick login

#### Login with Google
1. Click **Continue with Google**
2. Select your Google account
3. Auto-login without password

#### Free vs Cloud Tier
- **Free Tier**: Works without account (local data)
- **Cloud Tier**: Account required for sync
`,
    },
  ],
};
