import React, { useState, useMemo } from 'react';
import { ExternalLink, Trash2, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';

export interface RegisteredGame {
  id: string;
  name: string;
  verified: boolean;
  lastPlayed: string;
  enabled: boolean;
  icon?: string;
}

export interface RegisteredGamesSubtabProps {
  onNavigateSection?: (section: string) => void;
}

export function RegisteredGamesSubtab({
  onNavigateSection,
}: RegisteredGamesSubtabProps) {
  const { t } = useTranslation();

  const [registeredGames, setRegisteredGames] = useState<RegisteredGame[]>([
    {
      id: 'terraria',
      name: 'Terraria',
      verified: true,
      lastPlayed: '2 days ago',
      enabled: true,
      icon: '🌳',
    },
  ]);
  const [isAddingGameDropdownOpen, setIsAddingGameDropdownOpen] =
    useState(false);
  const [selectedGameToAdd, setSelectedGameToAdd] = useState('');
  const [customGameInput, setCustomGameInput] = useState('');

  const detectableGamesPreset = useMemo(
    () => [
      { name: 'Minecraft', verified: true, icon: '⛏️' },
      { name: 'Valorant', verified: true, icon: '🎯' },
      { name: 'Visual Studio Code', verified: false, icon: '💻' },
      { name: 'Spotify', verified: true, icon: '🎧' },
      { name: 'Counter-Strike 2', verified: true, icon: '💣' },
      { name: 'Genshin Impact', verified: true, icon: '✨' },
      { name: 'League of Legends', verified: true, icon: '⚔️' },
      { name: 'Grand Theft Auto V', verified: true, icon: '🚗' },
    ],
    [],
  );

  return (
    <div className="space-y-8 divide-y divide-border/50 pb-8">
      {/* SUB-SECTION 1: CURRENT GAME */}
      <div id="registered-current-game" className="scroll-mt-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t('Current Game')}
          </h2>
        </div>

        {/* Box: No game detected */}
        <div className="rounded-xl border border-border/80 bg-[#1e1f22] p-6 text-center space-y-3">
          <div className="text-sm font-semibold text-muted-foreground/80">
            {t('No game detected')}
          </div>
          <div className="text-xs text-muted-foreground">
            {t('Not seeing your game?')}{' '}
            <button
              type="button"
              onClick={() =>
                setIsAddingGameDropdownOpen(!isAddingGameDropdownOpen)
              }
              className="text-[#5865F2] hover:underline font-semibold cursor-pointer"
            >
              {t('Add it!')}
            </button>
          </div>

          {/* Dropdown to add a game */}
          {isAddingGameDropdownOpen && (
            <div className="mt-4 pt-4 border-t border-border/60 max-w-md mx-auto text-left space-y-3 animate-in fade-in zoom-in-95 duration-150">
              <label className="text-xs font-semibold text-foreground">
                {t('Select a game or app to add:')}
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedGameToAdd}
                  onChange={(e) => setSelectedGameToAdd(e.target.value)}
                  className="flex-1 h-9 rounded-lg bg-[#2b2d31] border border-border/80 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#5865F2]"
                >
                  <option value="">{t('Choose a running app...')}</option>
                  {detectableGamesPreset.map((g) => (
                    <option key={g.name} value={g.name}>
                      {g.icon} {g.name}
                    </option>
                  ))}
                  <option value="__custom__">
                    {t('➕ Add Custom Name...')}
                  </option>
                </select>
                <Button
                  size="sm"
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs h-9 px-4 cursor-pointer"
                  onClick={() => {
                    const name =
                      selectedGameToAdd === '__custom__'
                        ? customGameInput.trim()
                        : selectedGameToAdd;
                    if (!name) {
                      toast.error(
                        t('Pilih atau ketik nama game terlebih dahulu'),
                      );
                      return;
                    }
                    const exists = registeredGames.some(
                      (g) => g.name.toLowerCase() === name.toLowerCase(),
                    );
                    if (exists) {
                      toast.info(t('Game sudah ada dalam daftar'));
                      return;
                    }
                    const preset = detectableGamesPreset.find(
                      (p) => p.name === name,
                    );
                    setRegisteredGames((prev) => [
                      ...prev,
                      {
                        id: name.toLowerCase().replace(/\s+/g, '-'),
                        name,
                        verified: preset ? preset.verified : false,
                        lastPlayed: t('Just now'),
                        enabled: true,
                        icon: preset?.icon || '🎮',
                      },
                    ]);
                    setSelectedGameToAdd('');
                    setCustomGameInput('');
                    setIsAddingGameDropdownOpen(false);
                    toast.success(t(`${name} berhasil ditambahkan!`));
                  }}
                >
                  {t('Add Game')}
                </Button>
              </div>

              {selectedGameToAdd === '__custom__' && (
                <Input
                  type="text"
                  placeholder={t('Enter app / game executable name...')}
                  value={customGameInput}
                  onChange={(e) => setCustomGameInput(e.target.value)}
                  className="h-8 text-xs bg-[#2b2d31] border-border/80 text-foreground"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* SUB-SECTION 2: ADDED GAMES */}
      <div id="registered-added-games" className="scroll-mt-6 space-y-4 pt-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t('Added Games')}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {t(
              'Some information about games (such as genre or cover art) is provided by',
            )}{' '}
            <a
              href="https://www.igdb.com"
              target="_blank"
              rel="noreferrer"
              className="text-[#5865F2] hover:underline font-medium inline-flex items-center gap-0.5"
            >
              IGDB
              <ExternalLink className="w-3 h-3 ml-0.5 inline" />
            </a>
            .
          </p>
        </div>

        {/* Games List */}
        <div className="space-y-2">
          {registeredGames.map((game) => (
            <div
              key={game.id}
              className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-[#1e1f22] hover:border-border transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#2b2d31] flex items-center justify-center text-lg shadow-inner">
                  {game.icon || '🎮'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground">
                      {game.name}
                    </span>
                    {game.verified && (
                      <span
                        className="w-3.5 h-3.5 rounded-full bg-[#5865F2] text-white flex items-center justify-center text-[9px] font-bold"
                        title={t('Verified Game')}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {t('Last played')} {game.lastPlayed}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={game.enabled}
                  onCheckedChange={(checked) => {
                    setRegisteredGames((prev) =>
                      prev.map((g) =>
                        g.id === game.id ? { ...g, enabled: checked } : g,
                      ),
                    );
                    toast.success(
                      checked
                        ? t(`Overlay & status untuk ${game.name} diaktifkan`)
                        : t(`Overlay & status untuk ${game.name} dinonaktifkan`),
                    );
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setRegisteredGames((prev) =>
                      prev.filter((g) => g.id !== game.id),
                    );
                    toast.success(t(`${game.name} dihapus dari daftar`));
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all cursor-pointer"
                  title={t('Remove Game')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Related Settings Card */}
        <div className="pt-4 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {t('Related Settings')}
          </div>
          <div
            onClick={() => onNavigateSection?.('activity_privacy')}
            className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-[#1e1f22] hover:bg-[#2b2d31] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-black/30 flex items-center justify-center text-muted-foreground group-hover:text-foreground">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">
                  {t('Activity Privacy')}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {t(
                    'Control who sees activity information from games and connected apps I use.',
                  )}
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </div>
  );
}
