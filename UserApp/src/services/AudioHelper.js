import { Platform, Image } from 'react-native';

// CẤU HÌNH ÂM THANH (AUDIO CONFIGURATION)
export const AUDIO_CONFIG = {
  loopWelcomeMusic: true, // true để lặp lại nhạc chào (nếu ngắn), false để không lặp (nếu dài)
  welcomeVolume: 0.35,    // Âm lượng nhạc chào/kết quả (từ 0.0: tắt tiếng, đến 1.0: lớn nhất)
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

/**
 * Helper tạo hiệu ứng âm thanh chân thực bằng Web Audio API
 * Không cần file audio tĩnh, hoạt động trực tiếp trên mọi trình duyệt!
 */
class AudioHelper {
  constructor() {
    this.ctx = null;
    this.lastSoundTime = 0;
    
    this.welcomeAudio = null;
    this.welcomeInteractionListener = null;
    if (Platform.OS === 'web') {
      try {
        const asset = require('../../assets/bg_welcome.mp3');
        const uri = resolveAssetUri(asset);
        this.welcomeAudio = new Audio(uri);
        this.welcomeAudio.loop = AUDIO_CONFIG.loopWelcomeMusic;
        this.welcomeAudio.volume = AUDIO_CONFIG.welcomeVolume;
      } catch (e) {
        console.warn("AudioHelper welcomeAudio init error:", e);
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

  /**
   * Tạo tiếng click cơ học khi vòng quay lướt qua các ô quà
   */
  playTick() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Tránh dồn dập quá mức
      if (now - this.lastSoundTime < 0.04) return;
      this.lastSoundTime = now;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      // Âm thanh click sắc mỏng giống kim nhựa chạm thanh chắn gỗ
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.04);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      console.warn("Audio Context error:", e);
    }
  }

  /**
   * Âm thanh chiến thắng tươi vui hân hoan khi trúng giải lớn
   */
  playVictory() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      
      // Melody chiến thắng vui tươi: Đồ - Mi - Sol - Đố rực rỡ
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, index) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + index * 0.12);
        
        gain.gain.setValueAtTime(0.15, now + index * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.005, now + index * 0.12 + 0.28);

        osc.start(now + index * 0.12);
        osc.stop(now + index * 0.12 + 0.32);
      });
    } catch (e) {
      console.warn("Audio Context error:", e);
    }
  }

  /**
   * Âm thanh xịt buồn bã khi quay trúng ô mất lượt hoặc xui xẻo
   */
  playFailure() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.55);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.56);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch (e) {
      console.warn("Audio Context error:", e);
    }
  }

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

export const audioHelper = new AudioHelper();
