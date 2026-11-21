import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Shield,
  Eye,
  QrCode,
  UserPlus,
  Server,
  MessageSquare,
  Phone,
  CreditCard,
  Gift,
  Flag,
  Clock,
  Coins,
  Settings,
  Plus,
  Copy,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';

export interface FamilyMemberItem {
  id: string;
  name: string;
  role: 'teen' | 'guardian';
  pairedAt: string;
}

export interface FamilyCenterTabProps {
  onBack?: () => void;
}

const STORAGE_KEY_FAMILY = 'anticeil_family_connections';
const STORAGE_KEY_FAMILY_ENABLED = 'anticeil_family_tab_enabled';
const STORAGE_KEY_FAMILY_EMAILS = 'anticeil_family_emails_enabled';

export function FamilyCenterTab({ onBack }: FamilyCenterTabProps) {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<'activity' | 'family' | 'settings'>('activity');

  // Persistence for family members
  const [connectedTeens, setConnectedTeens] = useState<FamilyMemberItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FAMILY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Settings state
  const [enableFamilyTab, setEnableFamilyTab] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_FAMILY_ENABLED) !== 'false';
  });
  const [receiveSummaryEmails, setReceiveSummaryEmails] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_FAMILY_EMAILS) !== 'false';
  });

  // Dialogs
  const [showQrModal, setShowQrModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [teenInput, setTeenInput] = useState('');
  const [isCopiedCode, setIsCopiedCode] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FAMILY, JSON.stringify(connectedTeens));
    } catch {}
  }, [connectedTeens]);

  const handleToggleFamilyTab = (val: boolean) => {
    setEnableFamilyTab(val);
    localStorage.setItem(STORAGE_KEY_FAMILY_ENABLED, String(val));
    toast.success(val ? t('Family Center diaktifkan') : t('Family Center dinonaktifkan'));
  };

  const handleToggleEmails = (val: boolean) => {
    setReceiveSummaryEmails(val);
    localStorage.setItem(STORAGE_KEY_FAMILY_EMAILS, String(val));
    toast.success(val ? t('Email ringkasan aktivitas diaktifkan') : t('Email ringkasan aktivitas dinonaktifkan'));
  };

  const handleConnectTeen = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = teenInput.trim();
    if (!clean) return;
    if (connectedTeens.length >= 8) {
      toast.error(t('Batas maksimal 8 remaja terhubung telah tercapai.'));
      return;
    }
    const newMember: FamilyMemberItem = {
      id: `teen_${Date.now()}`,
      name: clean.startsWith('@') ? clean : `@${clean}`,
      role: 'teen',
      pairedAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
    };
    setConnectedTeens((prev) => [...prev, newMember]);
    setTeenInput('');
    setShowConnectModal(false);
    toast.success(t('Permintaan koneksi dikirim ke {{name}}!', { name: clean }));
  };

  const handleDisconnectTeen = (id: string) => {
    setConnectedTeens((prev) => prev.filter((t) => t.id !== id));
    toast.success(t('Koneksi remaja berhasil diputuskan'));
  };

  const handleCopyPairingCode = () => {
    navigator.clipboard?.writeText('ATC-884920');
    setIsCopiedCode(true);
    toast.success(t('Kode pairing keluarga disalin ke clipboard!'));
    setTimeout(() => setIsCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6 w-full text-foreground pb-12">
      {/* ── Breadcrumb Navigation Header ── */}
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer group"
          title={t('Kembali ke Account')}
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>{t('Account')}</span>
        </button>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-foreground font-bold">{t('Family Center')}</span>
      </div>

      {/* ── Subtabs: Activity | My Family | Settings ── */}
      <div className="flex items-center border-b border-border/60 gap-8 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveSubTab('activity')}
          className={cn(
            'pb-2.5 transition-colors relative cursor-pointer',
            activeSubTab === 'activity'
              ? 'text-primary border-b-2 border-primary font-bold'
              : 'text-muted-foreground hover:text-foreground font-semibold',
          )}
        >
          {t('Activity')}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('family')}
          className={cn(
            'pb-2.5 transition-colors relative cursor-pointer',
            activeSubTab === 'family'
              ? 'text-primary border-b-2 border-primary font-bold'
              : 'text-muted-foreground hover:text-foreground font-semibold',
          )}
        >
          {t('My Family')}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('settings')}
          className={cn(
            'pb-2.5 transition-colors relative cursor-pointer',
            activeSubTab === 'settings'
              ? 'text-primary border-b-2 border-primary font-bold'
              : 'text-muted-foreground hover:text-foreground font-semibold',
          )}
        >
          {t('Settings')}
        </button>
      </div>

      {/* ── TAB CONTENT 1: ACTIVITY ── */}
      {activeSubTab === 'activity' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Top Hero Card */}
          <div className="p-6 rounded-2xl border border-border/80 bg-card flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-xs">
            <div className="space-y-3 max-w-md z-10">
              <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                {t('Stay informed about how your teen is using Anticeil.')}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t(
                  'We built Family Center to provide you with more context on how your teen uses Anticeil so you can work together on building positive online behaviors.',
                )}{' '}
                <span className="text-primary hover:underline cursor-pointer inline-flex items-center gap-0.5">
                  {t('Learn more')}
                </span>
              </p>
              <div className="pt-1">
                <Button
                  size="sm"
                  variant="teal"
                  onClick={() => setActiveSubTab('family')}
                  className="font-bold text-xs h-8 px-4 cursor-pointer shadow-xs"
                >
                  {t('Get Started')}
                </Button>
              </div>
            </div>

            {/* Illustration Graphic */}
            <div className="relative shrink-0 flex items-center justify-center p-3">
              <div className="size-28 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-primary/20 to-teal-500/20 border border-primary/30 flex items-center justify-center text-4xl shadow-md relative group">
                🧙‍♂️
                <span className="absolute -bottom-2 -right-2 text-2xl drop-shadow-md">📖</span>
                <span className="absolute -top-2 -left-2 text-xl drop-shadow-md">✨</span>
              </div>
            </div>
          </div>

          {/* 3 Core Principle Benefit Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-xl border border-border bg-card space-y-2 shadow-xs">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-foreground">{t('Messages stay private')}</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {t('You can see who your teen is talking to, while still respecting their privacy.')}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card space-y-2 shadow-xs">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Eye className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-foreground">{t('Transparent sharing')}</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {t("You and your teen see the exact same information, so you're on the same page.")}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-card space-y-2 shadow-xs">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <QrCode className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-foreground">{t('Easily connect')}</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {t('Setup is as simple as using your phone to scan the QR code your teen shows you.')}
              </p>
            </div>
          </div>

          {/* Section 1: What connected guardians can see */}
          <div className="space-y-3 pt-2">
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                {t('What connected guardians can see')}
              </h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                {t(
                  "Our goal is to help you stay informed about your teen's Anticeil activity so you can have meaningful conversations and support them as they navigate digital spaces. We provide insights into how your teen uses Anticeil, and your teen sees the same information, to encourage open dialogue. We allow you to see:",
                )}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
              <div className="p-3.5 flex items-start gap-3">
                <UserPlus className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-foreground">{t('New friends')}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {t('New friends that your teen added or accepted')}
                  </div>
                </div>
              </div>

              <div className="p-3.5 flex items-start gap-3">
                <Server className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    {t('Servers joined or participated in')}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {t(
                      'Includes servers your teen has recently created, joined, sent messages in, or participated in a voice and video call',
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3.5 flex items-start gap-3">
                <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    {t('Users messaged or called')}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {t('This includes direct messages and group chats')}
                  </div>
                </div>
              </div>

              <div className="p-3.5 flex items-start gap-3">
                <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    {t('Total time spent in voice or video')}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {t('Minutes spent in calls across direct messages, group chats, and servers')}
                  </div>
                </div>
              </div>

              <div className="p-3.5 flex items-start gap-3">
                <CreditCard className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    {t('Total purchases')}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {t('All purchases your teen made including Shop and subscriptions')}
                  </div>
                </div>
              </div>

              <div className="p-3.5 flex items-start gap-3">
                <Gift className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    {t('Gifts received')}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {t(
                      'All gifts your teen received in the last week, including who sent them and how much they spent',
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3.5 flex items-start gap-3">
                <Flag className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    {t('Reports shared by your teen')}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {t("If they choose to share a report they filed, you'll be notified via email")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: What guardians can manage */}
          <div className="space-y-3 pt-2">
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                {t('What guardians can manage')}
              </h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                {t(
                  'Guardians can set up safeguards to give their teens the best experience on Anticeil while being safe.',
                )}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
              <div className="p-3.5 flex items-start gap-3">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    {t('Screen Time Limits')}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {t(
                      "Give your teen a break by choosing the hours and days when Anticeil won't be accessible.",
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3.5 flex items-start gap-3">
                <Coins className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-foreground">{t('Spending cap')}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {t(
                      "Set a monthly budget for your teen's Anticeil purchases, including shop items, gifting, and more. Does not include subscriptions.",
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3.5 flex items-start gap-3">
                <Settings className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    {t('Teen Account Settings')}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {t(
                      "You can manage certain settings for your teen's account that they can't edit on their own.",
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: What guardians will not see */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              {t('What guardians will not see')}
            </h3>

            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-start gap-3.5 shadow-xs">
              <div className="size-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                ✕
              </div>
              <div>
                <div className="text-xs font-bold text-rose-300">
                  {t('What your teen writes or says')}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {t("You will not see the contents of your teens' messages or calls.")}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 2: MY FAMILY ── */}
      {activeSubTab === 'family' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Instructions Card */}
          <div className="p-6 rounded-2xl border border-border/80 bg-card flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-xs">
            <div className="space-y-3 max-w-md z-10">
              <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                {t('Download the Anticeil app to connect with your teens!')}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t(
                  "In order to connect with your teen, you'll need to download the Anticeil app on your phone. You can then complete setup by going to Family Center in user settings. After connecting, you will see high-level information about your teen's activity on Anticeil.",
                )}
              </p>

              <div className="space-y-3 pt-1">
                {/* Step 1 */}
                <div className="flex items-start gap-3">
                  <span className="size-5 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <div className="text-xs font-bold text-foreground">
                      {t('Ask your teen for their QR code')}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {t(
                        'Your teen can find this by going to Family Center in user settings and clicking My Family.',
                      )}
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3">
                  <span className="size-5 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <div className="text-xs font-bold text-foreground">
                      {t('Scan the QR code with your Anticeil app')}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {t('This will send a connection request to your teen, like magic!')}
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3">
                  <span className="size-5 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <div className="text-xs font-bold text-foreground">
                      {t('Have your teen accept the connection request')}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {t(
                        "Once they give consent for you to view their activity data, you're good to go.",
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-3">
                <Button
                  size="sm"
                  variant="teal"
                  onClick={() => setShowQrModal(true)}
                  className="text-xs h-8 px-3 font-semibold cursor-pointer gap-1.5 shadow-xs"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{t('Tampilkan QR Code Pairing')}</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowConnectModal(true)}
                  className="text-xs h-8 px-3 font-semibold cursor-pointer gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('Hubungkan Remaja')}</span>
                </Button>
              </div>
            </div>

            {/* Wizard Hat Illustration right side */}
            <div className="relative shrink-0 flex items-center justify-center p-3">
              <div className="size-28 rounded-2xl bg-gradient-to-br from-purple-500/20 via-primary/20 to-pink-500/20 border border-primary/30 flex items-center justify-center text-4xl shadow-md relative group">
                🧙‍♂️
                <span className="absolute -top-2 -right-2 text-2xl drop-shadow-md">☕</span>
                <span className="absolute -bottom-2 -left-2 text-xl drop-shadow-md">🔑</span>
              </div>
            </div>
          </div>

          {/* Connected Teens Counter */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t('CONNECTED TEENS')} — {connectedTeens.length} {t('OF 8')}
            </h3>

            {connectedTeens.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground bg-card border border-border/70 rounded-xl">
                {t('No family members connected yet.')}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                {connectedTeens.map((teen) => (
                  <div key={teen.id} className="p-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                        {teen.name.replace('@', '').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">{teen.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {t('Terhubung sejak {{date}}', { date: teen.pairedAt })}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDisconnectTeen(teen.id)}
                      className="text-xs h-7 text-destructive hover:bg-destructive/10 cursor-pointer"
                    >
                      {t('Putuskan')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB CONTENT 3: SETTINGS ── */}
      {activeSubTab === 'settings' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
              {t('General Settings')}
            </h3>
          </div>

          <div className="space-y-4">
            {/* Setting 1: Enable Family Center Tab */}
            <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
              <div className="space-y-0.5 max-w-lg">
                <div className="text-xs font-semibold text-foreground">
                  {t('Enable Family Center tab')}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {t(
                    'This will show you the Family Center tab. Here you can pair with your family members to create a safe, yet privacy conscious environment for your family!',
                  )}
                </p>
              </div>
              <Switch checked={enableFamilyTab} onCheckedChange={handleToggleFamilyTab} />
            </div>

            {/* Setting 2: Receive Activity Summary Emails */}
            <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
              <div className="space-y-0.5 max-w-lg">
                <div className="text-xs font-semibold text-foreground">
                  {t('Receive Activity Summary emails')}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {t(
                    "You will receive a weekly email summarizing your teen(s)' recent activity. We recommend keeping this setting on.",
                  )}
                </p>
              </div>
              <Switch checked={receiveSummaryEmails} onCheckedChange={handleToggleEmails} />
            </div>
          </div>
        </div>
      )}

      {/* ── QR CODE PAIRING DIALOG ── */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="max-w-sm bg-card border-border text-foreground shadow-2xl p-6 text-center">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-foreground">
              {t('QR Code Pairing Keluarga')}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t('Pindai dengan aplikasi Anticeil di ponsel orang tua untuk menghubungkan akun.')}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-4 space-y-3">
            <div className="size-44 bg-white p-3 rounded-2xl border-2 border-primary/40 shadow-inner flex flex-col items-center justify-center text-slate-900">
              {/* QR Code SVG / Mockup */}
              <QrCode className="size-36 text-slate-900 stroke-[1.8]" />
            </div>

            <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-muted border border-border">
              <span className="font-bold text-foreground">ATC-884920</span>
              <button
                type="button"
                onClick={handleCopyPairingCode}
                className="text-primary hover:text-primary/80 transition-colors ml-1 cursor-pointer"
              >
                {isCopiedCode ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── CONNECT TEEN DIALOG ── */}
      <Dialog open={showConnectModal} onOpenChange={setShowConnectModal}>
        <DialogContent className="max-w-sm bg-card border-border text-foreground shadow-2xl p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-foreground">
              {t('Hubungkan Remaja')}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t('Masukkan username atau kode pairing anak remaja Anda.')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConnectTeen} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t('Username Remaja')}
              </label>
              <Input
                value={teenInput}
                onChange={(e) => setTeenInput(e.target.value)}
                placeholder="@username_anak"
                className="h-8 text-xs bg-muted/40 border-border"
                autoFocus
                required
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowConnectModal(false)}
                className="text-xs h-8 px-3"
              >
                {t('Batal')}
              </Button>
              <Button
                type="submit"
                size="sm"
                variant="teal"
                disabled={!teenInput.trim()}
                className="text-xs h-8 px-4 font-bold shadow-xs"
              >
                {t('Kirim Permintaan')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
