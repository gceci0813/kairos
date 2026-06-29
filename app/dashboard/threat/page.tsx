'use client';
import { useState } from 'react';

export default function ThreatPage() {
  const [threats, setThreats] = useState<any[]>([]);
  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedThreat, setSelectedThreat] = useState<any>(null);
  
  const runAssessment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/threat/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'comprehensive' })
      });
      
      const data = await response.json();
      setThreats(data.threats);
      setAssessment(data.assessment);
    } catch (error) {
      console.error('Assessment error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Threat Assessment System</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Threat Matrix</h2>
            
            <div className="space-y-3">
              <div className="p-3 border border-red-200 rounded-md bg-red-50">
                <div className="font-medium text-red-800">Critical Threats</div>
                <div className="text-2xl font-bold text-red-600">
                  {threats.filter(t => t.level === 'critical').length}
                </div>
              </div>
              
              <div className="p-3 border border-orange-200 rounded-md bg-orange-50">
                <div className="font-medium text-orange-800">High Threats</div>
                <div className="text-2xl font-bold text-orange-600">
                  {threats.filter(t => t.level === 'high').length}
                </div>
              </div>
              
              <div className="p-3 border border-yellow-200 rounded-md bg-yellow-50">
                <div className="font-medium text-yellow-800">Medium Threats</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {threats.filter(t => t.level === 'medium').length}
                </div>
              </div>
              
              <div className="p-3 border border-blue-200 rounded-md bg-blue-50">
                <div className="font-medium text-blue-800">Low Threats</div>
                <div className="text-2xl font-bold text-blue-600">
                  {threats.filter(t => t.level === 'low').length}
                </div>
              </div>
            </div>
            
            <button
              onClick={runAssessment}
              disabled={loading}
              className="w-full mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? 'Assessing...' : 'Run Threat Assessment'}
            </button>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Threat Landscape</h2>
            <div className="h-96 bg-gray-100 rounded-md flex items-center justify-center">
              <p className="text-gray-500">Threat visualization and mapping</p>
            </div>
          </div>
        </div>
      </div>
      
      {threats.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Identified Threats</h2>
          <div className="space-y-4">
            {threats.map((threat, index) => (
              <div key={index} className="border-b border-gray-200 pb-4">
                <div className="flex justify-between">
                  <div className="font-medium">{threat.title}</div>
                  <div className="text-sm text-gray-500">
                    {threat.severity} • {threat.category}
                  </div>
                </div>
                <div className="mt-1 text-sm text-gray-600">{threat.description}</div>
                <div className="mt-2 flex gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    threat.level === 'critical' ? 'bg-red-100 text-red-800' :
                    threat.level === 'high' ? 'bg-orange-100 text-orange-800' :
                    threat.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {threat.level.toUpperCase()}
                  </span>
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    {threat.actor}
                  </span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {threat.location}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}