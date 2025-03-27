import { CookieEncryption } from './security/CookieEncryption';
import { CookieValidator } from './validation/CookieValidator';
import { ErrorManager } from './errors/ErrorManager';
import { GitHubSyncManager, SyncResult } from './security/GitHubSyncManager';
import { ExportResult, EncryptedData, ImportResult } from './types';

declare const chrome: any; // Add Chrome types declaration

export class CookieManager {
  private readonly security: CookieEncryption;
  private readonly validator: CookieValidator;
  private readonly errorManager: ErrorManager;
  private readonly syncManager: GitHubSyncManager;

  constructor() {
    this.security = new CookieEncryption();
    this.validator = new CookieValidator();
    this.errorManager = new ErrorManager();
    this.syncManager = new GitHubSyncManager();
  }

  async exportCookies(domain: string): Promise<ExportResult> {
    try {
      // Get cookies
      const cookies = await chrome.cookies.getAll({ domain });

      // Validate cookies
      const validationResults = await Promise.all(
        cookies.map(cookie => this.validator.validateCookie(cookie))
      );

      // Filter out invalid cookies
      const validCookies = cookies.filter((_, index) => 
        validationResults[index].isValid
      );

      // Encrypt valid cookies
      const encrypted = await this.security.encryptCookies(validCookies);

      return {
        success: true,
        data: encrypted,
        metadata: {
          total: cookies.length,
          valid: validCookies.length,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      await this.errorManager.handleError(error, 'export');
      throw error;
    }
  }

  async importCookies(encryptedData: EncryptedData): Promise<ImportResult> {
    try {
      // Decrypt cookies
      const cookies = await this.security.decryptCookies(encryptedData);

      // Validate each cookie
      const validationResults = await Promise.all(
        cookies.map(cookie => this.validator.validateCookie(cookie))
      );

      // Filter valid cookies
      const validCookies = cookies.filter((_, index) => 
        validationResults[index].isValid
      );

      // Set cookies
      const results = await Promise.all(
        validCookies.map(async cookie => {
          try {
            await chrome.cookies.set(cookie);
            return { success: true, cookie };
          } catch (error) {
            return { success: false, cookie, error };
          }
        })
      );

      const successCount = results.filter(r => r.success).length;

      return {
        success: successCount > 0,
        metadata: {
          total: cookies.length,
          valid: validCookies.length,
          imported: successCount,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      await this.errorManager.handleError(error, 'import');
      throw error;
    }
  }

  /**
   * Sync cookies for a specific domain to GitHub
   */
  async syncToGitHub(domain: string): Promise<SyncResult> {
    try {
      // Export cookies first
      const exportResult = await this.exportCookies(domain);
      
      if (!exportResult.success) {
        return {
          success: false,
          message: 'Failed to export cookies for sync',
          timestamp: Date.now()
        };
      }

      // Upload to GitHub
      const syncResult = await this.syncManager.uploadCookies(
        domain, 
        exportResult.data
      );

      // Update metadata if successful
      if (syncResult.success) {
        await this.syncManager.updateMetadata(domain, {
          cookieCount: exportResult.metadata.valid,
          totalCount: exportResult.metadata.total
        });
      }

      return syncResult;
    } catch (error) {
      console.error('Sync to GitHub error:', error);
      return {
        success: false,
        message: `Sync failed: ${(error as Error).message}`,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Restore cookies for a domain from GitHub
   */
  async restoreFromGitHub(domain: string): Promise<ImportResult> {
    try {
      // Download from GitHub
      const downloadResult = await this.syncManager.downloadCookies(domain);
      
      if (!downloadResult.success || !downloadResult.data) {
        return {
          success: false,
          metadata: {
            total: 0,
            valid: 0,
            imported: 0,
            timestamp: Date.now(),
            error: downloadResult.message
          }
        };
      }

      // Import the downloaded cookies
      return await this.importCookies(downloadResult.data);
    } catch (error) {
      console.error('Restore from GitHub error:', error);
      await this.errorManager.handleError(error, 'github-restore');
      
      return {
        success: false,
        metadata: {
          total: 0,
          valid: 0,
          imported: 0,
          timestamp: Date.now(),
          error: (error as Error).message
        }
      };
    }
  }

  /**
   * Get the sync manager instance
   */
  getSyncManager(): GitHubSyncManager {
    return this.syncManager;
  }
} 