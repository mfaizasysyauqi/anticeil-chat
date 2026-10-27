import { toast } from 'sonner';

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface ProcessedAttachment {
  type: 'image' | 'file';
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

  // Reset input value so user can re-select same file if needed
  e.target.value = '';

  // 1. Strict Size Check (5MB max)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    toast.error('Ukuran file maksimal 5 MB untuk menjaga efisiensi storage.');
    return;
  }

  // 2. Reject Video and Audio formats
  if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
    toast.error('Format video dan audio tidak diizinkan. Harap unggah gambar atau dokumen.');
    return;
  }

  // 3. Allowed MIME types: images and documents (PDF, CSV, JSON, TXT, DOCX)
  const isImage = file.type.startsWith('image/');
  const isDocument =
    file.type === 'application/pdf' ||
    file.type === 'text/plain' ||
    file.type === 'text/csv' ||
    file.type === 'application/json' ||
    file.type.includes('wordprocessingml') ||
    file.type.includes('spreadsheetml') ||
    file.name.endsWith('.pdf') ||
    file.name.endsWith('.json') ||
    file.name.endsWith('.txt') ||
    file.name.endsWith('.csv') ||
    file.name.endsWith('.docx') ||
    file.name.endsWith('.xlsx');

  if (!isImage && !isDocument) {
    toast.error('Format file tidak didukung. Harap unggah gambar atau dokumen (PDF, TXT, CSV, JSON, DOCX).');
    return;
  }

  if (isImage) {
    const reader = new FileReader();
    reader.onload = () => {
      onSuccess({
        type: 'image',
        url: reader.result as string,
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`,
      });
    };
    reader.readAsDataURL(file);
  } else {
    onSuccess({
      type: 'file',
      url: '#',
      name: file.name,
      size: `${Math.round(file.size / 1024)} KB`,
    });
  }
}
