import React, { useState } from 'react';
import {
  Activity as ActivityIcon,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import type { UserProfileWidgets } from '../api/profile-api';
import type { UserConnectionItem } from '@/features/user-settings/api/games-apps-api';
import { ProfileConnectedPlatformsSection } from './profile-connected-platforms-section';

export interface ProfileActivitySubtabProps {
  profileWidgets: UserProfileWidgets;
  persistWidgets: (newWidgets: UserProfileWidgets) => void;
  userConnections: UserConnectionItem[];
  onOpenConnectModal: (platform: any) => void;
}

export function ProfileActivitySubtab({
  profileWidgets,
  persistWidgets,
  userConnections,
  onOpenConnectModal,
}: ProfileActivitySubtabProps) {
  const { t } = useTranslation();

  const [isEditingActivity, setIsEditingActivity] = useState(false);
  const [activityTitleInput, setActivityTitleInput] = useState('');
  const [activitySubtitleInput, setActivitySubtitleInput] = useState('');
  const [activityIconInput, setActivityIconInput] = useState('💻');

  const handleSaveActivity = () => {
    if (!activityTitleInput.trim()) {
      toast.error(t('Nama aktivitas diperlukan'));
      return;
    }
    const updated: UserProfileWidgets = {
      ...profileWidgets,
      activity: {
        title: activityTitleInput.trim(),
        subtitle: activitySubtitleInput.trim() || t('Aktif sekarang'),
        icon: activityIconInput || '💻',
        timeAgo: t('Baru saja'),
      },
    };
    persistWidgets(updated);
    setIsEditingActivity(false);
    toast.success(t('Status aktivitas diperbarui! 🚀'));
  };

  const handleClearActivity = () => {
    const updated: UserProfileWidgets = {
      ...profileWidgets,
      activity: null,
    };
    persistWidgets(updated);
    toast.info(t('Aktivitas dibersihkan'));
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Privacy Toggle */}
      <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-card">
        <div className="space-y-0.5 pr-3">
          <div className="text-xs font-bold text-foreground">
            {t('Tampilkan Aktivitas Saat Ini')}
          </div>
          <div className="text-[11px] text-muted-foreground leading-snug">
            {t(
              'Tampilkan status aktivitas Anda (seperti coding, fokus, atau audio) pada profil secara otomatis.'
            )}
          </div>
        </div>
        <Switch
          checked={profileWidgets.showActivity !== false}
          onCheckedChange={(checked) =>
            persistWidgets({ ...profileWidgets, showActivity: checked })
          }
        />
      </div>

      {/* Active Activity Card (if set) */}
      {profileWidgets.activity ? (
        <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-sidebar-primary/20 border border-sidebar-primary/40 flex items-center justify-center text-xl text-sidebar-primary">
                {profileWidgets.activity.icon || '💻'}
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">
                  {profileWidgets.activity.title}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {profileWidgets.activity.subtitle} •{' '}
                  {profileWidgets.activity.timeAgo || t('Aktif sekarang')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="tealGhost"
                onClick={() => {
                  setActivityTitleInput(profileWidgets.activity?.title || '');
                  setActivitySubtitleInput(profileWidgets.activity?.subtitle || '');
                  setActivityIconInput(profileWidgets.activity?.icon || '💻');
                  setIsEditingActivity(true);
                }}
                className="text-xs h-7 px-2 cursor-pointer"
                title={t('Edit Aktivitas')}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearActivity}
                className="text-xs h-7 px-2 text-destructive hover:bg-destructive/10 cursor-pointer"
                title={t('Hapus Aktivitas')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Clean Empty State */
        <div className="p-6 rounded-2xl border border-border/70 bg-card text-center space-y-4 shadow-xs">
          <div className="size-11 rounded-2xl bg-secondary/80 flex items-center justify-center text-xl mx-auto text-sidebar-primary">
            <ActivityIcon className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">
              {t('Belum ada aktivitas aktif')}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {t(
                'Bagikan apa yang sedang Anda kerjakan (seperti coding, riset, atau mendengarkan audio) kepada kawan satu komunitas.'
              )}
            </p>
          </div>

          <Button
            size="sm"
            variant="teal"
            onClick={() => setIsEditingActivity(true)}
            className="text-xs h-8 px-4 font-bold cursor-pointer"
          >
            + {t('Atur Aktivitas Sekarang')}
          </Button>
        </div>
      )}

      {/* Inline Activity Editor Form */}
      {isEditingActivity && (
        <div className="p-4 rounded-xl border border-sidebar-primary/40 bg-card space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <ActivityIcon className="w-3.5 h-3.5 text-sidebar-primary" />
              {t('Atur Status Aktivitas')}
            </span>
            <X
              className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-foreground"
              onClick={() => setIsEditingActivity(false)}
            />
          </div>

          {/* Quick Presets */}
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">
              {t('Preset Cepat')}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                {
                  label: '💻 Coding',
                  title: 'Coding & Dev',
                  subtitle: 'Mengerjakan fitur baru',
                  icon: '💻',
                },
                {
                  label: '🎨 UI Design',
                  title: 'UI/UX Design',
                  subtitle: 'Merapikan komponen antarmuka',
                  icon: '🎨',
                },
                {
                  label: '🎧 Audio',
                  title: 'Mendengarkan Musik',
                  subtitle: 'Lo-Fi Chill Beats',
                  icon: '🎧',
                },
                {
                  label: '🚀 Focus',
                  title: 'Focus Sprint',
                  subtitle: 'Mohon tidak diganggu',
                  icon: '🚀',
                },
                {
                  label: '☕ Rehat',
                  title: 'Rehat Santai',
                  subtitle: 'Menikmati kopi',
                  icon: '☕',
                },
                {
                  label: '📚 Riset',
                  title: 'Riset & Belajar',
                  subtitle: 'Mempelajari dokumentasi',
                  icon: '📚',
                },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setActivityTitleInput(preset.title);
                    setActivitySubtitleInput(preset.subtitle);
                    setActivityIconInput(preset.icon);
                  }}
                  className="px-2 py-1 rounded-lg text-[11px] font-medium bg-secondary hover:bg-secondary/80 border border-border/60 text-foreground transition-colors cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-16">
                <label className="text-[10px] text-muted-foreground block mb-1">
                  {t('Ikon')}
                </label>
                <Input
                  type="text"
                  value={activityIconInput}
                  onChange={(e) => setActivityIconInput(e.target.value)}
                  className="text-center text-sm h-8"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground block mb-1">
                  {t('Judul Aktivitas')}
                </label>
                <Input
                  type="text"
                  value={activityTitleInput}
                  onChange={(e) => setActivityTitleInput(e.target.value)}
                  placeholder={t('e.g. Coding / UI Design / Focus Mode')}
                  className="text-xs h-8"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">
                {t('Detail / Status')}
              </label>
              <Input
                type="text"
                value={activitySubtitleInput}
                onChange={(e) => setActivitySubtitleInput(e.target.value)}
                placeholder={t('e.g. Sprint 2 Frontend / Lo-Fi Chill')}
                className="text-xs h-8"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="tealSecondary"
              onClick={() => setIsEditingActivity(false)}
              className="h-7 text-xs"
            >
              {t('Batal')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="teal"
              onClick={handleSaveActivity}
              className="h-7 text-xs font-bold"
            >
              {t('Simpan Aktivitas')}
            </Button>
          </div>
        </div>
      )}

      {/* Connected Platforms Section */}
      <ProfileConnectedPlatformsSection
        userConnections={userConnections}
        onOpenConnectModal={onOpenConnectModal}
      />
    </div>
  );
}
