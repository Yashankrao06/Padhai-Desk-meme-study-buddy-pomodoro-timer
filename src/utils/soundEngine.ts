import type { ReactionKind, SoundChannelId, SoundChannelsState } from '../types/study';

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted = false;
  private masterVolume = 0.85;

  private rainGain: GainNode | null = null;
  private rainSource: AudioBufferSourceNode | null = null;

  private brownGain: GainNode | null = null;
  private brownSource: AudioBufferSourceNode | null = null;

  private fireplaceGain: GainNode | null = null;
  private fireplaceSource: AudioBufferSourceNode | null = null;

  private vinylGain: GainNode | null = null;
  private vinylSource: AudioBufferSourceNode | null = null;

  private breezeGain: GainNode | null = null;
  private breezeSource: AudioBufferSourceNode | null = null;
  private breezeLfo: OscillatorNode | null = null;

  private lofiGain: GainNode | null = null;
  private lofiTimer: number | null = null;
  private lofiStep = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private createNoiseBuffer(
    ctx: AudioContext,
    type: 'rain' | 'brown' | 'fireplace' | 'vinyl' | 'breeze',
    seconds = 5,
  ): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * seconds;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'brown') {
      let lastOut = 0;
      for (let i = 0; i < length; i += 1) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.2;
      }
    } else if (type === 'fireplace') {
      let rumble = 0;
      let crackleDecay = 0;
      for (let i = 0; i < length; i += 1) {
        const white = Math.random() * 2 - 1;
        rumble = (rumble + 0.03 * white) / 1.03;
        if (Math.random() > 0.9993) {
          crackleDecay = (Math.random() * 0.75 + 0.25) * (Math.random() > 0.5 ? 1 : -1);
        }
        crackleDecay *= 0.92;
        data[i] = rumble * 1.9 + crackleDecay * 0.65;
      }
    } else if (type === 'vinyl') {
      let hiss = 0;
      let pop = 0;
      for (let i = 0; i < length; i += 1) {
        const white = Math.random() * 2 - 1;
        hiss = hiss * 0.65 + white * 0.025;
        if (Math.random() > 0.9989) {
          pop = (Math.random() - 0.5) * 0.42;
        }
        pop *= 0.72;
        data[i] = hiss + pop;
      }
    } else if (type === 'breeze') {
      let lp = 0;
      for (let i = 0; i < length; i += 1) {
        const white = Math.random() * 2 - 1;
        lp = lp * 0.965 + white * 0.035;
        data[i] = lp * 2.4;
      }
    } else {
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      let b3 = 0;
      let b4 = 0;
      let b5 = 0;
      let b6 = 0;
      for (let i = 0; i < length; i += 1) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
        b6 = white * 0.115926;
        const drop = Math.random() > 0.9982 ? (Math.random() - 0.5) * 0.45 : 0;
        data[i] = pink + drop;
      }
    }
    return buffer;
  }

  private startRain(volume: number): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    if (this.rainSource) {
      if (this.rainGain) this.rainGain.gain.setTargetAtTime(volume * 0.55, ctx.currentTime, 0.15);
      return;
    }

    const src = ctx.createBufferSource();
    src.buffer = this.createNoiseBuffer(ctx, 'rain', 5);
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1150;
    filter.Q.value = 0.55;

    const gain = ctx.createGain();
    gain.gain.value = volume * 0.55;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start();

    this.rainSource = src;
    this.rainGain = gain;
  }

  private stopRain(): void {
    if (this.rainSource) {
      try {
        this.rainSource.stop();
        this.rainSource.disconnect();
      } catch {
        // Ignore already stopped source
      }
      this.rainSource = null;
    }
    if (this.rainGain) {
      this.rainGain.disconnect();
      this.rainGain = null;
    }
  }

  private startBrown(volume: number): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    if (this.brownSource) {
      if (this.brownGain) this.brownGain.gain.setTargetAtTime(volume * 0.65, ctx.currentTime, 0.15);
      return;
    }

    const src = ctx.createBufferSource();
    src.buffer = this.createNoiseBuffer(ctx, 'brown', 5);
    src.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 340;

    const gain = ctx.createGain();
    gain.gain.value = volume * 0.65;

    src.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(this.masterGain);
    src.start();

    this.brownSource = src;
    this.brownGain = gain;
  }

  private stopBrown(): void {
    if (this.brownSource) {
      try {
        this.brownSource.stop();
        this.brownSource.disconnect();
      } catch {
        // Ignore
      }
      this.brownSource = null;
    }
    if (this.brownGain) {
      this.brownGain.disconnect();
      this.brownGain = null;
    }
  }

  private startFireplace(volume: number): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    if (this.fireplaceSource) {
      if (this.fireplaceGain) {
        this.fireplaceGain.gain.setTargetAtTime(volume * 0.6, ctx.currentTime, 0.15);
      }
      return;
    }

    const src = ctx.createBufferSource();
    src.buffer = this.createNoiseBuffer(ctx, 'fireplace', 5);
    src.loop = true;

    const warmth = ctx.createBiquadFilter();
    warmth.type = 'lowpass';
    warmth.frequency.value = 1800;

    const gain = ctx.createGain();
    gain.gain.value = volume * 0.6;

    src.connect(warmth);
    warmth.connect(gain);
    gain.connect(this.masterGain);
    src.start();

    this.fireplaceSource = src;
    this.fireplaceGain = gain;
  }

  private stopFireplace(): void {
    if (this.fireplaceSource) {
      try {
        this.fireplaceSource.stop();
        this.fireplaceSource.disconnect();
      } catch {
        // Ignore
      }
      this.fireplaceSource = null;
    }
    if (this.fireplaceGain) {
      this.fireplaceGain.disconnect();
      this.fireplaceGain = null;
    }
  }

  private startVinyl(volume: number): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    if (this.vinylSource) {
      if (this.vinylGain) {
        this.vinylGain.gain.setTargetAtTime(volume * 0.5, ctx.currentTime, 0.15);
      }
      return;
    }

    const src = ctx.createBufferSource();
    src.buffer = this.createNoiseBuffer(ctx, 'vinyl', 4);
    src.loop = true;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 2200;
    bandpass.Q.value = 0.7;

    const gain = ctx.createGain();
    gain.gain.value = volume * 0.5;

    src.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.masterGain);
    src.start();

    this.vinylSource = src;
    this.vinylGain = gain;
  }

  private stopVinyl(): void {
    if (this.vinylSource) {
      try {
        this.vinylSource.stop();
        this.vinylSource.disconnect();
      } catch {
        // Ignore
      }
      this.vinylSource = null;
    }
    if (this.vinylGain) {
      this.vinylGain.disconnect();
      this.vinylGain = null;
    }
  }

  private startBreeze(volume: number): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    if (this.breezeSource) {
      if (this.breezeGain) {
        this.breezeGain.gain.setTargetAtTime(volume * 0.45, ctx.currentTime, 0.15);
      }
      return;
    }

    const src = ctx.createBufferSource();
    src.buffer = this.createNoiseBuffer(ctx, 'breeze', 6);
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 460;
    filter.Q.value = 1.2;

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.14;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 160;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const gain = ctx.createGain();
    gain.gain.value = volume * 0.45;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start();

    this.breezeSource = src;
    this.breezeGain = gain;
    this.breezeLfo = lfo;
  }

  private stopBreeze(): void {
    if (this.breezeLfo) {
      try {
        this.breezeLfo.stop();
        this.breezeLfo.disconnect();
      } catch {
        // Ignore
      }
      this.breezeLfo = null;
    }
    if (this.breezeSource) {
      try {
        this.breezeSource.stop();
        this.breezeSource.disconnect();
      } catch {
        // Ignore
      }
      this.breezeSource = null;
    }
    if (this.breezeGain) {
      this.breezeGain.disconnect();
      this.breezeGain = null;
    }
  }

  private playLofiChord(): void {
    const ctx = this.ctx;
    if (!ctx || !this.lofiGain) return;

    const chords: number[][] = [
      [293.66, 349.23, 440.0, 523.25, 659.25],
      [246.94, 349.23, 440.0, 493.88, 659.25],
      [261.63, 329.63, 392.0, 493.88, 587.33],
      [220.0, 329.63, 415.3, 493.88, 587.33],
    ];
    const melodyNotes = [880.0, 783.99, 659.25, 587.33, 659.25, 783.99];
    const chord = chords[this.lofiStep % chords.length];
    const accentNote = melodyNotes[this.lofiStep % melodyNotes.length];
    this.lofiStep += 1;

    const now = ctx.currentTime;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1080, now);

    const chordGain = ctx.createGain();
    chordGain.gain.setValueAtTime(0.0001, now);
    chordGain.gain.linearRampToValueAtTime(0.18, now + 0.14);
    chordGain.gain.exponentialRampToValueAtTime(0.001, now + 3.4);

    filter.connect(chordGain);
    chordGain.connect(this.lofiGain);

    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq * (1 + (idx - 2) * 0.0012), now + idx * 0.04);
      osc.connect(filter);
      osc.start(now + idx * 0.04);
      osc.stop(now + 3.5);
    });

    // Gentle Rhodes sparkle note mid-measure
    const bellOsc = ctx.createOscillator();
    const bellGain = ctx.createGain();
    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(accentNote, now + 1.55);
    bellGain.gain.setValueAtTime(0.0001, now + 1.55);
    bellGain.gain.linearRampToValueAtTime(0.055, now + 1.62);
    bellGain.gain.exponentialRampToValueAtTime(0.0008, now + 3.2);
    bellOsc.connect(bellGain);
    bellGain.connect(this.lofiGain);
    bellOsc.start(now + 1.55);
    bellOsc.stop(now + 3.25);
  }

  private startLofi(volume: number): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    if (!this.lofiGain) {
      this.lofiGain = ctx.createGain();
      this.lofiGain.gain.value = volume * 0.75;
      this.lofiGain.connect(this.masterGain);
    } else {
      this.lofiGain.gain.setTargetAtTime(volume * 0.75, ctx.currentTime, 0.15);
    }

    if (this.lofiTimer === null) {
      this.playLofiChord();
      this.lofiTimer = window.setInterval(() => {
        this.playLofiChord();
      }, 3600);
    }
  }

  private stopLofi(): void {
    if (this.lofiTimer !== null) {
      window.clearInterval(this.lofiTimer);
      this.lofiTimer = null;
    }
    if (this.lofiGain) {
      this.lofiGain.disconnect();
      this.lofiGain = null;
    }
  }

  syncChannels(channels: SoundChannelsState, muted: boolean, masterVolume = 0.85): void {
    this.isMuted = muted;
    this.masterVolume = masterVolume;
    const anyEnabled = (Object.keys(channels) as SoundChannelId[]).some(
      (key) => channels[key].enabled,
    );
    if (!anyEnabled && !this.ctx) return;

    const ctx = anyEnabled ? this.ensureContext() : this.ctx;
    if (ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : masterVolume, ctx.currentTime, 0.08);
    }

    if (channels.rain.enabled) this.startRain(channels.rain.volume);
    else this.stopRain();

    if (channels.brown.enabled) this.startBrown(channels.brown.volume);
    else this.stopBrown();

    if (channels.lofi.enabled) this.startLofi(channels.lofi.volume);
    else this.stopLofi();

    if (channels.fireplace.enabled) this.startFireplace(channels.fireplace.volume);
    else this.stopFireplace();

    if (channels.vinyl.enabled) this.startVinyl(channels.vinyl.volume);
    else this.stopVinyl();

    if (channels.breeze.enabled) this.startBreeze(channels.breeze.volume);
    else this.stopBreeze();
  }

  playChime(kind: 'complete' | ReactionKind): void {
    if (this.isMuted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    const notesMap: Record<'complete' | ReactionKind, number[]> = {
      complete: [523.25, 659.25, 783.99],
      chai: [440.0, 554.37],
      highfive: [587.33, 880.0],
      cheer: [523.25, 659.25, 987.77],
      hydrate: [659.25, 783.99],
      stretch: [392.0, 493.88, 587.33],
    };
    const notes = notesMap[kind];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.085);

      gain.gain.setValueAtTime(0.001, now + idx * 0.085);
      gain.gain.linearRampToValueAtTime(0.13, now + idx * 0.085 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + idx * 0.085 + 0.52);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + idx * 0.085);
      osc.stop(now + idx * 0.085 + 0.56);
    });
  }

  dispose(): void {
    this.stopRain();
    this.stopBrown();
    this.stopLofi();
    this.stopFireplace();
    this.stopVinyl();
    this.stopBreeze();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}

export const soundEngine = new AmbientSoundEngine();
