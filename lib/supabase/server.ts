import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return { url, anonKey };
}

/**
 * 為單次 server request 建立 Supabase client。
 * 僅使用 anon key 並遵守資料庫 grants / RLS；不得改為 service-role key。
 */
export function createServerSupabaseClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("createServerSupabaseClient can only run on the server.");
  }

  const { url, anonKey } = getPublicSupabaseConfig();

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
