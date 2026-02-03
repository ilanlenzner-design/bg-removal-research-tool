// Test Database Service - Manages research data storage

export const TEST_CATEGORIES = [
    { id: 'portrait', name: 'Portrait Photography', icon: '👤', color: '#ec4899' },
    { id: 'ecommerce', name: 'E-commerce Products', icon: '🛍️', color: '#10b981' },
    { id: 'cartoon', name: 'Cartoon/Illustrated', icon: '🎨', color: '#8b5cf6' },
    { id: 'animals', name: 'Animals/Pets', icon: '🐾', color: '#f59e0b' },
    { id: 'complex', name: 'Complex Backgrounds', icon: '🌆', color: '#3b82f6' },
    { id: 'fine-details', name: 'Fine Details (Hair/Fur)', icon: '✨', color: '#06b6d4' },
    { id: 'vfx', name: 'VFX/Particles', icon: '🔥', color: '#ef4444' },
    { id: 'transparent', name: 'Transparent Objects', icon: '💎', color: '#14b8a6' },
    { id: 'challenging', name: 'Challenging Scenarios', icon: '⚡', color: '#f97316' }
];

export class TestDatabase {
    constructor() {
        this.storageKey = 'bg_research_tests';
        this.tests = this.loadTests();
    }

    loadTests() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (err) {
            console.error('Failed to load tests:', err);
            return [];
        }
    }

    saveTests() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.tests));
        } catch (err) {
            console.error('Failed to save tests:', err);
        }
    }

    createTest(testData) {
        const test = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            ...testData,
            results: testData.results || {},
            scores: testData.scores || {},
            notes: testData.notes || '',
            processingTimes: testData.processingTimes || {}
        };

        this.tests.unshift(test); // Add to beginning
        this.saveTests();
        return test;
    }

    updateTest(testId, updates) {
        const index = this.tests.findIndex(t => t.id === testId);
        if (index !== -1) {
            this.tests[index] = { ...this.tests[index], ...updates };
            this.saveTests();
            return this.tests[index];
        }
        return null;
    }

    deleteTest(testId) {
        this.tests = this.tests.filter(t => t.id !== testId);
        this.saveTests();
    }

    getTests(filters = {}) {
        let filtered = [...this.tests];

        if (filters.category) {
            filtered = filtered.filter(t => t.category === filters.category);
        }

        if (filters.startDate) {
            filtered = filtered.filter(t => new Date(t.timestamp) >= new Date(filters.startDate));
        }

        return filtered;
    }

    getTestById(testId) {
        return this.tests.find(t => t.id === testId);
    }

    getStats() {
        const stats = {
            totalTests: this.tests.length,
            byCategory: {},
            modelPerformance: {},
            avgScores: {}
        };

        TEST_CATEGORIES.forEach(cat => {
            stats.byCategory[cat.id] = this.tests.filter(t => t.category === cat.id).length;
        });

        // Calculate average scores per model
        const modelScores = {};
        this.tests.forEach(test => {
            Object.keys(test.scores || {}).forEach(modelId => {
                if (!modelScores[modelId]) {
                    modelScores[modelId] = [];
                }
                const score = test.scores[modelId];
                if (score && score.overall) {
                    modelScores[modelId].push(score.overall);
                }
            });
        });

        Object.keys(modelScores).forEach(modelId => {
            const scores = modelScores[modelId];
            stats.avgScores[modelId] = scores.reduce((a, b) => a + b, 0) / scores.length;
        });

        return stats;
    }

    exportToJSON() {
        return JSON.stringify(this.tests, null, 2);
    }

    exportToCSV() {
        if (this.tests.length === 0) return '';

        const headers = [
            'Test ID',
            'Date',
            'Category',
            'Name',
            'Notes',
            'AI Analysis',
            'Model',
            'Edge Accuracy',
            'Detail Preservation',
            'Transparency Quality',
            'Overall Score',
            'Processing Time (s)'
        ];

        const rows = [];

        this.tests.forEach(test => {
            Object.keys(test.scores || {}).forEach(modelId => {
                const score = test.scores[modelId];
                const time = test.processingTimes[modelId];

                rows.push([
                    test.id,
                    new Date(test.timestamp).toLocaleDateString(),
                    test.category,
                    test.name || 'Untitled',
                    (test.notes || '').replace(/"/g, '""'),
                    (test.imageAnalysis || '').replace(/"/g, '""'),
                    modelId,
                    score?.edgeAccuracy || '',
                    score?.detailPreservation || '',
                    score?.transparency || '',
                    score?.overall || '',
                    time || ''
                ].map(cell => `"${cell}"`).join(','));
            });
        });

        return [headers.join(','), ...rows].join('\n');
    }

    importFromJSON(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            if (Array.isArray(imported)) {
                this.tests = [...imported, ...this.tests];
                this.saveTests();
                return true;
            }
            return false;
        } catch (err) {
            console.error('Import failed:', err);
            return false;
        }
    }
}

// Singleton instance
export const testDB = new TestDatabase();
