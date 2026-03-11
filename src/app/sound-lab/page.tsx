'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSoundAIIdeas, useSoundAIThesis, useSoundAICompetitors } from '@/lib/useSupabase';
import { useUser } from '@/lib/UserContext';
import { supabase } from '@/lib/supabase';
import { SoundAIIdea, SoundAICategory, SoundAIRevenueModel, SoundAIStatus, SoundAICompetitor } from '@/lib/types';
import Modal from '@/components/Modal';

// ─── Constants ────────────────────────────────────────────────────

const CATEGORIES: SoundAICategory[] = [
  'Film & TV Scoring', 'Game Audio', 'Commercial/Venue Music', 'Podcast & YouTube',
  'Advertising & Marketing', 'Music Production Tools', 'Sound Effects & Foley',
  'Voice & Vocal', 'Spatial/Immersive Audio', 'Education & Training', 'Other',
];

const REVENUE_MODELS: SoundAIRevenueModel[] = [
  'SaaS Subscription', 'Per-Generation / Usage-Based', 'Marketplace (take rate)',
  'API Licensing', 'Enterprise Contracts', 'Freemium + Upsell', 'Hardware + Software Bundle',
];

const STATUS_OPTIONS: { value: SoundAIStatus; label: string; color: string }[] = [
  { value: 'brainstorm', label: 'Brainstorm', color: 'bg-gray-100 text-gray-600' },
  { value: 'researching', label: 'Researching', color: 'bg-blue-100 text-blue-700' },
  { value: 'validating', label: 'Validating', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'building', label: 'Building', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'killed', label: 'Killed', color: 'bg-red-100 text-red-600' },
];

const SCORE_DIMS = [
  { key: 'tam_score' as const, short: 'TAM', label: 'TAM Score', desc: 'Total addressable market size' },
  { key: 'pain_score' as const, short: 'Pain', label: 'Pain Severity', desc: 'How badly does the customer need this?' },
  { key: 'feasibility_score' as const, short: 'Feas', label: 'Technical Feasibility', desc: 'Can we build V1 in 6 months?' },
  { key: 'moat_score' as const, short: 'Moat', label: 'Competitive Moat', desc: 'How defensible against Suno, ElevenLabs, etc.?' },
  { key: 'team_fit_score' as const, short: 'Team', label: 'Team Fit', desc: 'How well does our team map to this?' },
  { key: 'time_to_revenue_score' as const, short: 'T2Rev', label: 'Time to Revenue', desc: 'How fast to first dollar?' },
  { key: 'passion_score' as const, short: 'Pass', label: 'Passion Score', desc: 'Would we work on this for 10 years?' },
];

type ScoreKey = typeof SCORE_DIMS[number]['key'];

const DEFAULT_WEIGHTS: Record<ScoreKey, number> = {
  tam_score: 0.15,
  pain_score: 0.20,
  feasibility_score: 0.15,
  moat_score: 0.15,
  team_fit_score: 0.10,
  time_to_revenue_score: 0.10,
  passion_score: 0.15,
};

const TABS = [
  { id: 'canvas', label: 'Idea Canvas' },
  { id: 'brainstorm', label: 'AI Brainstorm' },
  { id: 'landscape', label: 'Competitive Landscape' },
  { id: 'thesis', label: 'Our Thesis' },
  { id: 'rankings', label: 'Rankings' },
] as const;

type TabId = typeof TABS[number]['id'];

// ─── Helpers ──────────────────────────────────────────────────────

function computeComposite(idea: SoundAIIdea, weights: Record<ScoreKey, number>): number | null {
  const scores = SCORE_DIMS.map(d => idea[d.key]);
  if (scores.every(s => s == null)) return null;
  let total = 0;
  let weightSum = 0;
  for (const dim of SCORE_DIMS) {
    const val = idea[dim.key];
    if (val != null) {
      total += val * weights[dim.key];
      weightSum += weights[dim.key];
    }
  }
  return weightSum > 0 ? Math.round((total / weightSum) * 100) / 100 : null;
}

function getScoreColor(score: number | null): string {
  if (score == null) return 'text-dim';
  if (score >= 8) return 'text-emerald-700';
  if (score >= 6) return 'text-teal-700';
  if (score >= 4) return 'text-amber-700';
  return 'text-red-600';
}

function getScoreBg(score: number | null): string {
  if (score == null) return 'bg-gray-50';
  if (score >= 8) return 'bg-emerald-50';
  if (score >= 6) return 'bg-teal-50';
  if (score >= 4) return 'bg-amber-50';
  return 'bg-red-50';
}

function getStatusObj(status: SoundAIStatus) {
  return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
}

function loadWeights(): Record<ScoreKey, number> {
  if (typeof window === 'undefined') return DEFAULT_WEIGHTS;
  try {
    const stored = localStorage.getItem('sound-ai-weights');
    if (stored) return JSON.parse(stored);
  } catch { /* use defaults */ }
  return DEFAULT_WEIGHTS;
}

// ─── Main Page ────────────────────────────────────────────────────

