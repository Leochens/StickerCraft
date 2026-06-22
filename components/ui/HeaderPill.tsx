import React from 'react';
import { FOCUS_RING_CLASS } from '../../utils/uiClasses';

export type HeaderPillVariant = 'neutral' | 'configured' | 'warning';

interface HeaderPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  variant?: HeaderPillVariant;
}

const variantClasses: Record<HeaderPillVariant, string> = {
  neutral:
    'border border-transparent text-stone-500 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-100',
  configured:
    'border border-[rgba(60,60,67,0.12)] bg-white/80 text-[var(--sc-primary)] hover:bg-white',
  warning:
    'border border-transparent bg-[rgba(249,115,22,0.12)] text-[var(--sc-primary)] hover:bg-[rgba(249,115,22,0.18)]',
};

const HeaderPill = React.forwardRef<HTMLButtonElement, HeaderPillProps>(
  ({ icon, trailing, variant = 'neutral', className = '', children, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={`
        inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5
        text-[13px] font-medium transition-colors duration-200
        ${FOCUS_RING_CLASS}
        ${variantClasses[variant]}
        ${className}
      `.trim()}
      {...props}
    >
      {icon}
      {children}
      {trailing}
    </button>
  ),
);

HeaderPill.displayName = 'HeaderPill';

export default HeaderPill;
