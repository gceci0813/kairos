import Anthropic from '@anthropic-ai/sdk';
import { franc } from 'franc-min';
import { Entity, Language, NlpAnalysis, Sentiment } from './sigma-types';
import { analyzeWithOllama, isOllamaConfigured } from './nlp-ollama';
import { localAnalyze } from './local-nlp';

const FRANC_TO_LANGUAGE: Record<string, Language> = {
  eng: 'en',
  arb: 'ar',
  rus: 'ru',
  fas: 'fa',
  spa: 'es',
  cmn: 'zh',
};

function detectLanguage(text: string): Language {
  const code = franc(text, { minLength: 10 });
  return FRANC_TO_LANGUAGE[code] ?? 'unknown';
}

interface CloudAnalysisResult {
  sentiment: Sentiment;
  sentimentScore: number;
  entities: Entity[];
  topics: string[];
}

let anthropicClient: Anthropic | null = null;
function getAnthropicClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

const ANALYSIS_TOOL = {
  name: 'record_text_analysis',
  description: 'Record structured sentiment, entity, and topic analysis of a piece of text.',
  input_schema: {
    type: 'object' as const,
    properties: {
      sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral', 'mixed'] },
      sentimentScore: { type: 'number', description: '-1 (very negative) to 1 (very positive)' },
      entities: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            type: { type: 'string', enum: ['person', 'organization', 'location'] },
          },
          required: ['text', 'type'],
        },
      },
      topics: { type: 'array', items: { type: 'string' }, description: 'Short topic tags, max 5' },
    },
    required: ['sentiment', 'sentimentScore', 'entities', 'topics'],
  },
};

async function analyzeWithCloud(text: string): Promise<CloudAnalysisResult | null> {
  const client = getAnthropicClient();
  if (!client) return null;

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      tools: [ANALYSIS_TOOL],
      tool_choice: { type: 'tool', name: 'record_text_analysis' },
      messages: [
        {
          role: 'user',
          content: `Analyze the sentiment, named entities (people, organizations, locations), and topics in this text. Text may be in any language.\n\nText:\n${text.slice(0, 4000)}`,
        },
      ],
    });

    const toolUse = response.content.find((block) => block.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') return null;

    const input = toolUse.input as CloudAnalysisResult;
    return {
      sentiment: input.sentiment,
      sentimentScore: input.sentimentScore,
      entities: input.entities ?? [],
      topics: input.topics ?? [],
    };
  } catch (error) {
    console.error('NLP cloud analysis failed:', error);
    return null;
  }
}

export async function analyzeText(text: string): Promise<NlpAnalysis> {
  const language = detectLanguage(text);

  // Tiering: prefer local Ollama (cheap/private), then the cloud provider
  // (best quality), then the local LLM-free analyzer (zero-cost, lower
  // fidelity) so the corpus keeps growing even with no model / no credits.
  let result: CloudAnalysisResult | null = null;
  if (isOllamaConfigured()) {
    result = await analyzeWithOllama(text);
  }
  if (!result) {
    result = await analyzeWithCloud(text);
  }
  if (!result) {
    result = localAnalyze(text); // never null — real local fallback
  }

  return {
    language,
    sentiment: result.sentiment,
    sentimentScore: result.sentimentScore,
    entities: result.entities,
    topics: result.topics,
  };
}

export async function analyzeTextBatch(texts: string[]): Promise<NlpAnalysis[]> {
  // Sequential to stay within rate limits — callers needing throughput
  // should batch through the queue (see message-queue.ts) rather than
  // fanning out concurrent requests here.
  const results: NlpAnalysis[] = [];
  for (const text of texts) {
    results.push(await analyzeText(text));
  }
  return results;
}