export default function SoundLabPage() {
  const { data: ideas, loading: ideasLoading } = useSoundAIIdeas();
  const { data: thesisVersions, loading: thesisLoading } = useSoundAIThesis();
  const { data: competitors, loading: compsLoading } = useSoundAICompetitors();
  const { user } = useUser();

  const [activeTab, setActiveTab] = useState<TabId>('canvas');
  const [weights, setWeights] = useState<Record<ScoreKey, number>>(DEFAULT_WEIGHTS);
  const [weightModalOpen, setWeightModalOpen] = useState(false);

  useEffect(() => { setWeights(loadWeights()); }, []);

  const currentThesis = thesisVersions.length > 0 ? thesisVersions[0] : null;
  const thesisOneLiner = currentThesis?.content?.split('\n').find(l => l.startsWith('"'))?.replace(/"/g, '') || '';

  const ideasWithComposite = useMemo(() =>
    ideas.map(idea => ({ ...idea, _composite: computeComposite(idea, weights) })),
    [ideas, weights]
  );

  if (ideasLoading && thesisLoading && compsLoading) return <LoadingSkeleton />;

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-text text-lg font-semibold">Sound AI Lab</h1>
        <p className="text-muted text-sm mt-1">Brainstorm and evaluate every angle in the AI audio/sound/music space</p>
      </div>

      {/* Pinned Thesis Banner */}
      {thesisOneLiner && (
        <div className="bg-accent/5 border border-accent/20 rounded px-4 py-2.5 mb-4 flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[11px] text-accent font-medium uppercase tracking-wide">Current Thesis</span>
            <p className="text-sm text-text truncate mt-0.5">{thesisOneLiner}</p>
          </div>
          <button onClick={() => setActiveTab('thesis')} className="text-xs text-accent hover:text-accent/80 flex-shrink-0 ml-4">
            Edit &rarr;
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 border-b border-border pb-px">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-sm rounded-t transition-colors ${
              activeTab === tab.id
                ? 'bg-card text-accent border border-border border-b-card -mb-px font-medium'
                : 'text-muted hover:text-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button
          onClick={() => setWeightModalOpen(true)}
          className="ml-auto text-dim hover:text-muted transition-colors p-2"
          title="Adjust scoring weights"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5.5 1v2m0 8v2M1 5.5h2m8 0h2M8.5 1v2m0 8v2M1 8.5h2m8 0h2M5.5 3a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM8.5 6a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        </button>
      </div>

      {/* Active Section */}
      {activeTab === 'canvas' && (
        <IdeaCanvasSection ideas={ideasWithComposite} weights={weights} user={user} />
      )}
      {activeTab === 'brainstorm' && (
        <AIBrainstormSection user={user} weights={weights} />
      )}
      {activeTab === 'landscape' && (
        <CompetitiveLandscapeSection competitors={competitors} />
      )}
      {activeTab === 'thesis' && (
        <ThesisSection thesisVersions={thesisVersions} user={user} />
      )}
      {activeTab === 'rankings' && (
        <RankingDashboardSection ideas={ideasWithComposite} />
      )}

      {/* Weight Settings Modal */}
      <WeightSettingsModal
        open={weightModalOpen}
        onClose={() => setWeightModalOpen(false)}
        weights={weights}
        onChange={(w) => { setWeights(w); localStorage.setItem('sound-ai-weights', JSON.stringify(w)); }}
      />
    </div>
  );
}

// ─── Section 1: Idea Canvas ──────────────────────────────────────

type IdeaWithComposite = SoundAIIdea & { _composite: number | null };

function IdeaCanvasSection({ ideas, weights, user }: { ideas: IdeaWithComposite[]; weights: Record<ScoreKey, number>; user: string | null }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<SoundAIStatus | 'all'>('all');

  const filtered = statusFilter === 'all' ? ideas : ideas.filter(i => i.status === statusFilter);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1.5">
          <button onClick={() => setStatusFilter('all')} className={`text-xs px-2.5 py-1 rounded ${statusFilter === 'all' ? 'bg-accent/15 text-accent' : 'text-muted hover:text-text'}`}>All ({ideas.length})</button>
          {STATUS_OPTIONS.map(s => {
            const count = ideas.filter(i => i.status === s.value).length;
            if (count === 0) return null;
            return <button key={s.value} onClick={() => setStatusFilter(s.value)} className={`text-xs px-2.5 py-1 rounded ${statusFilter === s.value ? 'bg-accent/15 text-accent' : 'text-muted hover:text-text'}`}>{s.label} ({count})</button>;
          })}
        </div>
        <button onClick={() => setNewModalOpen(true)} className="text-xs px-3 py-1.5 bg-accent/15 text-accent rounded hover:bg-accent/25 transition-colors">
          + New Idea
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded p-8 text-center">
          <p className="text-muted text-sm">No ideas yet. Start by generating some with the AI Brainstorm tab!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map(idea => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              expanded={expandedId === idea.id}
              onToggle={() => setExpandedId(expandedId === idea.id ? null : idea.id)}
              weights={weights}
            />
          ))}
        </div>
      )}

      <NewIdeaModal open={newModalOpen} onClose={() => setNewModalOpen(false)} user={user} />
    </div>
  );
}

