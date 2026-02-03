import React from 'react';

export function ModelScoreCard({ modelId, modelName, score, onScoreChange, showScoring }) {
    if (!showScoring) return null;

    const updateScore = (metric, value) => {
        const numValue = parseInt(value) || 0;
        const clampedValue = Math.max(1, Math.min(10, numValue));

        onScoreChange(modelId, {
            ...score,
            [metric]: clampedValue
        });
    };

    const calculateOverall = () => {
        const metrics = ['edgeAccuracy', 'detailPreservation', 'transparency'];
        const values = metrics.map(m => score?.[m] || 0).filter(v => v > 0);
        if (values.length === 0) return 0;
        return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    };

    const overall = calculateOverall();

    return (
        <div className="inline-score-card">
            <div className="score-title">Rate This Result</div>

            <div className="score-metric">
                <label>Edge Accuracy</label>
                <div className="score-input-group">
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={score?.edgeAccuracy || 5}
                        onChange={(e) => updateScore('edgeAccuracy', e.target.value)}
                        className="score-slider"
                    />
                    <input
                        type="number"
                        min="1"
                        max="10"
                        value={score?.edgeAccuracy || 5}
                        onChange={(e) => updateScore('edgeAccuracy', e.target.value)}
                        className="score-number"
                    />
                </div>
            </div>

            <div className="score-metric">
                <label>Detail Preservation</label>
                <div className="score-input-group">
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={score?.detailPreservation || 5}
                        onChange={(e) => updateScore('detailPreservation', e.target.value)}
                        className="score-slider"
                    />
                    <input
                        type="number"
                        min="1"
                        max="10"
                        value={score?.detailPreservation || 5}
                        onChange={(e) => updateScore('detailPreservation', e.target.value)}
                        className="score-number"
                    />
                </div>
            </div>

            <div className="score-metric">
                <label>Transparency Quality</label>
                <div className="score-input-group">
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={score?.transparency || 5}
                        onChange={(e) => updateScore('transparency', e.target.value)}
                        className="score-slider"
                    />
                    <input
                        type="number"
                        min="1"
                        max="10"
                        value={score?.transparency || 5}
                        onChange={(e) => updateScore('transparency', e.target.value)}
                        className="score-number"
                    />
                </div>
            </div>

            <div className="overall-score-display">
                Overall: <strong>{overall}/10</strong>
            </div>

            <style jsx>{`
                .inline-score-card {
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    padding: 1rem;
                    margin-top: 1rem;
                }

                .score-title {
                    font-size: 0.85rem;
                    font-weight: 600;
                    margin-bottom: 0.75rem;
                    color: var(--accent);
                }

                .score-metric {
                    margin-bottom: 0.75rem;
                }

                .score-metric label {
                    display: block;
                    font-size: 0.75rem;
                    color: var(--text-dim);
                    margin-bottom: 0.5rem;
                }

                .score-input-group {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .score-slider {
                    flex: 1;
                    height: 6px;
                    border-radius: 3px;
                    background: var(--card-bg);
                    outline: none;
                    -webkit-appearance: none;
                }

                .score-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: var(--accent);
                    cursor: pointer;
                }

                .score-slider::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: var(--accent);
                    cursor: pointer;
                    border: none;
                }

                .score-number {
                    width: 50px;
                    padding: 0.4rem 0.5rem;
                    border: 1px solid var(--border);
                    border-radius: 6px;
                    background: var(--card-bg);
                    color: var(--text);
                    text-align: center;
                    font-weight: 600;
                    font-size: 0.9rem;
                }

                .score-number::-webkit-inner-spin-button,
                .score-number::-webkit-outer-spin-button {
                    opacity: 1;
                }

                .overall-score-display {
                    margin-top: 0.75rem;
                    padding-top: 0.75rem;
                    border-top: 1px solid var(--border);
                    text-align: right;
                    font-size: 0.9rem;
                    color: var(--text-dim);
                }

                .overall-score-display strong {
                    color: var(--accent);
                    font-size: 1.1rem;
                }
            `}</style>
        </div>
    );
}
