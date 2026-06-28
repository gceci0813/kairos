import { Entity, Sentiment } from './sigma-types';

export interface AnalysisResult {
  sentiment: Sentiment;
  sentimentScore: number;
  entities: Entity[];
  topics: string[];
}

// Local-model tier. Calls an Ollama-compatible server (the user runs this
// themselves — Vercel serverless can't host it). Activated when
// OLLAMA_BASE_URL is set, e.g. http://your-host:11434. Model defaults to
// mistral but is overridable via OLLAMA_MODEL (phi3, llama3, etc).
//
// Per the hybrid design, Ollama handles the "basic" analysis cheaply/locally;
// the pipeline still falls back to the cloud provider if Ollama is unset or
// errors.

export function isOllamaConfigured(): boolean {
  return !!(process.env.OLLAMA_BASE_URL ?? '').trim();
}

const SYSTEM_PROMPT =
  'You are a text analysis engine. Given a piece of text (any language), respond with ONLY a JSON object ' +
  'matching: {"sentiment":"positive|negative|neutral|mixed","sentimentScore":number(-1..1),' +
  '"entities":[{"text":string,"type":"person|organization|location"}],"topics":[string]}. No prose.';

export async function analyzeWithOllama(text: string): Promise<AnalysisResult | null> {
  const baseUrl = (process.env.OLLAMA_BASE_URL ?? '').replace(/\s/g, '').replace(/\/$/, '');
  if (!baseUrl) return null;
  const model = (process.env.OLLAMA_MODEL ?? 'mistral').trim();

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        format: 'json',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text.slice(0, 4000) },
        ],
      }),
    });

    if (!response.ok) {
      console.error(`Ollama error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    const content = data?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    return {
      sentiment: parsed.sentiment ?? 'neutral',
      sentimentScore: typeof parsed.sentimentScore === 'number' ? parsed.sentimentScore : 0,
      entities: Array.isArray(parsed.entities) ? parsed.entities : [],
      topics: Array.isArray(parsed.topics) ? parsed.topics : [],
    };
  } catch (error) {
    console.error('Ollama analysis failed:', error);
    return null;
  }
}
