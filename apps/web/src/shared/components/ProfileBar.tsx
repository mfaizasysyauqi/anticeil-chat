'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MoreHorizontal,
  KeyRound,
  Palette,
  Database,
  Zap,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../features/auth/store/useAuthStore';
import { useSettingsStore } from '../../features/settings/store/useSettingsStore';
import { useCreditStore } from '../../features/credits/store/useCreditStore';
import { getTierStorageName, getTierBadgeStyle } from '@anticeil/core';

export interface ProfileBarProps {
  className?: string;
  style?: React.CSSProperties;
  onProfileMenuToggle?: (isOpen: boolean) => void;
}

export function ProfileBar({ className = '', style, onProfileMenuToggle }: ProfileBarProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const user = useAuthStore((s) => s.user);
  const tier = useAuthStore((s) => s.tier);
  const signOut = useAuthStore((s) => s.signOut);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  const language = useSettingsStore((s) => s.language);
  const openSettingsTab = useSettingsStore((s) => s.openSettingsTab);
  const openPricingModal = useCreditStore((s) => s.openPricingModal);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Pengguna';
  const displayEmail = user?.email || (language === 'id' ? 'Tersimpan Lokal' : 'Local Storage');
  const avatarUrl = user?.user_metadata?.avatar_url || '';

  const handleToggleMenu = (openState?: boolean) => {
    const nextState = openState !== undefined ? openState : !isProfileMenuOpen;
    setIsProfileMenuOpen(nextState);
    if (onProfileMenuToggle) onProfileMenuToggle(nextState);
  };

  // Close popup menu on click outside
  useEffect(() => {
    if (!isProfileMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        handleToggleMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileMenuOpen]);

  return (
    <div
      ref={profileMenuRef}
      className={`profile-bar-container ${className}`.trim()}
      style={{
        position: 'relative',
        width: '100%',
        padding: '8px 10px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-sidebar)',
        ...style,
      }}
    >
      {/* Profile Popup Menu */}
      {isProfileMenuOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '8px',
            right: '8px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg, 12px)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
            padding: '6px',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {/* User Header */}
          <div style={{ padding: '8px 10px 6px 10px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '3px' }}>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayEmail}
            </div>
          </div>

          {/* Settings Section Label */}
          <div style={{ padding: '6px 10px 3px', fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {language === 'id' ? 'Pengaturan' : 'Settings'}
          </div>

          {/* API Keys */}
          <button
            type="button"
            onClick={() => {
              handleToggleMenu(false);
              if (!user) {
                openAuthModal('login');
              } else {
                openSettingsTab('keys');
              }
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', borderRadius: 'var(--radius-md, 6px)', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'background 0.15s ease' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <KeyRound size={14} color="var(--text-secondary)" />
            <span>{language === 'id' ? 'Kunci API (BYOK)' : 'API Keys (BYOK)'}</span>
          </button>

          {/* Appearance */}
          <button
            type="button"
            onClick={() => { openSettingsTab('appearance'); handleToggleMenu(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', borderRadius: 'var(--radius-md, 6px)', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'background 0.15s ease' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Palette size={14} color="var(--text-secondary)" />
            <span>{language === 'id' ? 'Tampilan & Bahasa' : 'Appearance & Language'}</span>
          </button>

          {/* Database */}
          <button
            type="button"
            onClick={() => { openSettingsTab('backup'); handleToggleMenu(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', borderRadius: 'var(--radius-md, 6px)', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'background 0.15s ease' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Database size={14} color="var(--text-secondary)" />
            <span>{language === 'id' ? 'Database & Cadangan' : 'Database & Backup'}</span>
          </button>

          {/* Divider */}
          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '3px 0' }} />

          {/* Upgrade Plan */}
          <button
            type="button"
            onClick={() => { openPricingModal('tiers'); handleToggleMenu(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', borderRadius: 'var(--radius-md, 6px)', border: 'none', background: 'transparent', color: 'var(--brand-primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'background 0.15s ease' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,115,234,0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Zap size={14} color="var(--brand-primary)" />
            <span>{language === 'id' ? 'Tingkatkan Paket' : 'Upgrade Plan'}</span>
          </button>

          {/* Divider */}
          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '3px 0' }} />

          {/* Logout / Login */}
          {user ? (
            <button
              type="button"
              onClick={() => { signOut(); handleToggleMenu(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', borderRadius: 'var(--radius-md, 6px)', border: 'none', background: 'transparent', color: 'var(--accent-danger)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', width: '100%', textAlign: 'left' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <LogOut size={14} />
              <span>{language === 'id' ? 'Keluar' : 'Log Out'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                handleToggleMenu(false);
                openAuthModal('login');
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', borderRadius: 'var(--radius-md, 6px)', border: 'none', background: 'transparent', color: 'var(--brand-primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', width: '100%', textAlign: 'left' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-subtle)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <LogOut size={14} />
              <span>{language === 'id' ? 'Masuk' : 'Log In'}</span>
            </button>
          )}
        </div>
      )}

      {/* Main Profile Bar Trigger Button */}
      <button
        type="button"
        onClick={() => handleToggleMenu()}
        className="clickable-pill"
        style={{
          width: '100%',
          minWidth: 0,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '6px 8px',
          borderRadius: 'var(--radius-md, 8px)',
          background: isProfileMenuOpen ? 'var(--bg-subtle)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background 0.15s ease',
        }}
      >
        {avatarUrl && !avatarImgError ? (
          <img
            src={avatarUrl}
            alt={displayName}
            referrerPolicy="no-referrer"
            onError={() => setAvatarImgError(true)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              objectFit: 'cover',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
            }}
          />
        ) : (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0073EA, #A25DDC)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12.5px',
              fontWeight: 700,
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(0, 115, 234, 0.3)',
            }}
          >
            {(displayName[0] || '?').toUpperCase()}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, width: '100%' }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                minWidth: 0,
              }}
            >
              {displayName}
            </span>
            {(() => {
              const badge = getTierBadgeStyle(tier);
              return (
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: '4px',
                    background: badge.background,
                    color: badge.color,
                    border: badge.border,
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {badge.label}
                </span>
              );
            })()}
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {getTierStorageName(tier, language as 'en' | 'id')}
          </div>
        </div>

        <MoreHorizontal size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
      </button>
    </div>
  );
}
