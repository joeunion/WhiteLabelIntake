"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  softDeleteAffiliate,
  restoreAffiliate,
  softDeleteUser,
  unlockAffiliate,
  unlockPhase,
  unlockPhaseForEditing,
} from "@/lib/actions/admin";
import type { AffiliateDetail, PhaseStatus } from "@/lib/actions/admin";
import type { CompletionStatus } from "@/types";

interface AffiliateDetailViewProps {
  affiliate: AffiliateDetail;
  statuses: Record<number, CompletionStatus>;
  phaseStatuses?: PhaseStatus[];
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  COLLABORATOR: "Collaborator",
};

const PHASE_LABELS: Record<number, string> = {
  1: "Initial Onboarding",
  2: "Service Configuration",
};

export function AffiliateDetailView({ affiliate, statuses, phaseStatuses = [] }: AffiliateDetailViewProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [phaseAction, setPhaseAction] = useState<number | null>(null);

  const totalSections = Object.keys(statuses).length;
  const completeSections = Object.values(statuses).filter((s) => s === "complete").length;
  const pct = totalSections > 0 ? Math.round((completeSections / totalSections) * 100) : 0;

  // Phase 1 status from phaseStatuses or fallback to affiliate.status
  const phase1 = phaseStatuses.find((p) => p.phase === 1);
  const phase1Status = phase1?.status ?? affiliate.status;
  const phase2 = phaseStatuses.find((p) => p.phase === 2);

  async function handleDelete() {
    if (!confirm("Are you sure you want to soft-delete this affiliate and all its users?")) return;
    setDeleting(true);
    try {
      await softDeleteAffiliate(affiliate.id);
      router.push("/admin");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  async function handleRestore() {
    await restoreAffiliate(affiliate.id);
    router.refresh();
  }

  async function handleUnlock() {
    if (!confirm("Unlock Phase 1? The client will be able to edit and re-submit.")) return;
    setUnlocking(true);
    try {
      await unlockAffiliate(affiliate.id);
      router.refresh();
    } finally {
      setUnlocking(false);
    }
  }

  async function handleUnlockPhase2() {
    if (!confirm("Unlock Phase 2 (Service Configuration)? The client will see new sections to configure sub-services.")) return;
    setPhaseAction(2);
    try {
      await unlockPhase(affiliate.id, 2);
      router.refresh();
    } finally {
      setPhaseAction(null);
    }
  }

  async function handleUnlockPhaseForEditing(phaseNumber: number) {
    if (!confirm(`Unlock Phase ${phaseNumber} for editing? The client will be able to modify and re-submit.`)) return;
    setPhaseAction(phaseNumber);
    try {
      await unlockPhaseForEditing(affiliate.id, phaseNumber);
      router.refresh();
    } finally {
      setPhaseAction(null);
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm("Are you sure you want to remove this user?")) return;
    await softDeleteUser(userId);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin" className="text-sm text-muted hover:text-brand-black mb-2 inline-block">
            &larr; Back to Clients
          </Link>
          <h1 className="text-2xl font-heading font-semibold text-brand-black">
            {affiliate.legalName || "Unnamed Client"}
          </h1>
        </div>
        <div className="flex gap-3">
          <Link href={`/admin/affiliates/${affiliate.id}/edit`}>
            <Button variant="cta">Edit Form</Button>
          </Link>
          {affiliate.deletedAt ? (
            <Button variant="secondary" onClick={handleRestore}>
              Restore
            </Button>
          ) : (
            <Button variant="secondary" onClick={handleDelete} loading={deleting}>
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Phase Progression */}
      <Card>
        <h2 className="font-heading font-semibold text-lg mb-4">Phase Progression</h2>
        <div className="flex flex-col gap-3">
          {/* Phase 1 */}
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <div className="flex items-center gap-3">
              <PhaseStatusBadge status={phase1Status} />
              <div>
                <span className="text-sm font-medium text-brand-black">Phase 1: {PHASE_LABELS[1]}</span>
                {phase1?.submittedAt && (
                  <p className="text-xs text-muted">Submitted {new Date(phase1.submittedAt).toLocaleDateString()}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {phase1Status === "SUBMITTED" && (
                <Button variant="secondary" className="px-4 py-2 text-sm" onClick={handleUnlock} loading={unlocking}>
                  Unlock for Editing
                </Button>
              )}
            </div>
          </div>

          {/* Phase 2 */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <PhaseStatusBadge status={phase2?.status ?? "LOCKED"} />
              <div>
                <span className="text-sm font-medium text-brand-black">Phase 2: {PHASE_LABELS[2]}</span>
                {phase2?.unlockedAt && (
                  <p className="text-xs text-muted">
                    Unlocked {new Date(phase2.unlockedAt).toLocaleDateString()}
                    {phase2.submittedAt && ` · Submitted ${new Date(phase2.submittedAt).toLocaleDateString()}`}
                  </p>
                )}
                {!phase2 && <p className="text-xs text-muted">Not yet unlocked</p>}
              </div>
            </div>
            <div className="flex gap-2">
              {!phase2 && phase1Status === "SUBMITTED" && (
                <Button
                  variant="cta"
                  className="px-4 py-2 text-sm"
                  onClick={handleUnlockPhase2}
                  loading={phaseAction === 2}
                >
                  Unlock Phase 2
                </Button>
              )}
              {phase2?.status === "SUBMITTED" && (
                <Button
                  variant="secondary"
                  className="px-4 py-2 text-sm"
                  onClick={() => handleUnlockPhaseForEditing(2)}
                  loading={phaseAction === 2}
                >
                  Unlock for Editing
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Completion Overview */}
      <Card>
        <h2 className="font-heading font-semibold text-lg mb-4">Completion</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-brand-teal h-full rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-sm font-medium text-brand-black">{pct}%</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(statuses).map(([id, status]) => (
            <div
              key={id}
              className={`text-center text-xs py-1.5 rounded ${
                status === "complete"
                  ? "bg-success/20 text-success"
                  : status === "in_progress"
                  ? "bg-warm-orange/20 text-warm-orange"
                  : "bg-gray-100 text-muted"
              }`}
            >
              S{id}
            </div>
          ))}
        </div>
      </Card>

      {/* Users */}
      <Card>
        <h2 className="font-heading font-semibold text-lg mb-4">Users</h2>
        {affiliate.users.length === 0 ? (
          <p className="text-sm text-muted">No users.</p>
        ) : (
          <div className="space-y-3">
            {affiliate.users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div>
                  <span className="text-sm font-medium text-brand-black">
                    {user.name || "Unnamed"}
                  </span>
                  <span className="text-xs text-muted ml-2">
                    {user.email}
                  </span>
                  <span className="text-xs text-muted ml-2">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  className="text-xs text-error hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function PhaseStatusBadge({ status }: { status: string }) {
  if (status === "SUBMITTED") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success/20 text-success">
        Submitted
      </span>
    );
  }
  if (status === "DRAFT") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warm-orange/20 text-warm-orange">
        In Progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-muted">
      Locked
    </span>
  );
}
