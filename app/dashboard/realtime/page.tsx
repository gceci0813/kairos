'use client';
import { useState, useEffect } from 'react';

export default function RealTimePage() {
  const [activeThreats, setActiveThreats] = useState<any[]>([]);
  const [monitoringStatus, setMonitoringStatus] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  
  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      fetch('/api/realtime/status')
        .then(res => res.json())
        .then(data => {
          setMonitoringStatus(data.status);
          setActiveThreats(data.threats);
          setAlerts(data.alerts);
        });
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Real-Time Intelligence</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Data Ingestion:</span>
              <span className="text-green-600 font-medium">Active</span>
            </div>
            <div className="flex justify-between">
              <span>Pattern Analysis:</span>
              <span className="text-green-600 font-medium">Active</span>
            </div>
            <div className="flex justify-between">
              <span>Threat Detection:</span>
              <span className="text-green-600 font-medium">Active</span>
            </div>
            <div className="flex justify-between">
              <span>Alert System:</span>
              <span className="text-green-600 font-medium">Active</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Active Threats</h2>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{activeThreats.length}</div>
            <div className="text-sm text-gray-600">Currently Tracked</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Alerts</h2>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{alerts.length}</div>
            <div className="text-sm text-gray-600">Last 24 Hours</div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Live Threat Feed</h2>
        <div className="space-y-4">
          {activeThreats.map((threat, index) => (
            <div key={index} className="border-b border-gray-200 pb-4">
              <div className="flex justify-between">
                <div className="font-medium">{threat.title}</div>
                <div className="text-sm text-gray-500">{threat.timestamp}</div>
              </div>
              <div className="mt-1 text-sm text-gray-600">{threat.description}</div>
              <div className="mt-2 flex gap-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  threat.severity === 'high' ? 'bg-red-100 text-red-800' :
                  threat.severity === 'medium' ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {threat.severity.toUpperCase()}
                </span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{threat.type}</span>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">{threat.location}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}