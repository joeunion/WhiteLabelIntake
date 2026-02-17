"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  { label: "Clients", href: "/admin" },
  { label: "Users", href: "/admin/users" },
  { label: "+ New Client", href: "/admin/create-client" },
];

export function AdminTopNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") {
      return pathname === "/admin" || pathname.startsWith("/admin/affiliates");
    }
    return pathname.startsWith(href);
  }

  return (
    <nav className="bg-white border-b border-border shadow-sm">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        <div className="flex items-center gap-1">
          <span className="font-heading font-bold text-brand-black text-lg mr-6">
            Admin
          </span>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                px-4 py-2 text-sm font-medium rounded-[var(--radius-button)] transition-colors
                ${
                  isActive(item.href)
                    ? "bg-brand-teal/10 text-brand-teal"
                    : "text-muted hover:text-brand-black hover:bg-gray-50"
                }
              `}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm text-muted hover:text-brand-black transition-colors"
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}
