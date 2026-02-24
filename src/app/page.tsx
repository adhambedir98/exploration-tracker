'use client';

import { useVerticals, useScores, useConversations, useTasks, useSFMeetings } from '@/lib/useSupabase';
import { relativeTime } from '@/lib/utils';

const TIMELINE = [
  { date: 'Feb 24', isoDate: '2025-02-24', label: 'Start' },
  { date: 'Feb 25', isoDate: '2025-02-25', label: 'Filter Call' },
  { date: 'Mar 5', isoDate: '2025-03-05', label: 'Converge' },
  { date: 'Mar 7', isoDate: '2025-03-07', label: 'Decide' },
  { date: 'Mar 13', isoDate: '2025-03-13', label: 'YC Decision' },
  { date: 'Mar 14', isoDate: '2025-03-14', label: 'SF Trip' },
];

export default function Dashboard() {
  const { data: verticals, loading: vLoading } = useVerticals();
  const { data: scores } = useScores();
  const { data: conversations, loading: cLoading } = useConversations();
  const { data: tasks } = useTasks();
  const { data: meetings, loading: mLoading } = useSFMeetings();

  const longlistCount = verticals.filter(v => v.status === 'longlist').length;
  const shortlistCount = verticals.filter(v => v.status === 'shortlist').length;
  const deepDiveCount = verticals.filter(v => v.status === 'deep_dive').length;
  const conversationCount = conversations.length;
  const meetingsBooked = meetings.filter(m => ['scheduled', 'confirmed', 'completed'].includes(m.status)).length;

  const todayStr = new Date().toISOString().split('T')[0];
  let currentPhase = 'Phase 1';
  if (todayStr >= '2025-03-07') currentPhase = 'Phase 3';
  else if (todayStr >= '2025-02-26') currentPhase = 'Phase 2';

  type ActivityItem = { text: string; time: string; type: string };
  const activity: ActivityItem[] = [];

  verticals.forEach(v => {
    activity.push({ text: `${v.added_by} added "${v.name}" to ${v.status}`, time: v.created_at, type: 'vertical' });
  });
  conversations.forEach(c => {
    activity.push({ text: `${c.conducted_by} logged conversation with ${c.contact_name}`, time: c.created_at, type: 'conversation' });
  });
  tasks.filter(t => t.status === 'done').forEach(t => {
    activity.push({ text: `${t.assigned_to} completed "${t.title}"`, time: t.created_at, type: 'task' });
  });
  scores.forEach(s => {
    const vertical = verticals.find(v => v.id === s.vertical_id);
    if (vertical) {
      activity.push({ text: `${s.scored_by} scored "${vertical.name}"`, time: s.created_at, type: 'score' });
    }
  });
  meetings.forEach(m => {
    activity.push({ text: `${m.owner} added meeting with ${m.contact_name}`, time: m.created_at, type: 'meeting' });
  });

  activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  const recentActivity = activity.slice(0, 10);

  const loading = vLoading || cLoading || mLoading;

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-text text-lg font-semibold">Dashboard</h1>
        <p className="text-muted text-sm mt-1">2-week structured exploration -- {currentPhase}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-8">
        <StatCard label="Longlist" value={longlistCount} loading={loading} />
        <StatCard label="Shortlist" value={shortlistCount} loading={loading} />
        <StatCard label="Deep Dive" value={deepDiveCount} loading={loading} />
        <StatCard label="Conversations" value={conversationCount} loading={loading} />
        <StatCard label="Meetings Booked" value={meetingsBooked} loading={loading} />
      </div>

      {/* Timeline */}
      <div className="bg-card border border-border rounded p-5 mb-8">
        <h2 className="text-text text-sm font-medium mb-4">Timeline</h2>
        <div className="flex items-center">
          {TIMELINE.map((item, i) => {
            const isPast = todayStr >= item.isoDate;
            return (
              <div key={i} className="flex-1 flex flex-col items-center relative">
                <div className={`w-3 h-3 rounded-full border-2 z-10 ${isPast ? 'bg-accent border-accent' : 'bg-card border-dim'}`} />
                {i < TIMELINE.length - 1 && (
                  <div className={`absolute top-1.5 left-1/2 w-full h-px ${isPast ? 'bg-accent/40' : 'bg-border'}`} />
                )}
                <span className="text-xs font-mono text-muted mt-2">{item.date}</span>
                <span className="text-xs text-dim mt-0.5">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Progress + Activity */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded p-5">
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

        <div className="bg-card border border-border rounded p-5">
          <h2 className="text-text text-sm font-medium mb-4">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-dim text-sm">No activity yet</p>
          ) : (
            <div className="space-y-2.5">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                    item.type === 'vertical' ? 'bg-accent' :
                    item.type === 'conversation' ? 'bg-emerald-400' :
                    item.type === 'score' ? 'bg-amber-400' :
                    item.type === 'meeting' ? 'bg-violet-400' :
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
    </div>
  );
}

function StatCard({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <div className="bg-card border border-border rounded p-4">
      <p className="text-dim text-xs mb-1">{label}</p>
      <p className="text-text text-2xl font-mono font-semibold">
        {loading ? '-' : value}
      </p>
    </div>
  );
}
