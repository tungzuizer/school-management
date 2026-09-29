/**
 * Audio Engine using Web Audio API for synthetic SFX & Web Speech API for Vietnamese Voiceover
 * Generative Ambient Cinematic BGM for zero-dependency local playback
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmGain: GainNode | null = null;
  private bgmInterval: NodeJS.Timeout | null = null;
  private isBgmPlaying: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(muted ? 0 : 0.04, this.ctx.currentTime);
    }
  }

  // Futuristic UI Click SFX
  public playClick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Ignore
    }
  }

  // Timer Tick SFX
  public playTimerTick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.035);
    } catch {
      // Ignore
    }
  }

  // Digital Audit Lock Impact SFX
  public playLockImpact() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      // Heavy low-end impact + metallic ring
      const oscLow = this.ctx.createOscillator();
      const gainLow = this.ctx.createGain();
      oscLow.type = "sawtooth";
      oscLow.frequency.setValueAtTime(180, this.ctx.currentTime);
      oscLow.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.3);

      gainLow.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gainLow.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      oscLow.connect(gainLow);
      gainLow.connect(this.ctx.destination);
      oscLow.start();
      oscLow.stop(this.ctx.currentTime + 0.4);

      // High metallic chime ring
      const oscHigh = this.ctx.createOscillator();
      const gainHigh = this.ctx.createGain();
      oscHigh.type = "sine";
      oscHigh.frequency.setValueAtTime(1760, this.ctx.currentTime);
      oscHigh.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.5);

      gainHigh.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gainHigh.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.6);

      oscHigh.connect(gainHigh);
      gainHigh.connect(this.ctx.destination);
      oscHigh.start();
      oscHigh.stop(this.ctx.currentTime + 0.65);
    } catch {
      // Ignore
    }
  }

  // Futuristic swoosh transition
  public playTransition() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(400, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(3000, this.ctx.currentTime + 0.15);
      filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.4);

      osc.type = "sine";
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    } catch {
      // Ignore
    }
  }

  // Success Crystal Chime (for TKB 15s or Lock)
  public playSuccessChime() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 chord
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.05);

        gain.gain.setValueAtTime(0.001, this.ctx.currentTime + idx * 0.05);
        gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + idx * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + idx * 0.05 + 0.8);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + idx * 0.05);
        osc.stop(this.ctx.currentTime + idx * 0.05 + 0.85);
      });
    } catch {
      // Ignore
    }
  }

  // Telemetry Ping / Metric Beep
  public playTelemetryBeep(freq = 880) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {
      // Ignore
    }
  }

  // Podium Fanfare
  public playPodiumFanfare() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.08);

        gain.gain.setValueAtTime(0.06, this.ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.08 + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + i * 0.08);
        osc.stop(this.ctx.currentTime + i * 0.08 + 0.65);
      });
    } catch {
      // Ignore
    }
  }

  // Generative Ambient Cinematic Pad BGM
  public startBgm() {
    if (this.isBgmPlaying) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      this.isBgmPlaying = true;

      const chords = [
        [261.63, 329.63, 392.0, 523.25], // C Major
        [220.0, 261.63, 329.63, 440.0],  // A Minor
        [174.61, 220.0, 261.63, 349.23], // F Major
        [196.0, 246.94, 293.66, 392.0],  // G Major
      ];

      let chordIdx = 0;

      const playChord = () => {
        if (!this.isBgmPlaying || !this.ctx) return;
        const currentChord = chords[chordIdx % chords.length];
        chordIdx++;

        currentChord.forEach((freq) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const filter = this.ctx.createBiquadFilter();

          filter.type = "lowpass";
          filter.frequency.setValueAtTime(600, this.ctx.currentTime);
          filter.frequency.linearRampToValueAtTime(1200, this.ctx.currentTime + 1.5);
          filter.frequency.linearRampToValueAtTime(500, this.ctx.currentTime + 3.0);

          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

          const baseVolume = this.isMuted ? 0 : 0.015;
          gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
          gain.gain.linearRampToValueAtTime(baseVolume, this.ctx.currentTime + 0.8);
          gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 3.2);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start();
          osc.stop(this.ctx.currentTime + 3.3);
        });
      };

      playChord();
      this.bgmInterval = setInterval(playChord, 3000);
    } catch {
      // Ignore
    }
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const soundEffects = new SoundEngine();

/**
 * Text-to-Speech Voiceover Controller
 */
export class VoiceoverEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  public enabled: boolean = true;
  public rate: number = 1.05; // Slightly lively rate
  public volume: number = 1.0;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
      this.initVoice();
    }
  }

  private initVoice() {
    if (!this.synth) return;
    const findViVoice = () => {
      const voices = this.synth?.getVoices() || [];
      // Prefer Vietnamese voice if available
      const vi = voices.find(
        (v) =>
          v.lang.toLowerCase().includes("vi") ||
          v.lang.toLowerCase().includes("vn") ||
          v.name.toLowerCase().includes("vietnam")
      );
      this.voice = vi || voices[0] || null;
    };

    findViVoice();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = findViVoice;
    }
  }

  public speak(text: string, onEnd?: () => void) {
    if (!this.enabled || !this.synth) {
      if (onEnd) onEnd();
      return;
    }

    this.stop();

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      if (this.voice) {
        utterance.voice = this.voice;
      }
      utterance.lang = "vi-VN";
      utterance.rate = this.rate;
      utterance.volume = this.volume;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        this.currentUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = () => {
        this.currentUtterance = null;
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    } catch {
      if (onEnd) onEnd();
    }
  }

  public stop() {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public pause() {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  public resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }
}
