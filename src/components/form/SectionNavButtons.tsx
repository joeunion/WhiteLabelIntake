"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface SectionNavButtonsProps {
  currentSection: number;
  onNavigate?: (section: number) => void;
  /** Called before navigating to save the current section. Navigation is blocked if this rejects. */
  onSave?: () => Promise<void>;
}

export function SectionNavButtons({ currentSection, onNavigate, onSave }: SectionNavButtonsProps) {
  const [navigating, setNavigating] = useState(false);
  const prevSection = currentSection > 1 ? currentSection - 1 : null;
  const nextSection =
    currentSection < 9
      ? currentSection + 1
      : currentSection === 9
      ? 10
      : null;

  async function handleNav(target: number) {
    if (navigating) return;
    setNavigating(true);
    try {
      await onSave?.();
      onNavigate?.(target);
    } catch {
      // Save failed — stay on current section so user can fix the issue
    } finally {
      setNavigating(false);
    }
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
          {navigating ? "Saving\u2026" : "Next \u2192"}
        </Button>
      )}
    </div>
  );
}
