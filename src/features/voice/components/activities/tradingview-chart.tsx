import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ColonyChannel } from '@/chat/chat-types';

export interface TradingViewChartProps {
  channel: ColonyChannel;
  socket: Socket | null;
  currentUserName?: string;
  currentUser?: any;
  participants?: any[];
}

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1D';

export interface MarketAsset {
  symbol: string;
  name: string;
  tvSymbol: string;
  category: 'crypto' | 'stocks' | 'forex';
  currency: string;
  defaultPrice: number;
}

const MARKET_ASSETS: MarketAsset[] = [
  { symbol: 'BTC/USDT', name: 'Bitcoin', tvSymbol: 'BINANCE:BTCUSDT', category: 'crypto', currency: '$', defaultPrice: 57120 },
  { symbol: 'ETH/USDT', name: 'Ethereum', tvSymbol: 'BINANCE:ETHUSDT', category: 'crypto', currency: '$', defaultPrice: 2450 },
  { symbol: 'SOL/USDT', name: 'Solana', tvSymbol: 'BINANCE:SOLUSDT', category: 'crypto', currency: '$', defaultPrice: 135 },
  { symbol: 'NVDA', name: 'NVIDIA Corp', tvSymbol: 'NASDAQ:NVDA', category: 'stocks', currency: '$', defaultPrice: 142 },
  { symbol: 'AAPL', name: 'Apple Inc', tvSymbol: 'NASDAQ:AAPL', category: 'stocks', currency: '$', defaultPrice: 236 },
  { symbol: 'TSLA', name: 'Tesla Inc', tvSymbol: 'NASDAQ:TSLA', category: 'stocks', currency: '$', defaultPrice: 348 },
  { symbol: 'GOLD', name: 'Gold / USD', tvSymbol: 'OANDA:XAUUSD', category: 'stocks', currency: '$', defaultPrice: 2915 },
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', tvSymbol: 'FX:EURUSD', category: 'forex', currency: '€', defaultPrice: 1.05 },
];

const TIMEFRAME_MAP: Record<Timeframe, string> = {
  '1m': '1',
  '5m': '5',
  '15m': '15',
  '1h': '60',
  '4h': '240',
  '1D': 'D',
};

export function TradingViewChart({
  channel,
  socket,
  currentUserName,
  currentUser: _currentUser,
  participants = [],
}: TradingViewChartProps) {
  // State
  const [selectedAsset, setSelectedAsset] = useState<MarketAsset>(MARKET_ASSETS[0]);
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Injeksi Official TradingView Advanced Real-Time Chart Widget
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Bersihkan container sebelumnya
    container.innerHTML = '';

    const widgetWrapper = document.createElement('div');
    widgetWrapper.className = 'tradingview-widget-container__widget';
    widgetWrapper.style.width = '100%';
    widgetWrapper.style.height = '100%';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: selectedAsset.tvSymbol,
      interval: TIMEFRAME_MAP[timeframe] || 'D',
      timezone: 'Asia/Jakarta',
      theme: 'dark',
      style: '1',
      locale: 'id',
      enable_publishing: false,
      allow_symbol_change: true,
      calendar: false,
      support_host: 'https://www.tradingview.com',
      hide_side_toolbar: false,
      withdateranges: true,
      hide_volume: false,
      details: true,
      hotlist: true,
      show_popup_button: true,
      popup_width: '1000',
      popup_height: '650',
      backgroundColor: 'rgba(19, 23, 34, 1)',
      gridColor: 'rgba(42, 46, 57, 0.4)',
    });

    container.appendChild(widgetWrapper);
    container.appendChild(script);

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [selectedAsset.tvSymbol, timeframe]);

  // 2. Sinkronisasi Voice Call Activity via Socket
  useEffect(() => {
    if (!socket || !channel?.id) return;

    const handleCallActivity = (data: { channelId: string; action: string; payload: any }) => {
      if (data.channelId !== channel.id) return;
      if (data.action === 'TV_ASSET_CHANGE' && data.payload?.asset) {
        const found = MARKET_ASSETS.find((a) => a.tvSymbol === data.payload.asset.tvSymbol);
        if (found) {
          setSelectedAsset(found);
          toast.info(`Pasangan aset dialihkan ke ${found.symbol}`);
        }
      }
    };

    socket.on('COMMUNITY_CALL_ACTIVITY_EVENT', handleCallActivity);
    return () => {
      socket.off('COMMUNITY_CALL_ACTIVITY_EVENT', handleCallActivity);
    };
  }, [socket, channel?.id]);

  const handleSelectAsset = (asset: MarketAsset) => {
    setSelectedAsset(asset);
    if (socket && channel?.id) {
      socket.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
        channelId: channel.id,
        action: 'TV_ASSET_CHANGE',
        payload: { asset },
      });
    }
  };

  return (
    <div
      className={cn(
        'relative w-full h-full bg-[#131722] text-[#d1d4dc] overflow-hidden select-none rounded-none border-0',
        isFullscreen && 'fixed inset-0 z-50'
      )}
    >
      {/* ── Main TradingView Chart Container (Edge-to-Edge) ────────────────── */}
      <div
        ref={containerRef}
        className="tradingview-widget-container w-full h-full rounded-none border-0"
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
}
