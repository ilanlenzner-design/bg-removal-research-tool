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

// Image analysis endpoint - uses Replicate vision model
app.post('/api/analyze-image', async (req, res) => {
    try {
        const { imageUrl, replicateApiKey } = req.body;
        const apiKey = replicateApiKey || process.env.REPLICATE_API_KEY;

        if (!apiKey) {
            return res.status(400).json({
                error: 'Replicate API key not provided'
            });
        }

        const prompt = `Analyze this image for background removal purposes. Provide:

**Subject**: What's the main subject?
**Style**: Photo/cartoon/illustration/3D?
**Background**: Simple/complex/gradient/textured?
**Details**: Hair, fur, transparency, glow effects?
**Challenges**: What makes BG removal difficult?
**Recommended Category**: Portrait/E-commerce/Cartoon/Animals/Complex/Fine-Details/VFX/Transparent/Challenging

Keep under 150 words, be concise and specific.`;

        // Create prediction with LLaVA vision model
        const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                version: '2facb4a474a0462c15041b78b1ad70952ea46b5ec6ad29583c0b29dbd4249591', // llava-13b
                input: {
                    image: imageUrl,
                    prompt: prompt,
                    max_tokens: 500
                }
            })
        });

        if (!createResponse.ok) {
            const error = await createResponse.text();
            console.error('Replicate API error:', error);
            return res.status(createResponse.status).json({ error: 'Failed to create analysis' });
        }

        let prediction = await createResponse.json();

        // Poll for result
        while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
                headers: {
                    'Authorization': `Token ${apiKey}`,
                }
            });

            if (!statusResponse.ok) {
                throw new Error('Failed to check prediction status');
            }

            prediction = await statusResponse.json();
        }

        if (prediction.status === 'failed') {
            return res.status(500).json({ error: 'Analysis failed' });
        }

        const analysis = Array.isArray(prediction.output)
            ? prediction.output.join('')
            : prediction.output;

        res.json({ analysis });
    } catch (error) {
        console.error('Image analysis error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Score individual result endpoint
app.post('/api/score-result', async (req, res) => {
    try {
        const { resultUrl, modelName, replicateApiKey } = req.body;
        const apiKey = replicateApiKey || process.env.REPLICATE_API_KEY;

        if (!apiKey) {
            return res.status(400).json({
                error: 'Replicate API key not provided'
            });
        }

        const prompt = `Evaluate this background removal result. Rate the quality on these metrics (1-10 scale):

**Edge Accuracy**: How clean are the edges? Any artifacts, halos, or rough borders?
**Detail Preservation**: Are fine details like hair, fur, or small elements preserved well?
**Transparency Quality**: How smooth is the alpha channel? Any semi-transparent artifacts?

Respond with ONLY three numbers, one per line:
Edge: [number 1-10]
Detail: [number 1-10]
Transparency: [number 1-10]`;

        const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                version: '2facb4a474a0462c15041b78b1ad70952ea46b5ec6ad29583c0b29dbd4249591',
                input: {
                    image: resultUrl,
                    prompt: prompt,
                    max_tokens: 100
                }
            })
        });

        if (!createResponse.ok) {
            throw new Error('Failed to create scoring prediction');
        }

        let prediction = await createResponse.json();

        // Poll for result
        while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
                headers: { 'Authorization': `Token ${apiKey}` }
            });

            if (!statusResponse.ok) {
                throw new Error('Failed to check prediction status');
            }

            prediction = await statusResponse.json();
        }

        if (prediction.status === 'failed') {
            throw new Error('Scoring failed');
        }

        const responseText = Array.isArray(prediction.output)
            ? prediction.output.join('')
            : prediction.output;

        // Parse scores from response
        const edgeMatch = responseText.match(/Edge[:\s]+(\d+)/i);
        const detailMatch = responseText.match(/Detail[:\s]+(\d+)/i);
        const transparencyMatch = responseText.match(/Transparency[:\s]+(\d+)/i);

        const scores = {
            edgeAccuracy: edgeMatch ? parseInt(edgeMatch[1]) : 7,
            detailPreservation: detailMatch ? parseInt(detailMatch[1]) : 7,
            transparency: transparencyMatch ? parseInt(transparencyMatch[1]) : 7
        };

        res.json({ scores });
    } catch (error) {
        console.error('Scoring error:', error);
        res.status(500).json({ error: 'Scoring failed' });
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
