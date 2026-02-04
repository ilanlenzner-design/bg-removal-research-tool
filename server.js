import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Google Apps Script URL for database operations
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbxx5QFDcY83FZvoPmYHueMj7V7tSqX3X6iMPwcCOpEZwbaeJAO4Yldd-prIPjESxy1bKw/exec';

// Helper to proxy requests to Google Apps Script
async function proxyToGoogleScript(path, method = 'GET', body = null) {
    const url = `${GOOGLE_SCRIPT_URL}?path=${path}`;
    const options = {
        method: method === 'GET' ? 'GET' : 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
        if (method === 'PUT' || method === 'DELETE') {
            options.headers['X-HTTP-Method-Override'] = method;
        }
    }

    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`Google Script request failed: ${response.statusText}`);
    }
    return response.json();
}

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

// Comparative scoring endpoint - scores all results together
app.post('/api/score-all-results', async (req, res) => {
    try {
        const { results, replicateApiKey } = req.body;
        const apiKey = replicateApiKey || process.env.REPLICATE_API_KEY;

        if (!apiKey) {
            return res.status(400).json({
                error: 'Replicate API key not provided'
            });
        }

        // Build a prompt showing all results for comparison
        const resultsList = Object.entries(results).map(([modelId, url], index) =>
            `Result ${index + 1} (${modelId}): ${url}`
        ).join('\n');

        const prompt = `You are comparing ${Object.keys(results).length} background removal results side-by-side. RANK them from best to worst.

${resultsList}

Examine ALL results carefully and COMPARE them:
- Which has the cleanest edges?
- Which preserves the most detail?
- Which has the best transparency?

IMPORTANT: Give DIFFERENT scores based on quality ranking:
- Best result: 9-10 for each metric
- Second best: 7-8
- Third: 6-7
- Fourth: 5-6
- Worst: 3-5

For EACH result (1-${Object.keys(results).length}), provide scores:
Result 1 - Edge: X, Detail: Y, Transparency: Z
Result 2 - Edge: X, Detail: Y, Transparency: Z
(continue for all results)`;

        const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                version: '2facb4a474a0462c15041b78b1ad70952ea46b5ec6ad29583c0b29dbd4249591',
                input: {
                    image: Object.values(results)[0], // Use first image as reference
                    prompt: prompt,
                    max_tokens: 300
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

        console.log('[COMPARATIVE SCORING] Raw AI response:', responseText);

        // Parse scores for each result
        const modelIds = Object.keys(results);
        const allScores = {};

        modelIds.forEach((modelId, index) => {
            const resultNum = index + 1;
            const pattern = new RegExp(`Result\\s*${resultNum}[\\s\\S]{0,50}Edge[:\\s]+(\\d+)[\\s\\S]{0,30}Detail[:\\s]+(\\d+)[\\s\\S]{0,30}Transparency[:\\s]+(\\d+)`, 'i');
            const match = responseText.match(pattern);

            if (match) {
                allScores[modelId] = {
                    edgeAccuracy: parseInt(match[1]),
                    detailPreservation: parseInt(match[2]),
                    transparency: parseInt(match[3])
                };
            } else {
                // Fallback: decreasing scores
                allScores[modelId] = {
                    edgeAccuracy: 8 - index,
                    detailPreservation: 8 - index,
                    transparency: 8 - index
                };
            }
        });

        console.log('[COMPARATIVE SCORING] Parsed scores:', allScores);

        res.json({ scores: allScores });
    } catch (error) {
        console.error('Comparative scoring error:', error);
        res.status(500).json({ error: 'Scoring failed' });
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

        const prompt = `You are an EXTREMELY CRITICAL professional image quality inspector. Your reputation depends on finding even microscopic flaws. Examine this background removal result from ${modelName} with a magnifying glass.

CRITICAL ANALYSIS REQUIRED - Look for TINY imperfections:

**Edge Accuracy (1-10)**:
- Inspect EVERY pixel along edges
- Look for: jagged pixels, halos (even faint ones), color bleeding, rough transitions, stair-stepping, fringing
- Even slight imperfections should lower the score significantly
- Only give 9-10 if edges are ABSOLUTELY PERFECT at pixel level
- Give 5-7 for "acceptable but not perfect" results
- Give 1-4 if there are obvious flaws

**Detail Preservation (1-10)**:
- Check if ANY fine details are lost or softened
- Look for: blurriness, missing hair strands, lost texture, smoothing artifacts
- Compare to what details SHOULD be there
- Give 9-10 ONLY if ALL details are razor-sharp and preserved
- Give 5-7 if some details are slightly soft
- Give 1-4 if significant detail loss

**Transparency Quality (1-10)**:
- Examine the alpha channel for ANY artifacts
- Look for: semi-transparent halos, uneven edges, residual background, fringing effects
- Check corners and complex areas carefully
- Give 9-10 ONLY if transparency is completely clean
- Give 5-7 if minor artifacts exist
- Give 1-4 if obvious transparency issues

BE HARSH. BE JUDGMENTAL. USE THE FULL 1-10 RANGE. Different models WILL have different quality - find those differences. Average results deserve 5-6, not 8.

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

        console.log(`[SCORING ${modelName}] Raw AI response:`, responseText);

        // Parse scores from response
        const edgeMatch = responseText.match(/Edge[:\s]+(\d+)/i);
        const detailMatch = responseText.match(/Detail[:\s]+(\d+)/i);
        const transparencyMatch = responseText.match(/Transparency[:\s]+(\d+)/i);

        console.log(`[SCORING ${modelName}] Parsed matches:`, {
            edge: edgeMatch?.[1],
            detail: detailMatch?.[1],
            transparency: transparencyMatch?.[1]
        });

        const scores = {
            edgeAccuracy: edgeMatch ? parseInt(edgeMatch[1]) : 7,
            detailPreservation: detailMatch ? parseInt(detailMatch[1]) : 7,
            transparency: transparencyMatch ? parseInt(transparencyMatch[1]) : 7
        };

        console.log(`[SCORING ${modelName}] Final scores:`, scores);

        res.json({ scores });
    } catch (error) {
        console.error('Scoring error:', error);
        res.status(500).json({ error: 'Scoring failed' });
    }
});

// Database API endpoints - proxy to Google Apps Script

// GET all tests
app.get('/api/tests', async (req, res) => {
    try {
        const tests = await proxyToGoogleScript('tests', 'GET');
        res.json(tests);
    } catch (error) {
        console.error('Failed to read tests:', error);
        res.status(500).json({ error: 'Failed to read tests' });
    }
});

// POST new test
app.post('/api/tests', async (req, res) => {
    try {
        const newTest = await proxyToGoogleScript('tests', 'POST', req.body);
        res.json(newTest);
    } catch (error) {
        console.error('Failed to save test:', error);
        res.status(500).json({ error: 'Failed to save test' });
    }
});

// PUT update test
app.put('/api/tests/:id', async (req, res) => {
    try {
        const updatedTest = await proxyToGoogleScript(`tests/${req.params.id}`, 'PUT', req.body);
        res.json(updatedTest);
    } catch (error) {
        console.error('Failed to update test:', error);
        res.status(500).json({ error: 'Failed to update test' });
    }
});

// DELETE test
app.delete('/api/tests/:id', async (req, res) => {
    try {
        const result = await proxyToGoogleScript(`tests/${req.params.id}`, 'DELETE');
        res.json(result);
    } catch (error) {
        console.error('Failed to delete test:', error);
        res.status(500).json({ error: 'Failed to delete test' });
    }
});

// GET database stats
app.get('/api/tests/stats', async (req, res) => {
    try {
        const stats = await proxyToGoogleScript('tests/stats', 'GET');
        res.json(stats);
    } catch (error) {
        console.error('Failed to get stats:', error);
        res.status(500).json({ error: 'Failed to get stats' });
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
