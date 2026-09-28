// Where to send someone after signing in. Only same-site paths are allowed —
// "//evil.com" or "https://…" would turn the login page into an open redirect.
export function safeNext(value: unknown): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";
}
