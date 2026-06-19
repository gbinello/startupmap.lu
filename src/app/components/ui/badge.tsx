import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[var(--surface)] text-[var(--foreground-secondary)] border border-[var(--border)]',
        primary: 'bg-[var(--primary-light)] text-[var(--primary)]',
        startup: 'bg-blue-50 text-blue-700',
        investor: 'bg-green-50 text-green-700',
        accelerator: 'bg-amber-50 text-amber-700',
        service_provider: 'bg-slate-100 text-slate-700',
        seed: 'bg-violet-50 text-violet-700',
        'series-a': 'bg-blue-50 text-blue-700',
        'series-b': 'bg-indigo-50 text-indigo-700',
        'series-c': 'bg-purple-50 text-purple-700',
        growth: 'bg-emerald-50 text-emerald-700',
        bootstrapped: 'bg-orange-50 text-orange-700',
        acquired: 'bg-slate-100 text-slate-700',
        success: 'bg-green-50 text-green-700',
        warning: 'bg-amber-50 text-amber-700',
        danger: 'bg-red-50 text-red-700',
        outline: 'border border-[var(--border-strong)] text-[var(--foreground-secondary)] bg-white',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
