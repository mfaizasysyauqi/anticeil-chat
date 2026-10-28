import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { communityApi } from '@/chat/chat-api';
import { toast } from 'sonner';
import type { CommunityHub, CommunityCustomRole, CommunityMember } from '@/chat/chat-types';

interface RolesTabProps {
  activeHub: CommunityHub;
  serverRoles: CommunityCustomRole[];
  setServerRoles: React.Dispatch<React.SetStateAction<CommunityCustomRole[]>>;
  members: CommunityMember[];
  t: (key: string) => string;
}

export function RolesTab({
  activeHub,
  serverRoles,
  setServerRoles,
  members,
  t,
}: RolesTabProps) {
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#6366f1');

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-bold">{t('Peran & Izin')}</h2>
        <Button size="sm" onClick={() => setIsCreatingRole(!isCreatingRole)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          {isCreatingRole ? t('Batal') : t('Peran Baru')}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        {t('Kelola peran dan hak akses anggota di server ini.')}
      </p>

      {/* Create Role Form */}
      {isCreatingRole && (
        <div className="rounded-lg border bg-card/60 p-4 mb-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('Buat Peran Baru')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">{t('Nama Peran')}</label>
              <Input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="cth: Moderator Utama, VIP..."
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block">{t('Warna Peran')}</label>
              <div className="flex gap-2">
                {['#ef4444', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#64748b'].map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setNewRoleColor(col)}
                    className={cn(
                      'w-6 h-6 rounded-full border transition-transform',
                      newRoleColor === col ? 'scale-125 border-white ring-2 ring-primary' : 'border-transparent',
                    )}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>
          </div>

          <Button
            disabled={!newRoleName.trim()}
            onClick={async () => {
              if (!newRoleName.trim()) return;
              const created = await communityApi.createRole(activeHub.id, {
                name: newRoleName.trim(),
                color: newRoleColor,
              });
              setServerRoles((prev) => [...prev, created]);
              setNewRoleName('');
              setIsCreatingRole(false);
              toast.success(t(`Peran ${created.name} berhasil dibuat! 🛡️`));
            }}
            size="sm"
          >
            {t('Simpan Peran')}
          </Button>
        </div>
      )}

      {/* Roles List */}
      <div className="space-y-2.5">
        {serverRoles.map((role) => (
          <div key={role.id} className="flex items-center gap-3 px-3.5 py-3 rounded-lg border bg-card/40">
            <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: role.color }} />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold capitalize">{role.name}</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {(role.permissions || ['SEND_MESSAGES']).map((perm) => (
                  <Badge key={perm} variant="outline" className="text-[9px] py-0 px-1 font-normal text-muted-foreground">
                    {perm}
                  </Badge>
                ))}
              </div>
            </div>
            <Badge variant="secondary" className="text-[10px]">
              {members.filter((m) => m.role === role.name.toLowerCase()).length} {t('anggota')}
            </Badge>
            {role.name.toLowerCase() !== 'owner' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                onClick={async () => {
                  setServerRoles((prev) => prev.filter((r) => r.id !== role.id));
                  await communityApi.deleteRole(activeHub.id, role.id);
                  toast.success(t(`Peran ${role.name} dihapus`));
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
