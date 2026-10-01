// Where to send someone after signing in. Only same-site paths are allowed —
// "//evil.com" or "https://…" would turn the login page into an open redirect.
// Backslashes and control characters are refused too: browsers drop tabs and
// newlines from URLs, so "/\t/evil.com" would otherwise become "//evil.com".
export function safeNext(value: unknown): string {
  const next = typeof value === "string" ? value : "";
  if (next.length > 512 || !next.startsWith("/") || next.startsWith("//")) return "/";
  if (/[\\\u0000-\u001f\u007f]/.test(next)) return "/";
  return next;
}
