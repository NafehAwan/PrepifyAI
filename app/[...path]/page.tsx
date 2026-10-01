import { renderApp } from "@/lib/renderApp";

// Every other app address (/subjects/physics, /tests/…, /challenges/…,
// /settings). /login, /auth and /api have their own routes and win over this.
export default async function AppPath({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return renderApp(`/${path.map(encodeURIComponent).join("/")}`);
}
