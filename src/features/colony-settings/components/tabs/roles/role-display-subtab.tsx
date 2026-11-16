import React from 'react';
import { Shield, Check, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { CommunityCustomRole } from '@/chat/chat-types';

export const DISCORD_ROLE_COLORS = [
  '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#e91e63', '#f1c40f', '#e67e22', '#e74c3c',
  '#11806a', '#1f8b4c', '#206694', '#71368a', '#ad1457', '#c27c0e', '#a84300', '#992d22',
];

export interface RoleDisplaySubtabProps {
  roleName: string;
  setRoleName: (val: string) => void;
  roleColor: string;
  setRoleColor: (val: string) => void;
  roleIcon: string | null;
  setRoleIcon: (val: string | null) => void;
  roleStyle: 'solid' | 'gradient' | 'holographic';
  setRoleStyle: (val: 'solid' | 'gradient' | 'holographic') => void;
  hoist: boolean;
  setHoist: (val: boolean) => void;
  mentionable: boolean;
  setMentionable: (val: boolean) => void;
  activeRole: CommunityCustomRole | null;
  t: (key: string) => string;
}

export function RoleDisplaySubtab({
  roleName,
  setRoleName,
  roleColor,
  setRoleColor,
  roleIcon,
  setRoleIcon,
  roleStyle,
  setRoleStyle,
  hoist,
  setHoist,
  mentionable,
  setMentionable,
  activeRole,
  t,
}: RoleDisplaySubtabProps) {
  return (
          <div className="space-y-6">
            {/* Role Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('Role name')} <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="new role"
                className="w-full h-10 px-3.5 rounded-xl bg-[#1e1f22] border border-border/80 text-xs font-semibold text-foreground focus:outline-none focus:border-[#5865F2]"
              />
            </div>

            {/* Role Style NEW */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t('Role Style')}
                </label>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#5865F2] text-white">
                  NEW
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(['solid', 'gradient', 'holographic'] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setRoleStyle(style)}
                    className={cn(
                      'p-3 rounded-xl border bg-[#1e1f22] flex flex-col items-center justify-center gap-1.5 capitalize text-xs font-semibold transition-all cursor-pointer',
                      roleStyle === style
                        ? 'border-[#5865F2] ring-2 ring-[#5865F2] bg-[#2b2d31]'
                        : 'border-border/70 hover:border-border hover:bg-[#2b2d31]/50 text-muted-foreground',
                    )}
                  >
                    <span className="text-xs">{style}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#1e1f22] border border-border/60 text-xs">
                <div>
                  <span className="font-bold text-foreground">
                    {t('Make certain roles magical')}
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    {t('Unlock new role styles with Boosting.')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toast.info(t('Tingkatkan server untuk membuka gaya peran kustom.'))}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#5865F2] via-[#8b5cf6] to-[#ec4899] text-white text-[10px] font-bold shadow-sm"
                >
                  <Gem className="w-3 h-3" />
                  <span>{t('Unlock with Boosting')}</span>
                </button>
              </div>
            </div>

            {/* Role Color */}
            <div className="space-y-2.5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  {t('Role color')} <span className="text-destructive">*</span>
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t(
                    'Members use the color of the highest role they have on the roles list.',
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Clear / Default swatch */}
                <button
                  type="button"
                  onClick={() => setRoleColor('#94a3b8')}
                  className={cn(
                    'size-9 rounded-xl border flex items-center justify-center bg-[#2b2d31] transition-transform cursor-pointer',
                    roleColor === '#94a3b8'
                      ? 'border-white ring-2 ring-[#5865F2] scale-105'
                      : 'border-border/70',
                  )}
                  title="Clear / Default"
                >
                  <Check className="w-4 h-4 text-muted-foreground" />
                </button>

                {/* 16 Discord Role Colors */}
                {DISCORD_ROLE_COLORS.map((col) => {
                  const isSelected =
                    roleColor.toLowerCase() === col.toLowerCase();
                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setRoleColor(col)}
                      className={cn(
                        'size-9 rounded-xl border transition-all cursor-pointer shadow-xs',
                        isSelected
                          ? 'border-white ring-2 ring-[#5865F2] scale-110'
                          : 'border-transparent hover:scale-105',
                      )}
                      style={{ backgroundColor: col }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Live Message Preview (Discord 1:1 Parity) */}
            <div className="rounded-xl border border-border/80 bg-[#111214] p-4 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t('Role Preview')}
              </span>
              <div className="flex items-start gap-3 p-2 rounded-lg bg-[#1e1f22]">
                <div className="size-9 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
                  🤖
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-xs font-bold"
                      style={{ color: roleColor }}
                    >
                      Wumpus
                    </span>
                    <span className="text-[10px] text-muted-foreground">14:49</span>
                  </div>
                  <p className="text-xs text-foreground/90 mt-0.5">
                    rocks are really old
                  </p>
                </div>
              </div>
            </div>

            {/* Display Separately Switch (Hoisted) */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <div>
                <span className="text-xs font-bold text-foreground block">
                  {t('Display role members separately from online members')}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {t('Menampilkan anggota peran ini dalam kategori khusus di daftar anggota.')}
                </span>
              </div>
              <Switch checked={hoist} onCheckedChange={setHoist} />
            </div>

            {/* Mentionable Switch */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-foreground block">
                  {t('Allow anyone to @mention this role')}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {t(
                    'Members with the "Mention @everyone, @here, and All Roles" permission will always be able to ping this role.',
                  )}
                </span>
              </div>
              <Switch checked={mentionable} onCheckedChange={setMentionable} />
            </div>
          </div>
  );
}
