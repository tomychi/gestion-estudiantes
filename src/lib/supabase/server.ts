import { createServerClient } from "@supabase/ssr";

export function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return "";
        },
        set() {},
        remove() {},
      },
    },
  );
}
