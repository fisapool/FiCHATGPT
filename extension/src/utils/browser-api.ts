/**
 * Cross-browser compatibility layer
 * 
 * This utility provides a unified API for both Chrome and Firefox extensions.
 * It detects the browser environment and provides appropriate implementations
 * for each browser's extension APIs.
 */

// TypeScript global declaration for Firefox's browser API
declare const browser: typeof chrome;

// Determine which browser API object to use
export const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Type definitions to help with API compatibility
type ChromeCallbackFunction<T> = (result: T) => void;

/**
 * Converts Chrome-style callback APIs to Promise-based APIs (for consistency with Firefox)
 * @param chromeFunction The Chrome API function that takes a callback
 * @returns A Promise-wrapped version of the function
 */
export function promisify<T>(
  chromeFunction: (...args: any[]) => void,
  thisArg = null
): (...args: any[]) => Promise<T> {
  return (...args: any[]): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      chromeFunction.apply(thisArg, [
        ...args,
        (result: T) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(result);
          }
        },
      ]);
    });
  };
}

/**
 * Cookie API compatibility layer
 */
export const cookies = {
  get: browserAPI.cookies.get,
  getAll: browserAPI.cookies.getAll,
  set: browserAPI.cookies.set,
  remove: browserAPI.cookies.remove,
  getAllCookieStores: browserAPI.cookies.getAllCookieStores,
  onChanged: {
    addListener: browserAPI.cookies.onChanged.addListener,
    removeListener: browserAPI.cookies.onChanged.removeListener
  }
};

/**
 * Runtime API compatibility layer
 */
export const runtime = {
  getManifest: browserAPI.runtime.getManifest,
  getURL: browserAPI.runtime.getURL,
  sendMessage: browserAPI.runtime.sendMessage,
  onMessage: {
    addListener: browserAPI.runtime.onMessage.addListener,
    removeListener: browserAPI.runtime.onMessage.removeListener
  },
  onInstalled: {
    addListener: browserAPI.runtime.onInstalled.addListener
  }
};

/**
 * Storage API compatibility layer
 */
export const storage = {
  local: {
    get: browserAPI.storage.local.get,
    set: browserAPI.storage.local.set,
    remove: browserAPI.storage.local.remove,
    clear: browserAPI.storage.local.clear
  },
  sync: {
    get: browserAPI.storage.sync.get,
    set: browserAPI.storage.sync.set,
    remove: browserAPI.storage.sync.remove,
    clear: browserAPI.storage.sync.clear
  }
};

/**
 * Web Request API compatibility layer
 */
export const webRequest = {
  onBeforeRequest: {
    addListener: browserAPI.webRequest.onBeforeRequest.addListener,
    removeListener: browserAPI.webRequest.onBeforeRequest.removeListener
  },
  onBeforeSendHeaders: {
    addListener: browserAPI.webRequest.onBeforeSendHeaders.addListener,
    removeListener: browserAPI.webRequest.onBeforeSendHeaders.removeListener
  },
  onHeadersReceived: {
    addListener: browserAPI.webRequest.onHeadersReceived.addListener,
    removeListener: browserAPI.webRequest.onHeadersReceived.removeListener
  }
};

/**
 * Tabs API compatibility layer
 */
export const tabs = {
  query: browserAPI.tabs.query,
  create: browserAPI.tabs.create,
  update: browserAPI.tabs.update,
  get: browserAPI.tabs.get,
  getCurrent: browserAPI.tabs.getCurrent
};

/**
 * Converts a Chrome cookie to our internal Cookie format
 * Works with both Chrome and Firefox cookie objects
 */
export function convertBrowserCookie(browserCookie: any): any {
  return {
    domain: browserCookie.domain,
    expirationDate: browserCookie.expirationDate,
    hostOnly: browserCookie.hostOnly,
    httpOnly: browserCookie.httpOnly,
    name: browserCookie.name,
    path: browserCookie.path,
    sameSite: browserCookie.sameSite as 'no_restriction' | 'lax' | 'strict',
    secure: browserCookie.secure,
    session: !browserCookie.expirationDate,
    storeId: browserCookie.storeId,
    value: browserCookie.value
  };
}

/**
 * Fix for Firefox's different approach to web request modifications
 */
export function getWebRequestModificationOptions(): any {
  // Different options are needed for Firefox vs Chrome
  if (typeof browser !== 'undefined') {
    return ["blocking", "requestHeaders"];
  } else {
    return {
      urls: ["*://chat.openai.com/*"],
      types: ["main_frame", "sub_frame", "xmlhttprequest"],
    };
  }
}

/**
 * Create a Firefox-compatible manifest.json if needed
 * This can be used during the build process
 */
export function generateFirefoxManifest(chromeManifest: any): any {
  // Clone the Chrome manifest
  const firefoxManifest = { ...chromeManifest };
  
  // Firefox-specific adjustments
  if (firefoxManifest.background && firefoxManifest.background.service_worker) {
    // Firefox doesn't support service_worker in MV3 the same way
    firefoxManifest.background = {
      scripts: [firefoxManifest.background.service_worker],
      type: "module"
    };
  }
  
  // Firefox requires explicit content_scripts array
  if (!firefoxManifest.content_scripts) {
    firefoxManifest.content_scripts = [];
  }
  
  // Convert webRequestBlocking permission
  if (firefoxManifest.permissions && 
      firefoxManifest.permissions.includes('webRequestBlocking')) {
    // Firefox uses a different approach for request blocking
    firefoxManifest.permissions = firefoxManifest.permissions.filter(
      (p: string) => p !== 'webRequestBlocking'
    );
    
    if (!firefoxManifest.permissions.includes('webRequest')) {
      firefoxManifest.permissions.push('webRequest');
    }
  }
  
  return firefoxManifest;
} 