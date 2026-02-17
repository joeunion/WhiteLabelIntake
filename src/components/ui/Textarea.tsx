"use client";

import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, className = "", id, ...props }, ref) => {
    const textareaId = id || props.name;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-muted"
          >
            {label}
            {props.required && <span className="text-error ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={4}
          className={`
            w-full bg-transparent
            border-[1.5px] border-border
            rounded-[var(--radius-input)]
            px-4 py-3.5
            text-foreground text-base
            placeholder:text-gray-medium/50
            focus:border-focus focus:ring-0
            transition-colors duration-150
            resize-y
            ${error ? "border-error" : ""}
            ${className}
          `}
          {...props}
        />
        {helperText && !error && (
          <p className="text-xs text-muted">{helperText}</p>
        )}
        {error && (
          <p className="text-xs text-error">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
