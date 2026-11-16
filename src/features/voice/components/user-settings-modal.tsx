/**
 * Re-export UserSettingsModal from dedicated user-settings feature module.
 * Preserves backwards compatibility for existing imports in voice module.
 */
export {
  UserSettingsModal,
  type UserSettingsModalProps,
  type SettingsSection,
} from '@/features/user-settings';
