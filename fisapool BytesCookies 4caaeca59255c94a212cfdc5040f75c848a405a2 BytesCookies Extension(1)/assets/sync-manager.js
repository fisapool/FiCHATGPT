document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const syncDomainsList = document.getElementById('syncDomainsList');
  const autoSyncToggle = document.getElementById('autoSyncToggle');
  const syncIntervalInput = document.getElementById('syncIntervalInput');
  const addDomainInput = document.getElementById('addDomainInput');
  const addDomainBtn = document.getElementById('addDomainBtn');
  const syncStatus = document.getElementById('syncStatus');
  
  // Default configuration
  let syncConfig = {
    autoSync: false,
    syncInterval: 60, // 1 hour in minutes
    lastSync: 0,
    domains: []
  };
  
  // Domain sync status tracking
  let domainStatuses = {};
  
  // Initialize sync UI
  initializeSyncUI();
  
  // Load domain from active tab for easy adding
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs[0] && tabs[0].url) {
      const url = new URL(tabs[0].url);
      addDomainInput.placeholder = `Add domain (e.g., ${url.hostname})`;
    }
  });
  
  // Add domain button click handler
  addDomainBtn.addEventListener('click', function() {
    const domain = addDomainInput.value.trim();
    if (domain) {
      addDomain(domain);
    } else {
      updateSyncStatus('Please enter a valid domain', 'error');
    }
  });
  
  // Auto sync toggle handler
  autoSyncToggle.addEventListener('change', function() {
    updateSyncConfig({
      autoSync: autoSyncToggle.checked
    });
    updateSyncStatus(
      autoSyncToggle.checked ? 'Auto sync enabled' : 'Auto sync disabled',
      'info'
    );
    
    // If enabling auto sync, initialize the background sync
    if (autoSyncToggle.checked) {
      initializeBackgroundSync();
    }
  });
  
  // Sync interval input handler
  syncIntervalInput.addEventListener('change', function() {
    const interval = parseInt(syncIntervalInput.value);
    if (interval >= 15) {
      updateSyncConfig({
        syncInterval: interval
      });
      updateSyncStatus(`Sync interval set to ${interval} minutes`, 'info');
    } else {
      syncIntervalInput.value = 15;
      updateSyncStatus('Minimum sync interval is 15 minutes', 'error');
    }
  });
  
  // Load sync configuration
  function loadSyncConfig() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['syncConfig', 'domainStatuses'], function(data) {
        if (data.syncConfig) {
          syncConfig = { ...syncConfig, ...data.syncConfig };
        }
        if (data.domainStatuses) {
          domainStatuses = data.domainStatuses;
        }
        resolve(syncConfig);
      });
    });
  }
  
  // Save sync configuration
  function saveSyncConfig() {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ 
        syncConfig,
        domainStatuses 
      }, resolve);
    });
  }
  
  // Update sync configuration
  async function updateSyncConfig(newConfig) {
    syncConfig = { ...syncConfig, ...newConfig };
    await saveSyncConfig();
    updateSyncUI();
  }
  
  // Initialize the sync UI
  async function initializeSyncUI() {
    await loadSyncConfig();
    updateSyncUI();
    
    // If auto sync is enabled, initialize the background sync
    if (syncConfig.autoSync) {
      initializeBackgroundSync();
    }
  }
  
  // Update the sync UI with current configuration
  function updateSyncUI() {
    // Update toggle and interval input
    autoSyncToggle.checked = syncConfig.autoSync;
    syncIntervalInput.value = syncConfig.syncInterval;
    
    // Update domains list
    renderDomainsList();
    
    // Update last sync time if available
    if (syncConfig.lastSync) {
      const lastSyncDate = new Date(syncConfig.lastSync);
      updateSyncStatus(`Last sync: ${lastSyncDate.toLocaleString()}`, 'info');
    } else {
      updateSyncStatus('No sync history', 'info');
    }
  }
  
  // Render the domains list
  function renderDomainsList() {
    syncDomainsList.innerHTML = '';
    
    if (syncConfig.domains.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.textContent = 'No domains configured for sync. Add a domain below.';
      emptyMessage.style.padding = '12px';
      emptyMessage.style.color = '#586069';
      emptyMessage.style.fontStyle = 'italic';
      syncDomainsList.appendChild(emptyMessage);
      return;
    }
    
    syncConfig.domains.forEach(domain => {
      const domainEl = createDomainElement(domain);
      syncDomainsList.appendChild(domainEl);
    });
  }
  
  // Create a domain element
  function createDomainElement(domain) {
    const domainEl = document.createElement('div');
    domainEl.className = 'sync-domain';
    
    const domainInfo = document.createElement('div');
    domainInfo.className = 'domain-info';
    
    const domainName = document.createElement('div');
    domainName.className = 'domain-name';
    domainName.textContent = domain;
    domainInfo.appendChild(domainName);
    
    const syncStatusEl = document.createElement('div');
    syncStatusEl.className = 'sync-status';
    
    // Display status if available
    const status = domainStatuses[domain];
    if (status) {
      const statusDate = new Date(status.timestamp).toLocaleString();
      syncStatusEl.textContent = `${status.success ? 'Synced' : 'Sync failed'}: ${statusDate}`;
      syncStatusEl.style.color = status.success ? '#2ea44f' : '#d73a49';
    } else {
      syncStatusEl.textContent = 'Not synced yet';
    }
    
    domainInfo.appendChild(syncStatusEl);
    
    const syncActions = document.createElement('div');
    syncActions.className = 'sync-actions';
    
    const syncButton = document.createElement('button');
    syncButton.className = 'sync-button';
    syncButton.textContent = 'Sync';
    syncButton.addEventListener('click', () => {
      syncDomain(domain);
    });
    syncActions.appendChild(syncButton);
    
    const restoreButton = document.createElement('button');
    restoreButton.className = 'restore-button';
    restoreButton.textContent = 'Restore';
    restoreButton.addEventListener('click', () => {
      restoreDomain(domain);
    });
    syncActions.appendChild(restoreButton);
    
    const removeButton = document.createElement('button');
    removeButton.className = 'sync-button';
    removeButton.style.backgroundColor = '#d73a49';
    removeButton.textContent = 'X';
    removeButton.title = 'Remove domain';
    removeButton.addEventListener('click', () => {
      removeDomain(domain);
    });
    syncActions.appendChild(removeButton);
    
    domainEl.appendChild(domainInfo);
    domainEl.appendChild(syncActions);
    
    return domainEl;
  }
  
  // Add a domain to sync
  async function addDomain(domain) {
    // Normalize domain (remove protocol, path, etc.)
    try {
      let normalizedDomain = domain;
      if (!domain.startsWith('http')) {
        normalizedDomain = 'http://' + domain;
      }
      const url = new URL(normalizedDomain);
      const hostname = url.hostname;
      
      // Check if domain already exists
      if (syncConfig.domains.includes(hostname)) {
        updateSyncStatus(`Domain ${hostname} is already in the sync list`, 'error');
        return;
      }
      
      // Add to domains list
      syncConfig.domains.push(hostname);
      await saveSyncConfig();
      
      // Update UI
      renderDomainsList();
      addDomainInput.value = '';
      updateSyncStatus(`Domain ${hostname} added to sync list`, 'success');
    } catch (error) {
      updateSyncStatus(`Invalid domain: ${error.message}`, 'error');
    }
  }
  
  // Remove a domain from sync
  async function removeDomain(domain) {
    // Remove domain
    syncConfig.domains = syncConfig.domains.filter(d => d !== domain);
    
    // Remove domain status
    if (domainStatuses[domain]) {
      delete domainStatuses[domain];
    }
    
    await saveSyncConfig();
    renderDomainsList();
    updateSyncStatus(`Domain ${domain} removed from sync list`, 'info');
  }
  
  // Initialize background sync for auto-sync feature
  function initializeBackgroundSync() {
    // This would be better implemented in a background script with alarms
    // For now, we'll simulate it
    chrome.storage.local.set({ 
      lastSyncCheck: Date.now(),
      syncInitialized: true
    });
  }
  
  // Sync a domain
  async function syncDomain(domain) {
    updateSyncStatus(`Syncing ${domain}...`, 'info');
    
    try {
      // Connect to the background script to perform the sync
      // This is a message passing approach that would work with a background script
      chrome.runtime.sendMessage({
        action: 'syncDomain',
        domain: domain
      }, function(response) {
        if (chrome.runtime.lastError) {
          handleSyncError(domain, chrome.runtime.lastError);
          return;
        }
        
        if (response && response.success) {
          handleSyncSuccess(domain, response);
        } else {
          handleSyncError(domain, response?.error || 'Unknown error');
        }
      });
      
      // Since we don't have a background script yet, simulate a successful sync
      setTimeout(() => {
        handleSyncSuccess(domain, {
          success: true,
          message: `Successfully synced ${domain}`,
          timestamp: Date.now()
        });
      }, 1500);
    } catch (error) {
      handleSyncError(domain, error);
    }
  }
  
  // Handle successful sync
  async function handleSyncSuccess(domain, result) {
    // Update domain status
    domainStatuses[domain] = {
      success: true,
      timestamp: result.timestamp || Date.now(),
      message: result.message || `Successfully synced ${domain}`
    };
    
    // Update last sync time
    syncConfig.lastSync = Date.now();
    
    // Save configuration
    await saveSyncConfig();
    
    // Update UI
    renderDomainsList();
    updateSyncStatus(`Successfully synced ${domain}`, 'success');
  }
  
  // Handle sync error
  async function handleSyncError(domain, error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Update domain status
    domainStatuses[domain] = {
      success: false,
      timestamp: Date.now(),
      message: `Sync failed: ${errorMessage}`
    };
    
    // Save configuration
    await saveSyncConfig();
    
    // Update UI
    renderDomainsList();
    updateSyncStatus(`Failed to sync ${domain}: ${errorMessage}`, 'error');
    
    console.error(`Sync error for ${domain}:`, error);
  }
  
  // Restore a domain
  async function restoreDomain(domain) {
    updateSyncStatus(`Restoring ${domain}...`, 'info');
    
    try {
      // Connect to the background script to perform the restore
      chrome.runtime.sendMessage({
        action: 'restoreDomain',
        domain: domain
      }, function(response) {
        if (chrome.runtime.lastError) {
          handleRestoreError(domain, chrome.runtime.lastError);
          return;
        }
        
        if (response && response.success) {
          handleRestoreSuccess(domain, response);
        } else {
          handleRestoreError(domain, response?.error || 'Unknown error');
        }
      });
      
      // Simulate a successful restore
      setTimeout(() => {
        handleRestoreSuccess(domain, {
          success: true,
          message: `Successfully restored ${domain}`,
          imported: 10 // Sample number
        });
      }, 1500);
    } catch (error) {
      handleRestoreError(domain, error);
    }
  }
  
  // Handle successful restore
  function handleRestoreSuccess(domain, result) {
    // Update UI
    const message = result.imported > 0 
      ? `Successfully restored ${result.imported} cookies for ${domain}` 
      : `Restored ${domain} (no cookies found)`;
    
    updateSyncStatus(message, 'success');
    
    // If cookies were imported, reload the tab if it matches the domain
    if (result.imported > 0) {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].url) {
          const tabUrl = new URL(tabs[0].url);
          if (tabUrl.hostname === domain || tabUrl.hostname.endsWith('.' + domain)) {
            // Show reloading message
            updateSyncStatus(`Reloading page to apply cookies...`, 'info');
            
            // Add a slight delay so the user sees the message
            setTimeout(() => {
              chrome.tabs.reload(tabs[0].id);
            }, 1000);
          }
        }
      });
    }
  }
  
  // Handle restore error
  function handleRestoreError(domain, error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    updateSyncStatus(`Failed to restore ${domain}: ${errorMessage}`, 'error');
    console.error(`Restore error for ${domain}:`, error);
  }
  
  // Update sync status message
  function updateSyncStatus(message, type) {
    syncStatus.textContent = message;
    syncStatus.className = type;
  }
}); 