# Replit Deployment Guide for Cookie Manager Extension

This document explains how your extension is deployed to Replit and how users can download it.

## How The Deployment Works

1. When you create a GitHub release, the CI/CD pipeline:
   - Builds your extension
   - Packages it into a ZIP file
   - Deploys the ZIP to your Replit's `releases` folder
   - Deploys the update manifest to your Replit's `public` folder

2. Users can download your extension from:
   - `https://cookie-manager-updates.amelianatasha3.repl.co/releases/cookie-manager-v1.0.0.zip`
   - (Replace 1.0.0 with your current version)

3. Chrome will automatically check for updates at:
   - `https://cookie-manager-updates.amelianatasha3.repl.co/public/updates.xml`

## Replit Project Structure

Your Replit project should have these folders:
- `releases/` - Where extension ZIP files are deployed
- `public/` - Where the update manifest is deployed

## Creating a Download Page

You can create a simple HTML page in your Replit project to make it easier for users to download your extension:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Cookie Manager Extension</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    .container { max-width: 800px; margin: 0 auto; }
    .download-button { 
      display: inline-block;
      background: #4285f4;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
    }
    .download-button:hover { background: #3b78e7; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Cookie Manager Extension</h1>
    <p>A browser extension for managing cookies with secure handling and validation.</p>
    
    <h2>Download</h2>
    <p>
      <a href="releases/cookie-manager-v1.0.0.zip" class="download-button">
        Download Latest Version
      </a>
    </p>
    
    <h2>Installation Instructions</h2>
    <ol>
      <li>Download the extension ZIP file</li>
      <li>Unzip the file to a folder on your computer</li>
      <li>Open Chrome and go to <code>chrome://extensions/</code></li>
      <li>Enable "Developer mode" (toggle in top-right corner)</li>
      <li>Click "Load unpacked"</li>
      <li>Select the folder containing the unzipped extension</li>
    </ol>
    
    <h2>Automatic Updates</h2>
    <p>This extension will automatically check for and install updates.</p>
  </div>
</body>
</html>
```

## Testing the Deployment

1. Create a GitHub release with a version tag (e.g., v1.0.0)
2. Wait for the GitHub Action to complete
3. Verify the files are deployed to your Replit
4. Test downloading and installing the extension

## Troubleshooting

If files aren't being deployed to Replit:
1. Check that your GitHub Action completed successfully
2. Verify that the `GH_PAT` secret is configured correctly (for private repositories)
3. Make sure your Replit repository name is correct 