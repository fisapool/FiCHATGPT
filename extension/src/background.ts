/**
 * FiChatGPT Cookie Manager - Background Service
 * Handles cookie operations in the background
 */
import { CookieManager } from './CookieManager';
import { Cookie } from './types';

// Create a singleton instance of the CookieManager
const cookieManager = new CookieManager();

// Initialize the manager when the extension starts
async function initializeExtension() {
  try {
    await cookieManager.initialize();
    console.log('Cookie Manager initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Cookie Manager:', error);
  }
}

// Convert Chrome cookie to our Cookie format
function convertChromeCookie(chromeCookie: chrome.cookies.Cookie): Cookie {
  return {
    domain: chromeCookie.domain,
    expirationDate: chromeCookie.expirationDate,
    hostOnly: chromeCookie.hostOnly,
    httpOnly: chromeCookie.httpOnly,
    name: chromeCookie.name,
    path: chromeCookie.path,
    sameSite: chromeCookie.sameSite as 'no_restriction' | 'lax' | 'strict',
    secure: chromeCookie.secure,
    session: !chromeCookie.expirationDate,
    storeId: chromeCookie.storeId,
    value: chromeCookie.value
  };
}

// Initialize extension when installed
chrome.runtime.onInstalled.addListener(() => {
  console.log('FiChatGPT Cookie Manager installed');
  initializeExtension();
});

// Handle cookie operations
chrome.cookies.onChanged.addListener(async (changeInfo) => {
  const { cookie, removed, cause } = changeInfo;
  
  // Convert Chrome cookie to our format
  const convertedCookie = convertChromeCookie(cookie);
  
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

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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