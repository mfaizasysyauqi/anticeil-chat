import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import confetti from 'canvas-confetti';
import {
  Dices,
  RotateCcw,
  Bot,
  Users,
  UserPlus,
  Trophy,
  Building2,
  Sparkles,
  ShieldAlert,
  Coins,
  History,
  Info,
  Train,
  Zap,
  Droplets,
  HelpCircle,
  Gift,
  AlertTriangle,
  Flame,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ColonyChannel } from '@/chat/chat-types';

export interface ColonyPolyGameProps {
  channel: ColonyChannel;
  socket: Socket | null;
  currentUserName?: string;
  currentUser?: any;
  participants?: any[];
}

export type TileType = 'property' | 'corner' | 'tax' | 'chance' | 'railroad' | 'utility';

export interface BoardTile {
  index: number;
  name: string;
  type: TileType;
  group?: string; // brown, light-blue, pink, orange, red, yellow, green, dark-blue
  groupColor?: string;
  cost?: number;
  rent?: number;
  ownerId?: string | null;
  outposts?: number; // 0..4 outposts
}

export interface PolyPlayer {
  id: string;
  name: string;
  tokenEmoji: string;
  color: string;
  bgColor: string;
  pollen: number;
  position: number;
  inJail: boolean;
  jailTurns?: number;
  isBot?: boolean;
}

// 40 Tiles definition for Colony Poly
export const BOARD_TILES: Omit<BoardTile, 'ownerId' | 'outposts'>[] = [
  // Bottom row (0 -> 10, Right to Left)
  { index: 0, name: 'START / GO', type: 'corner' },
  { index: 1, name: 'Alpha Outpost', type: 'property', group: 'brown', groupColor: '#a16207', cost: 60, rent: 6 },
  { index: 2, name: 'Colony Chest', type: 'chance' },
  { index: 3, name: 'Beta Outpost', type: 'property', group: 'brown', groupColor: '#a16207', cost: 60, rent: 8 },
  { index: 4, name: 'Pollen Tax', type: 'tax', cost: 100 },
  { index: 5, name: 'Hyperloop North', type: 'railroad', cost: 200, rent: 25 },
  { index: 6, name: 'Gamma Hub', type: 'property', group: 'light-blue', groupColor: '#0284c7', cost: 100, rent: 10 },
  { index: 7, name: 'Chance Card', type: 'chance' },
  { index: 8, name: 'Delta Lab', type: 'property', group: 'light-blue', groupColor: '#0284c7', cost: 100, rent: 10 },
  { index: 9, name: 'Epsilon Node', type: 'property', group: 'light-blue', groupColor: '#0284c7', cost: 120, rent: 12 },
  // Left col (10 -> 20, Bottom to Top)
  { index: 10, name: 'Penjara / Visiting', type: 'corner' },
  { index: 11, name: 'Zeta Core', type: 'property', group: 'pink', groupColor: '#db2777', cost: 140, rent: 14 },
  { index: 12, name: 'Power Grid', type: 'utility', cost: 150, rent: 15 },
  { index: 13, name: 'Eta Tower', type: 'property', group: 'pink', groupColor: '#db2777', cost: 140, rent: 14 },
  { index: 14, name: 'Theta Plaza', type: 'property', group: 'pink', groupColor: '#db2777', cost: 160, rent: 16 },
  { index: 15, name: 'Hyperloop East', type: 'railroad', cost: 200, rent: 25 },
  { index: 16, name: 'Iota District', type: 'property', group: 'orange', groupColor: '#ea580c', cost: 180, rent: 18 },
  { index: 17, name: 'Colony Chest', type: 'chance' },
  { index: 18, name: 'Kappa Zone', type: 'property', group: 'orange', groupColor: '#ea580c', cost: 180, rent: 18 },
  { index: 19, name: 'Lambda Market', type: 'property', group: 'orange', groupColor: '#ea580c', cost: 200, rent: 20 },
  // Top row (20 -> 30, Left to Right)
  { index: 20, name: 'Hive Oasis', type: 'corner' },
  { index: 21, name: 'Mu Center', type: 'property', group: 'red', groupColor: '#dc2626', cost: 220, rent: 22 },
  { index: 22, name: 'Chance Card', type: 'chance' },
  { index: 23, name: 'Nu Boulevard', type: 'property', group: 'red', groupColor: '#dc2626', cost: 220, rent: 22 },
  { index: 24, name: 'Xi Avenue', type: 'property', group: 'red', groupColor: '#dc2626', cost: 240, rent: 24 },
  { index: 25, name: 'Hyperloop South', type: 'railroad', cost: 200, rent: 25 },
  { index: 26, name: 'Omicron Park', type: 'property', group: 'yellow', groupColor: '#eab308', cost: 260, rent: 26 },
  { index: 27, name: 'Pi Garden', type: 'property', group: 'yellow', groupColor: '#eab308', cost: 260, rent: 26 },
  { index: 28, name: 'Water Fusion', type: 'utility', cost: 150, rent: 15 },
  { index: 29, name: 'Rho Estate', type: 'property', group: 'yellow', groupColor: '#eab308', cost: 280, rent: 28 },
  // Right col (30 -> 39, Top to Bottom)
  { index: 30, name: 'Masuk Penjara!', type: 'corner' },
  { index: 31, name: 'Sigma Silicon', type: 'property', group: 'green', groupColor: '#16a34a', cost: 300, rent: 30 },
  { index: 32, name: 'Tau Tech', type: 'property', group: 'green', groupColor: '#16a34a', cost: 300, rent: 30 },
  { index: 33, name: 'Colony Chest', type: 'chance' },
  { index: 34, name: 'Upsilon Heights', type: 'property', group: 'green', groupColor: '#16a34a', cost: 320, rent: 32 },
  { index: 35, name: 'Hyperloop West', type: 'railroad', cost: 200, rent: 25 },
  { index: 36, name: 'Chance Card', type: 'chance' },
  { index: 37, name: 'Anticeil Central', type: 'property', group: 'dark-blue', groupColor: '#2563eb', cost: 350, rent: 40 },
  { index: 38, name: 'Nectar Tax', type: 'tax', cost: 75 },
  { index: 39, name: 'Colony Prime', type: 'property', group: 'dark-blue', groupColor: '#2563eb', cost: 400, rent: 50 },
];

