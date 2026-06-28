'use client';
import { useState } from 'react';

export default function LocationTestPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ip: '',
    bio: '',
    text: '',
    activityHours: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/location-intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error analyzing location:', error);
      setResults({ error: 'Failed to analyze location' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Location Intelligence</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Analyze Location Data</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">IP Address</label>
            <input
              type="text"
              value={formData.ip}
              onChange={(e) => setFormData({...formData, ip: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g., 8.8.8.8"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="User bio with location hints"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Text</label>
            <textarea
              value={formData.text}
              onChange={(e) => setFormData({...formData, text: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Text content for dialect analysis"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Activity Hours</label>
            <input
              type="text"
              value={formData.activityHours}
              onChange={(e) => setFormData({...formData, activityHours: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="e.g., 9-17"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Analyzing...' : 'Analyze Location'}
          </button>
        </form>
      </div>
      
      {results && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}