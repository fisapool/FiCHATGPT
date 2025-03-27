# FiChatGPT Cookie Manager Extension

A secure cookie management extension for ChatGPT with a modern React UI and robust error handling.

## Features

- **Secure Cookie Storage**: Encrypt and securely store browser cookies
- **Import/Export**: Easily backup and restore your cookies
- **Clean UI**: Modern, responsive interface for easy management
- **Encrypted Storage**: AES encryption of cookie data
- **Domain Filtering**: Filter cookies by domain
- **Error Handling**: Robust error recovery mechanisms

## Security Features

- AES-256 encryption for cookie data
- HMAC validation for data integrity
- PBKDF2 key derivation with strong salting
- Secure local storage

## Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```
cd extension
npm install
```

3. Build the extension:
```
npm run build
```

4. Load the extension in Chrome/Edge:
   - Go to `chrome://extensions`
   - Enable Developer Mode
   - Click "Load unpacked"
   - Select the `extension/dist` directory

### Development Workflow

- `npm run dev`: Run webpack in watch mode for development
- `npm run build`: Build for production
- `npm test`: Run tests

## Credits

This extension is based on the BytesCookies extension framework, integrating security features from the FISAPool project.

## License

MIT 