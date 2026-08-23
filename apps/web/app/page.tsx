'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Bot,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Sparkles,
  Layers,
  Globe,
  Film,
  FileText,
  CheckCircle,
  Check,
  Copy,
  ChevronDown,
  ChevronRight,
  Terminal,
  Volume2,
  DollarSign,
  Cpu,
  Play,
  Pause,
  KeyRound,
  ExternalLink,
  Code2,
  Sliders,
  HelpCircle,
  Activity,
  Compass,
  Flame,
  Menu,
  X,
  Languages,
  Search,
  Filter,
  Plus,
  Table,
  Kanban,
  Gauge,
  CircleDot,
  CheckSquare,
  Square,
  Workflow,
  Smile,
  Rocket,
  Brain,
  Mail,
  Server,
  CheckCircle2,
  Star,
  MousePointer2,
  ArrowUp,
  Paperclip,
  Mic,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  BotMessageSquare,
  MessageSquareText,
  Lightbulb,
  Laptop,
  Plug,
  GitBranch,
  Monitor,
  Smartphone,
  Download,
  HardDrive,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useSettingsStore } from '../src/features/settings/store/useSettingsStore';
import { MarkdownRenderer } from '../src/shared/components/MarkdownRenderer';
import { ProviderBrandLogo } from '../src/shared/components/ProviderLogos';
import Pricing_03 from '../src/components/ui/pricnig-cards03';
import CtaSection3 from '../src/components/ui/cta-section-3';

// Register useGSAP plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP);
}

export type Lang = 'en' | 'id';

