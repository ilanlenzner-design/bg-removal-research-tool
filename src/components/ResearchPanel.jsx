import React, { useState } from 'react';
import { TEST_CATEGORIES } from '../services/testDatabase';

export function ResearchPanel({ onSaveTest, results, imageUrl }) {
    const [category, setCategory] = useState('');
    const [testName, setTestName] = useState('');
    const [notes, setNotes] = useState('');
    const [scores, setScores] = useState({});
    const [showScoring, setShowScoring] = useState(false);

    const hasResults = Object.keys(results).some(id => results[id]?.output);

    const updateScore = (modelId, metric, value) => {
        setScores(prev => ({
            ...prev,
            [modelId]: {
                ...(prev[modelId] || {}),
                [metric]: parseInt(value)
            }
        }));
    };

    const calculateOverall = (modelScores) => {
        if (!modelScores) return 0;
        const metrics = ['edgeAccuracy', 'detailPreservation', 'transparency'];
        const values = metrics.map(m => modelScores[m] || 0).filter(v => v > 0);
        if (values.length === 0) return 0;
        return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    };

    // Auto-calculate overall scores
    Object.keys(scores).forEach(modelId => {
        if (scores[modelId] && !scores[modelId].overall) {
            scores[modelId].overall = calculateOverall(scores[modelId]);
        }
    });

    const handleSave = () => {
        if (!category || !testName) {
            alert('Please fill in test category and name');
            return;
        }

        const testData = {
            category,
            name: testName,
            notes,
            scores,
            results,
            imageUrl
        };

        onSaveTest(testData);

        // Reset form
        setCategory('');
        setTestName('');
        setNotes('');
        setScores({});
        setShowScoring(false);

        alert('Test saved successfully!');
    };

    const modelIds = Object.keys(results).filter(id => results[id]?.output);

    return (
        <div className="research-panel">
            <div className="research-header">
                <h3>📊 Research Panel</h3>
                <button
                    className="btn-toggle"
                    onClick={() => setShowScoring(!showScoring)}
                >
                    {showScoring ? 'Hide' : 'Show'} Scoring
                </button>
            </div>

            <div className="research-content">
                {/* Test Metadata */}
                <div className="metadata-section">
                    <div className="input-group">
                        <label>Test Category *</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="category-select"
                        >
                            <option value="">Select category...</option>
                            {TEST_CATEGORIES.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.icon} {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label>Test Name *</label>
                        <input
                            type="text"
                            value={testName}
                            onChange={(e) => setTestName(e.target.value)}
                            placeholder="e.g., UFO with green screen"
                            className="text-input"
                        />
                    </div>

                    <div className="input-group">
                        <label>Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Observations, edge cases, recommendations..."
                            className="text-area"
                            rows="3"
                        />
                    </div>
                </div>

                {/* Scoring Section */}
                {showScoring && hasResults && (
                    <div className="scoring-section">
                        <h4>Score Each Model (1-10)</h4>
                        {modelIds.map(modelId => {
                            const modelName = modelId.split('/')[1] || modelId;
                            const modelScores = scores[modelId] || {};

                            return (
                                <div key={modelId} className="model-scoring">
                                    <div className="model-scoring-header">{modelName}</div>

                                    <div className="score-row">
                                        <label>Edge Accuracy</label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={modelScores.edgeAccuracy || 5}
                                            onChange={(e) => updateScore(modelId, 'edgeAccuracy', e.target.value)}
                                        />
                                        <span className="score-value">{modelScores.edgeAccuracy || 5}</span>
                                    </div>

                                    <div className="score-row">
                                        <label>Detail Preservation</label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={modelScores.detailPreservation || 5}
                                            onChange={(e) => updateScore(modelId, 'detailPreservation', e.target.value)}
                                        />
                                        <span className="score-value">{modelScores.detailPreservation || 5}</span>
                                    </div>

                                    <div className="score-row">
                                        <label>Transparency Quality</label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={modelScores.transparency || 5}
                                            onChange={(e) => updateScore(modelId, 'transparency', e.target.value)}
                                        />
                                        <span className="score-value">{modelScores.transparency || 5}</span>
                                    </div>

                                    <div className="overall-score">
                                        Overall: <strong>{calculateOverall(modelScores)}/10</strong>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Save Button */}
                <button
                    className="btn-save-test"
                    onClick={handleSave}
                    disabled={!category || !testName || !hasResults}
                >
                    💾 Save Test to Database
                </button>

                {!hasResults && (
                    <p className="hint-text">Run a comparison first to save test results</p>
                )}
            </div>

            <style jsx>{`
                .research-panel {
                    background: var(--card-bg);
                    border-radius: 12px;
                    padding: 1.5rem;
                    margin: 2rem 0;
                    border: 2px solid var(--border);
                }

                .research-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .research-header h3 {
                    margin: 0;
                    font-size: 1.2rem;
                }

                .btn-toggle {
                    background: var(--accent);
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.85rem;
                }

                .metadata-section {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }

                .input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .input-group label {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text);
                }

                .category-select, .text-input {
                    padding: 0.75rem;
                    border-radius: 6px;
                    border: 1px solid var(--border);
                    background: var(--bg);
                    color: var(--text);
                    font-size: 0.9rem;
                }

                .text-area {
                    padding: 0.75rem;
                    border-radius: 6px;
                    border: 1px solid var(--border);
                    background: var(--bg);
                    color: var(--text);
                    font-size: 0.9rem;
                    font-family: inherit;
                    resize: vertical;
                }

                .scoring-section {
                    background: var(--bg);
                    padding: 1.5rem;
                    border-radius: 8px;
                    margin-bottom: 1.5rem;
                }

                .scoring-section h4 {
                    margin: 0 0 1rem 0;
                    font-size: 1rem;
                }

                .model-scoring {
                    background: var(--card-bg);
                    padding: 1rem;
                    border-radius: 6px;
                    margin-bottom: 1rem;
                }

                .model-scoring-header {
                    font-weight: 600;
                    margin-bottom: 0.75rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 1px solid var(--border);
                }

                .score-row {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 0.75rem;
                }

                .score-row label {
                    flex: 1;
                    font-size: 0.85rem;
                    color: var(--text-dim);
                }

                .score-row input[type="range"] {
                    flex: 2;
                }

                .score-value {
                    width: 30px;
                    text-align: center;
                    font-weight: 600;
                }

                .overall-score {
                    margin-top: 0.75rem;
                    padding-top: 0.75rem;
                    border-top: 1px solid var(--border);
                    text-align: right;
                    font-size: 0.95rem;
                }

                .btn-save-test {
                    width: 100%;
                    padding: 1rem;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s;
                }

                .btn-save-test:hover:not(:disabled) {
                    transform: translateY(-2px);
                }

                .btn-save-test:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .hint-text {
                    text-align: center;
                    color: var(--text-dim);
                    font-size: 0.85rem;
                    margin-top: 0.5rem;
                }
            `}</style>
        </div>
    );
}
