// Import necessary classes
import { CookieManager } from './CookieManager';
import { SyncConfig } from './security/GitHubSyncManager';

// Create instances of required services
const cookieManager = new CookieManager();

// Track sync interval timer ID
let syncIntervalId = null;

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'syncDomain') {
    handleSyncDomain(message.domain).then(sendResponse);
    return true; // Indicate async response
  }
  
  if (message.action === 'restoreDomain') {
    handleRestoreDomain(message.domain).then(sendResponse);
    return true; // Indicate async response
  }
  
  if (message.action === 'updateSyncConfig') {
    handleUpdateSyncConfig(message.config).then(sendResponse);
    return true; // Indicate async response
  }
});

// Handle domain sync request
async function handleSyncDomain(domain) {
  try {
    console.log(`Background service: syncing domain ${domain}`);
    const result = await cookieManager.syncToGitHub(domain);
    return {
      success: result.success,
      message: result.message,
      timestamp: result.timestamp
    };
  } catch (error) {
    console.error('Background sync error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error in background sync',
      timestamp: Date.now()
    };
  }
}

// Handle domain restore request
async function handleRestoreDomain(domain) {
  try {
    console.log(`Background service: restoring domain ${domain}`);
    const result = await cookieManager.restoreFromGitHub(domain);
    if (result.success && result.metadata.imported > 0) {
      // Check if any active tabs match the domain
      chrome.tabs.query({}, function(tabs) {
        tabs.forEach(tab => {
          if (tab.url) {
            try {
              const tabUrl = new URL(tab.url);
              if (tabUrl.hostname === domain || tabUrl.hostname.endsWith('.' + domain)) {
                chrome.tabs.reload(tab.id);
              }
            } catch (e) {
              // Invalid URL, ignore
            }
          }
        });
      });
    }
    return {
      success: result.success,
      message: `Restored ${result.metadata.imported} cookies`,
      imported: result.metadata.imported,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Background restore error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error in background restore',
      timestamp: Date.now()
    };
  }
}

// Handle sync config update
async function handleUpdateSyncConfig(config) {
  try {
    // Save the updated config
    await chrome.storage.sync.set({ syncConfig: config });
    
    // Configure auto-sync if enabled
    setupAutoSync(config);
    
    return { success: true };
  } catch (error) {
    console.error('Config update error:', error);
    return { 
      success: false,
      error: error.message 
    };
  }
}

// Configure auto-sync based on configuration
function setupAutoSync(config) {
  // Clear any existing interval
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
  
  // If auto-sync is enabled, set up the interval
  if (config.autoSync && config.domains.length > 0) {
    // Convert minutes to milliseconds
    const intervalMs = config.syncInterval * 60 * 1000;
    
    syncIntervalId = setInterval(async () => {
      await performAutoSync(config);
    }, intervalMs);
    
    console.log(`Auto-sync configured for ${config.domains.length} domains every ${config.syncInterval} minutes`);
  }
}

// Perform auto-sync for all configured domains
async function performAutoSync(config) {
  console.log('Starting auto-sync for all domains');
  
  // Track results for each domain
  const results = {
    success: 0,
    failed: 0,
    domains: {}
  };
  
  // Sync each domain
  for (const domain of config.domains) {
    try {
      const result = await cookieManager.syncToGitHub(domain);
      
      results.domains[domain] = {
        success: result.success,
        message: result.message,
        timestamp: result.timestamp
      };
      
      if (result.success) {
        results.success++;
      } else {
        results.failed++;
      }
    } catch (error) {
      results.domains[domain] = {
        success: false,
        message: error.message || 'Unknown error',
        timestamp: Date.now()
      };
      results.failed++;
    }
  }
  
  // Update last sync time
  const updatedConfig = { ...config, lastSync: Date.now() };
  await chrome.storage.sync.set({ syncConfig: updatedConfig });
  
  console.log(`Auto-sync completed: ${results.success} succeeded, ${results.failed} failed`);
  return results;
}

// Initialize background service
async function initializeBackgroundService() {
  try {
    // Load sync configuration
    const data = await chrome.storage.sync.get('syncConfig');
    const config = data.syncConfig || {
      autoSync: false,
      syncInterval: 60,
      lastSync: 0,
      domains: []
    };
    
    // Set up auto-sync if enabled
    setupAutoSync(config);
    
    console.log('Background service initialized');
  } catch (error) {
    console.error('Background service initialization error:', error);
  }
}

// Initialize the service
initializeBackgroundService();

// Listen for alarm events (more reliable than setInterval for background tasks)
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncAlarm') {
    chrome.storage.sync.get('syncConfig', async (data) => {
      if (data.syncConfig) {
        await performAutoSync(data.syncConfig);
      }
    });
  }
}); 