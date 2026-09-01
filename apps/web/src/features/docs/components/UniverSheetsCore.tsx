'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LocaleType, IWorkbookData, IDisposable } from '@univerjs/core';
import type { FUniver } from '@univerjs/core/facade';
import type { FWorkbook } from '@univerjs/sheets/facade';

import '@univerjs/design/lib/index.css';
import '@univerjs/ui/lib/index.css';
import '@univerjs/docs-ui/lib/index.css';
import '@univerjs/sheets-ui/lib/index.css';
import '@univerjs/sheets-formula-ui/lib/index.css';
import './univer-anticeil-theme.css';

export interface UniverSheetsCoreProps {
  initialContent?: string;
  onContentChange?: (serialized: string) => void;
}

const DEFAULT_ROWS = 80;
const DEFAULT_COLS = 26;
const DEFAULT_APP_VERSION = '0.25.1';
const DEFAULT_LOCALE_TYPE = 'enUS' as LocaleType;

const DEFAULT_WORKBOOK: IWorkbookData = {
  id: 'workbook-anticeil-default',
  name: 'Untitled',
  appVersion: DEFAULT_APP_VERSION,
  locale: DEFAULT_LOCALE_TYPE,
  sheetOrder: ['sheet-001'],
  sheets: {
    'sheet-001': {
      id: 'sheet-001',
      name: 'Sheet1',
      rowCount: DEFAULT_ROWS,
      columnCount: DEFAULT_COLS,
      cellData: {},
      rowData: {},
      columnData: {},
    },
  },
  styles: {},
};

function colLabel(i: number): string {
  let s = '';
  let n = i;
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

function jsonWorkbookFromMatrix(matrix: string[][]): IWorkbookData {
  const rowCount = Math.max(matrix.length, DEFAULT_ROWS);
  const colCount = Math.max(
    ...matrix.map((r) => r.length),
    DEFAULT_COLS
  );
  const cellData: Record<string, Record<string, { v?: string; f?: string }>> = {};
  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r];
    const rowMap: Record<string, { v?: string; f?: string }> = {};
    for (let c = 0; c < row.length; c++) {
      const v = row[c];
      if (v != null && v !== '') rowMap[c] = { v };
    }
    if (Object.keys(rowMap).length > 0) cellData[r] = rowMap;
  }
  return {
    id: 'workbook-' + Date.now(),
    name: 'Spreadsheet',
    appVersion: DEFAULT_APP_VERSION,
    locale: DEFAULT_LOCALE_TYPE,
    sheetOrder: ['sheet-001'],
    sheets: {
      'sheet-001': {
        id: 'sheet-001',
        name: 'Sheet1',
        rowCount,
        columnCount: colCount,
        cellData,
        rowData: {},
        columnData: {},
      },
    },
    styles: {},
  };
}

