import React from 'react';

interface MenuItemButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  trailing?: React.ReactNode;
}

const MenuItemButton = React.forwardRef<HTMLButtonElement, MenuItemButtonProps>(
  ({ selected = false, trailing, className = '', children, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={`
        flex w-full cursor-pointer items-center justify-between px-3 py-2.5 text-left
        text-xs font-bold transition-colors duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-400
        disabled:cursor-not-allowed disabled:opacity-50
        ${selected ? 'bg-orange-50 text-orange-700' : 'text-stone-600 hover:bg-stone-50'}
        ${className}
      `.trim()}
      aria-pressed={selected}
      {...props}
    >
      <span>{children}</span>
      {trailing}
    </button>
  ),
);

MenuItemButton.displayName = 'MenuItemButton';

export default MenuItemButton;
