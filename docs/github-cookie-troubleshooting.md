# GitHub Cookie Loading Troubleshooting Guide

This guide will help you diagnose and fix issues with loading cookies from GitHub in the Cookie Manager extension.

## Common Issues and Solutions

When the Cookie Manager extension fails to load cookies from GitHub, it's typically due to one of these issues:

1. **Missing GitHub Token**
2. **Invalid GitHub Repository Access**
3. **Missing Cookie Data in GitHub**
4. **Cookie Validation Issues**
5. **Encrypted Data Format Issues**

## Verification Steps

Follow these steps to diagnose the specific issue:

### Step 1: Check the Browser Console for Errors

1. Open GitHub in your browser
2. Right-click anywhere on the page and select "Inspect" or press F12
3. Go to the "Console" tab
4. Look for error messages related to:
   - GitHub API
   - Token validation
   - Cookie loading
   - Repository access
   - Decryption errors

### Step 2: Verify GitHub Token Status

Use the `token-checker.html` tool to verify if your GitHub token is properly set and has the correct permissions:

1. Open the `token-checker.html` file in your browser
2. Click "Check Token in Storage" to see if a token is already stored
3. If no token is found or you want to test a different token:
   - Enter your GitHub Personal Access Token in the input field
   - Click "Test Token" to verify access to the repository

**Make sure your token has these permissions:**
- `repo` scope for private repositories
- `read:packages` if needed for the specific repository

### Step 3: Check Cookie Path Structure in GitHub

Use the `cookie-path-checker.js` script to verify if the expected cookie data exists in GitHub:

```bash
# Install Node.js if you haven't already
# Then run:
node cookie-path-checker.js github.com YOUR_GITHUB_TOKEN
```

This script will check if:
- The cookies directory exists in the repository
- The domain-specific directory exists (e.g., github_com)
- The cookies.json file exists
- The content is valid JSON

### Step 4: Validate Cookie Format

If the cookies exist but aren't loading correctly, check if they have the correct format:

1. Open the `cookie-validation-tester.html` file in your browser
2. Export cookies from your browser or fetch them from GitHub
3. Paste the cookie JSON into the validation tool
4. Click "Validate Cookies" to check for format issues

The tool will check for required fields and other validation criteria.

### Step 5: Enable Debugging in the Extension

Add the `github-cookie-debugger.js` file to your extension to get detailed logging:

1. Include the script in your extension's background or content script
2. Check the browser console for detailed logs about:
   - GitHub API requests
   - Token validation
   - Cookie operations
   - Errors during the process

## Fixing Common Issues

### Missing GitHub Token
- Generate a new Personal Access Token on GitHub
- Add the token to the extension settings
- Make sure to grant the appropriate permissions

### Invalid Repository Access
- Verify that the repository exists and is accessible with your token
- Check that your token has the correct scope permissions

### Missing Cookie Data
- Manually save cookies first before trying to load them
- Check if the repository structure matches what the extension expects

### Cookie Validation Issues
- Ensure cookies include all required fields (domain, name, value, path)
- Make sure cookies for secure domains (like GitHub) have the secure flag set

### Encrypted Data Format Issues
- Re-export cookies using the extension to ensure proper encryption format
- Verify the encryption key is consistent between export and import

## Need More Help?

If you've tried all these steps and still have issues, please submit a bug report with:
1. The specific error message from the console
2. Which verification steps you've tried
3. The results of the token and cookie validation tests

---

*This troubleshooting guide is provided for the Cookie Manager Web Application.* 