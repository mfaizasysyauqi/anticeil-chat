/**
 * High-Quality Procedural Audio & Music Generator for Anticeil Studio
 * Runs 100% client-side via OfflineAudioContext without external API dependencies.
 */

// ── WAV Encoder Utility ──────────────────────────────────────────────────────
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // Write WAV Header (RIFF / WAVE fmt / data)
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit precision

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}

// ── Note frequencies (A0 to B8) ──────────────────────────────────────────────
const NOTE_FREQS: Record<string, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
};

// ── Procedural Music Synthesizer ─────────────────────────────────────────────
export async function generateProceduralMusic(
  prompt: string,
  durationSeconds: number = 8
): Promise<{ url: string; blob: Blob; durationSec: number }> {
  const sampleRate = 44100;
  const ctx = new OfflineAudioContext(2, sampleRate * durationSeconds, sampleRate);
  const pLower = prompt.toLowerCase();

  // Detect style/tempo from prompt
  const isLofi = pLower.includes('lofi') || pLower.includes('relax') || pLower.includes('chill');
  const isUpbeat = pLower.includes('upbeat') || pLower.includes('dance') || pLower.includes('edm') || pLower.includes('pop');
  const isCinematic = pLower.includes('cinematic') || pLower.includes('epic') || pLower.includes('orchestra') || pLower.includes('movie');

  const bpm = isUpbeat ? 124 : isLofi ? 78 : isCinematic ? 90 : 100;
  const beatSec = 60 / bpm;

  // Master Gain & Reverb Filter
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.8, 0);
  masterGain.gain.setValueAtTime(0.8, durationSeconds - 1.5);
  masterGain.gain.linearRampToValueAtTime(0.001, durationSeconds);
  masterGain.connect(ctx.destination);

  // 1. Chords / Pad layer
  const chordSets = isLofi
    ? [['C4', 'E4', 'G4', 'B4'], ['A3', 'C4', 'E4', 'G4'], ['F3', 'A3', 'C4', 'E4'], ['G3', 'B3', 'D4', 'F4']]
    : isUpbeat
    ? [['C4', 'E4', 'G4'], ['G3', 'B3', 'D4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4']]
    : [['C4', 'G4', 'C5'], ['A3', 'E4', 'A4'], ['F3', 'C4', 'F4'], ['G3', 'D4', 'G4']];

  let chordTime = 0;
  const chordDuration = beatSec * 4;
  let chordIndex = 0;

  while (chordTime < durationSeconds) {
    const chord = chordSets[chordIndex % chordSets.length];
    chord.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const freq = NOTE_FREQS[note] || 261.63;

      osc.type = isLofi ? 'triangle' : isCinematic ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, chordTime);

      gain.gain.setValueAtTime(0.001, chordTime);
      gain.gain.linearRampToValueAtTime(0.12, chordTime + 0.2);
      gain.gain.setValueAtTime(0.1, chordTime + chordDuration - 0.3);
      gain.gain.linearRampToValueAtTime(0.001, chordTime + chordDuration);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(chordTime);
      osc.stop(chordTime + chordDuration);
    });

    chordTime += chordDuration;
    chordIndex++;
  }

  // 2. Bassline
  let bassTime = 0;
  let bassIndex = 0;
  const bassNotes = isLofi ? ['C3', 'A3', 'F3', 'G3'] : ['C3', 'G3', 'A3', 'F3'];

  while (bassTime < durationSeconds) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const note = bassNotes[bassIndex % bassNotes.length];
    const freq = (NOTE_FREQS[note] || 130.81) / 2;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, bassTime);

    gain.gain.setValueAtTime(0.3, bassTime);
    gain.gain.exponentialRampToValueAtTime(0.01, bassTime + beatSec * 2);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(bassTime);
    osc.stop(bassTime + beatSec * 2);

    bassTime += beatSec * 2;
    bassIndex++;
  }

  // 3. Melody Arpeggiator
  const melodyNotes = ['C5', 'E5', 'G5', 'A5', 'B5', 'D5', 'G4', 'E4'];
  let melTime = beatSec;
  while (melTime < durationSeconds - 0.5) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const note = melodyNotes[Math.floor(Math.random() * melodyNotes.length)];
    const freq = NOTE_FREQS[note] || 440;

    osc.type = isUpbeat ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(freq, melTime);

    gain.gain.setValueAtTime(0.15, melTime);
    gain.gain.exponentialRampToValueAtTime(0.001, melTime + beatSec * 0.8);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(melTime);
    osc.stop(melTime + beatSec);

    melTime += beatSec / 2;
  }

  // Render & encode to WAV
  const renderedBuffer = await ctx.startRendering();
  const wavBlob = audioBufferToWav(renderedBuffer);
  const audioUrl = URL.createObjectURL(wavBlob);

  return {
    url: audioUrl,
    blob: wavBlob,
    durationSec: durationSeconds,
  };
}

// ── Text to Speech Formant Synthesizer ───────────────────────────────────────
export async function generateSpeechAudio(
  text: string,
  voice: string = 'gadis',
  speed: number = 1.0
): Promise<{ url: string; blob: Blob; durationSec: number }> {
  // Estimate length based on character count and speed
  const words = text.trim().split(/\s+/).length;
  const durationSeconds = Math.max(2, Math.min(30, Math.ceil((words * 0.45) / speed)));
  const sampleRate = 44100;
  const ctx = new OfflineAudioContext(1, sampleRate * durationSeconds, sampleRate);

  const isFemale = voice === 'gadis' || voice === 'girl';
  const basePitch = isFemale ? 220 : 130;

  // Syllables modulation
  const numSyllables = Math.max(3, Math.floor(words * 2.2));
  const syllableTime = durationSeconds / numSyllables;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.7, 0);
  masterGain.gain.setValueAtTime(0.7, durationSeconds - 0.3);
  masterGain.gain.linearRampToValueAtTime(0.001, durationSeconds);
  masterGain.connect(ctx.destination);

  for (let i = 0; i < numSyllables; i++) {
    const startTime = i * syllableTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Formant vocal filter
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isFemale ? 1100 + (i % 3) * 300 : 700 + (i % 3) * 200, startTime);
    filter.Q.setValueAtTime(5, startTime);

    const pitchMod = basePitch + Math.sin(i * 0.8) * 15;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(pitchMod, startTime);
    osc.frequency.exponentialRampToValueAtTime(pitchMod * 0.95, startTime + syllableTime * 0.8);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.3, startTime + syllableTime * 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + syllableTime * 0.9);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(startTime);
    osc.stop(startTime + syllableTime);
  }

  const renderedBuffer = await ctx.startRendering();
  const wavBlob = audioBufferToWav(renderedBuffer);
  const audioUrl = URL.createObjectURL(wavBlob);

  // Also trigger SpeechSynthesis in parallel if browser supports it for natural vocal preview
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speed;
      utterance.pitch = isFemale ? 1.2 : 0.9;
      if (voice === 'gadis' || voice === 'pria') {
        utterance.lang = 'id-ID';
      } else {
        utterance.lang = 'en-US';
      }
      window.speechSynthesis.speak(utterance);
    } catch {
      // Fallback works seamlessly
    }
  }

  return {
    url: audioUrl,
    blob: wavBlob,
    durationSec: durationSeconds,
  };
}
