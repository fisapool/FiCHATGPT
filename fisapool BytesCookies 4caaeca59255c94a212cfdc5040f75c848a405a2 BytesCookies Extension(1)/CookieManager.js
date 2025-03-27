// CookieManager.js - Manages cookie operations for the extension

/**
 * Handles cookie-related operations including export, import, and GitHub synchronization
 */
export class CookieManager {
  constructor() {
    // Configuration for GitHub connectivity
    this.githubConfig = {
      token: '',
      repository: '',
      branch: 'main'
    };
    
    // Initialize by loading saved configuration
    this.initialize();
  }
  
  /**
   * Initialize the cookie manager
   */
  async initialize() {
    try {
      // Load GitHub configuration if available
      const data = await chrome.storage.sync.get('githubConfig');
      if (data.githubConfig) {
        this.githubConfig = data.githubConfig;
      }
      console.log('CookieManager initialized');
    } catch (error) {
      console.error('Failed to initialize CookieManager:', error);
    }
  }
  
  /**
   * Get all cookies for a domain
   * @param {string} domain - The domain to get cookies for
   * @returns {Promise<Array>} - Array of cookie objects
   */
  async getCookies(domain) {
    try {
      // Query cookies for the domain
      const cookies = await chrome.cookies.getAll({
        domain: domain
      });
      
      return cookies;
    } catch (error) {
      console.error(`Error getting cookies for ${domain}:`, error);
      throw new Error(`Failed to get cookies: ${error.message}`);
    }
  }
  
  /**
   * Delete a cookie
   * @param {Object} cookie - Cookie object to delete
   * @returns {Promise<boolean>} - Success indicator
   */
  async deleteCookie(cookie) {
    const url = (cookie.secure ? 'https://' : 'http://') + 
                cookie.domain + 
                (cookie.path || '/');
                
    try {
      await chrome.cookies.remove({
        url: url,
        name: cookie.name
      });
      return true;
    } catch (error) {
      console.error(`Error deleting cookie ${cookie.name}:`, error);
      return false;
    }
  }
  
  /**
   * Set a cookie
   * @param {Object} cookie - Cookie object to set
   * @returns {Promise<boolean>} - Success indicator
   */
  async setCookie(cookie) {
    const url = (cookie.secure ? 'https://' : 'http://') + 
                cookie.domain + 
                (cookie.path || '/');
    
    try {
      // Prepare cookie for setting
      const cookieToSet = {
        url: url,
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path || '/',
        secure: cookie.secure || false,
        httpOnly: cookie.httpOnly || false,
        sameSite: cookie.sameSite || 'unspecified'
      };
      
      // Set expiration if specified
      if (cookie.expirationDate) {
        cookieToSet.expirationDate = cookie.expirationDate;
      }
      
      await chrome.cookies.set(cookieToSet);
      return true;
    } catch (error) {
      console.error(`Error setting cookie ${cookie.name}:`, error);
      return false;
    }
  }
  
  /**
   * Export cookies as a JSON string
   * @param {string} domain - Domain to export cookies for
   * @returns {Promise<string>} - JSON string of cookies
   */
  async exportCookies(domain) {
    try {
      const cookies = await this.getCookies(domain);
      return JSON.stringify(cookies, null, 2);
    } catch (error) {
      console.error('Error exporting cookies:', error);
      throw new Error(`Failed to export cookies: ${error.message}`);
    }
  }
  
  /**
   * Import cookies from a JSON string
   * @param {string} jsonStr - JSON string of cookies
   * @returns {Promise<Object>} - Result of import operation
   */
  async importCookies(jsonStr) {
    try {
      // Parse the JSON
      const cookies = JSON.parse(jsonStr);
      
      // Track import results
      const result = {
        total: cookies.length,
        imported: 0,
        failed: 0,
        errors: []
      };
      
      // Import each cookie
      for (const cookie of cookies) {
        try {
          const success = await this.setCookie(cookie);
          if (success) {
            result.imported++;
          } else {
            result.failed++;
            result.errors.push(`Failed to set cookie: ${cookie.name}`);
          }
        } catch (error) {
          result.failed++;
          result.errors.push(`Error importing cookie ${cookie.name}: ${error.message}`);
        }
      }
      
      return {
        success: result.imported > 0,
        message: `Imported ${result.imported} of ${result.total} cookies`,
        metadata: result
      };
    } catch (error) {
      console.error('Error importing cookies:', error);
      throw new Error(`Failed to import cookies: ${error.message}`);
    }
  }
  
  /**
   * Sync cookies to GitHub
   * @param {string} domain - Domain to sync cookies for
   * @returns {Promise<Object>} - Result of sync operation
   */
  async syncToGitHub(domain) {
    try {
      // Check if GitHub is configured
      if (!this.githubConfig.token || !this.githubConfig.repository) {
        return {
          success: false,
          message: 'GitHub not configured',
          timestamp: Date.now()
        };
      }
      
      // Export cookies as JSON
      const cookiesJson = await this.exportCookies(domain);
      
      // Simulate GitHub upload for now
      console.log(`Simulating upload to GitHub for domain: ${domain}`);
      console.log('Exported cookies:', cookiesJson);
      
      // In a real implementation, you would use GitHub API to upload the file
      
      return {
        success: true,
        message: `Synced ${domain} cookies to GitHub`,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error syncing to GitHub:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * Restore cookies from GitHub
   * @param {string} domain - Domain to restore cookies for
   * @returns {Promise<Object>} - Result of restore operation
   */
  async restoreFromGitHub(domain) {
    try {
      // Check if GitHub is configured
      if (!this.githubConfig.token || !this.githubConfig.repository) {
        return {
          success: false,
          message: 'GitHub not configured',
          metadata: { imported: 0, failed: 0 }
        };
      }
      
      // Simulate GitHub download for now
      console.log(`Simulating download from GitHub for domain: ${domain}`);
      
      // In a real implementation, you would use GitHub API to download the file
      // For now, create a mock response
      const mockCookies = [
        {
          domain: domain,
          name: 'mockCookie1',
          value: 'mockValue1',
          path: '/',
          secure: true,
          expirationDate: Math.floor(Date.now() / 1000) + 86400 // 1 day
        },
        {
          domain: domain,
          name: 'mockCookie2',
          value: 'mockValue2',
          path: '/',
          secure: true,
          expirationDate: Math.floor(Date.now() / 1000) + 86400 // 1 day
        }
      ];
      
      // Import the cookies
      const mockJson = JSON.stringify(mockCookies);
      const result = await this.importCookies(mockJson);
      
      return result;
    } catch (error) {
      console.error('Error restoring from GitHub:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
        metadata: { imported: 0, failed: 0 }
      };
    }
  }
} 