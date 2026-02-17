"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { SECTIONS } from "@/types";
import type { CompletionStatus } from "@/types";
import { getCompletionStatuses } from "@/lib/actions/completion";
import Link from "next/link";

interface CompletionDashboardProps {
  affiliateId: string;
}

const statusLabels: Record<CompletionStatus, { text: string; color: string }> = {
  not_started: { text: "Not Started", color: "bg-gray-border" },
  in_progress: { text: "In Progress", color: "bg-warm-orange" },
  complete: { text: "Complete", color: "bg-success" },
};

export function CompletionDashboard({ affiliateId }: CompletionDashboardProps) {
  const [statuses, setStatuses] = useState<Record<number, CompletionStatus>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getCompletionStatuses(affiliateId).then((s) => {
      setStatuses(s);
      setLoaded(true);
    });
  }, [affiliateId]);

  if (!loaded) return <div className="text-muted text-sm">Loading...</div>;

  const programSections = SECTIONS.filter((s) => s.phase === "program");
  const opsSections = SECTIONS.filter((s) => s.phase === "operations");
  const reviewSections = SECTIONS.filter((s) => s.phase === "review");

  const totalComplete = Object.values(statuses).filter((s) => s === "complete").length;
  const totalSections = SECTIONS.length;
  const pct = Math.round((totalComplete / totalSections) * 100);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-semibold">Overall Progress</h3>
          <span className="text-2xl font-heading font-semibold text-brand-teal">{pct}%</span>
        </div>
        <div className="w-full h-3 bg-gray-light rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-teal rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-muted mt-2">{totalComplete} of {totalSections} sections complete</p>
      </Card>

      {[
        { label: "Program", sections: programSections },
        { label: "Operations", sections: opsSections },
        { label: "Review", sections: reviewSections },
      ].map((phase) => (
        <div key={phase.label}>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">{phase.label}</h3>
          <div className="flex flex-col gap-2">
            {phase.sections.map((section) => {
              const status = statuses[section.id] || "not_started";
              const cfg = statusLabels[status];
              const href = section.id === 10 ? "/onboarding/review" : `/onboarding/section/${section.id}`;
              return (
                <Link key={section.id} href={href}>
                  <Card className="!p-4 flex items-center justify-between hover:border-brand-teal transition-colors cursor-pointer">
                    <div>
                      <p className="text-sm font-medium">{section.title}</p>
                      <p className="text-xs text-muted">{section.description}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full text-white ${cfg.color}`}>
                      {cfg.text}
                    </span>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
