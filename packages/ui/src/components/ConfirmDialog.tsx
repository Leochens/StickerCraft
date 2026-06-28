import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'default',
  onConfirm,
  onCancel,
}) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-scale-in"
        onClick={(event) => event.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <div className="mb-4 flex items-start gap-3">
          <div
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
              isDanger ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-orange-600'
            }`}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 id="confirm-dialog-title" className="text-lg font-bold text-stone-900">
              {title}
            </h3>
            <p id="confirm-dialog-message" className="mt-1 text-sm leading-relaxed text-stone-600">
              {message}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 cursor-pointer rounded-xl border border-stone-200 bg-white py-2.5 text-sm font-bold text-stone-600 transition-colors duration-200 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
          >
            {cancelLabel ?? t('action_cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-bold text-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              isDanger
                ? 'bg-rose-500 hover:bg-rose-600 focus-visible:ring-rose-400'
                : 'bg-orange-500 hover:bg-orange-600 focus-visible:ring-orange-400'
            }`}
          >
            {confirmLabel ?? t('action_confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
