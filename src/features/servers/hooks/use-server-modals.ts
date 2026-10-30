import { useState } from 'react';
import type { CommunityHub, CommunityChannel, CommunityMember } from '@/chat/chat-types';
import { communityApi } from '@/chat/chat-api';
import { saveStoredHubs } from '@/chat/chat-defaults';
import type { ServerSettingsSection } from '@/features/server-settings';
import { toast } from 'sonner';

interface UseServerModalsOptions {
  hubs: CommunityHub[];
  setHubs: React.Dispatch<React.SetStateAction<CommunityHub[]>>;
  channels: CommunityChannel[];
  setChannels: React.Dispatch<React.SetStateAction<CommunityChannel[]>>;
  activeHub: CommunityHub | undefined;
  setActiveHubId: (id: string) => void;
  setActiveChannelId: (id: string) => void;
  setActiveCallChannelId?: (id: string | null) => void;
  setIsCallPiP?: (val: boolean) => void;
  setSelectedActivityAppId?: (id: string | null) => void;
  setIsActivityOpen?: (val: boolean) => void;
  setMembers?: React.Dispatch<React.SetStateAction<CommunityMember[]>>;
  t: (key: string) => string;
}

export function useServerModals({
  hubs,
  setHubs,
  channels,
  setChannels,
  activeHub,
  setActiveHubId,
  setActiveChannelId,
  setActiveCallChannelId,
  setIsCallPiP,
  setSelectedActivityAppId,
  setIsActivityOpen,
  setMembers,
  t,
}: UseServerModalsOptions) {
  // Create / Join Server Modal
  const [isCreateHubOpen, setIsCreateHubOpen] = useState(false);
  const [newHubName, setNewHubName] = useState('');
  const [newHubDesc, setNewHubDesc] = useState('');
  const [newHubIconUrl, setNewHubIconUrl] = useState('');
  const [joinInviteCode, setJoinInviteCode] = useState('');
  const [isJoiningHub, setIsJoiningHub] = useState(false);

  // Edit Server Modal
  const [hubToEdit, setHubToEdit] = useState<CommunityHub | null>(null);
  const [editHubName, setEditHubName] = useState('');
  const [editHubDesc, setEditHubDesc] = useState('');

  // Delete Server Modal
  const [hubToDelete, setHubToDelete] = useState<CommunityHub | null>(null);

  // Server Invite Modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [isInvitingUsername, setIsInvitingUsername] = useState(false);
  const [userNotFound, setUserNotFound] = useState<string | null>(null);

  // Server Settings Modal
  const [isServerSettingsOpen, setIsServerSettingsOpen] = useState(false);
  const [serverSettingsSection, setServerSettingsSection] = useState<ServerSettingsSection>('profile');

  // Create Server Submit
  const handleCreateHubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHubName.trim()) return;

    try {
      const createdHub = await communityApi.createHub({
        name: newHubName.trim(),
        description: newHubDesc.trim() || undefined,
        iconUrl: newHubIconUrl || undefined,
      });

      const updatedHubs = [...hubs.filter((h) => h.id !== createdHub.id), createdHub];
      setHubs(updatedHubs);
      saveStoredHubs(updatedHubs);
      setActiveHubId(createdHub.id);

      let hubChannels = await communityApi.getChannels(createdHub.id);
      if (!hubChannels || hubChannels.length === 0) {
        const [defaultCh, defaultVoice, defaultForum] = await Promise.all([
          communityApi.createChannel({
            name: 'general',
            description: `Saluran obrolan umum untuk server ${createdHub.name}`,
            category: 'CHANNELS',
            hubId: createdHub.id,
            type: 'text',
          }),
          communityApi.createChannel({
            name: 'General Voice',
            description: `Saluran suara & video untuk server ${createdHub.name}`,
            category: 'CHANNELS',
            hubId: createdHub.id,
            type: 'voice',
          }),
          communityApi.createChannel({
            name: 'forum-diskusi',
            description: `Ruang diskusi topik untuk server ${createdHub.name}`,
            category: 'CHANNELS',
            hubId: createdHub.id,
            type: 'forum',
          }),
        ]);
        hubChannels = [defaultCh, defaultVoice, defaultForum];
      }
      setChannels((prev) => [...prev.filter((c) => c.hubId !== createdHub.id), ...hubChannels]);
      setActiveChannelId(hubChannels[0].id);

      setIsCreateHubOpen(false);
      setNewHubName('');
      setNewHubDesc('');
      setNewHubIconUrl('');
      toast.success(t('Server baru berhasil dibuat!'));
    } catch (err) {
      console.warn('API createHub fallback', err);
      const newId = `hub_${Date.now()}`;
      const newHub: CommunityHub = {
        id: newId,
        name: newHubName.trim(),
        iconType: undefined as any,
        initials: newHubName.trim().slice(0, 2).toUpperCase() || 'SV',
        description: newHubDesc.trim() || '',
        iconUrl: newHubIconUrl || undefined,
      };

      const defaultText: CommunityChannel = {
        id: `ch_${Date.now()}_gen`,
        name: 'general',
        description: `Saluran obrolan umum untuk server ${newHub.name}`,
        category: 'CHANNELS',
        hubId: newId,
        type: 'text',
      };
      const defaultVoice: CommunityChannel = {
        id: `ch_${Date.now()}_voice`,
        name: 'General Voice',
        description: `Saluran suara & video untuk server ${newHub.name}`,
        category: 'CHANNELS',
        hubId: newId,
        type: 'voice',
      };
      const defaultForum: CommunityChannel = {
        id: `ch_${Date.now()}_forum`,
        name: 'forum-diskusi',
        description: `Ruang diskusi topik untuk server ${newHub.name}`,
        category: 'CHANNELS',
        hubId: newId,
        type: 'forum',
      };

      const updatedHubs = [...hubs, newHub];
      setHubs(updatedHubs);
      saveStoredHubs(updatedHubs);
      setChannels((prev) => [...prev, defaultText, defaultVoice, defaultForum]);
      setActiveHubId(newId);
      setActiveChannelId(defaultText.id);

      setIsCreateHubOpen(false);
      setNewHubName('');
      setNewHubDesc('');
      setNewHubIconUrl('');
      toast.success(t('Server baru berhasil dibuat!'));
    }
  };

  // Join Server via Invite Code/Link
  const handleJoinHub = async (codeToJoin?: string) => {
    const rawCode = (codeToJoin || joinInviteCode).trim();
    if (!rawCode) {
      toast.error(t('Masukkan kode atau link undangan yang valid.'));
      return;
    }

    let code = rawCode;
    if (rawCode.includes('invite=')) {
      code = rawCode.split('invite=')[1].split('&')[0];
    } else if (rawCode.includes('/')) {
      code = rawCode.split('/').pop() || rawCode;
    }

    try {
      setIsJoiningHub(true);
      const joinedHub = await communityApi.joinHub(code);
      setHubs((prev) => {
        const next = [...prev.filter((h) => h.id !== joinedHub.id), joinedHub];
        saveStoredHubs(next);
        return next;
      });
      setActiveHubId(joinedHub.id);

      const hubChannels = await communityApi.getChannels(joinedHub.id);
      if (hubChannels && hubChannels.length > 0) {
        setChannels((prev) => [...prev.filter((c) => c.hubId !== joinedHub.id), ...hubChannels]);
        const targetChannelParam = new URLSearchParams(window.location.search).get('channel');
        const targetActivityParam = new URLSearchParams(window.location.search).get('activity');
        if (targetActivityParam) {
          const normalizedAct = targetActivityParam === 'youtube' ? 'watch-together' : targetActivityParam;
          setSelectedActivityAppId?.(normalizedAct);
          setIsActivityOpen?.(true);
        }
        let matchedChannel = hubChannels.find((c) => c.id === targetChannelParam);
        if (!matchedChannel && targetActivityParam) {
          matchedChannel = hubChannels.find((c) => c.type === 'voice');
        }
        if (matchedChannel) {
          setActiveChannelId(matchedChannel.id);
          if (matchedChannel.type === 'voice') {
            setActiveCallChannelId?.(matchedChannel.id);
            setIsCallPiP?.(false);
          }
        } else {
          setActiveChannelId(hubChannels[0].id);
        }
      }

      setIsCreateHubOpen(false);
      setJoinInviteCode('');
      toast.success(t(`Berhasil bergabung ke server ${joinedHub.name}! 🎉`));

      const url = new URL(window.location.href);
      if (url.searchParams.has('invite')) {
        url.searchParams.delete('invite');
        if (!url.searchParams.has('hub')) {
          url.searchParams.set('hub', joinedHub.id);
        }
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
      }
    } catch {
      toast.error(t('Kode undangan tidak valid atau server tidak ditemukan.'));
    } finally {
      setIsJoiningHub(false);
    }
  };

  // Open Edit Hub
  const handleOpenEditHub = (hub: CommunityHub) => {
    setHubToEdit(hub);
    setEditHubName(hub.name);
    setEditHubDesc(hub.description || '');
  };

  // Edit Server Submit
  const handleEditHubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hubToEdit || !editHubName.trim()) return;

    const newName = editHubName.trim();
    try {
      const updated = await communityApi.updateHub(hubToEdit.id, {
        name: newName,
        description: editHubDesc.trim() || undefined,
      });
      const updatedHubs = hubs.map((h) => (h.id === updated.id ? { ...h, ...updated } : h));
      setHubs(updatedHubs);
      saveStoredHubs(updatedHubs);
      setHubToEdit(null);
      toast.success(t('Nama server berhasil diperbarui!'));
    } catch {
      const updatedHubs: CommunityHub[] = hubs.map((h) => {
        if (h.id === hubToEdit.id) {
          return {
            ...h,
            name: newName,
            initials: newName.slice(0, 2).toUpperCase() || 'SV',
            description: editHubDesc.trim() || undefined,
          };
        }
        return h;
      });

      setHubs(updatedHubs);
      saveStoredHubs(updatedHubs);
      setHubToEdit(null);
      toast.success(t('Nama server berhasil diperbarui!'));
    }
  };

  // Delete Server Confirm
  const handleDeleteHubConfirm = async () => {
    if (!hubToDelete) return;
    if (hubToDelete.id === 'anticeil') {
      toast.error(t('Server default tidak dapat dihapus.'));
      setHubToDelete(null);
      return;
    }

    try {
      await communityApi.deleteHub(hubToDelete.id);
    } catch (err) {
      console.warn('API deleteHub error', err);
    }

    const updatedHubs = hubs.filter((h) => h.id !== hubToDelete.id);
    setHubs(updatedHubs);
    saveStoredHubs(updatedHubs);

    setChannels((prev) => prev.filter((c) => c.hubId !== hubToDelete.id));
    setActiveHubId('anticeil');

    const firstDm = channels.find((c) => c.category === 'DIRECT MESSAGES');
    setActiveChannelId(firstDm?.id || '');

    setHubToDelete(null);
    toast.success(t('Server berhasil dihapus!'));
  };

  // Invite by Username / User Selection (Sends pending server invitation, no auto-join)
  const handleInviteByUsername = async (
    targetOrEvent?: React.FormEvent | string,
    targetUserId?: string,
  ): Promise<boolean | void> => {
    if (targetOrEvent && typeof targetOrEvent !== 'string' && 'preventDefault' in targetOrEvent) {
      targetOrEvent.preventDefault();
    }
    const rawUser = typeof targetOrEvent === 'string' ? targetOrEvent.trim().replace(/^@/, '') : inviteUsername.trim().replace(/^@/, '');
    if (!rawUser && !targetUserId) {
      toast.error(t('Masukkan username yang ingin diundang'));
      return false;
    }

    const currentHubId = activeHub?.id;
    if (!currentHubId) {
      toast.error(t('Server tidak valid.'));
      return false;
    }

    try {
      setIsInvitingUsername(true);
      setUserNotFound(null);
      const res = await communityApi.inviteUserToServer(currentHubId, targetUserId, rawUser);
      if (res.alreadyMember) {
        toast.info(res.message || t(`Pengguna sudah menjadi anggota server ini.`));
        return true;
      }
      if (res.alreadyInvited) {
        toast.info(res.message || t(`Undangan sudah pernah dikirim ke pengguna ini.`));
        return true;
      }
      if (res.success) {
        toast.success(res.message || t(`Undangan ke server berhasil dikirim! 📩`));
        setInviteUsername('');
        setUserNotFound(null);
        return true;
      }
      setUserNotFound(rawUser);
      toast.error(res.message || t('Pengguna tidak ditemukan.'));
      return false;
    } catch (err) {
      console.error('Invite by username failed', err);
      setUserNotFound(rawUser);
      toast.error(t('Gagal mengundang pengguna. Silakan coba lagi.'));
      return false;
    } finally {
      setIsInvitingUsername(false);
    }
  };

  return {
    // Create / Join
    isCreateHubOpen,
    setIsCreateHubOpen,
    newHubName,
    setNewHubName,
    newHubDesc,
    setNewHubDesc,
    newHubIconUrl,
    setNewHubIconUrl,
    joinInviteCode,
    setJoinInviteCode,
    isJoiningHub,
    handleCreateHubSubmit,
    handleJoinHub,

    // Edit
    hubToEdit,
    setHubToEdit,
    editHubName,
    setEditHubName,
    editHubDesc,
    setEditHubDesc,
    handleOpenEditHub,
    handleEditHubSubmit,

    // Delete
    hubToDelete,
    setHubToDelete,
    handleDeleteHubConfirm,

    // Invite
    isInviteOpen,
    setIsInviteOpen,
    inviteUsername,
    setInviteUsername,
    isInvitingUsername,
    userNotFound,
    handleInviteByUsername,

    // Server Settings
    isServerSettingsOpen,
    setIsServerSettingsOpen,
    serverSettingsSection,
    setServerSettingsSection,
  };
}