function tryParseWorkbook(raw: string): IWorkbookData | null {
  if (!raw || !raw.trim()) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      if ('sheets' in parsed && 'sheetOrder' in parsed) {
        return parsed as IWorkbookData;
      }
      if (Array.isArray((parsed as any).rawMatrix)) {
        return jsonWorkbookFromMatrix((parsed as any).rawMatrix);
      }
      if (Array.isArray((parsed as any).fortuneData) && (parsed as any).fortuneData.length > 0) {
        const sheet = (parsed as any).fortuneData[0];
        const rowsData = sheet.data as any[][] | undefined;
        if (rowsData) {
          const rowCount = Math.max(sheet.row ?? rowsData.length, DEFAULT_ROWS);
          const colCount = Math.max(
            sheet.column ?? rowsData.reduce((m: number, r: any[]) => Math.max(m, r?.length ?? 0), 0),
            DEFAULT_COLS
          );
          const cellData: Record<string, Record<string, { v?: string; f?: string }>> = {};
          for (let r = 0; r < rowsData.length; r++) {
            const row = rowsData[r] ?? [];
            const rowMap: Record<string, { v?: string; f?: string }> = {};
            for (let c = 0; c < row.length; c++) {
              const cell = row[c] as any;
              if (!cell) continue;
              const entry: { v?: string; f?: string } = {};
              if (cell.v !== undefined && cell.v !== null) entry.v = String(cell.v);
              if (cell.f) entry.f = cell.f;
              if (entry.v !== undefined || entry.f !== undefined) rowMap[c] = entry;
            }
            if (Object.keys(rowMap).length > 0) cellData[r] = rowMap;
          }
          return {
            id: 'workbook-' + Date.now(),
            name: sheet.name ?? 'Spreadsheet',
            appVersion: DEFAULT_APP_VERSION,
            locale: DEFAULT_LOCALE_TYPE,
            sheetOrder: ['sheet-001'],
            sheets: {
              'sheet-001': {
                id: 'sheet-001',
                name: sheet.name ?? 'Sheet1',
                rowCount,
                columnCount: colCount,
                cellData,
                rowData: {},
                columnData: {},
              },
            },
            styles: {},
          };
        }
      }
      if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0])) {
        return jsonWorkbookFromMatrix(
          parsed.map((row: any[]) => row.map((c) => (c == null ? '' : String(c))))
        );
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
  return jsonWorkbookFromMatrix(rows);
}

