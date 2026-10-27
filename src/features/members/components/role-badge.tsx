import React from 'react';
import { Crown, Shield, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CommunityRole } from '@/chat/chat-types';

export interface RoleBadgeProps {
  role?: CommunityRole;
  roleLabel?: string;
  defaultLabel?: string;
}

export function RoleBadge({ role, roleLabel }: RoleBadgeProps) {
  switch (role) {
    case 'owner':
      return (
        <Badge className="bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border-amber-500/20 text-[10px] px-1.5 py-0 uppercase font-semibold gap-1 shrink-0">
          <Crown className="w-2.5 h-2.5" /> {roleLabel || 'Pemilik'}
        </Badge>
      );
    case 'admin':
      return (
        <Badge className="bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border-rose-500/20 text-[10px] px-1.5 py-0 uppercase font-semibold gap-1 shrink-0">
          <Shield className="w-2.5 h-2.5" /> {roleLabel || 'Admin'}
        </Badge>
      );
    case 'bot':
      return (
        <Badge className="bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 border-indigo-500/20 text-[10px] px-1.5 py-0 uppercase font-semibold gap-1 shrink-0">
          <Bot className="w-2.5 h-2.5" /> {roleLabel || 'Bot'}
        </Badge>
      );
    default:
      return null;
  }
}
