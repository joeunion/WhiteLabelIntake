"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { loadSection1 } from "@/lib/actions/section1";
import { loadSection2 } from "@/lib/actions/section2";
import { loadSection3 } from "@/lib/actions/section3";
import { loadSection5 } from "@/lib/actions/section5";
import { loadSection6 } from "@/lib/actions/section6";
import { loadSection7 } from "@/lib/actions/section7";
import { loadSection9 } from "@/lib/actions/section9";
import { submitForm } from "@/lib/actions/submit";
import { SERVICE_TYPES } from "@/lib/validations/section3";
import { SECTIONS } from "@/types";
import { useCompletion } from "@/lib/contexts/CompletionContext";

interface ReviewData {
  loaded: boolean;
  section1: Awaited<ReturnType<typeof loadSection1>> | null;
  section2: Awaited<ReturnType<typeof loadSection2>> | null;
  section3: Awaited<ReturnType<typeof loadSection3>> | null;
  section5: Awaited<ReturnType<typeof loadSection5>> | null;
  section6: Awaited<ReturnType<typeof loadSection6>> | null;
  section7: Awaited<ReturnType<typeof loadSection7>> | null;
  section9: Awaited<ReturnType<typeof loadSection9>> | null;
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm text-foreground font-medium">{value || "—"}</span>
    </div>
  );
}

function EditButton({ section, onNavigate }: { section: number; onNavigate?: (section: number) => void }) {
  if (onNavigate) {
    return (
      <button type="button" onClick={() => onNavigate(section)} className="text-xs text-brand-teal hover:underline">
        Edit
      </button>
    );
  }
  return null;
}

interface ReviewFormProps {
  onNavigate?: (section: number) => void;
}

