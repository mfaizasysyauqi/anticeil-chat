import React from 'react';
import {
  Calculator,
  Gamepad2,
  Palette,
  Video,
  ArrowUpRight,
  LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AiPromptItem {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: string;
  icon: LucideIcon;
  iconColorClass: string;
  iconBgClass: string;
}

export const AI_COMMAND_PROMPTS: AiPromptItem[] = [
  {
    id: 'calculator',
    title: 'Buat Kalkulator',
    category: 'Artifact',
    description: 'Menghasilkan aplikasi kalkulator web interaktif di panel Artifacts.',
    prompt: 'Buatkan aplikasi kalkulator web interaktif lengkap dengan riwayat perhitungan',
    icon: Calculator,
    iconColorClass: 'text-sky-400',
    iconBgClass: 'bg-sky-500/10 border-sky-500/20',
  },
  {
    id: 'mini-game',
    title: 'Buat Mini Game',
    category: 'Artifact',
    description: 'Membuat game arcade canvas retro yang bisa langsung dimainkan.',
    prompt: 'Buatkan mini game arcade retro di canvas HTML5 yang bisa langsung dimainkan',
    icon: Gamepad2,
    iconColorClass: 'text-emerald-400',
    iconBgClass: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    id: 'whiteboard',
    title: 'Buka Jamspace Whiteboard',
    category: 'Aplikasi',
    description: 'Membuka canvas kolaboratif standalone untuk diagram & sketsa.',
    prompt: 'Buka Jamspace Whiteboard',
    icon: Palette,
    iconColorClass: 'text-violet-400',
    iconBgClass: 'bg-violet-500/10 border-violet-500/20',
  },
  {
    id: 'watch-together',
    title: 'YouTube Watch Together',
    category: 'Aktivitas',
    description: 'Nonton video bersama dengan kontrol sinkronisasi realtime.',
    prompt: 'Buka YouTube Watch Together',
    icon: Video,
    iconColorClass: 'text-rose-400',
    iconBgClass: 'bg-rose-500/10 border-rose-500/20',
  },
];

export interface AiPromptCardProps {
  item?: AiPromptItem;
  title?: string;
  description?: string;
  category?: string;
  icon?: LucideIcon;
  iconColorClass?: string;
  iconBgClass?: string;
  onClick: () => void;
  className?: string;
}

export function AiPromptCard({
  item,
  title = item?.title || '',
  description = item?.description || '',
  category = item?.category,
  icon: Icon = item?.icon || Calculator,
  iconColorClass = item?.iconColorClass || 'text-primary',
  iconBgClass = item?.iconBgClass || 'bg-primary/10 border-primary/20',
  onClick,
  className,
}: AiPromptCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative p-3 rounded-xl bg-card/60 hover:bg-card border border-border/70 hover:border-primary/50',
        'transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.99] text-left flex items-start gap-3 w-full',
        className
      )}
    >
      {/* Icon Badge */}
      <div
        className={cn(
          'size-9 rounded-[10px] flex items-center justify-center shrink-0 border transition-all duration-200 group-hover:scale-105 shadow-2xs',
          iconBgClass,
          iconColorClass
        )}
      >
        <Icon className="w-4 h-4 stroke-[2]" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
            {title}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {category && (
              <span className="text-[9px] font-medium font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-[4px] bg-sidebar-accent text-muted-foreground border border-sidebar-border">
                {category}
              </span>
            )}
            <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary opacity-0 group-hover:opacity-100 -translate-x-0.5 translate-y-0.5 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-200" />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mt-0.5 group-hover:text-muted-foreground/90 transition-colors">
          {description}
        </p>
      </div>
    </button>
  );
}
