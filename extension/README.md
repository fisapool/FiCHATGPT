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

### Browser Compatibility
- Chrome/Chromium-based browsers (Chrome, Edge, Brave, etc.)
- Firefox (version 109.0 and above)
- Safari (coming soon)

## Installation

### From Source

#### Chrome/Edge/Brave Installation
1. Clone the repository
2. Navigate to the extension directory: `cd extension`
3. Install dependencies: `npm install`
4. Build the extension: `npm run build`
5. Load the extension in Chrome:
   - Go to chrome://extensions/
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder from the build

#### Firefox Installation
1. Clone the repository
2. Navigate to the extension directory: `cd extension`
3. Install dependencies: `npm install`
4. Build the Firefox version: `npm run build:firefox`
5. Load the extension in Firefox:
   - Go to about:debugging#/runtime/this-firefox
   - Click "Load Temporary Add-on"
   - Select any file from the `dist-firefox` folder
6. For permanent installation:
   - Package the extension: `npm run package:firefox`
   - Go to about:addons in Firefox
   - Click the gear icon and select "Install Add-on From File..."
   - Select the `fichatgpt-firefox.xpi` file from the extension folder

### From Chrome Web Store
*(Coming soon)*

### From Firefox Add-ons
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
- `npm run build:firefox` - Build Firefox-compatible version
- `npm run package:firefox` - Package Firefox extension as .xpi
- `npm run watch` - Build with watch mode
- `npm run check` - TypeScript type checking
- `npm run test` - Run tests
- `npm run lint` - Lint code

### Cross-Browser Compatibility
The extension is built with cross-browser compatibility in mind. Key compatibility features:

- Uses a browser API compatibility layer to work with both Chrome and Firefox
- Maintains separate manifest configurations for different browsers
- Handles Firefox-specific permission requirements
- Manages browser-specific cookie access approaches
- Provides browser detection for optimal functionality

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

## Browser-Specific Notes

### Firefox Notes
- Container tabs in Firefox may affect cookie access
- Enhanced Tracking Protection may need to be disabled for certain domains
- First-party isolation may impact cookie operations

### Chrome Notes
- Works with all Chromium-based browsers (Edge, Brave, Opera, etc.)
- Service Worker implementation follows Chrome's Manifest V3 guidelines

## License
Proprietary. All rights reserved.

## Support
If you encounter any issues, please contact support@fisabytes.com 