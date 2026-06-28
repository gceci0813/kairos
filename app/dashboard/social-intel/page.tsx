'use client';
import { useState } from 'react';

export default function SocialIntelPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sentimentData, setSentimentData] = useState<any>(null);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/social-intel/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      
      const data = await response.json();
      setResults(data.posts);
      setSentimentData(data.sentiment);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Social Media Intelligence</h1>
      
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
                  placeholder="e.g., Trump, Biden, election"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Time Range</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option>Last 24 hours</option>
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Platform</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option>Twitter/X</option>
                  <option>Reddit</option>
                  <option>Facebook</option>
                  <option>Instagram</option>
                </select>
              </div>
              
              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
              >
                {loading ? 'Analyzing...' : 'Analyze Social Media'}
              </button>
            </div>
            
            {sentimentData && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Sentiment Analysis</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Positive:</span>
                    <span className="text-green-600">{sentimentData.positive}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Neutral:</span>
                    <span className="text-gray-600">{sentimentData.neutral}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Negative:</span>
                    <span className="text-red-600">{sentimentData.negative}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 h-full">
            <h2 className="text-xl font-semibold mb-4">Geographic Distribution</h2>
            <div className="h-96 bg-gray-100 rounded-md flex items-center justify-center">
              <p className="text-gray-500">Interactive map will appear here</p>
            </div>
          </div>
        </div>
      </div>
      
      {results && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Posts</h2>
          <div className="space-y-4">
            {results.slice(0, 5).map((post: any, index: number) => (
              <div key={index} className="border-b border-gray-200 pb-4">
                <div className="flex justify-between">
                  <div className="font-medium">{post.author}</div>
                  <div className="text-sm text-gray-500">{post.location}</div>
                </div>
                <div className="mt-1">{post.content}</div>
                <div className="mt-2 text-sm text-gray-500">
                  {post.timestamp} • Sentiment: {post.sentiment}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}