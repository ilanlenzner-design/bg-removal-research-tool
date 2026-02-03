# BG Compare Pro

A powerful research tool for comparing and evaluating background removal AI models. Test multiple state-of-the-art background removal models side-by-side and build a data-driven understanding of which model works best for different image types.

## ✨ Features

### 🔬 **Research Dashboard**
- Compare **5 AI models** simultaneously on any image
- **Inline scoring system** - rate each result directly under the image
- Organize tests by **9 categories** (Portrait, E-commerce, Cartoon, VFX, etc.)
- Track detailed metrics: Edge Accuracy, Detail Preservation, Transparency Quality
- Build a comprehensive **test database** of your findings

### 📊 **Analytics & Insights**
- View test history with filtering by category
- **Analytics dashboard** showing model performance statistics
- Average scores across all tests
- Winner badges showing top-performing models
- Export data as **JSON or CSV** for further analysis

### 🎨 **Manual Color Remover**
- Click-to-select color removal tool
- Adjustable tolerance slider
- Perfect for comparing manual vs AI results

### 🚀 **Production Ready**
- Server-side API key support (optional)
- Express backend with Replicate API proxy
- Deployed on Railway with automatic builds
- Responsive design for desktop and mobile

## 🤖 Supported Models

| Model | Best For | Strengths |
|-------|----------|-----------|
| **BRIA AI** | E-commerce, products, advertising | 256 transparency levels, 90% accuracy, commercial-safe |
| **BiRefNet** | Portraits, fine details, hair/fur | High-resolution specialist, bilateral processing |
| **CJWBW RemBG** | Product shots, clear subjects | Reliable u2net-based, high-contrast images |
| **Lucataco Tracer** | Cartoon/illustrated content | Fast processing, clean results |
| **851 Labs** | General purpose | Community model, versatile |

## 🎯 Use Cases

- **Research**: Determine which model works best for your specific image types
- **E-commerce**: Find the best background removal for product photos
- **Design Agencies**: Test and compare results for client work
- **Content Creation**: Optimize background removal for various media types
- **Education**: Learn about AI model performance and characteristics

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Replicate API key ([Get one here](https://replicate.com))

### Local Development

```bash
# Clone the repository
git clone https://github.com/ilanlenzner-design/replicate-bg-comparison.git
cd replicate-bg-comparison

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

### Environment Variables (Optional)

Create a `.env` file:

```bash
# Optional: Server-side API key for all users
REPLICATE_API_KEY=r8_your_api_key_here

# Port (default: 3000)
PORT=3000
```

## 🌐 Deployment to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)

### Manual Deployment

1. Push code to GitHub
2. Go to [Railway](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `replicate-bg-comparison`
5. (Optional) Add environment variable:
   - Name: `REPLICATE_API_KEY`
   - Value: Your Replicate API key
6. Generate a domain in Railway settings

**Railway will automatically:**
- Detect configuration from `railway.json`
- Run `npm install && npm run build`
- Start server with `node server.js`
- Deploy on a public URL

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 📖 How to Use

### 1. **Upload an Image**
- Drag & drop or click to browse
- Supports JPG, PNG, and other image formats

### 2. **Run AI Comparison**
- Click "Run AI Comparison"
- All 5 models process simultaneously
- Results appear with transparent backgrounds

### 3. **Score the Results**
- Click "Show Scoring" in Research Panel
- Rate each model (1-10) directly under its result:
  - **Edge Accuracy**: How clean are the edges?
  - **Detail Preservation**: Did it keep fine details?
  - **Transparency Quality**: How smooth is the alpha channel?
- Use sliders or type numbers directly

### 4. **Save to Database**
- Select a test category
- Give it a descriptive name
- Add notes about observations
- Click "Save Test to Database"

### 5. **Analyze Results**
- Click "Test Database" to view history
- Filter by category
- Switch to Analytics view for statistics
- Export data as JSON or CSV

## 🏗️ Project Structure

```
replicate-bg-comparison/
├── src/
│   ├── components/
│   │   ├── ModelScoreCard.jsx    # Inline scoring UI
│   │   ├── ResearchPanel.jsx      # Test metadata input
│   │   └── TestHistory.jsx        # Database & analytics
│   ├── services/
│   │   ├── replicate.js           # API integration
│   │   └── testDatabase.js        # LocalStorage database
│   ├── App.jsx                    # Main application
│   └── index.css                  # Styles
├── server.js                      # Express backend
├── railway.json                   # Railway config
├── vite.config.js                 # Vite config
└── package.json                   # Dependencies
```

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Backend**: Express, Node.js
- **API**: Replicate AI models
- **Storage**: LocalStorage (client-side database)
- **Deployment**: Railway
- **Styling**: CSS with custom properties

## 📊 Research Framework

The app includes a comprehensive research framework with:

- **9 Test Categories**: Portrait, E-commerce, Cartoon, Animals, Complex Backgrounds, Fine Details, VFX/Particles, Transparent Objects, Challenging Scenarios
- **Scoring System**: 3 metrics rated 1-10, auto-calculated overall score
- **Test History**: Searchable, filterable database of all tests
- **Analytics**: Average scores, category breakdown, model rankings
- **Export**: JSON for backups, CSV for spreadsheet analysis

See [RESEARCH-FRAMEWORK.md](./RESEARCH-FRAMEWORK.md) for detailed testing methodology.

## 🤝 Contributing

Contributions are welcome! Here are some ways to contribute:

- Report bugs or request features via [Issues](https://github.com/ilanlenzner-design/replicate-bg-comparison/issues)
- Submit pull requests with improvements
- Add new model integrations
- Improve documentation
- Share your research findings

## 📄 API Key Options

### Option 1: Server-Side Key (Recommended for personal use)
Set `REPLICATE_API_KEY` in Railway variables. All users share the same key.

**Pros:**
- Users don't need to create Replicate accounts
- Simpler UX
- Centralized billing

**Cons:**
- All API costs come from your account
- Not suitable for public/high-traffic deployments

### Option 2: User-Provided Keys
Don't set server-side key. Users enter their own Replicate API keys.

**Pros:**
- Each user pays for their own usage
- Scalable for public use
- No liability for API costs

**Cons:**
- Requires users to have Replicate accounts
- Extra setup step

## 🔒 Security Notes

- API keys are never exposed in client-side code
- Server proxies all API requests to prevent CORS issues
- LocalStorage data stays on user's browser
- No data is sent to any third-party servers (except Replicate API)

## 📝 License

MIT License - Feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- **Replicate** for providing the AI model API
- **BRIA AI**, **men1scus**, **cjwbw**, **lucataco**, **851 Labs** for their amazing background removal models
- Built with Claude Code

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

**Built with ❤️ for designers, researchers, and developers who need the best background removal tools.**

⭐ Star this repo if you find it useful!
