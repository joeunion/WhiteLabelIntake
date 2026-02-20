"use client";

import { LocationCard } from "./LocationCard";
import type { NetworkLocationItem } from "@/lib/actions/network";

interface Props {
  locations: NetworkLocationItem[];
  searchQuery: string;
  serviceFilter: string;
  stateFilter: string;
}

export function NetworkListView({ locations, searchQuery, serviceFilter, stateFilter }: Props) {
  const filtered = locations.filter((loc) => {
    // Only show included locations in list view
    if (!loc.included) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        loc.locationName.toLowerCase().includes(q) ||
        loc.sellerOrgName?.toLowerCase().includes(q) ||
        loc.city.toLowerCase().includes(q) ||
        loc.state.toLowerCase().includes(q) ||
        loc.streetAddress.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (serviceFilter && serviceFilter !== "all") {
      if (!loc.services.includes(serviceFilter)) return false;
    }

    if (stateFilter && stateFilter !== "all") {
      if (loc.state !== stateFilter) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted">
          {locations.length === 0
            ? "No locations in your network yet."
            : "No locations match your filters."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {filtered.map((loc) => (
        <LocationCard key={loc.id} location={loc} />
      ))}
    </div>
  );
}
