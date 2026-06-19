import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | undefined;

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

/** 建立 browser client；目前不啟用 Auth session。 */
export function createBrowserSupabaseClient(): SupabaseClient {
  const { url, anonKey } = getPublicSupabaseConfig();

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

/** 在 browser runtime 共用同一個 client，避免重複建立連線物件。 */
export function getSupabaseBrowserClient(): SupabaseClient {
  browserClient ??= createBrowserSupabaseClient();
  return browserClient;
}
