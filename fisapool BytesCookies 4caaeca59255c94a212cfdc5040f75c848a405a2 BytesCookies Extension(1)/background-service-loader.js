// Background Service Loader
// This script is used to initialize the background service

// Track sync interval timer ID
let syncIntervalId = null;

// Listen for messages from the popup or content scripts
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log('Background received message:', message.action);
  
  if (message.action === 'syncDomain') {
    handleSyncDomain(message.domain)
      .then(sendResponse)
      .catch(error => {
        sendResponse({
          success: false,
          error: error.message || 'Unknown error',
          timestamp: Date.now()
        });
      });
    return true; // Indicate async response
  }
  
  if (message.action === 'restoreDomain') {
    handleRestoreDomain(message.domain)
      .then(sendResponse)
      .catch(error => {
        sendResponse({
          success: false,
          error: error.message || 'Unknown error',
          timestamp: Date.now()
        });
      });
    return true; // Indicate async response
  }
  
  if (message.action === 'updateSyncConfig') {
    handleUpdateSyncConfig(message.config)
      .then(sendResponse)
      .catch(error => {
        sendResponse({
          success: false,
          error: error.message || 'Unknown error'
        });
      });
    return true; // Indicate async response
  }
});

// Handle domain sync request
function handleSyncDomain(domain) {
  return new Promise(function(resolve, reject) {
    try {
      console.log(`Background service: syncing domain ${domain}`);
      
      // Get domain cookies
      chrome.cookies.getAll({ domain: domain }, function(cookies) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        
        // Simulate GitHub upload
        console.log(`Simulating upload for ${cookies.length} cookies for domain ${domain}`);
        
        resolve({
          success: true,
          message: `Synced ${cookies.length} cookies for ${domain}`,
          timestamp: Date.now()
        });
      });
    } catch (error) {
      console.error('Background sync error:', error);
      reject(error);
    }
  });
}

// Handle domain restore request
function handleRestoreDomain(domain) {
  return new Promise(function(resolve, reject) {
    try {
      console.log(`Background service: restoring domain ${domain}`);
      
      // Simulate cookies to restore
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
      
      // Set up counters for success tracking
      let cookiesProcessed = 0;
      let cookiesImported = 0;
      
      // Import each cookie
      mockCookies.forEach(function(cookie) {
        const url = (cookie.secure ? 'https://' : 'http://') + cookie.domain + (cookie.path || '/');
        
        const cookieToSet = {
          url: url,
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path || '/',
          secure: cookie.secure || false,
          httpOnly: cookie.httpOnly || false,
          expirationDate: cookie.expirationDate,
          sameSite: cookie.sameSite || 'unspecified'
        };
        
        chrome.cookies.set(cookieToSet, function() {
          cookiesProcessed++;
          
          if (!chrome.runtime.lastError) {
            cookiesImported++;
          } else {
            console.error('Error importing cookie:', chrome.runtime.lastError);
          }
          
          // If all cookies processed, send response
          if (cookiesProcessed === mockCookies.length) {
            // Check if any active tabs match the domain
            chrome.tabs.query({}, function(tabs) {
              tabs.forEach(function(tab) {
                if (tab.url && tab.url.includes(domain)) {
                  chrome.tabs.reload(tab.id);
                }
              });
              
              resolve({
                success: cookiesImported > 0,
                message: `Restored ${cookiesImported} cookies`,
                metadata: {
                  imported: cookiesImported,
                  failed: mockCookies.length - cookiesImported
                },
                timestamp: Date.now()
              });
            });
          }
        });
      });
      
      // If no cookies to process, resolve immediately
      if (mockCookies.length === 0) {
        resolve({
          success: false,
          message: 'No cookies found to restore',
          metadata: {
            imported: 0,
            failed: 0
          },
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Background restore error:', error);
      reject(error);
    }
  });
}

// Handle sync config update
function handleUpdateSyncConfig(config) {
  return new Promise(function(resolve, reject) {
    try {
      // Save the updated config
      chrome.storage.sync.set({ syncConfig: config }, function() {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        
        // Configure auto-sync if enabled
        setupAutoSync(config);
        
        resolve({ success: true });
      });
    } catch (error) {
      console.error('Config update error:', error);
      reject(error);
    }
  });
}

// Configure auto-sync based on configuration
function setupAutoSync(config) {
  // Clear any existing interval
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
  
  // Clear any existing alarm
  chrome.alarms.clear('syncAlarm', function() {
    // If auto-sync is enabled, set up the alarm
    if (config && config.autoSync && config.syncInterval > 0) {
      chrome.alarms.create('syncAlarm', {
        periodInMinutes: config.syncInterval
      });
      console.log(`Auto-sync configured for every ${config.syncInterval} minutes`);
    } else {
      console.log('Auto-sync disabled');
    }
  });
}

// Perform background sync for all domains
function performBackgroundSync(config) {
  if (!config || !config.domains || config.domains.length === 0) {
    console.log('No domains configured for sync');
    return Promise.resolve();
  }
  
  console.log(`Starting background sync for ${config.domains.length} domains`);
  
  return new Promise(function(resolve) {
    // Track results for each domain
    const results = {
      success: 0,
      failed: 0,
      domains: {}
    };
    
    // Track domains processed
    let domainsProcessed = 0;
    
    // Sync each domain
    config.domains.forEach(function(domain) {
      handleSyncDomain(domain)
        .then(function(result) {
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
        })
        .catch(function(error) {
          results.domains[domain] = {
            success: false,
            message: error.message || 'Unknown error',
            timestamp: Date.now()
          };
          results.failed++;
        })
        .finally(function() {
          domainsProcessed++;
          
          // If all domains processed, update config and resolve
          if (domainsProcessed === config.domains.length) {
            // Update last sync time
            const updatedConfig = Object.assign({}, config, { lastSync: Date.now() });
            
            chrome.storage.sync.set({ syncConfig: updatedConfig }, function() {
              console.log(`Background sync completed: ${results.success} succeeded, ${results.failed} failed`);
              resolve(results);
            });
          }
        });
    });
  });
}

// Listen for alarm events
chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name === 'syncAlarm') {
    chrome.storage.sync.get('syncConfig', function(data) {
      if (data.syncConfig) {
        performBackgroundSync(data.syncConfig);
      }
    });
  }
});

// Initialize background service
function initializeBackgroundService() {
  console.log('Initializing background service');
  
  // Load sync configuration
  chrome.storage.sync.get('syncConfig', function(data) {
    const config = data.syncConfig || {
      autoSync: false,
      syncInterval: 60,
      lastSync: 0,
      domains: []
    };
    
    // Set up auto-sync if enabled
    setupAutoSync(config);
    
    console.log('Background service initialized');
  });
}

// Initialize the service
initializeBackgroundService(); 