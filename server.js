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
        hasServerKey: !!process.env.REPLICATE_API_KEY,
        hasClaudeKey: !!process.env.ANTHROPIC_API_KEY
    });
});

// Image analysis endpoint - uses Claude Vision to analyze images
app.post('/api/analyze-image', async (req, res) => {
    try {
        const { imageUrl } = req.body;
        const anthropicKey = process.env.ANTHROPIC_API_KEY;

        if (!anthropicKey) {
            return res.status(400).json({
                error: 'Image analysis not configured. Set ANTHROPIC_API_KEY environment variable.'
            });
        }

        // Prepare the image for Claude API
        let imageData;
        if (imageUrl.startsWith('data:')) {
            // Extract base64 from data URL
            const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
                imageData = {
                    type: 'base64',
                    media_type: matches[1],
                    data: matches[2]
                };
            }
        }

        if (!imageData) {
            return res.status(400).json({ error: 'Invalid image format' });
        }

        // Call Claude API for image analysis
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': anthropicKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 500,
                messages: [{
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: imageData
                        },
                        {
                            type: 'text',
                            text: `Analyze this image for background removal purposes. Provide:

**Subject**: What's the main subject?
**Style**: Photo/cartoon/illustration/3D?
**Background**: Simple/complex/gradient/textured?
**Details**: Hair, fur, transparency, glow effects?
**Challenges**: What makes BG removal difficult?
**Recommended Category**: Portrait/E-commerce/Cartoon/Animals/Complex/Fine-Details/VFX/Transparent/Challenging

Keep under 150 words, be concise and specific.`
                        }
                    ]
                }]
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Claude API error:', error);
            return res.status(response.status).json({ error: 'Failed to analyze image' });
        }

        const result = await response.json();
        const analysis = result.content[0].text;

        res.json({ analysis });
    } catch (error) {
        console.error('Image analysis error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
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
