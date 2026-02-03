import React, { useState } from 'react';
import { TEST_CATEGORIES, testDB } from '../services/testDatabase';

export function TestHistory({ onClose }) {
    const [tests, setTests] = useState(testDB.getTests());
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedTest, setSelectedTest] = useState(null);
    const [view, setView] = useState('list'); // 'list' or 'analytics'

    const stats = testDB.getStats();

    const filteredTests = selectedCategory
        ? tests.filter(t => t.category === selectedCategory)
        : tests;

    const handleDelete = (testId) => {
        if (confirm('Delete this test? This cannot be undone.')) {
            testDB.deleteTest(testId);
            setTests(testDB.getTests());
            if (selectedTest?.id === testId) {
                setSelectedTest(null);
            }
        }
    };

    const handleExportJSON = () => {
        const json = testDB.exportToJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bg-research-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportCSV = () => {
        const csv = testDB.exportToCSV();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bg-research-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getCategoryInfo = (catId) => {
        return TEST_CATEGORIES.find(c => c.id === catId) || { name: catId, icon: '📁', color: '#888' };
    };

    const getModelName = (modelId) => {
        const parts = modelId.split('/');
        return parts[parts.length - 1];
    };

    const getTopModel = (testScores) => {
        if (!testScores) return null;
        let topModel = null;
        let topScore = 0;

        Object.keys(testScores).forEach(modelId => {
            const score = testScores[modelId]?.overall || 0;
            if (score > topScore) {
                topScore = score;
                topModel = modelId;
            }
        });

        return topModel ? { id: topModel, score: topScore } : null;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="history-modal" onClick={(e) => e.stopPropagation()}>
                <div className="history-header">
                    <h2>📚 Test Database</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                {/* View Tabs */}
                <div className="view-tabs">
                    <button
                        className={view === 'list' ? 'active' : ''}
                        onClick={() => setView('list')}
                    >
                        📋 Tests ({tests.length})
                    </button>
                    <button
                        className={view === 'analytics' ? 'active' : ''}
                        onClick={() => setView('analytics')}
                    >
                        📊 Analytics
                    </button>
                </div>

                {view === 'list' ? (
                    <>
                        {/* Controls */}
                        <div className="controls-bar">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="filter-select"
                            >
                                <option value="">All Categories</option>
                                {TEST_CATEGORIES.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.icon} {cat.name}
                                    </option>
                                ))}
                            </select>

                            <div className="export-btns">
                                <button onClick={handleExportJSON} className="export-btn">
                                    Export JSON
                                </button>
                                <button onClick={handleExportCSV} className="export-btn">
                                    Export CSV
                                </button>
                            </div>
                        </div>

                        {/* Test List */}
                        <div className="test-list">
                            {filteredTests.length === 0 ? (
                                <div className="empty-state">
                                    <p>No tests yet. Run a comparison and save it to start building your research database!</p>
                                </div>
                            ) : (
                                filteredTests.map(test => {
                                    const catInfo = getCategoryInfo(test.category);
                                    const topModel = getTopModel(test.scores);

                                    return (
                                        <div
                                            key={test.id}
                                            className="test-item"
                                            onClick={() => setSelectedTest(selectedTest?.id === test.id ? null : test)}
                                        >
                                            <div className="test-item-header">
                                                <div className="test-category" style={{ background: catInfo.color }}>
                                                    {catInfo.icon}
                                                </div>
                                                <div className="test-info">
                                                    <h4>{test.name}</h4>
                                                    <p className="test-meta">
                                                        {new Date(test.timestamp).toLocaleString()} • {catInfo.name}
                                                    </p>
                                                </div>
                                                <button
                                                    className="delete-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(test.id);
                                                    }}
                                                >
                                                    🗑️
                                                </button>
                                            </div>

                                            {topModel && (
                                                <div className="winner-badge">
                                                    🏆 {getModelName(topModel.id)} ({topModel.score}/10)
                                                </div>
                                            )}

                                            {selectedTest?.id === test.id && (
                                                <div className="test-details">
                                                    {test.notes && (
                                                        <div className="notes">
                                                            <strong>Notes:</strong> {test.notes}
                                                        </div>
                                                    )}

                                                    {test.scores && Object.keys(test.scores).length > 0 && (
                                                        <div className="scores-grid">
                                                            {Object.keys(test.scores).map(modelId => {
                                                                const score = test.scores[modelId];
                                                                return (
                                                                    <div key={modelId} className="score-card">
                                                                        <div className="score-model">{getModelName(modelId)}</div>
                                                                        <div className="score-metrics">
                                                                            <span>Edge: {score.edgeAccuracy}/10</span>
                                                                            <span>Detail: {score.detailPreservation}/10</span>
                                                                            <span>Trans: {score.transparency}/10</span>
                                                                        </div>
                                                                        <div className="score-overall">
                                                                            Overall: {score.overall}/10
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {test.imageUrl && (
                                                        <div className="test-image">
                                                            <img src={test.imageUrl} alt="Test" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                ) : (
                    /* Analytics View */
                    <div className="analytics-view">
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-value">{stats.totalTests}</div>
                                <div className="stat-label">Total Tests</div>
                            </div>

                            {TEST_CATEGORIES.map(cat => {
                                const count = stats.byCategory[cat.id] || 0;
                                if (count === 0) return null;

                                return (
                                    <div key={cat.id} className="stat-card" style={{ borderTopColor: cat.color }}>
                                        <div className="stat-icon">{cat.icon}</div>
                                        <div className="stat-value">{count}</div>
                                        <div className="stat-label">{cat.name}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {Object.keys(stats.avgScores).length > 0 && (
                            <div className="avg-scores-section">
                                <h3>Average Model Scores</h3>
                                <div className="avg-scores-grid">
                                    {Object.keys(stats.avgScores)
                                        .sort((a, b) => stats.avgScores[b] - stats.avgScores[a])
                                        .map(modelId => (
                                            <div key={modelId} className="avg-score-item">
                                                <div className="avg-score-name">{getModelName(modelId)}</div>
                                                <div className="avg-score-bar">
                                                    <div
                                                        className="avg-score-fill"
                                                        style={{ width: `${(stats.avgScores[modelId] / 10) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <div className="avg-score-value">
                                                    {stats.avgScores[modelId].toFixed(1)}/10
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <style jsx>{`
                    .history-modal {
                        background: var(--bg);
                        max-width: 900px;
                        width: 90%;
                        max-height: 85vh;
                        overflow-y: auto;
                        border-radius: 16px;
                        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
                    }

                    .history-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 1.5rem;
                        border-bottom: 2px solid var(--border);
                        position: sticky;
                        top: 0;
                        background: var(--bg);
                        z-index: 10;
                    }

                    .history-header h2 {
                        margin: 0;
                        font-size: 1.5rem;
                    }

                    .close-btn {
                        background: none;
                        border: none;
                        font-size: 1.5rem;
                        cursor: pointer;
                        color: var(--text-dim);
                        padding: 0.5rem;
                        line-height: 1;
                    }

                    .view-tabs {
                        display: flex;
                        gap: 0.5rem;
                        padding: 1rem 1.5rem;
                        background: var(--card-bg);
                        border-bottom: 1px solid var(--border);
                    }

                    .view-tabs button {
                        padding: 0.75rem 1.5rem;
                        border: none;
                        background: transparent;
                        color: var(--text-dim);
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 0.9rem;
                        transition: all 0.2s;
                    }

                    .view-tabs button.active {
                        background: var(--accent);
                        color: white;
                    }

                    .controls-bar {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 1rem 1.5rem;
                        gap: 1rem;
                    }

                    .filter-select {
                        padding: 0.5rem 1rem;
                        border-radius: 6px;
                        border: 1px solid var(--border);
                        background: var(--card-bg);
                        color: var(--text);
                    }

                    .export-btns {
                        display: flex;
                        gap: 0.5rem;
                    }

                    .export-btn {
                        padding: 0.5rem 1rem;
                        border: 1px solid var(--border);
                        background: var(--card-bg);
                        color: var(--text);
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 0.85rem;
                    }

                    .test-list {
                        padding: 0 1.5rem 1.5rem;
                    }

                    .empty-state {
                        text-align: center;
                        padding: 3rem 2rem;
                        color: var(--text-dim);
                    }

                    .test-item {
                        background: var(--card-bg);
                        border-radius: 12px;
                        padding: 1rem;
                        margin-bottom: 1rem;
                        cursor: pointer;
                        transition: transform 0.2s;
                        border: 2px solid transparent;
                    }

                    .test-item:hover {
                        transform: translateY(-2px);
                        border-color: var(--accent);
                    }

                    .test-item-header {
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                    }

                    .test-category {
                        width: 40px;
                        height: 40px;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.2rem;
                    }

                    .test-info {
                        flex: 1;
                    }

                    .test-info h4 {
                        margin: 0 0 0.25rem 0;
                        font-size: 1rem;
                    }

                    .test-meta {
                        margin: 0;
                        font-size: 0.75rem;
                        color: var(--text-dim);
                    }

                    .delete-btn {
                        background: none;
                        border: none;
                        font-size: 1.2rem;
                        cursor: pointer;
                        padding: 0.5rem;
                        opacity: 0.6;
                    }

                    .delete-btn:hover {
                        opacity: 1;
                    }

                    .winner-badge {
                        margin-top: 0.75rem;
                        padding: 0.5rem 1rem;
                        background: linear-gradient(135deg, #f59e0b, #d97706);
                        border-radius: 6px;
                        font-size: 0.85rem;
                        font-weight: 600;
                        color: white;
                        display: inline-block;
                    }

                    .test-details {
                        margin-top: 1rem;
                        padding-top: 1rem;
                        border-top: 1px solid var(--border);
                    }

                    .notes {
                        margin-bottom: 1rem;
                        padding: 0.75rem;
                        background: var(--bg);
                        border-radius: 6px;
                        font-size: 0.9rem;
                    }

                    .scores-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                        gap: 0.75rem;
                        margin-bottom: 1rem;
                    }

                    .score-card {
                        background: var(--bg);
                        padding: 0.75rem;
                        border-radius: 6px;
                    }

                    .score-model {
                        font-weight: 600;
                        margin-bottom: 0.5rem;
                        font-size: 0.9rem;
                    }

                    .score-metrics {
                        display: flex;
                        flex-direction: column;
                        gap: 0.25rem;
                        font-size: 0.75rem;
                        color: var(--text-dim);
                        margin-bottom: 0.5rem;
                    }

                    .score-overall {
                        font-weight: 600;
                        padding-top: 0.5rem;
                        border-top: 1px solid var(--border);
                        font-size: 0.85rem;
                    }

                    .test-image {
                        text-align: center;
                    }

                    .test-image img {
                        max-width: 200px;
                        max-height: 200px;
                        border-radius: 8px;
                    }

                    .analytics-view {
                        padding: 1.5rem;
                    }

                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: 1rem;
                        margin-bottom: 2rem;
                    }

                    .stat-card {
                        background: var(--card-bg);
                        padding: 1.5rem;
                        border-radius: 12px;
                        text-align: center;
                        border-top: 3px solid var(--accent);
                    }

                    .stat-icon {
                        font-size: 2rem;
                        margin-bottom: 0.5rem;
                    }

                    .stat-value {
                        font-size: 2rem;
                        font-weight: 700;
                        margin-bottom: 0.25rem;
                    }

                    .stat-label {
                        font-size: 0.85rem;
                        color: var(--text-dim);
                    }

                    .avg-scores-section h3 {
                        margin: 0 0 1rem 0;
                        font-size: 1.2rem;
                    }

                    .avg-scores-grid {
                        display: flex;
                        flex-direction: column;
                        gap: 1rem;
                    }

                    .avg-score-item {
                        display: grid;
                        grid-template-columns: 150px 1fr 80px;
                        align-items: center;
                        gap: 1rem;
                    }

                    .avg-score-name {
                        font-weight: 600;
                    }

                    .avg-score-bar {
                        height: 24px;
                        background: var(--card-bg);
                        border-radius: 12px;
                        overflow: hidden;
                    }

                    .avg-score-fill {
                        height: 100%;
                        background: linear-gradient(90deg, #667eea, #764ba2);
                        transition: width 0.3s;
                    }

                    .avg-score-value {
                        text-align: right;
                        font-weight: 600;
                    }
                `}</style>
            </div>
        </div>
    );
}
