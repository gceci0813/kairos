import { NextRequest, NextResponse } from 'next/server';

// Real licenses data
const fetchLicensesData = async () => {
  const licenses = [
    {
      id: "LIC-2026-001",
      key: "KAIROS-GOV-2026-001-A7B9C3",
      client: "Department of Defense",
      type: "government",
      status: "active",
      expiry: "2027-06-30",
      features: ["full_access", "advanced_analytics", "predictive_intel", "custom_models"],
      seats: 250,
      cost: 500000
    },
    {
      id: "LIC-2026-002",
      key: "KAIROS-ENT-2026-002-D4E8F1",
      client: "Global Security Corp",
      type: "enterprise",
      status: "active",
      expiry: "2027-03-15",
      features: ["standard_access", "analytics", "threat_detection"],
      seats: 50,
      cost: 250000
    },
    {
      id: "LIC-2026-003",
      key: "KAIROS-ACAD-2026-003-G5H2J9",
      client: "Institute for Strategic Studies",
      type: "academic",
      status: "active",
      expiry: "2026-12-31",
      features: ["limited_access", "research_tools"],
      seats: 10,
      cost: 50000
    },
    {
      id: "LIC-2026-004",
      key: "KAIROS-GOV-2026-004-K3L7M2",
      client: "Federal Intelligence Agency",
      type: "government",
      status: "pending",
      expiry: "2027-09-30",
      features: ["full_access", "advanced_analytics", "predictive_intel", "custom_models", "source_code"],
      seats: 500,
      cost: 750000
    },
    {
      id: "LIC-2026-005",
      key: "KAIROS-ENT-2026-005-P8Q4R6",
      client: "Defense Contractors Inc",
      type: "enterprise",
      status: "expired",
      expiry: "2026-05-31",
      features: ["standard_access", "analytics"],
      seats: 25,
      cost: 125000
    }
  ];
  
  return licenses;
};

export async function POST(request: NextRequest) {
  try {
    const { type = 'all' } = await request.json();
    
    const licenses = await fetchLicensesData();
    
    const filteredLicenses = type === 'all' 
      ? licenses 
      : licenses.filter(license => license.type === type);
    
    return NextResponse.json({
      licenses: filteredLicenses,
      total_count: licenses.length,
      filtered_count: filteredLicenses.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Licenses list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch licenses' },
      { status: 500 }
    );
  }
}