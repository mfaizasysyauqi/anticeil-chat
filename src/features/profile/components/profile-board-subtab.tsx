import React, { useState } from 'react';
import {
  Tag,
  Bookmark,
  Link as LinkIcon,
  Shield,
  Plus,
  X,
  Pencil,
  Trash2,
  Globe,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/core/i18n';
import { toast } from 'sonner';
import type { Colony } from '@/chat/chat-types';
import type {
  UserProfileWidgets,
  SocialLinkItem,
} from '../api/profile-api';

export interface ProfileBoardSubtabProps {
  profileWidgets: UserProfileWidgets;
  persistWidgets: (newWidgets: UserProfileWidgets) => void;
  userColoniesList: Colony[];
}

export function ProfileBoardSubtab({
  profileWidgets,
  persistWidgets,
  userColoniesList,
}: ProfileBoardSubtabProps) {
  const { t } = useTranslation();

  // Active Widget Creator: 'note' | 'interests' | 'links' | 'colony' | null
  const [activeWidgetCreator, setActiveWidgetCreator] = useState<
    'note' | 'interests' | 'links' | 'colony' | null
  >(null);

  // Widget Inputs
  const [noteTitleInput, setNoteTitleInput] = useState('');
  const [noteContentInput, setNoteContentInput] = useState('');
  const [noteEmojiInput, setNoteEmojiInput] = useState('📌');
  const [isEditingNote, setIsEditingNote] = useState(false);

  const [newTagInput, setNewTagInput] = useState('');
  const [newLinkLabelInput, setNewLinkLabelInput] = useState('');
  const [newLinkUrlInput, setNewLinkUrlInput] = useState('');

  // Custom Note Widget Handlers
  const handleSaveCustomNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitleInput.trim() && !noteContentInput.trim()) {
      toast.error(t('Judul atau isi catatan diperlukan'));
      return;
    }
    const updated: UserProfileWidgets = {
      ...profileWidgets,
      customNote: {
        title: noteTitleInput.trim() || 'Catatan Profil',
        content: noteContentInput.trim() || 'Sedang fokus mengerjakan projek.',
        emoji: noteEmojiInput || '📌',
      },
    };
    persistWidgets(updated);
    setIsEditingNote(false);
    setActiveWidgetCreator(null);
    toast.success(t('Widget Catatan berhasil disimpan! 🎉'));
  };

  const handleDeleteCustomNote = () => {
    const updated: UserProfileWidgets = { ...profileWidgets, customNote: null };
    persistWidgets(updated);
    toast.info(t('Widget Catatan dihapus'));
  };

  // Interests / Minat Widget Handlers
  const handleAddInterestTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    const tag = newTagInput.trim();
    const currentTags = profileWidgets.interests?.tags || [];
    if (currentTags.includes(tag)) {
      toast.info(t('Tag sudah ada di daftar!'));
      return;
    }
    const updated: UserProfileWidgets = {
      ...profileWidgets,
      interests: {
        title: profileWidgets.interests?.title || 'Minat & Keahlian',
        tags: [...currentTags, tag],
      },
    };
    setNewTagInput('');
    persistWidgets(updated);
    toast.success(t('Tag berhasil ditambahkan!'));
  };

  const handleRemoveInterestTag = (tag: string) => {
    const currentTags = profileWidgets.interests?.tags || [];
    const updated: UserProfileWidgets = {
      ...profileWidgets,
      interests: {
        title: profileWidgets.interests?.title || 'Minat & Keahlian',
        tags: currentTags.filter((t) => t !== tag),
      },
    };
    persistWidgets(updated);
  };

  const handleDeleteInterestsWidget = () => {
    const updated: UserProfileWidgets = { ...profileWidgets, interests: null };
    persistWidgets(updated);
    toast.info(t('Widget Minat & Keahlian dihapus'));
  };

  // Social Links Widget Handlers
  const handleAddSocialLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkLabelInput.trim() || !newLinkUrlInput.trim()) {
      toast.error(t('Label dan alamat tautan diperlukan'));
      return;
    }
    let cleanUrl = newLinkUrlInput.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }
    const newLink: SocialLinkItem = {
      id: `link_${Date.now()}`,
      label: newLinkLabelInput.trim(),
      url: cleanUrl,
    };
    const currentLinks = profileWidgets.socialLinks?.links || [];
    const updated: UserProfileWidgets = {
      ...profileWidgets,
      socialLinks: {
        title: profileWidgets.socialLinks?.title || 'Tautan & Jejaring',
        links: [...currentLinks, newLink],
      },
    };
    setNewLinkLabelInput('');
    setNewLinkUrlInput('');
    persistWidgets(updated);
    setActiveWidgetCreator(null);
    toast.success(t('Tautan berhasil ditambahkan! 🔗'));
  };

  const handleRemoveSocialLink = (linkId: string) => {
    const currentLinks = profileWidgets.socialLinks?.links || [];
    const updated: UserProfileWidgets = {
      ...profileWidgets,
      socialLinks: {
        title: profileWidgets.socialLinks?.title || 'Tautan & Jejaring',
        links: currentLinks.filter((l) => l.id !== linkId),
      },
    };
    persistWidgets(updated);
  };

  const handleDeleteSocialLinksWidget = () => {
    const updated: UserProfileWidgets = { ...profileWidgets, socialLinks: null };
    persistWidgets(updated);
    toast.info(t('Widget Tautan dihapus'));
  };

  // Featured Colony Widget Handlers
  const handleSelectFeaturedColony = (colony: Colony) => {
    const updated: UserProfileWidgets = {
      ...profileWidgets,
      featuredColony: {
        colonyId: colony.id,
        colonyName: colony.name,
        icon: colony.iconUrl || undefined,
        role: 'Anggota',
      },
    };
    persistWidgets(updated);
    setActiveWidgetCreator(null);
    toast.success(t(`Komunitas "${colony.name}" dijadikan unggulan! 🏰`));
  };

  const handleDeleteFeaturedColony = () => {
    const updated: UserProfileWidgets = { ...profileWidgets, featuredColony: null };
    persistWidgets(updated);
    toast.info(t('Widget Komunitas Unggulan dihapus'));
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-foreground">{t('Your Widgets')}</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-semibold">
            {[
              profileWidgets.customNote ? 1 : 0,
              profileWidgets.interests ? 1 : 0,
              profileWidgets.socialLinks ? 1 : 0,
              profileWidgets.featuredColony ? 1 : 0,
            ].reduce((a, b) => a + b, 0)}{' '}
            {t('Aktif')}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="teal"
            onClick={() => {
              if (!profileWidgets.customNote) {
                setActiveWidgetCreator('note');
              } else if (!profileWidgets.interests) {
                setActiveWidgetCreator('interests');
              } else if (!profileWidgets.socialLinks) {
                setActiveWidgetCreator('links');
              } else if (!profileWidgets.featuredColony) {
                setActiveWidgetCreator('colony');
              } else {
                setActiveWidgetCreator('note');
              }
            }}
            className="text-xs px-3 h-8 font-semibold cursor-pointer"
          >
            + {t('Add Widget')}
          </Button>
        </div>
      </div>

      {/* Suggested for you (Clean Anticeil Widgets) */}
      {!profileWidgets.dismissedSuggested && (
        <div className="p-3.5 rounded-xl border border-border/80 bg-card space-y-3 relative shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">
              {t('Suggested for you')}
            </span>
            <button
              type="button"
              onClick={() =>
                persistWidgets({ ...profileWidgets, dismissedSuggested: true })
              }
              className="text-muted-foreground hover:text-foreground p-1 rounded cursor-pointer transition-colors"
              title={t('Tutup')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Suggestion 1: Minat & Keahlian */}
            <div
              onClick={() => {
                if (!profileWidgets.interests) {
                  persistWidgets({
                    ...profileWidgets,
                    interests: {
                      title: 'Minat & Keahlian',
                      tags: ['UI/UX Design', 'Fullstack Dev'],
                    },
                  });
                  toast.success(t('Widget Minat & Keahlian ditambahkan!'));
                } else {
                  toast.info(t('Widget Minat & Keahlian sudah aktif'));
                }
              }}
              className="h-20 rounded-xl border border-border/70 bg-secondary/30 hover:bg-secondary/60 p-3 flex flex-col justify-between hover:border-sidebar-primary/60 cursor-pointer group shadow-2xs transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="size-6 rounded-lg bg-sidebar-primary/10 text-sidebar-primary flex items-center justify-center text-xs group-hover:scale-105 transition-transform">
                  <Tag className="w-3.5 h-3.5" />
                </div>
                <Plus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-sidebar-primary" />
              </div>
              <span className="text-xs font-semibold text-foreground">
                {t('Minat & Keahlian')}
              </span>
            </div>

            {/* Suggestion 2: Catatan Profil */}
            <div
              onClick={() => {
                if (!profileWidgets.customNote) {
                  setActiveWidgetCreator('note');
                  setIsEditingNote(true);
                } else {
                  setIsEditingNote(true);
                }
              }}
              className="h-20 rounded-xl border border-border/70 bg-secondary/30 hover:bg-secondary/60 p-3 flex flex-col justify-between hover:border-sidebar-primary/60 cursor-pointer group shadow-2xs transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="size-6 rounded-lg bg-sidebar-primary/10 text-sidebar-primary flex items-center justify-center text-xs group-hover:scale-105 transition-transform">
                  <Bookmark className="w-3.5 h-3.5" />
                </div>
                <Plus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-sidebar-primary" />
              </div>
              <span className="text-xs font-semibold text-foreground">
                {t('Catatan / Highlight')}
              </span>
            </div>

            {/* Suggestion 3: Tautan Sosial */}
            <div
              onClick={() => {
                if (!profileWidgets.socialLinks) {
                  setActiveWidgetCreator('links');
                } else {
                  toast.info(t('Widget Tautan sudah aktif'));
                }
              }}
              className="h-20 rounded-xl border border-border/70 bg-secondary/30 hover:bg-secondary/60 p-3 flex flex-col justify-between hover:border-sidebar-primary/60 cursor-pointer group shadow-2xs transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="size-6 rounded-lg bg-sidebar-primary/10 text-sidebar-primary flex items-center justify-center text-xs group-hover:scale-105 transition-transform">
                  <LinkIcon className="w-3.5 h-3.5" />
                </div>
                <Plus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-sidebar-primary" />
              </div>
              <span className="text-xs font-semibold text-foreground">
                {t('Tautan & Jejaring')}
              </span>
            </div>

            {/* Suggestion 4: Komunitas Unggulan */}
            <div
              onClick={() => {
                if (userColoniesList.length > 0) {
                  handleSelectFeaturedColony(userColoniesList[0]);
                } else {
                  setActiveWidgetCreator('colony');
                }
              }}
              className="h-20 rounded-xl border border-border/70 bg-secondary/30 hover:bg-secondary/60 p-3 flex flex-col justify-between hover:border-sidebar-primary/60 cursor-pointer group shadow-2xs transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="size-6 rounded-lg bg-sidebar-primary/10 text-sidebar-primary flex items-center justify-center text-xs group-hover:scale-105 transition-transform">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <Plus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-sidebar-primary" />
              </div>
              <span className="text-xs font-semibold text-foreground">
                {t('Komunitas Unggulan')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Inline Creator: Custom Note */}
      {(activeWidgetCreator === 'note' || isEditingNote) && (
        <form
          onSubmit={handleSaveCustomNote}
          className="p-4 rounded-xl border border-sidebar-primary/40 bg-card space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-sidebar-primary" />
              {t('Atur Widget Catatan')}
            </span>
            <X
              className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-foreground"
              onClick={() => {
                setActiveWidgetCreator(null);
                setIsEditingNote(false);
              }}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-16">
                <label className="text-[10px] text-muted-foreground block mb-1">
                  {t('Emoji')}
                </label>
                <Input
                  type="text"
                  value={noteEmojiInput}
                  onChange={(e) => setNoteEmojiInput(e.target.value)}
                  className="text-center text-sm h-8"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-muted-foreground block mb-1">
                  {t('Judul Catatan')}
                </label>
                <Input
                  type="text"
                  value={noteTitleInput}
                  onChange={(e) => setNoteTitleInput(e.target.value)}
                  placeholder={t('e.g. Focus Goal / About Me')}
                  className="text-xs h-8"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">
                {t('Isi Catatan')}
              </label>
              <Input
                type="text"
                value={noteContentInput}
                onChange={(e) => setNoteContentInput(e.target.value)}
                placeholder={t(
                  'Tulis catatan singkat atau status yang ingin Anda tampilkan...'
                )}
                className="text-xs h-8"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="tealSecondary"
              onClick={() => {
                setActiveWidgetCreator(null);
                setIsEditingNote(false);
              }}
              className="h-7 text-xs"
            >
              {t('Batal')}
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="teal"
              className="h-7 text-xs font-bold"
            >
              {t('Simpan Catatan')}
            </Button>
          </div>
        </form>
      )}

      {/* Inline Creator: Social Link */}
      {activeWidgetCreator === 'links' && !profileWidgets.socialLinks && (
        <form
          onSubmit={handleAddSocialLink}
          className="p-4 rounded-xl border border-sidebar-primary/40 bg-card space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-sidebar-primary" />
              {t('Tambah Tautan Baru')}
            </span>
            <X
              className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-foreground"
              onClick={() => setActiveWidgetCreator(null)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">
                {t('Nama Label')}
              </label>
              <Input
                type="text"
                value={newLinkLabelInput}
                onChange={(e) => setNewLinkLabelInput(e.target.value)}
                placeholder="e.g. GitHub / Portfolio"
                className="text-xs h-8"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">
                {t('URL Tautan')}
              </label>
              <Input
                type="text"
                value={newLinkUrlInput}
                onChange={(e) => setNewLinkUrlInput(e.target.value)}
                placeholder="https://..."
                className="text-xs h-8"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="tealSecondary"
              onClick={() => setActiveWidgetCreator(null)}
              className="h-7 text-xs"
            >
              {t('Batal')}
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="teal"
              className="h-7 text-xs font-bold"
            >
              {t('Tambah Tautan')}
            </Button>
          </div>
        </form>
      )}

      {/* Inline Creator: Featured Colony */}
      {activeWidgetCreator === 'colony' && !profileWidgets.featuredColony && (
        <div className="p-4 rounded-xl border border-sidebar-primary/40 bg-card space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-sidebar-primary" />
              {t('Pilih Komunitas Unggulan')}
            </span>
            <X
              className="w-4 h-4 cursor-pointer text-muted-foreground hover:text-foreground"
              onClick={() => setActiveWidgetCreator(null)}
            />
          </div>
          {userColoniesList.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {userColoniesList.map((col) => (
                <div
                  key={col.id}
                  onClick={() => handleSelectFeaturedColony(col)}
                  className="p-2.5 rounded-lg border border-border/70 hover:border-sidebar-primary bg-secondary/30 hover:bg-secondary/60 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-lg bg-sidebar-primary/20 flex items-center justify-center font-bold text-xs text-sidebar-primary overflow-hidden">
                      {col.iconUrl ? (
                        <img
                          src={col.iconUrl}
                          alt={col.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        col.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <span className="text-xs font-semibold text-foreground truncate">
                      {col.name}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="tealGhost"
                    className="h-6 text-[11px] px-2"
                  >
                    {t('Pilih')}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t('Anda belum bergabung dengan komunitas apapun.')}
            </p>
          )}
        </div>
      )}

      {/* WIDGET 1: Custom Note Card (Active) */}
      {profileWidgets.customNote && (
        <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-xs relative group">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-xl bg-sidebar-primary/10 border border-sidebar-primary/30 flex items-center justify-center text-lg shrink-0">
                {profileWidgets.customNote.emoji || '📌'}
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-foreground">
                  {profileWidgets.customNote.title}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {profileWidgets.customNote.content}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                size="sm"
                variant="tealGhost"
                onClick={() => {
                  setNoteTitleInput(profileWidgets.customNote?.title || '');
                  setNoteContentInput(profileWidgets.customNote?.content || '');
                  setNoteEmojiInput(profileWidgets.customNote?.emoji || '📌');
                  setIsEditingNote(true);
                }}
                className="h-7 px-2 text-xs cursor-pointer"
                title={t('Edit Catatan')}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDeleteCustomNote}
                className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                title={t('Hapus Widget')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* WIDGET 2: Interests / Minat & Keahlian Chips */}
      {profileWidgets.interests && (
        <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-sidebar-primary" />
              <span className="text-xs font-bold text-foreground">
                {profileWidgets.interests.title || t('Minat & Keahlian')}
              </span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                {profileWidgets.interests.tags.length}
              </Badge>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDeleteInterestsWidget}
              className="h-6 px-1.5 text-destructive hover:bg-destructive/10"
              title={t('Hapus Widget')}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {profileWidgets.interests.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary text-foreground text-xs font-medium border border-border/70 group"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveInterestTag(tag)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  title={t('Hapus tag')}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>

          <form
            onSubmit={handleAddInterestTag}
            className="flex items-center gap-2 pt-1"
          >
            <Input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              placeholder={t('Tambah keahlian (e.g. React, UI/UX, Anticeil)...')}
              className="flex-1 text-xs h-8"
            />
            <Button
              type="submit"
              size="sm"
              variant="teal"
              className="h-8 text-xs font-semibold"
            >
              + {t('Tambah')}
            </Button>
          </form>
        </div>
      )}

      {/* WIDGET 3: Social & Web Links */}
      {profileWidgets.socialLinks && (
        <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-3.5 h-3.5 text-sidebar-primary" />
              <span className="text-xs font-bold text-foreground">
                {profileWidgets.socialLinks.title || t('Tautan & Jejaring')}
              </span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                {profileWidgets.socialLinks.links.length}
              </Badge>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDeleteSocialLinksWidget}
              className="h-6 px-1.5 text-destructive hover:bg-destructive/10"
              title={t('Hapus Widget')}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>

          <div className="space-y-1.5">
            {profileWidgets.socialLinks.links.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-2 rounded-lg bg-secondary/40 border border-border/60 hover:border-sidebar-primary/40 transition-colors"
              >
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-semibold text-foreground hover:text-sidebar-primary truncate"
                >
                  <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{link.label}</span>
                  <ExternalLink className="w-3 h-3 opacity-60 shrink-0" />
                </a>
                <button
                  type="button"
                  onClick={() => handleRemoveSocialLink(link.id)}
                  className="text-muted-foreground hover:text-destructive p-1 rounded"
                  title={t('Hapus tautan')}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleAddSocialLink}
            className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-border/40"
          >
            <Input
              type="text"
              value={newLinkLabelInput}
              onChange={(e) => setNewLinkLabelInput(e.target.value)}
              placeholder={t('Label (e.g. GitHub)')}
              className="text-xs h-8"
            />
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={newLinkUrlInput}
                onChange={(e) => setNewLinkUrlInput(e.target.value)}
                placeholder="https://..."
                className="flex-1 text-xs h-8"
              />
              <Button
                type="submit"
                size="sm"
                variant="teal"
                className="h-8 text-xs font-semibold"
              >
                + {t('Tambah')}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* WIDGET 4: Featured Colony Card */}
      {profileWidgets.featuredColony && (
        <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-sidebar-primary/20 border border-sidebar-primary/30 flex items-center justify-center font-bold text-xs text-sidebar-primary overflow-hidden">
                {profileWidgets.featuredColony.icon ? (
                  <img
                    src={profileWidgets.featuredColony.icon}
                    alt={profileWidgets.featuredColony.colonyName}
                    className="size-full object-cover"
                  />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                  {t('Komunitas Unggulan')}
                </div>
                <div className="text-xs font-bold text-foreground">
                  {profileWidgets.featuredColony.colonyName}
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDeleteFeaturedColony}
              className="h-6 px-1.5 text-destructive hover:bg-destructive/10"
              title={t('Hapus Widget')}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Empty State when no widgets on board */}
      {!profileWidgets.customNote &&
        !profileWidgets.interests &&
        !profileWidgets.socialLinks &&
        !profileWidgets.featuredColony && (
          <div className="p-8 rounded-2xl border border-dashed border-border/80 text-center space-y-3 bg-muted/10">
            <div className="size-12 rounded-2xl bg-secondary/80 flex items-center justify-center text-xl mx-auto text-sidebar-primary">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-foreground">
                {t('Belum ada widget di Board')}
              </div>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto leading-relaxed">
                {t(
                  'Tambahkan catatan kustom, daftar minat & keahlian, atau tautan profil Anda untuk mempercantik kartu profil Anticeil.'
                )}
              </p>
            </div>
            <Button
              size="sm"
              variant="teal"
              onClick={() => setActiveWidgetCreator('note')}
              className="text-xs font-bold h-8 px-4"
            >
              + {t('Tambah Widget Pertama')}
            </Button>
          </div>
        )}
    </div>
  );
}
