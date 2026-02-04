# Google Apps Script Setup - Quick Start

This guide shows you how to deploy BG Compare Pro using Google Apps Script for **free, permanent storage**.

## Why Google Apps Script?

✅ **Free forever** - No hosting costs
✅ **Persistent data** - Never loses data (stored in Google Sheets)
✅ **Multi-user ready** - Shared database automatically
✅ **Easy setup** - 15 minutes to deploy
✅ **View data anytime** - Just open the Google Sheet

## Setup Steps

### 1. Create Google Sheet Database (2 minutes)

1. Go to [sheets.google.com](https://sheets.google.com)
2. Create new blank spreadsheet
3. Name it: **BG Compare Pro Database**
4. Copy the spreadsheet ID from URL:
   - Example URL: `https://docs.google.com/spreadsheets/d/1abc123xyz/edit`
   - Copy: `1abc123xyz`

### 2. Create Apps Script (5 minutes)

1. In your Google Sheet: **Extensions → Apps Script**
2. Delete default code
3. Copy **ALL** code from `google-apps-script/Code.gs`
4. Paste into Apps Script editor
5. **Important:** Replace `YOUR_SPREADSHEET_ID_HERE` with your ID from Step 1
6. Click **Save** (💾 icon)

### 3. Deploy Web App (5 minutes)

1. Click **Deploy → New deployment**
2. Click gear icon ⚙️ → Select **Web app**
3. Settings:
   - **Description:** BG Compare Pro API
   - **Execute as:** Me
   - **Who has access:** **Anyone** ← Important!
4. Click **Deploy**
5. **Authorize:**
   - Click **Authorize access**
   - Choose your Google account
   - Click **Advanced** → **Go to [Project] (unsafe)**
   - Click **Allow**
6. **Copy the Web App URL** - it looks like:
   ```
   https://script.google.com/macros/s/ABC123xyz.../exec
   ```

### 4. Update Frontend Config (3 minutes)

Open `src/services/config.js` and update line 8:

```javascript
// Change from:
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// To your Apps Script URL:
export const API_BASE_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
```

**Or** set environment variable:
```bash
# Create .env file
echo "VITE_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec" > .env
```

### 5. Deploy Frontend

**Option A: Vercel (Recommended - Easiest)**
```bash
npm i -g vercel
vercel --prod
```

**Option B: Render**
- Build command: `npm run build`
- Publish directory: `dist`

**Option C: Netlify**
- Build command: `npm run build`
- Publish directory: `dist`

## Testing

Test your API:
```bash
# Should return []
curl "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?path=tests"
```

## Optional: Add Replicate API Key

To have server provide the API key (so users don't need to enter it):

1. In Apps Script: **Project Settings** (⚙️)
2. **Script Properties** → **Add property**
3. Key: `REPLICATE_API_KEY`
4. Value: Your Replicate API key (starts with `r8_...`)
5. Save

## Updating Your Deployment

Made changes to the code?

1. Edit code in Apps Script editor
2. **Deploy → Manage deployments**
3. Click edit icon ✏️
4. **Version → New version**
5. Click **Deploy**

URL stays the same!

## View Your Data

Just open your Google Sheet! New sheet called "TestData" will be created automatically with all test data.

## Troubleshooting

**"Authorization required" error:**
- Go to Apps Script → Deploy → Manage deployments
- Make sure "Who has access" = **Anyone**

**Data not saving:**
- Check the Google Sheet for "TestData" sheet
- Look at Apps Script logs: **View → Executions**

**CORS errors:**
- Apps Script handles CORS automatically if deployed correctly
- Make sure deployment is set to "Anyone" access

## Cost

**$0/month forever** ✨

Google Apps Script free tier includes:
- 20,000 URL requests/day
- Unlimited spreadsheet storage
- 99.9% uptime

Perfect for a research tool used by a team!
