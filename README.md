# Cookie Manager Web Application

A full-stack web application for managing browser cookies with a modern React frontend and Express backend. The application provides a secure and efficient way to handle cookie operations.

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

## Features

🔄 **Cookie Management**
- Export and import cookies
- Secure cookie handling
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

## Tools for Cookie Verification

The project includes several tools to help verify GitHub cookie loading:

1. **token-checker.html** - Verify GitHub token status and validity
2. **cookie-path-checker.js** - Check if cookies exist in expected GitHub paths
3. **cookie-validation-tester.html** - Validate cookie format and structure
4. **github-cookie-debugger.js** - Enhanced logging for extension debugging

## Development Setup

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

The application will be available at http://0.0.0.0:5000

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