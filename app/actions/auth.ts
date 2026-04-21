"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { User, UserRole } from "@/src/types";

export async function signInWithOAuth(
  provider: "google" | "facebook",
  role: UserRole = UserRole.CLIENT,
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${siteUrl}/auth/callback?role=${role}`,
    },
  });

  if (error) return { error: error.message };
  return { url: data.url };
}

export async function signUp(email: string, password: string, name: string, role: UserRole) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) return { error: authError.message };
  if (!authData.user) return { error: "Failed to create user" };

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .insert({ id: authData.user.id, email, name, role, avatar: null })
    .select()   // ← return the inserted row
    .single();

  if (profileError) return { error: profileError.message };

  return { success: true, profile };
}

export async function signIn(email: string, password: string) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true, user: data.user };
  } catch (err) {
    const message = err instanceof Error ? err.message : "An error occurred";
    return { error: message };
  }
}

export async function signOut() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "An error occurred";
    return { error: message };
  }
}



