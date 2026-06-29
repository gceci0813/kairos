'use client';
import { useState } from 'react';

export default function FusionPage() {
  const [fusionResults, setFusionResults] = useState<any>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>(['all']);
  
  const runFusion = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/fusion/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources: selectedSources })
      });
      
      const data = await response.json();
      setFusionResults(data.results);
      setSources(data.sources);
    } catch (error) {
      console.error('Fusion error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Intelligence Fusion Engine</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Data Sources</h2>
            
            <div className="space-y-3">
              <div className="p-3 border border-gray-200 rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">SIGINT</div>
                    <div className="text-sm text-gray-500">Signals Intelligence</div>
                  </div>
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                </div>
              </div>
              
              <div className="p-3 border border-gray-200 rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">OSINT</div>
                    <div className="text-sm text-gray-500">Open Source Intelligence</div>
                  </div>
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                </div>
              </div>
              
              <div className="p-3 border border-gray-200 rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">GEOINT</div>
                    <div className="text-sm text-gray-500">Geospatial Intelligence</div>
                  </div>
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                </div>
              </div>
              
              <div className="p-3 border border-gray-200 rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">HUMINT</div>
                    <div className="text-sm text-gray-500">Human Intelligence</div>
                  </div>
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                </div>
              </div>
              
              <div className="p-3 border border-gray-200 rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">CYBERINT</div>
                    <div className="text-sm text-gray-500">Cyber Intelligence</div>
                  </div>
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                </div>
              </div>
            </div>
            
            <button
              onClick={runFusion}
              disabled={loading}
              className="w-full mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? 'Fusing Data...' : 'Run Intelligence Fusion'}
            </button>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Fusion Results</h2>
            <div className="h-96 bg-gray-100 rounded-md flex items-center justify-center">
              <p className="text-gray-500">Intelligence correlation visualization</p>
            </div>
          </div>
        </div>
      </div>
      
      {fusionResults && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Correlated Intelligence</h2>
          <div className="space-y-4">
            {fusionResults.map((item: any, index: number) => (
              <div key={index} className="border-b border-gray-200 pb-4">
                <div className="flex justify-between">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-sm text-gray-500">Confidence: {item.confidence}%</div>
                </div>
                <div className="mt-1 text-sm text-gray-600">{item.summary}</div>
                <div className="mt-2 flex gap-2">
                  {item.sources.map((source: string, idx: number) => (
                    <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}