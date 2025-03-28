#!/usr/bin/env node

/**
 * Firefox Build Script
 * 
 * This script creates a Firefox-compatible version of the FiCHATGPT extension.
 * It modifies the manifest.json and other files as needed for Firefox compatibility.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuration
const sourceDir = path.resolve(__dirname, '../extension');
const distDir = path.resolve(__dirname, '../extension/dist');
const firefoxDistDir = path.resolve(__dirname, '../extension/dist-firefox');

// Ensure the Firefox distribution directory exists
if (!fs.existsSync(firefoxDistDir)) {
  fs.mkdirSync(firefoxDistDir, { recursive: true });
}

/**
 * Run the standard build process first
 */
function runStandardBuild() {
  return new Promise((resolve, reject) => {
    console.log('Building standard extension...');
    exec('npm run build', { cwd: sourceDir }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Build error: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`Build stderr: ${stderr}`);
      }
      console.log(`Build stdout: ${stdout}`);
      resolve();
    });
  });
}

/**
 * Modify the manifest for Firefox compatibility
 */
function modifyManifest() {
  console.log('Modifying manifest for Firefox compatibility...');
  
  const manifestPath = path.join(distDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Clone the manifest for Firefox
  const firefoxManifest = { ...manifest };
  
  // Firefox-specific adjustments
  if (firefoxManifest.background && firefoxManifest.background.service_worker) {
    // Firefox uses 'scripts' instead of 'service_worker' in MV3
    const scriptPath = firefoxManifest.background.service_worker;
    firefoxManifest.background = {
      scripts: [scriptPath],
      type: "module"
    };
  }
  
  // Firefox requires browser_specific_settings
  firefoxManifest.browser_specific_settings = {
    gecko: {
      id: "fichatgpt@fisabytes.com",
      strict_min_version: "109.0"
    }
  };
  
  // Fix permissions
  if (firefoxManifest.permissions && 
      firefoxManifest.permissions.includes('webRequestBlocking')) {
    // Firefox handles webRequestBlocking differently
    firefoxManifest.permissions = firefoxManifest.permissions.filter(
      (p) => p !== 'webRequestBlocking'
    );
    
    if (!firefoxManifest.permissions.includes('webRequest')) {
      firefoxManifest.permissions.push('webRequest');
    }
  }
  
  // Write the modified manifest to the Firefox dist directory
  fs.writeFileSync(
    path.join(firefoxDistDir, 'manifest.json'),
    JSON.stringify(firefoxManifest, null, 2)
  );
  
  return firefoxManifest;
}

/**
 * Copy files from standard dist to Firefox dist
 */
function copyFiles() {
  console.log('Copying files to Firefox distribution...');
  
  // Get all files from the dist directory
  const files = getAllFiles(distDir);
  
  files.forEach(file => {
    const relativePath = path.relative(distDir, file);
    const targetPath = path.join(firefoxDistDir, relativePath);
    
    // Ensure target directory exists
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Skip the manifest.json as we've already created a modified version
    if (path.basename(file) === 'manifest.json') {
      return;
    }
    
    // Copy the file
    fs.copyFileSync(file, targetPath);
  });
}

/**
 * Get all files in a directory recursively
 */
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Create a Firefox package (.xpi file)
 */
function createPackage() {
  console.log('Creating Firefox package (.xpi)...');
  
  return new Promise((resolve, reject) => {
    const packagePath = path.resolve(__dirname, '../extension/fichatgpt-firefox.xpi');
    
    // Use web-ext to build the package
    exec(
      `npx web-ext build --source-dir "${firefoxDistDir}" --artifacts-dir "${path.dirname(packagePath)}" --filename "fichatgpt-firefox.xpi" --overwrite-dest`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Package error: ${error.message}`);
          return reject(error);
        }
        if (stderr) {
          console.error(`Package stderr: ${stderr}`);
        }
        console.log(`Package stdout: ${stdout}`);
        console.log(`Firefox package created at: ${packagePath}`);
        resolve();
      }
    );
  });
}

/**
 * Main build process
 */
async function main() {
  try {
    console.log('Starting Firefox build process...');
    
    // Run the standard build first
    await runStandardBuild();
    
    // Modify the manifest for Firefox
    const firefoxManifest = modifyManifest();
    
    // Copy files from standard dist to Firefox dist
    copyFiles();
    
    // Create the Firefox package
    await createPackage();
    
    console.log('Firefox build completed successfully!');
  } catch (error) {
    console.error('Firefox build failed:', error);
    process.exit(1);
  }
}

// Run the build process
main(); 