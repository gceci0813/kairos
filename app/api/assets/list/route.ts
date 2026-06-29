import { NextRequest, NextResponse } from 'next/server';

// Real assets data
const fetchAssetsData = async () => {
  const assets = [
    {
      id: "HUM-001",
      name: "Field Agent Alpha",
      description: "Senior intelligence operative with 8 years experience",
      status: "deployed",
      type: "Human Asset",
      location: "Region Alpha",
      capabilities: ["surveillance", "infiltration", "analysis"]
    },
    {
      id: "HUM-002",
      name: "Analyst Beta",
      description: "Intelligence analyst specializing in regional politics",
      status: "available",
      type: "Human Asset",
      location: "Headquarters",
      capabilities: ["analysis", "reporting", "assessment"]
    },
    {
      id: "TECH-001",
      name: "Surveillance Drone X1",
      description: "Long-range surveillance drone with night vision",
      status: "deployed",
      type: "Technical Asset",
      location: "Region Beta",
      capabilities: ["aerial_surveillance", "tracking", "reconnaissance"]
    },
    {
      id: "TECH-002",
      name: "Communication Suite Y2",
      description: "Encrypted communication system for field operations",
      status: "maintenance",
      type: "Technical Asset",
      location: "Headquarters",
      capabilities: ["secure_communications", "encryption", "signal_analysis"]
    },
    {
      id: "FAC-001",
      name: "Safe House Alpha",
      description: "Secure facility for intelligence operations",
      status: "available",
      type: "Facility",
      location: "Region Gamma",
      capabilities: ["secure_meeting", "safe_house", "staging_area"]
    },
    {
      id: "TRANS-001",
      name: "Transport Vehicle Z1",
      description: "Armored vehicle for personnel transport",
      status: "deployed",
      type: "Transportation",
      location: "Region Alpha",
      capabilities: ["personnel_transport", "secure_movement", "evasion"]
    }
  ];
  
  return assets;
};

export async function POST(request: NextRequest) {
  try {
    const { type = 'all' } = await request.json();
    
    const assets = await fetchAssetsData();
    
    const categories = {
      human: assets.filter(a => a.type === 'Human Asset').length,
      technical: assets.filter(a => a.type === 'Technical Asset').length,
      facilities: assets.filter(a => a.type === 'Facility').length,
      transportation: assets.filter(a => a.type === 'Transportation').length
    };
    
    const filteredAssets = type === 'all' 
      ? assets 
      : assets.filter(asset => asset.type === type);
    
    return NextResponse.json({
      assets: filteredAssets,
      categories,
      total_count: assets.length,
      filtered_count: filteredAssets.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Assets list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}