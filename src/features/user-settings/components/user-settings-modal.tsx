import React, { useState, useMemo, useEffect } from 'react';
import {
  User,
  Mic,
  Palette,
  LogOut,
  AtSign,
  UserCheck,
  Shield,
  ShieldAlert,
  Bell,
  Zap,
  Gem,
  CreditCard,
  Gift,
  Receipt,
  Search,
  Laptop,
  Users,
  Gamepad2,
  Link2,
  Pencil,
  SlidersHorizontal,
  Languages,
  Layers,
  Code2,
} from 'lucide-react';
import { TwoPaneSettingsDialog, SettingsNavGroup } from '@/components/ui/two-pane-settings-dialog';
import { Input } from '@/components/ui/input';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import type { SettingsSection, UserSettingsModalProps } from '../types';
import {
  AccountTab,
  PrivacyTab,
  PermissionsTab,
  NotificationsTab,
  BillingTab,
  VoiceVideoTab,
  AppearanceTab,
  AccessibilityTab,
  SystemTab,
  LanguageTab,
  GamesAppsTab,
  DeveloperTab,
} from './tabs';

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
  onOpenEditProfile,
}: UserSettingsModalProps) {
  const { t, locale, setLocale } = useTranslation();
  const [activeSection, setActiveSection] = useState<SettingsSection>(
    (initialSection as SettingsSection) || 'account',
  );

  useEffect(() => {
    if (open && initialSection) {
      setActiveSection(initialSection as SettingsSection);
    }
  }, [open, initialSection]);
  const [searchQuery, setSearchQuery] = useState('');

  // Full Discord settings navigation groups
  const allGroups: SettingsNavGroup[] = useMemo(
    () => [
      {
        key: 'USER_SETTINGS',
        title: t('User Settings'),
        items: [
          {
            id: 'account',
            label: t('Account'),
            icon: <User className="w-4 h-4" />,
            subItems: [
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
            label: t('Registered App'),
            icon: <Gamepad2 className="w-4 h-4" />,
            subItems: [
              { id: 'registered-current-game', label: t('Current App') },
              { id: 'registered-added-games', label: t('Added Apps') },
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
            label: t('App Overlay'),
            icon: <Layers className="w-4 h-4" />,
            subItems: [
              { id: 'overlay-overview', label: t('Overview') },
              { id: 'overlay-widgets', label: t('Widgets') },
              { id: 'overlay-voice-widget', label: t('Voice Widget') },
              { id: 'overlay-notifications', label: t('Notifications') },
            ],
          },
          {
            id: 'connected_apps',
            label: t('Connected Apps'),
            icon: <Link2 className="w-4 h-4" />,
            subItems: [
              { id: 'connected-connections', label: t('Connections') },
              { id: 'connected-authorized-apps', label: t('Authorized Apps') },
            ],
          },
        ],
      },
      {
        key: 'DEVELOPER_SETTINGS',
        items: [
          {
            id: 'developer',
            label: t('Developer'),
            icon: <Code2 className="w-4 h-4" />,
          },
        ],
      },
    ],
    [t],
  );

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
      }}
      sidebarHeader={
        <div className="space-y-3 mb-2">
          {/* User Profile Card Header in Sidebar (Discord 1:1 Parity) */}
          {currentUser && (
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onOpenEditProfile?.();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpenEditProfile?.();
                }
              }}
              className="flex items-center gap-3 px-1 py-1.5 rounded-lg hover:bg-sidebar-accent/50 cursor-pointer transition-colors group select-none"
            >
              <CommunityAvatar
                name={currentUserName}
                email={currentUser?.email}
                imageUrl={currentUser?.imageUrl}
                size={36}
                showStatus={false}
                className="shrink-0 rounded-full ring-1 ring-border/50"
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-bold text-foreground truncate leading-tight">
                  {currentUserName}
                </span>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground group-hover:text-foreground font-medium transition-colors mt-0.5">
                  <span className="group-hover:underline">{t('Edit Profiles')}</span>
                  <Pencil className="w-2.5 h-2.5 shrink-0 opacity-70 group-hover:opacity-100" />
                </div>
              </div>
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
      <div className="space-y-6 pb-12 w-full">
        {activeSection === 'account' && (
          <AccountTab
            currentUser={currentUser}
            currentUserName={currentUserName}
            onSaveDisplayName={onSaveDisplayName}
            isSavingDisplayName={isSavingDisplayName}
            onSaveUsername={onSaveUsername}
            isSavingUsername={isSavingUsername}
            onNavigateSection={(id) => setActiveSection(id as SettingsSection)}
            onOpenEditProfile={onOpenEditProfile}
            open={open}
          />
        )}

        {activeSection === 'privacy' && <PrivacyTab />}

        {activeSection === 'permissions' && <PermissionsTab />}

        {activeSection === 'notifications' && <NotificationsTab />}

        {(activeSection === 'nitro' ||
          activeSection === 'boost' ||
          activeSection === 'subscriptions' ||
          activeSection === 'gifts' ||
          activeSection === 'billing') && (
          <BillingTab activeSection={activeSection} theme={theme} />
        )}

        {activeSection === 'voice' && (
          <VoiceVideoTab
            onNavigateSection={(id) => setActiveSection(id as SettingsSection)}
          />
        )}

        {activeSection === 'appearance' && (
          <AppearanceTab theme={theme} setTheme={setTheme} />
        )}

        {activeSection === 'accessibility' && (
          <AccessibilityTab
            theme={theme}
            onNavigateSection={(id) => setActiveSection(id as SettingsSection)}
          />
        )}

        {(activeSection === 'system' || activeSection === 'keybinds') && (
          <SystemTab activeSection={activeSection} />
        )}

        {activeSection === 'language' && (
          <LanguageTab locale={locale} setLocale={setLocale} />
        )}

        {(activeSection === 'registered_games' ||
          activeSection === 'activity_privacy' ||
          activeSection === 'overlay' ||
          activeSection === 'connected_apps') && (
          <GamesAppsTab
            activeSection={activeSection}
            currentUser={currentUser}
            currentUserName={currentUserName}
          />
        )}

        {activeSection === 'developer' && <DeveloperTab />}
      </div>
    </TwoPaneSettingsDialog>
  );
}
