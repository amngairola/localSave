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
