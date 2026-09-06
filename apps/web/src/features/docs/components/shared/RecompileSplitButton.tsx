'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RefreshCw, ChevronDown, Check } from 'lucide-react';
import {
  recompileBtnStyle,
  recompileDropdownArrowStyle,
} from '../../styles/editorSharedStyles';
import { useSettingsStore } from '../../../settings/store/useSettingsStore';

export interface RecompileSplitButtonProps {
  /** Whether a compile is currently running (shows spinner + enables Stop) */
  isCompiling: boolean;
  /** Whether auto-compile on change is enabled */
  isAutoCompile: boolean;
  onRecompile: () => void;
  onToggleAutoCompile: (enabled: boolean) => void;
  /** Optional: recompile from scratch action */
  onResetRecompile?: () => void;
  /** Optional: stop a running compilation */
  onStopCompilation?: () => void;
  /** Full compile settings — when provided, shows the complete Overleaf-identical dropdown */
  compileMode?: 'normal' | 'draft';
  onChangeCompileMode?: (mode: 'normal' | 'draft') => void;
  syntaxCheckMode?: 'check' | 'none';
  onChangeSyntaxCheck?: (mode: 'check' | 'none') => void;
  errorHandlingMode?: 'stop' | 'continue';
  onChangeErrorHandling?: (mode: 'stop' | 'continue') => void;
  /** Extra items rendered at the bottom of the dropdown */
  extraItems?: (close: () => void) => React.ReactNode;
  label?: string;
  title?: string;
}

/**
 * Overleaf-style green Recompile Split Button.
 * With just isAutoCompile it renders a compact menu.
 * Pass the full compile setting props for the complete Overleaf-identical dropdown
 * (Auto compile · Compile mode · Syntax checks · Error handling · Stop / Recompile from scratch).
 */
