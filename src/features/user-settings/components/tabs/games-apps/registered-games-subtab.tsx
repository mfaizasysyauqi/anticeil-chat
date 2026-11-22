import React, { useState, useEffect, useMemo } from 'react';
import { ExternalLink, Trash2, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { FormDropdown } from '@/components/ui/form-dropdown';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import {
  gamesAppsApi,
  type RegisteredGame,
} from '@/features/user-settings/api/games-apps-api';

export type { RegisteredGame };

export interface RegisteredGamesSubtabProps {
  onNavigateSection?: (section: string) => void;
}

export function RegisteredGamesSubtab({
  onNavigateSection,
}: RegisteredGamesSubtabProps) {
  const { t } = useTranslation();

  const [registeredGames, setRegisteredGames] = useState<RegisteredGame[]>([]);
  const [isAddingGameDropdownOpen, setIsAddingGameDropdownOpen] =
    useState(false);
  const [selectedGameToAdd, setSelectedGameToAdd] = useState('');
  const [customGameInput, setCustomGameInput] = useState('');

  useEffect(() => {
    gamesAppsApi.getRegisteredGames().then(setRegisteredGames);
  }, []);

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
      {/* SUB-SECTION 1: CURRENT APP */}
      <div id="registered-current-game" className="scroll-mt-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t('Current App')}
          </h2>
        </div>

        {/* Box: No app detected */}
        <div className="rounded-xl border border-border/80 bg-card p-6 text-center space-y-3">
          <div className="text-sm font-semibold text-muted-foreground/80">
            {t('No app detected')}
          </div>
          <div className="text-xs text-muted-foreground">
            {t('Not seeing your app?')}{' '}
            <button
              type="button"
              onClick={() =>
                setIsAddingGameDropdownOpen(!isAddingGameDropdownOpen)
              }
              className="text-primary hover:underline font-semibold cursor-pointer"
            >
              {t('Add it!')}
            </button>
          </div>

          {/* Dropdown to add a game */}
          {isAddingGameDropdownOpen && (
            <div className="mt-4 pt-4 border-t border-border/60 max-w-md mx-auto text-left space-y-3 animate-in fade-in zoom-in-95 duration-150">
              <label className="text-xs font-semibold text-foreground">
                {t('Select an app or game to add:')}
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <FormDropdown
                    size="sm"
                    value={selectedGameToAdd}
                    onChange={(val) => setSelectedGameToAdd(val)}
                    placeholder={t('Choose a running app...')}
                    options={[
                      { value: '', label: t('Choose a running app...') },
                      ...detectableGamesPreset.map((g) => ({
                        value: g.name,
                        label: `${g.icon} ${g.name}`,
                      })),
                      { value: '__custom__', label: t('➕ Add Custom Name...') },
                    ]}
                  />
                </div>
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9 px-4 cursor-pointer"
                  onClick={async () => {
                    const name =
                      selectedGameToAdd === '__custom__'
                        ? customGameInput.trim()
                        : selectedGameToAdd;
                    if (!name) {
                      toast.error(
                        t('Pilih atau ketik nama aplikasi terlebih dahulu'),
                      );
                      return;
                    }
                    const exists = registeredGames.some(
                      (g) => g.name.toLowerCase() === name.toLowerCase(),
                    );
                    if (exists) {
                      toast.info(t('Aplikasi sudah ada dalam daftar'));
                      return;
                    }
                    const preset = detectableGamesPreset.find(
                      (p) => p.name === name,
                    );
                    const newGame = await gamesAppsApi.addGame(
                      name,
                      preset?.icon || '🎮',
                      preset ? preset.verified : false,
                    );
                    setRegisteredGames((prev) => [newGame, ...prev]);
                    setSelectedGameToAdd('');
                    setCustomGameInput('');
                    setIsAddingGameDropdownOpen(false);
                    toast.success(t(`${name} berhasil ditambahkan!`));
                  }}
                >
                  {t('Add App')}
                </Button>
              </div>

              {selectedGameToAdd === '__custom__' && (
                <Input
                  type="text"
                  placeholder={t('Enter app / game executable name...')}
                  value={customGameInput}
                  onChange={(e) => setCustomGameInput(e.target.value)}
                  className="h-8 text-xs bg-muted/40 border-border/80 text-foreground"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* SUB-SECTION 2: ADDED APPS */}
      <div id="registered-added-games" className="scroll-mt-6 space-y-4 pt-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t('Added Apps')}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {t(
              'Some information about games (such as genre or cover art) is provided by',
            )}{' '}
            <a
              href="https://www.igdb.com"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
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
              className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-card hover:border-border transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center text-lg shadow-inner">
                  {game.icon || '🎮'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground">
                      {game.name}
                    </span>
                    {game.verified && (
                      <span
                        className="w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px] font-bold"
                        title={t('Verified App')}
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
                  onCheckedChange={async (checked) => {
                    await gamesAppsApi.toggleGameOverlay(game.id, checked);
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
                  onClick={async () => {
                    await gamesAppsApi.removeGame(game.id);
                    setRegisteredGames((prev) =>
                      prev.filter((g) => g.id !== game.id),
                    );
                    toast.success(t(`${game.name} dihapus dari daftar`));
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all cursor-pointer"
                  title={t('Remove App')}
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
            className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-card hover:bg-muted/40 transition-colors cursor-pointer group"
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
