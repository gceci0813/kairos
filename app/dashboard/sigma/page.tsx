'use client';

import { useState } from 'react';

const RECOMMENDED_ACTION_STYLE: Record<string, string> = {
  no_action: 'bg-slate-100 text-slate-600',
  monitor: 'bg-blue-100 text-blue-700',
  flag_for_review: 'bg-amber-100 text-amber-700',
  escalate: 'bg-red-100 text-red-700',
};

export default function SigmaPage() {
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('');
  const [analyze, setAnalyze] = useState(false);
  const [stored, setStored] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [findings, setFindings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    if (!query.trim() && !stored) {
      setError('Please enter a query');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/sigma', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          source: source || undefined,
          analyze,
          stored,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Error: ${response.status}`);
      }

      const data = await response.json();
      setResults(data.results || []);
      setFindings(data.findings || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">SIGMA</h1>
      <p className="text-sm text-gray-500 mb-6">Signal Intelligence and Global Monitoring</p>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Query:</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Enter search query..."
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Source (optional):</label>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">All Sources</option>
          <option value="gdelt">GDELT</option>
          <option value="reddit">Reddit</option>
          <option value="newsapi">NewsAPI</option>
          <option value="twitter">X/Twitter</option>
          <option value="youtube">YouTube</option>
          <option value="telegram">Telegram</option>
          <option value="bluesky">Bluesky</option>
        </select>
        <p className="text-xs text-gray-400 mt-1">
          Sources without configured API credentials will be skipped automatically.
        </p>
      </div>

      <label className="flex items-center gap-2 mb-2 text-sm font-medium">
        <input type="checkbox" checked={analyze} onChange={(e) => setAnalyze(e.target.checked)} />
        Run NLP analysis (sentiment, entities, topics, coordination signals)
      </label>

      <label className="flex items-center gap-2 mb-4 text-sm font-medium">
        <input type="checkbox" checked={stored} onChange={(e) => setStored(e.target.checked)} />
        Search stored Telegram index (instant; from the ingested channel store)
      </label>

      <button
        onClick={fetchData}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? 'Searching...' : 'Search'}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {findings.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Findings ({findings.length})</h2>
          <div className="space-y-4">
            {findings.map((f, index) => (
              <div key={index} className="p-4 border rounded">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{f.finding}</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${RECOMMENDED_ACTION_STYLE[f.recommended_action] ?? 'bg-slate-100 text-slate-600'}`}>
                    {f.recommended_action.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{f.raw.content}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Confidence: {(f.confidence_score * 100).toFixed(0)}% · Sentiment: {f.nlp.sentiment} ({f.nlp.sentimentScore.toFixed(2)}) · Language: {f.nlp.language}
                </p>
                {f.nlp.entities.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Entities: {f.nlp.entities.map((e: any) => `${e.text} (${e.type})`).join(', ')}
                  </p>
                )}
                {f.nlp.topics.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">Topics: {f.nlp.topics.join(', ')}</p>
                )}
                {f.coordination.isFlagged && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                    Coordination signal (score {f.coordination.score.toFixed(2)}): {f.coordination.reasons.join('; ')}
                  </div>
                )}
                <details className="mt-2">
                  <summary className="text-xs text-blue-600 cursor-pointer">Reasoning chain</summary>
                  <ul className="text-xs text-gray-500 list-disc ml-4 mt-1">
                    {f.reasoning_chain.map((step: string, i: number) => <li key={i}>{step}</li>)}
                  </ul>
                </details>
                {f.source_citations[0]?.url && (
                  <a
                    href={f.source_citations[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm block mt-2"
                  >
                    Read more
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {findings.length === 0 && results.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Results ({results.length})</h2>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="p-4 border rounded">
                <h3 className="font-semibold">{result.content}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Source: {result.source} | Author: {result.author} |
                  Date: {new Date(result.timestamp).toLocaleDateString()}
                </p>
                {result.metadata.url && (
                  <a
                    href={result.metadata.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm"
                  >
                    Read more
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
