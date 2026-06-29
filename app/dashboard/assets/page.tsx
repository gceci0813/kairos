'use client';
import { useState } from 'react';

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const loadAssets = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/assets/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'all' })
      });
      
      const data = await response.json();
      setAssets(data.assets);
      setCategories(data.categories);
    } catch (error) {
      console.error('Assets error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Asset Management</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Total Assets</h3>
          <div className="text-2xl font-bold text-blue-600">
            {assets.length}
          </div>
          <div className="text-sm text-gray-600">All categories</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Deployed</h3>
          <div className="text-2xl font-bold text-green-600">
            {assets.filter(a => a.status === 'deployed').length}
          </div>
          <div className="text-sm text-gray-600">Currently active</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Available</h3>
          <div className="text-2xl font-bold text-purple-600">
            {assets.filter(a => a.status === 'available').length}
          </div>
          <div className="text-sm text-gray-600">Ready for deployment</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-2">Maintenance</h3>
          <div className="text-2xl font-bold text-orange-600">
            {assets.filter(a => a.status === 'maintenance').length}
          </div>
          <div className="text-sm text-gray-600">Under repair</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Asset Categories</h2>
            
            {categories && (
              <div className="space-y-3">
                <div className="p-3 border border-gray-200 rounded-md">
                  <div className="flex justify-between">
                    <span>Human Assets</span>
                    <span className="text-blue-600 font-medium">{categories.human}</span>
                  </div>
                </div>
                
                <div className="p-3 border border-gray-200 rounded-md">
                  <div className="flex justify-between">
                    <span>Technical Assets</span>
                    <span className="text-blue-600 font-medium">{categories.technical}</span>
                  </div>
                </div>
                
                <div className="p-3 border border-gray-200 rounded-md">
                  <div className="flex justify-between">
                    <span>Facilities</span>
                    <span className="text-blue-600 font-medium">{categories.facilities}</span>
                  </div>
                </div>
                
                <div className="p-3 border border-gray-200 rounded-md">
                  <div className="flex justify-between">
                    <span>Transportation</span>
                    <span className="text-blue-600 font-medium">{categories.transportation}</span>
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={loadAssets}
              disabled={loading}
              className="w-full mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? 'Loading...' : 'Load Assets'}
            </button>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Asset Inventory</h2>
            <div className="space-y-4">
              {assets.map((asset, index) => (
                <div key={index} className="border-b border-gray-200 pb-4">
                  <div className="flex justify-between">
                    <div className="font-medium">{asset.name}</div>
                    <div className="text-sm text-gray-500">
                      {asset.status} • {asset.location}
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">{asset.description}</div>
                  <div className="mt-2 flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      asset.status === 'deployed' ? 'bg-green-100 text-green-800' :
                      asset.status === 'available' ? 'bg-blue-100 text-blue-800' :
                      asset.status === 'maintenance' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {asset.status.toUpperCase()}
                    </span>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      {asset.type}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      ID: {asset.id}
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