"use client";

import React, { useRef, useState, useCallback } from "react";
import Papa from "papaparse";
import { z } from "zod";
import { Button } from "@/components/ui/Button";

/* ── Types ── */

export interface CSVColumnDef<TRow> {
  header: string;          // canonical CSV header (snake_case)
  field: keyof TRow;       // target field name
  label: string;           // human-readable label for preview table
  showInPreview?: boolean; // default true
  transform?: (raw: string) => unknown;
}

interface CSVUploadButtonProps<TRow> {
  entityLabel: string;
  columns: CSVColumnDef<TRow>[];
  rowSchema: z.ZodType<TRow>;
  onImport: (rows: TRow[]) => void;
  templateFileName: string;
  /** Function that returns a dedup key for a row. Rows whose key matches an existing entry are auto-skipped. */
  dedupKey?: (row: TRow) => string;
  /** Existing entries to deduplicate against (mapped through dedupKey). */
  existingKeys?: Set<string>;
}

interface ParsedRow<TRow> {
  data: TRow;
  valid: boolean;
  duplicate?: boolean;
  error?: string;
}

/* ── Component ── */

export function CSVUploadButton<TRow>({
  entityLabel,
  columns,
  rowSchema,
  onImport,
  templateFileName,
  dedupKey,
  existingKeys,
}: CSVUploadButtonProps<TRow>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ParsedRow<TRow>[] | null>(null);

  const previewColumns = columns.filter((c) => c.showInPreview !== false);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);

      if (!file.name.endsWith(".csv")) {
        setError("File must be a .csv file");
        return;
      }

      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h: string) => h.trim().toLowerCase().replace(/\s+/g, "_"),
        complete(results) {
          if (results.errors.length > 0 && results.data.length === 0) {
            setError(`Could not parse CSV: ${results.errors[0].message}`);
            return;
          }

          if (results.data.length === 0) {
            setError("CSV has no data rows");
            return;
          }

          // Map each row through column defs + transforms, then dedup
          const seenKeys = new Set<string>(existingKeys ?? []);
          const parsed: ParsedRow<TRow>[] = results.data.map((raw) => {
            const mapped: Record<string, unknown> = {};
            for (const col of columns) {
              const rawVal = raw[col.header];
              if (rawVal !== undefined && rawVal !== "") {
                mapped[col.field as string] = col.transform
                  ? col.transform(rawVal)
                  : rawVal;
              }
            }

            const result = rowSchema.safeParse(mapped);
            if (!result.success) {
              const firstIssue = result.error.issues[0];
              return {
                data: mapped as TRow,
                valid: false,
                error: `${String(firstIssue.path[0] ?? "row")}: ${firstIssue.message}`,
              };
            }

            // Dedup check
            if (dedupKey) {
              const key = dedupKey(result.data);
              if (key && seenKeys.has(key)) {
                return { data: result.data, valid: false, duplicate: true, error: "Duplicate — skipped" };
              }
              if (key) seenKeys.add(key);
            }

            return { data: result.data, valid: true };
          });

          setPreview(parsed);
        },
        error(err) {
          setError(`Could not parse CSV: ${err.message}`);
        },
      });
    },
    [columns, rowSchema],
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so same file can be re-selected
    e.target.value = "";
  }

  function handleConfirm() {
    if (!preview) return;
    const validRows = preview.filter((r) => r.valid).map((r) => r.data);
    onImport(validRows);
    setPreview(null);
  }

  function downloadTemplate() {
    const headers = columns.map((c) => c.header);
    // Example row with placeholder values
    const exampleRow = columns.map((c) => {
      const key = c.header;
      if (key.includes("name")) return "Example";
      if (key.includes("state")) return "CA";
      if (key.includes("zip")) return "90210";
      if (key.includes("phone")) return "555-123-4567";
      if (key.includes("npi")) return "1234567890";
      if (key.includes("has_")) return "no";
      if (key.includes("access")) return "walk_in";
      return "";
    });

    const csv = [headers.join(","), exampleRow.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = templateFileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  const validCount = preview?.filter((r) => r.valid).length ?? 0;
  const dupCount = preview?.filter((r) => r.duplicate).length ?? 0;
  const errorCount = preview ? preview.length - validCount - dupCount : 0;

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleInputChange}
      />

      {/* Upload button + template link */}
      <div className="flex flex-col items-start gap-1">
        <Button
          variant="secondary"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="!px-4 !py-2.5 !text-sm"
        >
          Upload CSV
        </Button>
        <button
          type="button"
          onClick={downloadTemplate}
          className="text-xs text-brand-teal hover:underline"
        >
          Download template
        </button>
      </div>

      {/* Inline error */}
      {error && (
        <p className="text-xs text-error mt-1">{error}</p>
      )}

      {/* Preview overlay */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex-shrink-0">
              <h3 className="text-lg font-heading font-semibold">
                Import {entityLabel}
              </h3>
              <p className="text-sm text-muted mt-1">
                {validCount} row{validCount !== 1 ? "s" : ""} ready
                {dupCount > 0 && (
                  <>, <span className="text-amber-600">{dupCount} duplicate{dupCount !== 1 ? "s" : ""} skipped</span></>
                )}
                {errorCount > 0 && (
                  <>, <span className="text-error">{errorCount} invalid skipped</span></>
                )}
              </p>
            </div>

            {/* Scrollable table */}
            <div className="overflow-auto flex-1 px-6 py-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {previewColumns.map((col) => (
                      <th
                        key={col.header}
                        className="text-left py-2 px-2 text-xs font-semibold text-muted whitespace-nowrap"
                      >
                        {col.label}
                      </th>
                    ))}
                    <th className="text-left py-2 px-2 text-xs font-semibold text-muted">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {previewColumns.map((col) => (
                        <td key={col.header} className="py-2 px-2 text-xs truncate max-w-[160px]">
                          {String((row.data as Record<string, unknown>)[col.field as string] ?? "")}
                        </td>
                      ))}
                      <td className="py-2 px-2">
                        {row.valid ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                              <path fillRule="evenodd" d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16Zm3.78-9.72a.75.75 0 0 0-1.06-1.06L7 8.94 5.28 7.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.06 0l4.25-4.25Z" clipRule="evenodd" />
                            </svg>
                            Ready
                          </span>
                        ) : row.duplicate ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                              <path fillRule="evenodd" d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16Zm-.75-4.75a.75.75 0 0 0 1.5 0V7.5a.75.75 0 0 0-1.5 0v3.75ZM8 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                            </svg>
                            Duplicate
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-error" title={row.error}>
                            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                              <path fillRule="evenodd" d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16ZM5.22 5.22a.75.75 0 0 1 1.06 0L8 6.94l1.72-1.72a.75.75 0 1 1 1.06 1.06L9.06 8l1.72 1.72a.75.75 0 1 1-1.06 1.06L8 9.06l-1.72 1.72a.75.75 0 0 1-1.06-1.06L6.94 8 5.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                            </svg>
                            {row.error}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex justify-end gap-3 flex-shrink-0">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setPreview(null)}
                className="!px-4 !py-2.5 !text-sm"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="button"
                disabled={validCount === 0}
                onClick={handleConfirm}
                className="!px-4 !py-2.5 !text-sm"
              >
                Import {validCount} {entityLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
