'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/lib/UserContext';

const navItems = [
  { href: '/', label: 'Dashboard', icon: DashboardIcon },
  { href: '/generate', label: 'Idea Generator', icon: GenerateIcon },
  { href: '/ideas', label: 'Ideas', icon: IdeasIcon },
  { href: '/sound-lab', label: 'Sound AI Lab', icon: SoundLabIcon },
  { href: '/reference', label: 'Reference DB', icon: ReferenceIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  const initials: Record<string, string> = { Adham: 'AB', Aly: 'AE', Youssif: 'YS' };

  return (
    <aside className="w-56 h-screen bg-surface border-r border-border flex flex-col fixed left-0 top-0 z-40">
      <div className="px-4 py-5 border-b border-border">
        <h1 className="text-text text-sm font-semibold tracking-tight">Exploration Tracker</h1>
        <p className="text-dim text-xs mt-0.5">Caddy - V4</p>
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
      <path d="M1 8l7-6 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 7v6a1 1 0 001 1h8a1 1 0 001-1V7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IdeasIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={active ? 'text-accent' : 'text-dim'}>
      <circle cx="8" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 10.5v2a2 2 0 004 0v-2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ReferenceIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={active ? 'text-accent' : 'text-dim'}>
      <rect x="2" y="1" width="12" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function GenerateIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={active ? 'text-accent' : 'text-dim'}>
      <path d="M8 1v3M8 12v3M1 8h3M12 8h3M3.5 3.5l2 2M10.5 10.5l2 2M12.5 3.5l-2 2M5.5 10.5l-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SoundLabIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={active ? 'text-accent' : 'text-dim'}>
      <path d="M2 10V6M5 12V4M8 14V2M11 12V4M14 10V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

