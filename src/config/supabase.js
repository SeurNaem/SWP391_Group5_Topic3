// config/supabase.js
import { createClient } from "@supabase/supabase-js";
const baseUrl = "https://nlokwjjabiigovoacjxb.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sb2t3amphYmlpZ292b2FjanhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTQ0NTEsImV4cCI6MjA3NjQ5MDQ1MX0.atFiY1LtPUSPWh6-_1z45SPQ3fbv_5c9ZPpNUGLcZJk";

export const supabase = createClient(baseUrl, anonKey);

/**
 * Helper to build a public URL for an existing file.
 * NOTE: Bucket must have public policy or a signed URL should be used instead.
 */
export const getPublicUrl = (bucket, path) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl ?? null;
};