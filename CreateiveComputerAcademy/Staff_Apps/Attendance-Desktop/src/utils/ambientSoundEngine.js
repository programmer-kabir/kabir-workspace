/**
 * ambientSoundEngine.js — Procedural Web Audio API Sound Generator for Focus & Work
 *
 * 100% client-side, zero bandwidth, zero external assets, works completely offline.
 */

class AmbientSoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.currentTrack = null;
    this.isPlaying = false;
    this.volume = 0.5;
    this.activeNodes = [];
    this.intervals = [];
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  stop() {
    this.intervals.forEach(id => clearInterval(id));
    this.intervals = [];

    this.activeNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {}
    });
    this.activeNodes = [];
    this.isPlaying = false;
    this.currentTrack = null;
  }

  play(trackKey) {
    this.init();
    if (this.isPlaying && this.currentTrack === trackKey) {
      this.stop();
      return false;
    }

    this.stop();
    this.currentTrack = trackKey;
    this.isPlaying = true;

    switch (trackKey) {
      case 'rain':
        this._playRain();
        break;
      case 'waves':
        this._playWaves();
        break;
      case 'fire':
        this._playFire();
        break;
      case 'drone':
        this._playDrone();
        break;
      case 'whitenoise':
        this._playWhiteNoise();
        break;
      case 'typing':
        this._playTypingCafe();
        break;
      default:
        this._playRain();
    }
    return true;
  }

  // Pink noise buffer generator
  _createPinkNoiseBuffer(seconds = 5) {
    const bufferSize = this.ctx.sampleRate * seconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  // Brown noise buffer generator (deep rumble/waves)
  _createBrownNoiseBuffer(seconds = 5) {
    const bufferSize = this.ctx.sampleRate * seconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
    return buffer;
  }

  _playRain() {
    const buffer = this._createPinkNoiseBuffer(6);
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // Filter to sound like natural soothing rain
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(1400, this.ctx.currentTime);

    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(300, this.ctx.currentTime);

    const rainGain = this.ctx.createGain();
    rainGain.gain.setValueAtTime(0.75, this.ctx.currentTime);

    noiseSource.connect(lowpass);
    lowpass.connect(highpass);
    highpass.connect(rainGain);
    rainGain.connect(this.masterGain);

    noiseSource.start();
    this.activeNodes.push(noiseSource, lowpass, highpass, rainGain);
  }

  _playWaves() {
    const buffer = this._createBrownNoiseBuffer(6);
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);

    // LFO to modulate filter and volume like natural ocean swell
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // 8-second wave cycle

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(350, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const waveGain = this.ctx.createGain();
    waveGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(this.masterGain);

    noiseSource.start();
    lfo.start();
    this.activeNodes.push(noiseSource, lfo, lfoGain, filter, waveGain);
  }

  _playFire() {
    const buffer = this._createBrownNoiseBuffer(5);
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(700, this.ctx.currentTime);

    const fireGain = this.ctx.createGain();
    fireGain.gain.setValueAtTime(0.65, this.ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(fireGain);
    fireGain.connect(this.masterGain);

    noiseSource.start();
    this.activeNodes.push(noiseSource, filter, fireGain);

    // Periodic random crackles & pops
    const crackleInterval = setInterval(() => {
      if (!this.isPlaying || this.currentTrack !== 'fire') return;
      if (Math.random() > 0.4) {
        try {
          const osc = this.ctx.createOscillator();
          const popGain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(100 + Math.random() * 800, this.ctx.currentTime);
          popGain.gain.setValueAtTime(0.15 * Math.random(), this.ctx.currentTime);
          popGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

          osc.connect(popGain);
          popGain.connect(this.masterGain);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.06);
        } catch (e) {}
      }
    }, 220);

    this.intervals.push(crackleInterval);
  }

  _playDrone() {
    // Lush Cmaj9 ambient chord: C3, G3, B3, D4, E4
    const frequencies = [130.81, 196.00, 246.94, 293.66, 329.63];
    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    droneGain.connect(this.masterGain);

    frequencies.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      // Slight detune for rich analog warmth
      osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 0.8, this.ctx.currentTime);
      oscGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

      osc.connect(oscGain);
      oscGain.connect(droneGain);
      osc.start();
      this.activeNodes.push(osc, oscGain);
    });

    this.activeNodes.push(droneGain);
  }

  _playWhiteNoise() {
    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.15;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2500, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start();
    this.activeNodes.push(source, filter, gain);
  }

  _playTypingCafe() {
    // Background cafe murmur
    const murmurBuffer = this._createBrownNoiseBuffer(4);
    const murmur = this.ctx.createBufferSource();
    murmur.buffer = murmurBuffer;
    murmur.loop = true;

    const murmurFilter = this.ctx.createBiquadFilter();
    murmurFilter.type = 'lowpass';
    murmurFilter.frequency.setValueAtTime(450, this.ctx.currentTime);

    const murmurGain = this.ctx.createGain();
    murmurGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

    murmur.connect(murmurFilter);
    murmurFilter.connect(murmurGain);
    murmurGain.connect(this.masterGain);
    murmur.start();
    this.activeNodes.push(murmur, murmurFilter, murmurGain);

    // Mechanical keyboard key clicks
    const keyInterval = setInterval(() => {
      if (!this.isPlaying || this.currentTrack !== 'typing') return;
      if (Math.random() > 0.3) {
        try {
          const osc = this.ctx.createOscillator();
          const keyGain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(1200 + Math.random() * 600, this.ctx.currentTime);
          keyGain.gain.setValueAtTime(0.08 * Math.random(), this.ctx.currentTime);
          keyGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.03);

          osc.connect(keyGain);
          keyGain.connect(this.masterGain);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.035);
        } catch (e) {}
      }
    }, 160);

    this.intervals.push(keyInterval);
  }
}

export const ambientSound = new AmbientSoundEngine();
export default ambientSound;
