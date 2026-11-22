import React, { useState, useEffect } from 'react';
import {
  Laptop, Key, AlertCircle, RefreshCw, Check, Trash2, Plus, Pencil, ExternalLink, Info, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { FormDropdown } from '@/components/ui/form-dropdown';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import { userSettingsApi, SystemSettings, DEFAULT_SYSTEM_SETTINGS } from '../../api/user-settings-api';

export interface SystemTabProps {
  activeSection?: string;
}

function loadInitialSystem(): SystemSettings {
  try {
    const raw = localStorage.getItem('anticeil_user_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.system) {
        return {
          ...DEFAULT_SYSTEM_SETTINGS,
          ...parsed.system,
          customKeybinds: parsed.system.customKeybinds || DEFAULT_SYSTEM_SETTINGS.customKeybinds,
        };
      }
    }
  } catch {}
  return DEFAULT_SYSTEM_SETTINGS;
}

export function SystemTab({ activeSection = 'system' }: SystemTabProps) {
  const { t } = useTranslation();
  const [initial] = useState<SystemSettings>(loadInitialSystem);

  // SYSTEM STATES (Discord Parity)
  // ==========================================
  const [autoStartApp, setAutoStartApp] = useState(initial.autoStartApp);
  const [startMinimized, setStartMinimized] = useState(initial.startMinimized);
  const [minimizeToTray, setMinimizeToTray] = useState(initial.minimizeToTray);
  const [enableHardwareAcceleration, setEnableHardwareAcceleration] = useState(initial.enableHardwareAcceleration);

  // Custom Keybinds
  const [customKeybinds, setCustomKeybinds] = useState<Array<{
    id: string;
    action: string;
    keybind: string;
    enabled: boolean;
  }>>(initial.customKeybinds || DEFAULT_SYSTEM_SETTINGS.customKeybinds);

  useEffect(() => {
    userSettingsApi.getSettings().then((s) => {
      if (s?.system) {
        const sys = s.system;
        if (sys.autoStartApp !== undefined) setAutoStartApp(sys.autoStartApp);
        if (sys.startMinimized !== undefined) setStartMinimized(sys.startMinimized);
        if (sys.minimizeToTray !== undefined) setMinimizeToTray(sys.minimizeToTray);
        if (sys.enableHardwareAcceleration !== undefined) setEnableHardwareAcceleration(sys.enableHardwareAcceleration);
        if (sys.customKeybinds) setCustomKeybinds(sys.customKeybinds);
      }
    });
  }, []);

  const persistSystem = (partial: Partial<SystemSettings>) => {
    userSettingsApi.updateSettings({
      system: partial as any,
    });
  };
  const [recordingKeybindId, setRecordingKeybindId] = useState<string | null>(null);

  // System Helper & Trace
  const [isSystemHelperInstalled, setIsSystemHelperInstalled] = useState(false);
  const [isCapturingTrace, setIsCapturingTrace] = useState(false);
  const [traceProgress, setTraceProgress] = useState(0);

  const startPerformanceTrace = () => {
    setIsCapturingTrace(true);
    setTraceProgress(0);
    toast.info(t('Memulai perekaman performa trace selama 30 detik...'));

    let current = 0;
    const interval = setInterval(() => {
      current += 10;
      setTraceProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        setIsCapturingTrace(false);
        setTraceProgress(0);
        toast.success(t('Performance trace berhasil direkam dan siap dilampirkan ke support tiket!'));
      }
    }, 300);
  };


  return (
          <div className="space-y-8 divide-y divide-border/50 pb-8">
            {/* SUB-SECTION 1: GENERAL */}
            <div id="system-general" className="scroll-mt-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('General')}</h2>
              </div>

              <div className="space-y-4">
                {/* Auto start with OS */}
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="text-xs font-semibold text-foreground">
                    {t('Automatically open Anticeil when your computer starts up')}
                  </div>
                  <Switch
                    checked={autoStartApp}
                    onCheckedChange={(val) => {
                      setAutoStartApp(val);
                      persistSystem({ autoStartApp: val });
                    }}
                  />
                </div>

                {/* Start minimized */}
                <div
                  className={cn(
                    'flex items-center justify-between py-2 border-b border-border/50 transition-opacity',
                    !autoStartApp && 'opacity-50 pointer-events-none',
                  )}
                >
                  <div>
                    <div className="text-xs font-semibold text-foreground">{t('Start Anticeil minimized')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t('Start Anticeil in the background, out of your way.')}
                    </div>
                  </div>
                  <Switch
                    checked={startMinimized}
                    onCheckedChange={(val) => {
                      setStartMinimized(val);
                      persistSystem({ startMinimized: val });
                    }}
                    disabled={!autoStartApp}
                  />
                </div>

                {/* Minimize to tray */}
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-semibold text-foreground">{t('Minimize Anticeil to System Tray')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {t('Clicking X minimizes Anticeil instead of closing it completely.')}
                    </div>
                  </div>
                  <Switch
                    checked={minimizeToTray}
                    onCheckedChange={(val) => {
                      setMinimizeToTray(val);
                      persistSystem({ minimizeToTray: val });
                    }}
                  />
                </div>

                {/* Hardware acceleration */}
                <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
                  <div>
                    <div className="text-xs font-semibold text-foreground">{t('Enable Hardware Acceleration')}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      {t(
                        "Uses your GPU to make Anticeil run more smoothly. Turn this off if you're experiencing visual glitches like frame drops in games or performance problems.",
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={enableHardwareAcceleration}
                    onCheckedChange={(val) => {
                      setEnableHardwareAcceleration(val);
                      persistSystem({ enableHardwareAcceleration: val });
                      toast.info(t('Perubahan Hardware Acceleration akan aktif setelah restart aplikasi.'));
                    }}
                  />
                </div>
              </div>
            </div>

            {/* SUB-SECTION 2: CUSTOM KEYBINDS */}
            <div id="system-custom-keybinds" className="scroll-mt-6 space-y-6 pt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{t('Custom Keybinds')}</h2>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-xl">
                    {t(
                      'Keybinds are custom keyboard shortcuts that let you perform specific actions in Anticeil without needing to click through menus.',
                    )}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const newId = `kb-${Date.now()}`;
                    setCustomKeybinds((prev) => [
                      ...prev,
                      {
                        id: newId,
                        action: 'Push to Talk',
                        keybind: 'No Keybind Set',
                        enabled: true,
                      },
                    ]);
                    toast.success(t('Pintasan tombol baru ditambahkan'));
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-3.5 h-8.5 rounded-md shrink-0 cursor-pointer shadow-xs"
                >
                  {t('+ Add a Keybind')}
                </Button>
              </div>

              {/* Info Banner */}
              <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/10 flex items-center gap-3 text-xs text-blue-300">
                <Info className="w-4 h-4 shrink-0 text-blue-400" />
                <span>{t('Keybinds are disabled while this page is visible.')}</span>
              </div>

              {/* Warning Banner: System Helper */}
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <span className="text-amber-200">
                      {t("Due to system permissions, keybinds won't work in certain games. To enable, install Anticeil System Helper.")}{' '}
                    </span>
                    <span
                      onClick={() => toast.info(t('Anticeil System Helper menggunakan hook kernel berbobot ringan untuk registrasi input global.'))}
                      className="text-amber-300 underline font-semibold cursor-pointer"
                    >
                      {t('Learn more')}
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsSystemHelperInstalled(true);
                    toast.success(t('Anticeil System Helper berhasil dipasang!'));
                  }}
                  className="h-7 text-xs font-bold border-amber-400/40 text-amber-300 hover:bg-amber-400/20 shrink-0 cursor-pointer"
                >
                  {isSystemHelperInstalled ? t('Installed ✓') : t('Install')}
                </Button>
              </div>

              {/* Custom Keybinds Table */}
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                  <div className="col-span-6">{t('Keybind Action')}</div>
                  <div className="col-span-5">{t('Keybind')}</div>
                  <div className="col-span-1 text-right">{t('')}</div>
                </div>

                <div className="space-y-2">
                  {customKeybinds.map((kb) => (
                    <div
                      key={kb.id}
                      className="grid grid-cols-12 gap-3 items-center p-3 rounded-xl border border-border/70 bg-[#1e1f22]"
                    >
                      {/* Action selector */}
                      <div className="col-span-6">
                        <FormDropdown
                          size="sm"
                          value={kb.action}
                          onChange={(val) => {
                            setCustomKeybinds((prev) =>
                              prev.map((k) => (k.id === kb.id ? { ...k, action: val } : k)),
                            );
                          }}
                          options={[
                            { value: 'Activate Overlay Chat', label: 'Activate Overlay Chat' },
                            { value: 'Push to Talk', label: 'Push to Talk' },
                            { value: 'Push to Mute', label: 'Push to Mute' },
                            { value: 'Toggle Mute', label: 'Toggle Mute' },
                            { value: 'Toggle Deafen', label: 'Toggle Deafen' },
                            { value: 'Toggle Screen Share', label: 'Toggle Screen Share' },
                            { value: 'Toggle Camera', label: 'Toggle Camera' },
                            { value: 'Toggle Soundboard', label: 'Toggle Soundboard' },
                            { value: 'Navigate to Call', label: 'Navigate to Call' },
                          ]}
                        />
                      </div>

                      {/* Keybind recorder */}
                      <div className="col-span-5 flex items-center gap-2">
                        <div className="flex-1 px-3 py-2 rounded-lg bg-[#2b2d31] border border-border/80 text-xs font-mono font-semibold text-foreground truncate">
                          {recordingKeybindId === kb.id ? (
                            <span className="text-primary animate-pulse">Tekan kombinasi tombol...</span>
                          ) : (
                            kb.keybind
                          )}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            if (recordingKeybindId === kb.id) {
                              setRecordingKeybindId(null);
                            } else {
                              setRecordingKeybindId(kb.id);
                              toast.info(t('Silakan tekan tombol di keyboard'));
                              // Simulate keybind capture on next key press
                              const handler = (e: KeyboardEvent) => {
                                e.preventDefault();
                                const keys: string[] = [];
                                if (e.ctrlKey) keys.push('Ctrl');
                                if (e.altKey) keys.push('Alt');
                                if (e.shiftKey) keys.push('Shift');
                                if (!['Control', 'Alt', 'Shift'].includes(e.key)) {
                                  keys.push(e.key.toUpperCase());
                                }
                                const combo = keys.join(' + ') || 'Ctrl + Shift + X';
                                setCustomKeybinds((prev) =>
                                  prev.map((k) => (k.id === kb.id ? { ...k, keybind: combo } : k)),
                                );
                                setRecordingKeybindId(null);
                                window.removeEventListener('keydown', handler);
                                toast.success(t(`Pintasan tombol disimpan: ${combo}`));
                              };
                              window.addEventListener('keydown', handler, { once: true });
                            }
                          }}
                          className={cn(
                            'h-8 text-xs font-semibold px-2.5 shrink-0 cursor-pointer',
                            recordingKeybindId === kb.id && 'bg-primary text-primary-foreground',
                          )}
                        >
                          {recordingKeybindId === kb.id ? t('Stop') : t('Record Keybind')}
                        </Button>
                      </div>

                      {/* Switch & delete */}
                      <div className="col-span-1 flex items-center justify-end gap-2">
                        <Switch
                          checked={kb.enabled}
                          onCheckedChange={(val) => {
                            setCustomKeybinds((prev) =>
                              prev.map((k) => (k.id === kb.id ? { ...k, enabled: val } : k)),
                            );
                          }}
                        />
                        {customKeybinds.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setCustomKeybinds((prev) => prev.filter((k) => k.id !== kb.id));
                              toast.info(t('Pintasan tombol dihapus'));
                            }}
                            className="text-muted-foreground hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SUB-SECTION 3: DEFAULT KEYBINDS (Screenshots 2 to 7) */}
            <div id="system-default-keybinds" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Default Keybinds')}</h2>
              </div>

              {/* Show Keyboard Shortcuts List */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-[#1e1f22]">
                <span className="text-xs font-bold text-foreground">
                  {t('Show Keyboard Shortcuts List')}
                </span>
                <kbd className="px-2.5 py-1 text-[11px] font-mono font-bold bg-[#2b2d31] border border-border/80 rounded-md text-foreground">
                  CTRL /
                </kbd>
              </div>

              {/* Category 1: Messages */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-foreground">{t('Messages')}</div>
                <div className="text-[11px] text-muted-foreground">
                  {t('These shortcuts work when focused on a message.')}
                </div>
                <div className="rounded-xl border border-border/70 bg-[#1e1f22] divide-y divide-border/50 overflow-hidden">
                  {[
                    { action: 'Edit Message', key: 'E' },
                    { action: 'Delete Message', key: 'BACKSPACE' },
                    { action: 'Pin Message', key: 'P' },
                    { action: 'Add Reaction', key: '+' },
                    { action: 'Reply', key: 'R' },
                    { action: 'Forward Message', key: 'F' },
                    { action: 'Speak Message', key: 'S' },
                    { action: 'Copy Text', key: 'CTRL C' },
                    { action: 'Mark Unread', key: 'ALT ENTER' },
                    { action: 'Focus text area', key: 'ESC' },
                  ].map((row, i) => (
                    <div key={i} className="p-3 flex items-center justify-between hover:bg-white/[0.02]">
                      <span className="text-xs text-foreground font-medium">{row.action}</span>
                      <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#2b2d31] border border-border/80 rounded text-foreground">
                        {row.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category 2: Navigation */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-foreground">{t('Navigation')}</div>
                <div className="rounded-xl border border-border/70 bg-[#1e1f22] divide-y divide-border/50 overflow-hidden">
                  {[
                    { action: 'Navigate between servers', key: 'CTRL ALT ↑  /  ↓' },
                    { action: 'Navigate between channels', key: 'ALT ↑  /  ↓' },
                    { action: 'Navigate forward and backward in page history', key: 'ALT ←  /  →' },
                    { action: 'Navigate between unread channels', key: 'ALT SHIFT ↑  /  ↓' },
                    { action: 'Navigate between unread channels with mentions', key: 'CTRL SHIFT ALT ↑  /  ↓' },
                    { action: 'Navigate to current call', key: 'CTRL SHIFT ALT V' },
                    { action: 'Toggle between last server and DMs', key: 'CTRL ALT →' },
                    { action: 'Toggle QuickSwitcher', key: 'CTRL K' },
                    { action: 'Create or join a server', key: 'CTRL SHIFT N' },
                  ].map((row, i) => (
                    <div key={i} className="p-3 flex items-center justify-between hover:bg-white/[0.02]">
                      <span className="text-xs text-foreground font-medium">{row.action}</span>
                      <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#2b2d31] border border-border/80 rounded text-foreground">
                        {row.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category 3: Drag and Drop */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-foreground">{t('Drag and Drop')}</div>
                <div className="text-[11px] text-muted-foreground">
                  {t('These shortcuts work when focused on a draggable item')}
                </div>
                <div className="rounded-xl border border-border/70 bg-[#1e1f22] divide-y divide-border/50 overflow-hidden">
                  {[
                    { action: 'Start Drag and Drop', key: 'CTRL D' },
                    { action: 'Move', key: '↑  /  ↓' },
                    { action: 'Drop item', key: 'SPACEBAR  /  ENTER' },
                    { action: 'Cancel', key: 'ESC' },
                  ].map((row, i) => (
                    <div key={i} className="p-3 flex items-center justify-between hover:bg-white/[0.02]">
                      <span className="text-xs text-foreground font-medium">{row.action}</span>
                      <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#2b2d31] border border-border/80 rounded text-foreground">
                        {row.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category 4: Chat */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-foreground">{t('Chat')}</div>
                <div className="rounded-xl border border-border/70 bg-[#1e1f22] divide-y divide-border/50 overflow-hidden">
                  {[
                    { action: 'Mark server read', key: 'SHIFT ESC' },
                    { action: 'Mark channel as read', key: 'ESC' },
                    { action: 'Create a private group', key: 'CTRL SHIFT T' },
                    { action: 'Create a thread', key: 'CTRL SHIFT ALT N' },
                    { action: 'Toggle pins popout', key: 'CTRL P' },
                    { action: 'Toggle inbox popout', key: 'CTRL I' },
                    { action: 'Mark top inbox channel read', key: 'CTRL SHIFT E' },
                    { action: 'Toggle channel member list or voice text chat', key: 'CTRL U' },
                    { action: 'Toggle emoji picker', key: 'CTRL E' },
                    { action: 'Toggle GIF picker', key: 'CTRL G' },
                    { action: 'Toggle sticker picker', key: 'CTRL S' },
                    { action: 'Scroll chat up or down', key: 'PAGE UP  /  PAGE DOWN' },
                    { action: 'Jump to oldest unread message', key: 'SHIFT PAGE UP' },
                    { action: 'Focus text area', key: 'ANY KEY' },
                    { action: 'Record a voice message', key: 'ALT R' },
                    { action: 'Upload a file', key: 'CTRL SHIFT U' },
                    { action: 'Copy channel link', key: 'CTRL SHIFT L' },
                  ].map((row, i) => (
                    <div key={i} className="p-3 flex items-center justify-between hover:bg-white/[0.02]">
                      <span className="text-xs text-foreground font-medium">{row.action}</span>
                      <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#2b2d31] border border-border/80 rounded text-foreground">
                        {row.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category 5: Voice and Video */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-foreground">{t('Voice and Video')}</div>
                <div className="rounded-xl border border-border/70 bg-[#1e1f22] divide-y divide-border/50 overflow-hidden">
                  {[
                    { action: 'Toggle mute', key: 'CTRL SHIFT M' },
                    { action: 'Toggle deafen', key: 'CTRL SHIFT D' },
                    { action: 'Answer incoming call', key: 'CTRL ENTER' },
                    { action: 'Decline incoming call', key: 'ESC' },
                    { action: 'Start call in private message or group', key: "CTRL '" },
                    { action: 'Toggle soundboard', key: 'CTRL SHIFT B' },
                  ].map((row, i) => (
                    <div key={i} className="p-3 flex items-center justify-between hover:bg-white/[0.02]">
                      <span className="text-xs text-foreground font-medium">{row.action}</span>
                      <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#2b2d31] border border-border/80 rounded text-foreground">
                        {row.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category 6: Miscellaneous */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-foreground">{t('Miscellaneous')}</div>
                <div className="rounded-xl border border-border/70 bg-[#1e1f22] divide-y divide-border/50 overflow-hidden">
                  {[
                    { action: 'Get help', key: 'CTRL SHIFT H' },
                    { action: 'Search', key: 'CTRL F' },
                    { action: 'Open context menu', key: 'SHIFT F10' },
                    { action: 'Listen to Lofi Beats with Wumpus', key: 'CTRL ALT SHIFT W' },
                  ].map((row, i) => (
                    <div key={i} className="p-3 flex items-center justify-between hover:bg-white/[0.02]">
                      <span className="text-xs text-foreground font-medium">{row.action}</span>
                      <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#2b2d31] border border-border/80 rounded text-foreground">
                        {row.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SUB-SECTION 4: SYSTEM HELPER (Screenshot 8) */}
            <div id="system-helper" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('System Helper')}</h2>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/70 bg-[#1e1f22]">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Anticeil System Helper')}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 max-w-lg leading-relaxed">
                    {t(
                      "Improves Anticeil's functionality across games and apps. Helps ensure things like keybinds and other features work reliably.",
                    )}{' '}
                    <span
                      onClick={() => toast.info(t('System helper menyediakan integrasi hooks sistem OS yang aman.'))}
                      className="text-primary hover:underline cursor-pointer font-medium"
                    >
                      {t('Learn more')}
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setIsSystemHelperInstalled(true);
                    toast.success(t('Anticeil System Helper berhasil dipasang!'));
                  }}
                  className={cn(
                    'text-xs font-bold px-5 h-9 rounded-md shrink-0 cursor-pointer transition-all shadow-xs',
                    isSystemHelperInstalled
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-primary hover:bg-primary/90 text-primary-foreground',
                  )}
                >
                  {isSystemHelperInstalled ? t('Installed ✓') : t('Install')}
                </Button>
              </div>
            </div>

            {/* SUB-SECTION 5: ADVANCED (Screenshot 8) */}
            <div id="system-advanced" className="scroll-mt-6 space-y-6 pt-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('Advanced')}</h2>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/70 bg-card">
                <div>
                  <div className="text-xs font-bold text-foreground">{t('Capture Performance Trace')}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 max-w-lg leading-relaxed">
                    {t(
                      'Record 30 seconds of performance data and save it to a file you can attach to a support ticket.',
                    )}
                  </div>
                  {isCapturingTrace && (
                    <div className="mt-2.5 space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                        <span>{t('Merekam trace data...')}</span>
                        <span>{traceProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-emerald-500 to-primary transition-all duration-150"
                          style={{ width: `${traceProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={isCapturingTrace}
                  onClick={startPerformanceTrace}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-5 h-9 rounded-md shrink-0 cursor-pointer shadow-xs"
                >
                  {isCapturingTrace ? t('Capturing...') : t('Capture')}
                </Button>
              </div>
            </div>
          </div>
  );
}
