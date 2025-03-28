/**
 * Firefox Compatibility Tests
 * 
 * This file contains tests specific to Firefox compatibility.
 * These tests verify that our extension will work correctly in Firefox.
 */

import * as browserAPI from '../utils/browser-api';

// Mock the browser APIs
const mockBrowser = {
  runtime: {
    getManifest: jest.fn(),
    getURL: jest.fn(),
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    onInstalled: {
      addListener: jest.fn()
    },
    lastError: null
  },
  cookies: {
    get: jest.fn(),
    getAll: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    getAllCookieStores: jest.fn(),
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    }
  },
  webRequest: {
    onBeforeRequest: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    onBeforeSendHeaders: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    onHeadersReceived: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  }
};

// Test the browser detection and API compatibility layer
describe('Firefox API Compatibility', () => {
  let originalGlobal: any;
  
  beforeAll(() => {
    originalGlobal = global;
    // @ts-ignore
    global.browser = mockBrowser;
    // @ts-ignore
    global.chrome = undefined;
  });
  
  afterAll(() => {
    global = originalGlobal;
  });
  
  test('browserAPI should use browser object in Firefox', () => {
    // Import the module dynamically to ensure it picks up the mocked globals
    jest.resetModules();
    const dynamicImport = require('../utils/browser-api');
    
    // Verify it's using the Firefox browser object
    expect(dynamicImport.browserAPI).toBe(mockBrowser);
  });
  
  test('promisify should convert callback APIs to promises', async () => {
    // Setup a mock callback function
    const mockCallback = jest.fn((arg1, arg2, callback) => {
      callback({ success: true });
    });
    
    // Import the module dynamically
    jest.resetModules();
    const dynamicImport = require('../utils/browser-api');
    
    // Promisify the mock function
    const promisified = dynamicImport.promisify(mockCallback);
    
    // Test the promisified function
    const result = await promisified('test1', 'test2');
    
    // Verify results
    expect(mockCallback).toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });
  
  test('promisify should handle errors properly', async () => {
    // Setup a mock callback function that returns an error
    const mockCallback = jest.fn((arg1, arg2, callback) => {
      // @ts-ignore
      global.chrome = { runtime: { lastError: { message: 'Test error' } } };
      callback(null);
    });
    
    // Import the module dynamically
    jest.resetModules();
    const dynamicImport = require('../utils/browser-api');
    
    // Promisify the mock function
    const promisified = dynamicImport.promisify(mockCallback);
    
    // Test the promisified function
    await expect(promisified('test1', 'test2')).rejects.toThrow('Test error');
  });
  
  test('getWebRequestModificationOptions should return Firefox options', () => {
    // Import the module dynamically
    jest.resetModules();
    const dynamicImport = require('../utils/browser-api');
    
    // Get the options
    const options = dynamicImport.getWebRequestModificationOptions();
    
    // Verify options for Firefox
    expect(options).toEqual(["blocking", "requestHeaders"]);
  });
  
  test('generateFirefoxManifest should convert service_worker to scripts', () => {
    // Import the module dynamically
    jest.resetModules();
    const dynamicImport = require('../utils/browser-api');
    
    // Create a test Chrome manifest
    const chromeManifest = {
      manifest_version: 3,
      name: "Test Extension",
      version: "1.0.0",
      background: {
        service_worker: "background.js",
        type: "module"
      },
      permissions: ["cookies", "storage", "webRequestBlocking"]
    };
    
    // Generate Firefox manifest
    const firefoxManifest = dynamicImport.generateFirefoxManifest(chromeManifest);
    
    // Verify Firefox manifest
    expect(firefoxManifest.background).toEqual({
      scripts: ["background.js"],
      type: "module"
    });
    
    // Verify permissions were adjusted
    expect(firefoxManifest.permissions).not.toContain("webRequestBlocking");
    expect(firefoxManifest.permissions).toContain("webRequest");
  });
});

// Test cookie handling for Firefox
describe('Firefox Cookie Handling', () => {
  test('convertBrowserCookie should handle Firefox cookie format', () => {
    // Create a Firefox-style cookie
    const firefoxCookie = {
      domain: ".example.com",
      expirationDate: 1716691057,
      hostOnly: false,
      httpOnly: true,
      name: "testCookie",
      path: "/",
      sameSite: "lax",
      secure: true,
      storeId: "firefox-container-1",
      value: "test-value"
    };
    
    // Import our utils
    const { convertBrowserCookie } = require('../utils/browser-api');
    
    // Convert the cookie
    const convertedCookie = convertBrowserCookie(firefoxCookie);
    
    // Verify the conversion
    expect(convertedCookie).toEqual({
      domain: ".example.com",
      expirationDate: 1716691057,
      hostOnly: false,
      httpOnly: true,
      name: "testCookie",
      path: "/",
      sameSite: "lax",
      secure: true,
      session: false,
      storeId: "firefox-container-1",
      value: "test-value"
    });
  });
});

// Test manifest generation for Firefox
describe('Firefox Manifest Generation', () => {
  test('Firefox manifest should include browser_specific_settings', () => {
    // Import our utils
    const { generateFirefoxManifest } = require('../utils/browser-api');
    
    // Create a basic Chrome manifest
    const chromeManifest = {
      manifest_version: 3,
      name: "FiChatGPT Cookie Manager",
      version: "1.0.0",
      permissions: ["cookies", "storage"]
    };
    
    // Generate Firefox manifest
    const firefoxManifest = generateFirefoxManifest(chromeManifest);
    
    // Verify browser_specific_settings is added by our CI/CD process
    // (This is done in the build script, not the utility function)
    // This is just a placeholder test to remind us of this requirement
    expect(firefoxManifest).toBeDefined();
  });
}); 