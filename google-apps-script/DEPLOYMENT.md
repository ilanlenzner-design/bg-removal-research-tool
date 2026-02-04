# Google Apps Script Deployment Guide

This guide will help you deploy the BG Compare Pro backend using Google Apps Script.

## Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it "BG Compare Pro Database"
4. Copy the spreadsheet ID from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit`
   - Example: If URL is `https://docs.google.com/spreadsheets/d/1abc123xyz/edit`
   - Your ID is: `1abc123xyz`

## Step 2: Create Apps Script Project

1. In your Google Sheet, click **Extensions** → **Apps Script**
2. Delete the default `function myFunction() {}` code
3. Copy all code from `Code.gs` and paste it into the Apps Script editor
4. Replace `YOUR_SPREADSHEET_ID_HERE` with your actual spreadsheet ID (from Step 1)

## Step 3: Set API Key (Optional)

If you want the server to provide a Replicate API key:

1. In Apps Script editor, click **Project Settings** (gear icon)
2. Scroll to **Script Properties**
3. Click **Add script property**
4. Key: `REPLICATE_API_KEY`
5. Value: Your Replicate API key (starts with `r8_...`)
6. Click **Save**

## Step 4: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Fill in the settings:
   - **Description**: BG Compare Pro API
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
5. Click **Deploy**
6. **Authorize access** when prompted:
   - Click **Authorize access**
   - Select your Google account
   - Click **Advanced** → **Go to [Project Name] (unsafe)**
   - Click **Allow**
7. Copy the **Web app URL** (it will look like: `https://script.google.com/macros/s/ABC123.../exec`)

## Step 5: Update Frontend Configuration

Update your React app to use the Apps Script URL:

1. Open `src/services/config.js` (we'll create this file)
2. Set the API base URL to your Apps Script web app URL

Or add it as an environment variable:
```bash
VITE_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

## Step 6: Deploy Frontend

Deploy your React app as static files on:
- **Render**: Set build command to `npm run build`, publish directory to `dist`
- **Vercel**: Auto-detects Vite, just connect your GitHub repo
- **Netlify**: Build command `npm run build`, publish directory `dist`
- **GitHub Pages**: Use `gh-pages` branch with dist folder

## Testing

1. Test the API endpoint:
   ```bash
   curl "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?path=tests"
   ```
   Should return `[]` (empty array)

2. Test creating a test:
   ```bash
   curl -X POST "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?path=tests" \
     -H "Content-Type: application/json" \
     -d '{"category":"portrait","name":"Test"}'
   ```

## Updating the Deployment

When you make changes to the Apps Script:

1. Edit the code in Apps Script editor
2. Click **Deploy** → **Manage deployments**
3. Click the edit icon ✏️ next to your deployment
4. Click **Version** → **New version**
5. Click **Deploy**

The URL stays the same, but you must create a new version for changes to take effect.

## Benefits of This Approach

✅ **Free forever** - No hosting costs
✅ **Persistent data** - Stored in Google Sheets
✅ **Multi-user** - Shared database automatically
✅ **No maintenance** - Google handles all infrastructure
✅ **Easy to view data** - Just open the Google Sheet
✅ **Export built-in** - Download as Excel/CSV from Sheets
✅ **Reliable** - 99.9% uptime from Google

## Troubleshooting

**"Authorization required" error:**
- Go to Apps Script → Deploy → Manage deployments
- Make sure "Who has access" is set to "Anyone"

**"Service invoked too many times" error:**
- Apps Script has usage limits (free tier: ~20,000 calls/day)
- Upgrade to workspace account for higher limits

**CORS errors:**
- Make sure your deployment is set to "Anyone" access
- Apps Script automatically handles CORS for web apps

**Data not appearing:**
- Check the Google Sheet - new sheet "TestData" should be created
- Look at Apps Script logs: View → Executions
