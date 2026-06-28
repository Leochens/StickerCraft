import React from 'react';

interface IosTextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  suffix?: React.ReactNode;
  containerClassName?: string;
}

const IosTextField = React.forwardRef<HTMLInputElement, IosTextFieldProps>(
  ({ suffix, containerClassName = '', className = '', ...props }, ref) => (
    <div
      className={`
        relative mt-1 rounded-[10px] bg-[var(--sc-surface-muted)]
        ring-1 ring-[rgba(60,60,67,0.1)] transition-shadow duration-200
        focus-within:ring-2 focus-within:ring-orange-400/40
        ${containerClassName}
      `.trim()}
    >
      <input
        ref={ref}
        className={`
          ios-input block w-full bg-transparent px-3 py-2.5 text-[15px] text-black
          placeholder:text-[rgba(60,60,67,0.35)] focus-visible:outline-none
          ${suffix ? 'pr-11' : ''}
          ${className}
        `.trim()}
        {...props}
      />
      {suffix && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5">
          <div className="pointer-events-auto">{suffix}</div>
        </div>
      )}
    </div>
  ),
);

IosTextField.displayName = 'IosTextField';

export default IosTextField;
