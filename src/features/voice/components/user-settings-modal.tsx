import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  Mic,
  Video,
  Palette,
  LogOut,
  AtSign,
  Clock,
  Moon,
  Sun,
  Sparkles,
  UserCheck,
  CheckCircle2,
  Shield,
  ShieldAlert,
  Bell,
  Zap,
  Gem,
  CreditCard,
  Gift,
  Receipt,
  Search,
  Eye,
  EyeOff,
  Smartphone,
  Key,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Trash2,
  ExternalLink,
  Lock,
  Check,
  X,
  Volume2,
  Sliders,
  Laptop,
  Users,
  Info,
} from 'lucide-react';
import { TwoPaneSettingsDialog, SettingsNavGroup } from '@/components/ui/two-pane-settings-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { useVoiceSettings, NoiseSuppressionType } from '../hooks/use-voice-settings';
import dayjs from 'dayjs';
import { toast } from 'sonner';

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
  | 'keybinds';

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
}

export function UserSettingsModal({
  open,
  onOpenChange,
  currentUser,
  currentUserName,
  onSaveDisplayName,
  isSavingDisplayName = false,
  onSaveUsername,
  isSavingUsername = false,
  theme,
  setTheme,
  onGoogleSignIn,
  onLogout,
  initialSection = 'account',
}: UserSettingsModalProps) {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<SettingsSection>(
    (initialSection as SettingsSection) || 'account',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [accountSubView, setAccountSubView] = useState<'main' | 'standing' | 'devices'>('main');

  // Reveal toggles for sensitive account info
  const [isEmailRevealed, setIsEmailRevealed] = useState(false);
  const [isPhoneRevealed, setIsPhoneRevealed] = useState(false);
  const [isAgeNoticeDismissed, setIsAgeNoticeDismissed] = useState(false);

  // Edit modals/dialogs state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  // Privacy & Notifications mock/functional switches
  const [safeDirectMessaging, setSafeDirectMessaging] = useState<'safe' | 'friends' | 'none'>('safe');
  const [allowDmsFromServerMembers, setAllowDmsFromServerMembers] = useState(true);
  const [allowFriendRequestsFrom, setAllowFriendRequestsFrom] = useState({
    everyone: true,
    friendsOfFriends: true,
    serverMembers: true,
  });
  const [enableDesktopNotifications, setEnableDesktopNotifications] = useState(true);
  const [enableNotificationSounds, setEnableNotificationSounds] = useState(true);
  const [enableUnreadBadges, setEnableUnreadBadges] = useState(true);

  // Voice & Video settings
  const {
    settings,
    updateSetting,
    audioInputDevices,
    audioOutputDevices,
    videoInputDevices,
    isMicTesting,
    micVolumeLevel,
    startMicTest,
    stopMicTest,
  } = useVoiceSettings();

  useEffect(() => {
    if (open) {
      setActiveSection((initialSection as SettingsSection) || 'account');
      setAccountSubView('main');
      setSearchQuery('');
    }
  }, [open, initialSection]);

  // Account name & username state
  const suggestedUsername = useMemo(() => {
    if (currentUser?.username) return currentUser.username;
    const base = currentUser?.email?.split('@')[0] || currentUserName;
    return (
      base
        ?.toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 32) || ''
    );
  }, [currentUser?.username, currentUser?.email, currentUserName]);

  const [editDisplayNameInput, setEditDisplayNameInput] = useState(currentUserName);
  const [editUsernameInput, setEditUsernameInput] = useState(suggestedUsername);
  const [editEmailInput, setEditEmailInput] = useState(currentUser?.email || '');
  const [editPhoneInput, setEditPhoneInput] = useState('+62 812-3456-1551');

  useEffect(() => {
    if (open) {
      setEditDisplayNameInput(currentUserName);
      setEditUsernameInput(suggestedUsername);
      setEditEmailInput(currentUser?.email || '');
    }
  }, [open, currentUserName, suggestedUsername, currentUser?.email]);

  const usernameLastChangedAt = currentUser?.usernameLastChangedAt;
  const usernameCooldownEnd = usernameLastChangedAt
    ? new Date(new Date(usernameLastChangedAt).getTime() + 14 * 24 * 60 * 60 * 1000)
    : null;
  const isUsernameCooldownActive = Boolean(
    usernameCooldownEnd && usernameCooldownEnd.getTime() > Date.now(),
  );

  const handleDisplayNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDisplayNameInput.trim() || editDisplayNameInput.trim() === currentUserName) return;
    await onSaveDisplayName(editDisplayNameInput.trim());
    setIsEditingDisplayName(false);
  };

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUsernameInput.trim() || editUsernameInput.trim() === currentUser?.username) return;
    await onSaveUsername(editUsernameInput.trim());
    setIsEditingUsername(false);
  };

  // Masked helpers
  const maskedEmail = useMemo(() => {
    const email = currentUser?.email || 'user@example.com';
    const [name, domain] = email.split('@');
    if (!domain) return '••••••••••••@gmail.com';
    const visibleChars = Math.min(2, name.length);
    const maskedName = name.slice(0, visibleChars) + '••••••••••';
    return `${maskedName}@${domain}`;
  }, [currentUser?.email]);

  const maskedPhone = useMemo(() => {
    return '••••••••••••1551';
  }, []);

  // Full Discord settings navigation groups
  const allGroups: SettingsNavGroup[] = [
    {
      key: 'USER_SETTINGS',
      title: t('User Settings'),
      items: [
        { id: 'account', label: t('Account'), icon: <User className="w-4 h-4" /> },
        { id: 'profiles', label: t('Profiles'), icon: <Sparkles className="w-4 h-4" /> },
        {
          id: 'privacy',
          label: t('Data & Privacy'),
          icon: <Shield className="w-4 h-4" />,
          subItems: [
            { id: 'privacy-how-we-use', label: t('How Anticeil Uses My Data') },
            { id: 'privacy-profile', label: t('Profile Privacy') },
            { id: 'privacy-e2e', label: t('Voice End-to-end Encryption') },
          ],
        },
        { id: 'permissions', label: t('Messaging Permissions'), icon: <ShieldAlert className="w-4 h-4" /> },
        { id: 'notifications', label: t('Notifications'), icon: <Bell className="w-4 h-4" /> },
      ],
    },
    {
      key: 'BILLING_SETTINGS',
      title: t('Billing Settings'),
      items: [
        {
          id: 'nitro',
          label: 'Nitro',
          icon: <Zap className="w-4 h-4 text-amber-400" />,
          badge: (
            <span className="text-[9px] font-black uppercase tracking-wider bg-linear-to-r from-amber-500 to-rose-500 text-white px-1.5 py-0.5 rounded-full shadow-xs">
              DISCOUNT
            </span>
          ),
        },
        { id: 'boost', label: t('Colony Boost'), icon: <Gem className="w-4 h-4 text-pink-400" /> },
        { id: 'subscriptions', label: t('Subscriptions'), icon: <CreditCard className="w-4 h-4" /> },
        { id: 'gifts', label: t('Gift Inventory'), icon: <Gift className="w-4 h-4" /> },
        { id: 'billing', label: t('Billing'), icon: <Receipt className="w-4 h-4" /> },
      ],
    },
    {
      key: 'APP_SETTINGS',
      title: t('App Settings'),
      items: [
        { id: 'voice', label: t('Voice & Video'), icon: <Mic className="w-4 h-4" /> },
        { id: 'appearance', label: t('Appearance'), icon: <Palette className="w-4 h-4" /> },
        { id: 'keybinds', label: t('Keybinds'), icon: <Sliders className="w-4 h-4" /> },
      ],
    },
  ];

  // Filter groups by search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return allGroups;
    const query = searchQuery.toLowerCase().trim();
    return allGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.label.toLowerCase().includes(query)),
      }))
      .filter((group) => group.items.length > 0);
  }, [allGroups, searchQuery]);

  return (
    <TwoPaneSettingsDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('User Settings')}
      groups={filteredGroups}
      activeSection={activeSection}
      onSectionChange={(id) => {
        setActiveSection(id as SettingsSection);
        setAccountSubView('main');
      }}
      sidebarHeader={
        <div className="space-y-3 mb-2">
          {/* User Profile Card Header in Sidebar */}
          {currentUser && (
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-sidebar-accent/80 border border-sidebar-border">
              <CommunityAvatar
                name={currentUserName}
                email={currentUser?.email}
                imageUrl={currentUser?.imageUrl}
                size={36}
                showStatus={false}
                className="shrink-0 ring-1 ring-border"
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-foreground truncate">{currentUserName}</span>
                <span className="text-[10px] text-muted-foreground font-mono truncate">
                  {currentUser?.username
                    ? `@${currentUser.username}`
                    : currentUser?.email
                    ? `@${currentUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '')}`
                    : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveSection('profiles')}
                className="text-[10px] text-muted-foreground hover:text-foreground font-semibold px-1 py-0.5 rounded hover:bg-muted/50 cursor-pointer shrink-0"
                title={t('Edit Profiles')}
              >
                ✎
              </button>
            </div>
          )}

          {/* Discord-style Search Bar in Sidebar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Search')}
              className="h-8 pl-8 text-xs bg-sidebar-accent/50 border-sidebar-border text-foreground placeholder:text-muted-foreground rounded-lg focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>
      }
      footerAction={
        currentUser ? (
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onLogout();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('Log Out')}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onGoogleSignIn}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer text-left"
          >
            <AtSign className="w-4 h-4" />
            <span>{t('Masuk')}</span>
          </button>
        )
      }
    >
      <div className="space-y-6 max-w-3xl pb-10">
        {/* ========================================================================= */}
        {/* SECTION: ACCOUNT                                                          */}
        {/* ========================================================================= */}
        {activeSection === 'account' && (
          <>
            {/* SUBVIEW: ACCOUNT STANDING (SCREENSHOT 3) */}
            {accountSubView === 'standing' ? (
              <div className="space-y-6 animate-in fade-in duration-200">
                <button
                  type="button"
                  onClick={() => setAccountSubView('main')}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{t('Account / Account Standing')}</span>
                </button>

                <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                  <div className="relative">
                    <CommunityAvatar
                      name={currentUserName}
                      email={currentUser?.email}
                      imageUrl={currentUser?.imageUrl}
                      size={84}
                      showStatus={false}
                      className="ring-4 ring-card rounded-full shadow-xl bg-card"
                    />
                    <div className="absolute -bottom-1 -right-1 size-7 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center shadow-md">
                      <Check className="w-4 h-4 text-white stroke-[3]" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                      {t('Your account is')}{' '}
                      <span className="text-emerald-500">{t('all good')}</span>
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1.5 leading-relaxed">
                      {t(
                        "Thank you for upholding Anticeil's Terms of Service and Community Guidelines. If you have a violation, it will appear here.",
                      )}
                    </p>
                  </div>

                  {/* Status Stepper / Progress meter (matching Discord) */}
                  <div className="w-full max-w-lg pt-6 px-4">
                    <div className="relative flex items-center justify-between">
                      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-muted rounded-full z-0" />
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 rounded-full z-0 w-0" />

                      {[
                        { label: t('All good'), active: true, color: 'bg-emerald-500 ring-emerald-500/30' },
                        { label: t('Limited'), active: false, color: 'bg-muted ring-muted/30' },
                        { label: t('Very limited'), active: false, color: 'bg-muted ring-muted/30' },
                        { label: t('At risk'), active: false, color: 'bg-muted ring-muted/30' },
                        { label: t('Suspended'), active: false, color: 'bg-muted ring-muted/30' },
                      ].map((step, idx) => (
                        <div key={idx} className="relative z-10 flex flex-col items-center group">
                          <div
                            className={cn(
                              'size-5 rounded-full border-2 border-background flex items-center justify-center transition-all',
                              step.color,
                              step.active && 'ring-4',
                            )}
                          >
                            {step.active && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                          </div>
                          <span
                            className={cn(
                              'text-[11px] mt-2 font-semibold select-none',
                              step.active ? 'text-foreground font-bold' : 'text-muted-foreground/60',
                            )}
                          >
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* MAIN ACCOUNT VIEW (SCREENSHOT 1 & 2) */
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-foreground pb-1">
                  {t('Account')}
                </h2>

                {/* Profile Header Card */}
                <div className="rounded-xl overflow-hidden border border-border bg-card shadow-xs">
                  <div className="h-24 bg-linear-to-r from-emerald-600 via-teal-600 to-indigo-600 relative">
                    <button
                      type="button"
                      onClick={() => setActiveSection('profiles')}
                      className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/50 hover:bg-black/70 text-white font-semibold text-xs backdrop-blur-md transition-all cursor-pointer"
                    >
                      {t('Edit User Profile')}
                    </button>
                  </div>
                  <div className="px-5 pb-5 pt-0 relative">
                    <div className="flex items-end justify-between -mt-10 mb-3">
                      <div className="relative">
                        <CommunityAvatar
                          name={currentUserName}
                          email={currentUser?.email}
                          imageUrl={currentUser?.imageUrl}
                          size={76}
                          showStatus={false}
                          className="shrink-0 ring-[6px] ring-card rounded-full shadow-lg bg-card"
                        />
                        <div className="absolute bottom-1 right-1 size-5 rounded-full bg-emerald-500 border-2 border-card" />
                      </div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-foreground">{currentUserName}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">
                        {currentUser?.username
                          ? `@${currentUser.username}`
                          : currentUser?.email
                          ? `@${currentUser.email.split('@')[0]}`
                          : ''}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1. Account Info Section (Screenshot 1) */}
                <div id="account-info" className="space-y-3 scroll-mt-4">
                  <h3 className="text-sm font-bold text-foreground">
                    {t('Account Info')}
                  </h3>

                  <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                    {/* Username row */}
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          {t('Username')}
                        </div>
                        <div className="text-xs font-mono font-semibold text-foreground mt-0.5">
                          {currentUser?.username ? `@${currentUser.username}` : `@${suggestedUsername}`}
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setIsEditingUsername(!isEditingUsername)}
                        className="h-8 text-xs font-semibold px-3.5 cursor-pointer"
                      >
                        {isEditingUsername ? t('Batal') : t('Edit')}
                      </Button>
                    </div>

                    {isEditingUsername && (
                      <form onSubmit={handleUsernameSubmit} className="p-4 bg-muted/20 space-y-3">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">@</span>
                          <Input
                            value={editUsernameInput}
                            onChange={(e) =>
                              setEditUsernameInput(
                                e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                              )
                            }
                            placeholder="username_anda"
                            disabled={isUsernameCooldownActive}
                            maxLength={32}
                            className="pl-7 text-xs font-mono h-9 bg-input border-border text-foreground"
                            autoFocus
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">
                            {t('3-32 karakter: huruf kecil, angka, underscore (_).')}
                          </span>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={
                              isUsernameCooldownActive ||
                              isSavingUsername ||
                              !editUsernameInput.trim() ||
                              editUsernameInput.trim() === currentUser?.username
                            }
                            className="h-8 text-xs font-bold"
                          >
                            {isSavingUsername ? t('Menyimpan...') : t('Simpan')}
                          </Button>
                        </div>
                      </form>
                    )}

                    {/* Email row */}
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          {t('Email')}
                        </div>
                        <div className="text-xs font-mono text-foreground mt-0.5 flex items-center gap-2">
                          <span>{isEmailRevealed ? currentUser?.email || 'user@example.com' : maskedEmail}</span>
                          <button
                            type="button"
                            onClick={() => setIsEmailRevealed(!isEmailRevealed)}
                            className="text-primary hover:underline text-[11px] font-semibold cursor-pointer"
                          >
                            {isEmailRevealed ? t('Hide') : t('Reveal')}
                          </button>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setIsEditingEmail(!isEditingEmail)}
                        className="h-8 text-xs font-semibold px-3.5 cursor-pointer"
                      >
                        {isEditingEmail ? t('Batal') : t('Edit')}
                      </Button>
                    </div>

                    {isEditingEmail && (
                      <div className="p-4 bg-muted/20 space-y-2">
                        <Input
                          value={editEmailInput}
                          onChange={(e) => setEditEmailInput(e.target.value)}
                          placeholder="nama@email.com"
                          className="text-xs h-9 bg-input border-border text-foreground"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              toast.success(t('Kode verifikasi telah dikirim ke email baru!'));
                              setIsEditingEmail(false);
                            }}
                            className="h-8 text-xs font-bold"
                          >
                            {t('Kirim Verifikasi')}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Phone Number row */}
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          {t('Phone Number')}
                        </div>
                        <div className="text-xs font-mono text-foreground mt-0.5 flex items-center gap-2">
                          <span>{isPhoneRevealed ? editPhoneInput : maskedPhone}</span>
                          <button
                            type="button"
                            onClick={() => setIsPhoneRevealed(!isPhoneRevealed)}
                            className="text-primary hover:underline text-[11px] font-semibold cursor-pointer"
                          >
                            {isPhoneRevealed ? t('Hide') : t('Reveal')}
                          </button>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setIsEditingPhone(!isEditingPhone)}
                        className="h-8 text-xs font-semibold px-3.5 cursor-pointer"
                      >
                        {isEditingPhone ? t('Batal') : t('Edit')}
                      </Button>
                    </div>

                    {isEditingPhone && (
                      <div className="p-4 bg-muted/20 space-y-2">
                        <Input
                          value={editPhoneInput}
                          onChange={(e) => setEditPhoneInput(e.target.value)}
                          placeholder="+62 812-xxxx-xxxx"
                          className="text-xs h-9 bg-input border-border text-foreground"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              toast.success(t('Nomor telepon berhasil diperbarui!'));
                              setIsEditingPhone(false);
                            }}
                            className="h-8 text-xs font-bold"
                          >
                            {t('Simpan Nomor')}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Password & Security Section (Screenshot 1) */}
                <div id="account-security" className="space-y-3 scroll-mt-4">
                  <h3 className="text-sm font-bold text-foreground">
                    {t('Password & Security')}
                  </h3>

                  <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                    {/* Password row */}
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-semibold text-foreground">
                          {t('Password')}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                          ••••••••••••••••
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setIsEditingPassword(!isEditingPassword)}
                        className="h-8 text-xs font-semibold px-3.5 cursor-pointer"
                      >
                        {isEditingPassword ? t('Batal') : t('Edit')}
                      </Button>
                    </div>

                    {isEditingPassword && (
                      <div className="p-4 bg-muted/20 space-y-3">
                        <Input
                          type="password"
                          placeholder={t('Password Saat Ini')}
                          className="text-xs h-9 bg-input border-border text-foreground"
                        />
                        <Input
                          type="password"
                          placeholder={t('Password Baru')}
                          className="text-xs h-9 bg-input border-border text-foreground"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              toast.success(t('Password berhasil diperbarui!'));
                              setIsEditingPassword(false);
                            }}
                            className="h-8 text-xs font-bold"
                          >
                            {t('Simpan Password Baru')}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Multi-Factor Authentication */}
                    <div
                      onClick={() => toast.info(t('Fitur 2FA Authenticator sedang disiapkan!'))}
                      className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <Key className="w-4 h-4 text-primary" />
                        <div>
                          <div className="text-xs font-semibold text-foreground">
                            {t('Multi-Factor Authentication')}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {t('Amankan akun Anda dengan aplikasi autentikator tambahan.')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground group-hover:text-foreground">
                        <span>{t('Set up')}</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Logged-in Devices */}
                    <div
                      onClick={() => {
                        toast.info(t('4 Perangkat aktif: Windows Desktop App, Chrome Browser, Android App, Web session.'));
                      }}
                      className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <Laptop className="w-4 h-4 text-emerald-500" />
                        <div>
                          <div className="text-xs font-semibold text-foreground">
                            {t('Logged-in Devices')}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {t('Kelola perangkat yang sedang masuk ke akun Anda.')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground group-hover:text-foreground">
                        <span>4 devices</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Account Status Section (Screenshot 2) */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-foreground">
                    {t('Account Status')}
                  </h3>

                  {/* Age Group Alert Banner */}
                  {!isAgeNoticeDismissed && (
                    <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-start gap-3 relative shadow-xs">
                      <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-400" />
                      <div className="text-xs leading-relaxed flex-1">
                        <span>
                          {t(
                            "Age groups determine if you can access content and settings meant for adults. You're in the adult age group (18+), so nothing changes for you.",
                          )}
                        </span>
                        <a
                          href="https://anticeil.com"
                          target="_blank"
                          rel="noreferrer"
                          className="underline ml-1 font-semibold hover:text-blue-300"
                        >
                          {t('Learn more on our blog')}
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAgeNoticeDismissed(true)}
                        className="text-blue-400/70 hover:text-blue-300 p-0.5 cursor-pointer shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                    {/* Age Group */}
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <UserCheck className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="text-xs font-semibold text-foreground">
                            {t('Age Group')}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {t(
                              "You're in the adult age group (18+) and have access to age-restricted content, spaces, and settings.",
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-foreground px-2.5 py-1 bg-muted rounded-md shrink-0">
                        Adult
                      </span>
                    </div>

                    {/* Account Standing link -> opens Standing View */}
                    <div
                      onClick={() => setAccountSubView('standing')}
                      className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <div>
                          <div className="text-xs font-semibold text-foreground">
                            {t('Account Standing')}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {t(
                              "Thank you for upholding Anticeil's Terms of Service and Community Guidelines. If you have a violation, it will appear here.",
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-emerald-500 group-hover:text-emerald-400 shrink-0">
                        <span>{t('All good')}</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Family Center Section (Screenshot 2) */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-foreground">
                    {t('Family Center')}
                  </h3>

                  <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer group shadow-xs">
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-primary" />
                      <div>
                        <div className="text-xs font-semibold text-foreground">
                          {t('Set up Family Center')}
                        </div>
                        <div className="text-[11px] text-muted-foreground leading-relaxed max-w-lg">
                          {t(
                            "Stay informed about your teen's experience on Anticeil. See their activity, manage key safety settings, and start better conversations together.",
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                  </div>
                </div>

                {/* 5. Account Removal / Danger Zone (Screenshot 2) */}
                <div className="space-y-3 pt-2">
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 divide-y divide-destructive/10 overflow-hidden shadow-xs">
                    {/* Disable account */}
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-semibold text-foreground">
                          {t('Disable your account')}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {t('Temporarily disable your account.')}
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => toast.info(t('Akun dapat dinonaktifkan sementara melalui email konfirmasi.'))}
                        className="h-8 text-xs font-semibold border border-border/80"
                      >
                        {t('Disable Account')}
                      </Button>
                    </div>

                    {/* Delete account */}
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-semibold text-destructive">
                          {t('Close your account')}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {t('Permanently close your account.')}
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm(t('Apakah Anda yakin ingin menghapus akun Anticeil secara permanen?'))) {
                            toast.error(t('Permintaan penghapusan akun telah dicatat.'));
                          }
                        }}
                        className="h-8 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-xs"
                      >
                        {t('Delete Account')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ========================================================================= */}
        {/* SECTION: PROFILES (User & Server Profiles)                                */}
        {/* ========================================================================= */}
        {activeSection === 'profiles' && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-foreground pb-1">
              {t('User Profile')}
            </h2>

            <div className="p-4 rounded-xl border border-border bg-card space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  {t('Display Name')}
                </label>
                <form onSubmit={handleDisplayNameSubmit} className="flex gap-2">
                  <Input
                    value={editDisplayNameInput}
                    onChange={(e) => setEditDisplayNameInput(e.target.value)}
                    placeholder={t('Nama Lengkap')}
                    className="text-xs h-9 bg-input border-border text-foreground"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSavingDisplayName || !editDisplayNameInput.trim() || editDisplayNameInput.trim() === currentUserName}
                    className="h-9 text-xs font-bold"
                  >
                    {isSavingDisplayName ? t('Menyimpan...') : t('Simpan')}
                  </Button>
                </form>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  {t('About Me')}
                </label>
                <textarea
                  rows={3}
                  placeholder={t('Tulis bio singkat tentang Anda di sini...')}
                  className="w-full text-xs p-2.5 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  defaultValue="Senior developer & full-stack architect building real-time super apps."
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  {t('Pronouns')}
                </label>
                <Input
                  placeholder="he/him, they/them, dll."
                  defaultValue="he/him"
                  className="text-xs h-9 bg-input border-border text-foreground max-w-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION: DATA & PRIVACY                                                   */}
        {/* ========================================================================= */}
        {activeSection === 'privacy' && (
          <div className="space-y-10">
            {/* ── 1. HOW ANTICEIL USES MY DATA ── */}
            <div id="privacy-how-we-use" className="space-y-5 scroll-mt-4">
              <h2 className="text-lg font-bold text-foreground pb-1">
                {t('Data & Privacy')}
              </h2>

              <div>
                <h3 className="text-base font-bold text-foreground mb-1">
                  {t('How Anticeil Uses My Data')}
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
                  {t('Anticeil perlu menyimpan dan memproses sebagian data untuk memberikan layanan dasar, seperti pesan, colony yang kamu ikuti, dan pesan langsung (DM).')}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                <div className="p-4 space-y-1.5">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Gunakan data untuk membuat Anticeil bekerja')}
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed">
                    {t('Anticeil perlu menyimpan dan memproses data ini agar dapat memberikan layanan dasar.')}
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold text-foreground">
                      {t('Gunakan data untuk meningkatkan Anticeil')}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {t('Izinkan Anticeil menggunakan dan memproses informasi Anda untuk memahami dan meningkatkan layanan.')}
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold text-foreground">
                      {t('Gunakan data untuk mempersonalisasi Anticeil')}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {t('Izinkan Anticeil menggunakan informasi seperti siapa yang Anda ajak bicara untuk mempersonalisasi pengalaman.')}
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="p-4 flex items-center justify-between gap-4">
                  {/* Safe DM scan */}
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-foreground mb-2">
                      {t('Safe Direct Messaging')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                      {t('Otomatis memindai pesan langsung untuk mendeteksi konten eksplisit atau mencurigakan.')}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'safe', label: t('Scan Semua Pesan'), desc: t('Direkomendasikan') },
                        { id: 'friends', label: t('Kecuali Teman'), desc: t('Scan non-teman') },
                        { id: 'none', label: t('Jangan Scan'), desc: t('Matikan filter') },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSafeDirectMessaging(opt.id as any)}
                          className={cn(
                            'p-2.5 rounded-lg border text-left transition-all cursor-pointer',
                            safeDirectMessaging === opt.id
                              ? 'border-primary bg-primary/10 text-primary font-bold'
                              : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50',
                          )}
                        >
                          <div className="text-xs">{opt.label}</div>
                          <div className="text-[10px] opacity-75">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Request data */}
                <div className="p-4">
                  <div className="text-xs font-semibold text-foreground mb-1">
                    {t('Minta data saya')}
                  </div>
                  <div className="text-[11px] text-muted-foreground mb-3">
                    {t('Jika Anda membutuhkan salinan data pribadi dari seluruh riwayat akun Anda, Anda bisa mendapatkannya di sini.')}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 text-xs font-semibold cursor-pointer"
                    onClick={() => toast.success(t('Permintaan data dikirim! Anda akan menerima email konfirmasi.'))}
                  >
                    {t('Minta Data')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* ── 2. PROFILE PRIVACY ── */}
            <div id="privacy-profile" className="space-y-4 scroll-mt-4">
              <div>
                <h3 className="text-base font-bold text-foreground mb-1">
                  {t('Profile Privacy')}
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {t('Kontrol siapa yang dapat melihat profil Anda — termasuk bio dan akun yang terhubung.')}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                <div className="p-4 space-y-3">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Bagikan profil penuh saya dengan')}
                  </div>
                  <div className="space-y-2">
                    {[
                      {
                        id: 'all',
                        label: t('Teman & Semua Colony'),
                        desc: t('Profil lengkap Anda terlihat oleh teman dan colony mana pun yang Anda ikuti.'),
                      },
                      {
                        id: 'small',
                        label: t('Teman & Colony Kecil Saja'),
                        desc: t('Profil lengkap terlihat oleh teman dan colony dengan 200 anggota atau lebih sedikit.'),
                      },
                      {
                        id: 'friends',
                        label: t('Teman Saja'),
                        desc: t('Profil lengkap hanya terlihat oleh teman. Orang lain melihat versi terbatas.'),
                      },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
                      >
                        <input
                          type="radio"
                          name="profile-visibility"
                          defaultChecked={opt.id === 'all'}
                          className="mt-0.5 accent-primary shrink-0"
                        />
                        <div>
                          <div className="text-xs font-semibold text-foreground">{opt.label}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{opt.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold text-foreground">
                      {t('Bagikan saat saya memperbarui profil')}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {t('Izinkan teman menerima notifikasi push saat Anda memperbarui profil.')}
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* ── 3. VOICE END-TO-END ENCRYPTION ── */}
            <div id="privacy-e2e" className="space-y-4 scroll-mt-4">
              <div>
                <h3 className="text-base font-bold text-foreground mb-1">
                  {t('Voice End-to-end Encryption')}
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {t('Enkripsi end-to-end memastikan hanya peserta yang dapat mendengar audio dalam panggilan voice.')}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                <div className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold text-foreground">
                      {t('Aktifkan kode verifikasi persisten')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                      {t('Memberi perangkat saat ini kode verifikasi persisten. Jika aktif, teman hanya perlu memverifikasi perangkat Anda sekali, bukan setiap kali Anda bergabung ke panggilan voice.')}
                    </div>
                  </div>
                  <Switch />
                </div>

                <div className="p-4 space-y-2">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Tentang Voice E2EE')}
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed">
                    {t('Saat diaktifkan, semua peserta panggilan dapat memverifikasi kode keamanan bersama. Ini memastikan tidak ada yang dapat menyadap percakapan, bahkan Anticeil sekalipun.')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION: MESSAGING PERMISSIONS                                            */}
        {/* ========================================================================= */}
        {activeSection === 'permissions' && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-foreground pb-1">
              {t('Messaging Permissions')}
            </h2>

            <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
              <div className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    {t('Izinkan Pesan Langsung dari Anggota Colony')}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {t('Anggota colony tempat Anda bergabung dapat mengirimi Anda DM.')}
                  </div>
                </div>
                <Switch
                  checked={allowDmsFromServerMembers}
                  onCheckedChange={setAllowDmsFromServerMembers}
                />
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    {t('Siapa yang Dapat Menambahkan Anda Sebagai Teman')}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {t('Kontrol siapa saja yang dapat mengirim permintaan pertemanan.')}
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { key: 'everyone', label: t('Semua Orang (Everyone)') },
                    { key: 'friendsOfFriends', label: t('Teman dari Teman') },
                    { key: 'serverMembers', label: t('Anggota Colony Bersama') },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-1">
                      <span className="text-xs text-foreground font-medium">{item.label}</span>
                      <Switch
                        checked={(allowFriendRequestsFrom as any)[item.key]}
                        onCheckedChange={(val) =>
                          setAllowFriendRequestsFrom((prev) => ({ ...prev, [item.key]: val }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION: NOTIFICATIONS                                                    */}
        {/* ========================================================================= */}
        {activeSection === 'notifications' && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-foreground pb-1">
              {t('Notifications')}
            </h2>

            <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
              <div className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    {t('Aktifkan Notifikasi Desktop')}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {t('Menerima pop-up notifikasi saat ada mention atau pesan baru.')}
                  </div>
                </div>
                <Switch
                  checked={enableDesktopNotifications}
                  onCheckedChange={setEnableDesktopNotifications}
                />
              </div>

              <div className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    {t('Suara Notifikasi')}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {t('Memutar efek suara saat menerima pesan atau bergabung ke voice call.')}
                  </div>
                </div>
                <Switch
                  checked={enableNotificationSounds}
                  onCheckedChange={setEnableNotificationSounds}
                />
              </div>

              <div className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    {t('Badge Pesan Belum Dibaca')}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {t('Tampilkan angka merah notifikasi di ikon aplikasi taskbar.')}
                  </div>
                </div>
                <Switch
                  checked={enableUnreadBadges}
                  onCheckedChange={setEnableUnreadBadges}
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION: NITRO (BILLING PERKS)                                            */}
        {/* ========================================================================= */}
        {activeSection === 'nitro' && (
          <div className="space-y-5">
            <div className="rounded-2xl p-6 bg-linear-to-br from-indigo-900 via-purple-900 to-pink-900 border border-purple-500/30 text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10 max-w-md space-y-3">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-wider">
                  ANTICEIL NITRO
                </span>
                <h3 className="text-2xl font-black tracking-tight">
                  Unleash the full Anticeil Experience
                </h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  Streaming 4K 60FPS, unggah file hingga 500MB, custom emoji di mana saja, 2 Gratis Server Boost, dan badge profil eksklusif.
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <Button
                    size="sm"
                    onClick={() => toast.success('Selamat! Akun Anda telah diaktifkan ke Nitro Preview!')}
                    className="bg-white hover:bg-white/90 text-purple-950 font-bold text-xs shadow-lg cursor-pointer"
                  >
                    Mulai Nitro (Diskon 50%)
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: 'Upload File 500MB', desc: 'Bebas kirim video beresolusi tinggi dan dokumen zip besar.' },
                { title: 'Custom Emoji Di Mana Saja', desc: 'Gunakan emoji dari colony mana pun di seluruh chat & DM.' },
                { title: 'HD 4K Video Streaming', desc: 'Screen share jernih untuk gaming, coding, dan nonton bareng.' },
                { title: '2 Gratis Colony Boosts', desc: 'Dukung colony favorit Anda untuk membuka level perks.' },
              ].map((perk, i) => (
                <div key={i} className="p-4 rounded-xl border border-border bg-card shadow-xs">
                  <div className="text-xs font-bold text-foreground">{perk.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{perk.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION: SERVER BOOST                                                     */}
        {/* ========================================================================= */}
        {activeSection === 'boost' && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-foreground pb-1">
              {t('Colony Boost')}
            </h2>
            <div className="p-5 rounded-xl border border-border bg-card space-y-3 shadow-xs">
              <div className="flex items-center gap-3">
                <Gem className="w-5 h-5 text-pink-500" />
                <div>
                  <div className="text-xs font-bold text-foreground">
                    {t('Boost Status: 2 Aktif')}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {t('Anda memiliki 2 colony boost yang siap digunakan pada komunitas favorit.')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION: SUBSCRIPTIONS, GIFTS, BILLING                                     */}
        {/* ========================================================================= */}
        {(activeSection === 'subscriptions' || activeSection === 'gifts' || activeSection === 'billing') && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-foreground capitalize pb-1">
              {activeSection}
            </h2>
            <div className="p-6 rounded-xl border border-dashed border-border bg-card text-center space-y-2">
              <Receipt className="w-8 h-8 text-muted-foreground/50 mx-auto" />
              <div className="text-xs font-semibold text-foreground">
                {t('Belum ada transaksi')}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {t('Riwayat langganan dan bukti pembayaran akan tersimpan secara otomatis di sini.')}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION: VOICE & VIDEO                                                    */}
        {/* ========================================================================= */}
        {activeSection === 'voice' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-foreground pb-1">
              {t('Voice & Video')}
            </h2>

            {/* Input & Output Devices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border bg-card space-y-2 shadow-xs">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  {t('Perangkat Input (Mikrofon)')}
                </label>
                <select
                  value={settings.inputDeviceId}
                  onChange={(e) => updateSetting('inputDeviceId', e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg bg-input border border-border text-foreground outline-none"
                >
                  {audioInputDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Microphone (${d.deviceId.slice(0, 5)})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-2 shadow-xs">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  {t('Perangkat Output (Speaker / Headphone)')}
                </label>
                <select
                  value={settings.outputDeviceId}
                  onChange={(e) => updateSetting('outputDeviceId', e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg bg-input border border-border text-foreground outline-none"
                >
                  {audioOutputDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Speaker (${d.deviceId.slice(0, 5)})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mic Test Bar */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Tes Mikrofon')}</div>
                  <div className="text-[11px] text-muted-foreground">{t('Periksa apakah suara Anda terdengar jelas.')}</div>
                </div>
                <Button
                  size="sm"
                  variant={isMicTesting ? 'destructive' : 'secondary'}
                  onClick={isMicTesting ? stopMicTest : startMicTest}
                  className="h-8 text-xs font-semibold"
                >
                  {isMicTesting ? t('Hentikan Tes') : t('Coba Tes Suara')}
                </Button>
              </div>

              <div className="w-full h-3 bg-muted rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-linear-to-r from-emerald-500 via-teal-400 to-indigo-500 transition-all duration-75"
                  style={{ width: `${isMicTesting ? Math.min(100, micVolumeLevel * 100) : 0}%` }}
                />
              </div>
            </div>

            {/* Noise Suppression Krisp */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-2 shadow-xs">
              <div className="text-xs font-bold text-foreground">{t('Peredam Bising (Noise Suppression)')}</div>
              <div className="text-[11px] text-muted-foreground">{t('Menghilangkan suara kipas, ketikan keyboard, dan kebisingan latar.')}</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                {[
                  { id: 'krisp', label: 'Krisp AI', desc: 'Paling Jernih' },
                  { id: 'standard', label: 'Standard', desc: 'Filter Dasar' },
                  { id: 'none', label: 'None', desc: 'Raw Audio' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateSetting('noiseSuppression', opt.id as NoiseSuppressionType)}
                    className={cn(
                      'p-2.5 rounded-lg border text-left transition-all cursor-pointer',
                      settings.noiseSuppression === opt.id
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50',
                    )}
                  >
                    <div className="text-xs">{opt.label}</div>
                    <div className="text-[10px] opacity-75">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION: APPEARANCE                                                       */}
        {/* ========================================================================= */}
        {activeSection === 'appearance' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-foreground pb-1">
              {t('Appearance')}
            </h2>

            <div className="p-5 rounded-xl border border-border bg-card space-y-4 shadow-xs">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  {t('Tema')}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('Pilih tema tampilan favorit Anda.')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'dark', label: t('Dark'), icon: <Moon className="w-5 h-5 text-indigo-400" /> },
                  { id: 'light', label: t('Light'), icon: <Sun className="w-5 h-5 text-amber-500" /> },
                  { id: 'system', label: t('System'), icon: <Laptop className="w-5 h-5 text-muted-foreground" /> },
                ].map((th) => {
                  const isSelected = theme === th.id;
                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setTheme(th.id)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all cursor-pointer',
                        isSelected
                          ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/20 font-bold'
                          : 'border-border bg-card hover:bg-muted/40 text-muted-foreground',
                      )}
                    >
                      {th.icon}
                      <span className="text-xs">{th.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION: KEYBINDS                                                         */}
        {/* ========================================================================= */}
        {activeSection === 'keybinds' && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-foreground pb-1">
              {t('Keybinds')}
            </h2>
            <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
              {[
                { action: t('Toggle Mute Mikrofon'), key: 'Ctrl + Shift + M' },
                { action: t('Toggle Kamera'), key: 'Ctrl + Shift + V' },
                { action: t('Cari Percakapan / Quick Switcher'), key: 'Ctrl + K' },
                { action: t('Buka Pengaturan'), key: 'Ctrl + ,' },
              ].map((kb, i) => (
                <div key={i} className="p-3.5 flex items-center justify-between">
                  <span className="text-xs text-foreground font-medium">{kb.action}</span>
                  <kbd className="px-2.5 py-1 text-[11px] font-mono font-bold bg-muted border border-border rounded-md text-foreground">
                    {kb.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </TwoPaneSettingsDialog>
  );
}
