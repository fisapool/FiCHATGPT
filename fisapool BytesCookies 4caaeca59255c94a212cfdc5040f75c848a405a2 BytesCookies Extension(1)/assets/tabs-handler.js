document.addEventListener('DOMContentLoaded', function() {
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  function switchTab(tabId) {
    // Hide all tab contents
    tabContents.forEach(content => {
      content.classList.remove('active');
    });
    
    // Deactivate all tabs
    tabs.forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Activate the selected tab
    const selectedTab = document.querySelector(`.tab[data-tab="${tabId}"]`);
    if (selectedTab) {
      selectedTab.classList.add('active');
    }
    
    // Show the selected tab content
    const selectedContent = document.getElementById(`${tabId}-tab`);
    if (selectedContent) {
      selectedContent.classList.add('active');
    }
  }
  
  // Add click event to each tab
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab');
      switchTab(tabId);
    });
  });
  
  // Initialize - set the active tab from storage or default to 'cookies'
  chrome.storage.local.get(['activeTab'], function(result) {
    const activeTab = result.activeTab || 'cookies';
    switchTab(activeTab);
  });
  
  // Save active tab when changed
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab');
      chrome.storage.local.set({ activeTab: tabId });
    });
  });
}); 