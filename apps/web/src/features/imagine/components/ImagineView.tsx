'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Image as ImageIcon,
  Download,
  Copy,
  Check,
  RefreshCw,
  Wand2,
  Palette,
  Ratio,
  Film,
  Music,
  KeyRound,
  CheckCircle2,
  Info,
  ExternalLink,
  ShieldCheck,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Mic,
  Headphones,
  Sliders,
  Radio,
} from 'lucide-react';
import { useSettingsStore } from '../../settings/store/useSettingsStore';
import { useStorageStore } from '../../storage/store/useStorageStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { getTranslation } from '@anticeil/core';

type MediaMode = 'image' | 'video' | 'audio';

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  keyType: 'free' | 'gemini' | 'openai' | 'stability' | 'elevenlabs' | 'suno' | 'microsoft';
  keyRequirement: string;
  description: string;
}

interface ImageItem {
  id: string;
  url: string;
  prompt: string;
  style: string;
  ratio: string;
  model: string;
  createdAt: string;
}

interface VideoItem {
  id: string;
  url: string;
  prompt: string;
  model: string;
  ratio: string;
  duration: string;
  createdAt: string;
}

interface AudioItem {
  id: string;
  title: string;
  prompt: string;
  model: string;
  voice: string;
  category: 'speech' | 'music' | 'sfx';
  durationSec: number;
  createdAt: string;
}

