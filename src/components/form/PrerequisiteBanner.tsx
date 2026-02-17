import type { SectionMeta } from "@/types";

interface PrerequisiteBannerProps {
  unmetSections: SectionMeta[];
  onNavigate: (section: number) => void;
}

export function PrerequisiteBanner({ unmetSections, onNavigate }: PrerequisiteBannerProps) {
  if (unmetSections.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
      <svg
        className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <div>
        <p className="text-sm font-medium text-amber-800">
          Complete these sections first:
        </p>
        <ul className="mt-1 flex flex-col gap-1">
          {unmetSections.map((section) => (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => onNavigate(section.id)}
                className="text-sm text-amber-700 underline hover:text-amber-900"
              >
                Section {section.id}: {section.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
