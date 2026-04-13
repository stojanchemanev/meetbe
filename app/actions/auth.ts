"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { UserRole } from "@/src/types";

export async function signUp(
  email: string,
  password: string,
  name: string,
  role: UserRole
) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return { error: authError.message };
    }

    if (!authData.user) {
      return { error: "Failed to create user" };
    }

    // Store user profile in database
    const { error: profileError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email,
        name,
        role,
        avatar: null,
      });

    if (profileError) {
      return { error: profileError.message };
    }

    return { success: true, user: authData.user };
  } catch (err) {
    const message = err instanceof Error ? err.message : "An error occurred";
    return { error: message };
  }
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

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { user: null };
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    return { user: profile };
  } catch (err) {
    return { user: null };
  }
}
