'use client';
import { useState } from 'react';

export default function RecognitionPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [databases, setDatabases] = useState<any>(null);
  
  const runSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/recognition/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, databases: ['all'] })
      });
      
      const data = await response.json();
      setResults(data.results);
      setDatabases(data.databases);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Pattern Recognition System</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Search Parameters</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Search Query</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter search term..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Search Type</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option>Pattern Match</option>
                  <option>Similarity Search</option>
                  <option>Behavioral Analysis</option>
                  <option>Network Analysis</option>
                </select>
              </div>
              
              <button
                onClick={runSearch}
                disabled={loading}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
              >
                {loading ? 'Searching...' : 'Run Recognition Search'}
              </button>
            </div>
            
            {databases && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Database Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Social Media:</span>
                    <span className="text-green-600">{databases.social_media}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Public Records:</span>
                    <span className="text-green-600">{databases.public_records}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>News Archives:</span>
                    <span className="text-green-600">{databases.news_archives}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Government Data:</span>
                    <span className="text-green-600">{databases.government_data}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Recognition Results</h2>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border-b border-gray-200 pb-4">
                  <div className="flex justify-between">
                    <div className="font-medium">{result.entity}</div>
                    <div className="text-sm text-gray-500">Match: {result.confidence}%</div>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">{result.context}</div>
                  <div className="mt-2 flex gap-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{result.source}</span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">{result.type}</span>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">{result.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}