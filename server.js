// OpenReel server: serves the site and powers the admin panel. No dependencies. Node 18+.
// Run:  ADMIN_PASSWORD="choose-a-strong-one" SITE_URL="https://your-domain.com" node server.js
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=__dirname,PORT=+process.env.PORT||8000,SITE=(process.env.SITE_URL||'https://your-domain.com').replace(/\/$/,'');
const PASS=process.env.ADMIN_PASSWORD||'admin123',MAXV=(+process.env.MAX_VIDEO_MB||4096)*1048576,MAXP=10*1048576;
const CAT=path.join(ROOT,'movies.json'),UP=path.join(ROOT,'uploads');
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.xml':'application/xml','.txt':'text/plain','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp4':'video/mp4','.webm':'video/webm','.m3u8':'application/vnd.apple.mpegurl','.ts':'video/mp2t'};
const BLOCK=/^\/(server\.js|package(-lock)?\.json|tools\/|database\/|\.|movies\.json\.bak)/;
const sessions=new Map(),fails=new Map();
const sha=s=>crypto.createHash('sha256').update(String(s)).digest();
const json=(res,code,obj,h={})=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store',...h});res.end(JSON.stringify(obj))};
const cookie=req=>Object.fromEntries((req.headers.cookie||'').split(';').map(c=>c.trim().split('=')).filter(c=>c[0]));
const isAdmin=req=>{const t=cookie(req).or_admin,e=sessions.get(t);return !!(t&&e&&e>Date.now())};
const slugify=s=>String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function body(req,limit){return new Promise((ok,no)=>{let b='';req.on('data',c=>{b+=c;if(b.length>limit){no(new Error('Too large'));req.destroy()}});req.on('end',()=>ok(b));req.on('error',no)})}
function validate(c){
 if(!c||!Array.isArray(c.movies)||!Array.isArray(c.genres)||!Array.isArray(c.ads))return 'Invalid catalog format.';
 const ids=new Set(),slugs=new Set(),okUrl=u=>!u||/^https?:\/\/\S+$/i.test(u)||(/^uploads\/[\w\-./]+$/.test(u)&&!u.includes('..'));
 for(const m of c.movies){
  if(!m.t||!/^[a-z0-9-]+$/.test(m.slug||''))return `"${m.t||'Untitled'}" needs a title and a valid web name (slug).`;
  if(ids.has(m.id)||slugs.has(m.slug))return `Duplicate movie id or web name: ${m.slug}`;ids.add(m.id);slugs.add(m.slug);
  if(!['public_domain','licensed','creator_permission'].includes(m.lic))return `Choose a license type for "${m.t}".`;
  if(m.pub&&!String(m.proof||'').trim())return `Add proof of rights before publishing "${m.t}".`;
  for(const k of ['v','poster','tr'])if(!okUrl(m[k]))return `"${m.t}": ${k} must be an https:// link or an uploaded file.`;}
 return null}
