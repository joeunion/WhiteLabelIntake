"use client";

import { signOut } from "next-auth/react";
import { SECTIONS, getUnmetPrerequisites } from "@/types";
import type { CompletionStatus, SectionId } from "@/types";

interface SectionNavProps {
  activeSection: number;
  onSectionChange: (id: number) => void;
  completionStatuses?: Record<number, CompletionStatus>;
}

const phaseLabels: Record<string, string> = {
  program: "Program",
  operations: "Operations",
  review: "Review",
};

function StatusDot({ status, locked }: { status: CompletionStatus; locked?: boolean }) {
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

export function SectionNav({ activeSection, onSectionChange, completionStatuses = {} }: SectionNavProps) {
  let currentPhase = "";

  return (
    <nav className="w-72 flex-shrink-0 bg-white border-r border-border p-6 overflow-y-auto flex flex-col">
      <div className="mb-6">
        <h2 className="text-lg font-heading font-semibold text-brand-black">
          Onboarding
        </h2>
        <p className="text-xs text-muted mt-1">Complete all sections to submit</p>
      </div>

      <div className="flex flex-col gap-1">
        {SECTIONS.map((section) => {
          const isActive = activeSection === section.id;
          const status = completionStatuses[section.id] || "not_started";
          const unmet = getUnmetPrerequisites(section.id as SectionId, completionStatuses);
          const locked = unmet.length > 0;
          const showPhaseLabel = section.phase !== currentPhase;
          if (showPhaseLabel) currentPhase = section.phase;

          const tooltip = locked
            ? `Requires: ${unmet.map((s) => s.title).join(", ")}`
            : undefined;

          return (
            <div key={section.id}>
              {showPhaseLabel && (
                <div className="mt-4 mb-2 first:mt-0">
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
                <StatusDot status={status} locked={locked} />
                <span className="truncate">{section.title}</span>
              </button>
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
