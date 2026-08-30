'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Settings,
  KeyRound,
  Palette,
  Database,
  ExternalLink,
  Check,
  Eye,
  EyeOff,
  Download,
  Upload,
  ShieldCheck,
  Trash2,
  Lock,
  Sun,
  Moon,
  Globe,
  Sparkles,
  Zap,
  HardDrive,
  Cloud,
  RefreshCw,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  AlertCircle,
  CheckCircle2,
  Building,
  Server,
  HelpCircle,
  Copy,
  Terminal,
  Search,
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import {
  PROVIDER_DEFINITIONS,
  LLMProviderId,
  getTranslation,
  UserTier,
} from '@anticeil/core';
import { useSettingsStore } from '../store/useSettingsStore';
import { useChatStore } from '../../chat/store/useChatStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useStorageStore, formatStorageBytes } from '../../storage/store/useStorageStore';
import { DatabaseService } from '../../storage/services/databaseService';
import { StorageMeter } from '../../storage/components/StorageMeter';
import { ProviderBrandLogo } from '../../../shared/components/ProviderLogos';
import { useCreditStore } from '../../credits/store/useCreditStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'keys' | 'appearance' | 'backup';

const FULL_SQL_SCHEMA_SNIPPET = `-- ==============================================================================
-- ANTICEIL SUPABASE CLOUD DATABASE SCHEMA
-- Run this in Supabase SQL Editor to set up your Dedicated Enterprise Instance
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  tier TEXT NOT NULL DEFAULT 'enterprise',
  storage_quota_bytes BIGINT DEFAULT 10737418240, -- 10 GB
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Chat Sessions Table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  provider_id TEXT NOT NULL DEFAULT 'groq',
  model_id TEXT NOT NULL DEFAULT 'compound-beta',
  system_prompt TEXT DEFAULT '',
  temperature FLOAT DEFAULT 0.7,
  max_tokens INTEGER,
  is_pinned BOOLEAN DEFAULT FALSE,
  project_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL DEFAULT '',
  reasoning_content TEXT,
  timestamp BIGINT NOT NULL,
  tokens_used JSONB,
  estimated_cost_usd FLOAT,
  status TEXT DEFAULT 'done',
  error TEXT,
  attachments JSONB,
  image_url TEXT,
  video_url TEXT,
  tool_results JSONB,
  versions JSONB,
  version_index INTEGER DEFAULT 0,
  branch_contents JSONB,
  branch_reasoning_contents JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Project Folders Table
CREATE TABLE IF NOT EXISTS public.project_folders (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  session_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. User Prompts (Personas)
CREATE TABLE IF NOT EXISTS public.user_prompts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. User Connectors (MCP)
CREATE TABLE IF NOT EXISTS public.user_connectors (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Workspace Data
CREATE TABLE IF NOT EXISTS public.workspace_data (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, key)
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage own chat sessions" ON public.chat_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own chat messages" ON public.chat_messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own project folders" ON public.project_folders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own prompts" ON public.user_prompts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own connectors" ON public.user_connectors FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own workspace data" ON public.workspace_data FOR ALL USING (auth.uid() = user_id);
`;

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [mounted, setMounted] = useState(false);
  const storeActiveTab = useSettingsStore((s) => s.activeSettingsTab);
  const setStoreActiveTab = useSettingsStore((s) => s.setSettingsTab);
  const [activeTab, setActiveTab] = useState<SettingsTab>(storeActiveTab || 'keys');

  useEffect(() => {
    if (storeActiveTab) {
      setActiveTab(storeActiveTab);
    }
  }, [storeActiveTab, isOpen]);

  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const clearAllKeys = useSettingsStore((s) => s.clearAllKeys);
  const importApiKeys = useSettingsStore((s) => s.importApiKeys);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const customSupabaseUrl = useSettingsStore((s) => s.customSupabaseUrl);
  const customSupabaseAnonKey = useSettingsStore((s) => s.customSupabaseAnonKey);
  const setCustomSupabaseConfig = useSettingsStore((s) => s.setCustomSupabaseConfig);
  const customR2AccountId = useSettingsStore((s) => s.customR2AccountId);
  const customR2BucketName = useSettingsStore((s) => s.customR2BucketName);
  const customR2AccessKeyId = useSettingsStore((s) => s.customR2AccessKeyId);
  const customR2SecretAccessKey = useSettingsStore((s) => s.customR2SecretAccessKey);
  const customR2PublicUrl = useSettingsStore((s) => s.customR2PublicUrl);
  const setCustomR2Config = useSettingsStore((s) => s.setCustomR2Config);
  const activeMediaStorageDriver = useSettingsStore((s) => s.activeMediaStorageDriver);
  const setActiveMediaStorageDriver = useSettingsStore((s) => s.setActiveMediaStorageDriver);
  const dynamicModels = useSettingsStore((s) => s.dynamicModels);
  const isLoadingModels = useSettingsStore((s) => s.isLoadingModels);
  const refreshModels = useSettingsStore((s) => s.refreshModels);

  const sessions = useChatStore((s) => s.sessions);
  const messages = useChatStore((s) => s.messages);
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const tier = useAuthStore((s) => s.tier);
  const setTier = useAuthStore((s) => s.setTier);
  const paidCredits = useCreditStore((s) => s.paidCredits) || 0;
  const addPaidCredits = useCreditStore((s) => s.addPaidCredits);
  const setPricingModalOpen = useCreditStore((s) => s.setPricingModalOpen);
  const signOut = useAuthStore((s) => s.signOut);
  const t = getTranslation(language);

  const [draftKeys, setDraftKeys] = useState<Record<string, { apiKey?: string; baseUrl?: string }>>({});
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});
  const [statusNotice, setStatusNotice] = useState('');
  const [providerSearch, setProviderSearch] = useState('');
  const [providerCategory, setProviderCategory] = useState<'all' | 'chat' | 'audio' | 'image' | 'video' | 'search' | 'custom'>('all');
  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<string, boolean>>({});
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Enterprise Custom Supabase Form State
  const [enterpriseUrlInput, setEnterpriseUrlInput] = useState(customSupabaseUrl || '');
  const [enterpriseAnonKeyInput, setEnterpriseAnonKeyInput] = useState(customSupabaseAnonKey || '');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showEnterpriseGuide, setShowEnterpriseGuide] = useState(false);
  const [showR2Guide, setShowR2Guide] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Enterprise Custom R2 Form State
  const [r2AccountId, setR2AccountId] = useState(customR2AccountId || '');
  const [r2BucketName, setR2BucketName] = useState(customR2BucketName || '');
  const [r2AccessKeyId, setR2AccessKeyId] = useState(customR2AccessKeyId || '');
  const [r2SecretAccessKey, setR2SecretAccessKey] = useState(customR2SecretAccessKey || '');
  const [r2PublicUrl, setR2PublicUrl] = useState(customR2PublicUrl || '');
  const [r2Saved, setR2Saved] = useState(false);
  const [showR2Secret, setShowR2Secret] = useState(false);

  // Media Transfer State (R2 ⇄ Supabase Storage)
  const [isTransferringMedia, setIsTransferringMedia] = useState(false);
  const [mediaTransferResult, setMediaTransferResult] = useState<{ success: boolean; message: string } | null>(null);

  // Database Migration & Import/Export State
  const [isProcessingDb, setIsProcessingDb] = useState(false);
  const [dbStatusMsg, setDbStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [showMigrationConfirm, setShowMigrationConfirm] = useState(false);
  const [migrationDirection, setMigrationDirection] = useState<'push' | 'pull' | null>(null);
  const [migrationMode, setMigrationMode] = useState<'merge' | 'replace'>('merge');

  // Database Tab View Mode Switcher ('local' | 'pro' | 'enterprise')
  const [dbViewMode, setDbViewMode] = useState<'local' | 'pro' | 'enterprise'>(
    tier === 'enterprise' ? 'enterprise' : tier === 'pro' ? 'pro' : 'local'
  );

  useEffect(() => {
    if (tier === 'enterprise') setDbViewMode('enterprise');
    else if (tier === 'pro') setDbViewMode('pro');
    else setDbViewMode('local');
  }, [tier]);

  // Local & Cloud File Input Refs
  const localFileInputRef = useRef<HTMLInputElement>(null);
  const cloudFileInputRef = useRef<HTMLInputElement>(null);

  const confirmWord = language === 'id' ? 'HAPUS' : 'DELETE';

  useEffect(() => {
    setEnterpriseUrlInput(customSupabaseUrl || '');
    setEnterpriseAnonKeyInput(customSupabaseAnonKey || '');
  }, [customSupabaseUrl, customSupabaseAnonKey]);

  const showNotification = (msg: string, isError = false) => {
    setDbStatusMsg({ text: msg, isError });
    setTimeout(() => {
      setDbStatusMsg(null);
    }, 4500);
  };

  const handleMediaTransfer = async (direction: 'r2_to_supabase' | 'supabase_to_r2') => {
    if (!session?.access_token) {
      showNotification(language === 'id' ? 'Silakan login terlebih dahulu.' : 'Please sign in first.', true);
      return;
    }
    setIsTransferringMedia(true);
    setMediaTransferResult(null);
    try {
      const res = await fetch('/api/storage/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          direction,
          customSupabase: customSupabaseUrl ? { url: customSupabaseUrl, anonKey: customSupabaseAnonKey } : undefined,
          customR2: r2AccountId ? {
            accountId: r2AccountId,
            bucketName: r2BucketName,
            accessKeyId: r2AccessKeyId,
            secretAccessKey: r2SecretAccessKey,
            publicUrl: r2PublicUrl,
          } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Transfer failed');
      setMediaTransferResult({
        success: true,
        message: data.message || (language === 'id' ? 'Transfer media berhasil!' : 'Media transfer successful!'),
      });
      showNotification(data.message || (language === 'id' ? 'Transfer media selesai!' : 'Media transfer complete!'));
    } catch (err: any) {
      setMediaTransferResult({
        success: false,
        message: err.message || (language === 'id' ? 'Gagal mentransfer media' : 'Failed to transfer media'),
      });
      showNotification(err.message || 'Transfer failed', true);
    } finally {
      setIsTransferringMedia(false);
    }
  };

  const executeDeleteAccount = async () => {
    setIsDeletingAccount(true);
    setDeleteError('');
    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ userId: user?.id }),
      });
      const data = await res.json();
      if (data.success) {
        await signOut();
        if (typeof window !== 'undefined') {
          localStorage.clear();
          window.location.href = '/register?deleted=true';
        }
      } else {
        setDeleteError(data.error || 'Failed to delete account');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Unexpected error');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const toggleVisibility = (id: string) => {
    setVisibleKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDraftKeyChange = (providerId: string, value: string) => {
    setDraftKeys((prev) => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        apiKey: value,
      },
    }));
  };

  const handleDraftBaseUrlChange = (providerId: string, baseUrl: string) => {
    setDraftKeys((prev) => ({
      ...prev,
      [providerId]: {
        ...prev[providerId],
        baseUrl,
      },
    }));
  };

  const handleSaveProvider = (providerId: LLMProviderId) => {
    const draft = draftKeys[providerId];
    const savedKey = apiKeys[providerId]?.apiKey || '';
    const savedUrl = apiKeys[providerId]?.baseUrl;

    const keyToSave = draft?.apiKey !== undefined ? draft.apiKey : savedKey;
    const urlToSave = draft?.baseUrl !== undefined ? draft.baseUrl : savedUrl;

    setApiKey(providerId, keyToSave, urlToSave);
    setSavedStatus((prev) => ({ ...prev, [providerId]: true }));
    setDraftKeys((prev) => {
      const next = { ...prev };
      delete next[providerId];
      return next;
    });
    setTimeout(() => {
      setSavedStatus((prev) => ({ ...prev, [providerId]: false }));
    }, 2500);
  };

  const handleCancelProvider = (providerId: LLMProviderId) => {
    setDraftKeys((prev) => {
      const next = { ...prev };
      delete next[providerId];
      return next;
    });
  };

  const handleClearAll = () => {
    if (confirm(language === 'id' ? 'Apakah Anda yakin ingin menghapus semua kunci API dari perangkat ini?' : 'Are you sure you want to clear all stored API keys from this device?')) {
      clearAllKeys();
      setStatusNotice(language === 'id' ? 'Semua kunci API telah dihapus dari browser ini.' : 'All API keys cleared from this browser.');
      setTimeout(() => setStatusNotice(''), 3000);
    }
  };

  // ─── ENTERPRISE CUSTOM SUPABASE ACTIONS ──────────────────────────────────────
  const handleSaveEnterpriseConfig = async () => {
    setCustomSupabaseConfig(enterpriseUrlInput, enterpriseAnonKeyInput);
    if (tier !== 'enterprise') {
      await setTier('enterprise');
    }
    showNotification(
      language === 'id'
        ? '✓ Konfigurasi Custom Supabase Enterprise berhasil disimpan!'
        : '✓ Custom Supabase Enterprise configuration saved successfully!'
    );
  };

  const handleTestEnterpriseConnection = async () => {
    const url = enterpriseUrlInput.trim();
    const key = enterpriseAnonKeyInput.trim();

    if (!url || !key) {
      setTestResult({
        success: false,
        message: language === 'id' ? 'Harap masukkan URL dan Anon Key Supabase terlebih dahulu.' : 'Please enter both Supabase URL and Anon Key.',
      });
      return;
    }

    setIsTestingConnection(true);
    setTestResult(null);

    try {
      const client = createBrowserClient(url, key);
      const { error } = await client.from('chat_sessions').select('id').limit(1);

      if (error) {
        if (error.code === '42P01' || error.message.includes('relation "public.chat_sessions" does not exist')) {
          setTestResult({
            success: false,
            message: language === 'id'
              ? '⚠️ Terhubung ke Supabase, namun tabel belum dibuat. Harap jalankan skrip SQL Schema.'
              : '⚠️ Connected to Supabase, but schema tables not found. Please run the SQL schema.',
          });
        } else {
          setTestResult({
            success: false,
            message: `⚠️ ${error.message}`,
          });
        }
      } else {
        setTestResult({
          success: true,
          message: language === 'id'
            ? '✓ Berhasil terhubung ke Supabase Anda! Seluruh tabel dan RLS terverifikasi.'
            : '✓ Successfully connected to your Supabase! All tables & RLS verified.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || (language === 'id' ? 'Gagal terhubung ke server Supabase.' : 'Failed connecting to Supabase instance.'),
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleCopySqlSchema = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(FULL_SQL_SCHEMA_SNIPPET);
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 3000);
    }
  };

  // ─── LOCAL DATABASE ACTIONS ───────────────────────────────────────────────────
  const handleExportLocalDb = () => {
    try {
      DatabaseService.downloadLocalBackup();
      showNotification(
        language === 'id'
          ? '✓ Database lokal berhasil diekspor ke file JSON!'
          : '✓ Local database successfully exported to JSON!'
      );
    } catch (err: any) {
      showNotification(err?.message || 'Export failed', true);
    }
  };

  const handleImportLocalDbFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const result = DatabaseService.importLocalDatabase(parsed, migrationMode);
        showNotification(
          language === 'id'
            ? `✓ Berhasil memulihkan ke Lokal: ${result.sessionsCount} obrolan, ${result.messagesCount} pesan, ${result.foldersCount} folder.`
            : `✓ Restored to Local: ${result.sessionsCount} chats, ${result.messagesCount} messages, ${result.foldersCount} folders.`
        );
      } catch (err: any) {
        showNotification(err?.message || 'Failed parsing backup JSON', true);
      }
    };
    reader.readAsText(file);
    if (localFileInputRef.current) localFileInputRef.current.value = '';
  };

  // ─── CLOUD DATABASE ACTIONS ───────────────────────────────────────────────────
  const handleExportCloudDb = async () => {
    if (!session?.access_token) {
      showNotification(
        language === 'id'
          ? 'Silakan masuk dengan akun Anda untuk mengekspor database Cloud.'
          : 'Please sign in to export your Cloud database.',
        true
      );
      return;
    }

    setIsProcessingDb(true);
    try {
      await DatabaseService.exportCloudDatabase(session.access_token);
      showNotification(
        language === 'id'
          ? '✓ Database Cloud Supabase berhasil diekspor ke file JSON!'
          : '✓ Supabase Cloud database successfully exported to JSON!'
      );
    } catch (err: any) {
      showNotification(err?.message || 'Cloud export failed', true);
    } finally {
      setIsProcessingDb(false);
    }
  };

  const handleImportCloudDbFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.access_token) return;

    setIsProcessingDb(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const result = await DatabaseService.importCloudDatabase(
          parsed,
          session.access_token,
          migrationMode
        );
        showNotification(
          language === 'id'
            ? `✓ Database Cloud berhasil diperbarui (${result.imported?.sessions || 0} obrolan, ${result.imported?.messages || 0} pesan).`
            : `✓ Cloud database updated (${result.imported?.sessions || 0} chats, ${result.imported?.messages || 0} messages).`
        );
      } catch (err: any) {
        showNotification(err?.message || 'Failed importing to cloud', true);
      } finally {
        setIsProcessingDb(false);
      }
    };
    reader.readAsText(file);
    if (cloudFileInputRef.current) cloudFileInputRef.current.value = '';
  };

  // ─── MIGRATION ACTIONS ────────────────────────────────────────────────────────
  const triggerMigration = (dir: 'push' | 'pull') => {
    if (!session?.access_token) {
      showNotification(
        language === 'id'
          ? 'Silakan masuk terlebih dahulu untuk melakukan sinkronisasi/migrasi dengan Cloud.'
          : 'Please sign in to perform cloud migration.',
        true
      );
      return;
    }
    setMigrationDirection(dir);
    setShowMigrationConfirm(true);
  };

  const executeMigration = async () => {
    if (!session?.access_token || !migrationDirection) return;

    setIsProcessingDb(true);
    setShowMigrationConfirm(false);

    try {
      if (migrationDirection === 'push') {
        const result = await DatabaseService.migrateLocalToCloud(session.access_token, migrationMode);
        showNotification(
          language === 'id'
            ? `✓ Berhasil mengunggah lokal ke Cloud (${result.imported?.sessions || 0} obrolan tersinkronkan)!`
            : `✓ Uploaded local database to Cloud (${result.imported?.sessions || 0} chats synced)!`
        );
      } else {
        const result = await DatabaseService.migrateCloudToLocal(session.access_token, migrationMode);
        showNotification(
          language === 'id'
            ? `✓ Berhasil mengunduh Cloud ke lokal (${result.sessionsCount} obrolan, ${result.foldersCount} folder)!`
            : `✓ Downloaded Cloud database to Local storage (${result.sessionsCount} chats, ${result.foldersCount} folders)!`
        );
      }
    } catch (err: any) {
      showNotification(err?.message || 'Migration failed', true);
    } finally {
      setIsProcessingDb(false);
      setMigrationDirection(null);
    }
  };

  const tabs: Array<{ id: SettingsTab; label: string; icon: any }> = [
    { id: 'keys', label: language === 'id' ? 'Kunci API (BYOK)' : 'API Keys (BYOK)', icon: KeyRound },
    { id: 'appearance', label: language === 'id' ? 'Tampilan & Bahasa' : 'Appearance & Language', icon: Palette },
    { id: 'backup', label: language === 'id' ? 'Database & Cadangan' : 'Database & Backup', icon: Database },
  ];

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-responsive-container"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-xl, 16px)',
          boxShadow: 'var(--shadow-xl, 0 20px 40px rgba(0,0,0,0.3))',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-md, 8px)',
                background: 'rgba(0, 115, 234, 0.12)',
                color: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Settings size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {tabs.find((tab) => tab.id === activeTab)?.label ?? t.settings.title}
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '1px 0 0 0' }}>
                {activeTab === 'keys' && (language === 'id' ? 'Masukkan kunci API resmi Anda — tersimpan aman di browser lokal.' : 'Enter your official API keys — stored safely in local browser memory.')}
                {activeTab === 'appearance' && (language === 'id' ? 'Sesuaikan tema visual dan preferensi bahasa antarmuka.' : 'Customize visual theme and interface language preference.')}
                {activeTab === 'backup' && (language === 'id' ? 'Ekspor, impor, migrasi, dan konfigurasi database Custom Supabase Enterprise.' : 'Export, import, migrate, and configure Enterprise Custom Supabase.')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>



        {/* Modal Content Body */}
        <div style={{ padding: '20px', maxHeight: '68vh', overflowY: 'auto' }}>
          {statusNotice && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                background: 'rgba(0, 200, 117, 0.12)',
                border: '1px solid var(--accent-success)',
                borderRadius: '8px',
                color: 'var(--accent-success)',
                fontSize: '12.5px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={16} />
              <span>{statusNotice}</span>
            </div>
          )}

          {dbStatusMsg && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                background: dbStatusMsg.isError ? 'rgba(239, 68, 68, 0.12)' : 'rgba(0, 115, 234, 0.12)',
                border: `1px solid ${dbStatusMsg.isError ? 'var(--accent-danger)' : 'var(--brand-primary)'}`,
                borderRadius: '8px',
                color: dbStatusMsg.isError ? 'var(--accent-danger)' : 'var(--brand-primary)',
                fontSize: '12.5px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {dbStatusMsg.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              <span>{dbStatusMsg.text}</span>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
           * TAB 1: API KEYS (BYOK)
           * ───────────────────────────────────────────────────────────── */}
          {activeTab === 'keys' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  padding: '12px 14px',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md, 8px)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <ShieldCheck size={18} color="var(--accent-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>
                    {t.settings.privacyTitle}
                  </h4>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                    {t.settings.privacyDescription}
                  </p>
                </div>
              </div>

              {/* Category Filter & Search */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search
                      size={14}
                      color="var(--text-muted)"
                      style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      type="text"
                      value={providerSearch}
                      onChange={(e) => setProviderSearch(e.target.value)}
                      placeholder={
                        language === 'id'
                          ? 'Cari provider (OpenAI, Claude, DeepSeek, Groq, OpenRouter, Mistral, ElevenLabs, dll)...'
                          : 'Search provider (OpenAI, Claude, DeepSeek, Groq, OpenRouter, Mistral, ElevenLabs, etc)...'
                      }
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 32px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-main)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    />
                  </div>
                  {providerSearch && (
                    <button
                      type="button"
                      onClick={() => setProviderSearch('')}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-main)',
                        color: 'var(--text-muted)',
                        fontSize: '11.5px',
                        cursor: 'pointer',
                      }}
                    >
                      {language === 'id' ? 'Reset' : 'Clear'}
                    </button>
                  )}
                </div>

                {/* Category Chips */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                  {[
                    { id: 'all', label: language === 'id' ? `Semua (${PROVIDER_DEFINITIONS.length})` : `All (${PROVIDER_DEFINITIONS.length})` },
                    { id: 'chat', label: '💬 Chat & LLM' },
                    { id: 'audio', label: '🎵 Audio & Voice' },
                    { id: 'image', label: '🎨 Gambar & Video' },
                    { id: 'search', label: '🌐 Web Search' },
                    { id: 'custom', label: '⚙️ Gateway & Custom' },
                  ].map((cat) => {
                    const active = providerCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setProviderCategory(cat.id as any)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: `1px solid ${active ? '#60a5fa' : 'var(--border-subtle)'}`,
                          background: active ? 'rgba(96, 165, 250, 0.12)' : 'var(--bg-main)',
                          color: active ? '#60a5fa' : 'var(--text-secondary)',
                          fontSize: '11.5px',
                          fontWeight: active ? 650 : 500,
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
              </div>

              {/* Provider Key Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {PROVIDER_DEFINITIONS.filter((prov) => {
                  if (providerCategory !== 'all') {
                    if (providerCategory === 'image' && (prov.category === 'image' || prov.category === 'video')) {
                      // include both image and video
                    } else if (prov.category !== providerCategory) {
                      return false;
                    }
                  }
                  if (providerSearch.trim()) {
                    const q = providerSearch.toLowerCase().trim();
                    return (
                      prov.name.toLowerCase().includes(q) ||
                      prov.id.toLowerCase().includes(q) ||
                      (prov.description && prov.description.toLowerCase().includes(q))
                    );
                  }
                  return true;
                }).map((prov) => {
                  const cfg = apiKeys[prov.id];
                  const hasSaved = savedStatus[prov.id];
                  const isVisible = visibleKeys[prov.id];
                  const isEndpointOpen = Boolean(expandedEndpoints[prov.id]);

                  const savedKey = cfg?.apiKey || '';
                  const savedBaseUrl =
                    prov.id === 'omniroute'
                      ? (!cfg?.baseUrl || cfg?.baseUrl?.includes('openrouter.ai') ? 'http://localhost:20128/v1' : cfg.baseUrl)
                      : prov.id === 'custom'
                      ? (cfg?.baseUrl?.includes('openrouter.ai') ? 'http://localhost:1234/v1' : (cfg?.baseUrl || 'http://localhost:1234/v1'))
                      : (cfg?.baseUrl || prov.defaultBaseUrl || '');

                  const currentKey = draftKeys[prov.id]?.apiKey !== undefined ? draftKeys[prov.id]!.apiKey! : savedKey;
                  const currentBaseUrl = draftKeys[prov.id]?.baseUrl !== undefined ? draftKeys[prov.id]!.baseUrl! : savedBaseUrl;

                  const isKeyDirty = currentKey !== savedKey;
                  const isUrlDirty = draftKeys[prov.id]?.baseUrl !== undefined && draftKeys[prov.id]!.baseUrl !== savedBaseUrl;
                  const isDirty = isKeyDirty || isUrlDirty;

                  if (prov.id === 'anticeil') {
                    return (
                      <div
                        key={prov.id}
                        style={{
                          padding: '12px 14px',
                          background: 'rgba(0, 115, 234, 0.05)',
                          border: '1px solid rgba(0, 115, 234, 0.25)',
                          borderRadius: 'var(--radius-md, 8px)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ProviderBrandLogo provider={prov.id} size={18} />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {prov.name}
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: 'var(--accent-success)',
                              }}
                            >
                              DEFAULT • FREE
                            </span>
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--accent-success)', fontWeight: 600 }}>
                            ✓ {language === 'id' ? 'Aktif & Siap Pakai' : 'Active & Ready'}
                          </span>
                        </div>
                        <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0 }}>
                          {language === 'id'
                            ? 'Provider bawaan Anticeil gratis tanpa perlu memasukkan API key. Menyediakan model Google Gemini & Groq Cloud LPU.'
                            : 'Built-in free tier provider. No API key needed. Powered by Google Gemini and Groq Cloud LPU.'}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={prov.id}
                      style={{
                        padding: '12px 14px',
                        background: 'var(--bg-main)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md, 8px)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <ProviderBrandLogo provider={prov.id} size={18} />
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {prov.name}
                          </span>
                          {prov.category && (
                            <span
                              style={{
                                fontSize: '9.5px',
                                fontWeight: 600,
                                padding: '1px 5px',
                                borderRadius: '4px',
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-muted)',
                              }}
                            >
                              {prov.category.toUpperCase()}
                            </span>
                          )}
                        </div>
                        {isDirty ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleSaveProvider(prov.id)}
                              style={{
                                padding: '5px 12px',
                                background: 'var(--brand-primary, #0073ea)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '11.5px',
                                fontWeight: 650,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                              }}
                            >
                              <Check size={12} />
                              <span>{language === 'id' ? 'Simpan' : 'Save'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelProvider(prov.id)}
                              style={{
                                padding: '5px 9px',
                                background: 'var(--bg-subtle)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '6px',
                                fontSize: '11.5px',
                                fontWeight: 500,
                                cursor: 'pointer',
                              }}
                            >
                              {language === 'id' ? 'Batal' : 'Cancel'}
                            </button>
                          </div>
                        ) : hasSaved ? (
                          <span style={{ fontSize: '11px', color: 'var(--accent-success)', fontWeight: 600 }}>
                            ✓ {t.settings.saved}
                          </span>
                        ) : null}
                      </div>

                      {prov.id === 'omniroute' ? (
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 2px 0' }}>
                          Local AI Router & Gateway (
                          {(dynamicModels.omniroute?.length || 0) > 0
                            ? `${dynamicModels.omniroute?.length}+ model routing`
                            : 'multi-model routing'}
                          , fallback & load balancing di port 20128).
                        </p>
                      ) : prov.description ? (
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 2px 0' }}>
                          {prov.description}
                        </p>
                      ) : null}

                      {/* OmniRoute & Gateway Info Banner */}
                      {prov.id === 'omniroute' && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            background: 'rgba(99, 102, 241, 0.08)',
                            borderRadius: '6px',
                            border: '1px solid rgba(99, 102, 241, 0.25)',
                          }}
                        >
                          <span style={{ fontSize: '11px', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e' }} />
                            {(dynamicModels.omniroute?.length || 0) > 0
                              ? `${dynamicModels.omniroute?.length} model terdeteksi di OmniRoute (Port 20128)`
                              : 'OmniRoute Gateway aktif (Port 20128)'}
                          </span>
                          <button
                            type="button"
                            onClick={() => refreshModels('omniroute')}
                            disabled={Boolean(isLoadingModels.omniroute)}
                            style={{
                              background: 'rgba(99, 102, 241, 0.15)',
                              border: '1px solid rgba(99, 102, 241, 0.4)',
                              borderRadius: '4px',
                              color: '#a5b4fc',
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              cursor: isLoadingModels.omniroute ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <RefreshCw size={10} style={{ animation: isLoadingModels.omniroute ? 'spin 1s linear infinite' : 'none' }} />
                            <span>{isLoadingModels.omniroute ? 'Fetching...' : 'Sync Models'}</span>
                          </button>
                        </div>
                      )}

                      {prov.id === 'custom' && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            background: 'rgba(59, 130, 246, 0.08)',
                            borderRadius: '6px',
                            border: '1px solid rgba(59, 130, 246, 0.25)',
                          }}
                        >
                          <span style={{ fontSize: '11px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#3b82f6' }} />
                            {(dynamicModels.custom?.length || 0) > 0
                              ? `${dynamicModels.custom?.length} model terhubung`
                              : 'Custom OpenAI-compatible Endpoint'}
                          </span>
                          <button
                            type="button"
                            onClick={() => refreshModels('custom')}
                            disabled={Boolean(isLoadingModels.custom)}
                            style={{
                              background: 'rgba(59, 130, 246, 0.15)',
                              border: '1px solid rgba(59, 130, 246, 0.4)',
                              borderRadius: '4px',
                              color: '#93c5fd',
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              cursor: isLoadingModels.custom ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <RefreshCw size={10} style={{ animation: isLoadingModels.custom ? 'spin 1s linear infinite' : 'none' }} />
                            <span>{isLoadingModels.custom ? 'Fetching...' : 'Sync Models'}</span>
                          </button>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                          <input
                            type={isVisible ? 'text' : 'password'}
                            name={`anticeil-apikey-${prov.id}`}
                            id={`anticeil-apikey-${prov.id}`}
                            autoComplete="new-password"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            data-lpignore="true"
                            data-1p-ignore="true"
                            data-form-type="other"
                            value={currentKey}
                            onChange={(e) => handleDraftKeyChange(prov.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveProvider(prov.id);
                              }
                            }}
                            placeholder={
                              prov.id === 'omniroute'
                                ? 'API Key (Opsional / Lewati untuk OmniRoute)...'
                                : prov.id === 'custom'
                                ? 'API Key (Opsional untuk Local Endpoint)...'
                                : `${t.settings.enterKeyFor} ${prov.name}...`
                            }
                            style={{
                              width: '100%',
                              padding: '7px 32px 7px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-strong)',
                              background: 'var(--bg-surface)',
                              color: 'var(--text-primary)',
                              fontSize: '12px',
                              outline: 'none',
                              fontFamily: 'monospace',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => toggleVisibility(prov.id)}
                            style={{
                              position: 'absolute',
                              right: '6px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '2px',
                            }}
                          >
                            {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>

                        {/* Base URL Toggle Button */}
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedEndpoints((prev) => ({
                              ...prev,
                              [prov.id]: !prev[prov.id],
                            }))
                          }
                          style={{
                            padding: '7px 10px',
                            background: isEndpointOpen ? 'rgba(96, 165, 250, 0.12)' : 'var(--bg-surface)',
                            border: `1px solid ${isEndpointOpen ? '#60a5fa' : 'var(--border-subtle)'}`,
                            borderRadius: '6px',
                            color: isEndpointOpen ? '#60a5fa' : 'var(--text-secondary)',
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap',
                          }}
                          title={language === 'id' ? 'Sesuaikan Endpoint Base URL' : 'Custom Base URL Endpoint'}
                        >
                          <span>⚙️ Endpoint</span>
                        </button>

                        {prov.docUrl && (
                          <a
                            href={prov.docUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '7px 10px',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '6px',
                              color: 'var(--text-secondary)',
                              fontSize: '11.5px',
                              textDecoration: 'none',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <span>{t.settings.getApiKey}</span>
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>

                      {/* Expanded Base URL field */}
                      {(isEndpointOpen || prov.id === 'omniroute' || prov.id === 'custom') && (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            background: 'var(--bg-surface)',
                            border: '1px dashed var(--border-subtle)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                              {language === 'id' ? 'Base URL Endpoint:' : 'Base URL Endpoint:'}
                            </label>
                            {prov.id === 'omniroute' && (
                              <span style={{ fontSize: '10px', color: '#818cf8', fontWeight: 600 }}>
                                Default: http://localhost:20128/v1
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            name={`anticeil-baseurl-${prov.id}`}
                            id={`anticeil-baseurl-${prov.id}`}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            data-lpignore="true"
                            data-1p-ignore="true"
                            value={currentBaseUrl}
                            onChange={(e) => handleDraftBaseUrlChange(prov.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveProvider(prov.id);
                              }
                            }}
                            placeholder={
                              prov.id === 'omniroute'
                                ? 'http://localhost:20128/v1'
                                : prov.id === 'custom'
                                ? 'http://localhost:1234/v1'
                                : (prov.defaultBaseUrl || 'https://api.openai.com/v1')
                            }
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-subtle)',
                              background: 'var(--bg-main)',
                              color: 'var(--text-primary)',
                              fontSize: '11.5px',
                              fontFamily: 'monospace',
                              outline: 'none',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
           * TAB 2: APPEARANCE & LANGUAGE
           * ───────────────────────────────────────────────────────────── */}
          {activeTab === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Language Selector */}
              <div>
                <h3 style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                  {language === 'id' ? 'Bahasa Antarmuka' : 'Interface Language'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setLanguage('id')}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: language === 'id' ? '2px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                      background: language === 'id' ? 'rgba(0, 115, 234, 0.08)' : 'var(--bg-main)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <Globe size={18} color="var(--brand-primary)" />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>Bahasa Indonesia</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Default Lokal</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: language === 'en' ? '2px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                      background: language === 'en' ? 'rgba(0, 115, 234, 0.08)' : 'var(--bg-main)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <Globe size={18} color="var(--brand-primary)" />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>English (US)</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>International</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Theme Selector */}
              <div>
                <h3 style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                  {language === 'id' ? 'Tema Visual' : 'Visual Theme'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: theme === 'light' ? '2px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                      background: theme === 'light' ? 'rgba(0, 115, 234, 0.08)' : 'var(--bg-main)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <Sun size={18} color="#F59E0B" />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>Light Mode</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bright & Clean</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: theme === 'dark' ? '2px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                      background: theme === 'dark' ? 'rgba(0, 115, 234, 0.08)' : 'var(--bg-main)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <Moon size={18} color="#8B5CF6" />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>Dark Mode</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>High Contrast</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
           * TAB 4: DATABASE & STORAGE BACKUP (WITH DEDICATED MODE SWITCHER)
           * ───────────────────────────────────────────────────────────── */}
          {activeTab === 'backup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* ── Sub-Tab Mode Switcher (Local vs Pro Cloud vs Enterprise BYOD) ── */}
              <div
                style={{
                  display: 'flex',
                  padding: '4px',
                  background: 'var(--bg-main)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  gap: '6px',
                }}
              >
                {/* Tab 1: Local (Free Community) */}
                <button
                  type="button"
                  onClick={() => setDbViewMode('local')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '7px',
                    border: 'none',
                    background: dbViewMode === 'local' ? 'rgba(0, 200, 117, 0.15)' : 'transparent',
                    color: dbViewMode === 'local' ? '#00C875' : 'var(--text-secondary)',
                    fontSize: '12.5px',
                    fontWeight: dbViewMode === 'local' ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <HardDrive size={14} />
                  <span>{language === 'id' ? 'Mode Lokal (Free)' : 'Local Mode (Free)'}</span>
                  {tier === 'free' && (
                    <span style={{ fontSize: '9.5px', padding: '1px 5px', borderRadius: '4px', background: '#00C875', color: '#fff', fontWeight: 700 }}>
                      Active
                    </span>
                  )}
                </button>

                {/* Tab 2: Cloud Mode (Starter & Pro) */}
                <button
                  type="button"
                  onClick={() => setDbViewMode('pro')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '7px',
                    border: 'none',
                    background: dbViewMode === 'pro' ? 'rgba(0, 115, 234, 0.15)' : 'transparent',
                    color: dbViewMode === 'pro' ? '#0073EA' : 'var(--text-secondary)',
                    fontSize: '12.5px',
                    fontWeight: dbViewMode === 'pro' ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Cloud size={14} />
                  <span>{language === 'id' ? 'Mode Cloud (Starter / Pro)' : 'Cloud Mode (Starter / Pro)'}</span>
                  {(tier === 'starter' || tier === 'pro') && (
                    <span style={{
                      fontSize: '9.5px',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: tier === 'starter' ? '#f59e0b' : '#0073EA',
                      color: tier === 'starter' ? '#000' : '#fff',
                      fontWeight: 800,
                    }}>
                      {tier === 'starter' ? 'STARTER (5GB)' : 'PRO (10GB)'}
                    </span>
                  )}
                </button>

                {/* Tab 3: Enterprise BYOD (Custom DB & R2) */}
                <button
                  type="button"
                  onClick={() => setDbViewMode('enterprise')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '7px',
                    border: 'none',
                    background: dbViewMode === 'enterprise' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                    color: dbViewMode === 'enterprise' ? '#8B5CF6' : 'var(--text-secondary)',
                    fontSize: '12.5px',
                    fontWeight: dbViewMode === 'enterprise' ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Building size={14} />
                  <span>{language === 'id' ? 'Mode Enterprise' : 'Enterprise Mode'}</span>
                  {tier === 'enterprise' && (
                    <span style={{ fontSize: '9.5px', padding: '1px 5px', borderRadius: '4px', background: '#8B5CF6', color: '#fff', fontWeight: 700 }}>
                      Active
                    </span>
                  )}
                </button>
              </div>

              {/* Storage Quota & Capacity Widget (dynamically focused to selected mode) */}
              <StorageMeterPanel language={language} focusedMode={dbViewMode} />

              {/* ══════════════════════════════════════════════════════════════
               * SECTION 1: LOCAL MODE VIEW (FREE COMMUNITY)
               * ══════════════════════════════════════════════════════════════ */}
              {dbViewMode === 'local' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Local Database Card */}
                  <div
                    style={{
                      padding: '16px',
                      background: 'var(--bg-main)',
                      border: '1px solid rgba(0, 200, 117, 0.3)',
                      borderRadius: 'var(--radius-md, 10px)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <HardDrive size={18} color="var(--accent-success)" />
                        <div>
                          <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                            {language === 'id' ? 'Database Lokal (Browser localStorage)' : 'Local Database (Browser localStorage)'}
                          </h3>
                          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                            {language === 'id'
                              ? 'Cadangkan seluruh riwayat obrolan, pesan, folder, dan prompt persona Anda ke berkas JSON mandiri.'
                              : 'Export or import your complete local chats, folders, and prompts to JSON.'}
                          </p>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: 'rgba(0, 200, 117, 0.12)',
                          color: 'var(--accent-success)',
                        }}
                      >
                        LOCAL ENGINE
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={handleExportLocalDb}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 14px',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-strong)',
                          borderRadius: 'var(--radius-sm, 6px)',
                          color: 'var(--text-primary)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Download size={13} color="var(--accent-success)" />
                        <span>{t.settings.exportLocalDb}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => localFileInputRef.current?.click()}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 14px',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-strong)',
                          borderRadius: 'var(--radius-sm, 6px)',
                          color: 'var(--text-primary)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Upload size={13} color="var(--accent-success)" />
                        <span>{t.settings.importLocalDb}</span>
                      </button>

                      <input
                        type="file"
                        ref={localFileInputRef}
                        onChange={handleImportLocalDbFile}
                        accept=".json"
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>

                  {/* Local Sandbox Privacy Banner */}
                  <div
                    style={{
                      padding: '12px 14px',
                      background: 'rgba(0, 200, 117, 0.06)',
                      borderRadius: '8px',
                      border: '1px dashed rgba(0, 200, 117, 0.3)',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <ShieldCheck size={20} color="#00C875" style={{ flexShrink: 0 }} />
                    <span>
                      {language === 'id'
                        ? '🔒 Mode Lokal menjamin privasi 100%. Data disimpan di perangkat Anda tanpa ketergantungan server cloud.'
                        : '🔒 Local Mode guarantees 100% privacy. All chats and keys remain in your browser storage without cloud tracking.'}
                    </span>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════
               * SECTION 2: PRO CLOUD MODE VIEW (SUPABASE & R2)
               * ══════════════════════════════════════════════════════════════ */}
              {dbViewMode === 'pro' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Cloud Database (Supabase PostgreSQL) */}
                  <div
                    style={{
                      padding: '16px',
                      background: 'var(--bg-main)',
                      border: '1px solid rgba(0, 115, 234, 0.3)',
                      borderRadius: 'var(--radius-md, 10px)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Cloud size={18} color="var(--brand-primary)" />
                        <div>
                          <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                            {language === 'id' ? 'Database Cloud (Supabase PostgreSQL)' : 'Cloud Database (Supabase PostgreSQL)'}
                          </h3>
                          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                            {session?.user
                              ? (language === 'id' ? `Terhubung sebagai ${session.user.email}` : `Connected as ${session.user.email}`)
                              : (language === 'id' ? 'Masuk dengan akun Supabase untuk menggunakan fitur Database Cloud.' : 'Sign in to use Supabase Cloud Database.')}
                          </p>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: 'rgba(0, 115, 234, 0.12)',
                          color: 'var(--brand-primary)',
                        }}
                      >
                        PRO CLOUD
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      <button
                        type="button"
                        disabled={!session?.access_token || isProcessingDb}
                        onClick={handleExportCloudDb}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 14px',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-strong)',
                          borderRadius: 'var(--radius-sm, 6px)',
                          color: session?.access_token ? 'var(--text-primary)' : 'var(--text-muted)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: session?.access_token ? 'pointer' : 'not-allowed',
                          opacity: session?.access_token ? 1 : 0.6,
                        }}
                      >
                        <Download size={13} color="var(--brand-primary)" />
                        <span>{t.settings.exportCloudDb}</span>
                      </button>

                      <button
                        type="button"
                        disabled={!session?.access_token || isProcessingDb}
                        onClick={() => cloudFileInputRef.current?.click()}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 14px',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-strong)',
                          borderRadius: 'var(--radius-sm, 6px)',
                          color: session?.access_token ? 'var(--text-primary)' : 'var(--text-muted)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: session?.access_token ? 'pointer' : 'not-allowed',
                          opacity: session?.access_token ? 1 : 0.6,
                        }}
                      >
                        <Upload size={13} color="var(--brand-primary)" />
                        <span>{t.settings.importCloudDb}</span>
                      </button>

                      <input
                        type="file"
                        ref={cloudFileInputRef}
                        onChange={handleImportCloudDbFile}
                        accept=".json"
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>

                  {/* Bidirectional Migration Bridge for Pro Tier */}
                  <div
                    style={{
                      padding: '16px',
                      background: 'linear-gradient(135deg, rgba(0, 115, 234, 0.06), rgba(120, 75, 209, 0.05))',
                      border: '1.5px solid rgba(0, 115, 234, 0.25)',
                      borderRadius: 'var(--radius-md, 10px)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <ArrowRightLeft size={20} color="var(--brand-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                          {language === 'id' ? 'Jembatan Migrasi Antara Lokal & Cloud Pro' : 'Bidirectional Local ⇄ Cloud Migration'}
                        </h3>
                        <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0', lineHeight: 1.4 }}>
                          {language === 'id'
                            ? 'Pindahkan seluruh riwayat obrolan dan folder antara memori browser lokal dan database Supabase Cloud Pro.'
                            : 'Transfer all your local history and configs to Supabase Cloud, or pull down your cloud database to offline local storage.'}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      <button
                        type="button"
                        disabled={!session?.access_token || isProcessingDb}
                        onClick={() => triggerMigration('push')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          background: 'var(--brand-primary)',
                          border: 'none',
                          borderRadius: 'var(--radius-sm, 6px)',
                          color: '#FFFFFF',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: session?.access_token ? 'pointer' : 'not-allowed',
                          opacity: session?.access_token ? 1 : 0.6,
                        }}
                      >
                        <ArrowUpRight size={14} />
                        <span>{t.settings.migrateLocalToCloud}</span>
                      </button>

                      <button
                        type="button"
                        disabled={!session?.access_token || isProcessingDb}
                        onClick={() => triggerMigration('pull')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-strong)',
                          borderRadius: 'var(--radius-sm, 6px)',
                          color: session?.access_token ? 'var(--text-primary)' : 'var(--text-muted)',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: session?.access_token ? 'pointer' : 'not-allowed',
                          opacity: session?.access_token ? 1 : 0.6,
                        }}
                      >
                        <ArrowDownRight size={14} />
                        <span>{t.settings.migrateCloudToLocal}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════
               * SECTION 3: ENTERPRISE MODE VIEW (CUSTOM SUPABASE & CUSTOM R2)
               * ══════════════════════════════════════════════════════════════ */}
              {dbViewMode === 'enterprise' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* 0. Active Storage Driver Switcher Card */}
                  <div
                    style={{
                      padding: '14px 16px',
                      background: 'var(--bg-main)',
                      border: '1.5px solid var(--border-subtle)',
                      borderRadius: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap size={16} color="var(--brand-primary)" />
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {language === 'id' ? 'Driver Penyimpanan Media Aktif' : 'Active Media Storage Driver'}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {language === 'id' ? 'Tujuan penyimpanan file gambar, audio & video' : 'Destination for AI media uploads'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                      {/* Option 1: Supabase Storage */}
                      <div
                        onClick={() => setActiveMediaStorageDriver('supabase')}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: `1.5px solid ${activeMediaStorageDriver === 'supabase' ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                          background: activeMediaStorageDriver === 'supabase' ? 'rgba(0, 115, 234, 0.08)' : 'var(--bg-surface)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <input
                          type="radio"
                          name="enterpriseMediaDriver"
                          checked={activeMediaStorageDriver === 'supabase'}
                          onChange={() => setActiveMediaStorageDriver('supabase')}
                          style={{ marginTop: '3px', cursor: 'pointer', accentColor: 'var(--brand-primary)' }}
                        />
                        <div>
                          <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>⚡ Supabase Storage</span>
                            {activeMediaStorageDriver === 'supabase' && (
                              <span style={{ fontSize: '9.5px', padding: '1px 5px', borderRadius: '4px', background: 'var(--brand-primary)', color: '#fff', fontWeight: 700 }}>
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.35 }}>
                            {language === 'id'
                              ? 'Cukup 1 URL + Anon Key Supabase. Otomatis menggunakan bucket "anticeil-media".'
                              : '1 credential for Database & Storage (anticeil-media bucket).'}
                          </p>
                        </div>
                      </div>

                      {/* Option 2: Cloudflare R2 */}
                      <div
                        onClick={() => setActiveMediaStorageDriver('r2')}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: `1.5px solid ${activeMediaStorageDriver === 'r2' ? '#F38020' : 'var(--border-subtle)'}`,
                          background: activeMediaStorageDriver === 'r2' ? 'rgba(243, 128, 32, 0.08)' : 'var(--bg-surface)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <input
                          type="radio"
                          name="enterpriseMediaDriver"
                          checked={activeMediaStorageDriver === 'r2'}
                          onChange={() => setActiveMediaStorageDriver('r2')}
                          style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#F38020' }}
                        />
                        <div>
                          <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>☁️ Cloudflare R2</span>
                            {activeMediaStorageDriver === 'r2' && (
                              <span style={{ fontSize: '9.5px', padding: '1px 5px', borderRadius: '4px', background: '#F38020', color: '#fff', fontWeight: 700 }}>
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.35 }}>
                            {language === 'id'
                              ? 'Bucket S3 mandiri dengan Gratis Bandwidth Selamanya ($0 Zero Egress).'
                              : 'Dedicated S3 bucket with $0 Zero Egress bandwidth fees.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 1. Custom Supabase BYOD Configuration Card */}
                  <div
                    style={{
                      padding: '16px',
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.06), rgba(236, 72, 153, 0.04))',
                      border: '1.5px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: 'var(--radius-md, 10px)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <Server size={20} color="#8B5CF6" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                            {t.settings.customSupabaseTitle}
                          </h3>
                          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0', lineHeight: 1.4 }}>
                            {t.settings.customSupabaseSubtitle}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowEnterpriseGuide(true)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          background: 'rgba(139, 92, 246, 0.12)',
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                          color: '#8B5CF6',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <HelpCircle size={13} />
                        <span>{language === 'id' ? 'Panduan Supabase' : 'Supabase Guide'}</span>
                      </button>
                    </div>

                    {/* Form Inputs for Custom Supabase URL and Anon Key */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                          {t.settings.customSupabaseUrlLabel}
                        </label>
                        <input
                          type="text"
                          value={enterpriseUrlInput}
                          onChange={(e) => setEnterpriseUrlInput(e.target.value)}
                          placeholder="https://xyzcompany.supabase.co"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-strong)',
                            background: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                            fontSize: '12.5px',
                            outline: 'none',
                            fontFamily: 'monospace',
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                          {t.settings.customSupabaseAnonKeyLabel}
                        </label>
                        <input
                          type="password"
                          value={enterpriseAnonKeyInput}
                          onChange={(e) => setEnterpriseAnonKeyInput(e.target.value)}
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-strong)',
                            background: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                            fontSize: '12.5px',
                            outline: 'none',
                            fontFamily: 'monospace',
                          }}
                        />
                      </div>
                    </div>

                    {/* Test Result Message */}
                    {testResult && (
                      <div
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          background: testResult.success ? 'rgba(0, 200, 117, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          border: `1px solid ${testResult.success ? 'var(--accent-success)' : 'var(--accent-danger)'}`,
                          color: testResult.success ? 'var(--accent-success)' : 'var(--accent-danger)',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {testResult.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                        <span>{testResult.message}</span>
                      </div>
                    )}

                    {/* Action Buttons for Enterprise Custom DB */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={handleSaveEnterpriseConfig}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 14px',
                          background: '#8B5CF6',
                          border: 'none',
                          borderRadius: 'var(--radius-sm, 6px)',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Check size={13} />
                        <span>{language === 'id' ? 'Simpan Konfigurasi' : 'Save Config'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={isTestingConnection || !enterpriseUrlInput || !enterpriseAnonKeyInput}
                        onClick={handleTestEnterpriseConnection}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 14px',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-strong)',
                          borderRadius: 'var(--radius-sm, 6px)',
                          color: 'var(--text-primary)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: isTestingConnection ? 'wait' : 'pointer',
                          opacity: (!enterpriseUrlInput || !enterpriseAnonKeyInput) ? 0.6 : 1,
                        }}
                      >
                        <RefreshCw size={13} className={isTestingConnection ? 'animate-spin' : ''} />
                        <span>{isTestingConnection ? (language === 'id' ? 'Menguji...' : 'Testing...') : t.settings.testConnectionBtn}</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. Cloudflare R2 Enterprise Config */}
                  <div
                    style={{
                      padding: '16px',
                      background: 'var(--bg-main)',
                      border: '1px solid rgba(243, 128, 32, 0.3)',
                      borderRadius: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <Cloud size={20} color="#F38020" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                            {language === 'id' ? 'Cloudflare R2 — Media Storage' : 'Cloudflare R2 — Media Storage'}
                          </h3>
                          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0', lineHeight: 1.4 }}>
                            {language === 'id'
                              ? 'Gunakan bucket R2 milik Anda untuk menyimpan file gambar, audio, dan video'
                              : 'Use your own R2 bucket to store AI-generated images, audio, and video files'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowR2Guide(true)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          background: 'rgba(243, 128, 32, 0.12)',
                          border: '1px solid rgba(243, 128, 32, 0.35)',
                          color: '#F38020',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <HelpCircle size={13} />
                        <span>{language === 'id' ? 'Panduan R2' : 'R2 Guide'}</span>
                      </button>
                    </div>

                    {/* R2 Form Inputs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {([
                        { label: 'Account ID', placeholder: 'abc123def456...', value: r2AccountId, setter: setR2AccountId, secret: false },
                        { label: 'Bucket Name', placeholder: 'anticeil-media', value: r2BucketName, setter: setR2BucketName, secret: false },
                        { label: 'Access Key ID', placeholder: 'R2 Access Key ID', value: r2AccessKeyId, setter: setR2AccessKeyId, secret: false },
                        { label: language === 'id' ? 'Secret Access Key' : 'Secret Access Key', placeholder: '••••••••••••••••', value: r2SecretAccessKey, setter: setR2SecretAccessKey, secret: true },
                        { label: 'Public Bucket URL', placeholder: 'https://pub-xxx.r2.dev', value: r2PublicUrl, setter: setR2PublicUrl, secret: false },
                      ] as { label: string; placeholder: string; value: string; setter: (v: string) => void; secret: boolean }[]).map(({ label, placeholder, value, setter, secret }) => (
                        <div key={label}>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            {label}
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={secret && !showR2Secret ? 'password' : 'text'}
                              value={value}
                              onChange={(e) => setter(e.target.value)}
                              placeholder={placeholder}
                              style={{
                                width: '100%',
                                padding: secret ? '8px 36px 8px 12px' : '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-strong)',
                                background: 'var(--bg-surface)',
                                color: 'var(--text-primary)',
                                fontSize: '12px',
                                outline: 'none',
                                fontFamily: 'monospace',
                                boxSizing: 'border-box',
                              }}
                            />
                            {secret && (
                              <button
                                type="button"
                                onClick={() => setShowR2Secret((p) => !p)}
                                style={{
                                  position: 'absolute',
                                  right: '8px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: 'var(--text-muted)',
                                  padding: '2px',
                                }}
                              >
                                {showR2Secret ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Save Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomR2Config({
                            accountId: r2AccountId,
                            bucketName: r2BucketName,
                            accessKeyId: r2AccessKeyId,
                            secretAccessKey: r2SecretAccessKey,
                            publicUrl: r2PublicUrl,
                          });
                          setR2Saved(true);
                          setTimeout(() => setR2Saved(false), 2500);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 14px',
                          background: '#F38020',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {r2Saved ? <Check size={13} /> : <Cloud size={13} />}
                        <span>{r2Saved ? (language === 'id' ? 'Tersimpan!' : 'Saved!') : (language === 'id' ? 'Simpan Konfigurasi R2' : 'Save R2 Config')}</span>
                      </button>

                      {r2AccountId && r2BucketName && (
                        <span style={{ fontSize: '11px', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={13} />
                          {language === 'id' ? 'R2 terkonfigurasi' : 'R2 configured'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3. Bidirectional Media Transfer Bridge (R2 ⇄ Supabase Storage) */}
                  <div
                    style={{
                      padding: '16px',
                      background: 'linear-gradient(135deg, rgba(243, 128, 32, 0.06), rgba(0, 115, 234, 0.05))',
                      border: '1.5px solid rgba(243, 128, 32, 0.3)',
                      borderRadius: 'var(--radius-md, 10px)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <ArrowRightLeft size={20} color="#F38020" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                          {language === 'id'
                            ? 'Transfer & Sinkronisasi Media (R2 ⇄ Supabase Storage)'
                            : 'Media Files Transfer (Cloudflare R2 ⇄ Supabase Storage)'}
                        </h3>
                        <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0', lineHeight: 1.4 }}>
                          {language === 'id'
                            ? 'Pindahkan seluruh file gambar studio, audio, dan video yang ada di Cloudflare R2 ke Supabase Storage atau sebaliknya.'
                            : 'Copy all generated media files between your Cloudflare R2 bucket and Supabase Storage bucket.'}
                        </p>
                      </div>
                    </div>

                    {mediaTransferResult && (
                      <div
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          background: mediaTransferResult.success ? 'rgba(0, 200, 117, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          border: `1px solid ${mediaTransferResult.success ? 'var(--accent-success)' : 'var(--accent-danger)'}`,
                          color: mediaTransferResult.success ? 'var(--accent-success)' : 'var(--accent-danger)',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {mediaTransferResult.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                        <span>{mediaTransferResult.message}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      <button
                        type="button"
                        disabled={isTransferringMedia || !session?.access_token}
                        onClick={() => handleMediaTransfer('r2_to_supabase')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-strong)',
                          borderRadius: 'var(--radius-sm, 6px)',
                          color: 'var(--text-primary)',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: isTransferringMedia ? 'wait' : 'pointer',
                        }}
                      >
                        <RefreshCw size={13} className={isTransferringMedia ? 'animate-spin' : ''} />
                        <span>{language === 'id' ? 'Salin R2 ➔ Supabase Storage' : 'Copy R2 ➔ Supabase Storage'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={isTransferringMedia || !session?.access_token}
                        onClick={() => handleMediaTransfer('supabase_to_r2')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-strong)',
                          borderRadius: 'var(--radius-sm, 6px)',
                          color: 'var(--text-primary)',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: isTransferringMedia ? 'wait' : 'pointer',
                        }}
                      >
                        <RefreshCw size={13} className={isTransferringMedia ? 'animate-spin' : ''} />
                        <span>{language === 'id' ? 'Salin Supabase Storage ➔ R2' : 'Copy Supabase Storage ➔ R2'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 4. Bidirectional Migration Bridge for Enterprise BYOD Database */}
                  <div
                    style={{
                      padding: '16px',
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.06), rgba(0, 115, 234, 0.05))',
                      border: '1.5px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: 'var(--radius-md, 10px)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <ArrowRightLeft size={20} color="#8B5CF6" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                          {language === 'id' ? 'Jembatan Migrasi Antara Lokal & Supabase Enterprise' : 'Bidirectional Local ⇄ Enterprise DB Migration'}
                        </h3>
                        <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '2px 0 0 0', lineHeight: 1.4 }}>
                          {language === 'id'
                            ? 'Pindahkan seluruh riwayat percakapan antara memori browser lokal dan database Supabase Enterprise mandiri Anda.'
                            : 'Transfer all your local history and configs to your Enterprise Supabase instance, or pull down records to local storage.'}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      <button
                        type="button"
                        disabled={!session?.access_token || isProcessingDb}
                        onClick={() => triggerMigration('push')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          background: '#8B5CF6',
                          border: 'none',
                          borderRadius: 'var(--radius-sm, 6px)',
                          color: '#FFFFFF',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: session?.access_token ? 'pointer' : 'not-allowed',
                          opacity: session?.access_token ? 1 : 0.6,
                        }}
                      >
                        <ArrowUpRight size={14} />
                        <span>{language === 'id' ? 'Kirim Lokal ke Enterprise Cloud ➔' : 'Push Local to Enterprise ➔'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={!session?.access_token || isProcessingDb}
                        onClick={() => triggerMigration('pull')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-strong)',
                          borderRadius: 'var(--radius-sm, 6px)',
                          color: session?.access_token ? 'var(--text-primary)' : 'var(--text-muted)',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: session?.access_token ? 'pointer' : 'not-allowed',
                          opacity: session?.access_token ? 1 : 0.6,
                        }}
                      >
                        <ArrowDownRight size={14} />
                        <span>{language === 'id' ? 'Tarik Enterprise Cloud ke Lokal ➔' : 'Pull Enterprise to Local ➔'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Bottom Common Actions: Clear Keys & Delete Account ── */}
              <div
                style={{
                  padding: '16px',
                  background: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: 'var(--radius-md, 10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginTop: '6px',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--accent-danger)', margin: '0 0 2px 0' }}>
                    {t.settings.clearAllStoredKeys}
                  </h3>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0 }}>
                    {language === 'id'
                      ? 'Menghapus seluruh kunci API yang tersimpan di memori browser ini.'
                      : 'Wipe all locally stored API keys from this browser cache.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleClearAll}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid var(--accent-danger)',
                    borderRadius: 'var(--radius-sm, 6px)',
                    color: 'var(--accent-danger)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={13} />
                  <span>{t.settings.clearAllStoredKeys}</span>
                </button>
              </div>

              {/* Danger Zone: Permanent Account Deletion */}
              {user && (
                <div
                  style={{
                    padding: '16px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1.5px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: 'var(--radius-md, 10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--accent-danger)', margin: '0 0 2px 0' }}>
                      {language === 'id' ? 'Hapus Akun Permanen' : 'Permanently Delete Account'}
                    </h3>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0, maxWidth: '460px', lineHeight: 1.4 }}>
                      {language === 'id'
                        ? 'Menghapus akun Anda, profil, seluruh riwayat percakapan, dan file storage secara permanen dari server. Anda dapat mendaftar kembali kapan saja.'
                        : 'Permanently wipe your account, profile, all chat history, and uploaded storage files from the server. You can register again at any time.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setShowDeleteConfirm(true); setDeleteConfirmText(''); setDeleteError(''); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      background: 'var(--accent-danger)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm, 6px)',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Trash2 size={14} />
                    <span>{language === 'id' ? 'Hapus Akun Saya' : 'Delete My Account'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '7px 18px',
              borderRadius: 'var(--radius-md, 6px)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-primary)',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {language === 'id' ? 'Tutup' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );

  // Enterprise Setup Guide Modal
  const enterpriseGuideModal = showEnterpriseGuide ? (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '16px',
      }}
      onClick={() => setShowEnterpriseGuide(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1.5px solid #8B5CF6',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(139, 92, 246, 0.15)',
                color: '#8B5CF6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Building size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {t.settings.enterpriseGuideTitle}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {language === 'id' ? 'Setup Mandiri Supabase Cloud atau On-Premise' : 'Self-host / Dedicated Cloud Supabase Setup'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowEnterpriseGuide(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Step-by-Step Instructions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <div style={{ padding: '10px 12px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>
              {language === 'id' ? 'Langkah 1: Siapkan Proyek Supabase' : 'Step 1: Create Supabase Project'}
            </strong>
            <span>{t.settings.enterpriseGuideStep1}</span>
          </div>

          <div style={{ padding: '10px 12px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>
                {language === 'id' ? 'Langkah 2: Eksekusi Skrip SQL Schema' : 'Step 2: Execute SQL Schema'}
              </strong>
              <button
                type="button"
                onClick={handleCopySqlSchema}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: copiedSchema ? 'rgba(0, 200, 117, 0.15)' : 'var(--bg-surface)',
                  border: `1px solid ${copiedSchema ? 'var(--accent-success)' : 'var(--border-strong)'}`,
                  color: copiedSchema ? 'var(--accent-success)' : 'var(--text-primary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {copiedSchema ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedSchema ? (language === 'id' ? 'Tersalin!' : 'Copied!') : (language === 'id' ? 'Salin SQL Schema' : 'Copy SQL')}</span>
              </button>
            </div>
            <span>{t.settings.enterpriseGuideStep2}</span>
          </div>

          <div style={{ padding: '10px 12px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>
              {language === 'id' ? 'Langkah 3: Konfigurasi CORS & Allowed Redirects' : 'Step 3: Configure CORS & Redirects'}
            </strong>
            <span>{t.settings.enterpriseGuideStep3}</span>
          </div>

          <div style={{ padding: '10px 12px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>
              {language === 'id' ? 'Langkah 4: Masukkan URL & Anon Key' : 'Step 4: Enter URL & Anon Key'}
            </strong>
            <span>{t.settings.enterpriseGuideStep4}</span>
          </div>

          <div style={{ padding: '10px 12px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.35)' }}>
            <strong style={{ color: '#8B5CF6', display: 'block', marginBottom: '2px' }}>
              {language === 'id' ? 'Langkah 5: Storage Media Otomatis (anticeil-media)' : 'Step 5: Media Storage (anticeil-media)'}
            </strong>
            <span>
              {language === 'id'
                ? 'Skrip SQL di Langkah 2 sudah secara otomatis membuat bucket storage "anticeil-media" dan aturan keamanannya (RLS). Anda bisa langsung memilih "Supabase Storage" sebagai driver media aktif Anda, atau menggunakan Cloudflare R2 jika ingin Zero Egress.'
                : 'The SQL script in Step 2 automatically provisions the "anticeil-media" storage bucket and its RLS policies. You can immediately use "Supabase Storage" as your active media driver, or connect Cloudflare R2 for zero egress fees.'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
          <button
            type="button"
            onClick={() => setShowEnterpriseGuide(false)}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              background: '#8B5CF6',
              color: '#FFFFFF',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {language === 'id' ? 'Saya Mengerti' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // ─── CLOUDFLARE R2 ENTERPRISE GUIDE MODAL ────────────────────────────────────
  const r2GuideModal = showR2Guide ? (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '16px',
      }}
      onClick={() => setShowR2Guide(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1.5px solid #F38020',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '580px',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(243, 128, 32, 0.15)',
                color: '#F38020',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Cloud size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {language === 'id' ? 'Panduan Cloudflare R2 Enterprise' : 'Cloudflare R2 Enterprise Guide'}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {language === 'id'
                  ? 'Storage file media di infrastruktur Cloudflare milik Anda sendiri'
                  : 'Store media files on your own Cloudflare infrastructure'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowR2Guide(false)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Why R2 */}
        <div
          style={{
            padding: '10px 12px',
            background: 'rgba(243, 128, 32, 0.07)',
            borderRadius: '8px',
            border: '1px solid rgba(243, 128, 32, 0.25)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: '#F38020', display: 'block', marginBottom: '4px' }}>
            {language === 'id' ? '☁️ Apa itu Cloudflare R2?' : '☁️ What is Cloudflare R2?'}
          </strong>
          {language === 'id'
            ? 'R2 adalah object storage dari Cloudflare — mirip S3, tapi tanpa biaya egress. Anticeil menggunakannya untuk menyimpan file gambar, audio, dan video yang dihasilkan oleh AI. Dengan tier Enterprise, Anda menggunakan bucket R2 milik Anda sendiri sehingga semua file media tetap di bawah kendali penuh Anda.'
            : 'R2 is Cloudflare\'s object storage — similar to S3, but with zero egress fees. Anticeil uses it to store AI-generated images, audio, and video files. With Enterprise tier, you use your own R2 bucket so all media files remain fully under your control.'}
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>

          {/* Step 1 */}
          <div style={{ padding: '10px 12px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
              {language === 'id' ? 'Langkah 1: Buat Bucket R2' : 'Step 1: Create an R2 Bucket'}
            </strong>
            <ol style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <li>{language === 'id' ? 'Login ke' : 'Log in to'} <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer" style={{ color: '#F38020' }}>dash.cloudflare.com</a></li>
              <li>{language === 'id' ? 'Buka menu R2 Object Storage di sidebar kiri' : 'Open R2 Object Storage from the left sidebar'}</li>
              <li>{language === 'id' ? 'Klik "Create bucket" → beri nama (misal: anticeil-media)' : 'Click "Create bucket" → name it (e.g., anticeil-media)'}</li>
              <li>{language === 'id' ? 'Region: Pilih "Automatic" atau region terdekat' : 'Region: Choose "Automatic" or the nearest region'}</li>
            </ol>
          </div>

          {/* Step 2 */}
          <div style={{ padding: '10px 12px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
              {language === 'id' ? 'Langkah 2: Aktifkan Akses Publik (untuk file media)' : 'Step 2: Enable Public Access (for media files)'}
            </strong>
            <ol style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <li>{language === 'id' ? 'Buka bucket yang baru dibuat → tab "Settings"' : 'Open the new bucket → "Settings" tab'}</li>
              <li>{language === 'id' ? 'Di bagian "Public access", klik "Allow Access"' : 'Under "Public access", click "Allow Access"'}</li>
              <li>{language === 'id' ? 'Atau hubungkan custom domain melalui Cloudflare DNS' : 'Or connect a custom domain via Cloudflare DNS'}</li>
            </ol>
          </div>

          {/* Step 3 */}
          <div style={{ padding: '10px 12px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
              {language === 'id' ? 'Langkah 3: Buat API Token R2' : 'Step 3: Create an R2 API Token'}
            </strong>
            <ol style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <li>{language === 'id' ? 'Di halaman R2, klik "Manage R2 API tokens"' : 'On the R2 page, click "Manage R2 API tokens"'}</li>
              <li>{language === 'id' ? 'Klik "Create API token"' : 'Click "Create API token"'}</li>
              <li>{language === 'id' ? 'Permissions: Object Read & Write → pilih bucket spesifik Anda' : 'Permissions: Object Read & Write → select your specific bucket'}</li>
              <li>{language === 'id' ? 'Simpan: Access Key ID dan Secret Access Key (hanya tampil sekali!)' : 'Save: Access Key ID and Secret Access Key (shown only once!)'}</li>
            </ol>
          </div>

          {/* Step 4 */}
          <div style={{ padding: '10px 12px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
              {language === 'id' ? 'Langkah 4: Dapatkan Account ID & Endpoint' : 'Step 4: Get Your Account ID & Endpoint'}
            </strong>
            <ol style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <li>{language === 'id' ? 'Account ID: Tertera di sidebar kanan halaman R2' : 'Account ID: Visible in the right sidebar of the R2 page'}</li>
              <li>
                {language === 'id' ? 'Endpoint S3 format: ' : 'S3-compatible endpoint: '}
                <code style={{ fontSize: '11px', background: 'var(--bg-surface)', padding: '1px 4px', borderRadius: '3px', color: '#F38020' }}>
                  https://{'<ACCOUNT_ID>'}.r2.cloudflarestorage.com
                </code>
              </li>
            </ol>
          </div>

          {/* Step 5 */}
          <div style={{ padding: '10px 12px', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid rgba(243, 128, 32, 0.3)' }}>
            <strong style={{ color: '#F38020', display: 'block', marginBottom: '4px' }}>
              {language === 'id' ? 'Langkah 5: Masukkan Credentials di Settings' : 'Step 5: Enter Credentials in Settings'}
            </strong>
            <p style={{ margin: 0 }}>
              {language === 'id'
                ? 'Tutup panduan ini, lalu isi form "Cloudflare R2 — Media Storage" di halaman ini dengan Account ID, Bucket Name, Access Key ID, Secret Access Key, dan Public Bucket URL. Klik "Simpan Konfigurasi R2" — selesai!'
                : 'Close this guide, then fill in the "Cloudflare R2 — Media Storage" form on this page with your Account ID, Bucket Name, Access Key ID, Secret Access Key, and Public Bucket URL. Click "Save R2 Config" — done!'}
            </p>
          </div>
        </div>

        {/* Credentials summary box */}
        <div
          style={{
            padding: '12px',
            background: 'var(--bg-main)',
            borderRadius: '8px',
            border: '1px dashed rgba(243, 128, 32, 0.4)',
            fontSize: '11.5px',
            color: 'var(--text-secondary)',
          }}
        >
          <strong style={{ color: '#F38020', display: 'block', marginBottom: '6px' }}>
            {language === 'id' ? '📋 Informasi yang perlu disiapkan:' : '📋 Information to prepare:'}
          </strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontFamily: 'monospace', fontSize: '11px' }}>
            <span>• Cloudflare Account ID</span>
            <span>• R2 Bucket Name</span>
            <span>• R2 Access Key ID</span>
            <span>• R2 Secret Access Key</span>
            <span>• R2 Public Bucket URL</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
          <button
            type="button"
            onClick={() => setShowR2Guide(false)}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              background: '#F38020',
              color: '#FFFFFF',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {language === 'id' ? 'Saya Mengerti' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // Migration Confirmation Modal
  const migrationConfirmModal = showMigrationConfirm ? (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '16px',
      }}
      onClick={() => setShowMigrationConfirm(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1.5px solid var(--border-strong)',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '460px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(0, 115, 234, 0.12)',
              color: 'var(--brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowRightLeft size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {t.settings.confirmMigrationTitle}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              {migrationDirection === 'push' ? t.settings.migrateLocalToCloud : t.settings.migrateCloudToLocal}
            </p>
          </div>
        </div>

        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
          {migrationDirection === 'push'
            ? t.settings.confirmMigrationPush
            : t.settings.confirmMigrationPull}
        </p>

        {/* Merge vs Replace Mode Option */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', background: 'var(--bg-main)', borderRadius: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input
              type="radio"
              name="migmode"
              checked={migrationMode === 'merge'}
              onChange={() => setMigrationMode('merge')}
            />
            <span>{t.settings.mergeOption}</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <input
              type="radio"
              name="migmode"
              checked={migrationMode === 'replace'}
              onChange={() => setMigrationMode('replace')}
            />
            <span>{t.settings.replaceOption}</span>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setShowMigrationConfirm(false)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-strong)',
              background: 'var(--bg-subtle)',
              color: 'var(--text-secondary)',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {language === 'id' ? 'Batal' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={executeMigration}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--brand-primary)',
              color: '#FFFFFF',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {language === 'id' ? 'Lanjutkan Migrasi' : 'Proceed Migration'}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const deleteConfirmModal = showDeleteConfirm ? (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '16px',
      }}
      onClick={() => setShowDeleteConfirm(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1.5px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '440px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.12)',
              color: 'var(--accent-danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trash2 size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-danger)', margin: 0 }}>
              {language === 'id' ? 'Konfirmasi Hapus Akun' : 'Confirm Account Deletion'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              {language === 'id' ? 'Tindakan ini tidak dapat dibatalkan.' : 'This action is irreversible.'}
            </p>
          </div>
        </div>

        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
          {language === 'id'
            ? `Ketik kata "${confirmWord}" di bawah untuk menghapus seluruh data akun, obrolan, dan file storage secara permanen.`
            : `Type "${confirmWord}" below to confirm permanent deletion of your account and all associated cloud data.`}
        </p>

        <input
          type="text"
          value={deleteConfirmText}
          onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
          placeholder={confirmWord}
          style={{
            padding: '9px 12px',
            borderRadius: '8px',
            border: '1.5px solid var(--border-strong)',
            background: 'var(--bg-main)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '1px',
            outline: 'none',
          }}
        />

        {deleteError && (
          <div style={{ fontSize: '12px', color: 'var(--accent-danger)', fontWeight: 600 }}>
            ⚠️ {deleteError}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(false)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-strong)',
              background: 'var(--bg-subtle)',
              color: 'var(--text-secondary)',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {language === 'id' ? 'Batal' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={executeDeleteAccount}
            disabled={deleteConfirmText !== confirmWord || isDeletingAccount}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              background: deleteConfirmText === confirmWord ? 'var(--accent-danger)' : 'rgba(239,68,68,0.3)',
              color: '#FFFFFF',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: deleteConfirmText === confirmWord && !isDeletingAccount ? 'pointer' : 'not-allowed',
            }}
          >
            {isDeletingAccount
              ? (language === 'id' ? 'Menghapus...' : 'Deleting...')
              : (language === 'id' ? 'Ya, Hapus Akun' : 'Yes, Delete Account')}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {createPortal(modalContent, document.body)}
      {showEnterpriseGuide && createPortal(enterpriseGuideModal, document.body)}
      {showR2Guide && createPortal(r2GuideModal, document.body)}
      {showMigrationConfirm && createPortal(migrationConfirmModal, document.body)}
      {showDeleteConfirm && createPortal(deleteConfirmModal, document.body)}
    </>
  );
}

// ── Storage Meter Panel (reusable inside Settings backup tab) ──────────────
function StorageMeterPanel({
  language,
  focusedMode,
}: {
  language: string;
  focusedMode?: 'local' | 'pro' | 'enterprise';
}) {
  const breakdown = useStorageStore((s) => s.breakdown);
  const sources = useStorageStore((s) => s.sources);
  const localDetails = useStorageStore((s) => s.localDetails);
  const supabaseDetails = useStorageStore((s) => s.supabaseDetails);
  const r2Details = useStorageStore((s) => s.r2Details);
  const fileCount = useStorageStore((s) => s.fileCount);
  const syncFromSupabase = useStorageStore((s) => s.syncFromSupabase);
  const refreshLocalUsage = useStorageStore((s) => s.refreshLocalUsage);
  const isSyncing = useStorageStore((s) => s.isSyncing);
  const session = useAuthStore((s) => s.session);
  const tier = useAuthStore((s) => s.tier);
  const customR2BucketName = useSettingsStore((s) => s.customR2BucketName);

  // Initial calculation on mount
  useEffect(() => {
    refreshLocalUsage();
    if (session?.access_token) {
      syncFromSupabase(session.access_token, true);
    }
  }, [session?.access_token, syncFromSupabase, refreshLocalUsage]);

  const handleManualRefresh = () => {
    refreshLocalUsage();
    if (session?.access_token) {
      syncFromSupabase(session.access_token, true);
    }
  };

  const mode = focusedMode || tier || 'local';

  const localText = localDetails.textBytes || sources?.localTextBytes || 0;
  const localFiles = localDetails.fileBytes || sources?.localFileBytes || 0;
  const localTotal = localDetails.totalBytes || sources?.localBytes || (localText + localFiles);

  const dbText = supabaseDetails.textBytes || sources?.dbTextBytes || sources?.databaseBytes || 0;
  const dbFiles = supabaseDetails.fileBytes || sources?.dbFileBytes || 0;
  const dbTotal = supabaseDetails.totalBytes || sources?.databaseBytes || (dbText + dbFiles);

  const r2Total = r2Details.totalBytes || sources?.r2Bytes || 0;
  const r2Images = breakdown.images || 0;
  const r2OtherMedia = (breakdown.audio || 0) + (breakdown.docs || 0) + (breakdown.other || 0);

  // Quota calculation per focused mode
  const effectiveCloudTier = tier === 'starter' ? 'starter' : 'pro';
  const limitBytes = mode === 'enterprise'
    ? 100 * 1024 * 1024 * 1024 // 100 GB / Unlimited BYOD
    : mode === 'pro'
    ? (tier === 'starter' ? 5 * 1024 * 1024 * 1024 : 10 * 1024 * 1024 * 1024) // 5 GB for Starter, 10 GB for Pro
    : 100 * 1024 * 1024;      // 100 MB for Local

  const usedBytes = mode === 'local'
    ? localTotal
    : (dbTotal + r2Total) || localTotal;

  const percentage = Math.min(100, Math.round((usedBytes / limitBytes) * 100));
  const isNearLimit = percentage >= 85;
  const barColor = percentage >= 98
    ? '#EF4444'
    : isNearLimit
    ? '#F59E0B'
    : mode === 'enterprise'
    ? '#8B5CF6'
    : tier === 'starter'
    ? '#f59e0b'
    : '#0073EA';

  return (
    <div
      style={{
        padding: '16px',
        background: 'var(--bg-main)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md, 10px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Header with Title & Refresh */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {mode === 'local'
                ? (language === 'id' ? 'Kapasitas Penyimpanan Lokal' : 'Local Storage Quota & Utilization')
                : mode === 'pro'
                ? (tier === 'starter'
                    ? (language === 'id' ? 'Kapasitas Starter Cloud (5 GB)' : 'Starter Cloud Storage Quota (5 GB)')
                    : (language === 'id' ? 'Kapasitas Pro Cloud (10 GB)' : 'Pro Cloud Storage Quota (10 GB)'))
                : (language === 'id' ? 'Kapasitas Penyimpanan Enterprise BYOD' : 'Enterprise Storage Quota & Utilization')}
            </h3>
            <button
              type="button"
              onClick={handleManualRefresh}
              title={language === 'id' ? 'Hitung ulang pemakaian storage' : 'Recalculate storage usage'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                cursor: isSyncing ? 'wait' : 'pointer',
              }}
            >
              <RefreshCw size={11} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? (language === 'id' ? 'Menghitung...' : 'Syncing...') : (language === 'id' ? 'Hitung Ulang' : 'Refresh')}</span>
            </button>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
            {mode === 'enterprise'
              ? (language === 'id' ? `${fileCount} item tersimpan — Mode Enterprise (Dedicated Supabase & R2)` : `${fileCount} items stored — Enterprise Mode (BYOD Supabase & R2)`)
              : mode === 'pro'
              ? (tier === 'starter'
                  ? (language === 'id' ? `${fileCount} item tersimpan — Starter Cloud Mode (5 GB Supabase Cloud)` : `${fileCount} items stored — Starter Cloud Mode (5 GB Cloud)`)
                  : (language === 'id' ? `${fileCount} item tersimpan — Pro Cloud Mode (10 GB Cloud R2 + Supabase)` : `${fileCount} items stored — Pro Cloud Mode (10 GB Cloud)`))
              : (language === 'id' ? `${fileCount} item tersimpan — Mode Lokal (100 MB Browser Memory)` : `${fileCount} items stored — Local Mode (100 MB Local)`)}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: isSyncing ? '#F59E0B' : '#00C875',
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: '13.5px', fontWeight: 800, color: barColor, whiteSpace: 'nowrap' }}>
            {percentage}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div
          style={{
            width: '100%',
            height: '8px',
            borderRadius: '999px',
            background: 'var(--border-subtle)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              height: '100%',
              background: barColor,
              borderRadius: '999px',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)' }}>
          <span>{formatStorageBytes(usedBytes)} {language === 'id' ? 'terpakai' : 'used'}</span>
          <span>{formatStorageBytes(Math.max(0, limitBytes - usedBytes))} {language === 'id' ? 'tersisa dari' : 'free of'} {formatStorageBytes(limitBytes)}</span>
        </div>
      </div>

      {/* Engine Granular Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
        
        {/* Card 1: Local Storage Engine */}
        {(mode === 'local' || mode === 'pro' || mode === 'enterprise') && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'var(--bg-surface)',
              border: `1px solid ${mode === 'local' ? 'rgba(0, 200, 117, 0.45)' : 'var(--border-subtle)'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <HardDrive size={13} color="#00C875" />
                <span>Local Storage</span>
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(0, 200, 117, 0.12)',
                  color: '#00C875',
                }}
              >
                {mode === 'local' ? (language === 'id' ? 'Fokus Aktif' : 'Active') : (language === 'id' ? 'Lokal Browser' : 'Browser')}
              </span>
            </div>

            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {formatStorageBytes(localTotal)}
            </div>

            {/* Sub breakdown: Text vs Files */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '4px', borderTop: '1px solid var(--border-subtle)', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>{language === 'id' ? 'Database' : 'Database'}:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{formatStorageBytes(localText)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Storage:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{formatStorageBytes(localFiles)}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Card 2: Supabase Database Engine */}
        {(mode === 'pro' || mode === 'enterprise') && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'var(--bg-surface)',
              border: `1px solid ${mode === 'enterprise' ? 'rgba(139, 92, 246, 0.45)' : 'rgba(0, 115, 234, 0.45)'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Database size={13} color={mode === 'enterprise' ? '#8B5CF6' : '#0073EA'} />
                <span>{mode === 'enterprise' ? 'Supabase BYOD' : 'Supabase Cloud'}</span>
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: mode === 'enterprise' ? 'rgba(139, 92, 246, 0.12)' : 'rgba(0, 115, 234, 0.12)',
                  color: mode === 'enterprise' ? '#8B5CF6' : '#0073EA',
                }}
              >
                {mode === 'enterprise' ? 'Enterprise' : 'Pro Cloud'}
              </span>
            </div>

            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {formatStorageBytes(dbTotal)}
            </div>

            {/* Sub breakdown: Text vs Files */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '4px', borderTop: '1px solid var(--border-subtle)', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Database:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{formatStorageBytes(dbText)}</strong>
              </div>
              {mode === 'enterprise' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Storage:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{formatStorageBytes(dbFiles)}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Card 3: Cloudflare R2 Engine */}
        {(mode === 'pro' || mode === 'enterprise') && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'var(--bg-surface)',
              border: `1px solid ${sources?.isR2Available === false ? 'rgba(239, 68, 68, 0.4)' : 'rgba(243, 128, 32, 0.4)'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Cloud size={13} color="#F38020" />
                <span>{mode === 'enterprise' ? 'Enterprise R2' : 'Cloudflare R2'}</span>
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(243, 128, 32, 0.12)',
                  color: '#F38020',
                }}
              >
                {mode === 'enterprise' ? (customR2BucketName ? 'Custom R2' : 'Enterprise') : 'Object Store'}
              </span>
            </div>

            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {formatStorageBytes(r2Total)}
            </div>

            {/* Sub breakdown: Images vs Audio/Video/Docs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '4px', borderTop: '1px solid var(--border-subtle)', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Storage:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{formatStorageBytes(r2Images + r2OtherMedia)}</strong>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
