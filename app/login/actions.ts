"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { safeNext } from "@/lib/safeNext";

export interface AuthState {
  error?: string;
  message?: string;
}

// Usernames: 3-20 of a-z, 0-9, "_" and ".", stored lowercase. The database
// enforces the same rule (supabase/usernames.sql).
const USERNAME = /^[a-z0-9_.]{3,20}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sign in with either an email or a username. A username is turned into the
// account's email by login_email(), which only answers when the password is
// right — so a wrong guess never reveals whose account it is.
export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: "Supabase is not configured." };
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!identifier || !password) return { error: "Enter your username (or email) and password." };
  if (identifier.length > 254 || password.length > 72) return { error: "Wrong username or password." };

  const supabase = createClient();
  let email = identifier;
  if (!identifier.includes("@")) {
    const { data } = await supabase.rpc("login_email", { p_username: identifier, p_password: password });
    if (typeof data !== "string" || !data) return { error: "Wrong username or password." };
    email = data;
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (/confirm/i.test(error.message)) return { error: "Confirm your email first — check your inbox for the link we sent." };
    return { error: identifier.includes("@") ? "Wrong email or password." : "Wrong username or password." };
  }

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")));
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return { error: "Supabase is not configured." };
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!USERNAME.test(username)) {
    return { error: "Usernames are 3-20 characters: letters, numbers, _ and . only." };
  }
  if (email.length > 254 || !EMAIL.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 8) return { error: "Use a password of at least 8 characters." };
  if (password.length > 72) return { error: "Use a password of 72 characters or fewer." };
  if (password.toLowerCase().includes(username)) return { error: "Your password can't contain your username." };
  if (password !== confirm) return { error: "The two passwords don't match." };

  const supabase = createClient();
  const { data: available } = await supabase.rpc("username_available", { p_username: username });
  if (available === false) return { error: `The username "${username}" is taken — try another.` };

  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username } } });
  if (error) {
    // The profile trigger rejects a username someone took a moment ago.
    if (/database error/i.test(error.message)) return { error: `The username "${username}" is taken — try another.` };
    if (/registered|exists/i.test(error.message)) return { error: "An account with this email already exists. Sign in instead." };
    return { error: error.message };
  }

  // Supabase answers a sign-up for an existing email with a user that has no
  // identities rather than an error (so emails can't be probed that way).
  if (data.user && data.user.identities?.length === 0) {
    return { error: "An account with this email already exists. Sign in instead." };
  }

  // With email confirmation off, a session comes back and the student goes
  // straight in. With it on (this project's setting), they confirm first.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect(safeNext(formData.get("next")));
  }
  return {
    message: `Account created! Check ${email} for a confirmation link, then sign in as "${username}".`,
  };
}

// Starts the Google OAuth flow. Redirects the browser to Google; the returned
// code is exchanged for a session in /auth/callback.
export async function signInWithGoogle(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured()) redirect("/login?error=not-configured");

  const h = headers();
  const origin = h.get("origin") ?? `https://${h.get("host") ?? ""}`;

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safeNext(formData.get("next")))}` },
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
