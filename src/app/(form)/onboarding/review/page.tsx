import { redirect } from "next/navigation";

// Review is now handled client-side as section 14 in OnboardingClient.
// Redirect any direct review URLs to the main onboarding page.
export default function ReviewPage() {
  redirect("/onboarding");
}
