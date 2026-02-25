'use client';

import { useState } from 'react';
import { useArchetypes, useVerticalsList } from '@/lib/useSupabase';
import { useUser } from '@/lib/UserContext';
import { supabase } from '@/lib/supabase';

interface GeneratedIdea {
  name: string;
  description: string;
  vertical: string;
  archetype: string;
}

export default function GeneratePage() {
  const { data: archetypes, loading: aLoading } = useArchetypes();
  const { data: verticals, loading: vLoading } = useVerticalsList();
  const { user } = useUser();

  const [selectedVerticals, setSelectedVerticals] = useState<Set<string>>(new Set());
  const [selectedArchetypes, setSelectedArchetypes] = useState<Set<string>>(new Set());
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());

  // Manual idea input
  const [manualName, setManualName] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // Add new vertical/archetype
  const [newVertical, setNewVertical] = useState('');
  const [newArchetype, setNewArchetype] = useState('');

  const toggleVertical = (name: string) => {
    setSelectedVerticals(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const toggleArchetype = (name: string) => {
    setSelectedArchetypes(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const addVertical = async () => {
    if (!newVertical.trim()) return;
    await supabase.from('verticals_list').insert({ name: newVertical.trim() });
    setNewVertical('');
  };

  const addArchetype = async () => {
    if (!newArchetype.trim()) return;
    await supabase.from('archetypes').insert({ name: newArchetype.trim() });
    setNewArchetype('');
  };

  const generate = async () => {
    if (selectedVerticals.size === 0 && selectedArchetypes.size === 0) {
      setError('Select at least one vertical or archetype');
      return;
    }
    setLoading(true);
    setError('');
    setIdeas([]);
    setSavedIds(new Set());

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verticals: Array.from(selectedVerticals),
          archetypes: Array.from(selectedArchetypes),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to generate'); return; }
      if (data.ideas?.length > 0) setIdeas(data.ideas);
      else setError('No ideas generated. Try different selections.');
    } catch (err) {
      setError(`Network error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const addToPipeline = async (idea: GeneratedIdea, index: number) => {
    if (!user) return;
    setSavingIds(prev => { const n = new Set(prev); n.add(index); return n; });

    // 1. Insert idea
    const { data: inserted } = await supabase.from('ideas').insert({
      name: idea.name,
      description: idea.description,
      source: 'ai-generator',
      status: 'brainstorm',
      vertical: idea.vertical || null,
      added_by: user,
    }).select('id').single();

    // 2. Score it via AI
    if (inserted?.id) {
      try {
        const scoreRes = await fetch('/api/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: idea.name, description: idea.description, vertical: idea.vertical }),
        });
        const scores = await scoreRes.json();
        if (scoreRes.ok && scores.tam_score) {
          await supabase.from('ideas').update({
            tam_score: scores.tam_score,
            competition_score: scores.competition_score,
            problem_severity_score: scores.problem_severity_score,
            market_founder_fit_score: scores.market_founder_fit_score,
            execution_difficulty_score: scores.execution_difficulty_score,
            total_score: scores.total_score,
            score_reasoning: scores.reasoning || null,
          }).eq('id', inserted.id);
        }
      } catch { /* scoring failed silently */ }
    }

    setSavingIds(prev => { const n = new Set(prev); n.delete(index); return n; });
    setSavedIds(prev => { const n = new Set(prev); n.add(index); return n; });
  };

  const submitManualIdea = async () => {
    if (!manualName.trim() || !user) return;
    setManualSubmitting(true);

    const { data: inserted } = await supabase.from('ideas').insert({
      name: manualName.trim(),
      description: manualDesc.trim() || null,
      source: 'manual',
      status: 'brainstorm',
      added_by: user,
    }).select('id').single();

    // Score it
    if (inserted?.id) {
      try {
        const scoreRes = await fetch('/api/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: manualName.trim(), description: manualDesc.trim() }),
        });
        const scores = await scoreRes.json();
        if (scoreRes.ok && scores.tam_score) {
          await supabase.from('ideas').update({
            tam_score: scores.tam_score,
            competition_score: scores.competition_score,
            problem_severity_score: scores.problem_severity_score,
            market_founder_fit_score: scores.market_founder_fit_score,
            execution_difficulty_score: scores.execution_difficulty_score,
            total_score: scores.total_score,
            score_reasoning: scores.reasoning || null,
          }).eq('id', inserted.id);
        }
      } catch { /* scoring failed silently */ }
    }

    setManualName('');
    setManualDesc('');
    setManualSubmitting(false);
  };

  if (aLoading || vLoading) return <LoadingSkeleton />;

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-text text-lg font-semibold">Idea Generator</h1>
        <p className="text-muted text-sm mt-1">Select verticals and archetypes, then generate startup ideas with AI</p>
      </div>

      {/* Top Row: Verticals (left) + Archetypes (right) */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Verticals */}
        <div className="bg-card border border-border rounded p-4 max-h-[350px] overflow-y-auto">
          <div className="flex items-center justify-between mb-3 sticky top-0 bg-card pb-2">
            <h2 className="text-text text-sm font-medium">Verticals</h2>
            <span className="text-xs text-dim">{selectedVerticals.size} selected</span>
          </div>
          <div className="space-y-1">
            {verticals.map(v => (
              <label key={v.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={selectedVerticals.has(v.name)}
                  onChange={() => toggleVertical(v.name)}
                  className="rounded border-border text-accent focus:ring-accent/50"
                />
                <span className={`text-sm ${selectedVerticals.has(v.name) ? 'text-text' : 'text-muted'}`}>{v.name}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2 mt-3 pt-3 border-t border-border">
            <input
              value={newVertical}
              onChange={e => setNewVertical(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addVertical()}
              className="flex-1 text-xs"
              placeholder="Add new vertical..."
            />
            <button onClick={addVertical} className="text-xs px-2 py-1 text-accent hover:text-accent/80">Add</button>
          </div>
        </div>

        {/* Archetypes */}
        <div className="bg-card border border-border rounded p-4 max-h-[350px] overflow-y-auto">
          <div className="flex items-center justify-between mb-3 sticky top-0 bg-card pb-2">
            <h2 className="text-text text-sm font-medium">Archetypes</h2>
            <span className="text-xs text-dim">{selectedArchetypes.size} selected</span>
          </div>
          <div className="space-y-1">
            {archetypes.map(a => (
              <label key={a.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={selectedArchetypes.has(a.name)}
                  onChange={() => toggleArchetype(a.name)}
                  className="rounded border-border text-accent focus:ring-accent/50"
                />
                <span className={`text-sm ${selectedArchetypes.has(a.name) ? 'text-text' : 'text-muted'}`}>{a.name}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2 mt-3 pt-3 border-t border-border">
            <input
              value={newArchetype}
              onChange={e => setNewArchetype(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addArchetype()}
              className="flex-1 text-xs"
              placeholder="Add new archetype..."
            />
            <button onClick={addArchetype} className="text-xs px-2 py-1 text-accent hover:text-accent/80">Add</button>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={generate}
        disabled={loading || (selectedVerticals.size === 0 && selectedArchetypes.size === 0)}
        className="w-full py-3 text-sm bg-accent/15 text-accent rounded hover:bg-accent/25 transition-colors disabled:opacity-50 font-medium mb-6"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            Generating 10 ideas...
          </span>
        ) : (
          `Generate Ideas (${selectedVerticals.size} vertical${selectedVerticals.size !== 1 ? 's' : ''} × ${selectedArchetypes.size} archetype${selectedArchetypes.size !== 1 ? 's' : ''})`
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded p-4 mb-6">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Generated Ideas */}
      {ideas.length > 0 && (
        <div className="bg-card border border-border rounded overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-text text-sm font-medium">Generated Ideas ({ideas.length})</h2>
          </div>
          <div className="divide-y divide-border/50">
            {ideas.map((idea, i) => (
              <div key={i} className="px-4 py-3 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-text">{idea.name}</h3>
                  <p className="text-xs text-muted mt-0.5">{idea.description}</p>
                  <div className="flex gap-3 mt-1.5">
                    {idea.vertical && <span className="text-[11px] text-dim">Vertical: <span className="text-muted">{idea.vertical}</span></span>}
                    {idea.archetype && <span className="text-[11px] text-dim">Archetype: <span className="text-muted">{idea.archetype}</span></span>}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {savedIds.has(i) ? (
                    <span className="text-xs text-emerald-400 px-3 py-1.5">Added</span>
                  ) : savingIds.has(i) ? (
                    <span className="text-xs text-accent px-3 py-1.5 flex items-center gap-1">
                      <span className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                      Scoring...
                    </span>
                  ) : (
                    <button
                      onClick={() => addToPipeline(idea, i)}
                      className="text-xs px-3 py-1.5 bg-accent/15 text-accent rounded hover:bg-accent/25 transition-colors"
                    >
                      Add to Pipeline
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Idea Input */}
      <div className="bg-card border border-border rounded p-5">
        <h2 className="text-text text-sm font-medium mb-3">Add Idea Manually</h2>
        <div className="flex gap-3">
          <input
            value={manualName}
            onChange={e => setManualName(e.target.value)}
            className="flex-1"
            placeholder="Idea name..."
          />
          <input
            value={manualDesc}
            onChange={e => setManualDesc(e.target.value)}
            className="flex-[2]"
            placeholder="Brief description (optional)..."
          />
          <button
            onClick={submitManualIdea}
            disabled={!manualName.trim() || manualSubmitting}
            className="px-4 py-2 text-sm bg-accent/15 text-accent rounded hover:bg-accent/25 transition-colors disabled:opacity-50 flex-shrink-0 flex items-center gap-2"
          >
            {manualSubmitting && <span className="w-3.5 h-3.5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />}
            {manualSubmitting ? 'Adding & Scoring...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-6xl animate-pulse">
      <div className="mb-6">
        <div className="h-5 w-40 bg-surface rounded" />
        <div className="h-3 w-72 bg-surface rounded mt-2" />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded p-4 h-[350px]">
          <div className="h-4 w-20 bg-surface rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-4 h-4 bg-surface rounded" />
                <div className="h-3 bg-surface rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded p-4 h-[350px]">
          <div className="h-4 w-24 bg-surface rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-4 h-4 bg-surface rounded" />
                <div className="h-3 bg-surface rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="h-12 bg-surface rounded mb-6" />
      <div className="bg-card border border-border rounded p-5">
        <div className="h-4 w-32 bg-surface rounded mb-3" />
        <div className="flex gap-3">
          <div className="flex-1 h-10 bg-surface rounded" />
          <div className="flex-[2] h-10 bg-surface rounded" />
          <div className="w-20 h-10 bg-surface rounded" />
        </div>
      </div>
    </div>
  );
}
