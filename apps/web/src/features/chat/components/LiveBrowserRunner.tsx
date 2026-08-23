'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Lock,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  MousePointer,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  Sliders,
  Maximize2,
  Terminal,
  Activity,
  Zap,
  ExternalLink,
  ShieldCheck,
  Search,
  Plane,
  ShoppingCart,
  FileText,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { getTranslation } from '@anticeil/core';

interface StepLog {
  id: string;
  time: string;
  type: 'nav' | 'type' | 'click' | 'extract' | 'done';
  message: string;
}

export function LiveBrowserRunner() {
  const language = useSettingsStore((s) => s.language);
  const t = getTranslation(language);

  // Runner state
  const [url, setUrl] = useState('https://travel-agent.byok.ai/flights/search');
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [userControl, setUserControl] = useState(false);

  // Interactive Form State (for simulation)
  const [formData, setFormData] = useState({
    origin: 'Jakarta (CGK)',
    destination: 'Tokyo (HND)',
    date: '2026-10-15',
    passengers: '1 Adult',
  });

  // Simulated AI Cursor Position & Action Text
  const [cursorPos, setCursorPos] = useState({ x: 120, y: 140 });
  const [cursorAction, setCursorAction] = useState('Standby');
  const [isClicking, setIsClicking] = useState(false);

  // Live Thought Logs
  const [logs, setLogs] = useState<StepLog[]>([
    {
      id: '1',
      time: '00:01',
      type: 'nav',
      message: language === 'id' ? 'Membuka portal pemesanan tiket penerbangan...' : 'Navigating to flight booking portal...',
    },
    {
      id: '2',
      time: '00:03',
      type: 'type',
      message: language === 'id' ? 'Mendeteksi form input asal & tujuan dengan DOM parser...' : 'DOM parser detected origin & destination form inputs...',
    },
  ]);

  // Scenario Steps Definition
  const travelSteps = [
    {
      action: language === 'id' ? 'Mengetik kota asal...' : 'Typing origin city...',
      pos: { x: 140, y: 150 },
      log: language === 'id' ? 'Mengisi form kota asal: Jakarta (CGK)' : 'Filling origin input: Jakarta (CGK)',
      type: 'type' as const,
      formUpdate: { origin: 'Jakarta (CGK)' },
    },
    {
      action: language === 'id' ? 'Mengetik destinasi tujuan...' : 'Typing destination...',
      pos: { x: 320, y: 150 },
      log: language === 'id' ? 'Mengisi form tujuan: Tokyo (HND)' : 'Filling destination input: Tokyo (HND)',
      type: 'type' as const,
      formUpdate: { destination: 'Tokyo Haneda (HND)' },
    },
    {
      action: language === 'id' ? 'Memilih tanggal keberangkatan...' : 'Selecting departure date...',
      pos: { x: 200, y: 220 },
      log: language === 'id' ? 'Memilih jadwal: 15 Oktober 2026' : 'Selected date: 15 Oct 2026',
      type: 'click' as const,
      formUpdate: { date: '2026-10-15' },
    },
    {
      action: language === 'id' ? 'Mengklik tombol cari tiket...' : 'Clicking Search Deals button...',
      pos: { x: 320, y: 290 },
      log: language === 'id' ? 'Mengeklik tombol [Cari Penerbangan Termurah]' : 'Clicked [Search Best Flight Deals] button',
      type: 'click' as const,
      formUpdate: {},
    },
    {
      action: language === 'id' ? 'Mengekstrak 3 opsi tiket terbaik...' : 'Extracting top 3 flight deals...',
      pos: { x: 250, y: 350 },
      log: language === 'id' ? 'Ditemukan opsi terbaik: All Nippon Airways ($340)' : 'Extracted top deal: All Nippon Airways ($340)',
      type: 'done' as const,
      formUpdate: {},
    },
  ];

  // Simulation execution loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && !userControl) {
      if (currentStepIndex < travelSteps.length) {
        const step = travelSteps[currentStepIndex];
        setCursorPos(step.pos);
        setCursorAction(step.action);
        setIsClicking(true);

        timer = setTimeout(() => {
          setIsClicking(false);
          setFormData((prev) => ({ ...prev, ...step.formUpdate }));
          setLogs((prev) => [
            ...prev,
            {
              id: `${Date.now()}_${currentStepIndex}`,
              time: `00:0${(currentStepIndex + 2) * 2}`,
              type: step.type,
              message: step.log,
            },
          ]);
          setCurrentStepIndex((prev) => prev + 1);
        }, 1800);
      } else {
        setIsRunning(false);
        setCursorAction(language === 'id' ? 'Selesai ✓' : 'Task Completed ✓');
      }
    }
    return () => clearTimeout(timer);
  }, [isRunning, currentStepIndex, userControl, language]);

  const handleStartSimulation = () => {
    setCurrentStepIndex(0);
    setLogs([
      {
        id: 'start',
        time: '00:00',
        type: 'nav',
        message: language === 'id' ? 'Inisialisasi sesi CDP live browser agent...' : 'Initializing live CDP browser agent session...',
      },
    ]);
    setIsRunning(true);
    setUserControl(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setCurrentStepIndex(0);
    setCursorPos({ x: 120, y: 140 });
    setCursorAction('Standby');
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--bg-main)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* 1. Browser Chrome / Navigation & Address Bar */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        {/* Navigation Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <button
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
            }}
          >
            <ArrowLeft size={14} />
          </button>
          <button
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
            }}
          >
            <ArrowRight size={14} />
          </button>
          <button
            type="button"
            onClick={handleReset}
            title={t.buildMode.reload}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
            }}
          >
            <RotateCw size={13} className={isRunning ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Address Bar */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md, 6px)',
            padding: '4px 10px',
            fontSize: '12px',
            color: 'var(--text-primary)',
          }}
        >
          <Lock size={12} color="#10B981" style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '11.5px',
              color: 'var(--text-primary)',
              fontFamily: 'monospace',
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              fontWeight: 700,
              color: isRunning ? '#10B981' : 'var(--text-muted)',
              backgroundColor: isRunning ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-subtle)',
              padding: '2px 6px',
              borderRadius: '4px',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isRunning ? '#10B981' : '#64748B',
              }}
            />
            <span>{isRunning ? 'LIVE 60 FPS' : 'STANDBY'}</span>
          </div>
        </div>

        {/* Take Control / Manual Takeover Toggle */}
        <button
          type="button"
          onClick={() => setUserControl(!userControl)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 10px',
            borderRadius: 'var(--radius-md, 6px)',
            border: '1px solid',
            borderColor: userControl ? 'var(--brand-primary)' : 'var(--border-subtle)',
            backgroundColor: userControl ? 'rgba(0, 115, 234, 0.15)' : 'var(--bg-main)',
            color: userControl ? 'var(--brand-primary)' : 'var(--text-secondary)',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <MousePointer size={13} />
          <span className="hide-on-mobile">
            {userControl
              ? language === 'id'
                ? 'Kembalikan ke AI'
                : 'Release Control'
              : language === 'id'
                ? 'Ambil Alih'
                : 'Take Control'}
          </span>
        </button>
      </div>

      {/* 2. Main Live Viewport Canvas (Simulated Browser Screen) */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-main)',
          position: 'relative',
          overflow: 'hidden',
          padding: '16px',
        }}
      >
        {/* Mock Target Website Screen */}
        <div
          style={{
            flex: 1,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Target Web Header */}
          <div
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plane size={16} color="var(--brand-primary)" />
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                AeroBook AI — Live Booking Portal
              </span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CDP Mode: Active Session</span>
          </div>

          {/* Target Web Form & Content */}
          <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
            <div style={{ maxWidth: '460px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {language === 'id' ? 'Pencarian Tiket Otomatis' : 'Autonomous Flight Booking Search'}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  {language === 'id'
                    ? 'AI Agent sedang memindai rute dan mengisi parameter secara real-time.'
                    : 'AI Agent is scanning routes and filling parameters automatically.'}
                </p>
              </div>

              {/* Form Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Origin (Dari)
                  </label>
                  <input
                    type="text"
                    value={formData.origin}
                    readOnly={!userControl}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      backgroundColor: 'var(--bg-main)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Destination (Ke)
                  </label>
                  <input
                    type="text"
                    value={formData.destination}
                    readOnly={!userControl}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      backgroundColor: 'var(--bg-main)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Departure Date
                  </label>
                  <input
                    type="text"
                    value={formData.date}
                    readOnly={!userControl}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      backgroundColor: 'var(--bg-main)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Passengers
                  </label>
                  <input
                    type="text"
                    value={formData.passengers}
                    readOnly={!userControl}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      backgroundColor: 'var(--bg-main)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                style={{
                  marginTop: '6px',
                  padding: '10px',
                  backgroundColor: 'var(--brand-primary)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Search size={14} />
                <span>{language === 'id' ? 'Cari Tiket Penerbangan Termurah' : 'Search Best Deals'}</span>
              </button>
            </div>
          </div>

          {/* 🌟 Animated AI Agent Cursor Overlay */}
          <div
            style={{
              position: 'absolute',
              top: `${cursorPos.y}px`,
              left: `${cursorPos.x}px`,
              transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              pointerEvents: 'none',
              zIndex: 50,
              display: userControl ? 'none' : 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            {/* Pointer Arrow */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MousePointer
                size={20}
                color="#38BDF8"
                style={{
                  fill: 'var(--brand-primary)',
                  transform: isClicking ? 'scale(0.85)' : 'scale(1)',
                  transition: 'transform 0.15s ease',
                  filter: 'drop-shadow(0 2px 8px rgba(0, 115, 234, 0.8))',
                }}
              />
              {isClicking && (
                <span
                  style={{
                    position: 'absolute',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    border: '2px solid #38BDF8',
                    animation: 'ping 0.8s cubic-bezier(0, 0, 0.2, 1) infinite',
                  }}
                />
              )}
            </div>

            {/* Action Tooltip Pill */}
            <div
              style={{
                marginLeft: '14px',
                marginTop: '-4px',
                backgroundColor: 'rgba(0, 115, 234, 0.95)',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(4px)',
              }}
            >
              🤖 {cursorAction}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Execution Controls & Step Log Timeline */}
      <div
        style={{
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={isRunning ? () => setIsRunning(false) : handleStartSimulation}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                backgroundColor: isRunning ? 'var(--accent-danger)' : 'var(--brand-primary)',
                border: 'none',
                borderRadius: 'var(--radius-md, 6px)',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {isRunning ? <Pause size={13} /> : <Play size={13} />}
              <span>
                {isRunning
                  ? language === 'id'
                    ? 'Jeda Agent'
                    : 'Pause Agent'
                  : language === 'id'
                    ? 'Jalankan Automasi Agent'
                    : 'Run Agent Task'}
              </span>
            </button>

            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {isRunning
                ? language === 'id'
                  ? '⚡ Agent sedang mengeksekusi otomatis...'
                  : '⚡ Agent actively automating...'
                : language === 'id'
                  ? 'Klik Jalankan untuk memutar simulasi aksi live'
                  : 'Click Run to preview autonomous action'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <Activity size={13} color="#10B981" />
            <span>WebSocket CDP Stream</span>
          </div>
        </div>

        {/* Live Step Logs Feed */}
        <div
          style={{
            maxHeight: '75px',
            overflowY: 'auto',
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '6px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          {logs.map((log) => (
            <div
              key={log.id}
              style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: log.type === 'done' ? '#10B981' : 'var(--text-secondary)',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>[{log.time}]</span>
              <span>{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
