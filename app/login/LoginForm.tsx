"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { login, signup, signInWithGoogle, type AuthState } from "./actions";
import { C } from "@/lib/theme";

const EMPTY: AuthState = {};

export function LoginForm({ initialError }: { initialError?: string }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginState, loginAction] = useFormState(login, EMPTY);
  const [signupState, signupAction] = useFormState(signup, EMPTY);

  const isLogin = mode === "login";
  const state = isLogin ? loginState : signupState;
  const errorText = state.error ?? initialError;

  return (
    <div style={{ width: "100%", maxWidth: 400, background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: 30, boxShadow: "0 10px 30px rgba(90,62,30,.07)" }}>
      <div style={{ display: "flex", background: C.sand, borderRadius: 999, padding: 3, marginBottom: 22 }}>
        <button onClick={() => setMode("login")} style={tab(isLogin)}>Sign in</button>
        <button onClick={() => setMode("signup")} style={tab(!isLogin)}>Create account</button>
      </div>

      <div style={{ fontFamily: "Caprasimo", fontSize: 24, marginBottom: 4 }}>
        {isLogin ? "Welcome back" : "Start your board year"}
      </div>
      <div style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>
        {isLogin ? "Sign in to pick up where you left off." : "Create an account to save your plan and progress."}
      </div>

      <form action={signInWithGoogle} style={{ marginBottom: 16 }}>
        <button type="submit" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 999, background: "#fff", border: "1.5px solid #e0d0b4", padding: "12px 0", fontSize: 14.5, fontWeight: 700, color: C.ink }}>
          <GoogleG />
          Continue with Google
        </button>
      </form>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 16px" }}>
        <div style={{ flex: 1, height: 1, background: "#ece0c8" }} />
        <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>or</div>
        <div style={{ flex: 1, height: 1, background: "#ece0c8" }} />
      </div>

      <form action={isLogin ? loginAction : signupAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Email" name="email" type="email" placeholder="you@example.com" autoComplete="email" />
        <Field
          label="Password"
          name="password"
          type="password"
          placeholder={isLogin ? "Your password" : "At least 6 characters"}
          autoComplete={isLogin ? "current-password" : "new-password"}
        />

        {errorText && (
          <div style={{ background: C.tint, color: C.accentD, borderRadius: 12, padding: "10px 14px", fontSize: 13.5, fontWeight: 600 }}>
            {errorText === "oauth" ? "Google sign-in didn't complete. Please try again." : errorText === "not-configured" ? "Supabase is not configured." : errorText}
          </div>
        )}
        {state.message && (
          <div style={{ background: C.sageT, color: C.sageD, borderRadius: 12, padding: "10px 14px", fontSize: 13.5, fontWeight: 600 }}>{state.message}</div>
        )}

        <Submit isLogin={isLogin} />
      </form>
    </div>
  );
}

function Field({ label, name, type, placeholder, autoComplete }: { label: string; name: string; type: string; placeholder: string; autoComplete: string }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: C.muted }}>{label}</span>
      <input name={name} type={type} placeholder={placeholder} autoComplete={autoComplete} required style={{ borderRadius: 12, border: "1.5px solid #e0d0b4", background: "#fff", padding: "12px 16px", fontSize: 15, color: C.ink, outline: "none" }} />
    </label>
  );
}

function Submit({ isLogin }: { isLogin: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} style={{ marginTop: 6, borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "13px 0", fontSize: 15, opacity: pending ? 0.7 : 1, boxShadow: "0 6px 16px rgba(198,113,57,.3)" }}>
      {pending ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
    </button>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flex: "none" }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

function tab(on: boolean): React.CSSProperties {
  return { flex: 1, borderRadius: 999, padding: "9px 0", fontSize: 13.5, fontWeight: 700, background: on ? C.accent : "transparent", color: on ? "#fff" : C.muted };
}
