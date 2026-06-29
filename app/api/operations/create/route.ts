import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { type, priority, title } = await request.json();
    
    // Create new operation
    const newOperation = {
      id: `OP-${Date.now()}`,
      title: title || "New Intelligence Operation",
      description: "Operation created through command interface",
      status: "planning",
      priority: priority || "medium",
      type: type || "Intelligence",
      location: "TBD",
      start_date: new Date().toISOString().split('T')[0],
      personnel: 0,
      estimated_completion: "TBD"
    };
    
    return NextResponse.json({
      operation: newOperation,
      message: "Operation created successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create operation error:', error);
    return NextResponse.json(
      { error: 'Failed to create operation' },
      { status: 500 }
    );
  }
}