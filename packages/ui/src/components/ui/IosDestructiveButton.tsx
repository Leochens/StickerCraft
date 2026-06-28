import React from 'react';

interface IosDestructiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const IosDestructiveButton = React.forwardRef<HTMLButtonElement, IosDestructiveButtonProps>(
  ({ icon, fullWidth = true, className = '', children, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={`
        inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg
        py-2 text-[15px] text-[var(--ios-danger)]
        active:opacity-60 disabled:cursor-not-allowed disabled:opacity-50
        ${fullWidth ? 'w-full' : ''}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2
        ${className}
      `.trim()}
      {...props}
    >
      {icon}
      {children}
    </button>
  ),
);

IosDestructiveButton.displayName = 'IosDestructiveButton';

export default IosDestructiveButton;
