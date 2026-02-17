import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteDocument } from "@/lib/supabase/storage";

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { path } = await request.json();

    if (!path || typeof path !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid path" },
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

    await deleteDocument(path);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
