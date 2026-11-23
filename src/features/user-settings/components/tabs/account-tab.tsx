import React, { useState, useEffect, useMemo } from 'react';
import {
  User, Check, ChevronLeft, ShieldCheck, ShieldAlert,
  Smartphone, Key, Ban, ExternalLink, Pencil, Search,
  Lock, Trash2, Globe, Clock, Shield, ChevronRight, Laptop, Info, X, UserCheck, CheckCircle2, Users,
  Loader2, AlertTriangle, QrCode, Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import { AccountStandingView } from './account/account-standing-view';
import { AccountSecuritySection } from './account/account-security-section';
import { AccountDevicesView } from './account/account-devices-view';
import { AccountTwoFactorModal } from './account/account-two-factor-modal';
import { securityApi } from '../../api/security-api';
import { profileApi } from '@/features/profile/api/profile-api';

export interface AccountTabProps {
  currentUser: any;
  currentUserName: string;
  onSaveDisplayName: (name: string) => Promise<void> | void;
  isSavingDisplayName?: boolean;
  onSaveUsername: (username: string) => Promise<void> | void;
  isSavingUsername?: boolean;
  onNavigateSection?: (section: string) => void;
  onOpenEditProfile?: () => void;
  open?: boolean;
  onLogout?: () => void;
}

export function AccountTab({
  currentUser,
  currentUserName,
  onSaveDisplayName,
  isSavingDisplayName = false,
  onSaveUsername,
  isSavingUsername = false,
  onNavigateSection,
  onOpenEditProfile,
  open = true,
  onLogout,
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

  // Security & 2FA state
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionCount, setSessionCount] = useState(1);

  // Email update state
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [emailPasswordInput, setEmailPasswordInput] = useState('');

  // Account removal & disable state
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [isDisablingAccount, setIsDisablingAccount] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletePasswordInput, setDeletePasswordInput] = useState('');

  const loadSecurityData = React.useCallback(async () => {
    try {
      const [sessions, tfa] = await Promise.all([
        securityApi.getSessions(),
        securityApi.getTwoFactorStatus(),
      ]);
      if (Array.isArray(sessions)) {
        setSessionCount(sessions.length);
      }
      if (tfa) {
        setTwoFactorEnabled(Boolean(tfa.isEnabled));
      }
    } catch (err) {
      console.error('Failed to load security status:', err);
    }
  }, []);


  // Account name & username state
  const suggestedUsername = useMemo(() => {
    if (currentUser?.username) return currentUser.username;
    if (currentUser?.email) {
      return (
        currentUser.email
          .split('@')[0]
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '')
          .slice(0, 32) || ''
      );
    }
    return '';
  }, [currentUser?.username, currentUser?.email]);

  const [editDisplayNameInput, setEditDisplayNameInput] = useState(currentUserName);
  const [editUsernameInput, setEditUsernameInput] = useState(suggestedUsername);
  const [editEmailInput, setEditEmailInput] = useState(currentUser?.email || '');
  const [editPhoneInput, setEditPhoneInput] = useState('');
  const [isSavingPhone, setIsSavingPhone] = useState(false);

  // Family Center state
  const [showFamilyCenterDialog, setShowFamilyCenterDialog] = useState(false);
  const [familyRole, setFamilyRole] = useState<'parent' | 'teen'>('parent');
  const [familyPairCodeInput, setFamilyPairCodeInput] = useState('');
  const [familyInviteUsername, setFamilyInviteUsername] = useState('');
  const [familyConnections, setFamilyConnections] = useState<Array<{ name: string; role: string; pairedAt: string }>>(() => {
    try {
      const stored = localStorage.getItem('anticeil_family_connections');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (open) {
      setEditDisplayNameInput(currentUserName);
      setEditUsernameInput(suggestedUsername);
      setEditEmailInput(currentUser?.email || '');
      loadSecurityData();

      // Load phone from user profile
      profileApi.getProfile().then((prof) => {
        if (prof?.phoneNumber) {
          setEditPhoneInput(prof.phoneNumber);
        } else if (currentUser?.phoneNumber) {
          setEditPhoneInput(currentUser.phoneNumber);
        } else {
          setEditPhoneInput('');
        }
      }).catch(() => {});
    }
  }, [open, currentUserName, suggestedUsername, currentUser?.email, currentUser?.phoneNumber, loadSecurityData]);

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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = editEmailInput.trim();
    if (!clean || clean === currentUser?.email) {
      setIsEditingEmail(false);
      return;
    }
    setIsSavingEmail(true);
    try {
      const res = await securityApi.updateEmail({
        email: clean,
        password: emailPasswordInput || undefined,
      });
      if (currentUser) {
        currentUser.email = res.email || clean;
      }
      toast.success(t('Email akun berhasil diperbarui!'));
      setIsEditingEmail(false);
      setEmailPasswordInput('');
    } catch (err: any) {
      toast.error(err?.message || t('Gagal memperbarui email'));
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleDisableAccount = async () => {
    setIsDisablingAccount(true);
    try {
      await securityApi.disableAccount();
      toast.success(t('Akun Anda telah dinonaktifkan sementara.'));
      setShowDisableDialog(false);
      onLogout?.();
    } catch (err: any) {
      toast.error(err?.message || t('Gagal menonaktifkan akun'));
    } finally {
      setIsDisablingAccount(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await securityApi.deleteAccount(deletePasswordInput || undefined);
      toast.success(t('Akun Anticeil Anda berhasil dihapus secara permanen.'));
      setShowDeleteDialog(false);
      onLogout?.();
    } catch (err: any) {
      toast.error(err?.message || t('Gagal menghapus akun'));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Masked helpers
  const maskedEmail = useMemo(() => {
    const email = currentUser?.email;
    if (!email) return 'Belum ditambahkan';
    const [name, domain] = email.split('@');
    if (!domain) return email;
    const visibleChars = Math.min(2, name.length);
    const maskedName = name.slice(0, visibleChars) + '••••••••••';
    return `${maskedName}@${domain}`;
  }, [currentUser?.email]);

  const maskedPhone = useMemo(() => {
    if (!editPhoneInput) return '';
    const clean = editPhoneInput.trim();
    if (clean.length <= 4) return clean;
    return `••••••••••••${clean.slice(-4)}`;
  }, [editPhoneInput]);

  const handleSavePhone = async () => {
    setIsSavingPhone(true);
    try {
      const clean = editPhoneInput.trim();
      await profileApi.updateProfile({ phoneNumber: clean });
      toast.success(
        clean ? t('Nomor telepon berhasil diperbarui!') : t('Nomor telepon berhasil dihapus!'),
      );
      setIsEditingPhone(false);
    } catch (err: any) {
      toast.error(err?.message || t('Gagal memperbarui nomor telepon'));
    } finally {
      setIsSavingPhone(false);
    }
  };



  return (
          <>
            {/* SUBVIEW: ACCOUNT STANDING */}
            {accountSubView === 'standing' ? (
              <AccountStandingView
                currentUserName={currentUserName}
                currentUser={currentUser}
                onBack={() => setAccountSubView('main')}
              />
            ) : accountSubView === 'devices' ? (
              <AccountDevicesView
                onBack={() => {
                  setAccountSubView('main');
                  loadSecurityData();
                }}
              />
            ) : (
              /* MAIN ACCOUNT VIEW */
              <div className="space-y-6">
                {/* 1. Account Info Section */}
                <div id="account-info" className="space-y-3 scroll-mt-4">
                  <h3 className="text-sm font-bold text-foreground">
                    {t('Account Info')}
                  </h3>

                  <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                    {/* Display Name row */}
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          {t('Display Name')}
                        </div>
                        <div className="text-xs font-semibold text-foreground mt-0.5">
                          {currentUserName}
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setIsEditingDisplayName(!isEditingDisplayName)}
                        className="h-8 text-xs font-semibold px-3.5 cursor-pointer"
                      >
                        {isEditingDisplayName ? t('Batal') : t('Edit')}
                      </Button>
                    </div>

                    {isEditingDisplayName && (
                      <form onSubmit={handleDisplayNameSubmit} className="p-4 bg-muted/20 space-y-3">
                        <Input
                          value={editDisplayNameInput}
                          onChange={(e) => setEditDisplayNameInput(e.target.value)}
                          placeholder={t('Nama Lengkap')}
                          className="text-xs h-9 bg-input border-border text-foreground"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => setIsEditingDisplayName(false)}
                            className="h-8 text-xs font-semibold"
                          >
                            {t('Batal')}
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={
                              isSavingDisplayName ||
                              !editDisplayNameInput.trim() ||
                              editDisplayNameInput.trim() === currentUserName
                            }
                            className="h-8 text-xs font-bold bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground"
                          >
                            {isSavingDisplayName ? t('Menyimpan...') : t('Simpan')}
                          </Button>
                        </div>
                      </form>
                    )}
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
                            variant="teal"
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
                          <span>{isEmailRevealed ? currentUser?.email || 'Belum ditambahkan' : maskedEmail}</span>
                          {currentUser?.email && (
                            <button
                              type="button"
                              onClick={() => setIsEmailRevealed(!isEmailRevealed)}
                              className="text-primary hover:underline text-[11px] font-semibold cursor-pointer"
                            >
                              {isEmailRevealed ? t('Hide') : t('Reveal')}
                            </button>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setIsEditingEmail(!isEditingEmail);
                          setEditEmailInput(currentUser?.email || '');
                          setEmailPasswordInput('');
                        }}
                        className="h-8 text-xs font-semibold px-3.5 cursor-pointer"
                      >
                        {isEditingEmail ? t('Batal') : t('Edit')}
                      </Button>
                    </div>

                    {isEditingEmail && (
                      <form onSubmit={handleEmailSubmit} className="p-4 bg-muted/20 space-y-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            {t('Email Baru')}
                          </label>
                          <Input
                            type="email"
                            value={editEmailInput}
                            onChange={(e) => setEditEmailInput(e.target.value)}
                            placeholder="nama@email.com"
                            className="text-xs h-9 bg-input border-border text-foreground"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            {t('Password Akun (Konfirmasi)')}
                          </label>
                          <Input
                            type="password"
                            value={emailPasswordInput}
                            onChange={(e) => setEmailPasswordInput(e.target.value)}
                            placeholder={t('Masukkan password akun Anda')}
                            className="text-xs h-9 bg-input border-border text-foreground"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={isSavingEmail}
                            onClick={() => setIsEditingEmail(false)}
                            className="h-8 text-xs font-semibold"
                          >
                            {t('Batal')}
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={
                              isSavingEmail ||
                              !editEmailInput.trim() ||
                              editEmailInput.trim() === currentUser?.email
                            }
                            className="h-8 text-xs font-bold bg-[#5865F2] hover:bg-[#4752C4] text-white cursor-pointer"
                          >
                            {isSavingEmail ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                {t('Menyimpan...')}
                              </>
                            ) : (
                              t('Simpan Email')
                            )}
                          </Button>
                        </div>
                      </form>
                    )}

                    {/* Phone Number row */}
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          {t('Phone Number')}
                        </div>
                        <div className="text-xs font-mono text-foreground mt-0.5 flex items-center gap-2">
                          <span>
                            {editPhoneInput
                              ? isPhoneRevealed
                                ? editPhoneInput
                                : maskedPhone
                              : t('Belum ditambahkan')}
                          </span>
                          {editPhoneInput && (
                            <button
                              type="button"
                              onClick={() => setIsPhoneRevealed(!isPhoneRevealed)}
                              className="text-primary hover:underline text-[11px] font-semibold cursor-pointer"
                            >
                              {isPhoneRevealed ? t('Hide') : t('Reveal')}
                            </button>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setIsEditingPhone(!isEditingPhone)}
                        className="h-8 text-xs font-semibold px-3.5 cursor-pointer"
                      >
                        {isEditingPhone ? t('Batal') : editPhoneInput ? t('Edit') : t('Tambah')}
                      </Button>
                    </div>

                    {isEditingPhone && (
                      <div className="p-4 bg-muted/20 space-y-2">
                        <Input
                          value={editPhoneInput}
                          onChange={(e) => setEditPhoneInput(e.target.value)}
                          placeholder="+62 812-xxxx-xxxx"
                          className="text-xs h-9 bg-input border-border text-foreground font-mono"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            disabled={isSavingPhone}
                            onClick={handleSavePhone}
                            className="h-8 text-xs font-bold bg-[#5865F2] hover:bg-[#4752C4] text-white cursor-pointer"
                          >
                            {isSavingPhone ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                {t('Menyimpan...')}
                              </>
                            ) : (
                              t('Simpan Nomor')
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Password & Security Section */}
                <AccountSecuritySection
                  onOpenDevices={() => setAccountSubView('devices')}
                  onOpen2FA={() => setIs2FAModalOpen(true)}
                  twoFactorEnabled={twoFactorEnabled}
                  sessionCount={sessionCount}
                />

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

                  <div
                    onClick={() => onNavigateSection?.('account-family')}
                    className="rounded-xl border border-border bg-card p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer group shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-primary" />
                      <div>
                        <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                          <span>{t('Set up Family Center')}</span>
                          {familyConnections.length > 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold rounded-full">
                              {familyConnections.length} {t('Terhubung')}
                            </span>
                          )}
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
                        onClick={() => setShowDisableDialog(true)}
                        className="h-8 text-xs font-semibold border border-border/80 cursor-pointer"
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
                          setDeletePasswordInput('');
                          setShowDeleteDialog(true);
                        }}
                        className="h-8 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-xs cursor-pointer"
                      >
                        {t('Delete Account')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Disable Account Confirmation Dialog */}
            <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
              <DialogContent size="sm" className="bg-card border-border text-foreground">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold text-foreground">
                    {t('Nonaktifkan Akun Anda?')}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {t(
                      'Akun Anda akan dinonaktifkan sementara. Teman tidak dapat menghubungi Anda dan Anda akan dikeluarkan dari sesi saat ini. Anda dapat mengaktifkannya kembali sewaktu-waktu dengan login ulang.',
                    )}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isDisablingAccount}
                    onClick={() => setShowDisableDialog(false)}
                    className="h-9 text-xs font-semibold"
                  >
                    {t('Batal')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isDisablingAccount}
                    onClick={handleDisableAccount}
                    className="h-9 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white cursor-pointer"
                  >
                    {isDisablingAccount ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        {t('Menonaktifkan...')}
                      </>
                    ) : (
                      t('Nonaktifkan Akun')
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Permanent Delete Account Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogContent size="sm" className="bg-card border-destructive/30 text-foreground">
                <DialogHeader>
                  <div className="flex items-center gap-2 text-destructive mb-1">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <DialogTitle className="text-base font-bold text-destructive">
                      {t('Hapus Akun Secara Permanen?')}
                    </DialogTitle>
                  </div>
                  <DialogDescription className="text-xs text-muted-foreground leading-relaxed space-y-2">
                    <p>
                      {t(
                        'Tindakan ini bersifat PERMANEN dan tidak dapat dibatalkan. Seluruh riwayat pesan, servers/colony, profil, dan data terkait akan dihapus secara menyeluruh dari sistem.',
                      )}
                    </p>
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 my-2">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    {t('Konfirmasi Password Akun')}
                  </label>
                  <Input
                    type="password"
                    value={deletePasswordInput}
                    onChange={(e) => setDeletePasswordInput(e.target.value)}
                    placeholder={t('Ketik password Anda untuk konfirmasi')}
                    className="text-xs h-9 bg-input border-border text-foreground"
                    autoComplete="current-password"
                  />
                </div>

                <DialogFooter className="mt-4 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isDeletingAccount}
                    onClick={() => setShowDeleteDialog(false)}
                    className="h-9 text-xs font-semibold"
                  >
                    {t('Batal')}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isDeletingAccount}
                    onClick={handleDeleteAccount}
                    className="h-9 text-xs font-bold bg-red-600 hover:bg-red-500 text-white cursor-pointer shadow-xs"
                  >
                    {isDeletingAccount ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        {t('Menghapus...')}
                      </>
                    ) : (
                      t('Hapus Akun Permanen')
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Family Center Setup Dialog */}
            <Dialog open={showFamilyCenterDialog} onOpenChange={setShowFamilyCenterDialog}>
              <DialogContent size="md" className="bg-card border-border text-foreground shadow-2xl p-6">
                <DialogHeader className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-base font-bold text-foreground">
                        {t('Family Center')}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground">
                        {t('Pusat kontrol & keamanan keluarga untuk menghubungkan orang tua dan remaja.')}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                {/* Role Switcher */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/40 rounded-lg text-xs font-semibold mt-1">
                  <button
                    type="button"
                    onClick={() => setFamilyRole('parent')}
                    className={cn(
                      'py-1.5 rounded-md transition-colors cursor-pointer text-center',
                      familyRole === 'parent'
                        ? 'bg-card text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {t('Saya Orang Tua')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFamilyRole('teen')}
                    className={cn(
                      'py-1.5 rounded-md transition-colors cursor-pointer text-center',
                      familyRole === 'teen'
                        ? 'bg-card text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {t('Saya Remaja')}
                  </button>
                </div>

                {familyRole === 'parent' ? (
                  <div className="space-y-4 pt-2">
                    <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">
                          {t('Kode Pairing Keluarga')}
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">
                          ATC-884920
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {t('Minta anak remaja Anda untuk memasukkan kode ini di akun Anticeil mereka, atau bagikan tautan cepat.')}
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          navigator.clipboard.writeText('https://anticeil.com/family-pair?code=ATC-884920');
                          toast.success(t('Tautan pairing keluarga disalin ke clipboard!'));
                        }}
                        className="w-full text-xs h-8 gap-2 font-semibold"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {t('Salin Tautan Pairing')}
                      </Button>
                    </div>

                    {/* Invite by Username */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        {t('Undang via Username Remaja')}
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={familyInviteUsername}
                          onChange={(e) => setFamilyInviteUsername(e.target.value)}
                          placeholder="@username_anak"
                          className="h-8 text-xs bg-input border-border"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            const clean = familyInviteUsername.trim();
                            if (!clean) {
                              toast.error(t('Masukkan username terlebih dahulu'));
                              return;
                            }
                            const next = [...familyConnections, { name: clean, role: 'teen', pairedAt: new Date().toLocaleDateString() }];
                            setFamilyConnections(next);
                            localStorage.setItem('anticeil_family_connections', JSON.stringify(next));
                            setFamilyInviteUsername('');
                            toast.success(t(`Undangan Family Center dikirim ke ${clean}!`));
                          }}
                          className="h-8 text-xs font-bold bg-[#5865F2] hover:bg-[#4752C4] text-white shrink-0"
                        >
                          {t('Kirim')}
                        </Button>
                      </div>
                    </div>

                    {/* Connected accounts list */}
                    {familyConnections.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-xs font-semibold text-foreground">
                          {t('Anggota Keluarga Terhubung')}
                        </span>
                        <div className="divide-y divide-border/50 border border-border/80 rounded-xl bg-card overflow-hidden">
                          {familyConnections.map((conn, idx) => (
                            <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-semibold text-foreground">{conn.name}</span>
                                <span className="text-[10px] text-muted-foreground ml-2">
                                  {conn.role === 'teen' ? t('Remaja') : t('Orang Tua')} • {conn.pairedAt}
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const filtered = familyConnections.filter((_, i) => i !== idx);
                                  setFamilyConnections(filtered);
                                  localStorage.setItem('anticeil_family_connections', JSON.stringify(filtered));
                                  toast.info(t(`Hubungan keluarga dengan ${conn.name} telah diputus.`));
                                }}
                                className="h-6 text-[10px] text-destructive hover:bg-destructive/10 px-2 font-semibold"
                              >
                                {t('Putus')}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 pt-2">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t('Menghubungkan akun ke orang tua Anda memungkinkan mereka melihat ringkasan aktivitas dan colony yang Anda ikuti. Orang tua Anda tidak dapat membaca pesan pribadi atau mendengarkan panggilan suara Anda.')}
                    </p>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        {t('Masukkan Kode Pairing dari Orang Tua')}
                      </label>
                      <Input
                        value={familyPairCodeInput}
                        onChange={(e) => setFamilyPairCodeInput(e.target.value.toUpperCase())}
                        placeholder="e.g. ATC-884920"
                        className="h-9 text-xs font-mono tracking-wider bg-input border-border"
                      />
                    </div>
                    <Button
                      type="button"
                      disabled={!familyPairCodeInput.trim()}
                      onClick={() => {
                        const code = familyPairCodeInput.trim();
                        if (code.length < 5) {
                          toast.error(t('Kode pairing tidak valid'));
                          return;
                        }
                        const next = [...familyConnections, { name: 'Parent (' + code + ')', role: 'parent', pairedAt: new Date().toLocaleDateString() }];
                        setFamilyConnections(next);
                        localStorage.setItem('anticeil_family_connections', JSON.stringify(next));
                        setFamilyPairCodeInput('');
                        toast.success(t('Akun berhasil dihubungkan ke Family Center Orang Tua!'));
                        setShowFamilyCenterDialog(false);
                      }}
                      className="w-full h-9 text-xs font-bold bg-[#5865F2] hover:bg-[#4752C4] text-white cursor-pointer"
                    >
                      {t('Hubungkan Sekarang')}
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* 2FA Authenticator Modal */}
            <AccountTwoFactorModal
              open={is2FAModalOpen}
              onOpenChange={(val) => {
                setIs2FAModalOpen(val);
                if (!val) loadSecurityData();
              }}
              userEmail={currentUser?.email}
            />
          </>

  );
}
