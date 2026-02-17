"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { SearchBar } from "./SearchBar";
import type { UserListItem } from "@/lib/actions/admin";

interface UserListProps {
  users: UserListItem[];
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  ADMIN: { label: "Admin", color: "bg-brand-blue/20 text-brand-blue" },
  COLLABORATOR: { label: "Collaborator", color: "bg-gray-medium/20 text-gray-medium" },
};

export function UserList({ users }: UserListProps) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const onSearch = useCallback((q: string) => setQuery(q), []);

  const filtered = users.filter((u) => {
    const matchesQuery =
      !query ||
      (u.name ?? "").toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase()) ||
      (u.affiliate?.legalName ?? "").toLowerCase().includes(query.toLowerCase());

    const matchesRole = roleFilter === "all" || u.role === roleFilter;

    return matchesQuery && matchesRole;
  });

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <SearchBar
          placeholder="Search by name, email, or affiliate..."
          onSearch={onSearch}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="
            bg-white border-[1.5px] border-border rounded-[var(--radius-input)]
            px-3 py-2.5 text-sm text-foreground
            focus:border-focus focus:ring-0 focus:outline-none
          "
        >
          <option value="all">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="COLLABORATOR">Collaborator</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted text-sm">No users found.</p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((u) => (
            <UserCard key={u.id} user={u} />
          ))}
        </div>
      )}
    </div>
  );
}

function UserCard({ user }: { user: UserListItem }) {
  const role = ROLE_LABELS[user.role] ?? ROLE_LABELS.COLLABORATOR;

  return (
    <Card className="!p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-heading font-semibold text-brand-black text-sm">
              {user.name || "Unnamed User"}
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${role.color}`}
            >
              {role.label}
            </span>
          </div>
          <p className="text-xs text-muted">{user.email}</p>
          {user.affiliate && (
            <p className="text-xs text-muted mt-0.5">
              Affiliate: {user.affiliate.legalName || "Unnamed"}
            </p>
          )}
        </div>
        <div className="text-right text-xs text-muted">
          <p>Joined {user.createdAt.toLocaleDateString()}</p>
        </div>
      </div>
    </Card>
  );
}
