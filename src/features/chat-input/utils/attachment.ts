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
}

export function processFileInput(
  e: React.ChangeEvent<HTMLInputElement>,
  onSuccess: (attachment: ProcessedAttachment) => void,
  options?: { onUpgradeClick?: () => void; userPlan?: 'free' | 'nectar_basic' | 'nectar_boost' },
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

  // 3. Dynamic Tier-based file size check
  const category = categorizeFile(file);
  const currentPlan = options?.userPlan || getCurrentUserPlan();
  const maxLimit = getUploadLimitForPlan(currentPlan);

  if (file.size > maxLimit) {
    if (currentPlan === 'free' && file.size <= NECTAR_TIER_LIMIT) {
      const suggestedTier = file.size <= POLLEN_TIER_LIMIT ? 'Pollen (50MB)' : 'Nectar VIP (500MB)';
      toast.error(
        `File ini (${formatSize(file.size)}) melebihi batas 25MB Free Tier. Tingkatkan ke ${suggestedTier} untuk batas upload lebih besar!`,
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
        `File ini (${formatSize(file.size)}) melebihi batas 50MB Pollen Tier. Tingkatkan ke Nectar VIP untuk upload hingga 500MB!`,
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
      toast.error(`Ukuran file maksimal ${formatSize(maxLimit)}. File ini berukuran ${formatSize(file.size)}.`);
    }
    return;
  }

  // Record for rate limiting
  recordUpload();

  // 4. Process file — optimistic local display + background Cloudflare R2 upload
  const reader = new FileReader();
  reader.onload = async () => {
    const localDataUrl = reader.result as string;
    // Stage immediately for instant feedback
    onSuccess({
      type: category,
      url: localDataUrl,
      name: file.name,
      size: formatSize(file.size),
    });

    // Upload to Cloudflare R2 via backend bridge
    const remote = await uploadMediaToR2(file);
    if (remote.isRemote && remote.url) {
      onSuccess({
        type: category,
        url: remote.url,
        name: file.name,
        size: formatSize(file.size),
      });
    }
  };
  reader.readAsDataURL(file);
}
