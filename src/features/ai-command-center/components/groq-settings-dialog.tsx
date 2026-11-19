import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Key, Cpu, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  GROQ_MODELS,
  getStoredGroqConfig,
  saveStoredGroqConfig,
} from '../services/ai-storage';

interface GroqSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
}

export function GroqSettingsDialog({
  isOpen,
  onClose,
  onConfigSaved,
}: GroqSettingsDialogProps) {
  const currentConfig = getStoredGroqConfig();
  const [apiKey, setApiKey] = useState(currentConfig.apiKey);
  const [model, setModel] = useState(currentConfig.model);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      toast.error('Masukkan Groq API Key terlebih dahulu');
      return;
    }
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
        },
      });

      if (res.ok) {
        setTestResult({
          ok: true,
          message: 'Koneksi Berhasil! API Key valid dan siap digunakan.',
        });
        toast.success('Koneksi Groq API berhasil!');
      } else {
        const data = await res.json().catch(() => ({}));
        setTestResult({
          ok: false,
          message: data?.error?.message || 'Gagal memverifikasi API Key. Periksa kembali kunci Anda.',
        });
        toast.error('Gagal menghubungkan ke Groq');
      }
    } catch {
      setTestResult({
        ok: false,
        message: 'Koneksi jaringan terputus atau terblokir.',
      });
      toast.error('Koneksi ke Groq gagal');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    saveStoredGroqConfig(apiKey, model);
    toast.success('Konfigurasi Groq AI berhasil disimpan!');
    onConfigSaved?.();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] bg-background border border-border p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Pengaturan Mesin AI (Groq LPU)
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Konfigurasikan API Key Groq untuk mengaktifkan penalaran super cepat (&lt;500ms) dengan Function Calling.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* API Key Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-primary" />
                Groq API Key
              </label>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-primary hover:underline flex items-center gap-1"
              >
                Dapatkan Kunci Gratis <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <Input
              type="password"
              placeholder="gsk_..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono text-xs h-9 bg-card"
            />
            <p className="text-[10px] text-muted-foreground">
              Kunci Anda disimpan secara lokal di browser Anda dan tidak pernah dikirim ke server Anticeil.
            </p>
          </div>

          {/* Model Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-primary" />
              Model AI
            </label>
            <div className="grid grid-cols-1 gap-2">
              {GROQ_MODELS.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                    model === m.id
                      ? 'border-primary bg-primary/10 ring-1 ring-primary'
                      : 'border-border/60 hover:bg-card/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{m.name}</span>
                    {model === m.id && (
                      <span className="text-[10px] bg-primary/20 text-primary font-bold px-1.5 py-0.5 rounded">
                        Dipilih
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Test Status feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-lg flex items-start gap-2 text-xs ${
                testResult.ok
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="text-xs h-8"
          >
            {isTesting ? 'Menguji...' : 'Uji Koneksi'}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs h-8"
            >
              Tutup
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="text-xs h-8 bg-primary text-primary-foreground font-semibold"
            >
              Simpan Konfigurasi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
