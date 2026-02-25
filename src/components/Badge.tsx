'use client';

const statusColors: Record<string, string> = {
  // Idea/Vertical statuses
  brainstorm: 'bg-violet-500/15 text-violet-400',
  longlist: 'bg-dim/20 text-dim',
  shortlist: 'bg-accent/15 text-accent',
  deep_dive: 'bg-amber-500/15 text-amber-400',
  killed: 'bg-red-500/15 text-red-400',
  selected: 'bg-emerald-500/15 text-emerald-400',
  // Task statuses
  todo: 'bg-dim/20 text-dim',
  in_progress: 'bg-accent/15 text-accent',
  done: 'bg-emerald-500/15 text-emerald-400',
  // Signal strength
  strong: 'bg-emerald-500/15 text-emerald-400',
  moderate: 'bg-amber-500/15 text-amber-400',
  weak: 'bg-red-500/15 text-red-400',
  // Phases
  phase_1: 'bg-accent/15 text-accent',
  phase_2: 'bg-amber-500/15 text-amber-400',
  phase_3: 'bg-emerald-500/15 text-emerald-400',
  parallel: 'bg-violet-500/15 text-violet-400',
  // Meeting types
  vc: 'bg-accent/15 text-accent',
  angel: 'bg-emerald-500/15 text-emerald-400',
  operator: 'bg-amber-500/15 text-amber-400',
  accelerator: 'bg-violet-500/15 text-violet-400',
  other: 'bg-dim/20 text-dim',
  // Meeting statuses
  need_intro: 'bg-dim/20 text-dim',
  intro_requested: 'bg-amber-500/15 text-amber-400',
  intro_made: 'bg-accent/15 text-accent',
  scheduled: 'bg-violet-500/15 text-violet-400',
  confirmed: 'bg-emerald-500/15 text-emerald-400',
  completed: 'bg-emerald-500/15 text-emerald-400',
  no_response: 'bg-red-500/15 text-red-400',
};

const displayLabels: Record<string, string> = {
  brainstorm: 'Brainstorm',
  longlist: 'Longlist',
  shortlist: 'Shortlist',
  deep_dive: 'Deep Dive',
  killed: 'Killed',
  selected: 'Selected',
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
  strong: 'Strong',
  moderate: 'Moderate',
  weak: 'Weak',
  phase_1: 'Phase 1',
  phase_2: 'Phase 2',
  phase_3: 'Phase 3',
  parallel: 'Parallel',
  vc: 'VC',
  angel: 'Angel',
  operator: 'Operator',
  accelerator: 'Accelerator',
  other: 'Other',
  need_intro: 'Need Intro',
  intro_requested: 'Intro Requested',
  intro_made: 'Intro Made',
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  completed: 'Completed',
  no_response: 'No Response',
};

export default function Badge({ value, className = '' }: { value: string; className?: string }) {
  const color = statusColors[value] || 'bg-dim/20 text-dim';
  const label = displayLabels[value] || value;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${color} ${className}`}>
      {label}
    </span>
  );
}
