import React from 'react';

interface ChipGroupProps {
  children: React.ReactNode;
  ariaLabel?: string;
  className?: string;
}

const ChipGroup: React.FC<ChipGroupProps> = ({ children, ariaLabel, className = '' }) => (
  <div
    role="group"
    aria-label={ariaLabel}
    className={`flex flex-wrap gap-2 ${className}`.trim()}
  >
    {children}
  </div>
);

export default ChipGroup;
