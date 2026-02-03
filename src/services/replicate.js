export const MODELS = [
    { id: '851-labs/background-remover', name: '851 Labs' },
    { id: 'lucataco/remove-bg', name: 'Lucataco Tracer' },
    { id: 'bria/remove-background', name: 'BRIA AI (Official)' },
    { id: 'men1scus/birefnet', name: 'BiRefNet (High-Res)' },
    { id: 'cjwbw/rembg', name: 'CJWBW RemBG' }
];

export class ReplicateService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = '/replicate';
    }

    async createPrediction(modelId, imageUrl) {
        const [owner, name] = modelId.split('/');
        console.log(`[Replicate] Requesting model: ${owner}/${name}`);
        const modelResponse = await fetch(`${this.baseUrl}/models/${owner}/${name}`, {
            headers: { 'Authorization': `Token ${this.apiKey}` }
        });

        if (!modelResponse.ok) {
            let errorMsg = `Model ${owner}/${name} not found or API error (${modelResponse.status})`;
            try {
                const error = await modelResponse.json();
                errorMsg = error.detail || errorMsg;
            } catch (e) {
                const text = await modelResponse.text();
                if (text.includes('<html>')) {
                    errorMsg = `API Error (${modelResponse.status}): Possible proxy issue or Replicate outage.`;
                } else {
                    errorMsg = text.slice(0, 100) || errorMsg;
                }
            }
            console.error(`[Replicate] Failed to fetch model:`, errorMsg);
            throw new Error(errorMsg);
        }

        const modelData = await modelResponse.json();
        const version = modelData.latest_version.id;
        console.log(`[Replicate] Found version for ${name}: ${version}`);

        const response = await fetch(`${this.baseUrl}/predictions`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ version: version, input: { image: imageUrl } })
        });

        if (!response.ok) {
            let errorMsg = 'Failed to create prediction';
            try {
                const error = await response.json();
                errorMsg = error.detail || errorMsg;
            } catch (e) {
                const text = await response.text();
                if (text.includes('<html>')) {
                    errorMsg = `API Error (${response.status}): Bad Gateway or Timeout. Your image might be too large.`;
                } else {
                    errorMsg = `API Error (${response.status}): ${text.slice(0, 100)}`;
                }
            }
            throw new Error(errorMsg);
        }
        return await response.json();
    }

    async getPrediction(id) {
        const response = await fetch(`${this.baseUrl}/predictions/${id}`, {
            headers: { 'Authorization': `Token ${this.apiKey}` }
        });
        if (!response.ok) throw new Error(`Failed to fetch prediction status (${response.status})`);
        return await response.json();
    }

    async pollPrediction(prediction, onUpdate) {
        let current = prediction;
        while (current.status !== 'succeeded' && current.status !== 'failed' && current.status !== 'canceled') {
            await new Promise(resolve => setTimeout(resolve, 2000));
            try {
                current = await this.getPrediction(current.id);
                onUpdate(current);
            } catch (err) {
                console.warn('[Replicate] Polling warning:', err);
                // Continue polling if it's just a transient error
            }
        }
        return current;
    }
}
