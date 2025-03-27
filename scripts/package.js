/**
 * Packages the extension by copying necessary files to the dist directory
 * and generating the manifest.json file with the current version.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read the package.json to get the current version
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

// Ensure the dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

// Copy static assets to the dist directory
const staticAssets = [
  '_locales',
  'icons',
  'css',
  'popup.html',
  'options.html',
];

staticAssets.forEach(asset => {
  if (fs.existsSync(asset)) {
    const destPath = path.join('dist', asset);
    if (fs.existsSync(destPath)) {
      if (fs.lstatSync(destPath).isDirectory()) {
        execSync(`rm -rf "${destPath}"`);
      } else {
        fs.unlinkSync(destPath);
      }
    }
    
    if (fs.lstatSync(asset).isDirectory()) {
      execSync(`cp -R "${asset}" "${destPath}"`);
    } else {
      fs.copyFileSync(asset, destPath);
    }
  }
});

// Read the manifest template and update the version
let manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
manifest.version = version;

// Write the updated manifest to the dist directory
fs.writeFileSync(path.join('dist', 'manifest.json'), JSON.stringify(manifest, null, 2));

console.log(`Extension packaged successfully with version ${version}`); 