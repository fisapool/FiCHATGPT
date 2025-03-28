/**
 * Device Fingerprinting Module
 * Creates a unique identifier for the current device for license enforcement
 */
import { SecurityError } from '../types';

export interface FingerprintData {
  userAgent: string;
  language: string;
  platform: string;
  screenResolution: string;
  timezone: string;
  plugins: string;
  canvasFingerprint: string;
  webglFingerprint: string;
  audioFingerprint: string;
  fonts: string;
  hardwareConcurrency: number;
  deviceMemory: number;
  colorDepth: number;
}

export class DeviceFingerprint {
  private fingerprintData: FingerprintData | null = null;
  private readonly FINGERPRINT_STORAGE_KEY = 'device_fingerprint';
  
  /**
   * Initialize fingerprinting by collecting or loading device data
   */
  public async initialize(): Promise<string> {
    try {
      // Try to load existing fingerprint
      const existingFingerprint = await this.loadFingerprint();
      if (existingFingerprint) {
        return existingFingerprint;
      }
      
      // Generate and save new fingerprint
      return await this.generateAndSaveFingerprint();
    } catch (error) {
      console.error('Failed to initialize device fingerprinting:', error);
      throw new SecurityError('Failed to initialize device fingerprinting', error as Error);
    }
  }

  /**
   * Generate a device fingerprint
   */
  public async generateFingerprint(): Promise<string> {
    try {
      this.fingerprintData = await this.collectFingerprintData();
      return this.hashFingerprintData(this.fingerprintData);
    } catch (error) {
      console.error('Failed to generate device fingerprint:', error);
      throw new SecurityError('Failed to generate device fingerprint', error as Error);
    }
  }

  /**
   * Get the current fingerprint hash
   */
  public getFingerprint(): string | null {
    if (!this.fingerprintData) return null;
    return this.hashFingerprintData(this.fingerprintData);
  }

  /**
   * Store the fingerprint in secure storage
   */
  private async saveFingerprint(fingerprintHash: string): Promise<void> {
    try {
      await chrome.storage.local.set({
        [this.FINGERPRINT_STORAGE_KEY]: fingerprintHash
      });
    } catch (error) {
      console.error('Failed to save device fingerprint:', error);
      throw new SecurityError('Failed to save device fingerprint', error as Error);
    }
  }

  /**
   * Load the fingerprint from secure storage
   */
  private async loadFingerprint(): Promise<string | null> {
    try {
      const data = await chrome.storage.local.get(this.FINGERPRINT_STORAGE_KEY);
      return data[this.FINGERPRINT_STORAGE_KEY] || null;
    } catch (error) {
      console.error('Failed to load device fingerprint:', error);
      return null;
    }
  }

  /**
   * Generate and save a fingerprint
   */
  private async generateAndSaveFingerprint(): Promise<string> {
    const fingerprintHash = await this.generateFingerprint();
    await this.saveFingerprint(fingerprintHash);
    return fingerprintHash;
  }

  /**
   * Collect fingerprint data from various browser APIs
   */
  private async collectFingerprintData(): Promise<FingerprintData> {
    // Get standard navigator and screen properties
    const userAgent = navigator.userAgent;
    const language = navigator.language;
    const platform = navigator.platform;
    const screenResolution = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const hardwareConcurrency = navigator.hardwareConcurrency || 0;
    
    // @ts-ignore - Not all browsers support this
    const deviceMemory = navigator.deviceMemory || 0;
    const colorDepth = window.screen.colorDepth;
    
    // Get installed plugins
    let plugins = '';
    for (let i = 0; i < navigator.plugins.length; i++) {
      plugins += navigator.plugins[i].name + ';';
    }
    
    // Canvas fingerprinting
    const canvasFingerprint = await this.getCanvasFingerprint();
    
    // WebGL fingerprinting
    const webglFingerprint = await this.getWebGLFingerprint();
    
    // Audio fingerprinting
    const audioFingerprint = await this.getAudioFingerprint();
    
    // Font detection
    const fonts = await this.detectFonts();
    
    return {
      userAgent,
      language,
      platform,
      screenResolution,
      timezone,
      plugins,
      canvasFingerprint,
      webglFingerprint,
      audioFingerprint,
      fonts,
      hardwareConcurrency,
      deviceMemory,
      colorDepth
    };
  }

  /**
   * Generate a canvas fingerprint
   */
  private async getCanvasFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';
      
      // Set canvas properties
      canvas.width = 200;
      canvas.height = 50;
      
