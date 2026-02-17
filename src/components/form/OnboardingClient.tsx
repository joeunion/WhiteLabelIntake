"use client";

import { useState, useCallback } from "react";
import { SectionNav } from "./SectionNav";
import { PrerequisiteBanner } from "./PrerequisiteBanner";
import { getSectionMeta } from "@/types";
import type { SectionId, CompletionStatus } from "@/types";
import { CompletionProvider, useCompletion } from "@/lib/contexts/CompletionContext";
import { Section1Form } from "./sections/Section1Form";
import { Section2Form } from "./sections/Section2Form";
import { Section3Form } from "./sections/Section3Form";
import { Section4Form } from "./sections/Section4Form";
import { Section5Form } from "./sections/Section5Form";
import { Section6Form } from "./sections/Section6Form";
import { Section7Form } from "./sections/Section7Form";
import { Section8Form } from "./sections/Section8Form";
import { Section9Form } from "./sections/Section9Form";
import { ReviewForm } from "./sections/ReviewForm";

import type { Section1Data } from "@/lib/validations/section1";
import type { Section2Data } from "@/lib/validations/section2";
import type { Section3Data } from "@/lib/validations/section3";
import type { Section4Data } from "@/lib/validations/section4";
import type { Section5Data } from "@/lib/validations/section5";
import type { Section6Data } from "@/lib/validations/section6";
import type { Section7Data } from "@/lib/validations/section7";
import type { Section8Data } from "@/lib/validations/section8";
import type { Section9Data } from "@/lib/validations/section9";

export interface AllSectionData {
  1: Section1Data;
  2: Section2Data;
  3: Section3Data;
  4: Section4Data;
  5: Section5Data;
  6: Section6Data;
  7: Section7Data;
  8: Section8Data;
  9: Section9Data;
}

interface OnboardingClientProps {
  sectionData: AllSectionData;
  initialStatuses: Record<number, CompletionStatus>;
  affiliateId?: string;
}

export function OnboardingClient({ sectionData, initialStatuses, affiliateId }: OnboardingClientProps) {
  return (
    <CompletionProvider initialStatuses={initialStatuses} affiliateId={affiliateId}>
      <OnboardingClientInner sectionData={sectionData} />
    </CompletionProvider>
  );
}

function OnboardingClientInner({ sectionData }: { sectionData: AllSectionData }) {
  const [activeSection, setActiveSection] = useState(1);
  const { statuses, refreshStatuses, isLocked, unmetFor } = useCompletion();

  const handleNavigate = useCallback((section: number) => {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const meta = getSectionMeta(activeSection);
  const locked = isLocked(activeSection as SectionId);
  const unmet = unmetFor(activeSection as SectionId);

  function renderSection() {
    switch (activeSection) {
      case 1:
        return <Section1Form initialData={sectionData[1]} onNavigate={handleNavigate} disabled={locked} />;
      case 2:
        return <Section2Form initialData={sectionData[2]} onNavigate={handleNavigate} disabled={locked} />;
      case 3:
        return <Section3Form initialData={sectionData[3]} onNavigate={handleNavigate} disabled={locked} />;
      case 4:
        return <Section4Form initialData={sectionData[4]} onNavigate={handleNavigate} disabled={locked} />;
      case 5:
        return <Section5Form initialData={sectionData[5]} onNavigate={handleNavigate} disabled={locked} />;
      case 6:
        return <Section6Form initialData={sectionData[6]} onNavigate={handleNavigate} disabled={locked} />;
      case 7:
        return <Section7Form initialData={sectionData[7]} onNavigate={handleNavigate} disabled={locked} />;
      case 8:
        return <Section8Form initialData={sectionData[8]} onNavigate={handleNavigate} disabled={locked} />;
      case 9:
        return <Section9Form initialData={sectionData[9]} onNavigate={handleNavigate} disabled={locked} />;
      case 10:
        return <ReviewForm onNavigate={handleNavigate} />;
      default:
        return null;
    }
  }

  return (
    <div className="flex h-screen bg-off-white">
      <SectionNav
        activeSection={activeSection}
        onSectionChange={handleNavigate}
        completionStatuses={statuses}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-10">
          {meta && (
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Section {activeSection} of 10 &middot;{" "}
                {meta.phase === "program"
                  ? "Program"
                  : meta.phase === "operations"
                  ? "Operations"
                  : "Review"}
              </p>
              <h1 className="text-2xl font-heading font-semibold text-brand-black">
                {meta.title}
              </h1>
              <p className="text-sm text-muted mt-1">{meta.description}</p>
            </div>
          )}
          {locked && (
            <PrerequisiteBanner unmetSections={unmet} onNavigate={handleNavigate} />
          )}
          {locked ? (
            <div className="opacity-50 pointer-events-none" aria-disabled="true">
              {renderSection()}
            </div>
          ) : (
            renderSection()
          )}
        </div>
      </main>
    </div>
  );
}
