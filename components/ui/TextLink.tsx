import React from 'react';
import { FOCUS_RING_CLASS } from '../../utils/uiClasses';

interface TextLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  icon?: React.ReactNode;
  inline?: boolean;
}

const TextLink = React.forwardRef<HTMLAnchorElement, TextLinkProps>(
  ({ icon, inline = false, className = '', children, target = '_blank', rel = 'noreferrer', ...props }, ref) => (
    <a
      ref={ref}
      target={target}
      rel={rel}
      className={`
        cursor-pointer ios-accent active:opacity-60
        ${inline ? '' : 'inline-flex items-center gap-1'}
        ${inline ? '' : 'text-[15px]'}
        ${FOCUS_RING_CLASS}
        ${className}
      `.trim()}
      {...props}
    >
      {children}
      {icon}
    </a>
  ),
);

TextLink.displayName = 'TextLink';

export default TextLink;
