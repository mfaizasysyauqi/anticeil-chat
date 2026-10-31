import { useState } from 'react';
import type { ColonyChannel, ColonyChannelType } from '@/chat/chat-types';
import { colonyApi } from '@/chat/chat-api';
import { toast } from 'sonner';

interface UseChannelModalsOptions {
  activeColonyId: string;
  channels: ColonyChannel[];
  setChannels: React.Dispatch<React.SetStateAction<ColonyChannel[]>>;
  activeChannelId: string;
  setActiveChannelId: (id: string) => void;
  t: (key: string) => string;
}

export function useChannelModals({
  activeColonyId,
  channels,
  setChannels,
  activeChannelId,
  setActiveChannelId,
  t,
}: UseChannelModalsOptions) {
  // Create Channel Modal
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [newChannelCategory, setNewChannelCategory] = useState<'CHANNELS' | 'DIRECT MESSAGES'>('CHANNELS');
  const [newChannelType, setNewChannelType] = useState<ColonyChannelType>('text');
  const [newChannelIsPrivate, setNewChannelIsPrivate] = useState(false);

  // Edit Channel Modal
  const [channelToEdit, setChannelToEdit] = useState<ColonyChannel | null>(null);
  const [editChannelName, setEditChannelName] = useState('');
  const [editChannelDesc, setEditChannelDesc] = useState('');
  const [editChannelType, setEditChannelType] = useState<ColonyChannelType>('text');

  // Delete Channel Modal
  const [channelToDelete, setChannelToDelete] = useState<ColonyChannel | null>(null);

  // Channel Settings Dialog
  const [channelForSettings, setChannelForSettings] = useState<ColonyChannel | null>(null);

  // Webhook Dialog
  const [isWebhookDialogOpen, setIsWebhookDialogOpen] = useState(false);

  // Create Channel Submit
  const handleCreateChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    const formattedName =
      newChannelType === 'voice'
        ? newChannelName.trim()
        : newChannelName.trim().toLowerCase().replace(/\s+/g, '-');

    try {
      const created = await colonyApi.createChannel({
        name: formattedName,
        description: newChannelDesc.trim(),
        category: newChannelCategory,
        colonyId: activeColonyId === 'direct-messages' ? 'anticeil' : activeColonyId,
        type: newChannelType,
        isPrivate: newChannelIsPrivate,
      });

      setChannels((prev) => {
        if (prev.some((c) => c.id === created.id)) return prev;
        return [...prev, created];
      });
      setActiveChannelId(created.id);
      setIsCreateChannelOpen(false);
      setNewChannelName('');
      setNewChannelDesc('');
      setNewChannelType('text');
      setNewChannelIsPrivate(false);
      toast.success(t(`Channel ${created.name} berhasil dibuat!`));
    } catch (err) {
      console.error('Failed to create channel', err);
    }
  };

  // Open Edit Channel
  const handleOpenEditChannel = (channel: ColonyChannel, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setChannelForSettings(channel);
  };

  // Update Channel Settings (from Settings dialog)
  const handleUpdateChannelSettings = async (channelId: string, updates: Partial<ColonyChannel>) => {
    try {
      const updated = await colonyApi.updateChannel(channelId, {
        name: updates.name,
        description: updates.description,
        type: updates.type,
        slowmode: updates.slowmode,
        contentVisibility: updates.contentVisibility,
      });
      setChannels((prev) =>
        prev.map((c) => (c.id === channelId ? { ...c, ...updated, ...updates } : c)),
      );
      toast.success(t('Pengaturan channel berhasil disimpan!'));
    } catch (err) {
      console.error('Failed to update channel settings', err);
      toast.error(t('Gagal menyimpan perubahan channel'));
      throw err;
    }
  };

  // Edit Channel Submit
  const handleEditChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelToEdit || !editChannelName.trim()) return;

    try {
      const updated = await colonyApi.updateChannel(channelToEdit.id, {
        name: editChannelName.trim(),
        description: editChannelDesc.trim(),
        type: editChannelType,
      });
      setChannels((prev) =>
        prev.map((c) => (c.id === channelToEdit.id ? { ...c, ...updated, type: editChannelType } : c)),
      );
      setChannelToEdit(null);
      toast.success(t('Channel berhasil diperbarui!'));
    } catch (err) {
      console.error('Failed to edit channel', err);
    }
  };

  // Open Delete Channel Modal
  const handleOpenDeleteChannel = (channel: ColonyChannel, e: React.MouseEvent) => {
    e.stopPropagation();
    setChannelToDelete(channel);
  };

  // Delete Channel Confirm
  const handleDeleteChannelConfirm = async () => {
    if (!channelToDelete) return;
    const id = channelToDelete.id;
    setChannels((prev) => prev.filter((c) => c.id !== id));
    if (activeChannelId === id) {
      setActiveChannelId('');
    }
    setChannelToDelete(null);

    try {
      await colonyApi.deleteChannel(id);
    } catch (err) {
      console.error('Failed to delete channel', err);
    }
  };

  return {
    // Create
    isCreateChannelOpen,
    setIsCreateChannelOpen,
    newChannelName,
    setNewChannelName,
    newChannelDesc,
    setNewChannelDesc,
    newChannelCategory,
    setNewChannelCategory,
    newChannelType,
    setNewChannelType,
    newChannelIsPrivate,
    setNewChannelIsPrivate,
    handleCreateChannelSubmit,

    // Edit
    channelToEdit,
    setChannelToEdit,
    editChannelName,
    setEditChannelName,
    editChannelDesc,
    setEditChannelDesc,
    editChannelType,
    setEditChannelType,
    handleOpenEditChannel,
    handleEditChannelSubmit,

    // Delete
    channelToDelete,
    setChannelToDelete,
    handleOpenDeleteChannel,
    handleDeleteChannelConfirm,

    // Settings
    channelForSettings,
    setChannelForSettings,
    handleUpdateChannelSettings,

    // Webhooks
    isWebhookDialogOpen,
    setIsWebhookDialogOpen,
  };
}
