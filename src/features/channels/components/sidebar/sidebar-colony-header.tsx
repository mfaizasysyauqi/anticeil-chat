import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  Zap,
  UserPlus,
  Settings,
  Webhook,
  Plus,
  Camera,
  Edit2,
  Layers,
  ScrollText,
  ExternalLink,
  FolderPlus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { getColonyInitials } from '@/features/colonies/components/colony-icon';
import type { Colony } from '@/chat/chat-types';
import type { ColonySettingsSection } from '@/features/colony-settings';

export interface SidebarColonyHeaderProps {
  activeColony: Colony | null;
  onUpdateColonyIcon?: (file: File) => Promise<void> | void;
  onOpenServerSettings: (section?: ColonySettingsSection) => void;
  onOpenCreateChannel: (category: string, type?: any) => void;
  onOpenCreateCategory?: () => void;
  onOpenCreateColony?: () => void;
  t: (key: string, params?: Record<string, any>) => string;
}

export const SidebarColonyHeader: React.FC<SidebarColonyHeaderProps> = ({
  activeColony,
  onUpdateColonyIcon,
  onOpenServerSettings,
  onOpenCreateChannel,
  onOpenCreateCategory,
  onOpenCreateColony,
  t,
}) => {
  const serverIconQuickInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="h-12 border-b border-sidebar-border px-2 flex items-center font-semibold shadow-2xs shrink-0 bg-sidebar z-10">
      <div className="w-full">
        <input
          type="file"
          ref={serverIconQuickInputRef}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file || !activeColony) return;
            if (onUpdateColonyIcon) {
              await onUpdateColonyIcon(file);
            }
            e.target.value = '';
          }}
          accept="image/*"
          className="hidden"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="w-full h-8 px-2 flex items-center justify-between rounded-md hover:bg-sidebar-accent/60 transition-colors cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-sidebar-ring group"
            >
              <div className="flex items-center gap-2 min-w-0">
                {activeColony?.iconUrl ? (
                  <img
                    src={activeColony.iconUrl}
                    alt={activeColony.name}
                    className="w-5 h-5 rounded-[6px] object-cover shrink-0 border border-white/10"
                  />
                ) : activeColony ? (
                  <div className="w-5 h-5 rounded-[6px] bg-sidebar-accent border border-sidebar-border/60 flex items-center justify-center shrink-0 text-[10px] font-semibold text-foreground">
                    {getColonyInitials(activeColony.name)}
                  </div>
                ) : null}
                <span className="text-sm font-semibold truncate tracking-tight text-foreground group-hover:text-primary transition-colors">
                  {activeColony?.name || t('Colony')}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 ml-1 transition-colors" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            {/* Server Picture Action */}
            <DropdownMenuItem
              onClick={() => {
                serverIconQuickInputRef.current?.click();
              }}
              className="cursor-pointer font-medium text-primary focus:text-primary focus:bg-primary/10"
            >
              <Camera className="w-4 h-4 mr-2 text-primary" /> {t('Ubah Foto Colony')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Boost */}
            <DropdownMenuItem
              onClick={() => {
                onOpenServerSettings('boost');
              }}
              className="cursor-pointer font-medium text-primary focus:text-primary focus:bg-primary/10"
            >
              <Zap className="w-4 h-4 mr-2 text-primary" /> {t('Colony Boost')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Invite & Settings */}
            <DropdownMenuItem
              onClick={() => {
                const code = activeColony?.inviteCode || activeColony?.id;
                const url = `${window.location.origin}/messages?invite=${code}`;
                navigator.clipboard.writeText(url);
                toast.success(t('Link undangan berhasil disalin! 📋'));
              }}
              className="cursor-pointer"
            >
              <UserPlus className="w-4 h-4 mr-2" /> {t('Undang ke Colony')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                onOpenServerSettings('profile');
              }}
              className="cursor-pointer"
            >
              <Settings className="w-4 h-4 mr-2" /> {t('Pengaturan Colony')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Channel & Category */}
            <DropdownMenuItem onClick={() => onOpenCreateChannel('CHANNELS', 'text')} className="cursor-pointer">
              <Plus className="w-4 h-4 mr-2" /> {t('Buat Channel')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenCreateCategory?.()} className="cursor-pointer">
              <FolderPlus className="w-4 h-4 mr-2" /> {t('Buat Kategori')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenCreateColony?.()} className="cursor-pointer">
              <Layers className="w-4 h-4 mr-2" /> {t('Buat Colony Baru')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Notification & Privacy */}
            <DropdownMenuItem
              onClick={() => {
                onOpenServerSettings('audit-log');
              }}
              className="cursor-pointer"
            >
              <ScrollText className="w-4 h-4 mr-2" /> {t('Log Audit Colony')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                onOpenServerSettings('integrations');
              }}
              className="cursor-pointer"
            >
              <Webhook className="w-4 h-4 mr-2" /> {t('Integrasi & Bot')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Per-server profile */}
            <DropdownMenuItem
              onClick={() => {
                onOpenServerSettings('profile');
              }}
              className="cursor-pointer"
            >
              <Edit2 className="w-4 h-4 mr-2" /> {t('Edit Profil Colony')}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/templates" className="flex items-center">
                <ExternalLink className="w-4 h-4 mr-2" /> {t('Jelajahi Marketplace')}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
