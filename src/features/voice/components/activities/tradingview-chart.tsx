import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Socket } from 'socket.io-client';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LineData,
  type HistogramData,
  type Time,
} from 'lightweight-charts';
import {
  TrendingUp,
  BarChart3,
  LineChart as LineChartIcon,
  Play,
  Pause,
  RotateCcw,
  Camera,
  Layers,
  ChevronDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Users,
  ShieldCheck,
  Check,
  X,
  PlusCircle,
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
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
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

export type ChartType = 'candlestick' | 'line' | 'area';
export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1D';

export interface MarketAsset {
  symbol: string;
  name: string;
  category: 'crypto' | 'stocks' | 'forex';
  basePrice: number;
  volatility: number;
  precision: number;
  currency: string;
}

const MARKET_ASSETS: MarketAsset[] = [
  { symbol: 'BTC/USDT', name: 'Bitcoin', category: 'crypto', basePrice: 96450, volatility: 350, precision: 2, currency: '$' },
  { symbol: 'ETH/USDT', name: 'Ethereum', category: 'crypto', basePrice: 2840, volatility: 25, precision: 2, currency: '$' },
  { symbol: 'SOL/USDT', name: 'Solana', category: 'crypto', basePrice: 198.5, volatility: 4.5, precision: 2, currency: '$' },
  { symbol: 'NVDA', name: 'NVIDIA Corp', category: 'stocks', basePrice: 142.8, volatility: 2.1, precision: 2, currency: '$' },
  { symbol: 'AAPL', name: 'Apple Inc', category: 'stocks', basePrice: 236.4, volatility: 1.8, precision: 2, currency: '$' },
  { symbol: 'TSLA', name: 'Tesla Inc', category: 'stocks', basePrice: 348.9, volatility: 6.2, precision: 2, currency: '$' },
  { symbol: 'GOLD', name: 'Gold / USD', category: 'stocks', basePrice: 2915.0, volatility: 12.0, precision: 2, currency: '$' },
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', category: 'forex', basePrice: 1.048, volatility: 0.002, precision: 4, currency: '€' },
];

interface PaperPosition {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  amount: number;
  timestamp: number;
}

// Helper to generate realistic historical OHLCV data
function generateHistoricalBars(asset: MarketAsset, barCount = 150): {
  candles: CandlestickData<Time>[];
  volumes: HistogramData<Time>[];
} {
  const candles: CandlestickData<Time>[] = [];
  const volumes: HistogramData<Time>[] = [];

  const nowSec = Math.floor(Date.now() / 1000);
  const intervalSec = 60 * 5; // 5 min intervals
  let currentPrice = asset.basePrice;

  const startSec = nowSec - barCount * intervalSec;

  for (let i = 0; i < barCount; i++) {
    const time = (startSec + i * intervalSec) as Time;
    const delta = (Math.random() - 0.49) * asset.volatility;
    const open = currentPrice;
    const close = Math.max(open + delta, asset.basePrice * 0.2);
    const high = Math.max(open, close) + Math.random() * (asset.volatility * 0.6);
    const low = Math.min(open, close) - Math.random() * (asset.volatility * 0.6);
    const isUp = close >= open;

    candles.push({
      time,
      open: Number(open.toFixed(asset.precision)),
      high: Number(high.toFixed(asset.precision)),
      low: Number(low.toFixed(asset.precision)),
      close: Number(close.toFixed(asset.precision)),
    });

    const volumeVal = Math.floor(Math.random() * 80 + 20);
    volumes.push({
      time,
      value: volumeVal,
      color: isUp ? 'rgba(38, 166, 154, 0.45)' : 'rgba(239, 83, 80, 0.45)',
    });

    currentPrice = close;
  }

  return { candles, volumes };
}

// Calculate Simple Moving Average
function calculateSMA(data: CandlestickData<Time>[], period = 20): LineData<Time>[] {
  const sma: LineData<Time>[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) continue;
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    sma.push({
      time: data[i].time,
      value: Number((sum / period).toFixed(2)),
    });
  }
  return sma;
}

