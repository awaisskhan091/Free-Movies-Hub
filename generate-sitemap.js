// Usage: node tools/generate-sitemap.js https://your-domain.com
// Rebuilds sitemap.xml from movies.json. Run it after you add or remove movies.
const fs=require('fs'),path=require('path');
const site=(process.argv[2]||'https://your-domain.com').replace(/\/$/,'');
const root=path.join(__dirname,'..'),cat=JSON.parse(fs.readFileSync(path.join(root,'movies.json'),'utf8'));
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const urls=['',...['movies','genre','about','contact','privacy','terms','dmca'].map(p=>p+'.html'),
 ...cat.genres.map(g=>`genre.html?slug=${slug(g)}`),...cat.movies.filter(m=>m.pub).map(m=>`movie.html?slug=${m.slug}`)];
fs.writeFileSync(path.join(root,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`<url><loc>${site}/${u.replace(/&/g,'&amp;')}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(root,'robots.txt'),fs.readFileSync(path.join(root,'robots.txt'),'utf8').replace(/Sitemap:.*/,`Sitemap: ${site}/sitemap.xml`));
console.log(`sitemap.xml written with ${urls.length} URLs for ${site}`);
