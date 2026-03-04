import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@/lib/anthropic';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { name, type, region, context } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

    const prompt = `You are an expert OSINT (Open Source Intelligence) analyst producing a structured intelligence profile using only publicly available information — news reporting, government records, academic research, public statements, court documents, UN reports, and open-source databases.

Generate a comprehensive OSINT dossier on the following subject using ONLY publicly known information:

Subject: ${name}
Type: ${type || 'Unknown'} (Individual / Group / Organization / State Actor)
Region: ${region || 'Global'}
${context ? `Additional context: ${context}` : ''}

Produce a structured intelligence profile with the following sections:

## SUBJECT OVERVIEW
Brief identification summary — who/what this is, current status, primary domain of activity.

## BACKGROUND & HISTORY
Known origins, founding/birth details (if public), historical trajectory, major milestones. Public record only.

## ORGANIZATIONAL STRUCTURE & AFFILIATIONS
Known leadership hierarchy, organizational structure, affiliations with governments, NGOs, criminal networks, terrorist organizations, or state sponsors. Cite type of source (e.g. UN sanctions list, court records, news reporting).

## KNOWN ASSOCIATES & NETWORK
Key publicly identified associates, lieutenants, financiers, or enabling entities. Map the known relationship network.

## GEOGRAPHIC FOOTPRINT
Known areas of operation, bases, safe havens, influence zones. Based on reporting and public record.

## CAPABILITIES ASSESSMENT
Military / financial / informational / cyber / political capabilities as documented in open sources. For groups: weapons systems, estimated manpower, funding sources.

## THREAT ASSESSMENT
### Overall Threat Level
Rate: CRITICAL / HIGH / ELEVATED / MODERATE / LOW
Justify the rating based on documented activities.

### Threat Vectors
- Primary threat categories (terrorism, espionage, cybercrime, political subversion, sanctions evasion, etc.)
- Known or reported tactics, techniques, and procedures (TTPs)

### PMESII Threat Breakdown
Political: [score 0-100] — [justification]
Military: [score 0-100] — [justification]
Economic: [score 0-100] — [justification]
Social: [score 0-100] — [justification]
Information: [score 0-100] — [justification]
Infrastructure: [score 0-100] — [justification]

## BEHAVIORAL ANALYSIS
Decision-making patterns, known psychological profile elements (from public reporting/academic analysis), historical behavior under pressure, escalation triggers, negotiating posture.

## KEY INDICATORS TO MONITOR
Specific observable indicators that would signal escalation, movement, or change in status. What to watch in open sources.

## STRATEGIC APPROACH RECOMMENDATIONS
Based on open-source analysis: recommended engagement strategy, pressure points, deterrence options, diplomatic levers.

## CONFIDENCE & SOURCE QUALITY
Overall confidence: HIGH / MEDIUM / LOW
Note any significant gaps in the public record and what would improve assessment fidelity.

Maintain analytical objectivity. Flag speculation clearly. All analysis based on publicly documented information only.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const profile = response.content[0].type === 'text' ? response.content[0].text : '';
    return NextResponse.json({ profile });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
