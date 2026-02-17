export type SectionId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type CompletionStatus = "not_started" | "in_progress" | "complete";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface SectionMeta {
  id: SectionId;
  title: string;
  phase: "program" | "operations" | "review";
  description: string;
}

export const SECTIONS: SectionMeta[] = [
  { id: 1, title: "Client & Program Overview", phase: "program", description: "Identify your organization and program details" },
  { id: 2, title: "Default Program Services", phase: "program", description: "Confirm included services" },
  { id: 3, title: "In-Person & Extended Services", phase: "program", description: "Select additional services" },
  { id: 4, title: "Payouts & Payments", phase: "program", description: "Payment and billing setup" },
  { id: 5, title: "Physical Locations", phase: "operations", description: "Add your practice locations" },
  { id: 6, title: "Providers & Credentials", phase: "operations", description: "Add provider information" },
  { id: 7, title: "Lab Network", phase: "operations", description: "Lab network configuration" },
  { id: 8, title: "Radiology Network", phase: "operations", description: "Radiology network setup" },
  { id: 9, title: "Care Navigation", phase: "operations", description: "Care Nav services and escalation" },
  { id: 10, title: "Review & Submit", phase: "review", description: "Review and submit your form" },
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
  10: [1, 2, 3, 4, 5, 6, 7, 8, 9],
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
