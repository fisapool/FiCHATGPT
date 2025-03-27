document.addEventListener('DOMContentLoaded', () => {
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');

  // Helper function to validate and format cookie data
  function validateAndFormatCookies(data) {
    // If string, try to parse it
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        throw new Error('Invalid JSON string');
      }
    }

    // Convert single object to array
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      data = [data];
    }

    // Ensure we have an array
    if (!Array.isArray(data)) {
      throw new Error('Cookie data must be an array or single object');
    }

    // Validate each cookie
    return data.filter(cookie => {
      if (!cookie || typeof cookie !== 'object') return false;
      if (!cookie.name || !cookie.domain) {
        console.warn('Skipping invalid cookie:', cookie);
        return false;
      }
      if (!cookie.path) cookie.path = '/';
      return true;
    });
  }

  function updateButtonStatus(button, status, message) {
    const buttonText = button.querySelector('.button-text');
    button.className = `action-button ${status}`;
    buttonText.textContent = message;
    buttonText.classList.add('status-message');
    
    setTimeout(() => {
      button.className = 'action-button';
      buttonText.textContent = button === exportBtn ? 'Export Cookies' : 'Import Cookies';
      buttonText.classList.remove('status-message');
    }, status === 'error' ? 3000 : 2000);
  }

  const GITHUB_CONFIG = {
    repo: 'fisapool/json',
    baseUrl: 'https://api.github.com',
    secretsEndpoint: '/repos/fisapool/json/actions/secrets'
  };

  async function fetchGitHubSecrets(token) {
    try {
      const response = await fetch(`${GITHUB_CONFIG.baseUrl}${GITHUB_CONFIG.secretsEndpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch secrets');
      }
      
      return await response.json();
    } catch (error) {
      console.error('GitHub API error:', error);
      throw new Error(`Failed to fetch cookies: ${error.message}`);
    }
  }

  // Add token validation specific to your repo
  async function validateGitHubToken(token) {
    try {
      const repoResponse = await fetch(`${GITHUB_CONFIG.baseUrl}/repos/${GITHUB_CONFIG.repo}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!repoResponse.ok) {
        throw new Error('No access to repository');
      }

      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  async function testGitHubConnection(token) {
    try {
      // Test basic authentication
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!userResponse.ok) {
        throw new Error('Authentication failed');
      }

      // Test repository access
      const repoResponse = await fetch('https://api.github.com/repos/fisapool/json', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!repoResponse.ok) {
        throw new Error('Repository access failed');
      }

      // Test secrets access
      const secretsResponse = await fetch('https://api.github.com/repos/fisapool/json/actions/secrets', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!secretsResponse.ok) {
        throw new Error('Secrets access failed');
      }

      return {
        success: true,
        message: 'Connection successful! All permissions verified.'
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
  }

  exportBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const data = await window.cookieUtils.exportCookies(tab);
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `cookies-${timestamp}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      updateButtonStatus(exportBtn, 'success', 'Cookies Exported!');
    } catch (error) {
      console.error('Export error:', error);
      updateButtonStatus(exportBtn, 'error', 'Export Failed');
    }
  });

  importBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (event) => {
      try {
        const file = event.target.files[0];
        if (!file) {
          throw new Error('No file selected');
        }

        console.log('Reading file:', file.name);
        const text = await file.text();
        let data;
        
        try {
          data = JSON.parse(text);
          console.log('Parsed data:', data);
        } catch (error) {
          console.error('Parse error:', error);
          throw new Error('Invalid JSON format');
        }

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url) {
          throw new Error('No active tab found');
        }

        const result = await window.cookieUtils.importCookies(data, tab);
        
        if (result.imported > 0) {
          updateButtonStatus(importBtn, 'success', `Imported ${result.imported} cookies`);
          if (result.failed > 0) {
            console.warn(`${result.failed} cookies failed to import`);
          }
          
          // Show reloading message
          setTimeout(() => {
            updateButtonStatus(importBtn, '', 'Reloading page...');
          }, 500);

          // Reload the current tab
          await chrome.tabs.reload(tab.id);
        } else {
          throw new Error('No cookies were imported. Make sure you\'re on the correct domain.');
        }
      } catch (error) {
        console.error('Import error:', error);
        updateButtonStatus(importBtn, 'error', `Import Failed: ${error.message}`);
      }
    };
    
    input.click();
  });

  // Initialize
  addTestButton();

  // Add GitHub functionality
  console.log('Setting up GitHub functionality');
  
  // Get elements directly
  const tokenInput = document.getElementById('githubTokenInput');
  const saveBtn = document.getElementById('saveTokenBtn');
  const testBtn = document.getElementById('testTokenBtn');
  const statusDiv = document.getElementById('statusMessage');
  
  if (!tokenInput || !saveBtn || !testBtn || !statusDiv) {
    console.error('Could not find token elements', {
      tokenInput: !!tokenInput,
      saveBtn: !!saveBtn,
      testBtn: !!testBtn,
      statusDiv: !!statusDiv
    });
    return;
  }
  
  console.log('Token elements found, setting up event listeners');
  
  // Check token status on load
  checkTokenStatus();
  
  // Save token handler
  saveBtn.addEventListener('click', function() {
    console.log('Save button clicked');
    const token = tokenInput.value.trim();
    
    if (!token) {
      statusDiv.textContent = 'Please enter a GitHub token';
      statusDiv.className = 'error';
      return;
    }
    
    // Save to Chrome storage
    chrome.storage.sync.set({ githubToken: token }, function() {
      if (chrome.runtime.lastError) {
        console.error('Storage error:', chrome.runtime.lastError);
        statusDiv.textContent = 'Error saving token: ' + chrome.runtime.lastError.message;
        statusDiv.className = 'error';
        return;
      }
      
      console.log('Token saved successfully');
      statusDiv.textContent = 'Token saved successfully!';
      statusDiv.className = 'success';
      tokenInput.value = ''; // Clear for security
      
      // Recheck token status after saving
      setTimeout(checkTokenStatus, 500);
    });
  });
  
  // Test token handler
  testBtn.addEventListener('click', function() {
    console.log('Test button clicked');
    statusDiv.textContent = 'Testing connection...';
    statusDiv.className = 'info';
    
    chrome.storage.sync.get('githubToken', function(data) {
      if (chrome.runtime.lastError) {
        console.error('Storage error:', chrome.runtime.lastError);
        statusDiv.textContent = 'Error retrieving token: ' + chrome.runtime.lastError.message;
        statusDiv.className = 'error';
        return;
      }
      
      const token = data.githubToken;
      if (!token) {
        statusDiv.textContent = 'No token found. Please save your token first.';
        statusDiv.className = 'error';
        return;
      }
      
      // Test GitHub connection
      testGitHubConnection(token).then(result => {
        statusDiv.textContent = result.message;
        statusDiv.className = result.success ? 'success' : 'error';
      });
    });
  });
  
  // Test GitHub connection
  async function testGitHubConnection(token) {
    try {
      const response = await fetch('https://api.github.com/repos/fisapool/json', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!response.ok) {
        return {
          success: false,
          message: `Connection failed: ${response.status} ${response.statusText}`
        };
      }
      
      return {
        success: true,
        message: 'Connection successful!'
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection error: ${error.message}`
      };
    }
  }

  // Add this function to check the token status on page load
  function checkTokenStatus() {
    const statusDiv = document.getElementById('statusMessage');
    
    if (!statusDiv) {
      console.error('Status div not found');
      return;
    }

    chrome.storage.sync.get('githubToken', function(data) {
      if (chrome.runtime.lastError) {
        console.error('Storage error:', chrome.runtime.lastError);
        statusDiv.textContent = 'Error checking token status';
        statusDiv.className = 'error';
        return;
      }
      
      const token = data.githubToken;
      if (token) {
        // Show masked token (first 4 chars and last 4 chars)
        const maskedToken = token.length > 8 ? 
          `${token.substring(0, 4)}...${token.substring(token.length - 4)}` : 
          '****';
        
        statusDiv.textContent = `Token saved: ${maskedToken}`;
        statusDiv.className = 'success';
        
        // Add a small icon to indicate token is saved
        const checkIcon = document.createElement('span');
        checkIcon.textContent = ' ✓';
        checkIcon.style.color = '#2ea44f';
        statusDiv.appendChild(checkIcon);
      } else {
        statusDiv.textContent = 'No token currently saved';
        statusDiv.className = 'info';
      }
    });
  }

  // Add test button to UI
  function addTestButton() {
    // This function is now a no-op (does nothing) to avoid duplication
    // with existing Test button functionality
    console.log('Test button functionality is now handled by the existing Test button');
    return;
  }
}); 