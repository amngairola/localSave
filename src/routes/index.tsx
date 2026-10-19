import { createFileRoute } from "@tanstack/react-router";
import { Download, FileCode, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SnipVault — Local snippet manager for Chrome" },
      { name: "description", content: "Save, search and copy text snippets in Chrome. Offline, private, no account." },
      { property: "og:title", content: "SnipVault — Local snippet manager for Chrome" },
      { property: "og:description", content: "Save, search and copy text snippets in Chrome. Offline, private, no account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function download(file: string) {
  fetch(`/${file}`)
    .then((r) => {
      if (!r.ok) throw new Error(`Download failed: ${r.status}`);
      return r.blob();
    })
    .then((b) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = file;
      a.click();
      URL.revokeObjectURL(a.href);
    })
    .catch((e: Error) => alert(e.message));
}

const steps = [
  "Download and unzip snipvault.zip.",
  "Open chrome://extensions in Chrome, Edge, Brave or Arc.",
  "Turn on Developer mode (top-right).",
  "Click Load unpacked and pick the unzipped folder.",
  "Pin SnipVault from the puzzle-piece menu and click its icon.",
];

function Index() {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="mx-auto grid max-w-5xl gap-12 px-6 py-16 md:grid-cols-[1fr_400px]">
        <section>
          <p className="mb-3 text-sm font-medium text-muted-foreground">Chrome extension · Manifest V3</p>
          <h1 className="text-4xl font-semibold tracking-tight">SnipVault</h1>
          <p className="mt-3 max-w-md text-muted-foreground">
            Save text with a title, search it instantly, copy it with one click. Everything stays on your device —
            no account, no cloud, no tracking.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => download("snipvault.zip")} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Download size={16} /> Download extension
            </button>
            <button onClick={() => download("snipvault-source.zip")} className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent">
              <FileCode size={16} /> Source code
            </button>
          </div>
          <h2 className="mt-12 mb-3 text-sm font-semibold">Install</h2>
          <ol className="space-y-2 text-sm text-muted-foreground">
            {steps.map((s, i) => (
              <li key={s} className="flex gap-3"><span className="text-foreground">{i + 1}.</span>{s}</li>
            ))}
          </ol>
          <p className="mt-8 flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck size={14} className="mt-0.5 shrink-0" />
            Only the “storage” permission is requested. Data isn’t encrypted — don’t store passwords or keys.
          </p>
        </section>
        <section>
          <p className="mb-2 text-xs text-muted-foreground">Live preview (saves to this browser only)</p>
          <iframe title="SnipVault popup preview" src="/snipvault-popup/index.html" className="h-[580px] w-[400px] rounded-xl border border-border" />
        </section>
      </div>
    </div>
  );
}
