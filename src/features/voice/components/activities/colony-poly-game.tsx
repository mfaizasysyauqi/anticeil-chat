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
  group?: string; // color group: brown, light-blue, pink, orange, red, yellow, green, dark-blue
  groupColor?: string;
  cost?: number;
  rent?: number;
  ownerId?: string | null;
  outposts?: number; // 0..4 outposts
}

export interface PolyPlayer {
  id: string;
  name: string;
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
  { index: 1, name: 'Alpha Outpost', type: 'property', group: 'brown', groupColor: '#78350f', cost: 60, rent: 6 },
  { index: 2, name: 'Colony Chest', type: 'chance' },
  { index: 3, name: 'Beta Outpost', type: 'property', group: 'brown', groupColor: '#78350f', cost: 60, rent: 8 },
  { index: 4, name: 'Pollen Tax', type: 'tax', cost: 100 },
  { index: 5, name: 'Hyperloop North', type: 'railroad', cost: 200, rent: 25 },
  { index: 6, name: 'Gamma Hub', type: 'property', group: 'light-blue', groupColor: '#0284c7', cost: 100, rent: 10 },
  { index: 7, name: 'Chance Card', type: 'chance' },
  { index: 8, name: 'Delta Lab', type: 'property', group: 'light-blue', groupColor: '#0284c7', cost: 100, rent: 10 },
  { index: 9, name: 'Epsilon Node', type: 'property', group: 'light-blue', groupColor: '#0284c7', cost: 120, rent: 12 },
  // Left col (10 -> 20, Bottom to Top)
  { index: 10, name: 'Penjara / Visiting', type: 'corner' },
  { index: 11, name: 'Zeta Core', type: 'property', group: 'pink', groupColor: '#db2777', cost: 140, rent: 14 },
  { index: 12, name: 'Electric Grid', type: 'utility', cost: 150, rent: 15 },
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
  { index: 26, name: 'Omicron Park', type: 'property', group: 'yellow', groupColor: '#ca8a04', cost: 260, rent: 26 },
  { index: 27, name: 'Pi Garden', type: 'property', group: 'yellow', groupColor: '#ca8a04', cost: 260, rent: 26 },
  { index: 28, name: 'Water Fusion', type: 'utility', cost: 150, rent: 15 },
  { index: 29, name: 'Rho Estate', type: 'property', group: 'yellow', groupColor: '#ca8a04', cost: 280, rent: 28 },
  // Right col (30 -> 39, Top to Bottom)
  { index: 30, name: 'Masuk Penjara!', type: 'corner' },
  { index: 31, name: 'Sigma Silicon', type: 'property', group: 'green', groupColor: '#16a34a', cost: 300, rent: 30 },
  { index: 32, name: 'Tau Tech', type: 'property', group: 'green', groupColor: '#16a34a', cost: 300, rent: 30 },
  { index: 33, name: 'Colony Chest', type: 'chance' },
  { index: 34, name: 'Upsilon Heights', type: 'property', group: 'green', groupColor: '#16a34a', cost: 320, rent: 32 },
  { index: 35, name: 'Hyperloop West', type: 'railroad', cost: 200, rent: 25 },
  { index: 36, name: 'Chance Card', type: 'chance' },
  { index: 37, name: 'Anticeil Central', type: 'property', group: 'dark-blue', groupColor: '#1d4ed8', cost: 350, rent: 40 },
  { index: 38, name: 'Nectar Tax', type: 'tax', cost: 75 },
  { index: 39, name: 'Colony Prime', type: 'property', group: 'dark-blue', groupColor: '#1d4ed8', cost: 400, rent: 50 },
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
    { id: myId, name: myName, color: '#10b981', bgColor: 'bg-emerald-500', pollen: 1500, position: 0, inJail: false },
    { id: 'bot-1', name: 'Worker Bee 🐝', color: '#f59e0b', bgColor: 'bg-amber-500', pollen: 1500, position: 0, inJail: false, isBot: true },
    { id: 'bot-2', name: 'Hive Guard 🛡️', color: '#06b6d4', bgColor: 'bg-cyan-500', pollen: 1500, position: 0, inJail: false, isBot: true },
  ]);

  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [tiles, setTiles] = useState<BoardTile[]>(() =>
    BOARD_TILES.map((t) => ({ ...t, ownerId: null, outposts: 0 }))
  );

  const [dice, setDice] = useState<[number, number]>([1, 1]);
  const [isRolling, setIsRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    'Selamat datang di Colony Poly! Lempar dadu untuk memulai permainan.',
  ]);

  const [gameMode, setGameMode] = useState<'solo' | 'multiplayer'>('solo');
  const [pendingProperty, setPendingProperty] = useState<BoardTile | null>(null);

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

    // 1. Query remote state if joining multiplayer
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
          { id: myId, name: myName, color: '#10b981', bgColor: 'bg-emerald-500', pollen: 1500, position: 0, inJail: false },
          { id: 'bot-1', name: 'Worker Bee 🐝', color: '#f59e0b', bgColor: 'bg-amber-500', pollen: 1500, position: 0, inJail: false, isBot: true },
          { id: 'bot-2', name: 'Hive Guard 🛡️', color: '#06b6d4', bgColor: 'bg-cyan-500', pollen: 1500, position: 0, inJail: false, isBot: true },
        ]);
        setTiles(BOARD_TILES.map((t) => ({ ...t, ownerId: null, outposts: 0 })));
        setActivePlayerIndex(0);
        setDice([1, 1]);
        setHasRolled(false);
        setPendingProperty(null);
        setLogs(['Game Colony Poly direset oleh anggota room.']);
        toast.info('Papan Colony Poly telah direset.');
      } else if (data.action === 'COLONY_POLY_QUERY_STATE') {
        // Reply with current state if we are the host or have progress
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

    // Landed on GO TO JAIL
    let inJail = currentP.inJail;
    if (newPos === 30) {
      newPos = 10;
      inJail = true;
      addLog(`🚨 ${currentP.name} melanggar aturan dan dikirim ke PENJARA!`);
      toast.error(`${currentP.name} masuk penjara!`);
    }

    const landedTile = tiles[newPos];
    let updatedTiles = [...tiles];
    let updatedPlayers = [...players];

    addLog(`🎲 ${currentP.name} melempar ${steps} (${dice[0]}+${dice[1]}) dan mendarat di ${landedTile.name}.`);

    // Handle taxes
    if (landedTile.type === 'tax' && landedTile.cost) {
      newPollen = Math.max(0, newPollen - landedTile.cost);
      addLog(`💸 ${currentP.name} membayar pajak ${landedTile.cost} Pollen.`);
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
        toast.info(`${currentP.name} membayar sewa ${payAmount} Pollen`);
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
      setPendingProperty(landedTile);

      // If it's a Bot's turn, auto buy if affordable
      if (currentP.isBot && newPollen >= (landedTile.cost || 0)) {
        setTimeout(() => {
          handleBuyProperty(landedTile, updatedPlayers, updatedTiles);
        }, 800);
      }
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

    confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
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

    // If next player is Bot in solo mode or room host in multiplayer, auto roll
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

      // Auto end turn after 2 seconds
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
      { color: '#f59e0b', bgColor: 'bg-amber-500' },
      { color: '#06b6d4', bgColor: 'bg-cyan-500' },
      { color: '#ec4899', bgColor: 'bg-pink-500' },
    ];

    const remoteParticipants = participants.filter(
      (pt) => pt.id !== myId && pt.userId !== myId && (pt.user?.id || pt.id) !== myId
    );

    if (remoteParticipants.length === 0) {
      toast.info('Hanya ada Anda di voice call. Anda dapat bermain dengan Bot Colony!');
      return;
    }

    const newPlayers: PolyPlayer[] = [
      { id: myId, name: myName, color: '#10b981', bgColor: 'bg-emerald-500', pollen: 1500, position: 0, inJail: false },
    ];

    remoteParticipants.slice(0, 3).forEach((rp, idx) => {
      const pName = rp.name || rp.userName || rp.user?.firstName || `Pemain ${idx + 2}`;
      const pId = rp.userId || rp.id || `peer-${idx}`;
      const theme = availableColors[idx % availableColors.length];
      newPlayers.push({
        id: pId,
        name: pName,
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
    broadcastState(newPlayers, tiles, 0, [1, 1], 'Formasi pemain diperbarui');
  };

  const handleAddBot = () => {
    if (players.length >= 4) {
      toast.error('Maksimal 4 pemain di papan Colony Poly!');
      return;
    }
    const botTemplates = [
      { name: 'Queen Ant 👑', color: '#ec4899', bgColor: 'bg-pink-500' },
      { name: 'Scout Bee ⚡', color: '#8b5cf6', bgColor: 'bg-purple-500' },
      { name: 'Honey Badger 🦡', color: '#f97316', bgColor: 'bg-orange-500' },
    ];
    const available = botTemplates.find((bt) => !players.some((p) => p.name.includes(bt.name))) || botTemplates[0];
    const newBot: PolyPlayer = {
      id: `bot-${Date.now()}`,
      name: available.name,
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
      { id: myId, name: myName, color: '#10b981', bgColor: 'bg-emerald-500', pollen: 1500, position: 0, inJail: false },
      { id: 'bot-1', name: 'Worker Bee 🐝', color: '#f59e0b', bgColor: 'bg-amber-500', pollen: 1500, position: 0, inJail: false, isBot: true },
      { id: 'bot-2', name: 'Hive Guard 🛡️', color: '#06b6d4', bgColor: 'bg-cyan-500', pollen: 1500, position: 0, inJail: false, isBot: true },
    ]);
    setTiles(BOARD_TILES.map((t) => ({ ...t, ownerId: null, outposts: 0 })));
    setActivePlayerIndex(0);
    setDice([1, 1]);
    setHasRolled(false);
    setPendingProperty(null);
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
    <div className="flex-1 flex flex-col md:flex-row h-full min-h-0 bg-background text-foreground overflow-hidden select-none">
      {/* ── Left / Main: The Colony Poly Board ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 overflow-y-auto">
        {/* Top Game Bar */}
        <div className="w-full max-w-[680px] flex items-center justify-between gap-2 mb-2 px-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>COLONY POLY</span>
            </span>
            <Badge variant="outline" className="text-[10px] font-bold border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
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
              className="h-7 text-[11px] px-2.5 font-semibold border-border hover:bg-muted"
            >
              {gameMode === 'solo' ? <Users className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Bot className="w-3.5 h-3.5 mr-1 text-amber-400" />}
              {gameMode === 'solo' ? 'Mode Suara' : 'Mode Bot'}
            </Button>
            {players.length < 4 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddBot}
                className="h-7 text-[11px] px-2 border-border hover:bg-muted text-muted-foreground hover:text-foreground"
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
                className="h-7 text-[11px] px-2 border-border hover:bg-muted text-muted-foreground hover:text-foreground"
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

        {/* ── The 40-Tile Board Grid ── */}
        <div className="relative w-full max-w-[680px] aspect-square bg-card border-2 border-border/80 rounded-2xl shadow-2xl p-1.5 flex flex-col justify-between overflow-hidden">
          {/* Top Row (Tiles 20 -> 30) */}
          <div className="grid grid-cols-11 gap-1 h-[14%]">
            {BOARD_TILES.slice(20, 31).map((tile) => (
              <TileCell
                key={tile.index}
                tile={{ ...tile, ...tiles[tile.index] }}
                players={players.filter((p) => p.position === tile.index)}
              />
            ))}
          </div>

          {/* Middle Middle Area with Center Board Hub & Left/Right Rows */}
          <div className="flex-1 flex justify-between my-1 min-h-0">
            {/* Left Column (Tiles 19 -> 11, top to bottom) */}
            <div className="flex flex-col justify-between w-[14%] gap-1">
              {[19, 18, 17, 16, 15, 14, 13, 12, 11].map((idx) => (
                <TileCell
                  key={idx}
                  tile={{ ...BOARD_TILES[idx], ...tiles[idx] }}
                  players={players.filter((p) => p.position === idx)}
                />
              ))}
            </div>

            {/* Center Area: Rolling Controls, Active Player Banner & Property Actions */}
            <div className="flex-1 mx-2 rounded-xl bg-muted/20 border border-border/40 p-3 sm:p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
              {/* Colony Logo Watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <Coins className="w-48 h-48 text-emerald-500" />
              </div>

              {/* Turn Announcement */}
              <div className="relative z-10 flex flex-col items-center gap-1 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Giliran Saat Ini
                </span>
                <div className="flex items-center gap-2">
                  <div className={cn('size-3 rounded-full animate-pulse', activePlayer?.bgColor)} />
                  <span className="text-base sm:text-lg font-black text-foreground">
                    {activePlayer?.name}
                  </span>
                </div>
                <div className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                  <span>Saldo: {activePlayer?.pollen}</span>
                  <span className="text-[10px]">Pollen 🌼</span>
                </div>
              </div>

              {/* Dice Display */}
              <div className="relative z-10 flex items-center gap-3 my-2">
                <div className={cn(
                  'size-12 rounded-xl bg-card border-2 border-border shadow-md flex items-center justify-center text-xl font-black text-foreground transition-transform',
                  isRolling && 'animate-bounce'
                )}>
                  {dice[0]}
                </div>
                <div className={cn(
                  'size-12 rounded-xl bg-card border-2 border-border shadow-md flex items-center justify-center text-xl font-black text-foreground transition-transform',
                  isRolling && 'animate-bounce'
                )}>
                  {dice[1]}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="relative z-10 flex items-center gap-2 mt-2">
                {!hasRolled ? (
                  <Button
                    size="sm"
                    onClick={handleRollDice}
                    disabled={isRolling || !isMyTurn}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-md px-4 h-9 cursor-pointer"
                  >
                    <Dices className="w-4 h-4" />
                    <span>{isRolling ? 'Mengocok Dadu...' : 'Lempar Dadu'}</span>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleEndTurn}
                    className="bg-sidebar-accent hover:bg-sidebar-accent/80 text-foreground border border-sidebar-border font-bold text-xs px-4 h-9 cursor-pointer"
                  >
                    <span>Akhiri Giliran ➔</span>
                  </Button>
                )}
              </div>

              {/* Pending Property Buy Modal Card */}
              {pendingProperty && !hasRolled && (
                <div className="relative z-20 mt-3 p-3 rounded-xl bg-card border border-emerald-500/40 shadow-xl max-w-xs animate-in zoom-in-95">
                  <div className="text-xs font-bold text-foreground">
                    Beli {pendingProperty.name}?
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Harga: <strong className="text-amber-400">{pendingProperty.cost} Pollen</strong> | Sewa dasar: {pendingProperty.rent} Pollen
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-2.5">
                    <Button
                      size="sm"
                      onClick={() => handleBuyProperty(pendingProperty)}
                      className="h-7 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3"
                    >
                      Beli
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPendingProperty(null)}
                      className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
                    >
                      Lewati
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column (Tiles 31 -> 39, top to bottom) */}
            <div className="flex flex-col justify-between w-[14%] gap-1">
              {[31, 32, 33, 34, 35, 36, 37, 38, 39].map((idx) => (
                <TileCell
                  key={idx}
                  tile={{ ...BOARD_TILES[idx], ...tiles[idx] }}
                  players={players.filter((p) => p.position === idx)}
                />
              ))}
            </div>
          </div>

          {/* Bottom Row (Tiles 10 -> 0, Left to Right) */}
          <div className="grid grid-cols-11 gap-1 h-[14%]">
            {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((idx) => (
              <TileCell
                key={idx}
                tile={{ ...BOARD_TILES[idx], ...tiles[idx] }}
                players={players.filter((p) => p.position === idx)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel: Players Ledger, Owned Properties & Event Log ── */}
      <div className="w-full md:w-72 lg:w-80 bg-sidebar border-t md:border-t-0 md:border-l border-sidebar-border flex flex-col shrink-0 select-none">
        {/* Players Standings */}
        <div className="p-3 border-b border-sidebar-border">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Peringkat Colony</span>
          </div>

          <div className="space-y-1.5">
            {players.map((p, idx) => {
              const ownedCount = tiles.filter((t) => t.ownerId === p.id).length;
              const isActive = idx === activePlayerIndex;

              return (
                <div
                  key={p.id}
                  className={cn(
                    'p-2 rounded-lg border transition-all flex items-center justify-between',
                    isActive
                      ? 'bg-sidebar-accent border-emerald-500/40 shadow-xs'
                      : 'bg-card/40 border-border/50'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn('size-3 rounded-full shrink-0', p.bgColor)} />
                    <div className="truncate">
                      <div className="text-xs font-bold text-foreground truncate flex items-center gap-1">
                        <span>{p.name}</span>
                        {p.isBot && <span className="text-[9px] text-muted-foreground font-normal">(Bot)</span>}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {ownedCount} Distrik
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-amber-400">
                      {p.pollen} <span className="text-[9px] font-normal">🌼</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Owned Properties List / Upgrades */}
        <div className="p-3 border-b border-sidebar-border flex-1 min-h-0 flex flex-col">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <span>Distrik Milik Anda</span>
            </span>
            <span className="text-[10px] text-muted-foreground">
              {tiles.filter((t) => t.ownerId === myId).length} properti
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 [scrollbar-width:thin]">
            {tiles.filter((t) => t.ownerId === myId).length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                Belum ada distrik yang dibeli. Mendaratlah di petak kosong untuk membeli properti!
              </div>
            ) : (
              tiles
                .filter((t) => t.ownerId === myId)
                .map((tile) => (
                  <div
                    key={tile.index}
                    className="p-2 rounded-lg border border-border/60 bg-card/60 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2.5 h-6 rounded-xs shrink-0"
                        style={{ backgroundColor: tile.groupColor || '#10b981' }}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-foreground truncate">
                          {tile.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Sewa: {tile.rent! * (1 + (tile.outposts || 0))} Pollen
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBuildOutpost(tile.index)}
                      disabled={(tile.outposts || 0) >= 4}
                      className="h-6 text-[10px] px-2 font-semibold border-border"
                      title="Bangun Outpost (+Sewa)"
                    >
                      {(tile.outposts || 0) >= 4 ? 'Maks (4)' : `+Outpost (${tile.outposts || 0})`}
                    </Button>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Live Activity Log */}
        <div className="p-3 h-36 flex flex-col bg-muted/10">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <History className="w-3 h-3" />
            <span>Riwayat Aktivitas</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 text-[11px] text-muted-foreground pr-1 [scrollbar-width:thin]">
            {logs.map((log, i) => (
              <div key={i} className="leading-tight">
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

// Sub-component for individual Board Tile Cells
function TileCell({
  tile,
  players,
}: {
  tile: BoardTile;
  players: PolyPlayer[];
}) {
  const isCorner = tile.type === 'corner';

  return (
    <div
      className={cn(
        'relative rounded-md border flex flex-col justify-between overflow-hidden transition-all text-[9px] p-0.5 select-none leading-none',
        isCorner
          ? 'bg-sidebar-accent/80 border-border/80 font-bold'
          : 'bg-card border-border/50 hover:border-emerald-500/40',
        tile.ownerId && 'ring-1 ring-emerald-500/50'
      )}
    >
      {/* Property Color Header Bar */}
      {tile.groupColor && (
        <div
          className="h-1.5 w-full rounded-xs shrink-0"
          style={{ backgroundColor: tile.groupColor }}
        />
      )}

      {/* Tile Title */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-0.5">
        <span className="font-semibold text-foreground/90 truncate w-full">
          {tile.name}
        </span>
        {tile.cost && !tile.ownerId && (
          <span className="text-[8px] font-bold text-amber-400 mt-0.5">
            {tile.cost}🌼
          </span>
        )}
      </div>

      {/* Outpost indicator badges */}
      {tile.outposts && tile.outposts > 0 ? (
        <div className="flex items-center justify-center gap-0.5 pb-0.5">
          {Array.from({ length: tile.outposts }).map((_, i) => (
            <div key={i} className="size-1 rounded-full bg-emerald-400" />
          ))}
        </div>
      ) : null}

      {/* Players Tokens currently on this tile */}
      {players.length > 0 && (
        <div className="absolute inset-x-0 bottom-0.5 flex items-center justify-center gap-1 z-10">
          {players.map((p) => (
            <div
              key={p.id}
              className={cn(
                'size-3.5 rounded-full border border-black text-[8px] font-black text-white flex items-center justify-center shadow-md animate-in zoom-in-50',
                p.bgColor
              )}
              title={p.name}
            >
              {p.name.charAt(0)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

