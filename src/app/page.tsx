'use client';

import { useMemo, useState } from 'react';
import { useIdeas } from '@/lib/useSupabase';
import { supabase } from '@/lib/supabase';
import { Idea, IdeaStatus } from '@/lib/types';
import Link from 'next/link';

const AI_FUNNEL_STEPS = [
  { key: 'all', label: 'All Ideas', criterion: null, filterParam: 'all', color: 'from-violet-500/30 to-violet-500/10', barColor: 'bg-violet-500', textColor: 'text-violet-400', borderColor: 'border-violet-500/30' },
  { key: 'tam', label: 'TAM ≥ 8', criterion: 'tam_score' as const, filterParam: 'tam_8', color: 'from-blue-500/30 to-blue-500/10', barColor: 'bg-blue-500', textColor: 'text-blue-400', borderColor: 'border-blue-500/30' },
  { key: 'competition', label: 'Competition ≥ 8', criterion: 'competition_score' as const, filterParam: 'competition_8', color: 'from-cyan-500/30 to-cyan-500/10', barColor: 'bg-cyan-500', textColor: 'text-cyan-400', borderColor: 'border-cyan-500/30' },
  { key: 'severity', label: 'Problem Severity ≥ 8', criterion: 'problem_severity_score' as const, filterParam: 'severity_8', color: 'from-accent/30 to-accent/10', barColor: 'bg-accent', textColor: 'text-accent', borderColor: 'border-accent/30' },
  { key: 'fit', label: 'Market-Founder Fit ≥ 8', criterion: 'market_founder_fit_score' as const, filterParam: 'fit_8', color: 'from-amber-500/30 to-amber-500/10', barColor: 'bg-amber-500', textColor: 'text-amber-400', borderColor: 'border-amber-500/30' },
  { key: 'execution', label: 'Execution Difficulty ≥ 8', criterion: 'execution_difficulty_score' as const, filterParam: 'execution_8', color: 'from-emerald-500/30 to-emerald-500/10', barColor: 'bg-emerald-500', textColor: 'text-emerald-400', borderColor: 'border-emerald-500/30' },
];

const MANUAL_STAGES: { key: IdeaStatus; label: string; filterParam: string; color: string; barColor: string; textColor: string; borderColor: string }[] = [
  { key: 'shortlist', label: 'Shortlist', filterParam: 'shortlist', color: 'from-sky-500/30 to-sky-500/10', barColor: 'bg-sky-500', textColor: 'text-sky-400', borderColor: 'border-sky-500/30' },
  { key: 'deep_dive', label: 'Deep Dive', filterParam: 'deep_dive', color: 'from-orange-500/30 to-orange-500/10', barColor: 'bg-orange-500', textColor: 'text-orange-400', borderColor: 'border-orange-500/30' },
  { key: 'selected', label: 'Selected', filterParam: 'selected', color: 'from-emerald-500/30 to-emerald-500/10', barColor: 'bg-emerald-500', textColor: 'text-emerald-400', borderColor: 'border-emerald-500/30' },
];

type CriterionKey = 'tam_score' | 'competition_score' | 'problem_severity_score' | 'market_founder_fit_score' | 'execution_difficulty_score';

