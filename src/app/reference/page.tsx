'use client';

import { useState, useMemo } from 'react';
import { useReferenceStartups, useArchetypes } from '@/lib/useSupabase';
import { supabase } from '@/lib/supabase';
import { ReferenceStartup, Archetype } from '@/lib/types';
import Modal from '@/components/Modal';

export default function ReferencePage() {
  const { data: startups, loading: sLoading } = useReferenceStartups();
  const { data: archetypes, loading: aLoading } = useArchetypes();

  const [search, setSearch] = useState('');
  const [archetypeFilter, setArchetypeFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [interestFilter, setInterestFilter] = useState<string>('all');
  const [standoutFilter, setStandoutFilter] = useState<'all' | 'standouts' | 'other'>('all');
  const [detailStartup, setDetailStartup] = useState<ReferenceStartup | null>(null);
  const [detailArchetype, setDetailArchetype] = useState<Archetype | null>(null);

  const archetypeMap = useMemo(() => {
    return Object.fromEntries(archetypes.map(a => [a.id, a]));
  }, [archetypes]);

  const stages = useMemo(() => {
    const s = new Set(startups.map(st => st.stage).filter(Boolean));
    return Array.from(s).sort() as string[];
  }, [startups]);

  const industries = useMemo(() => {
    const s = new Set(startups.map(st => st.industry).filter(Boolean));
    return Array.from(s).sort() as string[];
  }, [startups]);

  const interests = useMemo(() => {
    const s = new Set(startups.map(st => st.interest).filter(Boolean));
    return Array.from(s).sort() as string[];
  }, [startups]);

  const standoutCount = useMemo(() => startups.filter(s => s.is_standout).length, [startups]);

  const filtered = useMemo(() => {
    let result = [...startups];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.company.toLowerCase().includes(q) ||
        s.one_liner?.toLowerCase().includes(q) ||
        s.industry?.toLowerCase().includes(q) ||
        s.key_investors?.toLowerCase().includes(q)
      );
    }
    if (archetypeFilter !== 'all') {
      result = result.filter(s => s.archetype_id === archetypeFilter);
    }
    if (stageFilter !== 'all') {
      result = result.filter(s => s.stage === stageFilter);
    }
    if (industryFilter !== 'all') {
      result = result.filter(s => s.industry === industryFilter);
    }
    if (interestFilter !== 'all') {
      result = result.filter(s => s.interest === interestFilter);
    }
    if (standoutFilter === 'standouts') {
      result = result.filter(s => s.is_standout);
    } else if (standoutFilter === 'other') {
      result = result.filter(s => !s.is_standout);
    }
    return result;
  }, [startups, search, archetypeFilter, stageFilter, industryFilter, interestFilter, standoutFilter]);

  const toggleStandout = async (startup: ReferenceStartup) => {
    await supabase.from('reference_startups').update({ is_standout: !startup.is_standout }).eq('id', startup.id);
  };

  const loading = sLoading || aLoading;

  if (loading) return (
    <div className="max-w-7xl animate-pulse">
      <div className="h-5 w-48 bg-surface rounded mb-2" />
      <div className="h-3 w-72 bg-surface rounded mb-6" />
      <div className="grid grid-cols-3 gap-3 mb-6">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 bg-surface rounded" />)}
      </div>
      <div className="h-10 bg-surface rounded mb-4" />
      <div className="bg-card border border-border rounded overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-b border-border/50 px-4 py-3 flex gap-4">
            <div className="h-3 w-32 bg-surface rounded" />
            <div className="h-3 flex-1 bg-surface rounded" />
            <div className="h-3 w-20 bg-surface rounded" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-text text-lg font-semibold">Reference Database</h1>
          <p className="text-muted text-sm mt-1">
            {startups.length} startups ({standoutCount} standouts) across {archetypes.length} archetypes
          </p>
        </div>
      </div>

      {/* Archetype Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {archetypes.map(arch => {
          const count = startups.filter(s => s.archetype_id === arch.id).length;
          const isActive = archetypeFilter === arch.id;
          return (
            <button
              key={arch.id}
              onClick={() => setArchetypeFilter(isActive ? 'all' : arch.id)}
              className={`text-left p-3 rounded border transition-colors ${
                isActive
                  ? 'bg-accent/10 border-accent/30'
                  : 'bg-card border-border hover:border-dim'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className={`text-xs font-medium truncate ${isActive ? 'text-accent' : 'text-text'}`}>
                  {arch.name}
                </h3>
                <span className="text-xs font-mono text-dim flex-shrink-0">{count}</span>
              </div>
              <p className="text-[11px] text-dim mt-1">{arch.total_capital} raised</p>
              <button
                onClick={(e) => { e.stopPropagation(); setDetailArchetype(arch); }}
                className="text-[11px] text-accent/60 hover:text-accent mt-1"
              >
                Details
              </button>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 max-w-xs"
          placeholder="Search companies, industries, investors..."
        />
        <div className="flex items-center gap-1.5">
          {(['all', 'standouts', 'other'] as const).map(f => (
            <button
              key={f}
              onClick={() => setStandoutFilter(f)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                standoutFilter === f
                  ? 'bg-accent/15 text-accent border border-accent/30'
                  : 'text-dim hover:text-muted bg-surface/50 border border-transparent hover:border-border'
              }`}
            >
              {f === 'all' ? `All (${startups.length})` : f === 'standouts' ? `Standouts (${standoutCount})` : `Other (${startups.length - standoutCount})`}
            </button>
          ))}
        </div>
        <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)} className="text-xs">
          <option value="all">All Industries</option>
          {industries.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className="text-xs">
          <option value="all">All Stages</option>
          {stages.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {interests.length > 0 && (
          <select value={interestFilter} onChange={e => setInterestFilter(e.target.value)} className="text-xs">
            <option value="all">All Interests</option>
            {interests.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-dim mb-3">
        Showing {filtered.length} of {startups.length} startups
        {standoutFilter !== 'all' && <span className="text-accent ml-1">({standoutFilter})</span>}
      </p>

      {/* Table */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-dim w-8"></th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-dim">Company</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-dim">Industry</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-dim min-w-[200px]">Description</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-dim">Stage</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-dim">Raised</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-dim">Key Investors</th>
                <th className="text-center px-3 py-2.5 text-xs font-medium text-dim w-10">Info</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(startup => (
                <tr
                  key={startup.id}
                  className={`border-b border-border/50 hover:bg-surface/50 transition-colors ${
                    startup.is_standout ? 'bg-accent/[0.04]' : ''
                  }`}
                >
                  <td className="px-3 py-2">
                    <button
                      onClick={() => toggleStandout(startup)}
                      className={`w-5 h-5 rounded flex items-center justify-center text-xs transition-colors ${
                        startup.is_standout
                          ? 'bg-accent/20 text-accent'
                          : 'bg-surface/60 text-dim/40 hover:text-dim'
                      }`}
                      title={startup.is_standout ? 'Remove standout' : 'Mark as standout'}
                    >
                      {startup.is_standout ? '\u2605' : '\u2606'}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-sm text-text font-medium">{startup.company}</span>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted">{startup.industry || '--'}</td>
                  <td className="px-3 py-2 text-xs text-muted max-w-[300px]">
                    {startup.one_liner || '--'}
                  </td>
                  <td className="px-3 py-2 text-xs text-dim">{startup.stage || '--'}</td>
                  <td className="px-3 py-2 text-xs text-dim font-mono">{startup.amount_raised || '--'}</td>
                  <td className="px-3 py-2 text-xs text-dim truncate max-w-[180px]">{startup.key_investors || '--'}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => setDetailStartup(startup)}
                      className="text-xs text-accent/60 hover:text-accent transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-dim text-sm">
                    No startups match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Startup Detail Modal */}
      {detailStartup && (
        <Modal open={!!detailStartup} onClose={() => setDetailStartup(null)} title={detailStartup.company}>
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {detailStartup.industry && <span className="text-xs text-muted bg-surface px-2 py-0.5 rounded">{detailStartup.industry}</span>}
              {detailStartup.stage && <span className="text-xs text-muted bg-surface px-2 py-0.5 rounded">{detailStartup.stage}</span>}
              {detailStartup.archetype_id && archetypeMap[detailStartup.archetype_id] && (
                <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded">
                  {archetypeMap[detailStartup.archetype_id].name}
                </span>
              )}
              <button
                onClick={() => toggleStandout(detailStartup)}
                className={`text-xs px-2 py-0.5 rounded transition-colors ${
                  detailStartup.is_standout
                    ? 'bg-accent/15 text-accent'
                    : 'bg-surface text-dim hover:text-muted'
                }`}
              >
                {detailStartup.is_standout ? '\u2605 Standout' : '\u2606 Mark Standout'}
              </button>
            </div>
            {detailStartup.one_liner && <p className="text-sm text-muted">{detailStartup.one_liner}</p>}
            <div className="grid grid-cols-2 gap-3">
              <InfoRow label="Amount Raised" value={detailStartup.amount_raised} />
              <InfoRow label="Key Investors" value={detailStartup.key_investors} />
              <InfoRow label="ARR / Revenue" value={detailStartup.arr_revenue} />
              <InfoRow label="Key Traction" value={detailStartup.key_traction} />
              <InfoRow label="Score" value={detailStartup.score !== null ? String(detailStartup.score) : null} />
              <InfoRow label="Interest" value={detailStartup.interest} />
            </div>
            {detailStartup.latest_news && (
              <div>
                <p className="text-[10px] text-dim uppercase tracking-wide mb-1">Latest News</p>
                <p className="text-sm text-muted">{detailStartup.latest_news}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Archetype Detail Modal */}
      {detailArchetype && (
        <Modal open={!!detailArchetype} onClose={() => setDetailArchetype(null)} title={detailArchetype.name} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <InfoRow label="Number of Startups" value={detailArchetype.num_startups !== null ? String(detailArchetype.num_startups) : null} />
              <InfoRow label="Total Capital" value={detailArchetype.total_capital} />
              <InfoRow label="Top Investors" value={detailArchetype.top_investors} />
            </div>
            {detailArchetype.investor_thesis && (
              <div>
                <p className="text-[10px] text-dim uppercase tracking-wide mb-1">Investor Thesis</p>
                <p className="text-sm text-muted">{detailArchetype.investor_thesis}</p>
              </div>
            )}
            {detailArchetype.why_hot && (
              <div>
                <p className="text-[10px] text-dim uppercase tracking-wide mb-1">Why Hot</p>
                <p className="text-sm text-muted">{detailArchetype.why_hot}</p>
              </div>
            )}
            {detailArchetype.relevance_to_caddy && (
              <div>
                <p className="text-[10px] text-dim uppercase tracking-wide mb-1">Relevance to Caddy</p>
                <p className="text-sm text-muted">{detailArchetype.relevance_to_caddy}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[10px] text-dim uppercase tracking-wide">{label}</p>
      <p className="text-sm text-muted mt-0.5">{value || '--'}</p>
    </div>
  );
}
