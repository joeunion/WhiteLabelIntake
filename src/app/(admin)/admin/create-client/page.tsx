import { CreateClientForm } from "@/components/admin/CreateClientForm";

export default function CreateClientPage() {
  return (
    <div>
      <h1 className="text-2xl font-heading font-semibold text-brand-black mb-6">
        Create New Client
      </h1>
      <div className="max-w-2xl">
        <CreateClientForm />
      </div>
    </div>
  );
}