export function RecompileSplitButton({
  isCompiling,
  isAutoCompile,
  onRecompile,
  onToggleAutoCompile,
  onResetRecompile,
  onStopCompilation,
  compileMode,
  onChangeCompileMode,
  syntaxCheckMode,
  onChangeSyntaxCheck,
  errorHandlingMode,
  onChangeErrorHandling,
  extraItems,
  label,
  title,
}: RecompileSplitButtonProps) {
  const language = useSettingsStore((s) => s.language);
  const resolvedLabel = label ?? (language === 'id' ? 'Kompilasi' : 'Recompile');
  const resolvedTitle = title ?? (language === 'id' ? 'Kompilasi Ulang (Ctrl+Enter)' : 'Recompile (Ctrl+Enter)');

  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const arrowButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasFullSettings = !!(onChangeCompileMode || onChangeSyntaxCheck || onChangeErrorHandling);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
    } else if (arrowButtonRef.current) {
      const rect = arrowButtonRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
      setIsOpen(true);
    }
  };

  const close = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        arrowButtonRef.current && !arrowButtonRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 14px',
    cursor: 'pointer',
    fontSize: '12.5px',
    color: 'var(--text-primary)',
  };

  const sectionLabelStyle: React.CSSProperties = {
    padding: '4px 14px 2px 14px',
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--text-muted)',
    userSelect: 'none',
  };

  const dividerStyle: React.CSSProperties = {
    height: '1px',
    backgroundColor: 'var(--border-subtle)',
    margin: '4px 0',
  };

  return (
    <>
      <div style={{ display: 'inline-flex', alignItems: 'stretch', flexShrink: 0 }}>
        {/* Main compile button */}
        <button
          type="button"
          onClick={onRecompile}
          disabled={isCompiling}
          title={resolvedTitle}
          style={{
            ...recompileBtnStyle,
            opacity: isCompiling ? 0.8 : 1,
          }}
        >
          <RefreshCw
            size={11}
            style={{ animation: isCompiling ? 'spin 0.5s linear infinite' : 'none' }}
          />
          <span>{resolvedLabel}</span>
        </button>

        {/* Dropdown arrow */}
        <button
          ref={arrowButtonRef}
          type="button"
          onClick={toggleDropdown}
          title={language === 'id' ? 'Opsi kompilasi' : 'Compilation options'}
          style={{
            ...recompileDropdownArrowStyle,
          }}
        >
          <ChevronDown
            size={10}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s',
            }}
          />
        </button>
      </div>

      {/* Dropdown portal */}
      {isOpen && dropdownPos && typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={dropdownRef}
            onClick={(e) => e.stopPropagation()}
            className="animate-fade-in"
            style={{
              position: 'fixed',
              top: `${dropdownPos.top}px`,
              left: `${dropdownPos.left}px`,
              zIndex: 999999999,
              minWidth: '240px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: '6px',
              boxShadow: 'var(--shadow-xl, 0 12px 32px rgba(0,0,0,0.35))',
              padding: '6px 0',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* ── Auto compile ── */}
            <div style={sectionLabelStyle}>Auto compile</div>
            <div
              className="hover-subtle"
              style={itemStyle}
              onClick={() => {
                onToggleAutoCompile(true);
                close();
              }}
            >
              <span>On</span>
              {isAutoCompile && <Check size={14} strokeWidth={2.4} color="var(--brand-primary)" />}
            </div>
            <div
              className="hover-subtle"
              style={itemStyle}
              onClick={() => {
                onToggleAutoCompile(false);
                close();
              }}
            >
              <span>Off</span>
              {!isAutoCompile && <Check size={14} strokeWidth={2.4} color="var(--brand-primary)" />}
            </div>

            {/* ── Full settings (Docs / tex / typ) ── */}
            {hasFullSettings && (
              <>
                <div style={dividerStyle} />

                {/* Compile mode */}
                {onChangeCompileMode && (
                  <>
                    <div style={sectionLabelStyle}>Compile mode</div>
                    <div
                      className="hover-subtle"
                      style={itemStyle}
                      onClick={() => { onChangeCompileMode('normal'); close(); }}
                    >
                      <span>Normal</span>
                      {compileMode === 'normal' && <Check size={14} strokeWidth={2.4} color="var(--brand-primary)" />}
                    </div>
                    <div
                      className="hover-subtle"
                      style={itemStyle}
                      onClick={() => { onChangeCompileMode('draft'); close(); }}
                    >
                      <span>Fast [draft]</span>
                      {compileMode === 'draft' && <Check size={14} strokeWidth={2.4} color="var(--brand-primary)" />}
                    </div>
                  </>
                )}

                {/* Syntax checks */}
                {onChangeSyntaxCheck && (
                  <>
                    <div style={dividerStyle} />
                    <div style={sectionLabelStyle}>Syntax checks</div>
                    <div
                      className="hover-subtle"
                      style={itemStyle}
                      onClick={() => { onChangeSyntaxCheck('check'); close(); }}
                    >
                      <span>Check syntax before compile</span>
                      {syntaxCheckMode === 'check' && <Check size={14} strokeWidth={2.4} color="var(--brand-primary)" />}
                    </div>
                    <div
                      className="hover-subtle"
                      style={itemStyle}
                      onClick={() => { onChangeSyntaxCheck('none'); close(); }}
                    >
                      <span>Don&apos;t check syntax</span>
                      {syntaxCheckMode === 'none' && <Check size={14} strokeWidth={2.4} color="var(--brand-primary)" />}
                    </div>
                  </>
                )}

                {/* Compile error handling */}
                {onChangeErrorHandling && (
                  <>
                    <div style={dividerStyle} />
                    <div style={sectionLabelStyle}>Compile error handling</div>
                    <div
                      className="hover-subtle"
                      style={itemStyle}
                      onClick={() => { onChangeErrorHandling('stop'); close(); }}
                    >
                      <span>Stop on first error</span>
                      {errorHandlingMode === 'stop' && <Check size={14} strokeWidth={2.4} color="var(--brand-primary)" />}
                    </div>
                    <div
                      className="hover-subtle"
                      style={itemStyle}
                      onClick={() => { onChangeErrorHandling('continue'); close(); }}
                    >
                      <span>Try to compile despite errors</span>
                      {errorHandlingMode === 'continue' && <Check size={14} strokeWidth={2.4} color="var(--brand-primary)" />}
                    </div>
                  </>
                )}

                <div style={dividerStyle} />

                {/* Stop compilation */}
                <div
                  className={isCompiling ? 'hover-subtle' : ''}
                  style={{
                    ...itemStyle,
                    justifyContent: 'flex-start',
                    color: isCompiling ? '#EF4444' : 'var(--text-muted)',
                    cursor: isCompiling ? 'pointer' : 'default',
                    opacity: isCompiling ? 1 : 0.6,
                  }}
                  onClick={() => {
                    if (isCompiling) {
                      onStopCompilation?.();
                      close();
                    }
                  }}
                >
                  Stop compilation
                </div>

                {/* Recompile from scratch */}
                <div
                  className="hover-subtle"
                  style={{ ...itemStyle, justifyContent: 'flex-start', color: '#0073ea', fontWeight: 500 }}
                  onClick={() => {
                    onResetRecompile?.() ?? onRecompile();
                    close();
                  }}
                >
                  Recompile from scratch
                </div>
              </>
            )}

            {/* Simple mode: just reset item */}
            {!hasFullSettings && onResetRecompile && (
              <>
                <div style={dividerStyle} />
                <div
                  className="hover-subtle"
                  style={{ ...itemStyle, color: 'var(--brand-primary)', fontWeight: 600, justifyContent: 'flex-start', gap: '6px' }}
                  onClick={() => { onResetRecompile(); close(); }}
                >
                  <RefreshCw size={13} color="var(--brand-primary)" />
                  <span>{language === 'id' ? 'Kompilasi dari awal (Reset)' : 'Recompile from scratch (Reset)'}</span>
                </div>
              </>
            )}

            {/* Extra injected items */}
            {extraItems && (
              <>
                <div style={dividerStyle} />
                {extraItems(close)}
              </>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
