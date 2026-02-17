"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

interface AdminFormContextValue {
  affiliateId: string;
  isAdminEditing: true;
}

const AdminFormContext = createContext<AdminFormContextValue | null>(null);

export function AdminFormProvider({
  affiliateId,
  children,
}: {
  affiliateId: string;
  children: ReactNode;
}) {
  return (
    <AdminFormContext.Provider value={{ affiliateId, isAdminEditing: true }}>
      {children}
    </AdminFormContext.Provider>
  );
}

/**
 * Returns admin context when inside AdminFormProvider, null otherwise.
 * This lets section forms detect admin editing mode without changing their props.
 */
export function useAdminForm(): AdminFormContextValue | null {
  return useContext(AdminFormContext);
}
