import React from 'react';

export type BadgeVariant =
  | 'neutral'
  | 'orange'
  | 'orange-outline'
  | 'overlay'
  | 'section'
  | 'count'
  | 'count-active'
  | 'tab-active'
  | 'tab-inactive'
  | 'success'
  | 'warning';

export type BadgeSize = 'xs' | 'sm' | 'md';
export type BadgeShape = 'pill' | 'rounded';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  shape?: BadgeShape;
  icon?: React.ReactNode;
  title?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'border border-stone-200 bg-stone-50 text-stone-600',
  orange: 'border border-orange-100 bg-orange-50 text-orange-600',
  'orange-outline': 'border border-orange-100 bg-white text-orange-700',
  overlay: 'border border-orange-100 bg-white/95 text-orange-700 shadow-sm',
  section: 'border-transparent bg-orange-100 text-orange-700',
  count: 'border-transparent bg-stone-100 text-stone-500',
  'count-active': 'border-transparent bg-white/15 text-white',
  'tab-active': 'border-transparent bg-white text-orange-600',
  'tab-inactive': 'border-transparent bg-orange-500 text-white',
  success: 'border-transparent bg-emerald-50 text-emerald-700',
  warning: 'border-transparent bg-orange-50 text-[var(--sc-primary)]',
};

const sizeClasses: Record<BadgeSize, string> = {
  xs: 'px-1.5 py-0.5 text-[11px]',
  sm: 'px-2 py-1 text-[11px]',
  md: 'px-2 py-1 text-xs',
};

const shapeClasses: Record<BadgeShape, string> = {
  pill: 'rounded-full',
  rounded: 'rounded',
};

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'xs',
  shape = 'pill',
  icon,
  className = '',
  title,
  ...rest
}) => {
  return (
    <span
      title={title}
      className={`
        inline-flex max-w-full items-center gap-1 font-bold
        ${shapeClasses[shape]}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `.trim()}
      {...rest}
    >
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
};

export default Badge;
