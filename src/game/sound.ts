class SoundManager {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.12,
    delay = 0,
    slideToFreq?: number,
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideToFreq) {
      osc.frequency.exponentialRampToValueAtTime(slideToFreq, now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playCrystal() {
    this.playTone(587.33, 0.12, 'triangle', 0.12, 0);
    this.playTone(880, 0.18, 'triangle', 0.12, 0.06);
  }

  playKey() {
    this.playTone(523.25, 0.1, 'sine', 0.13, 0);
    this.playTone(659.25, 0.1, 'sine', 0.13, 0.07);
    this.playTone(1046.5, 0.22, 'triangle', 0.14, 0.14);
  }

  playSwitch() {
    this.playTone(330, 0.12, 'triangle', 0.13, 0, 440);
    this.playTone(660, 0.18, 'sine', 0.11, 0.08);
  }

  playUnlock() {
    this.playTone(392, 0.12, 'triangle', 0.14, 0);
    this.playTone(523.25, 0.14, 'triangle', 0.14, 0.08);
    this.playTone(783.99, 0.24, 'sine', 0.14, 0.16);
  }

  playCheckpoint() {
    this.playTone(440, 0.12, 'sine', 0.08, 0);
    this.playTone(554.37, 0.16, 'sine', 0.08, 0.07);
  }

  playHit() {
    this.playTone(210, 0.18, 'sawtooth', 0.1, 0, 95);
    this.playTone(150, 0.22, 'square', 0.07, 0.05, 70);
  }

  playBump() {
    this.playTone(145, 0.09, 'triangle', 0.08, 0, 110);
  }

  playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.24, 'triangle', 0.13, idx * 0.09);
    });
  }
}

export const sound = new SoundManager();
