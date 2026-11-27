import { useEffect, useId, useRef, useState } from 'react';
import { MotionButton } from './MotionButton';

export function LogoutDialog({ onClose, onConfirm }: {
  onClose: () => void;
  onConfirm: () => Promise<string | undefined>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    dialogRef.current?.showModal();
    cancelRef.current?.focus();
  }, []);

  const cancel = () => {
    dialogRef.current?.close();
    onClose();
  };

  const confirm = async () => {
    setPending(true);
    setError('');
    try {
      const message = await onConfirm();
      if (!message) return;
      setError(message);
    } catch {
      setError('Gagal keluar. Coba lagi.');
    }
    setPending(false);
  };

  return (
    <dialog
      ref={dialogRef}
      className="logout-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={event => {
        event.preventDefault();
        if (!pending) cancel();
      }}
    >
      <h2 id={titleId}>Keluar dari FinTrack?</h2>
      <p id={descriptionId}>Kamu perlu masuk lagi untuk membuka akunmu.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="logout-dialog-actions">
        <button ref={cancelRef} type="button" className="button button-outline" disabled={pending} onClick={cancel}>
          Batal
        </button>
        <MotionButton type="button" className="button logout-confirm-button" disabled={pending} onClick={confirm}>
          {pending ? 'Sedang keluar…' : 'Ya, keluar'}
        </MotionButton>
      </div>
    </dialog>
  );
}
