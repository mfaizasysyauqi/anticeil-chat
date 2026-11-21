import * as React from 'react';
import {
  TwoPaneSettingsDialog,
  type TwoPaneSettingsDialogProps,
  type SettingsNavGroup,
  type SettingsNavItem,
} from './two-pane-settings-dialog';

export type { TwoPaneSettingsDialogProps, SettingsNavGroup, SettingsNavItem };

/**
 * LargeDialog (Template Dialog Besar)
 * Modeled after User Settings, Edit Profile, Colony Settings, and Voice/Video Settings.
 * Proportional responsive 2-pane layout (w-[90vw]-w-[96vw], max-w-7xl, h-[90vh]-h-[94vh], 5% viewport padding).
 * 100% DRY and consistent with Anticeil design tokens.
 */
export function LargeDialog(props: TwoPaneSettingsDialogProps) {
  return <TwoPaneSettingsDialog {...props} />;
}
