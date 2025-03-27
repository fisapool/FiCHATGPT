/**
 * GitHub Cookie Debugger
 * 
 * This module helps debug issues with GitHub cookie loading in the BytesCookies extension.
 * Include this file in your extension for additional logging and debugging capabilities.
 */

class GitHubCookieDebugger {
  constructor() {
    this.logs = [];
    this.initialized = false;
    this.originalFunctions = {};
    
    // Configuration
    this.config = {
      logLevel: 'debug', // 'debug', 'info', 'warn', 'error'
      logToConsole: true,
      includeSensitiveData: false // Set to true only for local testing
    };
  }

  /**
   * Initialize the debugger by monkey patching necessary functions
   */
  init() {
    if (this.initialized) return;
    this.log('info', 'Initializing GitHub Cookie Debugger');
    
    try {
      this.monkeyPatchAPIs();
      this.setupListeners();
      this.initialized = true;
      this.log('info', 'GitHub Cookie Debugger initialized successfully');
    } catch (error) {
      this.log('error', `Failed to initialize debugger: ${error.message}`);
      console.error('Debugger initialization error:', error);
    }
  }

  /**
   * Monkey patch relevant APIs for debugging
   */
  monkeyPatchAPIs() {
    // If we're in a background script context with chrome API
    if (typeof chrome !== 'undefined' && chrome.cookies) {
      this.log('debug', 'Chrome cookies API detected, setting up patches');
      
      // Patch chrome.cookies.getAll
      this.originalFunctions.getAll = chrome.cookies.getAll;
      chrome.cookies.getAll = (details, callback) => {
        this.log('debug', `chrome.cookies.getAll called with domain: ${details.domain || 'all'}`);
        
        this.originalFunctions.getAll.call(chrome.cookies, details, (cookies) => {
          this.log('info', `Retrieved ${cookies.length} cookies for domain: ${details.domain || 'all'}`);
          
          // For debugging only, in production don't log actual cookie values
          if (this.config.includeSensitiveData && cookies.length > 0) {
            cookies.forEach(cookie => {
              this.log('debug', `Cookie found: ${cookie.domain}|${cookie.path}|${cookie.name}`);
            });
          }
          
          if (callback) callback(cookies);
        });
      };
      
      // Patch chrome.cookies.set
      this.originalFunctions.setCookie = chrome.cookies.set;
      chrome.cookies.set = (details, callback) => {
        this.log('debug', `chrome.cookies.set called for: ${details.domain}|${details.name}`);
        
        this.originalFunctions.setCookie.call(chrome.cookies, details, (cookie) => {
          if (cookie) {
            this.log('info', `Successfully set cookie: ${details.domain}|${details.name}`);
          } else {
            this.log('warn', `Failed to set cookie: ${details.domain}|${details.name} - ${chrome.runtime.lastError?.message || 'Unknown error'}`);
          }
          
          if (callback) callback(cookie);
        });
      };
    }

    // Patch fetch for GitHub API calls
    if (typeof fetch !== 'undefined') {
      this.originalFunctions.fetch = fetch;
      window.fetch = async (url, options) => {
        // Only intercept GitHub API calls
        if (typeof url === 'string' && url.includes('api.github.com')) {
          this.log('debug', `GitHub API request: ${url}`);
          
          try {
            const response = await this.originalFunctions.fetch(url, options);
            
            // Clone the response so we can read the body and still return a usable response
            const clonedResponse = response.clone();
            
            // Process response asynchronously to not block the return
            clonedResponse.text().then(text => {
              try {
                if (text) {
                  this.log('debug', `GitHub API response status: ${response.status}`);
                  
                  // Try to parse as JSON
                  try {
                    const data = JSON.parse(text);
                    if (data.message && response.status !== 200) {
                      this.log('warn', `GitHub API error: ${data.message}`);
                    }
                  } catch (e) {
                    // Not JSON or invalid JSON
                    this.log('debug', 'GitHub API response is not valid JSON');
                  }
                }
              } catch (error) {
                this.log('error', `Error processing GitHub API response: ${error.message}`);
              }
            }).catch(err => {
              this.log('error', `Error reading GitHub API response: ${err.message}`);
            });
            
            return response;
          } catch (error) {
            this.log('error', `GitHub API request failed: ${error.message}`);
            throw error;
          }
        }
        
        // Pass through for non-GitHub requests
        return this.originalFunctions.fetch(url, options);
      };
    }
  }