      // Text with different styles
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(10, 10, 100, 30);
      ctx.fillStyle = '#069';
      ctx.fillText('FiChatGPT Fingerprint', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('FiChatGPT Fingerprint', 4, 17);
      
      // Get the data URL and extract the data part
      return canvas.toDataURL().split(',')[1].substring(0, 32);
    } catch (error) {
      console.error('Canvas fingerprinting failed:', error);
      return '';
    }
  }

  /**
   * Generate a WebGL fingerprint
   */
  private async getWebGLFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return '';
      
      // Properly type the WebGL context
      const webgl = gl as WebGLRenderingContext;
      
      const result = [
        webgl.getParameter(webgl.VENDOR),
        webgl.getParameter(webgl.RENDERER),
        webgl.getParameter(webgl.VERSION),
        webgl.getParameter(webgl.SHADING_LANGUAGE_VERSION)
      ].join('~');
      
      return result;
    } catch (error) {
      console.error('WebGL fingerprinting failed:', error);
      return '';
    }
  }

  /**
   * Generate an audio fingerprint
   */
  private async getAudioFingerprint(): Promise<string> {
    try {
      // This is a simplified version of audio fingerprinting
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const oscillator = audioContext.createOscillator();
      const dynamicsCompressor = audioContext.createDynamicsCompressor();
      
      analyser.fftSize = 256;
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
      
      dynamicsCompressor.threshold.setValueAtTime(-50, audioContext.currentTime);
      dynamicsCompressor.knee.setValueAtTime(40, audioContext.currentTime);
      dynamicsCompressor.ratio.setValueAtTime(12, audioContext.currentTime);
      dynamicsCompressor.attack.setValueAtTime(0, audioContext.currentTime);
      dynamicsCompressor.release.setValueAtTime(0.25, audioContext.currentTime);
      
      oscillator.connect(dynamicsCompressor);
      dynamicsCompressor.connect(analyser);
      analyser.connect(audioContext.destination);
      
      oscillator.start(0);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      
      // Convert first 16 bytes to string
      const result = Array.from(dataArray.slice(0, 16)).join(',');
      
      oscillator.stop(0);
      audioContext.close();
      
      return result;
    } catch (error) {
      console.error('Audio fingerprinting failed:', error);
      return '';
    }
  }

  /**
   * Detect installed fonts
   */
  private async detectFonts(): Promise<string> {
    try {
      const fontList = [
        'Arial', 'Arial Black', 'Arial Narrow', 'Calibri', 'Cambria', 
        'Cambria Math', 'Comic Sans MS', 'Courier', 'Courier New', 
        'Georgia', 'Helvetica', 'Impact', 'Lucida Console', 
        'Lucida Sans Unicode', 'Microsoft Sans Serif', 'Palatino Linotype', 
        'Segoe UI', 'Tahoma', 'Times', 'Times New Roman', 'Trebuchet MS', 
        'Verdana', 'Wingdings'
      ];
      
      const detectedFonts: string[] = [];
      
      // Create a test element
      const testElement = document.createElement('span');
      testElement.style.visibility = 'hidden';
      testElement.style.position = 'absolute';
      testElement.style.fontSize = '72px';
      testElement.innerText = 'abcdefghijklmnopqrstuvwxyz';
      document.body.appendChild(testElement);
      
      // Default width and height using a common font
      testElement.style.fontFamily = 'monospace';
      const defaultWidth = testElement.offsetWidth;
      const defaultHeight = testElement.offsetHeight;
      
      // Test each font
      for (const font of fontList) {
        testElement.style.fontFamily = `'${font}', monospace`;
        if (testElement.offsetWidth !== defaultWidth || testElement.offsetHeight !== defaultHeight) {
          detectedFonts.push(font);
        }
      }
      
      document.body.removeChild(testElement);
      
      return detectedFonts.join(',');
    } catch (error) {
      console.error('Font detection failed:', error);
      return '';
    }
  }

  /**
   * Create a hash from fingerprint data
   */
  private hashFingerprintData(data: FingerprintData): string {
    try {
      // Simple string-based hash function for demo purposes
      // In production, use a more robust hashing algorithm
      const str = JSON.stringify(data);
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      
      // Convert to hex string and ensure positive value
      return (hash >>> 0).toString(16);
    } catch (error) {
      console.error('Fingerprint hashing failed:', error);
      throw new SecurityError('Failed to hash fingerprint data', error as Error);
    }
  }
} 