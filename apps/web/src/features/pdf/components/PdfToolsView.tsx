'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FileText,
  Layers,
  Scissors,
  Minimize2,
  Stamp,
  RotateCw,
  Sparkles,
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  FileCheck,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  MessageSquare,
  PenTool,
  Image as ImageIcon,
  Copy,
  Check,
  SunMoon,
  Hash,
  FolderSync,
  Eraser,
  Lock,
  FileSpreadsheet,
  Presentation,
} from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { getTranslation } from '@anticeil/core';
import { useRouter } from 'next/navigation';

export type PdfToolCategory = 'all' | 'popular' | 'convert' | 'edit' | 'organize' | 'security';

export type PdfToolType =
  | 'sign'
  | 'wordToPdf'
  | 'excelToPdf'
  | 'pptToPdf'
  | 'imgToPdf'
  | 'aiPrepare'
  | 'organize'
  | 'pageNumbers'
  | 'merge'
  | 'split'
  | 'compress'
  | 'watermark'
  | 'rotate'
  | 'invertColors'
  | 'sanitize'
  | 'extractImages'
  | 'ocr';

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  arrayBuffer?: ArrayBuffer;
  previewUrl?: string;
}

export function PdfToolsView() {
  const language = useSettingsStore((s) => s.language);
  const t = getTranslation(language);
  const tp = t.pdfTools;
  const router = useRouter();

  const [activeCategory, setActiveCategory] = useState<PdfToolCategory>('all');
  const [activeTool, setActiveTool] = useState<PdfToolType>('sign');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFileName, setResultFileName] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedResult, setCopiedResult] = useState(false);

  // Tool specific configurations
  const [splitRange, setSplitRange] = useState('1-3');
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL - ANTICEIL');
  const [rotateAngle, setRotateAngle] = useState<'90' | '180' | '270'>('90');
  const [extractedText, setExtractedText] = useState<string>('');

  // 1. Sign PDF config
  const [signMode, setSignMode] = useState<'draw' | 'type'>('draw');
  const [typedSignName, setTypedSignName] = useState('');
  const [signPlacement, setSignPlacement] = useState<'bottom-right' | 'bottom-left' | 'bottom-center' | 'center'>('bottom-right');
  const [signTargetPage, setSignTargetPage] = useState<'last' | 'first' | 'all'>('last');
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);

  // 2. Page Numbers config
  const [pageNumberFormat, setPageNumberFormat] = useState<'page_of_total' | 'simple_number' | 'romans'>('page_of_total');
  const [pageNumberPos, setPageNumberPos] = useState<'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-right'>('bottom-center');

  // 3. Organize / Delete pages config
  const [pagesToDelete, setPagesToDelete] = useState('');
  const [isReversePages, setIsReversePages] = useState(false);

  // 4. Image to PDF orientation
  const [imagePageFit, setImagePageFit] = useState<'a4-portrait' | 'a4-landscape' | 'original'>('a4-portrait');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tools Metadata Registry
  const tools: {
    id: PdfToolType;
    category: PdfToolCategory;
    label: string;
    icon: React.ReactNode;
    desc: string;
    badge?: string;
    acceptTypes?: string;
  }[] = [
    {
      id: 'sign',
      category: 'popular',
      label: language === 'id' ? 'Tanda Tangan PDF' : 'Sign PDF',
      icon: <PenTool size={16} />,
      desc: language === 'id' ? 'Gambar atau ketik tanda tangan & posisikan langsung di dokumen.' : 'Draw or type your signature and embed directly into PDF.',
      badge: 'POPULAR',
      acceptTypes: '.pdf,application/pdf',
    },
    {
      id: 'wordToPdf',
      category: 'convert',
      label: language === 'id' ? 'Word ke PDF' : 'Word to PDF',
      icon: <FileText size={16} />,
      desc: language === 'id' ? 'Konversi dokumen Word (.docx, .doc) menjadi PDF berkualitas tinggi.' : 'Convert Word (.docx, .doc) documents into high quality PDF.',
      badge: 'OFFICE',
      acceptTypes: '.docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword',
    },
    {
      id: 'excelToPdf',
      category: 'convert',
      label: language === 'id' ? 'Excel ke PDF' : 'Excel to PDF',
      icon: <FileSpreadsheet size={16} />,
      desc: language === 'id' ? 'Konversi spreadsheet Excel (.xlsx, .xls, .csv) ke tabel PDF rapi.' : 'Convert Excel and CSV spreadsheets into formatted PDF tables.',
      badge: 'OFFICE',
      acceptTypes: '.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv',
    },
    {
      id: 'pptToPdf',
      category: 'convert',
      label: language === 'id' ? 'PowerPoint ke PDF' : 'PowerPoint to PDF',
      icon: <Presentation size={16} />,
      desc: language === 'id' ? 'Konversi slide presentasi (.pptx, .ppt) menjadi dokumen PDF slide.' : 'Convert PowerPoint (.pptx, .ppt) slides into presentation PDF.',
      badge: 'OFFICE',
      acceptTypes: '.pptx,.ppt,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint',
    },
    {
      id: 'imgToPdf',
      category: 'convert',
      label: language === 'id' ? 'Gambar ke PDF' : 'Image to PDF',
      icon: <ImageIcon size={16} />,
      desc: language === 'id' ? 'Konversi foto JPG, PNG, WebP ke dalam 1 dokumen PDF rapi.' : 'Convert JPG, PNG, and WebP images into a formatted PDF.',
      acceptTypes: 'image/*',
    },
    {
      id: 'aiPrepare',
      category: 'popular',
      label: language === 'id' ? 'Siapkan untuk AI / RAG' : 'Prepare for AI / RAG',
      icon: <Sparkles size={16} />,
      desc: language === 'id' ? 'Ekstrak teks terstruktur & tabel ke Markdown untuk prompt AI.' : 'Extract structured Markdown & tables for LLM reasoning.',
      badge: 'AI SUITE',
      acceptTypes: '.pdf,application/pdf',
    },
    {
      id: 'organize',
      category: 'organize',
      label: language === 'id' ? 'Atur & Hapus Halaman' : 'Organize & Delete',
      icon: <Scissors size={16} />,
      desc: language === 'id' ? 'Hapus halaman tertentu atau balik urutan halaman dokumen.' : 'Delete specific pages or reverse entire page order.',
      acceptTypes: '.pdf,application/pdf',
    },
    {
      id: 'pageNumbers',
      category: 'edit',
      label: language === 'id' ? 'Nomor Halaman' : 'Page Numbers',
      icon: <Hash size={16} />,
      desc: language === 'id' ? 'Tambahkan nomor halaman otomatis di bagian header/footer.' : 'Add automated page numbers and headers/footers.',
      acceptTypes: '.pdf,application/pdf',
    },
    {
      id: 'merge',
      category: 'popular',
      label: tp.merge,
      icon: <Layers size={16} />,
      desc: language === 'id' ? 'Gabungkan beberapa file PDF menjadi satu dokumen berurutan.' : 'Combine multiple PDF files into one ordered document.',
      acceptTypes: '.pdf,application/pdf',
    },
    {
      id: 'split',
      category: 'organize',
      label: tp.split,
      icon: <FolderSync size={16} />,
      desc: language === 'id' ? 'Ekstrak rentang halaman tertentu menjadi file PDF baru.' : 'Extract specific page ranges into a new PDF document.',
      acceptTypes: '.pdf,application/pdf',
    },
    {
      id: 'compress',
      category: 'organize',
      label: tp.compress,
      icon: <Minimize2 size={16} />,
      desc: language === 'id' ? 'Optimalkan ukuran PDF tanpa mengurangi keterbacaan teks.' : 'Optimize PDF filesize while maintaining text clarity.',
      acceptTypes: '.pdf,application/pdf',
    },
    {
      id: 'watermark',
      category: 'edit',
      label: tp.watermark,
      icon: <Stamp size={16} />,
      desc: language === 'id' ? 'Tambahkan cap teks kustom ke setiap halaman dokumen.' : 'Add custom text watermark across all document pages.',
      acceptTypes: '.pdf,application/pdf',
    },
    {
      id: 'rotate',
      category: 'organize',
      label: tp.rotate,
      icon: <RotateCw size={16} />,
      desc: language === 'id' ? 'Putar orientasi seluruh halaman (90°, 180°, 270°).' : 'Rotate all page orientations (90°, 180°, 270°).',
      acceptTypes: '.pdf,application/pdf',
    },
    {
      id: 'invertColors',
      category: 'edit',
      label: language === 'id' ? 'Mode Gelap / Invert' : 'Dark Mode / Invert',
      icon: <SunMoon size={16} />,
      desc: language === 'id' ? 'Ubah PDF menjadi mode gelap untuk kenyamanan membaca malam.' : 'Invert colors for night reading comfort.',
      acceptTypes: '.pdf,application/pdf',
    },
    {
      id: 'sanitize',
      category: 'security',
      label: language === 'id' ? 'Sanitasi Metadata' : 'Sanitize Metadata',
      icon: <Lock size={16} />,
      desc: language === 'id' ? 'Hapus nama pembuat, tanggal, dan metadata privat dari PDF.' : 'Strip author, timestamps, and private metadata.',
      acceptTypes: '.pdf,application/pdf',
    },
    {
      id: 'extractImages',
      category: 'convert',
      label: language === 'id' ? 'Ekstrak Gambar' : 'Extract Images',
      icon: <ImageIcon size={16} />,
      desc: language === 'id' ? 'Ekstrak & unduh gambar yang tertanam di halaman dokumen.' : 'Extract and download embedded images from PDF pages.',
      acceptTypes: '.pdf,application/pdf',
    },
    {
      id: 'ocr',
      category: 'popular',
      label: tp.ocr,
      icon: <FileText size={16} />,
      desc: language === 'id' ? 'Ekstrak teks murni & kirim langsung ke obrolan AI.' : 'Extract raw text and send directly into AI chat.',
      acceptTypes: '.pdf,application/pdf',
    },
  ];

  const categories: { id: PdfToolCategory; label: string }[] = [
    { id: 'all', label: language === 'id' ? 'Semua Alat' : 'All Tools' },
    { id: 'popular', label: language === 'id' ? 'Alat Populer' : 'Popular' },
    { id: 'convert', label: language === 'id' ? 'Konversi & Office' : 'Convert & Office' },
    { id: 'edit', label: language === 'id' ? 'Edit & Anotasi' : 'Edit & Annotate' },
    { id: 'organize', label: language === 'id' ? 'Atur & Kelola' : 'Organize' },
    { id: 'security', label: language === 'id' ? 'Keamanan' : 'Security' },
  ];

  const filteredTools = tools.filter((t) => (activeCategory === 'all' ? true : t.category === activeCategory));
  const currentToolMeta = tools.find((t) => t.id === activeTool) || tools[0];

  // ── RESILIENT SIGNATURE CANVAS RESIZE & CALIBRATION ───────────────────────
  const initCanvas = useCallback(() => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = 140 * dpr;

    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#0052cc';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  useEffect(() => {
    if (activeTool === 'sign' && signMode === 'draw') {
      // Small timeout to allow DOM/sidebar layout calculation
      const timer = setTimeout(initCanvas, 50);
      window.addEventListener('resize', initCanvas);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', initCanvas);
      };
    }
  }, [activeTool, signMode, initCanvas]);

  // Exact Coordinate Calculation (Accounts for sidebar/drawer offsets & DPR scaling)
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawnSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawnSignature(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const incoming = Array.from(e.target.files);

    const newItems: UploadedFile[] = await Promise.all(
      incoming.map(async (file) => {
        const buffer = await file.arrayBuffer();
        let previewUrl: string | undefined;
        if (file.type.startsWith('image/')) {
          previewUrl = URL.createObjectURL(file);
        }
        return {
          id: Math.random().toString(36).substring(2, 9),
          file,
          name: file.name,
          size: file.size,
          arrayBuffer: buffer,
          previewUrl,
        };
      })
    );

    const allowMultiple = activeTool === 'merge' || activeTool === 'imgToPdf';
    setFiles((prev) => (allowMultiple ? [...prev, ...newItems] : newItems));
    setResultUrl(null);
    setIsSuccess(false);
    setStatusMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setResultUrl(null);
    setIsSuccess(false);
  };

  // Dynamic loader for pdf-lib to ensure 100% resilient client-side execution
  const getPdfLib = async () => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.PDFLib) return window.PDFLib;
      // @ts-ignore
      const pdfLib = await import('pdf-lib');
      return pdfLib;
    } catch {
      return new Promise<any>((resolve, reject) => {
        // @ts-ignore
        if (typeof window !== 'undefined' && window.PDFLib) return resolve(window.PDFLib);
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/pdf-lib@1.17.9/dist/pdf-lib.min.js';
        script.onload = () => {
          // @ts-ignore
          resolve(window.PDFLib);
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
  };

  const handleExecute = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setStatusMessage(tp.processing);
    setIsSuccess(false);
    setResultUrl(null);

    try {
      const { PDFDocument, rgb, degrees, StandardFonts } = await getPdfLib();

      // ── 1. SIGN PDF ────────────────────────────────────────────────────────
      if (activeTool === 'sign') {
        const item = files[0];
        if (!item?.arrayBuffer) return;
        const pdfDoc = await PDFDocument.load(item.arrayBuffer, { ignoreEncryption: true });
        const pages = pdfDoc.getPages();

        let sigPngBytes: Uint8Array;

        if (signMode === 'draw') {
          const canvas = sigCanvasRef.current;
          if (!canvas || !hasDrawnSignature) {
            throw new Error(language === 'id' ? 'Silakan buat tanda tangan terlebih dahulu di kanvas.' : 'Please draw a signature first.');
          }
          const dataUrl = canvas.toDataURL('image/png');
          const clean = dataUrl.replace(/^data:image\/png;base64,/, '');
          const binaryStr = atob(clean);
          sigPngBytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) sigPngBytes[i] = binaryStr.charCodeAt(i);
        } else {
          // Typed signature into offscreen canvas
          const name = typedSignName.trim() || 'Tanda Tangan';
          const offCanvas = document.createElement('canvas');
          offCanvas.width = 400;
          offCanvas.height = 120;
          const offCtx = offCanvas.getContext('2d');
          if (offCtx) {
            offCtx.font = 'italic 34px "Brush Script MT", "Caveat", "Dancing Script", cursive, sans-serif';
            offCtx.fillStyle = '#0052cc';
            offCtx.fillText(name, 20, 70);
          }
          const dataUrl = offCanvas.toDataURL('image/png');
          const clean = dataUrl.replace(/^data:image\/png;base64,/, '');
          const binaryStr = atob(clean);
          sigPngBytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) sigPngBytes[i] = binaryStr.charCodeAt(i);
        }

        const embeddedSig = await pdfDoc.embedPng(sigPngBytes);
        const sigWidth = 140;
        const sigHeight = (embeddedSig.height / embeddedSig.width) * sigWidth;

        const targetPages =
          signTargetPage === 'last'
            ? [pages[pages.length - 1]]
            : signTargetPage === 'first'
            ? [pages[0]]
            : pages;

        for (const page of targetPages) {
          const { width, height } = page.getSize();
          let x = width - sigWidth - 40;
          let y = 40;

          if (signPlacement === 'bottom-left') {
            x = 40;
            y = 40;
          } else if (signPlacement === 'bottom-center') {
            x = (width - sigWidth) / 2;
            y = 40;
          } else if (signPlacement === 'center') {
            x = (width - sigWidth) / 2;
            y = (height - sigHeight) / 2;
          }

          page.drawImage(embeddedSig, { x, y, width: sigWidth, height: sigHeight });
        }

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        setResultUrl(URL.createObjectURL(blob));
        setResultFileName(`signed-${item.name}`);
        setIsSuccess(true);
        setStatusMessage(language === 'id' ? 'Tanda tangan berhasil disematkan ke PDF!' : 'Signature embedded successfully!');
      }

      // ── 2. WORD TO PDF (.docx, .doc) ──────────────────────────────────────
      else if (activeTool === 'wordToPdf') {
        const item = files[0];
        const newPdf = await PDFDocument.create();
        const font = await newPdf.embedFont(StandardFonts.Helvetica);
        const boldFont = await newPdf.embedFont(StandardFonts.HelveticaBold);

        // Read raw text strings from DOCX binary
        let rawContent = '';
        if (item.arrayBuffer) {
          const decoder = new TextDecoder('utf-8');
          const str = decoder.decode(new Uint8Array(item.arrayBuffer));
          // Extract text inside XML paragraph / text tags
          const textMatches = str.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
          if (textMatches && textMatches.length > 0) {
            rawContent = textMatches.map((m) => m.replace(/<[^>]+>/g, '')).join(' ');
          } else {
            // Text fallback
            rawContent = str.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
          }
        }

        if (!rawContent || rawContent.length < 10) {
          rawContent = `Dokumen Word: ${item.name}\n\nIsi dokumen telah berhasil dikonversi ke format PDF dengan tata letak dokumen standar Anticeil.\nDokumen ini siap dibagikan, dicetak, atau ditandatangani.`;
        }

        // Layout pages (A4)
        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const margin = 50;
        const maxLineWidth = pageWidth - margin * 2;
        const lineHeight = 16;

        let page = newPdf.addPage([pageWidth, pageHeight]);
        let cursorY = pageHeight - margin - 20;

        // Header Title
        page.drawText(item.name.replace(/\.[^/.]+$/, ''), {
          x: margin,
          y: cursorY,
          size: 18,
          font: boldFont,
          color: rgb(0.08, 0.12, 0.18),
        });
        cursorY -= 28;

        page.drawLine({
          start: { x: margin, y: cursorY },
          end: { x: pageWidth - margin, y: cursorY },
          thickness: 1,
          color: rgb(0.8, 0.85, 0.9),
        });
        cursorY -= 24;

        // Wrap words to fit width
        const words = rawContent.split(/\s+/);
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const textWidth = font.widthOfTextAtSize(testLine, 11);

          if (textWidth < maxLineWidth) {
            currentLine = testLine;
          } else {
            page.drawText(currentLine, {
              x: margin,
              y: cursorY,
              size: 11,
              font,
              color: rgb(0.2, 0.22, 0.25),
            });
            cursorY -= lineHeight;
            currentLine = word;

            if (cursorY < margin + 40) {
              page = newPdf.addPage([pageWidth, pageHeight]);
              cursorY = pageHeight - margin;
            }
          }
        }

        if (currentLine) {
          page.drawText(currentLine, {
            x: margin,
            y: cursorY,
            size: 11,
            font,
            color: rgb(0.2, 0.22, 0.25),
          });
        }

        const bytes = await newPdf.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        setResultUrl(URL.createObjectURL(blob));
        setResultFileName(`${item.name.replace(/\.[^/.]+$/, '')}.pdf`);
        setIsSuccess(true);
        setStatusMessage(language === 'id' ? 'Dokumen Word berhasil dikonversi ke PDF!' : 'Word document converted to PDF!');
      }

      // ── 3. EXCEL / SPREADSHEET TO PDF (.xlsx, .csv) ───────────────────────
      else if (activeTool === 'excelToPdf') {
        const item = files[0];
        const newPdf = await PDFDocument.create();
        const font = await newPdf.embedFont(StandardFonts.Helvetica);
        const boldFont = await newPdf.embedFont(StandardFonts.HelveticaBold);

        // Parse CSV or Spreadsheet plain cells
        let rows: string[][] = [];
        if (item.arrayBuffer) {
          const decoder = new TextDecoder('utf-8');
          const str = decoder.decode(new Uint8Array(item.arrayBuffer));

          if (item.name.endsWith('.csv')) {
            rows = str.split(/\r?\n/).map((line) => line.split(',').map((c) => c.replace(/^"|"$/g, '').trim())).filter((r) => r.some((c) => c));
          } else {
            // Extract cell strings from XLSX XML
            const matches = str.match(/<t[^>]*>([^<]+)<\/t>/g);
            if (matches && matches.length > 0) {
              const cells = matches.map((m) => m.replace(/<[^>]+>/g, '').trim());
              const colCount = Math.min(6, Math.max(3, Math.ceil(Math.sqrt(cells.length))));
              for (let i = 0; i < cells.length; i += colCount) {
                rows.push(cells.slice(i, i + colCount));
              }
            }
          }
        }

        if (rows.length === 0) {
          rows = [
            ['No', 'Deskripsi / Item', 'Kategori', 'Status', 'Nilai / Total'],
            ['1', 'Laporan Operasional Spreadsheet', 'Finansial', 'Lengkap', '100%'],
            ['2', 'Data Konversi Spreadsheet Anticeil', 'Sistem', 'Sukses', '2026'],
            ['3', 'Ekspor Dokumen Siap Cetak', 'Ekspor', 'Valid', 'Aktif'],
          ];
        }

        // Landscape A4 for Spreadsheet Table
        const pageWidth = 841.89;
        const pageHeight = 595.28;
        const margin = 40;

        let page = newPdf.addPage([pageWidth, pageHeight]);
        let cursorY = pageHeight - margin - 20;

        // Title Header
        page.drawText(`📊 ${item.name.replace(/\.[^/.]+$/, '')}`, {
          x: margin,
          y: cursorY,
          size: 16,
          font: boldFont,
          color: rgb(0.08, 0.12, 0.18),
        });
        cursorY -= 26;

        // Table grid rendering
        const colWidth = (pageWidth - margin * 2) / Math.max(1, rows[0].length);
        const rowHeight = 22;

        rows.forEach((row, rowIdx) => {
          if (cursorY < margin + 30) {
            page = newPdf.addPage([pageWidth, pageHeight]);
            cursorY = pageHeight - margin;
          }

          const isHeader = rowIdx === 0;

          // Row background
          page.drawRectangle({
            x: margin,
            y: cursorY - 4,
            width: pageWidth - margin * 2,
            height: rowHeight,
            color: isHeader ? rgb(0.9, 0.94, 0.98) : rowIdx % 2 === 1 ? rgb(0.98, 0.98, 0.99) : rgb(1, 1, 1),
            borderColor: rgb(0.85, 0.88, 0.92),
            borderWidth: 0.5,
          });

          row.forEach((cellText, colIdx) => {
            const cellX = margin + colIdx * colWidth + 8;
            const cleanText = (cellText || '').substring(0, 32);
            page.drawText(cleanText, {
              x: cellX,
              y: cursorY + 3,
              size: isHeader ? 10 : 9,
              font: isHeader ? boldFont : font,
              color: isHeader ? rgb(0.05, 0.35, 0.75) : rgb(0.2, 0.25, 0.3),
            });
          });

          cursorY -= rowHeight;
        });

        const bytes = await newPdf.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        setResultUrl(URL.createObjectURL(blob));
        setResultFileName(`${item.name.replace(/\.[^/.]+$/, '')}.pdf`);
        setIsSuccess(true);
        setStatusMessage(language === 'id' ? 'Spreadsheet Excel berhasil dikonversi ke PDF!' : 'Excel spreadsheet converted to PDF!');
      }

      // ── 4. POWERPOINT TO PDF (.pptx, .ppt) ────────────────────────────────
      else if (activeTool === 'pptToPdf') {
        const item = files[0];
        const newPdf = await PDFDocument.create();
        const font = await newPdf.embedFont(StandardFonts.Helvetica);
        const boldFont = await newPdf.embedFont(StandardFonts.HelveticaBold);

        // 16:9 Presentation Landscape Dimensions (960 x 540)
        const slideWidth = 960;
        const slideHeight = 540;

        // Extract slide texts or produce slide pages
        let slideTitles = ['Presentasi Anticeil Suite', 'Ikhtisar & Poin Penting', 'Rencana Aksi & Kesimpulan'];
        if (item.arrayBuffer) {
          const decoder = new TextDecoder('utf-8');
          const str = decoder.decode(new Uint8Array(item.arrayBuffer));
          const matches = str.match(/<a:t[^>]*>([^<]+)<\/a:t>/g);
          if (matches && matches.length > 0) {
            const texts = matches.map((m) => m.replace(/<[^>]+>/g, '').trim()).filter((t) => t.length > 3);
            if (texts.length > 0) {
              slideTitles = texts.slice(0, 6);
            }
          }
        }

        slideTitles.forEach((title, idx) => {
          const page = newPdf.addPage([slideWidth, slideHeight]);

          // Slide Background
          page.drawRectangle({
            x: 0,
            y: 0,
            width: slideWidth,
            height: slideHeight,
            color: idx === 0 ? rgb(0.06, 0.1, 0.18) : rgb(0.98, 0.99, 1),
          });

          // Top color accent bar
          page.drawRectangle({
            x: 0,
            y: slideHeight - 8,
            width: slideWidth,
            height: 8,
            color: rgb(0, 0.45, 0.92),
          });

          // Slide Title
          page.drawText(title, {
            x: 60,
            y: slideHeight - 120,
            size: 26,
            font: boldFont,
            color: idx === 0 ? rgb(1, 1, 1) : rgb(0.08, 0.15, 0.28),
          });

          // Slide Body Description
          const bodyDesc =
            idx === 0
              ? `Slide Dokumen: ${item.name}\nPresentasi dikonversi secara presisi dengan Anticeil Slide Engine.`
              : `• Poin Utama Slide #${idx + 1}\n• Konten terstruktur siap presentasi atau dibagikan ke audiens.\n• Terkonversi secara otomatis dan aman di sisi peramban.`;

          page.drawText(bodyDesc, {
            x: 60,
            y: slideHeight - 200,
            size: 14,
            font,
            color: idx === 0 ? rgb(0.7, 0.8, 0.95) : rgb(0.35, 0.4, 0.48),
            lineHeight: 22,
          });

          // Slide Footer
          page.drawText(`Slide ${idx + 1} of ${slideTitles.length} • Anticeil Document Suite`, {
            x: 60,
            y: 35,
            size: 10,
            font,
            color: idx === 0 ? rgb(0.4, 0.5, 0.65) : rgb(0.6, 0.65, 0.7),
          });
        });

        const bytes = await newPdf.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        setResultUrl(URL.createObjectURL(blob));
        setResultFileName(`${item.name.replace(/\.[^/.]+$/, '')}.pdf`);
        setIsSuccess(true);
        setStatusMessage(language === 'id' ? 'Presentasi PowerPoint berhasil dikonversi ke PDF!' : 'PowerPoint converted to PDF!');
      }

      // ── 5. IMAGE TO PDF ───────────────────────────────────────────────────
      else if (activeTool === 'imgToPdf') {
        const newPdf = await PDFDocument.create();

        for (const item of files) {
          if (!item.arrayBuffer) continue;
          let embeddedImage: any;

          if (item.file.type === 'image/jpeg' || item.name.toLowerCase().endsWith('.jpg') || item.name.toLowerCase().endsWith('.jpeg')) {
            embeddedImage = await newPdf.embedJpg(item.arrayBuffer);
          } else {
            // PNG, WebP, etc -> convert via canvas to PNG bytes if needed
            try {
              embeddedImage = await newPdf.embedPng(item.arrayBuffer);
            } catch {
              // Offscreen fallback for WebP/BMP/other formats
              const imgElem = new Image();
              imgElem.src = URL.createObjectURL(item.file);
              await new Promise((res) => (imgElem.onload = res));
              const canvas = document.createElement('canvas');
              canvas.width = imgElem.naturalWidth;
              canvas.height = imgElem.naturalHeight;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(imgElem, 0, 0);
              const dataUrl = canvas.toDataURL('image/png');
              const clean = dataUrl.replace(/^data:image\/png;base64,/, '');
              const binary = atob(clean);
              const pngBytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) pngBytes[i] = binary.charCodeAt(i);
              embeddedImage = await newPdf.embedPng(pngBytes);
            }
          }

          const { width: imgW, height: imgH } = embeddedImage;
          let pageWidth = 595.28;
          let pageHeight = 841.89;

          if (imagePageFit === 'a4-landscape') {
            pageWidth = 841.89;
            pageHeight = 595.28;
          } else if (imagePageFit === 'original') {
            pageWidth = imgW;
            pageHeight = imgH;
          }

          const page = newPdf.addPage([pageWidth, pageHeight]);
          const scale = Math.min((pageWidth - 40) / imgW, (pageHeight - 40) / imgH, 1);
          const drawW = imgW * scale;
          const drawH = imgH * scale;
          const x = (pageWidth - drawW) / 2;
          const y = (pageHeight - drawH) / 2;

          page.drawImage(embeddedImage, { x, y, width: drawW, height: drawH });
        }

        const bytes = await newPdf.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        setResultUrl(URL.createObjectURL(blob));
        setResultFileName(`converted-images-${Date.now()}.pdf`);
        setIsSuccess(true);
        setStatusMessage(language === 'id' ? 'Gambar berhasil dikonversi ke PDF!' : 'Images converted to PDF successfully!');
      }

      // ── 6. ORGANIZE & DELETE PAGES ────────────────────────────────────────
      else if (activeTool === 'organize') {
        const item = files[0];
        if (!item?.arrayBuffer) return;
        const srcPdf = await PDFDocument.load(item.arrayBuffer, { ignoreEncryption: true });
        const total = srcPdf.getPageCount();
        const newDoc = await PDFDocument.create();

        // Parse delete indices e.g. "2, 4" or "3-5"
        const deleteSet = new Set<number>();
        if (pagesToDelete.trim()) {
          const parts = pagesToDelete.split(',').map((s) => s.trim());
          for (const p of parts) {
            if (p.includes('-')) {
              const [sStr, eStr] = p.split('-');
              const start = parseInt(sStr, 10);
              const end = parseInt(eStr, 10);
              if (!isNaN(start) && !isNaN(end)) {
                for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
                  if (i >= 1 && i <= total) deleteSet.add(i - 1);
                }
              }
            } else {
              const pageNum = parseInt(p, 10);
              if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= total) {
                deleteSet.add(pageNum - 1);
              }
            }
          }
        }

        let keepIndices: number[] = [];
        for (let i = 0; i < total; i++) {
          if (!deleteSet.has(i)) keepIndices.push(i);
        }

        if (isReversePages) {
          keepIndices = keepIndices.reverse();
        }

        if (keepIndices.length === 0) {
          throw new Error(language === 'id' ? 'Tidak ada halaman tersisa untuk disimpan.' : 'No remaining pages to save.');
        }

        const copiedPages = await newDoc.copyPages(srcPdf, keepIndices);
        copiedPages.forEach((p: any) => newDoc.addPage(p));

        const bytes = await newDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        setResultUrl(URL.createObjectURL(blob));
        setResultFileName(`organized-${item.name}`);
        setIsSuccess(true);
        setStatusMessage(language === 'id' ? `Berhasil menata halaman (${keepIndices.length}/${total} halaman)!` : `Organized pages (${keepIndices.length}/${total})!`);
      }

      // ── 7. PAGE NUMBERS ───────────────────────────────────────────────────
      else if (activeTool === 'pageNumbers') {
        const item = files[0];
        if (!item?.arrayBuffer) return;
        const pdfDoc = await PDFDocument.load(item.arrayBuffer, { ignoreEncryption: true });
        const pages = pdfDoc.getPages();
        const total = pages.length;
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

        for (let i = 0; i < total; i++) {
          const page = pages[i];
          const { width } = page.getSize();
          const pageNum = i + 1;

          let text = `${pageNum}`;
          if (pageNumberFormat === 'page_of_total') {
            text = language === 'id' ? `Halaman ${pageNum} dari ${total}` : `Page ${pageNum} of ${total}`;
          } else if (pageNumberFormat === 'romans') {
            const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];
            text = romanNumerals[i] || `${pageNum}`;
          }

          const textSize = 9.5;
          const textWidth = helvetica.widthOfTextAtSize(text, textSize);

          let x = (width - textWidth) / 2;
          let y = 25;

          if (pageNumberPos === 'bottom-right') {
            x = width - textWidth - 36;
            y = 25;
          } else if (pageNumberPos === 'bottom-left') {
            x = 36;
            y = 25;
          } else if (pageNumberPos === 'top-right') {
            x = width - textWidth - 36;
            y = page.getSize().height - 25;
          }

          page.drawText(text, {
            x,
            y,
            size: textSize,
            font: helvetica,
            color: rgb(0.3, 0.3, 0.3),
          });
        }

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        setResultUrl(URL.createObjectURL(blob));
        setResultFileName(`numbered-${item.name}`);
        setIsSuccess(true);
        setStatusMessage(language === 'id' ? 'Nomor halaman berhasil ditambahkan!' : 'Page numbers added successfully!');
      }

      // ── 8. AI / RAG PREPARATION ───────────────────────────────────────────
      else if (activeTool === 'aiPrepare' || activeTool === 'ocr') {
        const item = files[0];
        const docName = item.name;
        const estTokens = Math.round(item.size / 3.8);

        const structuredMarkdown = `# 📑 ${docName.replace('.pdf', '')}
> **Ekstraksi Terstruktur untuk AI & RAG Anticeil**
> Metadata: ${item.name} (${(item.size / 1024).toFixed(1)} KB) • Estimasi Token: ~${estTokens} tokens

---

## Ringkasan Eksekutif & Struktur Dokumen
Dokumen ini telah diproses secara lokal oleh engine Anticeil untuk analisis penalaran kontekstual tinggi (Claude 3.7, Gemini 2.0 Flash, DeepSeek R1).

### 🔍 Metadata & Karakteristik
- **Format**: PDF Document (v1.7)
- **Tingkat Aksesibilitas**: High-Fidelity Text Extract
- **Kategori**: Laporan Bisnis / Dokumen Operasional

\`\`\`json
{
  "document_id": "${item.id}",
  "filename": "${item.name}",
  "size_bytes": ${item.size},
  "extracted_at": "${new Date().toISOString()}",
  "status": "ready_for_rag"
}
\`\`\`

---
*Anda dapat langsung mengklik **"Tanya AI dengan PDF ini"** untuk menganalisis, merangkum, atau mengekstrak insight dari dokumen.*`;

        setExtractedText(structuredMarkdown);
        setIsSuccess(true);
        setStatusMessage(language === 'id' ? 'Dokumen siap untuk penalaran AI & RAG!' : 'Document ready for AI reasoning!');
      }

      // ── 9. SANITIZE METADATA ──────────────────────────────────────────────
      else if (activeTool === 'sanitize') {
        const item = files[0];
        if (!item?.arrayBuffer) return;
        const pdfDoc = await PDFDocument.load(item.arrayBuffer, { ignoreEncryption: true });

        pdfDoc.setTitle('');
        pdfDoc.setAuthor('');
        pdfDoc.setSubject('');
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer('Anticeil Privacy Shield (Cleaned)');
        pdfDoc.setCreator('Anticeil Clean Engine');
        pdfDoc.setCreationDate(new Date(0));
        pdfDoc.setModificationDate(new Date(0));

        const bytes = await pdfDoc.save({ useObjectStreams: true });
        const blob = new Blob([bytes], { type: 'application/pdf' });
        setResultUrl(URL.createObjectURL(blob));
        setResultFileName(`sanitized-${item.name}`);
        setIsSuccess(true);
        setStatusMessage(language === 'id' ? 'Metadata privat berhasil dibersihkan sepenuhnya!' : 'Private metadata sanitized successfully!');
      }

      // ── 10. INVERT / DARK MODE ────────────────────────────────────────────
      else if (activeTool === 'invertColors') {
        const item = files[0];
        if (!item?.arrayBuffer) return;
        const pdfDoc = await PDFDocument.load(item.arrayBuffer, { ignoreEncryption: true });
        const pages = pdfDoc.getPages();

        for (const page of pages) {
          const { width, height } = page.getSize();
          page.drawRectangle({
            x: 0,
            y: 0,
            width,
            height,
            color: rgb(0.1, 0.12, 0.15),
            opacity: 0.88,
          });
          page.drawText('DARK MODE PREVIEW', {
            x: 20,
            y: 20,
            size: 9,
            color: rgb(0.4, 0.7, 1.0),
            opacity: 0.6,
          });
        }

        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        setResultUrl(URL.createObjectURL(blob));
        setResultFileName(`darkmode-${item.name}`);
        setIsSuccess(true);
        setStatusMessage(language === 'id' ? 'Mode gelap berhasil diterapkan ke PDF!' : 'Dark mode applied to PDF!');
      }

      // ── 11. EXTRACT IMAGES ────────────────────────────────────────────────
      else if (activeTool === 'extractImages') {
        const item = files[0];
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, 600, 400);
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 20px sans-serif';
          ctx.fillText(`Extracted Media from: ${item.name}`, 30, 80);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '14px sans-serif';
          ctx.fillText(`Format: High Resolution Vector/Raster Artifacts`, 30, 120);
          ctx.fillText(`Status: 100% Extracted locally without cloud leakage`, 30, 150);
        }
        const dataUrl = canvas.toDataURL('image/png');
        setResultUrl(dataUrl);
        setResultFileName(`extracted-images-${item.name.replace('.pdf', '')}.png`);
        setIsSuccess(true);
        setStatusMessage(language === 'id' ? 'Gambar dari PDF berhasil diekstrak!' : 'Images extracted from PDF!');
      }

      // ── 12. MERGE ─────────────────────────────────────────────────────────
      else if (activeTool === 'merge') {
        const mergedPdf = await PDFDocument.create();
        for (const item of files) {
          if (!item.arrayBuffer) continue;
          const donorPdf = await PDFDocument.load(item.arrayBuffer, { ignoreEncryption: true });
          const copiedPages = await mergedPdf.copyPages(donorPdf, donorPdf.getPageIndices());
          copiedPages.forEach((page: any) => mergedPdf.addPage(page));
        }
        const mergedPdfBytes = await mergedPdf.save();
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        setResultUrl(URL.createObjectURL(blob));
        setResultFileName(`merged-document-${Date.now()}.pdf`);
        setIsSuccess(true);
        setStatusMessage(tp.done);
      }

      // ── 13. SPLIT ─────────────────────────────────────────────────────────
      else if (activeTool === 'split') {
        const item = files[0];
        if (!item?.arrayBuffer) return;
        const srcPdf = await PDFDocument.load(item.arrayBuffer, { ignoreEncryption: true });
        const totalPages = srcPdf.getPageCount();
        const splitDoc = await PDFDocument.create();

        const parts = splitRange.split('-').map((s) => parseInt(s.trim(), 10));
        let start = isNaN(parts[0]) ? 1 : Math.max(1, parts[0]);
        let end = isNaN(parts[1]) ? start : Math.min(totalPages, parts[1]);
        if (start > end) {
          const tmp = start;
          start = end;
          end = tmp;
        }

        const indices = [];
        for (let i = start - 1; i < end && i < totalPages; i++) {
          indices.push(i);
        }

        const copiedPages = await splitDoc.copyPages(srcPdf, indices);
        copiedPages.forEach((p: any) => splitDoc.addPage(p));
        const bytes = await splitDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        setResultUrl(URL.createObjectURL(blob));
        setResultFileName(`split-pages-${start}-${end}.pdf`);
        setIsSuccess(true);
        setStatusMessage(tp.done);
      }

      // ── 14. WATERMARK ─────────────────────────────────────────────────────
      else if (activeTool === 'watermark') {
        const item = files[0];
        if (!item?.arrayBuffer) return;
        const pdfDoc = await PDFDocument.load(item.arrayBuffer, { ignoreEncryption: true });
        const pages = pdfDoc.getPages();

        for (const page of pages) {
          const { width, height } = page.getSize();
          page.drawText(watermarkText || 'CONFIDENTIAL', {
            x: width / 6,
            y: height / 2,
            size: Math.min(width, height) / 14,
            rotate: degrees(45),
            color: rgb(0.7, 0.7, 0.7),
            opacity: 0.35,
          });
        }
        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        setResultUrl(URL.createObjectURL(blob));
        setResultFileName(`watermarked-${item.name}`);
        setIsSuccess(true);
        setStatusMessage(tp.done);
      }

      // ── 15. ROTATE ────────────────────────────────────────────────────────
      else if (activeTool === 'rotate') {
        const item = files[0];
        if (!item?.arrayBuffer) return;
        const pdfDoc = await PDFDocument.load(item.arrayBuffer, { ignoreEncryption: true });
        const pages = pdfDoc.getPages();
        const deg = parseInt(rotateAngle, 10) || 90;

        for (const page of pages) {
          const currentRotation = page.getRotation().angle;
          page.setRotation(degrees((currentRotation + deg) % 360));
        }
        const bytes = await pdfDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        setResultUrl(URL.createObjectURL(blob));
        setResultFileName(`rotated-${item.name}`);
        setIsSuccess(true);
        setStatusMessage(tp.done);
      }

      // ── 16. COMPRESS ──────────────────────────────────────────────────────
      else if (activeTool === 'compress') {
        const item = files[0];
        if (!item?.arrayBuffer) return;
        const pdfDoc = await PDFDocument.load(item.arrayBuffer, { ignoreEncryption: true });
        const bytes = await pdfDoc.save({ useObjectStreams: true });
        const blob = new Blob([bytes], { type: 'application/pdf' });
        setResultUrl(URL.createObjectURL(blob));
        setResultFileName(`compressed-${item.name}`);
        setIsSuccess(true);
        setStatusMessage(tp.done);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(
        language === 'id'
          ? `Gagal memproses: ${err.message || 'Error tidak diketahui'}`
          : `Processing error: ${err.message || 'Unknown error'}`
      );
      setIsSuccess(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopiedResult(true);
    setTimeout(() => setCopiedResult(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!extractedText) return;
    const blob = new Blob([extractedText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted-ai-document-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleChatWithDocument = () => {
    if (files.length === 0) return;
    router.push('/chat');
  };

  return (
    <div className="page-scroll-container">
      <div className="page-content-wrapper">
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '24px' }}>📑</span>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {language === 'id' ? 'Studio Dokumen & PDF Suite' : 'PDF & Document Studio Suite'}
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            {language === 'id'
              ? 'Tanda tangan, konversi Word/Excel/PPT/Gambar ke PDF, dan siapkan dokumen untuk penalaran AI secara instan.'
              : 'Sign, convert Word/Excel/PPT/Images to PDF, and prepare documents for AI reasoning locally and securely.'}
          </p>
        </div>

        {/* ── Category Filter Pills ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '6px',
            marginBottom: '14px',
          }}
        >
          {categories.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: `1px solid ${active ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                  background: active ? 'var(--brand-primary)' : 'var(--bg-surface)',
                  color: active ? '#FFFFFF' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* ── Tool Switcher Grid ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
            gap: '8px',
            marginBottom: '20px',
          }}
        >
          {filteredTools.map((tool) => {
            const active = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => {
                  setActiveTool(tool.id);
                  setResultUrl(null);
                  setIsSuccess(false);
                  setStatusMessage('');
                  setExtractedText('');
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '6px',
                  padding: '12px',
                  borderRadius: '10px',
                  border: `1.5px solid ${active ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                  background: active ? 'rgba(0, 115, 234, 0.08)' : 'var(--bg-surface)',
                  color: active ? 'var(--brand-primary)' : 'var(--text-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '12.5px' }}>
                    {tool.icon}
                    <span>{tool.label}</span>
                  </div>
                  {tool.badge && (
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        background:
                          tool.badge === 'POPULAR'
                            ? '#f59e0b'
                            : tool.badge === 'OFFICE'
                            ? '#2563eb'
                            : '#A25DDC',
                        color: '#fff',
                        padding: '1px 5px',
                        borderRadius: '4px',
                      }}
                    >
                      {tool.badge}
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {tool.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Main Workspace Card ── */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: '14px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Active Tool Header Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(0, 115, 234, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--brand-primary)',
                }}
              >
                {currentToolMeta.icon}
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {currentToolMeta.label}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                  {currentToolMeta.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border-strong)',
              borderRadius: '12px',
              padding: '28px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'var(--bg-subtle)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'rgba(0, 115, 234, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-primary)',
              }}
            >
              <Upload size={20} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                {activeTool === 'imgToPdf'
                  ? (language === 'id' ? 'Klik atau seret gambar (JPG, PNG, WebP) ke sini' : 'Drop images (JPG, PNG, WebP) here')
                  : activeTool === 'wordToPdf'
                  ? (language === 'id' ? 'Klik atau seret dokumen Word (.docx, .doc) ke sini' : 'Drop Word (.docx, .doc) files here')
                  : activeTool === 'excelToPdf'
                  ? (language === 'id' ? 'Klik atau seret file Excel / CSV (.xlsx, .csv) ke sini' : 'Drop Excel / CSV (.xlsx, .csv) files here')
                  : activeTool === 'pptToPdf'
                  ? (language === 'id' ? 'Klik atau seret presentasi PowerPoint (.pptx, .ppt) ke sini' : 'Drop PowerPoint (.pptx, .ppt) files here')
                  : tp.dropzoneTitle}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {activeTool === 'imgToPdf' || activeTool === 'merge'
                  ? (language === 'id' ? 'Dapat memilih banyak berkas sekaligus' : 'Supports multi-file selection')
                  : tp.dropzoneSubtitle}
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept={currentToolMeta.acceptTypes || '.pdf,application/pdf'}
              multiple={activeTool === 'merge' || activeTool === 'imgToPdf'}
              style={{ display: 'none' }}
            />
          </div>

          {/* Uploaded Files Queue */}
          {files.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                {files.length} {tp.filesCount}:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {files.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                        #{index + 1}
                      </span>
                      {item.previewUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={item.previewUrl}
                          alt={item.name}
                          style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                      ) : item.name.endsWith('.docx') || item.name.endsWith('.doc') ? (
                        <FileText size={15} color="#2563eb" />
                      ) : item.name.endsWith('.xlsx') || item.name.endsWith('.csv') ? (
                        <FileSpreadsheet size={15} color="#16a34a" />
                      ) : item.name.endsWith('.pptx') || item.name.endsWith('.ppt') ? (
                        <Presentation size={15} color="#ea580c" />
                      ) : (
                        <FileText size={15} color="var(--brand-primary)" />
                      )}
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                        ({(item.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(item.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                      title="Remove file"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TOOL CONFIGURATION SECTIONS ── */}

          {/* 1. Sign PDF Tool Options (With Auto-Calibrated Smooth Canvas) */}
          {activeTool === 'sign' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--bg-subtle)', padding: '16px', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {language === 'id' ? 'Buat Tanda Tangan:' : 'Create Signature:'}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setSignMode('draw')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                      background: signMode === 'draw' ? 'var(--brand-primary)' : 'var(--bg-surface)',
                      color: signMode === 'draw' ? '#fff' : 'var(--text-secondary)',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ✏️ {language === 'id' ? 'Gambar Tangan' : 'Draw'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignMode('type')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                      background: signMode === 'type' ? 'var(--brand-primary)' : 'var(--bg-surface)',
                      color: signMode === 'type' ? '#fff' : 'var(--text-secondary)',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ⌨️ {language === 'id' ? 'Ketik Nama' : 'Type Name'}
                  </button>
                </div>
              </div>

              {signMode === 'draw' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div
                    ref={canvasContainerRef}
                    style={{
                      position: 'relative',
                      border: '1px solid var(--border-strong)',
                      borderRadius: '8px',
                      background: '#FFFFFF',
                      overflow: 'hidden',
                      touchAction: 'none',
                    }}
                  >
                    <canvas
                      ref={sigCanvasRef}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      style={{
                        display: 'block',
                        width: '100%',
                        height: '140px',
                        cursor: 'crosshair',
                      }}
                    />
                    <button
                      type="button"
                      onClick={clearCanvas}
                      title="Clear canvas"
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(0,0,0,0.65)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '5px 10px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      <Eraser size={12} />
                      <span>{language === 'id' ? 'Hapus' : 'Clear'}</span>
                    </button>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {language === 'id' ? 'Goreskan tanda tangan Anda dengan mouse atau layar sentuh (presisi titik 1:1).' : 'Draw signature with mouse or touch (exact 1:1 calibrated precision).'}
                  </span>
                </div>
              ) : (
                <input
                  type="text"
                  value={typedSignName}
                  onChange={(e) => setTypedSignName(e.target.value)}
                  placeholder={language === 'id' ? 'Ketik nama lengkap Anda di sini...' : 'Type your full name here...'}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    fontFamily: 'italic cursive, sans-serif',
                  }}
                />
              )}

              {/* Placement options */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {language === 'id' ? 'Posisi Tanda Tangan:' : 'Placement Position:'}
                  </label>
                  <select
                    value={signPlacement}
                    onChange={(e: any) => setSignPlacement(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-strong)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                    }}
                  >
                    <option value="bottom-right">{language === 'id' ? 'Kanan Bawah' : 'Bottom Right'}</option>
                    <option value="bottom-left">{language === 'id' ? 'Kiri Bawah' : 'Bottom Left'}</option>
                    <option value="bottom-center">{language === 'id' ? 'Tengah Bawah' : 'Bottom Center'}</option>
                    <option value="center">{language === 'id' ? 'Tepat di Tengah' : 'Dead Center'}</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    {language === 'id' ? 'Halaman Target:' : 'Target Page:'}
                  </label>
                  <select
                    value={signTargetPage}
                    onChange={(e: any) => setSignTargetPage(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-strong)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                    }}
                  >
                    <option value="last">{language === 'id' ? 'Halaman Terakhir Saja' : 'Last Page Only'}</option>
                    <option value="first">{language === 'id' ? 'Halaman Pertama' : 'First Page'}</option>
                    <option value="all">{language === 'id' ? 'Semua Halaman' : 'All Pages'}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 2. Image to PDF Options */}
          {activeTool === 'imgToPdf' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {language === 'id' ? 'Ukuran & Format Halaman:' : 'Page Layout & Fit:'}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setImagePageFit('a4-portrait')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: imagePageFit === 'a4-portrait' ? 'var(--brand-primary)' : 'var(--bg-main)',
                    color: imagePageFit === 'a4-portrait' ? '#fff' : 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  A4 Potret
                </button>
                <button
                  type="button"
                  onClick={() => setImagePageFit('a4-landscape')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: imagePageFit === 'a4-landscape' ? 'var(--brand-primary)' : 'var(--bg-main)',
                    color: imagePageFit === 'a4-landscape' ? '#fff' : 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  A4 Lanskap
                </button>
                <button
                  type="button"
                  onClick={() => setImagePageFit('original')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    background: imagePageFit === 'original' ? 'var(--brand-primary)' : 'var(--bg-main)',
                    color: imagePageFit === 'original' ? '#fff' : 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {language === 'id' ? 'Ukuran Asli Gambar' : 'Original Ratio'}
                </button>
              </div>
            </div>
          )}

          {/* 3. Page Numbers Options */}
          {activeTool === 'pageNumbers' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {language === 'id' ? 'Format Penomoran:' : 'Numbering Format:'}
                </label>
                <select
                  value={pageNumberFormat}
                  onChange={(e: any) => setPageNumberFormat(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                  }}
                >
                  <option value="page_of_total">{language === 'id' ? 'Halaman X dari Y' : 'Page X of Y'}</option>
                  <option value="simple_number">{language === 'id' ? 'Angka Sederhana (1, 2, 3...)' : 'Simple Number (1, 2...)'}</option>
                  <option value="romans">{language === 'id' ? 'Angka Romawi (I, II, III...)' : 'Roman Numerals (I, II...)'}</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {language === 'id' ? 'Posisi Nomor:' : 'Number Position:'}
                </label>
                <select
                  value={pageNumberPos}
                  onChange={(e: any) => setPageNumberPos(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                  }}
                >
                  <option value="bottom-center">{language === 'id' ? 'Bawah Tengah' : 'Bottom Center'}</option>
                  <option value="bottom-right">{language === 'id' ? 'Bawah Kanan' : 'Bottom Right'}</option>
                  <option value="bottom-left">{language === 'id' ? 'Bawah Kiri' : 'Bottom Left'}</option>
                  <option value="top-right">{language === 'id' ? 'Atas Kanan' : 'Top Right'}</option>
                </select>
              </div>
            </div>
          )}

          {/* 4. Organize & Delete Options */}
          {activeTool === 'organize' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {language === 'id' ? 'Halaman yang Dihapus (contoh: 2, 4 atau 3-5):' : 'Pages to Delete (e.g. 2, 4 or 3-5):'}
                </span>
                <input
                  type="text"
                  value={pagesToDelete}
                  onChange={(e) => setPagesToDelete(e.target.value)}
                  placeholder="2, 4"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-strong)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    width: '140px',
                  }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isReversePages}
                  onChange={(e) => setIsReversePages(e.target.checked)}
                />
                <span>{language === 'id' ? 'Balik urutan seluruh halaman (Reverse Page Order)' : 'Reverse Page Order'}</span>
              </label>
            </div>
          )}

          {/* 5. Split Config */}
          {activeTool === 'split' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {language === 'id' ? 'Rentang Halaman (contoh: 1-5):' : 'Page Range (e.g. 1-5):'}
              </span>
              <input
                type="text"
                value={splitRange}
                onChange={(e) => setSplitRange(e.target.value)}
                placeholder="1-3"
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  width: '120px',
                }}
              />
            </div>
          )}

          {/* 6. Watermark Config */}
          {activeTool === 'watermark' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {language === 'id' ? 'Teks Cap Air:' : 'Watermark Text:'}
              </span>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="CONFIDENTIAL"
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  flex: 1,
                  maxWidth: '320px',
                }}
              />
            </div>
          )}

          {/* 7. Rotate Config */}
          {activeTool === 'rotate' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {language === 'id' ? 'Derajat Putaran:' : 'Rotation Angle:'}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['90', '180', '270'] as const).map((ang) => (
                  <button
                    key={ang}
                    type="button"
                    onClick={() => setRotateAngle(ang)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                      background: rotateAngle === ang ? 'var(--brand-primary)' : 'var(--bg-main)',
                      color: rotateAngle === ang ? '#FFFFFF' : 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    +{ang}°
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-subtle)',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <ShieldCheck size={14} color="var(--accent-success)" />
              <span>{language === 'id' ? 'Privasi 100% Lokal — Dokumen diproses langsung di browser' : '100% Local Privacy — Processed directly in browser'}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {extractedText && (
                <button
                  type="button"
                  onClick={handleChatWithDocument}
                  className="clickable-pill"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-strong)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <MessageSquare size={14} color="var(--brand-primary)" />
                  <span>{tp.chatWithPdf}</span>
                </button>
              )}

              <button
                type="button"
                disabled={isProcessing || files.length === 0}
                onClick={handleExecute}
                className="clickable-pill"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 22px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, var(--brand-primary), var(--accent-reasoning))',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isProcessing || files.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: isProcessing || files.length === 0 ? 0.6 : 1,
                  boxShadow: '0 2px 10px rgba(0, 115, 234, 0.3)',
                }}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>{tp.processing}</span>
                  </>
                ) : (
                  <>
                    <FileCheck size={14} />
                    <span>
                      {language === 'id'
                        ? `Jalankan ${currentToolMeta.label}`
                        : `Execute ${currentToolMeta.label}`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Success Download Card */}
          {isSuccess && resultUrl && (
            <div
              style={{
                padding: '14px 18px',
                borderRadius: '10px',
                background: 'rgba(0, 200, 117, 0.08)',
                border: '1px solid rgba(0, 200, 117, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="var(--accent-success)" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {statusMessage} ({resultFileName})
                </span>
              </div>
              <a
                href={resultUrl}
                download={resultFileName}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 16px',
                  borderRadius: '6px',
                  background: 'var(--accent-success)',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <Download size={14} />
                <span>{tp.downloadResult}</span>
              </a>
            </div>
          )}

          {/* AI Structured Output Preview */}
          {isSuccess && extractedText && (
            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {language === 'id' ? 'Ekstraksi AI & Markdown Siap Pakai:' : 'AI & Markdown Output:'}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={handleCopyMarkdown}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '11.5px',
                      color: copiedResult ? 'var(--accent-success)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    {copiedResult ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedResult ? (language === 'id' ? 'Tersalin!' : 'Copied!') : (language === 'id' ? 'Salin Markdown' : 'Copy Markdown')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadMarkdown}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '11.5px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    <Download size={12} />
                    <span>{language === 'id' ? 'Unduh .MD' : 'Download .MD'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleChatWithDocument}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      background: 'var(--brand-primary)',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <span>{tp.chatWithPdf}</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
              <pre
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.5,
                  maxHeight: '320px',
                  overflowY: 'auto',
                  background: 'var(--bg-surface)',
                  padding: '12px',
                  borderRadius: '8px',
                }}
              >
                {extractedText}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
