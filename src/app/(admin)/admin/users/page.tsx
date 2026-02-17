export const dynamic = "force-dynamic";

import { listAllUsers } from "@/lib/actions/admin";
import { UserList } from "@/components/admin/UserList";

export default async function AdminUsersPage() {
  const users = await listAllUsers();

  return (
    <div>
      <h1 className="text-2xl font-heading font-semibold text-brand-black mb-6">
        Users
      </h1>
      <UserList users={users} />
    </div>
  );
}
