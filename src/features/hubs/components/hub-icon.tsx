import React from 'react';
import { Sparkles, Bot, Layers, Terminal, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CommunityHub } from '@/chat/messages-types';

interface HubIconProps {
  hub: CommunityHub;
  className?: string;
}

export function HubIcon({ hub, className }: HubIconProps) {
  if (hub.iconUrl) {
    return (
      <img
        src={hub.iconUrl}
        alt={hub.name}
        className={cn('w-full h-full object-cover rounded-[14px]', className)}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  switch (hub.iconType) {
    case 'logo':
      return (
        <img
          src="/logo.png"
          alt="Anticeil"
          className={cn('size-7 object-contain pointer-events-none drop-shadow-xs', className)}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/logo.svg';
          }}
        />
      );
    case 'spark':
      return <Sparkles className={cn('w-4 h-4 text-amber-400', className)} />;
    case 'bot':
      return <Bot className={cn('w-4 h-4 text-emerald-400', className)} />;
    case 'templates':
      return <Layers className={cn('w-4 h-4 text-purple-400', className)} />;
    case 'code':
      return <Terminal className={cn('w-4 h-4 text-blue-400', className)} />;
    case 'dm':
      return <MessageSquare className={cn('w-4 h-4 text-rose-400', className)} />;
    default:
      return <span className={cn('font-bold text-xs', className)}>{hub.initials}</span>;
  }
}
