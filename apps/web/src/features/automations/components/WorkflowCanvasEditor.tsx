'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  Play,
  Save,
  ArrowLeft,
  Plus,
  Clock,
  Sparkles,
  Mail,
  Calendar,
  FolderOpen,
  GitBranch,
  CheckCircle2,
  Loader2,
  Trash2,
  Sliders,
  Send,
  Zap,
  Map as MapIcon,
  X,
  ChevronDown,
  ChevronUp,
  Cloud,
  Terminal,
  Copy,
  Check,
  Radio,
  ExternalLink,
  ShieldCheck,
  Globe,
  Code2,
  Database,
  Timer,
  ArrowRightLeft,
  Sheet,
  HardDrive,
} from 'lucide-react';
import { nodeTypes } from './nodes';
import { NodeInspectorPanel } from './NodeInspectorPanel';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { useAutomationStore } from '../store/useAutomationStore';

interface WorkflowCanvasEditorProps {
  workflowId: string;
  workflowTitle: string;
  onBack: () => void;
  onSave?: (nodes: Node[], edges: Edge[]) => void;
}

// Initial Preset Template for Daily Calendar AI Briefing
const initialNodes: Node[] = [
  {
    id: 'node-trigger-1',
    type: 'triggerNode',
    position: { x: 50, y: 150 },
    measured: { width: 240, height: 110 },
    data: {
      title: 'Pemicu Jadwal Cron',
      triggerType: 'cron',
      schedule: 'Setiap hari pukul 08:00 WIB',
    },
  },
  {
    id: 'node-connector-cal',
    type: 'connectorNode',
    position: { x: 360, y: 80 },
    measured: { width: 240, height: 110 },
    data: {
      title: 'Ambil Agenda Google Calendar',
      connectorType: 'calendar',
      actionType: 'List Events for Today (08:00 - 20:00)',
    },
  },
  {
    id: 'node-ai-agent',
    type: 'aiAgentNode',
    position: { x: 680, y: 130 },
    measured: { width: 260, height: 140 },
    data: {
      title: 'AI Executive Briefing Synthesizer',
      provider: 'anthropic',
      model: 'claude-3-7-sonnet',
      promptSnippet: 'Analisis agenda hari ini, identifikasi bentrok, dan susun poin persiapan briefing...',
    },
  },
  {
    id: 'node-connector-tg',
    type: 'connectorNode',
    position: { x: 1020, y: 140 },
    measured: { width: 240, height: 110 },
    data: {
      title: 'Kirim Notifikasi Telegram',
      connectorType: 'telegram',
      actionType: 'Send Markdown Briefing to @Me',
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: 'node-trigger-1',
    target: 'node-connector-cal',
    animated: true,
    style: { stroke: '#D97706', strokeWidth: 2 },
  },
  {
    id: 'e2-3',
    source: 'node-connector-cal',
    target: 'node-ai-agent',
    animated: true,
    style: { stroke: '#1A73E8', strokeWidth: 2 },
  },
  {
    id: 'e3-4',
    source: 'node-ai-agent',
    target: 'node-connector-tg',
    animated: true,
    style: { stroke: '#7C3AED', strokeWidth: 2 },
  },
];

interface ExecutionTrace {
  nodeId: string;
  nodeTitle: string;
  nodeType: string;
  status: 'success' | 'failed';
  durationMs: number;
  output: any;
  timestamp: string;
}

export function WorkflowCanvasEditor({
  workflowId,
  workflowTitle,
  onBack,
  onSave,
}: WorkflowCanvasEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isSimulatingRun, setIsSimulatingRun] = useState(false);
  const [isRunningWorker, setIsRunningWorker] = useState(false);
  const [executionToast, setExecutionToast] = useState<string | null>(null);

  // Cloudflare Worker Live Execution Trace Modal & Webhook Drawer
  const [showTraceModal, setShowTraceModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [executionTraces, setExecutionTraces] = useState<ExecutionTrace[]>([]);
  const [totalExecutionTime, setTotalExecutionTime] = useState<number | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Responsive UI states
  const [isMobile, setIsMobile] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [isMiniMapOpen, setIsMiniMapOpen] = useState(true);

  const language = useSettingsStore((s) => s.language);
  const theme = useSettingsStore((s) => s.theme);
  const isDark = theme === 'dark';
  const setActiveWorkflow = useAutomationStore((s) => s.setActiveWorkflow);

  // Sync active workflow title to top App Bar Navbar
  useEffect(() => {
    setActiveWorkflow(workflowId, workflowTitle);
    return () => {
      setActiveWorkflow(null, null);
    };
  }, [workflowId, workflowTitle, setActiveWorkflow]);

  // Detect screen size on client
  useEffect(() => {
    const checkScreen = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsPaletteOpen(false);
        setIsMiniMapOpen(false);
      }
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: '#0073EA', strokeWidth: 2 },
          },
          eds
        )
      ),
    [setEdges]
  );

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  const handleUpdateNodeData = (key: string, value: any) => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, [key]: value } } : n))
    );
    setSelectedNode((prev) => (prev ? { ...prev, data: { ...prev.data, [key]: value } } : null));
  };

  const handleDeleteSelected = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  };

  const handleAddNode = (type: string) => {
    const id = `node_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    let newNode: Node;

    const offsetIdx = Math.max(0, nodes.length - 4);
    const posX = isMobile ? 60 : 200 + (offsetIdx % 3) * 320;
    const posY = isMobile ? 120 + offsetIdx * 130 : 280 + Math.floor(offsetIdx / 3) * 160;

    const nodeMap: Record<string, () => Node> = {
      trigger: () => ({
        id, type: 'triggerNode', position: { x: posX, y: posY }, measured: { width: 240, height: 110 },
        data: { title: 'Pemicu Otomatisasi', triggerType: 'manual', schedule: 'Eksekusi instan saat dipicu' },
      }),
      ai: () => ({
        id, type: 'aiAgentNode', position: { x: posX, y: posY }, measured: { width: 260, height: 140 },
        data: { title: 'AI Processing Agent', provider: 'anthropic', model: 'claude-3-7-sonnet', promptSnippet: 'Analisis dan lakukan pemrosesan data kontekstual...' },
      }),
      gmail: () => ({
        id, type: 'connectorNode', position: { x: posX, y: posY }, measured: { width: 240, height: 110 },
        data: { title: 'Konektor Gmail', connectorType: 'gmail', actionType: 'Create Draft Reply' },
      }),
      calendar: () => ({
        id, type: 'connectorNode', position: { x: posX, y: posY }, measured: { width: 240, height: 110 },
        data: { title: 'Konektor Google Calendar', connectorType: 'calendar', actionType: 'List Today Events' },
      }),
      drive: () => ({
        id, type: 'connectorNode', position: { x: posX, y: posY }, measured: { width: 240, height: 110 },
        data: { title: 'Konektor Google Drive', connectorType: 'drive', actionType: 'Search Files' },
      }),
      telegram: () => ({
        id, type: 'connectorNode', position: { x: posX, y: posY }, measured: { width: 240, height: 110 },
        data: { title: 'Konektor Telegram Bot', connectorType: 'telegram', actionType: 'Send Message Alert' },
      }),
      logic: () => ({
        id, type: 'logicNode', position: { x: posX, y: posY }, measured: { width: 240, height: 110 },
        data: { title: 'Pemeriksaan Kondisi', condition: 'output.priority === "HIGH"' },
      }),
      http: () => ({
        id, type: 'httpNode', position: { x: posX, y: posY }, measured: { width: 260, height: 120 },
        data: { title: 'HTTP Request', method: 'GET', url: 'https://api.example.com/data' },
      }),
      code: () => ({
        id, type: 'codeNode', position: { x: posX, y: posY }, measured: { width: 260, height: 130 },
        data: { title: 'Custom Code', language: 'javascript', codeSnippet: 'return items.map(i => i.data);' },
      }),
      database: () => ({
        id, type: 'databaseNode', position: { x: posX, y: posY }, measured: { width: 260, height: 120 },
        data: { title: 'Database Query', dbType: 'postgres', operation: 'select', table: 'users' },
      }),
      email: () => ({
        id, type: 'emailNode', position: { x: posX, y: posY }, measured: { width: 260, height: 120 },
        data: { title: 'Send Email', service: 'gmail', to: 'user@example.com', subject: 'Notifikasi Otomatis' },
      }),
      delay: () => ({
        id, type: 'delayNode', position: { x: posX, y: posY }, measured: { width: 220, height: 100 },
        data: { title: 'Delay / Wait', delayType: 'fixed', duration: '5', unit: 'minutes' },
      }),
      transform: () => ({
        id, type: 'transformNode', position: { x: posX, y: posY }, measured: { width: 260, height: 120 },
        data: { title: 'Data Transform', operation: 'map', expression: 'items.map(i => ({ ...i, processed: true }))' },
      }),
      spreadsheet: () => ({
        id, type: 'spreadsheetNode', position: { x: posX, y: posY }, measured: { width: 260, height: 120 },
        data: { title: 'Google Sheets', service: 'google-sheets', operation: 'read', sheetName: 'Sheet1' },
      }),
      storage: () => ({
        id, type: 'storageNode', position: { x: posX, y: posY }, measured: { width: 260, height: 120 },
        data: { title: 'Cloud Storage', provider: 'r2', operation: 'upload', bucket: 'assets' },
      }),
    };

    const factory = nodeMap[type];
    if (!factory) return;
    newNode = factory();

    setNodes((nds) => [...nds, newNode]);
    setIsPaletteOpen(false);
  };

  // Real Cloudflare Worker Edge Execution Runner
  const handleRunCloudflareWorker = async () => {
    setIsRunningWorker(true);
    setShowTraceModal(true);
    setExecutionTraces([]);
    setTotalExecutionTime(null);
    setExecutionToast('⚡ Mengirim payload DAG alur ke Cloudflare Worker Edge...');

    try {
      const res = await fetch('/api/automations/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId,
          workflowName: workflowTitle,
          triggerSource: 'manual',
          nodes,
          edges,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setExecutionTraces(data.traces || []);
        setTotalExecutionTime(data.totalDurationMs || 320);

        // Sequentially highlight nodes in canvas with green illumination
        for (const trace of data.traces || []) {
          setNodes((nds) =>
            nds.map((n) => (n.id === trace.nodeId ? { ...n, data: { ...n.data, isRunning: true } } : n))
          );
          await new Promise((r) => setTimeout(r, 400));
          setNodes((nds) =>
            nds.map((n) => (n.id === trace.nodeId ? { ...n, data: { ...n.data, isRunning: false } } : n))
          );
        }

        setExecutionToast(`✓ Alur berhasil dieksekusi di Cloudflare Worker (${data.totalDurationMs}ms)!`);
      } else {
        setExecutionToast(`✘ Eksekusi gagal: ${data.error}`);
      }
    } catch (err: any) {
      setExecutionToast(`✘ Network Error: ${err?.message}`);
    } finally {
      setIsRunningWorker(false);
      setTimeout(() => setExecutionToast(null), 4000);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(nodes, edges);
    }
    setExecutionToast('✓ Konfigurasi alur kerja visual berhasil disimpan!');
    setTimeout(() => setExecutionToast(null), 2500);
  };

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/automations/webhook/${workflowId}`
    : `https://anticeil.com/api/automations/webhook/${workflowId}`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <div
      style={{
        width: '100%',
        height: 'calc(100vh - 60px)',
        display: 'flex',
        flexDirection: 'column',
        background: isDark ? '#0B0F19' : '#FAF9F5',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Studio Responsive Navbar */}
      <div
        style={{
          height: isMobile ? '46px' : '50px',
          background: isDark ? '#141824' : '#FFFFFF',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E6E1D7',
          padding: isMobile ? '0 var(--studio-header-pad-x-mobile, 12px)' : '0 var(--studio-header-pad-x, 16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: isMobile ? '6px' : '10px',
          zIndex: 20,
          boxSizing: 'border-box',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {/* Left: Back Button + Worker Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '10px', minWidth: 0, flexShrink: 0 }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: isMobile ? '5px 8px' : '6px 12px',
              borderRadius: '8px',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2DED5',
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
              color: isDark ? '#E2E8F0' : '#475569',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            title={language === 'id' ? 'Kembali' : 'Back'}
          >
            <ArrowLeft size={14} />
            {!isMobile && <span>{language === 'id' ? 'Kembali' : 'Back'}</span>}
          </button>

          <span
            style={{
              fontSize: isMobile ? '10px' : '11px',
              fontWeight: 700,
              color: '#F38020',
              background: isDark ? 'rgba(243, 128, 32, 0.18)' : 'rgba(243, 128, 32, 0.08)',
              padding: isMobile ? '3px 7px' : '3px 10px',
              borderRadius: '9999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <Cloud size={11} /> {isMobile ? 'Worker' : '24/7 Cloudflare Worker'}
          </span>
        </div>

        {/* Right Action Controls (Ultra Compact on Mobile) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '6px', flexShrink: 0, marginLeft: 'auto' }}>
          {/* Webhook & Cron Settings Button */}
          <button
            type="button"
            onClick={() => setShowWebhookModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: isMobile ? '5px 8px' : '6px 10px',
              borderRadius: '8px',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2DED5',
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
              color: isDark ? '#CBD5E1' : '#475569',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            title="Webhook & Cron Settings"
          >
            <Radio size={13} color="#F38020" />
            {!isMobile && <span>Webhook</span>}
          </button>

          {/* MiniMap Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMiniMapOpen(!isMiniMapOpen)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: isMobile ? '5px 8px' : '6px 10px',
              borderRadius: '8px',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2DED5',
              background: isMiniMapOpen
                ? isDark ? 'rgba(0, 115, 234, 0.25)' : '#F1F5F9'
                : isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
              color: isMiniMapOpen
                ? isDark ? '#38BDF8' : '#0073EA'
                : isDark ? '#94A3B8' : '#64748B',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            title="Toggle MiniMap"
          >
            <MapIcon size={13} />
            {!isMobile && <span>Map</span>}
          </button>

          {/* Cloudflare Worker Real Run Button */}
          <button
            type="button"
            onClick={handleRunCloudflareWorker}
            disabled={isRunningWorker}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: isMobile ? '5px 9px' : '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #F38020 0%, #E55A00 100%)',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 700,
              cursor: isRunningWorker ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(243, 128, 32, 0.3)',
              opacity: isRunningWorker ? 0.7 : 1,
              whiteSpace: 'nowrap',
            }}
            title="Uji Eksekusi Alur Worker"
          >
            {isRunningWorker ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Zap size={13} />
            )}
            <span>{isMobile ? 'Uji' : (language === 'id' ? 'Uji Worker' : 'Run Worker')}</span>
          </button>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: isMobile ? '5px 10px' : '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--brand-primary, #0073EA)',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 115, 234, 0.25)',
              whiteSpace: 'nowrap',
            }}
          >
            <Save size={13} />
            <span>{language === 'id' ? 'Simpan' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Canvas React Flow Area */}
      <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2}
          style={{
            background: isDark ? '#0B0F19' : '#FAF9F5',
            width: '100%',
            height: '100%',
          }}
        >
          <Controls
            style={{
              borderRadius: '8px',
              overflow: 'hidden',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #CBD5E1',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          />

          {isMiniMapOpen && (
            <MiniMap
              nodeColor={(n) => {
                const colorMap: Record<string, string> = {
                  triggerNode: '#D97706',
                  logicNode: '#0891B2',
                  httpNode: '#3B82F6',
                  codeNode: '#10B981',
                  databaseNode: '#336791',
                  emailNode: '#EA4335',
                  delayNode: '#A855F7',
                  transformNode: '#0EA5E9',
                  spreadsheetNode: '#34A853',
                  storageNode: '#F59E0B',
                };
                if (n.type && colorMap[n.type]) return colorMap[n.type];
                if (n.type === 'aiAgentNode') {
                  const prov = (n.data?.provider as string) || '';
                  if (prov.includes('anthropic')) return '#7C3AED';
                  if (prov.includes('deepseek')) return '#2563EB';
                  if (prov.includes('groq')) return '#EA580C';
                  return '#16A34A';
                }
                if (n.type === 'connectorNode') {
                  const ctype = (n.data?.connectorType as string) || '';
                  if (ctype === 'gmail') return '#EA4335';
                  if (ctype === 'calendar') return '#1A73E8';
                  if (ctype === 'drive') return '#0F9D58';
                  if (ctype === 'telegram') return '#0088CC';
                }
                return '#0073EA';
              }}
              style={{
                borderRadius: 10,
                border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #CBD5E1',
                background: isDark ? '#141824' : '#FFFFFF',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                width: 190,
                height: 125,
              }}
              zoomable
              pannable
            />
          )}

          {/* Left Node Palette Panel */}
          <Panel position="top-left" style={{ margin: '14px' }}>
            <div
              style={{
                background: isDark ? 'rgba(20, 24, 36, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2DED5',
                borderRadius: '12px',
                padding: '12px',
                boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                width: isPaletteOpen ? (isMobile ? '200px' : '230px') : 'auto',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  paddingBottom: isPaletteOpen ? '6px' : 0,
                  borderBottom: isPaletteOpen ? (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #F1F5F9') : 'none',
                }}
                onClick={() => setIsPaletteOpen(!isPaletteOpen)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={14} color="#0073EA" />
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: isDark ? '#FFFFFF' : '#1E293B' }}>
                    {language === 'id' ? 'Tambah Blok Node' : 'Add Node'}
                  </span>
                </div>
                {isPaletteOpen ? <ChevronUp size={14} color={isDark ? '#94A3B8' : '#64748B'} /> : <ChevronDown size={14} color={isDark ? '#94A3B8' : '#64748B'} />}
              </div>

              {isPaletteOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: isMobile ? '55vh' : '65vh', overflowY: 'auto', paddingRight: '4px' }}>
                  {/* KATEGORI: Pemicu & Alur */}
                  <div>
                    <div style={{ fontSize: '9.5px', fontWeight: 800, color: isDark ? '#64748B' : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>Pemicu & Alur</div>
                    {[
                      { type: 'trigger', icon: <Clock size={13} />, label: 'Pemicu Cron / Webhook', bg: isDark ? 'rgba(217,119,6,0.15)' : '#FEF3C7', color: '#D97706' },
                      { type: 'logic', icon: <GitBranch size={13} />, label: 'Logika & Kondisi', bg: isDark ? 'rgba(8,145,178,0.15)' : '#CFFAFE', color: '#0891B2' },
                      { type: 'delay', icon: <Timer size={13} />, label: 'Delay / Wait', bg: isDark ? 'rgba(168,85,247,0.15)' : '#FAF5FF', color: '#A855F7' },
                    ].map((n) => (
                      <button key={n.type} type="button" onClick={() => handleAddNode(n.type)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '6px', border: 'none', background: n.bg, color: n.color, fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', textAlign: 'left' as const, width: '100%', marginBottom: '4px' }}>
                        {n.icon} {n.label}
                      </button>
                    ))}
                  </div>

                  {/* KATEGORI: AI & Kode */}
                  <div>
                    <div style={{ fontSize: '9.5px', fontWeight: 800, color: isDark ? '#64748B' : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>AI & Kode</div>
                    {[
                      { type: 'ai', icon: <Sparkles size={13} />, label: 'AI Reasoning Agent', bg: isDark ? 'rgba(124,58,237,0.15)' : '#F3E8FF', color: '#7C3AED' },
                      { type: 'code', icon: <Code2 size={13} />, label: 'Custom Code (JS/PY)', bg: isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5', color: '#10B981' },
                      { type: 'transform', icon: <ArrowRightLeft size={13} />, label: 'Data Transform', bg: isDark ? 'rgba(14,165,233,0.15)' : '#F0F9FF', color: '#0EA5E9' },
                    ].map((n) => (
                      <button key={n.type} type="button" onClick={() => handleAddNode(n.type)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '6px', border: 'none', background: n.bg, color: n.color, fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', textAlign: 'left' as const, width: '100%', marginBottom: '4px' }}>
                        {n.icon} {n.label}
                      </button>
                    ))}
                  </div>

                  {/* KATEGORI: Integrasi */}
                  <div>
                    <div style={{ fontSize: '9.5px', fontWeight: 800, color: isDark ? '#64748B' : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>Integrasi</div>
                    {[
                      { type: 'http', icon: <Globe size={13} />, label: 'HTTP Request', bg: isDark ? 'rgba(59,130,246,0.15)' : '#DBEAFE', color: '#3B82F6' },
                      { type: 'calendar', icon: <Calendar size={13} />, label: 'Google Calendar', bg: isDark ? 'rgba(26,115,232,0.15)' : '#E8F0FE', color: '#1A73E8' },
                      { type: 'gmail', icon: <Mail size={13} />, label: 'Gmail VIP Draft', bg: isDark ? 'rgba(234,67,53,0.15)' : '#FCE8E6', color: '#EA4335' },
                      { type: 'email', icon: <Mail size={13} />, label: 'Email (SendGrid/Resend)', bg: isDark ? 'rgba(234,67,53,0.1)' : '#FEF2F2', color: '#DC2626' },
                      { type: 'telegram', icon: <Send size={13} />, label: 'Telegram Bot Alert', bg: isDark ? 'rgba(0,136,204,0.15)' : '#E0F2FE', color: '#0088CC' },
                    ].map((n) => (
                      <button key={n.type} type="button" onClick={() => handleAddNode(n.type)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '6px', border: 'none', background: n.bg, color: n.color, fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', textAlign: 'left' as const, width: '100%', marginBottom: '4px' }}>
                        {n.icon} {n.label}
                      </button>
                    ))}
                  </div>

                  {/* KATEGORI: Data & Penyimpanan */}
                  <div>
                    <div style={{ fontSize: '9.5px', fontWeight: 800, color: isDark ? '#64748B' : '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>Data & Penyimpanan</div>
                    {[
                      { type: 'database', icon: <Database size={13} />, label: 'Database (PG/Mongo)', bg: isDark ? 'rgba(51,103,145,0.15)' : '#F0F9FF', color: '#336791' },
                      { type: 'spreadsheet', icon: <Sheet size={13} />, label: 'Spreadsheet / Sheets', bg: isDark ? 'rgba(52,168,83,0.15)' : '#F0FDF4', color: '#34A853' },
                      { type: 'storage', icon: <HardDrive size={13} />, label: 'Cloud Storage (S3/R2)', bg: isDark ? 'rgba(255,153,0,0.15)' : '#FFFBEB', color: '#F59E0B' },
                    ].map((n) => (
                      <button key={n.type} type="button" onClick={() => handleAddNode(n.type)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '6px', border: 'none', background: n.bg, color: n.color, fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', textAlign: 'left' as const, width: '100%', marginBottom: '4px' }}>
                        {n.icon} {n.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Panel>

          {/* Right Node Inspector Panel */}
          {selectedNode && (
            <Panel position="top-right" style={{ margin: '14px' }}>
              <NodeInspectorPanel
                node={selectedNode}
                isDark={isDark}
                isMobile={isMobile}
                language={language}
                onUpdateNodeData={handleUpdateNodeData}
                onDeleteNode={handleDeleteSelected}
                onClose={() => setSelectedNode(null)}
              />
            </Panel>
          )}
        </ReactFlow>

        {/* ── Cloudflare Worker Execution Trace Console Modal ── */}
        {showTraceModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(6px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '680px',
                maxHeight: '85vh',
                background: isDark ? '#111827' : '#FFFFFF',
                borderRadius: '16px',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '16px 20px',
                  background: isDark ? '#1F2937' : '#F8FAFC',
                  borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Terminal size={18} color="#F38020" />
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: isDark ? '#F9FAFB' : '#0F172A' }}>
                    Cloudflare Worker Execution Trace
                  </h3>
                  {totalExecutionTime && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#10B981',
                      }}
                    >
                      ✓ {totalExecutionTime}ms
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowTraceModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isDark ? '#9CA3AF' : '#64748B',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body: Steps Logs */}
              <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: isDark ? '#9CA3AF' : '#64748B' }}>
                    Worker: <strong>anticeil-automation-worker (Edge)</strong>
                  </span>
                  <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700 }}>
                    ● 24/7 Global CDN Active
                  </span>
                </div>

                {isRunningWorker && (
                  <div style={{ padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <Loader2 size={28} color="#F38020" className="animate-spin" />
                    <span style={{ fontSize: '13px', color: isDark ? '#D1D5DB' : '#475569', fontWeight: 600 }}>
                      Mengeksekusi alur DAG di Cloudflare Edge...
                    </span>
                  </div>
                )}

                {!isRunningWorker && executionTraces.length === 0 && (
                  <div style={{ padding: '20px', textAlign: 'center', color: isDark ? '#9CA3AF' : '#64748B', fontSize: '13px' }}>
                    Belum ada log eksekusi. Klik tombol &ldquo;Uji Cloudflare Worker&rdquo; untuk memulai.
                  </div>
                )}

                {executionTraces.map((trace, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: isDark ? '#1F2937' : '#F1F5F9',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #CBD5E1',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#10B981',
                            color: '#FFFFFF',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {idx + 1}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: isDark ? '#F9FAFB' : '#0F172A' }}>
                          {trace.nodeTitle}
                        </span>
                        <span style={{ fontSize: '10.5px', color: isDark ? '#9CA3AF' : '#64748B' }}>
                          ({trace.nodeType})
                        </span>
                      </div>

                      <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>
                        {trace.durationMs}ms
                      </span>
                    </div>

                    {/* Step Output Payload View */}
                    <div
                      style={{
                        background: isDark ? '#111827' : '#FFFFFF',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                        borderRadius: '6px',
                        padding: '8px 10px',
                        fontSize: '11.5px',
                        fontFamily: 'monospace',
                        color: isDark ? '#A5F3FC' : '#0369A1',
                        maxHeight: '100px',
                        overflowY: 'auto',
                      }}
                    >
                      {JSON.stringify(trace.output, null, 2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '12px 20px',
                  background: isDark ? '#1F2937' : '#F8FAFC',
                  borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowTraceModal(false)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    background: 'var(--brand-primary)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Tutup Konsol
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Inbound Webhook & 24/7 Cron Modal ── */}
        {showWebhookModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(6px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '600px',
                background: isDark ? '#111827' : '#FFFFFF',
                borderRadius: '16px',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cloud size={18} color="#F38020" />
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: isDark ? '#F9FAFB' : '#0F172A' }}>
                    Integrasi Webhook & Cron 24/7 Cloudflare
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWebhookModal(false)}
                  style={{ background: 'transparent', border: 'none', color: isDark ? '#9CA3AF' : '#64748B', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Webhook Endpoint Box */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: isDark ? '#E5E7EB' : '#374151' }}>
                  Endpoint Inbound Webhook (Trigger Eksternal):
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: isDark ? '#1F2937' : '#F1F5F9',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #CBD5E1',
                  }}
                >
                  <code style={{ fontSize: '11.5px', color: '#F38020', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {webhookUrl}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyWebhook}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: 'none',
                      background: copiedWebhook ? '#10B981' : 'var(--brand-primary)',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {copiedWebhook ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedWebhook ? 'Tersalin!' : 'Salin URL'}</span>
                  </button>
                </div>
              </div>

              {/* Cron Triggers Info */}
              <div
                style={{
                  background: isDark ? 'rgba(243, 128, 32, 0.1)' : '#FFF7ED',
                  border: '1px solid rgba(243, 128, 32, 0.25)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#C2410C' }}>
                  ⚡ Eksekusi Otomatis 24/7 Terpasang
                </span>
                <p style={{ fontSize: '11.5px', color: isDark ? '#FED7AA' : '#9A3412', margin: 0, lineHeight: 1.4 }}>
                  Alur ini dapat berjalan di jaringan Cloudflare Edge 24/7 meskipun browser/laptop Anda ditutup. Anda bisa mengatur jadwal via <code>wrangler.toml</code> atau memicu kapan saja via Webhook HTTP POST.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowWebhookModal(false)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    background: 'var(--brand-primary)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Execution Toast Notification */}
        {executionToast && (
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#1E293B',
              color: '#FFFFFF',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '12.5px',
              fontWeight: 600,
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              zIndex: 100,
              maxWidth: '90%',
              textAlign: 'center',
            }}
          >
            <Zap size={14} color="#F38020" style={{ flexShrink: 0 }} />
            <span>{executionToast}</span>
          </div>
        )}
      </div>
    </div>
  );
}
