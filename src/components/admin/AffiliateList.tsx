"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SearchBar } from "./SearchBar";
import type { AffiliateListItem } from "@/lib/actions/admin";

interface AffiliateListProps {
  affiliates: AffiliateListItem[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-warm-orange/20 text-warm-orange" },
  SUBMITTED: { label: "Submitted", color: "bg-success/20 text-success" },
};

export function AffiliateList({ affiliates }: AffiliateListProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const onSearch = useCallback((q: string) => setQuery(q), []);

  const filtered = affiliates.filter((a) => {
    const matchesQuery =
      !query ||
      (a.legalName ?? "").toLowerCase().includes(query.toLowerCase()) ||
      (a.adminUser?.email ?? "").toLowerCase().includes(query.toLowerCase()) ||
      (a.programName ?? "").toLowerCase().includes(query.toLowerCase());

    const matchesStatus = statusFilter === "all" || a.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <SearchBar
          placeholder="Search by name, email, or program..."
          onSearch={onSearch}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="
            bg-white border-[1.5px] border-border rounded-[var(--radius-input)]
            px-3 py-2.5 text-sm text-foreground
            focus:border-focus focus:ring-0 focus:outline-none
          "
        >
          <option value="all">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Submitted</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted text-sm">No clients found.</p>
      ) : (
        <div className="grid gap-4">
          {filtered.map((a) => (
            <AffiliateCard key={a.id} affiliate={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function AffiliateCard({ affiliate }: { affiliate: AffiliateListItem }) {
  const status = STATUS_LABELS[affiliate.status] ?? STATUS_LABELS.DRAFT;

  return (
    <Link href={`/admin/affiliates/${affiliate.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-heading font-semibold text-brand-black">
                {affiliate.legalName || "Unnamed Client"}
              </h3>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}
              >
                {status.label}
              </span>
            </div>
            {affiliate.programName && (
              <p className="text-sm text-muted mb-1">
                Program: {affiliate.programName}
              </p>
            )}
            {affiliate.adminUser && (
              <p className="text-xs text-muted">
                Admin: {affiliate.adminUser.name ?? affiliate.adminUser.email}
                {affiliate.adminUser.name && (
                  <span className="ml-1">({affiliate.adminUser.email})</span>
                )}
              </p>
            )}
          </div>
          <div className="text-right text-xs text-muted">
            <p>Created {affiliate.createdAt.toLocaleDateString()}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
