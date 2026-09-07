import { DocCategory } from '../types';

export const mediaStudioCategory: DocCategory = {
  id: 'media-studio-guide',
  titleId: 'Media Studio & AI Generation',
  titleEn: 'Media Studio & AI Generation',
  icon: 'Image',
  collapsible: true,
  sections: [
    {
      id: 'image-generation',
      titleId: 'Image Generation (Imagine)',
      titleEn: 'Image Generation (Imagine)',
      icon: 'ImagePlus',
      badge: 'AI Art',
      summaryId: 'Buat gambar dari text prompt menggunakan model DALL-E 3, Stable Diffusion, dan Flux.',
      summaryEn: 'Generate images from text prompts using DALL-E 3, Stable Diffusion, and Flux models.',
      contentId: `
### Image Generation dengan AI

**Media Studio** menyediakan berbagai model generasi gambar:

#### Model yang Tersedia
- **DALL-E 3** — Model flagship OpenAI untuk gambar berkualitas tinggi
- **Stable Diffusion XL** — Open-source, fleksibel dengan berbagai style
- **Flux.1** — Model terbaru dengan detail tinggi dan prompt adherence
- **Ideogram** — Unggul untuk text rendering dalam gambar

#### Cara Menggunakan
1. Buka Media Studio dari sidebar
2. Pilih tab Image
3. Ketik prompt deskriptif, contoh: "A futuristic city at sunset, cyberpunk style"
4. Pilih aspect ratio (1:1, 16:9, 9:16)
5. Klik Generate

#### Tips Prompting
- Spesifik: Jelaskan style, lighting, mood, dan komposisi
- Gunakan modifier: "ultra detailed", "8K", "cinematic lighting"
`,
      contentEn: `
### AI Image Generation

**Media Studio** provides various image generation models:

#### Available Models
- **DALL-E 3** — OpenAI's flagship for high-quality images
- **Stable Diffusion XL** — Open-source, flexible with various styles
- **Flux.1** — Latest model with high detail and prompt adherence
- **Ideogram** — Excellent for text rendering in images

#### How to Use
1. Open Media Studio from sidebar
2. Select Image tab
3. Type descriptive prompt, e.g.: "A futuristic city at sunset, cyberpunk style"
4. Select aspect ratio (1:1, 16:9, 9:16)
5. Click Generate

#### Prompting Tips
- Be specific: Describe style, lighting, mood, and composition
- Use modifiers: "ultra detailed", "8K", "cinematic lighting"
`,
    },
    {
      id: 'video-generation',
      titleId: 'Video Generation',
      titleEn: 'Video Generation',
      icon: 'Video',
      badge: 'Beta',
      summaryId: 'Buat video pendek dari text prompt atau gambar yang sudah ada.',
      summaryEn: 'Create short videos from text prompts or existing images.',
      contentId: `
### AI Video Generation

#### Model yang Tersedia
- **Runway Gen-3** — Video berkualitas tinggi dari text prompt
- **Pika Labs** — Video pendek dengan gerakan natural
- **Luma Dream Machine** — Text-to-video dengan kontrol kamera

#### Cara Menggunakan
1. Buka Media Studio, pilih tab Video
2. Pilih model video
3. Masukkan prompt deskriptif
4. Atur durasi (2-10 detik)
5. Klik Generate

#### Image-to-Video
Upload gambar sebagai referensi, tambahkan motion prompt, lalu generate.
`,
      contentEn: `
### AI Video Generation

#### Available Models
- **Runway Gen-3** — High-quality video from text prompts
- **Pika Labs** — Short videos with natural motion
- **Luma Dream Machine** — Text-to-video with camera control

#### How to Use
1. Open Media Studio, select Video tab
2. Select video model
3. Enter descriptive prompt
4. Set duration (2-10 seconds)
5. Click Generate

#### Image-to-Video
Upload an image as reference, add motion prompt, then generate.
`,
    },
    {
      id: 'audio-generation',
      titleId: 'Audio & Music Generation',
      titleEn: 'Audio & Music Generation',
      icon: 'Music',
      summaryId: 'Buat musik dan efek suara dari text prompt.',
      summaryEn: 'Generate music and sound effects from text prompts.',
      contentId: `
### AI Audio Generation

#### Model yang Tersedia
- **Suno AI** — Musik lengkap dengan lirik
- **Udio** — High-fidelity music generation
- **ElevenLabs** — Text-to-speech dengan berbagai suara

#### Text-to-Music
1. Buka Media Studio, pilih tab Audio
2. Ketik prompt musik, contoh: "Upbeat electronic dance music, 128 BPM"
3. Pilih durasi (30 detik - 4 menit)
4. Klik Generate

#### Text-to-Speech
1. Pilih TTS Mode
2. Pilih voice dari library
3. Masukkan text yang ingin diucapkan
`,
      contentEn: `
### AI Audio Generation

#### Available Models
- **Suno AI** — Full songs with lyrics
- **Udio** — High-fidelity music generation
- **ElevenLabs** — Text-to-speech with various voices

#### Text-to-Music
1. Open Media Studio, select Audio tab
2. Type music prompt, e.g.: "Upbeat electronic dance music, 128 BPM"
3. Select duration (30 seconds - 4 minutes)
4. Click Generate

#### Text-to-Speech
1. Select TTS Mode
2. Choose voice from library
3. Enter text to speak
`,
    },
  ],
};
