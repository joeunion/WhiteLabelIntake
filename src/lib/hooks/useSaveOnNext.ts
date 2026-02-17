"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CompletionStatus } from "@/types";

interface UseSaveOnNextOptions<T> {
  data: T;
  onSave: (data: T) => Promise<Record<number, CompletionStatus>>;
  onAfterSave?: (statuses: Record<number, CompletionStatus>) => void;
}

export function useSaveOnNext<T>({ data, onSave, onAfterSave }: UseSaveOnNextOptions<T>) {
  const [isSaving, setIsSaving] = useState(false);
  const initialRef = useRef<string>(JSON.stringify(data));
  const dataRef = useRef<T>(data);
  dataRef.current = data;

  const isDirty = JSON.stringify(data) !== initialRef.current;

  // Warn before closing/refreshing with unsaved changes
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const save = useCallback(async () => {
    const current = dataRef.current;
    const serialized = JSON.stringify(current);
    if (serialized === initialRef.current) return; // nothing changed

    setIsSaving(true);
    try {
      const statuses = await onSave(current);
      initialRef.current = serialized;
      onAfterSave?.(statuses);
    } finally {
      setIsSaving(false);
    }
    // Re-throws on failure so caller (SectionNavButtons) can block navigation
  }, [onSave, onAfterSave]);

  return { save, isSaving, isDirty };
}
