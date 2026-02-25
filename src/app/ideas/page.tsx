'use client';

import { useState, useMemo, useCallback } from 'react';
import { useIdeas, useIdeaScores, useConversations, useArchetypes } from '@/lib/useSupabase';
import { useUser } from '@/lib/UserContext';
import { supabase } from '@/lib/supabase';
import { Idea, IdeaStatus, IdeaScore, TeamMember } from '@/lib/types';
import Badge from '@/components/Badge';
import Modal from '@/components/Modal';
import { formatDateET } from '@/lib/utils';

const SCORE_CRITERIA = [
  { key: 'problem_severity', label: 'Problem Severity' },
  { key: 'willingness_to_pay', label: 'Willingness to Pay' },
  { key: 'our_edge', label: 'Our Edge' },
  { key: 'moat_potential', label: 'Moat Potential' },
  { key: 'time_to_demo', label: 'Time to Demo' },
  { key: 'market_size', label: 'Market Size' },
] as const;

type ScoreKey = typeof SCORE_CRITERIA[number]['key'];

const STATUS_ORDER: IdeaStatus[] = ['selected', 'deep_dive', 'shortlist', 'brainstorm', 'killed'];

export default function IdeasPage() {
  const { data: ideas, loading } = useIdeas();
  const { data: allScores } = useIdeaScores();
  const { data: conversations } = useConversations();
  const { data: archetypes } = useArchetypes();
  const { user } = useUser();

  const [mode, setMode] = useState<'list' | 'comparison'>('list');
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | 'all'>('all');
  const [sortField, setSortField] = useState<string>('status');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [addOpen, setAddOpen] = useState(false);
  const [detailIdea, setDetailIdea] = useState<Idea | null>(null);
  const [scoreIdea, setScoreIdea] = useState<Idea | null>(null);

  const archetypeMap = useMemo(() => {
    return Object.fromEntries(archetypes.map(a => [a.id, a.name]));
  }, [archetypes]);

  const scoresByIdea = useMemo(() => {
    const map: Record<string, IdeaScore[]> = {};
    allScores.forEach(s => {
      if (!map[s.idea_id]) map[s.idea_id] = [];
      map[s.idea_id].push(s);
    });
    return map;
  }, [allScores]);

  const convCountByIdea = useMemo(() => {
    const map: Record<string, number> = {};
    conversations.forEach(c => {
      if (c.idea_id) map[c.idea_id] = (map[c.idea_id] || 0) + 1;
    });
    return map;
  }, [conversations]);

  const avgScoreForIdea = useCallback((ideaId: string): number => {
    const scores = scoresByIdea[ideaId] || [];
    if (scores.length === 0) return 0;
    const total = scores.reduce((sum, s) => {
      return sum + (s.problem_severity || 0) + (s.willingness_to_pay || 0) + (s.our_edge || 0)
        + (s.moat_potential || 0) + (s.time_to_demo || 0) + (s.market_size || 0);
    }, 0);
    return total / scores.length / 6;
  }, [scoresByIdea]);

  const filteredIdeas = useMemo(() => {
    let filtered = [...ideas];
    if (statusFilter !== 'all') filtered = filtered.filter(i => i.status === statusFilter);

    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'status') {
        cmp = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
      } else if (sortField === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sortField === 'added_by') {
        cmp = a.added_by.localeCompare(b.added_by);
      } else if (sortField === 'conversations') {
        cmp = (convCountByIdea[a.id] || 0) - (convCountByIdea[b.id] || 0);
      } else if (sortField === 'score') {
        cmp = avgScoreForIdea(a.id) - avgScoreForIdea(b.id);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }, [ideas, statusFilter, sortField, sortDir, convCountByIdea, avgScoreForIdea]);

  const comparisonIdeas = ideas.filter(i => ['shortlist', 'deep_dive', 'selected'].includes(i.status));

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const exportCSV = () => {
    const headers = ['Idea', ...SCORE_CRITERIA.map(c => c.label), 'Avg Total'];
    const rows = comparisonIdeas.map(idea => {
      const scores = scoresByIdea[idea.id] || [];
      const avgByCrit = SCORE_CRITERIA.map(c => {
        const vals = scores.map(s => s[c.key] as number).filter(Boolean);
        return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '-';
      });
      const avg = avgScoreForIdea(idea.id);
      return [idea.name, ...avgByCrit, avg ? avg.toFixed(1) : '-'];
    });
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ideas-comparison-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="text-dim text-sm">Loading ideas...</div>;
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-text text-lg font-semibold">Ideas</h1>
          <p className="text-muted text-sm mt-1">{ideas.length} total ideas in the funnel</p>
        </div>
        <div className="flex items-center gap-2">
          {mode === 'comparison' && (
            <button onClick={exportCSV} className="px-3 py-1.5 text-xs text-muted border border-border rounded hover:text-text hover:border-dim transition-colors">
              Export CSV
            </button>
          )}
          <div className="flex bg-surface border border-border rounded overflow-hidden">
            <button
              onClick={() => setMode('list')}
              className={`px-3 py-1.5 text-xs ${mode === 'list' ? 'bg-card text-text' : 'text-dim hover:text-muted'} transition-colors`}
            >
              List
            </button>
            <button
              onClick={() => setMode('comparison')}
              className={`px-3 py-1.5 text-xs ${mode === 'comparison' ? 'bg-card text-text' : 'text-dim hover:text-muted'} transition-colors`}
            >
              Comparison
            </button>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="px-3 py-1.5 text-xs bg-accent/15 text-accent rounded hover:bg-accent/25 transition-colors"
          >
            + Add Idea
          </button>
        </div>
      </div>

      {mode === 'list' ? (
        <ListView
          ideas={filteredIdeas}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortField={sortField}
          sortDir={sortDir}
          handleSort={handleSort}
          convCountByIdea={convCountByIdea}
          avgScoreForIdea={avgScoreForIdea}
          archetypeMap={archetypeMap}
          onDetail={setDetailIdea}
          onScore={setScoreIdea}
        />
      ) : (
        <ComparisonView
          ideas={comparisonIdeas}
          scoresByIdea={scoresByIdea}
          onScore={setScoreIdea}
        />
      )}

      <AddIdeaModal open={addOpen} onClose={() => setAddOpen(false)} user={user} archetypes={archetypes} />
      <IdeaDetailModal
        idea={detailIdea}
        onClose={() => setDetailIdea(null)}
        scores={detailIdea ? scoresByIdea[detailIdea.id] || [] : []}
        conversations={detailIdea ? conversations.filter(c => c.idea_id === detailIdea.id) : []}
        archetypeMap={archetypeMap}
        onScore={() => { if (detailIdea) setScoreIdea(detailIdea); }}
      />
      <ScoreModal idea={scoreIdea} onClose={() => setScoreIdea(null)} user={user} existingScores={scoreIdea ? scoresByIdea[scoreIdea.id] || [] : []} />
    </div>
  );
}

