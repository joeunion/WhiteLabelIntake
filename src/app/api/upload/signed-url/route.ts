import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSignedUrl } from "@/lib/supabase/storage";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json(
        { error: "Missing path parameter" },
        { status: 400 }
      );
    }

    // Resolve affiliateId for ownership check
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { affiliateId: true },
    });

    if (!user?.affiliateId) {
      return NextResponse.json(
        { error: "No affiliate found" },
        { status: 403 }
      );
    }

    // Ownership check: path must start with user's affiliateId
    if (!path.startsWith(`${user.affiliateId}/`)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const signedUrl = await getSignedUrl(path);

    return NextResponse.json({ signedUrl });
  } catch (error) {
    console.error("Signed URL error:", error);
    return NextResponse.json(
      { error: "Failed to generate preview URL" },
      { status: 500 }
    );
  }
}
