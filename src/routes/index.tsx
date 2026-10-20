import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "SnipVault — Snippets" },
    { name: "description", content: "Your local SnipVault snippet workspace." },
    { property: "og:title", content: "SnipVault — Snippets" },
    { property: "og:description", content: "Your local SnipVault snippet workspace." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Index,
});
function Index() {
  return <main className="dark flex min-h-dvh items-start justify-center bg-background text-foreground sm:items-center">
    <iframe title="SnipVault" src="/snipvault-popup/index.html" className="h-[min(580px,100dvh)] w-full max-w-[400px] border-0" />
  </main>;
}
