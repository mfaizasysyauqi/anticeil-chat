import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Play, ChevronDown, RefreshCw, Check } from 'lucide-react';
import {
  recompileBtnStyle,
  recompileDropdownArrowStyle,
  popoverItemStyle,
} from '../../styles/editorSharedStyles';

export interface RecompileSplitButtonProps {
  isCompiling: boolean;
  isAutoCompile: boolean;
  onRecompile: () => void;
  onToggleAutoCompile: (enabled: boolean) => void;
  onResetRecompile?: () => void;
  extraItems?: (close: () => void) => React.ReactNode;
  label?: string;
  title?: string;
}

/**
 * Standardized Overleaf-style green (#00843D) Recompile Split Button with
 * dropdown options for auto-compile toggling.
 */
export function RecompileSplitButton({
  isCompiling,
  isAutoCompile,
  onRecompile,
  onToggleAutoCompile,
  onResetRecompile,
  extraItems,
  label = 'Recompile',
  title = 'Recompile (Ctrl+Enter)',
}: RecompileSplitButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const arrowButtonRef = useRef<HTMLButtonElement>(null);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
    } else if (arrowButtonRef.current) {
      const rect = arrowButtonRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: Math.max(10, rect.left - 120) });
      setIsOpen(true);
    }
  };

  useEffect(() => {
    const handleOutside = () => setIsOpen(false);
    window.addEventListener('click', handleOutside);
    window.addEventListener('mousedown', handleOutside);
    return () => {
      window.removeEventListener('click', handleOutside);
      window.removeEventListener('mousedown', handleOutside);
    };
  }, []);

  return (
    <>
      <div style={{ display: 'inline-flex', alignItems: 'stretch', flexShrink: 0 }}>
        {/* Main compile button */}
        <button
          type="button"
          onClick={onRecompile}
          disabled={isCompiling}
          title={title}
          style={{
            ...recompileBtnStyle,
            opacity: isCompiling ? 0.8 : 1,
          }}
        >
          {isCompiling ? (
            <RefreshCw size={11} className="spin-slow" />
          ) : (
            <Play size={11} fill="#ffffff" color="#ffffff" />
          )}
          <span>{label}</span>
        </button>

        {/* Dropdown arrow toggle */}
        <button
          ref={arrowButtonRef}
          type="button"
          onClick={toggleDropdown}
          title="Compilation options"
          style={recompileDropdownArrowStyle}
        >
          <ChevronDown size={10} />
        </button>
      </div>

      {/* Dropdown Portal */}
      {isOpen &&
        dropdownPos &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: `${dropdownPos.top}px`,
              left: `${dropdownPos.left}px`,
              zIndex: 999999999,
              minWidth: '220px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '7px',
              boxShadow: 'var(--shadow-xl, 0 12px 30px rgba(0,0,0,0.25))',
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                padding: '4px 8px',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: '2px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Compile Mode
            </div>
            <button
              type="button"
              onClick={() => {
                onToggleAutoCompile(!isAutoCompile);
                setIsOpen(false);
              }}
              style={popoverItemStyle}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isAutoCompile && <Check size={13} color="var(--brand-primary)" />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Auto-compile on change
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Compiles automatically as you type
                </span>
              </div>
            </button>
            {onResetRecompile && (
              <>
                <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />
                <button
                  type="button"
                  onClick={() => {
                    onResetRecompile();
                    setIsOpen(false);
                  }}
                  style={{
                    ...popoverItemStyle,
                    color: 'var(--brand-primary)',
                    fontWeight: 600,
                  }}
                >
                  <RefreshCw size={13} color="var(--brand-primary)" />
                  <span>Kompilasi dari awal (Reset)</span>
                </button>
              </>
            )}
            {extraItems && (
              <>
                <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />
                {extraItems(() => setIsOpen(false))}
              </>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
