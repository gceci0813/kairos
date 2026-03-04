import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@/lib/anthropic';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { getUserRole, canGenerateAnalysis } from '@/lib/rbac';
import { logAuditEvent } from '@/lib/audit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────
  const { user, skip } = await getAuthenticatedUser();
  if (!skip && !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Role check ───────────────────────────────────────────
  if (!skip && user) {
    const role = await getUserRole(user.id);
    if (!canGenerateAnalysis(role)) {
      return NextResponse.json(
        { error: 'Forbidden: your account is read-only. Contact an administrator.' },
        { status: 403 },
      );
    }
  }

  const { scenario, goal, context, horizon, stakeholders } = await req.json();

  if (!scenario || !stakeholders?.length) {
    return NextResponse.json({ error: 'Scenario and stakeholders are required.' }, { status: 400 });
  }

  // ── Audit log ─────────────────────────────────────────────
  await logAuditEvent({
    user_id:    user?.id,
    user_email: user?.email,
    module:     'oracle',
    action:     'query',
    input_summary: {
      scenario,
      goal:        goal ?? null,
      horizon:     horizon ?? null,
      stakeholder_count: Array.isArray(stakeholders) ? stakeholders.length : 0,
    },
  });

  const stakeholderText = stakeholders.map((s: {
    name: string; role: string; org: string;
    position: number; influence: number; interests: string;
  }) =>
    `- ${s.name} (${s.role}, ${s.org || 'Unknown org'})\n  Position: ${s.position > 0 ? '+' : ''}${s.position}/10 (${s.position > 3 ? 'supportive' : s.position < -3 ? 'opposed' : 'neutral'})\n  Influence: ${s.influence}/100\n  Interests: ${s.interests}`
  ).join('\n');

  const prompt = `You are a geopolitical and strategic decision intelligence analyst. Analyze the following scenario using stakeholder modeling, game theory, and coalition dynamics.

## SCENARIO
Title: ${scenario}
Goal: ${goal || 'Not specified'}
Time Horizon: ${horizon || '3 months'}
Context: ${context || 'No additional context provided.'}

## STAKEHOLDERS
${stakeholderText}

## ANALYSIS REQUIRED

Provide a comprehensive strategic analysis in the following structured format:

### 1. BASELINE OUTCOME FORECAST
- What is the most likely outcome without any strategic intervention?
- Probability estimate (%) with reasoning
- Key drivers of this baseline

### 2. KEY SWING ACTORS
- Which 2-3 stakeholders are most critical to move toward the goal?
- Why are they pivotal (influence, network position, persuadability)?
- Current disposition and gap to target position

### 3. COALITION DYNAMICS
- Who is currently aligned with the goal?
- Who is opposed and why?
- Potential coalition formations or blocking coalitions

### 4. TARGETING STRATEGY — WHO TO APPROACH AND HOW
For each swing actor, provide:
- Specific approach: what arguments/incentives resonate with their interests
- Sequencing: who to engage first and why (order matters)
- Pressure points and vulnerabilities
- What they want and what you can offer

### 5. STRATEGY PORTFOLIO
Provide 4 strategic options ranked by risk/reward:

**CORE (Recommended):** [Primary strategy — highest probability of achieving goal]
**DEFENSIVE:** [Strategy to protect current position if core fails]
**AGGRESSIVE:** [High-risk, high-reward play]
**HEDGING:** [Conservative fallback that secures partial goal]

For each strategy: specific tactics, who does what, expected outcome probability.

### 6. SCENARIO STRESS TESTS
- What could go wrong? (Top 3 risks)
- What would change the calculus? (Key uncertainties)
- What early indicators signal success or failure?

### 7. CONFIDENCE ASSESSMENT
- Overall confidence in achieving goal: LOW / MEDIUM / HIGH
- Why, and what would increase confidence?

Be specific, actionable, and direct. Name names. Say exactly who should do what to whom.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    return NextResponse.json({ analysis: text });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Analysis failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
