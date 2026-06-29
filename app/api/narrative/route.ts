import { NextRequest, NextResponse } from 'next/server';

// Mock narrative data
const mockNarratives = [
  {
    theme: "Economic Recovery Narrative",
    summary: "Focus on post-pandemic economic growth and job creation",
    influence: 78,
    sentiment: "positive",
    reach: "2.3M",
    keywords: ["economy", "jobs", "growth", "recovery"],
    sources: ["political_speeches", "news_media", "social_discussion"]
  },
  {
    theme: "National Security Framework",
    summary: "Emphasis on border security and defense capabilities",
    influence: 65,
    sentiment: "neutral",
    reach: "1.8M",
    keywords: ["security", "border", "defense", "military"],
    sources: ["policy_documents", "expert_analysis", "official_statements"]
  },
  {
    theme: "Healthcare Reform Debate",
    summary: "Competing narratives on healthcare system improvements",
    influence: 72,
    sentiment: "mixed",
    reach: "2.1M",
    keywords: ["healthcare", "insurance", "reform", "access"],
    sources: ["legislative_debates", "public_opinion", "media_coverage"]
  }
];

export async function POST(request: NextRequest) {
  try {
    const { source } = await request.json();
    
    // Simulate narrative analysis
    const analysis = {
      dominant: 3,
      emerging: 7,
      velocity: "increasing",
      sentiment_distribution: {
        positive: 45,
        neutral: 35,
        negative: 20
      },
      timeline_trend: "upward",
      key_influencers: 12,
      narrative_density: "high"
    };
    
    return NextResponse.json({
      narratives: mockNarratives,
      analysis,
      source,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Narrative analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze narratives' },
      { status: 500 }
    );
  }
}