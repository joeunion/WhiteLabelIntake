"use client";

import type { NetworkLocationItem } from "@/lib/actions/network";
import { SERVICE_TYPES } from "@/lib/validations/section3";
import { SELLER_SERVICE_TYPES } from "@/lib/validations/seller-services";

function getServiceLabel(serviceType: string): string {
  return (
    SELLER_SERVICE_TYPES.find((st) => st.value === serviceType)?.label ??
    SERVICE_TYPES.find((st) => st.value === serviceType)?.label ??
    serviceType
  );
}

interface Props {
  location: NetworkLocationItem;
  compact?: boolean;
}

export function LocationCard({ location, compact }: Props) {
  const address = [location.streetAddress, location.city, location.state, location.zip]
    .filter(Boolean)
    .join(", ");

  const serviceLabels = location.services.map(getServiceLabel);

  return (
    <div className={`border border-border/50 rounded-lg p-4 bg-white ${!location.included ? "opacity-50" : ""}`}>
      <div className="flex justify-between items-start mb-1">
        <div>
          <p className="text-sm font-medium text-foreground">{location.locationName || "Unnamed location"}</p>
          <p className="text-xs text-muted">{location.sellerOrgName || "Unknown org"}</p>
        </div>
        {location.isSelfOwned && (
          <span className="text-[10px] font-medium bg-brand-teal/10 text-brand-teal px-1.5 py-0.5 rounded">
            Your Org
          </span>
        )}
      </div>
      <p className="text-xs text-muted mt-1">{address || "No address"}</p>
      {!compact && serviceLabels.length > 0 && (
        <p className="text-xs text-muted mt-1.5">
          {serviceLabels.join(" \u00B7 ")}
        </p>
      )}
      {!compact && location.hoursOfOperation && (
        <p className="text-xs text-muted mt-0.5">{location.hoursOfOperation}</p>
      )}
      {!location.included && (
        <p className="text-[10px] text-amber-600 mt-1">Excluded from network</p>
      )}
    </div>
  );
}
