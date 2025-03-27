# FiCHATGPT - Cookie Manager & ChatGPT Integration

A full-stack web application that combines advanced cookie management with ChatGPT integration features. This project provides lifetime access to ChatGPT TEAM accounts with enhanced functionality through secure cookie handling and browser extension technology.

## FiCHATGPT Features

🤖 **Enhanced ChatGPT Access**
- Lifetime access to ChatGPT without monthly subscriptions
- 3X higher message capacity compared to ChatGPT Plus (no hourly caps)
- Zero random logouts with stable sessions
- 1-Click FISABytes login integration

💼 **Licensing Model**
- Single device licensing (RM59 introductory offer)
- Bulk discounts for multiple devices
- Device transfer capability (up to 3x yearly)
- Compliance with OpenAI TEAM account policies

🔐 **Security & Privacy**
- All data stays in your browser
- No third-party servers involved
- Secure session management
- Account ban prevention system

## Implementation Status Update
**Last Updated:** March 28, 2025 04:53 UTC

### Current Progress
- **Phase 1 (Foundation)**: ~40% complete - Core extension framework and basic security features
- **BytesCookies Integration**: Successfully integrated BytesCookies extension architecture
- **ChatGPT Enhancement**: Implemented message capacity control and session stability
- **GitHub Preparation**: Created pre-integration snapshot and dedicated feature branch
- **Phases 2-5**: Not yet started

### Priority Items
1. Complete CI/CD pipeline for extension builds
2. Implement FISABytes login integration for one-click ChatGPT access
3. Begin device fingerprinting for single-device license enforcement
4. Develop lifetime access functionality for ChatGPT TEAM accounts

## Project Structure

```
/
├── extension/             # Main extension code
│   ├── src/               # Source code
│   │   ├── background.js  # Background script
│   │   └── popup.js       # Popup UI script
│   ├── public/            # Public assets
│   ├── manifest.json      # Extension manifest
│   └── .extension-id      # Extension ID for updates
├── fisapool BytesCookies/ # BytesCookies extension components for integration
│   ├── assets/            # JavaScript and CSS assets
│   ├── security/          # Security modules including CookieEncryption
│   ├── errors/            # Error handling modules
│   └── _locales/          # Localization files
├── tools/                 # Verification and debug tools
│   ├── verification/      # Tools for verifying cookies
│   │   ├── token-checker.html
│   │   ├── cookie-validation-tester.html
│   │   └── cookie-path-checker.js
│   └── debugging/         # Debugging utilities
│       └── github-cookie-debugger.js
├── docs/                  # Documentation
│   ├── github-cookie-troubleshooting.md
│   ├── verification-tools-summary.md
│   ├── CI-CD-README.md
│   └── REPLIT-DEPLOYMENT.md
├── server/                # Update server files
│   ├── public/            # Public assets for the server
│   │   └── updates.xml    # Update manifest
│   └── releases/          # Release files
│       └── replit-index.html
├── scripts/               # Build and deployment scripts
└── package.json           # Project dependencies
```

## External Resources

### Secret Storage

The project uses a separate repository for storing sensitive configuration and secrets:

- **Repository**: [https://github.com/fisapool/json](https://github.com/fisapool/json)
- **Purpose**: Securely store configuration values, API keys, and other sensitive data
- **Integration**: The main application fetches configuration from this repository as needed
- **Security**: Keeps sensitive data separate from the main codebase for enhanced security

### Authentication Flow

1. The extension authenticates with FISABytes using credentials stored in the secure repository
2. Authentication tokens are securely stored in cookies using AES encryption
3. The extension manages these tokens to provide seamless access to ChatGPT TEAM accounts

## Features

🔄 **Cookie Management**
- Export and import cookies for ChatGPT sessions
- Secure cookie handling for OpenAI authentication
- Validation and error checking
- Support for various cookie formats

🎨 **Modern UI/UX**
- Clean, responsive interface
- Real-time feedback
- Error notifications
- Loading states

🔒 **Security**
- Local operations
- Secure cookie validation
- Error boundaries
- Type-safe operations
- AES encryption implementation
- External secrets repository for sensitive data
- Separation of code and configuration

🔑 **FISABytes Integration** (In Progress)
- Secure token handling for ChatGPT access
- Session management system for stable connections
- Lifetime access functionality to ChatGPT TEAM accounts
- Message capacity control system (3X higher than standard limits)

## Upcoming Features

📱 **Device Management** (Planned)
- Device fingerprinting
- Single device restriction system
- Device transfer capability (3x/year)
- Multi-device license support

💳 **License System** (Planned)
- License activation system
- Usage monitoring
- Account management
- Tiered pricing structure

## Tools for Cookie Verification

The project includes several tools to help verify GitHub cookie loading:

1. **token-checker.html** - Verify GitHub token status and validity
2. **cookie-path-checker.js** - Check if cookies exist in expected GitHub paths
3. **cookie-validation-tester.html** - Validate cookie format and structure
4. **github-cookie-debugger.js** - Enhanced logging for extension debugging

## Development Setup

### Prerequisites
- Node.js 20.x or higher
- NPM or Yarn package manager
- Access to the [fisapool/json](https://github.com/fisapool/json) repository for secrets

### Installation
1. Clone the main repository:
```bash
git clone https://github.com/fisapool/FiCHATGPT.git
cd FiCHATGPT
```

2. Set up access to the secrets repository (contact repository admin for access):
```bash
# In a separate directory
git clone https://github.com/fisapool/json.git
```

3. Install dependencies:
```bash
npm install
```

4. Configure the application to use the secrets:
```bash
# Create a .env file with the path to your secrets repository
echo "SECRETS_PATH=/path/to/fisapool/json" > .env
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at http://0.0.0.0:5000

### Working with Secrets
- Never commit secrets directly to the main repository
- Always use the dedicated secrets repository for sensitive data
- When deploying, ensure the CI/CD pipeline has secure access to the secrets repo
- Rotate secrets regularly according to security best practices

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run watch` - Build with watch mode
- `npm run check` - Type checking
- `npm run test` - Run tests
- `npm run lint` - Lint code
- `npm run package` - Package the extension
- `npm run zip` - Create ZIP for distribution

## Deployment

The extension supports automatic updates through Chrome's built-in update system.
See the `docs/REPLIT-DEPLOYMENT.md` file for detailed instructions on the deployment process.

## Technical Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Radix UI Components
- **Backend**: Express.js, Node.js, TypeScript, PostgreSQL (via Drizzle ORM)
- **Security**: AES encryption, local storage, secure cookie validation
- **Infrastructure**: GitHub Actions for CI/CD (in progress), Replit for deployment
- **Integration**: OpenAI API, ChatGPT TEAM accounts, Browser extension API 