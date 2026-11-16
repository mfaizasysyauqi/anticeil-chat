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
  Ban,
  Gamepad2,
  Globe,
  Link2,
  ChevronDown,
  Heart,
  Smile,
  Upload,
  MonitorPlay,
  Tv,
  Flame,
  Play,
  Star,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { TwoPaneSettingsDialog, SettingsNavGroup } from '@/components/ui/two-pane-settings-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { isE2eeEnabled, setE2eeEnabled } from '@/lib/e2ee';
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
  const [e2eeActive, setE2eeActive] = useState(() => isE2eeEnabled());

  const handleToggleE2ee = (checked: boolean) => {
    setE2eeActive(checked);
    setE2eeEnabled(checked);
    if (checked) {
      toast.success(t('E2EE Diaktifkan'), {
        description: t('Pesan chat dan sesi percakapan kini dienkripsi end-to-end secara lokal.'),
      });
    } else {
      toast.info(t('E2EE Dinonaktifkan'));
    }
  };
  const [allowDmsFromServerMembers, setAllowDmsFromServerMembers] = useState(true);
  const [allowFriendRequestsFrom, setAllowFriendRequestsFrom] = useState({
    everyone: true,
    friendsOfFriends: true,
    serverMembers: true,
  });
  // Messaging Permissions State (Discord Parity)
  const [contentFilterTab, setContentFilterTab] = useState<'mature' | 'graphic'>('mature');
  const [contentFilterSettings, setContentFilterSettings] = useState({
    mature: {
      friends: 'show',
      others: 'block',
      server: 'show',
    },
    graphic: {
      friends: 'show',
      others: 'block',
      server: 'show',
    },
  });
  const [allowAgeRestrictedCommands, setAllowAgeRestrictedCommands] = useState(false);
  const [allowAgeRestrictedIos, setAllowAgeRestrictedIos] = useState(false);
  const [spamFilterOption, setSpamFilterOption] = useState<'all' | 'non-friends' | 'none'>('non-friends');
  const [enableMessageRequests, setEnableMessageRequests] = useState(true);
  const [showPersonalizedFriendRequests, setShowPersonalizedFriendRequests] = useState(true);
  const [allowGameDmsAndInvites, setAllowGameDmsAndInvites] = useState(true);
  const [gameDmsVisibility, setGameDmsVisibility] = useState<'all' | 'game-players' | 'none'>('all');
  const [enableDesktopNotifications, setEnableDesktopNotifications] = useState(true);
  const [enableTaskbarFlashing, setEnableTaskbarFlashing] = useState(true);
  const [notifyStreaming, setNotifyStreaming] = useState(true);
  const [notifyAnniversary, setNotifyAnniversary] = useState(true);
  const [notifyFriendsOnline, setNotifyFriendsOnline] = useState(true);
  const [notifyProfileUpdates, setNotifyProfileUpdates] = useState(true);
  const [notifyReactions, setNotifyReactions] = useState<'all' | 'my-messages' | 'never'>('all');

  const [soundNewMessage, setSoundNewMessage] = useState(true);
  const [soundCurrentChannel, setSoundCurrentChannel] = useState(false);
  const [soundIncomingRing, setSoundIncomingRing] = useState(true);
  const [disableAllSounds, setDisableAllSounds] = useState(false);

  const [enableUnreadBadges, setEnableUnreadBadges] = useState(true);

  const [emailCommunication, setEmailCommunication] = useState(true);
  const [emailSocial, setEmailSocial] = useState(true);
  const [emailAnnouncements, setEmailAnnouncements] = useState(false);
  const [emailTips, setEmailTips] = useState(false);
  const [emailRecommendations, setEmailRecommendations] = useState(false);

  const [showAdvancedNotifications, setShowAdvancedNotifications] = useState(false);
  const [mobileTimeout, setMobileTimeout] = useState('10m');
  const [ttsNotifications, setTtsNotifications] = useState('never');
  const [allowTtsCommand, setAllowTtsCommand] = useState(true);

  const playPreviewSound = (type: 'message' | 'ring') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === 'ring') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.18);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      }
      toast.success(t('Efek suara diputar'));
    } catch {
      toast.info(t('Efek suara preview'));
    }
  };

  // Colony Boost State (Discord Parity)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [boostedColonies, setBoostedColonies] = useState<{ [id: string]: number }>({
    c1: 0,
    c2: 2,
    c3: 6,
  });

  // Gift & Billing State (Discord Parity)
  const [redeemCodeInput, setRedeemCodeInput] = useState('');
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<
    { id: string; name: string; type: string; details: string; isDefault: boolean }[]
  >([]);

  const handleRedeemCode = () => {
    if (!redeemCodeInput.trim()) {
      toast.error(t('Masukkan kode hadiah terlebih dahulu'));
      return;
    }
    const code = redeemCodeInput.trim().toUpperCase();
    if (code.startsWith('WUMP') || code.startsWith('NECTAR') || code.length >= 8) {
      toast.success(t('Kode hadiah berhasil diklaim! 1 Bulan Nectar telah ditambahkan ke akun Anda. 🎉'));
      setRedeemCodeInput('');
    } else {
      toast.error(t('Kode hadiah tidak valid atau telah kedaluwarsa'));
    }
  };

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
        {
          id: 'account',
          label: t('Account'),
          icon: <User className="w-4 h-4" />,
          subItems: [
            { id: 'account-profile', label: t('User Profile') },
            { id: 'account-info', label: t('Account Info') },
            { id: 'account-security', label: t('Password & Security') },
            { id: 'account-status', label: t('Account Status') },
            { id: 'account-family', label: t('Family Center') },
          ],
        },
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
        {
          id: 'permissions',
          label: t('Messaging Permissions'),
          icon: <ShieldAlert className="w-4 h-4" />,
          subItems: [
            { id: 'permissions-content-filters', label: t('Content Filters') },
            { id: 'permissions-spam-filters', label: t('Spam Filters') },
            { id: 'permissions-direct-messages', label: t('Direct Messages') },
            { id: 'permissions-friend-requests', label: t('Friend Requests') },
            { id: 'permissions-connected-games', label: t('Connected Games') },
          ],
        },
        {
          id: 'notifications',
          label: t('Notifications'),
          icon: <Bell className="w-4 h-4" />,
          subItems: [
            { id: 'notifications-overview', label: t('Overview') },
            { id: 'notifications-sounds', label: t('Sounds') },
            { id: 'notifications-badges', label: t('Badges') },
            { id: 'notifications-email', label: t('Email') },
            { id: 'notifications-advanced', label: t('Advanced') },
          ],
        },
      ],
    },
    {
      key: 'BILLING_SETTINGS',
      title: t('Billing Settings'),
      items: [
        {
          id: 'nitro',
          label: 'Nectar & Pollen',
          icon: <Zap className="w-4 h-4 text-amber-400" />,
          badge: (
            <span className="text-[9px] font-black uppercase tracking-wider bg-linear-to-r from-amber-500 to-rose-500 text-white px-1.5 py-0.5 rounded-full shadow-xs">
              DISCOUNT
            </span>
          ),
        },
        { id: 'boost', label: t('Colony Boost'), icon: <Gem className="w-4 h-4 text-pink-400" /> },
        { id: 'subscriptions', label: t('Subscriptions'), icon: <CreditCard className="w-4 h-4" /> },
        {
          id: 'gifts',
          label: t('Gift Inventory'),
          icon: <Gift className="w-4 h-4" />,
          subItems: [
            { id: 'gift-redeem-codes', label: t('Redeem Codes') },
            { id: 'gift-gifting-badge', label: t('The Gifting Badge') },
            { id: 'gift-purchased', label: t('Gifts I Purchased') },
          ],
        },
        {
          id: 'billing',
          label: t('Billing'),
          icon: <Receipt className="w-4 h-4" />,
          subItems: [
            { id: 'billing-payment-methods', label: t('Payment Methods') },
            { id: 'billing-transaction-history', label: t('Transaction History') },
          ],
        },
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
                onClick={() => { setActiveSection('account'); setTimeout(() => { document.getElementById('account-profile')?.scrollIntoView({ behavior: 'smooth' }); }, 80); }}
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

                {/* Profile Header & Customization Card (Merged with Profiles) */}
                <div id="account-profile" className="space-y-3 scroll-mt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground">
                      {t('User Profile')}
                    </h3>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-border bg-card shadow-xs">
                    <div className="h-24 bg-linear-to-r from-emerald-600 via-teal-600 to-indigo-600 relative">
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('profile-edit-form');
                          el?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="absolute top-3 right-3 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
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

                    {/* Integrated Profile Customization Form */}
                    <div id="profile-edit-form" className="border-t border-border/70 p-5 bg-card/60 space-y-4">
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
                            className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
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
                          rows={2}
                          placeholder={t('Tulis bio singkat tentang Anda di sini...')}
                          className="w-full text-xs p-2.5 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          defaultValue="Anticeil user building real-time community colonies."
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
                            className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
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
                            className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
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
                            className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
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
                <div id="account-status" className="space-y-3 scroll-mt-4">
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
                <div id="account-family" className="space-y-3 scroll-mt-4">
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

            {/* ── 3. END-TO-END ENCRYPTION (E2EE) ── */}
            <div id="privacy-e2e" className="space-y-4 scroll-mt-4">
              <div>
                <h3 className="text-base font-bold text-foreground mb-1">
                  {t('End-to-End Encryption (E2EE)')}
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {t('Enkripsi end-to-end memastikan pesan teks dan panggilan audio hanya dapat dibaca atau didengar oleh peserta, bukan oleh server Anticeil.')}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                <div className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold text-foreground">
                      {t('Aktifkan Pesan Terenkripsi (E2EE)')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                      {t('Setiap pesan dienkripsi secara lokal di perangkat Anda menggunakan AES-256-GCM sebelum dikirim ke server. Server hanya menyimpan teks sandi acak.')}
                    </div>
                  </div>
                  <Switch checked={e2eeActive} onCheckedChange={handleToggleE2ee} />
                </div>

                <div className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold text-foreground">
                      {t('Aktifkan kode verifikasi persisten')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                      {t('Memberi perangkat saat ini kode verifikasi persisten untuk panggilan audio terenkripsi.')}
                    </div>
                  </div>
                  <Switch defaultChecked />
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
          <div className="space-y-8 pb-8">
            {/* ── 1. CONTENT FILTERS ── */}
            <div id="permissions-content-filters" className="space-y-4 scroll-mt-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {t('Content Filters')}
                </h2>
                <div className="mt-3 space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t('Sensitive content filters')}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t("Choose how you want to see image-based media detected by Anticeil's sensitive content filters.")}{' '}
                    <button
                      type="button"
                      onClick={() => toast.info(t('Filter mendeteksi media berorientasi dewasa atau kekerasan dan dapat memburamkan atau memblokirnya.'))}
                      className="text-primary hover:underline font-medium inline cursor-pointer"
                    >
                      {t('Learn more')}
                    </button>
                  </p>
                </div>
              </div>

              {/* Two-part layout: Left tabs (Mature Sexual Media / Graphic Media), Right filter controls */}
              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs flex flex-col md:flex-row">
                <div className="w-full md:w-56 p-2 bg-muted/20 border-b md:border-b-0 md:border-r border-border/70 flex md:flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setContentFilterTab('mature')}
                    className={cn(
                      'relative w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between',
                      contentFilterTab === 'mature'
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                    )}
                  >
                    {contentFilterTab === 'mature' && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r" />
                    )}
                    <span>{t('Mature Sexual Media')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setContentFilterTab('graphic')}
                    className={cn(
                      'relative w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between',
                      contentFilterTab === 'graphic'
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                    )}
                  >
                    {contentFilterTab === 'graphic' && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r" />
                    )}
                    <span>{t('Graphic Media')}</span>
                  </button>
                </div>

                <div className="flex-1 p-4 space-y-3.5 bg-card">
                  {[
                    {
                      key: 'friends' as const,
                      label: t('Direct messages from friends'),
                    },
                    {
                      key: 'others' as const,
                      label: t('Direct messages from others'),
                    },
                    {
                      key: 'server' as const,
                      label: t('Messages in server channels'),
                    },
                  ].map((target) => {
                    const currentVal = contentFilterSettings[contentFilterTab][target.key];
                    return (
                      <div
                        key={target.key}
                        className="flex items-center justify-between gap-4 py-1"
                      >
                        <span className="text-xs font-medium text-foreground">
                          {target.label}
                        </span>
                        <div className="w-32 shrink-0">
                          <Select
                            value={currentVal}
                            onValueChange={(val: any) =>
                              setContentFilterSettings((prev) => ({
                                ...prev,
                                [contentFilterTab]: {
                                  ...prev[contentFilterTab],
                                  [target.key]: val,
                                },
                              }))
                            }
                          >
                            <SelectTrigger size="sm" className="h-8 text-xs font-semibold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="show">
                                <span className="flex items-center gap-1.5">
                                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span>{t('Show')}</span>
                                </span>
                              </SelectItem>
                              <SelectItem value="blur">
                                <span className="flex items-center gap-1.5">
                                  <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                                  <span>{t('Blur')}</span>
                                </span>
                              </SelectItem>
                              <SelectItem value="block">
                                <span className="flex items-center gap-1.5">
                                  <Ban className="w-3.5 h-3.5 text-rose-500" />
                                  <span>{t('Block')}</span>
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explanatory note below filter card */}
              <p className="text-[11px] text-muted-foreground leading-relaxed px-1">
                {contentFilterTab === 'mature'
                  ? t('Helps detect image-based media that may contain sexually explicit or suggestive material involving adults.')
                  : t('Helps detect image-based media that may contain gore, intense violence, or disturbing visual content.')}
              </p>

              {/* Age restricted toggles */}
              <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Allow access to age-restricted commands from apps in DMs')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      {t('Allows people 18+ to access commands marked as age-restricted in DMs. Applies to all apps.')}
                    </div>
                  </div>
                  <Switch
                    checked={allowAgeRestrictedCommands}
                    onCheckedChange={setAllowAgeRestrictedCommands}
                  />
                </div>

                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Allow access to age-restricted servers on iOS')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      {t('Access age-restricted servers (18+) on iOS devices, after joining them on desktop.')}
                    </div>
                  </div>
                  <Switch
                    checked={allowAgeRestrictedIos}
                    onCheckedChange={setAllowAgeRestrictedIos}
                  />
                </div>
              </div>

              {/* Related Settings card */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Related Settings')}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSection('appearance')}
                  className="w-full p-3.5 rounded-xl border border-border bg-card/60 hover:bg-card hover:border-primary/40 flex items-center justify-between text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted text-foreground group-hover:text-primary transition-colors">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        {t('Appearance')}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {t('Show/hide media in chat, spoiler content')}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* ── 2. SPAM FILTERS ── */}
            <div id="permissions-spam-filters" className="space-y-4 scroll-mt-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {t('Spam Filters')}
                </h2>
                <div className="mt-2 space-y-0.5">
                  <h3 className="text-xs font-semibold text-foreground">
                    {t('Automatically filter suspected spam messages')}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('Anticeil can filter out some messages that contain spam. These messages go to your Spam inbox.')}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                {[
                  {
                    id: 'all' as const,
                    label: t('Filter all spam'),
                  },
                  {
                    id: 'non-friends' as const,
                    label: t('Filter messages from non-friends (Recommended)'),
                  },
                  {
                    id: 'none' as const,
                    label: t("Don't filter spam"),
                  },
                ].map((opt) => {
                  const isSelected = spamFilterOption === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSpamFilterOption(opt.id)}
                      className={cn(
                        'w-full p-4 flex items-center gap-3 text-left transition-colors cursor-pointer',
                        isSelected ? 'bg-primary/5' : 'hover:bg-muted/40'
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all',
                          isSelected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground/40'
                        )}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-background" />}
                      </div>
                      <span className={cn('text-xs', isSelected ? 'font-bold text-foreground' : 'text-foreground/90 font-medium')}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* ── 3. DIRECT MESSAGE (DM) PERMISSIONS ── */}
            <div id="permissions-direct-messages" className="space-y-4 scroll-mt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-foreground">
                  {t('Direct Message (DM) Permissions')}
                </h2>

                {/* Colony / Server Scope Selector */}
                <button
                  type="button"
                  onClick={() => toast.info(t('Pengaturan ini berlaku secara global untuk seluruh colony Anda.'))}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors cursor-pointer w-fit"
                >
                  <Globe className="w-3.5 h-3.5 text-primary" />
                  <span>{t('All servers / colonies')}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1" />
                </button>
              </div>

              <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Direct Messages')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      {t('Allow DMs from other server members')}
                    </div>
                  </div>
                  <Switch
                    checked={allowDmsFromServerMembers}
                    onCheckedChange={setAllowDmsFromServerMembers}
                  />
                </div>

                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Message requests')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      {t('Filter messages from server members you may not know.')}{' '}
                      <button
                        type="button"
                        onClick={() => toast.info(t('Pesan dari pengguna di luar daftar teman akan masuk ke Permintaan Pesan terlebih dahulu.'))}
                        className="text-primary hover:underline font-medium inline cursor-pointer"
                      >
                        {t('Learn more')}
                      </button>
                    </div>
                  </div>
                  <Switch
                    checked={enableMessageRequests}
                    onCheckedChange={setEnableMessageRequests}
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* ── 4. FRIEND REQUEST PERMISSIONS ── */}
            <div id="permissions-friend-requests" className="space-y-4 scroll-mt-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {t('Friend Request Permissions')}
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  {t('Control who can send you friend requests and how they appear.')}
                </p>
              </div>

              <div className="space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Allow Friend Requests from...')}
                </div>

                <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                  {[
                    {
                      key: 'everyone' as const,
                      label: t('Everyone'),
                      desc: null,
                    },
                    {
                      key: 'friendsOfFriends' as const,
                      label: t('Friend of friends'),
                      desc: null,
                    },
                    {
                      key: 'serverMembers' as const,
                      label: t('Server members'),
                      desc: t('Server members can only send you friend requests from servers where you also allow Direct Messages.'),
                    },
                  ].map((item) => (
                    <div key={item.key} className="p-4 flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-foreground">
                          {item.label}
                        </div>
                        {item.desc && (
                          <div className="text-[11px] text-muted-foreground leading-relaxed">
                            {item.desc}
                          </div>
                        )}
                      </div>
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

              {/* Show personalized messages */}
              <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4 shadow-xs">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Show personalized messages')}
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed">
                    {t('Show personalized messages on incoming friend requests. If you accept, the message will still appear in your DMs.')}
                  </div>
                </div>
                <Switch
                  checked={showPersonalizedFriendRequests}
                  onCheckedChange={setShowPersonalizedFriendRequests}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* ── 5. MESSAGING IN CONNECTED GAMES ── */}
            <div id="permissions-connected-games" className="space-y-4 scroll-mt-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {t('Messaging in Connected Games')}
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    {t('These are settings for games like Neverness to Everness that use Anticeil to power their social experiences.')}
                  </p>
                </div>
                {/* Game badge icon */}
                <div className="size-11 rounded-2xl bg-linear-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-primary/30 flex items-center justify-center text-primary shadow-xs shrink-0">
                  <Gamepad2 className="w-5 h-5" />
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4 shadow-xs">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Allow friends from games to send direct messages and invites')}
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed">
                    {t("Let friends from connected games send DMs and invite me to play games, even when the game we play isn't open.")}
                  </div>
                </div>
                <Switch
                  checked={allowGameDmsAndInvites}
                  onCheckedChange={setAllowGameDmsAndInvites}
                />
              </div>

              {/* Show Direct Messages in games */}
              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
                <div className="p-4 border-b border-border/60">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Show Direct Messages in games')}
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                    {t('Read and respond to DMs directly from game chats.')}
                  </div>
                </div>

                <div className="divide-y divide-border/60">
                  {[
                    {
                      id: 'all' as const,
                      label: t('Show all DMs'),
                    },
                    {
                      id: 'game-players' as const,
                      label: t('Show only DMs from people who also play the game'),
                    },
                    {
                      id: 'none' as const,
                      label: t("Don't show any DMs"),
                    },
                  ].map((opt) => {
                    const isSelected = gameDmsVisibility === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setGameDmsVisibility(opt.id)}
                        className={cn(
                          'w-full p-3.5 flex items-center gap-3 text-left transition-colors cursor-pointer',
                          isSelected ? 'bg-primary/5' : 'hover:bg-muted/40'
                        )}
                      >
                        <div
                          className={cn(
                            'w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all',
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-muted-foreground/40'
                          )}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-background" />}
                        </div>
                        <span className={cn('text-xs', isSelected ? 'font-bold text-foreground' : 'text-foreground/90 font-medium')}>
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Related Settings card */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Related Settings')}
                </div>
                <button
                  type="button"
                  onClick={() => toast.info(t('Belum ada game atau aplikasi eksternal yang diotorisasi.'))}
                  className="w-full p-3.5 rounded-xl border border-border bg-card/60 hover:bg-card hover:border-primary/40 flex items-center justify-between text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted text-foreground group-hover:text-primary transition-colors">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        {t('Authorized Apps')}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {t('Manage your games in Authorized Apps')}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION: NOTIFICATIONS                                                    */}
        {/* ========================================================================= */}
        {activeSection === 'notifications' && (
          <div className="space-y-8 pb-8">
            {/* ── 1. OVERVIEW ── */}
            <div id="notifications-overview" className="space-y-4 scroll-mt-4">
              <h2 className="text-xl font-bold text-foreground">
                {t('Overview')}
              </h2>

              <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Enable Desktop Notifications')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      {t("If you're looking for per-channel or per-server notifications, right-click the desired server icon and select Notification Settings.")}
                    </div>
                  </div>
                  <Switch
                    checked={enableDesktopNotifications}
                    onCheckedChange={setEnableDesktopNotifications}
                  />
                </div>

                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Enable Taskbar Flashing')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      {t('Flashes the app in your taskbar when you have new notifications.')}
                    </div>
                  </div>
                  <Switch
                    checked={enableTaskbarFlashing}
                    onCheckedChange={setEnableTaskbarFlashing}
                  />
                </div>
              </div>

              {/* Notify me when... */}
              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Notify me when...')}
                </div>

                <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                  <div className="p-4 flex items-center justify-between gap-4">
                    <span className="text-xs font-medium text-foreground">
                      {t('People I know start streaming in small servers')}
                    </span>
                    <Switch
                      checked={notifyStreaming}
                      onCheckedChange={setNotifyStreaming}
                    />
                  </div>

                  <div className="p-4 flex items-center justify-between gap-4">
                    <span className="text-xs font-medium text-foreground">
                      {t('A friend and I reach a friendship anniversary')}
                    </span>
                    <Switch
                      checked={notifyAnniversary}
                      onCheckedChange={setNotifyAnniversary}
                    />
                  </div>

                  <div className="p-4 flex items-center justify-between gap-4">
                    <span className="text-xs font-medium text-foreground">
                      {t('Friends come online')}
                    </span>
                    <Switch
                      checked={notifyFriendsOnline}
                      onCheckedChange={setNotifyFriendsOnline}
                    />
                  </div>

                  <div className="p-4 flex items-center justify-between gap-4">
                    <span className="text-xs font-medium text-foreground">
                      {t('Friends update their profile')}
                    </span>
                    <Switch
                      checked={notifyProfileUpdates}
                      onCheckedChange={setNotifyProfileUpdates}
                    />
                  </div>

                  <div className="p-4 flex items-center justify-between gap-4">
                    <span className="text-xs font-medium text-foreground">
                      {t('Someone reacts to my messages')}
                    </span>
                    <div className="w-40 shrink-0">
                      <Select
                        value={notifyReactions}
                        onValueChange={(val: any) => setNotifyReactions(val)}
                      >
                        <SelectTrigger size="sm" className="h-8 text-xs font-semibold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            <span>{t('All Messages')}</span>
                          </SelectItem>
                          <SelectItem value="my-messages">
                            <span>{t('Only for Messages I Send')}</span>
                          </SelectItem>
                          <SelectItem value="never">
                            <span>{t('Never')}</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* ── 2. SOUNDS ── */}
            <div id="notifications-sounds" className="space-y-4 scroll-mt-4">
              <h2 className="text-xl font-bold text-foreground">
                {t('Sounds')}
              </h2>

              <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-foreground">
                      {t('New Message')}
                    </div>
                    <button
                      type="button"
                      onClick={() => playPreviewSound('message')}
                      className="text-[11px] text-primary hover:underline font-semibold cursor-pointer block"
                    >
                      {t('Preview Sound')}
                    </button>
                  </div>
                  <Switch
                    checked={!disableAllSounds && soundNewMessage}
                    disabled={disableAllSounds}
                    onCheckedChange={setSoundNewMessage}
                  />
                </div>

                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-foreground">
                      {t("New Message in the channel I'm currently reading")}
                    </div>
                    <button
                      type="button"
                      onClick={() => playPreviewSound('message')}
                      className="text-[11px] text-primary hover:underline font-semibold cursor-pointer block"
                    >
                      {t('Preview Sound')}
                    </button>
                  </div>
                  <Switch
                    checked={!disableAllSounds && soundCurrentChannel}
                    disabled={disableAllSounds}
                    onCheckedChange={setSoundCurrentChannel}
                  />
                </div>

                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Incoming Ring')}
                    </div>
                    <button
                      type="button"
                      onClick={() => playPreviewSound('ring')}
                      className="text-[11px] text-primary hover:underline font-semibold cursor-pointer block"
                    >
                      {t('Preview Sound')}
                    </button>
                  </div>
                  <Switch
                    checked={!disableAllSounds && soundIncomingRing}
                    disabled={disableAllSounds}
                    onCheckedChange={setSoundIncomingRing}
                  />
                </div>

                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Disable All Notification Sounds')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      {t('Disables all notification sounds, including voice & video sound effects. Your individual sound preferences will be saved and restored if you turn this on.')}
                    </div>
                  </div>
                  <Switch
                    checked={disableAllSounds}
                    onCheckedChange={setDisableAllSounds}
                  />
                </div>
              </div>

              {/* Related Settings card */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Related Settings')}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSection('voice')}
                  className="w-full p-3.5 rounded-xl border border-border bg-card/60 hover:bg-card hover:border-primary/40 flex items-center justify-between text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted text-foreground group-hover:text-primary transition-colors">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">
                        {t('Voice & Video')}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {t("Enable/disable sounds that play when you're in a call, like Mute, Unmute, Deafen, and more.")}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* ── 3. BADGES ── */}
            <div id="notifications-badges" className="space-y-4 scroll-mt-4">
              <h2 className="text-xl font-bold text-foreground">
                {t('Badges')}
              </h2>

              <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4 shadow-xs">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Enable Unread Message Badge')}
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed">
                    {t('Shows a red badge on the app icon when you have unread messages.')}
                  </div>
                </div>
                <Switch
                  checked={enableUnreadBadges}
                  onCheckedChange={setEnableUnreadBadges}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* ── 4. EMAIL ── */}
            <div id="notifications-email" className="space-y-4 scroll-mt-4">
              <h2 className="text-xl font-bold text-foreground">
                {t('Email')}
              </h2>

              <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Communication Emails')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      {t('Receive emails for missed calls, messages, and message digests.')}
                    </div>
                  </div>
                  <Switch
                    checked={emailCommunication}
                    onCheckedChange={setEmailCommunication}
                  />
                </div>

                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Social Emails')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      {t('Receive emails for friend requests, new friend suggestions, and events in your server.')}
                    </div>
                  </div>
                  <Switch
                    checked={emailSocial}
                    onCheckedChange={setEmailSocial}
                  />
                </div>

                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Announcements and Update Emails')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      {t('Receive emails about product updates, our newest features, improvements and bug fixes.')}
                    </div>
                  </div>
                  <Switch
                    checked={emailAnnouncements}
                    onCheckedChange={setEmailAnnouncements}
                  />
                </div>

                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Tip Emails')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      {t('Receive emails with helpful advice on how to use Anticeil and information on lesser known features.')}
                    </div>
                  </div>
                  <Switch
                    checked={emailTips}
                    onCheckedChange={setEmailTips}
                  />
                </div>

                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Recommendations Emails')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      {t('Receive emails with recommended servers and suggested events.')}
                    </div>
                  </div>
                  <Switch
                    checked={emailRecommendations}
                    onCheckedChange={setEmailRecommendations}
                  />
                </div>

                <div className="p-4 flex items-center justify-between gap-4 bg-muted/10">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Unsubscribe from all marketing emails')}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 text-xs font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 border border-border cursor-pointer"
                    onClick={() => {
                      setEmailAnnouncements(false);
                      setEmailTips(false);
                      setEmailRecommendations(false);
                      toast.success(t('Berhasil berhenti berlangganan dari semua email pemasaran.'));
                    }}
                  >
                    {t('Unsubscribe')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* ── 5. ADVANCED ── */}
            <div id="notifications-advanced" className="space-y-4 scroll-mt-4">
              <h2 className="text-xl font-bold text-foreground">
                {t('Advanced')}
              </h2>

              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => setShowAdvancedNotifications((prev) => !prev)}
                  className="w-full p-4 flex items-center justify-between gap-4 text-left hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Show Advanced Notification Settings')}
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">
                      {t('Mobile notification delay, allow playback and usage of /tts command, and more')}
                    </div>
                  </div>
                  <div className="p-1 rounded-md bg-muted/60 text-muted-foreground">
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 transition-transform duration-200',
                        showAdvancedNotifications && 'rotate-180'
                      )}
                    />
                  </div>
                </button>

                {showAdvancedNotifications && (
                  <div className="border-t border-border/60 divide-y divide-border/60 bg-muted/10">
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-foreground">
                          {t('Push Notification Inactive Timeout')}
                        </div>
                        <div className="text-[11px] text-muted-foreground leading-relaxed">
                          {t('Anticeil delays push notifications to your mobile device when you are active on desktop.')}
                        </div>
                      </div>
                      <div className="w-36 shrink-0">
                        <Select
                          value={mobileTimeout}
                          onValueChange={(val: any) => setMobileTimeout(val)}
                        >
                          <SelectTrigger size="sm" className="h-8 text-xs font-semibold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1m">{t('1 Minute')}</SelectItem>
                            <SelectItem value="2m">{t('2 Minutes')}</SelectItem>
                            <SelectItem value="5m">{t('5 Minutes')}</SelectItem>
                            <SelectItem value="10m">{t('10 Minutes')}</SelectItem>
                            <SelectItem value="never">{t('Never')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-foreground">
                          {t('Text-to-Speech (TTS) Notifications')}
                        </div>
                        <div className="text-[11px] text-muted-foreground leading-relaxed">
                          {t('Choose when Anticeil should read out incoming messages using speech synthesis.')}
                        </div>
                      </div>
                      <div className="w-48 shrink-0">
                        <Select
                          value={ttsNotifications}
                          onValueChange={(val: any) => setTtsNotifications(val)}
                        >
                          <SelectTrigger size="sm" className="h-8 text-xs font-semibold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="never">{t('Never')}</SelectItem>
                            <SelectItem value="all-channels">{t('For all channels')}</SelectItem>
                            <SelectItem value="current-channel">{t('For current selected channel')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="p-4 flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-foreground">
                          {t('Allow playback and usage of /tts command')}
                        </div>
                        <div className="text-[11px] text-muted-foreground leading-relaxed">
                          {t('Allows server members and friends to trigger speech playback using /tts.')}
                        </div>
                      </div>
                      <Switch
                        checked={allowTtsCommand}
                        onCheckedChange={setAllowTtsCommand}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION: NITRO (BILLING PERKS)                                            */}
        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* SECTION: NITRO (NECTAR & POLLEN)                                          */}
        {/* ========================================================================= */}
        {activeSection === 'nitro' && (
          <div className="space-y-10 pb-16 relative">
            {/* ── 1. HERO BANNER ── */}
            <div className="rounded-3xl p-6 sm:p-10 bg-linear-to-r from-[#4A32B3] via-[#5865F2] to-[#7946E0] text-white relative overflow-hidden shadow-2xl">
              {/* Starry sparkle accents */}
              <Sparkles className="w-5 h-5 text-amber-300 absolute top-5 left-8 animate-pulse pointer-events-none" />
              <Sparkles className="w-4 h-4 text-purple-200 absolute top-14 left-1/3 opacity-70 pointer-events-none" />
              <Sparkles className="w-6 h-6 text-pink-300 absolute bottom-6 right-12 animate-pulse pointer-events-none" />
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

              {/* Heart bookmark top-right */}
              <button
                type="button"
                onClick={() => toast.success(t('Disimpan ke daftar favorit!'))}
                className="absolute top-5 right-5 p-2 rounded-xl bg-black/20 hover:bg-black/35 backdrop-blur-md transition-colors cursor-pointer text-white/90 hover:text-white"
                title={t('Simpan')}
              >
                <Heart className="w-4 h-4" />
              </button>

              <div className="relative z-10 max-w-xl mx-auto text-center space-y-3">
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight uppercase text-white drop-shadow-sm">
                  {t('Unlock a World of Perks with Nectar')}
                </h2>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-medium">
                  {t('Plans start at only IDR 29,000.00/month. Cancel anytime')}
                </p>

                <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                  <Button
                    size="default"
                    onClick={() =>
                      toast.success(t('Membuka langganan Nectar... Akun Anda memenuhi syarat promo perdana!'))
                    }
                    className="bg-white hover:bg-white/90 text-purple-950 font-black text-xs sm:text-sm h-10 px-6 rounded-xl shadow-xl cursor-pointer flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4 fill-current text-purple-600" />
                    <span>{t('Subscribe')}</span>
                  </Button>

                  <Button
                    size="default"
                    variant="outline"
                    onClick={() =>
                      toast.info(t('Pilih kontak atau colony untuk mengirimkan Gift Nectar.'))
                    }
                    className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-bold text-xs sm:text-sm h-10 px-6 rounded-xl backdrop-blur-sm cursor-pointer flex items-center gap-2"
                  >
                    <Gift className="w-4 h-4 text-pink-300" />
                    <span>{t('Gift Nectar')}</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* ── 2. TWO TIER CARDS ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {/* TIER 1: NECTAR BASIC */}
              <div className="rounded-2xl p-6 bg-linear-to-b from-[#0066FE] to-[#004ECC] text-white relative overflow-hidden shadow-xl flex flex-col justify-between min-h-[380px]">
                {/* Mascot Graphic on Scooter */}
                <div className="absolute top-4 right-4 size-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl shadow-lg select-none">
                  🛵
                </div>

                <div>
                  <div className="text-2xl font-black tracking-tight">NECTAR</div>
                  <div className="text-[11px] font-black tracking-widest text-sky-200 uppercase mt-0.5">
                    BASIC
                  </div>
                  <div className="text-sm font-bold text-white/95 mt-2">
                    IDR 29,000.00 / month
                  </div>

                  <div className="mt-6 space-y-3">
                    {[
                      { icon: <Upload className="w-4 h-4 text-sky-200" />, label: '50MB uploads' },
                      { icon: <Smile className="w-4 h-4 text-sky-200" />, label: 'Custom emoji anywhere' },
                      { icon: <Flame className="w-4 h-4 text-sky-200" />, label: 'Unlimited Super Reactions' },
                      { icon: <Sparkles className="w-4 h-4 text-sky-200" />, label: 'Special Nectar badge on your profile' },
                    ].map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-xs font-semibold text-white/95">
                        <span className="shrink-0">{feat.icon}</span>
                        <span>{feat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => toast.success(t('Pilihan Nectar Basic dipilih: IDR 29,000/bln'))}
                  className="w-full mt-6 bg-white/15 hover:bg-white/25 text-white border-white/40 font-bold text-xs h-10 rounded-xl cursor-pointer"
                >
                  {t('Subscribe')}
                </Button>
              </div>

              {/* TIER 2: NECTAR FULL */}
              <div className="rounded-2xl p-6 bg-linear-to-b from-[#8F2DF5] via-[#A838E6] to-[#DB2B88] text-white relative overflow-hidden shadow-xl flex flex-col justify-between min-h-[380px]">
                {/* Flying Mascot Graphic */}
                <div className="absolute top-4 right-4 size-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl shadow-lg select-none">
                  🚀
                </div>

                <div>
                  <div className="text-2xl font-black tracking-tight">NECTAR</div>
                  <div className="text-sm font-bold text-white/95 mt-2">
                    IDR 83,169.00 / month
                  </div>

                  <div className="mt-6 space-y-3">
                    {[
                      { icon: <Upload className="w-4 h-4 text-pink-200" />, label: '1GB uploads' },
                      { icon: <Smile className="w-4 h-4 text-pink-200" />, label: 'Custom emoji anywhere' },
                      { icon: <Flame className="w-4 h-4 text-pink-200" />, label: 'Unlimited Super Reactions' },
                      { icon: <Tv className="w-4 h-4 text-pink-200" />, label: 'HD video streaming' },
                      { icon: <Gem className="w-4 h-4 text-pink-200" />, label: '2 Colony Boosts' },
                      { icon: <User className="w-4 h-4 text-pink-200" />, label: 'Custom profiles and more!' },
                    ].map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-xs font-semibold text-white/95">
                        <span className="shrink-0">{feat.icon}</span>
                        <span>{feat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => toast.success(t('Pilihan Nectar Full dipilih: IDR 83,169/bln'))}
                  className="w-full mt-6 bg-white hover:bg-white/90 text-purple-950 font-black text-xs h-10 rounded-xl shadow-lg cursor-pointer"
                >
                  {t('Subscribe')}
                </Button>
              </div>
            </div>

            {/* ── 3. FAVORITE NECTAR PERKS (BENTO GRID) ── */}
            <div className="space-y-6 pt-2">
              <h3 className="text-xl sm:text-2xl font-black text-foreground text-center">
                {t('Favorite Nectar Perks')}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Perk 1: More Emoji Power */}
                <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs flex flex-col justify-between">
                  <div className="h-32 rounded-xl bg-muted/40 border border-border/60 p-3 flex flex-col justify-between overflow-hidden relative">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      COLONY EMOJIS
                    </div>
                    <div className="grid grid-cols-6 gap-2 text-2xl select-none text-center">
                      <span className="hover:scale-125 transition-transform cursor-pointer">🚀</span>
                      <span className="hover:scale-125 transition-transform cursor-pointer">🔥</span>
                      <span className="hover:scale-125 transition-transform cursor-pointer">✨</span>
                      <span className="hover:scale-125 transition-transform cursor-pointer">🎉</span>
                      <span className="hover:scale-125 transition-transform cursor-pointer">😎</span>
                      <span className="hover:scale-125 transition-transform cursor-pointer">🍕</span>
                    </div>
                    <div className="text-[10px] text-primary font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Use in any colony, server or DM</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">More Emoji Power</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Hype, roast, and meme with custom emoji anywhere.
                    </p>
                  </div>
                </div>

                {/* Perk 2: HD Video */}
                <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs flex flex-col justify-between">
                  <div className="h-32 rounded-xl bg-linear-to-br from-indigo-950 via-purple-950 to-slate-900 border border-border/60 p-3 flex flex-col justify-between text-white overflow-hidden relative">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase">
                        LIVE 4K 60FPS
                      </span>
                      <MonitorPlay className="w-4 h-4 text-purple-300" />
                    </div>
                    <div className="text-center font-mono font-bold text-sm tracking-wider text-purple-200">
                      ULTRA HD STREAMING
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-white/70 font-mono">
                      <span>Source 3840×2160</span>
                      <span>Audio 384kbps</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">HD Video</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Better video resolutions for all your streams. Stream apps and games in sweet, sweet HD.
                    </p>
                  </div>
                </div>

                {/* Perk 3: 1GB Uploads */}
                <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs flex flex-col justify-between">
                  <div className="h-32 rounded-xl bg-muted/40 border border-border/60 p-3 flex flex-col justify-center gap-2">
                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-card border border-border shadow-xs">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-foreground truncate">
                          game_footage_master_render.mp4
                        </div>
                        <div className="text-[10px] text-muted-foreground">982 MB of 1.0 GB</div>
                      </div>
                      <span className="text-xs font-mono font-bold text-primary">98%</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">1GB Uploads</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Upload what you want with increased 1GB upload size.
                    </p>
                  </div>
                </div>

                {/* Perk 4: Custom App Icons */}
                <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs flex flex-col justify-between">
                  <div className="h-32 rounded-xl bg-muted/40 border border-border/60 p-3 flex items-center justify-center gap-3">
                    {[
                      { bg: 'from-amber-500 to-rose-500', icon: '⚡' },
                      { bg: 'from-indigo-600 to-purple-600', icon: '🌌' },
                      { bg: 'from-emerald-500 to-teal-600', icon: '🌿' },
                      { bg: 'from-fuchsia-600 to-pink-500', icon: '🌸' },
                    ].map((theme, i) => (
                      <div
                        key={i}
                        className={cn(
                          'size-12 rounded-2xl bg-linear-to-br flex items-center justify-center text-xl shadow-md border border-white/20 select-none hover:scale-110 transition-transform cursor-pointer',
                          theme.bg
                        )}
                      >
                        {theme.icon}
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Custom App Icons</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Choose a mobile and in-app desktop icon that fits your vibe.
                    </p>
                  </div>
                </div>

                {/* Perk 5: Use Custom Sounds */}
                <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs flex flex-col justify-between">
                  <div className="h-32 rounded-xl bg-muted/40 border border-border/60 p-3 flex items-center justify-center gap-2">
                    {['🎺 Airhorn', '🦆 Quack', '👏 Applause', '⚡ Laser'].map((snd, i) => (
                      <div
                        key={i}
                        onClick={() => toast.success(`Sound effect diputar: ${snd}`)}
                        className="px-2.5 py-1.5 rounded-lg bg-card border border-border text-[11px] font-bold text-foreground shadow-2xs hover:border-primary cursor-pointer select-none"
                      >
                        {snd}
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Use Custom Sounds</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Use custom sounds and personalized entrance sounds across voice channels.
                    </p>
                  </div>
                </div>

                {/* Perk 6: Video Backgrounds */}
                <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs flex flex-col justify-between">
                  <div className="h-32 rounded-xl bg-linear-to-tr from-sky-900 via-indigo-900 to-violet-900 border border-border/60 p-3 flex flex-col justify-between text-white relative overflow-hidden">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-sky-200">
                      <Video className="w-3.5 h-3.5" />
                      <span>VIRTUAL BACKGROUND</span>
                    </div>
                    <div className="text-center font-bold text-xs tracking-wider">
                      Cozy Anime Loft & Neon City
                    </div>
                    <div className="text-[10px] text-white/70 text-right">HD Camera Preview</div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Video Backgrounds</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Make video calls unique with your own backgrounds.
                    </p>
                  </div>
                </div>

                {/* Perk 7: Unlimited Super Reactions */}
                <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs flex flex-col justify-between">
                  <div className="h-32 rounded-xl bg-muted/40 border border-border/60 p-3 flex items-center justify-center gap-3">
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 font-bold text-xs shadow-xs">
                      <Flame className="w-4 h-4 fill-current animate-bounce" />
                      <span>x18 SUPER REACTION</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-500 font-bold text-xs shadow-xs">
                      <span>💖 x35</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Unlimited Super Reactions</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      We made Super Reactions unlimited so you can unleash the chaos in your chats.
                    </p>
                  </div>
                </div>

                {/* Perk 8: Special Sticker Access */}
                <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs flex flex-col justify-between">
                  <div className="h-32 rounded-xl bg-muted/40 border border-border/60 p-3 flex items-center justify-center gap-4 text-3xl select-none">
                    <span className="hover:rotate-12 transition-transform cursor-pointer">🎨</span>
                    <span className="hover:scale-125 transition-transform cursor-pointer">👾</span>
                    <span className="hover:-rotate-12 transition-transform cursor-pointer">🐱</span>
                    <span className="hover:scale-125 transition-transform cursor-pointer">🌟</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Special Sticker Access</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Use custom stickers anywhere.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 4. SUBSCRIBER BADGE SPOTLIGHT CARD ── */}
            <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-3 shadow-xs">
              <div className="size-16 rounded-2xl bg-linear-to-br from-purple-500/20 via-pink-500/20 to-amber-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 mx-auto shadow-md">
                <Zap className="w-8 h-8 fill-current animate-pulse text-purple-500" />
              </div>
              <h4 className="text-base font-bold text-foreground">Subscriber Badge</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Get this cool badge for being a Nectar subscriber.
              </p>
            </div>

            {/* ── 5. COMPARISON TABLE ── */}
            <div className="space-y-6 pt-4">
              <h3 className="text-xl sm:text-2xl font-black text-foreground text-center">
                {t('Pick the plan that works best for you')}
              </h3>

              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-md">
                {/* Table Header */}
                <div className="grid grid-cols-12 border-b border-border text-xs font-bold text-foreground bg-muted/30">
                  <div className="col-span-6 sm:col-span-6 p-4 flex items-end">
                    <span>Pricing and Features</span>
                  </div>
                  <div className="col-span-3 sm:col-span-3 p-4 text-center border-l border-border/60 flex flex-col justify-end">
                    <div className="text-sm font-black">NECTAR</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold">BASIC</div>
                    <div className="text-[11px] text-muted-foreground mt-1">IDR 29,000.00/mo</div>
                  </div>
                  <div className="col-span-3 sm:col-span-3 p-4 text-center border-l-2 border-pink-500 bg-pink-500/5 flex flex-col justify-end relative">
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-linear-to-r from-pink-500 to-purple-600 text-white font-black text-[9px] uppercase tracking-wider shadow-sm">
                      MOST POPULAR
                    </span>
                    <div className="text-sm font-black text-pink-500">NECTAR</div>
                    <div className="text-[11px] text-muted-foreground mt-1">IDR 83,169.00/mo</div>
                  </div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-border/60 text-xs">
                  {[
                    { feature: 'Custom emoji anywhere and animated', basic: true, nectar: true },
                    { feature: 'Custom stickers anywhere', basic: true, nectar: true },
                    { feature: 'Custom App Icons', basic: true, nectar: true },
                    { feature: 'Super Reactions', basic: true, nectar: true },
                    { feature: 'Larger File Uploads', basic: '50 MB', nectar: '1 GB' },
                    { feature: 'HD streaming', basic: false, nectar: 'Up to 4K and 60fps' },
                    { feature: '2 Boosts + 30% off extra Boosts', basic: false, nectar: true },
                    { feature: 'Animated avatar, banner, and profile theme', basic: false, nectar: true },
                    { feature: 'Display Name Styles', basic: false, nectar: true },
                    { feature: 'Custom per-server profiles', basic: false, nectar: true },
                    { feature: 'Shop member pricing, and exclusive items', basic: false, nectar: true },
                    { feature: 'Colors for your Anticeil theme', basic: false, nectar: true },
                    { feature: 'Nectar badge on your profile', basic: true, nectar: true },
                    { feature: 'Custom video backgrounds', basic: true, nectar: true },
                    { feature: 'Custom sounds anywhere', basic: false, nectar: true },
                    { feature: 'Custom entrance sounds', basic: false, nectar: true },
                    { feature: 'Join up to 200 servers', basic: false, nectar: true },
                    { feature: 'Longer messages up to 4000 characters', basic: false, nectar: true },
                    { feature: '3 Nectar friend passes', basic: false, nectar: true },
                    { feature: 'Keep Quest avatar decorations rewards longer', basic: false, nectar: true },
                  ].map((row, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'grid grid-cols-12 items-center transition-colors',
                        idx % 2 === 0 ? 'bg-card' : 'bg-muted/15'
                      )}
                    >
                      <div className="col-span-6 sm:col-span-6 p-3.5 font-medium text-foreground">
                        {row.feature}
                      </div>

                      {/* Basic Col */}
                      <div className="col-span-3 sm:col-span-3 p-3.5 text-center border-l border-border/60">
                        {typeof row.basic === 'boolean' ? (
                          row.basic ? (
                            <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground/35 mx-auto" />
                          )
                        ) : (
                          <span className="font-bold text-foreground text-[11px]">{row.basic}</span>
                        )}
                      </div>

                      {/* Nectar Col */}
                      <div className="col-span-3 sm:col-span-3 p-3.5 text-center border-l-2 border-pink-500 bg-pink-500/5">
                        {typeof row.nectar === 'boolean' ? (
                          row.nectar ? (
                            <Check className="w-4 h-4 text-pink-500 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground/35 mx-auto" />
                          )
                        ) : (
                          <span className="font-black text-pink-500 text-[11px]">{row.nectar}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── 6. FLOATING STICKY CTA BAR ── */}
            <div className="sticky bottom-4 z-20 flex justify-center mt-8">
              <div className="p-1.5 rounded-2xl bg-card/90 backdrop-blur-md border border-border shadow-2xl flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    toast.success(t('Membuka langganan Nectar... Akun Anda memenuhi syarat promo perdana!'))
                  }
                  className="bg-white hover:bg-white/90 text-purple-950 font-black text-xs h-9 px-4 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 fill-current text-purple-600" />
                  <span>{t('Subscribe')}</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    toast.info(t('Pilih teman dari daftar kontak untuk mengirimkan Gift Nectar.'))
                  }
                  className="border-border hover:bg-muted font-bold text-xs h-9 px-4 rounded-xl cursor-pointer flex items-center gap-1.5 text-foreground"
                >
                  <Gift className="w-3.5 h-3.5 text-pink-500" />
                  <span>{t('Gift Nectar')}</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION: SERVER BOOST (COLONY BOOST)                                      */}
        {/* ========================================================================= */}
        {activeSection === 'boost' && (
          <div className="space-y-8 pb-12">
            {/* ── 1. HEADER WITH EXPLANATION & VIDEO CARD ── */}
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
              <div className="space-y-3 max-w-md">
                <div className="flex items-center gap-2.5">
                  <div className="size-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500 shadow-xs">
                    <Gem className="w-6 h-6 fill-pink-500/20" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-foreground">
                    {t('Colony Boosts')}
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t(
                    'Boosting a colony unlocks perks for everyone in that colony. You can manage your Boosts here (add, subtract, cancel — just beware the 7 day cooldown).'
                  )}{' '}
                  <button
                    type="button"
                    onClick={() =>
                      toast.info(t('Colony Boost memberikan peningkatan kapasitas file, kualitas stream, dan ratusan slot emoji.'))
                    }
                    className="text-primary hover:underline font-medium inline cursor-pointer"
                  >
                    {t('Learn more')}
                  </button>
                </p>
              </div>

              {/* Video Mockup Thumbnail Card */}
              <div
                onClick={() =>
                  toast.success(t('Memutar panduan interaktif: Cara kerja Colony Boost.'))
                }
                className="w-full lg:w-72 h-36 rounded-2xl bg-linear-to-br from-indigo-950 via-purple-950 to-pink-950 border border-purple-500/30 p-3.5 flex flex-col justify-between text-white relative overflow-hidden shadow-xl cursor-pointer group hover:border-purple-500/60 transition-all shrink-0"
              >
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white/90">
                    {t('How do Boosts work?')}
                  </span>
                  <Gem className="w-4 h-4 text-pink-400" />
                </div>
                {/* Centered Play Button */}
                <div className="relative z-10 size-11 rounded-full bg-white/20 group-hover:bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center mx-auto text-white shadow-lg transition-transform group-hover:scale-110">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
                <div className="relative z-10 text-[10px] text-white/70 font-mono text-center">
                  2:14 • Tutorial Video
                </div>
              </div>
            </div>

            {/* ── 2. PROMO BANNER: GET 2 BOOSTS WITH NECTAR ── */}
            <div className="rounded-2xl p-4 bg-linear-to-r from-purple-900/30 via-indigo-900/30 to-pink-900/30 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="size-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
                  <Zap className="w-5 h-5 fill-current text-pink-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">
                    {t('Get 2 Boosts with Nectar!')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t('Nectar users get 2 Boosts included with their membership.')}{' '}
                    <button
                      type="button"
                      onClick={() => setActiveSection('nitro')}
                      className="text-primary hover:underline font-medium inline cursor-pointer"
                    >
                      {t('Learn more')}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => setActiveSection('nitro')}
                className="bg-white hover:bg-white/90 text-purple-950 font-black text-xs h-8 px-4 rounded-xl shadow-md cursor-pointer shrink-0"
              >
                <Zap className="w-3.5 h-3.5 fill-current text-purple-600 mr-1.5" />
                <span>{t('Get Nectar')}</span>
              </Button>
            </div>

            {/* ── 3. THESE COLONIES COULD USE A BOOST ── */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('These colonies could use a Boost')}
              </div>

              <div className="space-y-2">
                {[
                  {
                    id: 'c1',
                    name: "zmsta's colony",
                    initials: 'ZC',
                    color: 'bg-indigo-600',
                    defaultLevel: 0,
                  },
                  {
                    id: 'c2',
                    name: 'awd community',
                    initials: 'AWD',
                    color: 'bg-emerald-600',
                    defaultLevel: 0,
                  },
                  {
                    id: 'c3',
                    name: '[FULLZ] Global Hub',
                    initials: 'FLZ',
                    color: 'bg-purple-600',
                    defaultLevel: 1,
                  },
                ].map((col) => {
                  const currentBoosts = boostedColonies[col.id] ?? 0;
                  const level = currentBoosts >= 14 ? 3 : currentBoosts >= 7 ? 2 : currentBoosts >= 2 ? 1 : 0;

                  return (
                    <div
                      key={col.id}
                      className="rounded-xl border border-border bg-card p-3.5 flex items-center justify-between gap-4 shadow-xs hover:border-border/80 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'size-10 rounded-2xl flex items-center justify-center font-bold text-xs text-white shadow-xs shrink-0',
                            col.color
                          )}
                        >
                          {col.initials}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-foreground truncate">
                            {col.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Gem className="w-3 h-3 text-pink-500" />
                            <span>
                              {currentBoosts === 0
                                ? t('No Boosts')
                                : `${currentBoosts} Boosts • Level ${level}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setBoostedColonies((prev) => ({
                            ...prev,
                            [col.id]: (prev[col.id] ?? 0) + 1,
                          }));
                          toast.success(t(`Berhasil memberikan Boost ke ${col.name}! 🎉`));
                        }}
                        className="h-8 text-xs font-bold hover:bg-pink-500/10 hover:text-pink-500 hover:border-pink-500/30 border border-transparent transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                      >
                        <Gem className="w-3.5 h-3.5 text-pink-500" />
                        <span>{t('Boost this colony')}</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── 4. LEVEL PERKS PREVIEW TABLE ── */}
            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('Level Perks Overview')}
              </div>

              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-md">
                {/* Table Header */}
                <div className="grid grid-cols-12 border-b border-border text-xs font-bold text-foreground bg-muted/30">
                  <div className="col-span-4 p-4 font-bold">Perks</div>
                  <div className="col-span-2 sm:col-span-2 p-3 text-center border-l border-border/60">
                    <div>Level 1</div>
                    <div className="text-[10px] text-muted-foreground font-medium">2 Boosts</div>
                  </div>
                  <div className="col-span-3 sm:col-span-3 p-3 text-center border-l border-border/60">
                    <div>Level 2</div>
                    <div className="text-[10px] text-muted-foreground font-medium">7 Boosts</div>
                  </div>
                  <div className="col-span-3 sm:col-span-3 p-3 text-center border-l border-border/60">
                    <div>Level 3</div>
                    <div className="text-[10px] text-muted-foreground font-medium">14 Boosts</div>
                  </div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-border/60 text-xs">
                  {[
                    { perk: 'Emoji Slots', l1: '100', l2: '150', l3: '250' },
                    { perk: 'Sticker Slots', l1: '15', l2: '30', l3: '60' },
                    { perk: 'Soundboard Slots', l1: '24', l2: '36', l3: '48' },
                    { perk: 'Stream Quality', l1: '720p & 60fps', l2: '1440p & 60fps', l3: '1440p & 60fps' },
                    { perk: 'Audio Quality', l1: '128kbps', l2: '256kbps', l3: '384kbps' },
                    { perk: 'Upload Size Limit', l1: '10MB', l2: '50MB', l3: '100MB' },
                    { perk: 'Video Stage Seats', l1: '50', l2: '150', l3: '300' },
                    { perk: 'Animated Colony Icon', l1: true, l2: true, l3: true },
                    { perk: 'Colony Invite Background', l1: true, l2: true, l3: true },
                    { perk: 'Colony Banner', l1: false, l2: 'Static', l3: 'Animated' },
                    { perk: 'Custom Role Icons', l1: false, l2: true, l3: true },
                    { perk: 'Custom Invite Link', l1: false, l2: false, l3: true },
                  ].map((row, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'grid grid-cols-12 items-center transition-colors',
                        idx % 2 === 0 ? 'bg-card' : 'bg-muted/15'
                      )}
                    >
                      <div className="col-span-4 p-3 font-semibold text-foreground">
                        {row.perk}
                      </div>

                      {/* Level 1 */}
                      <div className="col-span-2 sm:col-span-2 p-3 text-center border-l border-border/60">
                        {typeof row.l1 === 'boolean' ? (
                          row.l1 ? (
                            <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground/35 mx-auto" />
                          )
                        ) : (
                          <span className="font-bold text-foreground text-[11px]">{row.l1}</span>
                        )}
                      </div>

                      {/* Level 2 */}
                      <div className="col-span-3 sm:col-span-3 p-3 text-center border-l border-border/60">
                        {typeof row.l2 === 'boolean' ? (
                          row.l2 ? (
                            <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground/35 mx-auto" />
                          )
                        ) : (
                          <span className="font-bold text-foreground text-[11px]">{row.l2}</span>
                        )}
                      </div>

                      {/* Level 3 */}
                      <div className="col-span-3 sm:col-span-3 p-3 text-center border-l border-border/60">
                        {typeof row.l3 === 'boolean' ? (
                          row.l3 ? (
                            <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground/35 mx-auto" />
                          )
                        ) : (
                          <span className="font-bold text-pink-500 text-[11px]">{row.l3}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── 5. GIVE YOUR COMMUNITY A BOOST & BE RECOGNIZED ── */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xl font-bold text-foreground text-center">
                {t('Give your community a Boost & be recognized')}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-card p-5 space-y-3 text-center shadow-xs">
                  <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto shadow-xs">
                    <Gem className="w-6 h-6 text-pink-500" />
                  </div>
                  <div className="text-xs font-bold text-foreground">
                    {t('Display your support with a Member List icon')}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 space-y-3 text-center shadow-xs">
                  <div className="size-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500 mx-auto shadow-xs">
                    <Star className="w-6 h-6 fill-pink-500/40 text-pink-500 animate-pulse" />
                  </div>
                  <div className="text-xs font-bold text-foreground">
                    {t('Unlock a profile badge that evolves over time')}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 space-y-3 text-center shadow-xs">
                  <div className="size-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 mx-auto shadow-xs">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-foreground">
                    {t('Get an exclusive Booster role')}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 space-y-3 text-center shadow-xs">
                  <div className="size-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto shadow-xs">
                    <Heart className="w-6 h-6 fill-rose-500/40" />
                  </div>
                  <div className="text-xs font-bold text-foreground">
                    {t('Show support for your community')}
                  </div>
                </div>
              </div>
            </div>

            {/* ── 6. BOOSTING FAQ ── */}
            <div className="space-y-4 pt-4">
              <h3 className="text-xl font-bold text-foreground">
                {t('Boosting FAQ')}
              </h3>

              <div className="rounded-2xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                {[
                  {
                    q: 'What is a Colony Boost?',
                    a: 'Colony Boosting is a way to support your favorite community and unlock premium perks for all members, such as better audio, 1080p/4K streams, custom vanity URLs, and hundreds of extra emoji slots.',
                  },
                  {
                    q: 'How do I Boost a colony?',
                    a: "Click 'Boost this colony' next to any colony in your list above, or click the colony dropdown menu in the sidebar and choose Colony Boost.",
                  },
                  {
                    q: 'Can I Boost a Colony multiple times?',
                    a: 'Yes! You can apply multiple Boosts to the same colony to help it reach higher perk levels faster.',
                  },
                  {
                    q: 'Can I continue Boosting a colony after it reaches Level 3?',
                    a: 'Yes, you can continue boosting a Level 3 colony to provide a buffer against expired boosts and ensure the colony never loses its Level 3 status.',
                  },
                  {
                    q: "What are 'additional perks' and how are they different from Levels?",
                    a: 'Additional perks allow colonies to unlock specialized benefits such as extra soundboard slots or custom themes even before hitting the next full milestone level.',
                  },
                  {
                    q: 'How much do the new additional perks cost?',
                    a: 'Additional perks are unlocked using available Boost slots or through community contributor points.',
                  },
                  {
                    q: 'Are additional perks replacing the current server level system?',
                    a: 'No, the 3-tier Level system remains the core progression milestone for all colonies.',
                  },
                  {
                    q: 'Do additional perks use separate Boosts from my server level?',
                    a: "No, all Boosts contribute towards your colony's total level pool.",
                  },
                  {
                    q: 'Are additional perks a one-time purchase, or do they require ongoing Boosts?',
                    a: 'Perks remain active as long as the colony maintains the required number of active subscriber boosts.',
                  },
                ].map((faq, i) => {
                  const isOpen = openFaqIndex === i;
                  return (
                    <div key={i}>
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        <span className="text-xs font-bold text-foreground">{faq.q}</span>
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0 ml-2',
                            isOpen && 'rotate-180'
                          )}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 text-xs text-muted-foreground leading-relaxed bg-muted/10 border-t border-border/40">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION: SUBSCRIPTIONS, GIFTS, BILLING                                     */}
        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* SECTION: SUBSCRIPTIONS                                                    */}
        {/* ========================================================================= */}
        {activeSection === 'subscriptions' && (
          <div className="space-y-8 pb-12">
            <h2 className="text-xl font-bold text-foreground">
              {t('Subscriptions')}
            </h2>

            {/* 1. Your Subscriptions */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {t('Your Subscriptions')}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                  {t(
                    'These are your current subscriptions. They will be billed on the same billing cycle. You can update any subscription at any time.'
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-10 flex flex-col items-center justify-center text-center space-y-3 shadow-xs">
                <div className="size-14 rounded-2xl bg-muted/60 border border-border flex items-center justify-center text-2xl select-none shadow-2xs">
                  🎲
                </div>
                <div className="text-xs font-semibold text-muted-foreground">
                  {t('You have no active subscriptions')}
                </div>
                <Button
                  size="sm"
                  onClick={() => setActiveSection('nitro')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-8 px-4 rounded-xl cursor-pointer"
                >
                  {t('Explore Nectar Plans')}
                </Button>
              </div>
            </div>

            {/* 2. Subscription Credit */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {t('Subscription Credit')}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                  {t(
                    'When you accept a gift while you have a running subscription, redeem a promotion, or accept a gift that differs from your current subscription, it will appear here as credit.'
                  )}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-10 flex flex-col items-center justify-center text-center space-y-3 shadow-xs">
                <div className="size-14 rounded-2xl bg-muted/60 border border-border flex items-center justify-center text-2xl select-none shadow-2xs">
                  🎲
                </div>
                <div className="text-xs font-semibold text-muted-foreground">
                  {t('You have no unused credits')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION: GIFT INVENTORY                                                   */}
        {/* ========================================================================= */}
        {activeSection === 'gifts' && (
          <div className="space-y-8 pb-12">
            <h2 className="text-xl font-bold text-foreground">
              {t('Gift Inventory')}
            </h2>

            {/* 1. Redeem Codes */}
            <div id="gift-redeem-codes" className="space-y-3 scroll-mt-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {t('Redeem Codes')}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                  {t("Received a code for Nectar or a game? That's exciting! Enter it below.")}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl">
                <Input
                  value={redeemCodeInput}
                  onChange={(e) => setRedeemCodeInput(e.target.value)}
                  placeholder="WUMP-AAAAA-BBBBB-CCCCC"
                  className="h-10 text-xs font-mono uppercase bg-card border-border tracking-wider"
                />
                <Button
                  onClick={handleRedeemCode}
                  className="h-10 px-6 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer shrink-0"
                >
                  {t('Redeem')}
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* 2. The Gifting Badge */}
            <div id="gift-gifting-badge" className="space-y-3 scroll-mt-4">
              <h3 className="text-sm font-bold text-foreground">
                {t('The Gifting Badge')}
              </h3>

              <div className="rounded-2xl border border-border bg-card p-6 space-y-6 shadow-xs">
                {/* 6 Badges Progression */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
                  {[
                    { tier: 'Patron', count: 'Gifted 1x', icon: '🎁', color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30' },
                    { tier: 'Champion', count: 'Gifted 2x', icon: '💎', color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30' },
                    { tier: 'Luminary', count: 'Gifted 3x', icon: '🎀', color: 'from-pink-500/20 to-rose-500/20 text-pink-400 border-pink-500/30' },
                    { tier: 'Icon', count: 'Gifted 6x', icon: '🔮', color: 'from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30' },
                    { tier: 'Hero', count: 'Gifted 10x', icon: '👑', color: 'from-violet-500/20 to-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30' },
                    { tier: 'Legend', count: 'Gifted 20x', icon: '🏆', color: 'from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30' },
                  ].map((badge, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'rounded-2xl border p-3 flex flex-col items-center justify-between gap-2 bg-linear-to-b shadow-2xs hover:scale-105 transition-transform cursor-pointer',
                        badge.color
                      )}
                    >
                      <span className="text-2xl select-none">{badge.icon}</span>
                      <div>
                        <div className="text-xs font-bold text-foreground">{badge.tier}</div>
                        <div className="text-[10px] text-muted-foreground">{badge.count}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-border/50">
                  <p className="text-[11px] text-muted-foreground leading-relaxed max-w-md">
                    {t('Your badge progresses as you gift. Exceptions include when a gift is refunded or when fraud is detected.')}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => toast.info(t('Pilih teman dari daftar kontak untuk mengirimkan hadiah.'))}
                    className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs h-9 px-4 rounded-xl flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
                  >
                    <Gift className="w-4 h-4" />
                    <span>{t('Send a Gift')}</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* 3. Gifts I Purchased */}
            <div id="gift-purchased" className="space-y-3 scroll-mt-4">
              <h3 className="text-sm font-bold text-foreground">
                {t('Gifts I Purchased')}
              </h3>

              <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-1.5 shadow-xs">
                <div className="text-xs font-bold text-foreground">
                  {t('There are no gifts.')}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {t('Feeling generous? Give someone the gift of Nectar and make their day!')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION: BILLING                                                          */}
        {/* ========================================================================= */}
        {activeSection === 'billing' && (
          <div className="space-y-8 pb-12">
            <h2 className="text-xl font-bold text-foreground">
              {t('Billing')}
            </h2>

            {/* 1. Payment Methods */}
            <div id="billing-payment-methods" className="space-y-3 scroll-mt-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {t('Payment Methods')}
                  </h3>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <span>Country/Region: Indonesia</span>
                    <Info className="w-3 h-3 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                {savedPaymentMethods.length === 0 ? (
                  <div>
                    <div className="text-xs font-bold text-foreground">
                      {t('No payment method saved')}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t('Checkout faster by saving a payment method')}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {savedPaymentMethods.map((pm) => (
                      <div key={pm.id} className="flex items-center gap-3">
                        <CreditCard className="w-4 h-4 text-primary" />
                        <div>
                          <div className="text-xs font-bold text-foreground">{pm.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{pm.details}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  size="sm"
                  onClick={() => {
                    setSavedPaymentMethods([
                      {
                        id: 'pm-qris',
                        name: 'QRIS / GoPay (Midtrans)',
                        type: 'e-wallet',
                        details: 'Instant QRIS & GoPay Auto-Debit',
                        isDefault: true,
                      },
                    ]);
                    toast.success(t('Metode pembayaran QRIS / GoPay berhasil ditambahkan!'));
                  }}
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs cursor-pointer shrink-0"
                >
                  {t('Add Payment Method')}
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/50" />

            {/* 2. Transaction History */}
            <div id="billing-transaction-history" className="space-y-3 scroll-mt-4">
              <h3 className="text-sm font-bold text-foreground">
                {t('Transaction History')}
              </h3>

              <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-xs">
                <div className="text-xs text-muted-foreground">
                  {t("You haven't made any transactions yet.")}
                </div>
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
