export const dynamic = "force-dynamic";

import { loadAllOnboardingData } from "@/lib/actions/onboarding";
import { OnboardingClient } from "@/components/form/OnboardingClient";

export default async function OnboardingPage() {
  const { sections, statuses, formStatus, phases } = await loadAllOnboardingData();

  return (
    <OnboardingClient
      sectionData={sections}
      initialStatuses={statuses}
      formStatus={formStatus}
      phases={phases}
    />
  );
}
