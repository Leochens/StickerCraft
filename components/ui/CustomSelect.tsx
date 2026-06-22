import React, { useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { FOCUS_RING_CLASS } from '../../utils/uiClasses';
import DropdownPortal from './DropdownPortal';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  placeholder?: string;
}

function CustomSelect<T extends string = string>({
  value,
  onChange,
  options,
  disabled = false,
  id,
  ariaLabel,
  placeholder,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();
  const selected = options.find((option) => option.value === value);

  const handleSelect = (next: T) => {
    onChange(next);
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`
          flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-stone-200
          bg-stone-50 px-3 py-2 text-left text-xs font-bold text-stone-700
          transition-colors duration-200 hover:border-orange-200 hover:bg-white
          disabled:cursor-not-allowed disabled:opacity-50
          ${FOCUS_RING_CLASS}
          ${isOpen ? 'border-orange-400 bg-white ring-2 ring-orange-100' : ''}
        `}
      >
        <span className="truncate">{selected?.label ?? placeholder ?? value}</span>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 text-stone-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <DropdownPortal
        isOpen={isOpen}
        anchorRef={triggerRef}
        onClose={() => setIsOpen(false)}
        maxHeight={224}
        className="overflow-y-auto custom-scrollbar rounded-xl border border-stone-200 bg-white py-1 shadow-xl shadow-stone-200/60 animate-fade-in"
      >
        <ul id={listboxId} role="listbox" aria-label={ariaLabel}>
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  className={`
                    flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left text-xs font-bold
                    transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40
                    ${FOCUS_RING_CLASS}
                    ${isSelected
                      ? 'bg-orange-50 text-orange-700'
                      : 'text-stone-700 hover:bg-stone-50'
                    }
                  `}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check size={14} className="flex-shrink-0 text-orange-500" strokeWidth={3} />}
                </button>
              </li>
            );
          })}
        </ul>
      </DropdownPortal>
    </>
  );
}

export default CustomSelect;
