'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useIdeas, useArchetypes } from '@/lib/useSupabase';
import { useUser } from '@/lib/UserContext';
import { supabase } from '@/lib/supabase';
import { Idea } from '@/lib/types';
import Modal from '@/components/Modal';
import { useSearchParams } from 'next/navigation';

const SCORE_COLUMNS = [
  { key: 'tam_score', reasoningKey: 'tam', label: 'TAM (Total Addressable Market)', short: 'TAM', description: 'Total Addressable Market size. Higher = larger market.', ranges: '8-10: $10B+ | 6-7: $1-10B | 4-5: $500M-1B | 1-3: <$500M' },
  { key: 'competition_score', reasoningKey: 'competition', label: 'Existing Competition', short: 'Comp', description: 'Competitive landscape. Higher = less competition, more white space.', ranges: '8-10: Blue ocean | 6-7: Moderate, clear differentiation | 4-5: Several competitors | 1-3: Extremely crowded' },
  { key: 'problem_severity_score', reasoningKey: 'problem_severity', label: 'Problem Severity', short: 'Severity', description: 'How painful the problem is. Higher = more urgent pain point.', ranges: '8-10: Hair-on-fire problem | 6-7: Significant pain | 4-5: Moderate pain | 1-3: Nice-to-have' },
  { key: 'market_founder_fit_score', reasoningKey: 'market_founder_fit', label: 'Market-Founder Fit', short: 'MF Fit', description: 'Fit for a team with CV/AI, healthcare ops & data infra expertise. Higher = stronger fit.', ranges: '8-10: Strong domain expertise | 6-7: Good skill overlap | 4-5: Some transferable skills | 1-3: No relevant expertise' },
  { key: 'execution_difficulty_score', reasoningKey: 'execution_difficulty', label: 'Execution Difficulty', short: 'Exec', description: 'Ease of execution. Higher = easier to build and ship.', ranges: '8-10: MVP in weeks | 6-7: Manageable challenges | 4-5: Significant challenges | 1-3: Massive capital/regulation needed' },
] as const;

// Funnel step filter definitions
const FUNNEL_FILTERS = [
  { key: 'all', label: 'All Ideas' },
  { key: 'tam_8', label: 'TAM ≥ 8' },
  { key: 'competition_8', label: '+ Competition ≥ 8' },
  { key: 'severity_8', label: '+ Severity ≥ 8' },
  { key: 'fit_8', label: '+ MF Fit ≥ 8' },
  { key: 'execution_8', label: '+ Exec ≥ 8' },
  { key: 'shortlist', label: 'Shortlist' },
  { key: 'deep_dive', label: 'Deep Dive' },
  { key: 'selected', label: 'Selected' },
] as const;

type CriterionKey = 'tam_score' | 'competition_score' | 'problem_severity_score' | 'market_founder_fit_score' | 'execution_difficulty_score';

const CASCADING_CRITERIA: CriterionKey[] = ['tam_score', 'competition_score', 'problem_severity_score', 'market_founder_fit_score', 'execution_difficulty_score'];

function scoreColor(val: number | null): string {
  if (val === null) return 'text-dim';
  if (val >= 8) return 'text-emerald-400';
  if (val >= 6) return 'text-accent';
  if (val >= 4) return 'text-amber-400';
  return 'text-red-400';
}

