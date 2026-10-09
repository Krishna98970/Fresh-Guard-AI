import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSec < 60) return `${diffInSec}s ago`;
    const diffInMin = Math.floor(diffInSec / 60);
    if (diffInMin < 60) return `${diffInMin}m ago`;
    const diffInHours = Math.floor(diffInMin / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  } catch {
    return dateString;
  }
}

export function getQualityScoreColor(score: number): {
  bg: string;
  text: string;
  border: string;
  dot: string;
  label: string;
} {
  if (score >= 85) {
    return {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-500',
      label: 'Optimal Grade A',
    };
  }
  if (score >= 70) {
    return {
      bg: 'bg-amber-500/10 dark:bg-amber-500/15',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/30',
      dot: 'bg-amber-500',
      label: 'Standard Grade B',
    };
  }
  return {
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/30',
    dot: 'bg-rose-500',
    label: 'Defective Grade C',
  };
}

export function getRiskBadge(risk: 'LOW' | 'MEDIUM' | 'HIGH'): {
  bg: string;
  text: string;
  border: string;
} {
  switch (risk) {
    case 'LOW':
      return {
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        text: 'text-emerald-400',
        border: 'border-emerald-500/20',
      };
    case 'MEDIUM':
      return {
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        text: 'text-amber-400',
        border: 'border-amber-500/20',
      };
    case 'HIGH':
      return {
        bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        text: 'text-rose-400',
        border: 'border-rose-500/20',
      };
  }
}