const uploadsIn=c=>new Set(c.movies.flatMap(m=>[m.v,m.poster]).filter(u=>u&&u.startsWith('uploads/')));
function writeSitemap(c){
 const slug=slugify,u=['',...['movies','genre','about','contact','privacy','terms','dmca'].map(p=>p+'.html'),...c.genres.map(g=>`genre.html?slug=${slug(g)}`),...c.movies.filter(m=>m.pub).map(m=>`movie.html?slug=${m.slug}`)];
 fs.writeFileSync(path.join(ROOT,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${u.map(x=>`<url><loc>${SITE}/${x.replace(/&/g,'&amp;')}</loc></url>`).join('\n')}\n</urlset>\n`)}
function send(res,code,msg){res.writeHead(code,{'Content-Type':'text/plain'});res.end(msg)}
function serve(req,res,p){
 try{p=decodeURIComponent(p)}catch(e){return send(res,400,'Bad request')}
 if(p.includes('\0'))return send(res,400,'Bad request');if(p.endsWith('/'))p+='index.html';
 const f=path.normalize(path.join(ROOT,p));if(!f.startsWith(ROOT+path.sep)||BLOCK.test(p))return send(res,404,'Not found');
 fs.stat(f,(e,st)=>{if(e||!st.isFile())return send(res,404,'Not found');
  const ext=path.extname(f).toLowerCase(),h={'Content-Type':MIME[ext]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':p.startsWith('/uploads/')?'public, max-age=86400':'no-cache'};
  let s=0,en=st.size-1,code=200;const r=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range||'');
  if(r){if(r[1]!=='')s=+r[1];if(r[2]!=='')en=+r[2];if(r[1]===''&&r[2]!==''){s=Math.max(st.size-en,0);en=st.size-1}
   if(s>en||s>=st.size){res.writeHead(416,{'Content-Range':`bytes */${st.size}`});return res.end()}en=Math.min(en,st.size-1);code=206;h['Content-Range']=`bytes ${s}-${en}/${st.size}`}
  h['Content-Length']=en-s+1;res.writeHead(code,h);if(req.method==='HEAD')return res.end();fs.createReadStream(f,{start:s,end:en}).pipe(res)})}
http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://x'),ip=req.socket.remoteAddress;
 if(!url.pathname.startsWith('/api/'))return serve(req,res,url.pathname);
 try{
  const mutating=req.method!=='GET';if(mutating&&req.headers['x-or']!=='1')return json(res,403,{error:'Forbidden'});
  if(url.pathname==='/api/login'&&req.method==='POST'){
   const f=fails.get(ip)||{n:0,until:0};if(f.until>Date.now())return json(res,429,{error:'Too many attempts. Wait a minute and try again.'});
   const {password}=JSON.parse(await body(req,2000)||'{}');
   if(crypto.timingSafeEqual(sha(password),sha(PASS))){fails.delete(ip);const t=crypto.randomBytes(32).toString('hex');sessions.set(t,Date.now()+12*3600e3);
    return json(res,200,{ok:true},{'Set-Cookie':`or_admin=${t}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200`})}
   f.n++;if(f.n>=5){f.until=Date.now()+60000;f.n=0}fails.set(ip,f);return json(res,401,{error:'Wrong password.'})}
  if(url.pathname==='/api/logout'){sessions.delete(cookie(req).or_admin);return json(res,200,{ok:true},{'Set-Cookie':'or_admin=; Max-Age=0; Path=/'})}
  if(!isAdmin(req))return json(res,401,{error:'Please log in.'});
  if(url.pathname==='/api/session')return json(res,200,{ok:true});
  if(url.pathname==='/api/catalog'&&req.method==='PUT'){
   let c;try{c=JSON.parse(await body(req,5e6))}catch(e){return json(res,400,{error:'Invalid data.'})}
   const err=validate(c);if(err)return json(res,400,{error:err});
   let old={movies:[]};try{old=JSON.parse(fs.readFileSync(CAT,'utf8'));fs.copyFileSync(CAT,CAT+'.bak')}catch(e){}
   fs.writeFileSync(CAT+'.tmp',JSON.stringify(c,null,2));fs.renameSync(CAT+'.tmp',CAT);
   const keep=uploadsIn(c);for(const u of uploadsIn(old))if(!keep.has(u))fs.unlink(path.join(ROOT,u),()=>{});
   writeSitemap(c);return json(res,200,{ok:true})}
  if(url.pathname==='/api/upload'&&req.method==='POST'){
   const kind=url.searchParams.get('kind'),poster=kind==='poster';if(!poster&&kind!=='video')return json(res,400,{error:'Unknown upload type.'});
   let name='';try{name=decodeURIComponent(req.headers['x-filename']||'')}catch(e){}
   const ext=path.extname(name).toLowerCase(),limit=poster?MAXP:MAXV,len=+req.headers['content-length'];
   if(!(poster?['.jpg','.jpeg','.png','.webp']:['.mp4','.webm']).includes(ext))return json(res,400,{error:poster?'Posters must be JPG, PNG or WebP.':'Videos must be MP4 or WebM.'});
   if(!len||len>limit)return json(res,413,{error:`File too large (max ${Math.round(limit/1048576)} MB).`});
   const dir=poster?'posters':'videos',fname=`${Date.now().toString(36)}-${slugify(path.basename(name,ext)).slice(0,60)||'file'}${ext}`;
   fs.mkdirSync(path.join(UP,dir),{recursive:true});const dest=path.join(UP,dir,fname),ws=fs.createWriteStream(dest);let size=0;
   req.on('data',c=>{size+=c.length;if(size>limit){ws.destroy();req.destroy();fs.unlink(dest,()=>{})}});req.pipe(ws);
   ws.on('finish',()=>json(res,200,{url:`uploads/${dir}/${fname}`}));ws.on('error',()=>json(res,500,{error:'Could not save the file.'}));return}
  json(res,404,{error:'Not found'})
 }catch(e){json(res,500,{error:'Server error.'})}
}).listen(PORT,()=>{console.log(`OpenReel running at http://localhost:${PORT}\nAdmin panel:  http://localhost:${PORT}/admin.html`);
 if(!process.env.ADMIN_PASSWORD)console.log('\n!! Using the default admin password "admin123". Set ADMIN_PASSWORD before going live.\n')});
