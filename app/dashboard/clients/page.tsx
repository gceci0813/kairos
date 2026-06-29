'use client';
import { useState } from 'react';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const loadClients = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/clients/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'all' })
      });
      
      const data = await response.json();
      setClients(data.clients);
    } catch (error) {
      console.error('Clients error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Client Management</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Total Clients</h3>
          <div className="text-2xl font-bold text-blue-600">
            {clients.length}
          </div>
          <div className="text-sm text-gray-600">All categories</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Government</h3>
          <div className="text-2xl font-bold text-green-600">
            {clients.filter(c => c.type === 'government').length}
          </div>
          <div className="text-sm text-gray-600">Federal agencies</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Enterprise</h3>
          <div className="text-2xl font-bold text-purple-600">
            {clients.filter(c => c.type === 'enterprise').length}
          </div>
          <div className="text-sm text-gray-600">Private sector</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Academic</h3>
          <div className="text-2xl font-bold text-orange-600">
            {clients.filter(c => c.type === 'academic').length}
          </div>
          <div className="text-sm text-gray-600">Research institutions</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Client Operations</h2>
            
            <div className="space-y-3">
              <button
                onClick={loadClients}
                disabled={loading}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
              >
                {loading ? 'Loading...' : 'Load Clients'}
              </button>
              
              <button
                className="w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              >
                Add New Client
              </button>
              
              <button
                className="w-full bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600"
              >
                Generate Reports
              </button>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Client Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Active</span>
                  <span className="text-green-600 font-medium">
                    {clients.filter(c => c.status === 'active').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Trial</span>
                  <span className="text-blue-600 font-medium">
                    {clients.filter(c => c.status === 'trial').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Suspended</span>
                  <span className="text-red-600 font-medium">
                    {clients.filter(c => c.status === 'suspended').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Client Directory</h2>
            <div className="space-y-4">
              {clients.map((client, index) => (
                <div key={index} className="border-b border-gray-200 pb-4">
                  <div className="flex justify-between">
                    <div className="font-medium">{client.name}</div>
                    <div className="text-sm text-gray-500">
                      {client.status} • {client.type}
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">{client.description}</div>
                  <div className="mt-1 text-sm text-gray-600">
                    Contact: {client.contact}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      client.status === 'active' ? 'bg-green-100 text-green-800' :
                      client.status === 'trial' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {client.status.toUpperCase()}
                    </span>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      {client.license}
                    </span>
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                      {client.users} users
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