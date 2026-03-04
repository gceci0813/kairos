import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@/lib/anthropic';
import { getAuthenticatedUser } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { user, skip } = await getAuthenticatedUser();
  if (!skip && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { query, region, actors, horizon, context } = await req.json();

  if (!query) {
    return NextResponse.json({ error: 'Query is required.' }, { status: 400 });
  }

  const prompt = `You are a geopolitical early warning analyst with deep expertise in PMESII (Political, Military, Economic, Social, Information, Infrastructure) domain analysis. Provide a structured intelligence forecast and risk assessment.

## INTELLIGENCE QUERY
${query}

## PARAMETERS
Region of Focus: ${region || 'Global'}
Key Actors to Monitor: ${actors || 'All relevant actors'}
Forecast Horizon: ${horizon || '30 days'}
Additional Context: ${context || 'None provided'}

## REQUIRED OUTPUT

### SITUATION ASSESSMENT
- Current state: What is happening right now?
- Key dynamics and recent developments
- Critical inflection points

### ACTOR ANALYSIS
For each key actor:
- Current position and motivation
- Recent actions and signals
- Likely next moves
- Influence on the situation

### RISK FORECAST

**7-Day Outlook:**
- Most likely scenario (probability %)
- Key risk events to watch
- Early warning indicators

**30-Day Outlook:**
- Trajectory assessment
- Scenario tree (best case / base case / worst case with probabilities)
- Tipping point conditions

**90-Day Outlook:**
- Strategic direction
- Structural factors at play
- What could fundamentally change the situation

### RISK SCORING
Rate each dimension 0-100 (100 = maximum risk):
- Political Instability: [score] — [brief rationale]
- Conflict/Violence Risk: [score] — [brief rationale]
- Economic Disruption: [score] — [brief rationale]
- Social Unrest: [score] — [brief rationale]
- Information/Influence Operations: [score] — [brief rationale]

**Overall Risk Level:** LOW / MEDIUM / HIGH / CRITICAL
**Trend:** IMPROVING / STABLE / DETERIORATING / ESCALATING

### KEY INDICATORS TO MONITOR
List 5 specific, observable signals that would indicate:
- Situation improving
- Situation deteriorating
- Imminent escalation

### STRATEGIC IMPLICATIONS
- What does this mean for decision makers?
- What actions are recommended?
- What should be avoided?

### CONFIDENCE & LIMITATIONS
- Confidence level: LOW / MEDIUM / HIGH
- Key uncertainties
- Information gaps that would improve this assessment

Be direct, specific, and analytically rigorous. Use precise language. Provide probability estimates where possible.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    return NextResponse.json({ report: text });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Analysis failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
