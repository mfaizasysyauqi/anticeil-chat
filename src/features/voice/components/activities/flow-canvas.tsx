import React, { useState } from 'react';
import { Socket } from 'socket.io-client';
import {
  Play,
  Plus,
  RotateCcw,
  Zap,
  Bot,
  Workflow,
  Database,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CHANNEL_HORIZONTAL_PADDING } from '@/lib/layout-constants';
import { toast } from 'sonner';
import { CommunityChannel } from '@/chat/messages-types';

export interface FlowCanvasProps {
  channel: CommunityChannel;
  socket: Socket | null;
}

export function FlowCanvas({ channel, socket }: FlowCanvasProps) {
  const [flowNodes, setFlowNodes] = useState<Array<{
    id: string;
    type: 'trigger' | 'ai' | 'action' | 'db';
    title: string;
    description: string;
    status: 'idle' | 'running' | 'success';
    duration?: string;
  }>>([
    {
      id: 'step-1',
      type: 'trigger',
      title: 'WhatsApp Webhook',
      description: 'Menangkap pesan & lead masuk dari WhatsApp Cloud API',
      status: 'idle',
    },
    {
      id: 'step-2',
      type: 'ai',
      title: 'Anticeil AI Agent',
      description: 'Ekstrak kebutuhan pelanggan via model Claude 3.5 / GPT-4o',
      status: 'idle',
    },
    {
      id: 'step-3',
      type: 'action',
      title: 'Notifikasi Tim Internal',
      description: `Broadcast detail lead ke channel #${channel.name}`,
      status: 'idle',
    },
    {
      id: 'step-4',
      type: 'db',
      title: 'Database Supabase / CRM',
      description: 'Simpan kontak & set status lead menjadi QUALIFIED',
      status: 'idle',
    },
  ]);
  const [isSimulating, setIsSimulating] = useState(false);

  const runSimulationSequence = (broadcast = true) => {
    setIsSimulating(true);
    let stepIndex = 0;

    const executeStep = () => {
      if (stepIndex < flowNodes.length) {
        setFlowNodes((prev) =>
          prev.map((node, i) => {
            if (i === stepIndex) return { ...node, status: 'running' };
            if (i < stepIndex) return { ...node, status: 'success', duration: '142ms' };
            return { ...node, status: 'idle' };
          }),
        );

        if (broadcast) {
          socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
            channelId: channel.id,
            action: 'FLOW_STEP_UPDATE',
            payload: { activeIndex: stepIndex },
          });
        }

        stepIndex++;
        setTimeout(executeStep, 1000);
      } else {
        setFlowNodes((prev) =>
          prev.map((node) => ({ ...node, status: 'success', duration: '98ms' })),
        );
        setIsSimulating(false);
        toast.success('Simulasi alur otomasi berhasil dijalankan! Semua langkah selesai (200 OK).');
      }
    };

    setTimeout(executeStep, 200);
  };

  const handleAddFlowNode = () => {
    const newStep = {
      id: `step-${Date.now()}`,
      type: 'action' as const,
      title: 'Langkah Otomasi Baru',
      description: 'Langkah kustom yang ditambahkan oleh tim saat panggilan',
      status: 'idle' as const,
    };
    const updated = [...flowNodes, newStep];
    setFlowNodes(updated);
    socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
      channelId: channel.id,
      action: 'FLOW_UPDATE',
      payload: updated,
    });
    toast.success('Langkah otomasi baru ditambahkan!');
  };

  const handleResetFlow = () => {
    const initial = [
      {
        id: 'step-1',
        type: 'trigger' as const,
        title: 'WhatsApp Webhook',
        description: 'Menangkap pesan & lead masuk dari WhatsApp Cloud API',
        status: 'idle' as const,
      },
      {
        id: 'step-2',
        type: 'ai' as const,
        title: 'Anticeil AI Agent',
        description: 'Ekstrak kebutuhan pelanggan via model Claude 3.5 / GPT-4o',
        status: 'idle' as const,
      },
      {
        id: 'step-3',
        type: 'action' as const,
        title: 'Notifikasi Tim Internal',
        description: `Broadcast detail lead ke channel #${channel.name}`,
        status: 'idle' as const,
      },
      {
        id: 'step-4',
        type: 'db' as const,
        title: 'Database Supabase / CRM',
        description: 'Simpan kontak & set status lead menjadi QUALIFIED',
        status: 'idle' as const,
      },
    ];
    setFlowNodes(initial);
    socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
      channelId: channel.id,
      action: 'FLOW_UPDATE',
      payload: initial,
    });
    toast.info('Alur otomasi di-reset ke default');
  };

  return (
    <div className={cn('h-full min-h-0 flex flex-col py-3 gap-2 overflow-hidden select-none', CHANNEL_HORIZONTAL_PADDING)}>
      {/* Flow Toolbar */}
      <div className="p-3 rounded-xl bg-card border border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => runSimulationSequence(true)}
            disabled={isSimulating}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow cursor-pointer"
          >
            {isSimulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {isSimulating ? 'Simulasi Berjalan...' : 'Simulasikan Eksekusi Alur'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddFlowNode}
            className="border-border hover:bg-muted text-xs gap-1 text-foreground cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Langkah
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleResetFlow}
            className="text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </Button>
        </div>
        <span className="text-[11px] text-muted-foreground hidden sm:inline">
          Semua rekan di panggilan melihat simulasi secara sinkron realtime
        </span>
      </div>

      {/* Flow Steps */}
      <div className="flex-1 min-h-0 p-4 bg-[#111214] rounded-xl border border-white/5 flex flex-col gap-3 overflow-y-auto">
        {flowNodes.map((node, index) => {
          const isLast = index === flowNodes.length - 1;
          return (
            <div key={node.id} className="flex flex-col items-center">
              <div
                className={cn(
                  'w-full max-w-xl p-4 rounded-xl border transition-all duration-300 flex items-center justify-between',
                  node.status === 'running' && 'bg-primary/20 border-primary ring-2 ring-primary/40 scale-102',
                  node.status === 'success' && 'bg-emerald-950/40 border-emerald-500/60',
                  node.status === 'idle' && 'bg-[#1e1f22] border-white/10 hover:border-white/20',
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold',
                      node.type === 'trigger' && 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
                      node.type === 'ai' && 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
                      node.type === 'action' && 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
                      node.type === 'db' && 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
                    )}
                  >
                    {node.type === 'trigger' && <Zap className="w-4 h-4" />}
                    {node.type === 'ai' && <Bot className="w-4 h-4" />}
                    {node.type === 'action' && <Workflow className="w-4 h-4" />}
                    {node.type === 'db' && <Database className="w-4 h-4" />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">{node.title}</span>
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-white/5 text-muted-foreground">
                        {node.type}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate">{node.description}</span>
                  </div>
                </div>

                <div className="shrink-0 ml-2">
                  {node.status === 'running' && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-primary animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Running
                    </span>
                  )}
                  {node.status === 'success' && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 200 OK ({node.duration})
                    </span>
                  )}
                  {node.status === 'idle' && <span className="text-[10px] text-muted-foreground">Menunggu</span>}
                </div>
              </div>

              {!isLast && (
                <div className="w-0.5 h-5 bg-gradient-to-b from-white/20 to-white/10 my-1 relative flex items-center justify-center">
                  <ArrowRight className="w-3 h-3 text-muted-foreground rotate-90" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
