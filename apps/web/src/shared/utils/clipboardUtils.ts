import { toast } from '../hooks/useToast';

/**
 * Copies text to the system clipboard and displays a success/error toast notification.
 */
export async function copyToClipboard(
  text: string,
  successMessage = 'Copied to clipboard'
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    if (successMessage) {
      toast.success(successMessage);
    }
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    toast.error('Failed to copy to clipboard');
    return false;
  }
}