  /**
   * Set up event listeners for extension events
   */
  setupListeners() {
    // Listen for GitHub token changes
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync' && changes.githubToken) {
          const hasToken = !!changes.githubToken.newValue;
          this.log('info', `GitHub token ${hasToken ? 'updated' : 'removed'}`);
        }
      });
    }
    
    // Additional extension-specific event listeners can be added here
  }

  /**
   * Log a message to internal log and console if enabled
   */
  log(level, message) {
    const levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    // Only log if level is >= configured level
    if (levels[level] >= levels[this.config.logLevel]) {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
      
      // Add to internal logs
      this.logs.push(logEntry);
      
      // Log to console if enabled
      if (this.config.logToConsole) {
        switch (level) {
          case 'debug':
            console.debug(`🔍 ${logEntry}`);
            break;
          case 'info':
            console.info(`ℹ️ ${logEntry}`);
            break;
          case 'warn':
            console.warn(`⚠️ ${logEntry}`);
            break;
          case 'error':
            console.error(`❌ ${logEntry}`);
            break;
        }
      }
    }
    
    // Keep log size reasonable
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-500);
    }
  }

  /**
   * Get all logs for debugging
   */
  getLogs() {
    return this.logs;
  }

  /**
   * Test GitHub token validity
   */
  async testGitHubToken(token) {
    try {
      if (!token) {
        this.log('error', 'No GitHub token provided for testing');
        return { valid: false, message: 'No token provided' };
      }
      
      this.log('info', 'Testing GitHub token validity');
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        this.log('info', `GitHub token is valid for user: ${userData.login}`);
        return { 
          valid: true, 
          username: userData.login, 
          message: 'Token is valid'
        };
      } else {
        const errorData = await response.json();
        this.log('warn', `GitHub token validation failed: ${errorData.message}`);
        return { 
          valid: false, 
          message: errorData.message || 'Token validation failed'
        };
      }
    } catch (error) {
      this.log('error', `Error testing GitHub token: ${error.message}`);
      return { valid: false, message: error.message };
    }
  }

  /**
   * Check if a specific path exists in the GitHub repository
   */
  async checkGitHubPath(token, path) {
    if (!token) {
      this.log('error', 'No GitHub token provided for path check');
      return { exists: false, message: 'No token provided' };
    }
    
    try {
      const baseUrl = 'https://api.github.com';
      const repoPath = '/repos/fisapool/json/contents';
      const fullPath = `${baseUrl}${repoPath}/${path}`;
      
      this.log('info', `Checking if path exists in GitHub: ${path}`);
      const response = await fetch(fullPath, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (response.ok) {
        this.log('info', `Path exists in GitHub: ${path}`);
        const data = await response.json();
        return { exists: true, data, message: 'Path exists' };
      } else {
        this.log('warn', `Path does not exist in GitHub: ${path} (${response.status})`);
        return { exists: false, message: `Path check failed with status: ${response.status}` };
      }
    } catch (error) {
      this.log('error', `Error checking GitHub path: ${error.message}`);
      return { exists: false, message: error.message };
    }
  }
  
  /**
   * Export the debugger as a global object
   */
  static initialize() {
    if (typeof window !== 'undefined') {
      window.GitHubCookieDebugger = new GitHubCookieDebugger();
      window.GitHubCookieDebugger.init();
      return window.GitHubCookieDebugger;
    } else if (typeof global !== 'undefined') {
      global.GitHubCookieDebugger = new GitHubCookieDebugger();
      global.GitHubCookieDebugger.init();
      return global.GitHubCookieDebugger;
    }
    
    return new GitHubCookieDebugger();
  }
}

// Auto-initialize when script is loaded
const cookieDebugger = GitHubCookieDebugger.initialize(); 