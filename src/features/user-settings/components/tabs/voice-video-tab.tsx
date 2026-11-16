import React, { useState } from 'react';
import { useTranslation } from '@/core/i18n';
import { useVoiceSettings } from '@/features/voice/hooks/use-voice-settings';
import { toast } from 'sonner';
import { playPreviewSound } from '../../utils/sound-preview';
import {
  VoiceAudioSection,
  VoiceCameraSection,
  VoiceStreamingSection,
  VoiceSoundsSection,
  VoiceSoundboardSection,
  VoiceDiagnosticsSection,
} from './voice-video';

export interface VoiceVideoTabProps {
  onNavigateSection?: (section: string) => void;
}

export function VoiceVideoTab({ onNavigateSection }: VoiceVideoTabProps) {
  const { t } = useTranslation();
  const {
    settings,
    updateSetting,
    resetSettings,
    audioInputDevices,
    audioOutputDevices,
    videoInputDevices,
    isMicTesting,
    micVolumeLevel,
    startMicTest,
    stopMicTest,
  } = useVoiceSettings();

  // Voice Call Sound switches
  const [soundDeafen, setSoundDeafen] = useState(true);
  const [soundUndeafen, setSoundUndeafen] = useState(true);
  const [soundMute, setSoundMute] = useState(true);
  const [soundUnmute, setSoundUnmute] = useState(true);
  const [showMoreSounds, setShowMoreSounds] = useState(false);
  const [moreSoundsState, setMoreSoundsState] = useState<Record<string, boolean>>({
    cameraOn: true,
    cameraOff: true,
    voiceConnected: true,
    voiceDisconnected: true,
    userJoin: true,
    userLeave: true,
    screenShareStart: true,
    screenShareStop: true,
    pttActivate: true,
    pttDeactivate: true,
    streamStart: true,
    streamStop: true,
    activityLaunch: true,
    activityEnd: true,
    muteMember: true,
    deafenMember: true,
    ringingOutgoing: true,
    soundboardQuack: true,
  });

  // Soundboard states
  const [soundboardVolume, setSoundboardVolume] = useState(100);
  const [entranceServer, setEntranceServer] = useState('all');
  const [entranceSound, setEntranceSound] = useState('none');
  const [isChoosingEntranceSound, setIsChoosingEntranceSound] = useState(false);

  // Diagnostic states
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [debugLogging, setDebugLogging] = useState(false);
  const [audioSubsystem, setAudioSubsystem] = useState('standard');
  const [webrtcQos, setWebrtcQos] = useState(true);
  const [diagnosticPacketCapture, setDiagnosticPacketCapture] = useState(false);

  const handleResetAll = () => {
    resetSettings();
    setSoundDeafen(true);
    setSoundUndeafen(true);
    setSoundMute(true);
    setSoundUnmute(true);
    setSoundboardVolume(100);
    setEntranceServer('all');
    setEntranceSound('none');
    toast.success(t('Semua pengaturan Voice & Video telah diatur ulang ke default'));
  };

  return (
    <div className="space-y-12">
      {/* 1: Voice / Audio Settings */}
      <VoiceAudioSection
        settings={settings}
        updateSetting={updateSetting}
        audioInputDevices={audioInputDevices}
        audioOutputDevices={audioOutputDevices}
        isMicTesting={isMicTesting}
        micVolumeLevel={micVolumeLevel}
        startMicTest={startMicTest}
        stopMicTest={stopMicTest}
      />

      {/* 2: Video / Camera Settings */}
      <VoiceCameraSection
        settings={settings}
        updateSetting={updateSetting}
        videoInputDevices={videoInputDevices}
      />

      {/* 3: Streaming Settings */}
      <VoiceStreamingSection />

      {/* 4: Sounds */}
      <VoiceSoundsSection
        t={t}
        soundDeafen={soundDeafen}
        setSoundDeafen={setSoundDeafen}
        soundUndeafen={soundUndeafen}
        setSoundUndeafen={setSoundUndeafen}
        soundMute={soundMute}
        setSoundMute={setSoundMute}
        soundUnmute={soundUnmute}
        setSoundUnmute={setSoundUnmute}
        playPreviewSound={playPreviewSound}
        showMoreSounds={showMoreSounds}
        setShowMoreSounds={setShowMoreSounds}
        moreSoundsState={moreSoundsState}
        setMoreSoundsState={setMoreSoundsState}
        onNavigateSection={onNavigateSection}
      />

      {/* 5: Soundboard */}
      <VoiceSoundboardSection
        t={t}
        soundboardVolume={soundboardVolume}
        setSoundboardVolume={setSoundboardVolume}
        entranceServer={entranceServer}
        setEntranceServer={setEntranceServer}
        entranceSound={entranceSound}
        setEntranceSound={setEntranceSound}
        isChoosingEntranceSound={isChoosingEntranceSound}
        setIsChoosingEntranceSound={setIsChoosingEntranceSound}
        playPreviewSound={playPreviewSound}
      />

      {/* 6: Advanced & Diagnostics */}
      <VoiceDiagnosticsSection
        t={t}
        showDiagnostics={showDiagnostics}
        setShowDiagnostics={setShowDiagnostics}
        debugLogging={debugLogging}
        setDebugLogging={setDebugLogging}
        audioSubsystem={audioSubsystem}
        setAudioSubsystem={setAudioSubsystem}
        webrtcQos={webrtcQos}
        setWebrtcQos={setWebrtcQos}
        diagnosticPacketCapture={diagnosticPacketCapture}
        setDiagnosticPacketCapture={setDiagnosticPacketCapture}
        onResetAll={handleResetAll}
      />
    </div>
  );
}
export default VoiceVideoTab;
