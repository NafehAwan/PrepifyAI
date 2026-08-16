import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LoginForm } from "./LoginForm";
import { C } from "@/lib/theme";
import Link from "next/link";

export default function LoginPage() {
  const configured = isSupabaseConfigured();
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, background: C.bg }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 26 }}>
        <div style={{ width: 40, height: 40, borderRadius: 999, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "Caprasimo", fontSize: 21 }}>P</div>
        <div style={{ fontFamily: "Caprasimo", fontSize: 24 }}>Prepify AI</div>
      </div>

      {configured ? (
        <LoginForm />
      ) : (
        <div style={{ maxWidth: 460, background: C.card, border: `1px solid ${C.line}`, borderRadius: 24, padding: 30, textAlign: "center" }}>
          <div style={{ fontFamily: "Caprasimo", fontSize: 22, marginBottom: 8 }}>Running in demo mode</div>
          <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
            Supabase isn&apos;t configured, so sign-in is disabled. Add your keys to <code>.env.local</code> (see <code>.env.local.example</code>) to enable accounts and saved progress.
          </div>
          <Link href="/" style={{ display: "inline-block", borderRadius: 999, background: C.accent, color: "#fff", fontWeight: 700, padding: "12px 26px", fontSize: 15 }}>Open the demo →</Link>
        </div>
      )}
    </div>
  );
}
