import React from 'react';

interface RiskBadgeProps {
  score?: number;
  tier: 'low' | 'medium' | 'high' | 'critical' | string;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const TIER_STYLES: Record<string, { bg: string; text: string; border: string; label: string; dot: string }> = {
  low: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    label: 'Low Risk',
    dot: 'bg-emerald-500'
  },
  medium: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    label: 'Medium Risk',
    dot: 'bg-amber-500'
  },
  high: {
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200',
    label: 'High Risk',
    dot: 'bg-orange-500'
  },
  critical: {
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    label: 'Critical Risk',
    dot: 'bg-rose-600'
  }
};

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  score,
  tier = 'low',
  showScore = true,
  size = 'md'
}) => {
  const normalizedTier = (tier || 'low').toLowerCase();
  const config = TIER_STYLES[normalizedTier] || TIER_STYLES.low;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
    lg: 'px-3 py-1.5 text-sm font-semibold'
  }[size];

  return (
    <span
      id={`risk-badge-${normalizedTier}`}
      className={`inline-flex items-center gap-1.5 rounded-md border ${config.bg} ${config.text} ${config.border} ${sizeClasses} whitespace-nowrap`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
      {showScore && typeof score === 'number' && (
        <span className="font-mono font-bold opacity-90">
          ({score.toFixed(1)})
        </span>
      )}
    </span>
  );
};
