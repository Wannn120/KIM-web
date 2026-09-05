import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function getSupabaseSession() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return { user: null, error: error.message };
  }

  return { user: data.user, error: null };
}

export async function getSupabaseUser() {
  const { user, error } = await getSupabaseSession();
  if (error || !user) {
    return null;
  }

  return user;
}
