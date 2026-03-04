'use client';
import { useState, useRef, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ActivityEntry {
  module:     'oracle' | 'sentinel' | 'actor';
  action:     string;
  created_at: string;
}

interface ReportResult {
  subject_user_id: string;
  purpose:         string;
  generated_at:    number;
  analysis?:       string;
  analysis_error?: string;
  image_quality?:  string;
  image_quality_error?: string;
  recent_activity: ActivityEntry[];
}

// ── Constants ──────────────────────────────────────────────────────────────────

const MODULE_BADGE: Record<string, string> = {
  oracle:   'bg-purple-50 text-purple-700 border-purple-200',
  sentinel: 'bg-blue-50 text-blue-700 border-blue-200',
  actor:    'bg-amber-50 text-amber-700 border-amber-200',
};

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/gif,image/webp';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function fmtTs(unix: number) {
  return new Date(unix * 1000).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

/** Minimal inline markdown renderer — matches Oracle page pattern */
function MarkdownOutput({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-2 text-sm text-[#1E293B] leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return (
          <h3 key={i} className="text-base font-bold text-[#0F172A] mt-4 mb-1">
            {line.slice(4)}
          </h3>
        );
        if (line.startsWith('## ')) return (
          <h2 key={i} className="text-lg font-bold text-[#0F172A] mt-5 mb-2 border-b border-[#E2E8F0] pb-1">
            {line.slice(3)}
          </h2>
        );
        if (line.startsWith('- ') || line.startsWith('* ')) return (
          <p key={i} className="flex gap-2">
            <span className="text-[#2563EB] mt-1 shrink-0">•</span>
            <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
          </p>
        );
        if (line.trim() === '') return <div key={i} className="h-1" />;
        return (
          <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
        );
      })}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [step, setStep]       = useState<'input' | 'result'>('input');
  const [text, setText]       = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [result, setResult]   = useState<ReportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File | undefined) => {
    setImageError('');
    if (!file) { setImageFile(null); setImagePreview(null); return; }
    if (!file.type.startsWith('image/')) {
      setImageError('Please upload an image file (JPEG, PNG, GIF, WebP).');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('Image must be under 5 MB.');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = e => setImagePreview(e.target?.result as string ?? null);
    reader.readAsDataURL(file);
  }, []);

  async function handleSubmit() {
    if (!text.trim() && !imageFile) {
      setError('Add some text or an image to analyze.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Build payload — convert image to base64 if present
      let image_base64: string | undefined;
      let image_media_type: string | undefined;

      if (imageFile) {
        const arrayBuffer = await imageFile.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        bytes.forEach(b => { binary += String.fromCharCode(b); });
        image_base64      = btoa(binary);
        image_media_type  = imageFile.type;
      }

      const res = await fetch('/api/user/report', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text: text.trim() || undefined, image_base64, image_media_type }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? `Server error ${res.status}`);
      }

      const data: ReportResult = await res.json();
      setResult(data);
      setStep('result');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep('input');
    setText('');
    setImageFile(null);
    setImagePreview(null);
    setImageError('');
    setError('');
    setResult(null);
  }

  // ── Input UI ────────────────────────────────────────────────────────────────

  if (step === 'input') return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-[#94A3B8] mb-1">
          Profile · Self-Service
        </p>
        <h1 className="text-3xl font-display font-800 text-[#0F172A] tracking-tight">
          My Account Report
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Analyze your own content and review your recent platform activity.
          All data is scoped to your account only.
        </p>
      </div>

      {/* Text input */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3">
          Text Analysis <span className="text-[#94A3B8] font-normal">(optional)</span>
        </h2>
        <p className="text-xs text-[#64748B]">
          Paste notes, summaries, or any text you want Claude to analyze for key themes and action items.
        </p>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste your text here — meeting notes, intelligence summaries, draft reports..."
          rows={8}
          className="w-full bg-[#F8FAFC] border border-[#D1D5DB] rounded-lg px-4 py-3 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition resize-none placeholder:text-[#9CA3AF]"
        />
        <p className="text-xs text-[#94A3B8] text-right">{text.length} chars</p>
      </div>

      {/* Image upload */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3">
          Image Quality Check <span className="text-[#94A3B8] font-normal">(optional)</span>
        </h2>
        <p className="text-xs text-[#64748B]">
          Upload an image to check technical quality: sharpness, lighting, and number of faces present.
          No identification — quality metrics only.
        </p>

        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={e => handleFile(e.target.files?.[0])}
        />

        {imagePreview ? (
          <div className="space-y-3">
            <div className="relative rounded-lg overflow-hidden border border-[#E2E8F0] max-h-48 flex items-center justify-center bg-[#F8FAFC]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Preview" className="max-h-48 object-contain" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#64748B] flex-1 truncate">{imageFile?.name}</span>
              <button
                onClick={() => { setImageFile(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-[#D1D5DB] rounded-lg p-8 text-center hover:border-[#2563EB] hover:bg-[#EFF6FF] transition-colors group"
          >
            <div className="text-2xl mb-2">🖼️</div>
            <p className="text-sm font-semibold text-[#64748B] group-hover:text-[#2563EB] transition-colors">
              Click to upload image
            </p>
            <p className="text-xs text-[#94A3B8] mt-1">JPEG, PNG, GIF, WebP — max 5 MB</p>
          </button>
        )}

        {imageError && (
          <p className="text-xs text-red-600 font-semibold">{imageError}</p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 font-semibold">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || (!text.trim() && !imageFile)}
        className="bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg px-8 py-3 transition-colors shadow-sm flex items-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Generating report…
          </>
        ) : (
          'Generate Report'
        )}
      </button>
    </div>
  );

  // ── Result UI ───────────────────────────────────────────────────────────────

  if (!result) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-[#94A3B8] mb-1">
            Profile · Report Generated
          </p>
          <h1 className="text-3xl font-display font-800 text-[#0F172A] tracking-tight">
            Account Report
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1 font-mono">
            {fmtTs(result.generated_at)} · User {result.subject_user_id.slice(0, 8)}…
          </p>
        </div>
        <button
          onClick={reset}
          className="text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors flex items-center gap-1"
        >
          ← New Report
        </button>
      </div>

      {/* Text analysis */}
      {(result.analysis || result.analysis_error) && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
          <h2 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
            Text Analysis
          </h2>
          {result.analysis_error ? (
            <p className="text-sm text-red-600">{result.analysis_error}</p>
          ) : (
            <MarkdownOutput text={result.analysis!} />
          )}
        </div>
      )}

      {/* Image quality */}
      {(result.image_quality || result.image_quality_error) && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
          <h2 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            Image Quality Report
          </h2>
          {result.image_quality_error ? (
            <p className="text-sm text-red-600">{result.image_quality_error}</p>
          ) : (
            <div className="bg-[#F8FAFC] rounded-lg p-4">
              <p className="text-sm text-[#1E293B] whitespace-pre-wrap leading-relaxed">
                {result.image_quality}
              </p>
              <p className="text-xs text-[#94A3B8] mt-3 border-t border-[#E2E8F0] pt-2">
                Quality assessment only — no identity information included.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Recent activity */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
        <h2 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          My Recent Activity
          <span className="ml-auto text-xs font-normal text-[#94A3B8]">Last 10 queries</span>
        </h2>

        {result.recent_activity.length === 0 ? (
          <p className="text-sm text-[#94A3B8] text-center py-6">
            No activity yet. Run a query in ORACLE, SENTINEL, or ACTOR to generate entries.
          </p>
        ) : (
          <div className="space-y-2">
            {result.recent_activity.map((entry, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2.5 border-b border-[#F8FAFC] last:border-0"
              >
                <span className={`text-xs font-bold tracking-wide px-2.5 py-1 rounded-full border shrink-0 ${MODULE_BADGE[entry.module] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                  {entry.module.toUpperCase()}
                </span>
                <span className="text-xs text-[#64748B] uppercase font-semibold tracking-wide shrink-0">
                  {entry.action}
                </span>
                <span className="text-xs font-mono text-[#94A3B8] ml-auto">
                  {fmtDate(entry.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
