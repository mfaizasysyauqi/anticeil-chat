'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  ArrowUp,
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
  StickyNote,
  Search,
  Columns2,
  Wand2,
} from 'lucide-react';
import { nodeTypes } from './nodes';
import { NodeInspectorPanel } from './NodeInspectorPanel';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { useAutomationStore } from '../store/useAutomationStore';
import { getModelById } from '@anticeil/core';
import { ModelSelectorModal } from '../../chat/components/ModelSelectorModal';

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

  // ── Undo / Redo history ──────────────────────────────────────────────────
  type HistorySnapshot = { nodes: Node[]; edges: Edge[] };
  const undoStack = useRef<HistorySnapshot[]>([]);
  const redoStack = useRef<HistorySnapshot[]>([]);

  /** Call BEFORE any mutation so the pre-mutation state can be restored. */
  const pushHistory = useCallback(
    (currentNodes: Node[], currentEdges: Edge[]) => {
      undoStack.current.push({ nodes: currentNodes, edges: currentEdges });
      if (undoStack.current.length > 100) undoStack.current.shift(); // cap at 100
      redoStack.current = []; // any new action clears redo
    },
    []
  );
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

  // Right Drawer Tab State: 'nodes' | 'inspector' | 'ai' | null
  const [rightDrawerTab, setRightDrawerTab] = useState<'nodes' | 'inspector' | 'ai' | null>(null);
  const [nodeCatalogSearch, setNodeCatalogSearch] = useState('');
  const [inspectorNodeSearch, setInspectorNodeSearch] = useState('');
  const [commandSearch, setCommandSearch] = useState('');
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [isGeneratingAiCanvas, setIsGeneratingAiCanvas] = useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);

  const activeModelId = useSettingsStore((s) => s.activeModelId);
  const activeModel = getModelById(activeModelId);
  const activeModelName = activeModel?.name || 'Compound';

  // Responsive UI states
  const [isMobile, setIsMobile] = useState(false);
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
        setIsMiniMapOpen(false);
      }
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  const onConnect = useCallback(
    (params: Connection) => {
      // snapshot before connecting
      setNodes((currentNodes) => {
        setEdges((currentEdges) => {
          pushHistory(currentNodes, currentEdges);
          return addEdge(
            { ...params, animated: true, style: { stroke: '#0073EA', strokeWidth: 2 } },
            currentEdges
          );
        });
        return currentNodes;
      });
    },
    [setNodes, setEdges, pushHistory]
  );

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setRightDrawerTab('inspector');
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
    pushHistory(nodes, edges);
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
    setRightDrawerTab(null);
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
      stickyNote: () => ({
        id, type: 'stickyNoteNode', position: { x: posX, y: posY }, measured: { width: 240, height: 160 },
        data: { title: 'Catatan Alur', content: 'Tuliskan catatan atau instruksi alur kerja...', color: 'yellow' },
      }),
    };

    const factory = nodeMap[type];
    if (!factory) return;
    newNode = factory();

    pushHistory(nodes, edges);
    setNodes((nds) => [...nds, newNode]);
    setSelectedNode(newNode);
    setRightDrawerTab('inspector');
  };

  // AI Assistant Canvas Generator
  const handleExecuteAiGeneration = () => {
    if (!aiPromptInput.trim() || isGeneratingAiCanvas) return;
    setIsGeneratingAiCanvas(true);
    setTimeout(() => {
      const p = aiPromptInput.toLowerCase();
      if (p.includes('telegram') || p.includes('bot')) {
        handleAddNode('telegram');
      } else if (p.includes('calendar') || p.includes('jadwal')) {
        handleAddNode('calendar');
      } else if (p.includes('gmail') || p.includes('email')) {
        handleAddNode('gmail');
      } else if (p.includes('note') || p.includes('catatan')) {
        handleAddNode('stickyNote');
      } else {
        handleAddNode('ai');
      }
      setIsGeneratingAiCanvas(false);
      setAiPromptInput('');
      setExecutionToast('✓ Blok node baru berhasil ditambahkan oleh AI ke canvas!');
      setTimeout(() => setExecutionToast(null), 3000);
    }, 400);
  };

  const [clipboardNode, setClipboardNode] = useState<Node | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- edges used for undo
  const nodesRef = useRef(nodes);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const edgesRef = useRef(edges);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  // ── Global Canvas Keyboard Shortcuts (n8n style + Copy/Paste/Delete) ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl?.getAttribute('contenteditable') === 'true';

      // 0. Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        if (!isInput) {
          e.preventDefault();
          const snapshot = undoStack.current.pop();
          if (snapshot) {
            redoStack.current.push({ nodes: nodesRef.current, edges: edgesRef.current });
            setNodes(snapshot.nodes);
            setEdges(snapshot.edges);
            setSelectedNode(null);
            setExecutionToast(language === 'id' ? '↩ Undo' : '↩ Undone');
            setTimeout(() => setExecutionToast(null), 1500);
          }
        }
      }

      // 0b. Redo: Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z
      const isRedo =
        ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z'));
      if (isRedo) {
        if (!isInput) {
          e.preventDefault();
          const snapshot = redoStack.current.pop();
          if (snapshot) {
            undoStack.current.push({ nodes: nodesRef.current, edges: edgesRef.current });
            setNodes(snapshot.nodes);
            setEdges(snapshot.edges);
            setSelectedNode(null);
            setExecutionToast(language === 'id' ? '↪ Redo' : '↪ Redone');
            setTimeout(() => setExecutionToast(null), 1500);
          }
        }
      }

      // 1. Copy selected node: Ctrl+C or Cmd+C
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'c' || e.key === 'C')) {
        if (!isInput && selectedNode) {
          e.preventDefault();
          setClipboardNode(selectedNode);
          setExecutionToast(
            language === 'id'
              ? `✓ Node "${(selectedNode.data?.title as string) || selectedNode.type}" disalin`
              : `✓ Node "${(selectedNode.data?.title as string) || selectedNode.type}" copied`
          );
          setTimeout(() => setExecutionToast(null), 2000);
        }
      }

      // 2. Paste copied node: Ctrl+V or Cmd+V
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'v' || e.key === 'V')) {
        if (!isInput && clipboardNode) {
          e.preventDefault();
          pushHistory(nodesRef.current, edgesRef.current);
          const newId = `node_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
          const pastedNode: Node = {
            ...clipboardNode,
            id: newId,
            position: {
              x: (clipboardNode.position?.x || 100) + 40,
              y: (clipboardNode.position?.y || 100) + 40,
            },
            selected: true,
            data: {
              ...clipboardNode.data,
              title: clipboardNode.data?.title ? `${clipboardNode.data.title} (Copy)` : undefined,
            },
          };
          setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), pastedNode]);
          setSelectedNode(pastedNode);
          setClipboardNode(pastedNode); // allow cascading pastes
          setExecutionToast(
            language === 'id' ? '✓ Node berhasil ditempel ke canvas' : '✓ Node pasted to canvas'
          );
          setTimeout(() => setExecutionToast(null), 2000);
        }
      }

      // 3. Duplicate node: Ctrl+D or Cmd+D
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'd' || e.key === 'D')) {
        if (!isInput && selectedNode) {
          e.preventDefault();
          pushHistory(nodesRef.current, edgesRef.current);
          const newId = `node_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
          const dupNode: Node = {
            ...selectedNode,
            id: newId,
            position: {
              x: (selectedNode.position?.x || 100) + 30,
              y: (selectedNode.position?.y || 100) + 30,
            },
            selected: true,
            data: {
              ...selectedNode.data,
              title: selectedNode.data?.title ? `${selectedNode.data.title} (Copy)` : undefined,
            },
          };
          setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), dupNode]);
          setSelectedNode(dupNode);
          setExecutionToast(language === 'id' ? '✓ Node diduplikasi' : '✓ Node duplicated');
          setTimeout(() => setExecutionToast(null), 2000);
        }
      }

      // 4. Delete node: Backspace or Delete
      if (!isInput && (e.key === 'Backspace' || e.key === 'Delete')) {
        if (selectedNode) {
          e.preventDefault();
          pushHistory(nodesRef.current, edgesRef.current);
          const deletedTitle = (selectedNode.data?.title as string) || selectedNode.type || 'Node';
          setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
          setEdges((eds) =>
            eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id)
          );
          setSelectedNode(null);
          setExecutionToast(
            language === 'id' ? `✓ ${deletedTitle} dihapus` : `✓ ${deletedTitle} deleted`
          );
          setTimeout(() => setExecutionToast(null), 2000);
        }
      }

      // 5. Open Add Node catalog: 'n' or 'N' (when not inside an input)
      if (!isInput && (e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        setRightDrawerTab((prev) => (prev === 'nodes' ? null : 'nodes'));
      }

      // 6. Search / Add node: Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setRightDrawerTab((prev) => (prev === 'nodes' ? null : 'nodes'));
      }

      // 7. Add sticky note: Shift+S
      if (e.shiftKey && (e.key === 's' || e.key === 'S') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (!isInput) {
          e.preventDefault();
          handleAddNode('stickyNote');
        }
      }

      // 8. Open inspector panel: Shift+F
      if (e.shiftKey && (e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (!isInput) {
          e.preventDefault();
          if (rightDrawerTab === 'inspector') {
            setRightDrawerTab(null);
          } else {
            if (!selectedNode && nodes.length > 0) {
              setSelectedNode(nodes[0]);
            }
            setRightDrawerTab('inspector');
          }
        }
      }

      // 9. AI Assistant: Ctrl+J or Cmd+J
      if ((e.ctrlKey || e.metaKey) && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        setRightDrawerTab((prev) => (prev === 'ai' ? null : 'ai'));
      }

      // Escape to close drawer
      if (e.key === 'Escape') {
        setRightDrawerTab(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, edges, selectedNode, clipboardNode, rightDrawerTab, language, pushHistory, setNodes, setEdges]);

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
        background: isDark ? '#171717' : '#FAF9F5',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Studio Responsive Navbar */}
      <div
        style={{
          height: isMobile ? '46px' : '50px',
          background: isDark ? '#141414' : '#FFFFFF',
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


      {/* ════ Canvas Area: ReactFlow + FAB dock + Right Drawer ════ */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', width: '100%', overflow: 'hidden', minHeight: 0 }}>

        {/* ReactFlow Canvas */}
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
            flex: 1,
            background: isDark ? '#171717' : '#FAF9F5',
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
                  triggerNode: '#D97706', logicNode: '#0891B2', httpNode: '#3B82F6',
                  codeNode: '#10B981', databaseNode: '#336791', emailNode: '#EA4335',
                  delayNode: '#A855F7', transformNode: '#0EA5E9', spreadsheetNode: '#34A853',
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
                background: isDark ? '#1e1e1e' : '#FFFFFF',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                width: 190, height: 125,
              }}
              zoomable pannable
            />
          )}
        </ReactFlow>

        {/* ── Vertical FAB Dock Strip (right edge, inside canvas) ── */}
        {/* z-index: 20 – above canvas, below the drawer (40) and modals (9999) */}
        <div
          style={{
            position: 'absolute',
            right: rightDrawerTab ? '342px' : '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            transition: 'right 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* 1. Tambah Node / Catalog [+] */}
          <FloatingDockButton
            icon={<Plus size={18} />}
            label={language === 'id' ? 'Tambah node' : 'Add node'}
            shortcut={['N']}
            isActive={rightDrawerTab === 'nodes'}
            onClick={() => setRightDrawerTab((prev) => (prev === 'nodes' ? null : 'nodes'))}
          />

          {/* 2. Node Inspector (Cari node terpasang) */}
          <FloatingDockButton
            icon={<Columns2 size={17} />}
            label={language === 'id' ? 'Inspektur Node' : 'Node Inspector'}
            shortcut={['⇧', 'F']}
            isActive={rightDrawerTab === 'inspector'}
            onClick={() => {
              if (rightDrawerTab === 'inspector') {
                setRightDrawerTab(null);
              } else {
                if (!selectedNode && nodes.length > 0) setSelectedNode(nodes[0]);
                setRightDrawerTab('inspector');
              }
            }}
          />

          {/* 3. Add sticky note [Shift] [S] */}
          <FloatingDockButton
            icon={<StickyNote size={17} />}
            label={language === 'id' ? 'Tambah catatan' : 'Add sticky note'}
            shortcut={['⇧', 'S']}
            onClick={() => handleAddNode('stickyNote')}
          />

          {/* 4. AI Assistant [Ctrl] [J] */}
          <FloatingDockButton
            icon={
              <Sparkles
                size={17}
                style={{ color: '#C084FC', filter: 'drop-shadow(0 0 6px rgba(192,132,252,0.5))' }}
              />
            }
            label={language === 'id' ? 'Asisten AI Workflow' : 'AI Assistant'}
            shortcut={['Ctrl', 'J']}
            isActive={rightDrawerTab === 'ai'}
            onClick={() => setRightDrawerTab((prev) => (prev === 'ai' ? null : 'ai'))}
          />
        </div>

        {/* ── Right Drawer (absolute, slides in from right) ── */}
        {/* z-index: 40 – above canvas and FAB dock, below modals (9999) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: isMobile ? '100%' : '330px',
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column',
            background: isDark ? '#1e1e1e' : '#FFFFFF',
            borderLeft: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
            boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.18)',
            transform: rightDrawerTab ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
          }}
        >
          {/* Drawer Header: Clean Title Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
              background: isDark ? '#262626' : '#F8FAFC',
              flexShrink: 0,
            }}
          >
            {rightDrawerTab === 'nodes' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={16} color="var(--brand-primary, #0073EA)" />
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: isDark ? '#F9FAFB' : '#0F172A' }}>
                  {language === 'id' ? 'Tambah Node' : 'Add Node'}
                </span>
              </div>
            ) : rightDrawerTab === 'inspector' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Columns2 size={16} color="var(--brand-primary, #0073EA)" />
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: isDark ? '#F9FAFB' : '#0F172A' }}>
                  {language === 'id' ? 'Inspektur Node' : 'Node Inspector'}
                </span>
              </div>
            ) : rightDrawerTab === 'ai' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="#C084FC" />
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: isDark ? '#E9D5FF' : '#6D28D9' }}>
                  {language === 'id' ? 'Asisten AI Workflow' : 'AI Workflow Assistant'}
                </span>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setRightDrawerTab(null)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                color: isDark ? '#9CA3AF' : '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Drawer Body */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px', minWidth: 0, boxSizing: 'border-box' }}>

            {/* ── View 1: Add Node Catalog ── */}
            {rightDrawerTab === 'nodes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Search Form Bar for Add Node */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: isDark ? '#262626' : '#F1F5F9',
                    borderRadius: '8px',
                    padding: '7px 10px',
                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                  }}
                >
                  <Search size={14} color="var(--brand-primary, #0073EA)" />
                  <input
                    autoFocus
                    type="text"
                    value={nodeCatalogSearch}
                    onChange={(e) => setNodeCatalogSearch(e.target.value)}
                    placeholder={
                      language === 'id'
                        ? 'Cari blok node, konektor, integrasi...'
                        : 'Search nodes, actions, connectors...'
                    }
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: '12.5px',
                      color: isDark ? '#F9FAFB' : '#0F172A',
                      fontFamily: 'inherit',
                    }}
                  />
                  {nodeCatalogSearch && (
                    <button
                      type="button"
                      onClick={() => setNodeCatalogSearch('')}
                      style={{ background: 'transparent', border: 'none', color: isDark ? '#9CA3AF' : '#64748B', cursor: 'pointer', padding: 0 }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Categorized node list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    {
                      cat: 'Pemicu & Alur',
                      items: [
                        { type: 'trigger', icon: <Clock size={13} />, label: 'Pemicu Cron / Webhook', color: '#D97706', bg: isDark ? 'rgba(217,119,6,0.15)' : '#FEF3C7' },
                        { type: 'logic', icon: <GitBranch size={13} />, label: 'Logika & Kondisi', color: '#0891B2', bg: isDark ? 'rgba(8,145,178,0.15)' : '#CFFAFE' },
                        { type: 'delay', icon: <Timer size={13} />, label: 'Delay / Wait', color: '#A855F7', bg: isDark ? 'rgba(168,85,247,0.15)' : '#FAF5FF' },
                      ],
                    },
                    {
                      cat: 'AI & Kode',
                      items: [
                        { type: 'ai', icon: <Sparkles size={13} />, label: 'AI Reasoning Agent', color: '#7C3AED', bg: isDark ? 'rgba(124,58,237,0.15)' : '#F3E8FF' },
                        { type: 'code', icon: <Code2 size={13} />, label: 'Custom Code (JS/PY)', color: '#10B981', bg: isDark ? 'rgba(16,185,129,0.15)' : '#ECFDF5' },
                        { type: 'transform', icon: <ArrowRightLeft size={13} />, label: 'Data Transform', color: '#0EA5E9', bg: isDark ? 'rgba(14,165,233,0.15)' : '#F0F9FF' },
                      ],
                    },
                    {
                      cat: 'Konektor & Integrasi',
                      items: [
                        { type: 'http', icon: <Globe size={13} />, label: 'HTTP Request', color: '#3B82F6', bg: isDark ? 'rgba(59,130,246,0.15)' : '#DBEAFE' },
                        { type: 'calendar', icon: <Calendar size={13} />, label: 'Google Calendar', color: '#1A73E8', bg: isDark ? 'rgba(26,115,232,0.15)' : '#E8F0FE' },
                        { type: 'gmail', icon: <Mail size={13} />, label: 'Gmail VIP Draft', color: '#EA4335', bg: isDark ? 'rgba(234,67,53,0.15)' : '#FCE8E6' },
                        { type: 'email', icon: <Mail size={13} />, label: 'Email (SendGrid/Resend)', color: '#DC2626', bg: isDark ? 'rgba(234,67,53,0.1)' : '#FEF2F2' },
                        { type: 'telegram', icon: <Send size={13} />, label: 'Telegram Bot Alert', color: '#0088CC', bg: isDark ? 'rgba(0,136,204,0.15)' : '#E0F2FE' },
                      ],
                    },
                    {
                      cat: 'Data & Penyimpanan',
                      items: [
                        { type: 'database', icon: <Database size={13} />, label: 'Database (PG/Mongo)', color: '#336791', bg: isDark ? 'rgba(51,103,145,0.15)' : '#F0F9FF' },
                        { type: 'spreadsheet', icon: <Sheet size={13} />, label: 'Spreadsheet / Sheets', color: '#34A853', bg: isDark ? 'rgba(52,168,83,0.15)' : '#F0FDF4' },
                        { type: 'storage', icon: <HardDrive size={13} />, label: 'Cloud Storage (S3/R2)', color: '#F59E0B', bg: isDark ? 'rgba(255,153,0,0.15)' : '#FFFBEB' },
                      ],
                    },
                    {
                      cat: 'Anotasi',
                      items: [
                        { type: 'stickyNote', icon: <StickyNote size={13} />, label: 'Sticky Note', color: '#F59E0B', bg: isDark ? 'rgba(245,158,11,0.15)' : '#FFFBEB' },
                      ],
                    },
                  ].map((group) => {
                    const filtered = nodeCatalogSearch
                      ? group.items.filter((item) =>
                          item.label.toLowerCase().includes(nodeCatalogSearch.toLowerCase()) ||
                          group.cat.toLowerCase().includes(nodeCatalogSearch.toLowerCase())
                        )
                      : group.items;
                    if (filtered.length === 0) return null;
                    return (
                      <div key={group.cat}>
                        <div
                          style={{
                            fontSize: '9.5px', fontWeight: 800,
                            color: isDark ? '#64748B' : '#94A3B8',
                            textTransform: 'uppercase', letterSpacing: '0.08em',
                            marginBottom: '6px',
                          }}
                        >
                          {group.cat}
                        </div>
                        {filtered.map((item) => (
                          <button
                            key={item.type}
                            type="button"
                            onClick={() => {
                              handleAddNode(item.type);
                              setNodeCatalogSearch('');
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '8px',
                              padding: '7px 10px', borderRadius: '7px', border: 'none',
                              background: item.bg, color: item.color,
                              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                              textAlign: 'left', width: '100%', marginBottom: '4px',
                              transition: 'transform 0.1s ease',
                            }}
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── View 2: Node Inspector (dengan search untuk node yang sudah dipasang) ── */}
            {rightDrawerTab === 'inspector' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Search Form Bar: khusus mencari node yang sudah dipasang di canvas */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: isDark ? '#262626' : '#F1F5F9',
                    borderRadius: '8px',
                    padding: '7px 10px',
                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                  }}
                >
                  <Search size={14} color="var(--brand-primary, #0073EA)" />
                  <input
                    type="text"
                    value={inspectorNodeSearch}
                    onChange={(e) => setInspectorNodeSearch(e.target.value)}
                    placeholder={
                      language === 'id'
                        ? 'Cari node yang terpasang di canvas...'
                        : 'Search placed nodes on canvas...'
                    }
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      fontSize: '12.5px',
                      color: isDark ? '#F9FAFB' : '#0F172A',
                      fontFamily: 'inherit',
                    }}
                  />
                  {inspectorNodeSearch && (
                    <button
                      type="button"
                      onClick={() => setInspectorNodeSearch('')}
                      style={{ background: 'transparent', border: 'none', color: isDark ? '#9CA3AF' : '#64748B', cursor: 'pointer', padding: 0 }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* If searching placed nodes */}
                {inspectorNodeSearch.trim() ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: isDark ? '#9CA3AF' : '#64748B' }}>
                      {language === 'id' ? 'Hasil Node Terpasang:' : 'Matching Placed Nodes:'}
                    </span>
                    {nodes
                      .filter((n) => {
                        const q = inspectorNodeSearch.toLowerCase();
                        const title = ((n.data?.title as string) || '').toLowerCase();
                        const type = (n.type || '').toLowerCase();
                        const label = ((n.data?.label as string) || '').toLowerCase();
                        return title.includes(q) || type.includes(q) || label.includes(q);
                      })
                      .map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            setSelectedNode(n);
                            setInspectorNodeSearch('');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: selectedNode?.id === n.id
                              ? '1.5px solid #0073EA'
                              : isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0',
                            background: selectedNode?.id === n.id
                              ? (isDark ? 'rgba(0,115,234,0.15)' : '#EFF6FF')
                              : (isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF'),
                            color: isDark ? '#F3F4F6' : '#1F2937',
                            cursor: 'pointer',
                            fontSize: '12px',
                            textAlign: 'left',
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>{(n.data?.title as string) || n.type || 'Node'}</span>
                          <span style={{ fontSize: '10px', color: isDark ? '#9CA3AF' : '#64748B', background: isDark ? '#1e1e1e' : '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>
                            {n.type}
                          </span>
                        </button>
                      ))}
                    {nodes.filter((n) => {
                      const q = inspectorNodeSearch.toLowerCase();
                      const title = ((n.data?.title as string) || '').toLowerCase();
                      const type = (n.type || '').toLowerCase();
                      return title.includes(q) || type.includes(q);
                    }).length === 0 && (
                      <p style={{ fontSize: '12px', color: isDark ? '#9CA3AF' : '#64748B', margin: '8px 0', textAlign: 'center' }}>
                        {language === 'id' ? 'Tidak ada node terpasang yang cocok.' : 'No matching placed nodes.'}
                      </p>
                    )}
                  </div>
                ) : selectedNode ? (
                  /* If a node is selected: Show Inspector Panel + placed nodes selector */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <NodeInspectorPanel
                      node={selectedNode}
                      isDark={isDark}
                      isMobile={isMobile}
                      language={language}
                      onUpdateNodeData={handleUpdateNodeData}
                      onDeleteNode={handleDeleteSelected}
                      onClose={() => { setSelectedNode(null); }}
                    />

                    {/* Placed Nodes Quick Switcher */}
                    {nodes.length > 1 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '6px', borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: isDark ? '#9CA3AF' : '#64748B' }}>
                          {language === 'id' ? 'Pilih Node Terpasang Lainnya:' : 'Select Other Placed Node:'}
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {nodes
                            .filter((n) => n.id !== selectedNode.id)
                            .map((n) => (
                              <button
                                key={n.id}
                                type="button"
                                onClick={() => setSelectedNode(n)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #CBD5E1',
                                  background: isDark ? '#1a1a1a' : '#F8FAFC',
                                  color: isDark ? '#D1D5DB' : '#334155',
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                }}
                              >
                                {(n.data?.title as string) || n.type}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* If no node selected: Show list of placed nodes on canvas */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: isDark ? '#9CA3AF' : '#64748B' }}>
                      {language === 'id' ? `Daftar Node Terpasang (${nodes.length}):` : `Placed Nodes on Canvas (${nodes.length}):`}
                    </span>
                    {nodes.length === 0 ? (
                      <div
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          padding: '30px 16px', gap: '10px', opacity: 0.6,
                        }}
                      >
                        <Columns2 size={24} color={isDark ? '#9CA3AF' : '#94A3B8'} />
                        <p style={{ fontSize: '12px', color: isDark ? '#9CA3AF' : '#64748B', textAlign: 'center', margin: 0 }}>
                          {language === 'id' ? 'Belum ada node yang terpasang. Gunakan tombol [+] untuk menambahkan node.' : 'No nodes placed yet. Use the [+] button to add nodes.'}
                        </p>
                      </div>
                    ) : (
                      nodes.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => setSelectedNode(n)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0',
                            background: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
                            color: isDark ? '#F3F4F6' : '#1F2937',
                            cursor: 'pointer',
                            fontSize: '12px',
                            textAlign: 'left',
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>{(n.data?.title as string) || n.type || 'Node'}</span>
                          <span style={{ fontSize: '10px', color: isDark ? '#9CA3AF' : '#64748B', background: isDark ? '#1e1e1e' : '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>
                            {n.type}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: AI Workflow Assistant (Grok/Chat Page Styled Input Form) ── */}
            {rightDrawerTab === 'ai' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Chat Page Input Box Capsule */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: isDark ? '#262626' : '#FFFFFF',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '12px 14px',
                    boxShadow: isDark ? '0 6px 24px rgba(0,0,0,0.35)' : '0 4px 16px rgba(0,0,0,0.06)',
                    gap: '10px',
                  }}
                >
                  <textarea
                    autoFocus
                    value={aiPromptInput}
                    onChange={(e) => setAiPromptInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleExecuteAiGeneration();
                      }
                    }}
                    placeholder={
                      language === 'id'
                        ? 'Tanya apa saja atau jelaskan alur/node yang ingin dibuat...'
                        : 'Ask anything or describe the workflow/node to generate...'
                    }
                    rows={3}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      resize: 'none',
                      color: isDark ? '#F9FAFB' : '#0F172A',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                  />

                  {/* Bottom Action Bar inside the capsule */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '4px',
                      borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #F1F5F9',
                    }}
                  >
                    {/* Left: Quick Actions / Preset Chip */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setAiPromptInput('Tambahkan notifikasi Telegram bot alert jika hasil AI mendeteksi status critical')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                          background: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                          color: isDark ? '#A0A0A0' : '#64748B',
                          fontSize: '11px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC')}
                      >
                        <Plus size={12} color="var(--brand-primary, #0073EA)" />
                        <span>Preset</span>
                      </button>
                    </div>

                    {/* Right: Custom Model Selector Button & Send Arrow */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setIsModelSelectorOpen(true)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
                          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                          borderRadius: '8px',
                          padding: '4px 8px',
                          color: isDark ? '#E5E7EB' : '#334155',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9')}
                        title={language === 'id' ? 'Ganti Model AI' : 'Change AI Model'}
                      >
                        <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {activeModelName}
                        </span>
                        <ChevronDown size={12} color={isDark ? '#9CA3AF' : '#64748B'} />
                      </button>

                      <button
                        type="button"
                        disabled={isGeneratingAiCanvas || !aiPromptInput.trim()}
                        onClick={handleExecuteAiGeneration}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          border: 'none',
                          background: aiPromptInput.trim()
                            ? 'var(--brand-primary, #0073EA)'
                            : isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                          color: aiPromptInput.trim() ? '#FFFFFF' : (isDark ? '#666666' : '#94A3B8'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: isGeneratingAiCanvas || !aiPromptInput.trim() ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: aiPromptInput.trim() ? '0 2px 8px rgba(0, 115, 234, 0.35)' : 'none',
                        }}
                        title={language === 'id' ? 'Kirim ke Canvas' : 'Generate to Canvas'}
                      >
                        {isGeneratingAiCanvas ? <Loader2 size={14} className="animate-spin" /> : <ArrowUp size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Prompts List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: isDark ? '#9CA3AF' : '#64748B' }}>
                    {language === 'id' ? 'Saran Cepat:' : 'Quick Prompts:'}
                  </span>
                  {[
                    'Tambahkan notifikasi bot Telegram darurat',
                    'Koneksikan ke Google Calendar untuk cek agenda rapat',
                    'Buat filter email VIP dengan Gmail',
                    'Tambahkan agen AI synthesizer',
                  ].map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAiPromptInput(suggestion)}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '8px',
                        border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0',
                        background: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
                        color: isDark ? '#D1D5DB' : '#475569',
                        fontSize: '11.5px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDark ? 'rgba(0, 115, 234, 0.12)' : '#F0F9FF';
                        e.currentTarget.style.borderColor = 'var(--brand-primary, #0073EA)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC';
                        e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0';
                      }}
                    >
                      💡 {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Cloudflare Worker Execution Trace Console Modal ── */}
        {showTraceModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(6px)',
              zIndex: 9999,
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
                background: isDark ? '#1e1e1e' : '#FFFFFF',
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
                  background: isDark ? '#262626' : '#F8FAFC',
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
                      background: isDark ? '#262626' : '#F1F5F9',
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
                        background: isDark ? '#1e1e1e' : '#FFFFFF',
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
                  background: isDark ? '#262626' : '#F8FAFC',
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
                background: isDark ? '#1e1e1e' : '#FFFFFF',
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
                    background: isDark ? '#262626' : '#F1F5F9',
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
              zIndex: 9998,
              maxWidth: '90%',
              textAlign: 'center',
            }}
          >
            <Zap size={14} color="#F38020" style={{ flexShrink: 0 }} />
            <span>{executionToast}</span>
          </div>
        )}

        {/* Model Selector Modal for AI Assistant */}
        {isModelSelectorOpen && (
          <ModelSelectorModal
            onClose={() => setIsModelSelectorOpen(false)}
            targetCapability="text"
          />
        )}
      </div>
    </div>
  );
}

