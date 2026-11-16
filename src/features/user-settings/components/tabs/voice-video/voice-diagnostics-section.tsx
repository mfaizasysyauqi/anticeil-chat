import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export interface VoiceDiagnosticsSectionProps {
  t: (key: string) => string;
  showDiagnostics: boolean;
  setShowDiagnostics: (val: boolean) => void;
  debugLogging: boolean;
  setDebugLogging: (val: boolean) => void;
  audioSubsystem: string;
  setAudioSubsystem: (val: string) => void;
  webrtcQos: boolean;
  setWebrtcQos: (val: boolean) => void;
  diagnosticPacketCapture: boolean;
  setDiagnosticPacketCapture: (val: boolean) => void;
  onResetAll: () => void;
}

export const VoiceDiagnosticsSection: React.FC<VoiceDiagnosticsSectionProps> = ({
  t,
  showDiagnostics,
  setShowDiagnostics,
  debugLogging,
  setDebugLogging,
  audioSubsystem,
  setAudioSubsystem,
  webrtcQos,
  setWebrtcQos,
  diagnosticPacketCapture,
  setDiagnosticPacketCapture,
  onResetAll,
}) => {
  return (
    <div id="voice-advanced" className="scroll-mt-6 space-y-6 pt-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">{t('Advanced')}</h2>
      </div>

      {/* Accordion: Show Diagnostic Settings */}
      <div className="border border-border/70 rounded-xl overflow-hidden bg-card">
        <button
          type="button"
          onClick={() => setShowDiagnostics(!showDiagnostics)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors cursor-pointer"
        >
          <div>
            <div className="text-xs font-bold text-foreground">{t('Show Diagnostic Settings')}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {t('Settings that collect technical data for Discord Support to analyze, such as debug logging and audio recording')}
            </div>
          </div>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0',
              showDiagnostics && 'rotate-180',
            )}
          />
        </button>

        {showDiagnostics && (
          <div className="p-4 pt-1 space-y-4 border-t border-border/60 bg-muted/10">
            <div className="flex items-center justify-between gap-4 py-1">
              <div>
                <div className="text-xs font-bold text-foreground">{t('Debug Logging')}</div>
                <div className="text-[11px] text-muted-foreground">{t('Mencatat log koneksi WebRTC secara detail ke console')}</div>
              </div>
              <Switch checked={debugLogging} onCheckedChange={setDebugLogging} />
            </div>

            <div className="space-y-1.5 py-1">
              <label className="text-xs font-bold text-foreground block">{t('Audio Subsystem')}</label>
              <div className="relative max-w-xs">
                <select
                  value={audioSubsystem}
                  onChange={(e) => setAudioSubsystem(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-lg bg-[#1e1f22] border border-border/80 text-foreground appearance-none outline-none cursor-pointer pr-8"
                >
                  <option value="standard" className="bg-[#2b2d31]">Standard (Recommended)</option>
                  <option value="legacy" className="bg-[#2b2d31]">Legacy Audio Stack</option>
                  <option value="experimental" className="bg-[#2b2d31]">Experimental Low-Latency</option>
                </select>
                <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 py-1">
              <div>
                <div className="text-xs font-bold text-foreground">{t('WebRTC High Priority QoS')}</div>
                <div className="text-[11px] text-muted-foreground">{t('Mengaktifkan DSCP Expedited Forwarding packet tagging')}</div>
              </div>
              <Switch checked={webrtcQos} onCheckedChange={setWebrtcQos} />
            </div>

            <div className="flex items-center justify-between gap-4 py-1">
              <div>
                <div className="text-xs font-bold text-foreground">{t('Diagnostic Packet Capture')}</div>
                <div className="text-[11px] text-muted-foreground">{t('Simpan dump statistik RTC untuk investigasi masalah jaringan')}</div>
              </div>
              <Switch checked={diagnosticPacketCapture} onCheckedChange={setDiagnosticPacketCapture} />
            </div>
          </div>
        )}
      </div>

      {/* Reset all Voice & Video settings */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
        <div>
          <div className="text-xs font-bold text-foreground">{t('Reset all Voice & Video settings')}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {t('Return to the default set of Voice & Video settings.')}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onResetAll}
          className="border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-600 font-bold text-xs px-4 py-2 rounded-md shrink-0 cursor-pointer transition-colors"
        >
          {t('Reset')}
        </Button>
      </div>
    </div>
  );
};
