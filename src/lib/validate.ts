// Server-side validation helpers (never trust the browser's validation alone)
import { HttpError } from '@/lib/http';

export class ValidationError extends HttpError {
  constructor(message: string) {
    super(message, 400);
  }
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_PATTERN = /^\+?[0-9 ]{7,15}$/;
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const requireText = (value: unknown, label: string, max = 255) => {
  const text = String(value ?? '').trim();
  if (!text) throw new ValidationError(`${label} is required.`);
  if (text.length > max) throw new ValidationError(`${label} must be ${max} characters or fewer.`);
  return text;
};

export const optionalText = (value: unknown, max = 255) => {
  const text = String(value ?? '').trim();
  return text ? text.slice(0, max) : null;
};

export const requireMatch = (value: unknown, pattern: RegExp, message: string) => {
  const text = String(value ?? '').trim();
  if (!pattern.test(text)) throw new ValidationError(message);
  return text;
};

interface NumberRules {
  min?: number;
  max?: number;
  integer?: boolean;
}

export const requireNumber = (value: unknown, label: string, { min = 0, max = Infinity, integer = false }: NumberRules = {}) => {
  const number = Number(value);
  const valid = Number.isFinite(number) && number >= min && number <= max;
  if (!valid || (integer && !Number.isInteger(number))) {
    throw new ValidationError(`${label} must be a ${integer ? 'whole ' : ''}number between ${min} and ${max}.`);
  }
  return number;
};

export const requireId = (value: unknown) => requireNumber(value, 'ID', { min: 1, integer: true });

export const optionalPhone = (value: unknown) => {
  const phone = optionalText(value, 20);
  if (phone && !PHONE_PATTERN.test(phone)) throw new ValidationError('Enter a valid phone number.');
  return phone;
};
