'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/lib/UserContext';

const navItems = [
  { href: '/', label: 'Dashboard', icon: DashboardIcon },
  { href: '/verticals', label: 'Verticals', icon: VerticalsIcon },
  { href: '/conversations', label: 'Conversations', icon: ConversationsIcon },
  { href: '/tasks', label: 'Tasks', icon: TasksIcon },
  { href: '/meetings', label: 'SF Meetings', icon: MeetingsIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  const initials: Record<string, string> = { Adham: 'AB', Aly: 'AE', Youssif: 'YS' };

  return (
    <aside className="w-56 h-screen bg-surface border-r border-border flex flex-col fixed left-0 top-0 z-40">
      <div className="px-4 py-5 border-b border-border">
        <h1 className="text-text text-sm font-semibold tracking-tight">Exploration Tracker</h1>
        <p className="text-dim text-xs mt-0.5">Caddy - Feb/Mar 2025</p>
      </div>

      <nav className="flex-1 py-3 px-2">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors mb-0.5 ${
                active
                  ? 'bg-card text-accent'
                  : 'text-muted hover:text-text hover:bg-card/50'
              }`}
            >
              <item.icon active={active} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={() => {
            localStorage.removeItem('exploration-tracker-user');
            window.location.reload();
          }}
          className="flex items-center gap-2 w-full px-3 py-2 rounded text-sm text-muted hover:text-text hover:bg-card/50 transition-colors"
        >
          <span className="w-6 h-6 rounded bg-accent/15 text-accent text-xs font-mono font-medium flex items-center justify-center">
            {initials[user || ''] || '?'}
          </span>
          <span>{user}</span>
        </button>
      </div>
    </aside>
  );
}

function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={active ? 'text-accent' : 'text-dim'}>
      <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function VerticalsIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={active ? 'text-accent' : 'text-dim'}>
      <path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ConversationsIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={active ? 'text-accent' : 'text-dim'}>
      <path d="M2 3h12v8H5l-3 3V3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function TasksIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={active ? 'text-accent' : 'text-dim'}>
      <rect x="1" y="2" width="14" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 2v12M10 2v12" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function MeetingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={active ? 'text-accent' : 'text-dim'}>
      <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
