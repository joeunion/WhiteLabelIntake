"use client";

import { useState, useCallback, useEffect, useRef, createContext, useContext, type Dispatch, type SetStateAction } from "react";
import { SectionNav } from "./SectionNav";
import { PrerequisiteBanner } from "./PrerequisiteBanner";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { getSectionMeta, getVisibleSections } from "@/types";
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
import { Section11Form } from "./sections/Section11Form";
import { Section12Form } from "./sections/Section12Form";

import type { Section1Data } from "@/lib/validations/section1";
import type { Section2Data } from "@/lib/validations/section2";
import type { Section3Data } from "@/lib/validations/section3";
import type { Section4Data } from "@/lib/validations/section4";
import type { Section5Data } from "@/lib/validations/section5";
import type { Section6Data } from "@/lib/validations/section6";
import type { Section7Data } from "@/lib/validations/section7";
import type { Section8Data } from "@/lib/validations/section8";
import type { Section9Data } from "@/lib/validations/section9";
import type { Section11Data } from "@/lib/validations/section11";

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
  11?: Section11Data;
}

interface PhaseInfo {
  phase: number;
  status: string;
}

/* ── Section data cache ──
   Keeps the latest version of each section's data client-side so that
   navigating away and back doesn't reset to the stale server snapshot. */
const SectionCacheCtx = createContext<(section: number, data: unknown) => void>(() => {});

/* ── Dirty (unsaved) tracking context ──
   Lets section forms report whether they have unsaved changes. */
const DirtyCtx = createContext<(section: number, dirty: boolean) => void>(() => {});

/** Call in every section form that uses useSaveOnNext to report dirty state to the nav. */
export function useReportDirty(section: number, isDirty: boolean) {
  const report = useContext(DirtyCtx);
  const prevDirty = useRef(false);

  useEffect(() => {
    if (isDirty && !prevDirty.current) {
      report(section, true);       // became dirty
    } else if (!isDirty && prevDirty.current) {
      report(section, false);      // save happened → clean
    }
    prevDirty.current = isDirty;
  }, [section, isDirty, report]);
  // No unmount cleanup — dirty persists across navigation
}

/* ── Saving overlay context ──
   Lets SectionNavButtons toggle a full-screen loading overlay. */
const SavingCtx = createContext<(v: boolean) => void>(() => {});

/** Call from nav buttons to show/hide the full-screen saving overlay. */
export function useSaving() {
  return useContext(SavingCtx);
}

/** Call in every section form to sync its data to the client cache on unmount. */
export function useSyncSectionCache(section: number, data: unknown) {
  const update = useContext(SectionCacheCtx);
  const ref = useRef(data);
  ref.current = data;
  useEffect(() => () => update(section, ref.current), [section, update]);
}

interface OnboardingClientProps {
  sectionData: AllSectionData;
  initialStatuses: Record<number, CompletionStatus>;
  affiliateId?: string;
  formStatus?: string;
  phases?: PhaseInfo[];
}

export function OnboardingClient({ sectionData, initialStatuses, affiliateId, formStatus, phases }: OnboardingClientProps) {
  return (
    <CompletionProvider
      initialStatuses={initialStatuses}
      affiliateId={affiliateId}
      initialFormStatus={formStatus ?? "DRAFT"}
      initialPhases={phases}
    >
      <OnboardingClientInner sectionData={sectionData} />
    </CompletionProvider>
  );
}

function OnboardingClientInner({ sectionData }: { sectionData: AllSectionData }) {
  const [activeSection, setActiveSection] = useState(1);
  const [cache, setCache] = useState<AllSectionData>(sectionData);
  const [isSaving, setIsSaving] = useState(false);
  const [dirtySections, setDirtySections] = useState<Record<number, boolean>>({});
  const { statuses, refreshStatuses, isLocked, unmetFor, unlockedPhases, phaseStatuses } = useCompletion();

  const reportDirty = useCallback((section: number, dirty: boolean) => {
    setDirtySections(prev => {
      if (prev[section] === dirty) return prev;
      return { ...prev, [section]: dirty };
    });
  }, []);

  const updateCache = useCallback((section: number, data: unknown) => {
    setCache((prev) => ({ ...prev, [section]: data }));
  }, []);

  const handleNavigate = useCallback((section: number) => {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const meta = getSectionMeta(activeSection);
  const locked = isLocked(activeSection as SectionId);
  const unmet = unmetFor(activeSection as SectionId);
  const visibleSections = getVisibleSections(unlockedPhases);

  function renderSection() {
    switch (activeSection) {
      case 1:
        return <Section1Form initialData={cache[1]} onNavigate={handleNavigate} disabled={locked} />;
      case 2:
        return <Section2Form initialData={cache[2]} onNavigate={handleNavigate} disabled={locked} />;
      case 3:
        return <Section3Form initialData={cache[3]} onNavigate={handleNavigate} disabled={locked} />;
      case 4:
        return <Section4Form initialData={cache[4]} onNavigate={handleNavigate} disabled={locked} />;
      case 5:
        return <Section5Form initialData={cache[5]} onNavigate={handleNavigate} disabled={locked} />;
      case 6:
        return <Section6Form initialData={cache[6]} onNavigate={handleNavigate} disabled={locked} />;
      case 7:
        return <Section7Form initialData={cache[7]} onNavigate={handleNavigate} disabled={locked} />;
      case 8:
        return <Section8Form initialData={cache[8]} onNavigate={handleNavigate} disabled={locked} />;
      case 9:
        return <Section9Form initialData={cache[9]} onNavigate={handleNavigate} disabled={locked} />;
      case 10:
        return <ReviewForm onNavigate={handleNavigate} />;
      case 11:
        return <Section11Form initialData={cache[11]} onNavigate={handleNavigate} disabled={locked} unlockedPhases={unlockedPhases} />;
      case 12:
        return <Section12Form onNavigate={handleNavigate} />;
      default:
        return null;
    }
  }

  // Determine phase label for header
  const phaseLabel = meta?.minPhase === 2 ? "Phase 2" : meta?.phase === "program" ? "Program" : meta?.phase === "operations" ? "Operations" : "Review";

  return (
    <SavingCtx.Provider value={setIsSaving}>
    <DirtyCtx.Provider value={reportDirty}>
    <SectionCacheCtx.Provider value={updateCache}>
    <div className="flex h-screen bg-off-white">
      <LoadingOverlay visible={isSaving} />
      <SectionNav
        activeSection={activeSection}
        onSectionChange={handleNavigate}
        completionStatuses={statuses}
        unlockedPhases={unlockedPhases}
        phaseStatuses={phaseStatuses}
        dirtySections={dirtySections}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-10">
          {meta && (
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Section {activeSection} of {visibleSections.length} &middot; {phaseLabel}
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
    </SectionCacheCtx.Provider>
    </DirtyCtx.Provider>
    </SavingCtx.Provider>
  );
}
