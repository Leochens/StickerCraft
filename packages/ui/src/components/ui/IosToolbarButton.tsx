import React from 'react';
import { FOCUS_RING_CLASS } from '../../utils/uiClasses';

interface IosToolbarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  align?: 'start' | 'end';
  emphasis?: boolean;
}

const IosToolbarButton = React.forwardRef<HTMLButtonElement, IosToolbarButtonProps>(
  ({ align = 'start', emphasis = false, className = '', children, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={`
        min-w-[52px] cursor-pointer rounded-lg text-[17px] ios-accent
        active:opacity-60 disabled:cursor-not-allowed disabled:opacity-50
        ${align === 'end' ? 'text-right' : 'text-left'}
        ${emphasis ? 'font-semibold' : 'font-normal'}
        ${FOCUS_RING_CLASS}
        ${className}
      `.trim()}
      {...props}
    >
      {children}
    </button>
  ),
);

IosToolbarButton.displayName = 'IosToolbarButton';

export default IosToolbarButton;
