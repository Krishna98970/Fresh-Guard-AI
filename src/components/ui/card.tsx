import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: 'emerald' | 'cyan' | 'none';
}

export function Card({
  children,
  className,
  hover = false,
  glow = 'none',
  ...props
}: CardProps) {
  const glowStyles = {
    none: '',
    emerald: 'glass-glow-emerald',
    cyan: 'glass-glow-cyan',
  };

  return (
    <div
      className={cn(
        'glass-card rounded-2xl p-6 border border-white/5 relative overflow-hidden',
        hover && 'glass-card-hover',
        glowStyles[glow],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-base font-semibold tracking-tight text-white', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs text-slate-400 mt-0.5', className)} {...props}>
      {children}
    </p>
  );
}