function ListView({
  ideas, statusFilter, setStatusFilter, sortField, sortDir, handleSort,
  convCountByIdea, avgScoreForIdea, archetypeMap, onDetail, onScore,
}: {
  ideas: Idea[];
  statusFilter: IdeaStatus | 'all';
  setStatusFilter: (s: IdeaStatus | 'all') => void;
  sortField: string;
  sortDir: 'asc' | 'desc';
  handleSort: (field: string) => void;
  convCountByIdea: Record<string, number>;
  avgScoreForIdea: (id: string) => number;
  archetypeMap: Record<string, string>;
  onDetail: (i: Idea) => void;
  onScore: (i: Idea) => void;
}) {
  const SortHeader = ({ field, label }: { field: string; label: string }) => (
    <th
      className="text-left px-3 py-2 text-xs font-medium text-dim cursor-pointer hover:text-muted select-none"
      onClick={() => handleSort(field)}
    >
      {label}
      {sortField === field && (
        <span className="ml-1 text-accent">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>
      )}
    </th>
  );

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(['all', 'brainstorm', 'shortlist', 'deep_dive', 'killed', 'selected'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-2.5 py-1 text-xs rounded ${statusFilter === s ? 'bg-card text-text border border-border' : 'text-dim hover:text-muted'} transition-colors`}
          >
            {s === 'all' ? 'All' : s === 'deep_dive' ? 'Deep Dive' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-border">
            <tr>
              <SortHeader field="name" label="Name" />
              <SortHeader field="status" label="Stage" />
              <th className="text-left px-3 py-2 text-xs font-medium text-dim">Archetype</th>
              <SortHeader field="added_by" label="Added By" />
              <SortHeader field="conversations" label="Convos" />
              <SortHeader field="score" label="Avg Score" />
              <th className="text-left px-3 py-2 text-xs font-medium text-dim">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ideas.map(idea => {
              const avg = avgScoreForIdea(idea.id);
              const convCount = convCountByIdea[idea.id] || 0;
              return (
                <tr key={idea.id} className="border-b border-border/50 hover:bg-surface/50 transition-colors">
                  <td className="px-3 py-2.5">
                    <button onClick={() => onDetail(idea)} className="text-sm text-text hover:text-accent transition-colors text-left">
                      {idea.name}
                    </button>
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusSelect idea={idea} />
                  </td>
                  <td className="px-3 py-2.5 text-xs text-dim truncate max-w-[120px]">
                    {idea.archetype_id ? archetypeMap[idea.archetype_id] || '--' : '--'}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-muted">{idea.added_by}</td>
                  <td className="px-3 py-2.5 text-sm text-muted font-mono">{convCount}</td>
                  <td className="px-3 py-2.5">
                    {avg > 0 ? (
                      <span className="text-sm font-mono text-accent">{avg.toFixed(1)}</span>
                    ) : (
                      <span className="text-sm text-dim">--</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => onScore(idea)}
                      className="text-xs text-muted hover:text-accent transition-colors"
                    >
                      Score
                    </button>
                  </td>
                </tr>
              );
            })}
            {ideas.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-dim text-sm">No ideas found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusSelect({ idea }: { idea: Idea }) {
  const updateStatus = async (newStatus: IdeaStatus) => {
    await supabase.from('ideas').update({ status: newStatus }).eq('id', idea.id);
  };

  return (
    <select
      value={idea.status}
      onChange={e => updateStatus(e.target.value as IdeaStatus)}
      className="text-xs !py-1 !px-2 !bg-transparent !border-0 cursor-pointer"
    >
      <option value="brainstorm">Brainstorm</option>
      <option value="shortlist">Shortlist</option>
      <option value="deep_dive">Deep Dive</option>
      <option value="killed">Killed</option>
      <option value="selected">Selected</option>
    </select>
  );
}

function ComparisonView({
  ideas, scoresByIdea, onScore,
}: {
  ideas: Idea[];
  scoresByIdea: Record<string, IdeaScore[]>;
  onScore: (i: Idea) => void;
}) {
  if (ideas.length === 0) {
    return (
      <div className="bg-card border border-border rounded p-8 text-center">
        <p className="text-dim text-sm">No shortlisted or deep-dive ideas yet. Move ideas to shortlist to compare them.</p>
      </div>
    );
  }

  const MEMBERS: TeamMember[] = ['Adham', 'Aly', 'Youssif'];
  const initials: Record<string, string> = { Adham: 'AB', Aly: 'AE', Youssif: 'YS' };

  const avgTotals = ideas.map(idea => {
    const scores = scoresByIdea[idea.id] || [];
    if (scores.length === 0) return 0;
    const total = scores.reduce((sum, s) => {
      return sum + (s.problem_severity || 0) + (s.willingness_to_pay || 0) + (s.our_edge || 0)
        + (s.moat_potential || 0) + (s.time_to_demo || 0) + (s.market_size || 0);
    }, 0);
    return total / scores.length;
  });
  const maxAvg = Math.max(...avgTotals);
  const leaderIdx = avgTotals.indexOf(maxAvg);

  return (
    <div className="bg-card border border-border rounded overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead className="border-b border-border">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-medium text-dim w-48">Criteria</th>
            {ideas.map((idea, i) => (
              <th key={idea.id} className={`text-center px-4 py-3 text-xs font-medium ${i === leaderIdx && maxAvg > 0 ? 'text-accent' : 'text-muted'}`}>
                <div className="flex flex-col items-center gap-1">
                  <span>{idea.name}</span>
                  <Badge value={idea.status} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SCORE_CRITERIA.map(criterion => (
            <tr key={criterion.key} className="border-b border-border/50">
              <td className="px-4 py-3 text-sm text-muted">{criterion.label}</td>
              {ideas.map(idea => {
                const scores = scoresByIdea[idea.id] || [];
                return (
                  <td key={idea.id} className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {MEMBERS.map(member => {
                        const s = scores.find(sc => sc.scored_by === member);
                        const val = s ? (s[criterion.key as ScoreKey] as number) : null;
                        return (
                          <div key={member} className="flex flex-col items-center gap-0.5">
                            <span className="w-5 h-5 rounded bg-surface text-[10px] font-mono text-dim flex items-center justify-center" title={member}>
                              {initials[member]}
                            </span>
                            <span className={`text-xs font-mono ${val ? 'text-text' : 'text-dim'}`}>
                              {val || '-'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {(() => {
                      const vals = scores.map(s => s[criterion.key as ScoreKey] as number).filter(Boolean);
                      if (vals.length === 0) return null;
                      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
                      return <div className="text-xs font-mono text-accent mt-1">avg: {avg.toFixed(1)}</div>;
                    })()}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className="bg-surface/50">
            <td className="px-4 py-3 text-sm text-text font-medium">Total Average</td>
            {ideas.map((idea, i) => (
              <td key={idea.id} className="px-4 py-3 text-center">
                <span className={`text-lg font-mono font-semibold ${i === leaderIdx && maxAvg > 0 ? 'text-accent' : 'text-text'}`}>
                  {avgTotals[i] > 0 ? avgTotals[i].toFixed(1) : '--'}
                </span>
                <span className="text-dim text-xs block">/60</span>
              </td>
            ))}
          </tr>
          <tr>
            <td className="px-4 py-3"></td>
            {ideas.map(idea => (
              <td key={idea.id} className="px-4 py-3 text-center">
                <button
                  onClick={() => onScore(idea)}
                  className="text-xs text-accent hover:text-accent/80 transition-colors"
                >
                  Add your score
                </button>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function AddIdeaModal({ open, onClose, user, archetypes }: { open: boolean; onClose: () => void; user: TeamMember | null; archetypes: { id: string; name: string }[] }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('');
  const [status, setStatus] = useState<IdeaStatus>('brainstorm');
  const [archetypeId, setArchetypeId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !user) return;
    setSubmitting(true);
    await supabase.from('ideas').insert({
      name: name.trim(),
      description: description.trim() || null,
      source: source.trim() || null,
      status,
      archetype_id: archetypeId || null,
      added_by: user,
    });
    setName('');
    setDescription('');
    setSource('');
    setStatus('brainstorm');
    setArchetypeId('');
    setSubmitting(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Idea">
      <div className="space-y-4">
        <div>
          <label className="text-xs text-dim block mb-1">Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full" placeholder="e.g. AI-powered surgical scheduling" />
        </div>
        <div>
          <label className="text-xs text-dim block mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full h-20 resize-none" placeholder="1-2 sentence summary" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-dim block mb-1">Source</label>
            <input value={source} onChange={e => setSource(e.target.value)} className="w-full" placeholder="database, brainstorm, AI..." />
          </div>
          <div>
            <label className="text-xs text-dim block mb-1">Stage</label>
            <select value={status} onChange={e => setStatus(e.target.value as IdeaStatus)} className="w-full">
              <option value="brainstorm">Brainstorm</option>
              <option value="shortlist">Shortlist</option>
              <option value="deep_dive">Deep Dive</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs text-dim block mb-1">Archetype</label>
          <select value={archetypeId} onChange={e => setArchetypeId(e.target.value)} className="w-full">
            <option value="">None</option>
            {archetypes.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || submitting}
          className="w-full py-2 text-sm bg-accent/15 text-accent rounded hover:bg-accent/25 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Adding...' : 'Add Idea'}
        </button>
      </div>
    </Modal>
  );
}

function IdeaDetailModal({
  idea, onClose, scores, conversations, archetypeMap, onScore,
}: {
  idea: Idea | null;
  onClose: () => void;
  scores: IdeaScore[];
  conversations: { contact_name: string; summary: string | null; signal_strength: string | null; date: string | null }[];
  archetypeMap: Record<string, string>;
  onScore: () => void;
}) {
  if (!idea) return null;

  const handleDelete = async () => {
    await supabase.from('ideas').delete().eq('id', idea.id);
    onClose();
  };

  return (
    <Modal open={!!idea} onClose={onClose} title={idea.name} wide>
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Badge value={idea.status} />
          <span className="text-xs text-dim">Added by {idea.added_by}</span>
          {idea.archetype_id && archetypeMap[idea.archetype_id] && (
            <span className="text-xs text-muted bg-surface px-2 py-0.5 rounded">{archetypeMap[idea.archetype_id]}</span>
          )}
        </div>

        {idea.description && (
          <p className="text-sm text-muted">{idea.description}</p>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-dim uppercase tracking-wide">Scores</h3>
            <button onClick={onScore} className="text-xs text-accent hover:text-accent/80">Add score</button>
          </div>
          {scores.length === 0 ? (
            <p className="text-sm text-dim">No scores yet</p>
          ) : (
            <div className="bg-surface border border-border rounded p-3 space-y-2">
              {scores.map(s => (
                <div key={s.id} className="flex items-start gap-3">
                  <span className="text-xs font-medium text-muted w-16">{s.scored_by}</span>
                  <div className="flex gap-2 flex-wrap">
                    {SCORE_CRITERIA.map(c => (
                      <span key={c.key} className="text-xs text-dim">
                        {c.label.split(' ').map(w => w[0]).join('')}: <span className="text-text font-mono">{s[c.key as ScoreKey] || '-'}</span>
                      </span>
                    ))}
                  </div>
                  {s.notes && <p className="text-xs text-dim mt-1">{s.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xs font-medium text-dim uppercase tracking-wide mb-2">Linked Conversations</h3>
          {conversations.length === 0 ? (
            <p className="text-sm text-dim">No conversations linked</p>
          ) : (
            <div className="space-y-2">
              {conversations.map((c, i) => (
                <div key={i} className="bg-surface border border-border rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-text">{c.contact_name}</span>
                    {c.signal_strength && <Badge value={c.signal_strength} />}
                    {c.date && <span className="text-xs text-dim font-mono">{formatDateET(c.date)}</span>}
                  </div>
                  {c.summary && <p className="text-xs text-muted">{c.summary}</p>}
                </div>
              ))}
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

function ScoreModal({
  idea, onClose, user, existingScores,
}: {
  idea: Idea | null;
  onClose: () => void;
  user: TeamMember | null;
  existingScores: IdeaScore[];
}) {
  const existing = existingScores.find(s => s.scored_by === user);

  const [scores, setScores] = useState<Record<ScoreKey, number>>({
    problem_severity: existing?.problem_severity || 5,
    willingness_to_pay: existing?.willingness_to_pay || 5,
    our_edge: existing?.our_edge || 5,
    moat_potential: existing?.moat_potential || 5,
    time_to_demo: existing?.time_to_demo || 5,
    market_size: existing?.market_size || 5,
  });
  const [notes, setNotes] = useState(existing?.notes || '');
  const [submitting, setSubmitting] = useState(false);

  const [lastIdeaId, setLastIdeaId] = useState<string | null>(null);
  if (idea && idea.id !== lastIdeaId) {
    setLastIdeaId(idea.id);
    const ex = existingScores.find(s => s.scored_by === user);
    setScores({
      problem_severity: ex?.problem_severity || 5,
      willingness_to_pay: ex?.willingness_to_pay || 5,
      our_edge: ex?.our_edge || 5,
      moat_potential: ex?.moat_potential || 5,
      time_to_demo: ex?.time_to_demo || 5,
      market_size: ex?.market_size || 5,
    });
    setNotes(ex?.notes || '');
  }

  if (!idea || !user) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    await supabase.from('idea_scores').upsert({
      idea_id: idea.id,
      scored_by: user,
      ...scores,
      notes: notes.trim() || null,
    }, { onConflict: 'idea_id,scored_by' });
    setSubmitting(false);
    onClose();
  };

  return (
    <Modal open={!!idea} onClose={onClose} title={`Score: ${idea.name}`}>
      <div className="space-y-4">
        <p className="text-xs text-dim">Scoring as {user}. Each criterion is 1-10.</p>
        {SCORE_CRITERIA.map(c => (
          <div key={c.key}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-muted">{c.label}</label>
              <span className="text-sm font-mono text-accent">{scores[c.key]}</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={scores[c.key]}
              onChange={e => setScores(prev => ({ ...prev, [c.key]: parseInt(e.target.value) }))}
              className="w-full h-1 bg-border rounded appearance-none cursor-pointer accent-accent !border-0 !p-0"
            />
            <div className="flex justify-between text-[10px] text-dim font-mono mt-0.5">
              <span>1</span><span>10</span>
            </div>
          </div>
        ))}
        <div>
          <label className="text-xs text-dim block mb-1">Notes (optional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full h-20 resize-none" placeholder="Justification, context..." />
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-2 text-sm bg-accent/15 text-accent rounded hover:bg-accent/25 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Saving...' : existing ? 'Update Score' : 'Submit Score'}
        </button>
      </div>
    </Modal>
  );
}
