import { useEffect, useId, useRef, type FormEventHandler, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { MotionButton } from './MotionButton';

type EditorModalProps = {
  title: string;
  eyebrow?: string;
  submitLabel: string;
  isTransaction?: boolean;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
};

export function EditorModal({ title, eyebrow, submitLabel, isTransaction, saving, error, onClose, onSubmit, children }: EditorModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.querySelector<HTMLElement>('input,select,textarea')?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
      if (event.key !== 'Tab') return;
      const controls = [...dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])',
      )].filter(item => item.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  return <div className="modal-backdrop" data-transaction-editor={isTransaction || undefined} onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="modal-head">
        <div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2 id={titleId}>{title}</h2></div>
        <MotionButton type="button" className="icon-button" onClick={onClose} aria-label="Tutup"><X size={20} /></MotionButton>
      </div>
      <form onSubmit={onSubmit} className="modal-form">
        {children}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-footer">
          <MotionButton type="button" className="button button-outline" onClick={onClose}>Batal</MotionButton>
          <MotionButton type="submit" className="button button-dark" disabled={saving}>{saving ? 'Menyimpan…' : submitLabel}</MotionButton>
        </div>
      </form>
    </div>
  </div>;
}
