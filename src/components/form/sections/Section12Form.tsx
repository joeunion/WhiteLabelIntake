"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { loadSection12 } from "@/lib/actions/section12";
import { submitPhase } from "@/lib/actions/submit";
import { useCompletion } from "@/lib/contexts/CompletionContext";
import type { Section12ReviewData } from "@/lib/actions/section12";

interface Section12FormProps {
  onNavigate?: (section: number) => void;
}

export function Section12Form({ onNavigate }: Section12FormProps) {
  const { statuses, phaseStatuses, refreshStatuses } = useCompletion();
  const phase2Status = phaseStatuses[2] ?? "DRAFT";
  const section11Complete = statuses[11] === "complete";

  const [data, setData] = useState<Section12ReviewData | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    loadSection12().then(setData);
  }, []);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await submitPhase(2);
      await refreshStatuses();
      setSubmitted(true);
    } catch {
      toast.error("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!data) return <div className="text-muted text-sm">Loading review...</div>;

  if (submitted || phase2Status === "SUBMITTED") {
    return (
      <Card className="text-center py-12">
        <svg className="h-16 w-16 text-success mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <h2 className="text-2xl font-heading font-semibold text-brand-black mb-2">
          Phase 2 Submitted
        </h2>
        <p className="text-muted max-w-md mx-auto">
          Your service configuration has been submitted. Our team will use this to finalize your program setup.
          If you need to make changes, please contact your account manager.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      {data.categories.map((cat) => (
        <CategorySummaryCard
          key={cat.serviceType}
          category={cat}
          onNavigate={onNavigate}
        />
      ))}

      {data.categories.length === 0 && (
        <Card>
          <p className="text-sm text-muted">No service categories configured.</p>
        </Card>
      )}

      {/* Submit */}
      <Card className="mt-4">
        <Checkbox
          label="I confirm these service selections are accurate and represent our program offering."
          name="confirm-phase2"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          disabled={!section11Complete}
        />
        {!section11Complete && (
          <p className="text-xs text-amber-600 mt-2">
            Complete Section 11 (Service Configuration) before submitting.
          </p>
        )}
        <p className="text-xs text-muted mt-3">
          Once submitted, our team will finalize your service setup. This will lock Phase 2 — any changes will need to go through your account manager.
        </p>
        <div className="mt-4">
          <Button
            variant="cta"
            onClick={handleSubmit}
            disabled={!confirmed || !section11Complete}
            loading={submitting}
          >
            Submit Service Configuration
          </Button>
        </div>
      </Card>

      <div className="pb-4">
        <Button variant="secondary" type="button" onClick={() => onNavigate?.(11)}>
          &larr; Previous
        </Button>
      </div>
    </div>
  );
}

// ─── Category Summary Card ──────────────────────────────────────────

function CategorySummaryCard({
  category,
  onNavigate,
}: {
  category: Section12ReviewData["categories"][number];
  onNavigate?: (section: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-heading font-semibold">{category.label}</h3>
          <span className={`text-sm font-medium ${category.selectedItems > 0 ? "text-brand-teal" : "text-muted"}`}>
            {category.selectedItems} selected
          </span>
        </div>
        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate(11)}
              className="text-xs text-brand-teal hover:underline"
            >
              Edit in Section 11
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-muted hover:text-brand-black"
          >
            {expanded ? "Collapse" : "Details"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-border pt-3">
          {category.items.length === 0 ? (
            <p className="text-sm text-muted italic">None selected</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {category.items.map((item) => (
                <div
                  key={item.subType}
                  className="flex items-center gap-2 py-1 text-sm text-brand-black"
                >
                  <svg className="h-4 w-4 text-success flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="truncate">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
