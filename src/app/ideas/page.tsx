'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useIdeas, useArchetypes } from '@/lib/useSupabase';
import { useUser } from '@/lib/UserContext';
import { supabase } from '@/lib/supabase';
import { Idea, CompetitionLevel } from '@/lib/types';
import Modal from '@/components/Modal';
import { useSearchParams } from 'next/navigation';
import { useFilterThresholds, FUNNEL_STEPS, isScored, formatTAM, formatMonths } from '@/lib/filterConfig';

const SCORE_COLUMNS = [
  { key: 'tam_estimate_billions', reasoningKey: 'tam', label: 'TAM (Estimate)', short: 'TAM', type: 'tam' as const, description: 'Total Addressable Market dollar estimate.' },
  { key: 'competition_level', reasoningKey: 'competition', label: 'Existing Competition', short: 'Comp', type: 'categorical' as const, description: 'Low = blue ocean, High = very crowded.' },
  { key: 'problem_severity_score', reasoningKey: 'problem_severity', label: 'Problem Severity', short: 'Severity', type: 'numeric' as const, description: 'How painful the problem is. Higher = more urgent.' },
  { key: 'market_founder_fit_score', reasoningKey: 'market_founder_fit', label: 'Market-Founder Fit', short: 'MF Fit', type: 'numeric' as const, description: 'Fit for CV/AI, healthcare ops & data infra expertise.' },
  { key: 'execution_difficulty_score', reasoningKey: 'execution_difficulty', label: 'Execution Difficulty', short: 'Exec', type: 'numeric_inverted' as const, description: '1=easy, 10=very hard. Lower is better.' },
  { key: 'time_to_100m_arr_months', reasoningKey: 'time_to_100m_arr', label: 'Time to $100M ARR', short: '$100M', type: 'months' as const, description: 'Estimated months to reach $100M ARR. Lower is better.' },
  { key: 'second_buyer_score', reasoningKey: 'second_buyer', label: '2nd Buyer for Data', short: '2nd Buyer', type: 'numeric' as const, description: 'Potential second buyer for data/insights generated.' },
  { key: 'passion_score', reasoningKey: 'passion', label: 'Passion', short: 'Passion', type: 'numeric' as const, description: 'Team excitement and passion for this idea.' },
] as const;

// Color helpers
function scoreColor(val: number | null): string {
  if (val === null) return 'text-dim';
  if (val >= 8) return 'text-emerald-700';
  if (val >= 6) return 'text-accent';
  if (val >= 4) return 'text-amber-700';
  return 'text-red-600';
}

function invertedScoreColor(val: number | null): string {
  if (val === null) return 'text-dim';
  if (val <= 3) return 'text-emerald-700';
  if (val <= 5) return 'text-accent';
  if (val <= 7) return 'text-amber-700';
  return 'text-red-600';
}

function tamColor(billions: number | null): string {
  if (billions === null) return 'text-dim';
  if (billions >= 10) return 'text-emerald-700';
  if (billions >= 1) return 'text-accent';
  if (billions >= 0.5) return 'text-amber-700';
  return 'text-red-600';
}

function monthsColor(months: number | null): string {
  if (months === null) return 'text-dim';
  if (months <= 36) return 'text-emerald-700';
  if (months <= 60) return 'text-accent';
  if (months <= 96) return 'text-amber-700';
  return 'text-red-600';
}

function competitionBadge(level: CompetitionLevel | null): string {
  if (!level) return 'bg-surface text-dim';
  if (level === 'Low') return 'bg-emerald-100 text-emerald-800';
  if (level === 'Medium') return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
}

function totalColor(val: number | null): string {
  if (val === null) return 'text-dim';
  if (val >= 40) return 'text-emerald-700';
  if (val >= 30) return 'text-accent';
  if (val >= 20) return 'text-amber-700';
  return 'text-red-600';
}

