<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- The Chrome extension lives in `extension/` with its own Vite config; build with `bunx vite build --config extension/vite.config.ts`, then copy `dist` to `public/snipvault-popup` and re-zip into `public/snipvault.zip` — the website only serves the prebuilt files.
- The website embeds the prebuilt popup as its primary interface; keep extension dependencies isolated and do not import popup modules into TanStack routes.
- Keep storage reads, validated cache, serialized mutations, and external-change subscriptions in the extension storage service; failed reads must block writes rather than substitute an empty collection.
- Use the extension Button component for popup actions and Modal for trapped, labelled dialogs; popup shortcuts live in App and form save shortcuts live in SnippetForm.
- Behavioral extension tests live beside the existing tests under src/test and import extension source directly.
