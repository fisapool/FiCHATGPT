/**
 * FiChatGPT Cookie Manager - Popup Component
 * React-based UI for the cookie manager extension
 */
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Cookie, CookieExport, CookieManagerSettings } from './types';

interface CookieItemProps {
  cookie: Cookie;
  onDelete: (cookie: Cookie) => void;
}

// Component for displaying a single cookie
const CookieItem: React.FC<CookieItemProps> = ({ cookie, onDelete }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="cookie-item">
      <div className="cookie-header" onClick={() => setExpanded(!expanded)}>
        <span className="cookie-name">{cookie.name}</span>
        <span className="cookie-domain">{cookie.domain}</span>
        <button 
          className="delete-button" 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(cookie);
          }}
        >
          Delete
        </button>
      </div>
      {expanded && (
        <div className="cookie-details">
          <div><strong>Path:</strong> {cookie.path}</div>
          <div><strong>Value:</strong> {cookie.value.substring(0, 50)}{cookie.value.length > 50 ? '...' : ''}</div>
          <div><strong>Secure:</strong> {cookie.secure ? 'Yes' : 'No'}</div>
          <div><strong>HttpOnly:</strong> {cookie.httpOnly ? 'Yes' : 'No'}</div>
          {cookie.expirationDate && (
            <div><strong>Expires:</strong> {new Date(cookie.expirationDate * 1000).toLocaleString()}</div>
          )}
        </div>
      )}
    </div>
  );
};

