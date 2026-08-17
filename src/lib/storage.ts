import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const BUCKET = process.env.STORAGE_BUCKET ?? "authorization-letters";

// Server-only client using the service role key — bypasses RLS.
// Never import this file from a "use client" component.
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase storage is not configured (missing URL or service role key)");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

function sanitizeFilename(name: string) {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
  return base || "file";
}

export async function uploadAuthorizationLetter(
  registrationId: string,
  file: File
): Promise<{ path: string }> {
  const client = getServiceClient();
  const ext = sanitizeFilename(file.name).split(".").pop() || "bin";
  const path = `${registrationId}/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await client.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw new Error(`Failed to upload authorization letter: ${error.message}`);
  }

  return { path };
}

export async function getSignedLetterUrl(path: string, expiresInSeconds = 300) {
  const client = getServiceClient();
  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data) {
    throw new Error(`Failed to create signed URL: ${error?.message ?? "unknown error"}`);
  }
  return data.signedUrl;
}

export async function downloadLetterBuffer(path: string) {
  const client = getServiceClient();
  const { data, error } = await client.storage.from(BUCKET).download(path);
  if (error || !data) {
    throw new Error(`Failed to download file: ${error?.message ?? "unknown error"}`);
  }
  return Buffer.from(await data.arrayBuffer());
}
