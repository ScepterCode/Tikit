import { Crown, Star, Lock } from 'lucide-react';

interface TierBadgeProps {
  tier: 'regular' | 'special' | 'legend';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function TierBadge({ tier, size = 'md', showIcon = true }: TierBadgeProps) {
  const config = {
    regular: {
      label: 'Regular',
      icon: Lock,
      bgColor: '#f3f4f6',
      textColor: '#6b7280',
      borderColor: '#e5e7eb'
    },
    special: {
      label: 'Special',
      icon: Star,
      bgColor: '#faf5ff',
      textColor: '#9333ea',
      borderColor: '#e9d5ff'
    },
    legend: {
      label: 'Legend',
      icon: Crown,
      bgColor: '#fefce8',
      textColor: '#eab308',
      borderColor: '#fef3c7'
    }
  };

  const sizeConfig = {
    sm: {
      padding: '4px 8px',
      fontSize: '11px',
      iconSize: 12,
      borderRadius: '6px'
    },
    md: {
      padding: '6px 12px',
      fontSize: '13px',
      iconSize: 14,
      borderRadius: '8px'
    },
    lg: {
      padding: '8px 16px',
      fontSize: '15px',
      iconSize: 16,
      borderRadius: '10px'
    }
  };

  const tierConfig = config[tier];
  const sizeStyle = sizeConfig[size];
  const Icon = tierConfig.icon;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: sizeStyle.padding,
        backgroundColor: tierConfig.bgColor,
        color: tierConfig.textColor,
        border: `1px solid ${tierConfig.borderColor}`,
        borderRadius: sizeStyle.borderRadius,
        fontSize: sizeStyle.fontSize,
        fontWeight: '600',
        whiteSpace: 'nowrap'
      }}
    >
      {showIcon && <Icon size={sizeStyle.iconSize} />}
      {tierConfig.label}
    </span>
  );
}
