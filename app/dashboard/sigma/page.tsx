'use client';

import { useState } from 'react';

export default function SigmaPage() {
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    if (!query.trim()) {
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
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">SIGMA Module Test</h1>

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
        </select>
      </div>

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

      {results.length > 0 && (
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
