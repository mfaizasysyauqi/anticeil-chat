import { toast } from 'sonner';
import { uploadMediaToR2 } from '@/lib/upload';

// ─── Tier-based file size limits ───
export const FREE_TIER_LIMIT = 25 * 1024 * 1024;    // 25 MB
export const POLLEN_TIER_LIMIT = 50 * 1024 * 1024;  // 50 MB
export const NECTAR_TIER_LIMIT = 500 * 1024 * 1024; // 500 MB

// Legacy export for backward compat
export const MAX_FILE_SIZE_BYTES = FREE_TIER_LIMIT;

export function getCurrentUserPlan(): 'free' | 'nectar_basic' | 'nectar_boost' {
  try {
    const raw = localStorage.getItem('anticeil_user_subscription');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.status === 'active' && parsed.planId) {
        return parsed.planId;
      }
    }
  } catch {}
  return 'free';
}

export function getUploadLimitForPlan(plan: 'free' | 'nectar_basic' | 'nectar_boost' | string): number {
  if (plan === 'nectar_boost') return NECTAR_TIER_LIMIT;
  if (plan === 'nectar_basic') return POLLEN_TIER_LIMIT;
  return FREE_TIER_LIMIT;
}

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
  isSpoiler?: boolean;
}

export const MAX_UPLOAD_FILES_LIMIT = 10;

export async function processFileObject(
  file: File,
  options?: { onUpgradeClick?: () => void; userPlan?: 'free' | 'nectar_basic' | 'nectar_boost' },
): Promise<ProcessedAttachment | null> {
  // 1. Allowed file type check
  if (!isAllowedFile(file)) {
    toast.error(`Format file "${file.name}" tidak didukung. Unggah gambar, dokumen, audio, atau video.`);
    return null;
  }

  // 2. Dynamic Tier-based file size check
  const category = categorizeFile(file);
  const currentPlan = options?.userPlan || getCurrentUserPlan();
  const maxLimit = getUploadLimitForPlan(currentPlan);

  if (file.size > maxLimit) {
    if (currentPlan === 'free' && file.size <= NECTAR_TIER_LIMIT) {
      const suggestedTier = file.size <= POLLEN_TIER_LIMIT ? 'Pollen (50MB)' : 'Nectar VIP (500MB)';
      toast.error(
        `File "${file.name}" (${formatSize(file.size)}) melebihi batas 25MB Free Tier. Tingkatkan ke ${suggestedTier} untuk batas upload lebih besar!`,
        {
          duration: 6000,
          action: options?.onUpgradeClick
            ? {
                label: 'Upgrade',
                onClick: options.onUpgradeClick,
              }
            : undefined,
        },
      );
    } else if (currentPlan === 'nectar_basic' && file.size <= NECTAR_TIER_LIMIT) {
      toast.error(
        `File "${file.name}" (${formatSize(file.size)}) melebihi batas 50MB Pollen Tier. Tingkatkan ke Nectar VIP untuk upload hingga 500MB!`,
        {
          duration: 6000,
          action: options?.onUpgradeClick
            ? {
                label: 'Upgrade Nectar',
                onClick: options.onUpgradeClick,
              }
            : undefined,
        },
      );
    } else {
      toast.error(`Ukuran file "${file.name}" maksimal ${formatSize(maxLimit)}. File berukuran ${formatSize(file.size)}.`);
    }
    return null;
  }

  recordUpload();

  return new Promise<ProcessedAttachment>((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const localDataUrl = reader.result as string;
      const att: ProcessedAttachment = {
        type: category,
        url: localDataUrl,
        name: file.name,
        size: formatSize(file.size),
      };

      // Upload to Cloudflare R2 in background
      uploadMediaToR2(file).then((remote) => {
        if (remote.isRemote && remote.url) {
          att.url = remote.url;
        }
      });

      resolve(att);
    };
    reader.onerror = () => resolve({
      type: category,
      url: '',
      name: file.name,
      size: formatSize(file.size),
    });
    reader.readAsDataURL(file);
  });
}

export async function processFilesBatch(
  files: FileList | File[],
  currentCount: number,
  onAddAttachment: (attachment: ProcessedAttachment) => void,
  onLimitExceeded: () => void,
  options?: { onUpgradeClick?: () => void; userPlan?: 'free' | 'nectar_basic' | 'nectar_boost' },
) {
  const fileArray = Array.from(files);
  if (fileArray.length === 0) return;

  if (currentCount >= MAX_UPLOAD_FILES_LIMIT || currentCount + fileArray.length > MAX_UPLOAD_FILES_LIMIT) {
    onLimitExceeded();
  }

  const allowedToAdd = fileArray.slice(0, Math.max(0, MAX_UPLOAD_FILES_LIMIT - currentCount));
  for (const file of allowedToAdd) {
    const att = await processFileObject(file, options);
    if (att) {
      onAddAttachment(att);
    }
  }
}

export function processFileInput(
  e: React.ChangeEvent<HTMLInputElement>,
  onSuccess: (attachment: ProcessedAttachment) => void,
  options?: { onUpgradeClick?: () => void; userPlan?: 'free' | 'nectar_basic' | 'nectar_boost' },
) {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  e.target.value = '';

  for (let i = 0; i < files.length; i++) {
    processFileObject(files[i], options).then((att) => {
      if (att) onSuccess(att);
    });
  }
}
