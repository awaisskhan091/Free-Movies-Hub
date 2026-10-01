# OpenReel – multi-page streaming site

## Run it
Serve the folder over http (the site loads `movies.json`):
`python3 -m http.server 8000` then open http://localhost:8000

## Add movies (everyone sees them)
Edit **movies.json** and add an object to the `movies` list:

```json
{
  "id": 9, "slug": "my-film-2020", "t": "My Film", "y": 2020, "lang": "English", "rt": 88, "rate": 7.5,
  "g": ["Drama"], "d": "Short description.", "dir": "Director Name", "cast": ["Actor One", "Actor Two"],
  "v": "https://your-storage.com/films/my-film.mp4",
  "poster": "https://your-storage.com/posters/my-film.jpg",
  "tr": "", "lic": "licensed", "proof": "Licence agreement with Studio X, 2026",
  "feat": 0, "pub": 1, "views": 0, "c": ["#3a3358", "#a493d9"], "added": 9
}
```
- `id` and `slug` must be unique. `lic` is `public_domain`, `licensed` or `creator_permission`; `proof` records your right to stream it.
- `v` can be an `.mp4`/`.webm` file or an HLS `.m3u8` stream. Leave it `""` to show "no authorized video".
- `feat: 1` puts the movie in the home page hero. `c` is the two poster gradient colours used when there is no `poster` image.
- Then refresh the sitemap: `node tools/generate-sitemap.js https://your-domain.com`

## Or use the admin panel
Log in at login.html (demo: admin@openreel.test / admin123, change it), open Admin dashboard, add or edit movies, then click **Export movies.json** and replace the file on your server. Admin changes are stored in the browser until exported.

## Other
`database/schema.sql` is the PostgreSQL/Supabase schema for a full backend. Only add content you have the right to stream.
