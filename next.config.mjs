// Security headers for every response.
//
// The Content-Security-Policy only lets the page load code and data from this
// site, Supabase (data + sign-in) and Google Fonts. React already escapes
// everything it renders; the policy is the second wall if something slips.
// 'unsafe-inline' scripts are needed for Next's own inline bootstrap scripts;
// 'unsafe-eval' only in development (React's dev tooling uses it).

const isDev = process.env.NODE_ENV !== "production";

// The project's own Supabase host when known, otherwise any Supabase project.
function supabaseOrigins() {
  try {
    const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").host;
    if (host) return [`https://${host}`, `wss://${host}`];
  } catch {
    // not configured (demo mode)
  }
  return ["https://*.supabase.co", "wss://*.supabase.co"];
}

const supabase = supabaseOrigins();

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  `connect-src 'self' ${supabase.join(" ")}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  `form-action 'self' ${supabase[0]} https://accounts.google.com`,
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Don't advertise the framework in an X-Powered-By header.
  poweredByHeader: false,
  // Never ship source maps of the app's code to browsers.
  productionBrowserSourceMaps: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
