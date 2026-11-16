import React from 'react';
import {
  Sword,
  Leaf,
  Heart,
  Flame,
  Droplets,
  Skull,
  Moon,
  Zap,
  Sparkles,
  Shield,
  Star,
  Crown,
  Gamepad2,
  FlaskConical,
  Ghost,
  PawPrint,
  Coffee,
  Rocket,
  Key,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ServerTagBadge {
  id: string;
  name: string;
  icon: (color: string, className?: string) => React.ReactNode;
}

export interface TagColorOption {
  id: string;
  hex: string;
  name: string;
}

export const ALL_TAG_BADGES: ServerTagBadge[] = [
  {
    id: 'leaf',
    name: 'Leaf',
    icon: (color, cls = 'w-5 h-5') => (
      <Leaf className={cn('fill-current', cls)} style={{ color }} />
    ),
  },
  {
    id: 'sword',
    name: 'Sword',
    icon: (color, cls = 'w-5 h-5') => (
      <Sword className={cn('fill-current', cls)} style={{ color }} />
    ),
  },
  {
    id: 'heart',
    name: 'Heart',
    icon: (color, cls = 'w-5 h-5') => (
      <Heart className={cn('fill-current', cls)} style={{ color }} />
    ),
  },
  {
    id: 'flame',
    name: 'Flame',
    icon: (color, cls = 'w-5 h-5') => (
      <Flame className={cn('fill-current', cls)} style={{ color }} />
    ),
  },
  {
    id: 'droplet',
    name: 'Droplet',
    icon: (color, cls = 'w-5 h-5') => (
      <Droplets className={cn('fill-current', cls)} style={{ color }} />
    ),
  },
  {
    id: 'skull',
    name: 'Skull',
    icon: (color, cls = 'w-5 h-5') => (
      <Skull className={cn('fill-current', cls)} style={{ color }} />
    ),
  },
  {
    id: 'moon',
    name: 'Moon',
    icon: (color, cls = 'w-5 h-5') => (
      <Moon className={cn('fill-current', cls)} style={{ color }} />
    ),
  },
  {
    id: 'bolt',
    name: 'Lightning',
    icon: (color, cls = 'w-5 h-5') => (
      <Zap className={cn('fill-current', cls)} style={{ color }} />
    ),
  },
  {
    id: 'gem',
    name: 'Gem',
    icon: (color, cls = 'w-5 h-5') => (
      <Sparkles className={cn('fill-current', cls)} style={{ color }} />
    ),
  },
  {
    id: 'mushroom',
    name: 'Mushroom',
    icon: (color, cls = 'w-5 h-5') => (
      <svg
        viewBox="0 0 24 24"
        className={cn('fill-current', cls)}
        style={{ color }}
        fill="currentColor"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12C2 13.1 2.9 14 4 14H8V20C8 21.1 8.9 22 10 22H14C15.1 22 16 21.1 16 20V14H20C21.1 14 22 13.1 22 12C22 6.48 17.52 2 12 2ZM7 9C6.45 9 6 8.55 6 8C6 7.45 6.45 7 7 7C7.55 7 8 7.45 8 8C8 8.55 7.55 9 7 9ZM12 7C11.45 7 11 6.55 11 6C11 5.45 11.45 5 12 5C12.55 5 13 5.45 13 6C13 6.55 12.55 7 12 7ZM17 9C16.45 9 16 8.55 16 8C16 7.45 16.45 7 17 7C17.55 7 18 7.45 18 8C18 8.55 17.55 9 17 9Z" />
      </svg>
    ),
  },
  {
    id: 'shield',
    name: 'Shield',
    icon: (color, cls = 'w-5 h-5') => (
      <Shield className={cn('fill-current', cls)} style={{ color }} />
    ),
  },
  {
    id: 'star',
    name: 'Star',
    icon: (color, cls = 'w-5 h-5') => (
      <Star className={cn('fill-current', cls)} style={{ color }} />
    ),
  },
  {
    id: 'crown',
    name: 'Crown',
    icon: (color, cls = 'w-5 h-5') => (
      <Crown className={cn('fill-current', cls)} style={{ color }} />
    ),
  },
  {
    id: 'gamepad',
    name: 'Gamepad',
    icon: (color, cls = 'w-5 h-5') => (
      <Gamepad2 className={cn('fill-current', cls)} style={{ color }} />
    ),
  },
  {
    id: 'potion',
    name: 'Potion',
    icon: (color, cls = 'w-5 h-5') => (
      <FlaskConical className={cn('fill-current', cls)} style={{ color }} />
    ),
  },
  {
    id: 'ghost',
    name: 'Ghost',
    icon: (color, cls = 'w-5 h-5') => (
      <Ghost className={cn('fill-current', cls)} style={{ color }} />
    ),
  },
  {
    id: 'paw',
    name: 'Paw',
    icon: (color, cls = 'w-5 h-5') => (
      <PawPrint className={cn('fill-current', cls)} style={{ color }} />
    ),
  },
  {
    id: 'coffee',
    name: 'Coffee',
    icon: (color, cls = 'w-5 h-5') => (
      <Coffee className={cn('fill-current', cls)} style={{ color }} />
    ),
  },
  {
    id: 'rocket',
    name: 'Rocket',
    icon: (color, cls = 'w-5 h-5') => (
      <Rocket className={cn('fill-current', cls)} style={{ color }} />
    ),
  },
  {
    id: 'key',
    name: 'Key',
    icon: (color, cls = 'w-5 h-5') => (
      <Key className={cn('fill-current', cls)} style={{ color }} />
    ),
  },
];

export const TAG_COLOR_OPTIONS: TagColorOption[] = [
  { id: 'pink', hex: '#ec4899', name: 'Electric Pink' },
  { id: 'orange', hex: '#f97316', name: 'Vibrant Orange' },
  { id: 'yellow', hex: '#eab308', name: 'Warm Gold' },
  { id: 'green', hex: '#22c55e', name: 'Emerald Green' },
  { id: 'cyan', hex: '#06b6d4', name: 'Sky Cyan' },
  { id: 'purple', hex: '#8b5cf6', name: 'Deep Violet' },
  { id: 'lavender', hex: '#a855f7', name: 'Lavender' },
  { id: 'rose', hex: '#f43f5e', name: 'Crimson Rose' },
  { id: 'coral', hex: '#fb7185', name: 'Coral' },
  { id: 'tan', hex: '#d97706', name: 'Desert Bronze' },
  { id: 'indigo', hex: '#6366f1', name: 'Royal Indigo' },
  { id: 'slate', hex: '#64748b', name: 'Steel Slate' },
  { id: 'silver', hex: '#94a3b8', name: 'Silver Muted' },
  { id: 'gold', hex: '#ca8a04', name: 'Ancient Gold' },
];
