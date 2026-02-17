import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/onboarding");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-off-white px-4">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/bg-gradient-desktop.jpg')" }}
      />
      <div className="relative text-center max-w-xl">
        <h1 className="text-4xl md:text-5xl font-heading font-semibold text-brand-black mb-4">
          Client <span className="gradient-text">Onboarding</span>
        </h1>
        <p className="text-lg text-muted mb-8 max-w-md mx-auto">
          Complete your program onboarding for the Next Level white-label program.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button variant="cta">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button variant="secondary">Create Account</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
