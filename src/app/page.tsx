'use client';

import { useMemo, useState } from 'react';
import { useIdeas, useArchetypes } from '@/lib/useSupabase';
import { supabase } from '@/lib/supabase';
import { Idea, IdeaStatus } from '@/lib/types';
import { useFilterThresholds, FUNNEL_STEPS, isScored, formatTAM, formatMonths, FilterThresholds } from '@/lib/filterConfig';
import Link from 'next/link';

const FUNNEL_COLORS = [
  { color: 'from-violet-500/20 to-violet-500/5', barColor: 'bg-violet-500', textColor: 'text-violet-700', borderColor: 'border-violet-500/30' },
  { color: 'from-blue-500/20 to-blue-500/5', barColor: 'bg-blue-500', textColor: 'text-blue-700', borderColor: 'border-blue-500/30' },
  { color: 'from-teal-500/20 to-teal-500/5', barColor: 'bg-teal-500', textColor: 'text-teal-700', borderColor: 'border-teal-500/30' },
  { color: 'from-accent/20 to-accent/5', barColor: 'bg-accent', textColor: 'text-accent', borderColor: 'border-accent/30' },
  { color: 'from-amber-500/20 to-amber-500/5', barColor: 'bg-amber-500', textColor: 'text-amber-700', borderColor: 'border-amber-500/30' },
  { color: 'from-emerald-500/20 to-emerald-500/5', barColor: 'bg-emerald-500', textColor: 'text-emerald-700', borderColor: 'border-emerald-500/30' },
  // Talk to users steps
  { color: 'from-sky-500/20 to-sky-500/5', barColor: 'bg-sky-500', textColor: 'text-sky-700', borderColor: 'border-sky-500/30' },
  { color: 'from-orange-500/20 to-orange-500/5', barColor: 'bg-orange-500', textColor: 'text-orange-700', borderColor: 'border-orange-500/30' },
  { color: 'from-rose-500/20 to-rose-500/5', barColor: 'bg-rose-500', textColor: 'text-rose-700', borderColor: 'border-rose-500/30' },
];

