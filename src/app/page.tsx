'use client';

import { useMemo } from 'react';
import { useIdeas, useIdeaScores, useConversations, useTasks, useSFMeetings, useReferenceStartups } from '@/lib/useSupabase';
import { relativeTime } from '@/lib/utils';
import { IdeaStatus } from '@/lib/types';
import Badge from '@/components/Badge';

const FUNNEL_STAGES: { status: IdeaStatus; label: string; color: string; bgColor: string }[] = [
  { status: 'brainstorm', label: 'Brainstorm', color: 'text-violet-400', bgColor: 'bg-violet-500' },
  { status: 'shortlist', label: 'Shortlist', color: 'text-accent', bgColor: 'bg-accent' },
  { status: 'deep_dive', label: 'Deep Dive', color: 'text-amber-400', bgColor: 'bg-amber-500' },
  { status: 'selected', label: 'Selected', color: 'text-emerald-400', bgColor: 'bg-emerald-500' },
];

export default function Dashboard() {
  const { data: ideas, loading: iLoading } = useIdeas();
  const { data: scores } = useIdeaScores();
  const { data: conversations, loading: cLoading } = useConversations();
  const { data: tasks } = useTasks();
  const { data: meetings, loading: mLoading } = useSFMeetings();
  const { data: refStartups } = useReferenceStartups();

  const funnelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    FUNNEL_STAGES.forEach(s => { counts[s.status] = 0; });
    counts['killed'] = 0;
    ideas.forEach(idea => { counts[idea.status] = (counts[idea.status] || 0) + 1; });
    return counts;
  }, [ideas]);

  const maxFunnelCount = Math.max(...FUNNEL_STAGES.map(s => funnelCounts[s.status] || 1), 1);

  const loading = iLoading || cLoading || mLoading;

  type ActivityItem = { text: string; time: string; type: string };
  const activity: ActivityItem[] = useMemo(() => {
    const items: ActivityItem[] = [];
    ideas.forEach(i => {
      items.push({ text: `${i.added_by} added "${i.name}" to ${i.status}`, time: i.created_at, type: 'idea' });
    });
    conversations.forEach(c => {
      items.push({ text: `${c.conducted_by} logged conversation with ${c.contact_name}`, time: c.created_at, type: 'conversation' });
    });
    tasks.filter(t => t.status === 'done').forEach(t => {
      items.push({ text: `${t.assigned_to} completed "${t.title}"`, time: t.created_at, type: 'task' });
    });
    scores.forEach(s => {
      const idea = ideas.find(i => i.id === s.idea_id);
      if (idea) {
        items.push({ text: `${s.scored_by} scored "${idea.name}"`, time: s.created_at, type: 'score' });
      }
    });
    meetings.forEach(m => {
      items.push({ text: `${m.owner} added meeting with ${m.contact_name}`, time: m.created_at, type: 'meeting' });
    });
    items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    return items.slice(0, 12);
  }, [ideas, conversations, tasks, scores, meetings]);

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-text text-lg font-semibold">Idea Funnel</h1>
        <p className="text-muted text-sm mt-1">Track ideas from brainstorm to selection</p>
      </div>

      {/* Funnel Visualization */}
      <div className="bg-card border border-border rounded p-6 mb-6">
        <div className="flex items-end gap-3 h-40">
          {FUNNEL_STAGES.map((stage, i) => {
            const count = funnelCounts[stage.status];
            const barHeight = maxFunnelCount > 0 ? Math.max((count / maxFunnelCount) * 100, 8) : 8;
            const widthPct = 100 - (i * 15);
            return (
              <div key={stage.status} className="flex-1 flex flex-col items-center gap-2">
                <span className={`text-xl font-mono font-semibold ${stage.color}`}>
                  {loading ? '-' : count}
                </span>
                <div className="w-full flex justify-center">
                  <div
                    className={`${stage.bgColor}/30 rounded-t transition-all duration-500 relative`}
                    style={{ height: `${barHeight}%`, width: `${widthPct}%`, minHeight: '8px' }}
                  >
                    <div
                      className={`absolute bottom-0 left-0 right-0 ${stage.bgColor}/60 rounded-t transition-all duration-500`}
                      style={{ height: '100%' }}
                    />
                  </div>
                </div>
                <span className="text-xs text-muted font-medium">{stage.label}</span>
              </div>
            );
          })}
          <div className="flex flex-col items-center gap-2 w-16">
            <span className="text-xl font-mono font-semibold text-red-400">
              {loading ? '-' : funnelCounts['killed']}
            </span>
            <div className="w-full flex justify-center">
              <div className="bg-red-500/20 rounded h-2 w-8" />
            </div>
            <span className="text-xs text-dim">Killed</span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Ideas" value={ideas.length} loading={loading} />
        <StatCard label="Conversations" value={conversations.length} loading={loading} />
        <StatCard label="Tasks Done" value={tasks.filter(t => t.status === 'done').length} loading={loading} sub={`of ${tasks.length}`} />
        <StatCard label="Reference Startups" value={refStartups.length} loading={loading} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Top Ideas */}
        <div className="bg-card border border-border rounded p-5">
          <h2 className="text-text text-sm font-medium mb-4">Top Ideas by Score</h2>
          {(() => {
            const ideasWithScores = ideas
              .map(idea => {
                const ideaScores = scores.filter(s => s.idea_id === idea.id);
                if (ideaScores.length === 0) return { idea, avg: 0 };
                const total = ideaScores.reduce((sum, s) => {
                  return sum + (s.problem_severity || 0) + (s.willingness_to_pay || 0) + (s.our_edge || 0)
                    + (s.moat_potential || 0) + (s.time_to_demo || 0) + (s.market_size || 0);
                }, 0);
                return { idea, avg: total / ideaScores.length };
              })
              .filter(x => x.avg > 0)
              .sort((a, b) => b.avg - a.avg)
              .slice(0, 5);

            if (ideasWithScores.length === 0) {
              return <p className="text-dim text-sm">No ideas scored yet</p>;
            }

            return (
              <div className="space-y-2.5">
                {ideasWithScores.map(({ idea, avg }) => (
                  <div key={idea.id} className="flex items-center gap-3">
                    <span className="text-sm font-mono text-accent w-10">{avg.toFixed(0)}</span>
                    <span className="text-sm text-text flex-1 truncate">{idea.name}</span>
                    <Badge value={idea.status} />
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded p-5">
          <h2 className="text-text text-sm font-medium mb-4">Recent Activity</h2>
          {activity.length === 0 ? (
            <p className="text-dim text-sm">No activity yet</p>
          ) : (
            <div className="space-y-2.5">
              {activity.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                    item.type === 'idea' ? 'bg-violet-400' :
                    item.type === 'conversation' ? 'bg-emerald-400' :
                    item.type === 'score' ? 'bg-amber-400' :
                    item.type === 'meeting' ? 'bg-accent' :
                    'bg-dim'
                  }`} />
                  <p className="text-sm text-muted truncate flex-1 min-w-0">{item.text}</p>
                  <span className="text-xs text-dim font-mono flex-shrink-0">{relativeTime(item.time)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Progress */}
      <div className="bg-card border border-border rounded p-5 mt-4">
        <h2 className="text-text text-sm font-medium mb-4">Task Progress</h2>
        {(() => {
          const todo = tasks.filter(t => t.status === 'todo').length;
          const inProg = tasks.filter(t => t.status === 'in_progress').length;
          const done = tasks.filter(t => t.status === 'done').length;
          const total = tasks.length || 1;
          return (
            <div>
              <div className="flex gap-0.5 h-2 rounded-sm overflow-hidden mb-3">
                <div className="bg-emerald-500/60 transition-all" style={{ width: `${(done / total) * 100}%` }} />
                <div className="bg-accent/60 transition-all" style={{ width: `${(inProg / total) * 100}%` }} />
                <div className="bg-dim/30 transition-all" style={{ width: `${(todo / total) * 100}%` }} />
              </div>
              <div className="flex gap-4 text-xs">
                <span className="text-dim">To Do: <span className="text-text font-mono">{todo}</span></span>
                <span className="text-dim">In Progress: <span className="text-accent font-mono">{inProg}</span></span>
                <span className="text-dim">Done: <span className="text-emerald-400 font-mono">{done}</span></span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function StatCard({ label, value, loading, sub }: { label: string; value: number; loading: boolean; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded p-4">
      <p className="text-dim text-xs mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <p className="text-text text-2xl font-mono font-semibold">
          {loading ? '-' : value}
        </p>
        {sub && <span className="text-dim text-xs font-mono">{sub}</span>}
      </div>
    </div>
  );
}
