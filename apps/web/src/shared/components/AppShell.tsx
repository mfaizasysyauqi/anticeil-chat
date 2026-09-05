'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ModelSelectorModal } from '../../features/chat/components/ModelSelectorModal';
import { SettingsModal } from '../../features/settings/components/SettingsModal';
import { CreditLimitModal } from '../../features/credits/components/CreditLimitModal';
import { PricingModal } from '../../features/pricing/components/PricingModal';
import { AuthModal } from '../../features/auth/components/AuthModal';
import { CloudGracePeriodBanner } from '../../features/storage/components/CloudGracePeriodBanner';
import { useSettingsStore } from '../../features/settings/store/useSettingsStore';
import { useAuthStore } from '../../features/auth/store/useAuthStore';

interface AppShellProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

// Reads ?auth=login|register and opens the modal — must be inside Suspense for useSearchParams
function AuthQueryHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  useEffect(() => {
    const mode = searchParams?.get('auth');
    if (mode === 'login' || mode === 'register') {
      openAuthModal(mode);
      // Clean the query param from URL without re-navigating
      const clean = new URL(window.location.href);
      clean.searchParams.delete('auth');
      router.replace(clean.pathname + (clean.search !== '?' ? clean.search : ''));
    }
  }, [searchParams, openAuthModal, router]);

  return null;
}

export function AppShell({ children, showSidebar = true }: AppShellProps) {
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const theme = useSettingsStore((s) => s.theme);
  const isSettingsOpen = useSettingsStore((s) => s.isSettingsOpen);
  const setSettingsOpen = useSettingsStore((s) => s.setSettingsOpen);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);


  return (
    <div className="app-container">
      {/* Mobile & Tablet Backdrop Overlay (< 1024px) */}
      {showSidebar && (
        <div
          className={`sidebar-overlay ${isMobileSidebarOpen ? 'open' : ''}`}
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* ── Slim Icon Rail (48px, full height, far left) ── */}
      {showSidebar && (
        <Sidebar
          railOnly
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isDesktopCollapsed={isDesktopSidebarCollapsed}
          onToggleDesktopCollapse={() => {
            setIsDesktopSidebarCollapsed((prev) => !prev);
            setIsMobileSidebarOpen(false);
          }}
          onOpenModelSelector={() => setIsModelSelectorOpen(true)}
        />
      )}

      {/* ── Right Column: Navbar on top, then Drawer + Content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', minWidth: 0 }}>
        {/* App Bar spans full width of this column */}
        <Navbar
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          isDesktopSidebarCollapsed={isDesktopSidebarCollapsed}
          onToggleDesktopSidebar={() => {
            setIsDesktopSidebarCollapsed((prev) => !prev);
            setIsMobileSidebarOpen(false);
          }}
        />

        {/* Grace Period Alert for Expired Pro / Unmigrated Cloud Data */}
        <CloudGracePeriodBanner />

        {/* Workspace row: Drawer + Main Content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
          {/* Drawer panel (no rail) */}
          {showSidebar && (
            <Sidebar
              drawerOnly
              isOpenMobile={isMobileSidebarOpen}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
              isDesktopCollapsed={isDesktopSidebarCollapsed}
              onToggleDesktopCollapse={() => {
                setIsDesktopSidebarCollapsed((prev) => !prev);
                setIsMobileSidebarOpen(false);
              }}
              onOpenModelSelector={() => setIsModelSelectorOpen(true)}
            />
          )}

          {/* Main Content */}
          <div className="main-content" style={{ height: '100%' }}>
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
              {children}
            </div>
          </div>
        </div>
      </div>

      {isModelSelectorOpen && (
        <ModelSelectorModal onClose={() => setIsModelSelectorOpen(false)} />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <CreditLimitModal />
      <PricingModal />
      <AuthModal />
      <Suspense fallback={null}>
        <AuthQueryHandler />
      </Suspense>
    </div>
  );
}
