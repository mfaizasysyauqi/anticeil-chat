import * as React from 'react';
import { SmallDialog, type SmallDialogProps } from './small-dialog';

export type ConfirmDialogProps = SmallDialogProps;

/**
 * ConfirmDialog
 * Standardized confirmation dialog powered by SmallDialog (Template Dialog Kecil).
 * 100% DRY and consistent with Anticeil design tokens.
 */
export function ConfirmDialog(props: ConfirmDialogProps) {
  return <SmallDialog {...props} />;
}
