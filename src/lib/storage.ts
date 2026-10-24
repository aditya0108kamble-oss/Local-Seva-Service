import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/** Uploads a profile photo and returns a long-lived display URL. */
export async function uploadAvatar(userId: string, file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file");
  if (file.size > 5 * 1024 * 1024) throw new Error("Photo must be under 5 MB");
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage.from("avatars").createSignedUrl(path, TEN_YEARS);
  if (e2 || !data) throw e2 ?? new Error("Could not create photo link");
  return data.signedUrl;
}

export async function uploadVerificationDoc(userId: string, file: File) {
  if (file.size > 10 * 1024 * 1024) throw new Error("Document must be under 10 MB");
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const { error } = await supabase.storage.from("verification-docs").upload(`${userId}/${Date.now()}-${safe}`, file);
  if (error) throw error;
}

export async function listVerificationDocs(userId: string) {
  const { data, error } = await supabase.storage.from("verification-docs").list(userId);
  if (error) throw error;
  return data ?? [];
}

export async function signedDocUrl(userId: string, name: string) {
  const { data, error } = await supabase.storage.from("verification-docs").createSignedUrl(`${userId}/${name}`, 120);
  if (error) throw error;
  return data.signedUrl;
}
