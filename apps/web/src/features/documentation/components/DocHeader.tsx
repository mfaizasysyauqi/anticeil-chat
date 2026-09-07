'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Sun, Moon, Search, Command, ArrowRight, Menu, X } from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

export interface DocHeaderProps {
  language: 'id' | 'en';
  onToggleMenu?: () => void;
  isMenuOpen?: boolean;
  onOpenSearch?: () => void;
}

export function DocHeader({ language, onToggleMenu, isMenuOpen, onOpenSearch }: DocHeaderProps) {
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isId = language === 'id';

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {onToggleMenu && (
            <button
              type="button"
              onClick={onToggleMenu}
              className="doc-mobile-toggle"
              style={{
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '6px',
                cursor: 'pointer',
                color: 'var(--text-primary)',
              }}
              aria-label="Toggle navigation menu"
            >
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}

          <Link
            href="/chat"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'var(--text-primary)' }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                background: 'linear-gradient(135deg, #0073EA 0%, #784BD1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <BookOpen size={15} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Anticeil
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--brand-primary)',
                  background: 'rgba(0, 115, 234, 0.12)',
                  padding: '2px 7px',
                  borderRadius: '999px',
                  textTransform: 'uppercase',
                }}
              >
                Docs
              </span>
            </div>
          </Link>

          <nav className="doc-header-nav" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '12px' }}>
            <Link href="/chat" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none' }}>
              {isId ? 'Workspace' : 'App'}
            </Link>
            <Link href="/docs" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none' }}>
              Docs Studio
            </Link>
            <Link href="/privacy" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none' }}>
              {isId ? 'Privasi' : 'Privacy'}
            </Link>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="doc-search-trigger"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '6px 12px',
                color: 'var(--text-muted)',
                fontSize: '13px',
                cursor: 'pointer',
                minWidth: '170px',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Search size={14} />
                <span>{isId ? 'Cari panduan...' : 'Search docs...'}</span>
              </div>
              <kbd
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                  padding: '1px 5px',
                  color: 'var(--text-secondary)',
                }}
              >
                <Command size={10} /> K
              </kbd>
            </button>
          )}

          <div style={{ display: 'flex', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', padding: '2px', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => setLanguage('id')}
              style={{
                padding: '4px 9px',
                borderRadius: '6px',
                border: 'none',
                background: isId ? 'var(--bg-surface)' : 'transparent',
                color: isId ? 'var(--brand-primary)' : 'var(--text-secondary)',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: isId ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              ID
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              style={{
                padding: '4px 9px',
                borderRadius: '6px',
                border: 'none',
                background: !isId ? 'var(--bg-surface)' : 'transparent',
                color: !isId ? 'var(--brand-primary)' : 'var(--text-secondary)',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: !isId ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              EN
            </button>
          </div>

          {mounted && (
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          )}

          <Link
            href="/chat"
            className="doc-launch-app-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'var(--brand-primary)',
              color: '#FFFFFF',
              fontSize: '12.5px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <span>{isId ? 'Ke Chat' : 'Open App'}</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 960px) {
          .doc-header-nav {
            display: none !important;
          }
          .doc-search-trigger {
            min-width: 130px !important;
          }
        }
        @media (max-width: 768px) {
          .doc-mobile-toggle {
            display: inline-flex !important;
          }
          .doc-search-trigger {
            display: none !important;
          }
          .doc-launch-app-btn {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}

