"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Map, { Marker, Popup, Source, Layer } from "react-map-gl/mapbox";
import type { LayerProps } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { LocationCard } from "./LocationCard";
import type { NetworkLocationItem } from "@/lib/actions/network";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

function milesToMeters(miles: number) {
  return miles * 1609.34;
}

// Simple hash to generate consistent colors per seller org
function orgColor(orgId: string): string {
  const colors = ["#0D9488", "#2563EB", "#D97706", "#DC2626", "#7C3AED", "#059669", "#DB2777"];
  let hash = 0;
  for (let i = 0; i < orgId.length; i++) {
    hash = orgId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

interface Props {
  locations: NetworkLocationItem[];
  searchQuery: string;
  serviceFilter: string;
  stateFilter: string;
}

export function NetworkMapView({ locations, searchQuery, serviceFilter, stateFilter }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCoverage, setShowCoverage] = useState(true);
  const [radiusMiles, setRadiusMiles] = useState(10);

  const filtered = locations.filter((loc) => {
    if (!loc.included) return false;
    if (!loc.latitude || !loc.longitude) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        loc.locationName.toLowerCase().includes(q) ||
        loc.sellerOrgName?.toLowerCase().includes(q) ||
        loc.city.toLowerCase().includes(q) ||
        loc.state.toLowerCase().includes(q);
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

  // Also show locations without coords in the list (but not on map)
  const listOnly = locations.filter((loc) => {
    if (!loc.included) return false;
    if (loc.latitude && loc.longitude) return false; // already in filtered
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        loc.locationName.toLowerCase().includes(q) ||
        loc.sellerOrgName?.toLowerCase().includes(q);
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

  const allListItems = [...filtered, ...listOnly];
  const selectedLoc = filtered.find((l) => l.id === selectedId);

  // Compute map bounds from filtered locations
  const defaultCenter = { latitude: 39.8283, longitude: -98.5795 }; // US center
  const defaultZoom = 3.5;

  const hasCoords = filtered.length > 0;
  const center = hasCoords
    ? {
        latitude: filtered.reduce((sum, l) => sum + l.latitude!, 0) / filtered.length,
        longitude: filtered.reduce((sum, l) => sum + l.longitude!, 0) / filtered.length,
      }
    : defaultCenter;
  const zoom = hasCoords ? (filtered.length === 1 ? 12 : 6) : defaultZoom;

  // Scroll list item into view when pin is clicked
  useEffect(() => {
    if (selectedId && listRef.current) {
      const el = listRef.current.querySelector(`[data-loc-id="${selectedId}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedId]);

  const handleListHover = useCallback((id: string | null) => {
    setHoveredId(id);
  }, []);

  const handleListClick = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  // GeoJSON for coverage circles
  const coverageGeoJSON: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: filtered.map((loc) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [loc.longitude!, loc.latitude!],
      },
      properties: {
        color: orgColor(loc.sellerOrgId),
      },
    })),
  };

  // Meters per pixel at zoom 22 at the equator ≈ 0.019
  const metersAtMaxZoom = milesToMeters(radiusMiles) / 0.019;

  const coverageLayer: LayerProps = {
    id: "coverage-circles",
    type: "circle",
    paint: {
      "circle-radius": [
        "interpolate",
        ["exponential", 2],
        ["zoom"],
        0, 0,
        22, metersAtMaxZoom,
      ],
      "circle-color": ["get", "color"],
      "circle-opacity": 0.12,
      "circle-stroke-color": ["get", "color"],
      "circle-stroke-width": 1,
      "circle-stroke-opacity": 0.3,
    },
  };

  if (allListItems.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted">No locations to display on map.</p>
      </div>
    );
  }

  return (
    <div className="flex rounded-lg border border-border/50 overflow-hidden" style={{ height: "480px" }}>
      {/* Scrollable list panel */}
      <div ref={listRef} className="w-72 flex-shrink-0 overflow-y-auto border-r border-border/50 bg-surface">
        {allListItems.map((loc) => (
          <div
            key={loc.id}
            data-loc-id={loc.id}
            className={`p-3 border-b border-border/30 cursor-pointer transition-colors ${
              hoveredId === loc.id || selectedId === loc.id
                ? "bg-brand-teal/5"
                : "hover:bg-surface-hover"
            }`}
            onMouseEnter={() => handleListHover(loc.id)}
            onMouseLeave={() => handleListHover(null)}
            onClick={() => handleListClick(loc.id)}
          >
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium text-foreground truncate">{loc.locationName || "Unnamed"}</p>
              {loc.isSelfOwned && (
                <span className="text-[9px] font-medium bg-brand-teal/10 text-brand-teal px-1 py-0.5 rounded ml-1 flex-shrink-0">
                  Yours
                </span>
              )}
            </div>
            <p className="text-xs text-muted truncate">{loc.sellerOrgName}</p>
            <p className="text-xs text-muted truncate">
              {[loc.streetAddress, loc.city, loc.state].filter(Boolean).join(", ")}
            </p>
            {loc.services.length > 0 && (
              <p className="text-[10px] text-muted mt-0.5 truncate">
                {loc.services.slice(0, 3).join(" \u00B7 ")}
                {loc.services.length > 3 ? ` +${loc.services.length - 3}` : ""}
              </p>
            )}
            {!loc.latitude && (
              <p className="text-[10px] text-amber-500 mt-0.5">No coordinates</p>
            )}
          </div>
        ))}
      </div>

      {/* Map panel */}
      <div className="flex-1 relative">
        <Map
          initialViewState={{
            latitude: center.latitude,
            longitude: center.longitude,
            zoom,
          }}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/light-v11"
          style={{ width: "100%", height: "100%" }}
          attributionControl={false}
        >
          {showCoverage && (
            <Source id="coverage-source" type="geojson" data={coverageGeoJSON}>
              <Layer {...coverageLayer} />
            </Source>
          )}

          {filtered.map((loc) => {
            const color = orgColor(loc.sellerOrgId);
            const isActive = hoveredId === loc.id || selectedId === loc.id;

            return (
              <Marker
                key={loc.id}
                latitude={loc.latitude!}
                longitude={loc.longitude!}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setSelectedId((prev) => (prev === loc.id ? null : loc.id));
                }}
              >
                <div
                  className="transition-transform"
                  style={{ transform: isActive ? "scale(1.3)" : "scale(1)" }}
                  onMouseEnter={() => setHoveredId(loc.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <svg width="24" height="32" viewBox="0 0 24 32" fill="none">
                    <path
                      d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20C24 5.373 18.627 0 12 0z"
                      fill={color}
                      opacity={isActive ? 1 : 0.85}
                    />
                    <circle cx="12" cy="11" r="4" fill="white" />
                  </svg>
                </div>
              </Marker>
            );
          })}

          {selectedLoc && (
            <Popup
              latitude={selectedLoc.latitude!}
              longitude={selectedLoc.longitude!}
              anchor="bottom"
              offset={[0, -32]}
              closeOnClick={false}
              onClose={() => setSelectedId(null)}
              className="network-map-popup"
            >
              <LocationCard location={selectedLoc} compact />
            </Popup>
          )}
        </Map>

        {/* Coverage controls */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-lg px-2.5 py-1.5 shadow-sm border border-border/40">
          <button
            type="button"
            onClick={() => setShowCoverage((v) => !v)}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
              showCoverage ? "text-brand-teal" : "text-muted hover:text-foreground"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            Coverage
          </button>
          {showCoverage && (
            <>
              <div className="w-px h-4 bg-border/60" />
              <input
                type="range"
                min={1}
                max={25}
                step={1}
                value={radiusMiles}
                onChange={(e) => setRadiusMiles(Number(e.target.value))}
                className="w-20 h-1 accent-brand-teal"
              />
              <span className="text-xs text-muted tabular-nums w-8">{radiusMiles} mi</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
