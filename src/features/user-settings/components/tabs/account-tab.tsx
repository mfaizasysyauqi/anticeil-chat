import React, { useState, useEffect, useMemo } from 'react';
import {
  User, Check, ChevronLeft, ShieldCheck, ShieldAlert,
  Smartphone, Key, Ban, ExternalLink, Pencil, Search,
  Lock, Trash2, Globe, Clock, Shield, ChevronRight, Laptop, Info, X, UserCheck, CheckCircle2, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import { AccountStandingView } from './account/account-standing-view';
import { AccountSecuritySection } from './account/account-security-section';

export interface AccountTabProps {
  currentUser: any;
  currentUserName: string;
  onSaveDisplayName: (name: string) => Promise<void> | void;
  isSavingDisplayName?: boolean;
  onSaveUsername: (username: string) => Promise<void> | void;
  isSavingUsername?: boolean;
  onNavigateSection?: (section: string) => void;
  open?: boolean;
}

export function AccountTab({
  currentUser,
  currentUserName,
  onSaveDisplayName,
  isSavingDisplayName = false,
  onSaveUsername,
  isSavingUsername = false,
  onNavigateSection,
  open = true,
}: AccountTabProps) {
  const { t } = useTranslation();
  const [accountSubView, setAccountSubView] = useState<'main' | 'standing' | 'devices'>('main');

  // Reveal toggles for sensitive account info
  const [isEmailRevealed, setIsEmailRevealed] = useState(false);
  const [isPhoneRevealed, setIsPhoneRevealed] = useState(false);
  const [isAgeNoticeDismissed, setIsAgeNoticeDismissed] = useState(false);

  // Edit modals/dialogs state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);


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



  return (
          <>
            {/* SUBVIEW: ACCOUNT STANDING */}
            {accountSubView === 'standing' ? (
              <AccountStandingView
                currentUserName={currentUserName}
                currentUser={currentUser}
                onBack={() => setAccountSubView('main')}
              />
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

                {/* 2. Password & Security Section */}
                <AccountSecuritySection />

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

  );
}
