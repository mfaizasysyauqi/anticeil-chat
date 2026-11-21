import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import {
  TrendingUp,
  DollarSign,
  ChevronDown,
  Check,
  Radio,
  Users,
  Maximize2,
  Minimize2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  X,
  PlusCircle,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/core/i18n';
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

interface PaperPosition {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  amount: number;
  timestamp: number;
}

export function TradingViewChart({
  channel,
  socket,
  currentUserName,
  currentUser: _currentUser,
  participants = [],
}: TradingViewChartProps) {
  const { t } = useTranslation();

  // State
  const [selectedAsset, setSelectedAsset] = useState<MarketAsset>(MARKET_ASSETS[0]);
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Paper trading simulation
  const [showPaperTrading, setShowPaperTrading] = useState(false);
  const [paperBalance, setPaperBalance] = useState<number>(10000);
  const [positions, setPositions] = useState<PaperPosition[]>([]);
  const [tradeAmount, setTradeAmount] = useState<number>(0.1);

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
    widgetWrapper.style.height = 'calc(100% - 24px)';

    const copyrightWrapper = document.createElement('div');
    copyrightWrapper.className = 'tradingview-widget-copyright';
    copyrightWrapper.style.height = '24px';
    copyrightWrapper.style.display = 'flex';
    copyrightWrapper.style.alignItems = 'center';
    copyrightWrapper.style.paddingLeft = '8px';
    copyrightWrapper.style.fontSize = '11px';
    copyrightWrapper.style.color = '#787b86';
    copyrightWrapper.innerHTML = `
      <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank" style="color: #2962ff; text-decoration: none; font-weight: 600;">
        TradingView
      </a>
      <span style="margin-left: 6px; color: #787b86;">Real-time Live Market Data Official</span>
    `;

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
    container.appendChild(copyrightWrapper);
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

  // Paper Trading Logic
  const handleOpenPaperTrade = (side: 'buy' | 'sell') => {
    const cost = selectedAsset.defaultPrice * tradeAmount;
    if (side === 'buy' && cost > paperBalance) {
      toast.error('Saldo Paper Trading tidak mencukupi untuk membuka posisi ini!');
      return;
    }

    const newPos: PaperPosition = {
      id: `pos_${Date.now()}`,
      symbol: selectedAsset.symbol,
      side,
      entryPrice: selectedAsset.defaultPrice,
      amount: tradeAmount,
      timestamp: Date.now(),
    };

    if (side === 'buy') {
      setPaperBalance((prev) => prev - cost);
    }
    setPositions((prev) => [newPos, ...prev]);
    toast.success(`Posisi ${side.toUpperCase()} ${tradeAmount} ${selectedAsset.symbol} berhasil dibuka!`);
  };

  const handleClosePosition = (posId: string) => {
    const pos = positions.find((p) => p.id === posId);
    if (!pos) return;

    const returnAmount = pos.amount * selectedAsset.defaultPrice;
    if (pos.side === 'buy') {
      setPaperBalance((prev) => prev + returnAmount);
    }
    setPositions((prev) => prev.filter((p) => p.id !== posId));
    toast.info(`Posisi ${pos.symbol} ditutup.`);
  };

  return (
    <div className={cn(
      'flex flex-col bg-[#131722] text-[#d1d4dc] border border-[#2a2e39] overflow-hidden select-none',
      isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full h-full rounded-xl'
    )}>
      {/* ── Top Bar Controls ──────────────────────────────────────────────── */}
      <div className="h-12 border-b border-[#2a2e39] bg-[#1a1e29] px-3 sm:px-4 flex items-center justify-between gap-2 shrink-0 overflow-x-auto no-scrollbar">
        {/* Left: Branding & Asset Selector */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 font-bold text-white text-xs sm:text-sm tracking-tight shrink-0">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline">TradingView</span>
            <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30 px-1.5 py-0 font-bold uppercase tracking-wider">
              REAL-TIME
            </Badge>
          </div>

          <div className="h-4 w-px bg-[#2a2e39] hidden sm:block shrink-0" />

          {/* Quick Asset Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2a2e39] hover:bg-[#2a2e39]/80 border border-[#363a45] text-xs font-bold text-white transition-colors cursor-pointer shrink-0"
              >
                <span>{selectedAsset.symbol}</span>
                <span className="text-[10px] text-[#787b86] hidden md:inline">{selectedAsset.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#787b86]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-[#1e222d] border-[#2a2e39] text-white">
              <DropdownMenuLabel className="text-[10px] text-[#787b86] uppercase tracking-wider">
                Pasar Kripto (Binance Real-Time)
              </DropdownMenuLabel>
              {MARKET_ASSETS.filter((a) => a.category === 'crypto').map((a) => (
                <DropdownMenuItem
                  key={a.symbol}
                  onClick={() => handleSelectAsset(a)}
                  className="flex items-center justify-between text-xs cursor-pointer hover:bg-[#2a2e39]"
                >
                  <span className="font-semibold">{a.symbol}</span>
                  {selectedAsset.symbol === a.symbol && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator className="bg-[#2a2e39]" />
              <DropdownMenuLabel className="text-[10px] text-[#787b86] uppercase tracking-wider">
                Saham & Komoditas (NASDAQ / Gold)
              </DropdownMenuLabel>
              {MARKET_ASSETS.filter((a) => a.category !== 'crypto').map((a) => (
                <DropdownMenuItem
                  key={a.symbol}
                  onClick={() => handleSelectAsset(a)}
                  className="flex items-center justify-between text-xs cursor-pointer hover:bg-[#2a2e39]"
                >
                  <span className="font-semibold">{a.symbol}</span>
                  {selectedAsset.symbol === a.symbol && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Timeframe Buttons */}
          <div className="hidden md:flex items-center gap-1 bg-[#131722] p-0.5 rounded-lg border border-[#2a2e39] shrink-0">
            {(['1m', '5m', '15m', '1h', '4h', '1D'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={cn(
                  'px-2 py-0.5 text-[11px] font-semibold rounded-md transition-colors cursor-pointer',
                  timeframe === tf
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-[#787b86] hover:text-white hover:bg-[#2a2e39]'
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Paper Trading Toggle & Fullscreen */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Peer Presence */}
          {participants.length > 0 && (
            <div className="hidden lg:flex items-center gap-1 text-[11px] text-[#787b86] px-2 py-0.5 rounded-md bg-[#131722] border border-[#2a2e39]">
              <Users className="w-3 h-3 text-emerald-400" />
              <span>{participants.length} di sesi</span>
            </div>
          )}

          {/* Paper Trading Toggle */}
          <button
            type="button"
            onClick={() => setShowPaperTrading(!showPaperTrading)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border',
              showPaperTrading
                ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                : 'bg-[#2a2e39] border-[#363a45] text-white hover:bg-[#2a2e39]/80'
            )}
            title="Buka simulasi trading virtual"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Paper Trading</span>
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-[#2a2e39]/60 hover:bg-[#2a2e39] text-[#787b86] hover:text-white border border-[#363a45] transition-colors cursor-pointer"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Main TradingView Chart Container ───────────────────────────────── */}
      <div className="flex-1 min-h-0 relative w-full h-full bg-[#131722]">
        <div
          ref={containerRef}
          className="tradingview-widget-container w-full h-full"
          style={{ height: '100%', width: '100%' }}
        />

        {/* Paper Trading Dock / Bottom Drawer */}
        {showPaperTrading && (
          <div className="absolute bottom-6 left-4 right-4 max-w-2xl mx-auto rounded-xl border border-[#363a45] bg-[#1e222d]/95 backdrop-blur-md p-3.5 shadow-2xl z-20 space-y-3">
            <div className="flex items-center justify-between border-b border-[#2a2e39] pb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Simulasi Paper Trading (Virtual)</span>
                <span className="text-xs font-mono text-emerald-400 font-bold ml-2">
                  Saldo: ${paperBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPaperTrading(false)}
                className="text-[#787b86] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 flex-1">
                <span className="text-xs text-[#787b86]">Jumlah:</span>
                <input
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(Math.max(0.01, Number(e.target.value)))}
                  step="0.05"
                  className="w-20 px-2 py-1 text-xs font-mono bg-[#131722] border border-[#363a45] rounded-md text-white outline-none focus:border-blue-500"
                />
                <span className="text-xs text-white font-semibold">{selectedAsset.symbol}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleOpenPaperTrade('buy')}
                  className="h-8 px-4 font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                >
                  Beli (Long)
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleOpenPaperTrade('sell')}
                  className="h-8 px-4 font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
                >
                  Jual (Short)
                </Button>
              </div>
            </div>

            {/* Positions list */}
            {positions.length > 0 && (
              <div className="pt-2 border-t border-[#2a2e39] space-y-1.5 max-h-24 overflow-y-auto">
                <span className="text-[10px] text-[#787b86] uppercase tracking-wider block">Posisi Terbuka:</span>
                {positions.map((pos) => (
                  <div key={pos.id} className="flex items-center justify-between text-xs bg-[#131722] px-2.5 py-1.5 rounded-lg border border-[#2a2e39]">
                    <span className={cn('font-bold uppercase text-[10px] px-1 rounded', pos.side === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400')}>
                      {pos.side}
                    </span>
                    <span className="text-white font-medium">{pos.amount} {pos.symbol}</span>
                    <button
                      type="button"
                      onClick={() => handleClosePosition(pos.id)}
                      className="text-[10px] font-semibold text-rose-400 hover:underline cursor-pointer"
                    >
                      Tutup Posisi
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
