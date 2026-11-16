import React, { useState, useEffect } from 'react';
import {
  Check,
  Search,
  ChevronDown,
  ExternalLink,
  X,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import {
  availablePlatforms,
  type UserConnection,
} from '../../../data/platforms';
import {
  gamesAppsApi,
  type AuthorizedAppDetail,
  type UserConnectionItem,
} from '@/features/user-settings/api/games-apps-api';

export type { AuthorizedAppDetail };

export interface ConnectedAppsSubtabProps {
  currentUserName?: string;
}

export function ConnectedAppsSubtab({
  currentUserName,
}: ConnectedAppsSubtabProps) {
  const { t } = useTranslation();

  const [userConnections, setUserConnections] = useState<UserConnectionItem[]>([]);
  const [authorizedApps, setAuthorizedApps] = useState<AuthorizedAppDetail[]>([]);

  useEffect(() => {
    gamesAppsApi.getUserConnections().then(setUserConnections);
    gamesAppsApi.getAuthorizedApps().then(setAuthorizedApps);
  }, []);

  const [authorizedAppSearch, setAuthorizedAppSearch] = useState('');
  const [expandedAppAbout, setExpandedAppAbout] = useState<
    Record<string, boolean>
  >({});
  const [expandedAppPerms, setExpandedAppPerms] = useState<
    Record<string, boolean>
  >({});

  return (
    <div className="space-y-8 divide-y divide-border/50 pb-8">
      {/* SUB-SECTION 1: CONNECTIONS */}
      <div id="connected-connections" className="scroll-mt-6 space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t('Connections')}
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            {t(
              "These are accounts from other platforms. Connecting them here can unlock new features on Discord, like the ability to share what you're currently listening to, get paid safely and securely, and more.",
            )}
          </p>
        </div>

        {/* Add a new connection */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t('Add a new connection')}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {availablePlatforms.map((p) => {
              const isConnected = userConnections.some(
                (c) => c.platformId === p.id,
              );
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    if (isConnected) {
                      toast.info(t(`Akun ${p.name} sudah terhubung!`));
                      return;
                    }
                    setUserConnections((prev) => [
                      ...prev,
                      {
                        id: `conn-${p.id}`,
                        platformId: p.id,
                        accountName: currentUserName || 'User',
                        platformName: p.name,
                        icon: p.icon,
                        displayOnProfile: true,
                        displayStatus: true,
                      },
                    ]);
                    toast.success(t(`Akun ${p.name} berhasil dihubungkan!`));
                  }}
                  className={cn(
                    'size-10 rounded-xl border border-border/70 flex items-center justify-center text-lg transition-all cursor-pointer shadow-sm relative group',
                    isConnected
                      ? 'bg-[#5865F2]/20 border-[#5865F2] ring-1 ring-[#5865F2]'
                      : 'bg-[#1e1f22] hover:bg-[#2b2d31] hover:border-border hover:scale-105',
                  )}
                  title={
                    isConnected
                      ? `${p.name} (Terhubung)`
                      : `Hubungkan ${p.name}`
                  }
                >
                  <span>{p.icon}</span>
                  {isConnected && (
                    <div className="absolute -top-1 -right-1 size-3.5 bg-[#5865F2] rounded-full text-white flex items-center justify-center text-[9px] font-bold">
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Connections List */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {userConnections.length} {t('connection')}
          </div>

          <div className="space-y-3">
            {userConnections.map((conn) => (
              <div
                key={conn.id}
                className="rounded-2xl border border-border/80 bg-[#1e1f22] p-4 space-y-4"
              >
                {/* Top Header Row with Icon, Names, and X button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-[#1ed760] text-black flex items-center justify-center text-lg font-bold shadow-sm">
                      {conn.icon}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">
                        {conn.accountName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {conn.platformName}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await gamesAppsApi.removeConnection(conn.id);
                      setUserConnections((prev) =>
                        prev.filter((c) => c.id !== conn.id),
                      );
                      toast.success(
                        t(`Koneksi ${conn.platformName} diputuskan`),
                      );
                    }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                    title={t('Disconnect')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Switches inside connection card */}
                <div className="space-y-3 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      {t('Display on profile')}
                    </span>
                    <Switch
                      checked={conn.displayOnProfile}
                      onCheckedChange={async (checked) => {
                        await gamesAppsApi.toggleConnectionField(conn.id, 'displayOnProfile', checked);
                        setUserConnections((prev) =>
                          prev.map((c) =>
                            c.id === conn.id
                              ? { ...c, displayOnProfile: checked }
                              : c,
                          ),
                        );
                        toast.success(
                          checked
                            ? t(`Tampilkan ${conn.platformName} di profil`)
                            : t(`Sembunyikan ${conn.platformName} dari profil`),
                        );
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      {t(`Display ${conn.platformName} as your status`)}
                    </span>
                    <Switch
                      checked={conn.displayStatus}
                      onCheckedChange={async (checked) => {
                        await gamesAppsApi.toggleConnectionField(conn.id, 'displayStatus', checked);
                        setUserConnections((prev) =>
                          prev.map((c) =>
                            c.id === conn.id
                              ? { ...c, displayStatus: checked }
                              : c,
                          ),
                        );
                        toast.success(
                          checked
                            ? t(`Status aktivitas ${conn.platformName} aktif`)
                            : t(
                                `Status aktivitas ${conn.platformName} nonaktif`,
                              ),
                        );
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SUB-SECTION 2: AUTHORIZED APPS */}
      <div id="connected-authorized-apps" className="scroll-mt-6 space-y-4 pt-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t('Authorized Apps')}
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            {t(
              "These include third-party services you've given permission to access your Discord account. You can review what each app can do and revoke access anytime.",
            )}
          </p>
        </div>

        {/* Search Installed Apps */}
        <div className="relative pt-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none mt-0.5" />
          <Input
            type="text"
            placeholder={t('Search installed apps')}
            value={authorizedAppSearch}
            onChange={(e) => setAuthorizedAppSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-[#1e1f22] border-border/80 text-foreground"
          />
        </div>

        {/* Authorized App Cards */}
        <div className="space-y-3">
          {authorizedApps
            .filter((a) =>
              a.name
                .toLowerCase()
                .includes(authorizedAppSearch.toLowerCase()),
            )
            .map((app) => {
              const isAboutOpen = expandedAppAbout[app.id] ?? false;
              const isPermsOpen = expandedAppPerms[app.id] ?? false;

              return (
                <div
                  key={app.id}
                  className="rounded-2xl border border-border/80 bg-[#1e1f22] overflow-hidden transition-all"
                >
                  {/* App Header Row */}
                  <div className="p-4 flex items-center justify-between border-b border-border/40">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-[#2b2d31] border border-border/60 flex items-center justify-center text-xl shadow-inner">
                        {app.icon}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground">
                          {app.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {t('Authorized on')} {app.authorizedDate}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  {/* About and Policies Accordion Row */}
                  <div className="border-b border-border/40">
                    <div
                      onClick={() =>
                        setExpandedAppAbout((prev) => ({
                          ...prev,
                          [app.id]: !isAboutOpen,
                        }))
                      }
                      className="p-3.5 flex items-center justify-between hover:bg-muted/20 cursor-pointer transition-colors"
                    >
                      <span className="text-xs font-semibold text-foreground">
                        {t('About and Policies')}
                      </span>
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 text-muted-foreground transition-transform duration-200',
                          isAboutOpen && 'rotate-180',
                        )}
                      />
                    </div>

                    {isAboutOpen && (
                      <div className="px-4 pb-3.5 space-y-2 text-xs text-muted-foreground animate-in fade-in duration-150">
                        <p>{app.aboutInfo}</p>
                        <div>
                          <a
                            href={app.policiesUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#5865F2] hover:underline font-medium inline-flex items-center gap-1"
                          >
                            {t('Terms & Privacy Policy')}
                            <ExternalLink className="w-3 h-3 inline" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Permissions Accordion Row */}
                  <div className="border-b border-border/40">
                    <div
                      onClick={() =>
                        setExpandedAppPerms((prev) => ({
                          ...prev,
                          [app.id]: !isPermsOpen,
                        }))
                      }
                      className="p-3.5 flex items-center justify-between hover:bg-muted/20 cursor-pointer transition-colors"
                    >
                      <div>
                        <span className="text-xs font-semibold text-foreground">
                          {t('Permissions')}
                        </span>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {app.permissionsCount} {t('Permissions enabled')}
                        </div>
                      </div>
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 text-muted-foreground transition-transform duration-200',
                          isPermsOpen && 'rotate-180',
                        )}
                      />
                    </div>

                    {isPermsOpen && (
                      <div className="px-4 pb-3.5 space-y-1.5 animate-in fade-in duration-150">
                        {app.permissionsList.map((perm, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-xs text-foreground/80"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{perm}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Deauthorize Button Footer */}
                  <div className="p-3.5 flex justify-end bg-black/10">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await gamesAppsApi.deauthorizeApp(app.id);
                        setAuthorizedApps((prev) =>
                          prev.filter((a) => a.id !== app.id),
                        );
                        toast.success(t(`Akses untuk ${app.name} telah dicabut`));
                      }}
                      className="text-destructive bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 text-xs font-semibold px-4 h-8 rounded-lg cursor-pointer"
                    >
                      {t('Deauthorize')}
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
