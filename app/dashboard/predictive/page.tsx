'use client';
import { useState } from 'react';

export default function PredictivePage() {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [models, setModels] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const runPrediction = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/predictive/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'ensemble' })
      });
      
      const data = await response.json();
      setPredictions(data.predictions);
      setModels(data.models);
    } catch (error) {
      console.error('Prediction error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Predictive Intelligence</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Model Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Ensemble Model:</span>
              <span className="text-green-600 font-medium">Active</span>
            </div>
            <div className="flex justify-between">
              <span>Accuracy:</span>
              <span className="text-blue-600 font-medium">94.7%</span>
            </div>
            <div className="flex justify-between">
              <span>Last Training:</span>
              <span className="text-gray-600 font-medium">2 hours ago</span>
            </div>
          </div>
          
          <button
            onClick={runPrediction}
            disabled={loading}
            className="w-full mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Predicting...' : 'Run Prediction'}
          </button>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Prediction Confidence</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span>High Confidence</span>
                  <span className="text-green-600 font-medium">78%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{width: '78%'}}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span>Medium Confidence</span>
                  <span className="text-yellow-600 font-medium">18%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-600 h-2 rounded-full" style={{width: '18%'}}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span>Low Confidence</span>
                  <span className="text-red-600 font-medium">4%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-600 h-2 rounded-full" style={{width: '4%'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {predictions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Active Predictions</h2>
          <div className="space-y-4">
            {predictions.map((prediction, index) => (
              <div key={index} className="border-b border-gray-200 pb-4">
                <div className="flex justify-between">
                  <div className="font-medium">{prediction.event}</div>
                  <div className="text-sm text-gray-500">
                    {prediction.confidence}% confidence • {prediction.timeframe}
                  </div>
                </div>
                <div className="mt-1 text-sm text-gray-600">{prediction.description}</div>
                <div className="mt-2 flex gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    prediction.impact === 'high' ? 'bg-red-100 text-red-800' :
                    prediction.impact === 'medium' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {prediction.impact.toUpperCase()} IMPACT
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{prediction.category}</span>
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">{prediction.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}