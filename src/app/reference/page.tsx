'use client';

import { useState, useMemo, useCallback } from 'react';
import { useReferenceStartups, useArchetypes } from '@/lib/useSupabase';
import { supabase } from '@/lib/supabase';
import { ReferenceStartup, Archetype } from '@/lib/types';
import Modal from '@/components/Modal';

const PAGE_SIZE = 100;

function formatNumber(value: string | null): string {
  if (!value) return '--';
  return value.replace(/\d+(\.\d+)?/g, (match) => {
    const parts = match.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  });
}

type SortKey = 'company' | 'industry' | 'stage' | 'score' | 'archetype';
type SortDir = 'asc' | 'desc';

export default function ReferencePage() {
  const { data: startups, setData: setStartups, loading: sLoading } = useReferenceStartups();
  const { data: archetypes, loading: aLoading } = useArchetypes();

  const [search, setSearch] = useState('');
  const [archetypeFilter, setArchetypeFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [interestFilter, setInterestFilter] = useState<string>('all');
  const [standoutFilter, setStandoutFilter] = useState<'all' | 'standouts' | 'other'>('all');
  const [detailStartup, setDetailStartup] = useState<ReferenceStartup | null>(null);
  const [detailArchetype, setDetailArchetype] = useState<Archetype | null>(null);
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const archetypeMap = useMemo(() => {
    return Object.fromEntries(archetypes.map(a => [a.id, a]));
  }, [archetypes]);

  // ─── Filter chain ───────────────────────────────────────────────
  // Step 1: Apply standout filter to get the "universe" for archetype cards
  // This ensures card counts match what users actually see
  const afterStandout = useMemo(() => {
    if (standoutFilter === 'standouts') return startups.filter(s => s.is_standout);
    if (standoutFilter === 'other') return startups.filter(s => !s.is_standout);
    return startups;
  }, [startups, standoutFilter]);

  // Step 2: Apply search on top of standout
  const afterSearch = useMemo(() => {
    if (!search.trim()) return afterStandout;
    const q = search.toLowerCase().trim();
    return afterStandout.filter(s =>
      s.company.toLowerCase().includes(q) ||
      (s.one_liner && s.one_liner.toLowerCase().includes(q)) ||
      (s.industry && s.industry.toLowerCase().includes(q)) ||
      (s.key_investors && s.key_investors.toLowerCase().includes(q))
    );
  }, [afterStandout, search]);

  // Step 3: Archetype card counts — from afterStandout (not search, so cards stay stable while typing)
  const archetypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of afterStandout) {
      if (s.archetype_id) {
        counts[s.archetype_id] = (counts[s.archetype_id] || 0) + 1;
      }
    }
    return counts;
  }, [afterStandout]);

  // Total & standout counts (always from raw data, for header stats)
  const standoutCount = useMemo(() => startups.filter(s => s.is_standout).length, [startups]);

  // Step 4: Apply archetype filter
  const afterArchetype = useMemo(() => {
    if (archetypeFilter === 'all') return afterSearch;
    return afterSearch.filter(s => s.archetype_id === archetypeFilter);
  }, [afterSearch, archetypeFilter]);

  // Step 5: Derive dropdown options from afterArchetype
  // (so options reflect standout + search + archetype, but NOT other dropdowns to avoid circular deps)
  const stages = useMemo(() => {
    const s = new Set(afterArchetype.map(st => st.stage).filter(Boolean));
    return Array.from(s).sort() as string[];
  }, [afterArchetype]);

  const industries = useMemo(() => {
    const s = new Set(afterArchetype.map(st => st.industry).filter(Boolean));
    return Array.from(s).sort() as string[];
  }, [afterArchetype]);

  const interests = useMemo(() => {
    const s = new Set(afterArchetype.map(st => st.interest).filter(Boolean));
    return Array.from(s).sort() as string[];
  }, [afterArchetype]);

  // Step 6: Apply remaining filters (stage, industry, interest)
  const filtered = useMemo(() => {
    let result = afterArchetype;
    if (stageFilter !== 'all') {
      result = result.filter(s => s.stage === stageFilter);
    }
    if (industryFilter !== 'all') {
      result = result.filter(s => s.industry === industryFilter);
    }
    if (interestFilter !== 'all') {
      result = result.filter(s => s.interest === interestFilter);
    }
    return result;
  }, [afterArchetype, stageFilter, industryFilter, interestFilter]);

  // Step 7: Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => {
      let aVal: string | number | null = null;
      let bVal: string | number | null = null;
      switch (sortKey) {
        case 'company': aVal = a.company.toLowerCase(); bVal = b.company.toLowerCase(); break;
        case 'industry': aVal = (a.industry || '').toLowerCase(); bVal = (b.industry || '').toLowerCase(); break;
        case 'stage': aVal = (a.stage || '').toLowerCase(); bVal = (b.stage || '').toLowerCase(); break;
        case 'score': aVal = a.score ?? -1; bVal = b.score ?? -1; break;
        case 'archetype': {
          aVal = (a.archetype_id && archetypeMap[a.archetype_id]?.name || '').toLowerCase();
          bVal = (b.archetype_id && archetypeMap[b.archetype_id]?.name || '').toLowerCase();
          break;
        }
      }
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir, archetypeMap]);

  // Step 8: Paginate
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = useMemo(() => {
    const start = page * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, page]);

  // ─── Actions ────────────────────────────────────────────────────

  const handleSort = useCallback((key: SortKey) => {
    setSortKey(prev => {
      if (prev === key) {
        setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        return key;
      }
      setSortDir('asc');
      return key;
    });
    setPage(0);
  }, []);

  const clearAllFilters = useCallback(() => {
    setArchetypeFilter('all');
    setStageFilter('all');
    setIndustryFilter('all');
    setInterestFilter('all');
    setStandoutFilter('all');
    setSearch('');
    setPage(0);
    setSortKey(null);
  }, []);

  // When clicking an archetype card, reset sub-filters but preserve standout + search
  const handleArchetypeClick = useCallback((archId: string) => {
    setArchetypeFilter(prev => prev === archId ? 'all' : archId);
    setStageFilter('all');
    setIndustryFilter('all');
    setInterestFilter('all');
    setPage(0);
  }, []);

  const handleStandoutClick = useCallback((f: 'all' | 'standouts' | 'other') => {
    setStandoutFilter(f);
    // Reset sub-filters since the available options change
    setStageFilter('all');
    setIndustryFilter('all');
    setInterestFilter('all');
    setPage(0);
  }, []);

  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    setPage(0);
  }, []);

  // Optimistic standout toggle
  const toggleStandout = useCallback(async (startup: ReferenceStartup) => {
    const newValue = !startup.is_standout;
    setStartups(prev => prev.map(s => s.id === startup.id ? { ...s, is_standout: newValue } : s));
    if (detailStartup?.id === startup.id) {
      setDetailStartup(prev => prev ? { ...prev, is_standout: newValue } : null);
    }
    await supabase.from('reference_startups').update({ is_standout: newValue }).eq('id', startup.id);
  }, [setStartups, detailStartup]);

  // ─── Computed UI state ──────────────────────────────────────────
  const hasAnyFilter = archetypeFilter !== 'all' || stageFilter !== 'all' || industryFilter !== 'all' || interestFilter !== 'all' || standoutFilter !== 'all' || search.trim();

  // Context-aware standout button counts (reflect archetype if selected)
  const standoutButtonCounts = useMemo(() => {
    const base = archetypeFilter !== 'all'
      ? startups.filter(s => s.archetype_id === archetypeFilter)
      : startups;
    const total = base.length;
    const standouts = base.filter(s => s.is_standout).length;
    return { total, standouts, other: total - standouts };
  }, [startups, archetypeFilter]);

  const loading = sLoading || aLoading;

  if (loading) return (
    <div className="max-w-7xl animate-pulse">
      <div className="h-5 w-48 bg-surface rounded mb-2" />
      <div className="h-3 w-72 bg-surface rounded mb-6" />
      <div className="grid grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-20 bg-surface rounded" />)}
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

  const SortHeader = ({ label, col, className }: { label: string; col: SortKey; className?: string }) => (
    <th
      className={`text-left px-3 py-2.5 text-xs font-medium text-dim cursor-pointer hover:text-muted select-none transition-colors ${className || ''}`}
      onClick={() => handleSort(col)}
    >
      {label}
      {sortKey === col && (
        <span className="ml-1 text-accent">{sortDir === 'asc' ? '↑' : '↓'}</span>
      )}
    </th>
  );

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-text text-lg font-semibold">Reference Database</h1>
          <p className="text-muted text-sm mt-1">
            {startups.length.toLocaleString()} startups ({standoutCount.toLocaleString()} standouts) across {archetypes.length} archetypes
          </p>
        </div>
      </div>

      {/* Archetype Cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {archetypes.map(arch => {
          const count = archetypeCounts[arch.id] || 0;
          const isActive = archetypeFilter === arch.id;
          const isEmpty = count === 0 && standoutFilter !== 'all';
          return (
            <button
              key={arch.id}
              onClick={() => handleArchetypeClick(arch.id)}
              className={`text-left p-3 rounded border transition-colors ${
                isActive
                  ? 'bg-accent/10 border-accent/30'
                  : isEmpty
                    ? 'bg-card/50 border-border/50 opacity-50'
                    : 'bg-card border-border hover:border-dim'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className={`text-xs font-medium leading-tight ${isActive ? 'text-accent' : 'text-text'}`}>
                  {arch.name}
                </h3>
                <span className={`text-xs font-mono flex-shrink-0 ${isEmpty ? 'text-dim/40' : 'text-dim'}`}>
                  {count.toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-dim mt-1 truncate">{formatNumber(arch.total_capital) !== '--' ? `${formatNumber(arch.total_capital)} raised` : ''}</p>
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
          onChange={e => handleSearchChange(e.target.value)}
          className="flex-1 max-w-xs"
          placeholder="Search companies, industries, investors..."
        />
        <div className="flex items-center gap-1.5">
          {(['all', 'standouts', 'other'] as const).map(f => {
            const count = f === 'all' ? standoutButtonCounts.total : f === 'standouts' ? standoutButtonCounts.standouts : standoutButtonCounts.other;
            return (
              <button
                key={f}
                onClick={() => handleStandoutClick(f)}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  standoutFilter === f
                    ? 'bg-accent/15 text-accent border border-accent/30'
                    : 'text-dim hover:text-muted bg-surface/50 border border-transparent hover:border-border'
                }`}
              >
                {f === 'all' ? `All (${count.toLocaleString()})` : f === 'standouts' ? `Standouts (${count.toLocaleString()})` : `Other (${count.toLocaleString()})`}
              </button>
            );
          })}
        </div>
        {industries.length > 0 && (
          <select value={industryFilter} onChange={e => { setIndustryFilter(e.target.value); setPage(0); }} className="text-xs">
            <option value="all">All Industries ({industries.length})</option>
            {industries.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {stages.length > 0 && (
          <select value={stageFilter} onChange={e => { setStageFilter(e.target.value); setPage(0); }} className="text-xs">
            <option value="all">All Stages ({stages.length})</option>
            {stages.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {interests.length > 0 && (
          <select value={interestFilter} onChange={e => { setInterestFilter(e.target.value); setPage(0); }} className="text-xs">
            <option value="all">All Interests</option>
            {interests.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {hasAnyFilter && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-accent/70 hover:text-accent transition-colors"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Active filter summary */}
      {hasAnyFilter && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {standoutFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent/10 text-accent text-[11px]">
              {standoutFilter === 'standouts' ? 'Standouts only' : 'Non-standouts only'}
              <button onClick={() => handleStandoutClick('all')} className="hover:text-text ml-0.5">&times;</button>
            </span>
          )}
          {archetypeFilter !== 'all' && archetypeMap[archetypeFilter] && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent/10 text-accent text-[11px]">
              {archetypeMap[archetypeFilter].name}
              <button onClick={() => handleArchetypeClick(archetypeFilter)} className="hover:text-text ml-0.5">&times;</button>
            </span>
          )}
          {industryFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent/10 text-accent text-[11px]">
              {industryFilter}
              <button onClick={() => { setIndustryFilter('all'); setPage(0); }} className="hover:text-text ml-0.5">&times;</button>
            </span>
          )}
          {stageFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent/10 text-accent text-[11px]">
              {stageFilter}
              <button onClick={() => { setStageFilter('all'); setPage(0); }} className="hover:text-text ml-0.5">&times;</button>
            </span>
          )}
          {search.trim() && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent/10 text-accent text-[11px]">
              &quot;{search}&quot;
              <button onClick={() => handleSearchChange('')} className="hover:text-text ml-0.5">&times;</button>
            </span>
          )}
        </div>
      )}

      {/* Results count + pagination */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-dim">
          {sorted.length === 0
            ? 'No startups match'
            : `Showing ${(page * PAGE_SIZE + 1).toLocaleString()}\u2013${Math.min((page + 1) * PAGE_SIZE, sorted.length).toLocaleString()} of ${sorted.length.toLocaleString()} startups`
          }
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2 py-1 text-xs rounded bg-surface/50 text-dim hover:text-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              &larr; Prev
            </button>
            <span className="text-xs text-dim px-2">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-2 py-1 text-xs rounded bg-surface/50 text-dim hover:text-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-dim w-8"></th>
                <SortHeader label="Company" col="company" />
                <SortHeader label="Industry" col="industry" />
                <th className="text-left px-3 py-2.5 text-xs font-medium text-dim min-w-[200px]">Description</th>
                <SortHeader label="Stage" col="stage" />
                <th className="text-left px-3 py-2.5 text-xs font-medium text-dim">Raised</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-dim">Key Investors</th>
                <SortHeader label="Archetype" col="archetype" className="max-w-[140px]" />
                <th className="text-center px-3 py-2.5 text-xs font-medium text-dim w-10">Info</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(startup => (
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
                  <td className="px-3 py-2 text-xs text-dim font-mono">{formatNumber(startup.amount_raised)}</td>
                  <td className="px-3 py-2 text-xs text-dim truncate max-w-[180px]">{startup.key_investors || '--'}</td>
                  <td className="px-3 py-2 text-xs text-dim truncate max-w-[140px]">
                    {startup.archetype_id && archetypeMap[startup.archetype_id]
                      ? archetypeMap[startup.archetype_id].name
                      : '--'}
                  </td>
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
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center text-dim text-sm">
                    No startups match the current filters.
                    {hasAnyFilter && (
                      <button onClick={clearAllFilters} className="text-accent ml-2 hover:underline">
                        Clear all filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-dim">
            Page {page + 1} of {totalPages} ({sorted.length.toLocaleString()} results)
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { setPage(0); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === 0}
              className="px-2 py-1 text-xs rounded bg-surface/50 text-dim hover:text-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              First
            </button>
            <button
              onClick={() => { setPage(p => Math.max(0, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === 0}
              className="px-2 py-1 text-xs rounded bg-surface/50 text-dim hover:text-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              &larr; Prev
            </button>
            <span className="text-xs text-dim px-2">{page + 1} / {totalPages}</span>
            <button
              onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page >= totalPages - 1}
              className="px-2 py-1 text-xs rounded bg-surface/50 text-dim hover:text-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next &rarr;
            </button>
            <button
              onClick={() => { setPage(totalPages - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page >= totalPages - 1}
              className="px-2 py-1 text-xs rounded bg-surface/50 text-dim hover:text-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Last
            </button>
          </div>
        </div>
      )}

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
              <InfoRow label="Amount Raised" value={formatNumber(detailStartup.amount_raised)} />
              <InfoRow label="Key Investors" value={detailStartup.key_investors} />
              <InfoRow label="ARR / Revenue" value={formatNumber(detailStartup.arr_revenue)} />
              <InfoRow label="Key Traction" value={detailStartup.key_traction} />
              <InfoRow label="Score" value={detailStartup.score !== null && detailStartup.score !== undefined ? String(detailStartup.score) : null} />
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
              <InfoRow label="Number of Startups" value={(archetypeCounts[detailArchetype.id] || 0).toLocaleString()} />
              <InfoRow label="Total Capital" value={formatNumber(detailArchetype.total_capital)} />
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
