/**
 * License Management Module
 * Handles license validation, activation and device binding
 */
import { SecurityError } from '../types';
import { AuthenticationService } from './AuthenticationService';
import { DeviceFingerprint } from './DeviceFingerprint';
import { CookieEncryption } from './CookieEncryption';

export interface License {
  key: string;
  activationDate: number;
  expiryDate: number | null; // null for lifetime licenses
  deviceId: string;
  userId: string;
  tier: 'single' | 'multi' | 'team';
  deviceTransfersRemaining: number;
  status: 'active' | 'expired' | 'revoked';
  lastVerified: number;
}

export class LicenseManager {
  private license: License | null = null;
  private readonly LICENSE_STORAGE_KEY = 'fichatgpt_license';
  private readonly LICENSE_API_URL = 'https://api.fisabytes.com/license'; // Replace with actual API URL
  private encryption: CookieEncryption;
  private authService: AuthenticationService;
  private deviceFingerprint: DeviceFingerprint;

  constructor(
    authService: AuthenticationService,
    deviceFingerprint: DeviceFingerprint
  ) {
    this.encryption = new CookieEncryption();
    this.authService = authService;
    this.deviceFingerprint = deviceFingerprint;
  }

  /**
   * Initialize the license manager
   */
  public async initialize(): Promise<boolean> {
    try {
      // Try to load existing license
      const license = await this.loadLicense();
      if (license) {
        // Verify the license is still valid
        const isVerified = await this.verifyLicense(license);
        if (isVerified) {
          this.license = license;
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to initialize license manager:', error);
      return false;
    }
  }

  /**
   * Activate a license key
   */
  public async activateLicense(licenseKey: string): Promise<boolean> {
    try {
      // Get current device fingerprint
      const deviceId = this.deviceFingerprint.getFingerprint();
      if (!deviceId) {
        throw new SecurityError('Device fingerprint not available');
      }

      // Get auth token
      const authToken = this.authService.getAuthToken();
      if (!authToken) {
        throw new SecurityError('Authentication required to activate license');
      }

      // Call license API to activate
      const response = await fetch(`${this.LICENSE_API_URL}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          licenseKey,
          deviceId,
          userId: authToken.userId
        })
      });

      if (!response.ok) {
        throw new SecurityError(`License activation failed: ${response.statusText}`);
      }

      const licenseData = await response.json();
      
      const license: License = {
        key: licenseData.license_key,
        activationDate: licenseData.activation_date,
        expiryDate: licenseData.expiry_date,
        deviceId,
        userId: authToken.userId,
        tier: licenseData.tier,
        deviceTransfersRemaining: licenseData.device_transfers_remaining,
        status: licenseData.status,
        lastVerified: Date.now()
      };

      // Store license securely
      await this.saveLicense(license);
      this.license = license;
      
      return true;
    } catch (error) {
      console.error('License activation failed:', error);
      return false;
    }
  }

  /**
   * Verify a license is still valid
   */
  private async verifyLicense(license: License): Promise<boolean> {
    try {
      // Check if device fingerprint matches
      const currentDeviceId = this.deviceFingerprint.getFingerprint();
      if (!currentDeviceId || currentDeviceId !== license.deviceId) {
        console.error('Device fingerprint mismatch');
        return false;
      }

      // Check if license is expired
      if (license.expiryDate && Date.now() > license.expiryDate) {
        console.error('License expired');
        return false;
      }

      // Check if we need to verify with the server
      // Only verify every 24 hours to reduce API calls
      const verificationInterval = 24 * 60 * 60 * 1000; // 24 hours
      if (Date.now() - license.lastVerified < verificationInterval) {
        return true;
      }

      // Get auth token
      const authToken = this.authService.getAuthToken();
      if (!authToken) {
        // If no auth token, we'll still allow the license to work 
        // but just won't update the verification time
        return true;
      }

      // Call license API to verify
      const response = await fetch(`${this.LICENSE_API_URL}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          licenseKey: license.key,
          deviceId: license.deviceId,
          userId: license.userId
        })
      });

      if (!response.ok) {
        throw new SecurityError(`License verification failed: ${response.statusText}`);
      }

      const verificationData = await response.json();
      
      // Update license status
      const updatedLicense: License = {
        ...license,
        status: verificationData.status,
        deviceTransfersRemaining: verificationData.device_transfers_remaining,
        lastVerified: Date.now()
      };

      await this.saveLicense(updatedLicense);
      this.license = updatedLicense;
      
      return updatedLicense.status === 'active';
    } catch (error) {
      console.error('License verification failed:', error);
      
      // If verification fails due to network issues, we'll still consider the license valid
      // This ensures offline usage is still possible
      return true;
    }
  }

  /**
   * Transfer license to a new device
   */
  public async transferLicense(): Promise<boolean> {
    try {
      if (!this.license) {
        throw new SecurityError('No active license to transfer');
      }

      if (this.license.deviceTransfersRemaining <= 0) {
        throw new SecurityError('No device transfers remaining');
      }

      // Generate a new device fingerprint
      await this.deviceFingerprint.generateFingerprint();
      const newDeviceId = this.deviceFingerprint.getFingerprint();
      if (!newDeviceId) {
        throw new SecurityError('Failed to generate new device fingerprint');
      }

      // Get auth token
      const authToken = this.authService.getAuthToken();
      if (!authToken) {
        throw new SecurityError('Authentication required to transfer license');
      }

      // Call license API to transfer
      const response = await fetch(`${this.LICENSE_API_URL}/transfer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          licenseKey: this.license.key,
          oldDeviceId: this.license.deviceId,
          newDeviceId,
          userId: authToken.userId
        })
      });

      if (!response.ok) {
        throw new SecurityError(`License transfer failed: ${response.statusText}`);
      }

      const transferData = await response.json();
      
      // Update license with new device ID
      const updatedLicense: License = {
        ...this.license,
        deviceId: newDeviceId,
        deviceTransfersRemaining: transferData.device_transfers_remaining,
        lastVerified: Date.now()
      };

      await this.saveLicense(updatedLicense);
      this.license = updatedLicense;
      
      return true;
    } catch (error) {
      console.error('License transfer failed:', error);
      return false;
    }
  }

  /**
   * Deactivate the current license
   */
  public async deactivateLicense(): Promise<boolean> {
    try {
      if (!this.license) {
        return true; // Already no active license
      }

      // Get auth token
      const authToken = this.authService.getAuthToken();
      if (!authToken) {
        throw new SecurityError('Authentication required to deactivate license');
      }

      // Call license API to deactivate
      const response = await fetch(`${this.LICENSE_API_URL}/deactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          licenseKey: this.license.key,
          deviceId: this.license.deviceId,
          userId: this.license.userId
        })
      });

      if (!response.ok) {
        throw new SecurityError(`License deactivation failed: ${response.statusText}`);
      }

      // Clear stored license
      await chrome.storage.local.remove(this.LICENSE_STORAGE_KEY);
      this.license = null;
      
      return true;
    } catch (error) {
      console.error('License deactivation failed:', error);
      return false;
    }
  }

  /**
   * Get current license
   */
  public getLicense(): License | null {
    return this.license ? { ...this.license } : null;
  }

  /**
   * Check if license is active
   */
  public isLicenseActive(): boolean {
    return !!this.license && this.license.status === 'active';
  }

  /**
   * Get license tier
   */
  public getLicenseTier(): string | null {
    return this.license ? this.license.tier : null;
  }

  /**
   * Get transfers remaining
   */
  public getTransfersRemaining(): number {
    return this.license ? this.license.deviceTransfersRemaining : 0;
  }

  /**
   * Save license to secure storage
   */
  private async saveLicense(license: License): Promise<void> {
    try {
      // Encrypt license before saving
      const encryptedData = await this.encryption.encryptCookies([
        {
          name: 'license_data',
          value: JSON.stringify(license),
          domain: 'fisabytes.com',
          path: '/',
          expirationDate: (Date.now() + 365 * 24 * 60 * 60 * 1000) / 1000, // 1 year
          secure: true,
          httpOnly: true,
          sameSite: 'strict',
          hostOnly: false,
          session: false,
          storeId: '0'
        }
      ]);

      await chrome.storage.local.set({
        [this.LICENSE_STORAGE_KEY]: encryptedData
      });
    } catch (error) {
      console.error('Failed to save license:', error);
      throw new SecurityError('Failed to save license', error as Error);
    }
  }

  /**
   * Load license from secure storage
   */
  private async loadLicense(): Promise<License | null> {
    try {
      const data = await chrome.storage.local.get(this.LICENSE_STORAGE_KEY);
      
      if (!data[this.LICENSE_STORAGE_KEY]) {
        return null;
      }
      
      const decryptedCookies = await this.encryption.decryptCookies(data[this.LICENSE_STORAGE_KEY]);
      
      if (!decryptedCookies || decryptedCookies.length === 0) {
        return null;
      }
      
      const licenseCookie = decryptedCookies[0];
      return JSON.parse(licenseCookie.value) as License;
    } catch (error) {
      console.error('Failed to load license:', error);
      return null;
    }
  }
} 