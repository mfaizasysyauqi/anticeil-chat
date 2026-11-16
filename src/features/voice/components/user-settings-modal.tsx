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
  Camera,
  RotateCcw,
  VolumeX,
  Pencil,
  Radio,
  SlidersHorizontal,
  Languages,
  Layers,
  Pin,
  Headphones,
  MessageSquare,
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
  | 'accessibility'
  | 'system'
  | 'language'
  | 'keybinds'
  | 'registered_games'
  | 'activity_privacy'
  | 'overlay';

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
  const { t, locale, setLocale } = useTranslation();
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

  const playPreviewSound = (type: string) => {
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
      } else if (type === 'deafen') {
        osc.frequency.setValueAtTime(500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.22);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      } else if (type === 'undeafen') {
        osc.frequency.setValueAtTime(250, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.22);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      } else if (type === 'mute') {
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.18);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      } else if (type === 'unmute') {
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.18);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      } else if (type === 'quack') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'airhorn') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(466.16, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
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
    resetSettings,
    audioInputDevices,
    audioOutputDevices,
    videoInputDevices,
    isMicTesting,
    micVolumeLevel,
    startMicTest,
    stopMicTest,
  } = useVoiceSettings();

  // Voice & Video Discord Parity States
  const [showAdvancedVoice, setShowAdvancedVoice] = useState(false);
  const [isCameraTesting, setIsCameraTesting] = useState(false);
  const cameraVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = React.useRef<MediaStream | null>(null);
  const [selectedVideoBackground, setSelectedVideoBackground] = useState('none');
  const [showStreamPreviews, setShowStreamPreviews] = useState(true);
  const [showAdvancedStream, setShowAdvancedStream] = useState(false);

  // Voice Call Sound switches
  const [soundDeafen, setSoundDeafen] = useState(true);
  const [soundUndeafen, setSoundUndeafen] = useState(true);
  const [soundMute, setSoundMute] = useState(true);
  const [soundUnmute, setSoundUnmute] = useState(true);
  const [showMoreSounds, setShowMoreSounds] = useState(false);
  const [moreSoundsState, setMoreSoundsState] = useState<Record<string, boolean>>({
    cameraOn: true,
    cameraOff: true,
    voiceConnected: true,
    voiceDisconnected: true,
    userJoin: true,
    userLeave: true,
    screenShareStart: true,
    screenShareStop: true,
    pttActivate: true,
    pttDeactivate: true,
    streamStart: true,
    streamStop: true,
    activityLaunch: true,
    activityEnd: true,
    muteMember: true,
    deafenMember: true,
    ringingOutgoing: true,
    soundboardQuack: true,
  });

  // Soundboard states
  const [soundboardVolume, setSoundboardVolume] = useState(100);
  const [entranceServer, setEntranceServer] = useState('all');
  const [entranceSound, setEntranceSound] = useState('none');
  const [isChoosingEntranceSound, setIsChoosingEntranceSound] = useState(false);

  // Diagnostic states
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [debugLogging, setDebugLogging] = useState(false);
  const [audioSubsystem, setAudioSubsystem] = useState('standard');
  const [webrtcQos, setWebrtcQos] = useState(true);
  const [diagnosticPacketCapture, setDiagnosticPacketCapture] = useState(false);

  // Real Camera Preview Test
  const startCameraTest = async () => {
    try {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      const constraints: MediaStreamConstraints = {
        video:
          settings.cameraDeviceId && settings.cameraDeviceId !== 'default'
            ? { deviceId: { exact: settings.cameraDeviceId } }
            : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      cameraStreamRef.current = stream;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        cameraVideoRef.current.play().catch(() => {});
      }
      setIsCameraTesting(true);
    } catch {
      toast.error(t('Kamera tidak ditemukan atau izin akses ditolak'));
      setIsCameraTesting(false);
    }
  };

  const stopCameraTest = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
    setIsCameraTesting(false);
  };

  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (open) {
      setActiveSection((initialSection as SettingsSection) || 'account');
      setAccountSubView('main');
      setSearchQuery('');
    }
  }, [open, initialSection]);

  // ==========================================
  // APPEARANCE STATES (Discord Parity)
  // ==========================================
  const [sameAsDeviceTheme, setSameAsDeviceTheme] = useState(false);
  const [selectedDefaultTheme, setSelectedDefaultTheme] = useState<string>('navy');
  const [selectedColorTheme, setSelectedColorTheme] = useState<string>('custom');
  const [syncThemeDevices, setSyncThemeDevices] = useState(true);
  const [applyThemeToProfiles, setApplyThemeToProfiles] = useState(false);
  const [selectedAppIcon, setSelectedAppIcon] = useState('blurple');

  // Messages appearance states
  const [showMediaFromLinks, setShowMediaFromLinks] = useState(true);
  const [showMediaUploaded, setShowMediaUploaded] = useState(true);
  const [showEmbedsPreviews, setShowEmbedsPreviews] = useState(true);
  const [showEmojiReactions, setShowEmojiReactions] = useState(true);
  const [spoilerDisplay, setSpoilerDisplay] = useState<'click' | 'mod' | 'always'>('click');
  const [openThreadsSplitView, setOpenThreadsSplitView] = useState(true);
  const [showUserAvatars, setShowUserAvatars] = useState(true);
  const [showFavoritesServer, setShowFavoritesServer] = useState(false);

  // Chat Box states
  const [previewMarkdownAsType, setPreviewMarkdownAsType] = useState(true);
  const [convertEmoticonsToEmoji, setConvertEmoticonsToEmoji] = useState(true);
  const [showStickersAutocomplete, setShowStickersAutocomplete] = useState(false);
  const [showGamesAutocomplete, setShowGamesAutocomplete] = useState(true);
  const [showSendMessageButton, setShowSendMessageButton] = useState(false);

  // Search scope state
  const [dmSearchScope, setDmSearchScope] = useState<'single' | 'all'>('single');

  // Streamer Mode states
  const [streamerModeEnabled, setStreamerModeEnabled] = useState(false);
  const [autoStreamerModeObs, setAutoStreamerModeObs] = useState(true);
  const [streamerHidePersonalInfo, setStreamerHidePersonalInfo] = useState(true);
  const [streamerHideInviteLinks, setStreamerHideInviteLinks] = useState(true);
  const [streamerDisableSounds, setStreamerDisableSounds] = useState(true);
  const [streamerDisableNotifications, setStreamerDisableNotifications] = useState(true);
  const [streamerHideWindowCapture, setStreamerHideWindowCapture] = useState(false);

  // ==========================================
  // ACCESSIBILITY STATES (Discord Parity)
  // ==========================================
  // Text Readability
  const [chatFontSize, setChatFontSize] = useState<number>(16);
  const [alwaysUnderlineLinks, setAlwaysUnderlineLinks] = useState(false);
  const [displayNameStyles, setDisplayNameStyles] = useState(true);

  // Visual Density
  const [uiDensity, setUiDensity] = useState<'compact' | 'default' | 'spacious'>('default');
  const [chatMessageDisplay, setChatMessageDisplay] = useState<'default' | 'compact'>('default');
  const [spaceMessageGroups, setSpaceMessageGroups] = useState<number>(16);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Color & Contrast
  const [saturationLevel, setSaturationLevel] = useState<number>(100);
  const [applySaturationCustomColors, setApplySaturationCustomColors] = useState(false);
  const [enableHighContrast, setEnableHighContrast] = useState(false);
  const [syncContrastSettings, setSyncContrastSettings] = useState(true);
  const [roleColorsDisplay, setRoleColorsDisplay] = useState<'names' | 'dot' | 'none'>('names');
  const [officialMessagesStyle, setOfficialMessagesStyle] = useState<'default' | 'contrast' | 'plain'>('default');
  const [showOnOffIndicators, setShowOnOffIndicators] = useState(false);

  // Reduced Motion
  const [enableReducedMotion, setEnableReducedMotion] = useState(false);
  const [syncReducedMotionComputer, setSyncReducedMotionComputer] = useState(true);
  const [notificationDuration, setNotificationDuration] = useState<number>(3);
  const [playGifsFocused, setPlayGifsFocused] = useState(true);
  const [playAnimatedEmoji, setPlayAnimatedEmoji] = useState(true);
  const [stickerAnimationMode, setStickerAnimationMode] = useState<'always' | 'interaction' | 'never'>('always');

  // Audio & Screen Reader
  const [ttsRate, setTtsRate] = useState<number>(1.0);
  const [showImageDescriptions, setShowImageDescriptions] = useState(false);
  const [useLegacyChatInput, setUseLegacyChatInput] = useState(false);

  const previewTtsSpeech = () => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const text = 'This is a preview of the text to speech rate in Anticeil.';
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = ttsRate;
        window.speechSynthesis.speak(utterance);
        toast.success(t('Memutar preview Text-to-Speech'));
      } else {
        playPreviewSound('message');
      }
    } catch {
      toast.info(t('Preview Text-to-Speech'));
    }
  };

  // ==========================================
  // SYSTEM STATES (Discord Parity)
  // ==========================================
  const [autoStartApp, setAutoStartApp] = useState(false);
  const [startMinimized, setStartMinimized] = useState(false);
  const [minimizeToTray, setMinimizeToTray] = useState(true);
  const [enableHardwareAcceleration, setEnableHardwareAcceleration] = useState(true);

  // Custom Keybinds
  const [customKeybinds, setCustomKeybinds] = useState<Array<{
    id: string;
    action: string;
    keybind: string;
    enabled: boolean;
  }>>([
    {
      id: 'kb-1',
      action: 'Activate Overlay Chat',
      keybind: 'No Keybind Set',
      enabled: true,
    },
  ]);
  const [recordingKeybindId, setRecordingKeybindId] = useState<string | null>(null);

  // System Helper & Trace
  const [isSystemHelperInstalled, setIsSystemHelperInstalled] = useState(false);
  const [isCapturingTrace, setIsCapturingTrace] = useState(false);
  const [traceProgress, setTraceProgress] = useState(0);

  const startPerformanceTrace = () => {
    setIsCapturingTrace(true);
    setTraceProgress(0);
    toast.info(t('Memulai perekaman performa trace selama 30 detik...'));

    let current = 0;
    const interval = setInterval(() => {
      current += 10;
      setTraceProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        setIsCapturingTrace(false);
        setTraceProgress(0);
        toast.success(t('Performance trace berhasil direkam dan siap dilampirkan ke support tiket!'));
      }
    }, 300);
  };

  // ==========================================
  // LANGUAGE & TIME STATES (Discord Parity)
  // ==========================================
  const [timeFormat, setTimeFormat] = useState<'auto' | '12h' | '24h'>(() => {
    try {
      return (localStorage.getItem('anticeil_time_format') as any) || 'auto';
    } catch {
      return 'auto';
    }
  });
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>(() => {
    return locale === 'id' ? 'id-ID' : 'en-US';
  });
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [languageSearch, setLanguageSearch] = useState('');

  const languagesList = useMemo(() => [
    { code: 'en-US', locale: 'en' as const, flag: '🇺🇸', name: 'English, US' },
    { code: 'id-ID', locale: 'id' as const, flag: '🇮🇩', name: 'Bahasa Indonesia' },
    { code: 'en-GB', locale: 'en' as const, flag: '🇬🇧', name: 'English, UK' },
    { code: 'es-ES', locale: 'en' as const, flag: '🇪🇸', name: 'Español' },
    { code: 'fr-FR', locale: 'en' as const, flag: '🇫🇷', name: 'Français' },
    { code: 'de-DE', locale: 'en' as const, flag: '🇩🇪', name: 'Deutsch' },
    { code: 'it-IT', locale: 'en' as const, flag: '🇮🇹', name: 'Italiano' },
    { code: 'ja-JP', locale: 'en' as const, flag: '🇯🇵', name: '日本語' },
    { code: 'ko-KR', locale: 'en' as const, flag: '🇰🇷', name: '한국어' },
    { code: 'zh-CN', locale: 'en' as const, flag: '🇨🇳', name: '简体中文' },
    { code: 'zh-TW', locale: 'en' as const, flag: '🇹🇼', name: '繁體中文' },
    { code: 'ru-RU', locale: 'en' as const, flag: '🇷🇺', name: 'Русский' },
    { code: 'pt-BR', locale: 'en' as const, flag: '🇧🇷', name: 'Português do Brasil' },
    { code: 'tr-TR', locale: 'en' as const, flag: '🇹🇷', name: 'Türkçe' },
    { code: 'vi-VN', locale: 'en' as const, flag: '🇻🇳', name: 'Tiếng Việt' },
    { code: 'pl-PL', locale: 'en' as const, flag: '🇵🇱', name: 'Polski' },
    { code: 'nl-NL', locale: 'en' as const, flag: '🇳🇱', name: 'Nederlands' },
    { code: 'sv-SE', locale: 'en' as const, flag: '🇸🇪', name: 'Svenska' },
    { code: 'da-DK', locale: 'en' as const, flag: '🇩🇰', name: 'Dansk' },
    { code: 'th-TH', locale: 'en' as const, flag: '🇹🇭', name: 'ไทย' },
    { code: 'ar-SA', locale: 'en' as const, flag: '🇸🇦', name: 'العربية' },
    { code: 'hi-IN', locale: 'en' as const, flag: '🇮🇳', name: 'हिन्दी' },
  ], []);

  const currentLanguage = useMemo(() => {
    return languagesList.find((l) => l.code === selectedLanguageCode) || languagesList[0];
  }, [languagesList, selectedLanguageCode]);

  // ==========================================
  // REGISTERED GAMES & ACTIVITY PRIVACY STATES (Discord Parity)
  // ==========================================
  interface RegisteredGame {
    id: string;
    name: string;
    verified: boolean;
    lastPlayed: string;
    enabled: boolean;
    icon?: string;
  }

  const [registeredGames, setRegisteredGames] = useState<RegisteredGame[]>([
    {
      id: 'terraria',
      name: 'Terraria',
      verified: true,
      lastPlayed: '2 days ago',
      enabled: true,
      icon: '🌳',
    },
  ]);
  const [isAddingGameDropdownOpen, setIsAddingGameDropdownOpen] = useState(false);
  const [selectedGameToAdd, setSelectedGameToAdd] = useState('');
  const [customGameInput, setCustomGameInput] = useState('');

  const detectableGamesPreset = useMemo(
    () => [
      { name: 'Minecraft', verified: true, icon: '⛏️' },
      { name: 'Valorant', verified: true, icon: '🎯' },
      { name: 'Visual Studio Code', verified: false, icon: '💻' },
      { name: 'Spotify', verified: true, icon: '🎧' },
      { name: 'Counter-Strike 2', verified: true, icon: '💣' },
      { name: 'Genshin Impact', verified: true, icon: '✨' },
      { name: 'League of Legends', verified: true, icon: '⚔️' },
      { name: 'Grand Theft Auto V', verified: true, icon: '🚗' },
    ],
    [],
  );

  // Activity Privacy
  const [shareMyActivity, setShareMyActivity] = useState(true);
  const [shareWhenOnline, setShareWhenOnline] = useState(true);
  const [shareWhenStreaming, setShareWhenStreaming] = useState(true);
  const [shareServerScope, setShareServerScope] = useState<'all' | 'small' | 'none'>('all');
  const [activityServerSearch, setActivityServerSearch] = useState('');
  const [activityServerSortOrder, setActivityServerSortOrder] = useState<'order' | 'name' | 'members'>('order');
  const [showMoreActivityServers, setShowMoreActivityServers] = useState(false);

  // Activity Joining
  const [allowFriendsJoinGame, setAllowFriendsJoinGame] = useState(true);
  const [allowVoiceParticipantsJoinGame, setAllowVoiceParticipantsJoinGame] = useState(true);

  interface ActivityServerItem {
    id: string;
    name: string;
    members: number;
    avatarFallback: string;
    isPrimary?: boolean;
  }

  const initialActivityServers: ActivityServerItem[] = useMemo(
    () => [
      { id: 'hok-id', name: 'Honor of Kings Indonesia', members: 70494, avatarFallback: 'HOK', isPrimary: true },
      { id: 'zmsta-srv', name: "zmsta's server", members: 1, avatarFallback: 'zs', isPrimary: true },
      { id: 'fullz', name: '[FULLZ]', members: 9140, avatarFallback: 'FZ', isPrimary: true },
      { id: 'nasgul', name: 'Nasgul Community', members: 132520, avatarFallback: 'NC', isPrimary: true },
      { id: 'awd', name: 'awd', members: 4, avatarFallback: 'a', isPrimary: true },
      { id: 'moku', name: 'Moku', members: 24500, avatarFallback: 'MK' },
      { id: 'wild-forest', name: 'Wild Forest', members: 18200, avatarFallback: 'WF' },
      { id: 'cerita-crypto', name: 'Cerita Crypto', members: 45310, avatarFallback: 'CC' },
      { id: 'genshin-id', name: 'Genshin Impact ID', members: 58920, avatarFallback: 'GI' },
      { id: 'valorant-sea', name: 'Valorant SEA', members: 89400, avatarFallback: 'VS' },
      { id: 'indonesia-dev', name: 'Developer Indonesia', members: 31200, avatarFallback: 'DI' },
    ],
    [],
  );

  const [serverActivityEnabledMap, setServerActivityEnabledMap] = useState<Record<string, boolean>>(() => {
    return {
      'hok-id': true,
      'zmsta-srv': true,
      'fullz': true,
      'nasgul': true,
      'awd': true,
      'moku': true,
      'wild-forest': true,
      'cerita-crypto': true,
      'genshin-id': true,
      'valorant-sea': true,
      'indonesia-dev': true,
    };
  });

  const isAnyServerActivityOn = useMemo(() => {
    return Object.values(serverActivityEnabledMap).some(Boolean);
  }, [serverActivityEnabledMap]);

  const handleToggleAllServers = () => {
    const nextState = !isAnyServerActivityOn;
    setServerActivityEnabledMap((prev) => {
      const updated: Record<string, boolean> = {};
      Object.keys(prev).forEach((k) => {
        updated[k] = nextState;
      });
      return updated;
    });
    toast.success(
      nextState
        ? t('Semua server diaktifkan pembagian aktivitas')
        : t('Semua server dinonaktifkan pembagian aktivitas'),
    );
  };

  const filteredActivityServers = useMemo(() => {
    let list = [...initialActivityServers];
    if (activityServerSearch.trim()) {
      const q = activityServerSearch.toLowerCase().trim();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    if (activityServerSortOrder === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (activityServerSortOrder === 'members') {
      list.sort((a, b) => b.members - a.members);
    }
    return list;
  }, [activityServerSearch, activityServerSortOrder, initialActivityServers]);

  const primaryActivityServers = useMemo(() => {
    return filteredActivityServers.slice(0, 5);
  }, [filteredActivityServers]);

  const secondaryActivityServers = useMemo(() => {
    return filteredActivityServers.slice(5);
  }, [filteredActivityServers]);

  // ==========================================
  // GAME OVERLAY STATES (Discord Parity)
  // ==========================================
  // Overview
  const [enableOverlay, setEnableOverlay] = useState(true);
  const [enableLegacyOverlay, setEnableLegacyOverlay] = useState(true);
  const [overlayLockKeybind, setOverlayLockKeybind] = useState("SHIFT + '");
  const [isEditingOverlayKeybind, setIsEditingOverlayKeybind] = useState(false);
  const [tempOverlayKeybind, setTempOverlayKeybind] = useState("SHIFT + '");
  const [enableClickableRegions, setEnableClickableRegions] = useState(true);

  // Widgets
  const [widgetVoice, setWidgetVoice] = useState(true);
  const [widgetQuickActions, setWidgetQuickActions] = useState(true);
  const [widgetNotifications, setWidgetNotifications] = useState(true);
  const [widgetChat, setWidgetChat] = useState(true);
  const [widgetActivity, setWidgetActivity] = useState(true);
  const [widgetVideo, setWidgetVideo] = useState(true);
  const [widgetStreams, setWidgetStreams] = useState(true);

  // Voice Widget
  const [overlayAvatarSize, setOverlayAvatarSize] = useState<'Large' | 'Small'>('Large');
  const [overlayDisplayNames, setOverlayDisplayNames] = useState<'Always' | 'Only While Speaking' | 'Never'>('Always');
  const [overlayDisplayUsers, setOverlayDisplayUsers] = useState<'Always' | 'Only While Speaking'>('Always');
  const [overlayMaxUsers, setOverlayMaxUsers] = useState<number>(8);
  const [isVoiceWidgetPinned, setIsVoiceWidgetPinned] = useState(true);

  // Notifications
  const [overlayNotifMessages, setOverlayNotifMessages] = useState(true);
  const [overlayNotifWelcome, setOverlayNotifWelcome] = useState(true);
  const [overlayNotifGoLive, setOverlayNotifGoLive] = useState(true);
  const [overlayNotifGameActivity, setOverlayNotifGameActivity] = useState(true);
  const [overlayNotifNowPlaying, setOverlayNotifNowPlaying] = useState(true);

  const handleResetOverlayWidgets = () => {
    setWidgetVoice(true);
    setWidgetQuickActions(true);
    setWidgetNotifications(true);
    setWidgetChat(true);
    setWidgetActivity(true);
    setWidgetVideo(true);
    setWidgetStreams(true);
    toast.success(t('Tata letak widget overlay dikembalikan ke default!'));
  };

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
        {
          id: 'voice',
          label: t('Voice & Video'),
          icon: <Mic className="w-4 h-4" />,
          subItems: [
            { id: 'voice-voice', label: t('Voice') },
            { id: 'voice-camera', label: t('Camera') },
            { id: 'voice-streaming', label: t('Streaming') },
            { id: 'voice-sounds', label: t('Sounds') },
            { id: 'voice-soundboard', label: t('Soundboard') },
            { id: 'voice-advanced', label: t('Advanced') },
          ],
        },
        {
          id: 'appearance',
          label: t('Appearance'),
          icon: <Palette className="w-4 h-4" />,
          subItems: [
            { id: 'appearance-theme', label: t('Theme') },
            { id: 'appearance-app-icon', label: t('App Icon') },
            { id: 'appearance-messages', label: t('Messages') },
            { id: 'appearance-chat-box', label: t('Chat Box') },
            { id: 'appearance-search', label: t('Search') },
            { id: 'appearance-streamer-mode', label: t('Streamer Mode') },
          ],
        },
        {
          id: 'accessibility',
          label: t('Accessibility'),
          icon: <SlidersHorizontal className="w-4 h-4" />,
          subItems: [
            { id: 'accessibility-text-readability', label: t('Text Readability') },
            { id: 'accessibility-visual-density', label: t('Visual Density') },
            { id: 'accessibility-color-contrast', label: t('Color & Contrast') },
            { id: 'accessibility-reduced-motion', label: t('Reduced Motion') },
            { id: 'accessibility-audio-screen-reader', label: t('Audio & Screen Reader') },
          ],
        },
        {
          id: 'system',
          label: t('System'),
          icon: <Laptop className="w-4 h-4" />,
          subItems: [
            { id: 'system-general', label: t('General') },
            { id: 'system-custom-keybinds', label: t('Custom Keybinds') },
            { id: 'system-default-keybinds', label: t('Default Keybinds') },
            { id: 'system-helper', label: t('System Helper') },
            { id: 'system-advanced', label: t('Advanced') },
          ],
        },
        {
          id: 'language',
          label: t('Language & Time'),
          icon: <Languages className="w-4 h-4" />,
        },
      ],
    },
    {
      key: 'GAMES_APPS',
      title: t('Games & Apps'),
      items: [
        {
          id: 'registered_games',
          label: t('Registered Games'),
          icon: <Gamepad2 className="w-4 h-4" />,
          subItems: [
            { id: 'registered-current-game', label: t('Current Game') },
            { id: 'registered-added-games', label: t('Added Games') },
          ],
        },
        {
          id: 'activity_privacy',
          label: t('Activity Privacy'),
          icon: <Users className="w-4 h-4" />,
          subItems: [
            { id: 'activity-what-i-share', label: t('What Activity I Share') },
            { id: 'activity-where-i-share', label: t('Where I Share Activity') },
            { id: 'activity-joining', label: t('Activity Joining') },
          ],
        },
        {
          id: 'overlay',
          label: t('Game Overlay'),
          icon: <Layers className="w-4 h-4" />,
          subItems: [
            { id: 'overlay-overview', label: t('Overview') },
            { id: 'overlay-widgets', label: t('Widgets') },
            { id: 'overlay-voice-widget', label: t('Voice Widget') },
            { id: 'overlay-notifications', label: t('Notifications') },
          ],
        },
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
        const target = id === 'keybinds' ? 'system' : id;
        setActiveSection(target as SettingsSection);
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
        {/* SECTION: VOICE & VIDEO (DISCORD PARITY)                                   */}
        {/* ========================================================================= */}
        {activeSection === 'voice' && (
          <div className="space-y-8 divide-y divide-border/50 pb-8">
            {/* SUB-SECTION 1: VOICE */}
            <div id="voice-voice" className="scroll-mt-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {t('Voice')}
                </h2>
              </div>

              {/* Input & Output Devices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Microphone Select */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                    {t('Microphone')}
                  </label>
                  <div className="relative">
                    <select
                      value={settings.inputDeviceId}
                      onChange={(e) => updateSetting('inputDeviceId', e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2.5 rounded-lg bg-[#1e1f22] border border-border/80 text-foreground appearance-none outline-none focus:ring-1 focus:ring-primary cursor-pointer pr-8"
                    >
                      {audioInputDevices.length > 0 ? (
                        audioInputDevices.map((d) => (
                          <option key={d.deviceId} value={d.deviceId} className="bg-[#2b2d31] text-foreground">
                            {d.label || `Microphone (${d.deviceId.slice(0, 5)})`}
                          </option>
                        ))
                      ) : (
                        <option value="default" className="bg-[#2b2d31] text-foreground">
                          Windows Default (Realtek(R) Audio)
                        </option>
                      )}
                    </select>
                    <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Speaker Select */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                    {t('Speaker')}
                  </label>
                  <div className="relative">
                    <select
                      value={settings.outputDeviceId}
                      onChange={(e) => updateSetting('outputDeviceId', e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2.5 rounded-lg bg-[#1e1f22] border border-border/80 text-foreground appearance-none outline-none focus:ring-1 focus:ring-primary cursor-pointer pr-8"
                    >
                      {audioOutputDevices.length > 0 ? (
                        audioOutputDevices.map((d) => (
                          <option key={d.deviceId} value={d.deviceId} className="bg-[#2b2d31] text-foreground">
                            {d.label || `Speaker (${d.deviceId.slice(0, 5)})`}
                          </option>
                        ))
                      ) : (
                        <option value="default" className="bg-[#2b2d31] text-foreground">
                          Windows Default (soundcore R50i)
                        </option>
                      )}
                    </select>
                    <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Volume Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Microphone Volume */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">{t('Microphone Volume')}</span>
                    <span className="text-[11px] text-muted-foreground font-mono">{settings.inputVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.inputVolume}
                    onChange={(e) => updateSetting('inputVolume', Number(e.target.value))}
                    className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-[#5865F2]"
                  />
                </div>

                {/* Speaker Volume */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">{t('Speaker Volume')}</span>
                    <span className="text-[11px] text-muted-foreground font-mono">{settings.outputVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.outputVolume}
                    onChange={(e) => updateSetting('outputVolume', Number(e.target.value))}
                    className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-[#5865F2]"
                  />
                </div>
              </div>

              {/* Mic Test Section (Discord Blurple button + Equalizer bars) */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    onClick={isMicTesting ? stopMicTest : startMicTest}
                    className={cn(
                      'px-5 py-2 h-9 text-xs font-bold rounded-md transition-all shrink-0 cursor-pointer shadow-sm',
                      isMicTesting
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-[#5865F2] hover:bg-[#4752C4] text-white',
                    )}
                  >
                    {isMicTesting ? t('Stop Testing') : t('Mic Test')}
                  </Button>

                  {/* Visual equalizer bars meter */}
                  <div className="flex-1 flex items-center gap-[3px] h-7 px-3 py-1 bg-[#1e1f22] rounded-lg border border-border/60 overflow-hidden">
                    {Array.from({ length: 48 }).map((_, i) => {
                      const barThreshold = (i / 48) * 100;
                      const isLit = isMicTesting && micVolumeLevel >= barThreshold;
                      return (
                        <span
                          key={i}
                          className={cn(
                            'flex-1 h-full rounded-[1px] transition-colors duration-75',
                            isLit
                              ? i > 36
                                ? 'bg-rose-500'
                                : i > 24
                                  ? 'bg-amber-400'
                                  : 'bg-emerald-500'
                              : 'bg-muted/40',
                          )}
                        />
                      );
                    })}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {t('Need help? Check out our')}{' '}
                  <span
                    onClick={() => toast.info(t('Troubleshooting: Pastikan izin mikrofon browser Anda aktif.'))}
                    className="text-[#5865F2] hover:underline cursor-pointer font-medium"
                  >
                    {t('troubleshooting guide')}
                  </span>
                  .
                </p>
              </div>

              <div className="h-px bg-border/60 my-6" />

              {/* Input Profile */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  {t('Input Profile')}
                </label>
                <div className="space-y-2.5">
                  {[
                    {
                      id: 'voice-isolation',
                      title: 'Voice Isolation',
                      desc: 'Just your beautiful voice: let Discord cut through the noise',
                    },
                    {
                      id: 'studio',
                      title: 'Studio',
                      desc: 'Pure audio: open mic with no processing',
                    },
                    {
                      id: 'custom',
                      title: 'Custom',
                      desc: 'Advanced mode: give me all the buttons and dials!',
                    },
                  ].map((prof) => {
                    const isSelected = settings.inputProfile === prof.id;
                    return (
                      <div
                        key={prof.id}
                        onClick={() => updateSetting('inputProfile', prof.id as any)}
                        className={cn(
                          'flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer',
                          isSelected
                            ? 'bg-[#5865F2]/5 border-[#5865F2] shadow-xs'
                            : 'bg-card border-border/70 hover:bg-muted/30',
                        )}
                      >
                        <div className="mt-0.5 shrink-0">
                          <div
                            className={cn(
                              'size-4 rounded-full border-2 flex items-center justify-center transition-all',
                              isSelected ? 'border-[#5865F2]' : 'border-muted-foreground/50',
                            )}
                          >
                            {isSelected && <div className="size-2 rounded-full bg-[#5865F2]" />}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-bold text-foreground">{prof.title}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{prof.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Automatically Adjust Input Sensitivity */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold text-foreground">
                      {t('Automatically Adjust Input Sensitivity')}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 max-w-xl leading-relaxed">
                      {t(
                        'Controls how much sound Discord transmits from your mic. Speak to test your mic — if the meter is filled, Discord is transmitting your beautiful voice.',
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={settings.autoSensitivity}
                    onCheckedChange={(val) => updateSetting('autoSensitivity', val)}
                  />
                </div>

                {/* Horizontal Sensitivity Meter */}
                <div className="relative w-full h-3 bg-[#1e1f22] rounded-full overflow-hidden border border-border/60">
                  <div
                    className="h-full bg-linear-to-r from-emerald-500 via-teal-400 to-[#5865F2] transition-all duration-75"
                    style={{ width: `${isMicTesting ? Math.min(100, micVolumeLevel) : 35}%` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-sm"
                    style={{ left: `${settings.sensitivityThreshold || 50}%` }}
                  />
                </div>
              </div>

              {/* Noise Suppression (Krisp) */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border/70 bg-card">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Noise Suppression')}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {t('Reduces background noise from your mic. Powered by')}{' '}
                    <span className="text-[#5865F2] font-semibold">Krisp</span>.
                  </div>
                  <div className="mt-1 font-black text-sm tracking-tight text-foreground lowercase flex items-center gap-1">
                    krisp
                  </div>
                </div>
                <div className="relative shrink-0">
                  <select
                    value={settings.noiseSuppression}
                    onChange={(e) => updateSetting('noiseSuppression', e.target.value as NoiseSuppressionType)}
                    className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#1e1f22] border border-border/80 text-foreground appearance-none outline-none focus:ring-1 focus:ring-primary cursor-pointer pr-8"
                  >
                    <option value="krisp" className="bg-[#2b2d31] text-foreground">Krisp</option>
                    <option value="standard" className="bg-[#2b2d31] text-foreground">Standard</option>
                    <option value="none" className="bg-[#2b2d31] text-foreground">None</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Echo Cancellation */}
              <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Echo Cancellation')}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {t('Mencegah feedback suara dari speaker masuk kembali ke mikrofon Anda.')}
                  </div>
                </div>
                <Switch
                  checked={settings.echoCancellation}
                  onCheckedChange={(val) => updateSetting('echoCancellation', val)}
                />
              </div>

              {/* Push to Talk */}
              <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Push to Talk')}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {t('Mikrofon hanya akan aktif saat tombol pintasan ditekan.')}
                  </div>
                </div>
                <Switch
                  checked={settings.pushToTalk}
                  onCheckedChange={(val) => updateSetting('pushToTalk', val)}
                />
              </div>

              {/* Show Advanced Voice Settings Accordion */}
              <div className="border border-border/70 rounded-xl overflow-hidden bg-card">
                <button
                  type="button"
                  onClick={() => setShowAdvancedVoice(!showAdvancedVoice)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-foreground">{t('Show Advanced Voice Settings')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t('Automatic Gain Control, Advanced Voice Activity, Bypass System Audio Input Processing, and more')}
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0',
                      showAdvancedVoice && 'rotate-180',
                    )}
                  />
                </button>

                {showAdvancedVoice && (
                  <div className="p-4 pt-1 space-y-4 border-t border-border/60 bg-muted/10">
                    <div className="flex items-center justify-between gap-4 py-1">
                      <div>
                        <div className="text-xs font-bold text-foreground">{t('Automatic Gain Control')}</div>
                        <div className="text-[11px] text-muted-foreground">{t('Menstabilkan volume mikrofon secara dinamis')}</div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between gap-4 py-1">
                      <div>
                        <div className="text-xs font-bold text-foreground">{t('Advanced Voice Activity')}</div>
                        <div className="text-[11px] text-muted-foreground">{t('Pendeteksian aktivitas suara cerdas')}</div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between gap-4 py-1">
                      <div>
                        <div className="text-xs font-bold text-foreground">{t('Bypass System Audio Input Processing')}</div>
                        <div className="text-[11px] text-muted-foreground">{t('Langsung memproses audio mentah tanpa filter OS')}</div>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between gap-4 py-1">
                      <div>
                        <div className="text-xs font-bold text-foreground">{t('Quality of Service High Packet Priority')}</div>
                        <div className="text-[11px] text-muted-foreground">{t('Memprioritaskan paket suara WebRTC di jaringan router')}</div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SUB-SECTION 2: CAMERA */}
            <div id="voice-camera" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Camera')}</h2>
              </div>

              {/* Test Video Button & Preview */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    onClick={isCameraTesting ? stopCameraTest : startCameraTest}
                    className={cn(
                      'px-6 py-2.5 h-10 text-xs font-bold rounded-md transition-all cursor-pointer shadow-sm',
                      isCameraTesting
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-[#5865F2] hover:bg-[#4752C4] text-white',
                    )}
                  >
                    {isCameraTesting ? t('Stop Video') : t('Test Video')}
                  </Button>
                </div>

                {isCameraTesting && (
                  <div className="w-full max-w-lg aspect-video rounded-xl bg-black border border-border/80 overflow-hidden relative shadow-lg">
                    <video
                      ref={cameraVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-semibold text-white flex items-center gap-1.5 border border-white/10">
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Camera Active Preview</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Always preview video switch */}
              <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Always preview video')}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {t('Pops up preview modal every time you turn on video')}
                  </div>
                </div>
                <Switch
                  checked={settings.alwaysPreviewVideo}
                  onCheckedChange={(val) => updateSetting('alwaysPreviewVideo', val)}
                />
              </div>

              {/* Camera dropdown */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  {t('Camera')}
                </label>
                <div className="relative max-w-md">
                  <select
                    value={settings.cameraDeviceId}
                    onChange={(e) => updateSetting('cameraDeviceId', e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-lg bg-[#1e1f22] border border-border/80 text-foreground appearance-none outline-none focus:ring-1 focus:ring-primary cursor-pointer pr-8"
                  >
                    {videoInputDevices.length > 0 ? (
                      videoInputDevices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId} className="bg-[#2b2d31] text-foreground">
                          📷 {d.label || `Camera (${d.deviceId.slice(0, 5)})`}
                        </option>
                      ))
                    ) : (
                      <option value="default" className="bg-[#2b2d31] text-foreground">
                        📷 HD User Facing (Integrated Webcam)
                      </option>
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {t('Looking for more camera options? Check out your')}{' '}
                  <span
                    onClick={() => toast.info(t('Buka Windows Settings > Bluetooth & Devices > Cameras untuk konfigurasi perangkat lanjutan.'))}
                    className="text-[#5865F2] hover:underline cursor-pointer font-medium"
                  >
                    {t('system camera settings')}
                  </span>
                  .
                </p>
              </div>

              {/* Video Background Picker Grid */}
              <div className="space-y-3 pt-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  {t('Video Background')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'none', label: 'None', type: 'icon', icon: '⊘' },
                    { id: 'blur', label: 'Blur', type: 'gradient', grad: 'from-zinc-700 via-zinc-800 to-zinc-900', icon: '👤' },
                    { id: 'custom', label: 'Custom', type: 'gradient', grad: 'from-purple-800 via-indigo-900 to-purple-950', icon: '🖼️+' },
                    { id: 'lilac-nebula', label: 'Lilac Planet', isVideo: true, grad: 'from-violet-900 via-purple-700 to-indigo-800' },
                    { id: 'cosmic-world', label: 'Cosmic World', isNew: true, isVideo: true, grad: 'from-indigo-950 via-purple-900 to-pink-900' },
                    { id: 'hacker-terminal', label: 'Hacker Grid', isVideo: true, grad: 'from-emerald-950 via-green-900 to-teal-950' },
                    { id: 'lofi-room', label: 'Lofi Room', isVideo: true, grad: 'from-blue-950 via-indigo-950 to-slate-900' },
                    { id: 'neon-cityscape', label: 'Neon Skyline', isVideo: true, grad: 'from-purple-950 via-fuchsia-900 to-indigo-950' },
                    { id: 'sunny-cafe', label: 'Sunny Cafe', grad: 'from-amber-700 via-orange-800 to-yellow-900' },
                    { id: 'tropical-beach', label: 'Tropical Beach', grad: 'from-cyan-800 via-teal-700 to-blue-900' },
                    { id: 'synthwave', label: 'Retro Wave', grad: 'from-pink-900 via-purple-900 to-indigo-950' },
                  ].map((bg) => {
                    const isSelected = selectedVideoBackground === bg.id;
                    return (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => {
                          setSelectedVideoBackground(bg.id);
                          toast.success(t(`Latar belakang video diatur ke ${bg.label}`));
                        }}
                        className={cn(
                          'relative aspect-video rounded-xl overflow-hidden border-2 transition-all p-2 flex flex-col justify-end cursor-pointer group',
                          isSelected
                            ? 'border-[#5865F2] ring-2 ring-[#5865F2]/40 shadow-md'
                            : 'border-border/60 hover:border-border hover:shadow-xs',
                          bg.grad ? `bg-linear-to-br ${bg.grad}` : 'bg-[#1e1f22]',
                        )}
                      >
                        {/* Badges */}
                        {bg.isNew && (
                          <span className="absolute top-2 left-2 bg-[#5865F2] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                            NEW
                          </span>
                        )}
                        {bg.isVideo && (
                          <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] size-5 rounded-full flex items-center justify-center">
                            ▶
                          </span>
                        )}

                        {/* Center icon if any */}
                        {bg.icon && (
                          <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-muted-foreground/80 group-hover:scale-110 transition-transform">
                            {bg.icon}
                          </div>
                        )}

                        <span className="relative z-10 text-[11px] font-bold text-white drop-shadow-md text-left">
                          {bg.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SUB-SECTION 3: STREAMING */}
            <div id="voice-streaming" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Streaming')}</h2>
              </div>

              {/* Show Stream Previews switch */}
              <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Show Stream Previews')}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {t('Allows others to see a preview of your stream before they join.')}
                  </div>
                </div>
                <Switch
                  checked={showStreamPreviews}
                  onCheckedChange={setShowStreamPreviews}
                />
              </div>

              {/* Show Advanced Stream Settings Accordion */}
              <div className="border border-border/70 rounded-xl overflow-hidden bg-card">
                <button
                  type="button"
                  onClick={() => setShowAdvancedStream(!showAdvancedStream)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-foreground">{t('Show Advanced Stream Settings')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t('Stream Attenuation, Stream Attenuation Strength, and more')}
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0',
                      showAdvancedStream && 'rotate-180',
                    )}
                  />
                </button>

                {showAdvancedStream && (
                  <div className="p-4 pt-1 space-y-4 border-t border-border/60 bg-muted/10">
                    <div className="flex items-center justify-between gap-4 py-1">
                      <div>
                        <div className="text-xs font-bold text-foreground">{t('Stream Attenuation')}</div>
                        <div className="text-[11px] text-muted-foreground">{t('Menurunkan volume game saat Anda berbicara saat live stream')}</div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="space-y-1.5 py-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground">{t('Stream Attenuation Strength')}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">75%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        defaultValue={75}
                        className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-[#5865F2]"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4 py-1">
                      <div>
                        <div className="text-xs font-bold text-foreground">{t('Hardware Acceleration for Screen Capture')}</div>
                        <div className="text-[11px] text-muted-foreground">{t('Menggunakan akselerasi GPU untuk screen sharing tanpa lag')}</div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between gap-4 py-1">
                      <div>
                        <div className="text-xs font-bold text-foreground">{t('Use OpenH264 Video Codec by Cisco')}</div>
                        <div className="text-[11px] text-muted-foreground">{t('Codec kompresi video standar berkinerja tinggi')}</div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SUB-SECTION 4: SOUNDS */}
            <div id="voice-sounds" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Sounds')}</h2>
              </div>

              {/* Core 4 sound rows */}
              <div className="space-y-3">
                {/* Deafen */}
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-bold text-foreground">{t('Deafen')}</div>
                    <button
                      type="button"
                      onClick={() => playPreviewSound('deafen')}
                      className="text-[11px] text-[#5865F2] hover:underline font-semibold cursor-pointer block mt-0.5"
                    >
                      {t('Preview Sound')}
                    </button>
                  </div>
                  <Switch checked={soundDeafen} onCheckedChange={setSoundDeafen} />
                </div>

                {/* Undeafen */}
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-bold text-foreground">{t('Undeafen')}</div>
                    <button
                      type="button"
                      onClick={() => playPreviewSound('undeafen')}
                      className="text-[11px] text-[#5865F2] hover:underline font-semibold cursor-pointer block mt-0.5"
                    >
                      {t('Preview Sound')}
                    </button>
                  </div>
                  <Switch checked={soundUndeafen} onCheckedChange={setSoundUndeafen} />
                </div>

                {/* Mute */}
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-bold text-foreground">{t('Mute')}</div>
                    <button
                      type="button"
                      onClick={() => playPreviewSound('mute')}
                      className="text-[11px] text-[#5865F2] hover:underline font-semibold cursor-pointer block mt-0.5"
                    >
                      {t('Preview Sound')}
                    </button>
                  </div>
                  <Switch checked={soundMute} onCheckedChange={setSoundMute} />
                </div>

                {/* Unmute */}
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-bold text-foreground">{t('Unmute')}</div>
                    <button
                      type="button"
                      onClick={() => playPreviewSound('unmute')}
                      className="text-[11px] text-[#5865F2] hover:underline font-semibold cursor-pointer block mt-0.5"
                    >
                      {t('Preview Sound')}
                    </button>
                  </div>
                  <Switch checked={soundUnmute} onCheckedChange={setSoundUnmute} />
                </div>
              </div>

              {/* Accordion: Show 18 more sounds */}
              <div className="border border-border/70 rounded-xl overflow-hidden bg-card">
                <button
                  type="button"
                  onClick={() => setShowMoreSounds(!showMoreSounds)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-foreground">{t('Show 18 more sounds')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t('Camera On, Camera Off, Voice Disconnected, and more')}
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0',
                      showMoreSounds && 'rotate-180',
                    )}
                  />
                </button>

                {showMoreSounds && (
                  <div className="p-4 pt-1 space-y-3 border-t border-border/60 bg-muted/10">
                    {[
                      { key: 'cameraOn', label: 'Camera On', sound: 'cameraOn' },
                      { key: 'cameraOff', label: 'Camera Off', sound: 'cameraOff' },
                      { key: 'voiceConnected', label: 'Voice Connected', sound: 'voiceConnected' },
                      { key: 'voiceDisconnected', label: 'Voice Disconnected', sound: 'voiceDisconnected' },
                      { key: 'userJoin', label: 'User Join Voice', sound: 'userJoin' },
                      { key: 'userLeave', label: 'User Leave Voice', sound: 'userLeave' },
                      { key: 'screenShareStart', label: 'Screen Share Started', sound: 'screenShareStart' },
                      { key: 'screenShareStop', label: 'Screen Share Stopped', sound: 'screenShareStop' },
                      { key: 'pttActivate', label: 'Push to Talk Activate', sound: 'pttActivate' },
                      { key: 'pttDeactivate', label: 'Push to Talk Deactivate', sound: 'pttDeactivate' },
                      { key: 'streamStart', label: 'Stream Started', sound: 'streamStart' },
                      { key: 'streamStop', label: 'Stream Stopped', sound: 'streamStop' },
                      { key: 'activityLaunch', label: 'Activity Launch', sound: 'activityLaunch' },
                      { key: 'activityEnd', label: 'Activity End', sound: 'activityEnd' },
                      { key: 'muteMember', label: 'Mute Member', sound: 'muteMember' },
                      { key: 'deafenMember', label: 'Deafen Member', sound: 'deafenMember' },
                      { key: 'ringingOutgoing', label: 'Ringing Outgoing', sound: 'ring' },
                      { key: 'soundboardQuack', label: 'Soundboard Quack', sound: 'quack' },
                    ].map((snd) => (
                      <div key={snd.key} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-none">
                        <div>
                          <div className="text-xs font-semibold text-foreground">{snd.label}</div>
                          <button
                            type="button"
                            onClick={() => playPreviewSound(snd.sound)}
                            className="text-[10px] text-[#5865F2] hover:underline font-medium cursor-pointer"
                          >
                            {t('Preview Sound')}
                          </button>
                        </div>
                        <Switch
                          checked={moreSoundsState[snd.key]}
                          onCheckedChange={(val) => setMoreSoundsState((prev) => ({ ...prev, [snd.key]: val }))}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Related Settings card (Screenshot 4) */}
              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Related Settings')}
                </div>
                <div
                  onClick={() => {
                    setActiveSection('notifications');
                    setTimeout(() => {
                      document.getElementById('notifications-sounds')?.scrollIntoView({ behavior: 'smooth' });
                    }, 80);
                  }}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-card hover:bg-muted/40 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        {t('Notifications')}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {t('Enable/disable sounds for new messages and incoming calls.')}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </div>
            </div>

            {/* SUB-SECTION 5: SOUNDBOARD */}
            <div id="voice-soundboard" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Soundboard')}</h2>
              </div>

              {/* Soundboard Volume Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">{t('Soundboard Volume')}</span>
                  <span className="text-[11px] text-muted-foreground font-mono">{soundboardVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={soundboardVolume}
                  onChange={(e) => setSoundboardVolume(Number(e.target.value))}
                  className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-[#5865F2]"
                />
                <p className="text-[11px] text-muted-foreground">
                  {t('Control how loud sounds are for you personally.')}{' '}
                  <span
                    onClick={() => toast.info(t('Soundboard Volume hanya memengaruhi volume yang Anda dengar, bukan pengguna lain.'))}
                    className="text-[#5865F2] hover:underline cursor-pointer font-medium"
                  >
                    {t('Learn more about Soundboard volume.')}
                  </span>
                </p>
              </div>

              {/* Entrance Sounds (Screenshot 5) */}
              <div className="space-y-3 pt-2">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Entrance Sounds')}</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    {t(
                      'Choose a Soundboard sound to automatically play whenever you join a voice channel. Right-click on a voice channel to join without playing your entrance sound.',
                    )}{' '}
                    <span
                      onClick={() => toast.info(t('Fitur Entrance Sounds memainkan sound effect kustom secara otomatis ketika Anda masuk ke room suara.'))}
                      className="text-[#5865F2] hover:underline cursor-pointer font-medium"
                    >
                      {t('Learn More.')}
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Choose a Server */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      {t('Choose a Server')}
                    </label>
                    <div className="relative">
                      <select
                        value={entranceServer}
                        onChange={(e) => setEntranceServer(e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2.5 rounded-lg bg-[#1e1f22] border border-border/80 text-foreground appearance-none outline-none focus:ring-1 focus:ring-primary cursor-pointer pr-8"
                      >
                        <option value="all" className="bg-[#2b2d31] text-foreground">All Servers</option>
                        <option value="s1" className="bg-[#2b2d31] text-foreground">zmsta's server</option>
                        <option value="s2" className="bg-[#2b2d31] text-foreground">Anticeil Official Community</option>
                        <option value="s3" className="bg-[#2b2d31] text-foreground">Developer Hub Colony</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Choose a Sound */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      {t('Choose a sound')}
                    </label>
                    <div
                      onClick={() => setIsChoosingEntranceSound(!isChoosingEntranceSound)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#1e1f22] border border-border/80 hover:border-border text-foreground cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <span>🔊</span>
                        <span>
                          {entranceSound === 'none'
                            ? 'None'
                            : entranceSound === 'quack'
                              ? '🦆 Quack'
                              : entranceSound === 'airhorn'
                                ? '🎺 Airhorn'
                                : entranceSound === 'badum'
                                  ? '🥁 Ba-Dum-Tss'
                                  : '👏 Golf Clap'}
                        </span>
                      </div>
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                    </div>
                  </div>
                </div>

                {/* Entrance Sound Picker Popover */}
                {isChoosingEntranceSound && (
                  <div className="p-3 rounded-xl border border-border/80 bg-card space-y-2 shadow-md">
                    <div className="text-[11px] font-bold text-muted-foreground">{t('Pilih Suara Masuk (Entrance Sound):')}</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'none', label: 'None', sound: '' },
                        { id: 'quack', label: '🦆 Quack', sound: 'quack' },
                        { id: 'airhorn', label: '🎺 Airhorn', sound: 'airhorn' },
                        { id: 'badum', label: '🥁 Ba-Dum-Tss', sound: 'deafen' },
                        { id: 'golfclap', label: '👏 Golf Clap', sound: 'message' },
                      ].map((snd) => (
                        <button
                          key={snd.id}
                          type="button"
                          onClick={() => {
                            setEntranceSound(snd.id);
                            setIsChoosingEntranceSound(false);
                            if (snd.sound) playPreviewSound(snd.sound);
                            toast.success(t(`Entrance sound diubah ke ${snd.label}`));
                          }}
                          className={cn(
                            'px-3 py-2 rounded-lg text-xs font-bold border transition-all text-left flex items-center justify-between cursor-pointer',
                            entranceSound === snd.id
                              ? 'bg-[#5865F2]/10 border-[#5865F2] text-[#5865F2]'
                              : 'bg-[#1e1f22] border-border/60 text-muted-foreground hover:text-foreground',
                          )}
                        >
                          <span>{snd.label}</span>
                          {entranceSound === snd.id && <Check className="w-3 h-3 text-[#5865F2]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SUB-SECTION 6: ADVANCED */}
            <div id="voice-advanced" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Advanced')}</h2>
              </div>

              {/* Accordion: Show Diagnostic Settings (Screenshot 6) */}
              <div className="border border-border/70 rounded-xl overflow-hidden bg-card">
                <button
                  type="button"
                  onClick={() => setShowDiagnostics(!showDiagnostics)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-foreground">{t('Show Diagnostic Settings')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t(
                        'Settings that collect technical data for Discord Support to analyze, such as debug logging and audio recording',
                      )}
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0',
                      showDiagnostics && 'rotate-180',
                    )}
                  />
                </button>

                {showDiagnostics && (
                  <div className="p-4 pt-1 space-y-4 border-t border-border/60 bg-muted/10">
                    <div className="flex items-center justify-between gap-4 py-1">
                      <div>
                        <div className="text-xs font-bold text-foreground">{t('Debug Logging')}</div>
                        <div className="text-[11px] text-muted-foreground">{t('Mencatat log koneksi WebRTC secara detail ke console')}</div>
                      </div>
                      <Switch checked={debugLogging} onCheckedChange={setDebugLogging} />
                    </div>

                    <div className="space-y-1.5 py-1">
                      <label className="text-xs font-bold text-foreground block">{t('Audio Subsystem')}</label>
                      <div className="relative max-w-xs">
                        <select
                          value={audioSubsystem}
                          onChange={(e) => setAudioSubsystem(e.target.value)}
                          className="w-full text-xs font-semibold px-3 py-2 rounded-lg bg-[#1e1f22] border border-border/80 text-foreground appearance-none outline-none cursor-pointer pr-8"
                        >
                          <option value="standard" className="bg-[#2b2d31]">Standard (Recommended)</option>
                          <option value="legacy" className="bg-[#2b2d31]">Legacy Audio Stack</option>
                          <option value="experimental" className="bg-[#2b2d31]">Experimental Low-Latency</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 py-1">
                      <div>
                        <div className="text-xs font-bold text-foreground">{t('WebRTC High Priority QoS')}</div>
                        <div className="text-[11px] text-muted-foreground">{t('Mengaktifkan DSCP Expedited Forwarding packet tagging')}</div>
                      </div>
                      <Switch checked={webrtcQos} onCheckedChange={setWebrtcQos} />
                    </div>

                    <div className="flex items-center justify-between gap-4 py-1">
                      <div>
                        <div className="text-xs font-bold text-foreground">{t('Diagnostic Packet Capture')}</div>
                        <div className="text-[11px] text-muted-foreground">{t('Simpan dump statistik RTC untuk investigasi masalah jaringan')}</div>
                      </div>
                      <Switch checked={diagnosticPacketCapture} onCheckedChange={setDiagnosticPacketCapture} />
                    </div>
                  </div>
                )}
              </div>

              {/* Reset all Voice & Video settings (Screenshot 6) */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Reset all Voice & Video settings')}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {t('Return to the default set of Voice & Video settings.')}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetSettings();
                    stopCameraTest();
                    setSelectedVideoBackground('none');
                    setShowStreamPreviews(true);
                    setSoundDeafen(true);
                    setSoundUndeafen(true);
                    setSoundMute(true);
                    setSoundUnmute(true);
                    setSoundboardVolume(100);
                    setEntranceServer('all');
                    setEntranceSound('none');
                    toast.success(t('Semua pengaturan Voice & Video telah diatur ulang ke default'));
                  }}
                  className="border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-600 font-bold text-xs px-4 py-2 rounded-md shrink-0 cursor-pointer transition-colors"
                >
                  {t('Reset')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION: APPEARANCE (DISCORD PARITY)                                      */}
        {/* ========================================================================= */}
        {activeSection === 'appearance' && (
          <div className="space-y-8 divide-y divide-border/50 pb-8">
            {/* SUB-SECTION 1: THEME */}
            <div id="appearance-theme" className="scroll-mt-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Theme')}</h2>
              </div>

              {/* Same as Device Theme */}
              <div className="flex items-center justify-between gap-4 py-1">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Same as Device Theme')}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {t("Match your device's light or dark mode.")}
                  </div>
                </div>
                <Switch
                  checked={sameAsDeviceTheme}
                  onCheckedChange={(val) => {
                    setSameAsDeviceTheme(val);
                    if (val) {
                      setTheme('system');
                      setSelectedDefaultTheme('system');
                      toast.success(t('Tema disinkronkan dengan tema perangkat'));
                    }
                  }}
                />
              </div>

              {/* Default Themes */}
              <div className="space-y-3 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Default Themes')}
                </div>
                <div className="flex items-center gap-3">
                  {[
                    { id: 'light', label: 'Light', bg: 'bg-white border-zinc-300', themeVal: 'light' },
                    { id: 'dark', label: 'Dark', bg: 'bg-[#313338] border-zinc-700', themeVal: 'dark' },
                    { id: 'midnight', label: 'Midnight', bg: 'bg-[#111214] border-zinc-800', themeVal: 'dark' },
                    { id: 'navy', label: 'Darker', bg: 'bg-[#1e1f22] border-zinc-800', themeVal: 'dark' },
                    { id: 'system', label: 'Sync', bg: 'bg-[#232428] border-zinc-700', icon: '🔄', themeVal: 'system' },
                  ].map((item) => {
                    const isSelected = selectedDefaultTheme === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedDefaultTheme(item.id);
                          setTheme(item.themeVal);
                          toast.success(t(`Tema diubah ke ${item.label}`));
                        }}
                        className={cn(
                          'relative size-12 rounded-xl border-2 transition-all flex items-center justify-center cursor-pointer shadow-xs',
                          item.bg,
                          isSelected
                            ? 'border-[#5865F2] ring-2 ring-[#5865F2]/40 scale-105'
                            : 'border-border/60 hover:scale-105',
                        )}
                        title={item.label}
                      >
                        {item.icon ? (
                          <span className="text-sm font-bold text-muted-foreground">{item.icon}</span>
                        ) : null}
                        {isSelected && (
                          <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-[#5865F2] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Promo Card: Make your Discord look *juuusst* right */}
              <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-linear-to-r from-purple-950/40 via-card to-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="size-12 rounded-xl bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-xl shadow-md shrink-0">
                    🎨
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      {t('Make your Anticeil look *juuusst* right')}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 max-w-sm">
                      {t('Create your own custom theme to make Anticeil uniquely yours. Only with Nectar.')}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setActiveSection('nitro');
                    toast.info(t('Tema kustom tersedia dengan Nectar & Pollen!'));
                  }}
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold px-4 h-8 rounded-md shrink-0 cursor-pointer shadow-xs"
                >
                  {t('Try It out')}
                </Button>
              </div>

              {/* Color Themes */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span>{t('Color Themes')}</span>
                      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t('Unlock more themes with')}{' '}
                      <span className="text-primary font-semibold">Nectar</span>.
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toast.info(t('Preview tema warna aktif selama 15 detik'))}
                      className="h-8 text-xs font-semibold px-3 border-border/80 text-foreground cursor-pointer"
                    >
                      {t('Preview Theme')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setActiveSection('nitro');
                      }}
                      className="h-8 text-xs font-bold px-3 bg-linear-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-95 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 fill-white" />
                      <span>{t('Unlock with Nectar')}</span>
                    </Button>
                  </div>
                </div>

                {/* Swatches Grid */}
                <div className="grid grid-cols-6 sm:grid-cols-9 gap-2.5 p-3 rounded-2xl border border-border/70 bg-[#1e1f22]">
                  {/* Swatch 1: Custom Palette */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedColorTheme('custom');
                      toast.info(t('Custom color theme selected'));
                    }}
                    className={cn(
                      'aspect-square rounded-xl border flex items-center justify-center text-sm cursor-pointer transition-all',
                      selectedColorTheme === 'custom'
                        ? 'border-[#5865F2] ring-2 ring-[#5865F2]/40 bg-muted/40'
                        : 'border-border/60 hover:bg-muted/20',
                    )}
                    title="Custom Palette"
                  >
                    🎨
                  </button>

                  {/* 16 Preset Swatches */}
                  {[
                    { id: 'mint', grad: 'from-emerald-300 to-teal-400', name: 'Mint Breeze' },
                    { id: 'peach', grad: 'from-amber-200 to-orange-300', name: 'Peach Sunrise' },
                    { id: 'lavender', grad: 'from-indigo-200 to-purple-300', name: 'Lavender Mist' },
                    { id: 'sky', grad: 'from-sky-200 to-indigo-300', name: 'Soft Horizon' },
                    { id: 'cream', grad: 'from-amber-100 to-stone-200', name: 'Cream Linen' },
                    { id: 'rose', grad: 'from-pink-200 to-rose-300', name: 'Rose Blossom' },
                    { id: 'sunset', grad: 'from-rose-500 via-purple-600 to-amber-500', name: 'Sunset Glow' },
                    { id: 'violet', grad: 'from-purple-600 to-indigo-600', name: 'Violet Nebula' },
                    { id: 'pine', grad: 'from-emerald-900 to-teal-950', name: 'Deep Pine' },
                    { id: 'velvet', grad: 'from-red-950 to-rose-900', name: 'Velvet Wine' },
                    { id: 'midnight', grad: 'from-blue-950 to-slate-900', name: 'Midnight Ocean' },
                    { id: 'void', grad: 'from-purple-950 to-slate-950', name: 'Cosmic Void' },
                    { id: 'cyber', grad: 'from-teal-800 to-purple-900', name: 'Neon Cyber' },
                    { id: 'gold', grad: 'from-amber-700 to-yellow-900', name: 'Golden Hour' },
                    { id: 'aurora', grad: 'from-teal-600 to-emerald-900', name: 'Aurora Borealis' },
                    { id: 'magma', grad: 'from-orange-950 to-red-950', name: 'Dark Magma' },
                  ].map((sw) => {
                    const isSelected = selectedColorTheme === sw.id;
                    return (
                      <button
                        key={sw.id}
                        type="button"
                        onClick={() => {
                          setSelectedColorTheme(sw.id);
                          toast.success(t(`Tema warna diubah ke ${sw.name}`));
                        }}
                        className={cn(
                          'aspect-square rounded-xl border transition-all cursor-pointer bg-linear-to-br',
                          sw.grad,
                          isSelected
                            ? 'border-[#5865F2] ring-2 ring-[#5865F2]/40 scale-105'
                            : 'border-white/10 hover:scale-105',
                        )}
                        title={sw.name}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Theme Sync Options */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Sync theme across my devices')}
                  </div>
                  <Switch checked={syncThemeDevices} onCheckedChange={setSyncThemeDevices} />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="text-xs font-semibold text-foreground">
                    {t("Apply theme to other users' profiles")}
                  </div>
                  <Switch checked={applyThemeToProfiles} onCheckedChange={setApplyThemeToProfiles} />
                </div>
              </div>

              {/* Related Settings card */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Related Settings')}
                </div>
                <div
                  onClick={() => {
                    setActiveSection('accessibility');
                    setTimeout(() => {
                      document.getElementById('accessibility-color-contrast')?.scrollIntoView({ behavior: 'smooth' });
                    }, 80);
                  }}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-card hover:bg-muted/40 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        {t('Accessibility')}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {t('Change saturation of colors, enable high-contrast mode, and more')}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </div>
            </div>

            {/* SUB-SECTION 2: APP ICON */}
            <div id="appearance-app-icon" className="scroll-mt-6 space-y-6 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{t('App Icon')}</h2>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {t('Change the Anticeil in-app icon, only with Nectar.')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toast.info(t('Icon preview mode active'))}
                    className="h-8 text-xs font-semibold px-3 border-border/80 text-foreground cursor-pointer"
                  >
                    {t('Preview Icon')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setActiveSection('nitro')}
                    className="h-8 text-xs font-bold px-3 bg-linear-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-95 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    <span>{t('Unlock with Nectar')}</span>
                  </Button>
                </div>
              </div>

              {/* Grid of 23 App Icons */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {[
                  { id: 'blurple', label: 'Default Blurple', bg: 'bg-[#5865F2]', icon: '💬', active: true },
                  { id: 'dark', label: 'Dark Charcoal', bg: 'bg-[#1e1f22]', icon: '⚡' },
                  { id: 'crt', label: 'CRT Glitch', bg: 'bg-zinc-900 border-green-500/40', icon: '📺' },
                  { id: 'slate', label: 'Monochrome', bg: 'bg-zinc-800', icon: '🌑' },
                  { id: 'white', label: 'Clean White', bg: 'bg-zinc-100 text-zinc-900', icon: '✨' },
                  { id: 'pastel', label: 'Pastel Rainbow', bg: 'bg-linear-to-br from-pink-300 via-purple-300 to-indigo-300', icon: '🌸' },
                  { id: 'pirate', label: 'Pirate Skull', bg: 'bg-linear-to-br from-amber-700 to-stone-900', icon: '🏴‍☠️' },
                  { id: 'camo', label: 'Army Camo', bg: 'bg-linear-to-br from-emerald-800 to-stone-800', icon: '🪖' },
                  { id: 'vaporwave', label: '80s Synthwave', bg: 'bg-linear-to-br from-purple-700 via-pink-600 to-amber-500', icon: '🌇' },
                  { id: 'galaxy', label: 'Cosmic Nebula', bg: 'bg-linear-to-br from-indigo-950 via-purple-900 to-pink-900', icon: '🌌' },
                  { id: 'plushie', label: 'Cute Plushie', bg: 'bg-linear-to-br from-purple-400 to-indigo-400', icon: '🧸' },
                  { id: 'sakura', label: 'Sakura Blossom', bg: 'bg-linear-to-br from-pink-400 via-rose-300 to-pink-500', icon: '🌺' },
                  { id: 'chrome', label: 'Holo Chrome', bg: 'bg-linear-to-br from-slate-300 via-zinc-400 to-slate-200 text-black', icon: '💿' },
                  { id: 'cyber', label: 'Neon Cyber', bg: 'bg-linear-to-br from-emerald-500 via-teal-600 to-black', icon: '🎮' },
                  { id: 'matrix', label: 'Matrix Rain', bg: 'bg-black border-green-500', icon: '📟' },
                  { id: 'spiral', label: 'Hypnotic Spiral', bg: 'bg-linear-to-br from-stone-900 to-zinc-700', icon: '🌀' },
                  { id: 'magma', label: 'Magma Flame', bg: 'bg-linear-to-br from-red-600 via-orange-600 to-yellow-500', icon: '🔥' },
                  { id: 'demon', label: 'Crimson Demon', bg: 'bg-linear-to-br from-red-950 to-rose-900', icon: '😈' },
                  { id: 'classic', label: 'Classic 2015', bg: 'bg-[#7289da]', icon: '🕹️' },
                  { id: 'mecha', label: 'Robot Mecha', bg: 'bg-linear-to-br from-sky-600 to-indigo-900', icon: '🤖' },
                  { id: 'sunset', label: 'Sunset Neon', bg: 'bg-linear-to-br from-amber-500 via-rose-600 to-purple-800', icon: '🌅' },
                  { id: 'pride', label: 'Rainbow Pride', bg: 'bg-linear-to-br from-red-500 via-green-500 to-violet-600', icon: '🌈' },
                  { id: 'trans', label: 'Trans Pastel', bg: 'bg-linear-to-br from-sky-300 via-pink-300 to-white', icon: '🏳️‍⚧️' },
                  { id: 'prestige', label: 'Gold Prestige', bg: 'bg-linear-to-br from-amber-400 via-yellow-500 to-amber-700', icon: '👑' },
                ].map((ic) => {
                  const isSelected = selectedAppIcon === ic.id;
                  return (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() => {
                        setSelectedAppIcon(ic.id);
                        toast.success(t(`App Icon diubah ke ${ic.label}`));
                      }}
                      className={cn(
                        'relative aspect-square rounded-2xl border-2 flex items-center justify-center text-xl transition-all cursor-pointer shadow-xs',
                        ic.bg,
                        isSelected
                          ? 'border-[#5865F2] ring-2 ring-[#5865F2]/40 scale-105'
                          : 'border-border/60 hover:scale-105',
                      )}
                      title={ic.label}
                    >
                      <span>{ic.icon}</span>
                      {isSelected && (
                        <span className="absolute -top-1 -right-1 size-4 rounded-full bg-[#5865F2] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SUB-SECTION 3: MESSAGES */}
            <div id="appearance-messages" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Messages')}</h2>
              </div>

              {/* Media display options */}
              <div className="space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Show images, videos, and lolcats...')}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <div className="text-xs font-semibold text-foreground">{t('When posted as links to chat')}</div>
                    <Switch checked={showMediaFromLinks} onCheckedChange={setShowMediaFromLinks} />
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <div className="text-xs font-semibold text-foreground">{t('When uploaded directly to Discord')}</div>
                    <Switch checked={showMediaUploaded} onCheckedChange={setShowMediaUploaded} />
                  </div>
                </div>
              </div>

              {/* Link previews & emoji reactions */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="text-xs font-semibold text-foreground">{t('Show embeds and link previews')}</div>
                  <Switch checked={showEmbedsPreviews} onCheckedChange={setShowEmbedsPreviews} />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="text-xs font-semibold text-foreground">{t('Show emoji reactions')}</div>
                  <Switch checked={showEmojiReactions} onCheckedChange={setShowEmojiReactions} />
                </div>
              </div>

              {/* Show spoiler content select */}
              <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
                <div>
                  <div className="text-xs font-semibold text-foreground">{t('Show spoiler content')}</div>
                  <div className="text-[11px] text-muted-foreground">{t('Pilih kapan konten spoiler disembunyikan')}</div>
                </div>
                <div className="relative">
                  <select
                    value={spoilerDisplay}
                    onChange={(e) => setSpoilerDisplay(e.target.value as any)}
                    className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#1e1f22] border border-border/80 text-foreground appearance-none outline-none focus:ring-1 focus:ring-primary cursor-pointer pr-8"
                  >
                    <option value="click" className="bg-[#2b2d31]">On click</option>
                    <option value="mod" className="bg-[#2b2d31]">On servers I moderate</option>
                    <option value="always" className="bg-[#2b2d31]">Always</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Split view & user avatars */}
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="text-xs font-semibold text-foreground">{t('Open threads in split view')}</div>
                  <Switch checked={openThreadsSplitView} onCheckedChange={setOpenThreadsSplitView} />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-semibold text-foreground">{t('Show user avatars')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t('To hide avatars, go to Accessibility and select Compact under Chat Message Display.')}
                    </div>
                  </div>
                  <Switch checked={showUserAvatars} onCheckedChange={setShowUserAvatars} />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <span>{t('Show Favorites server')}</span>
                      <span className="text-[9px] font-black uppercase tracking-wider bg-[#5865F2] text-white px-1.5 py-0.5 rounded-full shadow-xs">
                        BETA
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t('Your Favorites stay saved, even if you toggle this off. Learn more.')}
                    </div>
                  </div>
                  <Switch checked={showFavoritesServer} onCheckedChange={setShowFavoritesServer} />
                </div>
              </div>

              {/* Related Settings card */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Related Settings')}
                </div>
                <div
                  onClick={() => {
                    setActiveSection('accessibility');
                    setTimeout(() => {
                      document.getElementById('accessibility-visual-density')?.scrollIntoView({ behavior: 'smooth' });
                    }, 80);
                  }}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-card hover:bg-muted/40 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        {t('Accessibility')}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {t('Adjust the visual density of chat messages and UI')}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </div>
            </div>

            {/* SUB-SECTION 4: CHAT BOX */}
            <div id="appearance-chat-box" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Chat Box')}</h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Preview emoji, mentions, and markdown syntax as you type')}
                  </div>
                  <Switch checked={previewMarkdownAsType} onCheckedChange={setPreviewMarkdownAsType} />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-semibold text-foreground">
                      {t('Automatically convert emoticons in your messages to emoji')}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t('For example, when you type :) Discord will convert it to 🙂')}
                    </div>
                  </div>
                  <Switch checked={convertEmoticonsToEmoji} onCheckedChange={setConvertEmoticonsToEmoji} />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Show stickers in autocomplete results')}
                  </div>
                  <Switch checked={showStickersAutocomplete} onCheckedChange={setShowStickersAutocomplete} />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Show games in autocomplete results')}
                  </div>
                  <Switch checked={showGamesAutocomplete} onCheckedChange={setShowGamesAutocomplete} />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Show send message button')}
                  </div>
                  <Switch checked={showSendMessageButton} onCheckedChange={setShowSendMessageButton} />
                </div>
              </div>
            </div>

            {/* SUB-SECTION 5: SEARCH */}
            <div id="appearance-search" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Search')}</h2>
              </div>

              <div className="space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('By default, searching in DMs...')}
                </div>
                <div className="space-y-2">
                  {[
                    { id: 'single', title: 'Searches only in the selected DM' },
                    { id: 'all', title: 'Searches across all my DMs' },
                  ].map((sc) => {
                    const isSelected = dmSearchScope === sc.id;
                    return (
                      <div
                        key={sc.id}
                        onClick={() => setDmSearchScope(sc.id as any)}
                        className={cn(
                          'flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer',
                          isSelected
                            ? 'bg-[#5865F2]/5 border-[#5865F2]'
                            : 'bg-card border-border/70 hover:bg-muted/30',
                        )}
                      >
                        <div
                          className={cn(
                            'size-4 rounded-full border-2 flex items-center justify-center transition-all',
                            isSelected ? 'border-[#5865F2]' : 'border-muted-foreground/50',
                          )}
                        >
                          {isSelected && <div className="size-2 rounded-full bg-[#5865F2]" />}
                        </div>
                        <span className="text-xs font-semibold text-foreground">{sc.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SUB-SECTION 6: STREAMER MODE */}
            <div id="appearance-streamer-mode" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Streamer Mode')}</h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-bold text-foreground">{t('Enable Streamer Mode')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t("Streamer Mode hides your personal info so others watching your stream can't see it.")}
                    </div>
                  </div>
                  <Switch checked={streamerModeEnabled} onCheckedChange={setStreamerModeEnabled} />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Automatically enable Streamer Mode if OBS or XSplit are running')}
                  </div>
                  <Switch checked={autoStreamerModeObs} onCheckedChange={setAutoStreamerModeObs} />
                </div>
              </div>

              {/* If Streamer Mode is enabled... */}
              <div className="space-y-3 pt-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('If Streamer Mode is enabled...')}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Hide my personal information, such as email, connected accounts, and notes')}
                    </div>
                    <Switch checked={streamerHidePersonalInfo} onCheckedChange={setStreamerHidePersonalInfo} />
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Hide invite links to my Discord servers')}
                    </div>
                    <Switch checked={streamerHideInviteLinks} onCheckedChange={setStreamerHideInviteLinks} />
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Disable all sound effects')}
                    </div>
                    <Switch checked={streamerDisableSounds} onCheckedChange={setStreamerDisableSounds} />
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Disable notifications')}
                    </div>
                    <Switch checked={streamerDisableNotifications} onCheckedChange={setStreamerDisableNotifications} />
                  </div>
                </div>
              </div>

              {/* Hide window from screen capture */}
              <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
                <div>
                  <div className="text-xs font-bold text-foreground">
                    {t('Hide Discord Window from Screen Capture')}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {t('Hides most Discord windows from most screen capture software.')}
                  </div>
                </div>
                <Switch checked={streamerHideWindowCapture} onCheckedChange={setStreamerHideWindowCapture} />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION: ACCESSIBILITY (DISCORD PARITY)                                    */}
        {/* ========================================================================= */}
        {activeSection === 'accessibility' && (
          <div className="space-y-8 divide-y divide-border/50 pb-8">
            {/* Top Interactive Live Chat Message Preview Box (Matching all 8 screenshots) */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t('Preview')}
              </div>
              <div
                className={cn(
                  'rounded-2xl border border-border/80 bg-[#1e1f22] p-4 relative shadow-sm transition-all',
                  enableHighContrast && 'border-2 border-white',
                )}
                style={{
                  filter: `saturate(${saturationLevel}%)`,
                }}
              >
                <div
                  className="flex items-start justify-between gap-4"
                  style={{ fontSize: `${chatFontSize}px` }}
                >
                  <div className="flex-1 space-y-3">
                    {/* Message 1 */}
                    <div
                      className={cn(
                        'flex items-start gap-3',
                        chatMessageDisplay === 'compact' && 'items-baseline gap-2',
                      )}
                      style={{ marginBottom: `${spaceMessageGroups}px` }}
                    >
                      {chatMessageDisplay !== 'compact' && showUserAvatars && (
                        <div className="size-9 rounded-full bg-zinc-700 overflow-hidden shrink-0 ring-2 ring-white/10">
                          <img
                            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                            alt="avatar"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'font-bold text-xs',
                              roleColorsDisplay === 'names' ? 'text-indigo-400' : 'text-foreground',
                            )}
                          >
                            {roleColorsDisplay === 'dot' && <span className="inline-block size-2 rounded-full bg-indigo-400 mr-1.5" />}
                            zmsta
                          </span>
                          <span className="text-[10px] text-muted-foreground">13.33</span>
                        </div>
                        <div className="text-foreground mt-0.5 leading-snug">
                          what happened to all the beans
                        </div>
                        {/* Reactions */}
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="px-2 py-0.5 rounded-lg bg-[#2b2d31] border border-indigo-500/40 text-[11px] font-bold text-white flex items-center gap-1">
                            <span>🪕</span>
                            <span>3</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-[#2b2d31] border border-border/60 text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                            <span>📦</span>
                            <span>1</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Message 2 */}
                    <div
                      className={cn(
                        'flex items-start gap-3',
                        chatMessageDisplay === 'compact' && 'items-baseline gap-2',
                      )}
                    >
                      {chatMessageDisplay !== 'compact' && showUserAvatars && (
                        <div className="size-9 rounded-full bg-zinc-700 overflow-hidden shrink-0 ring-2 ring-white/10">
                          <img
                            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                            alt="avatar"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'font-bold text-xs',
                              roleColorsDisplay === 'names' ? 'text-indigo-400' : 'text-foreground',
                            )}
                          >
                            {roleColorsDisplay === 'dot' && <span className="inline-block size-2 rounded-full bg-indigo-400 mr-1.5" />}
                            zmsta
                          </span>
                          <span className="text-[10px] text-muted-foreground">13.33</span>
                        </div>
                        <div className="text-foreground mt-0.5 leading-snug">
                          here's a link{' '}
                          <a
                            href="#"
                            onClick={(e) => e.preventDefault()}
                            className={cn(
                              'text-[#5865F2] font-semibold',
                              alwaysUnderlineLinks && 'underline',
                            )}
                          >
                            https://discord.com/accessibility
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right side live status & example button */}
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <div className="flex flex-col gap-1.5">
                      <div className="size-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white shadow-xs" title="Online">
                        🟢
                      </div>
                      <div className="size-5 rounded-full bg-amber-400 flex items-center justify-center text-[10px] font-bold text-black shadow-xs" title="Idle">
                        🌙
                      </div>
                      <div className="size-5 rounded-full bg-rose-500 flex items-center justify-center text-[10px] font-bold text-white shadow-xs" title="DND">
                        ⛔
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold px-3 py-1.5 h-8 rounded-md shadow-xs"
                    >
                      Example Button
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* SUB-SECTION 1: TEXT READABILITY */}
            <div id="accessibility-text-readability" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Text Readability')}</h2>
              </div>

              {/* Text size in chat slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">{t('Text size in chat')}</span>
                  <span className="text-[11px] text-emerald-400 font-mono font-bold">{chatFontSize}px</span>
                </div>
                <div className="text-[11px] text-muted-foreground">{t('Adjust the size of the chat font.')}</div>
                <div className="pt-2">
                  <input
                    type="range"
                    min="12"
                    max="24"
                    step="1"
                    value={chatFontSize}
                    onChange={(e) => setChatFontSize(Number(e.target.value))}
                    className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-[#5865F2]"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                    <span>12px</span>
                    <span>14px</span>
                    <span>15px</span>
                    <span className="text-emerald-400 font-bold">16px</span>
                    <span>18px</span>
                    <span>20px</span>
                    <span>24px</span>
                  </div>
                </div>
              </div>

              {/* Always underline links */}
              <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Always underline links')}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {t('Make links stand out more.')}
                  </div>
                </div>
                <Switch checked={alwaysUnderlineLinks} onCheckedChange={setAlwaysUnderlineLinks} />
              </div>

              {/* Display Name Styles */}
              <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Display Name Styles')}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {t('Enable display name styles — including font, effect, and color — across Discord.')}
                  </div>
                </div>
                <Switch checked={displayNameStyles} onCheckedChange={setDisplayNameStyles} />
              </div>
            </div>

            {/* SUB-SECTION 2: VISUAL DENSITY */}
            <div id="accessibility-visual-density" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Visual Density')}</h2>
              </div>

              {/* UI Density */}
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('UI Density')}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {t('Adjust the space between server, channel, and member lists.')}
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { id: 'compact', title: 'Compact' },
                    { id: 'default', title: 'Default' },
                    { id: 'spacious', title: 'Spacious' },
                  ].map((d) => {
                    const isSelected = uiDensity === d.id;
                    return (
                      <div
                        key={d.id}
                        onClick={() => setUiDensity(d.id as any)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer',
                          isSelected
                            ? 'bg-[#5865F2]/5 border-[#5865F2]'
                            : 'bg-card border-border/70 hover:bg-muted/30',
                        )}
                      >
                        <div
                          className={cn(
                            'size-4 rounded-full border-2 flex items-center justify-center transition-all',
                            isSelected ? 'border-[#5865F2]' : 'border-muted-foreground/50',
                          )}
                        >
                          {isSelected && <div className="size-2 rounded-full bg-[#5865F2]" />}
                        </div>
                        <span className="text-xs font-semibold text-foreground">{d.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chat Message Display */}
              <div className="space-y-3 pt-2">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Chat Message Display')}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {t('Change the appearance of chat messages.')}
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { id: 'default', title: 'Default', desc: 'Beautiful, spacious, and shows user avatars' },
                    { id: 'compact', title: 'Compact', desc: 'Fits more messages on screen at once, hides avatars' },
                  ].map((m) => {
                    const isSelected = chatMessageDisplay === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setChatMessageDisplay(m.id as any)}
                        className={cn(
                          'flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer',
                          isSelected
                            ? 'bg-[#5865F2]/5 border-[#5865F2]'
                            : 'bg-card border-border/70 hover:bg-muted/30',
                        )}
                      >
                        <div className="mt-0.5 shrink-0">
                          <div
                            className={cn(
                              'size-4 rounded-full border-2 flex items-center justify-center transition-all',
                              isSelected ? 'border-[#5865F2]' : 'border-muted-foreground/50',
                            )}
                          >
                            {isSelected && <div className="size-2 rounded-full bg-[#5865F2]" />}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground">{m.title}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{m.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Space Between Message Groups */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">{t('Space Between Message Groups')}</span>
                  <span className="text-[11px] text-emerald-400 font-mono font-bold">{spaceMessageGroups}px</span>
                </div>
                <div className="text-[11px] text-muted-foreground">{t('Adjust the spacing between message groups.')}</div>
                <div className="pt-2">
                  <input
                    type="range"
                    min="0"
                    max="24"
                    step="4"
                    value={spaceMessageGroups}
                    onChange={(e) => setSpaceMessageGroups(Number(e.target.value))}
                    className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-[#5865F2]"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                    <span>0px</span>
                    <span>4px</span>
                    <span>8px</span>
                    <span className="text-emerald-400 font-bold">16px</span>
                    <span>24px</span>
                  </div>
                </div>
              </div>

              {/* Zoom Level */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">{t('Zoom level')}</span>
                  <span className="text-[11px] text-emerald-400 font-mono font-bold">{zoomLevel}%</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {t('Adjust the size of the interface. You can also change this with ctrl +/-.')}
                </div>
                <div className="pt-2">
                  <input
                    type="range"
                    min="50"
                    max="200"
                    step="5"
                    value={zoomLevel}
                    onChange={(e) => setZoomLevel(Number(e.target.value))}
                    className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-[#5865F2]"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                    <span>50</span>
                    <span>67</span>
                    <span>75</span>
                    <span>80</span>
                    <span>90</span>
                    <span className="text-emerald-400 font-bold">100</span>
                    <span>110</span>
                    <span>125</span>
                    <span>150</span>
                    <span>175</span>
                    <span>200</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SUB-SECTION 3: COLOR & CONTRAST */}
            <div id="accessibility-color-contrast" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Color & Contrast')}</h2>
              </div>

              {/* Saturation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">{t('Saturation')}</span>
                  <span className="text-[11px] text-emerald-400 font-mono font-bold">{saturationLevel}%</span>
                </div>
                <div className="text-[11px] text-muted-foreground leading-relaxed">
                  {t(
                    'Reduce the saturation of colors within the app, for those with color sensitivities. This does not affect the saturation of images, videos, role colors or other user content.',
                  )}
                </div>
                <div className="pt-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={saturationLevel}
                    onChange={(e) => setSaturationLevel(Number(e.target.value))}
                    className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-[#5865F2]"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                    <span>0%</span>
                    <span>20%</span>
                    <span>40%</span>
                    <span>60%</span>
                    <span>80%</span>
                    <span className="text-emerald-400 font-bold">100%</span>
                  </div>
                </div>
              </div>

              {/* Switches */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-bold text-foreground">{t('Apply saturation setting to custom colors')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t('Apply the above setting to custom color choices, like role colors.')}
                    </div>
                  </div>
                  <Switch checked={applySaturationCustomColors} onCheckedChange={setApplySaturationCustomColors} />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-bold text-foreground">{t('Enable High Contrast Mode')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t('Enhance visibility with bold colors and sharp contrast.')}
                    </div>
                  </div>
                  <Switch checked={enableHighContrast} onCheckedChange={setEnableHighContrast} />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-bold text-foreground">{t('Sync contrast settings')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t("This allows Discord to use your computer's contrast theme. Learn more about contrast settings.")}
                    </div>
                  </div>
                  <Switch checked={syncContrastSettings} onCheckedChange={setSyncContrastSettings} />
                </div>
              </div>

              {/* Role Colors Dropdown */}
              <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Role Colors')}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {t('Choose how you would like role colors to be displayed.')}
                  </div>
                </div>
                <div className="relative">
                  <select
                    value={roleColorsDisplay}
                    onChange={(e) => setRoleColorsDisplay(e.target.value as any)}
                    className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#1e1f22] border border-border/80 text-foreground appearance-none outline-none focus:ring-1 focus:ring-primary cursor-pointer pr-8"
                  >
                    <option value="names" className="bg-[#2b2d31]">In names</option>
                    <option value="dot" className="bg-[#2b2d31]">As dot next to names</option>
                    <option value="none" className="bg-[#2b2d31]">None</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Official Messages Dropdown */}
              <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Official Messages')}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {t('Choose how official developer messages look on verified servers that support it.')}
                  </div>
                </div>
                <div className="relative">
                  <select
                    value={officialMessagesStyle}
                    onChange={(e) => setOfficialMessagesStyle(e.target.value as any)}
                    className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#1e1f22] border border-border/80 text-foreground appearance-none outline-none focus:ring-1 focus:ring-primary cursor-pointer pr-8"
                  >
                    <option value="default" className="bg-[#2b2d31]">Default</option>
                    <option value="contrast" className="bg-[#2b2d31]">High Contrast</option>
                    <option value="plain" className="bg-[#2b2d31]">Plain</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Show on/off indicators */}
              <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Show on/off indicators')}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {t('On forms, menus and settings, on/off toggles will have icons.')}
                  </div>
                </div>
                <Switch checked={showOnOffIndicators} onCheckedChange={setShowOnOffIndicators} />
              </div>

              {/* Related Settings card */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Related Settings')}
                </div>
                <div
                  onClick={() => {
                    setActiveSection('appearance');
                    setTimeout(() => {
                      document.getElementById('appearance-theme')?.scrollIntoView({ behavior: 'smooth' });
                    }, 80);
                  }}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-card hover:bg-muted/40 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        {t('Appearance')}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {t('Change your app theme')}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </div>
            </div>

            {/* SUB-SECTION 4: REDUCED MOTION */}
            <div id="accessibility-reduced-motion" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Reduced Motion')}</h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-bold text-foreground">{t('Enable Reduced Motion')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t('Reduce the amount and intensity of animations, hover effects, and other moving effects. Learn more.')}
                    </div>
                  </div>
                  <Switch checked={enableReducedMotion} onCheckedChange={setEnableReducedMotion} />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Sync with computer setting')}
                  </div>
                  <Switch checked={syncReducedMotionComputer} onCheckedChange={setSyncReducedMotionComputer} />
                </div>
              </div>

              {/* Minimum notification duration slider */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">{t('Minimum notification duration')}</span>
                  <span className="text-[11px] text-emerald-400 font-mono font-bold">{notificationDuration}s</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {t('Keep pop up notifications on screen for at least this long. Notifications that already stay longer are unaffected.')}
                </div>
                <div className="pt-2">
                  <input
                    type="range"
                    min="3"
                    max="20"
                    step="1"
                    value={notificationDuration}
                    onChange={(e) => setNotificationDuration(Number(e.target.value))}
                    className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-[#5865F2]"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                    <span className="text-emerald-400 font-bold">3s</span>
                    <span>5s</span>
                    <span>10s</span>
                    <span>15s</span>
                    <span>20s</span>
                  </div>
                </div>
              </div>

              {/* GIF & Animated Emoji switches */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Play GIFs when Discord is focused')}
                  </div>
                  <Switch checked={playGifsFocused} onCheckedChange={setPlayGifsFocused} />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Play animated emoji')}
                  </div>
                  <Switch checked={playAnimatedEmoji} onCheckedChange={setPlayAnimatedEmoji} />
                </div>
              </div>

              {/* Play sticker animations radio group */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-foreground">{t('Play sticker animations')}</div>
                <div className="space-y-2">
                  {[
                    { id: 'always', title: 'Always animate' },
                    {
                      id: 'interaction',
                      title: 'Animate on interaction',
                      desc: 'On the desktop client, stickers will animate on hover or focus. On mobile clients, stickers will animate on long-press.',
                    },
                    { id: 'never', title: 'Never animate' },
                  ].map((st) => {
                    const isSelected = stickerAnimationMode === st.id;
                    return (
                      <div
                        key={st.id}
                        onClick={() => setStickerAnimationMode(st.id as any)}
                        className={cn(
                          'flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer',
                          isSelected
                            ? 'bg-[#5865F2]/5 border-[#5865F2]'
                            : 'bg-card border-border/70 hover:bg-muted/30',
                        )}
                      >
                        <div className="mt-0.5 shrink-0">
                          <div
                            className={cn(
                              'size-4 rounded-full border-2 flex items-center justify-center transition-all',
                              isSelected ? 'border-[#5865F2]' : 'border-muted-foreground/50',
                            )}
                          >
                            {isSelected && <div className="size-2 rounded-full bg-[#5865F2]" />}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground">{st.title}</div>
                          {st.desc && <div className="text-[11px] text-muted-foreground mt-0.5">{st.desc}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SUB-SECTION 5: AUDIO & SCREEN READER */}
            <div id="accessibility-audio-screen-reader" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Audio & Screen Reader')}</h2>
              </div>

              {/* Text-to-Speech rate slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">{t('Text-to-Speech rate')}</span>
                  <span className="text-[11px] text-emerald-400 font-mono font-bold">x{ttsRate.toFixed(1)}</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {t('Control the speed at which text is read aloud when using Speak Message or other text to speech features.')}
                </div>
                <div className="pt-2">
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={ttsRate}
                    onChange={(e) => setTtsRate(Number(e.target.value))}
                    className="w-full h-2 bg-muted/60 rounded-lg appearance-none cursor-pointer accent-[#5865F2]"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                    <span>Slower</span>
                    <span className="text-emerald-400 font-bold">x1.0</span>
                    <span>Faster</span>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={previewTtsSpeech}
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold px-4 h-8 rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{t('Preview')}</span>
                </Button>
              </div>

              {/* Image descriptions & legacy chat input */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-semibold text-foreground">{t('Show image descriptions')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t('Image descriptions are used to describe images for screen readers.')}
                    </div>
                  </div>
                  <Switch checked={showImageDescriptions} onCheckedChange={setShowImageDescriptions} />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-semibold text-foreground">{t('Use the legacy chat input')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t('Disables most chat features but may work better with screen readers.')}
                    </div>
                  </div>
                  <Switch checked={useLegacyChatInput} onCheckedChange={setUseLegacyChatInput} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION: SYSTEM & KEYBINDS (DISCORD PARITY)                               */}
        {/* ========================================================================= */}
        {(activeSection === 'system' || activeSection === 'keybinds') && (
          <div className="space-y-8 divide-y divide-border/50 pb-8">
            {/* SUB-SECTION 1: GENERAL */}
            <div id="system-general" className="scroll-mt-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('General')}</h2>
              </div>

              <div className="space-y-4">
                {/* Auto start with OS */}
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Automatically open Discord when your computer starts up')}
                  </div>
                  <Switch checked={autoStartApp} onCheckedChange={setAutoStartApp} />
                </div>

                {/* Start minimized */}
                <div
                  className={cn(
                    'flex items-center justify-between py-2 border-b border-border/50 transition-opacity',
                    !autoStartApp && 'opacity-50 pointer-events-none',
                  )}
                >
                  <div>
                    <div className="text-xs font-semibold text-foreground">{t('Start Discord minimized')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t('Start Discord in the background, out of your way.')}
                    </div>
                  </div>
                  <Switch
                    checked={startMinimized}
                    onCheckedChange={setStartMinimized}
                    disabled={!autoStartApp}
                  />
                </div>

                {/* Minimize to tray */}
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-semibold text-foreground">{t('Minimize Discord to System Tray')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t('Clicking X minimizes Discord instead of closing it completely.')}
                    </div>
                  </div>
                  <Switch checked={minimizeToTray} onCheckedChange={setMinimizeToTray} />
                </div>

                {/* Hardware acceleration */}
                <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-semibold text-foreground">{t('Enable Hardware Acceleration')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      {t(
                        "Uses your GPU to make Discord run more smoothly. Turn this off if you're experiencing visual glitches like frame drops in games or performance problems.",
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={enableHardwareAcceleration}
                    onCheckedChange={(val) => {
                      setEnableHardwareAcceleration(val);
                      toast.info(t('Perubahan Hardware Acceleration akan aktif setelah restart aplikasi.'));
                    }}
                  />
                </div>
              </div>
            </div>

            {/* SUB-SECTION 2: CUSTOM KEYBINDS */}
            <div id="system-custom-keybinds" className="scroll-mt-6 space-y-6 pt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{t('Custom Keybinds')}</h2>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-xl">
                    {t(
                      'Keybinds are custom keyboard shortcuts that let you perform specific actions in Discord without needing to click through menus.',
                    )}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const newId = `kb-${Date.now()}`;
                    setCustomKeybinds((prev) => [
                      ...prev,
                      {
                        id: newId,
                        action: 'Push to Talk',
                        keybind: 'No Keybind Set',
                        enabled: true,
                      },
                    ]);
                    toast.success(t('Pintasan tombol baru ditambahkan'));
                  }}
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold px-3.5 h-8.5 rounded-md shrink-0 cursor-pointer shadow-xs"
                >
                  {t('+ Add a Keybind')}
                </Button>
              </div>

              {/* Info Banner */}
              <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/10 flex items-center gap-3 text-xs text-blue-300">
                <Info className="w-4 h-4 shrink-0 text-blue-400" />
                <span>{t('Keybinds are disabled while this page is visible.')}</span>
              </div>

              {/* Warning Banner: System Helper */}
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <span className="text-amber-200">
                      {t("Due to system permissions, keybinds won't work in certain games. To enable, install Anticeil System Helper.")}{' '}
                    </span>
                    <span
                      onClick={() => toast.info(t('Anticeil System Helper menggunakan hook kernel berbobot ringan untuk registrasi input global.'))}
                      className="text-amber-300 underline font-semibold cursor-pointer"
                    >
                      {t('Learn more')}
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsSystemHelperInstalled(true);
                    toast.success(t('Anticeil System Helper berhasil dipasang!'));
                  }}
                  className="h-7 text-xs font-bold border-amber-400/40 text-amber-300 hover:bg-amber-400/20 shrink-0 cursor-pointer"
                >
                  {isSystemHelperInstalled ? t('Installed ✓') : t('Install')}
                </Button>
              </div>

              {/* Custom Keybinds Table */}
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                  <div className="col-span-6">{t('Keybind Action')}</div>
                  <div className="col-span-5">{t('Keybind')}</div>
                  <div className="col-span-1 text-right">{t('')}</div>
                </div>

                <div className="space-y-2">
                  {customKeybinds.map((kb) => (
                    <div
                      key={kb.id}
                      className="grid grid-cols-12 gap-3 items-center p-3 rounded-xl border border-border/70 bg-[#1e1f22]"
                    >
                      {/* Action selector */}
                      <div className="col-span-6 relative">
                        <select
                          value={kb.action}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomKeybinds((prev) =>
                              prev.map((k) => (k.id === kb.id ? { ...k, action: val } : k)),
                            );
                          }}
                          className="w-full text-xs font-semibold px-3 py-2 rounded-lg bg-[#2b2d31] border border-border/80 text-foreground appearance-none outline-none focus:ring-1 focus:ring-primary cursor-pointer pr-8"
                        >
                          <option value="Activate Overlay Chat">Activate Overlay Chat</option>
                          <option value="Push to Talk">Push to Talk</option>
                          <option value="Push to Mute">Push to Mute</option>
                          <option value="Toggle Mute">Toggle Mute</option>
                          <option value="Toggle Deafen">Toggle Deafen</option>
                          <option value="Toggle Screen Share">Toggle Screen Share</option>
                          <option value="Toggle Camera">Toggle Camera</option>
                          <option value="Toggle Soundboard">Toggle Soundboard</option>
                          <option value="Navigate to Call">Navigate to Call</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      {/* Keybind recorder */}
                      <div className="col-span-5 flex items-center gap-2">
                        <div className="flex-1 px-3 py-2 rounded-lg bg-[#2b2d31] border border-border/80 text-xs font-mono font-semibold text-foreground truncate">
                          {recordingKeybindId === kb.id ? (
                            <span className="text-[#5865F2] animate-pulse">Tekan kombinasi tombol...</span>
                          ) : (
                            kb.keybind
                          )}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            if (recordingKeybindId === kb.id) {
                              setRecordingKeybindId(null);
                            } else {
                              setRecordingKeybindId(kb.id);
                              toast.info(t('Silakan tekan tombol di keyboard'));
                              // Simulate keybind capture on next key press
                              const handler = (e: KeyboardEvent) => {
                                e.preventDefault();
                                const keys: string[] = [];
                                if (e.ctrlKey) keys.push('Ctrl');
                                if (e.altKey) keys.push('Alt');
                                if (e.shiftKey) keys.push('Shift');
                                if (!['Control', 'Alt', 'Shift'].includes(e.key)) {
                                  keys.push(e.key.toUpperCase());
                                }
                                const combo = keys.join(' + ') || 'Ctrl + Shift + X';
                                setCustomKeybinds((prev) =>
                                  prev.map((k) => (k.id === kb.id ? { ...k, keybind: combo } : k)),
                                );
                                setRecordingKeybindId(null);
                                window.removeEventListener('keydown', handler);
                                toast.success(t(`Pintasan tombol disimpan: ${combo}`));
                              };
                              window.addEventListener('keydown', handler, { once: true });
                            }
                          }}
                          className={cn(
                            'h-8 text-xs font-semibold px-2.5 shrink-0 cursor-pointer',
                            recordingKeybindId === kb.id && 'bg-[#5865F2] text-white',
                          )}
                        >
                          {recordingKeybindId === kb.id ? t('Stop') : t('Record Keybind')}
                        </Button>
                      </div>

                      {/* Switch & delete */}
                      <div className="col-span-1 flex items-center justify-end gap-2">
                        <Switch
                          checked={kb.enabled}
                          onCheckedChange={(val) => {
                            setCustomKeybinds((prev) =>
                              prev.map((k) => (k.id === kb.id ? { ...k, enabled: val } : k)),
                            );
                          }}
                        />
                        {customKeybinds.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setCustomKeybinds((prev) => prev.filter((k) => k.id !== kb.id));
                              toast.info(t('Pintasan tombol dihapus'));
                            }}
                            className="text-muted-foreground hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SUB-SECTION 3: DEFAULT KEYBINDS (Screenshots 2 to 7) */}
            <div id="system-default-keybinds" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Default Keybinds')}</h2>
              </div>

              {/* Show Keyboard Shortcuts List */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-[#1e1f22]">
                <span className="text-xs font-bold text-foreground">
                  {t('Show Keyboard Shortcuts List')}
                </span>
                <kbd className="px-2.5 py-1 text-[11px] font-mono font-bold bg-[#2b2d31] border border-border/80 rounded-md text-foreground">
                  CTRL /
                </kbd>
              </div>

              {/* Category 1: Messages */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-foreground">{t('Messages')}</div>
                <div className="text-[11px] text-muted-foreground">
                  {t('These shortcuts work when focused on a message.')}
                </div>
                <div className="rounded-xl border border-border/70 bg-[#1e1f22] divide-y divide-border/50 overflow-hidden">
                  {[
                    { action: 'Edit Message', key: 'E' },
                    { action: 'Delete Message', key: 'BACKSPACE' },
                    { action: 'Pin Message', key: 'P' },
                    { action: 'Add Reaction', key: '+' },
                    { action: 'Reply', key: 'R' },
                    { action: 'Forward Message', key: 'F' },
                    { action: 'Speak Message', key: 'S' },
                    { action: 'Copy Text', key: 'CTRL C' },
                    { action: 'Mark Unread', key: 'ALT ENTER' },
                    { action: 'Focus text area', key: 'ESC' },
                  ].map((row, i) => (
                    <div key={i} className="p-3 flex items-center justify-between hover:bg-white/[0.02]">
                      <span className="text-xs text-foreground font-medium">{row.action}</span>
                      <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#2b2d31] border border-border/80 rounded text-foreground">
                        {row.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category 2: Navigation */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-foreground">{t('Navigation')}</div>
                <div className="rounded-xl border border-border/70 bg-[#1e1f22] divide-y divide-border/50 overflow-hidden">
                  {[
                    { action: 'Navigate between servers', key: 'CTRL ALT ↑  /  ↓' },
                    { action: 'Navigate between channels', key: 'ALT ↑  /  ↓' },
                    { action: 'Navigate forward and backward in page history', key: 'ALT ←  /  →' },
                    { action: 'Navigate between unread channels', key: 'ALT SHIFT ↑  /  ↓' },
                    { action: 'Navigate between unread channels with mentions', key: 'CTRL SHIFT ALT ↑  /  ↓' },
                    { action: 'Navigate to current call', key: 'CTRL SHIFT ALT V' },
                    { action: 'Toggle between last server and DMs', key: 'CTRL ALT →' },
                    { action: 'Toggle QuickSwitcher', key: 'CTRL K' },
                    { action: 'Create or join a server', key: 'CTRL SHIFT N' },
                  ].map((row, i) => (
                    <div key={i} className="p-3 flex items-center justify-between hover:bg-white/[0.02]">
                      <span className="text-xs text-foreground font-medium">{row.action}</span>
                      <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#2b2d31] border border-border/80 rounded text-foreground">
                        {row.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category 3: Drag and Drop */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-foreground">{t('Drag and Drop')}</div>
                <div className="text-[11px] text-muted-foreground">
                  {t('These shortcuts work when focused on a draggable item')}
                </div>
                <div className="rounded-xl border border-border/70 bg-[#1e1f22] divide-y divide-border/50 overflow-hidden">
                  {[
                    { action: 'Start Drag and Drop', key: 'CTRL D' },
                    { action: 'Move', key: '↑  /  ↓' },
                    { action: 'Drop item', key: 'SPACEBAR  /  ENTER' },
                    { action: 'Cancel', key: 'ESC' },
                  ].map((row, i) => (
                    <div key={i} className="p-3 flex items-center justify-between hover:bg-white/[0.02]">
                      <span className="text-xs text-foreground font-medium">{row.action}</span>
                      <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#2b2d31] border border-border/80 rounded text-foreground">
                        {row.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category 4: Chat */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-foreground">{t('Chat')}</div>
                <div className="rounded-xl border border-border/70 bg-[#1e1f22] divide-y divide-border/50 overflow-hidden">
                  {[
                    { action: 'Mark server read', key: 'SHIFT ESC' },
                    { action: 'Mark channel as read', key: 'ESC' },
                    { action: 'Create a private group', key: 'CTRL SHIFT T' },
                    { action: 'Create a thread', key: 'CTRL SHIFT ALT N' },
                    { action: 'Toggle pins popout', key: 'CTRL P' },
                    { action: 'Toggle inbox popout', key: 'CTRL I' },
                    { action: 'Mark top inbox channel read', key: 'CTRL SHIFT E' },
                    { action: 'Toggle channel member list or voice text chat', key: 'CTRL U' },
                    { action: 'Toggle emoji picker', key: 'CTRL E' },
                    { action: 'Toggle GIF picker', key: 'CTRL G' },
                    { action: 'Toggle sticker picker', key: 'CTRL S' },
                    { action: 'Scroll chat up or down', key: 'PAGE UP  /  PAGE DOWN' },
                    { action: 'Jump to oldest unread message', key: 'SHIFT PAGE UP' },
                    { action: 'Focus text area', key: 'ANY KEY' },
                    { action: 'Record a voice message', key: 'ALT R' },
                    { action: 'Upload a file', key: 'CTRL SHIFT U' },
                    { action: 'Copy channel link', key: 'CTRL SHIFT L' },
                  ].map((row, i) => (
                    <div key={i} className="p-3 flex items-center justify-between hover:bg-white/[0.02]">
                      <span className="text-xs text-foreground font-medium">{row.action}</span>
                      <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#2b2d31] border border-border/80 rounded text-foreground">
                        {row.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category 5: Voice and Video */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-foreground">{t('Voice and Video')}</div>
                <div className="rounded-xl border border-border/70 bg-[#1e1f22] divide-y divide-border/50 overflow-hidden">
                  {[
                    { action: 'Toggle mute', key: 'CTRL SHIFT M' },
                    { action: 'Toggle deafen', key: 'CTRL SHIFT D' },
                    { action: 'Answer incoming call', key: 'CTRL ENTER' },
                    { action: 'Decline incoming call', key: 'ESC' },
                    { action: 'Start call in private message or group', key: "CTRL '" },
                    { action: 'Toggle soundboard', key: 'CTRL SHIFT B' },
                  ].map((row, i) => (
                    <div key={i} className="p-3 flex items-center justify-between hover:bg-white/[0.02]">
                      <span className="text-xs text-foreground font-medium">{row.action}</span>
                      <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#2b2d31] border border-border/80 rounded text-foreground">
                        {row.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category 6: Miscellaneous */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-foreground">{t('Miscellaneous')}</div>
                <div className="rounded-xl border border-border/70 bg-[#1e1f22] divide-y divide-border/50 overflow-hidden">
                  {[
                    { action: 'Get help', key: 'CTRL SHIFT H' },
                    { action: 'Search', key: 'CTRL F' },
                    { action: 'Open context menu', key: 'SHIFT F10' },
                    { action: 'Listen to Lofi Beats with Wumpus', key: 'CTRL ALT SHIFT W' },
                  ].map((row, i) => (
                    <div key={i} className="p-3 flex items-center justify-between hover:bg-white/[0.02]">
                      <span className="text-xs text-foreground font-medium">{row.action}</span>
                      <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#2b2d31] border border-border/80 rounded text-foreground">
                        {row.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SUB-SECTION 4: SYSTEM HELPER (Screenshot 8) */}
            <div id="system-helper" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('System Helper')}</h2>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/70 bg-[#1e1f22]">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Discord System Helper')}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 max-w-lg leading-relaxed">
                    {t(
                      "Improves Discord's functionality across games and apps. Helps ensure things like keybinds and other features work reliably.",
                    )}{' '}
                    <span
                      onClick={() => toast.info(t('System helper menyediakan integrasi hooks sistem OS yang aman.'))}
                      className="text-[#5865F2] hover:underline cursor-pointer font-medium"
                    >
                      {t('Learn more')}
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setIsSystemHelperInstalled(true);
                    toast.success(t('Discord System Helper berhasil dipasang!'));
                  }}
                  className={cn(
                    'text-xs font-bold px-5 h-9 rounded-md shrink-0 cursor-pointer transition-all shadow-xs',
                    isSystemHelperInstalled
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-[#5865F2] hover:bg-[#4752C4] text-white',
                  )}
                >
                  {isSystemHelperInstalled ? t('Installed ✓') : t('Install')}
                </Button>
              </div>
            </div>

            {/* SUB-SECTION 5: ADVANCED (Screenshot 8) */}
            <div id="system-advanced" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Advanced')}</h2>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/70 bg-[#1e1f22]">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Capture Performance Trace')}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 max-w-lg leading-relaxed">
                    {t(
                      'Record 30 seconds of performance data and save it to a file you can attach to a support ticket.',
                    )}
                  </div>
                  {isCapturingTrace && (
                    <div className="mt-2.5 space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                        <span>{t('Merekam trace data...')}</span>
                        <span>{traceProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-emerald-500 to-[#5865F2] transition-all duration-150"
                          style={{ width: `${traceProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={isCapturingTrace}
                  onClick={startPerformanceTrace}
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold px-5 h-9 rounded-md shrink-0 cursor-pointer shadow-xs"
                >
                  {isCapturingTrace ? t('Capturing...') : t('Capture')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION: LANGUAGE & TIME (DISCORD PARITY)                                 */}
        {/* ========================================================================= */}
        {activeSection === 'language' && (
          <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div>
              <h2 className="text-xl font-bold text-foreground">{t('Select a Language')}</h2>
              <div className="text-xs text-muted-foreground mt-1">
                {t('Choose the language you want Discord to display.')}
              </div>
            </div>

            {/* Language Selector Dropdown / Popover (Matching Screenshot) */}
            <div className="relative">
              <div
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-[#1e1f22] hover:border-border text-foreground cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl leading-none">{currentLanguage.flag}</span>
                  <span className="text-xs font-semibold text-foreground">{currentLanguage.name}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xs font-medium">{currentLanguage.name}</span>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 transition-transform duration-200',
                      isLanguageDropdownOpen && 'rotate-180',
                    )}
                  />
                </div>
              </div>

              {/* Language Selection List Dropdown */}
              {isLanguageDropdownOpen && (
                <div className="absolute z-50 left-0 right-0 mt-2 p-3 rounded-2xl border border-border/80 bg-[#1e1f22] shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  {/* Search filter */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      type="text"
                      placeholder={t('Search languages...')}
                      value={languageSearch}
                      onChange={(e) => setLanguageSearch(e.target.value)}
                      className="pl-9 h-9 text-xs bg-[#2b2d31] border-border/80 text-foreground"
                    />
                  </div>

                  {/* Languages Grid / List */}
                  <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {languagesList
                      .filter((l) =>
                        l.name.toLowerCase().includes(languageSearch.toLowerCase()) ||
                        l.code.toLowerCase().includes(languageSearch.toLowerCase()),
                      )
                      .map((lang) => {
                        const isSelected = selectedLanguageCode === lang.code;
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => {
                              setSelectedLanguageCode(lang.code);
                              setLocale(lang.locale);
                              setIsLanguageDropdownOpen(false);
                              toast.success(t(`Bahasa diubah ke ${lang.name}`));
                            }}
                            className={cn(
                              'w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left',
                              isSelected
                                ? 'bg-[#5865F2]/10 text-[#5865F2] font-bold'
                                : 'hover:bg-muted/40 text-foreground',
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl leading-none">{lang.flag}</span>
                              <span>{lang.name}</span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-[#5865F2]" />}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Time format (Matching Screenshot) */}
            <div className="space-y-3 pt-4">
              <div className="text-xs font-bold text-foreground">{t('Time format')}</div>
              <div className="space-y-2.5">
                {[
                  {
                    id: 'auto',
                    title: 'Auto',
                    desc: 'Matches your selected language locale settings',
                  },
                  {
                    id: '12h',
                    title: '12-hour',
                    desc: 'Example: 1:33 PM',
                  },
                  {
                    id: '24h',
                    title: '24-hour',
                    desc: 'Example: 13:33',
                  },
                ].map((tf) => {
                  const isSelected = timeFormat === tf.id;
                  return (
                    <div
                      key={tf.id}
                      onClick={() => {
                        setTimeFormat(tf.id as any);
                        try {
                          localStorage.setItem('anticeil_time_format', tf.id);
                        } catch {}
                        toast.success(t(`Format waktu diubah ke ${tf.title}`));
                      }}
                      className={cn(
                        'flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer',
                        isSelected
                          ? 'bg-[#5865F2]/5 border-[#5865F2]'
                          : 'bg-[#1e1f22] border-border/70 hover:bg-muted/30',
                      )}
                    >
                      <div
                        className={cn(
                          'size-4 rounded-full border-2 flex items-center justify-center transition-all',
                          isSelected ? 'border-[#5865F2]' : 'border-muted-foreground/50',
                        )}
                      >
                        {isSelected && <div className="size-2 rounded-full bg-[#5865F2]" />}
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">{tf.title}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">{tf.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* REGISTERED GAMES (Screenshot 1 - Discord Parity)          */}
        {/* ========================================================= */}
        {activeSection === 'registered_games' && (
          <div className="space-y-8 divide-y divide-border/50 pb-8">
            {/* SUB-SECTION 1: CURRENT GAME */}
            <div id="registered-current-game" className="scroll-mt-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Current Game')}</h2>
              </div>

              {/* Box: No game detected */}
              <div className="rounded-xl border border-border/80 bg-[#1e1f22] p-6 text-center space-y-3">
                <div className="text-sm font-semibold text-muted-foreground/80">
                  {t('No game detected')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('Not seeing your game?')}{' '}
                  <button
                    type="button"
                    onClick={() => setIsAddingGameDropdownOpen(!isAddingGameDropdownOpen)}
                    className="text-[#5865F2] hover:underline font-semibold cursor-pointer"
                  >
                    {t('Add it!')}
                  </button>
                </div>

                {/* Dropdown to add a game */}
                {isAddingGameDropdownOpen && (
                  <div className="mt-4 pt-4 border-t border-border/60 max-w-md mx-auto text-left space-y-3 animate-in fade-in zoom-in-95 duration-150">
                    <label className="text-xs font-semibold text-foreground">
                      {t('Select a game or app to add:')}
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedGameToAdd}
                        onChange={(e) => setSelectedGameToAdd(e.target.value)}
                        className="flex-1 h-9 rounded-lg bg-[#2b2d31] border border-border/80 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#5865F2]"
                      >
                        <option value="">{t('Choose a running app...')}</option>
                        {detectableGamesPreset.map((g) => (
                          <option key={g.name} value={g.name}>
                            {g.icon} {g.name}
                          </option>
                        ))}
                        <option value="__custom__">{t('➕ Add Custom Name...')}</option>
                      </select>
                      <Button
                        size="sm"
                        className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs h-9 px-4 cursor-pointer"
                        onClick={() => {
                          const name =
                            selectedGameToAdd === '__custom__'
                              ? customGameInput.trim()
                              : selectedGameToAdd;
                          if (!name) {
                            toast.error(t('Pilih atau ketik nama game terlebih dahulu'));
                            return;
                          }
                          const exists = registeredGames.some(
                            (g) => g.name.toLowerCase() === name.toLowerCase(),
                          );
                          if (exists) {
                            toast.info(t('Game sudah ada dalam daftar'));
                            return;
                          }
                          const preset = detectableGamesPreset.find((p) => p.name === name);
                          setRegisteredGames((prev) => [
                            ...prev,
                            {
                              id: name.toLowerCase().replace(/\s+/g, '-'),
                              name,
                              verified: preset ? preset.verified : false,
                              lastPlayed: t('Just now'),
                              enabled: true,
                              icon: preset?.icon || '🎮',
                            },
                          ]);
                          setSelectedGameToAdd('');
                          setCustomGameInput('');
                          setIsAddingGameDropdownOpen(false);
                          toast.success(t(`${name} berhasil ditambahkan!`));
                        }}
                      >
                        {t('Add Game')}
                      </Button>
                    </div>

                    {selectedGameToAdd === '__custom__' && (
                      <Input
                        type="text"
                        placeholder={t('Enter app / game executable name...')}
                        value={customGameInput}
                        onChange={(e) => setCustomGameInput(e.target.value)}
                        className="h-8 text-xs bg-[#2b2d31] border-border/80 text-foreground"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* SUB-SECTION 2: ADDED GAMES */}
            <div id="registered-added-games" className="scroll-mt-6 space-y-4 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Added Games')}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('Some information about games (such as genre or cover art) is provided by')}{' '}
                  <a
                    href="https://www.igdb.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#5865F2] hover:underline font-medium inline-flex items-center gap-0.5"
                  >
                    IGDB
                    <ExternalLink className="w-3 h-3 ml-0.5 inline" />
                  </a>
                  .
                </p>
              </div>

              {/* Games List */}
              <div className="space-y-2">
                {registeredGames.map((game) => (
                  <div
                    key={game.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-[#1e1f22] hover:border-border transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#2b2d31] flex items-center justify-center text-lg shadow-inner">
                        {game.icon || '🎮'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground">{game.name}</span>
                          {game.verified && (
                            <span
                              className="w-3.5 h-3.5 rounded-full bg-[#5865F2] text-white flex items-center justify-center text-[9px] font-bold"
                              title={t('Verified Game')}
                            >
                              ✓
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {t('Last played')} {game.lastPlayed}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Switch
                        checked={game.enabled}
                        onCheckedChange={(checked) => {
                          setRegisteredGames((prev) =>
                            prev.map((g) => (g.id === game.id ? { ...g, enabled: checked } : g)),
                          );
                          toast.success(
                            checked
                              ? t(`Overlay & status untuk ${game.name} diaktifkan`)
                              : t(`Overlay & status untuk ${game.name} dinonaktifkan`),
                          );
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setRegisteredGames((prev) => prev.filter((g) => g.id !== game.id));
                          toast.success(t(`${game.name} dihapus dari daftar`));
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all cursor-pointer"
                        title={t('Remove Game')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Related Settings Card (Matching Screenshot 1) */}
              <div className="pt-4 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Related Settings')}
                </div>
                <div
                  onClick={() => setActiveSection('activity_privacy')}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-[#1e1f22] hover:bg-[#2b2d31] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-black/30 flex items-center justify-center text-muted-foreground group-hover:text-foreground">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">{t('Activity Privacy')}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {t(
                          'Control who sees activity information from games and connected apps I use.',
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ACTIVITY PRIVACY (Screenshots 2, 3, 4 - Discord Parity)   */}
        {/* ========================================================= */}
        {activeSection === 'activity_privacy' && (
          <div className="space-y-8 divide-y divide-border/50 pb-8">
            {/* SUB-SECTION 1: WHAT ACTIVITY I SHARE (Screenshot 2) */}
            <div id="activity-what-i-share" className="scroll-mt-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('What Activity I Share')}</h2>
              </div>

              {/* 3 Switches */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 py-2 border-b border-border/40">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">{t('Share my activity')}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {t(
                        'Share activity information from games and connected apps I use, including when and how I engage.',
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={shareMyActivity}
                    onCheckedChange={(checked) => {
                      setShareMyActivity(checked);
                      toast.success(
                        checked ? t('Aktivitas akan dibagikan') : t('Aktivitas tidak akan dibagikan'),
                      );
                    }}
                  />
                </div>

                <div className="flex items-center justify-between gap-4 py-2 border-b border-border/40">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Share when I come online')}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {t('Allow friends to receive a push notification when you come online.')}
                    </div>
                  </div>
                  <Switch
                    checked={shareWhenOnline}
                    onCheckedChange={(checked) => {
                      setShareWhenOnline(checked);
                      toast.success(
                        checked ? t('Notifikasi online aktif') : t('Notifikasi online nonaktif'),
                      );
                    }}
                  />
                </div>

                <div className="flex items-center justify-between gap-4 py-2">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Share when I start streaming')}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {t(
                        'Allow members that you interact with the most to get a notification when you start streaming in small servers.',
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={shareWhenStreaming}
                    onCheckedChange={(checked) => {
                      setShareWhenStreaming(checked);
                      toast.success(
                        checked ? t('Notifikasi streaming aktif') : t('Notifikasi streaming nonaktif'),
                      );
                    }}
                  />
                </div>
              </div>

              {/* Related Settings Card leading to Registered Games with Terraria tree icon (Screenshot 2) */}
              <div className="pt-2 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Related Settings')}
                </div>
                <div
                  onClick={() => setActiveSection('registered_games')}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-[#1e1f22] hover:bg-[#2b2d31] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-black/30 flex items-center justify-center text-muted-foreground group-hover:text-foreground">
                      <Gamepad2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">{t('Registered Games')}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {t(
                          'You may also be sharing activity from 1 game you play, including Terraria. Restrict sharing on a game by game basis.',
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg bg-[#142b1b] border border-[#2d5a36] flex items-center justify-center text-sm shadow-sm"
                      title="Terraria"
                    >
                      🌳
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            </div>

            {/* SUB-SECTION 2: WHERE I SHARE ACTIVITY (Screenshots 2, 3, 4) */}
            <div id="activity-where-i-share" className="scroll-mt-6 space-y-4 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Where I Share Activity')}</h2>
                <div className="text-xs font-semibold text-foreground mt-2">
                  {t('Automatically share my activity when joining a server')}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {t('Your activity is always shared with your friends.')}
                </div>
              </div>

              {/* Radio Options */}
              <div className="space-y-2.5 pt-1">
                {[
                  { id: 'all', title: t('Share in all servers') },
                  { id: 'small', title: t('Share in servers with 200 or fewer members') },
                  { id: 'none', title: t('Do not share in any servers') },
                ].map((opt) => {
                  const isSelected = shareServerScope === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        setShareServerScope(opt.id as any);
                        toast.success(t(`Pengaturan server diubah: ${opt.title}`));
                      }}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer',
                        isSelected
                          ? 'bg-[#5865F2]/5 border-[#5865F2]'
                          : 'bg-[#1e1f22] border-border/70 hover:bg-muted/30',
                      )}
                    >
                      <div
                        className={cn(
                          'size-4 rounded-full border-2 flex items-center justify-center transition-all',
                          isSelected ? 'border-[#5865F2]' : 'border-muted-foreground/50',
                        )}
                      >
                        {isSelected && <div className="size-2 rounded-full bg-[#5865F2]" />}
                      </div>
                      <span className="text-xs font-semibold text-foreground">{opt.title}</span>
                    </div>
                  );
                })}
              </div>

              {/* Search my servers Input (Screenshot 3 & 4) */}
              <div className="relative pt-2">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none mt-1" />
                <Input
                  type="text"
                  placeholder={t('Search my servers')}
                  value={activityServerSearch}
                  onChange={(e) => setActivityServerSearch(e.target.value)}
                  className="pl-9 h-9 text-xs bg-[#1e1f22] border-border/80 text-foreground"
                />
              </div>

              {/* Server List Controls: Order & Toggle All Off */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <div className="relative">
                  <select
                    value={activityServerSortOrder}
                    onChange={(e) => setActivityServerSortOrder(e.target.value as any)}
                    className="bg-transparent text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none pr-4"
                  >
                    <option value="order" className="bg-[#1e1f22] text-foreground">
                      {t('Server Order ⌵')}
                    </option>
                    <option value="name" className="bg-[#1e1f22] text-foreground">
                      {t('Server Name ⌵')}
                    </option>
                    <option value="members" className="bg-[#1e1f22] text-foreground">
                      {t('Member Count ⌵')}
                    </option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAllServers}
                  className="text-[#5865F2] hover:underline font-semibold cursor-pointer text-xs"
                >
                  {isAnyServerActivityOn ? t('Toggle All Off') : t('Toggle All On')}
                </button>
              </div>

              {/* Primary Servers List */}
              <div className="space-y-2">
                {primaryActivityServers.map((server) => {
                  const isShared = serverActivityEnabledMap[server.id] ?? true;
                  return (
                    <div
                      key={server.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-[#1e1f22] hover:border-border transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#5865F2]/20 border border-[#5865F2]/30 flex items-center justify-center font-bold text-xs text-[#5865F2] shrink-0">
                          {server.avatarFallback}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-foreground truncate">{server.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {server.members.toLocaleString()} {t('members')}
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={isShared}
                        onCheckedChange={(checked) => {
                          setServerActivityEnabledMap((prev) => ({ ...prev, [server.id]: checked }));
                          toast.success(
                            checked
                              ? t(`Aktivitas dibagikan ke ${server.name}`)
                              : t(`Aktivitas tidak dibagikan ke ${server.name}`),
                          );
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Show 40 more servers Accordion (Screenshot 4) */}
              {secondaryActivityServers.length > 0 && (
                <div className="space-y-2">
                  <div
                    onClick={() => setShowMoreActivityServers(!showMoreActivityServers)}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-[#1e1f22] hover:bg-[#2b2d31] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#e67e22]/20 border border-[#e67e22]/40 flex items-center justify-center text-sm shadow-inner">
                        🦊
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">
                          {showMoreActivityServers
                            ? t('Hide additional servers')
                            : t('Show 40 more servers')}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {t('Moku, Wild Forest, Cerita Crypto, and +37 more servers')}
                        </div>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-[#2b2d31] flex items-center justify-center text-muted-foreground group-hover:text-foreground">
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 transition-transform duration-200',
                          showMoreActivityServers && 'rotate-180',
                        )}
                      />
                    </div>
                  </div>

                  {/* Expanded secondary servers list */}
                  {showMoreActivityServers && (
                    <div className="space-y-2 pl-2 border-l-2 border-border/40 animate-in fade-in duration-150">
                      {secondaryActivityServers.map((server) => {
                        const isShared = serverActivityEnabledMap[server.id] ?? true;
                        return (
                          <div
                            key={server.id}
                            className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-[#1e1f22] hover:border-border transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs text-foreground shrink-0">
                                {server.avatarFallback}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-foreground truncate">
                                  {server.name}
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  {server.members.toLocaleString()} {t('members')}
                                </div>
                              </div>
                            </div>
                            <Switch
                              checked={isShared}
                              onCheckedChange={(checked) => {
                                setServerActivityEnabledMap((prev) => ({
                                  ...prev,
                                  [server.id]: checked,
                                }));
                                toast.success(
                                  checked
                                    ? t(`Aktivitas dibagikan ke ${server.name}`)
                                    : t(`Aktivitas tidak dibagikan ke ${server.name}`),
                                );
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Related Settings Card leading to Data & Privacy (Screenshot 4) */}
              <div className="pt-2 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Related Settings')}
                </div>
                <div
                  onClick={() => setActiveSection('privacy')}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-[#1e1f22] hover:bg-[#2b2d31] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-black/30 flex items-center justify-center text-muted-foreground group-hover:text-foreground">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">{t('Data & Privacy')}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {t(
                          'Control who can see your profile info — like your bio and connected accounts.',
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </div>

            {/* SUB-SECTION 3: ACTIVITY JOINING (Screenshot 4) */}
            <div id="activity-joining" className="scroll-mt-6 space-y-4 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Activity Joining')}</h2>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {t("Some games allow users to join the game you're playing when viewing your activity.")}
                </div>
              </div>

              {/* 2 Switches */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 py-2 border-b border-border/40">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Allow friends to join my game')}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {t('Allows friends to join without sending a request.')}
                    </div>
                  </div>
                  <Switch
                    checked={allowFriendsJoinGame}
                    onCheckedChange={(checked) => {
                      setAllowFriendsJoinGame(checked);
                      toast.success(
                        checked
                          ? t('Teman dapat bergabung ke game tanpa request')
                          : t('Teman harus mengirim request untuk bergabung'),
                      );
                    }}
                  />
                </div>

                <div className="flex items-center justify-between gap-4 py-2">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Allow voice channel participants to join my game')}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {t(
                        'Allow anyone in a shared voice channel to join my game without sending a request. This feature only works in non-Community enabled servers.',
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={allowVoiceParticipantsJoinGame}
                    onCheckedChange={(checked) => {
                      setAllowVoiceParticipantsJoinGame(checked);
                      toast.success(
                        checked
                          ? t('Peserta voice channel dapat bergabung ke game')
                          : t('Peserta voice channel tidak dapat bergabung otomatis'),
                      );
                    }}
                  />
                </div>
              </div>

              {/* Footer Note (Matching Screenshot 4) */}
              <div className="text-[11px] text-muted-foreground leading-relaxed pt-2">
                {t(
                  'Looking for per-server controls? Navigate to the server, select the dropdown menu next to the server name, then select Privacy Settings. From there, you can toggle on or off Activity Joining for just that server.',
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* GAME OVERLAY (Screenshots 1, 2, 3, 4 - Discord Parity)    */}
        {/* ========================================================= */}
        {activeSection === 'overlay' && (
          <div className="space-y-8 divide-y divide-border/50 pb-8">
            {/* SUB-SECTION 1: OVERVIEW (Screenshot 1) */}
            <div id="overlay-overview" className="scroll-mt-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Game Overlay')}</h2>
              </div>

              {/* Card 1: Enable Overlay */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border/80 bg-[#1e1f22] hover:border-border transition-colors">
                <div className="space-y-1 pr-4">
                  <div className="text-sm font-semibold text-foreground">{t('Enable Overlay')}</div>
                  <div className="text-xs text-muted-foreground">
                    {t(
                      'Lighter, faster, and more customizable. Requires Borderless display setting.',
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Switch
                    checked={enableOverlay}
                    onCheckedChange={(checked) => {
                      setEnableOverlay(checked);
                      toast.success(checked ? t('Overlay diaktifkan') : t('Overlay dinonaktifkan'));
                    }}
                  />
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              {/* Card 2: Enable Legacy Overlay */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border/80 bg-[#1e1f22] hover:border-border transition-colors">
                <div className="space-y-1 pr-4">
                  <div className="text-sm font-semibold text-foreground">
                    {t('Enable Legacy Overlay')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t('Legacy Overlay available for all supported games.')}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Switch
                    checked={enableLegacyOverlay}
                    onCheckedChange={(checked) => {
                      setEnableLegacyOverlay(checked);
                      toast.success(
                        checked
                          ? t('Legacy Overlay diaktifkan')
                          : t('Legacy Overlay dinonaktifkan'),
                      );
                    }}
                  />
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              {/* Card 3: Report a Problem */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border/80 bg-[#1e1f22] hover:border-border transition-colors">
                <div className="space-y-1 pr-4">
                  <div className="text-sm font-semibold text-foreground">{t('Report a Problem')}</div>
                  <div className="text-xs text-muted-foreground">
                    {t("If Overlay isn't working as expected, let us know so we can fix it.")}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() =>
                    toast.success(
                      t('Terima kasih! Laporan masalah overlay telah dikirim ke tim pengembang.'),
                    )
                  }
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs px-5 h-9 rounded-lg font-semibold shrink-0 cursor-pointer"
                >
                  {t('Report')}
                </Button>
              </div>

              <div className="pt-2 border-t border-border/40 space-y-4">
                {/* Toggle Overlay Lock */}
                <div className="flex items-center justify-between gap-4 py-2">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Toggle Overlay Lock')}
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditingOverlayKeybind ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={tempOverlayKeybind}
                          onChange={(e) => setTempOverlayKeybind(e.target.value.toUpperCase())}
                          className="h-8 w-32 text-xs font-mono bg-[#2b2d31] border-[#5865F2] text-foreground text-center"
                          autoFocus
                          placeholder="Tekan shortcut..."
                        />
                        <Button
                          size="sm"
                          className="h-8 px-3 text-xs bg-[#5865F2] hover:bg-[#4752C4] text-white"
                          onClick={() => {
                            if (tempOverlayKeybind.trim()) {
                              setOverlayLockKeybind(tempOverlayKeybind.trim());
                            }
                            setIsEditingOverlayKeybind(false);
                            toast.success(t('Shortcut lock overlay diperbarui!'));
                          }}
                        >
                          {t('Simpan')}
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="px-3 py-1.5 rounded-lg bg-[#2b2d31] border border-border/70 text-xs font-mono font-bold text-foreground tracking-wider">
                          {overlayLockKeybind}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setTempOverlayKeybind(overlayLockKeybind);
                            setIsEditingOverlayKeybind(true);
                          }}
                          className="h-8 px-3 text-xs bg-[#2b2d31] hover:bg-[#35373c] text-foreground font-semibold rounded-lg cursor-pointer"
                        >
                          {t('Edit Keybind')}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Enable overlay clickable regions */}
                <div className="flex items-center justify-between gap-4 py-2">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      {t('Enable overlay clickable regions')}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {t(
                        'Allows areas of the overlay (ie notifications) to be clickable while the overlay is locked.',
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={enableClickableRegions}
                    onCheckedChange={(checked) => {
                      setEnableClickableRegions(checked);
                      toast.success(
                        checked
                          ? t('Clickable regions overlay aktif')
                          : t('Clickable regions overlay nonaktif'),
                      );
                    }}
                  />
                </div>
              </div>
            </div>

            {/* SUB-SECTION 2: WIDGETS (Screenshot 2) */}
            <div id="overlay-widgets" className="scroll-mt-6 space-y-4 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Widgets')}</h2>
                <div className="text-xs text-muted-foreground mt-1">
                  {t('Choose what shows up in your overlay.')}
                </div>
              </div>

              {/* 7 Switches */}
              <div className="space-y-4">
                {[
                  {
                    id: 'voice',
                    label: t('Voice'),
                    desc: t("Who's talking in your call"),
                    checked: widgetVoice,
                    setter: setWidgetVoice,
                  },
                  {
                    id: 'quick-actions',
                    label: t('Quick Actions'),
                    desc: t('Mute, deafen and more'),
                    checked: widgetQuickActions,
                    setter: setWidgetQuickActions,
                  },
                  {
                    id: 'notifications',
                    label: t('Notifications'),
                    desc: t('Messages, calls and invites'),
                    checked: widgetNotifications,
                    setter: setWidgetNotifications,
                  },
                  {
                    id: 'chat',
                    label: t('Chat'),
                    desc: t('Chat without leaving your game'),
                    checked: widgetChat,
                    setter: setWidgetChat,
                  },
                  {
                    id: 'activity',
                    label: t('Activity'),
                    desc: t('What friends are playing'),
                    checked: widgetActivity,
                    setter: setWidgetActivity,
                  },
                  {
                    id: 'video',
                    label: t('Video'),
                    desc: t('Cameras in your call'),
                    checked: widgetVideo,
                    setter: setWidgetVideo,
                  },
                  {
                    id: 'streams',
                    label: t('Streams'),
                    desc: t('Streams in your call'),
                    checked: widgetStreams,
                    setter: setWidgetStreams,
                  },
                ].map((w, idx) => (
                  <div
                    key={w.id}
                    className={cn(
                      'flex items-center justify-between gap-4 py-2',
                      idx < 6 && 'border-b border-border/40',
                    )}
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-foreground">{w.label}</div>
                      <div className="text-[11px] text-muted-foreground">{w.desc}</div>
                    </div>
                    <Switch
                      checked={w.checked}
                      onCheckedChange={(checked) => {
                        w.setter(checked);
                        toast.success(
                          checked
                            ? t(`Widget ${w.label} diaktifkan`)
                            : t(`Widget ${w.label} dinonaktifkan`),
                        );
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Reset Default Layout Row (Screenshot 2) */}
              <div className="flex items-center justify-between pt-4 border-t border-border/40">
                <span className="text-xs font-semibold text-foreground">
                  {t('Reset Default Layout')}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleResetOverlayWidgets}
                  className="bg-[#2b2d31] hover:bg-[#35373c] text-foreground text-xs px-5 h-9 rounded-lg font-semibold cursor-pointer"
                >
                  {t('Reset')}
                </Button>
              </div>
            </div>

            {/* SUB-SECTION 3: VOICE WIDGET (Screenshot 3) */}
            <div id="overlay-voice-widget" className="scroll-mt-6 space-y-4 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Voice Widget')}</h2>
              </div>

              {/* Voice Widget Interactive Live Preview Container */}
              <div className="rounded-2xl border border-border/80 bg-[#1e1f22] p-8 flex items-center justify-center relative min-h-[260px] shadow-inner overflow-hidden">
                {/* Floating Mock Voice Overlay Card */}
                <div className="w-64 rounded-2xl bg-[#111214]/90 backdrop-blur-md border border-white/10 p-3.5 space-y-2.5 shadow-2xl">
                  {/* Participant 1: zmsta */}
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        'rounded-full bg-[#2b2d31] flex items-center justify-center text-xs overflow-hidden shrink-0 border border-border/60',
                        overlayAvatarSize === 'Large' ? 'size-8' : 'size-6',
                      )}
                    >
                      🐱
                    </div>
                    {overlayDisplayNames !== 'Never' && (
                      <span className="text-xs font-semibold text-white/90 truncate">zmsta</span>
                    )}
                  </div>

                  {/* Participant 2: Acetaminophen (Speaking state) */}
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        'rounded-full bg-[#5865F2] flex items-center justify-center text-xs text-white shrink-0 ring-2 ring-emerald-500 shadow-sm shadow-emerald-500/50',
                        overlayAvatarSize === 'Large' ? 'size-8' : 'size-6',
                      )}
                    >
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    {overlayDisplayNames !== 'Never' && (
                      <span className="text-xs font-bold text-emerald-400 truncate">
                        Acetaminophen
                      </span>
                    )}
                    <Mic className="w-3.5 h-3.5 text-emerald-400 ml-auto shrink-0" />
                  </div>

                  {/* Participant 3: Kovanth */}
                  {overlayDisplayUsers === 'Always' && (
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          'rounded-full bg-[#5865F2] flex items-center justify-center text-xs text-white shrink-0',
                          overlayAvatarSize === 'Large' ? 'size-8' : 'size-6',
                        )}
                      >
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      {overlayDisplayNames !== 'Never' && (
                        <span className="text-xs font-semibold text-white/90 truncate">
                          Kovanth
                        </span>
                      )}
                    </div>
                  )}

                  {/* Participant 4: Scynder (Deafened state) */}
                  {overlayDisplayUsers === 'Always' && (
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          'rounded-full bg-[#5865F2] flex items-center justify-center text-xs text-white shrink-0',
                          overlayAvatarSize === 'Large' ? 'size-8' : 'size-6',
                        )}
                      >
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      {overlayDisplayNames !== 'Never' && (
                        <span className="text-xs font-semibold text-white/90 truncate">
                          Scynder
                        </span>
                      )}
                      <Headphones className="w-3.5 h-3.5 text-rose-500 ml-auto shrink-0" />
                    </div>
                  )}

                  {/* Bottom Pill: Voice Channel & Pin */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <span className="text-[11px] font-bold text-muted-foreground tracking-wide">
                      {t('Voice Channel')}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsVoiceWidgetPinned(!isVoiceWidgetPinned);
                        toast.success(
                          isVoiceWidgetPinned
                            ? t('Widget suara di-unpin')
                            : t('Widget suara di-pin ke overlay'),
                        );
                      }}
                      className={cn(
                        'size-6 rounded-full flex items-center justify-center transition-all cursor-pointer',
                        isVoiceWidgetPinned
                          ? 'bg-[#5865F2] text-white shadow-sm'
                          : 'bg-white/10 text-muted-foreground hover:bg-white/20',
                      )}
                      title={isVoiceWidgetPinned ? t('Pinned') : t('Unpinned')}
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Controls Grid / Rows (Screenshot 3) */}
              <div className="space-y-4 pt-2">
                {/* Avatar Size */}
                <div className="flex items-center justify-between gap-4 py-2 border-b border-border/40">
                  <span className="text-xs font-semibold text-foreground">{t('Avatar Size')}</span>
                  <Select
                    value={overlayAvatarSize}
                    onValueChange={(val: 'Large' | 'Small') => {
                      setOverlayAvatarSize(val);
                      toast.success(t(`Ukuran avatar diubah ke ${val}`));
                    }}
                  >
                    <SelectTrigger className="w-44 h-9 bg-[#1e1f22] border-border/80 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1f22] border-border/80 text-foreground">
                      <SelectItem value="Large">{t('Large')}</SelectItem>
                      <SelectItem value="Small">{t('Small')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Display Names */}
                <div className="flex items-center justify-between gap-4 py-2 border-b border-border/40">
                  <span className="text-xs font-semibold text-foreground">
                    {t('Display Names')}
                  </span>
                  <Select
                    value={overlayDisplayNames}
                    onValueChange={(val: any) => {
                      setOverlayDisplayNames(val);
                      toast.success(t(`Tampilan nama diubah ke ${val}`));
                    }}
                  >
                    <SelectTrigger className="w-44 h-9 bg-[#1e1f22] border-border/80 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1f22] border-border/80 text-foreground">
                      <SelectItem value="Always">{t('Always')}</SelectItem>
                      <SelectItem value="Only While Speaking">
                        {t('Only While Speaking')}
                      </SelectItem>
                      <SelectItem value="Never">{t('Never')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Display Users */}
                <div className="flex items-center justify-between gap-4 py-2 border-b border-border/40">
                  <span className="text-xs font-semibold text-foreground">
                    {t('Display Users')}
                  </span>
                  <Select
                    value={overlayDisplayUsers}
                    onValueChange={(val: any) => {
                      setOverlayDisplayUsers(val);
                      toast.success(t(`Tampilan pengguna diubah ke ${val}`));
                    }}
                  >
                    <SelectTrigger className="w-44 h-9 bg-[#1e1f22] border-border/80 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e1f22] border-border/80 text-foreground">
                      <SelectItem value="Always">{t('Always')}</SelectItem>
                      <SelectItem value="Only While Speaking">
                        {t('Only While Speaking')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Max Users Displayed Slider (Screenshot 3 & 4) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      {t('Max Users Displayed')}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#5865F2]">
                      {overlayMaxUsers === 0 ? t('Off') : overlayMaxUsers}
                    </span>
                  </div>
                  <div className="relative pt-2 pb-4">
                    <input
                      type="range"
                      min={0}
                      max={25}
                      step={1}
                      value={overlayMaxUsers}
                      onChange={(e) => setOverlayMaxUsers(Number(e.target.value))}
                      className="w-full accent-[#5865F2] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                      <span>Off</span>
                      <span>5</span>
                      <span>10</span>
                      <span>15</span>
                      <span>20</span>
                      <span>25</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SUB-SECTION 4: NOTIFICATIONS (Screenshot 4) */}
            <div id="overlay-notifications" className="scroll-mt-6 space-y-4 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Notifications')}</h2>
              </div>

              {/* 5 Switches */}
              <div className="space-y-4">
                {[
                  {
                    id: 'messages',
                    label: t('Messages'),
                    desc: t(
                      'For each text message notification, shows a notice that you can reply to.',
                    ),
                    checked: overlayNotifMessages,
                    setter: setOverlayNotifMessages,
                  },
                  {
                    id: 'welcome',
                    label: t('Welcome'),
                    desc: t(
                      'Shows a notice every time the overlay opens to let you know that the overlay is now active.',
                    ),
                    checked: overlayNotifWelcome,
                    setter: setOverlayNotifWelcome,
                  },
                  {
                    id: 'go-live',
                    label: t('Go Live'),
                    desc: t(
                      'Lets you know when you are able to stream a game when the overlay first opens.',
                    ),
                    checked: overlayNotifGoLive,
                    setter: setOverlayNotifGoLive,
                  },
                  {
                    id: 'game-activity',
                    label: t('Game Activity'),
                    desc: t(
                      'Shows friends who are currently playing, or have recently played the game you’re currently playing.',
                    ),
                    checked: overlayNotifGameActivity,
                    setter: setOverlayNotifGameActivity,
                  },
                  {
                    id: 'now-playing',
                    label: t('Now Playing'),
                    desc: t(
                      'Notifies you when a friend starts playing the game you are currently playing.',
                    ),
                    checked: overlayNotifNowPlaying,
                    setter: setOverlayNotifNowPlaying,
                  },
                ].map((n, idx) => (
                  <div
                    key={n.id}
                    className={cn(
                      'flex items-center justify-between gap-4 py-2',
                      idx < 4 && 'border-b border-border/40',
                    )}
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-foreground">{n.label}</div>
                      <div className="text-[11px] text-muted-foreground">{n.desc}</div>
                    </div>
                    <Switch
                      checked={n.checked}
                      onCheckedChange={(checked) => {
                        n.setter(checked);
                        toast.success(
                          checked
                            ? t(`Notifikasi overlay ${n.label} diaktifkan`)
                            : t(`Notifikasi overlay ${n.label} dinonaktifkan`),
                        );
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </TwoPaneSettingsDialog>
  );
}
