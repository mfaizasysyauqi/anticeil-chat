import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { Trash2, Users, Sparkles, RefreshCw } from 'lucide-react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { Button } from '@/components/ui/button';
import { CommunityAvatar } from '@/chat/chat-avatar';
import { cn } from '@/lib/utils';
import { ColonyChannel } from '@/chat/chat-types';
import { toast } from 'sonner';

export interface WhiteboardCanvasProps {
  channel: ColonyChannel;
  socket: Socket | null;
  currentUser?: any;
  currentUserName?: string;
  participants?: any[];
}

export function WhiteboardCanvas({
  channel,
  socket,
  currentUser,
  currentUserName = 'You',
  participants = [],
}: WhiteboardCanvasProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const isRemoteUpdatingRef = useRef(false);
  const broadcastDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastElementsHashRef = useRef<string>('');
  const [isSynced, setIsSynced] = useState(true);

  // Simple fast element hash to prevent sending identical scenes
  const computeElementsHash = (elements: readonly any[]) => {
    let hash = elements.length.toString();
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      hash += `|${el.id}:${el.version}:${el.x}:${el.y}`;
    }
    return hash;
  };

  // Socket Activity Sync Events for Excalidraw
  useEffect(() => {
    if (!socket) return;

    const handleWhiteboardSocketEvent = (data: {
      channelId?: string;
      action: string;
      payload?: any;
    }) => {
      if (!data) return;
      if (data.channelId && data.channelId !== channel.id) return;

      if (data.action === 'EXCALIDRAW_SYNC') {
        const { elements, senderId, senderName } = data.payload || {};
        if (senderId && (senderId === currentUser?.id || senderId === socket.id)) return;

        if (Array.isArray(elements) && excalidrawAPI) {
          isRemoteUpdatingRef.current = true;
          excalidrawAPI.updateScene({ elements });
          lastElementsHashRef.current = computeElementsHash(elements);
          setIsSynced(true);

          setTimeout(() => {
            isRemoteUpdatingRef.current = false;
          }, 100);
        }
      } else if (data.action === 'EXCALIDRAW_CLEAR') {
        const { senderId, senderName } = data.payload || {};
        if (senderId && (senderId === currentUser?.id || senderId === socket.id)) return;

        if (excalidrawAPI) {
          isRemoteUpdatingRef.current = true;
          excalidrawAPI.resetScene();
          lastElementsHashRef.current = '';
          toast.info(`${senderName || 'Rekan'} telah membersihkan papan tulis`);
          setTimeout(() => {
            isRemoteUpdatingRef.current = false;
          }, 100);
        }
      } else if (data.action === 'EXCALIDRAW_QUERY_STATE') {
        // Newly joined peer requests current whiteboard scene
        if (excalidrawAPI) {
          const currentElements = excalidrawAPI.getSceneElements() || [];
          if (currentElements.length > 0) {
            socket.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
              channelId: channel.id,
              action: 'EXCALIDRAW_SYNC',
              payload: {
                elements: currentElements,
                senderId: currentUser?.id || socket.id,
                senderName: currentUserName,
              },
            });
          }
        }
      }
    };

    socket.on('COMMUNITY_CALL_ACTIVITY_EVENT', handleWhiteboardSocketEvent);

    // Query active state when opening whiteboard
    socket.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
      channelId: channel.id,
      action: 'EXCALIDRAW_QUERY_STATE',
    });

    return () => {
      socket.off('COMMUNITY_CALL_ACTIVITY_EVENT', handleWhiteboardSocketEvent);
    };
  }, [socket, channel.id, excalidrawAPI, currentUser?.id, currentUserName]);

  // Handle local change and broadcast to room
  const handleChange = useCallback(
    (elements: readonly any[]) => {
      if (isRemoteUpdatingRef.current) return;
      if (!socket) return;

      const newHash = computeElementsHash(elements);
      if (newHash === lastElementsHashRef.current) return;
      lastElementsHashRef.current = newHash;

      setIsSynced(false);

      if (broadcastDebounceRef.current) {
        clearTimeout(broadcastDebounceRef.current);
      }

      broadcastDebounceRef.current = setTimeout(() => {
        socket.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
          channelId: channel.id,
          action: 'EXCALIDRAW_SYNC',
          payload: {
            elements: [...elements],
            senderId: currentUser?.id || socket.id,
            senderName: currentUserName,
          },
        });
        setIsSynced(true);
      }, 80);
    },
    [socket, channel.id, currentUser?.id, currentUserName],
  );

  // Clear board action
  const handleClearBoard = () => {
    if (!excalidrawAPI) return;
    excalidrawAPI.resetScene();
    lastElementsHashRef.current = '';

    socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
      channelId: channel.id,
      action: 'EXCALIDRAW_CLEAR',
      payload: {
        senderId: currentUser?.id || socket?.id,
        senderName: currentUserName,
      },
    });

    toast.success('Papan tulis berhasil dibersihkan');
  };

  return (
    <div className="h-full w-full min-h-0 flex flex-col bg-[#121212] select-none relative overflow-hidden">
      {/* ── Discord Style Jamspace Top Header Bar ───────────────────── */}
      <div className="h-11 px-3 sm:px-4 bg-[#1e1f22] border-b border-border/50 flex items-center justify-between shrink-0 z-10 shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-6 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shrink-0 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-foreground truncate">Jamspace Whiteboard</span>

          {/* Realtime Synced Badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold ml-1">
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full bg-emerald-400',
                isSynced ? 'animate-pulse' : 'bg-amber-400',
              )}
            />
            <span className="hidden sm:inline">{isSynced ? 'Realtime Synced' : 'Syncing...'}</span>
          </div>
        </div>

        {/* Right Actions: Participants & Clear */}
        <div className="flex items-center gap-2">
          {/* Active Collaborators count */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/50 text-[11px] text-muted-foreground border border-border/40">
            <Users className="w-3.5 h-3.5" />
            <span>{participants.length + 1} Aktif</span>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearBoard}
            className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1.5 cursor-pointer"
            title="Bersihkan Semua Gambar"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bersihkan</span>
          </Button>
        </div>
      </div>

      {/* ── Excalidraw Full Collaborative Canvas ────────────────────── */}
      <div className="flex-1 w-full h-full min-h-0 relative excalidraw-container">
        <Excalidraw
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          onChange={handleChange}
          theme="dark"
          UIOptions={{
            canvasActions: {
              loadScene: false,
              saveAsImage: true,
              export: { saveFileToDisk: true },
              changeViewBackgroundColor: true,
              clearCanvas: false, // Handled via our top bar
            },
          }}
        />
      </div>
    </div>
  );
}
