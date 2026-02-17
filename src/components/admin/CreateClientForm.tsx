"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createAffiliateWithAdmin } from "@/lib/actions/admin";

export function CreateClientForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    legalName: "",
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.email || !form.name) {
      setError("Admin name and email are required.");
      return;
    }

    setLoading(true);
    try {
      const result = await createAffiliateWithAdmin({
        email: form.email,
        name: form.name,
        password: form.password || undefined,
        legalName: form.legalName || undefined,
      });
      router.push(`/admin/affiliates/${result.affiliateId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create client");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <h2 className="font-heading font-semibold text-lg text-brand-black mb-1">
          Client Organization
        </h2>
        <p className="text-xs text-muted mb-5">
          This creates a new affiliate and its initial admin user.
        </p>

        <div className="grid gap-5">
          <Input
            label="Legal Name"
            name="legalName"
            value={form.legalName}
            onChange={(e) => setForm((f) => ({ ...f, legalName: e.target.value }))}
            placeholder="Provider group legal name (optional)"
          />

          <hr className="border-border" />

          <h3 className="font-heading font-semibold text-sm text-brand-black">
            Initial Admin User
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Admin Name"
              name="name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              label="Admin Email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>

          <Input
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            helperText="Leave blank to auto-generate a temporary password"
          />
        </div>

        {error && (
          <p className="text-sm text-error mt-4">{error}</p>
        )}

        <div className="mt-6">
          <Button type="submit" variant="cta" loading={loading}>
            Create Client
          </Button>
        </div>
      </Card>
    </form>
  );
}
