"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { CompletionStatus, SectionId, SectionMeta } from "@/types";
import { getUnmetPrerequisites, getSectionMeta } from "@/types";
import { getMyCompletionStatuses, getCompletionStatuses } from "@/lib/actions/completion";
import { getMyFormStatus, getFormStatus, getMyPhases, getPhases } from "@/lib/actions/onboarding";

interface PhaseInfo {
  phase: number;
  status: string; // "DRAFT" | "SUBMITTED"
}

interface CompletionContextValue {
  statuses: Record<number, CompletionStatus>;
  formStatus: string;
  phases: PhaseInfo[];
  phaseStatuses: Record<number, string>;
  unlockedPhases: number[];
  refreshStatuses: () => Promise<void>;
  updateStatuses: (statuses: Record<number, CompletionStatus>) => void;
  isLocked: (sectionId: SectionId) => boolean;
  unmetFor: (sectionId: SectionId) => SectionMeta[];
}

const CompletionContext = createContext<CompletionContextValue | null>(null);

export function CompletionProvider({
  initialStatuses,
  affiliateId,
  initialFormStatus,
  initialPhases,
  children,
}: {
  initialStatuses: Record<number, CompletionStatus>;
  affiliateId?: string;
  initialFormStatus: string;
  initialPhases?: PhaseInfo[];
  children: ReactNode;
}) {
  const [statuses, setStatuses] = useState(initialStatuses);
  const [formStatus, setFormStatus] = useState(initialFormStatus);
  const [phases, setPhases] = useState<PhaseInfo[]>(initialPhases ?? [{ phase: 1, status: initialFormStatus }]);

  const phaseStatuses: Record<number, string> = {};
  const unlockedPhases: number[] = [];
  for (const p of phases) {
    phaseStatuses[p.phase] = p.status;
    unlockedPhases.push(p.phase);
  }

  const refreshStatuses = useCallback(async () => {
    const [fresh, status, freshPhases] = await Promise.all([
      affiliateId
        ? getCompletionStatuses(affiliateId)
        : getMyCompletionStatuses(),
      affiliateId
        ? getFormStatus(affiliateId)
        : getMyFormStatus(),
      affiliateId
        ? getPhases(affiliateId)
        : getMyPhases(),
    ]);
    setStatuses(fresh);
    setFormStatus(status);
    setPhases(freshPhases);
  }, [affiliateId]);

  const updateStatuses = useCallback((incoming: Record<number, CompletionStatus>) => {
    setStatuses(incoming);
  }, []);

  const isLocked = useCallback(
    (sectionId: SectionId) => {
      const meta = getSectionMeta(sectionId);
      if (!meta) return true;
      // Check if the section's phase is submitted
      const phaseStatus = phaseStatuses[meta.minPhase];
      if (phaseStatus === "SUBMITTED") return true;
      // Check prerequisites
      return getUnmetPrerequisites(sectionId, statuses).length > 0;
    },
    [statuses, phaseStatuses]
  );

  const unmetFor = useCallback(
    (sectionId: SectionId) => getUnmetPrerequisites(sectionId, statuses),
    [statuses]
  );

  return (
    <CompletionContext.Provider value={{
      statuses,
      formStatus,
      phases,
      phaseStatuses,
      unlockedPhases,
      refreshStatuses,
      updateStatuses,
      isLocked,
      unmetFor,
    }}>
      {children}
    </CompletionContext.Provider>
  );
}

export function useCompletion() {
  const ctx = useContext(CompletionContext);
  if (!ctx) throw new Error("useCompletion must be used within CompletionProvider");
  return ctx;
}
