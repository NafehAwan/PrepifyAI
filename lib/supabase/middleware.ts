import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

// Refreshes the auth session on every request and guards protected routes.
// When Supabase isn't configured this is a pure pass-through, so the demo app
// keeps working with no backend.
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;
  const isApi = path.startsWith("/api/");

  // API writes must come from this site's own pages. Browsers always send
  // Origin on a cross-site POST, so another site can't make a signed-in
  // student's browser call these routes (on top of the SameSite cookie).
  if (isApi && request.method !== "GET" && request.method !== "HEAD" && !sameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isSupabaseConfigured()) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = path.startsWith("/login") || path.startsWith("/auth");

  // Signed-out API calls get a plain 401, not a redirect to the login page.
  if (!user && isApi) {
    return NextResponse.json({ error: "Sign in to use this." }, { status: 401 });
  }

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    // Remember where they were going (e.g. a challenge invite link) so
    // signing in brings them straight back.
    const wanted = path + request.nextUrl.search;
    if (wanted !== "/") url.searchParams.set("next", wanted);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

// True when the request's Origin (if any) is this site. Requests without an
// Origin header (same-origin GETs, server-to-server calls) are let through —
// the routes still require a signed-in session.
function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const from = new URL(origin).host;
    const hosts = [request.headers.get("x-forwarded-host"), request.headers.get("host"), request.nextUrl.host];
    return hosts.some((h) => !!h && h.split(",")[0].trim() === from);
  } catch {
    return false;
  }
}
