import { StandardizedData } from './base-connector';

export type Language = 'en' | 'ar' | 'ru' | 'fa' | 'es' | 'zh' | 'unknown';

export type Sentiment = 'positive' | 'negative' | 'neutral' | 'mixed';

export interface Entity {
  text: string;
  type: 'person' | 'organization' | 'location';
}

export interface NlpAnalysis {
  language: Language;
  sentiment: Sentiment;
  sentimentScore: number; // -1 (very negative) to 1 (very positive)
  entities: Entity[];
  topics: string[];
}

export interface CoordinationSignal {
  isFlagged: boolean;
  reasons: string[];
  score: number; // 0-1, higher = more suspicious
}

export interface SourceCitation {
  source: string;
  url?: string;
  author: string;
  timestamp: string;
}

export type RecommendedAction =
  | 'no_action'
  | 'monitor'
  | 'flag_for_review'
  | 'escalate';

export interface SigmaFinding {
  finding: string;
  confidence_score: number; // 0-1
  reasoning_chain: string[];
  source_citations: SourceCitation[];
  recommended_action: RecommendedAction;
  nlp: NlpAnalysis;
  coordination: CoordinationSignal;
  raw: StandardizedData;
}
