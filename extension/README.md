# FiCHATGPT Cookie Manager & ChatGPT Integration

A browser extension that provides enhanced ChatGPT access through secure cookie management and license-based authentication.

## Features

### Cookie Management
- Export and import cookies for ChatGPT sessions
- Secure cookie storage with AES encryption
- Cookie validation and error checking
- Support for various cookie formats

### ChatGPT Enhancement
- Lifetime access to ChatGPT without monthly subscriptions
- 3X higher message capacity compared to ChatGPT Plus (no hourly caps)
- Zero random logouts with stable sessions
- One-click FISABytes login integration

### Security
- Device fingerprinting for license validation
- Secure token storage with encryption
- Local data processing (no third-party servers)
- Error boundaries and robust error handling

### User Interface
- Clean, modern UI with tabbed navigation
- Real-time feedback and status indicators
- Error notifications and validation
- Light/dark mode support

## Installation

### From Source
1. Clone the repository
2. Navigate to the extension directory: `cd extension`
3. Install dependencies: `npm install`
4. Build the extension: `npm run build`
5. Load the extension in Chrome:
   - Go to chrome://extensions/
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder from the build

### From Chrome Web Store
*(Coming soon)*

## Usage

### Cookie Management
1. Open the extension popup by clicking the FiCHATGPT icon
2. Navigate to the "Cookies" tab
3. View, export, or import cookies for ChatGPT sessions
4. Filter cookies by domain

### License Activation
1. Sign in with your FISABytes account from the "Login" tab
2. Navigate to the "License" tab
3. Enter your license key and click "Activate License"
4. Once activated, your ChatGPT sessions will be automatically enhanced

### Device Management
If you need to transfer your license to a new device:
1. Go to the "License" tab
2. Click "Transfer to New Device"
3. Confirm the transfer (note: limited transfers available per license)

## Development

### Available Scripts
- `npm run dev` - Start development with watch mode
- `npm run build` - Build for production
- `npm run check` - TypeScript type checking
- `npm run test` - Run tests
- `npm run lint` - Lint code

### Project Structure
- `src/` - Source code
  - `background.ts` - Background script for extension
  - `popup.tsx` - React-based popup UI
  - `CookieManager.ts` - Core cookie management functionality
  - `security/` - Security-related modules
    - `AuthenticationService.ts` - FISABytes authentication
    - `CookieEncryption.ts` - AES encryption for cookies
    - `DeviceFingerprint.ts` - Device fingerprinting
    - `LicenseManager.ts` - License validation and management
  - `errors/` - Error handling
  - `types/` - TypeScript type definitions
- `public/` - Static assets
- `dist/` - Build output (not versioned)

## License
Proprietary. All rights reserved.

## Support
If you encounter any issues, please contact support@fisabytes.com 