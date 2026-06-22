import React from 'react';
import { FOCUS_RING_CLASS } from '../../utils/uiClasses';

export type IconButtonVariant = 'default' | 'emerald' | 'indigo' | 'rose' | 'ghost';
export type IconButtonSize = 'sm' | 'md';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  tooltip?: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  tooltipClassName?: string;
  href?: string;
}

const variantClasses: Record<IconButtonVariant, string> = {
  default: 'text-stone-700 hover:bg-orange-50 hover:text-orange-600',
  emerald: 'text-emerald-700 hover:bg-emerald-50 hover:text-emerald-900',
  indigo: 'text-indigo-700 hover:bg-indigo-50 hover:text-indigo-900',
  rose: 'bg-white text-stone-400 shadow-sm hover:bg-rose-50 hover:text-rose-500 hover:shadow-md',
  ghost: 'text-stone-500 hover:bg-stone-100 hover:text-stone-800',
};

const sizeClasses: Record<IconButtonSize, string> = {
  sm: 'p-2',
  md: 'inline-flex h-8 w-8 items-center justify-center',
};

const TOOLTIP_CLASS =
  'pointer-events-none absolute -top-9 left-1/2 z-30 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-lg bg-stone-900 px-2.5 py-1 text-[10px] font-black text-white opacity-0 shadow-lg transition-all duration-150 group-hover/tooltip:translate-y-0 group-hover/tooltip:opacity-100';

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      tooltip,
      variant = 'default',
      size = 'md',
      tooltipClassName = '',
      className = '',
      type = 'button',
      href,
      ...props
    },
    ref,
  ) => {
    const withTooltip = Boolean(tooltip);

    const sharedClassName = `
      group/tooltip relative inline-flex cursor-pointer items-center justify-center rounded-full transition-colors duration-200
      disabled:cursor-not-allowed disabled:opacity-50
      ${FOCUS_RING_CLASS}
      ${sizeClasses[size]}
      ${variantClasses[variant]}
      ${variant === 'rose' && size === 'sm' ? 'scale-90 hover:scale-100' : ''}
      ${className}
    `.trim();

    const content = (
      <>
        {icon}
        {withTooltip && (
          <span className={`${TOOLTIP_CLASS} ${tooltipClassName}`.trim()}>{tooltip}</span>
        )}
      </>
    );

    if (href) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          target="_blank"
          rel="noreferrer"
          className={sharedClassName}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        className={sharedClassName}
        {...props}
      >
        {content}
      </button>
    );
  },
);

IconButton.displayName = 'IconButton';

export default IconButton;
