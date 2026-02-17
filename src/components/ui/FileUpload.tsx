"use client";

import { useCallback, useRef, useState } from "react";

interface FileUploadProps {
  label: string;
  documentType: "w9" | "bank-doc";
  value: string | null;
  onChange: (path: string | null) => void;
  disabled?: boolean;
}

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

type UploadState = "empty" | "uploading" | "uploaded";

export function FileUpload({
  label,
  documentType,
  value,
  onChange,
  disabled,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>(value ? "uploaded" : "empty");
  const [fileName, setFileName] = useState<string>(
    value ? value.split("/").pop()?.replace(/^\d+-/, "") ?? "Uploaded file" : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const upload = useCallback(
    async (file: File) => {
      setError(null);

      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("File type not allowed. Use PDF, PNG, or JPEG.");
        return;
      }
      if (file.size > MAX_SIZE) {
        setError("File too large. Maximum size is 10MB.");
        return;
      }

      setState("uploading");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);
      if (value) {
        formData.append("previousPath", value);
      }

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        const { path } = await res.json();
        setFileName(file.name);
        setState("uploaded");
        onChange(path);
      } catch (err) {
        setState(value ? "uploaded" : "empty");
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    },
    [documentType, value, onChange]
  );

  const handleRemove = useCallback(async () => {
    if (!value) return;

    try {
      const res = await fetch("/api/upload/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: value }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }

      setState("empty");
      setFileName("");
      setError(null);
      onChange(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }, [value, onChange]);

  const handlePreview = useCallback(async () => {
    if (!value) return;

    try {
      const res = await fetch(
        `/api/upload/signed-url?path=${encodeURIComponent(value)}`
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Preview failed");
      }

      const { signedUrl } = await res.json();
      window.open(signedUrl, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    }
  }, [value]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) upload(file);
      // Reset input so the same file can be re-selected
      if (inputRef.current) inputRef.current.value = "";
    },
    [upload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) upload(file);
    },
    [disabled, upload]
  );

  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled}
      />

      {state === "uploaded" ? (
        /* Uploaded state */
        <div className="border-2 border-success/40 bg-success/5 rounded-[var(--radius-input)] p-5">
          <div className="flex items-center gap-3">
            <svg
              className="h-5 w-5 text-success shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm text-foreground truncate flex-1">
              {fileName}
            </span>
          </div>
          {!disabled && (
            <div className="flex gap-3 mt-3 ml-8">
              <button
                type="button"
                onClick={handlePreview}
                className="text-xs text-focus hover:underline"
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-xs text-focus hover:underline"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="text-xs text-error hover:underline"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      ) : state === "uploading" ? (
        /* Uploading state */
        <div className="border-2 border-dashed border-focus/40 rounded-[var(--radius-input)] p-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <svg
              className="h-5 w-5 text-focus animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <p className="text-sm text-muted">Uploading {label}...</p>
          </div>
        </div>
      ) : (
        /* Empty / drop zone state */
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (!disabled && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-[var(--radius-input)] p-6 text-center
            transition-colors duration-150
            ${disabled ? "border-border opacity-50 cursor-not-allowed" : "border-border hover:border-focus/40 cursor-pointer"}
            ${dragOver ? "border-focus/60 bg-focus/5" : ""}
          `}
        >
          <div className="flex flex-col items-center gap-1.5">
            <svg
              className="h-6 w-6 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="text-sm text-muted">
              <span className="text-focus font-medium">Click to upload</span>
              {" "}or drag and drop
            </p>
            <p className="text-xs text-muted/70">PDF, PNG, or JPEG (max 10MB)</p>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
