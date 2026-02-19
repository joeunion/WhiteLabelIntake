"use client";

import { useState } from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { useSaving } from "./OnboardingClient";
import { getVisibleSections } from "@/types";

interface SectionNavButtonsProps {
  currentSection: number;
  onNavigate?: (section: number) => void;
  /** Called before navigating to save the current section. Navigation is blocked if this rejects. */
  onSave?: () => Promise<void>;
  /** Unlocked phases — controls which sections are navigable */
  unlockedPhases?: number[];
}

export function SectionNavButtons({ currentSection, onNavigate, onSave, unlockedPhases = [1] }: SectionNavButtonsProps) {
  const [navigating, setNavigating] = useState(false);
  const setSaving = useSaving();

  // Build ordered list of navigable section IDs
  const visibleSections = getVisibleSections(unlockedPhases);
  const sectionIds = visibleSections.map((s) => s.id);
  const currentIndex = sectionIds.indexOf(currentSection as typeof sectionIds[number]);
  const prevSection = currentIndex > 0 ? sectionIds[currentIndex - 1] : null;
  const nextSection = currentIndex < sectionIds.length - 1 ? sectionIds[currentIndex + 1] : null;

  async function handleNav(target: number) {
    if (navigating) return;
    setNavigating(true);
    setSaving(true);
    try {
      await onSave?.();
    } catch (err) {
      // Save failed — log but still navigate (data persists in client state)
      console.error("Section save failed:", err);
      toast.error("Your changes could not be saved. Please try again.");
    }
    // Flush pending state updates (e.g. isDirty→false from save) so that
    // useReportDirty can clear the dirty flag before the section unmounts.
    flushSync(() => {
      setSaving(false);
      setNavigating(false);
    });
    onNavigate?.(target);
  }

  return (
    <div className="flex justify-between items-center pt-4 pointer-events-auto">
      {prevSection ? (
        <Button
          variant="secondary"
          type="button"
          disabled={navigating}
          onClick={() => handleNav(prevSection)}
        >
          &larr; Previous
        </Button>
      ) : (
        <div />
      )}
      {nextSection != null && (
        <Button
          variant="cta"
          type="button"
          disabled={navigating}
          onClick={() => handleNav(nextSection)}
        >
          {navigating ? "Saving\u2026" : "Save & Next \u2192"}
        </Button>
      )}
    </div>
  );
}
