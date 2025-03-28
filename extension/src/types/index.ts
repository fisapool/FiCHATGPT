/**
 * Cookie Manager - Type Definitions
 * Shared types for the FiChatGPT Cookie Manager integration
 */

// Basic cookie structure
export interface Cookie {
  domain: string;
  expirationDate?: number;
  hostOnly?: boolean;
  httpOnly?: boolean;
  name: string;
  path: string;
  sameSite?: 'no_restriction' | 'lax' | 'strict';
  secure?: boolean;
  session?: boolean;
  storeId?: string;
  value: string;
}

// Structure for encrypted cookie data
export interface EncryptedData {
  data: string;       // The encrypted cookie data
  iv: string;         // Initialization vector
  hash: string;       // HMAC for integrity verification
  salt: string;       // Salt used for key derivation
  timestamp: number;  // When the data was encrypted
  version: string;    // Format version for backward compatibility
}

// Error types for the application
export class SecurityError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Enhanced error information for error handling
export interface EnhancedError {
  original: Error;
  timestamp: Date;
  context: string;
  level: string;
  code: string;
  recoverable: boolean;
}

// Result of error handling operations
export interface ErrorResult {
  handled: boolean;
  recovered: boolean;
  message: string;
  action: string;
}

// Strategy for recovering from errors
export interface RecoveryStrategy {
  execute: (error: EnhancedError) => Promise<RecoveryResult>;
}

// Result of a recovery attempt
export interface RecoveryResult {
  success: boolean;
  action: string;
}

// Cookie export/import format
export interface CookieExport {
  cookies: Cookie[];
  metadata: {
    version: string;
    timestamp: number;
    source: string;
  };
}

// Settings for the cookie manager
export interface CookieManagerSettings {
  autoSave: boolean;
  encryptionEnabled: boolean;
  syncEnabled: boolean;
  notificationsEnabled: boolean;
  maxCookiesPerDomain: number;
} 