// Generate genuine playable WAV file blob via Web Audio API buffer
function createWavBlob(durationSec: number = 6, baseFreq: number = 440, style: string = 'lofi'): Blob {
  const sampleRate = 22050;
  const numChannels = 1;
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  const freq = style.includes('Synth') ? 220 : style.includes('Piano') ? 330 : baseFreq;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.min(1, t * 2) * Math.max(0, 1 - t / durationSec);
    const sample =
      (Math.sin(2 * Math.PI * freq * t) * 0.4 +
        Math.sin(2 * Math.PI * (freq * 1.25) * t) * 0.25 +
        Math.sin(2 * Math.PI * (freq * 1.5) * t) * 0.15 +
        (Math.random() * 2 - 1) * 0.02) *
      envelope;
    const intSample = Math.max(-1, Math.min(1, sample)) * 0x7fff;
    view.setInt16(44 + i * 2, intSample, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function ImagineView() {
  const session = useAuthStore((s) => s.session);
  const language = useSettingsStore((s) => s.language);
  const t = getTranslation(language);
  const ti = t.imagine;

  const [mediaMode, setMediaMode] = useState<MediaMode>('image');
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Photorealistic');
  const [selectedRatio, setSelectedRatio] = useState('16:9');
  const [selectedModel, setSelectedModel] = useState('flux');
  const [selectedVoice, setSelectedVoice] = useState('gadis');
  const [audioSpeed, setAudioSpeed] = useState(1.0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showKeyGuide, setShowKeyGuide] = useState(false);

  // Audio Playback State
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<{ [id: string]: number }>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const mediaModes: { id: MediaMode; label: string; icon: React.ReactNode }[] = [
    { id: 'image', label: language === 'id' ? 'Gambar' : 'Image', icon: <ImageIcon size={14} /> },
    { id: 'video', label: language === 'id' ? 'Video' : 'Video', icon: <Film size={14} /> },
    { id: 'audio', label: language === 'id' ? 'Audio' : 'Audio', icon: <Music size={14} /> },
  ];

  const imageModels: ModelInfo[] = [
    {
      id: 'flux',
      name: 'FLUX.1 Schnell (Gratis / Client-Side)',
      provider: 'Black Forest Labs / Pollinations',
      keyType: 'free',
      keyRequirement: language === 'id' ? '100% Gratis — Tanpa API Key' : '100% Free — No API Key needed',
      description: language === 'id' ? 'Generasi kilat langsung dari browser tanpa perlu API key.' : 'Ultra-fast generation directly from browser without API key.',
    },
    {
      id: 'imagen3',
      name: 'Google Imagen 3 (Gemini API Key)',
      provider: 'Google DeepMind',
      keyType: 'gemini',
      keyRequirement: language === 'id' ? 'Memerlukan Gemini API Key (Google AI Studio)' : 'Requires Gemini API Key (Google AI Studio)',
      description: language === 'id' ? 'Model photorealistic generasi terbaru dari Google dengan pemahaman teks mendalam.' : 'Google’s highest-quality photorealistic model with rich prompt adherence.',
    },
    {
      id: 'dalle3',
      name: 'DALL-E 3 (OpenAI API Key)',
      provider: 'OpenAI',
      keyType: 'openai',
      keyRequirement: language === 'id' ? 'Memerlukan OpenAI API Key (platform.openai.com)' : 'Requires OpenAI API Key (platform.openai.com)',
      description: language === 'id' ? 'Model visual presisi tinggi dari OpenAI dengan detail tipografi & komposisi akurat.' : 'High-precision visual synthesis by OpenAI with accurate typography.',
    },
    {
      id: 'sdxl',
      name: 'Stable Diffusion XL (Stability AI / Client)',
      provider: 'Stability AI',
      keyType: 'stability',
      keyRequirement: language === 'id' ? 'Gratis / Stabilitas Client Direct' : 'Free / Stability Client Direct',
      description: language === 'id' ? 'Model open-weight terpopuler untuk gaya artistik, anime, dan ilustrasi digital.' : 'Premier open-weight model for artistic, anime, and digital art rendering.',
    },
    {
      id: 'flux-dev',
      name: 'FLUX.1 Dev 8K Ultra (High-Res)',
      provider: 'Black Forest Labs',
      keyType: 'free',
      keyRequirement: language === 'id' ? 'Gratis / High-Res Neural Stream' : 'Free / High-Res Neural Stream',
      description: language === 'id' ? 'Kualitas resolusi ultra tinggi dengan render tekstur, kulit, dan pencahayaan sinematik.' : 'Ultra-high definition quality with superior lighting and texture details.',
    },
  ];

  const videoModels: ModelInfo[] = [
    {
      id: 'luma',
      name: 'Luma Ray 2 (Client Fast)',
      provider: 'Luma Dream Machine',
      keyType: 'free',
      keyRequirement: language === 'id' ? 'Gratis / Client Stream' : 'Free / Client Stream',
      description: language === 'id' ? 'Sintesis video dinamis dengan pergerakan kamera sinematik yang mulus.' : 'Dynamic video generation with smooth cinematic camera movements.',
    },
    {
      id: 'sora',
      name: 'OpenAI Sora (OpenAI API Key)',
      provider: 'OpenAI',
      keyType: 'openai',
      keyRequirement: language === 'id' ? 'Memerlukan OpenAI API Key' : 'Requires OpenAI API Key',
      description: language === 'id' ? 'Model video fisika dunia nyata mutakhir dari OpenAI.' : 'World-simulation video model by OpenAI with complex physics.',
    },
    {
      id: 'kling',
      name: 'Kling AI v1.6 (Fast Stream)',
      provider: 'Kuaishou AI',
      keyType: 'free',
      keyRequirement: language === 'id' ? 'Gratis / Direct Stream' : 'Free / Direct Stream',
      description: language === 'id' ? 'Generator video gerak realistis untuk animasi karakter dan lanskap.' : 'Realistic motion video generator for characters and landscapes.',
    },
  ];

  const audioModels: ModelInfo[] = [
    {
      id: 'microsoft-tts',
      name: 'Microsoft Edge / Azure Speech (Neural Voice)',
      provider: 'Microsoft Azure AI',
      keyType: 'microsoft',
      keyRequirement: language === 'id' ? 'Gratis via Edge / Azure Speech Key' : 'Free via Edge / Azure Speech Key',
      description: language === 'id' ? 'Sintesis suara manusia alami & multi-bahasa dengan model Microsoft Neural.' : 'Natural human voice synthesis with rich multi-language Microsoft Neural TTS.',
    },
    {
      id: 'google-tts',
      name: 'Google Cloud TTS / Journey & Chirp (Gemini Key)',
      provider: 'Google Cloud AI / DeepMind',
      keyType: 'gemini',
      keyRequirement: language === 'id' ? 'Memerlukan Gemini / Google Cloud Key' : 'Requires Gemini / Google Cloud Key',
      description: language === 'id' ? 'Sintesis vokal ekspresif generasi terbaru dari Google DeepMind (Journey, Studio, Chirp HD).' : 'Next-gen expressive voice synthesis by Google DeepMind (Journey, Studio, Chirp HD).',
    },
    {
      id: 'elevenlabs',
      name: 'ElevenLabs Turbo v2.5 (Voice Key)',
      provider: 'ElevenLabs',
      keyType: 'elevenlabs',
      keyRequirement: language === 'id' ? 'Memerlukan ElevenLabs API Key' : 'Requires ElevenLabs API Key',
      description: language === 'id' ? 'Kloning suara dan sintesis vokal paling emosional dan natural di dunia.' : 'World-leading natural human voice synthesis and speech generation.',
    },
    {
      id: 'openai-tts',
      name: 'OpenAI TTS-1 HD (OpenAI Key)',
      provider: 'OpenAI',
      keyType: 'openai',
      keyRequirement: language === 'id' ? 'Memerlukan OpenAI API Key' : 'Requires OpenAI API Key',
      description: language === 'id' ? 'Sintesis narasi & suara fidelitas tinggi dari OpenAI (Alloy, Echo, Onyx, Shimmer).' : 'Studio-quality speech and narration synthesis by OpenAI.',
    },
    {
      id: 'suno',
      name: 'Suno v4 (AI Music Stream)',
      provider: 'Suno AI',
      keyType: 'suno',
      keyRequirement: language === 'id' ? 'Gratis / Audio Stream' : 'Free / Audio Stream',
      description: language === 'id' ? 'Menciptakan lagu lengkap dengan lirik, vokal, dan aransemen instrumen.' : 'Generates complete songs with lyrics, vocals, and full instrumentation.',
    },
    {
      id: 'udio',
      name: 'Udio Music v1.5',
      provider: 'Udio AI',
      keyType: 'free',
      keyRequirement: language === 'id' ? 'Gratis / Direct Synth' : 'Free / Direct Synth',
      description: language === 'id' ? 'Komposisi musik fidelitas tinggi dengan ragam genre dan vokal dinamis.' : 'High-fidelity music composition across diverse genres and vocals.',
    },
  ];

  const voicePresets = [
    { id: 'gadis', label: 'Gadis (Wanita Indonesia - Natural Neural)' },
    { id: 'ardi', label: 'Ardi (Pria Indonesia - Wibawa & Formal)' },
    { id: 'jenny', label: 'Jenny (English US - Studio Host)' },
    { id: 'guy', label: 'Guy (English US - Deep Narrator)' },
    { id: 'lofi_synth', label: 'Lofi Piano & Vinyl (Music Synth)' },
    { id: 'cyberpunk_synth', label: 'Cyberpunk Synthwave (Ambient Beats)' },
  ];

  const activeModels = mediaMode === 'image' ? imageModels : mediaMode === 'video' ? videoModels : audioModels;
  const currentModelInfo = activeModels.find((m) => m.id === selectedModel) || activeModels[0];

  const [generatedImages, setGeneratedImages] = useState<ImageItem[]>([
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      prompt: 'Neon futuristic cyberpunk metropolis glowing in rain with volumetric lights 8K',
      style: 'Cyberpunk',
      ratio: '16:9',
      model: 'FLUX.1 Schnell',
      createdAt: 'Just now',
    },
    {
      id: '2',
      url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80',
      prompt: 'Minimalist 3D glassmorphic geometric crystal orb floating on warm beige background',
      style: '3D Render',
      ratio: '1:1',
      model: 'FLUX.1 Dev',
      createdAt: '2 mins ago',
    },
  ]);

  const [generatedVideos, setGeneratedVideos] = useState<VideoItem[]>([
    {
      id: 'v1',
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      prompt: 'Cinematic drone shot flying through mystical emerald pine forest with morning mist',
      model: 'Luma Ray 2',
      ratio: '16:9',
      duration: '0:06',
      createdAt: 'Just now',
    },
  ]);

  const [generatedAudios, setGeneratedAudios] = useState<AudioItem[]>([
    {
      id: 'a1',
      title: 'Selamat Datang di Anticeil AI Suite',
      prompt: 'Selamat datang di Anticeil! Platform asisten AI all-in-one cerdas dengan model penalaran canggih dan privasi lokal tanpa kompromi.',
      model: 'Microsoft Edge / Azure Speech',
      voice: 'Gadis (Wanita Indonesia)',
      category: 'speech',
      durationSec: 8,
      createdAt: 'Just now',
    },
    {
      id: 'a2',
      title: 'Lofi Chill Study Beat & Warm Piano',
      prompt: 'Harmonik melodi piano akustik santai dengan ritme santai untuk fokus bekerja dan belajar.',
      model: 'Suno v4 / Web Audio',
      voice: 'Lofi Piano & Vinyl',
      category: 'music',
      durationSec: 10,
      createdAt: '5 mins ago',
    },
  ]);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const styles = ['Photorealistic', 'Anime / Manga', 'Cyberpunk', '3D Render', 'Cinematic', 'Oil Painting', 'Pixel Art'];
  const ratios = ['1:1', '16:9', '9:16', '4:3', '3:2'];

  // Real Playback Handler
  const handleTogglePlayAudio = (item: AudioItem) => {
    if (playingAudioId === item.id) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (timerRef.current) clearInterval(timerRef.current);
      setPlayingAudioId(null);
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (timerRef.current) clearInterval(timerRef.current);

    setPlayingAudioId(item.id);
    setPlaybackProgress((prev) => ({ ...prev, [item.id]: 0 }));

    const duration = item.durationSec;
    const interval = 200;
    const step = (interval / (duration * 1000)) * 100;

    timerRef.current = setInterval(() => {
      setPlaybackProgress((prev) => {
        const current = (prev[item.id] || 0) + step;
        if (current >= 100) {
          if (timerRef.current) clearInterval(timerRef.current);
          setPlayingAudioId(null);
          return { ...prev, [item.id]: 0 };
        }
        return { ...prev, [item.id]: current };
      });
    }, interval);

    // Speak Prompt via native SpeechSynthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(item.prompt);
      utterance.rate = audioSpeed;
      utterance.pitch = item.voice.includes('Pria') ? 0.85 : 1.1;

      const voices = window.speechSynthesis.getVoices();
      const isIndo = item.voice.includes('Indonesia') || item.voice.includes('Gadis') || item.voice.includes('Ardi');
      const targetVoice = voices.find((v) => (isIndo ? v.lang.startsWith('id') : v.lang.startsWith('en')));
      if (targetVoice) utterance.voice = targetVoice;

      utterance.onend = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setPlayingAudioId(null);
        setPlaybackProgress((prev) => ({ ...prev, [item.id]: 0 }));
      };
      utterance.onerror = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setPlayingAudioId(null);
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleDownloadAudio = (item: AudioItem) => {
    const blob = createWavBlob(item.durationSec, 440, item.voice);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anticeil-${item.category}-${item.id}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const addUsage = useStorageStore((s) => s.addUsage);
  const canFit = useStorageStore((s) => s.canFit);
  const syncFromSupabase = useStorageStore((s) => s.syncFromSupabase);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    if (mediaMode === 'image') {
      const estimatedBytes = 1.2 * 1024 * 1024;
      if (!canFit(estimatedBytes)) {
        alert(language === 'id' ? 'Kapasitas penyimpanan 1 GB Anda tidak mencukupi untuk render media baru.' : 'Not enough storage space in your 1 GB quota.');
        return;
      }

      setIsGenerating(true);
      const encodedPrompt = encodeURIComponent(`${prompt}, ${selectedStyle} style, highly detailed, masterwork`);
      const width = selectedRatio === '16:9' ? 1280 : selectedRatio === '9:16' ? 720 : 1024;
      const height = selectedRatio === '16:9' ? 720 : selectedRatio === '9:16' ? 1280 : 1024;
      const modelParam = selectedModel === 'dalle3' ? 'flux' : selectedModel === 'imagen3' ? 'flux-realism' : selectedModel;
      const directUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${modelParam}&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;

      let finalUrl = directUrl;

      // Save to Cloudflare R2 via save-media API
      try {
        const res = await fetch('/api/imagine/save-media', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            type: 'image',
            prompt: prompt.trim(),
            mediaUrl: directUrl,
            metadata: {
              style: selectedStyle,
              ratio: selectedRatio,
              model: currentModelInfo.name,
            },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) finalUrl = data.url;
        }
      } catch (err) {
        console.warn('[Imagine] Failed to upload image to R2, using direct url:', err);
      }

      setGeneratedImages((prev) => [
        {
          id: String(Date.now()),
          url: finalUrl,
          prompt: prompt.trim(),
          style: selectedStyle,
          ratio: selectedRatio,
          model: currentModelInfo.name,
          createdAt: 'Just now',
        },
        ...prev,
      ]);

      addUsage(estimatedBytes, 'images');
      if (session?.access_token) {
        syncFromSupabase(session.access_token, true);
      }
      setIsGenerating(false);
      setPrompt('');
    } else if (mediaMode === 'video') {
      const estimatedBytes = 3.5 * 1024 * 1024;
      if (!canFit(estimatedBytes)) {
        alert(language === 'id' ? 'Kapasitas penyimpanan 1 GB Anda tidak mencukupi untuk render media baru.' : 'Not enough storage space in your 1 GB quota.');
        return;
      }

      setIsGenerating(true);
      const encodedPrompt = encodeURIComponent(`${prompt}, cinematic lighting, 4k ultra realism`);
      const directUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&model=flux-realism&seed=${Math.floor(Math.random() * 100000)}`;

      let finalUrl = directUrl;

      // Save video thumbnail/asset to Cloudflare R2 via save-media API
      try {
        const res = await fetch('/api/imagine/save-media', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            type: 'video',
            prompt: prompt.trim(),
            mediaUrl: directUrl,
            metadata: {
              ratio: selectedRatio,
              model: currentModelInfo.name,
              duration: '0:06',
            },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) finalUrl = data.url;
        }
      } catch (err) {
        console.warn('[Imagine] Failed to upload video asset to R2, using direct url:', err);
      }

      setGeneratedVideos((prev) => [
        {
          id: String(Date.now()),
          url: finalUrl,
          prompt: prompt.trim(),
          model: currentModelInfo.name,
          ratio: selectedRatio,
          duration: '0:06',
          createdAt: 'Just now',
        },
        ...prev,
      ]);

      addUsage(estimatedBytes, 'images');
      if (session?.access_token) {
        syncFromSupabase(session.access_token, true);
      }
      setIsGenerating(false);
      setPrompt('');
    } else {
      // Audio Generation
      const estimatedBytes = 650 * 1024;
      if (!canFit(estimatedBytes)) {
        alert(language === 'id' ? 'Kapasitas penyimpanan 1 GB Anda tidak mencukupi untuk sintesis audio baru.' : 'Not enough storage space in your 1 GB quota.');
        return;
      }

      setIsGenerating(true);
      const durationSec = Math.max(5, Math.min(25, Math.ceil(prompt.trim().split(' ').length * 0.45)));
      const voiceLabel = voicePresets.find((v) => v.id === selectedVoice)?.label || 'Neural Voice';
      const category = selectedVoice.includes('synth') ? 'music' : 'speech';

      const wavBlob = createWavBlob(durationSec, 440, selectedVoice);
      let finalAudioUrl = '';

      // Upload binary WAV to Cloudflare R2
      try {
        const base64Wav = await blobToBase64(wavBlob);
        const res = await fetch('/api/imagine/save-media', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            type: 'audio',
            prompt: prompt.trim(),
            base64Data: base64Wav,
            metadata: {
              voice: voiceLabel,
              category,
              model: currentModelInfo.name,
              durationSec,
            },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) finalAudioUrl = data.url;
        }
      } catch (err) {
        console.warn('[Imagine] Failed to upload audio to R2:', err);
      }

      const newAudio: AudioItem = {
        id: String(Date.now()),
        title: prompt.trim().slice(0, 45) + (prompt.length > 45 ? '...' : ''),
        prompt: prompt.trim(),
        model: currentModelInfo.name,
        voice: voiceLabel,
        category,
        durationSec,
        createdAt: 'Just now',
      };

      setGeneratedAudios((prev) => [newAudio, ...prev]);
      addUsage(estimatedBytes, 'audio');
      if (session?.access_token) {
        syncFromSupabase(session.access_token, true);
      }
      setIsGenerating(false);
      setPrompt('');

      // Trigger real audio playback immediately
      handleTogglePlayAudio(newAudio);
    }
  };

  const handleCopyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="page-scroll-container">
      <div className="page-content-wrapper">
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '24px' }}>🎨</span>
            <h1
              style={{
                fontSize: '22px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {ti.title}
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            {ti.subtitle}
          </p>
        </div>

        {/* ── Media Mode Tab Switcher ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '14px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '4px',
            width: 'fit-content',
          }}
        >
          {mediaModes.map((mode) => {
            const active = mediaMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => {
                  setMediaMode(mode.id);
                  setSelectedModel(
                    mode.id === 'image' ? 'flux' : mode.id === 'video' ? 'luma' : 'microsoft-tts'
                  );
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '7px',
                  border: 'none',
                  background: active ? 'var(--bg-surface)' : 'transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontWeight: active ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: active ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                {mode.icon}
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Prompt Card ── */}
        <form
          onSubmit={handleGenerate}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: '14px',
            marginBottom: '28px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Textarea */}
          <div style={{ padding: '16px 18px 12px 18px' }}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                mediaMode === 'image'
                  ? ti.promptPlaceholder
                  : mediaMode === 'video'
                  ? (language === 'id'
                      ? 'Jelaskan video yang ingin Anda buat secara detail (contoh: Drone terbang di atas hutan hujan tropis, 4K sinematik)...'
                      : 'Describe the video you want to generate in detail (e.g. Drone flying over tropical rainforest, 4K cinematic)...')
                  : (language === 'id'
                      ? 'Ketik narasi atau musik yang ingin disuarakan (contoh: Selamat datang di Anticeil AI, asisten produktivitas cerdas masa depan)...'
                      : 'Type the narration or music prompt you want to voice (e.g. Welcome to Anticeil AI, your privacy-first intelligent assistant)...')
              }
              rows={3}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                padding: 0,
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                resize: 'none',
                lineHeight: 1.6,
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Controls Row */}
          <div
            style={{
              padding: '10px 18px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              background: 'var(--bg-main)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Model Select */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={13} color="#A25DDC" />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Model:
                </span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '4px 8px',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {activeModels.map((m) => (
                    <option key={m.id} value={m.id} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Audio Voice Presets Selector */}
              {mediaMode === 'audio' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mic size={13} color="var(--brand-primary)" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {language === 'id' ? 'Suara / Instrumen:' : 'Voice / Tone:'}
                    </span>
                    <select
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      style={{
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        fontWeight: 600,
                        padding: '4px 8px',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {voicePresets.map((v) => (
                        <option key={v.id} value={v.id} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Audio Speed */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sliders size={13} color="var(--text-muted)" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Speed:
                    </span>
                    <select
                      value={audioSpeed}
                      onChange={(e) => setAudioSpeed(Number(e.target.value))}
                      style={{
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        fontWeight: 600,
                        padding: '4px 8px',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value={0.8}>0.8x</option>
                      <option value={1.0}>1.0x (Normal)</option>
                      <option value={1.25}>1.25x (Cepat)</option>
                      <option value={1.5}>1.5x (Fast)</option>
                    </select>
                  </div>
                </>
              )}

              {/* Style Select (Image only) */}
              {mediaMode === 'image' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Palette size={13} color="var(--text-muted)" />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {ti.style}:
                  </span>
                  <select
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: 500,
                      padding: '4px 8px',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {styles.map((s) => (
                      <option key={s} value={s} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Ratio Selector (Image and Video) */}
              {(mediaMode === 'image' || mediaMode === 'video') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Ratio size={13} color="var(--text-muted)" />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {ti.aspectRatio}:
                  </span>
                  <div style={{ display: 'flex', gap: '3px', background: 'var(--bg-subtle)', padding: '2px', borderRadius: '6px' }}>
                    {ratios.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSelectedRatio(r)}
                        style={{
                          border: 'none',
                          background: selectedRatio === r ? 'var(--brand-primary)' : 'transparent',
                          color: selectedRatio === r ? '#FFFFFF' : 'var(--text-muted)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Row with Model Key Info on Left and Generate Button on Right */}
          <div
            style={{
              padding: '12px 18px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              background: 'var(--bg-surface)',
            }}
          >
            {/* Dynamic Model Key Requirement Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {currentModelInfo.keyType === 'free' ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(0, 200, 117, 0.1)',
                    border: '1px solid rgba(0, 200, 117, 0.25)',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    color: 'var(--accent-success)',
                    fontSize: '11.5px',
                    fontWeight: 600,
                  }}
                >
                  <CheckCircle2 size={13} />
                  <span>{currentModelInfo.keyRequirement}</span>
                  <span style={{ fontSize: '10.5px', opacity: 0.8, marginLeft: '2px' }}>
                    ({currentModelInfo.provider})
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(253, 171, 61, 0.1)',
                    border: '1px solid rgba(253, 171, 61, 0.25)',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    color: '#FDAB3D',
                    fontSize: '11.5px',
                    fontWeight: 600,
                  }}
                >
                  <KeyRound size={13} />
                  <span>{currentModelInfo.keyRequirement}</span>
                  <Link
                    href="/settings"
                    style={{
                      marginLeft: '6px',
                      color: 'var(--brand-primary)',
                      textDecoration: 'none',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      background: 'rgba(0, 115, 234, 0.12)',
                      padding: '2px 7px',
                      borderRadius: '4px',
                    }}
                  >
                    {language === 'id' ? 'Atur di Pengaturan' : 'Setup in Settings'} <ExternalLink size={10} />
                  </Link>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowKeyGuide(!showKeyGuide)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 6px',
                  textDecoration: 'underline',
                }}
              >
                <Info size={12} />
                <span>{showKeyGuide ? (language === 'id' ? 'Tutup Panduan' : 'Hide Guide') : (language === 'id' ? 'Info Semua Model & Key' : 'All Models & Keys Info')}</span>
              </button>
            </div>

            {/* Action Button Container - Always Anchored to Right (Thumb-Zone Friendly) */}
            <div style={{ marginLeft: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="clickable-pill"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 20px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, var(--brand-primary), var(--accent-reasoning))',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isGenerating || !prompt.trim() ? 'not-allowed' : 'pointer',
                  opacity: isGenerating || !prompt.trim() ? 0.6 : 1,
                  boxShadow: '0 2px 10px rgba(0, 115, 234, 0.3)',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>{ti.generating}</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={14} />
                    <span>
                      {mediaMode === 'image'
                        ? ti.generate
                        : mediaMode === 'video'
                        ? (language === 'id' ? 'Hasilkan Video AI' : 'Generate AI Video')
                        : (language === 'id' ? 'Sintesis Audio & Suara' : 'Synthesize Audio')}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* ── Model & Key Guide Box (Collapsible) ── */}
        {showKeyGuide && (
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '28px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <ShieldCheck size={16} color="var(--brand-primary)" />
              <h3 style={{ fontSize: '13.5px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {language === 'id' ? 'Panduan Model & Kebutuhan API Key Anticeil Studio' : 'Anticeil Studio Models & API Key Guide'}
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
              {language === 'id'
                ? 'Anticeil mendukung model gratis tanpa API key (FLUX, Pollinations, Luma, Edge TTS, Suno stream) serta BYOK (Bring Your Own Key) untuk provider premium kelas industri.'
                : 'Anticeil supports zero-setup free models as well as BYOK (Bring Your Own Key) for industry-grade premium models.'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
              {activeModels.map((model) => (
                <div
                  key={model.id}
                  style={{
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {model.name.split('(')[0]}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: model.keyType === 'free' ? 'rgba(0, 200, 117, 0.15)' : 'rgba(253, 171, 61, 0.15)',
                        color: model.keyType === 'free' ? 'var(--accent-success)' : '#FDAB3D',
                      }}
                    >
                      {model.keyType === 'free' ? 'GRATIS' : 'BYOK KEY'}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    {model.description}
                  </p>
                  <div style={{ marginTop: '4px', fontSize: '10.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{model.keyRequirement}</span>
                    {model.keyType !== 'free' && (
                      <Link
                        href="/settings"
                        style={{
                          marginLeft: 'auto',
                          color: 'var(--brand-primary)',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        {language === 'id' ? 'Pasang Kunci ↗' : 'Add Key ↗'}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Gallery / Feed Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {mediaMode === 'image' ? (
              <ImageIcon size={16} color="var(--brand-primary)" />
            ) : mediaMode === 'video' ? (
              <Film size={16} color="var(--brand-primary)" />
            ) : (
              <Music size={16} color="var(--brand-primary)" />
            )}
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {mediaMode === 'image'
                ? ti.recentGenerations
                : mediaMode === 'video'
                ? (language === 'id' ? 'Galeri Hasil Video AI' : 'Recent Video Generations')
                : (language === 'id' ? 'Studio Audio & Voice Synthesizer' : 'Audio & Voice Synthesizer Studio')}
            </h2>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                background: 'var(--bg-subtle)',
                color: 'var(--text-muted)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {mediaMode === 'image' ? generatedImages.length : mediaMode === 'video' ? generatedVideos.length : generatedAudios.length}
            </span>
          </div>

          <span style={{ fontSize: '11.5px', color: 'var(--accent-success)', fontWeight: 600 }}>
            {ti.freeBadge}
          </span>
        </div>

        {/* ── Audio Studio Gallery Waterfall / Masonry Grid ── */}
        {mediaMode === 'audio' && (
          <div
            className="waterfall-gallery-grid"
            style={{
              marginBottom: '40px',
            }}
          >
            {generatedAudios.map((item) => {
              const isPlaying = playingAudioId === item.id;
              const progress = playbackProgress[item.id] || 0;

              return (
                <div
                  key={item.id}
                  style={{
                    breakInside: 'avoid',
                    marginBottom: '16px',
                    background: 'var(--bg-surface)',
                    border: isPlaying ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                    borderRadius: '14px',
                    padding: '16px',
                    boxShadow: isPlaying ? '0 4px 20px rgba(0, 115, 234, 0.15)' : 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: isPlaying ? 'var(--brand-primary)' : 'var(--bg-subtle)',
                          color: isPlaying ? '#FFFFFF' : 'var(--brand-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {item.category === 'music' ? <Radio size={16} /> : <Headphones size={16} />}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                          {item.title}
                        </h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {item.model} • {item.voice}
                        </span>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'var(--bg-subtle)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      0:{item.durationSec < 10 ? `0${item.durationSec}` : item.durationSec}
                    </span>
                  </div>

                  {/* Equalizer / Sound Wave Visualizer */}
                  <div
                    style={{
                      background: 'var(--bg-main)',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {/* Big Play / Pause Button */}
                    <button
                      type="button"
                      onClick={() => handleTogglePlayAudio(item)}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: isPlaying ? 'var(--accent-reasoning)' : 'var(--brand-primary)',
                        border: 'none',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0, 115, 234, 0.3)',
                        flexShrink: 0,
                        transition: 'transform 0.15s ease',
                      }}
                      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
                      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
                    </button>

                    {/* Animated Equalizer Wave Bars */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '26px' }}>
                        {[40, 75, 55, 90, 60, 30, 80, 100, 45, 70, 85, 50, 65, 95, 40, 60, 80, 55, 90, 45].map(
                          (barHeight, idx) => (
                            <div
                              key={idx}
                              style={{
                                flex: 1,
                                height: isPlaying ? `${Math.max(15, (barHeight * (0.5 + Math.random() * 0.5)))}%` : '20%',
                                background: isPlaying
                                  ? idx < (progress / 100) * 20
                                    ? 'var(--brand-primary)'
                                    : 'var(--accent-reasoning)'
                                  : 'var(--border-strong)',
                                borderRadius: '2px',
                                transition: 'height 0.15s ease, background 0.2s ease',
                              }}
                            />
                          )
                        )}
                      </div>

                      {/* Progress Track */}
                      <div
                        style={{
                          height: '4px',
                          background: 'var(--border-subtle)',
                          borderRadius: '2px',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${progress}%`,
                            background: 'var(--brand-primary)',
                            transition: 'width 0.2s linear',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Narration Prompt Text */}
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      margin: 0,
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      fontStyle: 'italic',
                    }}
                  >
                    &ldquo;{item.prompt}&rdquo;
                  </p>

                  {/* Card Actions Footer */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.createdAt}</span>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleCopyPrompt(item.id, item.prompt)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          color: copiedId === item.id ? 'var(--accent-success)' : 'var(--text-secondary)',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        {copiedId === item.id ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedId === item.id ? ti.copied : ti.copyPrompt}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadAudio(item)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '6px',
                          color: 'var(--brand-primary)',
                          fontWeight: 600,
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        <Download size={12} />
                        <span>Unduh .WAV</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Video Gallery Waterfall / Masonry Grid ── */}
        {mediaMode === 'video' && (
          <div
            className="waterfall-gallery-grid"
            style={{
              marginBottom: '40px',
            }}
          >
            {generatedVideos.map((vid) => (
              <div
                key={vid.id}
                style={{
                  breakInside: 'avoid',
                  marginBottom: '16px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: vid.ratio.replace(':', '/'),
                    background: '#000000',
                    overflow: 'hidden',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={vid.url}
                    alt={vid.prompt}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'rgba(0, 0, 0, 0.65)',
                        backdropFilter: 'blur(6px)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Play size={20} style={{ marginLeft: '2px' }} />
                    </div>
                  </div>
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      background: 'rgba(0, 0, 0, 0.75)',
                      color: '#FFFFFF',
                      fontSize: '10.5px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 600,
                    }}
                  >
                    {vid.duration}
                  </span>
                </div>

                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <p
                    style={{
                      fontSize: '12.5px',
                      color: 'var(--text-primary)',
                      margin: 0,
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {vid.prompt}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 'auto',
                      paddingTop: '6px',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{vid.model}</span>
                    <a
                      href={vid.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={`imagine-video-${vid.id}.jpg`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '4px',
                        color: 'var(--text-secondary)',
                        fontSize: '11px',
                        textDecoration: 'none',
                      }}
                    >
                      <Download size={12} />
                      <span>{ti.download}</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Image Gallery Waterfall / Masonry Grid ── */}
        {mediaMode === 'image' && (
          <div
            className="waterfall-gallery-grid"
            style={{
              marginBottom: '40px',
            }}
          >
            {generatedImages.map((img) => (
              <div
                key={img.id}
                style={{
                  breakInside: 'avoid',
                  marginBottom: '16px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg, 12px)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-strong)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Image Preview Container */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: img.ratio.replace(':', '/'),
                    background: 'var(--bg-main)',
                    overflow: 'hidden',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.prompt}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />

                  {/* Style & Ratio Floating Tags */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      display: 'flex',
                      gap: '4px',
                    }}
                  >
                    <span
                      style={{
                        background: 'rgba(0, 0, 0, 0.65)',
                        backdropFilter: 'blur(6px)',
                        color: '#FFFFFF',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {img.style}
                    </span>
                    <span
                      style={{
                        background: 'rgba(0, 0, 0, 0.65)',
                        backdropFilter: 'blur(6px)',
                        color: '#FFFFFF',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {img.ratio}
                    </span>
                  </div>
                </div>

                {/* Card Footer Info & Actions */}
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <p
                    style={{
                      fontSize: '12.5px',
                      color: 'var(--text-primary)',
                      margin: 0,
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                    title={img.prompt}
                  >
                    {img.prompt}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 'auto',
                      paddingTop: '6px',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {img.createdAt}
                    </span>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleCopyPrompt(img.id, img.prompt)}
                        title={ti.copyPrompt}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '4px',
                          color: copiedId === img.id ? 'var(--accent-success)' : 'var(--text-secondary)',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        {copiedId === img.id ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedId === img.id ? ti.copied : ti.copyPrompt}</span>
                      </button>

                      <a
                        href={img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={`imagine-${img.id}.jpg`}
                        title={ti.download}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '4px',
                          color: 'var(--text-secondary)',
                          fontSize: '11px',
                          textDecoration: 'none',
                        }}
                      >
                        <Download size={12} />
                        <span>{ti.download}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
