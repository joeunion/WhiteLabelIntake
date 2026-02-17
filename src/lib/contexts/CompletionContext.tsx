"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { CompletionStatus, SectionId, SectionMeta } from "@/types";
import { getUnmetPrerequisites } from "@/types";
import { getMyCompletionStatuses, getCompletionStatuses } from "@/lib/actions/completion";

interface CompletionContextValue {
  statuses: Record<number, CompletionStatus>;
  refreshStatuses: () => Promise<void>;
  updateStatuses: (statuses: Record<number, CompletionStatus>) => void;
  isLocked: (sectionId: SectionId) => boolean;
  unmetFor: (sectionId: SectionId) => SectionMeta[];
}

const CompletionContext = createContext<CompletionContextValue | null>(null);

export function CompletionProvider({
  initialStatuses,
  affiliateId,
  children,
}: {
  initialStatuses: Record<number, CompletionStatus>;
  affiliateId?: string;
  children: ReactNode;
}) {
  const [statuses, setStatuses] = useState(initialStatuses);

  const refreshStatuses = useCallback(async () => {
    const fresh = affiliateId
      ? await getCompletionStatuses(affiliateId)
      : await getMyCompletionStatuses();
    setStatuses(fresh);
  }, [affiliateId]);

  const updateStatuses = useCallback((incoming: Record<number, CompletionStatus>) => {
    setStatuses(incoming);
  }, []);

  const isLocked = useCallback(
    (sectionId: SectionId) => getUnmetPrerequisites(sectionId, statuses).length > 0,
    [statuses]
  );

  const unmetFor = useCallback(
    (sectionId: SectionId) => getUnmetPrerequisites(sectionId, statuses),
    [statuses]
  );

  return (
    <CompletionContext.Provider value={{ statuses, refreshStatuses, updateStatuses, isLocked, unmetFor }}>
      {children}
    </CompletionContext.Provider>
  );
}

export function useCompletion() {
  const ctx = useContext(CompletionContext);
  if (!ctx) throw new Error("useCompletion must be used within CompletionProvider");
  return ctx;
}
