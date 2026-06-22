import React from 'react';
import { ChevronDown } from 'lucide-react';
import { FOCUS_RING_CLASS } from '../../utils/uiClasses';

interface IosDisclosureRowProps {
  icon: React.ReactNode;
  label: string;
  expanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
  className?: string;
}

const IosDisclosureRow: React.FC<IosDisclosureRowProps> = ({
  icon,
  label,
  expanded,
  onToggle,
  children,
  className = '',
}) => (
  <>
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className={`
        flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left
        active:bg-[rgba(120,120,128,0.08)]
        ${FOCUS_RING_CLASS}
        ${className}
      `.trim()}
    >
      <div className="flex items-center gap-2.5">
        {icon}
        <span className="text-[17px] text-black">{label}</span>
      </div>
      <ChevronDown
        size={16}
        className={`text-[rgba(60,60,67,0.3)] transition-transform ${expanded ? 'rotate-180' : ''}`}
      />
    </button>

    {expanded && children && (
      <div className="border-t border-[rgba(60,60,67,0.12)] px-4 py-3 space-y-3">
        {children}
      </div>
    )}
  </>
);

export default IosDisclosureRow;
