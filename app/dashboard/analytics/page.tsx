'use client';
import { useState } from 'react';

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  
  const runAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeRange })
      });
      
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Analytics error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Advanced Analytics</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Data Processed</h3>
          <div className="text-2xl font-bold text-blue-600">
            {analyticsData ? analyticsData.data_processed.toLocaleString() : '---'}
          </div>
          <div className="text-sm text-gray-600">Records analyzed</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Patterns Identified</h3>
          <div className="text-2xl font-bold text-green-600">
            {analyticsData ? analyticsData.patterns_identified.toLocaleString() : '---'}
          </div>
          <div className="text-sm text-gray-600">Unique patterns</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Threat Score</h3>
          <div className="text-2xl font-bold text-red-600">
            {analyticsData ? analyticsData.threat_score : '---'}
          </div>
          <div className="text-sm text-gray-600">Current risk level</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Confidence</h3>
          <div className="text-2xl font-bold text-purple-600">
            {analyticsData ? `${analyticsData.confidence}%` : '---'}
          </div>
          <div className="text-sm text-gray-600">Analysis confidence</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Analysis Parameters</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Time Range</label>
                <select 
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="24h">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Analysis Type</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option>Comprehensive</option>
                  <option>Threat-focused</option>
                  <option>Pattern Analysis</option>
                  <option>Predictive</option>
                </select>
              </div>
              
              <button
                onClick={runAnalytics}
                disabled={loading}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
              >
                {loading ? 'Analyzing...' : 'Run Analysis'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Analytics Results</h2>
            <div className="h-96 bg-gray-100 rounded-md flex items-center justify-center">
              <p className="text-gray-500">Analytics visualization will appear here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}