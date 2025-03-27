// background-loader.js
// This file serves as a bridge between the extension's UI and the service worker

// Import required modules
import { CookieManager } from './CookieManager.js';

// Create instances of required services
const cookieManager = new CookieManager();

// Track service worker registration
let serviceWorkerRegistration = null;

// Initialize service worker communication
async function initServiceWorker() {
  try {
    // Register the service worker
    serviceWorkerRegistration = await navigator.serviceWorker.register('./service-worker-loader.js');
    console.log('Service worker registered successfully');
    
    // Listen for messages from the service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      handleServiceWorkerMessage(event.data);
    });
    
    return true;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return false;
  }
}

// Handle messages from the service worker
function handleServiceWorkerMessage(message) {
  console.log('Message from service worker:', message);
  // Process service worker messages here
}

// Send message to service worker with response handling
async function sendToServiceWorker(type, data) {
  if (!serviceWorkerRegistration) {
    console.error('Service worker not registered');
    return { success: false, error: 'Service worker not available' };
  }
  
  return new Promise((resolve, reject) => {
    // Create a message channel for two-way communication
    const messageChannel = new MessageChannel();
    
    // Set up the response handler
    messageChannel.port1.onmessage = (event) => {
      resolve(event.data);
    };
    
    // If we have an active service worker, send the message
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(
        { type, data },
        [messageChannel.port2]
      );
    } else {
      // Fall back to direct functionality if service worker isn't available
      switch (type) {
        case 'syncDomain':
          cookieManager.syncToGitHub(data.domain)
            .then(resolve)
            .catch(reject);
          break;
        case 'restoreDomain':
          cookieManager.restoreFromGitHub(data.domain)
            .then(resolve)
            .catch(reject);
          break;
        case 'updateSyncConfig':
          updateSyncConfig(data.config)
            .then(resolve)
            .catch(reject);
          break;
        default:
          reject(new Error(`Unknown message type: ${type}`));
      }
    }
  });
}

// Handle sync config update (fallback implementation)
async function updateSyncConfig(config) {
  try {
    // Save the updated config
    await chrome.storage.sync.set({ syncConfig: config });
    return { success: true };
  } catch (error) {
    console.error('Config update error:', error);
    return { 
      success: false,
      error: error.message 
    };
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'syncDomain') {
    sendToServiceWorker('syncDomain', { domain: message.domain })
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
    sendToServiceWorker('restoreDomain', { domain: message.domain })
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
    sendToServiceWorker('updateSyncConfig', { config: message.config })
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

// Initialize the background loader
initServiceWorker().then(success => {
  if (success) {
    console.log('Background loader initialized successfully');
  } else {
    console.warn('Background loader initialized with warnings');
  }
}); 