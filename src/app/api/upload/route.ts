import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadDocument, deleteDocument } from "@/lib/supabase/storage";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const documentType = formData.get("documentType") as string | null;
    const previousPath = formData.get("previousPath") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!documentType || !["w9", "bank-doc"].includes(documentType)) {
      return NextResponse.json(
        { error: "Invalid document type" },
        { status: 400 }
      );
    }

    const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed. Use PDF, PNG, or JPEG." },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Resolve affiliateId and programId from the authenticated user
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

    const program = await prisma.program.findFirst({
      where: { affiliateId: user.affiliateId },
      select: { id: true },
    });

    if (!program) {
      return NextResponse.json(
        { error: "No program found" },
        { status: 403 }
      );
    }

    // If replacing, delete the old file first
    if (previousPath) {
      // Ownership check: path must start with user's affiliateId
      if (previousPath.startsWith(`${user.affiliateId}/`)) {
        try {
          await deleteDocument(previousPath);
        } catch {
          // Old file may already be gone — continue with upload
        }
      }
    }

    const path = await uploadDocument(
      file,
      user.affiliateId,
      program.id,
      documentType
    );

    return NextResponse.json({ path });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
