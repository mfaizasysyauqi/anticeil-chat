import React, { useState } from 'react';
import {
  Mic,
  Headphones,
  Settings,
  ChevronRight,
  ChevronDown,
  Volume2,
  Video,
  Check,
  Radio,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
import { useVoiceSettings, InputProfile } from '../hooks/use-voice-settings';

interface AudioDeviceMenuProps {
  type: 'input' | 'output';
  onOpenFullSettings: () => void;
  children: React.ReactNode;
}

export function AudioDeviceMenu({
  type,
  onOpenFullSettings,
  children,
}: AudioDeviceMenuProps) {
  const { t } = useTranslation();
  const {
    settings,
    updateSetting,
    audioInputDevices,
    audioOutputDevices,
    refreshDevices,
  } = useVoiceSettings();

  const [isOpen, setIsOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<'device' | 'profile' | null>(null);

  const isInput = type === 'input';
  const devices = isInput ? audioInputDevices : audioOutputDevices;
  const currentDeviceId = isInput ? settings.inputDeviceId : settings.outputDeviceId;
  const currentVolume = isInput ? settings.inputVolume : settings.outputVolume;

  // Parse device label into Discord-like title & subtitle
  // e.g. "Microphone Array (Realtek(R) Audio)" -> title: "Realtek(R) Audio", subtitle: "Microphone Array"
  // e.g. "Headset (soundcore R50i Hands-Free AG Audio)" -> title: "soundcore R50i", subtitle: "Headset"
  // e.g. "Headphones (soundcore R50i Stereo)" -> title: "soundcore R50i", subtitle: "Headphones"
  // e.g. "Speakers (Realtek(R) Audio)" -> title: "Realtek(R) Audio", subtitle: "Speakers"
  const parseDeviceName = (rawLabel: string) => {
    if (!rawLabel || rawLabel.trim() === '') {
      return {
        title: isInput ? 'Realtek(R) Audio' : 'soundcore R50i',
        subtitle: isInput ? 'Microphone Array' : 'Headphones',
      };
    }

    let cleaned = rawLabel.trim();
    cleaned = cleaned.replace(/^(Default|Communications)\s*[-–:]\s*/i, '');

    const match = cleaned.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      const rolePart = match[1].trim(); // "Headset", "Microphone Array", "Speakers", "Headphones"
      let brandPart = match[2].trim();

      // Clean common Windows Bluetooth / audio profile suffixes from brand name
      brandPart = brandPart
        .replace(/\s*(Hands-Free AG Audio|Hands-Free Audio|Stereo|AG Audio)\s*$/i, '')
        .trim();
      if (!brandPart) brandPart = match[2].trim();

      return {
        title: brandPart,
        subtitle: rolePart || (isInput ? 'Microphone' : 'Speakers'),
      };
    }

    const dashMatch = cleaned.match(/^(.*?)\s*[-–]\s*(.*?)$/);
    if (dashMatch) {
      return {
        title: dashMatch[1].trim(),
        subtitle: dashMatch[2].trim(),
      };
    }

    return {
      title: cleaned,
      subtitle: isInput ? 'Microphone' : 'Speakers',
    };
  };

  const firstRealDevice = devices.find((d) => {
    if (d.deviceId === 'default' || d.deviceId === 'communications') return false;
    const lbl = d.label.toLowerCase();
    if (lbl.startsWith('default - ') || lbl.startsWith('default–') || lbl.startsWith('default:')) return false;
    if (lbl.startsWith('communications - ') || lbl.startsWith('communications–')) return false;
    return Boolean(d.label && d.label.trim());
  });

  const defaultDevice = devices.find((d) => {
    const lbl = d.label.toLowerCase();
    return lbl.startsWith('default - ') || lbl.startsWith('default–');
  });

  const targetForDefaultSubtitle = defaultDevice || firstRealDevice;
  const defaultSubtitle = targetForDefaultSubtitle
    ? parseDeviceName(targetForDefaultSubtitle.label).title
    : (isInput ? 'Realtek(R) Audio' : 'soundcore R50i');

  const getSelectedDeviceLabel = () => {
    if (currentDeviceId === 'default') {
      return 'Windows Default';
    }
    const found = devices.find((d) => d.deviceId === currentDeviceId);
    if (found) {
      return parseDeviceName(found.label).title;
    }
    return 'Windows Default';
  };

  const getProfileLabel = (p: InputProfile) => {
    switch (p) {
      case 'voice-isolation':
        return 'Voice Isolation';
      case 'studio':
        return 'Studio';
      default:
        return 'Custom';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (open) refreshDevices(true);
      else setActiveSubmenu(null);
    }}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="start"
        sideOffset={12}
        className="w-[230px] p-2 bg-popover border border-border rounded-xl shadow-2xl text-popover-foreground text-xs select-none z-50 animate-in fade-in-50 zoom-in-95 duration-150"
      >
        <div className="space-y-1 relative">
          {/* Item 1: Device Selection (Flyout Submenu) */}
          <div className="relative group">
            <button
              type="button"
              onClick={() => setActiveSubmenu(activeSubmenu === 'device' ? null : 'device')}
              className={cn(
                "w-full flex items-center justify-between p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer text-left",
                activeSubmenu === 'device' && "bg-accent text-accent-foreground"
              )}
            >
              <div className="flex flex-col min-w-0 pr-2">
                <span className="font-semibold text-foreground text-xs">
                  {isInput ? t('Input Device') : t('Output Device')}
                </span>
                <span className="text-[11px] text-muted-foreground truncate">
                  {getSelectedDeviceLabel()}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>

            {/* Submenu: Devices List */}
            {activeSubmenu === 'device' && (
              <div className="absolute left-[103%] top-0 w-[240px] p-1.5 bg-popover border border-border rounded-xl shadow-2xl space-y-1 z-50 animate-in fade-in-50 slide-in-from-left-2 duration-150">
                {/* Default option */}
                <button
                  type="button"
                  onClick={() => {
                    updateSetting(isInput ? 'inputDeviceId' : 'outputDeviceId', 'default');
                    setActiveSubmenu(null);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer text-left group/item"
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="font-medium text-xs text-foreground truncate">Windows Default</span>
                    <span className="text-[10px] text-muted-foreground truncate">{defaultSubtitle}</span>
                  </div>
                  <div className={cn(
                    "size-4 rounded-full border flex items-center justify-center shrink-0 ml-2 transition-all",
                    currentDeviceId === 'default' ? "border-[#5865F2] bg-[#5865F2]" : "border-muted-foreground/40"
                  )}>
                    {currentDeviceId === 'default' && <div className="size-1.5 rounded-full bg-white" />}
                  </div>
                </button>

                {/* Real enumerated devices — deduplicated like Discord */}
                {devices
                  .filter((d) => {
                    if (d.deviceId === 'default') return false;
                    if (d.deviceId === 'communications') return false;
                    const lbl = d.label.toLowerCase();
                    if (lbl.startsWith('default - ') || lbl.startsWith('default–')) return false;
                    if (lbl.startsWith('communications - ') || lbl.startsWith('communications–')) return false;
                    return true;
                  })
                  .filter((d, i, arr) => arr.findIndex((x) => x.label === d.label) === i)
                  .map((device, idx) => {
                  const isSelected = currentDeviceId === device.deviceId;
                  const { title, subtitle } = parseDeviceName(device.label);
                  return (
                    <button
                      key={device.deviceId || idx}
                      type="button"
                      onClick={() => {
                        updateSetting(isInput ? 'inputDeviceId' : 'outputDeviceId', device.deviceId);
                        setActiveSubmenu(null);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer text-left group/item"
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-medium text-xs text-foreground truncate">{title}</span>
                        {subtitle && <span className="text-[10px] text-muted-foreground truncate">{subtitle}</span>}
                      </div>
                      <div className={cn(
                        "size-4 rounded-full border flex items-center justify-center shrink-0 ml-2 transition-all",
                        isSelected ? "border-[#5865F2] bg-[#5865F2]" : "border-muted-foreground/40"
                      )}>
                        {isSelected && <div className="size-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Item 2: Input Profile (Only for Input / Mic) */}
          {isInput && (
            <div className="relative group">
              <button
                type="button"
                onClick={() => setActiveSubmenu(activeSubmenu === 'profile' ? null : 'profile')}
                className={cn(
                  "w-full flex items-center justify-between p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer text-left",
                  activeSubmenu === 'profile' && "bg-accent text-accent-foreground"
                )}
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="font-semibold text-foreground text-xs">
                    {t('Input Profile')}
                  </span>
                  <span className="text-[11px] text-muted-foreground truncate">
                    {getProfileLabel(settings.inputProfile)}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>

              {/* Submenu: Profile Options */}
              {activeSubmenu === 'profile' && (
                <div className="absolute left-[103%] top-0 w-[200px] p-1.5 bg-popover border border-border rounded-xl shadow-2xl space-y-1 z-50 animate-in fade-in-50 slide-in-from-left-2 duration-150">
                  {(['voice-isolation', 'studio', 'custom'] as InputProfile[]).map((p) => {
                    const isSelected = settings.inputProfile === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          updateSetting('inputProfile', p);
                          setActiveSubmenu(null);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer text-left"
                      >
                        <span className="font-medium text-xs text-foreground capitalize">
                          {getProfileLabel(p)}
                        </span>
                        <div className={cn(
                          "size-4 rounded-full border flex items-center justify-center shrink-0 ml-2 transition-all",
                          isSelected ? "border-[#5865F2] bg-[#5865F2]" : "border-muted-foreground/40"
                        )}>
                          {isSelected && <div className="size-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Volume Slider Section */}
          <div className="p-2 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span>{isInput ? t('Input Volume') : t('Output Volume')}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={currentVolume}
              onChange={(e) => updateSetting(isInput ? 'inputVolume' : 'outputVolume', Number(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-[#5865F2]"
            />
          </div>

          <div className="h-px bg-border my-1" />

          {/* Voice Settings Launcher */}
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(false);
              setTimeout(() => {
                onOpenFullSettings();
              }, 100);
            }}
            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-accent hover:text-accent-foreground text-foreground font-semibold text-xs transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
            <span>{t('Voice Settings')}</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
