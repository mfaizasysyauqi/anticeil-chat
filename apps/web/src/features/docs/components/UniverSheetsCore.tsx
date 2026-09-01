'use client';

import React, { useEffect, useRef, useState } from 'react';
import '@univerjs/design/lib/index.css';
import '@univerjs/ui/lib/index.css';
import '@univerjs/docs-ui/lib/index.css';
import '@univerjs/sheets-ui/lib/index.css';

import {
  Univer,
  UniverInstanceType,
  LocaleType,
  mergeLocales,
  ICommandService,
  IUniverInstanceService,
  Workbook,
} from '@univerjs/core';
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
    if (!containerRef.current) return;

    // Create a dedicated wrapper div inside container
    const wrapper = document.createElement('div');
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.style.position = 'relative';
    wrapper.style.overflow = 'hidden';
    containerRef.current.appendChild(wrapper);

    let isCancelled = false;
    let univerInstance: Univer | null = null;
    let commandDisposable: { dispose: () => void } | null = null;

    // Parse existing markdown table content into Univer cell data
    const cellData: Record<number, Record<number, { v: string | number; t?: number; f?: string }>> = {};
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
              if (val.startsWith('=')) {
                cellData[rowIdx][colIdx] = {
                  v: val,
                  f: val,
                  t: 1,
                };
              } else {
                const num = parseFloat(val);
                cellData[rowIdx][colIdx] = {
                  v: isNaN(num) ? val : num,
                  t: isNaN(num) ? 1 : 2,
                };
              }
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
        3: { v: '=C2/B2-1', f: '=C2/B2-1', t: 1 },
      },
      2: {
        0: { v: 'Biaya Operasional', t: 1 },
        1: { v: 400000, t: 2 },
        2: { v: 380000, t: 2 },
        3: { v: '=C3/B3-1', f: '=C3/B3-1', t: 1 },
      },
      3: {
        0: { v: 'Laba Bersih', t: 1 },
        1: { v: '=B2-B3', f: '=B2-B3', t: 1 },
        2: { v: '=C2-C3', f: '=C2-C3', t: 1 },
        3: { v: '=C4/B4-1', f: '=C4/B4-1', t: 1 },
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

      // Register all core engines & UI plugins with full editing capabilities
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
      univer.registerPlugin(UniverDocsPlugin);
      univer.registerPlugin(UniverDocsUIPlugin);
      univer.registerPlugin(UniverSheetsPlugin);
      univer.registerPlugin(UniverSheetsUIPlugin);
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

        // Listen for spreadsheet edits and sync back to Markdown
        try {
          const injector = (univer as any).__getInjector?.() || (univer as any)._injector;
          if (injector) {
            const commandService = injector.get(ICommandService) as ICommandService;
            const instanceService = injector.get(IUniverInstanceService) as IUniverInstanceService;

            const syncToMarkdown = () => {
              try {
                const workbook = instanceService.getCurrentUnitOfType<Workbook>(UniverInstanceType.UNIVER_SHEET);
                if (!workbook) return;
                const worksheet = workbook.getActiveSheet();
                if (!worksheet) return;
                const matrix = worksheet.getCellMatrix();

                let maxRow = 0;
                let maxCol = 0;
                matrix.forValue((row: number, col: number, cell: any) => {
                  if (cell && (cell.v !== undefined && cell.v !== '')) {
                    if (row > maxRow) maxRow = row;
                    if (col > maxCol) maxCol = col;
                  }
                });

                if (maxRow === 0 && maxCol === 0 && !matrix.getValue(0, 0)) return;

                const rows: string[] = [];
                for (let r = 0; r <= maxRow; r++) {
                  const rowCells: string[] = [];
                  for (let c = 0; c <= Math.max(3, maxCol); c++) {
                    const cell = matrix.getValue(r, c);
                    const val = cell?.f || (cell?.v !== undefined ? String(cell.v) : '');
                    rowCells.push(val);
                  }
                  rows.push('| ' + rowCells.join(' | ') + ' |');
                  if (r === 0) {
                    rows.push('| ' + rowCells.map(() => '---').join(' | ') + ' |');
                  }
                }
                const markdown = rows.join('\n');
                onContentChange?.(markdown);
              } catch (e) {
                console.warn('[UniverSheetsCore] Error syncing matrix to markdown:', e);
              }
            };

            commandDisposable = commandService.onCommandExecuted((cmd) => {
              if (
                cmd.id.includes('set-range-values') ||
                cmd.id.includes('set-cell') ||
                cmd.id.includes('sheet.mutation')
              ) {
                syncToMarkdown();
              }
            });
          }
        } catch (syncErr) {
          console.warn('[UniverSheetsCore] Sync listener init warning:', syncErr);
        }

        console.log('[UniverSheetsCore] ✅ Univer initialized with full cell editing');
      } else {
        try {
          univer.dispose();
        } catch {}
        if (wrapper.parentNode) {
          wrapper.parentNode.removeChild(wrapper);
        }
      }
    } catch (err: any) {
      console.error('[UniverSheetsCore] Error initializing local Univer instance:', err);
      if (!isCancelled) {
        setInitError(err?.message || String(err));
      }
    }

    return () => {
      isCancelled = true;
      try {
        commandDisposable?.dispose();
        univerInstance?.dispose();
      } catch (e) {
        console.warn('[UniverSheetsCore] Error during dispose:', e);
      }
      if (wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
      }
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
