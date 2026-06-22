import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Badge from './ui/Badge';
interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultOpen = true,
  children,
  badge,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="rounded-xl border border-orange-100 bg-white shadow-sm shadow-orange-100/30 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors duration-200 hover:bg-orange-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-400"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-4 w-1 flex-shrink-0 rounded-full bg-orange-500" />
          <span className="truncate text-[11px] font-black uppercase tracking-wider text-stone-700">
            {title}
          </span>
          {badge && (
            <Badge variant="section" size="xs" className="text-[11px]">
              {badge}
            </Badge>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 text-stone-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="space-y-4 border-t border-orange-50 px-3 py-3 animate-fade-in">
          {children}
        </div>
      )}
    </section>
  );
};

export default CollapsibleSection;
