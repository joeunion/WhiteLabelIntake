"use client";

export function LoadingOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 transition-opacity">
      <div className="flex flex-col items-center gap-3 rounded-xl bg-white/90 px-8 py-6 shadow-sm">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-brand-black" />
        <p className="text-sm text-muted">Saving…</p>
      </div>
    </div>
  );
}
