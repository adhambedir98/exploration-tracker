import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export function formatDateET(dateStr: string | null, fmt: string = 'MMM d, yyyy'): string {
  if (!dateStr) return '--';
  try {
    const date = parseISO(dateStr);
    const etDate = toZonedTime(date, 'America/New_York');
    return format(etDate, fmt);
  } catch {
    return dateStr;
  }
}

export function formatDatetimeET(dateStr: string | null): string {
  return formatDateET(dateStr, 'MMM d, yyyy h:mm a');
}

export function relativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDateET(dateStr, 'MMM d');
}

export function avgScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}
