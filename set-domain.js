// Usage: node tools/set-domain.js https://yourname.github.io/openreel
// Replaces the placeholder https://your-domain.com in every page, the sitemap and robots.txt.
const fs=require('fs'),path=require('path'),root=path.join(__dirname,'..'),to=(process.argv[2]||'').replace(/\/$/,'');
if(!to)throw new Error('Give your site address, e.g. node tools/set-domain.js https://yourname.github.io/openreel');
let n=0;for(const f of fs.readdirSync(root).filter(f=>/\.(html|xml|txt)$/.test(f))){const p=path.join(root,f),s=fs.readFileSync(p,'utf8');if(s.includes('https://your-domain.com')){fs.writeFileSync(p,s.split('https://your-domain.com').join(to));n++}}
console.log('Updated '+n+' files.');