export default function Dashboard() {
  const { data: ideas, loading } = useIdeas();
  const [showManualStages, setShowManualStages] = useState(true);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  // Build cascading AI funnel
  const funnelData = useMemo(() => {
    const criteria: CriterionKey[] = [];
    return AI_FUNNEL_STEPS.map(step => {
      if (step.criterion) criteria.push(step.criterion);
      const currentCriteria = [...criteria];
      const passing = ideas.filter(idea => {
        if (idea.total_score === null) return currentCriteria.length === 0;
        return currentCriteria.every(c => (idea[c] || 0) >= 8);
      });
      return { ...step, ideas: passing, count: passing.length };
    });
  }, [ideas]);

  // Manual stage counts
  const manualStageCounts = useMemo(() => {
    const counts: Record<string, Idea[]> = {};
    MANUAL_STAGES.forEach(s => { counts[s.key] = []; });
    ideas.forEach(idea => {
      if (counts[idea.status]) counts[idea.status].push(idea);
    });
    return counts;
  }, [ideas]);

  const survivors = funnelData[funnelData.length - 1]?.ideas || [];

  if (loading) return <DashboardSkeleton />;

  const maxCount = Math.max(...funnelData.map(s => s.count), 1);
  const maxManualCount = Math.max(...MANUAL_STAGES.map(s => (manualStageCounts[s.key] || []).length), 1);

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-text text-lg font-semibold">Idea Funnel</h1>
        <p className="text-muted text-sm mt-1">
          Ideas are filtered through cascading ≥8 score thresholds, then manually progressed through validation stages.
        </p>
      </div>

      {/* AI Scoring Funnel */}
      <div className="bg-card border border-border rounded-lg p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-medium text-dim uppercase tracking-wide">AI Scoring Funnel</h2>
        </div>
        <div className="space-y-2">
          {funnelData.map((step, i) => {
            const widthPct = maxCount > 0 ? Math.max((step.count / maxCount) * 100, 6) : 6;
            const isExpanded = expandedStep === step.key;
            return (
              <div key={step.key}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/ideas?filter=${step.filterParam}`}
                      className={`text-xs font-medium ${step.textColor} hover:underline underline-offset-2`}
                    >
                      {i === 0 ? '' : `Step ${i}: `}{step.label}
                    </Link>
                    {i > 0 && funnelData[i - 1].count > 0 && (
                      <span className="text-[10px] text-dim font-mono">
                        ({Math.round((step.count / funnelData[i - 1].count) * 100)}% pass)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/ideas?filter=${step.filterParam}`}
                      className={`text-lg font-mono font-semibold ${step.textColor} hover:underline`}
                    >
                      {step.count}
                    </Link>
                    {step.count > 0 && (
                      <button
                        onClick={() => setExpandedStep(isExpanded ? null : step.key)}
                        className="text-dim hover:text-muted transition-colors"
                        title={isExpanded ? 'Collapse' : 'Show ideas'}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d={isExpanded ? "M4 8l3-3 3 3" : "M4 6l3 3 3-3"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-center">
                  <Link
                    href={`/ideas?filter=${step.filterParam}`}
                    className={`block h-8 rounded-md bg-gradient-to-r ${step.color} border ${step.borderColor} transition-all duration-500 relative overflow-hidden hover:opacity-80`}
                    style={{ width: `${widthPct}%`, minWidth: '40px' }}
                  >
                    <div className={`absolute inset-y-0 left-0 ${step.barColor}/20`} style={{ width: '100%' }} />
                  </Link>
                </div>

                {/* Expanded idea list */}
                {isExpanded && step.ideas.length > 0 && (
                  <div className="mt-2 mb-1 space-y-1 max-h-48 overflow-y-auto">
                    {step.ideas.map(idea => (
                      <IdeaRow key={idea.id} idea={idea} />
                    ))}
                  </div>
                )}

                {i < funnelData.length - 1 && (
                  <div className="flex justify-center py-0.5">
                    <svg width="12" height="10" viewBox="0 0 12 10" className="text-border">
                      <path d="M6 0v6M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- Talk to Customers Separator ---- */}
      <div className="relative flex items-center my-6">
        <div className="flex-1 border-t-2 border-dashed border-amber-500/40" />
        <div className="flex items-center gap-2 px-4">
          <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">Talk to Customers</span>
          <button
            onClick={() => setShowManualStages(!showManualStages)}
            className="text-dim hover:text-muted transition-colors ml-1"
            title={showManualStages ? 'Hide manual stages' : 'Show manual stages'}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d={showManualStages ? "M4 10l4-4 4 4" : "M4 6l4 4 4-4"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="flex-1 border-t-2 border-dashed border-amber-500/40" />
      </div>

      {/* Manual Stages (collapsible) */}
      {showManualStages && (
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-medium text-dim uppercase tracking-wide">Manual Validation Stages</h2>
            <span className="text-[10px] text-dim">Move ideas between stages from the ideas list</span>
          </div>
          <div className="space-y-3">
            {MANUAL_STAGES.map((stage, i) => {
              const stageIdeas = manualStageCounts[stage.key] || [];
              const widthPct = maxManualCount > 0 ? Math.max((stageIdeas.length / maxManualCount) * 100, 6) : 6;
              const isExpanded = expandedStep === stage.key;
              return (
                <div key={stage.key}>
                  <div className="flex items-center justify-between mb-1">
                    <Link
                      href={`/ideas?filter=${stage.filterParam}`}
                      className={`text-xs font-medium ${stage.textColor} hover:underline underline-offset-2`}
                    >
                      {stage.label}
                    </Link>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/ideas?filter=${stage.filterParam}`}
                        className={`text-lg font-mono font-semibold ${stage.textColor} hover:underline`}
                      >
                        {stageIdeas.length}
                      </Link>
                      {stageIdeas.length > 0 && (
                        <button
                          onClick={() => setExpandedStep(isExpanded ? null : stage.key)}
                          className="text-dim hover:text-muted transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d={isExpanded ? "M4 8l3-3 3 3" : "M4 6l3 3 3-3"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Link
                      href={`/ideas?filter=${stage.filterParam}`}
                      className={`block h-8 rounded-md bg-gradient-to-r ${stage.color} border ${stage.borderColor} transition-all duration-500 hover:opacity-80`}
                      style={{ width: `${widthPct}%`, minWidth: '40px' }}
                    >
                      <span />
                    </Link>
                  </div>

                  {/* Expanded idea list with stage progression */}
                  {isExpanded && stageIdeas.length > 0 && (
                    <div className="mt-2 mb-1 space-y-1 max-h-48 overflow-y-auto">
                      {stageIdeas.map(idea => (
                        <IdeaRow key={idea.id} idea={idea} showProgressButtons />
                      ))}
                    </div>
                  )}

                  {i < MANUAL_STAGES.length - 1 && (
                    <div className="flex justify-center py-0.5">
                      <svg width="12" height="10" viewBox="0 0 12 10" className="text-border">
                        <path d="M6 0v6M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-dim text-xs mb-1">Total Ideas</p>
          <p className="text-text text-2xl font-mono font-semibold">{ideas.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-dim text-xs mb-1">Scored</p>
          <p className="text-text text-2xl font-mono font-semibold">
            {ideas.filter(i => i.total_score !== null).length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-dim text-xs mb-1">AI Survivors (All ≥8)</p>
          <p className="text-emerald-400 text-2xl font-mono font-semibold">{survivors.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-dim text-xs mb-1">Selected</p>
          <p className="text-emerald-400 text-2xl font-mono font-semibold">
            {(manualStageCounts['selected'] || []).length}
          </p>
        </div>
      </div>

      {/* Funnel Breakdown Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-text text-sm font-medium">Funnel Step Breakdown</h2>
        </div>
        <table className="w-full">
          <thead className="border-b border-border">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-dim">Step</th>
              <th className="text-center px-4 py-2.5 text-xs font-medium text-dim">Ideas</th>
              <th className="text-center px-4 py-2.5 text-xs font-medium text-dim">Drop-off</th>
              <th className="text-center px-4 py-2.5 text-xs font-medium text-dim">Pass Rate</th>
            </tr>
          </thead>
          <tbody>
            {funnelData.map((step, i) => {
              const prevCount = i > 0 ? funnelData[i - 1].count : step.count;
              const dropoff = prevCount - step.count;
              const passRate = prevCount > 0 ? Math.round((step.count / prevCount) * 100) : 100;
              return (
                <tr key={step.key} className="border-b border-border/50">
                  <td className="px-4 py-2.5">
                    <Link href={`/ideas?filter=${step.filterParam}`} className={`text-sm font-medium ${step.textColor} hover:underline`}>
                      {step.label}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-center text-sm font-mono text-text">{step.count}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-sm font-mono ${dropoff > 0 ? 'text-red-400' : 'text-dim'}`}>
                      {i === 0 ? '--' : `-${dropoff}`}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-sm font-mono ${passRate >= 50 ? 'text-emerald-400' : passRate >= 25 ? 'text-amber-400' : 'text-red-400'}`}>
                      {i === 0 ? '--' : `${passRate}%`}
                    </span>
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

/* ========== Idea Row (expandable in funnel) ========== */
function IdeaRow({ idea, showProgressButtons }: { idea: Idea; showProgressButtons?: boolean }) {
  const [updating, setUpdating] = useState(false);

  const progressTo = async (newStatus: IdeaStatus) => {
    setUpdating(true);
    await supabase.from('ideas').update({ status: newStatus }).eq('id', idea.id);
    setUpdating(false);
  };

  const statusOptions: { value: IdeaStatus; label: string }[] = [
    { value: 'brainstorm', label: 'Brainstorm' },
    { value: 'shortlist', label: 'Shortlist' },
    { value: 'deep_dive', label: 'Deep Dive' },
    { value: 'selected', label: 'Selected' },
    { value: 'killed', label: 'Kill' },
  ];

  return (
    <div className="flex items-center gap-3 bg-surface/30 rounded px-3 py-1.5 text-sm">
      <span className="text-text flex-1 truncate">{idea.name}</span>
      {idea.total_score !== null && (
        <span className="text-xs font-mono text-muted">{idea.total_score}/50</span>
      )}
      {showProgressButtons && !updating ? (
        <select
          value={idea.status}
          onChange={e => progressTo(e.target.value as IdeaStatus)}
          className="text-[10px] !py-0.5 !px-1.5 !bg-surface !border-border rounded cursor-pointer"
        >
          {statusOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : showProgressButtons && updating ? (
        <span className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      ) : (
        <Link href={`/ideas?filter=all`} className="text-[10px] text-accent hover:underline">View</Link>
      )}
    </div>
  );
}

/* ========== Dashboard Skeleton ========== */
function DashboardSkeleton() {
  return (
    <div className="max-w-5xl animate-pulse">
      <div className="mb-8">
        <div className="h-5 w-32 bg-surface rounded" />
        <div className="h-3 w-80 bg-surface rounded mt-2" />
      </div>
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="space-y-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-2">
                <div className="h-3 bg-surface rounded" style={{ width: `${80 + i * 20}px` }} />
                <div className="h-5 w-6 bg-surface rounded" />
              </div>
              <div className="flex justify-center">
                <div className="h-8 bg-surface/50 rounded-md" style={{ width: `${100 - i * 15}%`, minWidth: '40px' }} />
              </div>
              {i < 5 && <div className="flex justify-center py-1"><div className="w-4 h-3 bg-surface/30 rounded" /></div>}
            </div>
          ))}
        </div>
      </div>
      <div className="relative flex items-center my-6">
        <div className="flex-1 border-t-2 border-dashed border-surface" />
        <div className="px-4"><div className="h-3 w-32 bg-surface rounded" /></div>
        <div className="flex-1 border-t-2 border-dashed border-surface" />
      </div>
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-2">
                <div className="h-3 bg-surface rounded w-20" />
                <div className="h-5 w-6 bg-surface rounded" />
              </div>
              <div className="flex justify-center">
                <div className="h-8 bg-surface/50 rounded-md" style={{ width: `${60 - i * 15}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4">
            <div className="h-3 w-16 bg-surface rounded mb-2" />
            <div className="h-7 w-10 bg-surface rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
