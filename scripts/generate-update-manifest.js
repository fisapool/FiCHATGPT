/**
 * Generates the update manifest (updates.xml) for Chrome extension auto-updates
 * This allows for self-hosted extension updates without using the Chrome Web Store
 */
const fs = require('fs');
const path = require('path');

// Read the package.json to get the current version
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

// Read the manifest to get the extension ID
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
let extensionId = '';

// Try to get the extension ID from different possible locations
if (manifest.key) {
  // If there's a key, we can use that to derive the ID
  extensionId = 'Generated from key - please update manually';
} else if (fs.existsSync('.extension-id')) {
  // If there's an extension ID file, use that
  extensionId = fs.readFileSync('.extension-id', 'utf8').trim();
} else {
  console.warn('Extension ID not found. Using default ID from configuration.');
  extensionId = 'kpoenjclohjdooogoebngneeddjadbhg'; // Default to your extension ID
}

// Configure the update URL - this should be your Replit deployment or server
const updateBaseUrl = process.env.UPDATE_BASE_URL || 'https://cookie-manager-updates.amelianatasha3.repl.co';
const zipFilename = `cookie-manager-v${version}.zip`;

// Create the updates.xml content
const updatesXml = `<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='${extensionId}'>
    <updatecheck codebase='${updateBaseUrl}/releases/${zipFilename}' version='${version}' />
  </app>
</gupdate>`;

// Write the updates.xml file
const updatesDir = 'public';
if (!fs.existsSync(updatesDir)) {
  fs.mkdirSync(updatesDir, { recursive: true });
}

fs.writeFileSync(path.join(updatesDir, 'updates.xml'), updatesXml);
console.log(`Update manifest generated: ${path.join(updatesDir, 'updates.xml')}`);
console.log(`Extension version: ${version}`);
console.log(`Extension ID: ${extensionId}`);
console.log(`Update URL: ${updateBaseUrl}/releases/${zipFilename}`); 