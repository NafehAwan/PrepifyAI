"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { login, signup, type AuthState } from "./actions";
import { C } from "@/lib/theme";

const EMPTY: AuthState = {};

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginState, loginAction] = useFormState(login, EMPTY);
  const [signupState, signupAction] = useFormState(signup, EMPTY);

  const isLogin = mode === "login";
  const state = isLogin ? loginState : signupState;

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

      <form action={isLogin ? loginAction : signupAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Email" name="email" type="email" placeholder="you@example.com" autoComplete="email" />
        <Field
          label="Password"
          name="password"
          type="password"
          placeholder={isLogin ? "Your password" : "At least 6 characters"}
          autoComplete={isLogin ? "current-password" : "new-password"}
        />

        {state.error && (
          <div style={{ background: C.tint, color: C.accentD, borderRadius: 12, padding: "10px 14px", fontSize: 13.5, fontWeight: 600 }}>{state.error}</div>
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

function tab(on: boolean): React.CSSProperties {
  return { flex: 1, borderRadius: 999, padding: "9px 0", fontSize: 13.5, fontWeight: 700, background: on ? C.accent : "transparent", color: on ? "#fff" : C.muted };
}