// Calculate Exponential Moving Average
function calculateEMA(data: CandlestickData<Time>[], period = 50): LineData<Time>[] {
  const ema: LineData<Time>[] = [];
  if (data.length < period) return ema;

  const k = 2 / (period + 1);
  let prevEma = data.slice(0, period).reduce((acc, curr) => acc + curr.close, 0) / period;
  ema.push({ time: data[period - 1].time, value: Number(prevEma.toFixed(2)) });

  for (let i = period; i < data.length; i++) {
    const close = data[i].close;
    prevEma = close * k + prevEma * (1 - k);
    ema.push({ time: data[i].time, value: Number(prevEma.toFixed(2)) });
  }
  return ema;
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
  const [timeframe, setTimeframe] = useState<Timeframe>('5m');
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [showSMA, setShowSMA] = useState(true);
  const [showEMA, setShowEMA] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);

  // Price & stats
  const [currentPrice, setCurrentPrice] = useState<number>(selectedAsset.basePrice);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(2.45);
  const [high24h, setHigh24h] = useState<number>(selectedAsset.basePrice * 1.035);
  const [low24h, setLow24h] = useState<number>(selectedAsset.basePrice * 0.975);
  const [volume24h, setVolume24h] = useState<number>(18420.5);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);

  // Crosshair hover OHLC
  const [hoverBar, setHoverBar] = useState<CandlestickData<Time> | null>(null);

  // Paper trading simulation
  const [showPaperTrading, setShowPaperTrading] = useState(false);
  const [paperBalance, setPaperBalance] = useState<number>(10000);
  const [positions, setPositions] = useState<PaperPosition[]>([]);
  const [tradeAmount, setTradeAmount] = useState<number>(0.1);

  // Refs
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const smaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const emaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const currentBarsRef = useRef<CandlestickData<Time>[]>([]);

  // 1. Initialize TradingView Lightweight Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: '#131722' },
        textColor: '#949ba4',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(38, 43, 54, 0.6)' },
        horzLines: { color: 'rgba(38, 43, 54, 0.6)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#555b6e',
          width: 1,
          style: 1, // LineStyle.Dashed
          labelBackgroundColor: '#2962ff',
        },
        horzLine: {
          color: '#555b6e',
          width: 1,
          style: 1,
          labelBackgroundColor: '#2962ff',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(42, 46, 57, 0.8)',
        visible: true,
      },
      timeScale: {
        borderColor: 'rgba(42, 46, 57, 0.8)',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartApiRef.current = chart;

    // Add Volume Series (at bottom)
    const volSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '', // overlay
    });
    volSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeriesRef.current = volSeries;

    // Add Main Price Series based on initial chartType
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });
    candleSeriesRef.current = candleSeries;

    const areaSeries = chart.addSeries(AreaSeries, {
      topColor: 'rgba(41, 98, 255, 0.5)',
      bottomColor: 'rgba(41, 98, 255, 0.02)',
      lineColor: '#2962ff',
      lineWidth: 2,
      visible: false,
    });
    areaSeriesRef.current = areaSeries;

    const lineSeries = chart.addSeries(LineSeries, {
      color: '#2962ff',
      lineWidth: 2,
      visible: false,
    });
    lineSeriesRef.current = lineSeries;

    // Add SMA 20 (Amber)
    const smaSeries = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 2,
      title: 'SMA 20',
    });
    smaSeriesRef.current = smaSeries;

    // Add EMA 50 (Cyan)
    const emaSeries = chart.addSeries(LineSeries, {
      color: '#06b6d4',
      lineWidth: 2,
      title: 'EMA 50',
    });
    emaSeriesRef.current = emaSeries;

    // Crosshair move listener for header inspector
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData) {
        setHoverBar(null);
        return;
      }
      const data = param.seriesData.get(candleSeries) as CandlestickData<Time> | undefined;
      if (data) {
        setHoverBar(data);
      }
    });

    // Resize observer
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartApiRef.current = null;
    };
  }, []);

  // 2. Load historical data whenever selectedAsset or timeframe changes
  const loadMarketData = useCallback(() => {
    if (!chartApiRef.current) return;

    const { candles, volumes } = generateHistoricalBars(selectedAsset, 160);
    currentBarsRef.current = candles;

    const lastBar = candles[candles.length - 1];
    if (lastBar) {
      setCurrentPrice(lastBar.close);
      const firstBar = candles[0];
      const diffPct = ((lastBar.close - firstBar.open) / firstBar.open) * 100;
      setPriceChangePercent(Number(diffPct.toFixed(2)));

      const prices = candles.map((c) => c.close);
      setHigh24h(Math.max(...prices));
      setLow24h(Math.min(...prices));
    }

    // Set series data
    if (candleSeriesRef.current) candleSeriesRef.current.setData(candles);
    if (volumeSeriesRef.current) volumeSeriesRef.current.setData(volumes);

    const linePoints: LineData<Time>[] = candles.map((c) => ({ time: c.time, value: c.close }));
    if (areaSeriesRef.current) areaSeriesRef.current.setData(linePoints);
    if (lineSeriesRef.current) lineSeriesRef.current.setData(linePoints);

    // Indicators
    const smaData = calculateSMA(candles, 20);
    if (smaSeriesRef.current) smaSeriesRef.current.setData(smaData);

    const emaData = calculateEMA(candles, 50);
    if (emaSeriesRef.current) emaSeriesRef.current.setData(emaData);

    chartApiRef.current.timeScale().fitContent();
  }, [selectedAsset]);

  useEffect(() => {
    loadMarketData();
  }, [loadMarketData, timeframe]);

  // 3. Update Chart Type Visibility
  useEffect(() => {
    if (!candleSeriesRef.current || !areaSeriesRef.current || !lineSeriesRef.current) return;

    candleSeriesRef.current.applyOptions({ visible: chartType === 'candlestick' });
    areaSeriesRef.current.applyOptions({ visible: chartType === 'area' });
    lineSeriesRef.current.applyOptions({ visible: chartType === 'line' });
  }, [chartType]);

  // 4. Update Indicators Visibility
  useEffect(() => {
    if (smaSeriesRef.current) smaSeriesRef.current.applyOptions({ visible: showSMA });
    if (emaSeriesRef.current) emaSeriesRef.current.applyOptions({ visible: showEMA });
    if (volumeSeriesRef.current) volumeSeriesRef.current.applyOptions({ visible: showVolume });
  }, [showSMA, showEMA, showVolume]);

  // 5. Realtime Tick Streaming Simulation
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      if (currentBarsRef.current.length === 0) return;

      const lastIdx = currentBarsRef.current.length - 1;
      const lastBar = currentBarsRef.current[lastIdx];

      // Tick jump
      const tickDelta = (Math.random() - 0.49) * (selectedAsset.volatility * 0.12);
      const newClose = Number(Math.max(lastBar.close + tickDelta, 1).toFixed(selectedAsset.precision));
      const newHigh = Number(Math.max(lastBar.high, newClose).toFixed(selectedAsset.precision));
      const newLow = Number(Math.min(lastBar.low, newClose).toFixed(selectedAsset.precision));

      const isUp = newClose >= lastBar.close;
      setPriceFlash(isUp ? 'up' : 'down');
      setTimeout(() => setPriceFlash(null), 600);

      const updatedBar: CandlestickData<Time> = {
        time: lastBar.time,
        open: lastBar.open,
        high: newHigh,
        low: newLow,
        close: newClose,
      };

      currentBarsRef.current[lastIdx] = updatedBar;
      setCurrentPrice(newClose);

      if (candleSeriesRef.current) candleSeriesRef.current.update(updatedBar);
      if (areaSeriesRef.current) areaSeriesRef.current.update({ time: lastBar.time, value: newClose });
      if (lineSeriesRef.current) lineSeriesRef.current.update({ time: lastBar.time, value: newClose });

      // Update 24h stats
      setHigh24h((prev) => Math.max(prev, newHigh));
      setLow24h((prev) => Math.min(prev, newLow));
      setVolume24h((prev) => Number((prev + Math.random() * 0.5).toFixed(1)));
    }, 1500);

    return () => clearInterval(interval);
  }, [isLiveStreaming, selectedAsset]);

  // 6. Broadcast symbol change across voice activity room via socket
  const handleSelectAsset = (asset: MarketAsset) => {
    setSelectedAsset(asset);
    if (socket && channel?.id) {
      socket.emit('activity_action', {
        channelId: channel.id,
        action: 'tradingview_asset_change',
        assetSymbol: asset.symbol,
        by: currentUserName,
      });
    }
  };

  // Socket listener for room synchronization
  useEffect(() => {
    if (!socket || !channel?.id) return;

    const handleAction = (payload: any) => {
      if (payload.action === 'tradingview_asset_change' && payload.assetSymbol) {
        const found = MARKET_ASSETS.find((a) => a.symbol === payload.assetSymbol);
        if (found && found.symbol !== selectedAsset.symbol) {
          setSelectedAsset(found);
          toast.info(t('{{user}} mengganti grafik ke {{symbol}}', {
            user: payload.by || 'Rekan',
            symbol: found.symbol,
          }));
        }
      }
    };

    socket.on('activity_action', handleAction);
    return () => {
      socket.off('activity_action', handleAction);
    };
  }, [socket, channel?.id, selectedAsset.symbol, t]);

  // Paper Trading actions
  const handleExecutePaperTrade = (side: 'buy' | 'sell') => {
    const cost = currentPrice * tradeAmount;
    if (side === 'buy' && cost > paperBalance) {
      toast.error(t('Saldo demo tidak mencukupi untuk membuka posisi!'));
      return;
    }

    const newPos: PaperPosition = {
      id: `pos-${Date.now()}`,
      symbol: selectedAsset.symbol,
      side,
      entryPrice: currentPrice,
      amount: tradeAmount,
      timestamp: Date.now(),
    };

    if (side === 'buy') {
      setPaperBalance((prev) => prev - cost);
    }

    setPositions((prev) => [newPos, ...prev]);
    toast.success(
      t('Order {{side}} {{amount}} {{symbol}} pada harga {{price}} berhasil!', {
        side: side.toUpperCase(),
        amount: tradeAmount,
        symbol: selectedAsset.symbol,
        price: `${selectedAsset.currency}${currentPrice.toLocaleString()}`,
      })
    );
  };

  const handleClosePosition = (posId: string) => {
    const pos = positions.find((p) => p.id === posId);
    if (!pos) return;

    const pnl = pos.side === 'buy'
      ? (currentPrice - pos.entryPrice) * pos.amount
      : (pos.entryPrice - currentPrice) * pos.amount;

    setPaperBalance((prev) => prev + (pos.side === 'buy' ? pos.entryPrice * pos.amount : 0) + pnl);
    setPositions((prev) => prev.filter((p) => p.id !== posId));

    if (pnl >= 0) {
      toast.success(t('Posisi ditutup dengan Profit: +${{amount}}', { amount: pnl.toFixed(2) }));
    } else {
      toast.info(t('Posisi ditutup dengan Loss: -${{amount}}', { amount: Math.abs(pnl).toFixed(2) }));
    }
  };

  // Capture screenshot of chart
  const handleTakeSnapshot = () => {
    if (!chartContainerRef.current) return;
    const canvas = chartContainerRef.current.querySelector('canvas');
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `anticeil-chart-${selectedAsset.symbol.replace('/', '-')}-${Date.now()}.png`;
      a.click();
      toast.success(t('Snapshot grafik berhasil diunduh!'));
    }
  };

  const displayedOHLC = useMemo(() => {
    if (hoverBar) return hoverBar;
    if (currentBarsRef.current.length > 0) {
      return currentBarsRef.current[currentBarsRef.current.length - 1];
    }
    return null;
  }, [hoverBar]);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#131722] text-[#d1d4dc] overflow-hidden select-none font-sans">
      {/* ── Top Bar / Main TradingView Navigation Ribbon ────────────────────── */}
      <div className="h-12 border-b border-[#2a2e39] bg-[#1e222d] px-3 sm:px-4 flex items-center justify-between shrink-0 gap-2 overflow-x-auto no-scrollbar">
        {/* Left: Brand & Symbol Selector */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-blue-500 font-black text-sm tracking-tight shrink-0">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span className="hidden sm:inline-block text-white font-bold">TradingView</span>
            <Badge className="text-[9px] px-1.5 py-0 bg-blue-500/20 text-blue-400 border border-blue-500/30">
              MIT / APACHE 2.0
            </Badge>
          </div>

          <div className="h-4 w-[1px] bg-[#2a2e39] hidden sm:block" />

          {/* Asset Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#2a2e39]/60 hover:bg-[#2a2e39] text-xs font-bold text-white transition-colors cursor-pointer border border-[#363a45]"
              >
                <span>{selectedAsset.symbol}</span>
                <span className="text-[10px] text-[#787b86] font-normal hidden md:inline">
                  {selectedAsset.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#787b86] ml-0.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-[#1e222d] border-[#2a2e39] text-foreground z-[90]">
              <DropdownMenuLabel className="text-[10px] text-[#787b86] uppercase font-bold tracking-wider">
                {t('Pilih Instrumen Pasar')}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#2a2e39]" />
              {MARKET_ASSETS.map((asset) => (
                <DropdownMenuItem
                  key={asset.symbol}
                  onClick={() => handleSelectAsset(asset)}
                  className={cn(
                    'text-xs cursor-pointer justify-between py-1.5 px-2.5 hover:bg-[#2a2e39]',
                    selectedAsset.symbol === asset.symbol && 'bg-blue-600/20 text-blue-400 font-bold'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{asset.symbol}</span>
                    <span className="text-[10px] text-[#787b86]">{asset.name}</span>
                  </div>
                  {selectedAsset.symbol === asset.symbol && (
                    <Check className="w-3.5 h-3.5 text-blue-400" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Realtime Price Ticker Badge */}
          <div className="flex items-center gap-1.5 text-xs font-bold shrink-0">
            <span
              className={cn(
                'px-2 py-0.5 rounded transition-all duration-300 font-mono text-xs font-black',
                priceFlash === 'up'
                  ? 'bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-500'
                  : priceFlash === 'down'
                  ? 'bg-rose-500/30 text-rose-300 ring-1 ring-rose-500'
                  : 'bg-[#2a2e39] text-white'
              )}
            >
              {selectedAsset.currency}{currentPrice.toLocaleString(undefined, { minimumFractionDigits: selectedAsset.precision })}
            </span>
            <span
              className={cn(
                'text-[11px] font-semibold flex items-center',
                priceChangePercent >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'
              )}
            >
              {priceChangePercent >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5 inline mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 inline mr-0.5" />
              )}
              {priceChangePercent >= 0 ? `+${priceChangePercent}%` : `${priceChangePercent}%`}
            </span>
          </div>
        </div>

        {/* Center / Right: Timeframe Pills, Chart Type, Indicator Toggles */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Timeframes */}
          <div className="flex items-center bg-[#131722] p-0.5 rounded-lg border border-[#2a2e39]">
            {(['1m', '5m', '15m', '1h', '4h', '1D'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={cn(
                  'px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer',
                  timeframe === tf
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-[#787b86] hover:text-white hover:bg-[#2a2e39]/60'
                )}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-[#2a2e39] hidden sm:block" />

          {/* Chart Type Toggle */}
          <div className="flex items-center bg-[#131722] p-0.5 rounded-lg border border-[#2a2e39]">
            <button
              type="button"
              onClick={() => setChartType('candlestick')}
              title={t('Candlestick')}
              className={cn(
                'p-1 rounded transition-colors cursor-pointer',
                chartType === 'candlestick' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86] hover:text-white'
              )}
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setChartType('area')}
              title={t('Area Chart')}
              className={cn(
                'p-1 rounded transition-colors cursor-pointer',
                chartType === 'area' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86] hover:text-white'
              )}
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setChartType('line')}
              title={t('Line Chart')}
              className={cn(
                'p-1 rounded transition-colors cursor-pointer',
                chartType === 'line' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86] hover:text-white'
              )}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Indicators Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#2a2e39]/60 hover:bg-[#2a2e39] text-xs font-medium text-[#d1d4dc] transition-colors cursor-pointer border border-[#363a45]"
                title={t('Indikator Teknikal')}
              >
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden md:inline">{t('Indikator')}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 bg-[#1e222d] border-[#2a2e39] text-foreground z-[90]">
              <DropdownMenuLabel className="text-[10px] text-[#787b86] uppercase font-bold tracking-wider">
                {t('Overlay Indikator')}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#2a2e39]" />
              <DropdownMenuItem
                onClick={() => setShowSMA(!showSMA)}
                className="flex items-center justify-between text-xs cursor-pointer py-1.5 hover:bg-[#2a2e39]"
              >
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-amber-500" />
                  <span>SMA (20)</span>
                </div>
                {showSMA && <Check className="w-3.5 h-3.5 text-amber-500" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowEMA(!showEMA)}
                className="flex items-center justify-between text-xs cursor-pointer py-1.5 hover:bg-[#2a2e39]"
              >
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-cyan-400" />
                  <span>EMA (50)</span>
                </div>
                {showEMA && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowVolume(!showVolume)}
                className="flex items-center justify-between text-xs cursor-pointer py-1.5 hover:bg-[#2a2e39]"
              >
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-500" />
                  <span>Volume Bars</span>
                </div>
                {showVolume && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Live Play/Pause */}
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setIsLiveStreaming(!isLiveStreaming)}
                className={cn(
                  'p-1.5 rounded-lg border transition-colors cursor-pointer',
                  isLiveStreaming
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                    : 'bg-[#2a2e39] border-[#363a45] text-amber-400 hover:bg-[#2a2e39]/80'
                )}
                aria-label={isLiveStreaming ? t('Jeda Live Stream') : t('Lanjutkan Live Stream')}
              >
                {isLiveStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="font-semibold text-xs">
              {isLiveStreaming ? t('Jeda Live Tick') : t('Lanjutkan Live Tick')}
            </TooltipContent>
          </Tooltip>

          {/* Reset View */}
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => chartApiRef.current?.timeScale().fitContent()}
                className="p-1.5 rounded-lg bg-[#2a2e39]/60 hover:bg-[#2a2e39] text-[#787b86] hover:text-white border border-[#363a45] transition-colors cursor-pointer"
                aria-label={t('Reset Tampilan Grafik')}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="font-semibold text-xs">
              {t('Reset Tampilan')}
            </TooltipContent>
          </Tooltip>

          {/* Snapshot Button */}
          <Tooltip delayDuration={150}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleTakeSnapshot}
                className="p-1.5 rounded-lg bg-[#2a2e39]/60 hover:bg-[#2a2e39] text-[#787b86] hover:text-white border border-[#363a45] transition-colors cursor-pointer"
                aria-label={t('Unduh Screenshot Grafik')}
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6} className="font-semibold text-xs">
              {t('Ambil Tangkapan Layar')}
            </TooltipContent>
          </Tooltip>

          {/* Toggle Paper Trading Panel */}
          <button
            type="button"
            onClick={() => setShowPaperTrading(!showPaperTrading)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border',
              showPaperTrading
                ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                : 'bg-[#2a2e39] border-[#363a45] text-white hover:bg-[#2a2e39]/80'
            )}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('Paper Trading')}</span>
          </button>
        </div>
      </div>

      {/* ── Secondary Stats & OHLC Inspector Bar ────────────────────────────── */}
      <div className="h-8 border-b border-[#2a2e39] bg-[#161a25] px-3 sm:px-4 flex items-center justify-between text-[11px] text-[#787b86] font-mono shrink-0 overflow-x-auto no-scrollbar gap-4">
        {displayedOHLC ? (
          <div className="flex items-center gap-3 shrink-0">
            <span>
              O: <strong className="text-white">{selectedAsset.currency}{displayedOHLC.open}</strong>
            </span>
            <span>
              H: <strong className="text-[#26a69a]">{selectedAsset.currency}{displayedOHLC.high}</strong>
            </span>
            <span>
              L: <strong className="text-[#ef5350]">{selectedAsset.currency}{displayedOHLC.low}</strong>
            </span>
            <span>
              C: <strong className={displayedOHLC.close >= displayedOHLC.open ? 'text-[#26a69a]' : 'text-[#ef5350]'}>
                {selectedAsset.currency}{displayedOHLC.close}
              </strong>
            </span>
          </div>
        ) : (
          <div className="text-[10px] text-[#787b86]">
            {t('Arahkan kursor ke grafik untuk inspeksi harga OHLC')}
          </div>
        )}

        <div className="flex items-center gap-3 shrink-0 text-[10px]">
          <span>
            24h H: <strong className="text-white">{selectedAsset.currency}{high24h.toLocaleString()}</strong>
          </span>
          <span>
            24h L: <strong className="text-white">{selectedAsset.currency}{low24h.toLocaleString()}</strong>
          </span>
          <span className="hidden md:inline">
            24h Vol: <strong className="text-white">{volume24h.toLocaleString()} {selectedAsset.symbol.split('/')[0]}</strong>
          </span>
          {participants && participants.length > 0 && (
            <div className="flex items-center gap-1 text-emerald-400 ml-2">
              <Users className="w-3 h-3" />
              <span>{participants.length} {t('Menonton')}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Chart Area ────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 relative w-full h-full">
        <div ref={chartContainerRef} className="w-full h-full absolute inset-0" />

        {/* Floating Paper Trading Quick Order Drawer ─────────────────────────── */}
        {showPaperTrading && (
          <div className="absolute bottom-3 left-3 z-30 bg-[#1e222d]/95 backdrop-blur-md border border-[#2a2e39] rounded-xl p-3 shadow-2xl w-[310px] sm:w-[340px] text-xs space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#2a2e39] pb-2">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>{t('Simulasi Paper Trading')}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPaperTrading(false)}
                className="text-[#787b86] hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] bg-[#131722] p-2 rounded-lg border border-[#2a2e39]">
              <span className="text-[#787b86]">{t('Saldo Demo USDT:')}</span>
              <strong className="text-emerald-400 font-mono text-xs">
                ${paperBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </strong>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#787b86] shrink-0">{t('Jumlah:')}</span>
              <div className="flex items-center gap-1 flex-1">
                {[0.05, 0.1, 0.5, 1.0].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTradeAmount(amt)}
                    className={cn(
                      'flex-1 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer',
                      tradeAmount === amt
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-[#131722] border-[#2a2e39] text-[#787b86] hover:text-white'
                    )}
                  >
                    {amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => handleExecutePaperTrade('buy')}
                className="bg-[#26a69a] hover:bg-[#26a69a]/90 text-white font-bold text-xs h-8 cursor-pointer shadow-xs border-0"
              >
                <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                {t('Buy / Long')}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleExecutePaperTrade('sell')}
                className="bg-[#ef5350] hover:bg-[#ef5350]/90 text-white font-bold text-xs h-8 cursor-pointer shadow-xs border-0"
              >
                <ArrowDownRight className="w-3.5 h-3.5 mr-1" />
                {t('Sell / Short')}
              </Button>
            </div>

            {/* Active Positions */}
            {positions.length > 0 && (
              <div className="pt-2 border-t border-[#2a2e39] space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                <span className="text-[10px] font-bold text-[#787b86] uppercase block">
                  {t('Posisi Terbuka ({{count}})', { count: positions.length })}
                </span>
                {positions.map((pos) => {
                  const currentPnl = pos.side === 'buy'
                    ? (currentPrice - pos.entryPrice) * pos.amount
                    : (pos.entryPrice - currentPrice) * pos.amount;
                  const isProfitable = currentPnl >= 0;

                  return (
                    <div
                      key={pos.id}
                      className="flex items-center justify-between p-1.5 rounded bg-[#131722] border border-[#2a2e39] text-[10px] font-mono"
                    >
                      <div>
                        <span className={pos.side === 'buy' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {pos.side.toUpperCase()}
                        </span>{' '}
                        <span>{pos.amount} {pos.symbol}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={isProfitable ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {isProfitable ? `+$${currentPnl.toFixed(2)}` : `-$${Math.abs(currentPnl).toFixed(2)}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleClosePosition(pos.id)}
                          className="px-1.5 py-0.5 rounded bg-muted/30 hover:bg-muted text-muted-foreground hover:text-white text-[9px] cursor-pointer"
                        >
                          {t('Tutup')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
