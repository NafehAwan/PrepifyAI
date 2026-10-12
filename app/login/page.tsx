import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LoginForm } from "./LoginForm";
import { LogoMark } from "@/components/Logo";
import { C, DISPLAY, SHADOW } from "@/lib/theme";
import Link from "next/link";

const ERRORS: Record<string, string> = {
  oauth: "Google sign-in didn't finish — please try again.",
  "not-configured": "Sign-in isn't set up on this server.",
  unknown: "Something went wrong signing in — please try again.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string | string[]; next?: string | string[] }> }) {
  const params = await searchParams;
  // Only known codes are shown, so a link can't put its own words on this page.
  const error = typeof params.error === "string" ? (ERRORS[params.error] ?? ERRORS.unknown) : undefined;
  const next = typeof params.next === "string" ? params.next : undefined;
  const configured = isSupabaseConfigured();
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, background: C.bg }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 26 }}>
        <LogoMark size={40} />
        <div style={{ fontFamily: DISPLAY, fontSize: 24 }}>Prepify <em style={{ color: C.accent }}>AI</em></div>
      </div>

      {configured ? (
        <LoginForm initialError={error} next={next} />
      ) : (
        <div style={{ maxWidth: 460, background: C.card, border: `0.5px solid ${C.line}`, borderRadius: 20, padding: 30, textAlign: "center" }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 22, marginBottom: 8 }}>Running in demo mode</div>
          <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
            Supabase isn&apos;t configured, so sign-in is disabled. Add your keys to <code>.env.local</code> (see <code>.env.local.example</code>) to enable accounts and saved progress.
          </div>
          <Link href="/" style={{ display: "inline-block", borderRadius: 14, background: C.accent, color: "#fff", boxShadow: SHADOW.cta, fontWeight: 600, padding: "12px 26px", fontSize: 15 }}>Open the demo →</Link>
        </div>
      )}
    </div>
  );
}
