import { DocFormat } from '../store/useDocsStore';

export interface FormatMeta {
  brandColor: string;
  bgBadge: string;
  borderBadge: string;
  formatLabel: string;
  shortLabel: string;
}

/**
 * Returns consistent theme design tokens and localized labels for document formats.
 */
export function getFormatMeta(format: DocFormat = 'latex', language: 'id' | 'en' = 'id'): FormatMeta {
  switch (format) {
    case 'sheet':
      return {
        brandColor: 'var(--accent-success, #10B981)',
        bgBadge: 'rgba(16, 185, 129, 0.12)',
        borderBadge: 'rgba(16, 185, 129, 0.3)',
        formatLabel: language === 'id' ? 'Spreadsheet Studio' : 'Spreadsheet Studio',
        shortLabel: 'Sheet',
      };
    case 'slide':
      return {
        brandColor: 'var(--brand-secondary, #8B5CF6)',
        bgBadge: 'rgba(139, 92, 246, 0.12)',
        borderBadge: 'rgba(139, 92, 246, 0.3)',
        formatLabel: language === 'id' ? 'Slide Studio (Typst)' : 'Slide Studio (Typst)',
        shortLabel: 'Slide',
      };
    case 'typst':
      return {
        brandColor: 'var(--brand-primary, #0073EA)',
        bgBadge: 'rgba(0, 115, 234, 0.12)',
        borderBadge: 'rgba(0, 115, 234, 0.3)',
        formatLabel: language === 'id' ? 'Dokumen Typst' : 'Typst Document',
        shortLabel: 'Typst',
      };
    case 'latex':
    default:
      return {
        brandColor: 'var(--accent-success, #10B981)',
        bgBadge: 'rgba(16, 185, 129, 0.12)',
        borderBadge: 'rgba(16, 185, 129, 0.3)',
        formatLabel: language === 'id' ? 'Dokumen LaTeX' : 'LaTeX Document',
        shortLabel: 'LaTeX',
      };
  }
}