function FloatingDockButton({
  icon,
  label,
  shortcut,
  onClick,
  isActive,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut: string[];
  onClick: () => void;
  isActive?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const theme = useSettingsStore((s) => s.theme);
  const isDark = theme === 'dark';

  return (
    <div style={{ position: 'relative' }} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <button
        type="button"
        onClick={onClick}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '8px',
          border: isActive
            ? '1.5px solid #0073EA'
            : isDark
            ? '1px solid rgba(255, 255, 255, 0.08)'
            : '1px solid rgba(0, 0, 0, 0.08)',
          background: isActive
            ? 'rgba(0, 115, 234, 0.15)'
            : isDark
            ? 'rgba(30, 35, 48, 0.7)'
            : 'rgba(245, 245, 247, 0.85)',
          color: isActive ? '#0073EA' : isDark ? '#E2E8F0' : '#334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        {icon}
      </button>

      {/* Tooltip Badge on Left with Keyboard Keys */}
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            right: 'calc(100% + 10px)',
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundColor: '#1e1e1e',
            color: '#FFFFFF',
            padding: '5px 9px',
            borderRadius: '7px',
            fontSize: '12px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
            border: '1px solid rgba(255,255,255,0.12)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        >
          <span>{label}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            {shortcut.map((k, i) => (
              <span
                key={i}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.18)',
                  color: '#F1F5F9',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '2px 5px',
                  borderRadius: '4px',
                  minWidth: '18px',
                  textAlign: 'center',
                  lineHeight: 1.2,
                }}
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
