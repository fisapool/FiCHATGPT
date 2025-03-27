const https = require('https');

/**
 * Utility to check if GitHub cookies exist in the expected repository path
 * This script verifies if cookies for a specific domain exist in the expected path in the GitHub repository
 */

// Configuration
const GITHUB_CONFIG = {
  repo: 'fisapool/json',
  baseUrl: 'api.github.com',
  contentEndpoint: '/repos/fisapool/json/contents',
  defaultBranch: 'main'
};

// Domain to check (default is github.com)
const domain = process.argv[2] || 'github.com';
const formattedDomain = domain.replace(/\./g, '_');
const path = `cookies/${formattedDomain}/cookies.json`;

console.log(`Checking for cookies at path: ${path}`);

// GitHub token should be provided as an environment variable or command line argument
const token = process.argv[3] || process.env.GITHUB_TOKEN;

if (!token) {
  console.error('Error: GitHub token is required.');
  console.error('Usage: node cookie-path-checker.js [domain] [token]');
  console.error('  or set GITHUB_TOKEN environment variable');
  process.exit(1);
}

// Options for the HTTPS request
const options = {
  hostname: GITHUB_CONFIG.baseUrl,
  path: `${GITHUB_CONFIG.contentEndpoint}/${path}`,
  method: 'GET',
  headers: {
    'User-Agent': 'Cookie-Path-Checker',
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json'
  }
};

// Make the request
const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      const response = JSON.parse(data);
      console.log('\n✅ Cookie file exists at the expected path!');
      console.log(`SHA: ${response.sha}`);
      console.log(`Size: ${response.size} bytes`);
      console.log(`URL: ${response.html_url}`);
      
      // Since the content is Base64 encoded, we can check if it's a valid JSON after decoding
      try {
        const content = Buffer.from(response.content, 'base64').toString('utf-8');
        JSON.parse(content); // Just to validate it's JSON
        console.log('Content validation: The file contains valid JSON data.');
      } catch (error) {
        console.error('⚠️ Content validation: The file does not contain valid JSON data.');
      }
    } else if (res.statusCode === 404) {
      console.error(`\n❌ The cookie file does not exist at path: ${path}`);
      console.error('Possible reasons:');
      console.error('1. Cookies for this domain have never been saved to GitHub');
      console.error('2. The repository structure is different than expected');
      console.error('3. The domain format in the path is different than expected');
      
      // Check if the cookies directory exists
      checkDirectory(`cookies`);
    } else {
      console.error(`\n❌ Error checking path: HTTP ${res.statusCode}`);
      console.error(`Response: ${data}`);
    }
  });
});

req.on('error', (error) => {
  console.error(`\n❌ Request error: ${error.message}`);
});

req.end();

// Function to check if a directory exists
function checkDirectory(dirPath) {
  const directoryOptions = {
    ...options,
    path: `${GITHUB_CONFIG.contentEndpoint}/${dirPath}`
  };
  
  const directoryReq = https.request(directoryOptions, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log(`\n✅ Directory ${dirPath} exists.`);
        
        // If we found the cookies directory, check for the domain directory
        if (dirPath === 'cookies') {
          checkDirectory(`cookies/${formattedDomain}`);
        }
        
        // List contents of the directory
        try {
          const contents = JSON.parse(data);
          console.log('\nDirectory contents:');
          contents.forEach(item => {
            console.log(`- ${item.name} (${item.type})`);
          });
        } catch (error) {
          console.error('Error parsing directory contents:', error.message);
        }
      } else if (res.statusCode === 404) {
        console.error(`\n❌ Directory ${dirPath} does not exist.`);
      } else {
        console.error(`\n❌ Error checking directory: HTTP ${res.statusCode}`);
      }
    });
  });
  
  directoryReq.on('error', (error) => {
    console.error(`\n❌ Directory request error: ${error.message}`);
  });
  
  directoryReq.end();
} 