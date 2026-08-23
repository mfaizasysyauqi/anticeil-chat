'use client';

import React, { useState } from 'react';
import {
  FileText,
  Table,
  Presentation,
  Download,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

export type DocumentType = 'pdf' | 'xlsx' | 'docx' | 'pptx' | 'csv';

interface DocumentViewerProps {
  type: DocumentType;
  title: string;
  data?: any;
  onClose?: () => void;
}

export function DocumentViewer({ type, title, data }: DocumentViewerProps) {
  const language = useSettingsStore((s) => s.language);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeSheet, setActiveSheet] = useState('Revenue Model');
  const [activeSlide, setActiveSlide] = useState(1);
  const [copied, setCopied] = useState(false);

  // 1. Spreadsheet Sample Dataset
  const spreadsheetData = {
    sheets: ['Revenue Model', 'Operational Cost', 'Growth Projections'],
    headers: ['A: Item Description', 'B: Q1 2026', 'C: Q2 2026', 'D: Q3 2026', 'E: Q4 2026', 'F: Total ARR'],
    rows: [
      ['Enterprise BYOK Licenses', '$142,500', '$185,000', '$240,000', '$310,000', '$877,500'],
      ['Team Tier Subscriptions', '$48,200', '$62,400', '$79,800', '$98,600', '$289,000'],
      ['Custom Connector Add-ons', '$18,900', '$24,500', '$32,100', '$41,000', '$116,500'],
      ['Agent Automation Pipelines', '$34,000', '$45,000', '$61,200', '$78,900', '$219,100'],
      ['Gross Operating Revenue', '$243,600', '$316,900', '$413,100', '$528,500', '$1,502,100'],
      ['Infrastructure Cost (Zero-Proxy)', '($12,400)', '($15,200)', '($19,800)', '($24,000)', '($71,400)'],
      ['Net Margin (EBITDA)', '$231,200 (94.9%)', '$301,700 (95.2%)', '$393,300 (95.2%)', '$504,500 (95.4%)', '$1,430,700 (95.2%)'],
    ],
  };

  // 2. Slide Deck Presentation Sample Data
  const slides = [
    {
      num: 1,
      title: 'Anticeil: The Private-First AI OS',
      subtitle: 'Client-Side BYOK Platform with Live Autonomous Browser Agents',
      bullets: [
        'Zero-telemetry architecture: API keys stay in localStorage',
        'Direct connection to OpenAI, Anthropic, Gemini, Groq, DeepSeek & Ollama',
        'Interactive Canvas with live code execution & document analysis',
      ],
      tag: 'Executive Vision',
    },
    {
      num: 2,
      title: 'Why Client-Side BYOK Matters',
      subtitle: 'Addressing Enterprise Data Leakage & Cloud Proxy Latency',
      bullets: [
        '90% savings compared to bundled subscription markups',
        'Compliance-ready: No intermediate server storing chat records',
        'Ultra-low latency direct WebSocket & HTTP/2 streaming',
      ],
      tag: 'Market Problem & Solution',
    },
    {
      num: 3,
      title: 'Automated Agent Browser & Live Canvas',
      subtitle: 'Realtime Form Filling, Navigation & Instant Sandbox Execution',
      bullets: [
        '60 FPS CDP stream with live thought timeline',
        'Full document viewer (PDF, DOCX, XLSX, PPTX)',
        'Native multi-agent orchestration via MCP Connectors',
      ],
      tag: 'Product Architecture',
    },
  ];

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      {/* 1. Document Toolbar */}
      <div
        style={{
          padding: '8px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '12px',
        }}
      >
        {/* Left: Doc Icon & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {type === 'pdf' && <FileText size={16} color="#EF4444" />}
          {type === 'xlsx' && <Table size={16} color="#10B981" />}
          {type === 'docx' && <FileText size={16} color="#3B82F6" />}
          {type === 'pptx' && <Presentation size={16} color="#F59E0B" />}
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
          <span
            style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            {type}
          </span>
        </div>

        {/* Center: Page / Zoom / Search Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {type === 'pdf' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex' }}
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Page {currentPage} of 4</span>
              <button
                type="button"
                disabled={currentPage >= 4}
                onClick={() => setCurrentPage((p) => Math.min(4, p + 1))}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {type === 'pptx' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
              <button
                type="button"
                disabled={activeSlide <= 1}
                onClick={() => setActiveSlide((s) => Math.max(1, s - 1))}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex' }}
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Slide {activeSlide} of {slides.length}</span>
              <button
                type="button"
                disabled={activeSlide >= slides.length}
                onClick={() => setActiveSlide((s) => Math.min(slides.length, s + 1))}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex' }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Zoom In/Out */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(50, z - 15))}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '32px', textAlign: 'center' }}>{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(200, z + 15))}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={handleCopy}
            title="Copy Content"
            style={{
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-subtle)',
              color: copied ? 'var(--accent-success)' : 'var(--text-secondary)',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            title="Download Document"
            style={{
              border: '1px solid var(--border-subtle)',
              background: 'var(--brand-primary)',
              color: '#FFFFFF',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Download size={12} />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* 2. Main Document Viewport */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px',
          backgroundColor: 'var(--bg-subtle)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        {/* Render Document based on type */}
        {type === 'pdf' && (
          <div
            style={{
              width: `${(620 * zoom) / 100}px`,
              maxWidth: '100%',
              minHeight: '800px',
              backgroundColor: '#FFFFFF',
              color: '#1E293B',
              borderRadius: '6px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)',
              padding: '48px',
              fontFamily: "'Inter', sans-serif",
              lineHeight: 1.6,
              transformOrigin: 'top center',
            }}
          >
            <div style={{ borderBottom: '2px solid #0284C7', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Technical Architecture Whitepaper
                </h1>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                  Client-Side Multimodal Intelligence & Local Privacy Guarantees
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: '#E0F2FE', color: '#0369A1', padding: '3px 8px', borderRadius: '4px' }}>
                CONFIDENTIAL • Q3 2026
              </span>
            </div>

            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginTop: '16px', marginBottom: '8px' }}>
              1. Executive Summary
            </h2>
            <p style={{ fontSize: '12.5px', color: '#334155', margin: 0, textAlign: 'justify' }}>
              Anticeil operates on a 100% decentralized, zero-telemetry paradigm. All LLM API communications originate directly from the end-user’s browser runtime to provider endpoints (OpenAI, Anthropic Claude, Google Gemini, Groq, and local Ollama instances) without routing through intermediary reverse proxies.
            </p>

            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginTop: '20px', marginBottom: '8px' }}>
              2. Security & Data Integrity Verification
            </h2>
            <p style={{ fontSize: '12.5px', color: '#334155', margin: 0, textAlign: 'justify' }}>
              Cryptographic keys are stored exclusively in client-side secure persistent storage with AES encryption. Session state and chat histories remain strictly local.
            </p>

            <div style={{ marginTop: '24px', padding: '14px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                Key Benchmark Findings:
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
                <li>Zero additional latency overhead vs direct cURL requests</li>
                <li>Full compliance with strict corporate data governance policies</li>
                <li>Instant offline caching and persistent workspace history</li>
              </ul>
            </div>
          </div>
        )}

        {type === 'xlsx' && (
          <div
            style={{
              width: '100%',
              maxWidth: '900px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '8px',
              border: '1px solid var(--border-strong)',
              boxShadow: 'var(--shadow-md)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Formula Bar */}
            <div
              style={{
                padding: '8px 12px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--bg-subtle)',
                fontSize: '12px',
              }}
            >
              <span style={{ fontWeight: 700, color: 'var(--brand-primary)', fontFamily: 'monospace' }}>fx</span>
              <input
                type="text"
                readOnly
                value="=SUM(B2:E2) * (1 - 0.05)"
                style={{
                  flex: 1,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  outline: 'none',
                }}
              />
            </div>

            {/* Grid Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '8px 10px', width: '36px', color: 'var(--text-muted)', borderRight: '1px solid var(--border-subtle)', textAlign: 'center' }}>#</th>
                    {spreadsheetData.headers.map((h, i) => (
                      <th key={i} style={{ padding: '8px 12px', color: 'var(--text-primary)', fontWeight: 600, borderRight: '1px solid var(--border-subtle)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {spreadsheetData.rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: rIdx % 2 === 0 ? 'transparent' : 'var(--bg-subtle)',
                      }}
                    >
                      <td style={{ padding: '8px 10px', color: 'var(--text-muted)', borderRight: '1px solid var(--border-subtle)', textAlign: 'center', fontFamily: 'monospace' }}>
                        {rIdx + 1}
                      </td>
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          style={{
                            padding: '8px 12px',
                            color: cell.includes('(') ? '#EF4444' : rIdx === 4 || rIdx === 6 ? 'var(--brand-primary)' : 'var(--text-primary)',
                            fontWeight: rIdx === 4 || rIdx === 6 ? 700 : 400,
                            borderRight: '1px solid var(--border-subtle)',
                            fontFamily: cIdx > 0 ? 'monospace' : 'inherit',
                          }}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sheets Footer Tabs */}
            <div
              style={{
                padding: '6px 12px',
                borderTop: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-subtle)',
                display: 'flex',
                gap: '4px',
              }}
            >
              {spreadsheetData.sheets.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setActiveSheet(s)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: activeSheet === s ? 'var(--border-strong)' : 'transparent',
                    backgroundColor: activeSheet === s ? 'var(--bg-surface)' : 'transparent',
                    color: activeSheet === s ? 'var(--brand-primary)' : 'var(--text-muted)',
                    fontSize: '11.5px',
                    fontWeight: activeSheet === s ? 600 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {type === 'docx' && (
          <div
            style={{
              width: `${(620 * zoom) / 100}px`,
              maxWidth: '100%',
              backgroundColor: '#FFFFFF',
              color: '#1E293B',
              borderRadius: '6px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)',
              padding: '48px',
              fontFamily: "'Inter', sans-serif",
              lineHeight: 1.6,
            }}
          >
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              Project Scope of Work & Deliverables
            </h1>
            <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '24px' }}>
              Prepared for Engineering Stakeholders • Status: Approved
            </div>

            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', marginTop: '20px', marginBottom: '8px' }}>
              1. Project Objectives
            </h2>
            <p style={{ fontSize: '13px', color: '#334155', margin: 0, textAlign: 'justify' }}>
              This document outlines the milestones and release criteria for integrating multimodal visual generation and browser-based agent task automation into the Anticeil suite.
            </p>

            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', marginTop: '20px', marginBottom: '8px' }}>
              2. Core Deliverables Matrix
            </h2>
            <div style={{ marginTop: '10px', border: '1px solid #E2E8F0', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', backgroundColor: '#F1F5F9', padding: '8px 12px', fontWeight: 700, fontSize: '12px', color: '#0F172A' }}>
                <span>Phase</span>
                <span>Feature Set</span>
                <span>Timeline</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', padding: '8px 12px', borderTop: '1px solid #E2E8F0', fontSize: '12px', color: '#334155' }}>
                <span style={{ fontWeight: 600 }}>Phase 1</span>
                <span>Canvas Live Runner & Form Automation</span>
                <span>Completed</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', padding: '8px 12px', borderTop: '1px solid #E2E8F0', fontSize: '12px', color: '#334155' }}>
                <span style={{ fontWeight: 600 }}>Phase 2</span>
                <span>Multi-Format Document Viewer (PDF/XLSX/DOCX/PPTX)</span>
                <span>Active</span>
              </div>
            </div>
          </div>
        )}

        {type === 'pptx' && (
          <div
            style={{
              width: `${(680 * zoom) / 100}px`,
              maxWidth: '100%',
              aspectRatio: '16 / 9',
              backgroundColor: '#0F172A',
              color: '#F8FAFC',
              borderRadius: '12px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              padding: '36px 44px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Slide Header */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#38BDF8' }}>
                  {slides[activeSlide - 1].tag}
                </span>
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  Slide {activeSlide} / {slides.length}
                </span>
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', margin: 0, lineHeight: 1.3 }}>
                {slides[activeSlide - 1].title}
              </h1>
              <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '6px', marginBottom: '20px' }}>
                {slides[activeSlide - 1].subtitle}
              </p>
            </div>

            {/* Slide Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {slides[activeSlide - 1].bullets.map((b, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0EA5E9' }} />
                  <span style={{ fontSize: '13.5px', color: '#E2E8F0' }}>{b}</span>
                </div>
              ))}
            </div>

            {/* Slide Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '11px', color: '#64748B' }}>Anticeil Next-Gen AI Workspace</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {slides.map((_, sIdx) => (
                  <div
                    key={sIdx}
                    onClick={() => setActiveSlide(sIdx + 1)}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: activeSlide === sIdx + 1 ? '#38BDF8' : '#334155',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
