import { renderApp } from "@/lib/renderApp";

export default async function Page({ searchParams }: { searchParams?: { join?: string } }) {
  return renderApp("/", searchParams?.join);
}
