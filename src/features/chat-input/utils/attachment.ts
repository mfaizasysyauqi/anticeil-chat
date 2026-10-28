import { toast } from 'sonner';

// ─── Per-type file size limits ───
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5 MB
const MAX_DOC_SIZE   = 10 * 1024 * 1024;  // 10 MB
const MAX_AUDIO_SIZE = 10 * 1024 * 1024;  // 10 MB
const MAX_VIDEO_SIZE = 25 * 1024 * 1024;  // 25 MB

// Legacy export for backward compat
export const MAX_FILE_SIZE_BYTES = MAX_VIDEO_SIZE;

// ─── Client-side upload rate limiter (sliding window) ───
const RATE_LIMIT_WINDOW_MS = 60_000; // 60 seconds
const RATE_LIMIT_MAX = 5;            // max 5 uploads per window
const uploadTimestamps: number[] = [];

function isRateLimited(): boolean {
  const now = Date.now();
  // Purge expired entries
  while (uploadTimestamps.length > 0 && now - uploadTimestamps[0] > RATE_LIMIT_WINDOW_MS) {
    uploadTimestamps.shift();
  }
  return uploadTimestamps.length >= RATE_LIMIT_MAX;
}

function recordUpload(): void {
  uploadTimestamps.push(Date.now());
}

// ─── File type detection ───
type FileCategory = 'image' | 'video' | 'audio' | 'file';

function categorizeFile(file: File): FileCategory {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'file';
}

function getMaxSize(category: FileCategory): number {
  switch (category) {
    case 'image': return MAX_IMAGE_SIZE;
    case 'video': return MAX_VIDEO_SIZE;
    case 'audio': return MAX_AUDIO_SIZE;
    case 'file':  return MAX_DOC_SIZE;
  }
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

const ALLOWED_EXTENSIONS = new Set([
  // Images
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico',
  // Documents
  '.pdf', '.doc', '.docx', '.txt', '.csv', '.json', '.xlsx', '.xls', '.pptx', '.ppt', '.md', '.rtf',
  // Audio
  '.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.wma',
  // Video
  '.mp4', '.webm', '.mov', '.avi', '.mkv',
  // Archives
  '.zip', '.rar', '.7z', '.tar', '.gz',
]);

function isAllowedFile(file: File): boolean {
  // Check MIME type categories
  if (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/')) return true;
  // Check by extension
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext);
}

// ─── Exported types & function ───

export interface ProcessedAttachment {
  type: FileCategory;
  url: string;
  name: string;
  size: string;
}

export function processFileInput(
  e: React.ChangeEvent<HTMLInputElement>,
  onSuccess: (attachment: ProcessedAttachment) => void,
) {
  const file = e.target.files?.[0];
  if (!file) return;

  // Reset input so user can re-select same file
  e.target.value = '';

  // 1. Rate limit check
  if (isRateLimited()) {
    toast.error('Terlalu banyak upload. Tunggu sebentar sebelum mengunggah lagi (maks 5 file/menit).');
    return;
  }

  // 2. Allowed file type check
  if (!isAllowedFile(file)) {
    toast.error('Format file tidak didukung. Unggah gambar, dokumen, audio, atau video.');
    return;
  }

  // 3. Per-type size check
  const category = categorizeFile(file);
  const maxSize = getMaxSize(category);
  if (file.size > maxSize) {
    toast.error(`Ukuran ${category} maksimal ${formatSize(maxSize)}. File ini ${formatSize(file.size)}.`);
    return;
  }

  // Record for rate limiting
  recordUpload();

  // 4. Process file
  if (category === 'image') {
    const reader = new FileReader();
    reader.onload = () => {
      onSuccess({
        type: 'image',
        url: reader.result as string,
        name: file.name,
        size: formatSize(file.size),
      });
    };
    reader.readAsDataURL(file);
  } else {
    onSuccess({
      type: category,
      url: URL.createObjectURL(file),
      name: file.name,
      size: formatSize(file.size),
    });
  }
}