const TRANSLATIONS = {
  en: {
    nav: {
      products: 'Products',
      workspaces: 'Work OS',
      features: 'Features',
      latency: 'Speed Radar',
      calculator: 'Cost Savings',
      pricing: 'Pricing',
      download: 'Download App',
      faq: 'FAQ',
      signIn: 'Log In',
      launchApp: 'Get Started Free',
    },
    hero: {
      badge: 'The AI Work OS for Power Users • 100% Direct BYOK Gateway',
      title1: 'A platform built for a',
      title2: 'new way of working with AI.',
      subtitle:
        'Connect OpenAI GPT-4o, Claude 3.7 Sonnet, Gemini 2.0, DeepSeek-R1, Groq LPU, and Ollama in one customizable Work OS with zero server proxy and zero data markup.',
      ctaPrimary: 'Get Started Free',
      ctaSecondary: 'Explore Live Board',
      selectorPrompt: 'What AI capability would you like to orchestrate?',
      benefits: {
        noCard: 'Tanpa kartu kredit',
        unlimited: 'BYOK Tanpa Batas',
        privacy: '100% Privat di Klien',
      },
      boardTitle: 'AI Work OS Orchestration Board',
      copyPrompt: 'Copy Prompt',
      copied: 'Copied!',
    },
    marqueeTitle: 'COMPATIBLE WITH EVERY MAJOR AI PROVIDER & LOCAL RUNTIME',
    workflowTabs: [
      { id: 'groq', label: 'groq | speed', iconKey: 'groq', color: '#FDAB3D', name: 'Groq 500 tok/s LPU' },
      { id: 'reasoning', label: 'deepseek | reasoning', iconKey: 'reasoning', color: '#A25DDC', name: 'DeepSeek-R1 Reasoning' },
      { id: 'claude', label: 'claude | code', iconKey: 'claude', color: '#0073EA', name: 'Claude 3.7 Hybrid' },
      { id: 'visual', label: 'luma | visual', iconKey: 'visual', color: '#E2445C', name: 'Visual & Video Studio' },
      { id: 'ollama', label: 'ollama | private', iconKey: 'ollama', color: '#00C875', name: 'Local Offline AI' },
    ],
    tableColumns: {
      task: 'Task / Prompt',
      model: 'Model & Provider',
      status: 'Status',
      speed: 'Throughput',
      latency: 'TTFT Latency',
      cost: 'Cost / Run',
    },
    boardRows: [
      {
        id: 'groq',
        task: 'DeepSeek-R1 concurrency refactor & benchmark',
        model: 'DeepSeek-R1 Distill 70B',
        provider: 'Groq LPU',
        status: 'Done',
        statusColor: '#00C875',
        speed: '492 tok/s',
        speedVal: 98,
        latency: '24ms',
        cost: '$0.00004',
        thinking: 'Thinking Process (0.24s): Evaluated event loop boundaries. Generated non-blocking streaming architecture.',
        prompt: 'Why is zero-proxy BYOK architecture fundamentally safer than cloud proxy SaaS?',
        response:
          'In a pure **Bring Your Own Key (BYOK)** architecture, HTTP streams dispatch directly from your browser to official provider gateways (OpenAI, Anthropic, Groq). Your API keys are encrypted in local storage • **no middleman servers can inspect, log, or train on your private conversation data**.',
      },
      {
        id: 'reasoning',
        task: 'Claude 3.7 concurrent async worker queue design',
        model: 'Claude 3.7 Sonnet',
        provider: 'Anthropic',
        status: 'Reasoning',
        statusColor: '#A25DDC',
        speed: '96 tok/s',
        speedVal: 32,
        latency: '110ms',
        cost: '$0.00015',
        thinking: 'Thinking Process (0.42s): Analyzed semaphore boundaries. Detected unbounded Promise.all. Applied p-limit queue.',
        prompt: 'Refactor this concurrent async pipeline to prevent thread pool starvation.',
        response:
          'To prevent thread starvation, decouple the ingestion queue from the worker pool using a bounded concurrency limiter (e.g. `pLimit(8)`). This ensures memory allocation remains constant under burst loads while maximizing CPU core saturation.',
      },
      {
        id: 'claude',
        task: 'GPT-4o autonomous live web grounding & synthesis',
        model: 'GPT-4o Mini',
        provider: 'OpenAI',
        status: 'Working on it',
        statusColor: '#FDAB3D',
        speed: '140 tok/s',
        speedVal: 48,
        latency: '85ms',
        cost: '$0.00008',
        thinking: 'Thinking Process (0.18s): Queried live search index, filtered spam domains, summarized cited sources.',
        prompt: 'Synthesize the latest advancements in client-side WebAssembly LLM runtimes.',
        response:
          'Modern WebAssembly runtimes with WebGPU support (like ONNX Runtime Web and WebLLM) achieve near-native FP16 inference directly on end-user hardware, unlocking 100% private offline conversational intelligence.',
      },
      {
        id: 'visual',
        task: 'Luma Ray 2 4K cinematic video clip rendering',
        model: 'Luma Ray 2 Studio',
        provider: 'Luma AI',
        status: 'Done',
        statusColor: '#00C875',
        speed: '24 FPS Video',
        speedVal: 75,
        latency: 'Instant',
        cost: '$0.00000',
        thinking: 'Visual Pipeline: Synthesized dynamic camera tracking prompt with ray-traced volumetric rain reflections.',
        prompt: 'Generate a cinematic 4K drone shot over neon-lit futuristic Tokyo in rain',
        response:
          '• Rendered 4K cinematic video clip (24 FPS, Motion Rate 1.25) with physical water droplet dispersion and reflections.',
        isVideo: true,
      },
      {
        id: 'ollama',
        task: 'Local Ollama offline security & compliance audit',
        model: 'Llama 3.3 70B Local',
        provider: 'Ollama Host',
        status: 'Local Direct',
        statusColor: '#0073EA',
        speed: '65 tok/s',
        speedVal: 22,
        latency: '10ms',
        cost: '$0.00 (Free)',
        thinking: 'Local Pipeline: Dispatched via localhost:11434 with zero network egress.',
        prompt: 'Audit this proprietary configuration schema for security misconfigurations.',
        response:
          'All parameters verified locally on your GPU. Zero telemetry or packet capture transmitted across external networks.',
      },
    ],
    radar: {
      title: 'Real-Time Streaming Throughput Radar',
      subtitle: 'Zero-Proxy client connections maximize raw provider bandwidth without bottle-necking.',
    },
    bento: {
      title: 'Engineered for Power Users & Teams',
      subtitle: 'Built with hardware-accelerated animations, zero-proxy security, and multimodal visual tools.',
      card1Title: '50ms Stream Throttling Engine',
      card1Desc:
        'Our 50ms sub-pixel rendering engine handles ultra-fast models generating up to 500 tokens/sec without freezing your browser event loop or thrashing localStorage writes.',
      card2Title: 'Zero-Proxy Data Ownership',
      card2Desc:
        'Your API keys and chat logs never touch our servers. Requests flow directly from your client machine straight to official provider APIs with optional JSON backup exports.',
      card3Title: 'AI Visual & Video Studio',
      card3Desc:
        'Prompt visual models directly for images and cinematic video clips. Includes built-in interactive video players with play, pause, mute, and instant file download controls.',
      card4Title: 'Live Autonomous Web Search',
      card4Desc:
        'Autonomous live web grounding queries real-time information and returns clean source citations without requiring a separate Perplexity subscription.',
      card5Title: 'Multi-File Document Parsing',
      card5Desc:
        'Drag-and-drop PDFs, Word documents, Excel sheets, and source code repositories with live token estimation and sub-second chunk extraction.',
      card6Title: 'Voice Dictation & Speech Synthesis',
      card6Desc:
        'Hover to preview natural wave synthesis! Hands-free speech-to-text dictation paired with instant TTS audio player.',
      card7Title: 'Visual Workflow & Cloud Automations',
      card7Desc:
        'Build powerful LLM pipelines with a no-code visual editor. Schedule cron jobs, wire webhook triggers, and chain AI steps into automated multi-step workflows that run 24/7 in the cloud.',
      card8Title: 'MCP Connectors — GitHub, Notion & More',
      card8Desc:
        'Connect your AI to the tools you already use. Pull live GitHub issues, read Notion pages, and sync Google Workspace data directly in your chat context via the Model Context Protocol.',
      card9Title: 'Live Artifact Builder & Code Sandbox',
      card9Desc:
        'Every code snippet the AI writes can be instantly previewed in a split-screen live sandbox. Render HTML, React, and SVG artifacts in one click — no copy-paste or external tools needed.',
    },
    calculator: {
      badge: '• Cost Efficiency & ROI • 98% Savings',
      title: 'Calculate Your True BYOK Cost Savings',
      subtitle: 'Compare what you pay for rigid $20/mo SaaS subscriptions vs paying raw provider wholesale token prices.',
      sliderLabel: 'Estimated Monthly Token Volume:',
      presetsLabel: 'Quick Workload Presets:',
      presets: [
        { label: '•xR• 100k (Casual)', value: 100000 },
        { label: '500k (Daily Work)', value: 500000 },
        { label: '1.5M (Research & Docs)', value: 1500000 },
        { label: '•xa• 3M (Full-Stack Dev)', value: 3000000 },
        { label: '5M (Heavy Power User)', value: 5000000 },
      ],
      low: '50k (Min)',
      mid: '1.5M (Standard Dev)',
      high: '5M (Heavy AI)',
      wordsEquiv: 'words',
      promptsEquiv: 'prompts',
      tradPlan: 'Traditional SaaS ($20/mo)',
      tradBadge: 'Rigid Flat Fee',
      tradDesc: 'Pay $20 every single month regardless of whether you chat once or a thousand times. 95%+ profit markup goes to SaaS middlemen.',
      tradAnnual: '$240.00 / year',
      byokPlan: 'Anticeil Free ($0 Platform Fee)',
      byokBadge: '100% Raw API Pricing',
      byokDesc: 'Anticeil charges $0. You pay only the raw token cost directly to OpenAI, Anthropic, DeepSeek (~$0.55/1M), or Groq (Free). 0% intermediary markup.',
      savingsPlan: 'Money Saved in Your Pocket',
      savingsBadge: 'Saved Monthly',
      savingsDesc: 'You keep this money every single month•unlocking significant budget for computing and productivity!',
    },
    faq: {
      badge: 'Support & FAQs',
      title: 'Frequently Asked Questions',
      subtitle: 'Everything you need to know about BYOK architecture, security, local offline runtimes, and cost savings.',
      supportCardTitle: 'Need customized setup?',
      supportCardDesc: 'Anticeil is 100% open-source and client-side. Explore our settings guide or test directly with your own keys.',
      supportCardCta: 'Open App Settings',
      items: [
        {
          id: '01',
          tag: 'Official Provider API',
          q: 'Is using your own API Key (BYOK) completely legal and safe?',
          a: '100% legal and official. Every AI provider (OpenAI, Anthropic, Google, DeepSeek, Groq) explicitly provides Developer API Keys for users to consume models directly in third-party clients without lock-in or subscription markups.',
        },
        {
          id: '02',
          tag: '100% Client-Side Vault',
          q: 'Where are my API keys stored and processed?',
          a: 'Your API keys are encrypted with AES-256-GCM and stored solely in your local browser storage • — or synced to your private profile if signed in. Anticeil has zero intermediary proxy servers•every request streams directly from your client to the AI provider endpoint.',
        },
        {
          id: '03',
          tag: 'Free Unlimited Tiers',
          q: 'How do I obtain free AI model API keys?',
          a: 'Providers like Google Gemini (Google AI Studio) and Groq Cloud offer generous, permanent free tiers with high throughput limits. You can copy the key in seconds from their official developer consoles and paste it into Settings.',
        },
        {
          id: '04',
          tag: '98% Cost Reduction',
          q: 'How much money do I save compared to fixed $20/month subscriptions?',
          a: 'Because you only pay for the exact tokens you consume at raw wholesale provider rates (e.g. DeepSeek-R1 at ~$0.55/1M tokens, Groq free, Gemini free), the average user spends less than $0.50/month instead of $20.00/month•saving 95% to 98% of typical AI costs.',
        },
        {
          id: '05',
          tag: 'Local Offline Ollama',
          q: 'Can I connect local offline models running via Ollama?',
          a: 'Absolutely! Anticeil includes native zero-config support for local Ollama runtimes on localhost:11434. You can chat completely offline with Llama 3.3, DeepSeek-R1 8B, and Qwen 2.5 with zero internet required.',
        },
        {
          id: '06',
          tag: 'Encrypted JSON Backup',
          q: 'Can I export, backup, and sync my chat history?',
          a: 'Yes! You can export your entire conversation workspace and provider configurations into encrypted JSON files at any time through the Settings menu and restore them across any device.',
        },
      ],
    },
    pricing: {
      badge: 'Transparent Cloud Pricing',
      title: 'Simple, Honest Pricing with Zero Token Markup',
      subtitle:
        'Connect directly to your AI providers. Pay only for the high-speed cloud infrastructure you use, or stay free forever with local storage.',
      monthly: 'Monthly',
      annually: 'Annual (Save 25%)',
      tiers: [
        {
          id: 'free',
          name: 'Free Community',
          badge: '100% Free Forever',
          priceMonthly: 'Rp0',
          priceAnnual: 'Rp0',
          priceAnnualTotal: null,
          period: 'forever',
          desc: 'Perfect for exploring decentralized AI with zero setup and raw BYOK connections.',
          cta: 'Get Started Free',
          popular: false,
          features: [
            'Unlimited Direct BYOK (OpenAI, Claude, Gemini, DeepSeek, Groq)',
            'Built-in Unlimited AI (Gemini Flash & Groq LPU Key Pool)',
            '1 GB Cloud Storage (or unlimited local browser storage)',
            '100 Cloud Automation Runs / mo (Unlimited on Local Desktop)',
            'Interactive Canvas (Live app, game & code runner)',
            'Multi-Format Document Viewer (PDF, XLSX, DOCX, PPTX)',
            'Local Encrypted JSON Export & Backup',
            'Max 25 MB file upload per document',
          ],
        },
        {
          id: 'pro',
          name: 'Pro Power User',
          badge: 'Most Popular',
          priceMonthly: 'Rp109.000',
          priceAnnual: 'Rp81.750',
          priceAnnualTotal: 'Rp981.000 / tahun',
          period: 'per bulan',
          desc: 'For developers, creators, and power users who want autonomous agents and multi-device cloud sync.',
          cta: 'Start Pro Free Trial',
          popular: true,
          features: [
            'Everything in Free, plus:',
            '25 GB Cloudflare R2 Storage (Zero Egress Download Fees)',
            '2,500 Cloud Automation Runs / mo (+Rp47.000 per 2.5k extra)',
            'Realtime Agent Browser Runner (Autonomous Form & Web Bot)',
            'Seamless Cloud Sync across Web, Desktop (Tauri), & Mobile',
            'Full Imagine AI Visual Studio with High-Res Generation',
            'Multi-Session Background Automations & Task Pipelines',
            'One-Click Full ZIP Archive Export (PDFs, Images, Data)',
            'Max 50 MB file upload limit',
            'Priority Community & Feature Updates',
          ],
        },
        {
          id: 'team',
          name: 'Team & Enterprise',
          badge: 'Scale & Security',
          priceMonthly: 'Rp299.000',
          priceAnnual: 'Rp224.250',
          priceAnnualTotal: 'Rp2.691.000 / tahun',
          period: 'per user / bulan',
          desc: 'Centralized workspace collaboration, shared MCP connectors, and governance for teams.',
          cta: 'Contact Sales',
          popular: false,
          features: [
            'Everything in Pro, plus:',
            '100 GB Cloudflare R2 Shared Team Storage',
            '10,000 Cloud Automation Runs / mo (Shared Webhooks & Crons)',
            'Shared Project Workspaces & Collaborative History',
            'Centralized Team MCP Connector & Tool Hub',
            'Custom Domain & Dedicated SSO Auth (SAML / OIDC)',
            'Admin Analytics & Token Usage Auditing',
            'SLA 99.9% Uptime Guarantee & Dedicated Support',
          ],
        },
      ],
      guarantee: '14-Day Money-Back Guarantee • Cancel Anytime • No Lock-In',
    },
    ctaBanner: {
      title: 'Take Back Control of Your AI Work OS',
      subtitle: 'No credit card required. Connect your own API keys in under 30 seconds and start chatting at maximum provider throughput.',
      button: 'Open Anticeil Work OS',
    },
    footer: {
      tagline: 'Anticeil • Zero-Proxy Privacy-First AI Assistant Work OS',
    },
  },
  id: {
    nav: {
      products: 'Produk',
      workspaces: 'Work OS',
      features: 'Fitur',
      latency: 'Radar Kecepatan',
      calculator: 'Kalkulator Hemat',
      pricing: 'Harga',
      download: 'Unduh Aplikasi',
      faq: 'Tanya Jawab',
      signIn: 'Masuk',
      launchApp: 'Mulai Gratis',
    },
    hero: {
      badge: 'Sistem Operasi Kerja AI Modern • Arsitektur BYOK 100% Privat',
      title1: 'Satu platform terpadu untuk',
      title2: 'era kerja baru dengan AI.',
      subtitle:
        'Hubungkan OpenAI GPT-4o, Claude 3.7 Sonnet, Gemini 2.0, DeepSeek-R1, Groq LPU, dan Ollama dalam satu Work OS fleksibel tanpa perantara server dan tanpa markup harga.',
      ctaPrimary: 'Mulai Sekarang Gratis',
      ctaSecondary: 'Eksplorasi Board Live',
      selectorPrompt: 'Kapabilitas AI apa yang ingin Anda gunakan?',
      benefits: {
        noCard: 'Tanpa kartu kredit',
        unlimited: 'BYOK Tanpa Batas',
        privacy: '100% Privat di Klien',
      },
      boardTitle: 'Papan Orkestrasi Anticeil Work OS',
      copyPrompt: 'Salin Prompt',
      copied: 'Tersalin!',
    },
    marqueeTitle: 'KOMPATIBEL DENGAN SEMUA PROVIDER UTAMA & RUNTIME LOKAL',
        workflowTabs: [
      { id: 'groq', label: 'groq | speed', iconKey: 'groq', color: '#FDAB3D', name: 'Groq 500 tok/dtk LPU' },
      { id: 'reasoning', label: 'deepseek | reasoning', iconKey: 'reasoning', color: '#A25DDC', name: 'Penalaran DeepSeek-R1' },
      { id: 'claude', label: 'claude | code', iconKey: 'claude', color: '#0073EA', name: 'Claude 3.7 Hybrid' },
      { id: 'visual', label: 'luma | visual', iconKey: 'visual', color: '#E2445C', name: 'Studio Visual & Video' },
      { id: 'ollama', label: 'ollama | private', iconKey: 'ollama', color: '#00C875', name: 'AI Lokal Offline' },
    ],
    tableColumns: {
      task: 'Tugas / Prompt',
      model: 'Model & Provider',
      status: 'Status',
      speed: 'Kecepatan',
      latency: 'Latensi TTFT',
      cost: 'Biaya / Sesi',
    },
    boardRows: [
      {
        id: 'groq',
        task: 'Refactor konkurensi & benchmark DeepSeek-R1',
        model: 'DeepSeek-R1 Distill 70B',
        provider: 'Groq LPU',
        status: 'Done',
        statusColor: '#00C875',
        speed: '492 tok/s',
        speedVal: 98,
        latency: '24ms',
        cost: '$0.00004',
        thinking: 'Proses Penalaran (0.24s): Mengevaluasi batas event loop. Menghasilkan arsitektur streaming non-blocking.',
        prompt: 'Jelaskan mengapa arsitektur BYOK 100% lebih aman dari proxy cloud tradisional?',
        response:
          'Pada arsitektur **Bring Your Own Key (BYOK)** murni, komunikasi HTTP terjadi langsung dari browser Anda menuju gateway resmi provider (OpenAI, Anthropic, Groq). Kunci API Anda dienkripsi dan disimpan lokal di browser Anda • **tanpa server perantara yang dapat membaca atau menyimpan percakapan Anda**.',
      },
      {
        id: 'reasoning',
        task: 'Desain antrean worker paralel async Claude 3.7',
        model: 'Claude 3.7 Sonnet',
        provider: 'Anthropic',
        status: 'Reasoning',
        statusColor: '#A25DDC',
        speed: '96 tok/s',
        speedVal: 32,
        latency: '110ms',
        cost: '$0.00015',
        thinking: 'Proses Penalaran (0.42s): Menganalisis batas semaphore. Menerapkan antrean p-limit terkendali.',
        prompt: 'Refactor pipeline async paralel ini untuk mencegah thread pool starvation.',
        response:
          'Untuk mencegah thread starvation, pisahkan antrean masukan dari worker pool menggunakan limiter konkurensi (misal: `pLimit(8)`). Ini memastikan alokasi memori tetap konstan pada beban lonjakan tinggi dan menjaga utilisasi CPU tetap optimal.',
      },
      {
        id: 'claude',
        task: 'Sintesis dan pencarian web langsung GPT-4o',
        model: 'GPT-4o Mini',
        provider: 'OpenAI',
        status: 'Working on it',
        statusColor: '#FDAB3D',
        speed: '140 tok/s',
        speedVal: 48,
        latency: '85ms',
        cost: '$0.00008',
        thinking: 'Proses Penalaran (0.18s): Mencari indeks web terkini, menyaring sumber, dan merangkum kutipan.',
        prompt: 'Rangkum kemajuan terkini runtime LLM WebAssembly di sisi klien.',
        response:
          'Runtime WebAssembly modern dengan WebGPU memungkinkan inferensi FP16 dengan kecepatan mendekati native langsung di perangkat pengguna, menghadirkan kecerdasan buatan privat tanpa koneksi internet.',
      },
      {
        id: 'visual',
        task: 'Render klip video sinematik 4K Luma Ray 2',
        model: 'Luma Ray 2 Studio',
        provider: 'Luma AI',
        status: 'Done',
        statusColor: '#00C875',
        speed: '24 FPS Video',
        speedVal: 75,
        latency: 'Instan',
        cost: '$0.00000',
        thinking: 'Visual Pipeline: Menyintesis prompt kamera dinamis dengan pantulan partikel air hujan nyata.',
        prompt: 'Hasilkan shot drone 4K sinematik di atas kota futuristik Tokyo berlampu neon saat hujan',
        response:
          '• Berhasil merender klip video 4K sinematik (24 FPS, Motion Rate 1.25) dengan dispersi dan pantulan partikel air hujan nyata.',
        isVideo: true,
      },
      {
        id: 'ollama',
        task: 'Audit kepatuhan & keamanan lokal offline Ollama',
        model: 'Llama 3.3 70B Local',
        provider: 'Ollama Host',
        status: 'Local Direct',
        statusColor: '#0073EA',
        speed: '65 tok/s',
        speedVal: 22,
        latency: '10ms',
        cost: '$0.00 (Gratis)',
        thinking: 'Pipeline Lokal: Diproses via localhost:11434 tanpa koneksi keluar sama sekali.',
        prompt: 'Audit skema konfigurasi proprietary ini untuk menemukan celah keamanan.',
        response:
          'Seluruh parameter diperiksa langsung di GPU lokal Anda. Tidak ada telemetri atau paket data yang keluar dari komputer.',
      },
    ],
    radar: {
      title: 'Radar Throughput Streaming Real-Time',
      subtitle: 'Koneksi klien zero-proxy memaksimalkan bandwidth resmi tanpa terhambat server perantara.',
    },
    bento: {
      title: 'Didesain untuk Pengembang & Power User',
      subtitle: 'Dibangun dengan akselerasi grafis, privasi tanpa proxy, dan perangkat multimodal.',
      card1Title: 'Mesin Throttling Streaming 50ms',
      card1Desc:
        'Mesin rendering sub-pixel 50ms kami mampu menangani model cepat hingga 500 token/dtk tanpa membuat browser macet atau membebani penyimpanan.',
      card2Title: 'Kepemilikan Data Tanpa Proxy',
      card2Desc:
        'Kunci API dan riwayat percakapan tidak pernah melewati server kami. Permintaan mengalir langsung dari peramban Anda ke provider resmi.',
      card3Title: 'Studio Gambar & Video AI',
      card3Desc:
        'Hasilkan gambar dan video sinematik langsung dengan kontrol interaktif putar, jeda, bisu, dan unduh cepat.',
      card4Title: 'Pencarian Web Langsung Otonom',
      card4Desc:
        'Pencarian web otonom mengambil informasi terkini dan memberikan kutipan sumber yang rapi tanpa perlu biaya langganan tambahan.',
      card5Title: 'Pengurai Dokumen Multi-Berkas',
      card5Desc:
        'Tarik dan lepas dokumen PDF, Word, Excel, dan repository kode sumber dengan estimasi token otomatis dan ekstraksi secepat kilat.',
      card6Title: 'Dikte Suara & Sintesis Suara Alami',
      card6Desc:
        'Arahkan kursor untuk mendengar sintesis gelombang suara alami! Dikte suara hands-free dipadukan dengan pemutar audio instan.',
      card7Title: 'Visual Workflow & Cloud Automasi',
      card7Desc:
        'Bangun pipeline LLM canggih dengan visual editor tanpa kode. Jadwalkan cron job, hubungkan webhook trigger, dan rangkai langkah AI menjadi alur kerja multi-tahap otomatis yang berjalan 24 jam.',
      card8Title: 'MCP Connectors — GitHub, Notion & Lebih',
      card8Desc:
        'Hubungkan AI Anda ke alat yang sudah Anda gunakan. Tarik issue GitHub secara langsung, baca halaman Notion, dan sinkronkan data Google Workspace langsung dalam konteks obrolan via Model Context Protocol.',
      card9Title: 'Live Artifact Builder & Code Sandbox',
      card9Desc:
        'Setiap cuplikan kode yang ditulis AI dapat langsung dirender di sandbox split-screen. Tampilkan artefak HTML, React, dan SVG dalam satu klik — tanpa perlu salin-tempel atau alat eksternal.',
    },
    calculator: {
      badge: '• Efisiensi Biaya & ROI • Hemat Hingga 98%',
      title: 'Hitung Penghematan Nyata Biaya BYOK Anda',
      subtitle: 'Bandingkan biaya langganan tetap bulanan ($20.00/bln) vs biaya murni pemakaian token API resmi dari OpenAI, Claude, DeepSeek, & Groq.',
      sliderLabel: 'Perkiraan Volume Token Bulanan:',
      presetsLabel: 'Pilihan Beban Kerja Cepat:',
      presets: [
        { label: '•xR• 100k (Santai)', value: 100000 },
        { label: '500k (Kerja Harian)', value: 500000 },
        { label: '1.5M (Riset & Dokumen)', value: 1500000 },
        { label: '•xa• 3M (Full-Stack Dev)', value: 3000000 },
        { label: '5M (Heavy Power User)', value: 5000000 },
      ],
      low: '50k (Minimal)',
      mid: '1.5M (Dev Standar)',
      high: '5M (Heavy AI)',
      wordsEquiv: 'kata',
      promptsEquiv: 'percakapan',
      tradPlan: 'SaaS Konvensional ($20/bln)',
      tradBadge: 'Tagihan Kaku Bulanan',
      tradDesc: 'Bayar $20 tiap bulan meski hanya chat beberapa kali. Margin markup 95%+ dinikmati oleh perantara penyedia SaaS.',
      tradAnnual: '$240.00 / tahun',
      byokPlan: 'Anticeil Free ($0 Biaya Platform)',
      byokBadge: '100% Harga Grosir API Provider',
      byokDesc: 'Anticeil tidak memungut biaya apapun ($0). Yang tertera adalah biaya token murni yang Anda bayar langsung ke OpenAI, Anthropic, DeepSeek (~$0.55/1M), atau Groq (Gratis). 0% markup.',
      savingsPlan: 'Uang yang Anda Hemat',
      savingsBadge: 'Hemat Tiap Bulan',
      savingsDesc: 'Uang ini tetap utuh di saku Anda setiap bulan untuk kebutuhan produktif dan riset lainnya!',
    },
    faq: {
      badge: 'Bantuan & FAQ',
      title: 'Pertanyaan yang Sering Diajukan',
      subtitle: 'Semua yang perlu Anda ketahui mengenai arsitektur BYOK, keamanan data, runtime lokal offline, dan efisiensi biaya.',
      supportCardTitle: 'Butuh bantuan penyiapan kunci?',
      supportCardDesc: 'Anticeil 100% open-source dan berbasis klien. Buka panduan konfigurasi kunci atau langsung uji coba.',
      supportCardCta: 'Buka Pengaturan API',
      items: [
        {
          id: '01',
          tag: 'API Resmi Penyedia',
          q: 'Apakah menggunakan API Key sendiri (BYOK) itu legal dan aman?',
          a: '100% Legal dan resmi. Setiap penyedia AI (OpenAI, Anthropic, Google, DeepSeek, Groq) secara resmi menyediakan Developer API Key bagi pengguna untuk mengakses model mereka langsung dari aplikasi pihak ketiga tanpa biaya langganan berlebih.',
        },
        {
          id: '02',
          tag: 'Vault Klien AES-256',
          q: 'Di mana kunci API saya disimpan dan diproses?',
          a: 'Kunci API Anda disimpan secara terenkripsi AES-256-GCM hanya di localStorage browser Anda, atau disinkronkan ke akun pribadi Anda jika Anda login. Anticeil tidak memiliki server proxy perantara•setiap permintaan mengalir langsung dari perangkat Anda.',
        },
        {
          id: '03',
          tag: 'Akses Kuota Gratis',
          q: 'Bagaimana cara mendapatkan API Key gratis?',
          a: 'Provider seperti Google Gemini (AI Studio) dan Groq Cloud menyediakan kuota akses gratis tanpa biaya langganan bulanan. Anda bisa langsung menyalin API key dari konsol resmi mereka dan memasukkannya di Settings.',
        },
        {
          id: '04',
          tag: 'Hemat Hingga 98%',
          q: 'Berapa banyak biaya yang dihemat dibandingkan langganan $20/bulan?',
          a: 'Karena Anda hanya membayar token yang benar-benar Anda pakai dengan harga grosir resmi penyedia (misal DeepSeek-R1 ~$0.55/1M token, Groq gratis, Gemini gratis), rata-rata pengguna hanya menghabiskan kurang dari $0.50/bulan dari yang seharusnya $20.00/bulan.',
        },
        {
          id: '05',
          tag: 'Runtime Lokal Ollama',
          q: 'Bisakah saya menghubungkan model lokal offline lewat Ollama?',
          a: 'Tentu saja! Anticeil mendukung runtime lokal Ollama pada localhost:11434 secara instan tanpa konfigurasi rumit. Anda bisa mengobrol offline penuh dengan Llama 3.3, DeepSeek-R1 8B, dan Qwen 2.5 tanpa internet.',
        },
        {
          id: '06',
          tag: 'Cadangan JSON Terenkripsi',
          q: 'Apakah riwayat percakapan saya bisa diekspor atau dicadangkan?',
          a: 'Ya! Anda dapat mengekspor seluruh konfigurasi kunci dan riwayat percakapan ke dalam format file JSON terenkripsi kapan saja melalui menu Settings dan mengimpornya kembali di perangkat lain.',
        },
      ],
    },
    pricing: {
      badge: 'Harga Cloud Transparan',
      title: 'Harga Sederhana & Jujur Tanpa Markup Token',
      subtitle:
        'Terhubung langsung ke provider AI Anda. Hanya bayar infrastruktur cloud berkecepatan tinggi yang Anda gunakan, atau gunakan gratis selamanya dengan penyimpanan lokal.',
      monthly: 'Bulanan',
      annually: 'Tahunan (Hemat 25%)',
      tiers: [
        {
          id: 'free',
          name: 'Free Community',
          badge: '100% Gratis Selamanya',
          priceMonthly: 'Rp0',
          priceAnnual: 'Rp0',
          priceAnnualTotal: null,
          period: 'selamanya',
          desc: 'Sempurna untuk menjelajahi AI terdesentralisasi tanpa biaya dan koneksi BYOK murni.',
          cta: 'Mulai Gratis Sekarang',
          popular: false,
          features: [
            'Akses BYOK Tanpa Batas (OpenAI, Claude, Gemini, DeepSeek, Groq)',
            'AI Gratis Bawaan (Gemini Flash & Groq LPU Multi-Key Pool)',
            '1 GB Penyimpanan Cloud (atau tanpa batas di browser lokal)',
            '100 Eksekusi Cloud Automasi / bln (Unlimited di Desktop Lokal)',
            'Canvas Interaktif (Live app sandbox, game & runner kode)',
            'Viewer Dokumen Multi-Format (PDF, XLSX, DOCX, PPTX)',
            'Ekspor & Backup JSON Terenkripsi Lokal',
            'Maksimal 25 MB upload per dokumen',
          ],
        },
        {
          id: 'pro',
          name: 'Pro Power User',
          badge: 'Paling Populer',
          priceMonthly: 'Rp109.000',
          priceAnnual: 'Rp81.750',
          priceAnnualTotal: 'Rp981.000 / tahun',
          period: 'per bulan',
          desc: 'Untuk developer, kreator, dan power user yang menginginkan agent otomatis dan sinkronisasi multi-perangkat.',
          cta: 'Coba Pro 14 Hari',
          popular: true,
          features: [
            'Semua fitur Free, ditambah:',
            '25 GB Cloudflare R2 Cloud Storage (Nol Biaya Egress Bandwidth)',
            '2.500 Eksekusi Cloud Automasi / bln (+Rp47.000 per 2.5rb ekstra)',
            'Runner Browser Agent Realtime (Bot Otomatisasi Web & Form)',
            'Sinkronisasi Cloud Mulus (Web, Desktop Tauri, & Mobile Expo)',
            'Imagine AI Visual Studio Penuh dengan Resolusi Tinggi',
            'Pipeline Otomatisasi & Multi-Session Background Agents',
            'Ekspor Arsip Lengkap ZIP Sekali Klik (PDF, Gambar, Chat)',
            'Maksimal 50 MB ukuran upload per file',
            'Dukungan Prioritas Komunitas & Akses Fitur Baru',
          ],
        },
        {
          id: 'team',
          name: 'Team & Enterprise',
          badge: 'Skala & Kolaborasi',
          priceMonthly: 'Rp299.000',
          priceAnnual: 'Rp224.250',
          priceAnnualTotal: 'Rp2.691.000 / tahun',
          period: 'per pengguna / bulan',
          desc: 'Kolaborasi workspace terpusat, shared MCP connectors, dan tata kelola keamanan untuk tim.',
          cta: 'Hubungi Sales',
          popular: false,
          features: [
            'Semua fitur Pro, ditambah:',
            '100 GB Cloudflare R2 Shared Team Storage',
            '10.000 Eksekusi Cloud Automasi / bln (Shared Webhook & Cron)',
            'Folder Kolaboratif & Workspace Tim Bersama',
            'Hub Terpusat untuk Team MCP Connectors & Custom Tools',
            'Custom Domain & Autentikasi SSO Khusus (SAML / OIDC)',
            'Dasbor Analitik Admin & Audit Penggunaan Token',
            'Jaminan SLA Uptime 99.9% & Dukungan Khusus',
          ],
        },
      ],
      guarantee: 'Garansi 14 Hari Uang Kembali • Batal Kapan Saja • Bebas Ekspor Data',
    },
    ctaBanner: {
      title: 'Kendalikan Penuh Work OS AI Anda',
      subtitle: 'Tanpa perlu kartu kredit. Sambungkan kunci API Anda dalam waktu kurang dari 30 detik dan nikmati kecepatan streaming maksimal.',
      button: 'Buka Workspace Anticeil',
    },
    footer: {
      tagline: 'Anticeil • Sistem Operasi Kerja AI Privat Berkecepatan Tinggi Tanpa Proxy Perantara',
    },
  },
};

