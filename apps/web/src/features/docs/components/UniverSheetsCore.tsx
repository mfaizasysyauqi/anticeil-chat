'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface UniverSheetsCoreProps {
  initialContent?: string;
  onContentChange?: (serialized: string) => void;
}

interface SheetCell {
  v?: string | number | boolean | null;
  f?: string;
}

interface StoredWorkbook {
  appVersion: string;
  locale: string;
  id: string;
  name: string;
  sheetOrder: string[];
  sheets: Record<string, {
    id: string;
    name: string;
    rowCount: number;
    columnCount: number;
    cellData: Record<string, Record<string, { v?: string; f?: string }>>;
    rowData: Record<string, unknown>;
    columnData: Record<string, unknown>;
  }>;
  styles: Record<string, unknown>;
  rawMatrix?: string[][];
}

const DEFAULT_LOCALE = 'en_US';
const APP_VERSION = '0.25.1';
const DEFAULT_ROWS = 60;
const DEFAULT_COLS = 20;

function colLabel(i: number): string {
  let s = '';
  let n = i;
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

function buildStoredWorkbookFromMatrix(matrix: string[][]): StoredWorkbook {
  const rowCount = matrix.length;
  const colCount = matrix.reduce((m, r) => Math.max(m, r.length), 0);
  const cellData: Record<string, Record<string, { v?: string; f?: string }>> = {};
  for (let r = 0; r < rowCount; r++) {
    const rowMap: Record<string, { v?: string; f?: string }> = {};
    for (let c = 0; c < (matrix[r]?.length ?? 0); c++) {
      const v = matrix[r][c];
      if (v != null && v !== '') rowMap[c] = { v };
    }
    if (Object.keys(rowMap).length > 0) cellData[r] = rowMap;
  }

  const sheetId = 'sheet-001';
  return {
    appVersion: APP_VERSION,
    locale: DEFAULT_LOCALE,
    id: 'workbook-' + Date.now(),
    name: 'Spreadsheet',
    sheetOrder: [sheetId],
    sheets: {
      [sheetId]: {
        id: sheetId,
        name: 'Sheet1',
        rowCount: Math.max(rowCount, DEFAULT_ROWS),
        columnCount: Math.max(colCount, DEFAULT_COLS),
        cellData,
        rowData: {},
        columnData: {},
      },
    },
    styles: {},
    rawMatrix: matrix.map((row) => {
      const out: string[] = [];
      for (let c = 0; c < Math.max(row.length, colCount); c++) out[c] = row[c] ?? '';
      return out;
    }),
  };
}

function tryParseMatrix(raw: string): string[][] | null {
  if (!raw || !raw.trim()) return null;

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      if (parsed.length > 0 && Array.isArray(parsed[0])) {
        return (parsed as unknown[][]).map((row) => row.map((c) => (c == null ? '' : String(c))));
      }
    }
    if (parsed && typeof parsed === 'object') {
      const obj = parsed as StoredWorkbook;
      if (Array.isArray(obj.rawMatrix) && obj.rawMatrix.length > 0) {
        return obj.rawMatrix.map((row) => row.map((c) => (c == null ? '' : String(c))));
      }
      if (obj.sheets && obj.sheetOrder) {
        const firstId = obj.sheetOrder[0];
        const first = obj.sheets[firstId];
        if (first) {
          const rows = first.rowCount ?? DEFAULT_ROWS;
          const cols = first.columnCount ?? DEFAULT_COLS;
          const matrix: string[][] = Array.from({ length: Math.max(rows, 1) }, () =>
            Array.from({ length: Math.max(cols, 1) }, () => '')
          );
          const cellData = first.cellData ?? {};
          for (const rKey of Object.keys(cellData)) {
            const r = Number(rKey);
            if (!Number.isFinite(r)) continue;
            const colMap = cellData[rKey] ?? {};
            for (const cKey of Object.keys(colMap)) {
              const c = Number(cKey);
              if (!Number.isFinite(c)) continue;
              while (matrix.length <= r) matrix.push(Array.from({ length: cols }, () => ''));
              while (matrix[r].length <= c) matrix[r].push('');
              const entry = colMap[cKey];
              if (entry) matrix[r][c] = entry.v ?? entry.f ?? '';
            }
          }
          return matrix;
        }
      }
    }
  } catch {
    // fall through to text parsing
  }

  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return null;

  const isMarkdown = lines.some((l) => l.trim().startsWith('|') && l.trim().endsWith('|'));
  const delimiter = isMarkdown ? '|' : lines.some((l) => l.includes('\t')) ? '\t' : ',';

  const rows: string[][] = lines.map((line) => {
    if (isMarkdown) {
      return line
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((c) => c.trim());
    }
    return line.split(delimiter).map((c) => c.trim());
  }).filter((row, idx) => {
    if (isMarkdown && idx === 1) {
      const sep = row.every(
        (cell) => /^:?-{3,}:?$/.test(cell) || cell.replace(/[-:|\s]/g, '').length === 0
      );
      return !sep;
    }
    return true;
  });

  if (rows.length === 0) return null;
  const maxCols = Math.max(...rows.map((r) => r.length), DEFAULT_COLS);
  return rows.map((r) => {
    const out: string[] = [];
    for (let c = 0; c < maxCols; c++) out[c] = r[c] ?? '';
    return out;
  });
}

