'use client';

import { useMemo } from 'react';
import { useIdeas } from '@/lib/useSupabase';
import { Idea } from '@/lib/types';

const FUNNEL_STEPS = [
  { key: 'all', label: 'All Ideas', criterion: null, color: 'from-violet-500/30 to-violet-500/10', barColor: 'bg-violet-500', textColor: 'text-violet-400', borderColor: 'border-violet-500/30' },
  { key: 'tam', label: 'TAM ≥ 8', criterion: 'tam_score' as const, color: 'from-blue-500/30 to-blue-500/10', barColor: 'bg-blue-500', textColor: 'text-blue-400', borderColor: 'border-blue-500/30' },
  { key: 'competition', label: 'Competition ≥ 8', criterion: 'competition_score' as const, color: 'from-cyan-500/30 to-cyan-500/10', barColor: 'bg-cyan-500', textColor: 'text-cyan-400', borderColor: 'border-cyan-500/30' },
  { key: 'severity', label: 'Problem Severity ≥ 8', criterion: 'problem_severity_score' as const, color: 'from-accent/30 to-accent/10', barColor: 'bg-accent', textColor: 'text-accent', borderColor: 'border-accent/30' },
  { key: 'fit', label: 'Market-Founder Fit ≥ 8', criterion: 'market_founder_fit_score' as const, color: 'from-amber-500/30 to-amber-500/10', barColor: 'bg-amber-500', textColor: 'text-amber-400', borderColor: 'border-amber-500/30' },
  { key: 'execution', label: 'Execution Difficulty ≥ 8', criterion: 'execution_difficulty_score' as const, color: 'from-emerald-500/30 to-emerald-500/10', barColor: 'bg-emerald-500', textColor: 'text-emerald-400', borderColor: 'border-emerald-500/30' },
];

type CriterionKey = 'tam_score' | 'competition_score' | 'problem_severity_score' | 'market_founder_fit_score' | 'execution_difficulty_score';

