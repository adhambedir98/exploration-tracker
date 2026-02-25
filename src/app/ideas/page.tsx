'use client';

import { useState, useMemo } from 'react';
import { useIdeas } from '@/lib/useSupabase';
import { useUser } from '@/lib/UserContext';
import { supabase } from '@/lib/supabase';
import { Idea } from '@/lib/types';
import Modal from '@/components/Modal';

const SCORE_COLUMNS = [
  { key: 'tam_score', label: 'TAM', short: 'TAM' },
  { key: 'competition_score', label: 'Competition', short: 'Comp' },
  { key: 'problem_severity_score', label: 'Problem Severity', short: 'Severity' },
  { key: 'market_founder_fit_score', label: 'Market-Founder Fit', short: 'MF Fit' },
  { key: 'execution_difficulty_score', label: 'Execution Difficulty', short: 'Exec' },
] as const;

function scoreColor(val: number | null): string {
  if (val === null) return 'text-dim';
  if (val >= 8) return 'text-emerald-400';
  if (val >= 6) return 'text-accent';
  if (val >= 4) return 'text-amber-400';
  return 'text-red-400';
}

function totalColor(val: number | null): string {
  if (val === null) return 'text-dim';
  if (val >= 40) return 'text-emerald-400';
  if (val >= 30) return 'text-accent';
  if (val >= 20) return 'text-amber-400';
  return 'text-red-400';
}

