/**
 * Creates a ZIP file of the extension for distribution to the Chrome Web Store
 * and for self-hosted updates.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read the package.json to get the current version
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

// Create a releases directory if it doesn't exist
if (!fs.existsSync('releases')) {
  fs.mkdirSync('releases', { recursive: true });
}

// Define the output ZIP filename
const zipFilename = `cookie-manager-v${version}.zip`;
const zipPath = path.join('releases', zipFilename);

// Remove the zip file if it already exists
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

// Create a ZIP of the dist directory
try {
  // Use the zip command on Linux/Mac, or powershell on Windows
  if (process.platform === 'win32') {
    const powershellCommand = `Compress-Archive -Path "./dist/*" -DestinationPath "${zipPath}" -Force`;
    execSync(`powershell -command "${powershellCommand}"`, { stdio: 'inherit' });
  } else {
    execSync(`cd dist && zip -r "../${zipPath}" ./*`, { stdio: 'inherit' });
  }
  console.log(`Extension zipped successfully: ${zipPath}`);
} catch (error) {
  console.error('Error creating ZIP file:', error);
  process.exit(1);
} 