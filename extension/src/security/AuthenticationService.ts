/**
 * Authentication Service Module
 * Handles FISABytes authentication and token management
 */
import { CookieEncryption } from './CookieEncryption';
import { SecurityError } from '../types';

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export class AuthenticationService {
  private encryption: CookieEncryption;
  private currentToken: AuthToken | null = null;
  private readonly TOKEN_STORAGE_KEY = 'fisabytes_auth_token';
  private readonly AUTH_API_URL = 'https://api.fisabytes.com/auth'; // Replace with actual API URL

  constructor() {
    this.encryption = new CookieEncryption();
  }

  /**
   * Initialize the authentication service
   */
  public async initialize(): Promise<boolean> {
    try {
      // Try to load existing token
      const token = await this.loadToken();
      if (token) {
        if (this.isTokenExpired(token)) {
          // Try to refresh the token if expired
          return await this.refreshAuthToken(token.refreshToken);
        }
        this.currentToken = token;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to initialize authentication service:', error);
      return false;
    }
  }

  /**
   * Login to FISABytes service
   */
  public async login(credentials: LoginCredentials): Promise<boolean> {
    try {
      // Call FISABytes API for authentication
      const response = await fetch(`${this.AUTH_API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        throw new SecurityError(`Login failed: ${response.statusText}`);
      }

      const tokenData = await response.json();
      
      const token: AuthToken = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
        userId: tokenData.user_id
      };

      // Store token securely
      await this.saveToken(token);
      this.currentToken = token;
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  /**
   * Logout from FISABytes service
   */
  public async logout(): Promise<boolean> {
    try {
      if (this.currentToken) {
        // Call FISABytes API to invalidate token
        await fetch(`${this.AUTH_API_URL}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.currentToken.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
      }

      // Clear stored token
      await chrome.storage.local.remove(this.TOKEN_STORAGE_KEY);
      this.currentToken = null;
      
      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      return false;
    }
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.currentToken && !this.isTokenExpired(this.currentToken);
  }

  /**
   * Get current auth token
   */
  public getAuthToken(): AuthToken | null {
    return this.currentToken && !this.isTokenExpired(this.currentToken) 
      ? { ...this.currentToken } 
      : null;
  }

  /**
   * Refresh authentication token
   */
  private async refreshAuthToken(refreshToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.AUTH_API_URL}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (!response.ok) {
        throw new SecurityError(`Token refresh failed: ${response.statusText}`);
      }

      const tokenData = await response.json();
      
      const token: AuthToken = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || refreshToken, // Use new refresh token if provided
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
        userId: tokenData.user_id
      };

      // Store token securely
      await this.saveToken(token);
      this.currentToken = token;
      
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  /**
   * Save token to secure storage
   */
  private async saveToken(token: AuthToken): Promise<void> {
    // Encrypt token before saving
    const encryptedData = await this.encryption.encryptCookies([
      {
        name: 'auth_token',
        value: JSON.stringify(token),
        domain: 'fisabytes.com',
        path: '/',
        expirationDate: token.expiresAt / 1000, // Convert to seconds
        secure: true,
        httpOnly: true,
        sameSite: 'strict',
        hostOnly: false,
        session: false,
        storeId: '0'
      }
    ]);

    await chrome.storage.local.set({
      [this.TOKEN_STORAGE_KEY]: encryptedData
    });
  }

  /**
   * Load token from secure storage
   */
  private async loadToken(): Promise<AuthToken | null> {
    try {
      const data = await chrome.storage.local.get(this.TOKEN_STORAGE_KEY);
      
      if (!data[this.TOKEN_STORAGE_KEY]) {
        return null;
      }
      
      const decryptedCookies = await this.encryption.decryptCookies(data[this.TOKEN_STORAGE_KEY]);
      
      if (!decryptedCookies || decryptedCookies.length === 0) {
        return null;
      }
      
      const tokenCookie = decryptedCookies[0];
      return JSON.parse(tokenCookie.value) as AuthToken;
    } catch (error) {
      console.error('Failed to load token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(token: AuthToken): boolean {
    return Date.now() >= token.expiresAt;
  }
} 