export default function Dashboard() {
  const { data: ideas, loading } = useIdeas();
  const { data: archetypes } = useArchetypes();
  const { thresholds, updateThreshold, resetToDefaults } = useFilterThresholds();
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const archetypeMap = useMemo(() => {
    return Object.fromEntries(archetypes.map(a => [a.id, a.name]));
  }, [archetypes]);

  // Build cascading funnel data
  const funnelData = useMemo(() => {
    // Start with "All Ideas"
    const allStep = {
      key: 'all',
      label: 'All Ideas',
      phase: 'all' as const,
      ideas: ideas,
      count: ideas.length,
      ...FUNNEL_COLORS[0],
    };

    const filters: ((i: Idea, t: FilterThresholds) => boolean)[] = [];
    const steps = FUNNEL_STEPS.map((step, idx) => {
      filters.push(step.filter);
      const currentFilters = [...filters];
      const passing = ideas.filter(idea => {
        if (!isScored(idea)) return false;
        return currentFilters.every(fn => fn(idea, thresholds));
      });
      return {
        key: step.key,
        label: step.label(thresholds),
        phase: step.phase,
        ideas: passing,
        count: passing.length,
        ...(FUNNEL_COLORS[idx + 1] || FUNNEL_COLORS[FUNNEL_COLORS.length - 1]),
      };
    });

    return [allStep, ...steps];
  }, [ideas, thresholds]);

  // Split into desktop research and talk to users phases
  const desktopSteps = funnelData.filter(s => s.key === 'all' || FUNNEL_STEPS.find(f => f.key === s.key)?.phase === 'desktop_research');
  const talkSteps = funnelData.filter(s => FUNNEL_STEPS.find(f => f.key === s.key)?.phase === 'talk_to_users');

  const survivors = funnelData[funnelData.length - 1]?.ideas || [];

  if (loading) return <DashboardSkeleton />;

  const maxCount = Math.max(...funnelData.map(s => s.count), 1);

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-text text-lg font-semibold">Idea Funnel</h1>
          <p className="text-muted text-sm mt-1">
            Ideas are filtered through adjustable thresholds, then validated through user conversations.
          </p>
        </div>
        <button
          onClick={() => setShowSettings(s => !s)}
          className="px-3 py-1.5 text-xs text-muted border border-border rounded hover:text-text hover:border-dim transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          {showSettings ? 'Hide' : 'Filter'} Settings
        </button>
      </div>

      {/* Filter Threshold Settings */}
      {showSettings && (
        <FilterSettings thresholds={thresholds} updateThreshold={updateThreshold} resetToDefaults={resetToDefaults} />
      )}

      {/* Desktop Research Funnel */}
      <div className="bg-card border border-border rounded-lg p-6 mb-4">
        <h2 className="text-xs font-medium text-dim uppercase tracking-wide mb-4">Desktop Research</h2>
        <div className="space-y-2">
          {desktopSteps.map((step, i) => {
            const widthPct = maxCount > 0 ? Math.max((step.count / maxCount) * 100, 6) : 6;
            const isExpanded = expandedStep === step.key;
            const prevCount = i > 0 ? desktopSteps[i - 1].count : step.count;
            return (
              <div key={step.key}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/ideas?filter=${step.key}`}
                      className={`text-xs font-medium ${step.textColor} hover:underline underline-offset-2`}
                    >
                      {i === 0 ? '' : `Step ${i}: `}{step.label}
                    </Link>
                    {i > 0 && prevCount > 0 && (
                      <span className="text-[10px] text-dim font-mono">
                        ({Math.round((step.count / prevCount) * 100)}% pass)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/ideas?filter=${step.key}`}
                      className={`text-lg font-mono font-semibold ${step.textColor} hover:underline`}
                    >
                      {step.count}
                    </Link>
                    {step.count > 0 && (
                      <button
                        onClick={() => setExpandedStep(isExpanded ? null : step.key)}
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
                    href={`/ideas?filter=${step.key}`}
                    className={`block h-8 rounded-md bg-gradient-to-r ${step.color} border ${step.borderColor} transition-all duration-500 hover:opacity-80`}
                    style={{ width: `${widthPct}%`, minWidth: '40px' }}
                  >
                    <span />
                  </Link>
                </div>

                {isExpanded && step.ideas.length > 0 && (
                  <div className="mt-2 mb-1 space-y-1 max-h-48 overflow-y-auto">
                    {step.ideas.map(idea => (
                      <IdeaRow key={idea.id} idea={idea} archetypeMap={archetypeMap} />
                    ))}
                  </div>
                )}

                {i < desktopSteps.length - 1 && (
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

      {/* Talk to Users Separator */}
      <div className="relative flex items-center my-6">
        <div className="flex-1 border-t-2 border-dashed border-amber-500/40" />
        <div className="flex items-center gap-2 px-4">
          <span className="text-xs font-medium text-amber-700 uppercase tracking-wider">Talk to Users</span>
        </div>
        <div className="flex-1 border-t-2 border-dashed border-amber-500/40" />
      </div>

      {/* Talk to Users Funnel */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 className="text-xs font-medium text-dim uppercase tracking-wide mb-4">User Validation</h2>
        <div className="space-y-3">
          {talkSteps.map((step, i) => {
            const maxTalk = Math.max(...talkSteps.map(s => s.count), 1);
            const widthPct = maxTalk > 0 ? Math.max((step.count / maxTalk) * 100, 6) : 6;
            const isExpanded = expandedStep === step.key;
            const prevCount = i > 0 ? talkSteps[i - 1].count : (desktopSteps[desktopSteps.length - 1]?.count || step.count);
            return (
              <div key={step.key}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/ideas?filter=${step.key}`}
                      className={`text-xs font-medium ${step.textColor} hover:underline underline-offset-2`}
                    >
                      Step {desktopSteps.length + i}: {step.label}
                    </Link>
                    {prevCount > 0 && (
                      <span className="text-[10px] text-dim font-mono">
                        ({Math.round((step.count / prevCount) * 100)}% pass)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/ideas?filter=${step.key}`}
                      className={`text-lg font-mono font-semibold ${step.textColor} hover:underline`}
                    >
                      {step.count}
                    </Link>
                    {step.count > 0 && (
                      <button
                        onClick={() => setExpandedStep(isExpanded ? null : step.key)}
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
                    href={`/ideas?filter=${step.key}`}
                    className={`block h-8 rounded-md bg-gradient-to-r ${step.color} border ${step.borderColor} transition-all duration-500 hover:opacity-80`}
                    style={{ width: `${widthPct}%`, minWidth: '40px' }}
                  >
                    <span />
                  </Link>
                </div>

                {isExpanded && step.ideas.length > 0 && (
                  <div className="mt-2 mb-1 space-y-1 max-h-48 overflow-y-auto">
                    {step.ideas.map(idea => (
                      <IdeaRow key={idea.id} idea={idea} archetypeMap={archetypeMap} showProgressButtons />
                    ))}
                  </div>
                )}

                {i < talkSteps.length - 1 && (
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

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-dim text-xs mb-1">Total Ideas</p>
          <p className="text-text text-2xl font-mono font-semibold">{ideas.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-dim text-xs mb-1">Scored</p>
          <p className="text-text text-2xl font-mono font-semibold">
            {ideas.filter(i => isScored(i)).length}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-dim text-xs mb-1">Pass All Filters</p>
          <p className="text-emerald-700 text-2xl font-mono font-semibold">{survivors.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-dim text-xs mb-1">Selected</p>
          <p className="text-emerald-700 text-2xl font-mono font-semibold">
            {ideas.filter(i => i.status === 'selected').length}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ========== Filter Settings Panel ========== */
function FilterSettings({
  thresholds, updateThreshold, resetToDefaults,
}: {
  thresholds: FilterThresholds;
  updateThreshold: <K extends keyof FilterThresholds>(key: K, value: FilterThresholds[K]) => void;
  resetToDefaults: () => void;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text">Filter Thresholds</h3>
        <button onClick={resetToDefaults} className="text-xs text-muted hover:text-accent transition-colors">
          Reset to defaults
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="text-xs text-dim block mb-1">TAM minimum</label>
          <select
            value={thresholds.tam_min_billions}
            onChange={e => updateThreshold('tam_min_billions', Number(e.target.value))}
            className="w-full text-sm"
          >
            <option value={0.5}>$500M</option>
            <option value={1}>$1B</option>
            <option value={5}>$5B</option>
            <option value={10}>$10B</option>
            <option value={50}>$50B</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-dim block mb-1">Competition allows</label>
          <select
            value={thresholds.competition_allowed.join(',')}
            onChange={e => updateThreshold('competition_allowed', e.target.value.split(',') as FilterThresholds['competition_allowed'])}
            className="w-full text-sm"
          >
            <option value="Low">Low only</option>
            <option value="Low,Medium">Low + Medium</option>
            <option value="Low,Medium,High">All</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-dim block mb-1">Problem Severity min</label>
          <select
            value={thresholds.problem_severity_min}
            onChange={e => updateThreshold('problem_severity_min', Number(e.target.value))}
            className="w-full text-sm"
          >
            {[6, 7, 8, 9, 10].map(v => <option key={v} value={v}>&ge; {v}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-dim block mb-1">MF Fit min</label>
          <select
            value={thresholds.market_founder_fit_min}
            onChange={e => updateThreshold('market_founder_fit_min', Number(e.target.value))}
            className="w-full text-sm"
          >
            {[6, 7, 8, 9, 10].map(v => <option key={v} value={v}>&ge; {v}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-dim block mb-1">Exec Difficulty max</label>
          <select
            value={thresholds.execution_difficulty_max}
            onChange={e => updateThreshold('execution_difficulty_max', Number(e.target.value))}
            className="w-full text-sm"
          >
            {[3, 4, 5, 6, 7, 8].map(v => <option key={v} value={v}>&le; {v}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-dim block mb-1">$100M ARR max time</label>
          <select
            value={thresholds.time_to_100m_arr_max_months}
            onChange={e => updateThreshold('time_to_100m_arr_max_months', Number(e.target.value))}
            className="w-full text-sm"
          >
            <option value={24}>2 years</option>
            <option value={36}>3 years</option>
            <option value={48}>4 years</option>
            <option value={60}>5 years</option>
            <option value={84}>7 years</option>
            <option value={120}>10 years</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-dim block mb-1">2nd Buyer min</label>
          <select
            value={thresholds.second_buyer_min}
            onChange={e => updateThreshold('second_buyer_min', Number(e.target.value))}
            className="w-full text-sm"
          >
            {[6, 7, 8, 9, 10].map(v => <option key={v} value={v}>&ge; {v}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-dim block mb-1">Passion min</label>
          <select
            value={thresholds.passion_min}
            onChange={e => updateThreshold('passion_min', Number(e.target.value))}
            className="w-full text-sm"
          >
            {[6, 7, 8, 9, 10].map(v => <option key={v} value={v}>&ge; {v}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

/* ========== Idea Row (with hover tooltip) ========== */
function IdeaRow({ idea, archetypeMap, showProgressButtons }: { idea: Idea; archetypeMap: Record<string, string>; showProgressButtons?: boolean }) {
  const [updating, setUpdating] = useState(false);
  const [hovering, setHovering] = useState(false);

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
    <div
      className="relative flex items-center gap-3 bg-surface/30 rounded px-3 py-1.5 text-sm"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
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
        <Link href="/ideas?filter=all" className="text-[10px] text-accent hover:underline">View</Link>
      )}

      {/* Hover Tooltip */}
      {hovering && (
        <div className="absolute left-0 top-full mt-1 z-50 w-80 bg-card border border-border rounded-lg shadow-lg shadow-black/10 p-3 pointer-events-none">
          <p className="text-xs font-medium text-text mb-1 truncate">{idea.name}</p>
          {idea.description && <p className="text-[11px] text-muted mb-2 line-clamp-2">{idea.description}</p>}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
            {idea.vertical && <span className="text-dim">Vertical: <span className="text-muted">{idea.vertical}</span></span>}
            {idea.archetype_id && archetypeMap[idea.archetype_id] && (
              <span className="text-dim">Archetype: <span className="text-muted">{archetypeMap[idea.archetype_id]}</span></span>
            )}
            {idea.tam_estimate_billions !== null && <span className="text-dim">TAM: <span className="text-muted">{formatTAM(idea.tam_estimate_billions)}</span></span>}
            {idea.competition_level && <span className="text-dim">Comp: <span className="text-muted">{idea.competition_level}</span></span>}
            {idea.time_to_100m_arr_months !== null && <span className="text-dim">$100M ARR: <span className="text-muted">{formatMonths(idea.time_to_100m_arr_months)}</span></span>}
            {idea.second_buyer_name && <span className="text-dim">2nd Buyer: <span className="text-muted">{idea.second_buyer_name}</span></span>}
          </div>
        </div>
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
