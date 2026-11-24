import React, { useState, useEffect } from 'react';
import { X, Ban, Store, Lock, Sparkles } from 'lucide-react';
import { useTranslation } from '@/core/i18n';
import { cn } from '@/lib/utils';
import { AVATAR_DECORATIONS_LIST, AvatarDecorationItem } from '../data/avatar-decorations';
import { AvatarDecorationRenderer } from './avatar-decoration-renderer';

interface ChangeAvatarDecorationDialogProps {
  open: boolean;
  onClose: () => void;
  currentDecoration?: string;
  onApply: (decorationId: string) => void;
  avatarUrl?: string | null;
  userName?: string;
  onOpenShop?: () => void;
}

export const ChangeAvatarDecorationDialog: React.FC<ChangeAvatarDecorationDialogProps> = ({
  open,
  onClose,
  currentDecoration = 'none',
  onApply,
  avatarUrl,
  userName = 'User',
  onOpenShop,
}) => {
  const { t } = useTranslation();
  const [selectedDecoration, setSelectedDecoration] = useState<string>(currentDecoration);

  // Sync state when opened
  useEffect(() => {
    if (open) {
      setSelectedDecoration(currentDecoration || 'none');
    }
  }, [open, currentDecoration]);

  // Handle ESC key to close
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const nectarDecorations = AVATAR_DECORATIONS_LIST.filter((d) => d.category === 'nectar');
  const shopDecorations = AVATAR_DECORATIONS_LIST.filter((d) => d.category === 'shop');

  const handleApply = () => {
    onApply(selectedDecoration);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[680px] bg-[#2b2d31] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-bold tracking-tight text-white">
            {t('Change Avatar Decoration')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Left: Selectors, Right: Preview) */}
        <div className="flex flex-col md:flex-row gap-6 p-6 min-h-[460px]">
          {/* Left Column: Decoration Categories */}
          <div className="flex-1 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar space-y-6">
            {/* Section: Your Decorations */}
            <div>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5">
                {t('Your Decorations')}
              </h3>
              <div className="flex items-center gap-3">
                {/* None Button */}
                <button
                  type="button"
                  onClick={() => setSelectedDecoration('none')}
                  className={cn(
                    'w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all border',
                    selectedDecoration === 'none'
                      ? 'border-[#5865f2] bg-[#5865f2]/20 shadow-[0_0_12px_rgba(88,101,242,0.4)]'
                      : 'border-white/10 bg-[#1e1f22] hover:bg-[#35373c]'
                  )}
                >
                  <Ban className="w-7 h-7 text-zinc-400" />
                  <span className="text-[11px] font-semibold text-zinc-200">{t('None')}</span>
                </button>

                {/* Shop Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenShop) {
                      onOpenShop();
                      onClose();
                    }
                  }}
                  className="w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer border border-white/10 bg-[#1e1f22] hover:bg-[#35373c] transition-colors"
                >
                  <Store className="w-7 h-7 text-zinc-400" />
                  <span className="text-[11px] font-semibold text-zinc-200">{t('Shop')}</span>
                </button>
              </div>
            </div>

            {/* Section: Exclusive to Nitro / Nectar */}
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  {t('Exclusive to Nitro')}
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {nectarDecorations.map((item) => {
                  const isSelected = selectedDecoration === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedDecoration(item.id)}
                      className={cn(
                        'aspect-square rounded-xl bg-[#1e1f22] hover:bg-[#35373c] border flex items-center justify-center relative cursor-pointer group transition-all p-2',
                        isSelected
                          ? 'border-[#5865f2] bg-[#35373c] shadow-[0_0_12px_rgba(88,101,242,0.4)]'
                          : 'border-white/10'
                      )}
                      title={item.name}
                    >
                      {/* Top right Nitro/Nectar badge */}
                      <span className="absolute top-1.5 right-1.5 size-4 rounded-full bg-pink-500/80 flex items-center justify-center z-30 shadow-xs">
                        <Sparkles className="w-2.5 h-2.5 text-white" />
                      </span>

                      {/* Small avatar placeholder with decoration */}
                      <div className="relative size-11 rounded-full bg-zinc-800 flex items-center justify-center">
                        <div className="size-full rounded-full bg-zinc-700 flex items-center justify-center text-[10px] text-zinc-400 font-bold">
                          {userName.slice(0, 1).toUpperCase()}
                        </div>
                        <AvatarDecorationRenderer decorationId={item.id} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section: See What's in Shop */}
            <div>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5">
                {t("See What's in Shop")}
              </h3>
              <div className="grid grid-cols-3 gap-2.5">
                {shopDecorations.map((item) => {
                  const isSelected = selectedDecoration === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedDecoration(item.id)}
                      className={cn(
                        'aspect-square rounded-xl bg-[#1e1f22] hover:bg-[#35373c] border flex items-center justify-center relative cursor-pointer group transition-all p-2',
                        isSelected
                          ? 'border-[#5865f2] bg-[#35373c] shadow-[0_0_12px_rgba(88,101,242,0.4)]'
                          : 'border-white/10'
                      )}
                      title={item.name}
                    >
                      {/* Lock badge in top-right */}
                      <span className="absolute top-1.5 right-1.5 size-4 rounded-full bg-zinc-900/80 flex items-center justify-center z-30 shadow-xs">
                        <Lock className="w-2.5 h-2.5 text-zinc-300" />
                      </span>

                      {/* Small avatar placeholder with decoration */}
                      <div className="relative size-11 rounded-full bg-zinc-800 flex items-center justify-center">
                        <div className="size-full rounded-full bg-zinc-700 flex items-center justify-center text-[10px] text-zinc-400 font-bold">
                          {userName.slice(0, 1).toUpperCase()}
                        </div>
                        <AvatarDecorationRenderer decorationId={item.id} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Large Live Preview & Scaling Column */}
          <div className="shrink-0 w-full md:w-[260px] flex items-center justify-center gap-4 bg-[#1e1f22]/50 p-4 rounded-xl border border-white/5">
            {/* Big Avatar Preview */}
            <div className="size-[170px] rounded-xl bg-[#111214] flex items-center justify-center relative shadow-inner border border-white/5">
              <div className="relative size-24 rounded-full overflow-hidden border-2 border-white/10 bg-zinc-800 flex items-center justify-center shadow-lg">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="size-full object-cover" />
                ) : (
                  <div className="size-full flex items-center justify-center bg-zinc-700 text-zinc-200 font-bold text-xl select-none">
                    {userName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                {/* Overlaid Animated Decoration */}
                <AvatarDecorationRenderer decorationId={selectedDecoration} />
              </div>
            </div>

            {/* Vertical column of 4 small avatars showing real scaling */}
            <div className="flex flex-col items-center justify-between h-[170px] py-1">
              {/* 48px */}
              <div className="relative size-11 rounded-full overflow-hidden border border-white/10 bg-zinc-800 flex items-center justify-center shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="size-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-zinc-400">
                    {userName.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <AvatarDecorationRenderer decorationId={selectedDecoration} />
              </div>

              {/* 36px */}
              <div className="relative size-8 rounded-full overflow-hidden border border-white/10 bg-zinc-800 flex items-center justify-center shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="size-full object-cover" />
                ) : (
                  <span className="text-[8px] font-bold text-zinc-400">
                    {userName.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <AvatarDecorationRenderer decorationId={selectedDecoration} />
              </div>

              {/* 28px */}
              <div className="relative size-6 rounded-full overflow-hidden border border-white/10 bg-zinc-800 flex items-center justify-center shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="size-full object-cover" />
                ) : (
                  <span className="text-[7px] font-bold text-zinc-400">
                    {userName.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <AvatarDecorationRenderer decorationId={selectedDecoration} />
              </div>

              {/* 20px */}
              <div className="relative size-5 rounded-full overflow-hidden border border-white/10 bg-zinc-800 flex items-center justify-center shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="size-full object-cover" />
                ) : (
                  <span className="text-[6px] font-bold text-zinc-400">
                    {userName.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <AvatarDecorationRenderer decorationId={selectedDecoration} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#232428] flex items-center justify-end gap-3 border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-md font-semibold text-sm text-zinc-300 hover:text-white hover:underline transition-colors cursor-pointer"
          >
            {t('Cancel')}
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-6 py-2 rounded-md font-semibold text-sm text-white bg-[#5865f2] hover:bg-[#4752c4] transition-colors cursor-pointer shadow-md"
          >
            {t('Apply')}
          </button>
        </div>
      </div>
    </div>
  );
};