function IdeaCard({ idea, expanded, onToggle, weights }: { idea: IdeaWithComposite; expanded: boolean; onToggle: () => void; weights: Record<ScoreKey, number> }) {
  const status = getStatusObj(idea.status);
  const composite = idea._composite;

  const updateField = async (field: string, value: string | number | null) => {
    const update: Record<string, unknown> = { [field]: value };
    // Recompute composite if a score changed
    if (field.endsWith('_score')) {
      const updated = { ...idea, [field]: value } as SoundAIIdea;
      update.composite_score = computeComposite(updated, weights);
    }
    await supabase.from('sound_ai_ideas').update(update).eq('id', idea.id);
  };

  return (
    <div className={`bg-card border border-border rounded-lg overflow-hidden transition-shadow ${expanded ? 'shadow-sm' : ''}`}>
      {/* Header (always visible) */}
      <div className="px-4 py-3 flex items-start gap-3 cursor-pointer" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-text truncate">{idea.name}</h3>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${status.color}`}>{status.label}</span>
          </div>
          {idea.one_liner && <p className="text-xs text-muted mt-0.5 truncate">{idea.one_liner}</p>}
          <div className="flex items-center gap-3 mt-1.5">
            {idea.category && <span className="text-[11px] text-dim">{idea.category}</span>}
            {idea.revenue_model && <span className="text-[11px] text-dim">{idea.revenue_model}</span>}
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          {composite != null && (
            <span className={`text-lg font-semibold ${getScoreColor(composite)}`}>{composite.toFixed(1)}</span>
          )}
          <svg width="12" height="12" viewBox="0 0 12 12" className={`text-dim mt-1 ml-auto transition-transform ${expanded ? 'rotate-180' : ''}`}>
            <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-3">
          {/* Editable fields */}
          <div className="grid grid-cols-2 gap-3">
            <EditableField label="Name" value={idea.name} onSave={v => updateField('name', v)} />
            <EditableField label="One-Liner" value={idea.one_liner || ''} onSave={v => updateField('one_liner', v)} maxLen={140} />
            <div>
              <label className="text-[11px] text-dim block mb-1">Category</label>
              <select value={idea.category || ''} onChange={e => updateField('category', e.target.value || null)} className="w-full text-xs bg-white border border-border rounded px-2 py-1.5">
                <option value="">Select...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-dim block mb-1">Revenue Model</label>
              <select value={idea.revenue_model || ''} onChange={e => updateField('revenue_model', e.target.value || null)} className="w-full text-xs bg-white border border-border rounded px-2 py-1.5">
                <option value="">Select...</option>
                {REVENUE_MODELS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-dim block mb-1">Status</label>
              <select value={idea.status} onChange={e => updateField('status', e.target.value)} className="w-full text-xs bg-white border border-border rounded px-2 py-1.5">
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <EditableField label="Target Customer" value={idea.target_customer || ''} onSave={v => updateField('target_customer', v)} />
          </div>
          <EditableTextarea label="How It Works" value={idea.how_it_works || ''} onSave={v => updateField('how_it_works', v)} />
          <EditableTextarea label="Competitors" value={idea.competitors || ''} onSave={v => updateField('competitors', v)} />
          <EditableTextarea label="Differentiation" value={idea.differentiation || ''} onSave={v => updateField('differentiation', v)} />

          {/* Scores */}
          <div>
            <h4 className="text-[11px] text-dim font-medium mb-2 uppercase tracking-wide">Scores (1-10)</h4>
            <div className="grid grid-cols-7 gap-2">
              {SCORE_DIMS.map(dim => (
                <div key={dim.key} className="text-center">
                  <label className="text-[10px] text-dim block mb-1" title={dim.desc}>{dim.short}</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={idea[dim.key] ?? ''}
                    onChange={e => {
                      const v = e.target.value ? Math.min(10, Math.max(1, parseInt(e.target.value))) : null;
                      updateField(dim.key, v);
                    }}
                    className={`w-full text-center text-sm font-medium border border-border rounded py-1 ${getScoreBg(idea[dim.key])} ${getScoreColor(idea[dim.key])}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <EditableTextarea label="Notes" value={idea.notes || ''} onSave={v => updateField('notes', v)} placeholder="Add notes, competitive intel, links..." rows={3} />

          {/* Delete */}
          <div className="flex justify-end pt-2 border-t border-border/50">
            <button
              onClick={async () => { if (confirm('Delete this idea?')) await supabase.from('sound_ai_ideas').delete().eq('id', idea.id); }}
              className="text-[11px] text-red-500 hover:text-red-600"
            >
              Delete Idea
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EditableField({ label, value, onSave, maxLen }: { label: string; value: string; onSave: (v: string) => void; maxLen?: number }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  const save = () => { if (draft !== value) onSave(draft); setEditing(false); };

  return (
    <div>
      <label className="text-[11px] text-dim block mb-1">{label}</label>
      {editing ? (
        <input
          value={draft}
          onChange={e => setDraft(maxLen ? e.target.value.slice(0, maxLen) : e.target.value)}
          onBlur={save}
          onKeyDown={e => e.key === 'Enter' && save()}
          className="w-full text-xs bg-white border border-accent/30 rounded px-2 py-1.5 focus:outline-none focus:border-accent"
          autoFocus
        />
      ) : (
        <div onClick={() => setEditing(true)} className="text-xs text-text bg-surface/50 rounded px-2 py-1.5 cursor-text min-h-[28px] hover:bg-surface">
          {value || <span className="text-dim">Click to edit...</span>}
        </div>
      )}
    </div>
  );
}

function EditableTextarea({ label, value, onSave, placeholder, rows }: { label: string; value: string; onSave: (v: string) => void; placeholder?: string; rows?: number }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  const save = () => { if (draft !== value) onSave(draft); setEditing(false); };

  return (
    <div>
      <label className="text-[11px] text-dim block mb-1">{label}</label>
      {editing ? (
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={save}
          className="w-full text-xs bg-white border border-accent/30 rounded px-2 py-1.5 focus:outline-none focus:border-accent resize-y"
          rows={rows || 2}
          autoFocus
        />
      ) : (
        <div onClick={() => setEditing(true)} className="text-xs text-text bg-surface/50 rounded px-2 py-1.5 cursor-text min-h-[28px] hover:bg-surface whitespace-pre-wrap">
          {value || <span className="text-dim">{placeholder || 'Click to edit...'}</span>}
        </div>
      )}
    </div>
  );
}

function NewIdeaModal({ open, onClose, user }: { open: boolean; onClose: () => void; user: string | null }) {
  const [name, setName] = useState('');
  const [oneLiner, setOneLiner] = useState('');
  const [category, setCategory] = useState('');
  const [targetCustomer, setTargetCustomer] = useState('');
  const [howItWorks, setHowItWorks] = useState('');
  const [revenueModel, setRevenueModel] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await supabase.from('sound_ai_ideas').insert({
      name: name.trim(),
      one_liner: oneLiner.trim() || null,
      category: category || null,
      target_customer: targetCustomer.trim() || null,
      how_it_works: howItWorks.trim() || null,
      revenue_model: revenueModel || null,
      status: 'brainstorm',
      added_by: user,
    });
    setSaving(false);
    setName(''); setOneLiner(''); setCategory(''); setTargetCustomer(''); setHowItWorks(''); setRevenueModel('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="New Sound AI Idea" wide>
      <div className="space-y-3">
        <div>
          <label className="text-[11px] text-dim block mb-1">Idea Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full text-sm bg-white border border-border rounded px-3 py-2 focus:border-accent focus:outline-none" placeholder="e.g. AI Session Musicians" />
        </div>
        <div>
          <label className="text-[11px] text-dim block mb-1">One-Liner (max 140 chars)</label>
          <input value={oneLiner} onChange={e => setOneLiner(e.target.value.slice(0, 140))} className="w-full text-sm bg-white border border-border rounded px-3 py-2 focus:border-accent focus:outline-none" placeholder="The elevator pitch..." />
          <span className="text-[10px] text-dim">{oneLiner.length}/140</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-dim block mb-1">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full text-sm bg-white border border-border rounded px-3 py-2">
              <option value="">Select...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-dim block mb-1">Revenue Model</label>
            <select value={revenueModel} onChange={e => setRevenueModel(e.target.value)} className="w-full text-sm bg-white border border-border rounded px-3 py-2">
              <option value="">Select...</option>
              {REVENUE_MODELS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-[11px] text-dim block mb-1">Target Customer</label>
          <input value={targetCustomer} onChange={e => setTargetCustomer(e.target.value)} className="w-full text-sm bg-white border border-border rounded px-3 py-2 focus:border-accent focus:outline-none" placeholder='e.g. "indie filmmakers with <$5M budgets"' />
        </div>
        <div>
          <label className="text-[11px] text-dim block mb-1">How It Works</label>
          <textarea value={howItWorks} onChange={e => setHowItWorks(e.target.value)} className="w-full text-sm bg-white border border-border rounded px-3 py-2 focus:border-accent focus:outline-none resize-y" rows={3} placeholder="2-3 sentences on the product mechanics..." />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="text-xs px-3 py-1.5 text-muted hover:text-text">Cancel</button>
          <button onClick={save} disabled={!name.trim() || saving} className="text-xs px-4 py-1.5 bg-accent/15 text-accent rounded hover:bg-accent/25 disabled:opacity-50">
            {saving ? 'Saving...' : 'Create Idea'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Section 2: AI Brainstorm ────────────────────────────────────

interface DraftIdea {
  name: string;
  one_liner: string;
  category: string;
  target_customer: string;
  how_it_works: string;
  revenue_model: string;
  competitors: string;
  differentiation: string;
  suggested_scores: {
    tam: number;
    pain: number;
    feasibility: number;
    moat: number;
    team_fit: number;
    time_to_revenue: number;
    passion: number;
  };
}

function AIBrainstormSection({ user, weights }: { user: string | null; weights: Record<ScoreKey, number> }) {
  const [customPrompt, setCustomPrompt] = useState('');
  const [drafts, setDrafts] = useState<DraftIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedIdx, setSavedIdx] = useState<Set<number>>(new Set());
  const [savingIdx, setSavingIdx] = useState<Set<number>>(new Set());

  const generate = async () => {
    setLoading(true);
    setError('');
    setDrafts([]);
    setSavedIdx(new Set());
    try {
      const res = await fetch('/api/sound-ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_prompt: customPrompt.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to generate'); return; }
      if (data.ideas?.length > 0) setDrafts(data.ideas);
      else setError('No ideas generated. Try a different prompt.');
    } catch (err) {
      setError(`Network error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const saveIdea = async (draft: DraftIdea, index: number) => {
    if (!user) return;
    setSavingIdx(prev => { const n = new Set(prev); n.add(index); return n; });

    const sc = draft.suggested_scores;
    const ideaData: Record<string, unknown> = {
      name: draft.name,
      one_liner: draft.one_liner,
      category: draft.category,
      target_customer: draft.target_customer,
      how_it_works: draft.how_it_works,
      revenue_model: draft.revenue_model,
      competitors: draft.competitors,
      differentiation: draft.differentiation,
      tam_score: sc.tam,
      pain_score: sc.pain,
      feasibility_score: sc.feasibility,
      moat_score: sc.moat,
      team_fit_score: sc.team_fit,
      time_to_revenue_score: sc.time_to_revenue,
      passion_score: sc.passion,
      status: 'brainstorm',
      added_by: user,
    };
    // Compute composite
    const tempIdea = {
      tam_score: sc.tam, pain_score: sc.pain, feasibility_score: sc.feasibility,
      moat_score: sc.moat, team_fit_score: sc.team_fit, time_to_revenue_score: sc.time_to_revenue,
      passion_score: sc.passion,
    } as SoundAIIdea;
    ideaData.composite_score = computeComposite(tempIdea, weights);

    await supabase.from('sound_ai_ideas').insert(ideaData);
    setSavingIdx(prev => { const n = new Set(prev); n.delete(index); return n; });
    setSavedIdx(prev => { const n = new Set(prev); n.add(index); return n; });
  };

  return (
    <div>
      <div className="bg-card border border-border rounded p-5 mb-6">
        <h2 className="text-text text-sm font-medium mb-2">AI Brainstorm Assistant</h2>
        <p className="text-xs text-dim mb-3">
          Generate new AI audio startup ideas with Claude. Leave empty for diverse ideas, or specify a focus area.
        </p>
        <div className="flex gap-3 mb-3">
          <input
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') generate(); }}
            className="flex-1 text-sm bg-white border border-border rounded px-3 py-2 focus:border-accent focus:outline-none"
            placeholder='e.g. "5 ideas focused on the gaming space" or "AI audio for healthcare"'
          />
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="w-full py-2.5 text-sm bg-accent/15 text-accent rounded hover:bg-accent/25 transition-colors disabled:opacity-50 font-medium"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              Generating 5 ideas...
            </span>
          ) : (
            'Generate Ideas'
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-200 rounded p-4 mb-6">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {drafts.length > 0 && (
        <div className="bg-card border border-border rounded overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-text text-sm font-medium">Generated Ideas ({drafts.length})</h2>
            <p className="text-xs text-dim mt-0.5">Review and save the ideas you like. Scores are AI-suggested and can be adjusted after saving.</p>
          </div>
          <div className="divide-y divide-border/50">
            {drafts.map((draft, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-text">{draft.name}</h3>
                    <p className="text-xs text-muted mt-0.5">{draft.one_liner}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-[11px] text-dim">{draft.category}</span>
                      <span className="text-[11px] text-dim">{draft.revenue_model}</span>
                    </div>
                    <p className="text-xs text-muted mt-1.5">{draft.how_it_works}</p>
                    <p className="text-[11px] text-dim mt-1"><strong>Customer:</strong> {draft.target_customer}</p>
                    <p className="text-[11px] text-dim"><strong>Competitors:</strong> {draft.competitors}</p>
                    <p className="text-[11px] text-dim"><strong>Differentiation:</strong> {draft.differentiation}</p>
                    <div className="flex gap-2 mt-2">
                      {Object.entries(draft.suggested_scores).map(([k, v]) => (
                        <span key={k} className={`text-[10px] px-1.5 py-0.5 rounded ${getScoreBg(v as number)} ${getScoreColor(v as number)}`}>
                          {k.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}: {v as number}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {savedIdx.has(i) ? (
                      <span className="text-xs text-emerald-700 px-3 py-1.5">Saved</span>
                    ) : savingIdx.has(i) ? (
                      <span className="text-xs text-accent px-3 py-1.5 flex items-center gap-1">
                        <span className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      <button onClick={() => saveIdea(draft, i)} className="text-xs px-3 py-1.5 bg-accent/15 text-accent rounded hover:bg-accent/25 transition-colors">
                        Save to Canvas
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section 3: Competitive Landscape ────────────────────────────

function CompetitiveLandscapeSection({ competitors }: { competitors: SoundAICompetitor[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newComp, setNewComp] = useState({ company: '', focus: '', funding: '', key_product: '', gap_opportunity: '' });

  const updateCompetitor = async (id: string, field: string, value: string) => {
    await supabase.from('sound_ai_competitors').update({ [field]: value }).eq('id', id);
  };

  const addCompetitor = async () => {
    if (!newComp.company.trim()) return;
    await supabase.from('sound_ai_competitors').insert({
      company: newComp.company.trim(),
      focus: newComp.focus.trim() || null,
      funding: newComp.funding.trim() || null,
      key_product: newComp.key_product.trim() || null,
      gap_opportunity: newComp.gap_opportunity.trim() || null,
    });
    setNewComp({ company: '', focus: '', funding: '', key_product: '', gap_opportunity: '' });
    setAddingNew(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-text text-sm font-medium">Competitive Landscape</h2>
          <p className="text-xs text-dim mt-0.5">Major players in AI audio — click any cell to edit</p>
        </div>
        <button onClick={() => setAddingNew(true)} className="text-xs px-3 py-1.5 bg-accent/15 text-accent rounded hover:bg-accent/25 transition-colors">
          + Add Competitor
        </button>
      </div>

      <div className="bg-card border border-border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-3 py-2.5 text-xs font-medium text-dim w-[130px]">Company</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-dim w-[160px]">Focus</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-dim w-[160px]">Funding</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-dim">Key Product</th>
              <th className="text-left px-3 py-2.5 text-xs font-medium text-dim">Gap / Opportunity</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {competitors.map(comp => (
              <tr key={comp.id} className="hover:bg-surface/50">
                <CompetitorCell id={comp.id} field="company" value={comp.company} onSave={updateCompetitor} editing={editingId} setEditing={setEditingId} bold />
                <CompetitorCell id={comp.id} field="focus" value={comp.focus || ''} onSave={updateCompetitor} editing={editingId} setEditing={setEditingId} />
                <CompetitorCell id={comp.id} field="funding" value={comp.funding || ''} onSave={updateCompetitor} editing={editingId} setEditing={setEditingId} />
                <CompetitorCell id={comp.id} field="key_product" value={comp.key_product || ''} onSave={updateCompetitor} editing={editingId} setEditing={setEditingId} />
                <CompetitorCell id={comp.id} field="gap_opportunity" value={comp.gap_opportunity || ''} onSave={updateCompetitor} editing={editingId} setEditing={setEditingId} />
                <td className="px-1">
                  <button
                    onClick={async () => { if (confirm(`Delete ${comp.company}?`)) await supabase.from('sound_ai_competitors').delete().eq('id', comp.id); }}
                    className="text-dim hover:text-red-500 p-1"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add new competitor row */}
      {addingNew && (
        <div className="bg-card border border-border rounded p-4 mt-3">
          <h3 className="text-sm font-medium text-text mb-3">Add Competitor</h3>
          <div className="grid grid-cols-2 gap-3">
            <input value={newComp.company} onChange={e => setNewComp({ ...newComp, company: e.target.value })} className="text-xs bg-white border border-border rounded px-2 py-1.5" placeholder="Company name *" />
            <input value={newComp.focus} onChange={e => setNewComp({ ...newComp, focus: e.target.value })} className="text-xs bg-white border border-border rounded px-2 py-1.5" placeholder="Focus area" />
            <input value={newComp.funding} onChange={e => setNewComp({ ...newComp, funding: e.target.value })} className="text-xs bg-white border border-border rounded px-2 py-1.5" placeholder="Funding" />
            <input value={newComp.key_product} onChange={e => setNewComp({ ...newComp, key_product: e.target.value })} className="text-xs bg-white border border-border rounded px-2 py-1.5" placeholder="Key product" />
          </div>
          <input value={newComp.gap_opportunity} onChange={e => setNewComp({ ...newComp, gap_opportunity: e.target.value })} className="w-full text-xs bg-white border border-border rounded px-2 py-1.5 mt-3" placeholder="Gap / Opportunity" />
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setAddingNew(false)} className="text-xs px-3 py-1.5 text-muted">Cancel</button>
            <button onClick={addCompetitor} disabled={!newComp.company.trim()} className="text-xs px-3 py-1.5 bg-accent/15 text-accent rounded hover:bg-accent/25 disabled:opacity-50">Add</button>
          </div>
        </div>
      )}
    </div>
  );
}

function CompetitorCell({ id, field, value, onSave, editing, setEditing, bold }: {
  id: string; field: string; value: string; onSave: (id: string, field: string, value: string) => void;
  editing: string | null; setEditing: (id: string | null) => void; bold?: boolean;
}) {
  const cellKey = `${id}-${field}`;
  const isEditing = editing === cellKey;
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  const save = () => { if (draft !== value) onSave(id, field, draft); setEditing(null); };

  return (
    <td className="px-3 py-2">
      {isEditing ? (
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={e => e.key === 'Enter' && save()}
          className="w-full text-xs bg-white border border-accent/30 rounded px-1.5 py-1 focus:outline-none"
          autoFocus
        />
      ) : (
        <span
          onClick={() => { setEditing(cellKey); }}
          className={`text-xs cursor-text hover:bg-surface/50 rounded px-1 -mx-1 ${bold ? 'font-medium text-text' : 'text-muted'}`}
        >
          {value || <span className="text-dim italic">—</span>}
        </span>
      )}
    </td>
  );
}

// ─── Section 4: Thesis ───────────────────────────────────────────

function ThesisSection({ thesisVersions, user }: { thesisVersions: { id: string; version: number; content: string; updated_by: string | null; created_at: string }[]; user: string | null }) {
  const latest = thesisVersions.length > 0 ? thesisVersions[0] : null;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(latest?.content || '');
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { if (latest) setDraft(latest.content); }, [latest]);

  const save = async () => {
    if (!draft.trim() || draft === latest?.content) { setEditing(false); return; }
    setSaving(true);
    const nextVersion = (latest?.version || 0) + 1;
    await supabase.from('sound_ai_thesis').insert({
      version: nextVersion,
      content: draft.trim(),
      updated_by: user,
    });
    setSaving(false);
    setEditing(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-text text-sm font-medium">Our Current Thesis</h2>
          <p className="text-xs text-dim mt-0.5">
            {latest ? `Version ${latest.version} · Last updated by ${latest.updated_by || 'unknown'}` : 'No thesis yet'}
          </p>
        </div>
        <div className="flex gap-2">
          {thesisVersions.length > 1 && (
            <button onClick={() => setShowHistory(!showHistory)} className="text-xs px-3 py-1.5 text-muted hover:text-text">
              {showHistory ? 'Hide History' : `History (${thesisVersions.length})`}
            </button>
          )}
          {editing ? (
            <div className="flex gap-2">
              <button onClick={() => { setDraft(latest?.content || ''); setEditing(false); }} className="text-xs px-3 py-1.5 text-muted">Cancel</button>
              <button onClick={save} disabled={saving} className="text-xs px-3 py-1.5 bg-accent/15 text-accent rounded hover:bg-accent/25 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save New Version'}
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="text-xs px-3 py-1.5 bg-accent/15 text-accent rounded hover:bg-accent/25 transition-colors">
              Edit Thesis
            </button>
          )}
        </div>
      </div>

      {/* Current Thesis */}
      <div className="bg-card border border-border rounded p-5">
        {editing ? (
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            className="w-full text-sm bg-white border border-border rounded px-4 py-3 focus:border-accent focus:outline-none resize-y font-mono"
            rows={20}
            placeholder="Write your thesis in Markdown..."
          />
        ) : latest ? (
          <div className="prose prose-sm max-w-none">
            <ThesisRenderer content={latest.content} />
          </div>
        ) : (
          <p className="text-sm text-muted">No thesis yet. Click &ldquo;Edit Thesis&rdquo; to write one.</p>
        )}
      </div>

      {/* Version History */}
      {showHistory && (
        <div className="mt-4 bg-card border border-border rounded divide-y divide-border/50">
          <div className="px-4 py-2.5">
            <h3 className="text-xs font-medium text-text">Version History</h3>
          </div>
          {thesisVersions.map(v => (
            <div key={v.id} className="px-4 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text font-medium">v{v.version}</span>
                <span className="text-[11px] text-dim">{v.updated_by} · {new Date(v.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-muted mt-1 line-clamp-2">{v.content.substring(0, 200)}...</p>
              {v.id !== latest?.id && (
                <button
                  onClick={() => { setDraft(v.content); setEditing(true); }}
                  className="text-[11px] text-accent mt-1"
                >
                  Restore this version
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ThesisRenderer({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <h2 key={i} className="text-text text-base font-semibold mt-4 mb-1">{line.slice(3)}</h2>;
        if (line.startsWith('### ')) return <h3 key={i} className="text-text text-sm font-semibold mt-3 mb-1">{line.slice(4)}</h3>;
        if (line.startsWith('- ')) return <li key={i} className="text-sm text-text ml-4 list-disc">{line.slice(2)}</li>;
        if (line.match(/^\d+\./)) return <li key={i} className="text-sm text-text ml-4 list-decimal">{line.replace(/^\d+\.\s*/, '')}</li>;
        if (line.startsWith('"')) return <blockquote key={i} className="text-sm text-muted italic border-l-2 border-accent/30 pl-3 my-2">{line}</blockquote>;
        if (line.trim() === '') return <div key={i} className="h-2" />;
        return <p key={i} className="text-sm text-text">{line}</p>;
      })}
    </div>
  );
}

// ─── Section 5: Ranking Dashboard ────────────────────────────────

type SortCol = ScoreKey | 'name' | 'category' | 'composite' | 'status';

function RankingDashboardSection({ ideas }: { ideas: IdeaWithComposite[] }) {
  const [sortCol, setSortCol] = useState<SortCol>('composite');
  const [sortAsc, setSortAsc] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());

  const sorted = useMemo(() => {
    const arr = [...ideas];
    arr.sort((a, b) => {
      let va: string | number | null, vb: string | number | null;
      if (sortCol === 'composite') { va = a._composite; vb = b._composite; }
      else if (sortCol === 'name') { va = a.name.toLowerCase(); vb = b.name.toLowerCase(); }
      else if (sortCol === 'category') { va = a.category || ''; vb = b.category || ''; }
      else if (sortCol === 'status') { va = a.status; vb = b.status; }
      else { va = a[sortCol]; vb = b[sortCol]; }
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'string') return sortAsc ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return arr;
  }, [ideas, sortCol, sortAsc]);

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) setSortAsc(!sortAsc);
    else { setSortCol(col); setSortAsc(false); }
  };

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 3) next.add(id);
      return next;
    });
  };

  const comparedIdeas = ideas.filter(i => compareIds.has(i.id));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-text text-sm font-medium">Idea Rankings</h2>
        <div className="flex gap-2">
          {compareMode && compareIds.size >= 2 && (
            <span className="text-xs text-accent">{compareIds.size} selected for comparison</span>
          )}
          <button
            onClick={() => { setCompareMode(!compareMode); if (compareMode) setCompareIds(new Set()); }}
            className={`text-xs px-3 py-1.5 rounded transition-colors ${compareMode ? 'bg-accent/15 text-accent' : 'text-muted hover:text-text border border-border'}`}
          >
            {compareMode ? 'Exit Compare' : 'Compare Mode'}
          </button>
        </div>
      </div>

      {/* Compare Radar Chart */}
      {compareMode && comparedIdeas.length >= 2 && (
        <div className="bg-card border border-border rounded p-5 mb-4">
          <h3 className="text-xs font-medium text-text mb-3">Side-by-Side Comparison</h3>
          <div className="flex justify-center">
            <RadarChart ideas={comparedIdeas} />
          </div>
          <div className="flex justify-center gap-4 mt-3">
            {comparedIdeas.map((idea, i) => (
              <div key={idea.id} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-accent' : i === 1 ? 'bg-amber-500' : 'bg-purple-500'}`} />
                <span className="text-xs text-text">{idea.name}</span>
                <span className={`text-xs font-medium ${getScoreColor(idea._composite)}`}>{idea._composite?.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rankings Table */}
      <div className="bg-card border border-border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {compareMode && <th className="w-8 px-2"></th>}
              <th className="text-left px-3 py-2.5 text-xs font-medium text-dim w-8">#</th>
              <SortHeader col="name" label="Name" current={sortCol} asc={sortAsc} onSort={toggleSort} />
              <SortHeader col="category" label="Category" current={sortCol} asc={sortAsc} onSort={toggleSort} />
              <SortHeader col="composite" label="Score" current={sortCol} asc={sortAsc} onSort={toggleSort} />
              {SCORE_DIMS.map(d => (
                <SortHeader key={d.key} col={d.key} label={d.short} current={sortCol} asc={sortAsc} onSort={toggleSort} />
              ))}
              <SortHeader col="status" label="Status" current={sortCol} asc={sortAsc} onSort={toggleSort} />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {sorted.map((idea, rank) => {
              const status = getStatusObj(idea.status);
              return (
                <tr key={idea.id} className={`hover:bg-surface/50 ${compareIds.has(idea.id) ? 'bg-accent/5' : ''}`}>
                  {compareMode && (
                    <td className="px-2">
                      <input
                        type="checkbox"
                        checked={compareIds.has(idea.id)}
                        onChange={() => toggleCompare(idea.id)}
                        disabled={!compareIds.has(idea.id) && compareIds.size >= 3}
                        className="rounded border-border text-accent"
                      />
                    </td>
                  )}
                  <td className="px-3 py-2 text-xs text-dim">{rank + 1}</td>
                  <td className="px-3 py-2 text-xs font-medium text-text">{idea.name}</td>
                  <td className="px-3 py-2 text-xs text-muted">{idea.category || '—'}</td>
                  <td className="px-3 py-2">
                    <span className={`text-sm font-semibold ${getScoreColor(idea._composite)}`}>
                      {idea._composite?.toFixed(1) ?? '—'}
                    </span>
                  </td>
                  {SCORE_DIMS.map(d => (
                    <td key={d.key} className="px-3 py-2">
                      <span className={`text-xs font-medium ${getScoreColor(idea[d.key])}`}>{idea[d.key] ?? '—'}</span>
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${status.color}`}>{status.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortHeader({ col, label, current, asc, onSort }: { col: SortCol; label: string; current: SortCol; asc: boolean; onSort: (col: SortCol) => void }) {
  const active = current === col;
  return (
    <th
      onClick={() => onSort(col)}
      className={`text-left px-3 py-2.5 text-xs font-medium cursor-pointer select-none transition-colors ${active ? 'text-accent' : 'text-dim hover:text-muted'}`}
    >
      {label}
      {active && <span className="ml-0.5">{asc ? '↑' : '↓'}</span>}
    </th>
  );
}

// ─── Radar Chart (SVG) ──────────────────────────────────────────

function RadarChart({ ideas }: { ideas: IdeaWithComposite[] }) {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 110;
  const levels = 4;
  const dims = SCORE_DIMS;
  const n = dims.length;
  const colors = ['#2A7C6F', '#D97706', '#7C3AED'];

  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, val: number) => ({
    x: cx + radius * (val / 10) * Math.cos(angle(i)),
    y: cy + radius * (val / 10) * Math.sin(angle(i)),
  });

  // Grid
  const gridPaths = Array.from({ length: levels }, (_, l) => {
    const r = ((l + 1) / levels);
    const pts = Array.from({ length: n }, (_, i) => {
      const p = { x: cx + radius * r * Math.cos(angle(i)), y: cy + radius * r * Math.sin(angle(i)) };
      return `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`;
    }).join(' ') + 'Z';
    return pts;
  });

  // Axis lines
  const axisLines = Array.from({ length: n }, (_, i) => ({
    x2: cx + radius * Math.cos(angle(i)),
    y2: cy + radius * Math.sin(angle(i)),
  }));

  // Data paths
  const dataPaths = ideas.map(idea => {
    const pts = dims.map((d, i) => {
      const val = idea[d.key] ?? 0;
      const p = point(i, val);
      return `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`;
    }).join(' ') + 'Z';
    return pts;
  });

  // Labels
  const labels = dims.map((d, i) => {
    const labelRadius = radius + 20;
    return {
      x: cx + labelRadius * Math.cos(angle(i)),
      y: cy + labelRadius * Math.sin(angle(i)),
      text: d.short,
    };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid */}
      {gridPaths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#E8E4DC" strokeWidth="0.5" />
      ))}
      {/* Axes */}
      {axisLines.map((line, i) => (
        <line key={i} x1={cx} y1={cy} x2={line.x2} y2={line.y2} stroke="#E8E4DC" strokeWidth="0.5" />
      ))}
      {/* Data */}
      {dataPaths.map((d, i) => (
        <g key={i}>
          <path d={d} fill={colors[i]} fillOpacity={0.1} stroke={colors[i]} strokeWidth="1.5" />
          {dims.map((dim, j) => {
            const val = ideas[i][dim.key] ?? 0;
            const p = point(j, val);
            return <circle key={j} cx={p.x} cy={p.y} r="3" fill={colors[i]} />;
          })}
        </g>
      ))}
      {/* Labels */}
      {labels.map((l, i) => (
        <text key={i} x={l.x} y={l.y} textAnchor="middle" dominantBaseline="middle" className="text-[10px] fill-[#666666]">
          {l.text}
        </text>
      ))}
    </svg>
  );
}

// ─── Weight Settings Modal ───────────────────────────────────────

function WeightSettingsModal({ open, onClose, weights, onChange }: {
  open: boolean; onClose: () => void; weights: Record<ScoreKey, number>; onChange: (w: Record<ScoreKey, number>) => void;
}) {
  const [local, setLocal] = useState(weights);

  useEffect(() => { setLocal(weights); }, [weights]);

  const total = Object.values(local).reduce((a, b) => a + b, 0);

  const setWeight = (key: ScoreKey, pct: number) => {
    setLocal(prev => ({ ...prev, [key]: Math.max(0, pct / 100) }));
  };

  const save = () => {
    // Normalize to sum to 1
    const sum = Object.values(local).reduce((a, b) => a + b, 0);
    const normalized = {} as Record<ScoreKey, number>;
    for (const key of Object.keys(local) as ScoreKey[]) {
      normalized[key] = sum > 0 ? Math.round((local[key] / sum) * 1000) / 1000 : DEFAULT_WEIGHTS[key];
    }
    onChange(normalized);
    onClose();
  };

  const reset = () => { setLocal(DEFAULT_WEIGHTS); };

  return (
    <Modal open={open} onClose={onClose} title="Scoring Weights">
      <p className="text-xs text-dim mb-4">Adjust how each dimension contributes to the composite score. Weights will be normalized to 100%.</p>
      <div className="space-y-3">
        {SCORE_DIMS.map(dim => (
          <div key={dim.key} className="flex items-center gap-3">
            <span className="text-xs text-text w-20 flex-shrink-0">{dim.short}</span>
            <input
              type="range"
              min={0}
              max={50}
              value={Math.round(local[dim.key] * 100)}
              onChange={e => setWeight(dim.key, parseInt(e.target.value))}
              className="flex-1 accent-accent"
            />
            <span className="text-xs text-muted w-10 text-right">{Math.round(local[dim.key] * 100)}%</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <span className={`text-xs ${Math.abs(total - 1) < 0.01 ? 'text-dim' : 'text-amber-600'}`}>
          Total: {Math.round(total * 100)}%
        </span>
        <div className="flex gap-2">
          <button onClick={reset} className="text-xs px-3 py-1.5 text-muted hover:text-text">Reset Defaults</button>
          <button onClick={save} className="text-xs px-3 py-1.5 bg-accent/15 text-accent rounded hover:bg-accent/25">Apply</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="max-w-7xl animate-pulse">
      <div className="mb-6">
        <div className="h-5 w-40 bg-surface rounded" />
        <div className="h-3 w-72 bg-surface rounded mt-2" />
      </div>
      <div className="h-10 bg-surface rounded mb-6" />
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-28 bg-surface rounded" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded h-32" />
        ))}
      </div>
    </div>
  );
}
