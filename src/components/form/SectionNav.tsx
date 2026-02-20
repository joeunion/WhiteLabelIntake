"use client";

import { useState, useEffect, useMemo } from "react";
import { signOut } from "next-auth/react";
import { SECTIONS, getUnmetPrerequisites, getVisibleSections } from "@/types";
import type { CompletionStatus, SectionId, SectionMeta } from "@/types";

interface SectionNavProps {
  activeSection: number;
  onSectionChange: (id: number) => void;
  completionStatuses?: Record<number, CompletionStatus>;
  unlockedPhases?: number[];
  phaseStatuses?: Record<number, string>; // phase -> "DRAFT" | "SUBMITTED"
  dirtySections?: Record<number, boolean>;
}

const phaseLabels: Record<string, string> = {
  program: "Program",
  operations: "Operations",
  review: "Review",
  service_config: "Service Configuration",
};

function StatusDot({ status, locked, dirty }: { status: CompletionStatus; locked?: boolean; dirty?: boolean }) {
  // Show amber dot when section has unsaved changes (and isn't locked)
  if (dirty && !locked) {
    return (
      <div className="h-5 w-5 flex-shrink-0 flex items-center justify-center">
        <div className="h-3 w-3 rounded-full bg-amber-400" />
      </div>
    );
  }
  if (status === "complete") {
    return (
      <svg className="h-5 w-5 text-success flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    );
  }
  if (locked) {
    return (
      <div className="h-5 w-5 flex-shrink-0 flex items-center justify-center opacity-30">
        <div className="h-3 w-3 rounded-full border-2 border-border" />
      </div>
    );
  }
  if (status === "in_progress") {
    return (
      <div className="h-5 w-5 flex-shrink-0 flex items-center justify-center">
        <div className="h-3 w-3 rounded-full border-2 border-brand-teal bg-brand-teal/20" />
      </div>
    );
  }
  return (
    <div className="h-5 w-5 flex-shrink-0 flex items-center justify-center">
      <div className="h-3 w-3 rounded-full border-2 border-border" />
    </div>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-muted transition-transform duration-200 ${expanded ? "rotate-0" : "-rotate-90"}`}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
  );
}

export function SectionNav({
  activeSection,
  onSectionChange,
  completionStatuses = {},
  unlockedPhases = [1],
  phaseStatuses = {},
  dirtySections = {},
}: SectionNavProps) {
  const visibleSections = getVisibleSections(unlockedPhases);

  // Group sections by minPhase, preserving order
  const phaseGroups = useMemo(() => {
    const groups = new Map<number, SectionMeta[]>();
    for (const section of visibleSections) {
      const existing = groups.get(section.minPhase);
      if (existing) {
        existing.push(section);
      } else {
        groups.set(section.minPhase, [section]);
      }
    }
    return groups;
  }, [visibleSections]);

  // Find which phase the active section belongs to
  const activePhase = useMemo(() => {
    const section = SECTIONS.find((s) => s.id === activeSection);
    return section?.minPhase ?? 1;
  }, [activeSection]);

  // Collapse state — submitted phases start collapsed
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    for (const [p, status] of Object.entries(phaseStatuses)) {
      if (status === "SUBMITTED") initial[Number(p)] = true;
    }
    return initial;
  });

  // Auto-expand the phase when navigating to a section inside a collapsed phase
  useEffect(() => {
    setCollapsed((prev) => {
      if (prev[activePhase]) return { ...prev, [activePhase]: false };
      return prev;
    });
  }, [activePhase]);

  const togglePhase = (phase: number) => {
    setCollapsed((prev) => ({ ...prev, [phase]: !prev[phase] }));
  };

  return (
    <nav className="w-72 flex-shrink-0 bg-white border-r border-border p-6 overflow-y-auto flex flex-col">
      <div className="mb-6">
        <h2 className="text-lg font-heading font-semibold text-brand-black">
          Onboarding
        </h2>
        <p className="text-xs text-muted mt-1">Complete all sections to submit</p>
      </div>

      <div className="flex flex-col gap-1">
        {Array.from(phaseGroups.entries()).map(([phase, sections]) => {
          const isExpanded = !collapsed[phase];
          let currentSubLabel = "";

          // Compute phase summary counts
          const totalCount = sections.length;
          const completeCount = sections.filter(
            (s) => completionStatuses[s.id] === "complete"
          ).length;
          const isSubmitted = phaseStatuses[phase] === "SUBMITTED";

          return (
            <div key={phase}>
              {/* Phase header */}
              <button
                type="button"
                onClick={() => togglePhase(phase)}
                className="w-full flex items-center gap-1.5 py-2 px-1 group cursor-pointer"
              >
                <ChevronIcon expanded={isExpanded} />
                <span className="text-xs font-bold uppercase tracking-widest text-muted group-hover:text-brand-black transition-colors">
                  Phase {phase}
                </span>
              </button>

              {/* Collapsed summary */}
              {!isExpanded && (
                <div className="ml-6 py-1">
                  <span className={`text-xs ${isSubmitted ? "text-success font-medium" : "text-muted"}`}>
                    {isSubmitted ? `Submitted — ${completeCount}/${totalCount} complete` : `${completeCount}/${totalCount} complete`}
                  </span>
                </div>
              )}

              {/* Sections within this phase */}
              {isExpanded && (
                <div className="flex flex-col gap-1">
                  {sections.map((section) => {
                    const isActive = activeSection === section.id;
                    const status = completionStatuses[section.id] || "not_started";
                    const unmet = getUnmetPrerequisites(section.id as SectionId, completionStatuses);
                    const phaseSubmitted = phaseStatuses[section.minPhase] === "SUBMITTED";
                    const locked = unmet.length > 0 || phaseSubmitted;
                    const showSubLabel = section.phase !== currentSubLabel;
                    if (showSubLabel) currentSubLabel = section.phase;

                    const tooltip = locked
                      ? phaseSubmitted
                        ? `Phase ${section.minPhase} has been submitted`
                        : `Requires: ${unmet.map((s) => s.title).join(", ")}`
                      : undefined;

                    return (
                      <div key={section.id}>
                        {showSubLabel && (
                          <div className="mt-3 mb-1.5 ml-6 first:mt-0">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                              {phaseLabels[section.phase]}
                            </span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => onSectionChange(section.id)}
                          title={tooltip}
                          className={`
                            w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg
                            text-sm transition-colors duration-150
                            ${isActive
                              ? "bg-brand-teal/10 text-brand-teal font-medium"
                              : locked
                                ? "text-muted hover:bg-gray-light"
                                : "text-foreground hover:bg-gray-light"}
                          `}
                        >
                          <StatusDot status={status} locked={locked} dirty={!!dirtySections[section.id]} />
                          <span className="truncate">{section.title}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="mt-auto text-sm text-muted hover:text-brand-black transition-colors text-left"
      >
        Sign Out
      </button>
    </nav>
  );
}
