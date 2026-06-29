'use client';
import { useState } from 'react';

export default function DataIntegrationPage() {
  const [dataSources, setDataSources] = useState<any[]>([]);
  const [integrations, setIntegrations] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const runIntegration = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/integration/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'full_sync' })
      });
      
      const data = await response.json();
      setDataSources(data.sources);
      setIntegrations(data.integrations);
    } catch (error) {
      console.error('Integration error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Data Integration Platform</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Data Sources</h2>
            
            <div className="space-y-3">
              <div className="p-3 border border-gray-200 rounded-md">
                <div className="font-medium">Government Databases</div>
                <div className="text-sm text-gray-500">Voter records, public data</div>
                <div className="text-xs text-green-600 mt-1">Connected</div>
              </div>
              
              <div className="p-3 border border-gray-200 rounded-md">
                <div className="font-medium">Social Media APIs</div>
                <div className="text-sm text-gray-500">Real-time monitoring</div>
                <div className="text-xs text-green-600 mt-1">Connected</div>
              </div>
              
              <div className="p-3 border border-gray-200 rounded-md">
                <div className="font-medium">News Aggregators</div>
                <div className="text-sm text-gray-500">Media sentiment analysis</div>
                <div className="text-xs text-green-600 mt-1">Connected</div>
              </div>
              
              <div className="p-3 border border-gray-200 rounded-md">
                <div className="font-medium">Public Records</div>
                <div className="text-sm text-gray-500">Property, business records</div>
                <div className="text-xs text-yellow-600 mt-1">Partial</div>
              </div>
            </div>
            
            <button
              onClick={runIntegration}
              disabled={loading}
              className="w-full mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? 'Integrating...' : 'Run Full Integration'}
            </button>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Integration Pipeline</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                <div>Data Ingestion</div>
                <div className="ml-auto text-sm text-green-600">Active</div>
              </div>
              
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                <div>Data Cleaning</div>
                <div className="ml-auto text-sm text-green-600">Active</div>
              </div>
              
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></div>
                <div>Entity Resolution</div>
                <div className="ml-auto text-sm text-yellow-600">Processing</div>
              </div>
              
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-400 rounded-full mr-3"></div>
                <div>Pattern Analysis</div>
                <div className="ml-auto text-sm text-gray-600">Queued</div>
              </div>
              
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-400 rounded-full mr-3"></div>
                <div>Intelligence Generation</div>
                <div className="ml-auto text-sm text-gray-600">Queued</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {integrations && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Integration Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{integrations.records_processed}</div>
              <div className="text-sm text-gray-600">Records Processed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{integrations.entities_matched}</div>
              <div className="text-sm text-gray-600">Entities Matched</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{integrations.patterns_found}</div>
              <div className="text-sm text-gray-600">Patterns Found</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}