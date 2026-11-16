import { useState, useEffect, useCallback, useRef } from 'react';

export type InputProfile = 'voice-isolation' | 'studio' | 'custom';
export type NoiseSuppressionType = 'krisp' | 'standard' | 'none';

export interface VoiceSettingsState {
  inputDeviceId: string;
  outputDeviceId: string;
  inputVolume: number; // 0 to 100
  outputVolume: number; // 0 to 100
  inputProfile: InputProfile;
  autoSensitivity: boolean;
  sensitivityThreshold: number; // 0 to 100
  noiseSuppression: NoiseSuppressionType;
  echoCancellation: boolean;
  pushToTalk: boolean;
  pushToTalkKey: string;
  cameraDeviceId: string;
  alwaysPreviewVideo: boolean;
}

const STORAGE_KEY_VOICE_SETTINGS = 'anticeil_voice_settings_v1';

export const DEFAULT_VOICE_SETTINGS: VoiceSettingsState = {
  inputDeviceId: 'default',
  outputDeviceId: 'default',
  inputVolume: 100,
  outputVolume: 100,
  inputProfile: 'custom',
  autoSensitivity: true,
  sensitivityThreshold: 50,
  noiseSuppression: 'krisp',
  echoCancellation: true,
  pushToTalk: false,
  pushToTalkKey: 'Space',
  cameraDeviceId: 'default',
  alwaysPreviewVideo: false,
};

export function loadVoiceSettings(): VoiceSettingsState {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_VOICE_SETTINGS) : null;
    if (!raw) return DEFAULT_VOICE_SETTINGS;
    return { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_VOICE_SETTINGS;
  }
}

export function saveVoiceSettings(settings: VoiceSettingsState): void {
  try {
    localStorage.setItem(STORAGE_KEY_VOICE_SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('anticeil_voice_settings_changed', { detail: settings }));
  } catch (err) {
    console.error('Failed to save voice settings:', err);
  }
}

export function useVoiceSettings() {
  const [settings, setSettingsState] = useState<VoiceSettingsState>(loadVoiceSettings);
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoInputDevices, setVideoInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [micVolumeLevel, setMicVolumeLevel] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Enumerate hardware devices
  const refreshDevices = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      // Ensure mic permission so browser exposes real device labels
      try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); s.getTracks().forEach((t) => t.stop()); } catch {}
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices.filter((d) => d.kind === 'audioinput');
      const outputs = devices.filter((d) => d.kind === 'audiooutput');
      const videos = devices.filter((d) => d.kind === 'videoinput');

      setAudioInputDevices(inputs);
      setAudioOutputDevices(outputs);
      setVideoInputDevices(videos);
    } catch (e) {
      console.warn('Failed to enumerate media devices:', e);
    }
  }, []);

  useEffect(() => {
    refreshDevices();
    navigator.mediaDevices?.addEventListener?.('devicechange', refreshDevices);
    return () => {
      navigator.mediaDevices?.removeEventListener?.('devicechange', refreshDevices);
    };
  }, [refreshDevices]);

  // Update setting helper
  const updateSetting = useCallback(<K extends keyof VoiceSettingsState>(key: K, value: VoiceSettingsState[K]) => {
    setSettingsState((prev) => {
      const next = { ...prev, [key]: value };
      saveVoiceSettings(next);
      return next;
    });
  }, []);

  // Real Web Audio API Microphone Test
  const startMicTest = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: settings.inputDeviceId !== 'default' ? { exact: settings.inputDeviceId } : undefined,
          echoCancellation: settings.echoCancellation,
          noiseSuppression: settings.noiseSuppression !== 'none',
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      micStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      setIsMicTesting(true);

      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        // Normalize 0 to 100 based on inputVolume multiplier
        const volumeFactor = settings.inputVolume / 100;
        const normalized = Math.min(100, Math.round((avg / 128) * 100 * volumeFactor));
        setMicVolumeLevel(normalized);

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };
      checkVolume();
    } catch (err) {
      console.error('Error starting mic test:', err);
      setIsMicTesting(false);
    }
  }, [settings.inputDeviceId, settings.echoCancellation, settings.noiseSuppression, settings.inputVolume]);

  const stopMicTest = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsMicTesting(false);
    setMicVolumeLevel(0);
  }, []);

  useEffect(() => {
    return () => {
      stopMicTest();
    };
  }, [stopMicTest]);

  const resetSettings = useCallback(() => {
    stopMicTest();
    setSettingsState(DEFAULT_VOICE_SETTINGS);
    saveVoiceSettings(DEFAULT_VOICE_SETTINGS);
  }, [stopMicTest]);

  return {
    settings,
    updateSetting,
    resetSettings,
    audioInputDevices,
    audioOutputDevices,
    videoInputDevices,
    refreshDevices,
    isMicTesting,
    micVolumeLevel,
    startMicTest,
    stopMicTest,
  };
}
