import { NextRequest, NextResponse } from 'next/server';

// Mock recognition results
const mockResults = [
  {
    entity: "Political Organization",
    context: "Active in 12 states with recent campaign activities",
    confidence: 87,
    source: "Social Media",
    type: "Organization",
    category: "Political"
  },
  {
    entity: "Media Network",
    context: "Broadcasting political content with specific bias patterns",
    confidence: 92,
    source: "News Archives",
    type: "Media",
    category: "Information"
  },
  {
    entity: "Government Entity",
    context: "Recent policy changes affecting multiple demographics",
    confidence: 78,
    source: "Government Data",
    type: "Official",
    category: "Administrative"
  }
];

export async function POST(request: NextRequest) {
  try {
    const { query, databases } = await request.json();
    
    // Simulate recognition processing
    const databaseStatus = {
      social_media: 94,
      public_records: 87,
      news_archives: 91,
      government_data: 88
    };
    
    // Filter results based on query
    const filteredResults = query 
      ? mockResults.filter(r => r.entity.toLowerCase().includes(query.toLowerCase()))
      : mockResults;
    
    return NextResponse.json({
      results: filteredResults,
      databases: databaseStatus,
      query,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Recognition search error:', error);
    return NextResponse.json(
      { error: 'Failed to run recognition search' },
      { status: 500 }
    );
  }
}