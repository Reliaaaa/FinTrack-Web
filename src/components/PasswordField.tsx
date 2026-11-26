'use client';

import { useId, useState, type InputHTMLAttributes } from 'react';
import { MotionButton } from './MotionButton';

export function PasswordField({ label, ...input }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id'> & { label: string }) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <label htmlFor={id}>{label}</label>
      <div className="password-control">
        <input {...input} id={id} type={visible ? 'text' : 'password'} spellCheck={false} autoCapitalize="none" />
        <MotionButton type="button" className="password-toggle" aria-controls={id}
          aria-label={visible ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
          onClick={() => setVisible(value => !value)}>
          {visible ? 'Sembunyikan' : 'Lihat'}
        </MotionButton>
      </div>
    </div>
  );
}
