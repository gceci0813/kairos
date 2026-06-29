'use client';
import { useState } from 'react';

export default function OperationsPage() {
  const [operations, setOperations] = useState<any[]>([]);
  const [activeOperation, setActiveOperation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const loadOperations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/operations/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'all' })
      });
      
      const data = await response.json();
      setOperations(data.operations);
    } catch (error) {
      console.error('Operations error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const createOperation = async () => {
    try {
      const response = await fetch('/api/operations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'intelligence',
          priority: 'high',
          title: 'New Intelligence Operation'
        })
      });
      
      const data = await response.json();
      setActiveOperation(data.operation);
      loadOperations();
    } catch (error) {
      console.error('Create operation error:', error);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Operations Command Center</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Active Operations</h3>
          <div className="text-2xl font-bold text-blue-600">
            {operations.filter(op => op.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600">Currently running</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Personnel Deployed</h3>
          <div className="text-2xl font-bold text-green-600">47</div>
          <div className="text-sm text-gray-600">Across 12 operations</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Success Rate</h3>
          <div className="text-2xl font-bold text-purple-600">87%</div>
          <div className="text-sm text-gray-600">Last 30 days</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Resource Utilization</h3>
          <div className="text-2xl font-bold text-orange-600">73%</div>
          <div className="text-sm text-gray-600">Current capacity</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Operations Control</h2>
            
            <div className="space-y-3">
              <button
                onClick={loadOperations}
                disabled={loading}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
              >
                {loading ? 'Loading...' : 'Load Operations'}
              </button>
              
              <button
                onClick={createOperation}
                className="w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              >
                Create New Operation
              </button>
              
              <button
                className="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Generate Report
              </button>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Operation Types</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Intelligence</span>
                  <span className="text-blue-600 font-medium">8</span>
                </div>
                <div className="flex justify-between">
                  <span>Counter-Intel</span>
                  <span className="text-red-600 font-medium">3</span>
                </div>
                <div className="flex justify-between">
                  <span>Support</span>
                  <span className="text-green-600 font-medium">2</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Active Operations</h2>
            <div className="space-y-4">
              {operations.map((op, index) => (
                <div key={index} className="border-b border-gray-200 pb-4">
                  <div className="flex justify-between">
                    <div className="font-medium">{op.title}</div>
                    <div className="text-sm text-gray-500">
                      {op.status} • Priority: {op.priority}
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">{op.description}</div>
                  <div className="mt-2 flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      op.status === 'active' ? 'bg-green-100 text-green-800' :
                      op.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                      op.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {op.status.toUpperCase()}
                    </span>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      {op.type}
                    </span>
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                      {op.location}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}