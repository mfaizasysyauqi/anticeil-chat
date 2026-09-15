'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DocShareModal } from '../components/DocShareModal';
import { DocSuggestionsDrawer } from '../components/DocSuggestionsDrawer';
import { DocCollaboratorsModal } from '../components/DocCollaboratorsModal';
import { DocSearchModal } from '../components/DocSearchModal';
import { DocItem } from '../store/useDocsStore';

export interface UseDocModalsReturn {
  isShareOpen: boolean;
  setIsShareOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isShareModalOpen: boolean;
  setIsShareModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openShare: () => void;
  closeShare: () => void;

  isSearchOpen: boolean;
  setIsSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSearchModalOpen: boolean;
  setIsSearchModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openSearch: () => void;
  closeSearch: () => void;

  isSuggestionsOpen: boolean;
  setIsSuggestionsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSuggestionsDrawerOpen: boolean;
  setIsSuggestionsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openSuggestions: () => void;
  closeSuggestions: () => void;

  isCollaboratorsOpen: boolean;
  setIsCollaboratorsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isCollaboratorsModalOpen: boolean;
  setIsCollaboratorsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openCollaborators: () => void;
  closeCollaborators: () => void;

  docModalsElement: React.ReactNode;
}

/**
 * Reusable hook that handles the 4 core document modals (Share, Search, Suggestions, Collaborators)
 * and auto-binds global keyboard shortcuts:
 * - Ctrl+Shift+F / Cmd+Shift+F -> Project Grep / Search Modal
 * - Ctrl+Shift+U / Cmd+Shift+U -> Suggestions / Track Changes Drawer
 */
export function useDocModals(doc: DocItem | null | undefined): UseDocModalsReturn {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        setIsSuggestionsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openShare = useCallback(() => setIsShareOpen(true), []);
  const closeShare = useCallback(() => setIsShareOpen(false), []);

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

  const openSuggestions = useCallback(() => setIsSuggestionsOpen(true), []);
  const closeSuggestions = useCallback(() => setIsSuggestionsOpen(false), []);

  const openCollaborators = useCallback(() => setIsCollaboratorsOpen(true), []);
  const closeCollaborators = useCallback(() => setIsCollaboratorsOpen(false), []);

  const effectiveDoc = doc ?? null;

  const docModalsElement = (
    <>
      <DocShareModal
        isOpen={isShareOpen}
        onClose={closeShare}
        doc={effectiveDoc}
      />
      <DocSuggestionsDrawer
        isOpen={isSuggestionsOpen}
        onClose={closeSuggestions}
        docId={doc?.id}
      />
      <DocCollaboratorsModal
        isOpen={isCollaboratorsOpen}
        onClose={closeCollaborators}
        doc={effectiveDoc}
      />
      <DocSearchModal
        isOpen={isSearchOpen}
        onClose={closeSearch}
        doc={effectiveDoc}
      />
    </>
  );

  return {
    isShareOpen,
    setIsShareOpen,
    isShareModalOpen: isShareOpen,
    setIsShareModalOpen: setIsShareOpen,
    openShare,
    closeShare,

    isSearchOpen,
    setIsSearchOpen,
    isSearchModalOpen: isSearchOpen,
    setIsSearchModalOpen: setIsSearchOpen,
    openSearch,
    closeSearch,

    isSuggestionsOpen,
    setIsSuggestionsOpen,
    isSuggestionsDrawerOpen: isSuggestionsOpen,
    setIsSuggestionsDrawerOpen: setIsSuggestionsOpen,
    openSuggestions,
    closeSuggestions,

    isCollaboratorsOpen,
    setIsCollaboratorsOpen,
    isCollaboratorsModalOpen: isCollaboratorsOpen,
    setIsCollaboratorsModalOpen: setIsCollaboratorsOpen,
    openCollaborators,
    closeCollaborators,

    docModalsElement,
  };
}