export default function IdeasPage() {
  const { data: ideas, loading } = useIdeas();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useUser();

  const [sortField, setSortField] = useState<string>('total_score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [detailIdea, setDetailIdea] = useState<Idea | null>(null);
  const [rescoring, setRescoring] = useState<Set<string>>(new Set());

  const sortedIdeas = useMemo(() => {
    const sorted = [...ideas];
    sorted.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sortField === 'total_score') {
        cmp = (a.total_score || 0) - (b.total_score || 0);
      } else {
        const aVal = (a as unknown as Record<string, number | null>)[sortField];
        const bVal = (b as unknown as Record<string, number | null>)[sortField];
        cmp = (aVal || 0) - (bVal || 0);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [ideas, sortField, sortDir]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const rescoreIdea = async (idea: Idea) => {
    setRescoring(prev => { const n = new Set(prev); n.add(idea.id); return n; });
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: idea.name, description: idea.description, vertical: idea.vertical }),
      });
      const scores = await res.json();
      if (res.ok && scores.tam_score) {
        await supabase.from('ideas').update({
          tam_score: scores.tam_score,
          competition_score: scores.competition_score,
          problem_severity_score: scores.problem_severity_score,
          market_founder_fit_score: scores.market_founder_fit_score,
          execution_difficulty_score: scores.execution_difficulty_score,
          total_score: scores.total_score,
        }).eq('id', idea.id);
      }
    } catch { /* scoring failed silently */ }
    setRescoring(prev => { const n = new Set(prev); n.delete(idea.id); return n; });
  };

  const exportCSV = () => {
    const headers = ['Rank', 'Idea', 'Vertical', ...SCORE_COLUMNS.map(c => c.label), 'Total'];
    const rows = sortedIdeas.map((idea, i) => {
      const scores = SCORE_COLUMNS.map(c => {
        const val = idea[c.key as keyof Idea] as number | null;
        return val !== null ? String(val) : '-';
      });
      return [String(i + 1), idea.name, idea.vertical || '-', ...scores, idea.total_score !== null ? String(idea.total_score) : '-'];
    });
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ideas-scores-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="text-dim text-sm">Loading ideas...</div>;
  }

  const scoredCount = ideas.filter(i => i.total_score !== null).length;
  const unscoredCount = ideas.length - scoredCount;

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-text text-lg font-semibold">Ideas Pipeline</h1>
          <p className="text-muted text-sm mt-1">
            {ideas.length} ideas &middot; {scoredCount} scored &middot; {unscoredCount} unscored
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-3 py-1.5 text-xs text-muted border border-border rounded hover:text-text hover:border-dim transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-dim w-10">#</th>
                <SortHeader field="name" label="Idea" sortField={sortField} sortDir={sortDir} handleSort={handleSort} />
                <th className="text-left px-3 py-2.5 text-xs font-medium text-dim">Vertical</th>
                {SCORE_COLUMNS.map(col => (
                  <SortHeader
                    key={col.key}
                    field={col.key}
                    label={col.short}
                    sortField={sortField}
                    sortDir={sortDir}
                    handleSort={handleSort}
                    center
                    title={col.label}
                  />
                ))}
                <SortHeader field="total_score" label="Total" sortField={sortField} sortDir={sortDir} handleSort={handleSort} center />
                <th className="text-center px-3 py-2.5 text-xs font-medium text-dim">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedIdeas.map((idea, i) => (
                <tr key={idea.id} className="border-b border-border/50 hover:bg-surface/50 transition-colors">
                  <td className="px-3 py-2.5 text-xs text-dim font-mono">{i + 1}</td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => setDetailIdea(idea)}
                      className="text-sm text-text hover:text-accent transition-colors text-left truncate max-w-[200px] block"
                    >
                      {idea.name}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-dim truncate max-w-[120px]">
                    {idea.vertical || '--'}
                  </td>
                  {SCORE_COLUMNS.map(col => {
                    const val = idea[col.key as keyof Idea] as number | null;
                    return (
                      <td key={col.key} className="px-3 py-2.5 text-center">
                        <span className={`text-sm font-mono font-medium ${scoreColor(val)}`}>
                          {val !== null ? val : '--'}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-sm font-mono font-semibold ${totalColor(idea.total_score)}`}>
                      {idea.total_score !== null ? idea.total_score : '--'}
                    </span>
                    <span className="text-dim text-[10px] font-mono">/50</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {rescoring.has(idea.id) ? (
                      <span className="text-xs text-accent flex items-center justify-center gap-1">
                        <span className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                      </span>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => rescoreIdea(idea)}
                          className="text-xs text-muted hover:text-accent transition-colors"
                          title="Re-score with AI"
                        >
                          {idea.total_score !== null ? 'Re-score' : 'Score'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {ideas.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-dim text-sm">
                    No ideas yet. Use the Idea Generator to add ideas to the pipeline.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Score Legend */}
      <div className="mt-4 flex items-center gap-6 text-xs text-dim">
        <span>Score Legend:</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-400" /> 8-10 (Strong)</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#7DB4D0]" /> 6-7 (Good)</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-400" /> 4-5 (Moderate)</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-400" /> 1-3 (Weak)</span>
      </div>

      {/* Detail Modal */}
      <IdeaDetailModal idea={detailIdea} onClose={() => setDetailIdea(null)} onRescore={rescoreIdea} rescoring={rescoring} />
    </div>
  );
}

function SortHeader({
  field, label, sortField, sortDir, handleSort, center, title,
}: {
  field: string; label: string; sortField: string; sortDir: string; handleSort: (f: string) => void; center?: boolean; title?: string;
}) {
  return (
    <th
      className={`${center ? 'text-center' : 'text-left'} px-3 py-2.5 text-xs font-medium text-dim cursor-pointer hover:text-muted select-none whitespace-nowrap`}
      onClick={() => handleSort(field)}
      title={title}
    >
      {label}
      {sortField === field && (
        <span className="ml-1 text-accent">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>
      )}
    </th>
  );
}

function IdeaDetailModal({
  idea, onClose, onRescore, rescoring,
}: {
  idea: Idea | null;
  onClose: () => void;
  onRescore: (idea: Idea) => void;
  rescoring: Set<string>;
}) {
  if (!idea) return null;

  const handleDelete = async () => {
    await supabase.from('ideas').delete().eq('id', idea.id);
    onClose();
  };

  const scores = [
    { label: 'TAM (Total Addressable Market)', value: idea.tam_score, desc: 'Market size potential' },
    { label: 'Existing Competition', value: idea.competition_score, desc: 'Higher = less competition' },
    { label: 'Problem Severity', value: idea.problem_severity_score, desc: 'How painful the problem is' },
    { label: 'Market-Founder Fit', value: idea.market_founder_fit_score, desc: 'Team expertise alignment' },
    { label: 'Execution Difficulty', value: idea.execution_difficulty_score, desc: 'Higher = easier to execute' },
  ];

  return (
    <Modal open={!!idea} onClose={onClose} title={idea.name} wide>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          {idea.vertical && (
            <span className="text-xs text-muted bg-surface px-2 py-0.5 rounded">{idea.vertical}</span>
          )}
          <span className="text-xs text-dim">Added by {idea.added_by}</span>
          <span className="text-xs text-dim">Source: {idea.source || 'N/A'}</span>
        </div>

        {idea.description && (
          <p className="text-sm text-muted">{idea.description}</p>
        )}

        {/* Score Breakdown */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-dim uppercase tracking-wide">AI Funnel Scores</h3>
            <button
              onClick={() => onRescore(idea)}
              disabled={rescoring.has(idea.id)}
              className="text-xs text-accent hover:text-accent/80 transition-colors disabled:opacity-50"
            >
              {rescoring.has(idea.id) ? 'Scoring...' : idea.total_score !== null ? 'Re-score' : 'Score Now'}
            </button>
          </div>

          {idea.total_score !== null ? (
            <div className="space-y-2.5">
              {scores.map(s => (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-sm text-muted">{s.label}</span>
                      <span className="text-xs text-dim ml-2">({s.desc})</span>
                    </div>
                    <span className={`text-sm font-mono font-medium ${scoreColor(s.value)}`}>
                      {s.value !== null ? s.value : '--'}/10
                    </span>
                  </div>
                  <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        (s.value || 0) >= 8 ? 'bg-emerald-500' :
                        (s.value || 0) >= 6 ? 'bg-accent' :
                        (s.value || 0) >= 4 ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${((s.value || 0) / 10) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-sm text-text font-medium">Total Score</span>
                <div>
                  <span className={`text-xl font-mono font-semibold ${totalColor(idea.total_score)}`}>
                    {idea.total_score}
                  </span>
                  <span className="text-dim text-xs font-mono">/50</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded p-4 text-center">
              <p className="text-dim text-sm">Not scored yet</p>
              <button
                onClick={() => onRescore(idea)}
                disabled={rescoring.has(idea.id)}
                className="mt-2 text-xs text-accent hover:text-accent/80 transition-colors disabled:opacity-50"
              >
                {rescoring.has(idea.id) ? 'Scoring...' : 'Score with AI'}
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-300 transition-colors">
            Delete idea
          </button>
        </div>
      </div>
    </Modal>
  );
}
