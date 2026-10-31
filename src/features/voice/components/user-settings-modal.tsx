import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  User,
  Mic,
  Video,
  Sliders,
  Palette,
  LogOut,
  AtSign,
  Clock,
  Moon,
  Sun,
  Sparkles,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { useVoiceSettings, NoiseSuppressionType } from '../hooks/use-voice-settings';
import dayjs from 'dayjs';

type SettingsSection = 'account' | 'voice' | 'camera' | 'appearance';

export interface UserSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // account props
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
  initialSection?: SettingsSection;
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
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);

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
    if (open) setActiveSection(initialSection);
  }, [open, initialSection]);

  // ── Account state ──
  const suggestedUsername = useMemo(() => {
    if (currentUser?.username) return currentUser.username;
    const base = currentUser?.email?.split('@')[0] || currentUserName;
    return base?.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 32) || '';
  }, [currentUser?.username, currentUser?.email, currentUserName]);

  const [editDisplayNameInput, setEditDisplayNameInput] = useState(currentUserName);
  const [editUsernameInput, setEditUsernameInput] = useState(suggestedUsername);

  useEffect(() => {
    if (open) {
      setEditDisplayNameInput(currentUserName);
      setEditUsernameInput(suggestedUsername);
    }
  }, [open, currentUserName, suggestedUsername]);

  const usernameLastChangedAt = currentUser?.usernameLastChangedAt;
  const usernameCooldownEnd = usernameLastChangedAt
    ? new Date(new Date(usernameLastChangedAt).getTime() + 14 * 24 * 60 * 60 * 1000)
    : null;
  const isUsernameCooldownActive = Boolean(usernameCooldownEnd && usernameCooldownEnd.getTime() > Date.now());

  const handleDisplayNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDisplayNameInput.trim() || editDisplayNameInput.trim() === currentUserName) return;
    onSaveDisplayName(editDisplayNameInput.trim());
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUsernameInput.trim() || editUsernameInput.trim() === currentUser?.username) return;
    onSaveUsername(editUsernameInput.trim());
  };

  // ── Sidebar nav items ──
  const navSections: { id: SettingsSection; label: string; icon: React.ReactNode; group: string }[] = [
    { id: 'account', label: t('Akun'), icon: <User className="w-4 h-4" />, group: 'USER_SETTINGS' },
    { id: 'appearance', label: t('Tampilan'), icon: <Palette className="w-4 h-4" />, group: 'USER_SETTINGS' },
    { id: 'voice', label: 'Voice', icon: <Mic className="w-4 h-4" />, group: 'APP_SETTINGS' },
    { id: 'camera', label: 'Camera', icon: <Video className="w-4 h-4" />, group: 'APP_SETTINGS' },
  ];

  const groups = [
    { key: 'USER_SETTINGS', label: t('Pengaturan Pengguna') },
    { key: 'APP_SETTINGS', label: t('Pengaturan Aplikasi') },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="p-0 w-full h-full sm:w-[calc(100vw-3rem)] sm:h-[calc(100vh-2.5rem)] max-w-[1240px] max-h-[860px] overflow-hidden bg-background border border-border flex flex-row rounded-none sm:rounded-[20px] shadow-2xl"
      >
        {/* ── Left Sidebar ── */}
        <div className="w-[240px] sm:w-[260px] shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col py-6 px-3 sm:px-4 overflow-y-auto select-none">
          {/* User mini-card */}
          {currentUser && (
            <div className="px-1 mb-5">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-sidebar-accent/80 border border-sidebar-border">
                <CommunityAvatar
                  name={currentUserName}
                  email={currentUser?.email}
                  imageUrl={currentUser?.imageUrl}
                  size={36}
                  showStatus={false}
                  className="shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-foreground truncate">{currentUserName}</span>
                  <span className="text-[10px] text-muted-foreground font-mono truncate">
                    {currentUser?.username
                      ? `@${currentUser.username}`
                      : currentUser?.email
                      ? `@${currentUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '')}`
                      : ''}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Nav groups */}
          <div className="space-y-4 flex-1">
            {groups.map((group) => {
              const items = navSections.filter((s) => s.group === group.key);
              return (
                <div key={group.key} className="space-y-0.5">
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2.5 py-1">
                    {group.label}
                  </div>
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveSection(item.id)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left',
                        activeSection === item.id
                          ? 'bg-sidebar-accent text-foreground font-bold shadow-2xs'
                          : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground',
                      )}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Divider + Logout */}
          <div className="pt-4 border-t border-sidebar-border mt-auto">
            {currentUser ? (
              <button
                type="button"
                onClick={() => { onOpenChange(false); onLogout(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('Keluar Akun')}</span>
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
            )}
          </div>
        </div>

        {/* ── Right Content ── */}
        <div className="flex-1 flex flex-col min-w-0 bg-background relative overflow-hidden">
          {/* Signature Discord ESC Close button (SINGLE button, top right) */}
          <div className="absolute top-5 right-6 z-20">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex flex-col items-center gap-1 group cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
              title={t('Tutup (ESC)')}
            >
              <div className="size-8 rounded-full border border-border group-hover:border-foreground flex items-center justify-center transition-colors bg-card shadow-2xs">
                <X className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-[9px] font-bold tracking-wider uppercase opacity-75 group-hover:opacity-100">ESC</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-7 [scrollbar-width:thin] space-y-6 max-w-3xl">

            {/* ── ACCOUNT ── */}
            {activeSection === 'account' && (
              <>
                <h2 className="text-lg font-bold text-foreground border-b border-border pb-3">{t('Akun')}</h2>

                {!currentUser ? (
                  <div className="p-6 rounded-xl border border-border bg-card text-center space-y-4">
                    <div className="mx-auto size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <AtSign className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{t('Masuk ke Anticeil')}</h4>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                        {t('Masuk menggunakan akun Google Anda untuk mengobrol, bergabung ke server, dan berkolaborasi.')}
                      </p>
                    </div>
                    <Button type="button" onClick={onGoogleSignIn} className="w-full sm:w-auto px-6 gap-2 text-xs font-semibold cursor-pointer shadow-xs">
                      {t('Masuk dengan Google')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Profile header card */}
                    <div className="rounded-xl overflow-hidden border border-border bg-card shadow-xs">
                      <div className="h-20 bg-gradient-to-r from-primary via-primary/80 to-secondary" />
                      <div className="px-5 pb-5 pt-0 relative">
                        <div className="flex items-end gap-3 -mt-10 mb-3">
                          <CommunityAvatar
                            name={currentUserName}
                            email={currentUser?.email}
                            imageUrl={currentUser?.imageUrl}
                            size={72}
                            showStatus={false}
                            className="shrink-0 ring-[6px] ring-card rounded-full shadow-lg bg-card"
                          />
                        </div>
                        <div>
                          <div className="text-base font-bold text-foreground">{currentUserName}</div>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">
                            {currentUser?.username ? `@${currentUser.username}` : currentUser?.email || ''}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Display Name */}
                    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('Nama Tampilan (Display Name)')}</div>
                          <div className="text-sm font-semibold text-foreground mt-0.5">{currentUserName}</div>
                        </div>
                        <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">{t('Bebas Diubah')}</span>
                      </div>
                      <form onSubmit={handleDisplayNameSubmit} className="flex gap-2">
                        <Input
                          value={editDisplayNameInput}
                          onChange={(e) => setEditDisplayNameInput(e.target.value)}
                          placeholder={t('Nama Lengkap Anda')}
                          maxLength={100}
                          className="text-xs h-9 bg-input border-border text-foreground"
                        />
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isSavingDisplayName || !editDisplayNameInput.trim() || editDisplayNameInput.trim() === currentUserName}
                          className="shrink-0 h-9 text-xs cursor-pointer font-bold shadow-xs"
                        >
                          {isSavingDisplayName ? t('Menyimpan...') : t('Simpan')}
                        </Button>
                      </form>
                    </div>

                    {/* Username */}
                    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('Username Unik')}</div>
                          <div className="text-sm font-semibold text-foreground mt-0.5 font-mono flex items-center gap-2">
                            {currentUser?.username ? (
                              <>
                                <span className="text-primary font-bold">@{currentUser.username}</span>
                                <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">{t('Aktif')}</span>
                              </>
                            ) : (
                              <span className="text-amber-500 font-semibold flex items-center gap-1.5 text-xs">
                                <span>{t('Belum disimpan')}</span>
                                <span className="text-[10px] text-muted-foreground font-normal">({t('Gunakan saran & tekan Simpan')})</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-amber-500 font-semibold bg-amber-500/10 px-2 py-0.5 rounded">{t('Cooldown 14 Hari')}</span>
                      </div>
                      <form onSubmit={handleUsernameSubmit} className="space-y-2">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">@</span>
                          <Input
                            value={editUsernameInput}
                            onChange={(e) => setEditUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            placeholder="username_anda"
                            disabled={isUsernameCooldownActive}
                            maxLength={32}
                            className="pl-7 text-xs font-mono h-9 bg-input border-border text-foreground"
                          />
                        </div>
                        {isUsernameCooldownActive ? (
                          <div className="flex items-center gap-1.5 text-amber-500 text-xs">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>{t('Dapat diubah pada:')} <strong>{dayjs(usernameCooldownEnd).format('DD MMM YYYY, HH:mm')}</strong></span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">{t('3-32 karakter: huruf kecil, angka, underscore (_).')}</span>
                            <Button
                              type="submit"
                              size="sm"
                              disabled={isUsernameCooldownActive || isSavingUsername || !editUsernameInput.trim() || editUsernameInput.trim() === currentUser?.username}
                              className="h-8 text-xs cursor-pointer font-bold shadow-xs"
                            >
                              {isSavingUsername ? t('Menyimpan...') : t('Simpan Username')}
                            </Button>
                          </div>
                        )}
                      </form>
                    </div>

                    {/* Email / Auth status */}
                    <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                          <UserCheck className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-foreground truncate">{currentUser?.email || t('Akun Anticeil')}</div>
                          <div className="text-[10px] text-muted-foreground">{t('Sesi login terautentikasi dan tersinkronisasi')}</div>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {t('Aktif')}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── APPEARANCE ── */}
            {activeSection === 'appearance' && (
              <>
                <h2 className="text-lg font-bold text-foreground border-b border-border pb-3">{t('Tampilan')}</h2>
                <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('Tema')}</div>
                    <p className="text-xs text-muted-foreground">{t('Pilih tema tampilan favorit Anda.')}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { key: 'dark', icon: <Moon className="w-5 h-5 text-purple-400" />, label: 'Dark Mode (AMOLED)', bg: 'bg-black' },
                      { key: 'midnight', icon: <Sparkles className="w-5 h-5 text-sky-400" />, label: 'Midnight', bg: 'bg-[#313338]' },
                      { key: 'light', icon: <Sun className="w-5 h-5 text-amber-500" />, label: 'Light Mode', bg: 'bg-white' },
                    ].map(({ key, icon, label, bg }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setTheme(key)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-3.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer',
                          theme === key
                            ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/30 shadow-xs'
                            : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
                        )}
                      >
                        <div className={cn('w-9 h-9 rounded-full border border-border flex items-center justify-center shadow-2xs', bg)}>
                          {icon}
                        </div>
                        <span>{label}</span>
                        {theme === key && (
                          <span className="text-[9px] text-primary font-bold uppercase tracking-wide">Aktif</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── VOICE ── */}
            {activeSection === 'voice' && (
              <>
                <h2 className="text-lg font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
                  <Mic className="w-5 h-5 text-primary" />
                  Voice Settings
                </h2>

                {/* Device dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Microphone</label>
                    <select
                      value={settings.inputDeviceId}
                      onChange={(e) => updateSetting('inputDeviceId', e.target.value)}
                      className="w-full h-10 px-3 bg-input border border-border rounded-lg text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
                    >
                      <option value="default">Windows Default (Realtek Audio)</option>
                      {audioInputDevices.map((d, i) => (
                        <option key={d.deviceId || i} value={d.deviceId}>{d.label || `Microphone ${i + 1}`}</option>
                      ))}
                    </select>
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Microphone Volume</span>
                        <span className="font-mono">{settings.inputVolume}%</span>
                      </div>
                      <input type="range" min="0" max="100" value={settings.inputVolume}
                        onChange={(e) => updateSetting('inputVolume', Number(e.target.value))}
                        className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Speaker</label>
                    <select
                      value={settings.outputDeviceId}
                      onChange={(e) => updateSetting('outputDeviceId', e.target.value)}
                      className="w-full h-10 px-3 bg-input border border-border rounded-lg text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
                    >
                      <option value="default">Windows Default (Realtek Audio)</option>
                      {audioOutputDevices.map((d, i) => (
                        <option key={d.deviceId || i} value={d.deviceId}>{d.label || `Speaker ${i + 1}`}</option>
                      ))}
                    </select>
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Speaker Volume</span>
                        <span className="font-mono">{settings.outputVolume}%</span>
                      </div>
                      <input type="range" min="0" max="100" value={settings.outputVolume}
                        onChange={(e) => updateSetting('outputVolume', Number(e.target.value))}
                        className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Mic Test */}
                <div className="p-4 bg-card rounded-xl border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Mic Test</h4>
                      <p className="text-[11px] text-muted-foreground">Having mic issues? Test your microphone directly in real-time.</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={isMicTesting ? stopMicTest : startMicTest}
                      className={cn('font-bold text-xs h-8 px-4 cursor-pointer', isMicTesting ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : 'shadow-xs')}
                    >
                      {isMicTesting ? 'Stop Testing' : 'Mic Test'}
                    </Button>
                  </div>
                  <div className="flex items-center gap-1 h-3.5 bg-muted p-1 rounded-md border border-border overflow-hidden">
                    {Array.from({ length: 48 }).map((_, idx) => {
                      const threshold = (idx / 48) * 100;
                      const isLit = isMicTesting && micVolumeLevel >= threshold;
                      return (
                        <div key={idx} className={cn('flex-1 h-full rounded-xs transition-colors duration-75',
                          isLit ? idx > 36 ? 'bg-rose-500' : idx > 24 ? 'bg-amber-400' : 'bg-emerald-500' : 'bg-muted-foreground/20'
                        )} />
                      );
                    })}
                  </div>
                </div>

                {/* Input Profile */}
                <div className="space-y-3">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Input Profile</label>
                  <div className="space-y-2">
                    {[
                      { key: 'voice-isolation', title: 'Voice Isolation', desc: 'Just your beautiful voice: let Anticeil cut through background noise.' },
                      { key: 'studio', title: 'Studio', desc: 'Pure audio: open mic with lossless processing for podcasts & instruments.' },
                      { key: 'custom', title: 'Custom', desc: 'Advanced mode: give me all the sliders, sensitivity dials, and toggles.' },
                    ].map(({ key, title, desc }) => (
                      <div
                        key={key}
                        onClick={() => updateSetting('inputProfile', key as any)}
                        className={cn(
                          'p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between',
                          settings.inputProfile === key ? 'bg-primary/10 border-primary ring-1 ring-primary/40' : 'bg-card border-border hover:border-border/80',
                        )}
                      >
                        <div>
                          <div className="text-xs font-bold text-foreground">{title}</div>
                          <div className="text-[11px] text-muted-foreground">{desc}</div>
                        </div>
                        <div className={cn('size-4 rounded-full border flex items-center justify-center shrink-0 ml-3 mt-0.5',
                          settings.inputProfile === key ? 'border-primary bg-primary' : 'border-muted-foreground/40')}>
                          {settings.inputProfile === key && <div className="size-1.5 rounded-full bg-primary-foreground" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Advanced */}
                <div className="p-4 rounded-xl border border-border bg-card space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Noise Suppression</h4>
                      <p className="text-[11px] text-muted-foreground">Reduces background noise. Powered by Krisp Engine.</p>
                    </div>
                    <select
                      value={settings.noiseSuppression}
                      onChange={(e) => updateSetting('noiseSuppression', e.target.value as NoiseSuppressionType)}
                      className="h-8 px-2.5 bg-input border border-border rounded-lg text-xs font-semibold text-foreground focus:border-primary focus:outline-none cursor-pointer"
                    >
                      <option value="krisp">Krisp (AI Isolation)</option>
                      <option value="standard">Standard</option>
                      <option value="none">Off</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Echo Cancellation</h4>
                      <p className="text-[11px] text-muted-foreground">Prevents speaker audio feedback loops.</p>
                    </div>
                    <Switch checked={settings.echoCancellation} onCheckedChange={(val) => updateSetting('echoCancellation', val)} />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Push to Talk</h4>
                      <p className="text-[11px] text-muted-foreground">Hold a key to transmit your voice instead of automatic voice activation.</p>
                    </div>
                    <Switch checked={settings.pushToTalk} onCheckedChange={(val) => updateSetting('pushToTalk', val)} />
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground/60">WebRTC Audio/Video Engine • Anticeil Native</div>
              </>
            )}

            {/* ── CAMERA ── */}
            {activeSection === 'camera' && (
              <>
                <h2 className="text-lg font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  Camera Settings
                </h2>
                <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Camera Device</label>
                  <select
                    value={settings.cameraDeviceId}
                    onChange={(e) => updateSetting('cameraDeviceId', e.target.value)}
                    className="w-full h-10 px-3 bg-input border border-border rounded-lg text-xs text-foreground focus:border-primary focus:outline-none cursor-pointer"
                  >
                    <option value="default">Default Web Camera</option>
                    {videoInputDevices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>{d.label || `Camera ${i + 1}`}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
