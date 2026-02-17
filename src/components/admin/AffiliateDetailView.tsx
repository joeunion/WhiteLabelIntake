"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { softDeleteAffiliate, restoreAffiliate, softDeleteUser } from "@/lib/actions/admin";
import type { AffiliateDetail } from "@/lib/actions/admin";
import type { CompletionStatus } from "@/types";

interface AffiliateDetailViewProps {
  affiliate: AffiliateDetail;
  statuses: Record<number, CompletionStatus>;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  COLLABORATOR: "Collaborator",
};

export function AffiliateDetailView({ affiliate, statuses }: AffiliateDetailViewProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const totalSections = Object.keys(statuses).length;
  const completeSections = Object.values(statuses).filter((s) => s === "complete").length;
  const pct = totalSections > 0 ? Math.round((completeSections / totalSections) * 100) : 0;

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
