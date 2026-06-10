import { Platform, Image } from 'react-native';

// CẤU HÌNH ÂM THANH (AUDIO CONFIGURATION)
export const AUDIO_CONFIG = {
  loopWelcomeMusic: true,  // true để lặp lại nhạc chào (nếu ngắn), false để không lặp (nếu dài)
  loopGameplayMusic: true, // true để lặp lại nhạc chơi game (nếu ngắn), false để không lặp (nếu dài)
  welcomeVolume: 0.35,     // Âm lượng nhạc chào/kết quả (từ 0.0: tắt tiếng, đến 1.0: lớn nhất)
  gameplayVolume: 0.4,     // Âm lượng nhạc đá phạt (từ 0.0: tắt tiếng, đến 1.0: lớn nhất)
};

/**
 * Hàm phụ trợ giải quyết đường dẫn âm thanh cực kỳ mạnh mẽ
 * Tương thích hoàn toàn với tất cả định dạng import/require của Metro Bundler trên Web
 */
function resolveAssetUri(asset) {
  if (!asset) return '';
  if (typeof asset === 'string') return asset;
  if (typeof asset === 'number') {
    const resolved = Image.resolveAssetSource(asset);
    return resolved ? resolved.uri : '';
  }
  if (typeof asset === 'object') {
    if (asset.uri) return asset.uri;
    if (asset.default) {
      if (typeof asset.default === 'string') return asset.default;
      if (asset.default.uri) return asset.default.uri;
    }
    const resolved = Image.resolveAssetSource(asset);
    return resolved ? resolved.uri : '';
  }
  return '';
}

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.musicInterval = null;
    this.crowdNode = null;
    this.isMusicPlaying = false;
    this.tempo = 125; // Beats per minute
    this.beatDuration = 60 / this.tempo; // Duration of one beat in seconds
    this.currentStep = 0;
    this.bassPattern = [36, 36, 39, 39, 43, 43, 41, 41]; // Midi notes for bassline (C1, C1, Eb1, Eb1, G1, G1, F1, F1)
    
    this.welcomeAudio = null;
    this.gameplayAudio = null;
    this.welcomeInteractionListener = null;
    this.gameplayInteractionListener = null;
    if (Platform.OS === 'web') {
      try {
        const welcomeAsset = require('../../assets/bg_welcome.mp3');
        const welcomeUri = resolveAssetUri(welcomeAsset);
        this.welcomeAudio = new Audio(welcomeUri);
        this.welcomeAudio.loop = AUDIO_CONFIG.loopWelcomeMusic;
        this.welcomeAudio.volume = AUDIO_CONFIG.welcomeVolume;
      } catch (e) {
        console.warn("AudioEngine welcomeAudio init error:", e);
      }
      try {
        const gameplayAsset = require('../../assets/bg_gameplay.mp3');
        const gameplayUri = resolveAssetUri(gameplayAsset);
        this.gameplayAudio = new Audio(gameplayUri);
        this.gameplayAudio.loop = AUDIO_CONFIG.loopGameplayMusic;
        this.gameplayAudio.volume = AUDIO_CONFIG.gameplayVolume;
      } catch (e) {
        console.warn("AudioEngine gameplayAudio init error:", e);
      }
    }
  }

  cleanupWelcomeListener() {
    if (this.welcomeInteractionListener) {
      window.removeEventListener('click', this.welcomeInteractionListener);
      window.removeEventListener('touchstart', this.welcomeInteractionListener);
      this.welcomeInteractionListener = null;
    }
  }

  cleanupGameplayListener() {
    if (this.gameplayInteractionListener) {
      window.removeEventListener('click', this.gameplayInteractionListener);
      window.removeEventListener('touchstart', this.gameplayInteractionListener);
      this.gameplayInteractionListener = null;
    }
  }

  startWelcomeMusic() {
    if (this.welcomeAudio) {
      this.welcomeAudio.loop = AUDIO_CONFIG.loopWelcomeMusic;
      this.welcomeAudio.volume = AUDIO_CONFIG.welcomeVolume;
      this.welcomeAudio.currentTime = 0;
      
      this.cleanupWelcomeListener();

      const playPromise = this.welcomeAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn("Welcome music autoplay blocked, waiting for user interaction:", error);
          this.welcomeInteractionListener = () => {
            this.welcomeAudio.loop = AUDIO_CONFIG.loopWelcomeMusic;
            this.welcomeAudio.volume = AUDIO_CONFIG.welcomeVolume;
            this.welcomeAudio.play().catch(e => console.warn("Play on interaction failed:", e));
            this.cleanupWelcomeListener();
          };
          window.addEventListener('click', this.welcomeInteractionListener);
          window.addEventListener('touchstart', this.welcomeInteractionListener);
        });
      }
    }
  }

  stopWelcomeMusic() {
    this.cleanupWelcomeListener();
    if (this.welcomeAudio) {
      this.welcomeAudio.pause();
    }
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- Background Ambiance: Crowd Stadium Cheer ---
  createCrowdNoise() {
    if (!this.ctx) return;
    
    // Create crowd noise using a custom white noise buffer
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 350;
    filter.Q.value = 0.6;
    
    const gain = this.ctx.createGain();
    gain.gain.value = 0.04; // Keep it subtle in the background
    
    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    noiseSource.start();
    this.crowdNode = { source: noiseSource, gain: gain };
  }

  // --- Background Music: Sports Beat Synthesizer ---
  startMusic() {
    try {
      this.init();
      if (!this.ctx || this.isMusicPlaying) return;

      this.isMusicPlaying = true;

      // Start stadium crowd noise
      this.createCrowdNoise();

      if (this.gameplayAudio) {
        this.gameplayAudio.loop = AUDIO_CONFIG.loopGameplayMusic;
        this.gameplayAudio.volume = AUDIO_CONFIG.gameplayVolume;
        this.gameplayAudio.currentTime = 0;
        
        this.cleanupGameplayListener();

        const playPromise = this.gameplayAudio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn("Gameplay music autoplay blocked, waiting for user interaction:", error);
            this.gameplayInteractionListener = () => {
              if (this.isMusicPlaying) {
                this.gameplayAudio.loop = AUDIO_CONFIG.loopGameplayMusic;
                this.gameplayAudio.volume = AUDIO_CONFIG.gameplayVolume;
                this.gameplayAudio.play().catch(e => console.warn("Play on interaction failed:", e));
              }
              this.cleanupGameplayListener();
            };
            window.addEventListener('click', this.gameplayInteractionListener);
            window.addEventListener('touchstart', this.gameplayInteractionListener);
          });
        }
      }
    } catch (e) {
      console.warn("AudioEngine startMusic error:", e);
    }
  }

  stopMusic() {
    this.isMusicPlaying = false;
    this.cleanupGameplayListener();
    if (this.gameplayAudio) {
      this.gameplayAudio.pause();
    }
    if (this.crowdNode) {
      try {
        this.crowdNode.source.stop();
      } catch (e) {}
      this.crowdNode = null;
    }
  }

  midiToFreq(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  playBeatStep() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const step = this.currentStep % 16;
    
    // 1. Kick Drum on beats 1, 5, 9, 13 (step 0, 4, 8, 12)
    if (step % 4 === 0) {
      this.triggerKickSynth(now);
    }

    // 2. Snare / Noise Clap on beats 5, 13 (step 4, 12)
    if (step === 4 || step === 12) {
      this.triggerSnareSynth(now);
    }

    // 3. Hi-Hat on offbeats (step 2, 6, 10, 14)
    if (step % 4 === 2) {
      this.triggerHihatSynth(now);
    }

    // 4. Looping Bassline on every 8th note step
    const bassNote = this.bassPattern[this.currentStep % this.bassPattern.length];
    this.triggerBassSynth(bassNote, now);

    this.currentStep++;
  }

  triggerKickSynth(time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.15);
    
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.005, time + 0.18);
    
    osc.start(time);
    osc.stop(time + 0.2);
  }

  triggerSnareSynth(time) {
    // White noise burst for snare
    const bufferSize = this.ctx.sampleRate * 0.15; // 0.15s
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.005, time + 0.14);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    noise.start(time);
  }

  triggerHihatSynth(time) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(10000, time);
    
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    
    gain.gain.setValueAtTime(0.03, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    
    osc.start(time);
    osc.stop(time + 0.06);
  }

  triggerBassSynth(note, time) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(this.midiToFreq(note), time);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, time);
    filter.frequency.exponentialRampToValueAtTime(80, time + 0.15);
    
    gain.gain.setValueAtTime(0.06, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
    
    osc.start(time);
    osc.stop(time + 0.24);
  }

  // --- Sound FX: Kick ---
  playKick() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);
      
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.22);
      
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn("AudioEngine playKick error:", e);
    }
  }

  // --- Sound FX: Ball Hitting Net (Goal) ---
  playGoal() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      // Synthesize net rustle using low-passed noise
      const bufferSize = this.ctx.sampleRate * 0.6; // 0.6 seconds
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        // White noise mixed with some micro crackles
        const noise = Math.random() * 2 - 1;
        const crackle = Math.random() > 0.96 ? (Math.random() * 2 - 1) * 1.5 : 0;
        data[i] = noise * 0.7 + crackle * 0.3;
      }
      
      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.5);
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.58);
      
      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      
      noiseNode.start(now);
      
      // Add a secondary low thud representing the ball impact
      const thud = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thud.connect(thudGain);
      thudGain.connect(this.ctx.destination);
      
      thud.frequency.setValueAtTime(100, now);
      thud.frequency.exponentialRampToValueAtTime(40, now + 0.1);
      thudGain.gain.setValueAtTime(0.2, now);
      thudGain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);
      
      thud.start(now);
      thud.stop(now + 0.15);
    } catch (e) {
      console.warn("AudioEngine playGoal error:", e);
    }
  }

  // --- Sound FX: Ball Hitting Post/Bar (Miss) ---
  playPost() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      // High-pitched metallic ring (multiple frequencies playing together)
      const frequencies = [320, 480, 720];
      frequencies.forEach(freq => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        
        osc.start(now);
        osc.stop(now + 0.3);
      });
      
      // Add a quick dull thud
      const thud = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thud.connect(thudGain);
      thudGain.connect(this.ctx.destination);
      thud.frequency.setValueAtTime(150, now);
      thud.frequency.exponentialRampToValueAtTime(50, now + 0.08);
      thudGain.gain.setValueAtTime(0.25, now);
      thudGain.gain.exponentialRampToValueAtTime(0.005, now + 0.1);
      thud.start(now);
      thud.stop(now + 0.12);
    } catch (e) {
      console.warn("AudioEngine playPost error:", e);
    }
  }

  // --- Sound FX: Referee Whistle ---
  playWhistle() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      const freqs = [2000, 2020]; // Beat frequency creating the characteristic warble
      freqs.forEach(freq => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'sine';
        
        // Tremolo / warble modulation using an LFO
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.linearRampToValueAtTime(freq + 15, now + 0.45);
        
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.35);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
        
        osc.start(now);
        osc.stop(now + 0.5);
      });
    } catch (e) {
      console.warn("AudioEngine playWhistle error:", e);
    }
  }

  // --- Sound FX: Button Click ---
  playButtonClick() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {
      console.warn("Audio Context error:", e);
    }
  }
}

export const audioEngine = new AudioEngine();
