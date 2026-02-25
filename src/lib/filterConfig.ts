'use client';

import { useState, useEffect, useCallback } from 'react';
import { Idea, CompetitionLevel } from './types';

export interface FilterThresholds {
  tam_min_billions: number;
  competition_allowed: CompetitionLevel[];
  problem_severity_min: number;
  market_founder_fit_min: number;
  execution_difficulty_max: number;
  time_to_100m_arr_max_months: number;
  second_buyer_min: number;
  passion_min: number;
}

export const DEFAULT_THRESHOLDS: FilterThresholds = {
  tam_min_billions: 1,
  competition_allowed: ['Low', 'Medium'],
  problem_severity_min: 8,
  market_founder_fit_min: 8,
  execution_difficulty_max: 5,
  time_to_100m_arr_max_months: 60,
  second_buyer_min: 8,
  passion_min: 8,
};

const STORAGE_KEY = 'exploration-filter-thresholds';

export function useFilterThresholds() {
  const [thresholds, setThresholds] = useState<FilterThresholds>(DEFAULT_THRESHOLDS);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setThresholds({ ...DEFAULT_THRESHOLDS, ...parsed });
      }
    } catch { /* use defaults */ }
    setLoaded(true);
  }, []);

  // Save to localStorage on change (after initial load)
  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(thresholds));
    }
  }, [thresholds, loaded]);

  const updateThreshold = useCallback(<K extends keyof FilterThresholds>(key: K, value: FilterThresholds[K]) => {
    setThresholds(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setThresholds(DEFAULT_THRESHOLDS);
  }, []);

  return { thresholds, updateThreshold, resetToDefaults, loaded };
}

// Funnel filter functions — each takes an idea and thresholds, returns pass/fail
export const FUNNEL_STEPS = [
  {
    key: 'tam',
    label: (t: FilterThresholds) => `TAM > $${t.tam_min_billions}B`,
    phase: 'desktop_research' as const,
    filter: (idea: Idea, t: FilterThresholds) => (idea.tam_estimate_billions || 0) > t.tam_min_billions,
  },
  {
    key: 'competition',
    label: (t: FilterThresholds) => `Competition: ${t.competition_allowed.join('/')}`,
    phase: 'desktop_research' as const,
    filter: (idea: Idea, t: FilterThresholds) => t.competition_allowed.includes(idea.competition_level as CompetitionLevel),
  },
  {
    key: 'severity',
    label: (t: FilterThresholds) => `Severity >= ${t.problem_severity_min}`,
    phase: 'desktop_research' as const,
    filter: (idea: Idea, t: FilterThresholds) => (idea.problem_severity_score || 0) >= t.problem_severity_min,
  },
  {
    key: 'fit',
    label: (t: FilterThresholds) => `MF Fit >= ${t.market_founder_fit_min}`,
    phase: 'desktop_research' as const,
    filter: (idea: Idea, t: FilterThresholds) => (idea.market_founder_fit_score || 0) >= t.market_founder_fit_min,
  },
  {
    key: 'execution',
    label: (t: FilterThresholds) => `Exec Difficulty <= ${t.execution_difficulty_max}`,
    phase: 'desktop_research' as const,
    filter: (idea: Idea, t: FilterThresholds) => (idea.execution_difficulty_score || 10) <= t.execution_difficulty_max,
  },
  {
    key: 'time_100m',
    label: (t: FilterThresholds) => `$100M ARR <= ${t.time_to_100m_arr_max_months >= 12 ? `${Math.round(t.time_to_100m_arr_max_months / 12)}yr` : `${t.time_to_100m_arr_max_months}mo`}`,
    phase: 'talk_to_users' as const,
    filter: (idea: Idea, t: FilterThresholds) => (idea.time_to_100m_arr_months || 999) <= t.time_to_100m_arr_max_months,
  },
  {
    key: 'second_buyer',
    label: (t: FilterThresholds) => `2nd Buyer >= ${t.second_buyer_min}`,
    phase: 'talk_to_users' as const,
    filter: (idea: Idea, t: FilterThresholds) => (idea.second_buyer_score || 0) >= t.second_buyer_min,
  },
  {
    key: 'passion',
    label: (t: FilterThresholds) => `Passion >= ${t.passion_min}`,
    phase: 'talk_to_users' as const,
    filter: (idea: Idea, t: FilterThresholds) => (idea.passion_score || 0) >= t.passion_min,
  },
] as const;

// Helper to check if an idea has been scored
export function isScored(idea: Idea): boolean {
  return idea.tam_estimate_billions !== null;
}

// Format TAM as human-readable string
export function formatTAM(billions: number | null): string {
  if (billions === null) return '--';
  if (billions >= 1) return `$${billions % 1 === 0 ? billions : billions.toFixed(1)}B`;
  const millions = Math.round(billions * 1000);
  return `$${millions}M`;
}

// Format months as human-readable string
export function formatMonths(months: number | null): string {
  if (months === null) return '--';
  if (months >= 12) {
    const years = months / 12;
    return `${years % 1 === 0 ? years : years.toFixed(1)}yr`;
  }
  return `${months}mo`;
}
