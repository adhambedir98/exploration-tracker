'use client';

const statusColors: Record<string, string> = {
  // Idea/Vertical statuses
  brainstorm: 'bg-violet-100 text-violet-700',
  longlist: 'bg-surface text-dim',
  shortlist: 'bg-accent/15 text-accent',
  deep_dive: 'bg-amber-100 text-amber-700',
  killed: 'bg-red-100 text-red-700',
  selected: 'bg-emerald-100 text-emerald-700',
  // Task statuses
  todo: 'bg-surface text-dim',
  in_progress: 'bg-accent/15 text-accent',
  done: 'bg-emerald-100 text-emerald-700',
  // Signal strength
  strong: 'bg-emerald-100 text-emerald-700',
  moderate: 'bg-amber-100 text-amber-700',
  weak: 'bg-red-100 text-red-700',
  // Phases
  phase_1: 'bg-accent/15 text-accent',
  phase_2: 'bg-amber-100 text-amber-700',
  phase_3: 'bg-emerald-100 text-emerald-700',
  parallel: 'bg-violet-100 text-violet-700',
  // Meeting types
  vc: 'bg-accent/15 text-accent',
  angel: 'bg-emerald-100 text-emerald-700',
  operator: 'bg-amber-100 text-amber-700',
  accelerator: 'bg-violet-100 text-violet-700',
  other: 'bg-surface text-dim',
  // Meeting statuses
  need_intro: 'bg-surface text-dim',
  intro_requested: 'bg-amber-100 text-amber-700',
  intro_made: 'bg-accent/15 text-accent',
  scheduled: 'bg-violet-100 text-violet-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-emerald-100 text-emerald-700',
  no_response: 'bg-red-100 text-red-700',
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
  const color = statusColors[value] || 'bg-surface text-dim';
  const label = displayLabels[value] || value;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${color} ${className}`}>
      {label}
    </span>
  );
}
