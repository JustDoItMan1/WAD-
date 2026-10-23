'use client';
import { useState, type FormEvent } from 'react';

// Client-side validation built on the HTML5 Constraint Validation API.
// The server validates again; this gives instant, friendly feedback.

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const isField = (element: EventTarget | Element): element is Field =>
  (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement)
  && Boolean(element.id) && element.type !== 'hidden';

const messageFor = (input: Field) => {
  const { validity } = input;
  const label = input.labels?.[0]?.textContent?.replace('*', '').trim() || 'This field';
  if (validity.valueMissing && input.type === 'checkbox') return 'Tick this box to continue.';
  if (validity.valueMissing) return input.dataset.requiredMessage ?? `${label} is required.`;
  if (validity.typeMismatch) return `Enter a valid ${input.type === 'email' ? 'email address' : 'value'}.`;
  if (validity.tooShort) return `${label} must be at least ${(input as HTMLInputElement).minLength} characters.`;
  if (validity.rangeUnderflow) return `${label} must be at least ${(input as HTMLInputElement).min}.`;
  if (validity.rangeOverflow) return `${label} must be at most ${(input as HTMLInputElement).max}.`;
  if (validity.patternMismatch) return input.dataset.patternMessage ?? `${label} is in the wrong format.`;
  if (validity.customError) return input.validationMessage;
  return '';
};

// `extraChecks` can add cross-field rules with setCustomValidity()
export const useFormValidation = (extraChecks: (form: HTMLFormElement) => void = () => {}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const check = (input: Field) => {
    if (input.form) extraChecks(input.form);
    const message = input.validity.valid ? '' : messageFor(input);
    input.setAttribute('aria-invalid', String(Boolean(message)));
    setErrors((current) => ({ ...current, [input.id]: message }));
    return !message;
  };

  const onBlur = (event: FormEvent<HTMLFormElement>) => {
    if (isField(event.target)) check(event.target);
  };

  // Once a field shows an error, re-check it on every keystroke so the message clears as soon as it is fixed
  const onInput = (event: FormEvent<HTMLFormElement>) => {
    if (isField(event.target) && event.target.getAttribute('aria-invalid') === 'true') check(event.target);
  };

  const validate = (form: HTMLFormElement) => {
    extraChecks(form);
    const fields = [...form.elements].filter(isField);
    const valid = fields.map(check).every(Boolean);
    fields.find((input) => !input.validity.valid)?.focus();
    return valid;
  };

  const reset = () => setErrors({});

  return { errors, validate, reset, formProps: { noValidate: true, onBlur, onInput } };
};

// Reads every named field of a form into a plain object (checkboxes become true/false)
export const formToObject = (form: HTMLFormElement) => {
  const data: Record<string, unknown> = Object.fromEntries(new FormData(form));
  form.querySelectorAll<HTMLInputElement>('input[type="checkbox"][name]').forEach((box) => {
    data[box.name] = box.checked;
  });
  return data;
};
