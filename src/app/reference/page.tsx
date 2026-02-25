'use client';

import { useState, useMemo } from 'react';
import { useReferenceStartups, useArchetypes } from '@/lib/useSupabase';
import { ReferenceStartup, Archetype } from '@/lib/types';
import Modal from '@/components/Modal';

export default function ReferencePage() {
  const { data: startups, loading: sLoading } = useReferenceStartups();
  const { data: archetypes, loading: aLoading } = useArchetypes();

  const [search, setSearch] = useState('');
  const [archetypeFilter, setArchetypeFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [detailStartup, setDetailStartup] = useState<ReferenceStartup | null>(null);
  const [detailArchetype, setDetailArchetype] = useState<Archetype | null>(null);

  const archetypeMap = useMemo(() => {
    return Object.fromEntries(archetypes.map(a => [a.id, a]));
  }, [archetypes]);

  const stages = useMemo(() => {
    const s = new Set(startups.map(st => st.stage).filter(Boolean));
    return Array.from(s).sort() as string[];
  }, [startups]);

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
    return result;
  }, [startups, search, archetypeFilter, stageFilter]);

  const loading = sLoading || aLoading;

  if (loading) return <div className="text-dim text-sm">Loading reference database...</div>;

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-text text-lg font-semibold">Reference Database</h1>
          <p className="text-muted text-sm mt-1">{startups.length} curated startups across {archetypes.length} archetypes</p>
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
      <div className="flex items-center gap-3 mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 max-w-xs"
          placeholder="Search companies, industries, investors..."
        />
        <select
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value)}
          className="text-xs"
        >
          <option value="all">All Stages</option>
          {stages.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {archetypeFilter !== 'all' && (
          <button
            onClick={() => setArchetypeFilter('all')}
            className="text-xs text-accent hover:text-accent/80"
          >
            Clear archetype filter
          </button>
        )}
        <span className="text-xs text-dim ml-auto">{filtered.length} results</span>
      </div>

      {/* Startups Table */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-border">
            <tr>
              <th className="text-left px-3 py-2 text-xs font-medium text-dim">Company</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-dim">Industry</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-dim">Stage</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-dim">Raised</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-dim">Key Investors</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-dim">Score</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr
                key={s.id}
                className="border-b border-border/50 hover:bg-surface/50 transition-colors cursor-pointer"
                onClick={() => setDetailStartup(s)}
              >
                <td className="px-3 py-2.5">
                  <div>
                    <span className="text-sm text-text">{s.company}</span>
                    {s.one_liner && (
                      <p className="text-xs text-dim truncate max-w-[250px]">{s.one_liner}</p>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-xs text-muted">{s.industry || '--'}</td>
                <td className="px-3 py-2.5 text-xs text-muted">{s.stage || '--'}</td>
                <td className="px-3 py-2.5 text-xs font-mono text-muted">{s.amount_raised || '--'}</td>
                <td className="px-3 py-2.5 text-xs text-dim truncate max-w-[200px]">{s.key_investors || '--'}</td>
                <td className="px-3 py-2.5">
                  {s.score ? (
                    <span className={`text-xs font-mono ${
                      s.score >= 40 ? 'text-emerald-400' :
                      s.score >= 30 ? 'text-amber-400' :
                      'text-dim'
                    }`}>
                      {s.score}
                    </span>
                  ) : (
                    <span className="text-xs text-dim">--</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-dim text-sm">No startups match your filters</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Startup Detail Modal */}
      {detailStartup && (
        <Modal open={!!detailStartup} onClose={() => setDetailStartup(null)} title={detailStartup.company} wide>
          <div className="space-y-4">
            {detailStartup.one_liner && (
              <p className="text-sm text-muted">{detailStartup.one_liner}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <InfoRow label="Industry" value={detailStartup.industry} />
              <InfoRow label="Stage" value={detailStartup.stage} />
              <InfoRow label="Amount Raised" value={detailStartup.amount_raised} />
              <InfoRow label="ARR / Revenue" value={detailStartup.arr_revenue} />
              <InfoRow label="Key Investors" value={detailStartup.key_investors} />
              <InfoRow label="Score" value={detailStartup.score?.toString()} />
              <InfoRow label="Interest" value={detailStartup.interest} />
            </div>
            {detailStartup.key_traction && (
              <div>
                <h4 className="text-xs font-medium text-dim uppercase tracking-wide mb-1">Key Traction</h4>
                <p className="text-sm text-muted">{detailStartup.key_traction}</p>
              </div>
            )}
            {detailStartup.latest_news && (
              <div>
                <h4 className="text-xs font-medium text-dim uppercase tracking-wide mb-1">Latest News</h4>
                <p className="text-sm text-muted">{detailStartup.latest_news}</p>
              </div>
            )}
            {detailStartup.archetype_id && archetypeMap[detailStartup.archetype_id] && (
              <div>
                <h4 className="text-xs font-medium text-dim uppercase tracking-wide mb-1">Archetype</h4>
                <p className="text-sm text-accent">{archetypeMap[detailStartup.archetype_id].name}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Archetype Detail Modal */}
      {detailArchetype && (
        <Modal open={!!detailArchetype} onClose={() => setDetailArchetype(null)} title={detailArchetype.name} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface rounded p-3">
                <p className="text-xs text-dim">Startups</p>
                <p className="text-lg font-mono text-text">{detailArchetype.num_startups}</p>
              </div>
              <div className="bg-surface rounded p-3">
                <p className="text-xs text-dim">Total Capital</p>
                <p className="text-lg font-mono text-text">{detailArchetype.total_capital}</p>
              </div>
              <div className="bg-surface rounded p-3">
                <p className="text-xs text-dim">Top Investors</p>
                <p className="text-xs text-muted mt-1">{detailArchetype.top_investors}</p>
              </div>
            </div>
            {detailArchetype.investor_thesis && (
              <div>
                <h4 className="text-xs font-medium text-dim uppercase tracking-wide mb-1">Investor Thesis</h4>
                <p className="text-sm text-muted">{detailArchetype.investor_thesis}</p>
              </div>
            )}
            {detailArchetype.why_hot && (
              <div>
                <h4 className="text-xs font-medium text-dim uppercase tracking-wide mb-1">Why Hot Right Now</h4>
                <p className="text-sm text-muted">{detailArchetype.why_hot}</p>
              </div>
            )}
            {detailArchetype.relevance_to_caddy && (
              <div>
                <h4 className="text-xs font-medium text-dim uppercase tracking-wide mb-1">Relevance to Caddy</h4>
                <p className="text-sm text-accent/80">{detailArchetype.relevance_to_caddy}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <span className="text-xs text-dim">{label}</span>
      <p className="text-sm text-muted">{value || '--'}</p>
    </div>
  );
}
