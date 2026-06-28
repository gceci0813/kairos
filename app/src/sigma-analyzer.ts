import { StandardizedData } from './base-connector';
import { detectCoordination } from './coordination-detector';
import { analyzeText } from './nlp-pipeline';
import { RecommendedAction, SigmaFinding } from './sigma-types';

function buildReasoningChain(item: StandardizedData, nlp: Awaited<ReturnType<typeof analyzeText>>, coordination: ReturnType<typeof detectCoordination>): string[] {
  const chain: string[] = [];
  chain.push(`Source: ${item.source}, author: ${item.author}`);
  chain.push(`Detected language: ${nlp.language}`);
  chain.push(`Sentiment: ${nlp.sentiment} (score ${nlp.sentimentScore.toFixed(2)})`);
  if (nlp.entities.length > 0) {
    chain.push(`Entities found: ${nlp.entities.map((e) => `${e.text} (${e.type})`).join(', ')}`);
  }
  if (nlp.topics.length > 0) {
    chain.push(`Topics: ${nlp.topics.join(', ')}`);
  }
  if (coordination.reasons.length > 0) {
    chain.push(...coordination.reasons);
  }
  return chain;
}

function recommendAction(coordinationScore: number, sentimentScore: number): RecommendedAction {
  if (coordinationScore >= 0.6) return 'escalate';
  if (coordinationScore >= 0.4) return 'flag_for_review';
  if (Math.abs(sentimentScore) >= 0.7) return 'monitor';
  return 'no_action';
}

function buildFindingSummary(item: StandardizedData, nlp: Awaited<ReturnType<typeof analyzeText>>, coordination: ReturnType<typeof detectCoordination>): string {
  if (coordination.isFlagged) {
    return `Potential coordinated activity detected around content from ${item.author} on ${item.source}`;
  }
  if (nlp.topics.length > 0) {
    return `${item.source} content discussing ${nlp.topics.slice(0, 3).join(', ')}`;
  }
  return `${item.source} content from ${item.author}`;
}

export async function analyzeBatch(batch: StandardizedData[]): Promise<SigmaFinding[]> {
  const findings: SigmaFinding[] = [];

  for (const item of batch) {
    const nlp = await analyzeText(item.content);
    const coordination = detectCoordination(item, batch);

    const confidence = coordination.isFlagged
      ? Math.max(0.5, coordination.score)
      : 0.5 + Math.abs(nlp.sentimentScore) * 0.2;

    findings.push({
      finding: buildFindingSummary(item, nlp, coordination),
      confidence_score: Math.min(1, confidence),
      reasoning_chain: buildReasoningChain(item, nlp, coordination),
      source_citations: [
        {
          source: item.source,
          url: item.metadata?.url,
          author: item.author,
          timestamp: isNaN(item.timestamp.getTime()) ? new Date().toISOString() : item.timestamp.toISOString(),
        },
      ],
      recommended_action: recommendAction(coordination.score, nlp.sentimentScore),
      nlp,
      coordination,
      raw: item,
    });
  }

  return findings;
}
