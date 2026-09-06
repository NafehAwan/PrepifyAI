"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface AuthState {
  error?: string;
  message?: string;
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: "Supabase is not configured." };
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: "Supabase is not configured." };
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 6) {
    return { error: "Use a valid email and a password of at least 6 characters." };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  // With email confirmation disabled (recommended), a session is returned
  // immediately and the student goes straight into onboarding.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/");
  }
  return { message: "Account created — you can sign in now." };
}

// Starts the Google OAuth flow. Redirects the browser to Google; the returned
// code is exchanged for a session in /auth/callback.
export async function signInWithGoogle(): Promise<void> {
  if (!isSupabaseConfigured()) redirect("/login?error=not-configured");

  const h = headers();
  const origin = h.get("origin") ?? `https://${h.get("host") ?? ""}`;

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data?.url) redirect("/login?error=oauth");
  redirect(data.url);
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/login");
}
