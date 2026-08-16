"use client";

import { AppProvider, useApp } from "@/lib/store";
import { Onboarding } from "./Onboarding";
import { AppShell } from "./AppShell";
import { MobilePreview } from "./MobilePreview";

function Root() {
  const { s } = useApp();
  return (
    <div style={{ minHeight: "100vh", background: "#f5ead8", fontSize: 15, lineHeight: 1.5 }}>
      {s.screen === "onboarding" ? <Onboarding /> : <AppShell />}
      {s.device === "mobile" && s.screen !== "onboarding" ? <MobilePreview /> : null}
    </div>
  );
}

export function PrepifyApp() {
  return (
    <AppProvider>
      <Root />
    </AppProvider>
  );
}
