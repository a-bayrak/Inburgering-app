'use client';

import { useEffect, useRef } from 'react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  preventBackdropClose?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  preventBackdropClose = false,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Lock scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !preventBackdropClose && onClose()}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        className="relative bg-white rounded-2xl w-full max-w-md shadow-xl z-10 overflow-hidden
                   animate-[slideUp_0.25s_ease-out]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            {title && <h2 className="text-lg font-bold text-gray-900">{title}</h2>}
            {/* Close button ALWAYS visible — zero dark patterns (PRD §9.3) */}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors ms-auto"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
