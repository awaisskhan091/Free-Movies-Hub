# OpenReel – multi-page streaming site with an easy admin panel

## Start it (Node 18+, no installs needed)
```
ADMIN_PASSWORD="choose-a-strong-password" SITE_URL="https://your-domain.com" node server.js
```
(Windows PowerShell: `$env:ADMIN_PASSWORD="choose-a-strong-password"; node server.js`)

- Site:   http://localhost:8000
- Admin:  http://localhost:8000/admin.html

## Add a movie (no code)
1. Open admin.html and log in with your password.
2. Click **Add movie**, fill in the 5 short sections (info, people, poster/video, rights, publishing).
3. Upload the poster and video files, or paste links. Click **Save movie**. It is live immediately.

Saving writes `movies.json`, regenerates `sitemap.xml`, and keeps a backup in `movies.json.bak`.
Uploaded files go to `uploads/`. Deleting a movie deletes its uploaded files.

## Deploying
Run `node server.js` on any Node host (VPS, Render, Railway…) with a persistent disk, behind HTTPS.
Set ADMIN_PASSWORD and SITE_URL. Optional: PORT, MAX_VIDEO_MB (default 4096).
For large audiences, host videos on a CDN/video host and paste the link instead of uploading.

## Notes
- Every published movie needs a license type and proof of rights. Only add content you may legally stream.
- Visitor accounts, watchlists and history are stored in each visitor's browser (demo). Use database/schema.sql with Supabase/PostgreSQL for real accounts.
- `tools/generate-sitemap.js` rebuilds the sitemap manually if you edit movies.json by hand.

## Hosting on GitHub Pages
GitHub Pages only serves static files, so server.js does not run there. The admin panel detects this and switches to **GitHub mode**:
it saves movies by committing movies.json (and posters) to your repository through the GitHub API.
1. Create a repository and upload all files in this folder. In Settings → Pages choose "Deploy from a branch", branch main, folder / (root).
2. Open https://YOURNAME.github.io/REPO/admin.html and connect with a fine-grained token (Contents: Read and write, only this repository).
3. Add movies as usual. Changes appear on the site about a minute after saving.
4. Videos cannot be uploaded in GitHub mode (repository file limits, bandwidth). Host them elsewhere and paste the link.
5. Optional: `node tools/set-domain.js https://YOURNAME.github.io/REPO` replaces the placeholder domain in the pages.
Note: a public repository exposes movies.json, including the "proof of rights" text. Do not put private details in it.
