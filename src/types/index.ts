export type SectionId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type CompletionStatus = "not_started" | "in_progress" | "complete";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface SectionMeta {
  id: SectionId;
  title: string;
  phase: "program" | "operations" | "review" | "service_config";
  description: string;
  minPhase: number;
  hidden?: boolean;
}

export const SECTIONS: SectionMeta[] = [
  { id: 1, title: "Client & Program Overview", phase: "program", description: "Identify your organization and program details", minPhase: 1 },
  { id: 2, title: "Default Program Services", phase: "program", description: "Confirm included services", minPhase: 1 },
  { id: 3, title: "In-Person & Extended Services", phase: "program", description: "Select additional services", minPhase: 1 },
  { id: 4, title: "Payouts & Payments", phase: "program", description: "Payment and billing setup", minPhase: 1 },
  { id: 5, title: "Physical Locations", phase: "operations", description: "Add your practice locations", minPhase: 1 },
  { id: 6, title: "Providers & Credentials", phase: "operations", description: "Add provider information", minPhase: 1 },
  { id: 7, title: "Lab Network", phase: "operations", description: "Lab network configuration", minPhase: 1 },
  { id: 8, title: "Radiology Network", phase: "operations", description: "Radiology network setup", hidden: true, minPhase: 1 },
  { id: 9, title: "Care Navigation", phase: "operations", description: "Care Nav services and escalation", minPhase: 1 },
  { id: 10, title: "Review & Submit", phase: "review", description: "Review and submit your form", minPhase: 1 },
  { id: 11, title: "Service Configuration", phase: "service_config", description: "Configure covered sub-services for each category", minPhase: 2 },
  { id: 12, title: "Review & Submit Phase 2", phase: "review", description: "Review service configuration and submit", minPhase: 2 },
];

export function getSectionMeta(id: number): SectionMeta | undefined {
  return SECTIONS.find((s) => s.id === id);
}

/**
 * Prerequisites map: which sections must be complete before a section is unlocked.
 * Sections not listed here have no prerequisites.
 */
export const SECTION_PREREQUISITES: Partial<Record<SectionId, SectionId[]>> = {
  2: [1],
  3: [1],
  4: [1],
  6: [5],
  10: [1, 2, 3, 4, 5, 6, 7, 9],
  12: [11],
};

/**
 * Returns SectionMeta objects for prerequisites that are not yet "complete".
 */
export function getUnmetPrerequisites(
  sectionId: SectionId,
  statuses: Record<number, CompletionStatus>
): SectionMeta[] {
  const prereqs = SECTION_PREREQUISITES[sectionId];
  if (!prereqs) return [];
  return prereqs
    .filter((id) => statuses[id] !== "complete")
    .map((id) => getSectionMeta(id))
    .filter((meta): meta is SectionMeta => meta !== undefined);
}

/**
 * Get sections visible for a given set of unlocked phases.
 */
export function getVisibleSections(unlockedPhases: number[]): SectionMeta[] {
  return SECTIONS.filter((s) => !s.hidden && unlockedPhases.includes(s.minPhase));
}
