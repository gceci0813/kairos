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
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Location Intelligence</h1>
        <p className="text-gray-600">Advanced geolocation analysis using multiple data sources</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Input Data</h2>
            
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
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
              >
                {loading ? 'Analyzing...' : 'Analyze Location'}
              </button>
            </form>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          {results && (
            <div className="space-y-6">
              {results.consolidated && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Consolidated Location</h2>
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="text-lg font-medium text-blue-900">{results.consolidated.location}</div>
                    <div className="text-sm text-blue-700 mt-1">
                      Lat: {results.consolidated.latitude}, Lng: {results.consolidated.longitude}
                    </div>
                    <div className="text-sm text-blue-700 mt-1">
                      Confidence: {(results.consolidated.confidence * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-blue-700 mt-1">
                      Sources: {results.consolidated.sources.join(', ')}
                    </div>
                  </div>
                </div>
              )}
              
              {results.ipLocation && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">IP Geolocation</h2>
                  <div className="space-y-2">
                    <div><span className="font-medium">IP:</span> {results.ipLocation.ip}</div>
                    <div><span className="font-medium">Location:</span> {results.ipLocation.city}, {results.ipLocation.region}, {results.ipLocation.country}</div>
                    <div><span className="font-medium">Coordinates:</span> {results.ipLocation.latitude}, {results.ipLocation.longitude}</div>
                    <div><span className="font-medium">Timezone:</span> {results.ipLocation.timezone}</div>
                    <div><span className="font-medium">Confidence:</span> {(results.ipLocation.confidence * 100).toFixed(1)}%</div>
                  </div>
                </div>
              )}
              
              {results.bioLocation && results.bioLocation.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Bio Location Analysis</h2>
                  <div className="space-y-3">
                    {results.bioLocation.map((location: any, index: number) => (
                      <div key={index} className="border-b border-gray-200 pb-2">
                        <div className="font-medium">{location.location}, {location.region}</div>
                        <div className="text-sm text-gray-600">
                          Keyword: "{location.keyword}" | Confidence: {(location.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {results.textLocation && results.textLocation.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Text Location Analysis</h2>
                  <div className="space-y-3">
                    {results.textLocation.map((location: any, index: number) => (
                      <div key={index} className="border-b border-gray-200 pb-2">
                        <div className="font-medium">{location.location}, {location.region}</div>
                        <div className="text-sm text-gray-600">
                          Keyword: "{location.keyword}" | Confidence: {(location.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {results.timezoneInference && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Timezone Inference</h2>
                  <div className="space-y-2">
                    <div><span className="font-medium">Timezone:</span> {results.timezoneInference.timezone}</div>
                    <div><span className="font-medium">Confidence:</span> {(results.timezoneInference.confidence * 100).toFixed(1)}%</div>
                  </div>
                </div>
              )}
              
              {results.error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="text-red-800">{results.error}</div>
                </div>
              )}
            </div>
          )}
          
          {!results && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center text-gray-500">
                <p>Enter data and click "Analyze Location" to see results</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}