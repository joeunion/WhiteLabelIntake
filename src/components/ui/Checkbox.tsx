"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  helperText?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, helperText, className = "", id, ...props }, ref) => {
    const checkboxId = id || props.name;

    return (
      <div className={`flex items-start gap-3 ${className}`}>
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className="
            mt-1 h-5 w-5
            rounded border-border
            text-brand-teal
            focus:ring-brand-teal focus:ring-offset-0
            cursor-pointer
          "
          {...props}
        />
        <div className="flex flex-col">
          <label htmlFor={checkboxId} className="text-base text-foreground cursor-pointer">
            {label}
          </label>
          {helperText && (
            <p className="text-xs text-muted mt-0.5">{helperText}</p>
          )}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
