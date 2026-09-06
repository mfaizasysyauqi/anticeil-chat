'use client';

import React from 'react';
import { DrawerPanelHeader } from './DrawerPanelHeader';
import { ProfileBar } from './ProfileBar';

export interface DrawerPanelProps {
  title?: string;
  titleStyle?: 'primary' | 'label';
  onClose?: () => void;
  onCollapse?: () => void;
  collapseLabel?: string;
  showProfileBar?: boolean;
  headerSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function DrawerPanel({
  title,
  titleStyle = 'label',
  onClose,
  onCollapse,
  collapseLabel,
  showProfileBar = true,
  headerSlot,
  footerSlot,
  children,
  className = '',
  style,
}: DrawerPanelProps) {
  return (
    <div
      className={`sidebar-workspace-panel ${className}`.trim()}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-sidebar)',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        ...style,
      }}
    >
      {/* Header Slot or Default Header */}
      {headerSlot !== undefined ? (
        headerSlot
      ) : title ? (
        <DrawerPanelHeader
          title={title}
          titleStyle={titleStyle}
          onClose={onClose}
          onCollapse={onCollapse}
          collapseLabel={collapseLabel}
        />
      ) : null}

      {/* Scrollable Content Body */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          minHeight: 0,
        }}
      >
        {children}
      </div>

      {/* Footer Slot or Default ProfileBar */}
      {footerSlot !== undefined ? footerSlot : showProfileBar ? <ProfileBar /> : null}
    </div>
  );
}
