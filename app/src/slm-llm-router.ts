import { anthropic } from '@/lib/anthropic';
import { isOllamaConfigured } from './nlp-ollama';

// Routes content between the SLM tier (fast/cheap bulk classification — the
// Ollama pipeline) and the LLM tier (deep analysis — Claude). The decision is
// based on complexity and cost: short, low-signal items go to the SLM; long or
// high-signal items (already-flagged coordination, high engagement) warrant
// the more expensive deep pass.

export type Tier = 'slm' | 'llm';

export interface RouteDecision {
  tier: Tier;
  reasons: string[];
  complexityScore: number; // 0-1
}

export interface RouteInput {
  content: string;
  coordinationFlagged?: boolean;
  engagement?: number; // likes/shares/etc if known
}

// Tunable thresholds (cost optimization knobs).
export const ROUTER_THRESHOLDS = {
  longContentChars: 800,
  llmComplexity: 0.6,
  highEngagement: 1000,
};

export function routeContent(input: RouteInput): RouteDecision {
  const reasons: string[] = [];
  let complexity = 0;

  const len = input.content.length;
  if (len >= ROUTER_THRESHOLDS.longContentChars) {
    complexity += 0.4;
    reasons.push(`Long content (${len} chars)`);
  } else {
    complexity += Math.min(0.4, len / ROUTER_THRESHOLDS.longContentChars * 0.4);
  }

  if (input.coordinationFlagged) {
    complexity += 0.4;
    reasons.push('Coordination signal present');
  }

  if ((input.engagement ?? 0) >= ROUTER_THRESHOLDS.highEngagement) {
    complexity += 0.3;
    reasons.push(`High engagement (${input.engagement})`);
  }

  // Heuristic linguistic complexity: many distinct long tokens / questions.
  const longTokens = input.content.split(/\s+/).filter((w) => w.length > 9).length;
  if (longTokens > 12) {
    complexity += 0.2;
    reasons.push('High lexical complexity');
  }

  complexity = Math.min(1, complexity);
  const tier: Tier = complexity >= ROUTER_THRESHOLDS.llmComplexity ? 'llm' : 'slm';
  if (tier === 'slm') reasons.push('Below LLM complexity threshold — routed to fast SLM tier');
  return { tier, reasons, complexityScore: complexity };
}

export interface DeepAnalysis {
  narrativeFraming: string;
  influenceOpSignals: string[];
  narrativeThreatLevel: 'low' | 'medium' | 'high' | 'critical';
  forecastingSignals: string[];
}

// LLM-tier deep analysis. Operates on the NARRATIVE/content level — framing,
// coordinated-influence indicators, and forecast-relevant signals. It does not
// profile or score individuals.
export async function deepAnalyze(content: string): Promise<DeepAnalysis | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const tool = {
    name: 'record_deep_analysis',
    description: 'Record narrative-level analysis of a piece of public content for political/OSINT research.',
    input_schema: {
      type: 'object' as const,
      properties: {
        narrativeFraming: { type: 'string', description: 'How the content frames its subject (1-2 sentences)' },
        influenceOpSignals: { type: 'array', items: { type: 'string' }, description: 'Indicators of coordinated/inauthentic amplification, if any' },
        narrativeThreatLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'Threat level of the NARRATIVE (e.g. incitement, disinformation), not of any person' },
        forecastingSignals: { type: 'array', items: { type: 'string' }, description: 'Signals relevant to forecasting political/electoral trends' },
      },
      required: ['narrativeFraming', 'influenceOpSignals', 'narrativeThreatLevel', 'forecastingSignals'],
    },
  };

  try {
    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      tools: [tool],
      tool_choice: { type: 'tool', name: 'record_deep_analysis' },
      messages: [
        {
          role: 'user',
          content:
            'Analyze this public content at the NARRATIVE level for political-research purposes. ' +
            'Assess framing, any coordinated-influence indicators, the threat level of the narrative itself ' +
            '(incitement/disinformation — not of any individual), and forecasting-relevant signals. ' +
            'Do not profile, locate, or score individuals.\n\n' +
            content.slice(0, 5000),
        },
      ],
    });
    const block = res.content.find((b) => b.type === 'tool_use');
    if (block && block.type === 'tool_use') return block.input as DeepAnalysis;
    return null;
  } catch (error) {
    console.error('deepAnalyze failed:', error);
    return null;
  }
}

export function routerCapabilities() {
  return {
    slmTier: isOllamaConfigured() ? 'ollama' : 'anthropic-haiku-fallback',
    llmTier: 'claude-sonnet',
    thresholds: ROUTER_THRESHOLDS,
  };
}
