import React from 'react';
import {
  Globe,
  Tag,
  BarChart3,
  Zap,
  Smile,
  Sticker,
  Volume2,
  Users,
  KeyRound,
  UserPlus,
  Webhook,
  ScrollText,
  Ban,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Compass,
  ExternalLink,
  LineChart,
  Layers,
  Sparkles,
  Building2,
  Crown,
} from 'lucide-react';
import type { SettingsNavGroup } from '@/components/ui/two-pane-settings-dialog';

interface BuildColonyNavGroupsOptions {
  activeColonyName?: string;
  t: (key: string) => string;
}

export function buildColonyNavGroups({
  activeColonyName,
  t,
}: BuildColonyNavGroupsOptions): SettingsNavGroup[] {
  return [
    {
      key: 'COLONY_SETTINGS',
      title: activeColonyName || t('Colony Settings'),
      items: [
        { id: 'profile', label: t('Colony Profile'), icon: <Globe className="h-4 w-4 shrink-0" /> },
        { id: 'colony-tag', label: t('Colony Tag'), icon: <Tag className="h-4 w-4 shrink-0" /> },
        { id: 'engagement', label: t('Engagement'), icon: <BarChart3 className="h-4 w-4 shrink-0" /> },
        { id: 'boost', label: t('Boost Perks'), icon: <Zap className="h-4 w-4 shrink-0" /> },
      ],
    },
    {
      key: 'ENTERPRISE',
      title: t('Enterprise'),
      items: [
        {
          id: 'enterprise-sso',
          label: t('SSO & Domain Capture'),
          icon: <Building2 className="h-4 w-4 shrink-0 text-amber-500" />,
          badge: <Crown className="h-3.5 w-3.5 shrink-0 ml-auto text-amber-400 fill-amber-400/20" />,
        },
      ],
    },
    {
      key: 'EXPRESSION',
      title: t('Expression'),
      items: [
        { id: 'emoji', label: t('Emoji'), icon: <Smile className="h-4 w-4 shrink-0" /> },
        { id: 'stickers', label: t('Stickers'), icon: <Sticker className="h-4 w-4 shrink-0" /> },
        { id: 'soundboard', label: t('Soundboard'), icon: <Volume2 className="h-4 w-4 shrink-0" /> },
      ],
    },
    {
      key: 'PEOPLE',
      title: t('People'),
      items: [
        { id: 'members', label: t('Members'), icon: <Users className="h-4 w-4 shrink-0" /> },
        { id: 'roles', label: t('Roles'), icon: <KeyRound className="h-4 w-4 shrink-0" /> },
        { id: 'invites', label: t('Invites'), icon: <UserPlus className="h-4 w-4 shrink-0" /> },
        { id: 'access', label: t('Access'), icon: <ShieldCheck className="h-4 w-4 shrink-0" /> },
      ],
    },
    {
      key: 'APPS',
      title: t('Apps'),
      items: [
        { id: 'integrations', label: t('Integrations'), icon: <Webhook className="h-4 w-4 shrink-0" /> },
        {
          id: 'app-directory',
          label: t('App Directory'),
          icon: <Compass className="h-4 w-4 shrink-0" />,
          badge: <ExternalLink className="h-3.5 w-3.5 shrink-0 ml-auto opacity-70" />,
        },
      ],
    },
    {
      key: 'MODERATION',
      title: t('Moderation'),
      items: [
        { id: 'safety-setup', label: t('Safety Setup'), icon: <ShieldAlert className="h-4 w-4 shrink-0" /> },
        { id: 'audit-log', label: t('Audit Log'), icon: <ScrollText className="h-4 w-4 shrink-0" /> },
        { id: 'bans', label: t('Bans'), icon: <Ban className="h-4 w-4 shrink-0" /> },
      ],
    },
    {
      key: 'COMMUNITY',
      title: t('Community Overview'),
      items: [
        { id: 'community-overview', label: t('Community Overview'), icon: <Globe className="h-4 w-4 shrink-0" /> },
        { id: 'onboarding', label: t('Onboarding'), icon: <Sparkles className="h-4 w-4 shrink-0" /> },
        { id: 'server-insights', label: t('Colony Insights'), icon: <LineChart className="h-4 w-4 shrink-0" /> },
        { id: 'server-template', label: t('Colony Template'), icon: <Layers className="h-4 w-4 shrink-0" /> },
      ],
    },
  ];
}
