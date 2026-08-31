'use client';

import React, { useEffect, useRef, useState } from 'react';
import '@univerjs/design/lib/index.css';
import '@univerjs/ui/lib/index.css';
import '@univerjs/docs-ui/lib/index.css';
import '@univerjs/sheets-ui/lib/index.css';

import { Univer, UniverInstanceType, LocaleType, mergeLocales } from '@univerjs/core';
import { UniverRenderEnginePlugin } from '@univerjs/engine-render';
import { UniverFormulaEnginePlugin } from '@univerjs/engine-formula';
import { UniverUIPlugin } from '@univerjs/ui';
import { UniverDocsPlugin } from '@univerjs/docs';
import { UniverDocsUIPlugin } from '@univerjs/docs-ui';
import { UniverSheetsPlugin } from '@univerjs/sheets';
import { UniverSheetsUIPlugin } from '@univerjs/sheets-ui';
import { UniverSheetsFormulaPlugin } from '@univerjs/sheets-formula';

// @ts-ignore
import DesignEnUS from '@univerjs/design/lib/locale/en-US.js';
// @ts-ignore
import UIEnUS from '@univerjs/ui/lib/locale/en-US.js';
// @ts-ignore
import DocsUIEnUS from '@univerjs/docs-ui/lib/locale/en-US.js';
// @ts-ignore
import SheetsUIEnUS from '@univerjs/sheets-ui/lib/locale/en-US.js';

interface UniverSheetsCoreProps {
  initialContent: string;
  onContentChange?: (md: string) => void;
}

export default function UniverSheetsCore({
  initialContent,
  onContentChange,
}: UniverSheetsCoreProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const univerRef = useRef<Univer | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      console.warn('[UniverSheetsCore] containerRef is null, skipping init');
      return;
    }

    // Create a dedicated inner container for this instance to prevent StrictMode race conditions
    const wrapper = document.createElement('div');
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.style.position = 'relative';
    wrapper.style.overflow = 'hidden';
    containerRef.current.appendChild(wrapper);

    let isCancelled = false;
    let univerInstance: Univer | null = null;

    // Parse existing markdown table content into Univer cell data
    const cellData: Record<number, Record<number, { v: string | number; t?: number }>> = {};
    if (initialContent) {
      const lines = initialContent.trim().split('\n');
      let rowIdx = 0;
      for (const line of lines) {
        if (line.includes('|')) {
          const parts = line
            .split('|')
            .map((p) => p.trim())
            .filter((p) => p.length > 0 && !p.match(/^:?-+:?$/));
          if (parts.length > 0) {
            cellData[rowIdx] = {};
            parts.forEach((val, colIdx) => {
              const num = parseFloat(val);
              cellData[rowIdx][colIdx] = {
                v: isNaN(num) ? val : num,
                t: isNaN(num) ? 1 : 2,
              };
            });
            rowIdx++;
          }
        }
      }
    }

    const defaultCellData = {
      0: {
        0: { v: 'Kategori', t: 1 },
        1: { v: 'Target (Q1)', t: 1 },
        2: { v: 'Realisasi', t: 1 },
        3: { v: 'Pertumbuhan', t: 1 },
      },
      1: {
        0: { v: 'Pendapatan', t: 1 },
        1: { v: 1000000, t: 2 },
        2: { v: 1250000, t: 2 },
        3: { v: '=C2/B2-1', t: 1 },
      },
      2: {
        0: { v: 'Biaya Operasional', t: 1 },
        1: { v: 400000, t: 2 },
        2: { v: 380000, t: 2 },
        3: { v: '=C3/B3-1', t: 1 },
      },
      3: {
        0: { v: 'Laba Bersih', t: 1 },
        1: { v: '=B2-B3', t: 1 },
        2: { v: '=C2-C3', t: 1 },
        3: { v: '=C4/B4-1', t: 1 },
      },
    };

    try {
      // Merge all enUS dictionaries properly
      const mergedEnUS = mergeLocales(
        DesignEnUS?.default || DesignEnUS || {},
        UIEnUS?.default || UIEnUS || {},
        DocsUIEnUS?.default || DocsUIEnUS || {},
        SheetsUIEnUS?.default || SheetsUIEnUS || {}
      );

      const univer = new Univer({
        locale: LocaleType.EN_US,
        locales: {
          [LocaleType.EN_US]: mergedEnUS,
        },
      });

      // Register all core engines & UI plugins
      univer.registerPlugin(UniverRenderEnginePlugin);
      univer.registerPlugin(UniverFormulaEnginePlugin);
      univer.registerPlugin(UniverUIPlugin, {
        container: wrapper,
        header: true,
        toolbar: true,
        ribbonType: 'simple',
        footer: true,
        contextMenu: true,
      });
      univer.registerPlugin(UniverDocsPlugin, {
        hasScroll: false,
      });
      univer.registerPlugin(UniverDocsUIPlugin);
      univer.registerPlugin(UniverSheetsPlugin, {
        notExecuteFormula: false,
      });
      univer.registerPlugin(UniverSheetsUIPlugin, {
        disableEdit: false,
      });
      univer.registerPlugin(UniverSheetsFormulaPlugin);

      // Create workbook unit
      univer.createUnit(UniverInstanceType.UNIVER_SHEET, {
        id: 'anticeil-sheet-' + Date.now(),
        appVersion: '3.0.0-alpha',
        locale: 'enUS',
        name: 'Anticeil Sheets',
        sheetOrder: ['sheet1'],
        sheets: {
          sheet1: {
            id: 'sheet1',
            name: 'Sheet1',
            tabColor: '#0073ea',
            hidden: 0,
            rowCount: 100,
            columnCount: 26,
            defaultColumnWidth: 130,
            defaultRowHeight: 28,
            mergeData: [],
            cellData: Object.keys(cellData).length > 0 ? cellData : defaultCellData,
            showGridLines: 1,
            rowData: {},
            columnData: {},
          },
        },
        styles: {},
        resources: [],
      });

      if (!isCancelled) {
        univerInstance = univer;
        univerRef.current = univer;
        console.log('[UniverSheetsCore] ✅ Univer initialized and mounted in wrapper');
      } else {
        setTimeout(() => {
          try {
            univer.dispose();
          } catch {}
          if (wrapper.parentNode) {
            wrapper.parentNode.removeChild(wrapper);
          }
        }, 0);
      }
    } catch (err: any) {
      console.error('[UniverSheetsCore] Error initializing local Univer instance:', err);
      if (!isCancelled) {
        setInitError(err?.message || String(err));
      }
    }

    return () => {
      isCancelled = true;
      const targetUniver = univerInstance;
      setTimeout(() => {
        try {
          targetUniver?.dispose();
        } catch (e) {
          console.warn('[UniverSheetsCore] Error during async dispose:', e);
        }
        if (wrapper.parentNode) {
          wrapper.parentNode.removeChild(wrapper);
        }
      }, 0);
    };
  }, []);

  if (initError) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          color: 'var(--text-muted)',
          padding: '24px',
        }}
      >
        <span style={{ fontSize: '28px' }}>⚠️</span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Gagal menginisialisasi Anticeil Sheets
        </span>
        <code style={{ fontSize: '11px', color: '#ef4444', backgroundColor: 'var(--bg-subtle)', padding: '6px 12px', borderRadius: '6px' }}>
          {initError}
        </code>
      </div>
    );
  }

  return (
    <div
      id="anticeil-univer-sheet-container"
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    />
  );
}
