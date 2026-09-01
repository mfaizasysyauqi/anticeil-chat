'use client';

import React, { useMemo, useCallback, useRef } from 'react';
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

type SheetType = any;

interface FortuneSheetsCoreProps {
  initialContent: string;
  onContentChange?: (md: string) => void;
}

export default function FortuneSheetsCore({
  initialContent,
  onContentChange,
}: FortuneSheetsCoreProps) {
  const theme = useSettingsStore((s) => s.theme);
  const workbookRef = useRef<any>(null);

  // Parse markdown table into FortuneSheet celldata
  const initialSheets = useMemo<SheetType[]>(() => {
    const celldata: Array<{ r: number; c: number; v: any }> = [];

    if (initialContent && initialContent.includes('|')) {
      const lines = initialContent.trim().split('\n');
      let r = 0;
      for (const line of lines) {
        if (line.includes('|')) {
          const parts = line
            .split('|')
            .map((p) => p.trim())
            .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1); // standard markdown row

          // If line is header divider like |---|---| skip
          if (parts.length > 0 && parts.every((p) => /^:?-+:?$/.test(p))) {
            continue;
          }

          if (parts.length > 0) {
            parts.forEach((val, c) => {
              if (val.startsWith('=')) {
                celldata.push({
                  r,
                  c,
                  v: { f: val, v: '', m: '' },
                });
              } else {
                const num = Number(val);
                const isNum = !isNaN(num) && val !== '';
                celldata.push({
                  r,
                  c,
                  v: {
                    v: isNum ? num : val,
                    m: val,
                    ct: { fa: isNum ? 'General' : '@', t: isNum ? 'n' : 's' },
                  },
                });
              }
            });
            r++;
          }
        }
      }
    }

    // Default sample data if content is empty or has no table
    if (celldata.length === 0) {
      const defaultHeaders = ['Item', 'Kategori', 'Jumlah', 'Harga Satuan', 'Total'];
      const defaultRows = [
        ['Laptop Pro M3', 'Hardware', 2, 24000000, '=C2*D2'],
        ['Monitor 4K OLED', 'Aksesoris', 3, 8500000, '=C3*D3'],
        ['Mechanical Keyboard', 'Aksesoris', 5, 1200000, '=C4*D4'],
        ['Cloud Server GPU', 'Infrastruktur', 1, 15000000, '=C5*D5'],
      ];

      defaultHeaders.forEach((h, c) => {
        celldata.push({ r: 0, c, v: { v: h, m: h, bl: 1 } });
      });

      defaultRows.forEach((row, rowIdx) => {
        row.forEach((cell, colIdx) => {
          const r = rowIdx + 1;
          if (typeof cell === 'string' && cell.startsWith('=')) {
            celldata.push({ r, c: colIdx, v: { f: cell, v: '', m: '' } });
          } else {
            const isNum = typeof cell === 'number';
            celldata.push({
              r,
              c: colIdx,
              v: {
                v: cell,
                m: String(cell),
                ct: { fa: isNum ? 'General' : '@', t: isNum ? 'n' : 's' },
              },
            });
          }
        });
      });
    }

    return [
      {
        name: 'Sheet1',
        id: 'sheet_1',
        status: 1,
        order: 0,
        row: 50,
        column: 26,
        defaultRowHeight: 28,
        defaultColWidth: 120,
        showGridLines: 1,
        celldata,
      },
    ];
  }, [initialContent]);

  // Handle Sheet changes and convert to Markdown table
  const handleChange = useCallback(
    (sheets: SheetType[]) => {
      if (!onContentChange || !sheets || sheets.length === 0) return;

      const activeSheet = sheets[0];
      const data = activeSheet.data;

      if (!data || data.length === 0) return;

      // Find active data boundary
      let maxRow = 0;
      let maxCol = 0;

      for (let r = 0; r < data.length; r++) {
        const row = data[r];
        if (!row) continue;
        for (let c = 0; c < row.length; c++) {
          const cell = row[c];
          if (cell && (cell.v !== undefined && cell.v !== null && cell.v !== '' || cell.f)) {
            if (r > maxRow) maxRow = r;
            if (c > maxCol) maxCol = c;
          }
        }
      }

      if (maxRow === 0 && maxCol === 0 && (!data[0] || !data[0][0] || data[0][0].v === undefined)) {
        return;
      }

      const rows: string[] = [];

      // Row 0 - Header
      const headerCells: string[] = [];
      const dividerCells: string[] = [];
      for (let c = 0; c <= maxCol; c++) {
        const cell = data[0]?.[c];
        const val = cell?.f ? cell.f : (cell?.m ?? cell?.v ?? `Kolom ${c + 1}`);
        headerCells.push(String(val).replace(/\|/g, '\\|'));
        dividerCells.push('---');
      }
      rows.push(`| ${headerCells.join(' | ')} |`);
      rows.push(`| ${dividerCells.join(' | ')} |`);

      // Rows 1 to maxRow
      for (let r = 1; r <= maxRow; r++) {
        const rowCells: string[] = [];
        for (let c = 0; c <= maxCol; c++) {
          const cell = data[r]?.[c];
          const val = cell?.f ? cell.f : (cell?.m ?? cell?.v ?? '');
          rowCells.push(String(val).replace(/\|/g, '\\|'));
        }
        rows.push(`| ${rowCells.join(' | ')} |`);
      }

      const mdTable = rows.join('\n');
      onContentChange(mdTable);
    },
    [onContentChange]
  );

  return (
    <div
      className={`fortune-sheet-container ${theme === 'dark' ? 'dark-sheet' : 'light-sheet'}`}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style jsx global>{`
        .fortune-sheet-container .fortune-toolbar {
          background-color: var(--bg-surface) !important;
          border-bottom: 1px solid var(--border-color) !important;
        }
        .fortune-sheet-container .fortune-formula-bar {
          background-color: var(--bg-surface) !important;
          border-bottom: 1px solid var(--border-color) !important;
          color: var(--text-primary) !important;
        }
        .fortune-sheet-container .fortune-sheet-tab-area {
          background-color: var(--bg-surface) !important;
          border-top: 1px solid var(--border-color) !important;
        }
        .fortune-sheet-container .fortune-formula-input {
          color: var(--text-primary) !important;
          background: transparent !important;
        }
      `}</style>
      <Workbook
        ref={workbookRef}
        data={initialSheets}
        onChange={handleChange}
        showToolbar={true}
        showFormulaBar={true}
        showSheetTabs={true}
        row={60}
        column={26}
      />
    </div>
  );
}
