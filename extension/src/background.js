// This is a basic example of a background script
// It will run when the extension is installed or updated

// Log that the background script is running
console.log('Background script is running');

// Add a listener for the onInstalled event
chrome.runtime.onInstalled.addListener(function() {
  // Log that the extension has been installed
  console.log('Extension has been installed');
});

// Add a listener for the onMessage event
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  // Log the message
  console.log('Received message:', message);
  // Send a response
  sendResponse('Message received');
});

// Handle cookie operations
chrome.cookies.onChanged.addListener((changeInfo) => {
  const { cookie, removed } = changeInfo;
  console.log('Cookie changed:', cookie, 'removed:', removed);
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_COOKIES') {
    chrome.cookies.getAll({}, (cookies) => {
      sendResponse({ cookies });
    });
    return true; // Required for async response
  }
});