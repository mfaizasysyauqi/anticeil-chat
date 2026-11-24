import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Pipette, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';

interface ProfileThemeColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
  title?: string;
}

const PRESET_SWATCHES = [
  '#27272a', // Zinc Dark
  '#ffffff', // White
  '#4338ca', // Indigo
  '#0f766e', // Teal
  '#15803d', // Green
];

// Helper HSV to Hex
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const f = (n: number, k = (n + h / 60) % 6) =>
    v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  return [Math.round(f(5) * 255), Math.round(f(3) * 255), Math.round(f(1) * 255)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function hexToHsv(hex: string): [number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return [240, 0.7, 0.7];

  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return [Math.round(h), s, v];
}

export function ProfileThemeColorPicker({
  color,
  onChange,
  onClose,
  title,
}: ProfileThemeColorPickerProps) {
  const { t } = useTranslation();
  const [hsv, setHsv] = useState<[number, number, number]>(() => hexToHsv(color));
  const [hexInput, setHexInput] = useState(color);
  const satValRef = useRef<HTMLDivElement>(null);
  const isDraggingSatVal = useRef(false);

  useEffect(() => {
    setHexInput(color);
    setHsv(hexToHsv(color));
  }, [color]);

  const updateColorFromHsv = useCallback(
    (h: number, s: number, v: number) => {
      const [r, g, b] = hsvToRgb(h, s, v);
      const newHex = rgbToHex(r, g, b);
      setHexInput(newHex);
      onChange(newHex);
    },
    [onChange]
  );

  const handleSatValMove = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      if (!satValRef.current) return;
      const rect = satValRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      const s = x / rect.width;
      const v = 1 - y / rect.height;
      setHsv(([h]) => {
        updateColorFromHsv(h, s, v);
        return [h, s, v];
      });
    },
    [updateColorFromHsv]
  );

  useEffect(() => {
    const handleMouseUp = () => {
      isDraggingSatVal.current = false;
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSatVal.current) {
        handleSatValMove(e);
      }
    };
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleSatValMove]);

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const h = parseInt(e.target.value, 10);
    setHsv(([, s, v]) => {
      updateColorFromHsv(h, s, v);
      return [h, s, v];
    });
  };

  const handleHexSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let val = hexInput.trim();
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      onChange(val);
      setHsv(hexToHsv(val));
    }
  };

  const handleEyedropper = async () => {
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          onChange(result.sRGBHex);
          setHexInput(result.sRGBHex);
          setHsv(hexToHsv(result.sRGBHex));
        }
      } catch {}
    }
  };

  // Pure hue color for background
  const [pureR, pureG, pureB] = hsvToRgb(hsv[0], 1, 1);
  const pureHex = rgbToHex(pureR, pureG, pureB);

  return (
    <div className="w-64 p-3 bg-[#111214] border border-[#232428] rounded-xl shadow-2xl space-y-3 z-50 text-white select-none animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-zinc-300">
          {title || t('Pilih Warna Tema')}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-400 hover:text-white transition-colors p-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2D Saturation / Value Gradient Canvas */}
      <div
        ref={satValRef}
        onMouseDown={(e) => {
          isDraggingSatVal.current = true;
          handleSatValMove(e);
        }}
        className="relative w-full h-32 rounded-lg cursor-crosshair overflow-hidden border border-white/10"
        style={{
          backgroundColor: pureHex,
          backgroundImage:
            'linear-gradient(to right, #fff, transparent), linear-gradient(to top, #000, transparent)',
        }}
      >
        {/* Cursor Indicator */}
        <div
          className="absolute size-3.5 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${hsv[1] * 100}%`,
            top: `${(1 - hsv[2]) * 100}%`,
            backgroundColor: color,
          }}
        />
      </div>

      {/* Rainbow Hue Slider */}
      <div className="space-y-1">
        <input
          type="range"
          min={0}
          max={360}
          value={hsv[0]}
          onChange={handleHueChange}
          className="w-full h-3 rounded-full appearance-none cursor-pointer outline-none"
          style={{
            background:
              'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
          }}
        />
      </div>

      {/* Hex Input & Eyedropper */}
      <form onSubmit={handleHexSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            onBlur={handleHexSubmit}
            maxLength={7}
            className="w-full h-8 px-2.5 bg-[#1e1f22] border border-[#2b2d31] rounded-lg text-xs font-mono text-zinc-100 uppercase focus:outline-none focus:border-primary"
          />
        </div>
        {'EyeDropper' in window && (
          <button
            type="button"
            onClick={handleEyedropper}
            title={t('Ambil Warna Layar')}
            className="size-8 rounded-lg bg-[#1e1f22] border border-[#2b2d31] hover:border-zinc-500 text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <Pipette className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* 5 Preset Swatches */}
      <div className="flex items-center justify-between pt-1 border-t border-[#232428]">
        {PRESET_SWATCHES.map((swatch) => (
          <button
            key={swatch}
            type="button"
            onClick={() => {
              onChange(swatch);
              setHexInput(swatch);
              setHsv(hexToHsv(swatch));
            }}
            className={cn(
              'size-7 rounded-md border border-white/20 transition-transform hover:scale-110 cursor-pointer',
              color.toLowerCase() === swatch.toLowerCase() && 'ring-2 ring-white ring-offset-1 ring-offset-black'
            )}
            style={{ backgroundColor: swatch }}
          />
        ))}
      </div>
    </div>
  );
}
