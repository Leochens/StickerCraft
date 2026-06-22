import React, { RefObject, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAnchoredPosition } from '../../hooks/useAnchoredPosition';

interface DropdownPortalProps {
  isOpen: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  maxHeight?: number;
  elevated?: boolean;
}

const DropdownPortal: React.FC<DropdownPortalProps> = ({
  isOpen,
  anchorRef,
  onClose,
  children,
  className = '',
  maxHeight,
  elevated = false,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const position = useAnchoredPosition(isOpen, anchorRef, { maxHeight });

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!anchorRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen || !position) return null;

  return createPortal(
    <>
      {elevated && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/8 backdrop-blur-[2px] animate-fade-in"
          aria-hidden
          onMouseDown={onClose}
        />
      )}
      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          width: position.width,
          maxHeight: position.maxHeight,
          zIndex: 50,
        }}
        className={className}
      >
        {children}
      </div>
    </>,
    document.body,
  );
};

export default DropdownPortal;
