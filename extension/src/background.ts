/**
 * FiChatGPT Cookie Manager - Background Service
 * Handles cookie operations in the background
 */
import { CookieManager } from './CookieManager';
import { Cookie } from './types';
import { AuthenticationService, LoginCredentials } from './security/AuthenticationService';
import { DeviceFingerprint } from './security/DeviceFingerprint';
import { LicenseManager } from './security/LicenseManager';
import * as browserAPI from './utils/browser-api';

// Create singleton instances of services
const cookieManager = new CookieManager();
const authService = new AuthenticationService();
const deviceFingerprint = new DeviceFingerprint();
const licenseManager = new LicenseManager(authService, deviceFingerprint);

// Initialize the services when the extension starts
async function initializeExtension() {
  try {
    await cookieManager.initialize();
    console.log('Cookie Manager initialized successfully');
    
    // Initialize auth service
    const authInitialized = await authService.initialize();
    console.log(`Authentication service initialized: ${authInitialized ? 'Successfully' : 'Not authenticated'}`);
    
    // Initialize device fingerprinting
    const fingerprintHash = await deviceFingerprint.initialize();
    console.log(`Device fingerprinting initialized with hash: ${fingerprintHash}`);
    
    // Initialize license manager
    const licenseInitialized = await licenseManager.initialize();
    console.log(`License manager initialized: ${licenseInitialized ? 'License active' : 'No active license'}`);
  } catch (error) {
    console.error('Failed to initialize services:', error);
  }
}

// Convert browser cookie to our Cookie format
function convertBrowserCookie(browserCookie: chrome.cookies.Cookie): Cookie {
  return browserAPI.convertBrowserCookie(browserCookie);
}

// Initialize extension when installed
browserAPI.runtime.onInstalled.addListener(() => {
  console.log('FiChatGPT Cookie Manager installed');
  initializeExtension();
});

// Handle cookie operations
browserAPI.cookies.onChanged.addListener(async (changeInfo) => {
  const { cookie, removed, cause } = changeInfo;
  
  // Convert browser cookie to our format
  const convertedCookie = convertBrowserCookie(cookie);
  
  if (removed) {
    // Delete cookie from our storage
    await cookieManager.deleteCookie({
      name: convertedCookie.name,
      domain: convertedCookie.domain,
      path: convertedCookie.path
    });
  } else {
    // Add cookie to our storage
    await cookieManager.addCookie(convertedCookie);
  }
});

// Intercept requests to ChatGPT to enhance session stability
browserAPI.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    // Only process if license is active
    if (!licenseManager.isLicenseActive()) {
      return { cancel: false };
    }

    // Check if this is a request to ChatGPT
    if (details.url.includes('chat.openai.com')) {
      // Clone the headers array so we can modify it
      const headers = details.requestHeaders?.slice() || [];
      
      // Add or modify headers to enhance stability and message capacity
      const customHeaders = [
        { name: 'X-Session-Type', value: 'premium' },
        { name: 'X-Message-Capacity', value: 'enhanced' },
        { name: 'X-FiChatGPT-Licensed', value: 'true' }
      ];
      
      for (const customHeader of customHeaders) {
        // Check if header already exists
        const existingHeader = headers.find(h => h.name.toLowerCase() === customHeader.name.toLowerCase());
        if (existingHeader) {
          existingHeader.value = customHeader.value;
        } else {
          headers.push(customHeader);
        }
      }
      
      return { requestHeaders: headers };
    }
    
    return { cancel: false };
  },
  { urls: ["*://chat.openai.com/*"] },
  browserAPI.getWebRequestModificationOptions()
);

// Handle messages from popup
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const handleRequest = async () => {
    try {
      if (request.type === 'GET_ALL_COOKIES') {
        const cookies = cookieManager.getCookies();
        sendResponse({ success: true, cookies });
      }
      else if (request.type === 'GET_DOMAIN_COOKIES') {
        const cookies = cookieManager.getCookiesForDomain(request.domain);
        sendResponse({ success: true, cookies });
      }
      else if (request.type === 'EXPORT_COOKIES') {
        const exportData = await cookieManager.exportCookies();
        sendResponse({ success: true, data: exportData });
      }
      else if (request.type === 'IMPORT_COOKIES') {
        const success = await cookieManager.importCookies(request.data);
        sendResponse({ success });
      }
      else if (request.type === 'UPDATE_SETTINGS') {
        await cookieManager.saveSettings(request.settings);
        sendResponse({ success: true });
      }
      else if (request.type === 'GET_SETTINGS') {
        const settings = cookieManager.getSettings();
        sendResponse({ success: true, settings });
      }
      // Authentication related handlers
      else if (request.type === 'LOGIN') {
        const credentials: LoginCredentials = request.credentials;
        const success = await authService.login(credentials);
        sendResponse({ success });
      }
      else if (request.type === 'LOGOUT') {
        const success = await authService.logout();
        sendResponse({ success });
      }
      else if (request.type === 'CHECK_AUTH') {
        const isAuthenticated = authService.isAuthenticated();
        sendResponse({ success: true, isAuthenticated });
      }
      else if (request.type === 'GET_AUTH_TOKEN') {
        const token = authService.getAuthToken();
        sendResponse({ success: true, token });
      }
      // Device fingerprinting related handlers
      else if (request.type === 'GET_DEVICE_FINGERPRINT') {
        const fingerprintHash = deviceFingerprint.getFingerprint();
        sendResponse({ success: true, fingerprint: fingerprintHash });
      }
      else if (request.type === 'REGENERATE_FINGERPRINT') {
        const fingerprintHash = await deviceFingerprint.generateFingerprint();
        sendResponse({ success: true, fingerprint: fingerprintHash });
      }
      // License related handlers
      else if (request.type === 'ACTIVATE_LICENSE') {
        const success = await licenseManager.activateLicense(request.licenseKey);
        sendResponse({ 
          success,
          license: success ? licenseManager.getLicense() : null
        });
      }
      else if (request.type === 'DEACTIVATE_LICENSE') {
        const success = await licenseManager.deactivateLicense();
        sendResponse({ success });
      }
      else if (request.type === 'TRANSFER_LICENSE') {
        const success = await licenseManager.transferLicense();
        sendResponse({ 
          success,
          license: success ? licenseManager.getLicense() : null
        });
      }
      else if (request.type === 'GET_LICENSE') {
        const license = licenseManager.getLicense();
        const isActive = licenseManager.isLicenseActive();
        sendResponse({ 
          success: true,
          license,
          isActive,
          tier: licenseManager.getLicenseTier(),
          transfersRemaining: licenseManager.getTransfersRemaining()
        });
      }
      else {
        sendResponse({ success: false, error: 'Unknown request type' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: (error as Error).message });
    }
  };

  handleRequest();
  return true; // Required for async response
});

// Initialize when the background script loads
initializeExtension(); 