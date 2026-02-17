import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: "SUPER_ADMIN" | "ADMIN" | "COLLABORATOR";
      affiliateId: string | null;
    };
  }
}
