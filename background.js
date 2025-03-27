// Initialize extension when installed
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
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