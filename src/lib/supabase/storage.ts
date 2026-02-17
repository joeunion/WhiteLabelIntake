import { getSupabaseAdmin } from "./server";

const BUCKET = "intake-documents";

/**
 * Upload a document to Supabase Storage.
 * Path format: {affiliateId}/{programId}/{documentType}/{timestamp}-{filename}
 * Returns the storage path (not a URL).
 */
export async function uploadDocument(
  file: File,
  affiliateId: string,
  programId: string,
  documentType: string
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${affiliateId}/${programId}/${documentType}/${timestamp}-${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return path;
}

/**
 * Delete a document from Supabase Storage.
 */
export async function deleteDocument(path: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.storage.from(BUCKET).remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * Generate a signed URL for previewing a document (60-second expiry).
 */
export async function getSignedUrl(path: string): Promise<string> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60);

  if (error || !data?.signedUrl) {
    throw new Error(`Signed URL failed: ${error?.message ?? "Unknown error"}`);
  }

  return data.signedUrl;
}
