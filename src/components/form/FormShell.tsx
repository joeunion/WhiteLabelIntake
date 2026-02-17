"use client";

/**
 * Legacy shell wrapper. Onboarding now uses OnboardingClient which renders
 * its own layout with SectionNav. This component is kept for potential reuse
 * in other form pages.
 */
export function FormShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-off-white">
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
