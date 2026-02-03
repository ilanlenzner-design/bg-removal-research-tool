import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// API Key endpoint - provides server-side API key if set
app.get('/api/config', (req, res) => {
    res.json({
        apiKey: process.env.REPLICATE_API_KEY || null,
        hasServerKey: !!process.env.REPLICATE_API_KEY
    });
});

// Proxy for Replicate API
app.all('/replicate/*', async (req, res) => {
    const replicatePath = req.path.replace('/replicate', '');
    const url = `https://api.replicate.com/v1${replicatePath}`;

    try {
        const headers = {
            'Content-Type': 'application/json',
            ...req.headers
        };

        // Remove host header to avoid conflicts
        delete headers.host;
        delete headers['content-length'];

        const options = {
            method: req.method,
            headers: headers,
        };

        if (req.body && Object.keys(req.body).length > 0) {
            options.body = JSON.stringify(req.body);
        }

        const response = await fetch(url, options);
        const data = await response.json();

        res.status(response.status).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Proxy request failed', details: error.message });
    }
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
