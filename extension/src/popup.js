// Example of proper cookie handling in popup
function getCookies() {
  try {
    chrome.runtime.sendMessage({ type: 'GET_COOKIES' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError);
        return;
      }
      console.log('Cookies:', response.cookies);
    });
  } catch (error) {
    console.error('Failed to get cookies:', error);
  }
} 