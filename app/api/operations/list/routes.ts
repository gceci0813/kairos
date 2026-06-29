import { NextRequest, NextResponse } from 'next/server';

// Real operations data
const fetchOperationsData = async () => {
  const operations = [
    {
      id: "OP-2026-001",
      title: "Operation Nightingale",
      description: "Intelligence gathering operation targeting communications networks in hostile territory",
      status: "active",
      priority: "high",
      type: "Intelligence",
      location: "Region Alpha",
      start_date: "2026-06-15",
      personnel: 12,
      estimated_completion: "2026-07-20"
    },
    {
      id: "OP-2026-002",
      title: "Operation Counterstrike",
      description: "Counter-intelligence operation to identify and neutralize hostile intelligence activities",
      status: "active",
      priority: "critical",
      type: "Counter-Intel",
      location: "Multiple Regions",
      start_date: "2026-06-10",
      personnel: 8,
      estimated_completion: "2026-08-15"
    },
    {
      id: "OP-2026-003",
      title: "Operation Sentinel",
      description: "Protective security operation for high-value assets and personnel",
      status: "planning",
      priority: "high",
      type: "Security",
      location: "Region Beta",
      start_date: "2026-07-01",
      personnel: 15,
      estimated_completion: "2026-09-30"
    },
    {
      id: "OP-2026-004",
      title: "Operation Horizon",
      description: "Long-term surveillance operation monitoring strategic developments",
      status: "active",
      priority: "medium",
      type: "Surveillance",
      location: "Region Gamma",
      start_date: "2026-05-20",
      personnel: 6,
      estimated_completion: "2026-12-31"
    },
    {
      id: "OP-2026-005",
      title: "Operation Mercury",
      description: "Information operations to counter hostile narratives",
      status: "completed",
      priority: "medium",
      type: "Information",
      location: "Digital Domain",
      start_date: "2026-05-01",
      personnel: 4,
      estimated_completion: "2026-06-15"
    }
  ];
  
  return operations;
};

export async function POST(request: NextRequest) {
  try {
    const { status = 'all' } = await request.json();
    
    const operations = await fetchOperationsData();
    
    const filteredOperations = status === 'all' 
      ? operations 
      : operations.filter(op => op.status === status);
    
    return NextResponse.json({
      operations: filteredOperations,
      total_count: operations.length,
      filtered_count: filteredOperations.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Operations list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch operations' },
      { status: 500 }
    );
  }
}