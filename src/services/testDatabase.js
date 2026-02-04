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
        this.tests = [];
        this.loadTests();
    }

    async loadTests() {
        try {
            const response = await fetch('/api/tests');
            if (response.ok) {
                this.tests = await response.json();
            } else {
                console.error('Failed to load tests from server');
                this.tests = [];
            }
        } catch (err) {
            console.error('Failed to load tests:', err);
            this.tests = [];
        }
        return this.tests;
    }

    async saveTests() {
        // No-op: Individual operations save directly to server
    }

    async createTest(testData) {
        try {
            const test = {
                ...testData,
                results: testData.results || {},
                scores: testData.scores || {},
                notes: testData.notes || '',
                processingTimes: testData.processingTimes || {}
            };

            const response = await fetch('/api/tests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(test)
            });

            if (response.ok) {
                const savedTest = await response.json();
                this.tests.unshift(savedTest);
                return savedTest;
            } else {
                throw new Error('Failed to save test to server');
            }
        } catch (err) {
            console.error('Failed to create test:', err);
            throw err;
        }
    }

    async updateTest(testId, updates) {
        try {
            const response = await fetch(`/api/tests/${testId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (response.ok) {
                const updatedTest = await response.json();
                const index = this.tests.findIndex(t => t.id === testId);
                if (index !== -1) {
                    this.tests[index] = updatedTest;
                }
                return updatedTest;
            } else {
                throw new Error('Failed to update test on server');
            }
        } catch (err) {
            console.error('Failed to update test:', err);
            return null;
        }
    }

    async deleteTest(testId) {
        try {
            const response = await fetch(`/api/tests/${testId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.tests = this.tests.filter(t => t.id !== testId);
            } else {
                throw new Error('Failed to delete test from server');
            }
        } catch (err) {
            console.error('Failed to delete test:', err);
        }
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

    async refresh() {
        await this.loadTests();
        return this.tests;
    }

    async getStats() {
        try {
            const response = await fetch('/api/tests/stats');
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Failed to get stats from server');
            }
        } catch (err) {
            console.error('Failed to get stats:', err);
            // Fallback to client-side calculation
            const stats = {
                totalTests: this.tests.length,
                byCategory: {},
                modelPerformance: {},
                avgScores: {}
            };

            TEST_CATEGORIES.forEach(cat => {
                stats.byCategory[cat.id] = this.tests.filter(t => t.category === cat.id).length;
            });

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
    }

    exportToJSON() {
        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            tests: this.tests
        };
        return JSON.stringify(data, null, 2);
    }

    async importFromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            // Handle both old format (array) and new format (object with version)
            const tests = Array.isArray(data) ? data : data.tests;

            if (!Array.isArray(tests)) {
                throw new Error('Invalid data format');
            }

            // Merge with existing tests (avoid duplicates by ID)
            await this.loadTests(); // Refresh from server
            const existingIds = new Set(this.tests.map(t => t.id));
            const newTests = tests.filter(t => !existingIds.has(t.id));

            // Upload new tests to server
            for (const test of newTests) {
                await this.createTest(test);
            }

            return {
                success: true,
                imported: newTests.length,
                skipped: tests.length - newTests.length
            };
        } catch (err) {
            console.error('Import failed:', err);
            return {
                success: false,
                error: err.message
            };
        }
    }

    downloadJSON() {
        const jsonString = this.exportToJSON();
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bg-compare-tests-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
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
}

// Singleton instance
export const testDB = new TestDatabase();
