// Service worker for FISABytes
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    Promise.resolve()
      .then(() => self.skipWaiting())
      .catch(error => console.error('Install error:', error))
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(
    Promise.resolve()
      .then(() => self.clients.claim())
      .catch(error => console.error('Activation error:', error))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      try {
        const request = event.request;
        // Try to fetch the resource
        const response = await fetch(request);
        
        // If successful, return the response
        if (response.ok) {
          return response;
        }
        
        // If the response wasn't ok, throw an error
        throw new Error(`HTTP error! status: ${response.status}`);
      } catch (error) {
        console.error('Fetch error:', error);
        // Return a basic response if fetch fails
        return new Response('Network error occurred', {
          status: 500,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    })()
  );
});

// Listen for messages from the extension
self.addEventListener('message', (event) => {
  const type = event.data.type;
  const data = event.data.data;
  
  if (type === 'syncDomain') {
    handleSyncDomain(data.domain)
      .then(result => {
        // Send the result back to the client
        event.ports[0].postMessage(result);
      });
  }
  
  if (type === 'restoreDomain') {
    handleRestoreDomain(data.domain)
      .then(result => {
        event.ports[0].postMessage(result);
      });
  }
  
  if (type === 'updateSyncConfig') {
    handleUpdateSyncConfig(data.config)
      .then(result => {
        event.ports[0].postMessage(result);
      });
  }
});

// Configure alarms for background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'syncCookies') {
    event.waitUntil(performBackgroundSync());
  }
});

// Handle periodic alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncAlarm') {
    chrome.storage.sync.get('syncConfig', function(data) {
      if (data.syncConfig) {
        performBackgroundSync(data.syncConfig);
      }
    });
  }
});

// Initialize sync configuration
chrome.storage.sync.get('syncConfig', function(data) {
  const config = data.syncConfig || {
    autoSync: false,
    syncInterval: 60,
    lastSync: 0,
    domains: []
  };
  
  // Create alarm if auto-sync is enabled
  if (config.autoSync && config.syncInterval > 0) {
    chrome.alarms.create('syncAlarm', {
      periodInMinutes: config.syncInterval
    });
  }
});

// Update alarm when sync config changes
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'sync' && changes.syncConfig) {
    const newConfig = changes.syncConfig.newValue;
    if (newConfig && newConfig.autoSync && newConfig.syncInterval) {
      chrome.alarms.clear('syncAlarm', function() {
        chrome.alarms.create('syncAlarm', {
          periodInMinutes: newConfig.syncInterval
        });
        console.log(`Sync alarm updated to ${newConfig.syncInterval} minutes`);
      });
    } else {
      // If auto sync disabled, clear the alarm
      chrome.alarms.clear('syncAlarm');
      console.log('Sync alarm cleared (auto-sync disabled)');
    }
  }
});

// Placeholder functions that will be replaced by your actual implementation
// These functions simulate the functionality from background-service.js
function handleSyncDomain(domain) {
  return new Promise(function(resolve) {
    console.log(`Service worker: handling sync for domain ${domain}`);
    // You'll need to implement the actual cookie sync functionality here
    // For now, we'll just return a simulated success response
    resolve({
      success: true,
      message: `Domain ${domain} synchronized`,
      timestamp: Date.now()
    });
  });
}

function handleRestoreDomain(domain) {
  return new Promise(function(resolve) {
    console.log(`Service worker: handling restore for domain ${domain}`);
    // You'll need to implement the actual cookie restore functionality here
    resolve({
      success: true,
      message: `Restored cookies for ${domain}`,
      imported: 5, // Simulated count
      timestamp: Date.now()
    });
  });
}

function handleUpdateSyncConfig(config) {
  return new Promise(function(resolve, reject) {
    // Save the updated config
    chrome.storage.sync.set({ syncConfig: config }, function() {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve({ success: true });
      }
    });
  });
}

function performBackgroundSync(config) {
  return new Promise(function(resolve) {
    if (!config || !config.domains || config.domains.length === 0) {
      console.log('No domains configured for sync');
      resolve();
      return;
    }
    
    console.log('Starting background sync for all domains');
    
    // Track results for each domain
    const results = {
      success: 0,
      failed: 0,
      domains: {}
    };
    
    // Counter for tracking domain processing
    let domainsProcessed = 0;
    
    // Process each domain
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
