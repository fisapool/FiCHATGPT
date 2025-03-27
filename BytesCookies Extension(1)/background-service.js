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
  // Clear any existing alarms
  chrome.alarms.clear('syncAlarm');
  
  // If auto-sync is enabled, set up the alarm
  if (config.autoSync && config.domains.length > 0) {
    chrome.alarms.create('syncAlarm', {
      periodInMinutes: config.syncInterval,
      delayInMinutes: config.syncInterval // First sync after interval
    });
    
    console.log(`Auto-sync alarm configured for ${config.domains.length} domains every ${config.syncInterval} minutes`);
  }
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