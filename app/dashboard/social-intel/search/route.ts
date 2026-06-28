import { NextRequest, NextResponse } from 'next/server';

// Mock social media data with precise locations
const mockSocialData = [
  {
    id: 1,
    author: "PoliticalAnalyst23",
    content: "Trump's rally in Florida drew massive crowds. The energy was incredible!",
    location: "Miami, Florida",
    coordinates: { lat: 25.7617, lng: -80.1918 },
    timestamp: "2025-06-28 14:30:00",
    sentiment: "positive",
    platform: "Twitter/X"
  },
  {
    id: 2,
    author: "ElectionWatcher",
    content: "Biden's policies on healthcare are really resonating with voters in Pennsylvania.",
    location: "Philadelphia, Pennsylvania",
    coordinates: { lat: 39.9526, lng: -75.1652 },
    timestamp: "2025-06-28 15:45:00",
    sentiment: "positive",
    platform: "Twitter/X"
  },
  {
    id: 3,
    author: "NeutralObserver",
    content: "The debate was disappointing. Neither candidate addressed key economic concerns.",
    location: "Detroit, Michigan",
    coordinates: { lat: 42.3314, lng: -83.0458 },
    timestamp: "2025-06-28 16:20:00",
    sentiment: "negative",
    platform: "Twitter/X"
  },
  {
    id: 4,
    author: "SwingVoter2024",
    content: "Still undecided. Trump's tax policies vs Biden's social programs... tough choice.",
    location: "Milwaukee, Wisconsin",
    coordinates: { lat: 43.0389, lng: -87.9065 },
    timestamp: "2025-06-28 17:10:00",
    sentiment: "neutral",
    platform: "Twitter/X"
  },
  {
    id: 5,
    author: "TexanPatriot",
    content: "Biden's border policies are a disaster. We need Trump back in office!",
    location: "Houston, Texas",
    coordinates: { lat: 29.7604, lng: -95.3698 },
    timestamp: "2025-06-28 18:00:00",
    sentiment: "negative",
    platform: "Twitter/X"
  }
];

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    // Filter posts based on query
    const filteredPosts = mockSocialData.filter(post => 
      post.content.toLowerCase().includes(query.toLowerCase()) ||
      post.author.toLowerCase().includes(query.toLowerCase())
    );
    
    // Calculate sentiment
    const sentimentCounts = {
      positive: filteredPosts.filter(p => p.sentiment === 'positive').length,
      neutral: filteredPosts.filter(p => p.sentiment === 'neutral').length,
      negative: filteredPosts.filter(p => p.sentiment === 'negative').length
    };
    
    const total = sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative;
    const sentimentPercentages = {
      positive: total > 0 ? Math.round((sentimentCounts.positive / total) * 100) : 0,
      neutral: total > 0 ? Math.round((sentimentCounts.neutral / total) * 100) : 0,
      negative: total > 0 ? Math.round((sentimentCounts.negative / total) * 100) : 0
    };
    
    // Group by state for electoral predictions
    const stateData: {[key: string]: any} = {};
    filteredPosts.forEach(post => {
      const state = post.location.split(', ')[1];
      if (!stateData[state]) {
        stateData[state] = {
          positive: 0,
          negative: 0,
          neutral: 0,
          total: 0
        };
      }
      stateData[state][post.sentiment]++;
      stateData[state].total++;
    });
    
    // Predict winner for each state
    const statePredictions: {[key: string]: string} = {};
    Object.keys(stateData).forEach(state => {
      const data = stateData[state];
      if (data.positive > data.negative) {
        statePredictions[state] = 'Biden';
      } else if (data.negative > data.positive) {
        statePredictions[state] = 'Trump';
      } else {
        statePredictions[state] = 'Too close to call';
      }
    });
    
    return NextResponse.json({
      posts: filteredPosts,
      sentiment: sentimentPercentages,
      stateData,
      predictions: statePredictions,
      totalPosts: filteredPosts.length
    });
  } catch (error) {
    console.error('Social intel search error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze social media' },
      { status: 500 }
    );
  }
}