'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  MoreVertical,
  PanelLeftOpen,
  Pin,
  Folder,
  Trash2,
  ChevronRight,
  Check,
  Zap,
} from 'lucide-react';
import { useSettingsStore } from '../../features/settings/store/useSettingsStore';
import { useAuthStore } from '../../features/auth/store/useAuthStore';
import { useBuildStore } from '../../features/chat/store/useBuildStore';
import { useChatStore } from '../../features/chat/store/useChatStore';
import { useAutomationStore } from '../../features/automations/store/useAutomationStore';
import { useProjectStore } from '../../features/chat/store/useProjectStore';
import { getTranslation } from '@anticeil/core';

interface NavbarProps {
  onOpenModelSelector?: () => void;
  onToggleMobileSidebar?: () => void;
  isDesktopSidebarCollapsed?: boolean;
  onToggleDesktopSidebar?: () => void;
}

export function Navbar({
  onToggleMobileSidebar,
  isDesktopSidebarCollapsed = false,
  onToggleDesktopSidebar,
}: NavbarProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProjectSubmenuOpen, setIsProjectSubmenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const language = useSettingsStore((s) => s.language);
  const user = useAuthStore((s) => s.user);
  const initializeAuth = useAuthStore((s) => s.initializeAuth);

  const isBuildOpen = useBuildStore((s) => s.isOpen);
  const toggleBuild = useBuildStore((s) => s.toggle);

  const activeWorkflowTitle = useAutomationStore((s) => s.activeWorkflowTitle);

  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const sessions = useChatStore((s) => s.sessions);
  const updateSession = useChatStore((s) => s.updateSession);
  const deleteSession = useChatStore((s) => s.deleteSession);
  const createSession = useChatStore((s) => s.createSession);

  const projects = useProjectStore((s) => s.folders);
  const assignSession = useProjectStore((s) => s.assignSession);
  const removeSession = useProjectStore((s) => s.removeSession);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const t = getTranslation(language);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setIsProjectSubmenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  const handleTogglePin = () => {
    if (activeSession) {
      updateSession(activeSession.id, { isPinned: !activeSession.isPinned });
    }
    setIsMenuOpen(false);
  };

  const handleAssignProject = async (projectId: string) => {
    if (!activeSession || !user) return;
    
    const accessToken = user.id; // Simplified - in production use actual access token
    
    // Check if already assigned to this project
    const currentProject = projects.find(p => p.sessionIds.includes(activeSession.id));
    
    if (currentProject?.id === projectId) {
      // Remove from project if clicking the same one
      await removeSession(projectId, activeSession.id, accessToken);
    } else {
      // Remove from old project if any
      if (currentProject) {
        await removeSession(currentProject.id, activeSession.id, accessToken);
      }
      // Assign to new project
      await assignSession(projectId, activeSession.id, accessToken);
    }
    
    setIsProjectSubmenuOpen(false);
    setIsMenuOpen(false);
  };

  const handleDeleteChat = () => {
    if (activeSession) {
      deleteSession(activeSession.id);
    }
    setIsMenuOpen(false);
  };

  return (
    <header
      className="navbar-container"
      style={{
        height: '48px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-main)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--studio-header-pad-x, 16px)',
        zIndex: 50,
      }}
    >
      {/* Left: Burger Menu (Drawer on < 1024px & Desktop Expand) + Current Route Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', minWidth: 0, flexShrink: 1 }}>
        {/* Burger Button on Mobile & Tablet (< 1024px) */}
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="show-on-drawer"
            style={{
              display: 'none',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-label="Toggle navigation drawer"
          >
            <Menu size={18} />
          </button>
        )}

        {/* Desktop Expand Sidebar Button (when collapsed on >= 1024px) */}
        {isDesktopSidebarCollapsed && onToggleDesktopSidebar && (
          <button
            onClick={onToggleDesktopSidebar}
            className="hide-on-drawer"
            title="Expand sidebar"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen size={18} />
          </button>
        )}

        {/* Page / Session Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span
            style={{
              fontSize: '13.5px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '300px',
            }}
          >
            {pathname === '/imagine'
              ? t.nav.imagine
              : pathname === '/automations'
              ? (activeWorkflowTitle ? `${t.nav.automations} / ${activeWorkflowTitle}` : t.nav.automations)
              : pathname === '/pdf-tools'
              ? t.nav.pdfTools
              : pathname === '/settings'
              ? t.nav.settings
              : activeSession?.title || 'Anticeil'}
          </span>
          {activeSession?.isPinned && pathname === '/chat' && (
            <Pin size={12} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
          )}
        </div>
      </div>

      {/* Right: Build Mode Toggle (only /chat) & Action Menu (All Pages) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {/* Build Mode Quick Toggle Button — only on /chat */}
        {pathname === '/chat' && (
          <button
            type="button"
            onClick={toggleBuild}
            title={t.buildMode.title}
            className="clickable-pill"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              background: isBuildOpen ? 'var(--brand-subtle, rgba(0, 115, 234, 0.15))' : 'transparent',
              border: isBuildOpen ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: isBuildOpen ? 'var(--brand-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '12.5px',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
          >
            <Zap size={14} color={isBuildOpen ? 'var(--brand-primary)' : 'currentColor'} />
            <span className="hide-on-mobile">{t.buildMode.title}</span>
          </button>
        )}

        {/* Feature-Aware Context Action Dropdown (...) */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Actions"
            className="clickable-pill"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              background: isMenuOpen ? 'var(--bg-subtle)' : 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <MoreVertical size={16} />
          </button>

          {/* Context Menu: Content Adapts to Active Feature */}
          {isMenuOpen && (
            <div
              className="animate-fade-in"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: '210px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-lg, 12px)',
                boxShadow: 'var(--shadow-lg, 0 10px 25px rgba(0,0,0,0.2))',
                padding: '5px',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              {/* 1. Pin / Lepas Pin (Available across all features) */}
              <button
                type="button"
                onClick={handleTogglePin}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md, 6px)',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Pin size={15} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                <span>
                  {activeSession?.isPinned
                    ? language === 'id' ? 'Lepas Pin' : 'Unpin'
                    : language === 'id' ? 'Pin' : 'Pin'}
                </span>
              </button>

              {/* 2. Tambah ke Proyek (Available across all features) */}
              <div
                style={{ position: 'relative' }}
                onMouseEnter={() => setIsProjectSubmenuOpen(true)}
                onMouseLeave={() => setIsProjectSubmenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setIsProjectSubmenuOpen(!isProjectSubmenuOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md, 6px)',
                    border: 'none',
                    background: isProjectSubmenuOpen ? 'var(--bg-subtle)' : 'transparent',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Folder size={15} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                    <span>{language === 'id' ? 'Tambah ke Proyek' : 'Tambah ke Proyek'}</span>
                  </div>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </button>

                {/* Submenu for Projects */}
                {isProjectSubmenuOpen && (
                  <div
                    className="animate-fade-in"
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 'calc(100% + 4px)',
                      width: '180px',
                      maxHeight: '300px',
                      overflowY: 'auto',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: 'var(--radius-md, 8px)',
                      boxShadow: 'var(--shadow-lg)',
                      padding: '4px',
                      zIndex: 10000,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    {projects.length === 0 ? (
                      <div style={{ padding: '8px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                        {language === 'id' ? 'Belum ada proyek' : 'No projects yet'}
                      </div>
                    ) : (
                      projects.map((proj) => {
                        const isCurrent = proj.sessionIds.includes(activeSession?.id ?? '');
                        return (
                          <button
                            key={proj.id}
                            type="button"
                            onClick={() => handleAssignProject(proj.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 8px',
                              borderRadius: '4px',
                              border: 'none',
                              background: isCurrent ? 'var(--bg-subtle)' : 'transparent',
                              color: 'var(--text-primary)',
                              fontSize: '12px',
                              cursor: 'pointer',
                              textAlign: 'left',
                              width: '100%',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isCurrent ? 'var(--bg-subtle)' : 'transparent')}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proj.name}</span>
                            {isCurrent && <Check size={12} color="var(--brand-primary)" style={{ flexShrink: 0, marginLeft: '4px' }} />}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '3px 0' }} />

              {/* 2. Feature-Aware Delete / Clear Action */}
              <button
                type="button"
                onClick={() => {
                  if (pathname === '/chat') {
                    handleDeleteChat();
                  } else {
                    setIsMenuOpen(false);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md, 6px)',
                  border: 'none',
                  background: 'transparent',
                  color: '#EF4444',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Trash2 size={15} color="#EF4444" style={{ flexShrink: 0 }} />
                <span>
                  {pathname === '/chat'
                    ? language === 'id' ? 'Hapus Obrolan' : 'Delete Chat'
                    : pathname === '/imagine'
                    ? language === 'id' ? 'Hapus Gambar' : 'Delete Images'
                    : pathname === '/automations'
                    ? language === 'id' ? 'Hapus Alur Kerja' : 'Delete Workflows'
                    : pathname === '/pdf-tools'
                    ? language === 'id' ? 'Hapus Dokumen' : 'Delete Documents'
                    : language === 'id' ? 'Reset Halaman' : 'Reset Page'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
