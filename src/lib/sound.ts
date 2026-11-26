// src/lib/sound.ts
'use client';

/**
 * Singleton quản lý âm thanh nạp tiền (Zero-Latency Web Audio API)
 * Preload và giải mã sẵn toàn bộ file coins.mp3 vào RAM ngay khi app chạy.
 * Khi nạp tiền thành công, âm thanh phát ra NGAY LẬP TỨC (0ms) đồng thời với thông báo và pháo hoa.
 */
class SoundManager {
  private static instance: SoundManager;
  private coinAudio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private isPreloaded = false;

  private constructor() {
    if (typeof window !== 'undefined') {
      // Tự động preload khi trang tải hoặc khi có tương tác đầu tiên
      const triggerPreload = () => {
        this.init();
        window.removeEventListener('click', triggerPreload);
        window.removeEventListener('touchstart', triggerPreload);
      };

      if (document.readyState === 'complete') {
        this.init();
      } else {
        window.addEventListener('load', () => this.init());
      }

      window.addEventListener('click', triggerPreload, { once: true });
      window.addEventListener('touchstart', triggerPreload, { once: true });
    }
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  public async init() {
    if (this.isPreloaded || typeof window === 'undefined') return;
    this.isPreloaded = true;

    try {
      // 1. Preload HTML5 Audio element
      this.coinAudio = new Audio('/sounds/coins.mp3');
      this.coinAudio.preload = 'auto';
      this.coinAudio.volume = 1.0;
      this.coinAudio.load();

      // 2. Pre-decode Web Audio API buffer (Cho độ trễ 0ms thực thụ)
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!this.audioContext) {
          this.audioContext = new AudioCtx();
        }
        const res = await fetch('/sounds/coins.mp3');
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        }
      }
    } catch {
      // Fallback graceful
    }
  }

  /**
   * Phát âm thanh tức thì không có độ trễ (Zero Latency)
   */
  public playCoinSound(volume: number = 1.0) {
    if (typeof window === 'undefined') return;

    // Ưu tiên 1: Web Audio API (Độ trễ 0ms)
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!this.audioContext) {
          this.audioContext = new AudioCtx();
        }
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }

        if (this.audioBuffer) {
          const source = this.audioContext.createBufferSource();
          source.buffer = this.audioBuffer;
          const gainNode = this.audioContext.createGain();
          gainNode.gain.value = Math.max(0, Math.min(1, volume));
          source.connect(gainNode);
          gainNode.connect(this.audioContext.destination);
          source.start(0);
          return;
        }
      }
    } catch {}

    // Ưu tiên 2: HTML5 Audio preloaded
    try {
      if (this.coinAudio) {
        this.coinAudio.currentTime = 0;
        this.coinAudio.volume = Math.max(0, Math.min(1, volume));
        const promise = this.coinAudio.play();
        if (promise) promise.catch(() => {});
        return;
      }
    } catch {}

    // Fallback 3: Tạo Audio mới nếu mọi thứ chưa sẵn sàng
    try {
      const fallback = new Audio('/sounds/coins.mp3');
      fallback.volume = volume;
      fallback.play().catch(() => {});
    } catch {}
  }
}

/**
 * Hàm gọi phát âm thanh nạp tiền tức thì (dùng chung toàn app)
 */
export function playDepositSuccessSound(volume: number = 1.0) {
  SoundManager.getInstance().playCoinSound(volume);
}
