import React from 'react';
import Badge from './Badge';

interface NotificationBadgeProps {
  children: React.ReactNode;
  tabActive?: boolean;
  className?: string;
  busy?: boolean;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  children,
  tabActive = false,
  className = '',
  busy = false,
}) => (
  <Badge
    variant={tabActive ? 'tab-active' : 'tab-inactive'}
    size="xs"
    className={`
      absolute right-3 top-1.5 h-4 min-w-[1rem] justify-center px-1 font-black
      ${busy ? 'animate-pulse' : ''}
      ${className}
    `.trim()}
    aria-busy={busy}
  >
    {children}
  </Badge>
);

export default NotificationBadge;
