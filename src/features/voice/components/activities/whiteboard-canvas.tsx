import React, { useState, useRef, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CommunityChannel } from '@/chat/messages-types';

export interface WhiteboardCanvasProps {
  channel: CommunityChannel;
  socket: Socket | null;
}

export function WhiteboardCanvas({ channel, socket }: WhiteboardCanvasProps) {
  const whiteboardCanvasRef = useRef<HTMLCanvasElement>(null);
  const [drawColor, setDrawColor] = useState('#10b981');
  const [brushSize, setBrushSize] = useState(3);
  const isDrawing = useRef(false);
  const lastCoord = useRef<{ x: number; y: number } | null>(null);

  const drawStroke = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    color: string,
    size: number,
  ) => {
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  };

  const handleClearCanvas = () => {
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
      channelId: channel.id,
      action: 'WHITEBOARD_CLEAR',
    });
  };

  useEffect(() => {
    if (!socket) return;
    const handleRemoteActivityEvent = (data: { action: string; payload?: any }) => {
      if (data.action === 'WHITEBOARD_DRAW' && data.payload) {
        const { x0, y0, x1, y1, color, size } = data.payload;
        drawStroke(x0, y0, x1, y1, color, size);
      } else if (data.action === 'WHITEBOARD_CLEAR') {
        const canvas = whiteboardCanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    };

    socket.on('COMMUNITY_CALL_ACTIVITY_EVENT', handleRemoteActivityEvent);
    return () => {
      socket.off('COMMUNITY_CALL_ACTIVITY_EVENT', handleRemoteActivityEvent);
    };
  }, [socket]);

  return (
    <div className="h-full min-h-0 flex flex-col p-3 gap-2 overflow-hidden select-none">
      <div className="p-2.5 rounded-xl bg-[#2b2d31] border border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground mr-1">Warna:</span>
          {['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#ffffff'].map((color) => (
            <button
              key={color}
              onClick={() => setDrawColor(color)}
              className={cn(
                'w-5 h-5 rounded-full transition-all border cursor-pointer',
                drawColor === color ? 'scale-125 border-white ring-2 ring-primary' : 'border-transparent opacity-80 hover:opacity-100',
              )}
              style={{ backgroundColor: color }}
            />
          ))}
          <div className="w-[1px] h-4 bg-white/10 mx-1.5" />
          <span className="text-xs font-semibold text-muted-foreground">Tebal:</span>
          {[2, 4, 8].map((size) => (
            <button
              key={size}
              onClick={() => setBrushSize(size)}
              className={cn(
                'px-2 py-0.5 rounded text-xs font-bold transition-all cursor-pointer',
                brushSize === size ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-white',
              )}
            >
              {size}px
            </button>
          ))}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleClearCanvas}
          className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/20 gap-1 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" /> Bersihkan Papan
        </Button>
      </div>

      <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-white/10 relative bg-[#111214]">
        <canvas
          ref={whiteboardCanvasRef}
          width={1200}
          height={700}
          onMouseDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const scaleX = e.currentTarget.width / rect.width;
            const scaleY = e.currentTarget.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            isDrawing.current = true;
            lastCoord.current = { x, y };
          }}
          onMouseMove={(e) => {
            if (!isDrawing.current || !lastCoord.current) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const scaleX = e.currentTarget.width / rect.width;
            const scaleY = e.currentTarget.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            drawStroke(lastCoord.current.x, lastCoord.current.y, x, y, drawColor, brushSize);
            socket?.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
              channelId: channel.id,
              action: 'WHITEBOARD_DRAW',
              payload: {
                x0: lastCoord.current.x,
                y0: lastCoord.current.y,
                x1: x,
                y1: y,
                color: drawColor,
                size: brushSize,
              },
            });
            lastCoord.current = { x, y };
          }}
          onMouseUp={() => {
            isDrawing.current = false;
            lastCoord.current = null;
          }}
          onMouseLeave={() => {
            isDrawing.current = false;
            lastCoord.current = null;
          }}
          className="w-full h-full cursor-crosshair touch-none"
        />
      </div>
    </div>
  );
}
