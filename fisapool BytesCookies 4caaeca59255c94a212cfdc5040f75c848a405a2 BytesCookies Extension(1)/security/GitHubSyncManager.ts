import { EncryptedData } from '../types';

export interface SyncResult {
  success: boolean;
  message: string;
  timestamp: number;
  syncedItems?: number;
}

export interface SyncConfig {
  autoSync: boolean;
  syncInterval: number; // in minutes
  lastSync: number;
  domains: string[];
}

export class GitHubSyncManager {
  private readonly GITHUB_CONFIG = {
    repo: 'fisapool/json',
    baseUrl: 'https://api.github.com',
    contentEndpoint: '/repos/fisapool/json/contents',
    defaultBranch: 'main'
  };

  private config: SyncConfig = {
    autoSync: false,
    syncInterval: 60, // 1 hour default
    lastSync: 0,
    domains: []
  };

  constructor() {
    this.loadConfig();
  }

  /**
   * Load sync configuration from storage
   */
  private async loadConfig(): Promise<void> {
    try {
      const data = await chrome.storage.sync.get('syncConfig');
      if (data.syncConfig) {
        this.config = { ...this.config, ...data.syncConfig };
      }
    } catch (error) {
      console.error('Failed to load sync config:', error);
    }
  }

  /**
   * Save sync configuration to storage
   */
  private async saveConfig(): Promise<void> {
    try {
      await chrome.storage.sync.set({ syncConfig: this.config });
    } catch (error) {
      console.error('Failed to save sync config:', error);
    }
  }

  /**
   * Update sync configuration
   */
  async updateConfig(newConfig: Partial<SyncConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await this.saveConfig();
  }

  /**
   * Get the GitHub token
   */
  private async getGitHubToken(): Promise<string | null> {
    try {
      const data = await chrome.storage.sync.get('githubToken');
      return data.githubToken || null;
    } catch (error) {
      console.error('Failed to get GitHub token:', error);
      return null;
    }
  }

  /**
   * Upload encrypted cookie data to GitHub
   */
  async uploadCookies(domain: string, encryptedData: EncryptedData): Promise<SyncResult> {
    try {
      const token = await this.getGitHubToken();
      if (!token) {
        return {
          success: false,
          message: 'GitHub token not found',
          timestamp: Date.now()
        };
      }

      // Prepare file path and content
      const path = `cookies/${domain.replace(/\./g, '_')}/cookies.json`;
      const content = JSON.stringify(encryptedData);
      const encodedContent = btoa(unescape(encodeURIComponent(content))); // Base64 encode

      // Check if file exists to get SHA for update
      let sha = '';
      try {
        const fileResponse = await fetch(`${this.GITHUB_CONFIG.baseUrl}${this.GITHUB_CONFIG.contentEndpoint}/${path}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        if (fileResponse.ok) {
          const fileData = await fileResponse.json();
          sha = fileData.sha;
        }
      } catch (error) {
        // File likely doesn't exist, which is fine
        console.log('File does not exist yet, will create:', path);
      }

      // Create or update the file
      const body: any = {
        message: `Update cookies for ${domain}`,
        content: encodedContent,
        branch: this.GITHUB_CONFIG.defaultBranch
      };

      // Add SHA if updating existing file
      if (sha) {
        body.sha = sha;
      }

      // Make the API request
      const response = await fetch(`${this.GITHUB_CONFIG.baseUrl}${this.GITHUB_CONFIG.contentEndpoint}/${path}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          message: `GitHub API error: ${response.status} - ${errorData.message || 'Unknown error'}`,
          timestamp: Date.now()
        };
      }

      // Update last sync time
      this.config.lastSync = Date.now();
      await this.saveConfig();

      return {
        success: true,
        message: `Successfully synced cookies for ${domain}`,
        timestamp: Date.now(),
        syncedItems: 1
      };
    } catch (error) {
      console.error('GitHub upload error:', error);
      return {
        success: false,
        message: `Sync failed: ${(error as Error).message}`,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Download encrypted cookie data from GitHub
   */
  async downloadCookies(domain: string): Promise<{ success: boolean; data?: EncryptedData; message: string }> {
    try {
      const token = await this.getGitHubToken();
      if (!token) {
        return {
          success: false,
          message: 'GitHub token not found'
        };
      }

      const path = `cookies/${domain.replace(/\./g, '_')}/cookies.json`;
      const response = await fetch(`${this.GITHUB_CONFIG.baseUrl}${this.GITHUB_CONFIG.contentEndpoint}/${path}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        return {
          success: false,
          message: `GitHub API error: ${response.status} - ${response.statusText}`
        };
      }

      const fileData = await response.json();
      const content = decodeURIComponent(escape(atob(fileData.content)));
      const cookieData = JSON.parse(content) as EncryptedData;

      return {
        success: true,
        data: cookieData,
        message: 'Successfully downloaded cookies'
      };
    } catch (error) {
      console.error('GitHub download error:', error);
      return {
        success: false,
        message: `Download failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Sync all domains configured for syncing
   */
  async syncAll(): Promise<SyncResult> {
    try {
      if (this.config.domains.length === 0) {
        return {
          success: true,
          message: 'No domains configured for syncing',
          timestamp: Date.now(),
          syncedItems: 0
        };
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Implement the actual syncing logic here
      // This would require integration with the CookieManager

      this.config.lastSync = Date.now();
      await this.saveConfig();

      return {
        success: errorCount === 0,
        message: errorCount === 0 
          ? `Successfully synced ${successCount} domains` 
          : `Sync completed with errors: ${errors.join('; ')}`,
        timestamp: Date.now(),
        syncedItems: successCount
      };
    } catch (error) {
      console.error('Sync all error:', error);
      return {
        success: false,
        message: `Sync failed: ${(error as Error).message}`,
        timestamp: Date.now(),
        syncedItems: 0
      };
    }
  }

  /**
   * Create or update metadata for a domain
   */
  async updateMetadata(domain: string, metadata: any): Promise<boolean> {
    try {
      const token = await this.getGitHubToken();
      if (!token) return false;

      const path = `cookies/${domain.replace(/\./g, '_')}/metadata.json`;
      const content = JSON.stringify({
        ...metadata,
        lastUpdated: Date.now()
      });
      const encodedContent = btoa(unescape(encodeURIComponent(content)));

      // Check if file exists to get SHA
      let sha = '';
      try {
        const fileResponse = await fetch(`${this.GITHUB_CONFIG.baseUrl}${this.GITHUB_CONFIG.contentEndpoint}/${path}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        if (fileResponse.ok) {
          const fileData = await fileResponse.json();
          sha = fileData.sha;
        }
      } catch (error) {
        // File doesn't exist, which is fine
      }

      // Prepare request body
      const body: any = {
        message: `Update metadata for ${domain}`,
        content: encodedContent,
        branch: this.GITHUB_CONFIG.defaultBranch
      };

      if (sha) {
        body.sha = sha;
      }

      // Make the request
      const response = await fetch(`${this.GITHUB_CONFIG.baseUrl}${this.GITHUB_CONFIG.contentEndpoint}/${path}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      return response.ok;
    } catch (error) {
      console.error('Metadata update error:', error);
      return false;
    }
  }

  /**
   * Get the sync configuration
   */
  getConfig(): SyncConfig {
    return this.config;
  }
} 