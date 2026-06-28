'use client';

import { useState } from 'react';
import { LocationIntelligenceService } from './src/location-intelligence';

export default function LocationTestPage() {
  const [ip, setIp] = useState('');
  const [bio, setBio] = useState('');
  const [text, setText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const analyzeLocation = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const service = new LocationIntelligenceService();
      const analysis = await service.analyzeLocation({
        ip: ip || undefined,
        bio: bio || undefined,
        text: text || undefined
      });
      
      setResult(analysis);
    } catch (error: any) {
      console.error('Analysis failed:', error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Location Intelligence Test</h1>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">IP Address (optional):</label>
          <input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter IP address to analyze"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Bio/Profile Text:</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full p-2 border rounded h-24"
            placeholder="Enter bio or profile text to extract location information"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Sample Text:</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-2 border rounded h-24"
            placeholder="Enter text to analyze for dialect patterns"
          />
        </div>
        
        <button
          onClick={analyzeLocation}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Analyzing...' : 'Analyze Location'}
        </button>
      </div>
      
      {result && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
          
          {result.error ? (
            <div className="p-3 bg-red-100 text-red-700 rounded">
              Error: {result.error}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 border rounded">
                <h3 className="font-semibold mb-2">Consolidated Location</h3>
                <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(result.consolidatedLocation, null, 2)}
                </pre>
              </div>
              
              {result.ipLocation && (
                <div className="p-4 border rounded">
                  <h3 className="font-semibold mb-2">IP Geolocation</h3>
                  <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(result.ipLocation, null, 2)}
                  </pre>
                </div>
              )}
              
              {result.bioLocations && result.bioLocations.length > 0 && (
                <div className="p-4 border rounded">
                  <h3 className="font-semibold mb-2">Bio Location Extraction</h3>
                  <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(result.bioLocations, null, 2)}
                  </pre>
                </div>
              )}
              
              {result.dialectAnalysis && result.dialectAnalysis.length > 0 && (
                <div className="p-4 border rounded">
                  <h3 className="font-semibold mb-2">Dialect Analysis</h3>
                  <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(result.dialectAnalysis, null, 2)}
                  </pre>
                </div>
              )}
              
              {result.timezoneInference && result.timezoneInference.length > 0 && (
                <div className="p-4 border rounded">
                  <h3 className="font-semibold mb-2">Timezone Inference</h3>
                  <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(result.timezoneInference, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}