function defaultMatrix(): string[][] {
  return Array.from({ length: DEFAULT_ROWS }, () =>
    Array.from({ length: DEFAULT_COLS }, () => '')
  );
}

const UniverSheetsCore: React.FC<UniverSheetsCoreProps> = ({
  initialContent = '',
  onContentChange,
}) => {
  const [engineStatus, setEngineStatus] = useState<'loading' | 'fortune' | 'native'>('loading');
  const fortuneWorkbookRef = useRef<React.ComponentType<any> | null>(null);
  const [fortuneData, setFortuneData] = useState<any[]>([]);

  const initialMatrix = useMemo<string[][]>(() => {
    const parsed = tryParseMatrix(initialContent);
    if (parsed) {
      const rows = Math.max(parsed.length, DEFAULT_ROWS);
      const cols = Math.max(...parsed.map((r) => r.length), DEFAULT_COLS);
      const out: string[][] = [];
      for (let r = 0; r < rows; r++) {
        const row: string[] = [];
        for (let c = 0; c < cols; c++) row.push(parsed[r]?.[c] ?? '');
        out.push(row);
      }
      return out;
    }
    return defaultMatrix();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const matrixRef = useRef<string[][]>(initialMatrix.map((row) => [...row]));
  const [, forceRender] = useState(0);
  const rerender = useCallback(() => forceRender((n) => n + 1), []);
  const prevInitialRef = useRef(initialContent);
  const emitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialContent === prevInitialRef.current) return;
    prevInitialRef.current = initialContent;
    const parsed = tryParseMatrix(initialContent);
    if (parsed) {
      const rows = Math.max(parsed.length, DEFAULT_ROWS);
      const cols = Math.max(...parsed.map((r) => r.length), DEFAULT_COLS);
      const out: string[][] = [];
      for (let r = 0; r < rows; r++) {
        const row: string[] = [];
        for (let c = 0; c < cols; c++) row.push(parsed[r]?.[c] ?? '');
        out.push(row);
      }
      matrixRef.current = out;
      rerender();
    }
  }, [initialContent, rerender]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod: any = await import('@fortune-sheet/react');
        if (cancelled) return;
        try {
          await import('@fortune-sheet/react/dist/index.css');
        } catch {
          // ignore css load errors
        }
        const Comp = mod?.Workbook ?? mod?.default?.Workbook ?? mod?.default;
        if (Comp && typeof Comp === 'function') {
          fortuneWorkbookRef.current = Comp as React.ComponentType<any>;
          const rows = Math.max(matrixRef.current.length, DEFAULT_ROWS);
          const cols = Math.max(...matrixRef.current.map((r) => r.length), DEFAULT_COLS);
          const data: (SheetCell | null)[][] = Array.from({ length: rows }, (_, r) =>
            Array.from({ length: cols }, (__, c) => {
              const v = matrixRef.current[r]?.[c];
              return v ? { v } : null;
            })
          );
          setFortuneData([
            {
              name: 'Sheet1',
              row: rows,
              column: cols,
              data,
            },
          ]);
          setEngineStatus('fortune');
        } else {
          setEngineStatus('native');
        }
      } catch (err) {
        console.warn('[UniverSheetsCore] Fortune sheet unavailable, using native grid:', err);
        setEngineStatus('native');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const emit = useCallback(() => {
    if (!onContentChange) return;
    const snapshot = matrixRef.current.map((row) => [...row]);
    const wb = buildStoredWorkbookFromMatrix(snapshot);
    onContentChange(JSON.stringify(wb));
  }, [onContentChange]);

  const debouncedEmit = useCallback(() => {
    if (!onContentChange) return;
    if (emitTimerRef.current) clearTimeout(emitTimerRef.current);
    emitTimerRef.current = setTimeout(emit, 250);
  }, [emit, onContentChange]);

  useEffect(() => () => {
    if (emitTimerRef.current) clearTimeout(emitTimerRef.current);
  }, []);

  const setCellNative = useCallback(
    (r: number, c: number, value: string) => {
      const m = matrixRef.current;
      while (m.length <= r) m.push(Array.from({ length: m[0]?.length ?? DEFAULT_COLS }, () => ''));
      const row = m[r];
      while (row.length <= c) row.push('');
      row[c] = value;
      rerender();
      debouncedEmit();
    },
    [debouncedEmit, rerender]
  );

  const addRowNative = useCallback(() => {
    const cols = matrixRef.current[0]?.length ?? DEFAULT_COLS;
    matrixRef.current.push(Array.from({ length: cols }, () => ''));
    rerender();
    debouncedEmit();
  }, [debouncedEmit, rerender]);

  const addColNative = useCallback(() => {
    matrixRef.current.forEach((r) => r.push(''));
    rerender();
    debouncedEmit();
  }, [debouncedEmit, rerender]);

  if (engineStatus === 'loading') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-main)',
          color: 'var(--text-secondary)',
          fontSize: '13px',
        }}
      >
        Memuat Spreadsheet Engine...
      </div>
    );
  }

  if (engineStatus === 'fortune' && fortuneWorkbookRef.current) {
    const Comp = fortuneWorkbookRef.current;
    const handleFortuneChange = (next: any[]) => {
      setFortuneData(next);
      const sheet = next?.[0];
      const rows = sheet?.data ?? [];
      const rowCount = Math.max(rows.length, DEFAULT_ROWS);
      const colCount = Math.max(
        ...rows.map((r: any[]) => r?.length ?? 0),
        DEFAULT_COLS
      );
      const matrix: string[][] = [];
      for (let r = 0; r < rowCount; r++) {
        const rowArr: string[] = [];
        for (let c = 0; c < colCount; c++) {
          const cell = rows[r]?.[c];
          let v = '';
          if (cell && typeof cell === 'object') {
            if (cell.v !== undefined && cell.v !== null) v = String(cell.v);
            else if (cell.f) v = cell.f;
          }
          rowArr.push(v);
        }
        matrix.push(rowArr);
      }
      matrixRef.current = matrix;
      debouncedEmit();
    };

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-main)',
        }}
      >
        <Comp
          data={fortuneData}
          onChange={handleFortuneChange}
          showFormulaBar
          showSheetTabs
          allowEdit
          containerStyle={{ width: '100%', height: '100%', boxSizing: 'border-box' }}
        />
      </div>
    );
  }

  // Native fallback grid
  const rows = matrixRef.current;
  const colCount = Math.max(...rows.map((r) => r.length), DEFAULT_COLS);
  const rowCount = rows.length;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-main)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '6px 12px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Anticeil Sheets</span>
        <span>•</span>
        <span>{rowCount} baris × {colCount} kolom</span>
        <div style={{ flex: 1 }} />
        <button type="button" onClick={addRowNative} style={btnStyle}>+ Baris</button>
        <button type="button" onClick={addColNative} style={btnStyle}>+ Kolom</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table
          style={{
            borderCollapse: 'collapse',
            width: '100%',
            minWidth: colCount * 110 + 50,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12.5px',
          }}
        >
          <thead>
            <tr>
              <th style={headerCellStyle}></th>
              {Array.from({ length: colCount }, (_, i) => (
                <th key={i} style={headerCellStyle}>{colLabel(i)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => (
              <tr key={rIdx}>
                <td style={rowHeaderCellStyle}>{rIdx + 1}</td>
                {Array.from({ length: colCount }, (_, cIdx) => (
                  <td key={cIdx} style={cellStyle}>
                    <input
                      type="text"
                      value={row[cIdx] ?? ''}
                      onChange={(e) => setCellNative(rIdx, cIdx, e.target.value)}
                      style={inputStyle}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  padding: '3px 10px',
  borderRadius: '5px',
  border: '1px solid var(--border-subtle)',
  background: 'var(--bg-subtle)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  fontSize: '11.5px',
  fontWeight: 600,
};

const headerCellStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 2,
  padding: '5px 8px',
  textAlign: 'center',
  border: '1px solid var(--border-subtle)',
  backgroundColor: 'var(--bg-surface)',
  color: 'var(--text-secondary)',
  fontWeight: 700,
  fontSize: '11px',
  userSelect: 'none',
  minWidth: 50,
};

const rowHeaderCellStyle: React.CSSProperties = {
  position: 'sticky',
  left: 0,
  zIndex: 1,
  padding: '3px 8px',
  textAlign: 'center',
  border: '1px solid var(--border-subtle)',
  backgroundColor: 'var(--bg-surface)',
  color: 'var(--text-secondary)',
  fontWeight: 700,
  fontSize: '11px',
  userSelect: 'none',
  minWidth: 40,
};

const cellStyle: React.CSSProperties = {
  border: '1px solid var(--border-subtle)',
  padding: 0,
  minWidth: 110,
  maxWidth: 240,
  height: 28,
  backgroundColor: 'var(--bg-main)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  padding: '4px 7px',
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
  fontSize: 'inherit',
  boxSizing: 'border-box',
};

export default UniverSheetsCore;
