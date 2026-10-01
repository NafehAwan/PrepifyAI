import { renderApp } from "@/lib/renderApp";

export default async function Page({ searchParams }: { searchParams: Promise<{ join?: string | string[] }> }) {
  const { join } = await searchParams;
  return renderApp("/", typeof join === "string" ? join : undefined);
}
