import React from 'react';
import { Search, ChevronDown, ChevronRight, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FormDropdown } from '@/components/ui/form-dropdown';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ActivityServerItem } from './activity-privacy-subtab';

interface ActivityColonyListSectionProps {
  shareServerScope: 'all' | 'small' | 'none';
  setShareServerScope: (scope: 'all' | 'small' | 'none') => void;
  activityServerSearch: string;
  setActivityServerSearch: (val: string) => void;
  activityServerSortOrder: 'order' | 'name' | 'members';
  setActivityServerSortOrder: (order: 'order' | 'name' | 'members') => void;
  handleToggleAllServers: () => void;
  isAnyServerActivityOn: boolean;
  primaryActivityServers: ActivityServerItem[];
  secondaryActivityServers: ActivityServerItem[];
  serverActivityEnabledMap: Record<string, boolean>;
  setServerActivityEnabledMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  showMoreActivityServers: boolean;
  setShowMoreActivityServers: React.Dispatch<React.SetStateAction<boolean>>;
  onNavigateSection?: (section: string) => void;
  t: (key: string) => string;
}

export type ActivityServerListSectionProps = ActivityColonyListSectionProps;

export function ActivityColonyListSection({
  shareServerScope,
  setShareServerScope,
  activityServerSearch,
  setActivityServerSearch,
  activityServerSortOrder,
  setActivityServerSortOrder,
  handleToggleAllServers,
  isAnyServerActivityOn,
  primaryActivityServers,
  secondaryActivityServers,
  serverActivityEnabledMap,
  setServerActivityEnabledMap,
  showMoreActivityServers,
  setShowMoreActivityServers,
  onNavigateSection,
  t,
}: ActivityServerListSectionProps) {
  return (
    <div id="activity-where-i-share" className="scroll-mt-6 space-y-4 pt-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">
          {t('Where I Share Activity')}
        </h2>
        <div className="text-xs font-semibold text-foreground mt-2">
          {t('Automatically share my activity when joining a colony')}
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5">
          {t('Your activity is always shared with your friends.')}
        </div>
      </div>

      {/* Radio Options */}
      <div className="space-y-2.5 pt-1">
        {[
          { id: 'all', title: t('Share in all colonies') },
          {
            id: 'small',
            title: t('Share in colonies with 200 or fewer members'),
          },
          { id: 'none', title: t('Do not share in any colonies') },
        ].map((opt) => {
          const isSelected = shareServerScope === opt.id;
          return (
            <div
              key={opt.id}
              onClick={() => {
                setShareServerScope(opt.id as any);
                toast.success(t(`Pengaturan colony diubah: ${opt.title}`));
              }}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer',
                isSelected
                  ? 'bg-primary/5 border-primary'
                  : 'bg-card border-border/70 hover:bg-muted/30',
              )}
            >
              <div
                className={cn(
                  'size-4 rounded-full border-2 flex items-center justify-center transition-all',
                  isSelected
                    ? 'border-primary'
                    : 'border-muted-foreground/50',
                )}
              >
                {isSelected && (
                  <div className="size-2 rounded-full bg-primary" />
                )}
              </div>
              <span className="text-xs font-semibold text-foreground">
                {opt.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Search my colonies Input */}
      <div className="relative pt-2">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none mt-1" />
        <Input
          type="text"
          placeholder={t('Search my colonies')}
          value={activityServerSearch}
          onChange={(e) => setActivityServerSearch(e.target.value)}
          className="pl-9 h-9 text-xs bg-muted/40 border-border/80 text-foreground"
        />
      </div>

      {/* Colony List Controls: Order & Toggle All Off */}
      <div className="flex items-center justify-between pt-1 text-xs gap-3">
        <div className="w-44">
          <FormDropdown
            size="xs"
            value={activityServerSortOrder}
            onChange={(val) => setActivityServerSortOrder(val as any)}
            options={[
              { value: 'order', label: t('Colony Order') },
              { value: 'name', label: t('Colony Name') },
              { value: 'members', label: t('Member Count') },
            ]}
          />
        </div>
        <button
          type="button"
          onClick={handleToggleAllServers}
          className="text-primary hover:underline font-semibold cursor-pointer text-xs shrink-0"
        >
          {isAnyServerActivityOn
            ? t('Toggle All Off')
            : t('Toggle All On')}
        </button>
      </div>

      {/* Primary Colonies List */}
      <div className="space-y-2">
        {primaryActivityServers.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-border/70 text-center text-xs text-muted-foreground bg-card/50">
            {activityServerSearch.trim()
              ? t('Tidak ada colony yang cocok dengan pencarian.')
              : t('Belum ada colony yang diikuti.')}
          </div>
        ) : (
          primaryActivityServers.map((server) => {
            const isShared =
              serverActivityEnabledMap[server.id] !== undefined
                ? serverActivityEnabledMap[server.id]
                : shareServerScope === 'none'
                ? false
                : shareServerScope === 'small'
                ? server.members <= 200
                : true;

            return (
              <div
                key={server.id}
                className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-card hover:border-border transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-xs text-primary shrink-0 overflow-hidden">
                    {server.iconUrl ? (
                      <img
                        src={server.iconUrl}
                        alt={server.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      server.avatarFallback
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-foreground truncate">
                      {server.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {server.members.toLocaleString()} {t('members')}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={isShared}
                  onCheckedChange={(checked) => {
                    setServerActivityEnabledMap((prev) => ({
                      ...prev,
                      [server.id]: checked,
                    }));
                    toast.success(
                      checked
                        ? t(`Aktivitas dibagikan ke ${server.name}`)
                        : t(`Aktivitas tidak dibagikan ke ${server.name}`),
                    );
                  }}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Show more colonies Accordion */}
      {secondaryActivityServers.length > 0 && (
        <div className="space-y-2">
          <div
            onClick={() =>
              setShowMoreActivityServers(!showMoreActivityServers)
            }
            className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-card hover:bg-muted/40 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary shadow-inner">
                +{secondaryActivityServers.length}
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">
                  {showMoreActivityServers
                    ? t('Hide additional colonies')
                    : t(`Show ${secondaryActivityServers.length} more colonies`)}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {secondaryActivityServers.slice(0, 3).map((s) => s.name).join(', ')}
                  {secondaryActivityServers.length > 3 ? `, and +${secondaryActivityServers.length - 3} more` : ''}
                </div>
              </div>
            </div>
            <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:text-foreground">
              <ChevronDown
                className={cn(
                  'w-4 h-4 transition-transform duration-200',
                  showMoreActivityServers && 'rotate-180',
                )}
              />
            </div>
          </div>

          {/* Expanded secondary colonies list */}
          {showMoreActivityServers && (
            <div className="space-y-2 pl-2 border-l-2 border-border/40 animate-in fade-in duration-150">
              {secondaryActivityServers.map((server) => {
                const isShared =
                  serverActivityEnabledMap[server.id] !== undefined
                    ? serverActivityEnabledMap[server.id]
                    : shareServerScope === 'none'
                    ? false
                    : shareServerScope === 'small'
                    ? server.members <= 200
                    : true;
                return (
                  <div
                    key={server.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-card hover:border-border transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs text-foreground shrink-0 overflow-hidden">
                        {server.iconUrl ? (
                          <img
                            src={server.iconUrl}
                            alt={server.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          server.avatarFallback
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-foreground truncate">
                          {server.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {server.members.toLocaleString()} {t('members')}
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={isShared}
                      onCheckedChange={(checked) => {
                        setServerActivityEnabledMap((prev) => ({
                          ...prev,
                          [server.id]: checked,
                        }));
                        toast.success(
                          checked
                            ? t(`Aktivitas dibagikan ke ${server.name}`)
                            : t(
                                `Aktivitas tidak dibagikan ke ${server.name}`,
                              ),
                        );
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Related Settings Card leading to Data & Privacy */}
      <div className="pt-2 space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {t('Related Settings')}
        </div>
        <div
          onClick={() => onNavigateSection?.('privacy')}
          className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-card hover:bg-muted/40 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">
                {t('Data & Privacy')}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {t('Manage your data, personalization, and discovery options')}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </div>
    </div>
  );
}

export const ActivityServerListSection = ActivityColonyListSection;
