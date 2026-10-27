import React, { useState } from 'react';
import { Socket } from 'socket.io-client';
import { Terminal, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CommunityChannel } from '@/chat/chat-types';

export interface CodeRunnerProps {
  channel: CommunityChannel;
  socket: Socket | null;
}

export function CodeRunner({ channel, socket }: CodeRunnerProps) {
  const [scratchpadCode, setScratchpadCode] = useState(
    '// Anticeil Collaborative Activity Scratchpad\n// Diskusikan logika workflow, payload webhook, atau format data bersama tim.\n\nconst samplePayload = {\n  event: "lead_generated",\n  timestamp: new Date().toISOString(),\n  source: "WhatsApp Cloud API",\n  customer: {\n    name: "Budi Santoso",\n    phone: "+6281234567890",\n    status: "QUALIFIED"\n  }\n};\n\nconsole.log("Memproses payload:", samplePayload.customer.name);\nconsole.log("Status lead:", samplePayload.customer.status);',
  );
  const [scratchpadOutput, setScratchpadOutput] = useState<string | null>(null);
  const [isExecutingScript, setIsExecutingScript] = useState(false);

  const handleRunScratchpad = () => {
    setIsExecutingScript(true);
    const start = performance.now();
    try {
      const trimmed = scratchpadCode.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        const parsed = JSON.parse(trimmed);
        const elapsed = (performance.now() - start).toFixed(2);
        setScratchpadOutput(`✓ Valid JSON Payload (${elapsed}ms)\n` + JSON.stringify(parsed, null, 2));
        toast.success(`Payload JSON valid! (${elapsed}ms)`);
      } else {
        const mockLog: string[] = [];
        const customConsole = {
          log: (...args: any[]) =>
            mockLog.push(
              args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '),
            ),
          info: (...args: any[]) => mockLog.push('[INFO] ' + args.join(' ')),
          warn: (...args: any[]) => mockLog.push('[WARN] ' + args.join(' ')),
          error: (...args: any[]) => mockLog.push('[ERROR] ' + args.join(' ')),
        };
        const runFn = new Function('console', scratchpadCode);
        runFn(customConsole);
        const elapsed = (performance.now() - start).toFixed(2);
        setScratchpadOutput(
          `✓ Script executed successfully in ${elapsed}ms\n--- Console Output ---\n` +
            (mockLog.join('\n') || '(Eksekusi selesai tanpa log output)'),
        );
        toast.success(`Script berhasil dijalankan! (${elapsed}ms)`);
      }
    } catch (err: any) {
      setScratchpadOutput(`✕ Error Eksekusi: ${err.message}`);
      toast.error(`Eksekusi gagal: ${err.message}`);
    } finally {
      setIsExecutingScript(false);
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col p-3 gap-2 overflow-hidden select-none">
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-primary" /> Live Code & JSON Playground
        </span>
        <Button
          size="sm"
          onClick={handleRunScratchpad}
          disabled={isExecutingScript}
          className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" /> Jalankan Script / Validasi
        </Button>
      </div>
      <textarea
        value={scratchpadCode}
        onChange={(e) => {
          setScratchpadCode(e.target.value);
          socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
            channelId: channel.id,
            action: 'SCRATCHPAD_UPDATE',
            payload: e.target.value,
          });
        }}
        className="flex-1 min-h-0 w-full bg-[#111214] border border-white/10 rounded-xl p-3 font-mono text-xs text-emerald-400 focus:outline-none focus:ring-1 focus:ring-primary resize-none [scrollbar-width:thin] leading-relaxed select-text"
        placeholder="Tulis kode Javascript atau payload JSON di sini..."
      />

      {/* Terminal Execution Output Console */}
      <div className="h-28 shrink-0 bg-black/90 border border-white/10 rounded-xl p-3 font-mono text-[11px] text-white/90 overflow-y-auto [scrollbar-width:thin] select-text">
        <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>Console Output:</span>
          <button
            onClick={() => setScratchpadOutput(null)}
            className="text-muted-foreground hover:text-white text-[10px] cursor-pointer"
          >
            Bersihkan
          </button>
        </div>
        {scratchpadOutput ? (
          <pre className="text-emerald-300 whitespace-pre-wrap">{scratchpadOutput}</pre>
        ) : (
          <span className="text-muted-foreground italic">
            Klik tombol &quot;Jalankan Script / Validasi&quot; di atas untuk melihat hasil eksekusi realtime.
          </span>
        )}
      </div>
    </div>
  );
}
