"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { NetworkListView } from "@/components/marketplace/NetworkListView";
import { NetworkManageModal } from "@/components/marketplace/NetworkManageModal";
import { loadNetworkLocations, loadMyNetworkContracts } from "@/lib/actions/network";
import type { NetworkLocationItem, NetworkContractSummary } from "@/lib/actions/network";
import { SERVICE_TYPES } from "@/lib/validations/section3";
import { SELLER_SERVICE_TYPES } from "@/lib/validations/seller-services";

// Lazy-load the map to avoid SSR issues with mapbox-gl
const NetworkMapView = dynamic(
  () => import("@/components/marketplace/NetworkMapView").then((m) => m.NetworkMapView),
  { ssr: false, loading: () => <div className="h-[480px] bg-surface rounded-lg flex items-center justify-center text-sm text-muted">Loading map...</div> },
);

type ViewMode = "list" | "map";

interface Props {
  onNavigate: (sectionId: number) => void;
  disabled?: boolean;
}

export function NetworkBuilderForm({ onNavigate, disabled }: Props) {
  const [locations, setLocations] = useState<NetworkLocationItem[]>([]);
  const [contracts, setContracts] = useState<NetworkContractSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [showManage, setShowManage] = useState(false);

  const refresh = useCallback(async () => {
    const [locs, cons] = await Promise.all([
      loadNetworkLocations(),
      loadMyNetworkContracts(),
    ]);
    setLocations(locs);
    setContracts(cons);
  }, []);

  useEffect(() => {
    refresh().then(() => setLoading(false));
  }, [refresh]);

  const includedCount = locations.filter((l) => l.included).length;

  // Unique states from all locations for filter
  const uniqueStates = Array.from(new Set(locations.map((l) => l.state).filter(Boolean))).sort();

  // Combined service type options
  const allServiceTypes = [
    ...SELLER_SERVICE_TYPES.map((st) => ({ value: st.value, label: st.label })),
    ...SERVICE_TYPES
      .filter((st) => !SELLER_SERVICE_TYPES.find((sst) => sst.value === st.value))
      .map((st) => ({ value: st.value, label: st.label })),
  ];

  if (loading) {
    return <div className="text-muted text-sm py-8 text-center">Loading network...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="mb-4">
          <h3 className="text-base font-heading font-semibold mb-1">Care Network</h3>
          <p className="text-sm text-muted">
            Your network of care delivery locations. Sellers contracted to your organization appear here automatically.
          </p>
        </div>

        {/* Search, Filters & View Toggle */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                label=""
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search locations or sellers..."
              />
            </div>
            <div className="w-full sm:w-40">
              <Select
                label=""
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                options={[
                  { value: "all", label: "All Services" },
                  ...allServiceTypes,
                ]}
              />
            </div>
            <div className="w-full sm:w-32">
              <Select
                label=""
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                options={[
                  { value: "all", label: "All States" },
                  ...uniqueStates.map((s) => ({ value: s, label: s })),
                ]}
              />
            </div>
          </div>

          {/* View toggle */}
          <div className="flex justify-end">
            <div className="inline-flex rounded-lg border border-border/50 overflow-hidden text-sm">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 transition-colors ${
                  viewMode === "list"
                    ? "bg-brand-teal text-white"
                    : "bg-white text-muted hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  List
                </span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={`px-3 py-1.5 transition-colors ${
                  viewMode === "map"
                    ? "bg-brand-teal text-white"
                    : "bg-white text-muted hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Map
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* View content */}
        {viewMode === "list" ? (
          <NetworkListView
            locations={locations}
            searchQuery={searchQuery}
            serviceFilter={serviceFilter}
            stateFilter={stateFilter}
          />
        ) : (
          <NetworkMapView
            locations={locations}
            searchQuery={searchQuery}
            serviceFilter={serviceFilter}
            stateFilter={stateFilter}
          />
        )}

        {/* Footer */}
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-border/50">
          <p className="text-sm text-muted">
            {includedCount} location{includedCount !== 1 ? "s" : ""} in your network
          </p>
          {!disabled && contracts.length > 0 && (
            <Button variant="secondary" type="button" onClick={() => setShowManage(true)}>
              Manage
            </Button>
          )}
        </div>
      </Card>

      <div className="flex justify-between pb-4">
        <Button variant="secondary" type="button" onClick={() => onNavigate(4)}>
          &larr; Previous
        </Button>
        <Button variant="cta" type="button" onClick={() => onNavigate(9)}>
          Save &amp; Next &rarr;
        </Button>
      </div>

      {showManage && (
        <NetworkManageModal
          locations={locations}
          contracts={contracts}
          onClose={() => setShowManage(false)}
          onRefresh={() => {
            refresh();
          }}
        />
      )}
    </div>
  );
}
