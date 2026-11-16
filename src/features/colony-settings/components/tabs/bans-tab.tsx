import React, { useState, useMemo } from 'react';
import { Search, Ban, UserX, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { toast } from 'sonner';
import { colonyApi } from '@/chat/chat-api';
import type { Colony, ColonyBan } from '@/chat/chat-types';

interface BansTabProps {
  activeColony: Colony;
  serverBans: ColonyBan[];
  setServerBans: React.Dispatch<React.SetStateAction<ColonyBan[]>>;
  onNavigateSection?: (section: string) => void;
  t: (key: string) => string;
}

export function BansTab({
  activeColony,
  serverBans,
  setServerBans,
  onNavigateSection,
  t,
}: BansTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const filteredBans = useMemo(() => {
    if (!searchQuery.trim()) return serverBans;
    const q = searchQuery.toLowerCase().trim();
    return serverBans.filter(
      (b) =>
        b.userName.toLowerCase().includes(q) ||
        (b.userEmail && b.userEmail.toLowerCase().includes(q)) ||
        b.userId.toLowerCase().includes(q)
    );
  }, [serverBans, searchQuery]);

  const handleRevokeBan = async (ban: ColonyBan) => {
    try {
      setServerBans((prev) => prev.filter((b) => b.id !== ban.id));
      await colonyApi.unbanUser(activeColony.id, ban.userId);
      toast.success(t(`Blokir untuk ${ban.userName} telah dicabut! ✅`));
    } catch {
      toast.info(t(`Blokir untuk ${ban.userName} telah dicabut.`));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* ── Header (Screenshot 3 Discord Parity) ── */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-foreground">
          {t('Server Ban List')}
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t(
            'Bans by default are by account and IP. A user can circumvent an IP ban by using a proxy. Ban circumvention can be made very hard by enabling phone verification in'
          )}{' '}
          <button
            type="button"
            onClick={() => onNavigateSection?.('safety-setup')}
            className="text-blue-400 hover:underline font-semibold cursor-pointer"
          >
            {t('Safety Setup')}
          </button>
          .
        </p>
      </div>

      {/* ── Search Bar ── */}
      <div className="flex items-center gap-2 max-w-lg">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Search Bans by User Id or Username')}
            className="h-9 pl-9 text-xs bg-[#1e1f22] border-border/70 text-foreground placeholder:text-muted-foreground rounded-lg focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
        <Button
          type="button"
          onClick={() => {
            setIsSearching(true);
            setTimeout(() => setIsSearching(false), 300);
          }}
          className="h-9 px-5 text-xs font-semibold bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg cursor-pointer shrink-0"
        >
          {t('Search')}
        </Button>
      </div>

      {/* ── Main Container (Empty state or List) ── */}
      <div className="rounded-xl border border-border/70 bg-[#1e1f22] overflow-hidden shadow-xl min-h-[380px] flex flex-col justify-center">
        {filteredBans.length === 0 ? (
          /* Empty State matching Screenshot 3 */
          <div className="p-12 md:p-16 flex flex-col items-center justify-center text-center space-y-4">
            {/* Stylized Discord Ban Hammer SVG */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
              <svg className="w-28 h-28 drop-shadow-lg" viewBox="0 0 120 120" fill="none">
                {/* Speed / impact action lines */}
                <path d="M25 45L12 40" stroke="#4e5058" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M30 65L15 68" stroke="#4e5058" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M85 20L95 10" stroke="#4e5058" strokeWidth="2.5" strokeLinecap="round" />

                {/* Dark silhouette cloud under hammer */}
                <path
                  d="M20 75C20 65 35 60 45 62C55 58 75 60 85 70C95 72 105 80 100 90C95 98 75 100 60 98C45 100 25 95 20 85Z"
                  fill="#18191c"
                  opacity="0.85"
                />

                {/* Wooden / Metal Handle */}
                <rect
                  x="30"
                  y="75"
                  width="10"
                  height="40"
                  rx="3"
                  transform="rotate(-45 30 75)"
                  fill="#4e5058"
                />
                <rect
                  x="33"
                  y="78"
                  width="4"
                  height="34"
                  rx="1.5"
                  transform="rotate(-45 33 78)"
                  fill="#35373c"
                />

                {/* Hammer Head */}
                <rect
                  x="58"
                  y="26"
                  width="44"
                  height="26"
                  rx="6"
                  transform="rotate(-45 58 26)"
                  fill="#5c5f66"
                />
                {/* Metal plate face */}
                <rect
                  x="64"
                  y="32"
                  width="32"
                  height="14"
                  rx="3"
                  transform="rotate(-45 64 32)"
                  fill="#80848e"
                />
                {/* Screw rivets on hammer face */}
                <circle cx="68" cy="46" r="1.8" fill="#2b2d31" />
                <circle cx="82" cy="32" r="1.8" fill="#2b2d31" />
              </svg>
            </div>

            <div className="space-y-1.5 max-w-sm">
              <h3 className="text-base font-bold text-foreground">
                {searchQuery ? t('No Bans Found') : t('No Bans')}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {searchQuery
                  ? t(`Tidak ada pengguna diblokir yang cocok dengan "${searchQuery}".`)
                  : t("You haven't banned anybody... but if and when you must, do not hesitate!")}
              </p>
            </div>
          </div>
        ) : (
          /* Banned Members List */
          <div className="divide-y divide-border/60">
            {filteredBans.map((ban) => (
              <div
                key={ban.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                    <Ban className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground truncate">
                        {ban.userName}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        ID: {ban.userId}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      <span className="font-semibold text-foreground/80">
                        {t('Reason')}:
                      </span>{' '}
                      {ban.reason || t('Melanggar aturan komunitas')}
                      {ban.bannedByName && ` • ${t('oleh')} ${ban.bannedByName}`}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRevokeBan(ban)}
                  className="h-8 px-3.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/30 rounded-lg cursor-pointer shrink-0"
                >
                  {t('Revoke Ban')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
