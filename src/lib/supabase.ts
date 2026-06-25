import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  // Surfaced loudly so setup mistakes are obvious during development.
  console.error(
    "Missing Supabase credentials. Copy .env.example to .env and fill in " +
      "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(url ?? "", anonKey ?? "");

// One place to rebrand the whole product.
export const APP = {
  name: "Stamply",
  tagline: "Loyalty that keeps them coming back",
};