export default function IdeasPage() {
  const { data: ideas, loading } = useIdeas();
  const { data: archetypes } = useArchetypes();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useUser();
  const searchParams = useSearchParams();
  const { thresholds } = useFilterThresholds();

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

  // Build filter labels from thresholds
  const funnelFilterButtons = useMemo(() => {
    const buttons = [{ key: 'all', label: 'All Ideas' }];
    FUNNEL_STEPS.forEach((step, i) => {
      buttons.push({ key: step.key, label: `${i > 0 ? '+ ' : ''}${step.label(thresholds)}` });
    });
    buttons.push({ key: 'shortlist', label: 'Shortlist' });
    buttons.push({ key: 'deep_dive', label: 'Deep Dive' });
    buttons.push({ key: 'selected', label: 'Selected' });
    return buttons;
  }, [thresholds]);

  // Apply funnel filter using cascading logic
  const filteredIdeas = useMemo(() => {
    if (funnelFilter === 'all') return [...ideas];
    if (funnelFilter === 'shortlist') return ideas.filter(i => i.status === 'shortlist');
    if (funnelFilter === 'deep_dive') return ideas.filter(i => i.status === 'deep_dive');
    if (funnelFilter === 'selected') return ideas.filter(i => i.status === 'selected');

    // Find which funnel step this is
    const stepIdx = FUNNEL_STEPS.findIndex(s => s.key === funnelFilter);
    if (stepIdx === -1) return [...ideas];

    // Apply all filters up to and including this step
    return ideas.filter(idea => {
      if (!isScored(idea)) return false;
      for (let i = 0; i <= stepIdx; i++) {
        if (!FUNNEL_STEPS[i].filter(idea, thresholds)) return false;
      }
      return true;
    });
  }, [ideas, funnelFilter, thresholds]);

  const sortedIdeas = useMemo(() => {
    const sorted = [...filteredIdeas];
    sorted.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name' || sortField === 'description') {
        cmp = (a.description || a.name).localeCompare(b.description || b.name);
      } else if (sortField === 'competition_level') {
        const order: Record<string, number> = { 'Low': 1, 'Medium': 2, 'High': 3 };
        cmp = (order[a.competition_level || ''] || 4) - (order[b.competition_level || ''] || 4);
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
      if (res.ok && scores.tam_estimate_billions) {
        await supabase.from('ideas').update({
          archetype_id: scores.archetype_id || null,
          tam_estimate_billions: scores.tam_estimate_billions,
          competition_level: scores.competition_level,
          problem_severity_score: scores.problem_severity_score,
          market_founder_fit_score: scores.market_founder_fit_score,
          execution_difficulty_score: scores.execution_difficulty_score,
          time_to_100m_arr_months: scores.time_to_100m_arr_months,
          second_buyer_name: scores.second_buyer_name,
          second_buyer_score: scores.second_buyer_score,
          passion_score: scores.passion_score,
          total_score: scores.total_score,
          score_reasoning: scores.reasoning || null,
        }).eq('id', idea.id);
      }
    } catch { /* scoring failed silently */ }
    setRescoring(prev => { const n = new Set(prev); n.delete(idea.id); return n; });
  };

  const exportCSV = () => {
    const headers = ['Rank', 'Idea', 'Description', 'Vertical', 'Archetype', 'TAM', 'Competition', 'Severity', 'MF Fit', 'Exec Difficulty', 'Time to $100M', '2nd Buyer', '2nd Buyer Score', 'Passion', 'Total'];
    const rows = sortedIdeas.map((idea, i) => {
      const arch = idea.archetype_id ? archetypeMap[idea.archetype_id] || '-' : '-';
      return [
        String(i + 1), idea.name, idea.description || '-', idea.vertical || '-', arch,
        idea.tam_estimate_billions !== null ? formatTAM(idea.tam_estimate_billions) : '-',
        idea.competition_level || '-',
        idea.problem_severity_score !== null ? String(idea.problem_severity_score) : '-',
        idea.market_founder_fit_score !== null ? String(idea.market_founder_fit_score) : '-',
        idea.execution_difficulty_score !== null ? String(idea.execution_difficulty_score) : '-',
        idea.time_to_100m_arr_months !== null ? formatMonths(idea.time_to_100m_arr_months) : '-',
        idea.second_buyer_name || '-',
        idea.second_buyer_score !== null ? String(idea.second_buyer_score) : '-',
        idea.passion_score !== null ? String(idea.passion_score) : '-',
        idea.total_score !== null ? String(idea.total_score) : '-',
      ];
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
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

  const scoredCount = ideas.filter(i => isScored(i)).length;
  const unscoredCount = ideas.length - scoredCount;
  const activeFilter = funnelFilterButtons.find(f => f.key === funnelFilter);

  return (
    <div className="max-w-[1400px]">
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
        {funnelFilterButtons.map(f => (
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
          <table className="w-full min-w-[1450px]">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-dim w-10">#</th>
                <SortHeader field="description" label="Idea" sortField={sortField} sortDir={sortDir} handleSort={handleSort} />
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
                    title={`${col.label}\n${col.description}`}
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
                  <td className="px-3 py-2.5 min-w-[420px]">
                    <button
                      onClick={() => setDetailIdea(idea)}
                      className="text-sm text-text hover:text-accent transition-colors text-left block whitespace-normal"
                      title={idea.name}
                    >
                      {idea.description
                        ? (idea.description.length > 80 ? idea.description.slice(0, 80) + '...' : idea.description)
                        : idea.name}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-dim truncate max-w-[100px]">
                    {idea.archetype_id ? archetypeMap[idea.archetype_id] || '--' : '--'}
                  </td>
                  {SCORE_COLUMNS.map(col => {
                    const raw = idea[col.key as keyof Idea];
                    const hasReasoning = idea.score_reasoning && idea.score_reasoning[col.reasoningKey];
                    const clickable = hasReasoning ? 'cursor-pointer hover:underline decoration-dotted underline-offset-2' : 'cursor-default';

                    return (
                      <td key={col.key} className="px-3 py-2.5 text-center">
                        {rescoring.has(idea.id) ? (
                          <span className="inline-block w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                        ) : col.type === 'tam' ? (
                          <button
                            onClick={(e) => handleScoreClick(e, idea.id, col.reasoningKey)}
                            className={`text-sm font-mono font-medium ${tamColor(raw as number | null)} ${clickable} transition-colors`}
                          >
                            {formatTAM(raw as number | null)}
                          </button>
                        ) : col.type === 'categorical' ? (
                          <button onClick={(e) => handleScoreClick(e, idea.id, col.reasoningKey)}>
                            {(raw as string | null) ? (
                              <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${competitionBadge(raw as CompetitionLevel)}`}>
                                {raw as string}
                              </span>
                            ) : (
                              <span className="text-sm font-mono text-dim">--</span>
                            )}
                          </button>
                        ) : col.type === 'numeric_inverted' ? (
                          <button
                            onClick={(e) => handleScoreClick(e, idea.id, col.reasoningKey)}
                            className={`text-sm font-mono font-medium ${invertedScoreColor(raw as number | null)} ${clickable} transition-colors`}
                          >
                            {raw !== null ? String(raw) : '--'}
                          </button>
                        ) : col.type === 'months' ? (
                          <button
                            onClick={(e) => handleScoreClick(e, idea.id, col.reasoningKey)}
                            className={`text-sm font-mono font-medium ${monthsColor(raw as number | null)} ${clickable} transition-colors`}
                          >
                            {formatMonths(raw as number | null)}
                          </button>
                        ) : (
                          <button
                            onClick={(e) => handleScoreClick(e, idea.id, col.reasoningKey)}
                            className={`text-sm font-mono font-medium ${scoreColor(raw as number | null)} ${clickable} transition-colors`}
                          >
                            {raw !== null ? String(raw) : '--'}
                          </button>
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
                            {isScored(idea) ? 'Re-score' : 'Score'}
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
                  <td colSpan={12} className="px-3 py-8 text-center text-dim text-sm">
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
        <div className="flex items-center gap-4 text-xs text-dim flex-wrap">
          <span>Scores: <span className="text-emerald-700">Strong</span> / <span className="text-accent">Good</span> / <span className="text-amber-700">Moderate</span> / <span className="text-red-600">Weak</span></span>
          <span className="text-dim/60">Click any score for AI reasoning</span>
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
          <div className="bg-card border border-border rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="lg:col-span-4 mb-1">
              <p className="text-xs text-muted">Ideas are scored by AI across 8 criteria. Filter thresholds are adjustable. Total = severity + MF fit + (11-exec) + 2nd buyer + passion (max 50).</p>
            </div>
            {SCORE_COLUMNS.map(col => (
              <div key={col.key} className="bg-surface/50 border border-border/50 rounded-lg p-3">
                <h4 className="text-xs font-medium text-text mb-1">{col.label}</h4>
                <p className="text-[11px] text-muted">{col.description}</p>
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
        <p className="text-xs text-dim mb-4">Comparable startups from the reference database.</p>
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2">
            <span className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            <span className="text-sm text-muted">Searching database...</span>
          </div>
        ) : comps.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-dim text-sm">No comparable startups found.</p>
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

  const left = Math.max(16, Math.min(popover.x - 160, window.innerWidth - 336));
  const top = Math.min(popover.y, window.innerHeight - 120);

  // Display the score value
  const raw = idea[col.key as keyof Idea];
  let displayVal = '--';
  if (col.type === 'tam') displayVal = formatTAM(raw as number | null);
  else if (col.type === 'categorical') displayVal = (raw as string) || '--';
  else if (col.type === 'months') displayVal = formatMonths(raw as number | null);
  else displayVal = raw !== null ? `${raw}/10` : '--';

  // Show second buyer name if applicable
  const secondBuyerName = col.reasoningKey === 'second_buyer' ? idea.second_buyer_name : null;

  return (
    <div ref={ref} className="fixed z-50 w-80 bg-card border border-border rounded-lg shadow-lg shadow-black/10 p-4" style={{ left: `${left}px`, top: `${top}px` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-mono font-bold text-text">{displayVal}</span>
        <span className="text-xs font-medium text-muted">{col.label}</span>
      </div>
      <p className="text-[10px] text-dim mb-2">{col.description}</p>
      {secondBuyerName && (
        <p className="text-xs text-accent mb-2">Buyer: {secondBuyerName}</p>
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
  const scored = isScored(idea);

  const desktopScores = [
    { label: 'TAM (Estimate)', value: formatTAM(idea.tam_estimate_billions), reasoning: idea.score_reasoning?.tam },
    { label: 'Existing Competition', value: idea.competition_level || '--', reasoning: idea.score_reasoning?.competition },
    { label: 'Problem Severity', value: idea.problem_severity_score !== null ? `${idea.problem_severity_score}/10` : '--', reasoning: idea.score_reasoning?.problem_severity, numeric: idea.problem_severity_score },
    { label: 'Market-Founder Fit', value: idea.market_founder_fit_score !== null ? `${idea.market_founder_fit_score}/10` : '--', reasoning: idea.score_reasoning?.market_founder_fit, numeric: idea.market_founder_fit_score },
    { label: 'Execution Difficulty', value: idea.execution_difficulty_score !== null ? `${idea.execution_difficulty_score}/10` : '--', reasoning: idea.score_reasoning?.execution_difficulty, numeric: idea.execution_difficulty_score, inverted: true },
  ];

  const talkScores = [
    { label: 'Time to $100M ARR', value: formatMonths(idea.time_to_100m_arr_months), reasoning: idea.score_reasoning?.time_to_100m_arr },
    { label: '2nd Buyer for Data', value: idea.second_buyer_score !== null ? `${idea.second_buyer_score}/10` : '--', extra: idea.second_buyer_name, reasoning: idea.score_reasoning?.second_buyer, numeric: idea.second_buyer_score },
    { label: 'Passion', value: idea.passion_score !== null ? `${idea.passion_score}/10` : '--', reasoning: idea.score_reasoning?.passion, numeric: idea.passion_score },
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
              {isScoring ? 'Scoring...' : scored ? 'Re-score' : 'Score Now'}
            </button>
          </div>

          {isScoring && !scored ? (
            <div className="bg-surface border border-border rounded p-6 text-center">
              <div className="w-8 h-8 border-3 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted">AI is analyzing this idea...</p>
              <p className="text-xs text-dim mt-1">Scoring across 8 criteria</p>
            </div>
          ) : scored ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] text-dim uppercase tracking-wide font-medium">Desktop Research</p>
                {desktopScores.map(s => (
                  <div key={s.label} className="bg-surface/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted">{s.label}</span>
                      <span className="text-sm font-mono font-medium text-text">{s.value}</span>
                    </div>
                    {s.reasoning && <p className="text-xs text-dim leading-relaxed">{s.reasoning}</p>}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-dim uppercase tracking-wide font-medium">Talk to Users</p>
                {talkScores.map(s => (
                  <div key={s.label} className="bg-surface/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted">{s.label}</span>
                      <span className="text-sm font-mono font-medium text-text">{s.value}</span>
                    </div>
                    {s.extra && <p className="text-xs text-accent mb-1">Buyer: {s.extra}</p>}
                    {s.reasoning && <p className="text-xs text-dim leading-relaxed">{s.reasoning}</p>}
                  </div>
                ))}
              </div>
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
          <button onClick={handleDelete} className="text-xs text-red-600 hover:text-red-500 transition-colors">
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
    <div className="max-w-[1400px] animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-5 w-36 bg-surface rounded" />
          <div className="h-3 w-56 bg-surface rounded mt-2" />
        </div>
        <div className="h-8 w-24 bg-surface rounded" />
      </div>
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-7 bg-surface rounded" style={{ width: `${50 + Math.random() * 40}px` }} />
        ))}
      </div>
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="border-b border-border px-3 py-2.5 flex gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-3 bg-surface rounded" style={{ width: `${30 + Math.random() * 40}px` }} />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-b border-border/50 px-3 py-3 flex items-center gap-4">
            <div className="h-3 w-6 bg-surface rounded" />
            <div className="h-3 bg-surface rounded" style={{ width: `${80 + Math.random() * 60}px` }} />
            <div className="h-3 w-16 bg-surface rounded" />
            {Array.from({ length: 8 }).map((_, j) => (
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
