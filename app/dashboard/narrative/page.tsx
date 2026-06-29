'use client';
import { useState } from 'react';

export default function NarrativeAnalysisPage() {
  const [narratives, setNarratives] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const analyzeNarrative = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/narrative/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'political_feed' })
      });
      
      const data = await response.json();
      setNarratives(data.narratives);
      setAnalysis(data.analysis);
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Narrative Intelligence</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Analysis Controls</h2>
            
            <button
              onClick={analyzeNarrative}
              disabled={loading}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? 'Analyzing...' : 'Analyze Narratives'}
            </button>
            
            {analysis && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Narrative Insights</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Dominant Narratives:</span>
                    <span className="text-blue-600">{analysis.dominant}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Emerging Narratives:</span>
                    <span className="text-orange-600">{analysis.emerging}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Narrative Velocity:</span>
                    <span className="text-green-600">{analysis.velocity}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Narrative Map</h2>
            <div className="h-96 bg-gray-100 rounded-md flex items-center justify-center">
              <p className="text-gray-500">Narrative relationship network</p>
            </div>
          </div>
        </div>
      </div>
      
      {narratives.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Active Narratives</h2>
          <div className="space-y-4">
            {narratives.map((narrative, index) => (
              <div key={index} className="border-b border-gray-200 pb-4">
                <div className="flex justify-between">
                  <div className="font-medium">{narrative.theme}</div>
                  <div className="text-sm text-gray-500">Influence: {narrative.influence}%</div>
                </div>
                <div className="mt-1">{narrative.summary}</div>
                <div className="mt-2 text-sm text-gray-500">
                  Sentiment: {narrative.sentiment} • Reach: {narrative.reach}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}