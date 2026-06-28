import React from 'react';
import { FOCUS_RING_CLASS } from '../../utils/uiClasses';

export type ChipTone = 'brand' | 'ios' | 'panel';
export type ChipSize = 'sm' | 'md';

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  tone?: ChipTone;
  size?: ChipSize;
  shape?: 'pill' | 'rounded';
}

const sizeClasses: Record<ChipSize, string> = {
  sm: 'px-2 py-1 text-[11px]',
  md: 'px-3 py-1.5 text-[13px]',
};

const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  (
    {
      selected = false,
      tone = 'brand',
      size = 'md',
      shape = 'pill',
      className = '',
      children,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const shapeClass = shape === 'pill' ? 'rounded-full' : 'rounded';

    const toneClasses =
      tone === 'ios'
        ? selected
          ? 'bg-[var(--sc-primary)] text-white shadow-sm'
          : 'bg-[rgba(120,120,128,0.12)] text-[var(--ios-label)] hover:opacity-90 active:opacity-70'
        : tone === 'panel'
          ? selected
            ? 'border-orange-400 bg-white text-orange-600'
            : 'border-stone-200 text-stone-500 hover:border-orange-200 hover:text-stone-700'
          : selected
            ? 'bg-orange-500 text-white shadow-sm'
            : 'bg-stone-100 text-stone-600 hover:bg-orange-50 hover:text-orange-700';

    return (
      <button
        ref={ref}
        type={type}
        aria-pressed={selected}
        className={`
          cursor-pointer border font-medium transition-colors duration-200
          disabled:cursor-not-allowed disabled:opacity-50
          ${shapeClass}
          ${sizeClasses[size]}
          ${tone === 'panel' ? 'border' : tone === 'ios' ? 'border-transparent' : selected ? 'border-transparent' : 'border-transparent'}
          ${toneClasses}
          ${FOCUS_RING_CLASS}
          ${className}
        `.trim()}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Chip.displayName = 'Chip';

export default Chip;