export function ReviewForm({ onNavigate }: ReviewFormProps) {
  const { statuses, formStatus, refreshStatuses } = useCompletion();
  const sectionsToComplete = SECTIONS.filter((s) => s.id !== 10 && !s.hidden);
  const allComplete = sectionsToComplete.every((s) => statuses[s.id] === "complete");

  const [data, setData] = useState<ReviewData>({
    loaded: false,
    section1: null, section2: null, section3: null,
    section5: null, section6: null, section7: null,
    section9: null,
  });
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    Promise.all([
      loadSection1(), loadSection2(), loadSection3(),
      loadSection5(), loadSection6(), loadSection7(),
      loadSection9(),
    ]).then(([s1, s2, s3, s5, s6, s7, s9]) => {
      setData({
        loaded: true,
        section1: s1, section2: s2, section3: s3,
        section5: s5, section6: s6, section7: s7,
        section9: s9,
      });
    });
  }, []);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await submitForm();
      await refreshStatuses();
      setSubmitted(true);
    } catch {
      toast.error("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!data.loaded) return <div className="text-muted text-sm">Loading review...</div>;

  if (submitted) {
    return (
      <Card className="text-center py-12">
        <svg className="h-16 w-16 text-success mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <h2 className="text-2xl font-heading font-semibold text-brand-black mb-2">
          Form Submitted
        </h2>
        <p className="text-muted max-w-md mx-auto">
          Your onboarding information has been submitted. Our Care Navigation and Virtual Care teams will use this information to support your members.
        </p>
      </Card>
    );
  }

  const s1 = data.section1!;
  const s3 = data.section3!;
  const selectedServices = s3.services.filter((s) => s.selected);

  return (
    <div className="flex flex-col gap-6">
      {/* Completion Checklist */}
      <Card>
        <h3 className="text-base font-heading font-semibold mb-3">Completion Checklist</h3>
        <div className="flex flex-col gap-1.5">
          {sectionsToComplete.map((section) => {
            const st = statuses[section.id] || "not_started";
            return (
              <div key={section.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2">
                  {st === "complete" ? (
                    <svg className="h-4 w-4 text-success flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <div className="h-4 w-4 flex-shrink-0 flex items-center justify-center">
                      <div className="h-2.5 w-2.5 rounded-full border-2 border-border" />
                    </div>
                  )}
                  <span className={`text-sm ${st === "complete" ? "text-foreground" : "text-muted"}`}>
                    {section.id}. {section.title}
                  </span>
                </div>
                {st !== "complete" && onNavigate && (
                  <button type="button" onClick={() => onNavigate(section.id)} className="text-xs text-brand-teal hover:underline">
                    Go to section
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {!allComplete && (
          <p className="text-xs text-amber-600 mt-3">Complete all sections above before submitting.</p>
        )}
      </Card>

      {/* Program Phase */}
      <h2 className="text-xl font-heading font-semibold text-brand-black">Program</h2>

      <Card>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-heading font-semibold">1. Client & Program Overview</h3>
          <EditButton section={1} onNavigate={onNavigate} />
        </div>
        <Field label="Legal Name" value={s1.legalName} />
        <Field label="Program Name" value={s1.programName} />
        <Field label="Admin Contact" value={s1.adminContactName ? `${s1.adminContactName} (${s1.adminContactEmail})` : undefined} />
        <Field label="Executive Sponsor" value={s1.executiveSponsorName ? `${s1.executiveSponsorName} (${s1.executiveSponsorEmail})` : undefined} />
        <Field label="IT Contact" value={s1.itContactName ? `${s1.itContactName} (${s1.itContactEmail})` : undefined} />
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-heading font-semibold">2. Default Services</h3>
          <EditButton section={2} onNavigate={onNavigate} />
        </div>
        <Field label="Confirmed" value={data.section2?.defaultServicesConfirmed ? "Yes" : "No"} />
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-heading font-semibold">3. In-Person & Extended Services</h3>
          <EditButton section={3} onNavigate={onNavigate} />
        </div>
        {selectedServices.length > 0 ? (
          <ul className="text-sm space-y-1">
            {selectedServices.map((s) => {
              const label = SERVICE_TYPES.find((st) => st.value === s.serviceType)?.label ?? s.serviceType;
              return <li key={s.serviceType}>{label}{s.otherName ? `: ${s.otherName}` : ""}</li>;
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted">No services selected</p>
        )}
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-heading font-semibold">4. Payouts & Payments</h3>
          <EditButton section={4} onNavigate={onNavigate} />
        </div>
        <p className="text-sm text-muted">Payment information submitted (details hidden for security).</p>
      </Card>

      {/* Operations Phase */}
      <h2 className="text-xl font-heading font-semibold text-brand-black mt-4">Operations</h2>

      <Card>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-heading font-semibold">5. Physical Locations</h3>
          <EditButton section={5} onNavigate={onNavigate} />
        </div>
        {(data.section5?.locations ?? []).map((loc, i) => (
          <div key={i} className="py-2 border-b border-border/50 last:border-0">
            <p className="text-sm font-medium">{loc.locationName || "Unnamed"}</p>
            <p className="text-xs text-muted">{[loc.streetAddress, loc.city, loc.state, loc.zip].filter(Boolean).join(", ")}</p>
          </div>
        ))}
        {(data.section5?.locations ?? []).length === 0 && <p className="text-sm text-muted">No locations added</p>}
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-heading font-semibold">6. Providers & Credentials</h3>
          <EditButton section={6} onNavigate={onNavigate} />
        </div>
        {(data.section6?.providers ?? []).map((p, i) => (
          <div key={i} className="py-2 border-b border-border/50 last:border-0">
            <p className="text-sm font-medium">{[p.firstName, p.lastName].filter(Boolean).join(" ") || "Unnamed"}</p>
            <p className="text-xs text-muted">NPI: {p.npi || "—"}</p>
          </div>
        ))}
        {(data.section6?.providers ?? []).length === 0 && <p className="text-sm text-muted">No providers added</p>}
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-heading font-semibold">7. Lab Network</h3>
          <EditButton section={7} onNavigate={onNavigate} />
        </div>
        <Field label="Network" value={data.section7?.networkType === "other" ? data.section7.otherNetworkName : data.section7?.networkType} />
        <Field label="Contact" value={data.section7?.coordinationContactName} />
        <Field label="Integration Acknowledged" value={data.section7?.integrationAcknowledged ? "Yes" : "No"} />
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-heading font-semibold">9. Care Navigation</h3>
          <EditButton section={9} onNavigate={onNavigate} />
        </div>
        <Field label="Acknowledged" value={data.section9?.acknowledged ? "Yes" : "No"} />
        <Field label="Primary Escalation" value={data.section9?.primaryEscalationName} />
        <Field label="Secondary Escalation" value={data.section9?.secondaryEscalationName} />
      </Card>

      {/* Submit */}
      {formStatus === "SUBMITTED" ? (
        <Card className="mt-4 text-center py-8">
          <svg className="h-12 w-12 text-success mx-auto mb-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <h3 className="text-lg font-heading font-semibold text-brand-black mb-1">Form Submitted</h3>
          <p className="text-sm text-muted max-w-md mx-auto">
            Your onboarding information has been submitted. If you need to make changes, please contact your account manager.
          </p>
        </Card>
      ) : (
        <Card className="mt-4">
          <Checkbox
            label="This accurately reflects our program offering."
            name="confirm"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            disabled={!allComplete}
          />
          {!allComplete && (
            <p className="text-xs text-amber-600 mt-2">Complete all sections to submit.</p>
          )}
          <p className="text-xs text-muted mt-3">
            Once submitted, our teams will use this information to complete your setup and kick off any scoped projects. This form will be locked after submission — any changes will need to go through your account manager.
          </p>
          <div className="mt-4">
            <Button variant="cta" onClick={handleSubmit} disabled={!confirmed || !allComplete} loading={submitting}>
              Submit Onboarding Form
            </Button>
          </div>
        </Card>
      )}

      <div className="pb-4">
        <Button variant="secondary" type="button" onClick={() => onNavigate?.(9)}>
          &larr; Previous
        </Button>
      </div>
    </div>
  );
}
