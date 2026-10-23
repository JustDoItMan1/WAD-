import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  children: ReactElement<{ 'aria-describedby'?: string }>;
}

// Label, control, hint and error message, wired together for screen readers
export const Field = ({ id, label, required, hint, error, children }: FieldProps) => (
  <div className={error ? 'field has-error' : 'field'}>
    <label className={required ? 'required' : undefined} htmlFor={id}>{label}</label>
    {isValidElement(children) ? cloneElement(children, { 'aria-describedby': `${id}-error` }) : children}
    {hint && <p className="field-hint">{hint}</p>}
    <p className="field-error" id={`${id}-error`}>{error}</p>
  </div>
);
