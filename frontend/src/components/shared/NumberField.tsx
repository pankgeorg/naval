import { useState } from 'react';

interface Props {
  value: number | null;
  onChange: (value: number | null) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  /** Shown when value is null AND the field is not focused. If omitted, the field shows empty. */
  fallback?: number;
  step?: string;
  min?: string;
  max?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
}

/**
 * Number input without the controlled-react quirks of `type="number"`:
 * - Backspacing the last digit works (empty → null, not auto-reset to 0).
 * - Intermediate states like "1." while typing "1.5" aren't silently reparsed.
 * - Scroll-wheel doesn't change the value.
 * - `inputMode="decimal"` still surfaces a numeric keypad on mobile.
 *
 * Parent stores a `number | null`. While focused, raw keystrokes live in
 * local text state; on blur, display snaps back to value → fallback → empty.
 */
export default function NumberField({
  value,
  onChange,
  onBlur,
  onFocus,
  fallback,
  step,
  min,
  max,
  placeholder,
  className,
  disabled,
  id,
  'aria-label': ariaLabel,
}: Props) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState<string>('');

  const displayValue = focused
    ? text
    : value !== null
      ? String(value)
      : fallback !== undefined
        ? String(fallback)
        : '';

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      className={className}
      step={step}
      min={min}
      max={max}
      placeholder={placeholder}
      disabled={disabled}
      aria-label={ariaLabel}
      value={displayValue}
      onFocus={() => {
        setFocused(true);
        setText(value !== null ? String(value) : '');
        onFocus?.();
      }}
      onBlur={() => {
        setFocused(false);
        onBlur?.();
      }}
      onChange={(e) => {
        const v = e.target.value;
        setText(v);
        if (v === '' || v === '-' || v === '.') {
          onChange(null);
          return;
        }
        const parsed = parseFloat(v);
        if (!Number.isNaN(parsed)) {
          onChange(parsed);
        }
      }}
    />
  );
}
