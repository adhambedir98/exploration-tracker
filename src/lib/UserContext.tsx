'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TeamMember } from './types';

interface UserContextType {
  user: TeamMember | null;
  setUser: (user: TeamMember) => void;
}

const UserContext = createContext<UserContextType>({ user: null, setUser: () => {} });

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<TeamMember | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('exploration-tracker-user');
    if (stored && ['Adham', 'Aly', 'Youssif'].includes(stored)) {
      setUserState(stored as TeamMember);
    }
    setLoaded(true);
  }, []);

  const setUser = (u: TeamMember) => {
    localStorage.setItem('exploration-tracker-user', u);
    setUserState(u);
  };

  if (!loaded) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-dim text-sm">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="bg-card border border-border rounded p-8 max-w-sm w-full">
          <h1 className="text-text text-lg font-semibold mb-1">Exploration Tracker</h1>
          <p className="text-muted text-sm mb-6">Who are you?</p>
          <div className="flex flex-col gap-3">
            {(['Adham', 'Aly', 'Youssif'] as TeamMember[]).map((name) => (
              <button
                key={name}
                onClick={() => setUser(name)}
                className="w-full px-4 py-3 bg-surface border border-border rounded text-text text-sm font-medium hover:border-accent hover:text-accent transition-colors text-left"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
