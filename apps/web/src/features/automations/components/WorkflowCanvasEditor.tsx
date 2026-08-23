'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Panel,
  BackgroundVariant,
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
} from 'lucide-react';
import { nodeTypes } from './nodes';
import { useSettingsStore } from '../../settings/store/useSettingsStore';

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
  const [executionToast, setExecutionToast] = useState<string | null>(null);

  // Responsive UI states
  const [isMobile, setIsMobile] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [isMiniMapOpen, setIsMiniMapOpen] = useState(true);

  const language = useSettingsStore((s) => s.language);

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

  const handleAddNode = (type: 'trigger' | 'ai' | 'gmail' | 'calendar' | 'drive' | 'telegram' | 'logic') => {
    const id = `node_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    let newNode: Node;

    const posX = isMobile ? 80 : 150 + Math.random() * 150;
    const posY = isMobile ? 120 : 100 + Math.random() * 150;

    switch (type) {
      case 'trigger':
        newNode = {
          id,
          type: 'triggerNode',
          position: { x: posX, y: posY },
          data: {
            title: 'Pemicu Otomatisasi',
            triggerType: 'manual',
            schedule: 'Eksekusi instan saat dipicu',
          },
        };
        break;
      case 'ai':
        newNode = {
          id,
          type: 'aiAgentNode',
          position: { x: posX, y: posY },
          data: {
            title: 'AI Synthesizer BYOK',
            provider: 'deepseek',
            model: 'deepseek-r1',
            promptSnippet: 'Analisis input data dan buat respons...',
          },
        };
        break;
      case 'gmail':
        newNode = {
          id,
          type: 'connectorNode',
          position: { x: posX, y: posY },
          data: {
            title: 'Konektor Gmail',
            connectorType: 'gmail',
            actionType: 'Create Draft Response',
          },
        };
        break;
      case 'calendar':
        newNode = {
          id,
          type: 'connectorNode',
          position: { x: posX, y: posY },
          data: {
            title: 'Google Calendar Event',
            connectorType: 'calendar',
            actionType: 'Fetch Today Events',
          },
        };
        break;
      case 'drive':
        newNode = {
          id,
          type: 'connectorNode',
          position: { x: posX, y: posY },
          data: {
            title: 'Google Drive Document',
            connectorType: 'drive',
            actionType: 'OCR / Index Document',
          },
        };
        break;
      case 'telegram':
        newNode = {
          id,
          type: 'connectorNode',
          position: { x: posX, y: posY },
          data: {
            title: 'Kirim Pesan Telegram',
            connectorType: 'telegram',
            actionType: 'Send Instant Alert',
          },
        };
        break;
      case 'logic':
        newNode = {
          id,
          type: 'logicNode',
          position: { x: posX, y: posY },
          data: {
            title: 'Pemeriksaan Kondisi',
            condition: 'output.priority === "HIGH"',
          },
        };
        break;
    }

    setNodes((nds) => [...nds, newNode]);
    if (isMobile) {
      setIsPaletteOpen(false);
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  };

  const handleRunSimulation = async () => {
    setIsSimulatingRun(true);
    setExecutionToast('⚡ Memulai eksekusi alur di sisi klien (Direct BYOK)...');

    // Illuminate each node sequentially to simulate live pipeline execution
    for (let i = 0; i < nodes.length; i++) {
      const currentNodeId = nodes[i].id;
      setNodes((nds) =>
        nds.map((n) => (n.id === currentNodeId ? { ...n, data: { ...n.data, isRunning: true } } : n))
      );
      await new Promise((r) => setTimeout(r, 600));
      setNodes((nds) =>
        nds.map((n) => (n.id === currentNodeId ? { ...n, data: { ...n.data, isRunning: false } } : n))
      );
    }

    setIsSimulatingRun(false);
    setExecutionToast('✓ Alur kerja berhasil dieksekusi 100% di browser tanpa server perantara!');
    setTimeout(() => setExecutionToast(null), 4000);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(nodes, edges);
    }
    setExecutionToast('✓ Konfigurasi alur kerja visual berhasil disimpan!');
    setTimeout(() => setExecutionToast(null), 2500);
  };

  return (
    <div
      style={{
        width: '100%',
        height: 'calc(100vh - 60px)',
        display: 'flex',
        flexDirection: 'column',
        background: '#FAF9F5',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Studio Responsive Navbar */}
      <div
        style={{
          minHeight: '52px',
          background: '#FFFFFF',
          borderBottom: '1px solid #E6E1D7',
          padding: isMobile ? '8px 12px' : '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          zIndex: 20,
        }}
      >
        {/* Left Back + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px', minWidth: 0 }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: isMobile ? '6px 10px' : '6px 12px',
              borderRadius: '8px',
              border: '1px solid #E2DED5',
              background: '#FFFFFF',
              color: '#475569',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={14} />
            {!isMobile && <span>Kembali</span>}
          </button>

          <div style={{ height: '18px', width: '1px', background: '#E2DED5' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>⚡</span>
            <span
              style={{
                fontSize: isMobile ? '13px' : '14px',
                fontWeight: 700,
                color: '#1E293B',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: isMobile ? '130px' : '280px',
              }}
            >
              {workflowTitle || 'Visual Studio'}
            </span>
            {!isMobile && (
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: '#0073EA',
                  background: 'rgba(0, 115, 234, 0.08)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                }}
              >
                React Flow
              </span>
            )}
          </div>
        </div>

        {/* Right Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* MiniMap Toggle on Mobile */}
          <button
            type="button"
            onClick={() => setIsMiniMapOpen(!isMiniMapOpen)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid #E2DED5',
              background: isMiniMapOpen ? '#F1F5F9' : '#FFFFFF',
              color: isMiniMapOpen ? '#0073EA' : '#64748B',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            title="Toggle MiniMap"
          >
            <MapIcon size={13} />
            {!isMobile && <span>Map</span>}
          </button>

          <button
            type="button"
            onClick={handleRunSimulation}
            disabled={isSimulatingRun}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: isMobile ? '6px 10px' : '7px 14px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              fontSize: isMobile ? '12px' : '13px',
              fontWeight: 700,
              cursor: isSimulatingRun ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
              flexShrink: 0,
            }}
          >
            {isSimulatingRun ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>{!isMobile ? 'Mengeksekusi...' : 'Jalan'}</span>
              </>
            ) : (
              <>
                <Play size={13} />
                <span>{!isMobile ? 'Uji Eksekusi' : 'Uji'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSave}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: isMobile ? '6px 10px' : '7px 14px',
              borderRadius: '8px',
              border: 'none',
              background: '#0073EA',
              color: '#FFFFFF',
              fontSize: isMobile ? '12px' : '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 115, 234, 0.25)',
              flexShrink: 0,
            }}
          >
            <Save size={13} />
            <span>{!isMobile ? 'Simpan Alur' : 'Simpan'}</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div style={{ flex: 1, width: '100%', position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1.5} color="#D5CFBE" />
          <Controls position="bottom-right" style={{ marginBottom: isMobile ? '50px' : '10px' }} />

          {/* Interactive Responsive MiniMap */}
          {isMiniMapOpen && (
            <MiniMap
              position="bottom-left"
              pannable
              zoomable
              maskColor="rgba(235, 230, 220, 0.6)"
              maskStrokeColor="#0073EA"
              maskStrokeWidth={2}
              nodeColor={(n) => {
                if (n.type === 'triggerNode') return '#D97706';
                if (n.type === 'aiAgentNode') {
                  const provider = (n.data as any)?.provider;
                  if (provider === 'anthropic') return '#7C3AED';
                  if (provider === 'deepseek') return '#2563EB';
                  if (provider === 'groq') return '#EA580C';
                  if (provider === 'openai') return '#10A37F';
                  return '#7C3AED';
                }
                if (n.type === 'connectorNode') {
                  const connType = (n.data as any)?.connectorType;
                  if (connType === 'gmail') return '#EA4335';
                  if (connType === 'calendar') return '#1A73E8';
                  if (connType === 'drive') return '#0F9D58';
                  if (connType === 'telegram') return '#0088CC';
                  if (connType === 'tavily') return '#7C3AED';
                  return '#1A73E8';
                }
                if (n.type === 'logicNode') return '#6366F1';
                return '#0073EA';
              }}
              nodeStrokeColor="#FFFFFF"
              nodeStrokeWidth={2}
              nodeBorderRadius={4}
              style={{
                width: isMobile ? '140px' : '180px',
                height: isMobile ? '90px' : '120px',
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '1.5px solid #E6E1D7',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                cursor: 'grab',
                marginBottom: isMobile ? '50px' : '10px',
              }}
            />
          )}

          {/* Top-Left Collapsible Node Palette Panel */}
          <Panel position="top-left">
            {!isPaletteOpen ? (
              <button
                type="button"
                onClick={() => setIsPaletteOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  background: '#FFFFFF',
                  border: '1.5px solid #E6E1D7',
                  color: '#1E293B',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} color="#0073EA" />
                <span>Tambah Node</span>
              </button>
            ) : (
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1.5px solid #E6E1D7',
                  padding: '12px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '7px',
                  width: isMobile ? '190px' : '210px',
                  maxHeight: 'calc(100vh - 160px)',
                  overflowY: 'auto',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    + Tambah Node
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPaletteOpen(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleAddNode('trigger')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    background: '#FEF3C7',
                    border: '1px solid #FDE68A',
                    color: '#92400E',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Clock size={14} color="#D97706" />
                  <span>Pemicu / Trigger</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddNode('ai')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    color: '#1E40AF',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Sparkles size={14} color="#0073EA" />
                  <span>AI Agent (BYOK)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddNode('gmail')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    color: '#991B1B',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Mail size={14} color="#EA4335" />
                  <span>Gmail Action</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddNode('calendar')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    color: '#1A73E8',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Calendar size={14} color="#1A73E8" />
                  <span>Google Calendar</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddNode('drive')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    color: '#0F9D58',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <FolderOpen size={14} color="#0F9D58" />
                  <span>Google Drive</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddNode('telegram')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    background: '#F0F9FF',
                    border: '1px solid #BAE6FD',
                    color: '#0088CC',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Send size={14} color="#0088CC" />
                  <span>Telegram Alert</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddNode('logic')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    background: '#EEF2FF',
                    border: '1px solid #C7D2FE',
                    color: '#3730A3',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <GitBranch size={14} color="#6366F1" />
                  <span>Logika IF / ELSE</span>
                </button>
              </div>
            )}
          </Panel>

          {/* Node Inspector Panel (Right) when a node is selected */}
          {selectedNode && (
            <Panel position={isMobile ? 'bottom-center' : 'top-right'}>
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1.5px solid #E6E1D7',
                  padding: '14px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
                  width: isMobile ? 'calc(100vw - 32px)' : '280px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  marginBottom: isMobile ? '20px' : '0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sliders size={14} color="#0073EA" />
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>
                      Konfigurasi Node
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      style={{
                        background: '#FEE2E2',
                        border: 'none',
                        color: '#DC2626',
                        padding: '4px 6px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      <Trash2 size={11} /> Hapus
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedNode(null)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        padding: '2px',
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>
                    Judul Node
                  </label>
                  <input
                    type="text"
                    value={String(selectedNode.data?.title || '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNodes((nds) =>
                        nds.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, title: val } } : n))
                      );
                      setSelectedNode((prev) => (prev ? { ...prev, data: { ...prev.data, title: val } } : null));
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.4 }}>
                  Tipe: <strong>{selectedNode.type}</strong>
                </div>
              </div>
            </Panel>
          )}
        </ReactFlow>

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
            <Zap size={14} color="#38BDF8" style={{ flexShrink: 0 }} />
            <span>{executionToast}</span>
          </div>
        )}
      </div>
    </div>
  );
}
