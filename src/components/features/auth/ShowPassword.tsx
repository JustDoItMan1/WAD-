'use client';

interface ShowPasswordProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const ShowPassword = ({ label, checked, onChange }: ShowPasswordProps) => (
  <label className="checkbox">
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /> {label}
  </label>
);