function scoreBg(val: number | null): string {
  if (val === null) return 'bg-dim/20';
  if (val >= 8) return 'bg-emerald-500';
  if (val >= 6) return 'bg-accent';
  if (val >= 4) return 'bg-amber-500';
  return 'bg-red-500';
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
  const { data: archetypes } = useArchetypes();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useUser();
  const searchParams = useSearchParams();

  const [sortField, setSortField] = useState<string>('total_score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [detailIdea, setDetailIdea] = useState<Idea | null>(null);
  const [compsIdea, setCompsIdea] = useState<Idea | null>(null);
  const [rescoring, setRescoring] = useState<Set<string>>(new Set());
  const [popover, setPopover] = useState<{ ideaId: string; colKey: string; x: number; y: number } | null>(null);
  const [showScoreGuide, setShowScoreGuide] = useState(false);

  // Get filter from URL or default to 'all'
  const urlFilter = searchParams.get('filter') || 'all';
  const [funnelFilter, setFunnelFilter] = useState(urlFilter);

  // Sync filter from URL changes
  useEffect(() => {
    const f = searchParams.get('filter');
    if (f) setFunnelFilter(f);
  }, [searchParams]);

  const archetypeMap = useMemo(() => {
    return Object.fromEntries(archetypes.map(a => [a.id, a.name]));
  }, [archetypes]);

  // Apply funnel filter
  const filteredIdeas = useMemo(() => {
    let filtered = [...ideas];

    switch (funnelFilter) {
      case 'tam_8':
        filtered = filtered.filter(i => i.total_score !== null && (i.tam_score || 0) >= 8);
        break;
      case 'competition_8':
        filtered = filtered.filter(i => i.total_score !== null &&
          CASCADING_CRITERIA.slice(0, 2).every(c => (i[c] || 0) >= 8));
        break;
      case 'severity_8':
        filtered = filtered.filter(i => i.total_score !== null &&
          CASCADING_CRITERIA.slice(0, 3).every(c => (i[c] || 0) >= 8));
        break;
      case 'fit_8':
        filtered = filtered.filter(i => i.total_score !== null &&
          CASCADING_CRITERIA.slice(0, 4).every(c => (i[c] || 0) >= 8));
        break;
      case 'execution_8':
        filtered = filtered.filter(i => i.total_score !== null &&
          CASCADING_CRITERIA.every(c => (i[c] || 0) >= 8));
        break;
      case 'shortlist':
        filtered = filtered.filter(i => i.status === 'shortlist');
        break;
      case 'deep_dive':
        filtered = filtered.filter(i => i.status === 'deep_dive');
        break;
      case 'selected':
        filtered = filtered.filter(i => i.status === 'selected');
        break;
      default:
        break;
    }

    return filtered;
  }, [ideas, funnelFilter]);

  const sortedIdeas = useMemo(() => {
    const sorted = [...filteredIdeas];
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
  }, [filteredIdeas, sortField, sortDir]);

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
          score_reasoning: scores.reasoning || null,
        }).eq('id', idea.id);
      }
    } catch { /* scoring failed silently */ }
    setRescoring(prev => { const n = new Set(prev); n.delete(idea.id); return n; });
  };

  const exportCSV = () => {
    const headers = ['Rank', 'Idea', 'Vertical', 'Archetype', ...SCORE_COLUMNS.map(c => c.label), 'Total'];
    const rows = sortedIdeas.map((idea, i) => {
      const scores = SCORE_COLUMNS.map(c => {
        const val = idea[c.key as keyof Idea] as number | null;
        return val !== null ? String(val) : '-';
      });
      const arch = idea.archetype_id ? archetypeMap[idea.archetype_id] || '-' : '-';
      return [String(i + 1), idea.name, idea.vertical || '-', arch, ...scores, idea.total_score !== null ? String(idea.total_score) : '-'];
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

  const handleScoreClick = (e: React.MouseEvent, ideaId: string, colKey: string) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPopover({ ideaId, colKey, x: rect.left + rect.width / 2, y: rect.bottom + 8 });
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  const scoredCount = ideas.filter(i => i.total_score !== null).length;
  const unscoredCount = ideas.length - scoredCount;
  const activeFilter = FUNNEL_FILTERS.find(f => f.key === funnelFilter);

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-text text-lg font-semibold">Ideas Pipeline</h1>
          <p className="text-muted text-sm mt-1">
            {ideas.length} total &middot; {scoredCount} scored &middot; {unscoredCount} unscored
            {funnelFilter !== 'all' && (
              <span className="text-accent ml-2">
                &middot; Showing {filteredIdeas.length} ({activeFilter?.label})
              </span>
            )}
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

      {/* Funnel Step Filters */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {FUNNEL_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFunnelFilter(f.key)}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              funnelFilter === f.key
                ? 'bg-accent/20 text-accent border border-accent/30'
                : 'text-dim hover:text-muted bg-surface/50 border border-transparent hover:border-border'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px]">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-dim w-10">#</th>
                <SortHeader field="name" label="Idea" sortField={sortField} sortDir={sortDir} handleSort={handleSort} />
                <th className="text-left px-3 py-2.5 text-xs font-medium text-dim">Vertical</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-dim">Archetype</th>
                {SCORE_COLUMNS.map(col => (
                  <SortHeader
                    key={col.key}
                    field={col.key}
                    label={col.short}
                    sortField={sortField}
                    sortDir={sortDir}
                    handleSort={handleSort}
                    center
                    title={`${col.label}\n${col.description}\n${col.ranges}`}
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
                      className="text-sm text-text hover:text-accent transition-colors text-left truncate max-w-[180px] block"
                    >
                      {idea.name}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-dim truncate max-w-[100px]">
                    {idea.vertical || '--'}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-dim truncate max-w-[100px]">
                    {idea.archetype_id ? archetypeMap[idea.archetype_id] || '--' : '--'}
                  </td>
                  {SCORE_COLUMNS.map(col => {
                    const val = idea[col.key as keyof Idea] as number | null;
                    const hasReasoning = idea.score_reasoning && idea.score_reasoning[col.reasoningKey];
                    return (
                      <td key={col.key} className="px-3 py-2.5 text-center">
                        {rescoring.has(idea.id) ? (
                          <span className="inline-block w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                        ) : val !== null ? (
                          <button
                            onClick={(e) => handleScoreClick(e, idea.id, col.reasoningKey)}
                            className={`text-sm font-mono font-medium ${scoreColor(val)} ${hasReasoning ? 'cursor-pointer hover:underline decoration-dotted underline-offset-2' : 'cursor-default'} transition-colors`}
                            title={hasReasoning ? 'Click for reasoning' : col.label}
                          >
                            {val}
                          </button>
                        ) : (
                          <span className="text-sm font-mono text-dim">--</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2.5 text-center">
                    {rescoring.has(idea.id) ? (
                      <span className="inline-block w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className={`text-sm font-mono font-semibold ${totalColor(idea.total_score)}`}>
                          {idea.total_score !== null ? idea.total_score : '--'}
                        </span>
                        <span className="text-dim text-[10px] font-mono">/50</span>
                      </>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {rescoring.has(idea.id) ? (
                        <span className="text-xs text-accent flex items-center gap-1">
                          <span className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => rescoreIdea(idea)}
                            className="text-xs text-muted hover:text-accent transition-colors"
                            title="Score with AI"
                          >
                            {idea.total_score !== null ? 'Re-score' : 'Score'}
                          </button>
                          <button
                            onClick={() => setCompsIdea(idea)}
                            className="text-xs text-muted hover:text-accent transition-colors"
                            title="Find comparable startups"
                          >
                            Comps
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {sortedIdeas.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-dim text-sm">
                    {funnelFilter === 'all'
                      ? 'No ideas yet. Use the Idea Generator to add ideas to the pipeline.'
                      : `No ideas match the "${activeFilter?.label}" filter.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Score Legend & Guide */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-6 text-xs text-dim">
          <span>Score Legend:</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-400" /> 8-10 (Strong)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#7DB4D0]" /> 6-7 (Good)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-400" /> 4-5 (Moderate)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-400" /> 1-3 (Weak)</span>
          <span className="text-dim/60 ml-2">Click any score for AI reasoning</span>
          <button
            onClick={() => setShowScoreGuide(g => !g)}
            className="ml-auto text-accent/70 hover:text-accent transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            {showScoreGuide ? 'Hide' : 'Score'} Guide
          </button>
        </div>

        {showScoreGuide && (
          <div className="bg-card border border-border rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-3 mb-1">
              <p className="text-xs text-muted">Each idea is scored 1–10 across 5 criteria by AI. Scores ≥ 8 pass the funnel filter. Total is out of 50. <span className="text-dim">Hover column headers for quick descriptions.</span></p>
            </div>
            {SCORE_COLUMNS.map(col => (
              <div key={col.key} className="bg-surface/50 border border-border/50 rounded-lg p-3">
                <h4 className="text-xs font-medium text-text mb-1">{col.label}</h4>
                <p className="text-[11px] text-muted mb-2">{col.description}</p>
                <div className="space-y-0.5">
                  {col.ranges.split(' | ').map((range, i) => {
                    const colors = ['text-emerald-400', 'text-accent', 'text-amber-400', 'text-red-400'];
                    return (
                      <p key={i} className={`text-[10px] font-mono ${colors[i] || 'text-dim'}`}>{range}</p>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Score Reasoning Popover */}
      {popover && (
        <ScorePopover popover={popover} ideas={ideas} onClose={() => setPopover(null)} />
      )}

      {/* Detail Modal */}
      <IdeaDetailModal idea={detailIdea} onClose={() => setDetailIdea(null)} onRescore={rescoreIdea} rescoring={rescoring} archetypeMap={archetypeMap} />

      {/* Comps Modal */}
      <CompsModal idea={compsIdea} onClose={() => setCompsIdea(null)} />
    </div>
  );
}

/* ========== Comps Modal ========== */
function CompsModal({ idea, onClose }: { idea: Idea | null; onClose: () => void }) {
  const [comps, setComps] = useState<Array<{ company: string; industry: string | null; one_liner: string | null; stage: string | null; amount_raised: string | null; key_investors: string | null; relevance: number }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!idea) { setComps([]); return; }
    setLoading(true);
    fetch('/api/comps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: idea.name, description: idea.description, vertical: idea.vertical }),
    })
      .then(r => r.json())
      .then(data => { setComps(data.comps || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [idea]);

  if (!idea) return null;

  return (
    <Modal open={!!idea} onClose={onClose} title={`Comps: ${idea.name}`} wide>
      <div>
        <p className="text-xs text-dim mb-4">Comparable startups from the reference database matching this idea&apos;s vertical and keywords.</p>

        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2">
            <span className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            <span className="text-sm text-muted">Searching database...</span>
          </div>
        ) : comps.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-dim text-sm">No comparable startups found in the database.</p>
            <p className="text-dim text-xs mt-1">Try adding more detail to the idea description.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {comps.map((comp, i) => (
              <div key={i} className="bg-surface/50 border border-border/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-text">{comp.company}</h4>
                  <div className="flex items-center gap-2">
                    {comp.stage && <span className="text-[10px] text-muted bg-surface px-1.5 py-0.5 rounded">{comp.stage}</span>}
                    {comp.amount_raised && <span className="text-[10px] text-dim font-mono">{comp.amount_raised}</span>}
                  </div>
                </div>
                {comp.one_liner && <p className="text-xs text-muted">{comp.one_liner}</p>}
                <div className="flex items-center gap-3 mt-1.5">
                  {comp.industry && <span className="text-[10px] text-dim">Industry: <span className="text-muted">{comp.industry}</span></span>}
                  {comp.key_investors && <span className="text-[10px] text-dim truncate">Investors: <span className="text-muted">{comp.key_investors}</span></span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ========== Score Popover ========== */
function ScorePopover({
  popover, ideas, onClose,
}: {
  popover: { ideaId: string; colKey: string; x: number; y: number };
  ideas: Idea[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const idea = ideas.find(i => i.id === popover.ideaId);
  const col = SCORE_COLUMNS.find(c => c.reasoningKey === popover.colKey);
  const reasoning = idea?.score_reasoning?.[popover.colKey];
  const scoreVal = idea && col ? (idea[col.key as keyof Idea] as number | null) : null;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => { document.removeEventListener('mousedown', handleClickOutside); document.removeEventListener('keydown', handleEsc); };
  }, [onClose]);

  if (!idea || !col || !reasoning) { onClose(); return null; }

  // Determine which range band this score falls into
  const getRangeBand = (val: number | null) => {
    if (val === null) return null;
    const ranges = col.ranges.split(' | ');
    if (val >= 8) return ranges[0];
    if (val >= 6) return ranges[1];
    if (val >= 4) return ranges[2];
    return ranges[3];
  };
  const rangeBand = getRangeBand(scoreVal);

  const left = Math.max(16, Math.min(popover.x - 160, window.innerWidth - 336));
  const top = Math.min(popover.y, window.innerHeight - 120);

  return (
    <div ref={ref} className="fixed z-50 w-80 bg-card border border-border rounded-lg shadow-xl shadow-black/40 p-4" style={{ left: `${left}px`, top: `${top}px` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-lg font-mono font-bold ${scoreColor(scoreVal)}`}>{scoreVal}</span>
          <span className="text-[10px] text-dim font-mono">/10</span>
        </div>
        <span className="text-xs font-medium text-muted">{col.label}</span>
      </div>
      <p className="text-[10px] text-dim mb-2">{col.description}</p>
      <div className="h-1.5 bg-surface rounded-full overflow-hidden mb-2">
        <div className={`h-full rounded-full ${scoreBg(scoreVal)}`} style={{ width: `${((scoreVal || 0) / 10) * 100}%` }} />
      </div>
      {rangeBand && (
        <p className={`text-[10px] font-mono mb-2 ${scoreColor(scoreVal)}`}>{rangeBand}</p>
      )}
      <p className="text-sm text-muted leading-relaxed">{reasoning}</p>
      <div className="mt-3 pt-2 border-t border-border/50">
        <p className="text-[10px] text-dim truncate">{idea.name}</p>
      </div>
    </div>
  );
}

/* ========== Sort Header ========== */
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

/* ========== Detail Modal ========== */
function IdeaDetailModal({
  idea, onClose, onRescore, rescoring, archetypeMap,
}: {
  idea: Idea | null;
  onClose: () => void;
  onRescore: (idea: Idea) => void;
  rescoring: Set<string>;
  archetypeMap: Record<string, string>;
}) {
  if (!idea) return null;

  const handleDelete = async () => {
    await supabase.from('ideas').delete().eq('id', idea.id);
    onClose();
  };

  const isScoring = rescoring.has(idea.id);

  const scores = [
    { label: 'TAM (Total Addressable Market)', value: idea.tam_score, reasoningKey: 'tam' },
    { label: 'Existing Competition', value: idea.competition_score, reasoningKey: 'competition' },
    { label: 'Problem Severity', value: idea.problem_severity_score, reasoningKey: 'problem_severity' },
    { label: 'Market-Founder Fit', value: idea.market_founder_fit_score, reasoningKey: 'market_founder_fit' },
    { label: 'Execution Difficulty', value: idea.execution_difficulty_score, reasoningKey: 'execution_difficulty' },
  ];

  return (
    <Modal open={!!idea} onClose={onClose} title={idea.name} wide>
      <div className="space-y-5">
        <div className="flex items-center gap-3 flex-wrap">
          {idea.vertical && <span className="text-xs text-muted bg-surface px-2 py-0.5 rounded">{idea.vertical}</span>}
          {idea.archetype_id && archetypeMap[idea.archetype_id] && (
            <span className="text-xs text-muted bg-surface px-2 py-0.5 rounded">{archetypeMap[idea.archetype_id]}</span>
          )}
          <span className="text-xs text-dim">Added by {idea.added_by}</span>
          <span className="text-xs text-dim">Source: {idea.source || 'N/A'}</span>
          <span className="text-xs text-dim">Status: {idea.status}</span>
        </div>

        {idea.description && <p className="text-sm text-muted">{idea.description}</p>}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-dim uppercase tracking-wide">AI Funnel Scores</h3>
            <button
              onClick={() => onRescore(idea)}
              disabled={isScoring}
              className="text-xs text-accent hover:text-accent/80 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {isScoring && <span className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />}
              {isScoring ? 'Scoring...' : idea.total_score !== null ? 'Re-score' : 'Score Now'}
            </button>
          </div>

          {isScoring && idea.total_score === null ? (
            <div className="bg-surface border border-border rounded p-6 text-center">
              <div className="w-8 h-8 border-3 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted">AI is analyzing this idea...</p>
              <p className="text-xs text-dim mt-1">Scoring across 5 criteria</p>
            </div>
          ) : idea.total_score !== null ? (
            <div className="space-y-3">
              {scores.map(s => {
                const reasoning = idea.score_reasoning?.[s.reasoningKey];
                return (
                  <div key={s.label} className="bg-surface/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted">{s.label}</span>
                      <span className={`text-sm font-mono font-medium ${scoreColor(s.value)}`}>
                        {s.value !== null ? s.value : '--'}/10
                      </span>
                    </div>
                    <div className="h-1.5 bg-surface rounded-full overflow-hidden mb-2">
                      <div className={`h-full rounded-full transition-all ${scoreBg(s.value)}`} style={{ width: `${((s.value || 0) / 10) * 100}%` }} />
                    </div>
                    {reasoning ? (
                      <p className="text-xs text-dim leading-relaxed">{reasoning}</p>
                    ) : (
                      <p className="text-xs text-dim/50 italic">No reasoning available. Re-score to generate.</p>
                    )}
                  </div>
                );
              })}
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-sm text-text font-medium">Total Score</span>
                <div>
                  <span className={`text-xl font-mono font-semibold ${totalColor(idea.total_score)}`}>{idea.total_score}</span>
                  <span className="text-dim text-xs font-mono">/50</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded p-4 text-center">
              <p className="text-dim text-sm">Not scored yet</p>
              <button
                onClick={() => onRescore(idea)}
                disabled={isScoring}
                className="mt-2 text-xs text-accent hover:text-accent/80 transition-colors disabled:opacity-50 flex items-center gap-1.5 mx-auto"
              >
                {isScoring && <span className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />}
                {isScoring ? 'Scoring...' : 'Score with AI'}
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

/* ========== Loading Skeleton ========== */
function LoadingSkeleton() {
  return (
    <div className="max-w-7xl animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-5 w-36 bg-surface rounded" />
          <div className="h-3 w-56 bg-surface rounded mt-2" />
        </div>
        <div className="h-8 w-24 bg-surface rounded" />
      </div>
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-7 bg-surface rounded" style={{ width: `${50 + Math.random() * 40}px` }} />
        ))}
      </div>
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="border-b border-border px-3 py-2.5 flex gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-3 bg-surface rounded" style={{ width: `${30 + Math.random() * 40}px` }} />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-b border-border/50 px-3 py-3 flex items-center gap-4">
            <div className="h-3 w-6 bg-surface rounded" />
            <div className="h-3 bg-surface rounded" style={{ width: `${80 + Math.random() * 60}px` }} />
            <div className="h-3 w-16 bg-surface rounded" />
            <div className="h-3 w-16 bg-surface rounded" />
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="h-4 w-8 bg-surface rounded mx-auto" />
            ))}
            <div className="h-4 w-12 bg-surface rounded" />
            <div className="h-3 w-14 bg-surface rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
