# Deploy to Railway

This guide will help you deploy the Replicate BG Comparison app to Railway.

## Prerequisites

- Railway account (sign up at https://railway.app)
- Replicate API key (get one at https://replicate.com)

## Deployment Steps

### Option 1: Using Railway CLI (Recommended)

1. **Login to Railway** (you'll need to do this in your terminal):
   ```bash
   railway login
   ```
   This will open a browser window for authentication.

2. **Navigate to the project directory**:
   ```bash
   cd /Users/ilan/.gemini/antigravity/scratch/replicate-bg-comparison
   ```

3. **Initialize Railway project**:
   ```bash
   railway init
   ```
   - Select "Create new project"
   - Give it a name like "replicate-bg-comparison"

4. **Deploy the app**:
   ```bash
   railway up
   ```

5. **Add a domain**:
   ```bash
   railway domain
   ```
   This will generate a public URL for your app.

6. **Done!** Your app should be live at the generated URL.

### Option 2: Using Railway Dashboard

1. Go to https://railway.app/new

2. Click "Deploy from GitHub repo"

3. Push this code to GitHub first:
   ```bash
   cd /Users/ilan/.gemini/antigravity/scratch/replicate-bg-comparison
   gh repo create replicate-bg-comparison --public --source=. --push
   ```

4. Select the repository in Railway

5. Railway will automatically detect the configuration and deploy

6. Add a domain in the Railway dashboard settings

## Environment Variables (Optional)

You can optionally set a server-side API key in Railway so all users share the same key:

1. Go to your Railway project dashboard
2. Click on your deployment
3. Go to "Variables" tab
4. Add a new variable:
   - **Name:** `REPLICATE_API_KEY`
   - **Value:** `r8_your_api_key_here`

If set, users won't need to enter their own API key - the app will use the server-side key automatically.

**Important:** If you set a server-side key, all API usage will be billed to your Replicate account.

## Without Environment Variables

If no server-side API key is set:
- Users will enter their own Replicate API key in the web interface
- Keys are stored in browser localStorage for convenience
- Each user's API usage is billed to their own Replicate account

## Technical Notes

- The Express server proxies all Replicate API requests to avoid CORS issues

## Project Structure

- `src/` - React frontend source code
- `server.js` - Express backend for production
- `dist/` - Built frontend files (generated during deployment)
- `railway.json` - Railway deployment configuration

## How It Works

1. Railway builds the Vite app (`npm run build`)
2. Starts the Express server (`node server.js`)
3. Express serves the static files from `dist/`
4. Express proxies `/replicate/*` requests to Replicate API
5. Users access the app and enter their API key in the settings

## Local Development

To run locally:
```bash
npm install
npm run dev
```

This uses Vite's dev server with proxy configured in `vite.config.js`.