export function ColonyPolyGame({
  channel,
  socket,
  currentUserName,
  currentUser,
  participants,
}: ColonyPolyGameProps) {
  const myName = currentUserName || currentUser?.firstName || 'Pemain 1';
  const myId = currentUser?.id || 'player-1';

  // Game state
  const [players, setPlayers] = useState<PolyPlayer[]>([
    { id: myId, name: myName, tokenEmoji: '🚀', color: '#10b981', bgColor: 'bg-emerald-500', pollen: 1500, position: 0, inJail: false },
    { id: 'bot-1', name: 'Worker Bee 🐝', tokenEmoji: '🐝', color: '#f59e0b', bgColor: 'bg-amber-500', pollen: 1500, position: 0, inJail: false, isBot: true },
    { id: 'bot-2', name: 'Hive Guard 🛡️', tokenEmoji: '🛡️', color: '#06b6d4', bgColor: 'bg-cyan-500', pollen: 1500, position: 0, inJail: false, isBot: true },
  ]);

  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [tiles, setTiles] = useState<BoardTile[]>(() =>
    BOARD_TILES.map((t) => ({ ...t, ownerId: null, outposts: 0 }))
  );

  const [dice, setDice] = useState<[number, number]>([3, 4]);
  const [isRolling, setIsRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    'Selamat datang di Colony Poly! Lempar dadu untuk memulai permainan.',
  ]);

  const [gameMode, setGameMode] = useState<'solo' | 'multiplayer'>('solo');
  const [pendingProperty, setPendingProperty] = useState<BoardTile | null>(null);
  const [inspectedTile, setInspectedTile] = useState<BoardTile | null>(null);

  const isHost = players[0]?.id === myId;
  const activePlayer = players[activePlayerIndex];
  const isMyTurn = activePlayer?.id === myId || (activePlayer?.isBot && (gameMode === 'solo' || isHost));

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Unified Socket.IO sync for voice activities
  useEffect(() => {
    if (!socket) return;

    if (gameMode === 'multiplayer') {
      socket.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
        channelId: channel.id,
        action: 'COLONY_POLY_QUERY_STATE',
        payload: {},
      });
    }

    const handleRemoteActivity = (data: { action: string; payload?: any; fromSocketId?: string }) => {
      if (!data) return;

      if (data.action === 'COLONY_POLY_SYNC_STATE' && data.payload) {
        const p = data.payload;
        if (p.players) setPlayers(p.players);
        if (p.tiles) setTiles(p.tiles);
        if (p.activePlayerIndex !== undefined) setActivePlayerIndex(p.activePlayerIndex);
        if (p.dice) setDice(p.dice);
        if (p.log) setLogs((prev) => [...prev, p.log!]);
        setHasRolled(false);
        setPendingProperty(null);
      } else if (data.action === 'COLONY_POLY_RESET') {
        setPlayers([
          { id: myId, name: myName, tokenEmoji: '🚀', color: '#10b981', bgColor: 'bg-emerald-500', pollen: 1500, position: 0, inJail: false },
          { id: 'bot-1', name: 'Worker Bee 🐝', tokenEmoji: '🐝', color: '#f59e0b', bgColor: 'bg-amber-500', pollen: 1500, position: 0, inJail: false, isBot: true },
          { id: 'bot-2', name: 'Hive Guard 🛡️', tokenEmoji: '🛡️', color: '#06b6d4', bgColor: 'bg-cyan-500', pollen: 1500, position: 0, inJail: false, isBot: true },
        ]);
        setTiles(BOARD_TILES.map((t) => ({ ...t, ownerId: null, outposts: 0 })));
        setActivePlayerIndex(0);
        setDice([3, 4]);
        setHasRolled(false);
        setPendingProperty(null);
        setLogs(['Game Colony Poly direset oleh anggota room.']);
        toast.info('Papan Colony Poly telah direset.');
      } else if (data.action === 'COLONY_POLY_QUERY_STATE') {
        if (isHost && (tiles.some((t) => t.ownerId) || activePlayerIndex > 0)) {
          socket.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
            channelId: channel.id,
            action: 'COLONY_POLY_SYNC_STATE',
            payload: {
              players,
              tiles,
              activePlayerIndex,
              dice,
              log: 'Sinkronisasi status papan dari room host.',
            },
          });
        }
      }
    };

    const handleLegacySync = (data: any) => {
      if (data?.players) setPlayers(data.players);
      if (data?.tiles) setTiles(data.tiles);
      if (data?.activePlayerIndex !== undefined) setActivePlayerIndex(data.activePlayerIndex);
      if (data?.dice) setDice(data.dice);
      if (data?.log) setLogs((prev) => [...prev, data.log!]);
      setHasRolled(false);
      setPendingProperty(null);
    };

    socket.on('COMMUNITY_CALL_ACTIVITY_EVENT', handleRemoteActivity);
    socket.on('COLONY_POLY_SYNC', handleLegacySync);

    return () => {
      socket.off('COMMUNITY_CALL_ACTIVITY_EVENT', handleRemoteActivity);
      socket.off('COLONY_POLY_SYNC', handleLegacySync);
    };
  }, [socket, gameMode, channel.id, isHost, players, tiles, activePlayerIndex, dice, myId, myName]);

  const broadcastState = (
    updatedPlayers: PolyPlayer[],
    updatedTiles: BoardTile[],
    nextActiveIndex: number,
    nextDice: [number, number],
    logMsg?: string
  ) => {
    if (socket && gameMode === 'multiplayer') {
      const payload = {
        players: updatedPlayers,
        tiles: updatedTiles,
        activePlayerIndex: nextActiveIndex,
        dice: nextDice,
        log: logMsg,
      };

      socket.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
        channelId: channel.id,
        action: 'COLONY_POLY_SYNC_STATE',
        payload,
      });

      socket.emit('COLONY_POLY_STATE', {
        channelId: channel.id,
        ...payload,
      });
    }
  };

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev.slice(-30), msg]);
  };

  // Roll Dice logic
  const handleRollDice = () => {
    if (isRolling || hasRolled) return;

    setIsRolling(true);
    let rollsCount = 0;
    const interval = setInterval(() => {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      setDice([d1, d2]);
      rollsCount++;

      if (rollsCount > 8) {
        clearInterval(interval);
        setIsRolling(false);
        setHasRolled(true);

        const finalD1 = Math.floor(Math.random() * 6) + 1;
        const finalD2 = Math.floor(Math.random() * 6) + 1;
        setDice([finalD1, finalD2]);
        const total = finalD1 + finalD2;

        processMovement(total, finalD1 === finalD2);
      }
    }, 60);
  };

  // Process movement and tile landing actions
  const processMovement = (steps: number, isDouble: boolean) => {
    const currentP = players[activePlayerIndex];
    let newPos = (currentP.position + steps) % 40;
    let newPollen = currentP.pollen;

    // Passed or landed on START
    if (currentP.position + steps >= 40) {
      newPollen += 200;
      addLog(`✨ ${currentP.name} melewati START dan mengumpulkan 200 Pollen 🌼!`);
      toast.success(`${currentP.name} +200 Pollen!`);
    }

    // Landed on GO TO JAIL (tile 30)
    let inJail = currentP.inJail;
    if (newPos === 30) {
      newPos = 10;
      inJail = true;
      addLog(`🚨 ${currentP.name} masuk karantina penjara!`);
      toast.error(`${currentP.name} dikirim ke Penjara!`);
    }

    const landedTile = tiles[newPos];
    let updatedTiles = [...tiles];
    let updatedPlayers = [...players];

    addLog(`🎲 ${currentP.name} melempar ${steps} dan mendarat di ${landedTile.name}.`);

    // Handle taxes
    if (landedTile.type === 'tax' && landedTile.cost) {
      newPollen = Math.max(0, newPollen - landedTile.cost);
      addLog(`💸 ${currentP.name} membayar pajak ${landedTile.cost} Pollen.`);
      toast.info(`${currentP.name} membayar pajak ${landedTile.cost} Pollen.`);
    }

    // Handle rent to other player
    if (
      (landedTile.type === 'property' || landedTile.type === 'railroad' || landedTile.type === 'utility') &&
      landedTile.ownerId &&
      landedTile.ownerId !== currentP.id
    ) {
      const owner = updatedPlayers.find((p) => p.id === landedTile.ownerId);
      const rentAmount = (landedTile.rent || 10) * (1 + (landedTile.outposts || 0));
      const payAmount = Math.min(newPollen, rentAmount);

      newPollen -= payAmount;
      if (owner) {
        owner.pollen += payAmount;
        addLog(`💰 ${currentP.name} membayar sewa ${payAmount} Pollen kepada ${owner.name}!`);
        toast.info(`${currentP.name} membayar sewa ${payAmount} Pollen.`);
      }
    }

    updatedPlayers[activePlayerIndex] = {
      ...currentP,
      position: newPos,
      pollen: newPollen,
      inJail,
    };

    setPlayers(updatedPlayers);

    // If landed on unowned buyable property
    if (
      (landedTile.type === 'property' || landedTile.type === 'railroad' || landedTile.type === 'utility') &&
      !landedTile.ownerId
    ) {
      const liveTile = { ...landedTile, position: newPos };
      setPendingProperty(liveTile);

      // If Bot, automatically buy if affordable
      if (currentP.isBot) {
        if (newPollen >= (landedTile.cost || 0)) {
          setTimeout(() => {
            handleBuyProperty(liveTile, updatedPlayers, updatedTiles);
          }, 800);
        } else {
          setPendingProperty(null);
        }
      }
    } else {
      setPendingProperty(null);
    }
  };

  // Buy Property
  const handleBuyProperty = (
    propToBuy = pendingProperty,
    customPlayers = players,
    customTiles = tiles
  ) => {
    if (!propToBuy || !propToBuy.cost) return;

    const currentP = customPlayers[activePlayerIndex];
    if (currentP.pollen < propToBuy.cost) {
      toast.error('Pollen Anda tidak mencukupi untuk membeli distrik ini!');
      return;
    }

    const updatedPollen = currentP.pollen - propToBuy.cost;
    const updatedPlayers = customPlayers.map((p, idx) =>
      idx === activePlayerIndex ? { ...p, pollen: updatedPollen } : p
    );

    const updatedTiles = customTiles.map((t) =>
      t.index === propToBuy.index ? { ...t, ownerId: currentP.id } : t
    );

    setPlayers(updatedPlayers);
    setTiles(updatedTiles);
    setPendingProperty(null);

    confetti({ particleCount: 45, spread: 60, origin: { y: 0.75 } });
    addLog(`🏰 ${currentP.name} membeli ${propToBuy.name} seharga ${propToBuy.cost} Pollen!`);
    toast.success(`${currentP.name} resmi memiliki ${propToBuy.name}!`);

    broadcastState(updatedPlayers, updatedTiles, activePlayerIndex, dice);
  };

  // Build Outpost (House)
  const handleBuildOutpost = (tileIndex: number) => {
    const tile = tiles[tileIndex];
    if (!tile || tile.ownerId !== activePlayer.id || (tile.outposts || 0) >= 4) return;
    const cost = Math.floor((tile.cost || 100) * 0.5);

    if (activePlayer.pollen < cost) {
      toast.error(`Pollen tidak cukup! Butuh ${cost} Pollen untuk membangun Outpost.`);
      return;
    }

    const updatedPlayers = players.map((p, idx) =>
      idx === activePlayerIndex ? { ...p, pollen: p.pollen - cost } : p
    );
    const updatedTiles = tiles.map((t) =>
      t.index === tileIndex ? { ...t, outposts: (t.outposts || 0) + 1 } : t
    );

    setPlayers(updatedPlayers);
    setTiles(updatedTiles);
    toast.success(`Membangun Outpost di ${tile.name}!`);
    addLog(`🏗️ ${activePlayer.name} membangun Outpost level ${(tile.outposts || 0) + 1} di ${tile.name}!`);
    broadcastState(updatedPlayers, updatedTiles, activePlayerIndex, dice);
  };

  // End Turn
  const handleEndTurn = () => {
    setHasRolled(false);
    setPendingProperty(null);
    const nextIndex = (activePlayerIndex + 1) % players.length;
    setActivePlayerIndex(nextIndex);

    const nextP = players[nextIndex];
    addLog(`👉 Giliran berikutnya: ${nextP.name}`);
    broadcastState(players, tiles, nextIndex, dice);

    if (nextP.isBot && (gameMode === 'solo' || isHost)) {
      setTimeout(() => {
        handleBotTurn(nextIndex);
      }, 1000);
    }
  };

  const handleBotTurn = (botIdx: number) => {
    setIsRolling(true);
    setTimeout(() => {
      setIsRolling(false);
      setHasRolled(true);
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      setDice([d1, d2]);
      processMovement(d1 + d2, d1 === d2);

      setTimeout(() => {
        setHasRolled(false);
        setPendingProperty(null);
        const next = (botIdx + 1) % players.length;
        setActivePlayerIndex(next);
        addLog(`👉 Giliran berikutnya: ${players[next].name}`);
        broadcastState(players, tiles, next, [d1, d2]);

        if (players[next].isBot && (gameMode === 'solo' || isHost)) {
          setTimeout(() => handleBotTurn(next), 1000);
        }
      }, 2000);
    }, 600);
  };

  // Sync participants from voice channel into player seats
  const handleSyncVoiceParticipants = () => {
    if (!participants || participants.length === 0) {
      toast.info('Belum ada anggota lain di panggilan ini.');
      return;
    }

    const availableColors = [
      { color: '#f59e0b', bgColor: 'bg-amber-500', tokenEmoji: '🏎️' },
      { color: '#06b6d4', bgColor: 'bg-cyan-500', tokenEmoji: '⚡' },
      { color: '#ec4899', bgColor: 'bg-pink-500', tokenEmoji: '👑' },
    ];

    const remoteParticipants = participants.filter(
      (pt) => pt.id !== myId && pt.userId !== myId && (pt.user?.id || pt.id) !== myId
    );

    if (remoteParticipants.length === 0) {
      toast.info('Hanya ada Anda di voice call. Anda dapat bermain bersama Bot Colony!');
      return;
    }

    const newPlayers: PolyPlayer[] = [
      { id: myId, name: myName, tokenEmoji: '🚀', color: '#10b981', bgColor: 'bg-emerald-500', pollen: 1500, position: 0, inJail: false },
    ];

    remoteParticipants.slice(0, 3).forEach((rp, idx) => {
      const pName = rp.name || rp.userName || rp.user?.firstName || `Pemain ${idx + 2}`;
      const pId = rp.userId || rp.id || `peer-${idx}`;
      const theme = availableColors[idx % availableColors.length];
      newPlayers.push({
        id: pId,
        name: pName,
        tokenEmoji: theme.tokenEmoji,
        color: theme.color,
        bgColor: theme.bgColor,
        pollen: 1500,
        position: 0,
        inJail: false,
        isBot: false,
      });
    });

    if (newPlayers.length === 2) {
      newPlayers.push({
        id: 'bot-1',
        name: 'Worker Bee 🐝',
        tokenEmoji: '🐝',
        color: '#ec4899',
        bgColor: 'bg-pink-500',
        pollen: 1500,
        position: 0,
        inJail: false,
        isBot: true,
      });
    }

    setPlayers(newPlayers);
    setGameMode('multiplayer');
    toast.success(`${newPlayers.length} pemain siap bermain di voice room!`);
    addLog(`👥 Formasi pemain diperbarui: ${newPlayers.map((p) => p.name).join(', ')}`);
    broadcastState(newPlayers, tiles, 0, [3, 4], 'Formasi pemain diperbarui');
  };

  const handleAddBot = () => {
    if (players.length >= 4) {
      toast.error('Maksimal 4 pemain di papan Colony Poly!');
      return;
    }
    const botTemplates = [
      { name: 'Queen Ant 👑', tokenEmoji: '👑', color: '#ec4899', bgColor: 'bg-pink-500' },
      { name: 'Scout Bee ⚡', tokenEmoji: '⚡', color: '#8b5cf6', bgColor: 'bg-purple-500' },
      { name: 'Honey Badger 🦡', tokenEmoji: '🦡', color: '#f97316', bgColor: 'bg-orange-500' },
    ];
    const available = botTemplates.find((bt) => !players.some((p) => p.name.includes(bt.name))) || botTemplates[0];
    const newBot: PolyPlayer = {
      id: `bot-${Date.now()}`,
      name: available.name,
      tokenEmoji: available.tokenEmoji,
      color: available.color,
      bgColor: available.bgColor,
      pollen: 1500,
      position: 0,
      inJail: false,
      isBot: true,
    };
    const updated = [...players, newBot];
    setPlayers(updated);
    toast.success(`Bot ${available.name} bergabung ke permainan!`);
    addLog(`🤖 ${available.name} bergabung ke Colony Poly!`);
    broadcastState(updated, tiles, activePlayerIndex, dice);
  };

  // Reset Game
  const handleResetGame = () => {
    setPlayers([
      { id: myId, name: myName, tokenEmoji: '🚀', color: '#10b981', bgColor: 'bg-emerald-500', pollen: 1500, position: 0, inJail: false },
      { id: 'bot-1', name: 'Worker Bee 🐝', tokenEmoji: '🐝', color: '#f59e0b', bgColor: 'bg-amber-500', pollen: 1500, position: 0, inJail: false, isBot: true },
      { id: 'bot-2', name: 'Hive Guard 🛡️', tokenEmoji: '🛡️', color: '#06b6d4', bgColor: 'bg-cyan-500', pollen: 1500, position: 0, inJail: false, isBot: true },
    ]);
    setTiles(BOARD_TILES.map((t) => ({ ...t, ownerId: null, outposts: 0 })));
    setActivePlayerIndex(0);
    setDice([3, 4]);
    setHasRolled(false);
    setPendingProperty(null);
    setInspectedTile(null);
    setLogs(['Game Colony Poly direset! Siap bermain dari awal.']);
    toast.success('Game Colony Poly telah direset!');

    if (socket && gameMode === 'multiplayer') {
      socket.emit('COMMUNITY_CALL_ACTIVITY_EVENT', {
        channelId: channel.id,
        action: 'COLONY_POLY_RESET',
        payload: {},
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full min-h-0 bg-[#070b12] text-foreground overflow-hidden select-none">
      {/* ── Left / Main: The Colony Poly Board ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 overflow-y-auto">
        {/* Top Game Controls Bar */}
        <div className="w-full max-w-[720px] flex items-center justify-between gap-2 mb-2.5 px-1 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-wider text-emerald-400 flex items-center gap-1.5 drop-shadow-xs">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>COLONY POLY</span>
            </span>
            <Badge variant="outline" className="text-[10px] font-bold border-emerald-500/40 text-emerald-300 bg-emerald-500/15">
              {gameMode === 'solo' ? 'Vs Bot Colony' : 'Voice Multiplayer'}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const nextMode = gameMode === 'solo' ? 'multiplayer' : 'solo';
                setGameMode(nextMode);
                if (nextMode === 'multiplayer' && participants && participants.length > 1) {
                  handleSyncVoiceParticipants();
                }
              }}
              className="h-7 text-[11px] px-2.5 font-semibold bg-[#111827] border-white/10 hover:bg-muted text-foreground"
            >
              {gameMode === 'solo' ? <Users className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Bot className="w-3.5 h-3.5 mr-1 text-amber-400" />}
              {gameMode === 'solo' ? 'Mode Suara' : 'Mode Bot'}
            </Button>
            {players.length < 4 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddBot}
                className="h-7 text-[11px] px-2 bg-[#111827] border-white/10 hover:bg-muted text-muted-foreground hover:text-foreground"
                title="Tambah Bot Pemain"
              >
                <Bot className="w-3 h-3 mr-1" />
                <span>+ Bot</span>
              </Button>
            )}
            {gameMode === 'multiplayer' && participants && participants.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncVoiceParticipants}
                className="h-7 text-[11px] px-2 bg-[#111827] border-white/10 hover:bg-muted text-muted-foreground hover:text-foreground"
                title="Sinkronkan Teman di Voice Call"
              >
                <UserPlus className="w-3 h-3 mr-1" />
                <span>Sync Voice</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetGame}
              className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground"
              title="Reset Permainan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* ── The 40-Tile Monopoly Board ── */}
        <div className="relative w-full max-w-[760px] aspect-square bg-[#0a1628] border-2 border-emerald-500/50 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_30px_rgba(16,185,129,0.08)] p-2.5 flex flex-col justify-between overflow-hidden">
          {/* Felt texture overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-30"
            style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(16,185,129,0.06) 0%, transparent 70%)' }} />

          {/* Top Row (Tiles 20 -> 30, Left to Right) */}
          <div className="grid grid-cols-11 gap-px h-[17%] relative z-10">
            {BOARD_TILES.slice(20, 31).map((tile) => (
              <TileCell
                key={tile.index}
                tile={{ ...tile, ...tiles[tile.index] }}
                side="top"
                players={players.filter((p) => p.position === tile.index)}
                onInspect={() => setInspectedTile({ ...tile, ...tiles[tile.index] })}
              />
            ))}
          </div>

          {/* Middle Row with Center Hub and Left/Right Rows */}
          <div className="flex-1 flex justify-between my-px min-h-0 relative z-10">
            {/* Left Column (Tiles 19 -> 11, top to bottom) */}
            <div className="flex flex-col justify-between w-[17%] gap-px">
              {[19, 18, 17, 16, 15, 14, 13, 12, 11].map((idx) => (
                <TileCell
                  key={idx}
                  tile={{ ...BOARD_TILES[idx], ...tiles[idx] }}
                  side="left"
                  players={players.filter((p) => p.position === idx)}
                  onInspect={() => setInspectedTile({ ...BOARD_TILES[idx], ...tiles[idx] })}
                />
              ))}
            </div>

            {/* Center Felt Area: Game Logo, 3D Dice, Turn Banner & Deed Cards */}
            <div className="flex-1 mx-1 rounded-xl bg-gradient-to-b from-[#0c1828]/95 to-[#060c18]/98 border border-emerald-900/30 p-2 sm:p-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
              {/* Colony watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none">
                <Coins className="w-48 h-48 text-emerald-400" />
              </div>

              {/* Title Deed Card Inspection / Buy Modal */}
              {pendingProperty || inspectedTile ? (
                <DeedCardModal
                  tile={(pendingProperty || inspectedTile)!}
                  isPendingBuy={Boolean(pendingProperty)}
                  canAfford={Boolean(pendingProperty && activePlayer.pollen >= (pendingProperty.cost || 0))}
                  onBuy={() => handleBuyProperty(pendingProperty!)}
                  onPass={() => {
                    setPendingProperty(null);
                    setInspectedTile(null);
                  }}
                  onBuildOutpost={() => {
                    if (inspectedTile) handleBuildOutpost(inspectedTile.index);
                  }}
                  isOwner={inspectedTile?.ownerId === activePlayer.id}
                  activePlayerPollen={activePlayer.pollen}
                />
              ) : (
                <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-[220px]">
                  {/* Turn Announcement Banner */}
                  <div className="flex flex-col items-center gap-1 mb-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      GILIRAN SAAT INI
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xl">{activePlayer?.tokenEmoji}</span>
                      <span className="text-sm sm:text-base font-black text-white tracking-wide leading-tight">
                        {activePlayer?.name}
                      </span>
                    </div>
                    <div className="text-[10px] font-bold text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                      <Coins className="w-3 h-3 text-amber-400" />
                      <span>Saldo: {activePlayer?.pollen} Pollen 🌼</span>
                    </div>
                  </div>

                  {/* 3D Dice Display */}
                  <div className="flex items-center gap-3 my-2">
                    <DiceCube value={dice[0]} isRolling={isRolling} />
                    <DiceCube value={dice[1]} isRolling={isRolling} />
                  </div>

                  {/* Action Controls */}
                  <div className="flex items-center gap-2 mt-1">
                    {!hasRolled ? (
                      <Button
                        size="sm"
                        onClick={handleRollDice}
                        disabled={isRolling || !isMyTurn}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-lg px-4 h-9 rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95"
                      >
                        <Dices className="w-3.5 h-3.5" />
                        <span>{isRolling ? 'Mengocok...' : 'Lempar Dadu!'}</span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handleEndTurn}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-4 h-9 rounded-xl cursor-pointer shadow-lg transition-all hover:scale-105 active:scale-95"
                      >
                        <span>Akhiri Giliran ➔</span>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column (Tiles 31 -> 39, top to bottom) */}
            <div className="flex flex-col justify-between w-[17%] gap-px">
              {[31, 32, 33, 34, 35, 36, 37, 38, 39].map((idx) => (
                <TileCell
                  key={idx}
                  tile={{ ...BOARD_TILES[idx], ...tiles[idx] }}
                  side="right"
                  players={players.filter((p) => p.position === idx)}
                  onInspect={() => setInspectedTile({ ...BOARD_TILES[idx], ...tiles[idx] })}
                />
              ))}
            </div>
          </div>

          {/* Bottom Row (Tiles 10 -> 0, Left to Right) */}
          <div className="grid grid-cols-11 gap-px h-[17%] relative z-10">
            {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((idx) => (
              <TileCell
                key={idx}
                tile={{ ...BOARD_TILES[idx], ...tiles[idx] }}
                side="bottom"
                players={players.filter((p) => p.position === idx)}
                onInspect={() => setInspectedTile({ ...BOARD_TILES[idx], ...tiles[idx] })}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel: Leaderboard, Owned Districts & Event Log ── */}
      <div className="w-full md:w-80 lg:w-84 bg-[#0a0f1d] border-t md:border-t-0 md:border-l border-white/10 flex flex-col shrink-0 select-none">
        {/* Players Standings */}
        <div className="p-3.5 border-b border-white/10">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Trophy className="w-3.5 h-3.5" />
              <span>Peringkat Colony</span>
            </span>
            <span className="text-[10px] text-muted-foreground">Kekayaan</span>
          </div>

          <div className="space-y-1.5">
            {players.map((p, idx) => {
              const ownedTiles = tiles.filter((t) => t.ownerId === p.id);
              const isActive = idx === activePlayerIndex;

              return (
                <div
                  key={p.id}
                  className={cn(
                    'p-2.5 rounded-xl border transition-all flex items-center justify-between',
                    isActive
                      ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm'
                      : 'bg-[#111827]/60 border-white/5'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg shrink-0">{p.tokenEmoji}</span>
                    <div className="truncate">
                      <div className="text-xs font-bold text-foreground truncate flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {p.isBot && <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5">Bot</Badge>}
                        {p.inJail && <Badge variant="destructive" className="text-[8px] px-1 py-0 h-3.5">Penjara</Badge>}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {ownedTiles.length} Distrik ({ownedTiles.reduce((acc, t) => acc + (t.outposts || 0), 0)} Outposts)
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-amber-400 flex items-center justify-end gap-1">
                      <span>{p.pollen}</span>
                      <span className="text-[10px]">🌼</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Owned Properties List / Upgrades */}
        <div className="p-3.5 border-b border-white/10 flex-1 min-h-0 flex flex-col">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-foreground">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <span>Distrik Milik Anda</span>
            </span>
            <span className="text-[10px] text-muted-foreground">
              {tiles.filter((t) => t.ownerId === myId).length} properti
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 [scrollbar-width:thin]">
            {tiles.filter((t) => t.ownerId === myId).length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground px-4">
                Belum ada distrik yang dibeli. Mendaratlah di petak distrik untuk membeli properti!
              </div>
            ) : (
              tiles
                .filter((t) => t.ownerId === myId)
                .map((tile) => {
                  const upgradeCost = Math.floor((tile.cost || 100) * 0.5);
                  const canUpgrade = activePlayer.id === myId && activePlayer.pollen >= upgradeCost && (tile.outposts || 0) < 4;

                  return (
                    <div
                      key={tile.index}
                      className="p-2 rounded-xl border border-white/10 bg-[#111827]/80 flex items-center justify-between gap-2 hover:border-emerald-500/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-2.5 h-7 rounded-sm shrink-0"
                          style={{ backgroundColor: tile.groupColor || '#10b981' }}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-foreground truncate">
                            {tile.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                            <span>Sewa: {(tile.rent || 10) * (1 + (tile.outposts || 0))} 🌼</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-semibold">{tile.outposts || 0}/4 Outpost</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        disabled={!canUpgrade}
                        onClick={() => handleBuildOutpost(tile.index)}
                        className="h-6 text-[10px] px-2 font-bold bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"
                        title={`Bangun Outpost (+${upgradeCost} Pollen)`}
                      >
                        +Outpost ({upgradeCost}🌼)
                      </Button>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Live Game Event Log */}
        <div className="h-44 p-3 flex flex-col bg-black/40">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <History className="w-3 h-3 text-muted-foreground" />
            <span>Riwayat Aktivitas</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 text-xs text-muted-foreground pr-1 [scrollbar-width:thin]">
            {logs.map((log, i) => (
              <div key={i} className="text-[11px] leading-relaxed py-0.5 border-b border-white/5 last:border-none">
                {log}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 3D Realistic Dice with Pips Dots ──
function DiceCube({ value, isRolling }: { value: number; isRolling: boolean }) {
  // Coordinates for the 3x3 dot grid on dice faces
  const pipMap: Record<number, number[]> = {
    1: [4], // Center
    2: [0, 8], // Top-Left, Bottom-Right
    3: [0, 4, 8], // Top-Left, Center, Bottom-Right
    4: [0, 2, 6, 8], // Four Corners
    5: [0, 2, 4, 6, 8], // Four Corners + Center
    6: [0, 2, 3, 5, 6, 8], // Two columns of 3
  };

  const activePips = pipMap[value] || [4];

  return (
    <div
      className={cn(
        'size-14 rounded-2xl bg-gradient-to-br from-white to-zinc-200 border-2 border-zinc-300 shadow-[0_8px_16px_rgba(0,0,0,0.4)] p-2 grid grid-cols-3 grid-rows-3 gap-0.5 items-center justify-items-center transition-all',
        isRolling && 'animate-bounce rotate-12 scale-105'
      )}
    >
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => {
        const isPip = activePips.includes(idx);
        return (
          <div
            key={idx}
            className={cn(
              'size-2.5 rounded-full transition-opacity',
              isPip
                ? value === 1
                  ? 'bg-red-600 shadow-inner'
                  : 'bg-zinc-900 shadow-inner'
                : 'opacity-0'
            )}
          />
        );
      })}
    </div>
  );
}

// ── Interactive Title Deed Card Modal ──
function DeedCardModal({
  tile,
  isPendingBuy,
  canAfford,
  onBuy,
  onPass,
  onBuildOutpost,
  isOwner,
  activePlayerPollen,
}: {
  tile: BoardTile;
  isPendingBuy: boolean;
  canAfford: boolean;
  onBuy: () => void;
  onPass: () => void;
  onBuildOutpost: () => void;
  isOwner: boolean;
  activePlayerPollen: number;
}) {
  const baseRent = tile.rent || 10;
  const upgradeCost = Math.floor((tile.cost || 100) * 0.5);

  return (
    <div className="relative z-20 w-full max-w-[280px] bg-[#0e1726] border-2 border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95">
      {/* Deed Header Banner */}
      <div
        className="p-3 text-center border-b border-black/20 text-white relative"
        style={{ backgroundColor: tile.groupColor || '#0284c7' }}
      >
        <button
          onClick={onPass}
          className="absolute right-2 top-2 text-white/80 hover:text-white p-0.5 rounded-md hover:bg-black/20 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
        <span className="text-[9px] font-black tracking-widest uppercase opacity-90 block">
          SERTIFIKAT DISTRIK
        </span>
        <h4 className="text-sm font-black tracking-wide mt-0.5 truncate uppercase">
          {tile.name}
        </h4>
      </div>

      {/* Deed Content & Rent Table */}
      <div className="p-3.5 space-y-2 text-xs">
        <div className="flex items-center justify-between py-1 border-b border-white/10">
          <span className="text-muted-foreground">Harga Pembelian</span>
          <span className="font-black text-amber-400">{tile.cost} Pollen 🌼</span>
        </div>

        <div className="space-y-1 text-[11px] text-muted-foreground pt-1">
          <div className="flex justify-between">
            <span>Sewa Dasar:</span>
            <span className="text-foreground font-semibold">{baseRent} 🌼</span>
          </div>
          <div className="flex justify-between">
            <span>Dengan 1 Outpost:</span>
            <span className="text-foreground font-semibold">{baseRent * 2} 🌼</span>
          </div>
          <div className="flex justify-between">
            <span>Dengan 2 Outpost:</span>
            <span className="text-foreground font-semibold">{baseRent * 3} 🌼</span>
          </div>
          <div className="flex justify-between">
            <span>Dengan 3 Outpost:</span>
            <span className="text-foreground font-semibold">{baseRent * 4} 🌼</span>
          </div>
          <div className="flex justify-between">
            <span>Dengan Colony Citadel:</span>
            <span className="text-emerald-400 font-bold">{baseRent * 5} 🌼</span>
          </div>
        </div>

        {/* Action Buttons */}
        {isPendingBuy ? (
          <div className="pt-2 flex flex-col gap-1.5">
            <Button
              onClick={onBuy}
              disabled={!canAfford}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9 text-xs shadow-md cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              {canAfford ? `Beli Distrik (${tile.cost} 🌼)` : 'Pollen Tidak Cukup'}
            </Button>
            <Button
              variant="ghost"
              onClick={onPass}
              className="w-full text-muted-foreground hover:text-white h-7 text-xs cursor-pointer"
            >
              Lewati (Jangan Beli)
            </Button>
          </div>
        ) : isOwner ? (
          <div className="pt-2">
            <Button
              onClick={onBuildOutpost}
              disabled={(tile.outposts || 0) >= 4 || activePlayerPollen < upgradeCost}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-8 text-xs cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 mr-1.5" />
              Upgrade Outpost (+{upgradeCost} 🌼)
            </Button>
          </div>
        ) : (
          <div className="pt-1 text-center text-[10px] text-muted-foreground">
            {tile.ownerId ? 'Distrik ini telah dimiliki oleh pemain lain.' : 'Distrik ini masih belum bertuan.'}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Position-Aware Individual Board Tile Cell ──
function TileCell({
  tile,
  side,
  players,
  onInspect,
}: {
  tile: BoardTile;
  side: 'top' | 'bottom' | 'left' | 'right';
  players: PolyPlayer[];
  onInspect: () => void;
}) {
  const isCorner = tile.type === 'corner';

  // Tile icon mapper
  const renderTileIcon = () => {
    if (tile.index === 0) return <span className="text-xs">🏁</span>;
    if (tile.index === 10) return <span className="text-xs">⛓️</span>;
    if (tile.index === 20) return <span className="text-xs">🌴</span>;
    if (tile.index === 30) return <span className="text-xs">🚨</span>;
    if (tile.type === 'railroad') return <Train className="w-3.5 h-3.5 text-sky-400" />;
    if (tile.name.includes('Grid')) return <Zap className="w-3.5 h-3.5 text-amber-400" />;
    if (tile.name.includes('Water')) return <Droplets className="w-3.5 h-3.5 text-cyan-400" />;
    if (tile.name.includes('Chest')) return <Gift className="w-3.5 h-3.5 text-pink-400" />;
    if (tile.name.includes('Chance')) return <HelpCircle className="w-3.5 h-3.5 text-amber-300" />;
    if (tile.type === 'tax') return <span className="text-xs">💸</span>;
    return null;
  };

  // Owner color for ring
  const ownerColors: Record<string, string> = {
    'bg-emerald-500': 'rgba(16,185,129,0.5)',
    'bg-amber-500': 'rgba(245,158,11,0.5)',
    'bg-cyan-500': 'rgba(6,182,212,0.5)',
    'bg-pink-500': 'rgba(236,72,153,0.5)',
    'bg-purple-500': 'rgba(139,92,246,0.5)',
    'bg-orange-500': 'rgba(249,115,22,0.5)',
  };
  const ownerPlayer = tile.ownerId ? players.find(p => p.id === tile.ownerId) : null;
  const ownerGlow = ownerPlayer ? (ownerColors[ownerPlayer.bgColor] || 'rgba(16,185,129,0.4)') : null;

  return (
    <div
      onClick={onInspect}
      className={cn(
        'relative rounded-sm border flex overflow-hidden transition-all select-none leading-none cursor-pointer group',
        side === 'bottom' && 'flex-col',
        side === 'top' && 'flex-col',
        side === 'left' && 'flex-row',
        side === 'right' && 'flex-row',
        isCorner
          ? 'bg-[#1a2d46] border-emerald-700/60 font-bold'
          : tile.ownerId
            ? 'bg-[#0e1f35] border-white/20 hover:border-white/40'
            : 'bg-[#0c1828] border-white/8 hover:border-emerald-400/60 hover:bg-[#112038]',
      )}
      style={ownerGlow ? { boxShadow: `inset 0 0 0 1.5px ${ownerGlow}` } : undefined}
    >
      {/* Color Banner - Inward-facing orientation matching classic Monopoly */}
      {tile.groupColor && (
        <div
          className={cn(
            'shrink-0',
            side === 'bottom' && 'w-full h-3 order-first',
            side === 'top' && 'w-full h-3 order-last',
            side === 'left' && 'h-full w-3 order-last',
            side === 'right' && 'h-full w-3 order-first'
          )}
          style={{
            backgroundColor: tile.groupColor,
            boxShadow: tile.ownerId ? `0 0 6px ${tile.groupColor}88` : undefined,
          }}
        />
      )}

      {/* Tile Center Info */}
      <div className={cn(
        'flex-1 flex flex-col items-center justify-center text-center overflow-hidden',
        isCorner ? 'p-0.5' : 'p-px',
      )}>
        <span className="shrink-0">{renderTileIcon()}</span>
        <span className={cn(
          'font-semibold text-white/85 group-hover:text-white leading-[1.1] text-center w-full',
          isCorner ? 'text-[8px] font-black' : 'text-[7px]',
          // For side tiles, rotate the text to fit better
          (side === 'left' || side === 'right') ? 'writing-mode-vertical' : '',
        )}
          style={side === 'left' || side === 'right'
            ? { writingMode: 'vertical-rl', textOrientation: 'mixed', transform: side === 'left' ? 'rotate(180deg)' : 'none' }
            : {}
          }
        >
          {tile.name}
        </span>
        {tile.cost && !tile.ownerId && (
          <span className="text-[6.5px] font-bold text-amber-300 shrink-0 mt-px">
            {tile.cost}🌼
          </span>
        )}
        {tile.ownerId && ownerPlayer && (
          <span className="text-[6px] font-bold shrink-0 mt-px" style={{ color: ownerPlayer.color }}>
            {ownerPlayer.tokenEmoji}
          </span>
        )}
      </div>

      {/* Outpost stars */}
      {(tile.outposts ?? 0) > 0 && (
        <div className="absolute top-0.5 right-0.5 z-10 bg-black/80 px-0.5 rounded-sm">
          <span className="text-[6px] text-emerald-400 font-black">★{tile.outposts}</span>
        </div>
      )}

      {/* Player Tokens currently on this tile */}
      {players.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center gap-px z-20 pointer-events-none bg-black/50">
          {players.map((p) => (
            <div
              key={p.id}
              className="size-4 rounded-full border border-white/80 flex items-center justify-center shadow-lg"
              style={{ backgroundColor: p.color + 'dd', fontSize: 9 }}
              title={p.name}
            >
              {p.tokenEmoji}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
