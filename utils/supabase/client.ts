import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
console.log('supabaseUrl', supabaseUrl)
console.log('supabaseKey', supabaseKey)


export const createClient = () =>
  createBrowserClient(
    supabaseUrl!,
    supabaseKey!,
  );