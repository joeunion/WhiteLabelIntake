import { redirect } from "next/navigation";

// All section navigation is now handled client-side via OnboardingClient.
// Redirect any direct section URLs to the main onboarding page.
export default function SectionPage() {
  redirect("/onboarding");
}