export default function Dashboard() {
  const { data: ideas, loading } = useIdeas();

  // Build cascading funnel: each step filters ideas that pass ALL previous criteria ≥ 8
  const funnelData = useMemo(() => {
    const criteria: CriterionKey[] = [];
    return FUNNEL_STEPS.map(step => {
      if (step.criterion) {
        criteria.push(step.criterion);
      }
      const currentCriteria = [...criteria];
      const passing = ideas.filter(idea => {
        if (idea.total_score === null) return currentCriteria.length === 0; // unscored only in 'all'
        return currentCriteria.every(c => (idea[c] || 0) >= 8);
      });
      return { ...step, ideas: passing, count: passing.length };
    });
  }, [ideas]);

  // Survivors = ideas that pass ALL 5 criteria ≥ 8
  const survivors = funnelData[funnelData.length - 1]?.ideas || [];

  if (loading) {
    return <DashboardSkeleton />;
  }

  const maxCount = Math.max(...funnelData.map(s => s.count), 1);

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-text text-lg font-semibold">Idea Funnel</h1>
        <p className="text-muted text-sm mt-1">
          Ideas are filtered through cascading ≥8 score thresholds. Each step requires ALL previous criteria to also be ≥8.
        </p>
      </div>

      {/* Funnel Visualization */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="space-y-3">
          {funnelData.map((step, i) => {
            const widthPct = maxCount > 0 ? Math.max((step.count / maxCount) * 100, 6) : 6;
            return (
              <div key={step.key} className="group">
                {/* Step Label */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${step.textColor}`}>
                      {i === 0 ? '' : `Step ${i}: `}{step.label}
                    </span>
                    {i > 0 && funnelData[i - 1].count > 0 && (
                      <span className="text-[10px] text-dim font-mono">
                        ({Math.round((step.count / funnelData[i - 1].count) * 100)}% pass)
                      </span>
                    )}
                  </div>
                  <span className={`text-lg font-mono font-semibold ${step.textColor}`}>
                    {step.count}
                  </span>
                </div>

                {/* Funnel Bar */}
                <div className="flex justify-center">
                  <div
                    className={`h-10 rounded-md bg-gradient-to-r ${step.color} border ${step.borderColor} transition-all duration-500 relative overflow-hidden`}
                    style={{ width: `${widthPct}%`, minWidth: '40px' }}
                  >
                    <div
                      className={`absolute inset-y-0 left-0 ${step.barColor}/20 transition-all duration-500`}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                {/* Connector Arrow */}
                {i < funnelData.length - 1 && (
                  <div className="flex justify-center py-1">
                    <svg width="16" height="12" viewBox="0 0 16 12" className="text-border">
                      <path d="M8 0v8M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-dim text-xs mb-1">Total Ideas</p>
          <p className="text-text text-2xl font-mono font-semibold">{ideas.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-dim text-xs mb-1">Scored Ideas</p>
          <p className="text-text text-2xl font-mono font-semibold">
            {ideas.filter(i => i.total_score !== null).length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-dim text-xs mb-1">Survivors (All ≥8)</p>
          <p className="text-emerald-400 text-2xl font-mono font-semibold">{survivors.length}</p>
        </div>
      </div>

      {/* Survivors List */}
      {survivors.length > 0 && (
        <div className="bg-card border border-emerald-500/30 rounded-lg p-5 mb-6">
          <h2 className="text-emerald-400 text-sm font-medium mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Funnel Survivors — All 5 Criteria ≥ 8
          </h2>
          <div className="space-y-3">
            {survivors.map(idea => (
              <SurvivorRow key={idea.id} idea={idea} />
            ))}
          </div>
        </div>
      )}

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
                    <span className={`text-sm font-medium ${step.textColor}`}>{step.label}</span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="text-sm font-mono text-text">{step.count}</span>
                  </td>
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

function SurvivorRow({ idea }: { idea: Idea }) {
  return (
    <div className="flex items-center gap-4 bg-surface/50 rounded px-4 py-3">
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-text truncate">{idea.name}</h3>
        {idea.description && (
          <p className="text-xs text-muted mt-0.5 truncate">{idea.description}</p>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <ScorePill label="TAM" value={idea.tam_score} />
        <ScorePill label="Comp" value={idea.competition_score} />
        <ScorePill label="Sev" value={idea.problem_severity_score} />
        <ScorePill label="Fit" value={idea.market_founder_fit_score} />
        <ScorePill label="Exec" value={idea.execution_difficulty_score} />
        <div className="pl-2 border-l border-border">
          <span className="text-emerald-400 font-mono font-semibold text-sm">{idea.total_score}</span>
          <span className="text-dim text-[10px] font-mono">/50</span>
        </div>
      </div>
    </div>
  );
}

function ScorePill({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] text-dim">{label}</span>
      <span className={`text-xs font-mono font-medium ${
        (value || 0) >= 8 ? 'text-emerald-400' : 'text-amber-400'
      }`}>
        {value ?? '-'}
      </span>
    </div>
  );
}

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
                <div
                  className="h-10 bg-surface/50 rounded-md"
                  style={{ width: `${100 - i * 15}%`, minWidth: '40px' }}
                />
              </div>
              {i < 5 && (
                <div className="flex justify-center py-1">
                  <div className="w-4 h-3 bg-surface/30 rounded" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4">
            <div className="h-3 w-20 bg-surface rounded mb-2" />
            <div className="h-7 w-12 bg-surface rounded" />
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <div className="h-4 w-40 bg-surface rounded" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-4 py-3 border-b border-border/50 flex items-center gap-8">
            <div className="h-3 bg-surface rounded" style={{ width: `${100 + i * 10}px` }} />
            <div className="h-3 w-8 bg-surface rounded" />
            <div className="h-3 w-8 bg-surface rounded" />
            <div className="h-3 w-10 bg-surface rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