// Main Popup Component
const Popup: React.FC = () => {
  const [cookies, setCookies] = useState<Cookie[]>([]);
  const [settings, setSettings] = useState<CookieManagerSettings>({
    autoSave: true,
    encryptionEnabled: true,
    syncEnabled: false,
    notificationsEnabled: true,
    maxCookiesPerDomain: 50
  });
  const [filterDomain, setFilterDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load cookies when component mounts
  useEffect(() => {
    loadCookies();
    loadSettings();
    
    // Listen for cookie-manager-error events
    const handleError = (event: CustomEvent) => {
      setError(event.detail.message);
    };
    
    document.addEventListener('cookie-manager-error', handleError as EventListener);
    
    return () => {
      document.removeEventListener('cookie-manager-error', handleError as EventListener);
    };
  }, []);

  // Load cookies from background service
  const loadCookies = async () => {
    setLoading(true);
    try {
      chrome.runtime.sendMessage({ type: 'GET_ALL_COOKIES' }, (response) => {
        if (chrome.runtime.lastError) {
          setError(`Error: ${chrome.runtime.lastError.message}`);
          return;
        }
        
        if (response.success) {
          setCookies(response.cookies);
        } else {
          setError(response.error || 'Failed to load cookies');
        }
        setLoading(false);
      });
    } catch (error) {
      setError(`Error: ${(error as Error).message}`);
      setLoading(false);
    }
  };

  // Load settings from background service
  const loadSettings = async () => {
    try {
      chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
        if (chrome.runtime.lastError) {
          setError(`Error: ${chrome.runtime.lastError.message}`);
          return;
        }
        
        if (response.success) {
          setSettings(response.settings);
        }
      });
    } catch (error) {
      setError(`Error: ${(error as Error).message}`);
    }
  };

  // Handle cookie deletion
  const handleDeleteCookie = (cookie: Cookie) => {
    try {
      chrome.runtime.sendMessage({ 
        type: 'DELETE_COOKIE',
        cookie: {
          name: cookie.name,
          domain: cookie.domain,
          path: cookie.path
        }
      }, (response) => {
        if (chrome.runtime.lastError) {
          setError(`Error: ${chrome.runtime.lastError.message}`);
          return;
        }
        
        if (response.success) {
          // Reload cookies after deletion
          loadCookies();
        } else {
          setError(response.error || 'Failed to delete cookie');
        }
      });
    } catch (error) {
      setError(`Error: ${(error as Error).message}`);
    }
  };

  // Export cookies
  const handleExportCookies = () => {
    try {
      chrome.runtime.sendMessage({ type: 'EXPORT_COOKIES' }, (response) => {
        if (chrome.runtime.lastError) {
          setError(`Error: ${chrome.runtime.lastError.message}`);
          return;
        }
        
        if (response.success) {
          // Create a download link for the exported data
          const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          
          const a = document.createElement('a');
          a.href = url;
          a.download = `cookies_export_${new Date().toISOString().slice(0, 10)}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } else {
          setError(response.error || 'Failed to export cookies');
        }
      });
    } catch (error) {
      setError(`Error: ${(error as Error).message}`);
    }
  };

  // Import cookies
  const handleImportCookies = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string) as CookieExport;
        
        chrome.runtime.sendMessage({ 
          type: 'IMPORT_COOKIES',
          data: importData
        }, (response) => {
          if (chrome.runtime.lastError) {
            setError(`Error: ${chrome.runtime.lastError.message}`);
            return;
          }
          
          if (response.success) {
            // Reload cookies after import
            loadCookies();
          } else {
            setError(response.error || 'Failed to import cookies');
          }
        });
      } catch (error) {
        setError(`Error parsing import file: ${(error as Error).message}`);
      }
    };
    
    reader.readAsText(file);
  };

  // Update settings
  const handleSettingChange = (setting: keyof CookieManagerSettings, value: any) => {
    const newSettings = { ...settings, [setting]: value };
    setSettings(newSettings);
    
    try {
      chrome.runtime.sendMessage({ 
        type: 'UPDATE_SETTINGS',
        settings: { [setting]: value }
      }, (response) => {
        if (chrome.runtime.lastError) {
          setError(`Error: ${chrome.runtime.lastError.message}`);
          return;
        }
        
        if (!response.success) {
          setError(response.error || 'Failed to update settings');
        }
      });
    } catch (error) {
      setError(`Error: ${(error as Error).message}`);
    }
  };

  // Filter cookies by domain
  const filteredCookies = filterDomain 
    ? cookies.filter(cookie => cookie.domain.includes(filterDomain))
    : cookies;

  return (
    <div className="popup-container">
      <header className="header">
        <h1>FiChatGPT Cookie Manager</h1>
      </header>
      
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      <div className="controls">
        <div className="filter-section">
          <input
            type="text"
            placeholder="Filter by domain..."
            value={filterDomain}
            onChange={(e) => setFilterDomain(e.target.value)}
          />
        </div>
        
        <div className="action-buttons">
          <button onClick={handleExportCookies}>Export Cookies</button>
          <label className="import-button">
            Import Cookies
            <input 
              type="file" 
              accept=".json" 
              style={{ display: 'none' }} 
              onChange={handleImportCookies}
            />
          </label>
        </div>
      </div>
      
      <div className="settings-panel">
        <h2>Settings</h2>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.encryptionEnabled}
              onChange={(e) => handleSettingChange('encryptionEnabled', e.target.checked)}
            />
            Enable Encryption
          </label>
        </div>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.autoSave}
              onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
            />
            Auto Save
          </label>
        </div>
        <div className="setting-item">
          <label>
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) => handleSettingChange('notificationsEnabled', e.target.checked)}
            />
            Show Notifications
          </label>
        </div>
      </div>
      
      <div className="cookies-list">
        <h2>Cookies {filteredCookies.length > 0 && `(${filteredCookies.length})`}</h2>
        
        {loading ? (
          <div className="loading">Loading cookies...</div>
        ) : filteredCookies.length > 0 ? (
          filteredCookies.map((cookie, index) => (
            <CookieItem 
              key={`${cookie.domain}-${cookie.path}-${cookie.name}-${index}`}
              cookie={cookie}
              onDelete={handleDeleteCookie}
            />
          ))
        ) : (
          <div className="no-cookies">No cookies found.</div>
        )}
      </div>
    </div>
  );
};

// Render the popup
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
} 