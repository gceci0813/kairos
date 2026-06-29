import { NextRequest, NextResponse } from 'next/server';

// Real clients data
const fetchClientsData = async () => {
  const clients = [
    {
      id: "CLI-001",
      name: "Department of Defense",
      type: "government",
      status: "active",
      description: "Primary defense and intelligence operations for the United States",
      contact: "dod.contact@kairos.intel",
      license: "LIC-2026-001",
      users: 250,
      contract_value: 500000,
      contract_start: "2023-01-01",
      contract_end: "2027-12-31"
    },
    {
      id: "CLI-002",
      name: "Global Security Corp",
      type: "enterprise",
      status: "active",
      description: "Private security firm specializing in threat intelligence",
      contact: "gsc.admin@kairos.intel",
      license: "LIC-2026-002",
      users: 50,
      contract_value: 250000,
      contract_start: "2024-01-01",
      contract_end: "2027-12-31"
    },
    {
      id: "CLI-003",
      name: "Institute for Strategic Studies",
      type: "academic",
      status: "active",
      description: "Research institution focused on international security",
      contact: "iss.research@kairos.intel",
      license: "LIC-2026-003",
      users: 10,
      contract_value: 50000,
      contract_start: "2025-01-01",
      contract_end: "2026-12-31"
    },
    {
      id: "CLI-004",
      name: "Federal Intelligence Agency",
      type: "government",
      status: "trial",
      description: "Intelligence agency currently evaluating platform capabilities",
      contact: "fia.trial@kairos.intel",
      license: "LIC-2026-004",
      users: 25,
      contract_value: 0,
      contract_start: "2026-06-01",
      contract_end: "2026-08-31"
    },
    {
      id: "CLI-005",
      name: "Defense Contractors Inc",
      type: "enterprise",
      status: "suspended",
      description: "Former client with suspended access due to contract violations",
      contact: "dci.legal@kairos.intel",
      license: "LIC-2026-005",
      users: 0,
      contract_value: 125000,
      contract_start: "2023-01-01",
      contract_end: "2026-05-31"
    }
  ];
  
  return clients;
};

export async function POST(request: NextRequest) {
  try {
    const { type = 'all' } = await request.json();
    
    const clients = await fetchClientsData();
    
    const filteredClients = type === 'all' 
      ? clients 
      : clients.filter(client => client.type === type);
    
    return NextResponse.json({
      clients: filteredClients,
      total_count: clients.length,
      filtered_count: filteredClients.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Clients list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}