function renderFormattedResponse(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={index} style={{ color: '#181B34', fontWeight: 700 }}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={index}
              style={{
                background: 'rgba(0, 115, 234, 0.1)',
                color: '#0073EA',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.9em',
                fontFamily: 'monospace',
                border: '1px solid rgba(0, 115, 234, 0.25)',
              }}
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

function renderLucideIcon(key?: string, color?: string, size = 18) {
  const iconColor = color || 'currentColor';
  const k = (key || '').toLowerCase().trim();

  // 1. Official AI Provider SVG Logos
  if (k === 'groq') return <ProviderBrandLogo provider="groq" size={size} />;
  if (k === 'reasoning' || k === 'deepseek') return <ProviderBrandLogo provider="deepseek" size={size} />;
  if (k === 'claude' || k === 'anthropic') return <ProviderBrandLogo provider="anthropic" size={size} />;
  if (k === 'visual' || k === 'luma') return <ProviderBrandLogo provider="luma" size={size} />;
  if (k === 'ollama') return <ProviderBrandLogo provider="ollama" size={size} />;
  if (k === 'openai' || k === 'chatgpt' || k === 'gpt') return <ProviderBrandLogo provider="openai" size={size} />;
  if (k === 'gemini' || k === 'google') return <ProviderBrandLogo provider="gemini" size={size} />;
  if (k === 'mistral') return <ProviderBrandLogo provider="mistral" size={size} />;
  if (k === 'perplexity') return <ProviderBrandLogo provider="perplexity" size={size} />;
  if (k === 'huggingface' || k === 'hf' || k === 'hugging face') return <ProviderBrandLogo provider="huggingface" size={size} />;
  if (k === 'cohere') return <ProviderBrandLogo provider="cohere" size={size} />;

  // 2. Lucide UI Functional Icons
  switch (k) {
    case 'zap':
      return <Zap size={size} color={iconColor} />;
    case 'brain':
      return <Brain size={size} color={iconColor} />;
    case 'code':
      return <Code2 size={size} color={iconColor} />;
    case 'film':
      return <Film size={size} color={iconColor} />;
    case 'server':
      return <Server size={size} color={iconColor} />;
    case 'terminal':
      return <Terminal size={size} color={iconColor} />;
    case 'sparkles':
      return <Sparkles size={size} color={iconColor} />;
    case 'bot':
      return <Bot size={size} color={iconColor} />;
    case 'layers':
      return <Layers size={size} color={iconColor} />;
    case 'flame':
      return <Flame size={size} color={iconColor} />;
    case 'smile':
      return <Smile size={size} color={iconColor} />;
    case 'globe':
      return <Globe size={size} color={iconColor} />;
    case 'lock':
      return <Lock size={size} color={iconColor} />;
    case 'activity':
      return <Activity size={size} color={iconColor} />;
    case 'dollar':
      return <DollarSign size={size} color={iconColor} />;
    case 'file':
      return <FileText size={size} color={iconColor} />;
    case 'volume':
      return <Volume2 size={size} color={iconColor} />;
    case 'shield':
      return <ShieldCheck size={size} color={iconColor} />;
    case 'key':
      return <KeyRound size={size} color={iconColor} />;
    default:
      return <Sparkles size={size} color={iconColor} />;
  }
}

const ROTATING_DEMO_MODELS = [
  { id: 'groq', name: 'Groq • Llama 3.3 70B', speed: '500 tok/s', provider: 'groq', tokens: '931 token' },
  { id: 'deepseek', name: 'DeepSeek-R1 (Distill 70B)', speed: 'Reasoning', provider: 'deepseek', tokens: '1,420 token' },
  { id: 'claude', name: 'Claude 3.7 Sonnet', speed: 'Hybrid Code', provider: 'anthropic', tokens: '895 token' },
  { id: 'openai', name: 'OpenAI • GPT-4o', speed: 'Omni Stream', provider: 'openai', tokens: '760 token' },
  { id: 'gemini', name: 'Gemini 2.0 Flash', speed: '2M Context', provider: 'gemini', tokens: '1,105 token' },
  { id: 'ollama', name: 'Ollama • Llama 3 (Local)', speed: '100% Offline', provider: 'ollama', tokens: '640 token' },
];

export default function MondayWarmBeigeLandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const aetherCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioBarsRef = useRef<HTMLDivElement>(null);

  // i18n & Navigation State
  const lang = useSettingsStore((s) => s.language) as Lang;
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Active Chatbot Studio & Workflow State
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('groq');
  const [boardViewTab, setBoardViewTab] = useState<'table' | 'kanban' | 'radar'>('table');
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [tokenSlider, setTokenSlider] = useState(500000);
  const [isAnnualBilling, setIsAnnualBilling] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Interactive Live Chatbot States
  const [showThoughtProcess, setShowThoughtProcess] = useState(true);
  const [chatInputText, setChatInputText] = useState('');
  const [customUserMessage, setCustomUserMessage] = useState<string | null>(null);
  const [customAssistantResponse, setCustomAssistantResponse] = useState<string | null>(null);
  const [displayedStreamingResponse, setDisplayedStreamingResponse] = useState<string>('');
  const [isStreamingText, setIsStreamingText] = useState<boolean>(false);
  const [activeModelIndex, setActiveModelIndex] = useState<number>(0);
  const [isSimulatingStream, setIsSimulatingStream] = useState(false);
  const [userFeedback, setUserFeedback] = useState<'up' | 'down' | null>(null);

  // • Dynamic Interactive Aether Constellation & Particle Canvas in Hero •
  useEffect(() => {
    const canvas = aetherCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.offsetHeight || 650);

    const mouse: { x: number | null; y: number | null; radius: number } = { x: null, y: null, radius: 180 };

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
      init();
    };
    window.addEventListener('resize', handleResize);

    const colors = [
      'rgba(0, 115, 234, 0.85)', // Monday Electric Blue
      'rgba(120, 75, 209, 0.85)', // Monday Purple
      'rgba(253, 171, 61, 0.85)', // Amber Speed
      'rgba(0, 200, 117, 0.85)', // Emerald Privacy
      'rgba(226, 68, 92, 0.85)', // Coral Studio
    ];

    class Particle {
      x: number;
      y: number;
      directionX: number;
      directionY: number;
      size: number;
      color: string;

      constructor(x: number, y: number, directionX: number, directionY: number, size: number, color: string) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.color = color;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
      }

      update() {
        if (this.x > width || this.x < 0) {
          this.directionX = -this.directionX;
        }
        if (this.y > height || this.y < 0) {
          this.directionY = -this.directionY;
        }

        // Mouse collision repulsion
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < mouse.radius + this.size) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (mouse.radius - distance) / mouse.radius;
            this.x -= forceDirectionX * force * 4.5;
            this.y -= forceDirectionY * force * 4.5;
          }
        }

        this.x += this.directionX;
        this.y += this.directionY;
        this.draw();
      }
    }

    let particles: Particle[] = [];

    function init() {
      particles = [];
      const numberOfParticles = Math.floor((height * width) / 10000);
      for (let i = 0; i < numberOfParticles; i++) {
        const size = Math.random() * 2.5 + 1.2;
        const x = Math.random() * (width - size * 4) + size * 2;
        const y = Math.random() * (height - size * 4) + size * 2;
        const directionX = Math.random() * 0.5 - 0.25;
        const directionY = Math.random() * 0.5 - 0.25;
        const color = colors[Math.floor(Math.random() * colors.length)];
        particles.push(new Particle(x, y, directionX, directionY, size, color));
      }
    }

    const connect = () => {
      if (!ctx) return;
      let opacityValue = 1;
      const maxDistance = (width / 7) * (height / 7);

      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          const distance =
            (particles[a].x - particles[b].x) * (particles[a].x - particles[b].x) +
            (particles[a].y - particles[b].y) * (particles[a].y - particles[b].y);

          if (distance < maxDistance) {
            opacityValue = 1 - distance / 22000;
            if (opacityValue > 0) {
              const dx_mouse_a = mouse.x !== null ? particles[a].x - mouse.x : 1000;
              const dy_mouse_a = mouse.y !== null ? particles[a].y - mouse.y : 1000;
              const distance_mouse_a = Math.sqrt(dx_mouse_a * dx_mouse_a + dy_mouse_a * dy_mouse_a);

              if (mouse.x !== null && distance_mouse_a < mouse.radius) {
                ctx.strokeStyle = `rgba(0, 115, 234, ${Math.min(0.9, opacityValue * 1.4)})`;
                ctx.lineWidth = 1.3;
              } else {
                ctx.strokeStyle = `rgba(120, 75, 209, ${opacityValue * 0.4})`;
                ctx.lineWidth = 0.8;
              }

              ctx.beginPath();
              ctx.moveTo(particles[a].x, particles[a].y);
              ctx.lineTo(particles[b].x, particles[b].y);
              ctx.stroke();
            }
          }
        }
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    const heroElement = canvas.parentElement;
    if (heroElement) {
      heroElement.addEventListener('mousemove', handleMouseMove as EventListener);
      heroElement.addEventListener('mouseleave', handleMouseLeave as EventListener);
    }

    const animate = () => {
      if (!ctx) return;
      animId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
      }
      connect();
    };

    init();
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (heroElement) {
        heroElement.removeEventListener('mousemove', handleMouseMove as EventListener);
        heroElement.removeEventListener('mouseleave', handleMouseLeave as EventListener);
      }
    };
  }, []);



  // GSAP Entrance & Pulse Animations
  useGSAP(
    () => {
      // Subtle pulse on Monday 4-dot brand icon
      gsap.to('.monday-logo-dot', {
        scale: 1.15,
        stagger: 0.15,
        duration: 1.2,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      });
    },
    { scope: containerRef }
  );

  // Scroll detection for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLangChange = (newLang: Lang) => {
    setLanguage(newLang);
  };

  const t = TRANSLATIONS[lang];

  const currentSelectedRow =
    t.boardRows.find((row) => row.id === selectedWorkflowId) || t.boardRows[0];

  const handleCopyPrompt = () => {
    if (currentSelectedRow?.response) {
      navigator.clipboard.writeText(currentSelectedRow.response);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  // AI Streaming Typewriter Animation Effect & Auto Model Switcher
  useEffect(() => {
    const fullTargetText =
      customAssistantResponse ||
      (lang === 'id'
        ? `### Ringkasan Arsitektur & Keunggulan Anticeil Work OS

**Anticeil** adalah *AI Work OS & Direct Gateway* yang menghubungkan Anda langsung ke provider AI terdepan (**OpenAI, Anthropic Claude, Google Gemini, DeepSeek, Groq LPU, dan Ollama**) tanpa server perantara.

| Aspek | SaaS Konvensional ($20/bln) | Anticeil (Direct BYOK) | Keuntungan Pengguna |
| :--- | :--- | :--- | :--- |
| **Jalur Data & Privasi** | Melalui server perantara; riwayat chat disimpan di cloud pihak ketiga. | **Direct Peer-to-Provider**; kunci terenkripsi AES-256 lokal di browser. | Privasi data 100% aman & patuh standar korporat. |
| **Struktur Biaya** | Biaya tetap mahal ($20/bln/model) dengan markup 95%+. | **Bayar token murni grosir** ke OpenAI, Claude, DeepSeek, Groq. | Hemat hingga 98%; bayar hanya apa yang dipakai. |
| **Pilihan Model** | Terkunci pada satu ekosistem vendor tertutup. | **Universal All-in-One Gateway** + model lokal offline (Ollama). | Bebas ganti model terbaik kapan saja tanpa batas. |
| **Latensi & Kecepatan** | Latensi proxy ganda memperlambat streaming. | **Zero-Proxy Direct Streaming** hingga 500 token/detik via Groq LPU. | Respon super instan tanpa antrean server. |`
        : `### Architecture Summary & Advantages of Anticeil Work OS

**Anticeil** is the *AI Work OS & Direct Gateway* connecting you directly to premier AI providers (**OpenAI, Anthropic Claude, Google Gemini, DeepSeek, Groq LPU, and Ollama**) with zero server proxy.

| Aspect | Traditional SaaS ($20/mo) | Anticeil (Direct BYOK) | User Advantage |
| :--- | :--- | :--- | :--- |
| **Data Path & Privacy** | Routed through proxy servers; chat history stored in third-party clouds. | **Direct Peer-to-Provider**; AES-256 encrypted locally in browser. | 100% client data privacy & corporate compliance. |
| **Cost Structure** | Expensive rigid fee ($20/mo/model) with 95%+ markups. | **Pay raw wholesale token prices** to OpenAI, Claude, DeepSeek, Groq. | Save up to 98%; strictly pay for what you use. |
| **Model Freedom** | Locked to a single proprietary vendor ecosystem. | **Universal All-in-One Gateway** + 100% offline local runtimes (Ollama). | Switch best-in-class models freely with zero limits. |
| **Latency & Speed** | Double-proxy network overhead adds severe delay. | **Zero-Proxy Direct Streaming** up to 500 tokens/sec via Groq LPU. | Instant sub-pixel streaming with zero queuing. |`);

    let currentIndex = 0;
    setIsStreamingText(true);
    setDisplayedStreamingResponse('');

    // Stream text in fast realistic token chunks (5-12 chars every 15ms)
    const streamInterval = setInterval(() => {
      currentIndex += Math.floor(Math.random() * 8) + 6;
      if (currentIndex >= fullTargetText.length) {
        setDisplayedStreamingResponse(fullTargetText);
        setIsStreamingText(false);
        clearInterval(streamInterval);
      } else {
        setDisplayedStreamingResponse(fullTargetText.slice(0, currentIndex));
      }
    }, 15);

    // Auto-cycle through models every 7 seconds when in default demo mode
    let autoRotateTimer: NodeJS.Timeout | undefined;
    if (!customAssistantResponse) {
      autoRotateTimer = setTimeout(() => {
        setActiveModelIndex((prev) => (prev + 1) % ROTATING_DEMO_MODELS.length);
      }, 7500);
    }

    return () => {
      clearInterval(streamInterval);
      if (autoRotateTimer) clearTimeout(autoRotateTimer);
    };
  }, [selectedWorkflowId, lang, customAssistantResponse, activeModelIndex]);

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInputText.trim()) return;
    const query = chatInputText.trim();
    setCustomUserMessage(query);
    setChatInputText('');
    setIsSimulatingStream(true);
    setCustomAssistantResponse('');

    setTimeout(() => {
      setCustomAssistantResponse(
        `Saya telah memproses pertanyaan Anda: "${query}" langsung menggunakan gateway model **${currentSelectedRow.model} (${currentSelectedRow.provider})** tanpa proxy server. Kunci API Anda terenkripsi aman secara lokal di peramban Anda (AES-256-GCM).`
      );
      setIsSimulatingStream(false);
    }, 600);
  };

  const savingsCalculated = Math.max(0, 20 - (tokenSlider / 1000000) * 0.4).toFixed(2);

    // Marquee item list (Row 1: Official AI Providers - Uniform symmetrical format)
  const marqueeProviders = [
    { name: 'GROQ', badge: '500 tok/s', color: '#FDAB3D', iconKey: 'groq' },
    { name: 'DEEPSEEK', badge: 'Reasoning', color: '#4D6BFE', iconKey: 'deepseek' },
    { name: 'ANTHROPIC', badge: 'Claude 3.7', color: '#D97706', iconKey: 'claude' },
    { name: 'OPENAI', badge: 'GPT-4o', color: '#10A37F', iconKey: 'openai' },
    { name: 'GEMINI', badge: '2M Context', color: '#1A73E8', iconKey: 'gemini' },
    { name: 'OLLAMA', badge: '100% Offline', color: '#00C875', iconKey: 'ollama' },
    { name: 'MISTRAL', badge: 'EU AI', color: '#FF7000', iconKey: 'mistral' },
    { name: 'HUGGING FACE', badge: 'Open Source', color: '#FFD21E', iconKey: 'huggingface' },
    { name: 'PERPLEXITY', badge: 'Web Search', color: '#20B8CD', iconKey: 'perplexity' },
    { name: 'COHERE', badge: 'Command R+', color: '#D48464', iconKey: 'cohere' },
  ];

  // Marquee item list (Row 2: Performance & Architecture - Symmetrical matching format)
  const marqueeFeaturesSymmetrical = [
    { name: '500 Tokens/Sec', badge: 'Ultra Throughput', color: '#FDAB3D', iconKey: 'activity' },
    { name: 'AES-256 Vault', badge: 'Local Encrypted', color: '#00C875', iconKey: 'lock' },
    { name: 'Zero Proxy Lag', badge: 'Direct Stream', color: '#0073EA', iconKey: 'zap' },
    { name: 'Zero Markup', badge: 'Raw API Cost', color: '#00C875', iconKey: 'dollar' },
    { name: 'Live Web Grounding', badge: 'Autonomous', color: '#579BFC', iconKey: 'globe' },
    { name: 'Multi-Doc Parser', badge: 'Sub-Second', color: '#A25DDC', iconKey: 'file' },
    { name: '4K Visual Studio', badge: 'Hardware Accel', color: '#E2445C', iconKey: 'film' },
    { name: 'Neural Voice Audio', badge: 'Instant Wave', color: '#A25DDC', iconKey: 'volume' },
    { name: '100% Client Privacy', badge: 'Device Only', color: '#00C875', iconKey: 'shield' },
    { name: 'Open Standards', badge: 'Zero Lock-in', color: '#0073EA', iconKey: 'key' },
  ];

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '100vh',
        background: '#FAF9F5', // Monday.com Signature Warm Beige Canvas
        color: '#181B34',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflowX: 'hidden',
        position: 'relative',
      }}
    >
      {/* 1. Apple/Linear-Style Floating Frosted Glass Capsule App Bar */}
      <header
        style={{
          position: 'fixed',
          top: '12px',
          left: 0,
          right: 0,
          zIndex: 1000,
          padding: '0',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'relative',
            maxWidth: '1180px',
            width: '100%',
            height: '56px',
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '9999px',
            background: isScrolled
              ? 'rgba(255, 255, 255, 0.92)'
              : 'transparent',
            backdropFilter: isScrolled ? 'blur(24px) saturate(180%)' : 'none',
            WebkitBackdropFilter: isScrolled ? 'blur(24px) saturate(180%)' : 'none',
            border: isScrolled
              ? '1px solid rgba(230, 225, 215, 0.85)'
              : '1px solid transparent',
            boxShadow: isScrolled
              ? '0 16px 40px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)'
              : 'none',
            pointerEvents: 'auto',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Brand Logo */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              textDecoration: 'none',
              color: 'inherit',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0073EA 0%, #784BD1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 115, 234, 0.3)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 6px)', gap: '3px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E2445C' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00C875' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FDAB3D' }} />
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFFFFF' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
              <span style={{ fontWeight: 800, fontSize: '17.5px', letterSpacing: '-0.03em', color: '#181B34' }}>
                anticeil
              </span>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0073EA', background: 'rgba(0, 115, 234, 0.08)', padding: '1px 5px', borderRadius: '4px', border: '1px solid rgba(0, 115, 234, 0.2)' }}>
                .os
              </span>
            </div>
          </Link>

          {/* Mathematically Centered Navigation Links (Aligned with Hero Center Axis) */}
          <nav
            className="hide-on-mobile"
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              pointerEvents: 'auto',
            }}
          >
            {[
              { href: '#board', label: t.nav.workspaces },
              { href: '#features', label: t.nav.features },
              { href: '#marquee', label: t.nav.latency },
              { href: '#pricing', label: t.nav.pricing },
              { href: '#download', label: lang === 'id' ? 'Unduh' : 'Download' },
              { href: '#faq', label: t.nav.faq },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                style={{
                  color: '#4B5563',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '6px 11px',
                  borderRadius: '9999px',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#0073EA';
                  e.currentTarget.style.background = 'rgba(0, 115, 234, 0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#4B5563';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
            {/* Segmented Language Switcher */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                borderRadius: '9999px',
                padding: '2px',
                gap: '2px',
              }}
            >
              <button
                type="button"
                onClick={() => handleLangChange('en')}
                style={{
                  padding: '4px 9px',
                  borderRadius: '9999px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: lang === 'en' ? '#0073EA' : 'transparent',
                  color: lang === 'en' ? '#FFFFFF' : '#6B7280',
                  boxShadow: lang === 'en' ? '0 1px 3px rgba(0, 115, 234, 0.3)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => handleLangChange('id')}
                style={{
                  padding: '4px 9px',
                  borderRadius: '9999px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: lang === 'id' ? '#0073EA' : 'transparent',
                  color: lang === 'id' ? '#FFFFFF' : '#6B7280',
                  boxShadow: lang === 'id' ? '0 1px 3px rgba(0, 115, 234, 0.3)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                ID
              </button>
            </div>

            {/* Login Link */}
            <Link
              href="/login"
              className="hide-on-mobile"
              style={{
                color: '#374151',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: '9999px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#0073EA';
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#374151';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {t.nav.signIn}
            </Link>

            {/* High-Conversion Pill CTA */}
            <Link
              href="/chat"
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#FFFFFF',
                textDecoration: 'none',
                padding: '8px 18px',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, #0073EA 0%, #0056B3 100%)',
                boxShadow: '0 4px 14px rgba(0, 115, 234, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
              className="btn-monday-primary hide-on-mobile"
            >
              <span>{t.nav.launchApp}</span>
              <ArrowRight size={13} />
            </Link>

            {/* Mobile Burger Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="show-on-mobile"
              style={{
                background: isMobileMenuOpen ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: '9999px',
                padding: '7px 9px',
                color: '#181B34',
                cursor: 'pointer',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile & Tablet Bottom Sheet Drawer (Vaul/Portfolio style with Backdrop & Drag Pill) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Dark Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                zIndex: 9998,
              }}
            />

            {/* Right-Side Editorial Slide-Over Drawer (Harmonized with Anticeil Midnight Theme) */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              style={{
                position: 'fixed',
                top: 0,
                bottom: 0,
                right: 0,
                width: '100%',
                maxWidth: '460px',
                background: '#181B34', // Anticeil Midnight Navy
                color: '#FFFFFF',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '32px 30px 38px 30px',
                boxShadow: '-10px 0 50px rgba(0, 0, 0, 0.6)',
                borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                overflowY: 'auto',
              }}
            >
              {/* 1. Drawer Header: Blue Brand Glow + NAVIGATION & CLOSE Pill */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    letterSpacing: '0.15em',
                    color: '#579BFC',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0073EA', boxShadow: '0 0 10px #0073EA' }} />
                  NAVIGATION
                </span>

                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 115, 234, 0.2)';
                    e.currentTarget.style.borderColor = '#0073EA';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  }}
                >
                  <span>CLOSE</span>
                  <X size={13} />
                </button>
              </div>

              {/* 2. Main Navigation Links (Numbered Big Editorial Typography in Anticeil Palette) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: 'auto 0' }}>
                {[
                  { num: '01', label: 'WORKSPACES', href: '#board', color: '#0073EA' },
                  { num: '02', label: 'FEATURES', href: '#features', color: '#784BD1' },
                  { num: '03', label: 'SPEED RADAR', href: '#marquee', color: '#FDAB3D' },
                  { num: '04', label: 'PRICING', href: '#pricing', color: '#00C875' },
                  { num: '05', label: 'FAQ', href: '#faq', color: '#579BFC' },
                  { num: '06', label: 'SIGN IN', href: '/login', color: '#808396' },
                  { num: '07', label: 'GET STARTED', href: '/chat', color: '#0073EA', isHighlight: true },
                ].map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '14px',
                      textDecoration: 'none',
                      color: item.isHighlight ? '#0073EA' : '#FFFFFF',
                      transition: 'transform 0.15s ease, color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(6px)';
                      e.currentTarget.style.color = '#0073EA';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.color = item.isHighlight ? '#0073EA' : '#FFFFFF';
                    }}
                  >
                    <span
                      style={{
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: item.color,
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                      }}
                    >
                      {item.num}
                    </span>
                    <span
                      style={{
                        fontSize: 'clamp(24px, 5.5vw, 32px)',
                        fontWeight: 900,
                        letterSpacing: '-0.02em',
                        lineHeight: 1.1,
                        textTransform: 'uppercase',
                      }}
                    >
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>

              {/* 3. Drawer Footer: Direct Links & Language Selector */}
              <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#808396', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                    DIRECT LINKS
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '12px', fontFamily: 'monospace', color: '#B2B4C2' }}>
                    <Link
                      href="/terms"
                      onClick={() => setIsMobileMenuOpen(false)}
                      style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#0073EA')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#B2B4C2')}
                    >
                      TERMS ↗
                    </Link>
                    <Link
                      href="/privacy"
                      onClick={() => setIsMobileMenuOpen(false)}
                      style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#0073EA')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#B2B4C2')}
                    >
                      PRIVACY ↗
                    </Link>
                    <Link
                      href="/refund"
                      onClick={() => setIsMobileMenuOpen(false)}
                      style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#0073EA')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#B2B4C2')}
                    >
                      REFUND ↗
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setIsMobileMenuOpen(false)}
                      style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#0073EA')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#B2B4C2')}
                    >
                      API KEYS ↗
                    </Link>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#808396', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    LANGUAGE
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '2px',
                      gap: '2px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleLangChange('id')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                        background: lang === 'id' ? '#0073EA' : 'transparent',
                        color: lang === 'id' ? '#FFFFFF' : '#808396',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      ID
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLangChange('en')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                        background: lang === 'en' ? '#0073EA' : 'transparent',
                        color: lang === 'en' ? '#FFFFFF' : '#808396',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      EN
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 2. Hero Section • Enhanced with Interactive Aether Fluid Mesh Canvas & High-Contrast Cards */}
      <section
        style={{
          position: 'relative',
          paddingTop: '135px',
          paddingBottom: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          zIndex: 1,
          overflow: 'hidden',
        }}
      >
        {/* • Ambient Chromatic Glow Background • */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '85%',
            maxWidth: '1000px',
            height: '420px',
            background: 'radial-gradient(ellipse 65% 50% at 50% 30%, rgba(0, 115, 234, 0.12) 0%, rgba(120, 75, 209, 0.08) 50%, rgba(253, 171, 61, 0.06) 80%, transparent 100%)',
            filter: 'blur(50px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* • Sharp Interactive Aether Particle & Constellation Canvas • */}
        <canvas
          ref={aetherCanvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 0,
            opacity: 0.9,
          }}
        />

        {/* Ambient bottom fade into beige canvas */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '100px',
            background: 'linear-gradient(to bottom, transparent, #FAF9F5)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* Hero Content Container */}
        <div
          style={{
            maxWidth: '1180px',
            width: '100%',
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Announcement Super-Badge • Pure White High-Contrast Pop */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 20px',
              borderRadius: '9999px',
              background: '#FFFFFF',
              border: '1px solid rgba(0, 115, 234, 0.25)',
              boxShadow: '0 4px 16px rgba(0, 115, 234, 0.12), 0 1px 3px rgba(0, 0, 0, 0.04)',
              color: '#0073EA',
              fontSize: '12.5px',
              fontWeight: 700,
              marginBottom: '26px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#00C875',
                boxShadow: '0 0 10px #00C875',
              }}
            />
            <span style={{ color: '#181B34' }}>{t.hero.badge}</span>
          </div>

          {/* Monday.com Large Bold Editorial Typography */}
          <h1
            style={{
              fontSize: 'clamp(36px, 5.4vw, 68px)',
              fontWeight: 800,
              letterSpacing: '-0.035em',
              lineHeight: 1.12,
              maxWidth: '960px',
              marginBottom: '22px',
              textWrap: 'balance',
            }}
          >
            <span style={{ color: '#181B34' }}>{t.hero.title1} </span>
            <span
              style={{
                background: 'linear-gradient(135deg, #0073EA 0%, #784BD1 50%, #E2445C 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {t.hero.title2}
            </span>
          </h1>

          {/* Subtitle with High-Contrast Deep Charcoal */}
          <p
            style={{
              fontSize: 'clamp(15.5px, 1.8vw, 18.5px)',
              color: '#4E5166',
              maxWidth: '720px',
              lineHeight: 1.65,
              marginBottom: '36px',
              textWrap: 'balance',
              fontWeight: 450,
            }}
          >
            {t.hero.subtitle}
          </p>

          {/* Hero Action CTA Group • High Contrast Pop */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link
              href="/chat"
              style={{
                background: '#0073EA',
                color: '#FFFFFF',
                padding: '16px 42px',
                borderRadius: '30px',
                fontSize: '16px',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 6px 24px rgba(0, 115, 234, 0.45)',
                transition: 'all 0.15s ease',
              }}
              className="btn-monday-primary"
            >
              <span>{t.hero.ctaPrimary}</span>
              <ArrowRight size={17} />
            </Link>

            <a
              href="#board"
              style={{
                color: '#181B34',
                background: '#FFFFFF',
                border: '1.5px solid #D0D4E4',
                padding: '16px 32px',
                borderRadius: '30px',
                fontSize: '16px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.15s ease',
              }}
              className="btn-monday-secondary"
            >
              {t.hero.ctaSecondary}
            </a>
          </div>

          {/* Micro-Benefits Guarantee in Crisp White Capsule */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              flexWrap: 'wrap',
              marginTop: '22px',
              padding: '8px 24px',
              borderRadius: '9999px',
              background: '#FFFFFF',
              border: '1px solid #E2E5F0',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
              fontSize: '13px',
              color: '#323338',
              fontWeight: 600,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={15} color="#00C875" strokeWidth={2.5} />
              {t.hero.benefits.noCard}
            </span>
            <span style={{ color: '#D0D4E4' }}>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={15} color="#00C875" strokeWidth={2.5} />
              {t.hero.benefits.unlimited}
            </span>
            <span style={{ color: '#D0D4E4' }}>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={15} color="#00C875" strokeWidth={2.5} />
              {t.hero.benefits.privacy}
            </span>
          </div>

          {/* Monday.com SIGNATURE Capability Selector • High Contrast Pure White Cards */}
          <div style={{ marginTop: '48px', width: '100%' }}>
            <p style={{ fontSize: '14.5px', fontWeight: 800, color: '#181B34', marginBottom: '14px' }}>
              {t.hero.selectorPrompt}
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                flexWrap: 'wrap',
              }}
            >
              {t.workflowTabs.map((tab) => {
                const isSelected = selectedWorkflowId === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedWorkflowId(tab.id)}
                    style={{
                      padding: '11px 22px',
                      borderRadius: '12px',
                      background: '#FFFFFF',
                      border: isSelected ? `2px solid ${tab.color}` : '1.5px solid #D8DCE8',
                      color: '#181B34',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected
                        ? `0 6px 20px ${tab.color}35`
                        : '0 2px 8px rgba(0, 0, 0, 0.04)',
                    }}
                    className="clickable-pill"
                  >
                    {renderLucideIcon(tab.iconKey || tab.id, tab.color, 16)}
                    <span>{tab.label}</span>
                    {isSelected && (
                      <span
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: tab.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginLeft: '4px',
                        }}
                      >
                        <Check size={10} color="#FFFFFF" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* • 3. Double Symmetrical Seamless Infinite Marquee directly on Warm Beige Canvas • */}
      <section
        id="marquee"
        style={{
          padding: '10px 24px 44px 24px',
          maxWidth: '1180px',
          margin: '0 auto',
          width: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Symmetrical Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <p
            style={{
              fontSize: '11.5px',
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: '#676B80',
              textTransform: 'uppercase',
            }}
          >
            ✦ {t.marqueeTitle} ✦
          </p>
        </div>

        <div className="marquee-mask">
          {/* Row 1: Official AI Model Providers Ticker (Scrolling Left) */}
          <div style={{ display: 'flex', overflow: 'hidden', marginBottom: '14px' }}>
            <div className="animate-marquee-left" style={{ gap: '14px' }}>
              {[...marqueeProviders, ...marqueeProviders].map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    height: '46px',
                    padding: '0 20px',
                    background: '#FFFFFF',
                    border: '1.5px solid #D8DCE8',
                    borderRadius: '9999px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    flexShrink: 0,
                  }}
                  className="bento-card hover-card-light"
                >
                  {renderLucideIcon(p.iconKey, p.color, 16)}
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#181B34' }}>{p.name}</span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: p.color,
                      background: `${p.color}18`,
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      lineHeight: 1.2,
                    }}
                  >
                    {p.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Row 2: Architecture & Speed Metrics (Scrolling Right) */}
          <div style={{ display: 'flex', overflow: 'hidden' }}>
            <div className="animate-marquee-right" style={{ gap: '14px' }}>
              {[...marqueeFeaturesSymmetrical, ...marqueeFeaturesSymmetrical].map((feat, idx) => (
                <div
                  key={idx}
                  style={{
                    height: '46px',
                    padding: '0 20px',
                    background: '#FFFFFF',
                    border: '1.5px solid #D8DCE8',
                    borderRadius: '9999px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    flexShrink: 0,
                  }}
                  className="bento-card hover-card-light"
                >
                  {renderLucideIcon(feat.iconKey, feat.color, 16)}
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#181B34' }}>{feat.name}</span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: feat.color,
                      background: `${feat.color}18`,
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      lineHeight: 1.2,
                    }}
                  >
                    {feat.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* • 4. The Iconic Anticeil Interactive Work OS Chatbot Studio (Double-Bezel Hardware Architecture) • */}
      <section
        id="board"
        style={{
          padding: '30px 24px 70px 24px',
          maxWidth: '1180px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Double-Bezel Outer Enclosure (Machined Aluminum / Soft Glass Tray) */}
        <div
          style={{
            padding: '8px',
            borderRadius: '24px',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(244, 241, 233, 0.75) 100%)',
            border: '1px solid rgba(24, 27, 52, 0.08)',
            boxShadow: '0 24px 70px -15px rgba(24, 27, 52, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
          }}
        >
          {/* Inner Core Container */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #ECE7DD',
              borderRadius: '18px',
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.02)',
            }}
          >
            {/* Chat Messages Stream Area */}
            <div
              style={{
                padding: '32px 28px',
                minHeight: '380px',
                background: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              {/* 1. User Prompt Bubble (Light Grey Rounded Pill on Top Right) */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                <div
                  style={{
                    background: '#F1F3F5',
                    color: '#181B34',
                    padding: '11px 20px',
                    borderRadius: '18px',
                    fontSize: '14px',
                    fontWeight: 500,
                    maxWidth: '82%',
                    lineHeight: 1.5,
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                  }}
                >
                  {customUserMessage || (lang === 'id'
                    ? 'Jelaskan apa itu Anticeil dan mengapa arsitektur Direct BYOK lebih unggul dari SaaS AI biasa?'
                    : 'Explain what Anticeil is and why the Direct BYOK architecture is superior to traditional AI SaaS?')}
                </div>
              </div>

              {/* 2. Assistant Response Bubble */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                {/* Assistant Header Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: '#0073EA',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0, 115, 234, 0.35)',
                      }}
                    >
                      <Bot size={15} color="#FFFFFF" />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#181B34' }}>
                      {lang === 'id' ? 'Asisten' : 'Assistant'}
                    </span>
                  </div>

                  {/* Token Count Pill on Right */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#0073EA',
                      background: 'rgba(0, 115, 234, 0.08)',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    <Sparkles size={12} color="#0073EA" />
                    <span>{isStreamingText ? (lang === 'id' ? `⚡ ${ROTATING_DEMO_MODELS[activeModelIndex]?.name.split('•')[0] || ''} Mengetik...` : `⚡ ${ROTATING_DEMO_MODELS[activeModelIndex]?.name.split('•')[0] || ''} Streaming...`) : (ROTATING_DEMO_MODELS[activeModelIndex]?.tokens || '931 token')}</span>
                  </div>
                </div>

                {/* 3. Proses Berpikir Accordion Box (Connected Vertical Dashed Timeline) */}
                <div
                  style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: '14px',
                    background: '#FFFFFF',
                    overflow: 'hidden',
                  }}
                >
                  {/* Header Toggle */}
                  <div
                    onClick={() => setShowThoughtProcess(!showThoughtProcess)}
                    style={{
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#181B34' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#A25DDC' }} />
                      <span>{lang === 'id' ? 'Proses Berpikir' : 'Thinking Process'}</span>
                      <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>(5 steps)</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#5F6377', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {showThoughtProcess ? (lang === 'id' ? 'Sembunyikan' : 'Hide') : (lang === 'id' ? 'Tampilkan' : 'Show')}
                      <ChevronDown size={14} style={{ transform: showThoughtProcess ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }} />
                    </span>
                  </div>

                  {/* Connected Vertical Timeline Body */}
                  {showThoughtProcess && (
                    <div
                      style={{
                        padding: '12px 18px 16px 18px',
                        fontSize: '12.5px',
                        color: '#4E5166',
                        lineHeight: 1.55,
                        borderTop: '1px solid #F3F4F6',
                        position: 'relative',
                      }}
                    >
                      {/* Dashed Timeline Connector Line */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '26px',
                          top: '20px',
                          bottom: '30px',
                          width: '1px',
                          borderLeft: '1.5px dashed #D1D5DB',
                        }}
                      />

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Step 1 */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', position: 'relative', zIndex: 1 }}>
                          <div style={{ background: '#FFFFFF', padding: '1px 0', flexShrink: 0, marginTop: '2px' }}>
                            <Lightbulb size={15} color="#6B7280" />
                          </div>
                          <span style={{ color: '#4B5563' }}>
                            {lang === 'id'
                              ? 'Menganalisis arsitektur Work OS Anticeil: direct peer-to-provider, zero-proxy server, dan enkripsi lokal AES-256.'
                              : 'Analyzing Anticeil Work OS architecture: direct peer-to-provider, zero-proxy server, and local AES-256 encryption.'}
                          </span>
                        </div>

                        {/* Step 2 */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', position: 'relative', zIndex: 1 }}>
                          <div style={{ background: '#FFFFFF', padding: '1px 0', flexShrink: 0, marginTop: '2px' }}>
                            <Lightbulb size={15} color="#6B7280" />
                          </div>
                          <div style={{ color: '#4B5563' }}>
                            <strong style={{ color: '#181B34' }}>{lang === 'id' ? 'Keamanan & Privasi Client-Side:' : 'Client-Side Security & Privacy:'}</strong>
                            <div>- {lang === 'id' ? 'Kunci API dan percakapan tidak pernah melewati atau disimpan di server perantara.' : 'API keys and chat logs never pass through or get stored on intermediary servers.'}</div>
                            <div>- {lang === 'id' ? '100% kepemilikan data lokal tanpa risiko kebocoran backend atau data training liar.' : '100% local data ownership with zero backend data leakage risk.'}</div>
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', position: 'relative', zIndex: 1 }}>
                          <div style={{ background: '#FFFFFF', padding: '1px 0', flexShrink: 0, marginTop: '2px' }}>
                            <Lightbulb size={15} color="#6B7280" />
                          </div>
                          <div style={{ color: '#4B5563' }}>
                            <strong style={{ color: '#181B34' }}>{lang === 'id' ? 'Efisiensi Biaya & Zero Markup:' : 'Cost Efficiency & Zero Markup:'}</strong>
                            <div>- {lang === 'id' ? 'Membayar harga token wholesale resmi langsung ke penyedia (OpenAI, Claude, Groq, DeepSeek).' : 'Pay raw wholesale token prices directly to providers (OpenAI, Claude, Groq, DeepSeek).'}</div>
                            <div>- {lang === 'id' ? 'Menghemat hingga 98% dibanding langganan kaku $20/bln per penyedia.' : 'Save up to 98% compared to rigid $20/month per-provider subscriptions.'}</div>
                          </div>
                        </div>

                        {/* Step 4 */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', position: 'relative', zIndex: 1 }}>
                          <div style={{ background: '#FFFFFF', padding: '1px 0', flexShrink: 0, marginTop: '2px' }}>
                            <Laptop size={15} color="#6B7280" />
                          </div>
                          <div style={{ color: '#4B5563' }}>
                            <strong style={{ color: '#181B34' }}>{lang === 'id' ? 'Multi-Model Orchestration & Runtimes:' : 'Multi-Model Orchestration & Runtimes:'}</strong>
                            <div>- {lang === 'id' ? 'Akses model cloud berkecepatan 500 tok/detik (Groq) hingga model lokal 100% offline (Ollama).' : 'Access ultra-fast 500 tok/s cloud models (Groq) to 100% offline local runtimes (Ollama).'}</div>
                            <div>- {lang === 'id' ? 'Fitur terpadu: Live Web Search, Document Intelligence, AI Visual/Video, & MCP Connectors.' : 'Integrated suite: Live Web Search, Document Intelligence, AI Visual/Video, & MCP Connectors.'}</div>
                          </div>
                        </div>

                        {/* Step 5 */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', position: 'relative', zIndex: 1 }}>
                          <div style={{ background: '#FFFFFF', padding: '1px 0', flexShrink: 0, marginTop: '2px' }}>
                            <CheckCircle2 size={16} color="#10B981" />
                          </div>
                          <span style={{ color: '#047857', fontWeight: 600 }}>
                            {lang === 'id'
                              ? 'Anticeil adalah Work OS AI universal yang memberikan kebebasan penuh, privasi total, dan efisiensi biaya maksimal.'
                              : 'Anticeil is the universal AI Work OS providing complete freedom, total privacy, and maximum cost efficiency.'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Assistant Response Body: Title + Comparison Table */}
                <div style={{ marginTop: '6px' }}>
                  <div style={{ position: 'relative' }}>
                    <MarkdownRenderer content={displayedStreamingResponse} />
                    {isStreamingText && (
                      <span className="ai-typing-cursor" title="Streaming token..." />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Interactive Chat Input Bar (Matching Image 1) */}
            <div
              style={{
                padding: '16px 24px 20px 24px',
                background: '#FFFFFF',
                borderTop: '1px solid #F3F4F6',
              }}
            >
              <form
                onSubmit={handleSendChat}
                style={{
                  border: '1.5px solid #E5E7EB',
                  borderRadius: '16px',
                  background: '#FFFFFF',
                  padding: '12px 16px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {/* Text Input */}
                <input
                  type="text"
                  value={chatInputText}
                  onChange={(e) => setChatInputText(e.target.value)}
                  placeholder={
                    lang === 'id'
                      ? 'Tanyakan apa saja atau tekan / untuk template...'
                      : 'Ask anything or press / for templates...'
                  }
                  style={{
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#181B34',
                    background: 'transparent',
                    paddingBottom: '12px',
                    fontFamily: 'inherit',
                  }}
                />

                {/* Bottom Controls Row in Input Box */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '6px',
                  }}
                >
                  {/* Left Plus Icon */}
                  <button
                    type="button"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#6B7280',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                    }}
                    title="Add attachment or action"
                  >
                    <Plus size={18} />
                  </button>

                  {/* Right Model Dropdown, Mic & Submit */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      onClick={() => setActiveModelIndex((prev) => (prev + 1) % ROTATING_DEMO_MODELS.length)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        color: '#181B34',
                        cursor: 'pointer',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: '#F3F4F6',
                        border: '1px solid #E5E7EB',
                        transition: 'all 0.2s ease',
                      }}
                      title="Klik untuk ganti model"
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0073EA', boxShadow: '0 0 6px #0073EA' }} />
                      <span>{ROTATING_DEMO_MODELS[activeModelIndex]?.name || 'Groq • Llama 3.3 70B'}</span>
                      <ChevronDown size={13} color="#6B7280" />
                    </div>

                    <button
                      type="button"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#6B7280',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px',
                      }}
                      title="Voice input"
                    >
                      <Mic size={16} />
                    </button>

                    <button
                      type="submit"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: chatInputText.trim() ? '#0073EA' : '#E5E7EB',
                        border: 'none',
                        color: chatInputText.trim() ? '#FFFFFF' : '#9CA3AF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: chatInputText.trim() ? 'pointer' : 'default',
                        transition: 'all 0.15s ease',
                      }}
                      title="Send message"
                    >
                      <ArrowUp size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* • 5. Monday.com Building Blocks / Bento Features on Warm Beige • */}
      <section
        id="features"
        style={{
          padding: '80px 24px',
          maxWidth: '1180px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 14px',
              borderRadius: '9999px',
              background: 'rgba(0, 115, 234, 0.08)',
              border: '1px solid rgba(0, 115, 234, 0.2)',
              color: '#0073EA',
              fontSize: '12px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '16px',
            }}
          >
            <Sparkles size={13} color="#0073EA" />
            <span>{lang === 'id' ? 'KAPABILITAS LENGKAP WORK OS' : 'FULL WORK OS CAPABILITIES'}</span>
          </div>
          <h2 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '14px', color: '#181B34' }}>
            {t.bento.title}
          </h2>
          <p style={{ fontSize: '16px', color: '#5F6377', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
            {t.bento.subtitle}
          </p>
        </div>

        {/* 12-Column Asymmetric Bento Grid */}
        <div
          className="bento-grid-container"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '20px',
          }}
        >
          {/* Card 1: 50ms Streaming Engine (Featured Wide Bento - 7 Cols) */}
          <div
            className="bento-card hover-card-light"
            style={{
              gridColumn: 'span 7',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #F0F6FF 100%)',
              border: '1px solid #D6E4FF',
              borderRadius: '22px',
              padding: '34px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '20px',
              boxShadow: '0 8px 30px rgba(0, 115, 234, 0.06)',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '280px',
            }}
          >
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #0073EA 0%, #0056B3 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0, 115, 234, 0.35)' }}>
                  <Zap size={24} color="#FFFFFF" />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#0073EA', background: 'rgba(0, 115, 234, 0.1)', border: '1px solid rgba(0, 115, 234, 0.2)', padding: '4px 12px', borderRadius: '9999px', fontFamily: 'monospace' }}>
                  500 tok/s LPU
                </span>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#181B34', marginBottom: '10px', letterSpacing: '-0.02em' }}>
                {t.bento.card1Title}
              </h3>
              <p style={{ fontSize: '14.5px', color: '#5F6377', lineHeight: 1.65, maxWidth: '480px' }}>
                {t.bento.card1Desc}
              </p>
            </div>

            {/* Micro visual bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid rgba(0, 115, 234, 0.1)' }}>
              {['50ms TTFT Latency', 'Sub-Pixel Throttle', 'Zero Memory Leaks', 'Direct WebStream'].map((item) => (
                <span key={item} style={{ fontSize: '11px', fontWeight: 700, color: '#0073EA', background: '#FFFFFF', border: '1px solid #D6E4FF', padding: '3px 10px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  ✓ {item}
                </span>
              ))}
            </div>
          </div>

          {/* Card 2: Zero-Proxy AES-256 Vault (Featured Tall Bento - 5 Cols) */}
          <div
            className="bento-card hover-card-light"
            style={{
              gridColumn: 'span 5',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 100%)',
              border: '1px solid #BBF7D0',
              borderRadius: '22px',
              padding: '34px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '20px',
              boxShadow: '0 8px 30px rgba(0, 200, 117, 0.06)',
              minHeight: '280px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #00C875 0%, #009E5C 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0, 200, 117, 0.35)' }}>
                  <Lock size={24} color="#FFFFFF" />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#009E5C', background: 'rgba(0, 200, 117, 0.12)', border: '1px solid rgba(0, 200, 117, 0.25)', padding: '4px 12px', borderRadius: '9999px' }}>
                  100% Client-Side
                </span>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#181B34', marginBottom: '10px', letterSpacing: '-0.02em' }}>
                {t.bento.card2Title}
              </h3>
              <p style={{ fontSize: '14px', color: '#5F6377', lineHeight: 1.65 }}>
                {t.bento.card2Desc}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#009E5C', background: '#FFFFFF', padding: '8px 14px', borderRadius: '10px', border: '1px solid #BBF7D0' }}>
              <ShieldCheck size={16} color="#00C875" />
              <span>AES-256 GCM • Local Storage Encrypted</span>
            </div>
          </div>

          {/* Card 7: Visual Workflow & Cloud Automasi (4 Cols) */}
          <div
            className="bento-card hover-card-light"
            style={{
              gridColumn: 'span 4',
              background: '#FFFFFF',
              border: '1px solid #E8E2D5',
              borderRadius: '20px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(0, 200, 117, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Workflow size={22} color="#00C875" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {['Cron', 'LLM', 'Hook'].map((b, i) => (
                    <React.Fragment key={b}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#00C875', background: 'rgba(0, 200, 117, 0.08)', padding: '2px 6px', borderRadius: '6px' }}>{b}</span>
                      {i < 2 && <span style={{ fontSize: '10px', color: '#B0B4C6' }}>→</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#181B34', marginBottom: '8px' }}>
                {t.bento.card7Title}
              </h3>
              <p style={{ fontSize: '13.5px', color: '#5F6377', lineHeight: 1.6 }}>
                {t.bento.card7Desc}
              </p>
            </div>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#00C875' }}>
              ⚡ Multi-step node pipeline 24/7
            </div>
          </div>

          {/* Card 8: MCP Connectors (4 Cols) */}
          <div
            className="bento-card hover-card-light"
            style={{
              gridColumn: 'span 4',
              background: '#FFFFFF',
              border: '1px solid #E8E2D5',
              borderRadius: '20px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(253, 171, 61, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plug size={22} color="#FDAB3D" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {['GitHub', 'Notion', 'Drive'].map((c) => (
                    <span key={c} style={{ fontSize: '10px', fontWeight: 700, color: '#374151', background: '#F3F4F6', padding: '2px 7px', borderRadius: '9999px' }}>{c}</span>
                  ))}
                </div>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#181B34', marginBottom: '8px' }}>
                {t.bento.card8Title}
              </h3>
              <p style={{ fontSize: '13.5px', color: '#5F6377', lineHeight: 1.6 }}>
                {t.bento.card8Desc}
              </p>
            </div>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#D97706' }}>
              🔌 Model Context Protocol Standard
            </div>
          </div>

          {/* Card 9: Live Artifact Builder & Sandbox (4 Cols) */}
          <div
            className="bento-card hover-card-light"
            style={{
              gridColumn: 'span 4',
              background: '#FFFFFF',
              border: '1px solid #E8E2D5',
              borderRadius: '20px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(0, 115, 234, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Code2 size={22} color="#0073EA" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {['HTML', 'React', 'SVG'].map((l) => (
                    <span key={l} style={{ fontSize: '10px', fontWeight: 700, color: '#0073EA', background: 'rgba(0, 115, 234, 0.08)', padding: '2px 6px', borderRadius: '6px' }}>{l}</span>
                  ))}
                </div>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#181B34', marginBottom: '8px' }}>
                {t.bento.card9Title}
              </h3>
              <p style={{ fontSize: '13.5px', color: '#5F6377', lineHeight: 1.6 }}>
                {t.bento.card9Desc}
              </p>
            </div>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0073EA' }}>
              🚀 Split-screen live preview & copy
            </div>
          </div>

          {/* Card 3: AI Image & Video Studio (4 Cols) */}
          <div
            className="bento-card hover-card-light"
            style={{
              gridColumn: 'span 4',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF5F5 100%)',
              border: '1px solid #FECDD3',
              borderRadius: '20px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 4px 20px rgba(226, 68, 92, 0.04)',
            }}
          >
            <div>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(226, 68, 92, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <Film size={22} color="#E2445C" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#181B34', marginBottom: '8px' }}>
                {t.bento.card3Title}
              </h3>
              <p style={{ fontSize: '13.5px', color: '#5F6377', lineHeight: 1.6 }}>
                {t.bento.card3Desc}
              </p>
            </div>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#E2445C' }}>
              🎨 Flux.1 • SDXL • Luma Ray 2
            </div>
          </div>

          {/* Card 4: Autonomous Web Search (4 Cols) */}
          <div
            className="bento-card hover-card-light"
            style={{
              gridColumn: 'span 4',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #FFFBEB 100%)',
              border: '1px solid #FDE68A',
              borderRadius: '20px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: '0 4px 20px rgba(253, 171, 61, 0.04)',
            }}
          >
            <div>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(253, 171, 61, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <Globe size={22} color="#FDAB3D" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#181B34', marginBottom: '8px' }}>
                {t.bento.card4Title}
              </h3>
              <p style={{ fontSize: '13.5px', color: '#5F6377', lineHeight: 1.6 }}>
                {t.bento.card4Desc}
              </p>
            </div>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#D97706' }}>
              🌐 Real-time grounding & web citations
            </div>
          </div>

          {/* Card 6: Voice Dictation & Speech Synthesis (4 Cols) */}
          <div
            className="bento-card hover-card-light"
            onMouseEnter={() => setIsPlayingAudio(true)}
            onMouseLeave={() => setIsPlayingAudio(false)}
            style={{
              gridColumn: 'span 4',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #FAF5FF 100%)',
              border: '1px solid #E9D5FF',
              borderRadius: '20px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(162, 93, 220, 0.04)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(162, 93, 220, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Volume2 size={22} color="#A25DDC" />
                </div>
                <div ref={audioBarsRef} style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '22px' }}>
                  {[10, 16, 22, 14, 18, 12, 20, 8].map((h, idx) => (
                    <div key={idx} style={{ width: '3px', height: `${h}px`, background: '#A25DDC', borderRadius: '2px', transformOrigin: 'bottom' }} />
                  ))}
                </div>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#181B34', marginBottom: '8px' }}>
                {t.bento.card6Title}
              </h3>
              <p style={{ fontSize: '13.5px', color: '#5F6377', lineHeight: 1.6 }}>
                {t.bento.card6Desc}
              </p>
            </div>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#784BD1' }}>
              🎙️ Hands-free STT + Neural TTS Wave
            </div>
          </div>
        </div>
      </section>

      {/* • Download Section: Tauri Windows & Expo Android • */}
      <section
        id="download"
        style={{
          padding: '80px 24px 70px 24px',
          maxWidth: '1180px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 48px auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              background: 'rgba(0, 200, 117, 0.08)',
              border: '1px solid rgba(0, 200, 117, 0.25)',
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#00A35E',
              marginBottom: '16px',
            }}
          >
            <Download size={13} color="#00C875" />
            <span>{lang === 'id' ? 'EKOSISTEM MULTI-PLATFORM' : 'MULTI-PLATFORM ECOSYSTEM'}</span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#181B34',
              marginBottom: '14px',
              lineHeight: 1.2,
            }}
          >
            {lang === 'id'
              ? 'Unduh Anticeil untuk Semua Perangkat Anda'
              : 'Download Anticeil for All Your Devices'}
          </h2>

          <p
            style={{
              fontSize: '16px',
              color: '#5F6377',
              lineHeight: 1.6,
              margin: '0 auto',
            }}
          >
            {lang === 'id'
              ? 'Gunakan Anticeil dengan performa native tanpa beban memori di Desktop Windows (Tauri), atau di smartphone Anda dengan Android APK (Expo).'
              : 'Experience Anticeil with lightweight native performance on Windows Desktop (Tauri), or on your mobile device with Android APK (Expo).'}
          </p>
        </div>

        {/* 2 Platform Cards: Windows (Tauri) & Android (Expo) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '24px',
            marginBottom: '24px',
          }}
        >
          {/* Card 1: Windows Desktop (Tauri) */}
          <div
            className="bento-card hover-card-light"
            style={{
              background: 'linear-gradient(135deg, #181B34 0%, #1F2338 100%)',
              borderRadius: '24px',
              padding: '36px 32px',
              color: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 20px 40px rgba(24, 27, 52, 0.25)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Corner Badge */}
            <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(0, 115, 234, 0.15)', pointerEvents: 'none' }} />

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(0, 115, 234, 0.2)', border: '1px solid rgba(0, 115, 234, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Monitor size={28} color="#0073EA" />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#60A5FA', background: 'rgba(0, 115, 234, 0.2)', border: '1px solid rgba(0, 115, 234, 0.35)', padding: '4px 12px', borderRadius: '9999px' }}>
                  Tauri v2 • Rust Core
                </span>
              </div>

              <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>
                Windows Desktop
              </h3>
              <p style={{ fontSize: '14px', color: '#B2B4C2', lineHeight: 1.6, marginBottom: '20px' }}>
                {lang === 'id'
                  ? 'Aplikasi desktop super ringan (~15 MB). Dibangun dengan Rust & Tauri untuk penggunaan memori minimal dan integrasi lokal Ollama tanpa latensi.'
                  : 'Ultra-lightweight desktop app (~15 MB). Built with Rust & Tauri for near-zero RAM usage and instant zero-latency local Ollama bridging.'}
              </p>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  lang === 'id' ? 'Eksekusi Rust native (~15 MB installer)' : 'Native Rust execution (~15 MB installer)',
                  lang === 'id' ? 'Shortcut global & system tray minibar' : 'Global hotkeys & background system tray',
                  lang === 'id' ? 'Jembatan auto-detect model lokal Ollama' : 'Local Ollama model auto-detection bridge',
                  lang === 'id' ? 'Enkripsi hardware keychain offline' : 'Offline hardware keychain AES-256 vault',
                ].map((item, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#E5E7EB' }}>
                    <CheckCircle2 size={16} color="#00C875" style={{ flexShrink: 0 }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <a
                href="#download-windows"
                onClick={(e) => {
                  e.preventDefault();
                  alert(lang === 'id' ? 'Installer Windows (.exe / .msi) sedang disiapkan!' : 'Windows installer (.exe / .msi) package is ready for download!');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  background: '#0073EA',
                  color: '#FFFFFF',
                  boxShadow: '0 6px 20px rgba(0, 115, 234, 0.4)',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
              >
                <Download size={18} />
                <span>{lang === 'id' ? 'Unduh untuk Windows (.exe)' : 'Download for Windows (.exe)'}</span>
              </a>
              <div style={{ textAlign: 'center', fontSize: '11.5px', color: '#808396', marginTop: '10px' }}>
                Windows 10 / 11 (64-bit) • v1.2.0 • SHA-256 Verified
              </div>
            </div>
          </div>

          {/* Card 2: Android Mobile (Expo) */}
          <div
            className="bento-card hover-card-light"
            style={{
              background: 'linear-gradient(135deg, #181B34 0%, #15242E 100%)',
              borderRadius: '24px',
              padding: '36px 32px',
              color: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 20px 40px rgba(24, 27, 52, 0.25)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Corner Badge */}
            <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(0, 200, 117, 0.15)', pointerEvents: 'none' }} />

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(0, 200, 117, 0.2)', border: '1px solid rgba(0, 200, 117, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Smartphone size={28} color="#00C875" />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#34D399', background: 'rgba(0, 200, 117, 0.2)', border: '1px solid rgba(0, 200, 117, 0.35)', padding: '4px 12px', borderRadius: '9999px' }}>
                  Expo • React Native
                </span>
              </div>

              <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', marginBottom: '8px' }}>
                Android APK Mobile
              </h3>
              <p style={{ fontSize: '14px', color: '#B2B4C2', lineHeight: 1.6, marginBottom: '20px' }}>
                {lang === 'id'
                  ? 'Aplikasi mobile mandiri untuk Android. Dilengkapi dikte suara langsung, pengenalan visi kamera, dan vault kunci terisolasi di perangkat.'
                  : 'Standalone mobile app for Android. Features real-time voice dictation, camera vision intelligence, and sandboxed device key storage.'}
              </p>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  lang === 'id' ? 'Dikte suara cerdas STT + pemutar suara neural' : 'Neural voice dictation STT + instant audio TTS',
                  lang === 'id' ? 'OCR kamera & analisis dokumen instan' : 'Live camera vision OCR & document extraction',
                  lang === 'id' ? 'Kunci aplikasi biometrik (Fingerprint/Face)' : 'Biometric hardware lock (Fingerprint / Face ID)',
                  lang === 'id' ? 'Sinkronisasi offline terenkripsi di perangkat' : 'Encrypted offline local database storage',
                ].map((item, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#E5E7EB' }}>
                    <CheckCircle2 size={16} color="#00C875" style={{ flexShrink: 0 }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <a
                href="#download-apk"
                onClick={(e) => {
                  e.preventDefault();
                  alert(lang === 'id' ? 'Paket APK Android (.apk) sedang disiapkan!' : 'Android APK package (.apk) is ready for download!');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  background: '#00C875',
                  color: '#FFFFFF',
                  boxShadow: '0 6px 20px rgba(0, 200, 117, 0.4)',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
              >
                <Download size={18} />
                <span>{lang === 'id' ? 'Unduh Berkas APK (.apk)' : 'Download Android APK (.apk)'}</span>
              </a>
              <div style={{ textAlign: 'center', fontSize: '11.5px', color: '#808396', marginTop: '10px' }}>
                Android 8.0+ (ARM64 / x86_64) • v1.2.0 • Standalone APK
              </div>
            </div>
          </div>
        </div>

        {/* Browser PWA Strip */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #E8E2D5',
            borderRadius: '18px',
            padding: '24px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            flexWrap: 'wrap',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(0, 115, 234, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Globe size={22} color="#0073EA" />
            </div>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#181B34', margin: '0 0 2px 0' }}>
                {lang === 'id' ? 'Gunakan di Browser (PWA Ready • Zero Install)' : 'Use in Any Browser (PWA Ready • Zero Install)'}
              </h4>
              <p style={{ fontSize: '13px', color: '#5F6377', margin: 0 }}>
                {lang === 'id' ? 'Buka langsung di Chrome, Edge, Safari, atau Firefox tanpa instalasi apapun.' : 'Launch instantly on Chrome, Edge, Safari, or Firefox with zero setup.'}
              </p>
            </div>
          </div>

          <Link
            href="/chat"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              borderRadius: '10px',
              background: '#181B34',
              color: '#FFFFFF',
              fontSize: '13.5px',
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <span>{lang === 'id' ? 'Buka Versi Web' : 'Open Web App'}</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* • 7. Text-Reveal FAQs (Inspired by Ruixen UI / 21st.dev) • */}
      <section
        id="faq"
        style={{
          padding: '70px 24px',
          maxWidth: '1180px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr)',
            gap: '40px',
            alignItems: 'start',
          }}
          className="faq-split-grid"
        >
          {/* Left Column: Editorial Info & Support Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              position: 'sticky',
              top: '90px',
            }}
          >
            {/* Pill Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '9999px',
                background: '#FFFFFF',
                border: '1.5px solid #E8E2D5',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                width: 'fit-content',
              }}
            >
              <HelpCircle size={15} color="#0073EA" />
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#0073EA',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {t.faq.badge || 'Support & FAQs'}
              </span>
            </div>

            {/* Main Headline */}
            <h2
              style={{
                fontSize: '34px',
                fontWeight: 800,
                letterSpacing: '-0.025em',
                lineHeight: 1.2,
                color: '#181B34',
              }}
            >
              {t.faq.title}
            </h2>

            <p
              style={{
                fontSize: '15px',
                lineHeight: 1.6,
                color: '#5F6377',
              }}
            >
              {t.faq.subtitle}
            </p>

            {/* Interactive Support / Help Card */}
            <div
              style={{
                marginTop: '10px',
                padding: '24px',
                borderRadius: '16px',
                background: '#FFFFFF',
                border: '1.5px solid #E8E2D5',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '10px',
                    background: 'rgba(0, 115, 234, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sparkles size={18} color="#0073EA" />
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#181B34' }}>
                  {t.faq.supportCardTitle}
                </h4>
              </div>
              <p style={{ fontSize: '13.5px', color: '#5F6377', lineHeight: 1.5 }}>
                {t.faq.supportCardDesc}
              </p>
              <Link
                href="/settings"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: '#0073EA',
                  textDecoration: 'none',
                  marginTop: '4px',
                }}
              >
                <span>{t.faq.supportCardCta}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Right Column: Accordion Items with Text-Reveal Animation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {t.faq.items.map((faq, idx) => {
              const isExpanded = activeFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    background: '#FFFFFF',
                    border: isExpanded ? '1.5px solid #0073EA' : '1.5px solid #E8E2D5',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: isExpanded
                      ? '0 12px 32px rgba(0, 115, 234, 0.08), 0 2px 8px rgba(0, 0, 0, 0.02)'
                      : '0 2px 8px rgba(0, 0, 0, 0.02)',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isExpanded ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '20px 22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'transparent',
                      border: 'none',
                      color: isExpanded ? '#0073EA' : '#181B34',
                      fontSize: '15.5px',
                      fontWeight: 700,
                      textAlign: 'left',
                      cursor: 'pointer',
                      gap: '16px',
                      transition: 'color 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      {/* Monospace Number Pill */}
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          fontFamily: "'JetBrains Mono', monospace",
                          padding: '4px 8px',
                          borderRadius: '6px',
                          background: isExpanded ? 'rgba(0, 115, 234, 0.1)' : '#F5F3EC',
                          color: isExpanded ? '#0073EA' : '#8D91A5',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {faq.id || `0${idx + 1}`}
                      </span>
                      <span>{faq.q}</span>
                    </div>

                    {/* Smooth Rotating Plus/Minus Toggle Pill */}
                    <motion.div
                      animate={{ rotate: isExpanded ? 45 : 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: isExpanded ? '#0073EA' : '#F5F3EC',
                        color: isExpanded ? '#FFFFFF' : '#181B34',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'background-color 0.2s ease, color 0.2s ease',
                      }}
                    >
                      <Plus size={16} />
                    </motion.div>
                  </button>

                  {/* Text-Reveal Answer with Framer Motion */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <div
                          style={{
                            padding: '0 22px 22px 22px',
                            borderTop: '1px solid #F6F4EE',
                            paddingTop: '16px',
                          }}
                        >
                          <motion.p
                            initial={{ opacity: 0, y: 8, filter: 'blur(3px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            transition={{ duration: 0.3, delay: 0.05, ease: 'easeOut' }}
                            style={{
                              fontSize: '14.5px',
                              lineHeight: 1.65,
                              color: '#5F6377',
                              marginBottom: '14px',
                            }}
                          >
                            {faq.a}
                          </motion.p>

                          {/* Reveal Tag */}
                          {faq.tag && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.25, delay: 0.1 }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                borderRadius: '9999px',
                                background: 'rgba(0, 115, 234, 0.08)',
                                border: '1px solid rgba(0, 115, 234, 0.2)',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                color: '#0073EA',
                              }}
                            >
                              <span>• # {faq.tag}</span>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* • 8. Transparent Cloud & BYOK Pricing Section • */}
      <section
        id="pricing"
        style={{
          padding: '80px 24px 70px 24px',
          maxWidth: '1180px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 32px auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              background: 'rgba(0, 115, 234, 0.08)',
              border: '1px solid rgba(0, 115, 234, 0.2)',
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#0073EA',
              marginBottom: '16px',
            }}
          >
            <span>• {t.pricing.badge}</span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#181B34',
              marginBottom: '14px',
              lineHeight: 1.2,
            }}
          >
            {t.pricing.title}
          </h2>

          <p
            style={{
              fontSize: '16px',
              color: '#5F6377',
              lineHeight: 1.6,
              margin: '0 auto 12px auto',
            }}
          >
            {t.pricing.subtitle}
          </p>
        </div>

        {/* Integrated 21st.dev / Ruixen UI Pricing_03 Component */}
        <Pricing_03 lang={lang} />

        {/* Bottom Trust Guarantee */}
        <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '13px', color: '#808396' }}>
          🔒 100% Client-Side AES-256 Vault Guarantee • Zero Server Data Storage • Cancel Anytime
        </div>
      </section>

      {/* • 9. 21st.dev / shadcnstore cta-section-3 • */}
      <CtaSection3 lang={lang} />

      {/* • 9. High-Contrast Midnight Anchor Footer with Legal & Compliance Links • */}
      <footer
        style={{
          borderTop: '1px solid #262B44',
          background: '#111322',
          width: '100%',
        }}
      >
        <div
          style={{
            maxWidth: '1180px',
            margin: '0 auto',
            width: '100%',
            padding: '56px 24px 36px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '36px',
          }}
        >
          {/* Top Row: 4 Comprehensive Footer Columns */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '32px',
            }}
          >
            {/* Col 1: Brand & Identity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#0073EA',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 8px)',
                    gap: '3px',
                    padding: '6px',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFFFFF' }} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FDAB3D' }} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00C875' }} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E2445C' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                  <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                    anticeil
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#0073EA' }}>.os</span>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: '#808396', margin: 0, lineHeight: 1.6, maxWidth: '280px' }}>
                {t.footer.tagline}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#00C875',
                    background: 'rgba(0, 200, 117, 0.1)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(0, 200, 117, 0.2)',
                  }}
                >
                  ✓ 14-Day Money Back
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#0073EA',
                    background: 'rgba(0, 115, 234, 0.1)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(0, 115, 234, 0.2)',
                  }}
                >
                  ✓ 100% BYOK
                </span>
              </div>
            </div>

            {/* Col 2: Product Modules */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Product Modules
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px' }}>
                <Link href="/chat" style={{ color: '#B2B4C2', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                  AI Chat Workspace
                </Link>
                <Link href="/pdf-tools" style={{ color: '#B2B4C2', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                  PDF Studio & Tools
                </Link>
                <Link href="/imagine" style={{ color: '#B2B4C2', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                  Imagine Visual Studio
                </Link>
                <Link href="/automations" style={{ color: '#B2B4C2', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                  Automations & Pipelines
                </Link>
                <a href="#pricing" style={{ color: '#0073EA', textDecoration: 'none', fontWeight: 600 }}>
                  Transparent Pricing → 
                </a>
              </div>
            </div>

            {/* Col 3: Legal & Policies */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Legal & Compliance
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px' }}>
                <Link href="/terms" style={{ color: '#B2B4C2', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                  Terms of Service
                </Link>
                <Link href="/privacy" style={{ color: '#B2B4C2', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                  Privacy Policy
                </Link>
                <Link href="/refund" style={{ color: '#B2B4C2', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                  Refund & Cancellation Policy
                </Link>
                <Link href="/settings" style={{ color: '#B2B4C2', textDecoration: 'none', transition: 'color 0.15s ease' }}>
                  Manage API Keys
                </Link>
              </div>
            </div>

            {/* Col 4: Official Support & Contact */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Support & Contact
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px' }}>
                <a
                  href="mailto:• support@anticeil.com"
                  style={{ color: '#00C875', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>support@anticeil.com</span>
                </a>
                <span style={{ color: '#808396', fontSize: '12.5px' }}>
                  Response time: &lt; 24 hours (Mon–Sat)
                </span>
                <span style={{ color: '#808396', fontSize: '12.5px' }}>
                  Guaranteed ✓ 14-Day Money Back Guarantee on all Pro & Team subscriptions.
                </span>
              </div>
            </div>
          </div>

          {/* Symmetrical Horizontal Divider */}
          <div style={{ width: '100%', height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />

          {/* Bottom Row: Copyright on Left, Privacy & Security Badges on Right */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              fontSize: '12.5px',
              color: '#808396',
            }}
          >
            <span>© 2026 Anticeil Work OS • Decentralized BYOK AI Workspace</span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#00C875', fontWeight: 600 }}>
                <ShieldCheck size={15} color="#00C875" /> ✓ 100% Client-Side Private
              </span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Lock size={13} color="#00C875" /> AES-256-GCM Vault
              </span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Zap size={13} color="#FDAB3D" /> Zero Proxy Direct Stream
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
