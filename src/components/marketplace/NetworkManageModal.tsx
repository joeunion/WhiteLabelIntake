"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { toggleNetworkLocation, setContractScopeAll } from "@/lib/actions/network";
import type { NetworkLocationItem, NetworkContractSummary } from "@/lib/actions/network";

interface Props {
  locations: NetworkLocationItem[];
  contracts: NetworkContractSummary[];
  onClose: () => void;
  onRefresh: () => void;
}

export function NetworkManageModal({ locations, contracts, onClose, onRefresh }: Props) {
  const [saving, setSaving] = useState<string | null>(null);

  // Group locations by seller org
  const grouped = new Map<string, { orgName: string; contract: NetworkContractSummary; locations: NetworkLocationItem[] }>();
  for (const loc of locations) {
    if (!grouped.has(loc.sellerOrgId)) {
      const contract = contracts.find((c) => c.sellerId === loc.sellerOrgId);
      if (!contract) continue;
      grouped.set(loc.sellerOrgId, {
        orgName: loc.sellerOrgName ?? "Unknown",
        contract,
        locations: [],
      });
    }
    grouped.get(loc.sellerOrgId)!.locations.push(loc);
  }

  async function handleToggle(loc: NetworkLocationItem) {
    setSaving(loc.id);
    try {
      await toggleNetworkLocation(loc.contractId, loc.sellerLocationId, !loc.included);
      onRefresh();
    } catch {
      toast.error("Failed to update location.");
    } finally {
      setSaving(null);
    }
  }

  async function handleScopeAll(contractId: string, scopeAll: boolean) {
    setSaving(contractId);
    try {
      await setContractScopeAll(contractId, scopeAll);
      onRefresh();
    } catch {
      toast.error("Failed to update contract.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border/50 flex justify-between items-center">
          <h3 className="text-base font-heading font-semibold">Manage Network Locations</h3>
          <button type="button" onClick={onClose} className="text-muted hover:text-foreground text-lg leading-none">&times;</button>
        </div>

        <div className="overflow-y-auto p-4 flex flex-col gap-4">
          {Array.from(grouped.entries()).map(([orgId, group]) => (
            <div key={orgId}>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {group.orgName}
                    {group.locations[0]?.isSelfOwned && (
                      <span className="text-[10px] font-medium bg-brand-teal/10 text-brand-teal px-1.5 py-0.5 rounded ml-2">
                        Your Org
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs text-brand-teal hover:underline disabled:opacity-50"
                  disabled={saving !== null}
                  onClick={() => handleScopeAll(group.contract.contractId, !group.contract.scopeAll)}
                >
                  {group.contract.scopeAll ? "Customize" : "Include All"}
                </button>
              </div>

              <div className="flex flex-col gap-1">
                {group.locations.map((loc) => {
                  const address = [loc.streetAddress, loc.city, loc.state, loc.zip].filter(Boolean).join(", ");
                  return (
                    <div
                      key={loc.id}
                      className={`flex items-start gap-3 p-2 rounded border border-border/30 ${!loc.included ? "opacity-60" : ""}`}
                    >
                      <Checkbox
                        name={`loc-${loc.id}`}
                        checked={loc.included}
                        onChange={() => handleToggle(loc)}
                        disabled={saving !== null}
                        label=""
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {loc.locationName || "Unnamed"}
                        </p>
                        <p className="text-xs text-muted truncate">{address}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {grouped.size === 0 && (
            <p className="text-sm text-muted text-center py-4">
              No contracted sellers in your network.
            </p>
          )}
        </div>

        <div className="p-4 border-t border-border/50">
          <Button variant="secondary" onClick={onClose} className="w-full">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
