import { useState } from 'react';
import type { Colony, ColonyChannel, ColonyMember } from '@/chat/chat-types';
import { colonyApi } from '@/chat/chat-api';
import { saveStoredColonies } from '@/chat/chat-defaults';
import type { ColonySettingsSection } from '@/features/colony-settings';
import { toast } from 'sonner';

interface UseColonyModalsOptions {
  colonies: Colony[];
  setColonies: React.Dispatch<React.SetStateAction<Colony[]>>;
  channels: ColonyChannel[];
  setChannels: React.Dispatch<React.SetStateAction<ColonyChannel[]>>;
  activeColony: Colony | undefined;
  setActiveColonyId: (id: string) => void;
  setActiveChannelId: (id: string) => void;
  setActiveCallChannelId?: (id: string | null) => void;
  setIsCallPiP?: (val: boolean) => void;
  setSelectedActivityAppId?: (id: string | null) => void;
  setIsActivityOpen?: (val: boolean) => void;
  setMembers?: React.Dispatch<React.SetStateAction<ColonyMember[]>>;
  t: (key: string) => string;
}

export function useColonyModals({
  colonies,
  setColonies,
  channels,
  setChannels,
  activeColony,
  setActiveColonyId,
  setActiveChannelId,
  setActiveCallChannelId,
  setIsCallPiP,
  setSelectedActivityAppId,
  setIsActivityOpen,
  setMembers,
  t,
}: UseColonyModalsOptions) {
  // Create / Join Server Modal
  const [isCreateHubOpen, setIsCreateHubOpen] = useState(false);
  const [newHubName, setNewHubName] = useState('');
  const [newHubDesc, setNewHubDesc] = useState('');
  const [newHubIconUrl, setNewHubIconUrl] = useState('');
  const [joinInviteCode, setJoinInviteCode] = useState('');
  const [isJoiningColony, setIsJoiningColony] = useState(false);

  // Edit Server Modal
  const [colonyToEdit, setColonyToEdit] = useState<Colony | null>(null);
  const [editHubName, setEditHubName] = useState('');
  const [editHubDesc, setEditHubDesc] = useState('');

  // Delete Server Modal
  const [colonyToDelete, setColonyToDelete] = useState<Colony | null>(null);

  // Server Invite Modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [isInvitingUsername, setIsInvitingUsername] = useState(false);
  const [userNotFound, setUserNotFound] = useState<string | null>(null);

  // Server Settings Modal
  const [isServerSettingsOpen, setIsServerSettingsOpen] = useState(false);
  const [serverSettingsSection, setColonySettingsSection] = useState<ColonySettingsSection>('profile');

  // Create Server Submit
  const handleCreateHubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHubName.trim()) return;

    try {
      const createdHub = await colonyApi.createColony({
        name: newHubName.trim(),
        description: newHubDesc.trim() || undefined,
        iconUrl: newHubIconUrl || undefined,
      });

      const updatedHubs = [...colonies.filter((h) => h.id !== createdHub.id), createdHub];
      setColonies(updatedHubs);
      saveStoredColonies(updatedHubs);
      setActiveColonyId(createdHub.id);

      let colonyChannels = await colonyApi.getChannels(createdHub.id);
      if (!colonyChannels || colonyChannels.length === 0) {
        const [defaultCh, defaultVoice] = await Promise.all([
          colonyApi.createChannel({
            name: 'General',
            description: `Saluran obrolan umum untuk server ${createdHub.name}`,
            category: 'CHANNELS',
            colonyId: createdHub.id,
            type: 'text',
          }),
          colonyApi.createChannel({
            name: 'General',
            description: `Saluran suara & video untuk server ${createdHub.name}`,
            category: 'CHANNELS',
            colonyId: createdHub.id,
            type: 'voice',
          }),
        ]);
        colonyChannels = [defaultCh, defaultVoice];
      }
      setChannels((prev) => [...prev.filter((c) => c.colonyId !== createdHub.id), ...colonyChannels]);
      setActiveChannelId(colonyChannels[0].id);

      setIsCreateHubOpen(false);
      setNewHubName('');
      setNewHubDesc('');
      setNewHubIconUrl('');
      toast.success(t('Server baru berhasil dibuat!'));
    } catch (err) {
      console.warn('API createColony fallback', err);
      const newId = `hub_${Date.now()}`;
      const newHub: Colony = {
        id: newId,
        name: newHubName.trim(),
        iconType: undefined as any,
        initials: newHubName.trim().slice(0, 2).toUpperCase() || 'SV',
        description: newHubDesc.trim() || '',
        iconUrl: newHubIconUrl || undefined,
      };

      const defaultText: ColonyChannel = {
        id: `ch_${Date.now()}_gen`,
        name: 'General',
        description: `Saluran obrolan umum untuk server ${newHub.name}`,
        category: 'CHANNELS',
        colonyId: newId,
        type: 'text',
      };
      const defaultVoice: ColonyChannel = {
        id: `ch_${Date.now()}_voice`,
        name: 'General',
        description: `Saluran suara & video untuk server ${newHub.name}`,
        category: 'CHANNELS',
        colonyId: newId,
        type: 'voice',
      };

      const updatedHubs = [...colonies, newHub];
      setColonies(updatedHubs);
      saveStoredColonies(updatedHubs);
      setChannels((prev) => [...prev, defaultText, defaultVoice]);
      setActiveColonyId(newId);
      setActiveChannelId(defaultText.id);

      setIsCreateHubOpen(false);
      setNewHubName('');
      setNewHubDesc('');
      setNewHubIconUrl('');
      toast.success(t('Server baru berhasil dibuat!'));
    }
  };

  // Join Server via Invite Code/Link
  const handleJoinColony = async (codeToJoin?: string) => {
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
      setIsJoiningColony(true);
      const joinedHub = await colonyApi.joinHub(code);
      setColonies((prev) => {
        const next = [...prev.filter((h) => h.id !== joinedHub.id), joinedHub];
        saveStoredColonies(next);
        return next;
      });
      setActiveColonyId(joinedHub.id);

      const colonyChannels = await colonyApi.getChannels(joinedHub.id);
      if (colonyChannels && colonyChannels.length > 0) {
        setChannels((prev) => [...prev.filter((c) => c.colonyId !== joinedHub.id), ...colonyChannels]);
        const targetChannelParam = new URLSearchParams(window.location.search).get('channel');
        const targetActivityParam = new URLSearchParams(window.location.search).get('activity');
        if (targetActivityParam) {
          const normalizedAct = targetActivityParam === 'youtube' ? 'watch-together' : targetActivityParam;
          setSelectedActivityAppId?.(normalizedAct);
          setIsActivityOpen?.(true);
        }
        let matchedChannel = colonyChannels.find((c) => c.id === targetChannelParam);
        if (!matchedChannel && targetActivityParam) {
          matchedChannel = colonyChannels.find((c) => c.type === 'voice');
        }
        if (matchedChannel) {
          setActiveChannelId(matchedChannel.id);
          if (matchedChannel.type === 'voice') {
            setActiveCallChannelId?.(matchedChannel.id);
            setIsCallPiP?.(false);
          }
        } else {
          setActiveChannelId(colonyChannels[0].id);
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
      setIsJoiningColony(false);
    }
  };

  // Open Edit Hub
  const handleOpenEditColony = (hub: Colony) => {
    setColonyToEdit(hub);
    setEditHubName(hub.name);
    setEditHubDesc(hub.description || '');
  };

  // Edit Server Submit
  const handleEditHubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colonyToEdit || !editHubName.trim()) return;

    const newName = editHubName.trim();
    try {
      const updated = await colonyApi.updateColony(colonyToEdit.id, {
        name: newName,
        description: editHubDesc.trim() || undefined,
      });
      const updatedHubs = colonies.map((h) => (h.id === updated.id ? { ...h, ...updated } : h));
      setColonies(updatedHubs);
      saveStoredColonies(updatedHubs);
      setColonyToEdit(null);
      toast.success(t('Nama server berhasil diperbarui!'));
    } catch {
      const updatedHubs: Colony[] = colonies.map((h) => {
        if (h.id === colonyToEdit.id) {
          return {
            ...h,
            name: newName,
            initials: newName.slice(0, 2).toUpperCase() || 'SV',
            description: editHubDesc.trim() || undefined,
          };
        }
        return h;
      });

      setColonies(updatedHubs);
      saveStoredColonies(updatedHubs);
      setColonyToEdit(null);
      toast.success(t('Nama server berhasil diperbarui!'));
    }
  };

  // Delete Server Confirm
  const handleDeleteHubConfirm = async () => {
    if (!colonyToDelete) return;
    if (colonyToDelete.id === 'anticeil') {
      toast.error(t('Server default tidak dapat dihapus.'));
      setColonyToDelete(null);
      return;
    }

    try {
      await colonyApi.deleteColony(colonyToDelete.id);
    } catch (err) {
      console.warn('API deleteColony error', err);
    }

    const updatedHubs = colonies.filter((h) => h.id !== colonyToDelete.id);
    setColonies(updatedHubs);
    saveStoredColonies(updatedHubs);

    setChannels((prev) => prev.filter((c) => c.colonyId !== colonyToDelete.id));
    setActiveColonyId('anticeil');

    const firstDm = channels.find((c) => c.category === 'DIRECT MESSAGES');
    setActiveChannelId(firstDm?.id || '');

    setColonyToDelete(null);
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

    const currentHubId = activeColony?.id;
    if (!currentHubId) {
      toast.error(t('Server tidak valid.'));
      return false;
    }

    try {
      setIsInvitingUsername(true);
      setUserNotFound(null);
      const res = await colonyApi.inviteUserToServer(currentHubId, targetUserId, rawUser);
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
    isJoiningColony,
    handleCreateHubSubmit,
    handleJoinColony,

    // Edit
    colonyToEdit,
    setColonyToEdit,
    editHubName,
    setEditHubName,
    editHubDesc,
    setEditHubDesc,
    handleOpenEditColony,
    handleEditHubSubmit,

    // Delete
    colonyToDelete,
    setColonyToDelete,
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
    setColonySettingsSection,
  };
}
