"use client";

interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  name: string;
  label?: string;
  helperText?: string;
  error?: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
}

export function RadioGroup({
  name,
  label,
  helperText,
  error,
  options,
  value,
  onChange,
  required,
}: RadioGroupProps) {
  return (
    <fieldset className="flex flex-col gap-3">
      {label && (
        <legend className="text-sm font-medium text-muted mb-1">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </legend>
      )}
      {helperText && (
        <p className="text-xs text-muted -mt-2 mb-1">{helperText}</p>
      )}
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`
              flex items-start gap-3 p-3
              border rounded-[var(--radius-input)]
              cursor-pointer transition-colors duration-150
              ${value === option.value
                ? "border-brand-teal bg-brand-teal/5"
                : "border-border hover:border-gray-medium"}
            `}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange?.(option.value)}
              className="mt-0.5 h-4 w-4 text-brand-teal focus:ring-brand-teal"
            />
            <div>
              <span className="text-base text-foreground">{option.label}</span>
              {option.description && (
                <p className="text-xs text-muted mt-0.5">{option.description}</p>
              )}
            </div>
          </label>
        ))}
      </div>
      {error && (
        <p className="text-xs text-error">{error}</p>
      )}
    </fieldset>
  );
}
