import React from 'react';
import { LucideIcon } from 'lucide-react';
import { FOCUS_RING_CLASS } from '../../utils/uiClasses';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  shortLabel?: string;
  icon?: LucideIcon;
}

export type SegmentedTone = 'brand' | 'ios';

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  disabled?: boolean;
  ariaLabel?: string;
  layout?: 'vertical' | 'compact' | 'horizontal' | 'ios';
  tone?: SegmentedTone;
  columns?: number;
}

function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  disabled = false,
  ariaLabel,
  layout = 'horizontal',
  tone = 'brand',
  columns,
}: SegmentedControlProps<T>) {
  const effectiveLayout = layout === 'ios' || tone === 'ios' ? 'ios' : layout;
  const gridCols = columns ?? (effectiveLayout === 'vertical' ? 3 : options.length);

  const wrapperClass =
    effectiveLayout === 'compact'
      ? 'inline-flex gap-1 rounded-lg bg-stone-100 p-1'
      : effectiveLayout === 'ios'
        ? 'flex w-full p-1 rounded-[9px] bg-[rgba(120,120,128,0.16)]'
        : 'grid w-full gap-1 rounded-xl bg-stone-50 p-1';

  const getButtonClass = (isSelected: boolean) => {
    if (effectiveLayout === 'ios') {
      return `flex-1 rounded-[7px] py-1.5 text-[13px] font-medium transition-all active:scale-[0.98] ${
        isSelected
          ? 'bg-white text-black shadow-sm'
          : 'text-[rgba(60,60,67,0.6)] hover:text-stone-800'
      }`;
    }

    if (effectiveLayout === 'vertical') {
      return `flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[11px] leading-tight sm:text-xs ${
        isSelected
          ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
          : 'text-stone-600 hover:bg-orange-50 hover:text-orange-700'
      }`;
    }

    if (effectiveLayout === 'compact') {
      return `min-w-[2.25rem] rounded-md px-2 py-1 text-xs ${
        isSelected
          ? 'bg-white text-orange-600 shadow-sm'
          : 'text-stone-600 hover:text-stone-800'
      }`;
    }

    return `rounded-lg px-2.5 py-2 text-[11px] ${
      isSelected
        ? 'bg-orange-500 text-white shadow-sm'
        : 'text-stone-600 hover:bg-orange-50 hover:text-orange-700'
    }`;
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={wrapperClass}
      style={effectiveLayout !== 'compact' && effectiveLayout !== 'ios'
        ? { gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }
        : undefined}
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            disabled={disabled}
            aria-pressed={isSelected}
            className={`
              cursor-pointer transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50
              ${effectiveLayout === 'ios' ? 'font-medium' : 'font-bold'}
              ${FOCUS_RING_CLASS}
              ${getButtonClass(isSelected)}
            `}
          >
            {Icon && <Icon size={effectiveLayout === 'vertical' ? 14 : 12} />}
            {option.shortLabel ? (
              <>
                <span className="hidden sm:inline">{option.label}</span>
                <span className="sm:hidden">{option.shortLabel}</span>
              </>
            ) : (
              <span className={effectiveLayout === 'vertical' ? 'max-w-full whitespace-normal break-words text-center' : 'truncate'}>
                {option.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