const UniverSheetsCore: React.FC<UniverSheetsCoreProps> = ({
  initialContent = '',
  onContentChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const univerInstanceRef = useRef<any>(null);
  const univerApiRef = useRef<FUniver | null>(null);
  const workbookRef = useRef<FWorkbook | null>(null);
  const eventSubRef = useRef<IDisposable | null>(null);
  const changeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [engineStatus, setEngineStatus] = useState<'loading' | 'univer' | 'error'>('loading');
  const [initError, setInitError] = useState<string | null>(null);
  const isMountedRef = useRef(false);
  const prevInitialRef = useRef(initialContent);

  const initialWorkbook = useMemo<IWorkbookData>(() => {
    return tryParseWorkbook(initialContent) ?? DEFAULT_WORKBOOK;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const matrixRef = useRef<string[][]>([]);
  const [, forceRender] = useState(0);
  const rerender = useCallback(() => forceRender((n) => n + 1), []);

  if (matrixRef.current.length === 0) {
    const firstSheet = initialWorkbook.sheets[initialWorkbook.sheetOrder[0]];
    const rows = firstSheet?.rowCount ?? DEFAULT_ROWS;
    const cols = firstSheet?.columnCount ?? DEFAULT_COLS;
    const cellData = firstSheet?.cellData ?? {};
    const m: string[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: string[] = [];
      for (let c = 0; c < cols; c++) {
        const cell = cellData[r]?.[c];
        let v = '';
        if (cell?.v !== undefined && cell?.v !== null) v = String(cell.v);
        else if (cell?.f) v = cell.f;
        row.push(v);
      }
      m.push(row);
    }
    matrixRef.current = m;
  }

  const debouncedEmitSerialized = useCallback(
    (serializeFn: () => string) => {
      if (!onContentChange) return;
      if (changeTimerRef.current) clearTimeout(changeTimerRef.current);
      changeTimerRef.current = setTimeout(() => {
        try {
          onContentChange(serializeFn());
        } catch (e) {
          console.warn('[UniverSheetsCore] Serialize failed:', e);
        }
      }, 300);
    },
    [onContentChange]
  );

  useEffect(() => {
    if (initialContent === prevInitialRef.current) return;
    prevInitialRef.current = initialContent;
    const parsed = tryParseWorkbook(initialContent);
    if (!parsed) return;
    const firstSheet = parsed.sheets[parsed.sheetOrder[0]];
    if (!firstSheet) return;
    const rows = firstSheet.rowCount ?? DEFAULT_ROWS;
    const cols = firstSheet.columnCount ?? DEFAULT_COLS;
    const cellData = firstSheet.cellData ?? {};
    const m: string[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: string[] = [];
      for (let c = 0; c < cols; c++) {
        const cell = cellData[r]?.[c];
        let v = '';
        if (cell?.v !== undefined && cell?.v !== null) v = String(cell.v);
        else if (cell?.f) v = cell.f;
        row.push(v);
      }
      m.push(row);
    }
    matrixRef.current = m;
    rerender();
  }, [initialContent, rerender]);

  // Effect strictModeFix counter (agar kompatibel StrictMode React 19 double-mount)
  const runIdRef = useRef(0);
  const fallbackReasonRef = useRef<string | null>(null);

  useEffect(() => {
    const myRunId = ++runIdRef.current;
    let cancelled = false;
    isMountedRef.current = true;
    let rafId: number | null = null;
    let mountTimer: ReturnType<typeof setTimeout> | null = null;
    let themeObserver: MutationObserver | null = null;
    let colorObserver: MutationObserver | null = null;
    let canvasObserver: MutationObserver | null = null;

    const handleError = (reason?: string) => {
      if (cancelled || myRunId !== runIdRef.current || !isMountedRef.current) return;
      fallbackReasonRef.current = reason || 'unknown';
      console.error('[UniverSheetsCore] runId=', myRunId, '→ init error:', reason || 'unknown');
      if (isMountedRef.current) {
        setInitError(reason || 'Unknown error');
        setEngineStatus('error');
      }
    };

    console.debug('[UniverSheetsCore] runId=', myRunId, '→ mulai init Univer');

    const deepMerge = (target: Record<string, any>, source: Record<string, any>): Record<string, any> => {
      for (const key of Object.keys(source)) {
        const sv = source[key];
        const tv = target[key];
        if (sv && typeof sv === 'object' && !Array.isArray(sv) && tv && typeof tv === 'object' && !Array.isArray(tv)) {
          target[key] = deepMerge(tv, sv);
        } else {
          target[key] = sv;
        }
      }
      return target;
    };

    const safeImport = async (imp: () => Promise<any>): Promise<any | null> => {
      try {
        const mod = await imp();
        return mod?.default ?? mod ?? null;
      } catch {
        return null;
      }
    };

    const loadMergedLocale = async (tag: 'en-US' | 'zh-CN'): Promise<Record<string, any>> => {
      if (tag === 'en-US') {
        const parts = await Promise.all([
          // @ts-expect-error: locale bundles are pure JS without .d.ts declarations
          safeImport(() => import('@univerjs/ui/lib/locale/en-US.js')),
          // @ts-expect-error: locale bundles are pure JS without .d.ts declarations
          safeImport(() => import('@univerjs/sheets/lib/locale/en-US.js')),
          // @ts-expect-error: locale bundles are pure JS without .d.ts declarations
          safeImport(() => import('@univerjs/sheets-ui/lib/locale/en-US.js')),
          // @ts-expect-error: locale bundles are pure JS without .d.ts declarations
          safeImport(() => import('@univerjs/sheets-formula/lib/locale/en-US.js')),
          // @ts-expect-error: locale bundles are pure JS without .d.ts declarations
          safeImport(() => import('@univerjs/sheets-formula-ui/lib/locale/en-US.js')),
          // @ts-expect-error: locale bundles are pure JS without .d.ts declarations
          safeImport(() => import('@univerjs/docs-ui/lib/locale/en-US.js')),
        ]);
        const out: Record<string, any> = {};
        for (const p of parts) if (p) deepMerge(out, p);
        return out;
      }
      const parts = await Promise.all([
        // @ts-expect-error: locale bundles are pure JS without .d.ts declarations
        safeImport(() => import('@univerjs/ui/lib/locale/zh-CN.js')),
        // @ts-expect-error: locale bundles are pure JS without .d.ts declarations
        safeImport(() => import('@univerjs/sheets/lib/locale/zh-CN.js')),
        // @ts-expect-error: locale bundles are pure JS without .d.ts declarations
        safeImport(() => import('@univerjs/sheets-ui/lib/locale/zh-CN.js')),
        // @ts-expect-error: locale bundles are pure JS without .d.ts declarations
        safeImport(() => import('@univerjs/sheets-formula/lib/locale/zh-CN.js')),
        // @ts-expect-error: locale bundles are pure JS without .d.ts declarations
        safeImport(() => import('@univerjs/sheets-formula-ui/lib/locale/zh-CN.js')),
        // @ts-expect-error: locale bundles are pure JS without .d.ts declarations
        safeImport(() => import('@univerjs/docs-ui/lib/locale/zh-CN.js')),
      ]);
      const out: Record<string, any> = {};
      for (const p of parts) if (p) deepMerge(out, p);
      return out;
    };

    (async () => {
      try {
        // TAHAP 1: Load modules
        const t0 = Date.now();
        console.debug('[UniverSheetsCore] runId=', myRunId, '→ tahap 1/6: import modules');
        const mods = await Promise.all([
          import('@univerjs/core'),
          import('@univerjs/ui'),
          import('@univerjs/sheets'),
          import('@univerjs/sheets-ui'),
          import('@univerjs/engine-formula'),
          import('@univerjs/sheets-formula'),
          import('@univerjs/sheets-formula-ui'),
          import('@univerjs/sheets-numfmt'),
          import('@univerjs/docs'),
          import('@univerjs/docs-ui'),
          import('@univerjs/engine-render'),
          import('@univerjs/core/facade'),
          import('@univerjs/sheets/facade'),
          import('@univerjs/sheets-ui/facade'),
        ]);
        const [
          coreMod, uiMod, sheetsMod, sheetsUiMod,
          formulaMod, sheetsFormulaMod, sheetsFormulaUiMod, sheetsNumfmtMod,
          docsMod, docsUiMod, renderMod, coreFacadeMod,
        ] = mods;

        const { Univer, LocaleType } = coreMod;
        const { UniverUIPlugin } = uiMod;
        const { UniverSheetsPlugin } = sheetsMod;
        const { UniverSheetsUIPlugin } = sheetsUiMod;
        const { UniverFormulaEnginePlugin } = formulaMod;
        const { UniverSheetsFormulaPlugin } = sheetsFormulaMod;
        const { UniverSheetsFormulaUIPlugin } = sheetsFormulaUiMod;
        const { UniverSheetsNumfmtPlugin } = sheetsNumfmtMod;
        const { UniverDocsPlugin } = docsMod;
        const { UniverDocsUIPlugin } = docsUiMod;
        const { UniverRenderEnginePlugin } = renderMod;
        const { FUniver } = coreFacadeMod;

        console.debug('[UniverSheetsCore] runId=', myRunId, '→ tahap 1/6 selesai (', Date.now() - t0, 'ms)');
        if (cancelled || myRunId !== runIdRef.current) return;

        // TAHAP 1b: Load locale bundles (en-US + zh-CN) agar LocaleService terinisialisasi
        const tl = Date.now();
        console.debug('[UniverSheetsCore] runId=', myRunId, '→ tahap 1b/6: load locale resources');
        const [enUS, zhCN] = await Promise.all([
          loadMergedLocale('en-US'),
          loadMergedLocale('zh-CN'),
        ]);
        const locales: Record<string, Record<string, any>> = {};
        if (Object.keys(enUS).length > 0) {
          locales[LocaleType.EN_US] = enUS;
          locales['en_US'] = enUS;
          locales['en-US'] = enUS;
          locales['enUS'] = enUS;
        }
        if (Object.keys(zhCN).length > 0) {
          locales[LocaleType.ZH_CN] = zhCN;
          locales['zh_CN'] = zhCN;
          locales['zh-CN'] = zhCN;
          locales['zhCN'] = zhCN;
        }
        console.debug('[UniverSheetsCore] runId=', myRunId, '→ tahap 1b/6 selesai (', Date.now() - tl, 'ms) → locales loaded:', Object.keys(locales));
        if (cancelled || myRunId !== runIdRef.current) return;

        // TAHAP 2: Load CSS (sudah diimpor statis di level atas)
        const t1 = Date.now();
        console.debug('[UniverSheetsCore] runId=', myRunId, '→ tahap 2/6: styles loaded');
        if (cancelled || myRunId !== runIdRef.current) return;

        // TAHAP 3: Flip status ke 'univer' → tunggu layout
        console.debug('[UniverSheetsCore] runId=', myRunId, '→ tahap 3/6: set status univer + wait layout');
        if (!cancelled && myRunId === runIdRef.current && isMountedRef.current) setEngineStatus('univer');

        await new Promise<void>((resolve) => {
          rafId = requestAnimationFrame(() => {
            rafId = requestAnimationFrame(() => {
              rafId = requestAnimationFrame(() => resolve());
            });
          });
        });
        if (cancelled || myRunId !== runIdRef.current) return;

        // TAHAP 4: Validasi container
        console.debug('[UniverSheetsCore] runId=', myRunId, '→ tahap 4/6: validasi container & mount plugins');
        const finalContainer = containerRef.current;
        if (!finalContainer) { handleError('container_missing_after_layout'); return; }
        finalContainer.style.display = 'block';
        finalContainer.style.visibility = 'visible';
        const rect = finalContainer.getBoundingClientRect();
        console.debug('[UniverSheetsCore] runId=', myRunId, '→ container size:', rect.width, '×', rect.height);
        if (rect.width < 10 || rect.height < 10) {
          console.warn('[UniverSheetsCore] container terlalu kecil, lanjutkan walau ukuran minimal');
        }

        const navLang = typeof navigator !== 'undefined' ? navigator.language?.toLowerCase() : 'en';
        const locale: LocaleType = navLang?.startsWith('zh') ? LocaleType.ZH_CN : LocaleType.EN_US;
        console.debug('[UniverSheetsCore] runId=', myRunId, '→ locale aktif:', locale, 'tersedia:', Object.keys(locales));

        // DEFER: new Univer + registerPlugin ke task selanjutnya agar setState internal
        // UniverUIPlugin tidak jalan saat React belum commit mount selesai (StrictMode 19)
        mountTimer = setTimeout(() => {
          if (cancelled || myRunId !== runIdRef.current || !isMountedRef.current) return;
          try {
            // Determine current theme
            const isLightTheme = typeof document !== 'undefined' &&
              document.documentElement.getAttribute('data-theme') === 'light';
            
            // Configure Univer with theme-aware options
            const univerOpts: any = { 
              locale, 
              locales,
              // Add theme configuration
              theme: isLightTheme ? 'light' : 'default'
            };
            const univer: any = new Univer(univerOpts);
            univer.registerPlugin(UniverRenderEnginePlugin);
            univer.registerPlugin(UniverFormulaEnginePlugin);
            univer.registerPlugin(UniverUIPlugin, {
              container: finalContainer,
              header: true,
              footer: true,
            });
            univer.registerPlugin(UniverDocsPlugin, {
              hasScroll: false,
            });
            univer.registerPlugin(UniverDocsUIPlugin);
            univer.registerPlugin(UniverSheetsPlugin);
            univer.registerPlugin(UniverSheetsUIPlugin);
            univer.registerPlugin(UniverSheetsNumfmtPlugin);
            univer.registerPlugin(UniverSheetsFormulaPlugin);
            univer.registerPlugin(UniverSheetsFormulaUIPlugin);

            univerInstanceRef.current = univer;
            const univerAPI: FUniver = FUniver.newAPI(univer);
            univerApiRef.current = univerAPI;

            if (typeof window !== 'undefined') {
              (window as any).__univer = univer;
              (window as any).__univerAPI = univerAPI;
              console.log('[UniverSheetsCore] 💡 Tip: window.__univerAPI dan window.__univer tersedia di console.');
            }

            // TAHAP 5: Buat workbook
            console.log('[UniverSheetsCore] runId=', myRunId, '→ tahap 5/6: create workbook + register listeners');
            // Anticeil uses data-theme='light' for light; default (no attr / 'dark') = dark
            const isLight = () =>
              typeof document !== 'undefined' &&
              document.documentElement.getAttribute('data-theme') === 'light';
            try { univerAPI.toggleDarkMode(!isLight()); } catch { /* ignore */ }

            // Keep Univer in sync when user switches theme
            themeObserver = new MutationObserver(() => {
              try { 
                univerAPI.toggleDarkMode(!isLight());
                // Force canvas repaint
                setTimeout(() => {
                  const canvases = finalContainer.querySelectorAll('canvas');
                  canvases.forEach(canvas => {
                    canvas.style.backgroundColor = isLight() ? '#ffffff' : '#1a1a1a';
                  });
                }, 100);
              } catch { /* ignore */ }
            });
            themeObserver.observe(document.documentElement, {
              attributes: true,
              attributeFilter: ['data-theme'],
            });

            // Set cell default background - don't modify initialWorkbook directly
            // Just use it as-is and let Univer handle the theme internally
            const workbook = univerAPI.createWorkbook(initialWorkbook as any);
            workbookRef.current = workbook;

            // Register comprehensive event logs
            try {
              const EventName = (univerAPI as any).Event ?? {};
              if (EventName.CommandExecuted) {
                eventSubRef.current = univerAPI.addEvent(
                  EventName.CommandExecuted,
                  (cmdEvent: any) => {
                    console.log('[Univer:CommandExecuted]', cmdEvent?.id, cmdEvent?.params ?? '');
                    if (onContentChange) {
                      debouncedEmitSerialized(() => {
                        const wb = univerApiRef.current?.getActiveWorkbook();
                        const snap = wb?.save?.() ?? wb?.getSnapshot?.();
                        if (snap) return JSON.stringify(snap);
                        return JSON.stringify(initialWorkbook);
                      });
                    }
                  }
                );
              } else {
                const sub = (univerAPI as any).onCommandExecuted?.((cmdEvent: any) => {
                  console.log('[Univer:onCommandExecuted]', cmdEvent?.id, cmdEvent?.params ?? '');
                  if (onContentChange) {
                    debouncedEmitSerialized(() => {
                      const wb = univerApiRef.current?.getActiveWorkbook();
                      const snap = wb?.save?.() ?? wb?.getSnapshot?.();
                      if (snap) return JSON.stringify(snap);
                      return JSON.stringify(initialWorkbook);
                    });
                  }
                });
                if (sub?.dispose) eventSubRef.current = sub;
              }

              // Selection logger
              if (EventName.SelectionChanged) {
                univerAPI.addEvent(EventName.SelectionChanged, (selEvent: any) => {
                  console.log('[Univer:SelectionChanged]', selEvent);
                });
              }
            } catch (e) {
              console.warn('[UniverSheetsCore] gagal register listener:', e);
            }

            // DOM Event Listeners for diagnostics
            const handleDomClick = (e: MouseEvent) => {
              const target = e.target as HTMLElement;
              console.log('[Univer:DOM:click]', {
                targetTag: target?.tagName,
                targetClass: target?.className,
                x: e.clientX,
                y: e.clientY,
              });
            };
            const handleDomDblClick = (e: MouseEvent) => {
              const target = e.target as HTMLElement;
              console.log('[Univer:DOM:dblclick]', {
                targetTag: target?.tagName,
                targetClass: target?.className,
                x: e.clientX,
                y: e.clientY,
              });
            };
            const handleDomKeyDown = (e: KeyboardEvent) => {
              const target = e.target as HTMLElement;
              console.log('[Univer:DOM:keydown]', {
                key: e.key,
                code: e.code,
                targetTag: target?.tagName,
                targetClass: target?.className,
              });
            };

            finalContainer.addEventListener('click', handleDomClick);
            finalContainer.addEventListener('dblclick', handleDomDblClick);
            finalContainer.addEventListener('keydown', handleDomKeyDown);

            // Force theme colors via CSS custom properties
            const applyThemeColors = () => {
              if (cancelled || !isMountedRef.current) return;
              
              const isDark = !isLight();
              const bgColor = isDark ? '#1a1a1a' : '#ffffff';
              const textColor = isDark ? '#f5f5f5' : '#1a1a1a';
              
              try {
                finalContainer.style.setProperty('--univer-background-color', bgColor);
                finalContainer.style.setProperty('color', textColor);
                finalContainer.style.backgroundColor = isDark ? '#171717' : '#f7f7f5';
                
                // Force all canvas elements to have the correct background
                const canvases = finalContainer.querySelectorAll('canvas');
                canvases.forEach(canvas => {
                  canvas.style.backgroundColor = bgColor;
                });
                
                console.log('[UniverSheetsCore] Applied theme colors:', { isDark, bgColor, textColor, canvasCount: canvases.length });
              } catch (err) {
                console.warn('[UniverSheetsCore] Failed to apply theme colors:', err);
              }
            };
            
            // Initial application with delays to catch dynamically created canvases
            requestAnimationFrame(() => {
              if (cancelled || !isMountedRef.current) return;
              applyThemeColors();
            });
            setTimeout(() => {
              if (cancelled || !isMountedRef.current) return;
              applyThemeColors();
            }, 100);
            setTimeout(() => {
              if (cancelled || !isMountedRef.current) return;
              applyThemeColors();
            }, 500);
            setTimeout(() => {
              if (cancelled || !isMountedRef.current) return;
              applyThemeColors();
            }, 1000);
            
            // Reapply colors when theme changes
            colorObserver = new MutationObserver(() => {
              if (cancelled || !isMountedRef.current) return;
              console.log('[UniverSheetsCore] Theme changed, reapplying colors...');
              requestAnimationFrame(() => applyThemeColors());
            });
            colorObserver.observe(document.documentElement, {
              attributes: true,
              attributeFilter: ['data-theme'],
            });
            
            // Watch for new canvas elements being added
            canvasObserver = new MutationObserver(() => {
              if (cancelled || !isMountedRef.current) return;
              console.log('[UniverSheetsCore] DOM mutation detected, reapplying colors...');
              requestAnimationFrame(() => applyThemeColors());
            });
            canvasObserver.observe(finalContainer, {
              childList: true,
              subtree: true,
            });

            console.log('[UniverSheetsCore] runId=', myRunId, '✅ UNIVER BERHASIL MOUNT & READY ✅');
          } catch (innerErr: any) {
            console.error('[UniverSheetsCore] runId=', myRunId, '❌ Univer error saat mount (deferred):', innerErr?.message ?? innerErr);
            if (innerErr?.stack) console.error('[UniverSheetsCore] stack trace:', innerErr.stack);
            handleError(innerErr?.message ?? 'mount_error');
          }
        }, 0);
      } catch (err: any) {
        console.error('[UniverSheetsCore] runId=', myRunId, '❌ Univer error saat init:', err?.message ?? err);
        if (err?.stack) console.error('[UniverSheetsCore] stack trace:', err.stack);
        handleError(err?.message ?? 'init_error');
      }
    })();

    return () => {
      cancelled = true;
      isMountedRef.current = false;
      if (mountTimer) { clearTimeout(mountTimer); mountTimer = null; }
      if (rafId) { try { cancelAnimationFrame(rafId); } catch { /* noop */ } rafId = null; }
      if (changeTimerRef.current) {
        clearTimeout(changeTimerRef.current);
        changeTimerRef.current = null;
      }
      try { themeObserver?.disconnect(); themeObserver = null; } catch { /* noop */ }
      try { colorObserver?.disconnect(); } catch { /* noop */ }
      try { canvasObserver?.disconnect(); } catch { /* noop */ }
      try { eventSubRef.current?.dispose?.(); } catch { /* noop */ }
      eventSubRef.current = null;
      univerApiRef.current = null;
      workbookRef.current = null;
      try { univerInstanceRef.current?.dispose?.(); } catch { /* noop */ }
      univerInstanceRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setCellNative = useCallback(
    (r: number, c: number, value: string) => {
      const m = matrixRef.current;
      while (m.length <= r) m.push(Array.from({ length: m[0]?.length ?? DEFAULT_COLS }, () => ''));
      const row = m[r];
      while (row.length <= c) row.push('');
      row[c] = value;
      rerender();
      debouncedEmitSerialized(() => JSON.stringify(jsonWorkbookFromMatrix(
        matrixRef.current.map((row) => [...row])
      )));
    },
    [debouncedEmitSerialized, rerender]
  );

  const addRowNative = useCallback(() => {
    const cols = matrixRef.current[0]?.length ?? DEFAULT_COLS;
    matrixRef.current.push(Array.from({ length: cols }, () => ''));
    rerender();
    debouncedEmitSerialized(() => JSON.stringify(jsonWorkbookFromMatrix(
      matrixRef.current.map((row) => [...row])
    )));
  }, [debouncedEmitSerialized, rerender]);

  const addColNative = useCallback(() => {
    matrixRef.current.forEach((r) => r.push(''));
    rerender();
    debouncedEmitSerialized(() => JSON.stringify(jsonWorkbookFromMatrix(
      matrixRef.current.map((row) => [...row])
    )));
  }, [debouncedEmitSerialized, rerender]);

  // FALLBACK: Native spreadsheet grid (siapkan data render)
  const rows = matrixRef.current;
  const colCount = Math.max(...rows.map((r) => r.length), DEFAULT_COLS);
  const rowCount = rows.length;

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
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          backgroundColor: 'var(--bg-main)',
          visibility: engineStatus === 'error' ? 'hidden' : 'visible',
          display: 'block',
        }}
      />

      {engineStatus === 'loading' && (
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-main)',
            color: 'var(--text-secondary)',
            fontSize: '13px',
            zIndex: 5,
            gap: '12px',
            flexDirection: 'column',
          }}
        >
          <div style={{
            width: 28,
            height: 28,
            border: '2.5px solid var(--border-subtle)',
            borderTopColor: 'var(--accent-primary)',
            borderRadius: '50%',
            animation: 'spin 0.9s linear infinite',
          }} />
          <div>
            Memuat Univer Spreadsheet Engine...
            <span style={{ opacity: 0.55, fontSize: '11.5px', display: 'block', marginTop: 4 }}>
              (mode dev mungkin agak lama karena compile modules)
            </span>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {engineStatus === 'error' && (
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-main)',
            color: 'var(--text-primary)',
            zIndex: 5,
            padding: 24,
          }}
        >
          <div style={{
            maxWidth: 540,
            width: '100%',
            padding: '20px 22px',
            borderRadius: 10,
            border: '1px solid #ef444433',
            backgroundColor: '#ef444410',
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#ef4444', marginBottom: 8 }}>
              ❌ Univer Spreadsheet gagal dimuat
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 10, fontFamily: "'JetBrains Mono', monospace", wordBreak: 'break-all' }}>
              {initError || 'Unknown error'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Pastikan semua package <code style={{ background: 'var(--bg-subtle)', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>@univerjs/*</code> versi 0.25.1 sudah terinstall dengan benar.
              Refresh halaman (F5) atau restart dev server jika perlu.
            </div>
          </div>
        </div>
      )}
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
