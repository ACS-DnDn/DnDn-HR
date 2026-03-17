import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './PasswordRules.css';

const RULES = [
  { label: '8자 이상',      test: (pw: string) => pw.length >= 8 },
  { label: '대문자 포함',   test: (pw: string) => /[A-Z]/.test(pw) },
  { label: '소문자 포함',   test: (pw: string) => /[a-z]/.test(pw) },
  { label: '숫자 포함',     test: (pw: string) => /[0-9]/.test(pw) },
  { label: '특수문자 포함', test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
];

interface Props {
  password: string;
  show: boolean;
}

export function PasswordRules({ password, show }: Props) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (show && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ top: rect.top, left: rect.right + 14 });
    }
    if (!show) setPos(null);
  }, [show]);

  return (
    <>
      <span
        ref={anchorRef}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      />
      {show && pos && createPortal(
        <div className="pw-tooltip" style={{ top: pos.top, left: pos.left }}>
          <ul className="pw-rules">
            {RULES.map((rule) => {
              const ok = rule.test(password);
              return (
                <li key={rule.label} className={ok ? 'pw-rule pw-rule--ok' : 'pw-rule'}>
                  {rule.label}
                  {ok && (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </li>
              );
            })}
          </ul>
        </div>,
        document.body
      )}
    </>
  );
}

export function validatePassword(pw: string): boolean {
  return RULES.every((rule) => rule.test(pw));
}
