/**
 * FiChatGPT Cookie Manager - Popup Component
 * React-based UI for the cookie manager extension
 */
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Cookie, CookieExport, CookieManagerSettings } from './types';
import { AuthToken, LoginCredentials } from './security/AuthenticationService';
import { License } from './security/LicenseManager';
import './styles.css';

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

// Login Component
const LoginForm: React.FC<{
  onLogin: (credentials: LoginCredentials) => void;
  loading: boolean;
  error: string | null;
}> = ({ onLogin, loading, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({ username, password });
  };

  return (
    <div className="login-form">
      <h2>FISABytes Login</h2>
      <p>Log in to access ChatGPT TEAM features</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" disabled={loading} className="login-button">
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

// License Activation Form
const LicenseForm: React.FC<{
  onActivate: (licenseKey: string) => void;
  loading: boolean;
  error: string | null;
}> = ({ onActivate, loading, error }) => {
  const [licenseKey, setLicenseKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onActivate(licenseKey);
  };

  return (
    <div className="license-form">
      <h2>Activate License</h2>
      <p>Enter your license key to enable ChatGPT TEAM features</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="licenseKey">License Key</label>
          <input
            type="text"
            id="licenseKey"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
            required
          />
        </div>
        
        <button type="submit" disabled={loading} className="activate-button">
          {loading ? 'Activating...' : 'Activate License'}
        </button>
      </form>
    </div>
  );
};

// License Info Component
const LicenseInfo: React.FC<{
  license: License;
  onDeactivate: () => void;
  onTransfer: () => void;
  loading: boolean;
}> = ({ license, onDeactivate, onTransfer, loading }) => {
  return (
    <div className="license-info">
      <h2>License Information</h2>
      
      <div className="license-details">
        <div className="license-status">
          <span className={`status-badge ${license.status}`}>
            {license.status.charAt(0).toUpperCase() + license.status.slice(1)}
          </span>
          <span className="license-tier">{license.tier.toUpperCase()} License</span>
        </div>
        
        <div className="license-detail">
          <span className="detail-label">License Key:</span>
          <span className="detail-value">{license.key.substring(0, 5)}...{license.key.substring(license.key.length - 5)}</span>
        </div>
        
        <div className="license-detail">
          <span className="detail-label">Activated:</span>
          <span className="detail-value">{new Date(license.activationDate).toLocaleDateString()}</span>
        </div>
        
        {license.expiryDate && (
          <div className="license-detail">
            <span className="detail-label">Expires:</span>
            <span className="detail-value">{new Date(license.expiryDate).toLocaleDateString()}</span>
          </div>
        )}
        
        <div className="license-detail">
          <span className="detail-label">Device ID:</span>
          <span className="detail-value">{license.deviceId.substring(0, 8)}...</span>
        </div>
        
        <div className="license-detail">
          <span className="detail-label">Device Transfers:</span>
          <span className="detail-value">{license.deviceTransfersRemaining} remaining</span>
        </div>
      </div>
      
      <div className="license-actions">
        <button 
          onClick={onTransfer} 
          disabled={loading || license.deviceTransfersRemaining <= 0}
          className="transfer-button"
        >
          {loading ? 'Processing...' : 'Transfer to New Device'}
        </button>
        
        <button 
          onClick={onDeactivate} 
          disabled={loading}
          className="deactivate-button"
        >
          {loading ? 'Processing...' : 'Deactivate License'}
        </button>
      </div>
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
  const [activeTab, setActiveTab] = useState<'cookies' | 'settings' | 'login' | 'license'>('cookies');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<AuthToken | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [deviceFingerprint, setDeviceFingerprint] = useState<string | null>(null);
  const [fingerprintLoading, setFingerprintLoading] = useState(false);
  const [license, setLicense] = useState<License | null>(null);
  const [isLicenseActive, setIsLicenseActive] = useState(false);
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [licenseError, setLicenseError] = useState<string | null>(null);

  // Load data when component mounts
  useEffect(() => {
    loadCookies();
    loadSettings();
    checkAuthentication();
    loadDeviceFingerprint();
    loadLicense();
    
    // Listen for cookie-manager-error events
    const handleError = (event: CustomEvent) => {
      setError(event.detail.message);
    };
    
    document.addEventListener('cookie-manager-error', handleError as EventListener);
    
    return () => {
      document.removeEventListener('cookie-manager-error', handleError as EventListener);
    };
  }, []);

  // Load device fingerprint
  const loadDeviceFingerprint = () => {
    chrome.runtime.sendMessage({ type: 'GET_DEVICE_FINGERPRINT' }, (response) => {
      if (chrome.runtime.lastError) {
        setError(`Error: ${chrome.runtime.lastError.message}`);
        return;
      }
      
      if (response.success && response.fingerprint) {
        setDeviceFingerprint(response.fingerprint);
      }
    });
  };

  // Regenerate device fingerprint
  const regenerateFingerprint = () => {
    setFingerprintLoading(true);
    chrome.runtime.sendMessage({ type: 'REGENERATE_FINGERPRINT' }, (response) => {
      setFingerprintLoading(false);
      
      if (chrome.runtime.lastError) {
        setError(`Error: ${chrome.runtime.lastError.message}`);
        return;
      }
      
      if (response.success && response.fingerprint) {
        setDeviceFingerprint(response.fingerprint);
      } else {
        setError('Failed to regenerate device fingerprint');
      }
    });
  };

  // Check authentication status
  const checkAuthentication = () => {
    chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }, (response) => {
      if (chrome.runtime.lastError) {
        setLoginError(`Error: ${chrome.runtime.lastError.message}`);
        return;
      }
      
      if (response.success) {
        setIsAuthenticated(response.isAuthenticated);
        
        if (response.isAuthenticated) {
          // Get token details if authenticated
          chrome.runtime.sendMessage({ type: 'GET_AUTH_TOKEN' }, (tokenResponse) => {
            if (tokenResponse.success && tokenResponse.token) {
              setAuthToken(tokenResponse.token);
            }
          });
        }
      }
    });
  };

  // Handle login
  const handleLogin = (credentials: LoginCredentials) => {
    setLoginLoading(true);
    setLoginError(null);
    
    chrome.runtime.sendMessage({ 
      type: 'LOGIN',
      credentials 
    }, (response) => {
      setLoginLoading(false);
      
      if (chrome.runtime.lastError) {
        setLoginError(`Error: ${chrome.runtime.lastError.message}`);
        return;
      }
      
      if (response.success) {
        setIsAuthenticated(true);
        checkAuthentication(); // Refresh token info
        setActiveTab('cookies'); // Switch to cookies tab after successful login
      } else {
        setLoginError('Login failed. Please check your credentials and try again.');
      }
    });
  };

  // Handle logout
  const handleLogout = () => {
    chrome.runtime.sendMessage({ type: 'LOGOUT' }, (response) => {
      if (response.success) {
        setIsAuthenticated(false);
        setAuthToken(null);
      } else {
        setError('Failed to logout. Please try again.');
      }
    });
  };

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

  // Load license information
  const loadLicense = () => {
    chrome.runtime.sendMessage({ type: 'GET_LICENSE' }, (response) => {
      if (chrome.runtime.lastError) {
        setLicenseError(`Error: ${chrome.runtime.lastError.message}`);
        return;
      }
      
      if (response.success) {
        setLicense(response.license);
        setIsLicenseActive(response.isActive);
      }
    });
  };

  // Activate license
  const handleActivateLicense = (licenseKey: string) => {
    setLicenseLoading(true);
    setLicenseError(null);
    
    chrome.runtime.sendMessage({ 
      type: 'ACTIVATE_LICENSE',
      licenseKey 
    }, (response) => {
      setLicenseLoading(false);
      
      if (chrome.runtime.lastError) {
        setLicenseError(`Error: ${chrome.runtime.lastError.message}`);
        return;
      }
      
      if (response.success) {
        setLicense(response.license);
        setIsLicenseActive(true);
      } else {
        setLicenseError('License activation failed. Please check your license key and try again.');
      }
    });
  };

  // Deactivate license
  const handleDeactivateLicense = () => {
    setLicenseLoading(true);
    
    chrome.runtime.sendMessage({ type: 'DEACTIVATE_LICENSE' }, (response) => {
      setLicenseLoading(false);
      
      if (chrome.runtime.lastError) {
        setError(`Error: ${chrome.runtime.lastError.message}`);
        return;
      }
      
      if (response.success) {
        setLicense(null);
        setIsLicenseActive(false);
      } else {
        setError('Failed to deactivate license. Please try again.');
      }
    });
  };

  // Transfer license to new device
  const handleTransferLicense = () => {
    setLicenseLoading(true);
    
    chrome.runtime.sendMessage({ type: 'TRANSFER_LICENSE' }, (response) => {
      setLicenseLoading(false);
      
      if (chrome.runtime.lastError) {
        setError(`Error: ${chrome.runtime.lastError.message}`);
        return;
      }
      
      if (response.success) {
        setLicense(response.license);
        // Also update fingerprint display
        loadDeviceFingerprint();
      } else {
        setError('Failed to transfer license. Please try again.');
      }
    });
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
        setError(`Error: Invalid JSON format. ${(error as Error).message}`);
      }
    };
    reader.readAsText(file);
  };

  // Handle settings changes
  const handleSettingChange = (setting: keyof CookieManagerSettings, value: any) => {
    const updatedSettings = {
      ...settings,
      [setting]: value
    };
    
    setSettings(updatedSettings);
    
    chrome.runtime.sendMessage({ 
      type: 'UPDATE_SETTINGS',
      settings: updatedSettings
    }, (response) => {
      if (chrome.runtime.lastError) {
        setError(`Error: ${chrome.runtime.lastError.message}`);
        setSettings(settings); // Revert on error
        return;
      }
      
      if (!response.success) {
        setError(response.error || 'Failed to update settings');
        setSettings(settings); // Revert on error
      }
    });
  };

  // Filter cookies by domain
  const filteredCookies = filterDomain
    ? cookies.filter(cookie => cookie.domain.includes(filterDomain))
    : cookies;

  // Render the popup
  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>FiChatGPT Cookie Manager</h1>
        <div className="auth-status">
          {isAuthenticated ? (
            <div className="auth-info">
              <span className="auth-status-badge authenticated">Authenticated</span>
              <button onClick={handleLogout} className="logout-button">Logout</button>
            </div>
          ) : (
            <span className="auth-status-badge not-authenticated">Not Authenticated</span>
          )}
        </div>
      </header>
      
      <nav className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'cookies' ? 'active' : ''}`}
          onClick={() => setActiveTab('cookies')}
        >
          Cookies
        </button>
        <button 
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
        <button 
          className={`tab-button ${activeTab === 'license' ? 'active' : ''}`}
          onClick={() => setActiveTab('license')}
        >
          License
        </button>
        {!isAuthenticated && (
          <button 
            className={`tab-button ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
        )}
      </nav>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="close-error">×</button>
        </div>
      )}

      {activeTab === 'cookies' && (
        <div className="cookies-tab">
          <div className="filter-bar">
            <input
              type="text"
              placeholder="Filter by domain..."
              value={filterDomain}
              onChange={(e) => setFilterDomain(e.target.value)}
              className="domain-filter"
            />
            <div className="cookie-controls">
              <button onClick={handleExportCookies} className="export-button">Export</button>
              <label className="import-button">
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportCookies}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          <div className="cookie-list">
            {loading ? (
              <div className="loading">Loading cookies...</div>
            ) : filteredCookies.length > 0 ? (
              filteredCookies.map((cookie, index) => (
                <CookieItem
                  key={`${cookie.domain}-${cookie.name}-${cookie.path}-${index}`}
                  cookie={cookie}
                  onDelete={handleDeleteCookie}
                />
              ))
            ) : (
              <div className="no-cookies">No cookies found</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="settings-tab">
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
              />
              Auto-save changes
            </label>
          </div>
          
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.encryptionEnabled}
                onChange={(e) => handleSettingChange('encryptionEnabled', e.target.checked)}
              />
              Enable encryption
            </label>
          </div>
          
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => handleSettingChange('notificationsEnabled', e.target.checked)}
              />
              Enable notifications
            </label>
          </div>
          
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.syncEnabled}
                onChange={(e) => handleSettingChange('syncEnabled', e.target.checked)}
              />
              Enable sync
            </label>
          </div>
          
          <div className="setting-item">
            <label>
              Max cookies per domain:
              <input
                type="number"
                min="1"
                max="100"
                value={settings.maxCookiesPerDomain}
                onChange={(e) => handleSettingChange('maxCookiesPerDomain', parseInt(e.target.value, 10))}
              />
            </label>
          </div>
          
          <div className="device-fingerprint-section">
            <h3>Device Fingerprint</h3>
            <p className="fingerprint-info">
              This unique identifier is used for license enforcement. Each license is bound to a specific device.
            </p>
            
            <div className="fingerprint-display">
              <span className="fingerprint-label">Current Fingerprint:</span>
              <code>{deviceFingerprint || 'Not available'}</code>
            </div>
            
            <button 
              onClick={regenerateFingerprint} 
              disabled={fingerprintLoading}
              className="regenerate-button"
            >
              {fingerprintLoading ? 'Regenerating...' : 'Regenerate Fingerprint'}
            </button>
            
            <p className="fingerprint-warning">
              Warning: Regenerating your device fingerprint may require license reactivation.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'license' && (
        <div className="license-tab">
          {license ? (
            <LicenseInfo 
              license={license}
              onDeactivate={handleDeactivateLicense}
              onTransfer={handleTransferLicense}
              loading={licenseLoading}
            />
          ) : (
            <LicenseForm
              onActivate={handleActivateLicense}
              loading={licenseLoading}
              error={licenseError}
            />
          )}
          
          {isLicenseActive && (
            <div className="chatgpt-features">
              <h3>ChatGPT TEAM Features</h3>
              <ul className="features-list">
                <li className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span className="feature-text">Lifetime access without monthly subscriptions</span>
                </li>
                <li className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span className="feature-text">3X higher message capacity (no hourly caps)</span>
                </li>
                <li className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span className="feature-text">Zero random logouts with stable sessions</span>
                </li>
                <li className="feature-item">
                  <span className="feature-icon">✓</span>
                  <span className="feature-text">One-click FISABytes login integration</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      )}

      {activeTab === 'login' && (
        <div className="login-tab">
          <LoginForm 
            onLogin={handleLogin} 
            loading={loginLoading} 
            error={loginError} 
          />
        </div>
      )}

      {isAuthenticated && authToken && (
        <div className="auth-info-panel">
          <h3>ChatGPT TEAM Access</h3>
          <div className="auth-details">
            <div><strong>User ID:</strong> {authToken.userId}</div>
            <div><strong>Expires:</strong> {new Date(authToken.expiresAt).toLocaleString()}</div>
            <div className="chatgpt-status">
              <span className={`status-icon ${isLicenseActive ? 'active' : 'inactive'}`}></span> 
              {isLicenseActive ? 'Active session' : 'License required'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Render the popup
const root = createRoot(document.getElementById('root')!);
root.render(<Popup />); 