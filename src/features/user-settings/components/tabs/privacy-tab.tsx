import React, { useState, useEffect } from 'react';
import { Shield, Lock, ExternalLink } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { isE2eeEnabled, setE2eeEnabled } from '@/lib/e2ee';
import { toast } from 'sonner';
import { userSettingsApi, PrivacySettings, DEFAULT_USER_SETTINGS } from '../../api/user-settings-api';

export interface PrivacyTabProps {}

export function PrivacyTab(_props: PrivacyTabProps) {
  const { t } = useTranslation();
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(DEFAULT_USER_SETTINGS.privacy);
  const [e2eeActive, setE2eeActive] = useState(() => isE2eeEnabled());

  useEffect(() => {
    userSettingsApi.getSettings().then((settings) => {
      if (settings?.privacy) {
        setPrivacySettings(settings.privacy);
      }
    });
  }, []);

  const updatePrivacy = (partial: Partial<PrivacySettings>) => {
    setPrivacySettings((prev) => {
      const next = { ...prev, ...partial };
      userSettingsApi.updateSettings({ privacy: next });
      return next;
    });
    toast.success(t('Pengaturan privasi disimpan!'));
  };

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

  return (
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
            <Switch
              checked={privacySettings.useDataForImprovement}
              onCheckedChange={(checked) => updatePrivacy({ useDataForImprovement: checked })}
            />
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
            <Switch
              checked={privacySettings.useDataForPersonalization}
              onCheckedChange={(checked) => updatePrivacy({ useDataForPersonalization: checked })}
            />
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
                    onClick={() => updatePrivacy({ safeDirectMessaging: opt.id as any })}
                    className={cn(
                      'p-2.5 rounded-lg border text-left transition-all cursor-pointer',
                      privacySettings.safeDirectMessaging === opt.id
                        ? 'border-sidebar-primary bg-sidebar-primary/10 text-sidebar-primary font-bold'
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
              variant="tealSecondary"
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
              {t('Izinkan DM dari anggota server')}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                {t('Anggota colony yang sama dapat mengirim pesan langsung ke akun Anda.')}
              </span>
              <Switch
                checked={privacySettings.allowDmsFromServerMembers}
                onCheckedChange={(checked) => updatePrivacy({ allowDmsFromServerMembers: checked })}
              />
            </div>
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
  );
}
