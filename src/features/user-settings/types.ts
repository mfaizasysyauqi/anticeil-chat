export type SettingsSection =
  | 'account'
  | 'profiles'
  | 'privacy'
  | 'permissions'
  | 'notifications'
  | 'nitro'
  | 'boost'
  | 'subscriptions'
  | 'gifts'
  | 'billing'
  | 'voice'
  | 'camera'
  | 'appearance'
  | 'accessibility'
  | 'system'
  | 'language'
  | 'keybinds'
  | 'registered_games'
  | 'activity_privacy'
  | 'overlay'
  | 'connected_apps'
  | 'developer';

export interface UserSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: any;
  currentUserName: string;
  onSaveDisplayName: (name: string) => Promise<void> | void;
  isSavingDisplayName?: boolean;
  onSaveUsername: (username: string) => Promise<void> | void;
  isSavingUsername?: boolean;
  theme: any;
  setTheme: (theme: any) => void;
  onGoogleSignIn: () => void;
  onLogout: () => void;
  initialSection?: string;
  onOpenEditProfile?: () => void;
  colonies?: any[];
}
