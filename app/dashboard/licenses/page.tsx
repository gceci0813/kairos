'use client';
import { useState } from 'react';

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [activeLicense, setActiveLicense] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const loadLicenses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/licenses/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'all' })
      });
      
      const data = await response.json();
      setLicenses(data.licenses);
    } catch (error) {
      console.error('Licenses error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const generateLicense = async (type: string) => {
    try {
      const response = await fetch('/api/licenses/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: type,
          duration: '1year',
          features: ['full_access']
        })
      });
      
      const data = await response.json();
      setActiveLicense(data.license);
      loadLicenses();
    } catch (error) {
      console.error('Generate license error:', error);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">License Management</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Active Licenses</h3>
          <div className="text-2xl font-bold text-blue-600">
            {licenses.filter(l => l.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600">Currently valid</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Expired Licenses</h3>
          <div className="text-2xl font-bold text-red-600">
            {licenses.filter(l => l.status === 'expired').length}
          </div>
          <div className="text-sm text-gray-600">Need renewal</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Pending Licenses</h3>
          <div className="text-2xl font-bold text-orange-600">
            {licenses.filter(l => l.status === 'pending').length}
          </div>
          <div className="text-sm text-gray-600">Awaiting activation</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Revenue MTD</h3>
          <div className="text-2xl font-bold text-green-600">$2.4M</div>
          <div className="text-sm text-gray-600">This month</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">License Generation</h2>
            
            <div className="space-y-3">
              <button
                onClick={() => generateLicense('government')}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Generate Gov License
              </button>
              
              <button
                onClick={() => generateLicense('enterprise')}
                className="w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              >
                Generate Enterprise License
              </button>
              
              <button
                onClick={() => generateLicense('academic')}
                className="w-full bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600"
              >
                Generate Academic License
              </button>
              
              <button
                onClick={loadLicenses}
                disabled={loading}
                className="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 disabled:bg-gray-400"
              >
                {loading ? 'Loading...' : 'Load Licenses'}
              </button>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">License Types</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Government</span>
                  <span className="text-blue-600 font-medium">$500K/year</span>
                </div>
                <div className="flex justify-between">
                  <span>Enterprise</span>
                  <span className="text-green-600 font-medium">$250K/year</span>
                </div>
                <div className="flex justify-between">
                  <span>Academic</span>
                  <span className="text-purple-600 font-medium">$50K/year</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">License Inventory</h2>
            <div className="space-y-4">
              {licenses.map((license, index) => (
                <div key={index} className="border-b border-gray-200 pb-4">
                  <div className="flex justify-between">
                    <div className="font-medium">{license.client}</div>
                    <div className="text-sm text-gray-500">
                      {license.status} • {license.type}
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    License Key: {license.key}
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    Expires: {license.expiry}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      license.status === 'active' ? 'bg-green-100 text-green-800' :
                      license.status === 'expired' ? 'bg-red-100 text-red-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {license.status.toUpperCase()}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {license.features.length} features
                    </span>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      {license.seats} seats
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