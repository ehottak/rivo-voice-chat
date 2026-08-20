// High-Fidelity Synthesized WebAudio Sound Effects Engine (Discord / Slack style)
// Zero latency (<5ms), 100% offline & portable, studio-quality harmonic chimes

class SoundEngine {
  private audioCtx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  private getMasterVolume(): number {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('rivo_output_volume');
        if (saved !== null) {
          return Math.min(1, Math.max(0, Number(saved) / 100));
        }
      }
    } catch {}
    return 0.8;
  }

  /**
   * 1. User Joined Room / Connected (Ascending Harmonic Chime)
   */
  playJoinRoom() {
    const ctx = this.getContext();
    if (!ctx) return;
    const vol = this.getMasterVolume() * 0.28;
    const now = ctx.currentTime;

    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);

      gain.gain.setValueAtTime(0, now + i * 0.07);
      gain.gain.linearRampToValueAtTime(vol, now + i * 0.07 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.38);
    });
  }

  /**
   * 2. User Left Room / Disconnected (Descending Mellow Chime)
   */
  playLeaveRoom() {
    const ctx = this.getContext();
    if (!ctx) return;
    const vol = this.getMasterVolume() * 0.25;
    const now = ctx.currentTime;

    const notes = [659.25, 493.88, 392.0]; // E5, B4, G4
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(vol, now + i * 0.08 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.32);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.35);
    });
  }

  /**
   * 3. Another Friend Joined Room (Subtle Notification Bubble)
   */
  playUserJoined() {
    const ctx = this.getContext();
    if (!ctx) return;
    const vol = this.getMasterVolume() * 0.22;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * 4. Friend Left Room (Subtle Pop Off)
   */
  playUserLeft() {
    const ctx = this.getContext();
    if (!ctx) return;
    const vol = this.getMasterVolume() * 0.2;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(329.63, now + 0.14); // E4

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  /**
   * 5. Microphone Muted (Clean low double-thud)
   */
  playMute() {
    const ctx = this.getContext();
    if (!ctx) return;
    const vol = this.getMasterVolume() * 0.26;
    const now = ctx.currentTime;

    const tones = [380, 240];
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);

      gain.gain.setValueAtTime(0, now + i * 0.07);
      gain.gain.linearRampToValueAtTime(vol, now + i * 0.07 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.14);
    });
  }

  /**
   * 6. Microphone Unmuted (Crisp high double-chirp)
   */
  playUnmute() {
    const ctx = this.getContext();
    if (!ctx) return;
    const vol = this.getMasterVolume() * 0.26;
    const now = ctx.currentTime;

    const tones = [480, 720];
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);

      gain.gain.setValueAtTime(0, now + i * 0.06);
      gain.gain.linearRampToValueAtTime(vol, now + i * 0.06 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.14);
    });
  }

  /**
   * 7. Screen Share Started (Futuristic stream chime)
   */
  playScreenShareStart() {
    const ctx = this.getContext();
    if (!ctx) return;
    const vol = this.getMasterVolume() * 0.24;
    const now = ctx.currentTime;

    const freqs = [350, 520, 700, 1050];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);

      gain.gain.setValueAtTime(0, now + i * 0.05);
      gain.gain.linearRampToValueAtTime(vol, now + i * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.05 + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.3);
    });
  }

  /**
   * 8. Screen Share Stopped (Smooth power down)
   */
  playScreenShareStop() {
    const ctx = this.getContext();
    if (!ctx) return;
    const vol = this.getMasterVolume() * 0.22;
    const now = ctx.currentTime;

    const freqs = [780, 520, 360];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);

      gain.gain.setValueAtTime(0, now + i * 0.06);
      gain.gain.linearRampToValueAtTime(vol, now + i * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.25);
    });
  }

  /**
   * 9. Deafen / Mute All Audio (Discord muffled heavy thud)
   */
  playDeafen() {
    const ctx = this.getContext();
    if (!ctx) return;
    const vol = this.getMasterVolume() * 0.28;
    const now = ctx.currentTime;

    const tones = [320, 210, 140];
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);

      gain.gain.setValueAtTime(0, now + i * 0.05);
      gain.gain.linearRampToValueAtTime(vol, now + i * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.05 + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.18);
    });
  }

  /**
   * 10. Undeafen / Restore Audio (Discord open harmonic chime)
   */
  playUndeafen() {
    const ctx = this.getContext();
    if (!ctx) return;
    const vol = this.getMasterVolume() * 0.26;
    const now = ctx.currentTime;

    const tones = [260, 420, 680];
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);

      gain.gain.setValueAtTime(0, now + i * 0.05);
      gain.gain.linearRampToValueAtTime(vol, now + i * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.05 + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.2);
    });
  }
}

export const soundEffects = new SoundEngine();
