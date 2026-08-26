'use client';

import React, { memo, useState } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { StickyNote, Trash2 } from 'lucide-react';

export interface StickyNoteData {
  title?: string;
  content?: string;
  color?: 'yellow' | 'blue' | 'green' | 'purple' | 'pink';
}

const COLOR_MAP = {
  yellow: {
    bg: '#FEF3C7',
    border: '#F59E0B',
    text: '#78350F',
    subtext: '#92400E',
  },
  blue: {
    bg: '#DBEAFE',
    border: '#3B82F6',
    text: '#1E3A8A',
    subtext: '#1E40AF',
  },
  green: {
    bg: '#D1FAE5',
    border: '#10B981',
    text: '#064E3B',
    subtext: '#065F46',
  },
  purple: {
    bg: '#F3E8FF',
    border: '#A855F7',
    text: '#581C87',
    subtext: '#6B21A8',
  },
  pink: {
    bg: '#FCE7F3',
    border: '#EC4899',
    text: '#831843',
    subtext: '#9D174D',
  },
};

export const StickyNoteNode = memo(({ data, selected }: NodeProps) => {
  const noteData = (data as unknown as StickyNoteData) || {};
  const [content, setContent] = useState(noteData.content || 'Tambahkan catatan alur kerja di sini...');
  const [title, setTitle] = useState(noteData.title || 'Catatan');
  const colorScheme = COLOR_MAP[noteData.color || 'yellow'];

  return (
    <div
      style={{
        minWidth: '220px',
        minHeight: '140px',
        width: '100%',
        height: '100%',
        backgroundColor: colorScheme.bg,
        border: `1.5px solid ${selected ? '#0073EA' : colorScheme.border}`,
        borderRadius: '12px',
        padding: '12px 14px',
        boxShadow: selected
          ? '0 0 0 2px #0073EA, 0 8px 24px rgba(0,0,0,0.15)'
          : '0 4px 14px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid rgba(0,0,0,0.08)`, paddingBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <StickyNote size={14} color={colorScheme.text} />
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              data.title = e.target.value;
            }}
            placeholder="Judul catatan..."
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '12.5px',
              fontWeight: 700,
              color: colorScheme.text,
              width: '130px',
            }}
          />
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          data.content = e.target.value;
        }}
        placeholder="Tulis instruksi atau catatan alur..."
        style={{
          flex: 1,
          width: '100%',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'none',
          fontSize: '12px',
          lineHeight: 1.5,
          color: colorScheme.subtext,
          fontFamily: 'inherit',
        }}
      />
    </div>
  );
});

StickyNoteNode.displayName = 'StickyNoteNode';
