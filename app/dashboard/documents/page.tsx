'use client';
import { useState, useRef, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface DocumentEntities {
  persons:       string[];
  organizations: string[];
  locations:     string[];
  other:         string[];
}

interface AnalysisResult {
  extracted_text:        string;
  document_type:         string;
  language:              string;
  date_references:       string[];
  entities:              DocumentEntities;
  classification_markers:string;
  intelligence_summary:  string;
  confidence:            'HIGH' | 'MEDIUM' | 'LOW';
}

interface RawResult {
  raw:        string;
  parseError: true;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const CONFIDENCE_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  HIGH:   { color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  MEDIUM: { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  LOW:    { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
};

function EntityGroup({ label, items, color }: { label: string; items: string[]; color: string }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="text-[0.65rem] font-bold tracking-widest uppercase text-[#94A3B8] mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span
            key={i}
            className="text-xs px-2 py-0.5 rounded-full border font-medium"
            style={{ color, background: color + '10', borderColor: color + '40' }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function UploadZone({
  onFile,
  dragging,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  onFile: (f: File) => void;
  dragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`w-full border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
        dragging
          ? 'border-[#2563EB] bg-[#EFF6FF]'
          : 'border-[#D1D5DB] bg-[#F8FAFC] hover:border-[#2563EB] hover:bg-[#EFF6FF]/40'
      }`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`w-10 h-10 ${dragging ? 'text-[#2563EB]' : 'text-[#94A3B8]'}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
      <div className="text-center">
        <p className={`text-sm font-semibold ${dragging ? 'text-[#2563EB]' : 'text-[#475569]'}`}>
          {dragging ? 'Drop to analyze' : 'Drop document image here'}
        </p>
        <p className="text-xs text-[#94A3B8] mt-0.5">or click to browse — PNG, JPG, WEBP, GIF</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={e => e.target.files?.[0] && onFile(e.target.files[0])}
      />
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [dragging, setDragging]         = useState(false);
  const [preview, setPreview]           = useState<string | null>(null);
  const [filename, setFilename]         = useState('');
  const [loading, setLoading]           = useState(false);
  const [result, setResult]             = useState<AnalysisResult | null>(null);
  const [rawResult, setRawResult]       = useState<string | null>(null);
  const [error, setError]               = useState('');
  const [unconfigured, setUnconfigured] = useState(false);
  const [step, setStep]                 = useState<'upload' | 'result'>('upload');

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, WEBP, GIF).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10 MB.');
      return;
    }
    setError('');
    setFilename(file.name);

    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }
  function handleDragLeave() { setDragging(false); }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  async function runAnalysis() {
    if (!preview) return;
    setLoading(true);
    setError('');
    setUnconfigured(false);
    setResult(null);
    setRawResult(null);

    try {
      // Extract base64 data and media type from the data URL
      const [meta, data] = preview.split(',');
      const mediaType    = meta.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg';

      const res  = await fetch('/api/documents/analyze', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ image: data, mediaType, filename }),
      });
      const json = await res.json();

      if (json.unconfigured) {
        setUnconfigured(true);
      } else if (json.error) {
        setError(json.error);
      } else if (json.parseError) {
        setRawResult(json.raw);
        setStep('result');
      } else {
        setResult(json.result as AnalysisResult);
        setStep('result');
      }
    } catch {
      setError('Request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPreview(null);
    setFilename('');
    setResult(null);
    setRawResult(null);
    setError('');
    setUnconfigured(false);
    setStep('upload');
  }

  const conf     = result?.confidence ? CONFIDENCE_STYLE[result.confidence] ?? CONFIDENCE_STYLE.MEDIUM : null;
  const inputCls = 'text-xs font-semibold text-[#0F172A]';

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-[#94A3B8] mb-1">
          DOCUMENTS &middot; Intelligence Extraction
        </p>
        <h1 className="text-3xl font-display font-800 text-[#0F172A] tracking-tight">
          Document Intelligence
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Upload a document image for AI-powered text extraction, entity recognition, and intelligence analysis.
        </p>
      </div>

      {/* ── Capability badges ── */}
      <div className="flex flex-wrap gap-2">
        {['OCR Text Extraction', 'Entity Recognition', 'Multi-language', 'Classification Detection', 'Intelligence Summary'].map(cap => (
          <span key={cap} className="text-[0.65rem] font-bold px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
            {cap}
          </span>
        ))}
      </div>

      {step === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Left: upload zone + preview */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 space-y-4">
              <h2 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3">
                Upload Document
              </h2>

              {!preview ? (
                <UploadZone
                  onFile={processFile}
                  dragging={dragging}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                />
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-lg overflow-hidden border border-[#E2E8F0] bg-[#F8FAFC]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt="Document preview"
                      className="w-full max-h-64 object-contain"
                    />
                    <button
                      onClick={reset}
                      className="absolute top-2 right-2 bg-white border border-[#E2E8F0] rounded-full p-1 shadow-sm hover:border-[#DC2626] hover:text-[#DC2626] transition-colors">
                      <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-[#64748B] truncate">
                    <span className="font-semibold text-[#475569]">File:</span> {filename}
                  </p>
                </div>
              )}

              {unconfigured && (
                <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-lg p-3 space-y-1.5">
                  <p className="text-xs font-bold text-[#D97706]">ANTHROPIC_API_KEY not configured</p>
                  <p className="text-xs text-[#92400E]">
                    Add <code className="bg-white px-1 py-0.5 rounded font-mono border border-[#FDE68A]">ANTHROPIC_API_KEY=your_key</code> to{' '}
                    <code className="bg-white px-1 py-0.5 rounded font-mono border border-[#FDE68A]">.env.local</code> and restart the server.
                  </p>
                </div>
              )}

              {error && (
                <p className="text-xs text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                onClick={runAnalysis}
                disabled={!preview || loading}
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg py-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing Document...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0-6a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clipRule="evenodd" />
                    </svg>
                    Run Intelligence Extraction
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: how it works */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 space-y-4 h-fit">
            <h2 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3">
              Extraction Pipeline
            </h2>
            <div className="space-y-3">
              {[
                { step: '01', label: 'Client-side Preview',   desc: 'Instant local image rendering and validation — no upload until you run analysis.', color: '#2563EB' },
                { step: '02', label: 'Vision Analysis',        desc: 'Document image is processed by Claude Sonnet 4.6 with multi-modal understanding.', color: '#7C3AED' },
                { step: '03', label: 'Text Extraction (OCR)',  desc: 'Full verbatim text recovered from the document regardless of layout complexity.', color: '#0891B2' },
                { step: '04', label: 'Entity Recognition',     desc: 'Named persons, organizations, locations, and designations are extracted and classified.', color: '#D97706' },
                { step: '05', label: 'Intelligence Summary',   desc: 'Analytical summary of the document\'s intelligence value, context, and key findings.', color: '#16A34A' },
              ].map(({ step, label, desc, color }) => (
                <div key={step} className="flex gap-3">
                  <span
                    className="text-[0.6rem] font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ color, background: color + '15' }}>
                    {step}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-[#0F172A]">{label}</p>
                    <p className="text-xs text-[#64748B] mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 'result' && (
        <div className="space-y-4">

          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <button
              onClick={reset}
              className="text-sm font-semibold border border-[#E2E8F0] text-[#475569] px-4 py-2 rounded-lg hover:border-[#2563EB] hover:text-[#2563EB] transition-colors flex items-center gap-2">
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M14 8a.75.75 0 01-.75.75H4.56l3.22 3.22a.75.75 0 11-1.06 1.06l-4.5-4.5a.75.75 0 010-1.06l4.5-4.5a.75.75 0 011.06 1.06L4.56 7.25h8.69A.75.75 0 0114 8z" clipRule="evenodd" />
              </svg>
              New Analysis
            </button>
            {result && conf && (
              <span
                className="text-xs font-bold px-3 py-1.5 rounded-lg border"
                style={{ color: conf.color, background: conf.bg, borderColor: conf.border }}>
                {result.confidence} CONFIDENCE
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Left column */}
            <div className="space-y-4">

              {/* Image preview */}
              {preview && (
                <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Analyzed document" className="w-full max-h-56 object-contain bg-[#F8FAFC]" />
                  <div className="px-4 py-2 border-t border-[#E2E8F0]">
                    <p className="text-xs text-[#64748B] truncate"><span className="font-semibold text-[#475569]">File:</span> {filename}</p>
                  </div>
                </div>
              )}

              {/* Document metadata */}
              {result && (
                <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4 space-y-3">
                  <h3 className="text-xs font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-2 mb-3">Document Metadata</h3>
                  {[
                    { label: 'Type',            value: result.document_type         },
                    { label: 'Language',         value: result.language              },
                    { label: 'Classification',   value: result.classification_markers || 'None detected' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-start justify-between gap-3">
                      <span className="text-[0.65rem] font-bold tracking-wide uppercase text-[#94A3B8] flex-shrink-0">{label}</span>
                      <span className={inputCls + ' text-right'}>{value}</span>
                    </div>
                  ))}
                  {result.date_references && result.date_references.length > 0 && (
                    <div>
                      <span className="text-[0.65rem] font-bold tracking-wide uppercase text-[#94A3B8]">Dates Found</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.date_references.map((d, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">{d}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Entities */}
              {result?.entities && (
                <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4 space-y-3">
                  <h3 className="text-xs font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-2 mb-3">Extracted Entities</h3>
                  <EntityGroup label="Persons"       items={result.entities.persons}       color="#7C3AED" />
                  <EntityGroup label="Organizations" items={result.entities.organizations} color="#2563EB" />
                  <EntityGroup label="Locations"     items={result.entities.locations}     color="#0891B2" />
                  <EntityGroup label="Other"         items={result.entities.other}         color="#D97706" />
                  {Object.values(result.entities).every(v => v.length === 0) && (
                    <p className="text-xs text-[#94A3B8]">No named entities detected.</p>
                  )}
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-4">

              {/* Intelligence summary */}
              {result?.intelligence_summary && (
                <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4">
                  <h3 className="text-xs font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-2 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2563EB] inline-block" />
                    Intelligence Summary
                  </h3>
                  <p className="text-sm text-[#475569] leading-relaxed">{result.intelligence_summary}</p>
                </div>
              )}

              {/* Extracted text */}
              {result?.extracted_text && (
                <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4">
                  <h3 className="text-xs font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-2 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#64748B] inline-block" />
                    Extracted Text
                  </h3>
                  <pre className="text-xs text-[#475569] whitespace-pre-wrap font-mono leading-relaxed max-h-80 overflow-y-auto">
                    {result.extracted_text}
                  </pre>
                </div>
              )}

              {/* Raw fallback */}
              {rawResult && (
                <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4">
                  <h3 className="text-xs font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-2 mb-3">
                    Analysis Output
                  </h3>
                  <pre className="text-xs text-[#475569] whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                    {rawResult}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
