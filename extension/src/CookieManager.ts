/**
 * Cookie Manager Module
 * Core functionality for managing browser cookies
 */
import { Cookie, CookieExport, CookieManagerSettings, ValidationError } from './types';
import { CookieEncryption } from './security/CookieEncryption';
import { ErrorManager } from './errors/ErrorManager';

export class CookieManager {
  private cookies: Cookie[] = [];
  private encryption: CookieEncryption;
  private errorManager: ErrorManager;
  private settings: CookieManagerSettings = {
    autoSave: true,
    encryptionEnabled: true,
    syncEnabled: false,
    notificationsEnabled: true,
    maxCookiesPerDomain: 50
  };

  constructor() {
    this.encryption = new CookieEncryption();
    this.errorManager = new ErrorManager();
  }

  /**
   * Initialize the cookie manager
   */
  public async initialize(): Promise<void> {
    try {
      await this.loadSettings();
      await this.loadCookies();
    } catch (error) {
      await this.errorManager.handleError(error as Error, 'CookieManager.initialize');
    }
  }

  /**
   * Get all cookies
   */
  public getCookies(): Cookie[] {
    return this.cookies;
  }

  /**
   * Get cookies for a specific domain
   */
  public getCookiesForDomain(domain: string): Cookie[] {
    return this.cookies.filter(cookie => cookie.domain === domain);
  }

  /**
   * Add a new cookie
   */
  public async addCookie(cookie: Cookie): Promise<boolean> {
    try {
      // Validate cookie
      this.validateCookie(cookie);

      // Check for existing cookie with same name and domain
      const existingIndex = this.cookies.findIndex(
        c => c.name === cookie.name && c.domain === cookie.domain && c.path === cookie.path
      );

      if (existingIndex !== -1) {
        // Update existing cookie
        this.cookies[existingIndex] = cookie;
      } else {
        // Add new cookie
        this.cookies.push(cookie);
      }

      // Auto-save if enabled
      if (this.settings.autoSave) {
        await this.saveCookies();
      }

      return true;
    } catch (error) {
      await this.errorManager.handleError(error as Error, 'CookieManager.addCookie');
      return false;
    }
  }

  /**
   * Delete a cookie
   */
  public async deleteCookie(cookieId: { name: string; domain: string; path: string }): Promise<boolean> {
    try {
      const initialLength = this.cookies.length;
      this.cookies = this.cookies.filter(
        c => !(c.name === cookieId.name && c.domain === cookieId.domain && c.path === cookieId.path)
      );

      // Auto-save if cookies were changed and auto-save is enabled
      if (initialLength !== this.cookies.length && this.settings.autoSave) {
        await this.saveCookies();
      }

      return initialLength !== this.cookies.length;
    } catch (error) {
      await this.errorManager.handleError(error as Error, 'CookieManager.deleteCookie');
      return false;
    }
  }

  /**
   * Export cookies to a file
   */
  public async exportCookies(): Promise<CookieExport> {
    try {
      const exportData: CookieExport = {
        cookies: this.cookies,
        metadata: {
          version: "2.0",
          timestamp: Date.now(),
          source: "FiChatGPT Cookie Manager"
        }
      };
      
      return exportData;
    } catch (error) {
      await this.errorManager.handleError(error as Error, 'CookieManager.exportCookies');
      throw error;
    }
  }

  /**
   * Import cookies from a file
   */
  public async importCookies(data: CookieExport): Promise<boolean> {
    try {
      // Validate imported data
      if (!data.cookies || !Array.isArray(data.cookies)) {
        throw new ValidationError('Invalid cookie data format');
      }

      // Validate each cookie
      for (const cookie of data.cookies) {
        this.validateCookie(cookie);
      }

      // Merge cookies, overwriting duplicates
      for (const cookie of data.cookies) {
        await this.addCookie(cookie);
      }

      return true;
    } catch (error) {
      await this.errorManager.handleError(error as Error, 'CookieManager.importCookies');
      return false;
    }
  }

  /**
   * Save cookies to storage
   */
  private async saveCookies(): Promise<void> {
    try {
      let dataToSave;
      
      if (this.settings.encryptionEnabled) {
        dataToSave = await this.encryption.encryptCookies(this.cookies);
      } else {
        dataToSave = { 
          cookies: this.cookies,
          timestamp: Date.now(), 
          version: '2.0'
        };
      }
      
      // Save to extension storage
      await chrome.storage.local.set({
        'bytescookies': dataToSave
      });
      
    } catch (error) {
      await this.errorManager.handleError(error as Error, 'CookieManager.saveCookies');
    }
  }

  /**
   * Load cookies from storage
   */
  private async loadCookies(): Promise<void> {
    try {
      const data = await chrome.storage.local.get('bytescookies');
      
      if (!data.bytescookies) {
        this.cookies = [];
        return;
      }
      
      if (this.settings.encryptionEnabled) {
        this.cookies = await this.encryption.decryptCookies(data.bytescookies);
      } else {
        this.cookies = data.bytescookies.cookies || [];
      }
    } catch (error) {
      await this.errorManager.handleError(error as Error, 'CookieManager.loadCookies');
      this.cookies = [];
    }
  }

  /**
   * Load settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const data = await chrome.storage.local.get('bytescookies_settings');
      
      if (data.bytescookies_settings) {
        this.settings = {
          ...this.settings,
          ...data.bytescookies_settings
        };
      }
    } catch (error) {
      await this.errorManager.handleError(error as Error, 'CookieManager.loadSettings');
    }
  }

  /**
   * Save settings to storage
   */
  public async saveSettings(settings: Partial<CookieManagerSettings>): Promise<void> {
    try {
      this.settings = {
        ...this.settings,
        ...settings
      };
      
      await chrome.storage.local.set({
        'bytescookies_settings': this.settings
      });
    } catch (error) {
      await this.errorManager.handleError(error as Error, 'CookieManager.saveSettings');
    }
  }

  /**
   * Get current settings
   */
  public getSettings(): CookieManagerSettings {
    return { ...this.settings };
  }

  /**
   * Validate a cookie
   */
  private validateCookie(cookie: Cookie): void {
    if (!cookie.name) {
      throw new ValidationError('Cookie name is required');
    }
    
    if (!cookie.domain) {
      throw new ValidationError('Cookie domain is required');
    }
    
    if (!cookie.path) {
      throw new ValidationError('Cookie path is required');
    }
    
    // Check domain format (basic check)
    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cookie.domain)) {
      throw new ValidationError('Invalid cookie domain format');
    }
    
    // Check if we've reached the maximum number of cookies per domain
    const domainCookies = this.cookies.filter(c => c.domain === cookie.domain);
    if (domainCookies.length >= this.settings.maxCookiesPerDomain) {
      throw new ValidationError(`Maximum number of cookies (${this.settings.maxCookiesPerDomain}) reached for domain ${cookie.domain}`);
    }
  }
} 