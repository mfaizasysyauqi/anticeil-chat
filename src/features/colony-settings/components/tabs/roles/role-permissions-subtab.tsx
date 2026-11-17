import React from 'react';
import { Search, Eye, Camera, MessageSquare, Volume2, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { CommunityCustomRole } from '@/chat/chat-types';

export interface RolePermissionsSubtabProps {
  permissions: Record<string, boolean>;
  togglePermission: (key: string) => void;
  clearAllPermissions: () => void;
  permissionsSearch: string;
  setPermissionsSearch: (val: string) => void;
  activeRole: CommunityCustomRole | null;
  t: (key: string) => string;
}

export function RolePermissionsSubtab({
  permissions,
  togglePermission,
  clearAllPermissions,
  permissionsSearch,
  setPermissionsSearch,
  activeRole,
  t,
}: RolePermissionsSubtabProps) {
  return (
          <div className="space-y-6">
            {/* Search & Clear Controls */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={permissionsSearch}
                  onChange={(e) => setPermissionsSearch(e.target.value)}
                  placeholder={t('Search permissions')}
                  className="w-full text-xs h-9 pl-9 pr-3 rounded-lg bg-[#1e1f22] border border-border/80 text-foreground focus:outline-none focus:border-teal-500"
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllPermissions}
                className="text-xs text-teal-400 hover:text-teal-300 h-9"
              >
                {t('Clear permissions')}
              </Button>
            </div>

            {/* Group 1: General Server Permissions */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('General Server Permissions')}
              </h4>

              <div className="space-y-3.5">
                {[
                  {
                    key: 'view_channels',
                    name: 'View Channels',
                    desc: 'Allows members to view channels by default (excluding private channels).',
                  },
                  {
                    key: 'manage_channels',
                    name: 'Manage Channels',
                    desc: 'Allows members to create, edit, or delete channels.',
                  },
                  {
                    key: 'manage_roles',
                    name: 'Manage Roles',
                    desc: 'Allows members to create new roles and edit or delete roles lower than their highest role.',
                  },
                  {
                    key: 'create_expressions',
                    name: 'Create Expressions',
                    desc: 'Allows members to add custom emoji, stickers, and sounds in this server.',
                  },
                  {
                    key: 'manage_expressions',
                    name: 'Manage Expressions',
                    desc: 'Allows members to edit or remove custom emoji, stickers, and sounds in this server.',
                  },
                  {
                    key: 'view_audit_log',
                    name: 'View Audit Log',
                    desc: 'Allows members to view a record of who made which changes in this server.',
                  },
                  {
                    key: 'view_server_insights',
                    name: 'View Server Insights',
                    desc: 'Allows members to view Server Insights, which shows data on community growth, engagement, and more.',
                  },
                  {
                    key: 'manage_webhooks',
                    name: 'Manage Webhooks',
                    desc: 'Allows members to create, edit, or delete webhooks, which can post messages from other apps or sites into this server.',
                  },
                  {
                    key: 'manage_server',
                    name: 'Manage Server',
                    desc: "Allows members to change this server's name, switch regions, view all invites, add apps to this server and create and update AutoMod rules.",
                  },
                ].map((perm) => (
                  <div
                    key={perm.key}
                    className="flex items-start justify-between gap-4 py-1"
                  >
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        {t(perm.name)}
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        {t(perm.desc)}
                      </p>
                    </div>
                    <Switch
                      checked={Boolean(permissions[perm.key])}
                      onCheckedChange={() => togglePermission(perm.key)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-b border-border/50 my-4" />

            {/* Group 2: Membership Permissions */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('Membership Permissions')}
              </h4>

              <div className="space-y-3.5">
                {[
                  {
                    key: 'create_invite',
                    name: 'Create Invite',
                    desc: 'Allows members to invite new people to this server.',
                  },
                  {
                    key: 'change_nickname',
                    name: 'Change Nickname',
                    desc: 'Allows members to change their own nickname, a custom name for just this server.',
                  },
                  {
                    key: 'manage_nicknames',
                    name: 'Manage Nicknames',
                    desc: 'Allows members to change the nicknames of other members.',
                  },
                  {
                    key: 'kick_members',
                    name: 'Kick, Approve, and Reject Members',
                    desc: 'Kick will remove other members from this server. Kicked members will be able to rejoin if they have another invite.',
                  },
                  {
                    key: 'ban_members',
                    name: 'Ban Members',
                    desc: 'Allows members to permanently ban and delete the message history of other members from this server.',
                  },
                  {
                    key: 'timeout_members',
                    name: 'Timeout Members',
                    desc: 'When you put a user in timeout they will not be able to send messages in chat, reply within threads, react to messages, or speak in voice or Stage channels.',
                  },
                ].map((perm) => (
                  <div
                    key={perm.key}
                    className="flex items-start justify-between gap-4 py-1"
                  >
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        {t(perm.name)}
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        {t(perm.desc)}
                      </p>
                    </div>
                    <Switch
                      checked={Boolean(permissions[perm.key])}
                      onCheckedChange={() => togglePermission(perm.key)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-b border-border/50 my-4" />

            {/* Group 3: Text & Voice Channel Permissions */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('Text Channel Permissions')}
              </h4>

              <div className="space-y-3.5">
                {[
                  {
                    key: 'send_messages',
                    name: 'Send Messages and Create Posts',
                    desc: 'Allow members to send messages in text channels and create posts in forum channels.',
                  },
                  {
                    key: 'send_messages_in_threads',
                    name: 'Send Messages in Threads and Posts',
                    desc: 'Allow members to send messages in threads and in posts on forum channels.',
                  },
                  {
                    key: 'create_public_threads',
                    name: 'Create Public Threads',
                    desc: 'Allow members to create threads that everyone in a channel can view.',
                  },
                  {
                    key: 'embed_links',
                    name: 'Embed Links',
                    desc: 'Allows links that members share to show embedded content in text channels.',
                  },
                  {
                    key: 'attach_files',
                    name: 'Attach Files',
                    desc: 'Allows members to upload files or media in text channels.',
                  },
                  {
                    key: 'add_reactions',
                    name: 'Add Reactions',
                    desc: 'Allows members to add new emoji reactions to a message.',
                  },
                  {
                    key: 'manage_messages',
                    name: 'Manage Messages',
                    desc: 'Allows members to delete or remove embeds from messages by other members.',
                  },
                  {
                    key: 'pin_messages',
                    name: 'Pin Messages',
                    desc: 'Allows members to pin or unpin any message.',
                  },
                ].map((perm) => (
                  <div
                    key={perm.key}
                    className="flex items-start justify-between gap-4 py-1"
                  >
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        {t(perm.name)}
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        {t(perm.desc)}
                      </p>
                    </div>
                    <Switch
                      checked={Boolean(permissions[perm.key])}
                      onCheckedChange={() => togglePermission(perm.key)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-b border-border/50 my-4" />

            {/* Group 4: Advanced Administrator Permission */}
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-destructive">
                  {t('Administrator')}
                </span>
                <Switch
                  checked={Boolean(permissions.administrator)}
                  onCheckedChange={() => togglePermission('administrator')}
                />
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {t(
                  'Members with this permission will have every permission and will also bypass all channel specific permissions or restrictions. This is a dangerous permission to grant.',
                )}
              </p>
            </div>
          </div>
  );
}
