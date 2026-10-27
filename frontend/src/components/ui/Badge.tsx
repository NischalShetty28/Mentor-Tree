import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    danger: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    info: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    purple: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    outline: 'border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-300 bg-transparent',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium rounded',
    md: 'text-xs px-2.5 py-0.5 font-medium rounded-full',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 border border-transparent tracking-wide select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export const RiskBadge: React.FC<{ level: string }> = ({ level }) => {
  switch (level?.toUpperCase()) {
    case 'CRITICAL':
      return <Badge variant="danger">● Critical Risk</Badge>;
    case 'HIGH':
      return <Badge variant="danger">● High Risk</Badge>;
    case 'MEDIUM':
      return <Badge variant="warning">▲ Medium Risk</Badge>;
    case 'LOW':
      return <Badge variant="info">▼ Low Risk</Badge>;
    default:
      return <Badge variant="success">✓ Normal Standing</Badge>;
  }
};
