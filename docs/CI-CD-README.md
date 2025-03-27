# Cookie Manager Extension CI/CD Pipeline

This document describes the Continuous Integration and Continuous Deployment (CI/CD) pipeline set up for the Cookie Manager browser extension.

## Pipeline Overview

The CI/CD pipeline automates the following tasks:

1. **Building** the extension
2. **Testing** the code
3. **Packaging** the extension
4. **Creating releases**
5. **Deploying** to both Chrome Web Store and a self-hosted update server (Replit)

## Workflow Stages

The pipeline consists of two main jobs:

### 1. Build Job

Triggered on:
- Push to `main` branch
- Pull requests to `main` branch
- Release creation

Steps:
- Set up Node.js environment
- Install dependencies
- Lint the code
- Type check with TypeScript
- Build the extension
- Run tests
- Package the extension
- Create a ZIP file for distribution
- Upload build artifacts

### 2. Deploy Job

Triggered only on:
- Release creation

Steps:
- Download build artifacts
- Set the version from the release tag
- Generate the update manifest for self-hosted updates
- Deploy the extension ZIP to Replit
- Deploy the update manifest to Replit
- Upload the extension to Chrome Web Store

## Required GitHub Secrets

To use this pipeline, you need to set up the following GitHub secrets:

### For Replit Deployment
- `UPDATE_BASE_URL`: The base URL of your Replit deployment
- `REPLIT_REPO`: The GitHub repository name for your Replit deployment

### For Chrome Web Store Publishing
- `EXTENSION_ID`: Your Chrome extension ID
- `CLIENT_ID`: OAuth 2.0 client ID for Chrome Web Store API
- `CLIENT_SECRET`: OAuth 2.0 client secret
- `REFRESH_TOKEN`: OAuth 2.0 refresh token

## How to Create a Release

1. Make sure all changes are committed and pushed to the `main` branch
2. Update the version in `package.json`
3. Create a new tag, e.g., `git tag v1.0.1`
4. Push the tag to GitHub: `git push origin v1.0.1`
5. Create a new release on GitHub based on this tag
6. The CI/CD pipeline will automatically:
   - Build and package the extension
   - Deploy it to Replit
   - Update the Chrome Web Store

## Self-Hosted Update System

The extension is configured to use a self-hosted update system through Replit. The update manifest (`updates.xml`) is generated during the deployment process and uploaded to Replit.

To configure your extension for self-hosted updates:
1. Add the following to your `manifest.json`:
   ```json
   "update_url": "https://your-repl.replit.dev/updates.xml"
   ```
2. Create a `.extension-id` file in the project root with your extension ID

## Troubleshooting

### Build Failures
- Check the GitHub Actions logs for specific error messages
- Common issues include linting errors, type errors, or test failures

### Deployment Failures
- Verify that all required secrets are set up correctly
- Check that the Replit repository exists and is accessible
- For Chrome Web Store failures, verify that your OAuth credentials are valid

## Manual Deployment

If needed, you can also deploy manually:
```bash
# Build and package
npm run build
npm run package
npm run zip

# Generate update manifest
UPDATE_BASE_URL=https://your-repl.replit.dev node scripts/generate-update-manifest.js

# Then upload manually to Chrome Web Store and Replit
``` 