"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { UserRole } from "@/src/types";

export async function fetchBusinesses(limit: number = 10) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .limit(limit);

  if (error) {
    return { error: error.message };
  }

  return { success: true, data };
}

export async function createBusiness(
  name: string,
  description: string,
  category: string,
  address: string,
  logo?: string
) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    // Get user profile to check role
    const { data: userProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userProfile?.role !== UserRole.BUSINESS) {
      return { error: "Only business accounts can create businesses" };
    }

    // Create business
    const { data: business, error } = await supabase
      .from("businesses")
      .insert({
        owner_id: user.id,
        name,
        description,
        category,
        address,
        logo: logo || null,
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { success: true, business };
  } catch (err) {
    const message = err instanceof Error ? err.message : "An error occurred";
    return { error: message };
  }
}

export async function updateBusiness(
  businessId: string,
  name: string,
  description: string,
  category: string,
  address: string,
  logo?: string
) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    // Verify ownership
    const { data: business } = await supabase
      .from("businesses")
      .select("owner_id")
      .eq("id", businessId)
      .single();

    if (business?.owner_id !== user.id) {
      return { error: "Unauthorized" };
    }

    // Update business
    const { error } = await supabase
      .from("businesses")
      .update({
        name,
        description,
        category,
        address,
        ...(logo && { logo }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", businessId);

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "An error occurred";
    return { error: message };
  }
}

export async function getBusiness(businessId: string) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: business, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .single();

    if (error) {
      return { error: error.message };
    }

    return { success: true, business };
  } catch (err) {
    const message = err instanceof Error ? err.message : "An error occurred";
    return { error: message };
  }
}

export async function getUserBusiness() {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    const { data: business, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      return { error: error.message };
    }

    return { success: true, business };
  } catch (err) {
    const message = err instanceof Error ? err.message : "An error occurred";
    return { error: message };
  }
}
