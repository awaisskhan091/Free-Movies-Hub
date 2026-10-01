/* OpenReel shared script: data layer, renderers for every page, auth, player, admin. */
"use strict";
/* ---------- Data (stored in localStorage; swap for Supabase/Postgres API in production) ---------- */
const B="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/";
const SEED={movies:[
{id:1,slug:"big-buck-bunny",t:"Big Buck Bunny",y:2008,lang:"English",rt:10,rate:7.6,g:["Animation","Comedy","Family"],d:"A giant rabbit with a heart bigger than himself takes on three bullying rodents in this Blender Foundation open movie.",dir:"Sacha Goedegebure",cast:["Voice-free short"],v:B+"BigBuckBunny.mp4",tr:"https://peach.blender.org/",lic:"creator_permission",proof:"CC BY 3.0 – Blender Foundation",feat:1,pub:1,views:420,c:["#2f6f4e","#d8a24a"],added:5},
{id:2,slug:"sintel",t:"Sintel",y:2010,lang:"English",rt:15,rate:7.7,g:["Animation","Fantasy","Adventure"],d:"A lonely young woman searches a harsh world for the baby dragon she once befriended.",dir:"Colin Levy",cast:["Halina Reijn","Thom Hoffman"],v:B+"Sintel.mp4",tr:"https://durian.blender.org/",lic:"creator_permission",proof:"CC BY 3.0 – Blender Foundation",feat:0,pub:1,views:380,c:["#7a2d4f","#e0785a"],added:4},
{id:3,slug:"tears-of-steel",t:"Tears of Steel",y:2012,lang:"English",rt:12,rate:6.9,g:["Sci-Fi","Action"],d:"In a future Amsterdam, a group of warriors and scientists try to save the world from destructive robots.",dir:"Ian Hubert",cast:["Derek de Lint","Sergio Hasselbaink","Vanja Rukavina"],v:B+"TearsOfSteel.mp4",tr:"https://mango.blender.org/",lic:"creator_permission",proof:"CC BY 3.0 – Blender Foundation",feat:0,pub:1,views:300,c:["#1d4e7a","#69b6d6"],added:3},
{id:4,slug:"elephants-dream",t:"Elephants Dream",y:2006,lang:"English",rt:11,rate:6.4,g:["Animation","Sci-Fi"],d:"Two strange characters explore a capricious and seemingly infinite machine in the first Blender open movie.",dir:"Bassam Kurdali",cast:["Cas Jansen","Tygo Gernandt"],v:B+"ElephantsDream.mp4",tr:"https://orange.blender.org/",lic:"creator_permission",proof:"CC BY 2.5 – Blender Foundation",feat:0,pub:1,views:210,c:["#5a3b7a","#c9a0e0"],added:2},
{id:5,slug:"nosferatu",t:"Nosferatu",y:1922,lang:"German (silent)",rt:94,rate:7.9,g:["Horror","Classic"],d:"Vampire Count Orlok expresses interest in a new residence and in the wife of his real estate agent.",dir:"F. W. Murnau",cast:["Max Schreck","Greta Schröder"],v:"",tr:"",lic:"public_domain",proof:"",feat:0,pub:1,views:150,c:["#222","#7d7d7d"],added:1},
{id:6,slug:"a-trip-to-the-moon",t:"A Trip to the Moon",y:1902,lang:"French (silent)",rt:14,rate:8.0,g:["Sci-Fi","Classic","Fantasy"],d:"Georges Méliès's landmark fantasy of astronomers launched by cannon to the lunar surface.",dir:"Georges Méliès",cast:["Georges Méliès"],v:"",tr:"",lic:"public_domain",proof:"",feat:0,pub:1,views:170,c:["#2b3a67","#e8c15a"],added:1},
{id:7,slug:"the-general",t:"The General",y:1926,lang:"English (silent)",rt:78,rate:8.1,g:["Comedy","Classic","Adventure"],d:"A railroad engineer chases the Union soldiers who stole his locomotive in Buster Keaton's comic masterpiece.",dir:"Buster Keaton",cast:["Buster Keaton","Marion Mack"],v:"",tr:"",lic:"public_domain",proof:"",feat:0,pub:1,views:120,c:["#6b4a2b","#e1c999"],added:1},
{id:8,slug:"night-of-the-living-dead",t:"Night of the Living Dead",y:1968,lang:"English",rt:96,rate:7.8,g:["Horror","Classic"],d:"A group of strangers barricade themselves in a farmhouse against flesh-eating ghouls.",dir:"George A. Romero",cast:["Duane Jones","Judith O'Dea"],v:"",tr:"",lic:"public_domain",proof:"",feat:0,pub:1,views:190,c:["#2a2a2a","#a33"],added:1}],
genres:["Animation","Comedy","Family","Fantasy","Adventure","Sci-Fi","Action","Horror","Classic","Drama"],
users:[{id:1,name:"Admin",email:"admin@openreel.test",pw:"admin123",role:"admin",wl:[],hist:[],joined:"2026-01-01"}],
ads:[{id:1,place:"home_banner",title:"Your sponsor here",link:"contact.html",on:1,clicks:0}],nextId:9};
const DB=JSON.parse(localStorage.getItem("or_db")||"null")||SEED,save=()=>localStorage.setItem("or_db",JSON.stringify(DB));
let me=DB.users.find(u=>u.id==localStorage.getItem("or_me"))||null;
/* ---------- Helpers ---------- */
const $=s=>document.querySelector(s),app=$("#app");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const toast=m=>{const t=$("#toast");t.textContent=m;t.style.opacity=1;setTimeout(()=>t.style.opacity=0,2200)};
const live=()=>DB.movies.filter(m=>m.pub);
const poster=m=>`<div class="po" style="background:linear-gradient(160deg,${m.c[0]},${m.c[1]})">${m.poster?`<img src="${esc(m.poster)}" alt="${esc(m.t)} poster" loading="lazy" decoding="async" width="300" height="450">`:`<span>${esc(m.t)}</span>`}</div>`;
const card=m=>`<a class="card" href="movie.html?slug=${m.slug}" aria-label="Watch ${esc(m.t)}">${poster(m)}<div class="in"><h3>${esc(m.t)}</h3><div class="mu">${m.y} · ${esc(m.g[0])} · ${esc(m.lang.split(" ")[0])} · ★ ${m.rate}</div><span class="btn sm" style="margin-top:8px">Watch</span></div></a>`;
const row=(t,l,href)=>l.length?`<section class="row"><div class="w"><h2>${href?`<a href="${href}">${t}</a>`:t}</h2><div class="sc">${l.map(card).join("")}</div></div></section>`:"";
const ad=p=>{const a=DB.ads.find(x=>x.on&&x.place==p);return `<div class="ad"><span>Sponsored</span> ${a?`<a href="${esc(a.link)}" rel="sponsored noopener" data-ad="${a.id}">${esc(a.title)}</a>`:"Ad space available"}</div>`};
function seo(title,desc,ld){document.title=title;const set=(sel,attr,val,mk)=>{let e=$(sel);if(!e){e=document.createElement(mk.t);for(const k in mk.a)e.setAttribute(k,mk.a[k]);document.head.appendChild(e)}e.setAttribute(attr,val)};
 const url=location.href.split("#")[0];
 set('meta[name=description]',"content",desc,{t:"meta",a:{name:"description"}});
 set('link[rel=canonical]',"href",url,{t:"link",a:{rel:"canonical"}});
 [["og:title",title],["og:description",desc],["og:url",url],["og:type",ld&&ld["@type"]=="Movie"?"video.movie":"website"]].forEach(([p,v])=>set(`meta[property="${p}"]`,"content",v,{t:"meta",a:{property:p}}));
 let s=$("#ld");if(s)s.remove();if(ld){s=document.createElement("script");s.id="ld";s.type="application/ld+json";s.textContent=JSON.stringify(ld);document.head.appendChild(s)}}
function who(){const a=$("#acct");a.textContent=me?me.name:"Log in";a.href=me?"profile.html":"login.html"}
const need=()=>{if(!me){location.href="login.html";return false}return true};
/* ---------- Pages ---------- */
const P={};
P.home=()=>{const L=live(),h=L.find(m=>m.feat)||L[0];
 seo("OpenReel – Watch free legal movies online","Stream classics, open movies and public-domain cinema for free.",{"@context":"https://schema.org","@type":"WebSite",name:"OpenReel",url:location.origin});
 const gs=DB.genres.filter(g=>L.some(m=>m.g.includes(g)));
 return `${h?`<section class="hero" style="background:linear-gradient(160deg,${h.c[0]},${h.c[1]})"><div class="w"><h1>${esc(h.t)}</h1><p>${esc(h.d)}</p><a class="btn" href="movie.html?slug=${h.slug}">Watch now</a></div></section>`:""}
 ${row("Trending",[...L].sort((a,b)=>b.views-a.views).slice(0,10),"movies.html?sort=views")}${row("Latest releases",[...L].sort((a,b)=>b.y-a.y).slice(0,10),"movies.html?sort=year")}
 <div class="w">${ad("home_banner")}</div>${row("Popular",[...L].sort((a,b)=>b.rate-a.rate).slice(0,10),"movies.html?sort=rate")}${row("Recently added",[...L].sort((a,b)=>b.added-a.added).slice(0,10),"movies.html")}
 <section class="row"><div class="w"><h2>Browse by genre</h2>${gs.map(g=>`<a class="pill" href="genre.html?slug=${slug(g)}">${esc(g)}</a>`).join("")}</div></section>`};
function filterList(q){let L=live();
 if(q.genre)L=L.filter(m=>m.g.some(g=>slug(g)==q.genre));if(q.year)L=L.filter(m=>m.y==q.year);
 if(q.language)L=L.filter(m=>m.lang.toLowerCase().includes(q.language.toLowerCase()));if(q.rating)L=L.filter(m=>m.rate>=+q.rating);
 const s=q.sort||"added";return L.sort((a,b)=>(b[s]||0)-(a[s]||0))}
P.movies=q=>{seo("Browse movies – OpenReel","Filter free legal movies by genre, year, language and rating.");
 const L=filterList(q);return `<div class="w pg"><h1>Movies</h1><form class="fl" id="ff"><select name="genre" aria-label="Genre"><option value="">All genres</option>${DB.genres.map(g=>`<option value="${slug(g)}" ${q.genre==slug(g)?"selected":""}>${esc(g)}</option>`).join("")}</select>
 <input name="year" type="number" placeholder="Year" value="${esc(q.year||"")}" aria-label="Year" style="width:110px"><input name="language" placeholder="Language" value="${esc(q.language||"")}" aria-label="Language" style="width:140px">
 <select name="rating" aria-label="Minimum rating"><option value="">Any rating</option>${[5,6,7,8].map(r=>`<option ${q.rating==r?"selected":""} value="${r}">${r}+ stars</option>`).join("")}</select><button class="btn">Apply</button></form>
 <div class="gr">${L.map(card).join("")}</div>${L.length?"":'<p class="mu">No movies match those filters. Try removing one.</p>'}</div>`};
P.genre=(q,s)=>{if(!s){seo("Genres – OpenReel","Browse free legal movies by genre.");return `<div class="w pg"><h1>Genres</h1>${DB.genres.map(x=>`<a class="pill" href="genre.html?slug=${slug(x)}">${esc(x)}</a>`).join("")}</div>`}const g=DB.genres.find(x=>slug(x)==s);if(!g)return P.nf();seo(`${g} movies – watch free online | OpenReel`,`Stream free legal ${g.toLowerCase()} movies on OpenReel.`);
 const L=live().filter(m=>m.g.includes(g));return `<div class="w pg"><h1>${esc(g)}</h1><div class="gr">${L.map(card).join("")}</div>${L.length?"":'<p class="mu">No titles in this genre yet.</p>'}</div>`};
P.search=q=>{const t=(q.q||"").toLowerCase().trim();seo(`Search${t?`: ${t}`:""} – OpenReel`,"Search OpenReel by title, actor, director, genre, year or language.");
 const L=t?live().filter(m=>[m.t,m.dir,...m.cast,...m.g,m.y,m.lang].join(" ").toLowerCase().includes(t)):[];
 return `<div class="w pg"><h1>${t?`Results for “${esc(t)}”`:"Search"}</h1><div class="gr">${L.map(card).join("")}</div>${t&&!L.length?'<p class="mu">Nothing found. Check the spelling or try a genre or year.</p>':""}${!t?'<p class="mu">Search by title, actor, director, genre, year or language.</p>':""}</div>`};
P.movie=(q,s)=>{const m=DB.movies.find(x=>x.slug==s&&x.pub);if(!m)return P.nf();
 seo(`${m.t} (${m.y}) – watch free online | OpenReel`,m.d.slice(0,155),{"@context":"https://schema.org","@type":"Movie",name:m.t,description:m.d,datePublished:""+m.y,inLanguage:m.lang,genre:m.g,director:{"@type":"Person",name:m.dir},actor:m.cast.map(n=>({"@type":"Person",name:n})),aggregateRating:{"@type":"AggregateRating",ratingValue:m.rate,bestRating:10,ratingCount:Math.max(m.views,1)}});
 const rel=live().filter(x=>x.id!=m.id&&x.g.some(g=>m.g.includes(g))).slice(0,10),inWl=me&&me.wl.includes(m.id);
 return `<div class="w pg">${m.v?`<div class="pl"><video id="vid" src="${esc(m.v)}" preload="metadata" playsinline controlslist="nodownload"></video>
 <div class="ct"><button id="pp" aria-label="Play">▶</button><span class="mu" id="tm">0:00</span><input class="sk" id="sk" type="range" min="0" max="100" value="0" step=".1" aria-label="Seek"><input id="vl" type="range" min="0" max="1" step=".05" value="1" style="width:80px" aria-label="Volume">
 <select id="sp" aria-label="Playback speed">${[.5,.75,1,1.25,1.5,2].map(r=>`<option ${r==1?"selected":""} value="${r}">${r}×</option>`).join("")}</select><button id="fs" aria-label="Fullscreen">⛶</button></div></div>`:`<div class="pl nov">No authorized video source has been added for this title yet.</div>`}
 ${ad("movie_below_player")}
 <article class="dt">${poster(m)}<div><h1>${esc(m.t)}</h1><p class="mu" style="margin:6px 0 14px">${m.y} · ${esc(m.lang)} · ${m.rt} min · ★ ${m.rate}</p>${m.g.map(g=>`<a class="pill" href="genre.html?slug=${slug(g)}">${esc(g)}</a>`).join("")}
 <p style="margin:14px 0;max-width:62ch">${esc(m.d)}</p><p><b>Director:</b> ${esc(m.dir)}</p><p><b>Cast:</b> ${m.cast.map(esc).join(", ")}</p>
 <p class="mu">Rights: ${m.lic.replace("_"," ")}${m.proof?" – "+esc(m.proof):""}</p>
 <div style="display:flex;gap:10px;margin:18px 0;flex-wrap:wrap"><button class="btn g" id="wl" aria-pressed="${!!inWl}">${inWl?"✓ In watchlist":"+ Add to watchlist"}</button>${m.tr?`<a class="btn g" href="${esc(m.tr)}" target="_blank" rel="noopener">Trailer / project page</a>`:""}</div></div></article>${row("Related movies",rel)}</div>`};
P.login=()=>{seo("Log in – OpenReel","Log in to OpenReel.");return `<div class="w pg"><form class="fm" id="lf"><h1>Log in</h1><input name="email" type="email" placeholder="Email" required aria-label="Email"><input name="pw" type="password" placeholder="Password" required aria-label="Password"><button class="btn">Log in</button><p class="er" role="alert" id="er"></p><p class="mu"><a href="reset-password.html">Forgot password?</a> · <a href="signup.html">Create account</a></p><p class="mu">Demo admin: admin@openreel.test / admin123</p></form></div>`};
P.signup=()=>{seo("Sign up – OpenReel","Create a free OpenReel account.");return `<div class="w pg"><form class="fm" id="sf2"><h1>Create your account</h1><input name="name" placeholder="Display name" required aria-label="Display name"><input name="email" type="email" placeholder="Email" required aria-label="Email"><input name="pw" type="password" minlength="8" placeholder="Password (8+ characters)" required aria-label="Password"><button class="btn">Sign up</button><p class="er" role="alert" id="er"></p><p class="mu">Have an account? <a href="login.html">Log in</a></p></form></div>`};
P.reset=()=>{seo("Reset password – OpenReel","Reset your OpenReel password.");return `<div class="w pg"><form class="fm" id="rf"><h1>Reset password</h1><input name="email" type="email" placeholder="Email" required aria-label="Email"><input name="pw" type="password" minlength="8" placeholder="New password" required aria-label="New password"><button class="btn">Reset password</button><p class="er" id="er" role="alert"></p><p class="mu">Demo mode sets the password directly. In production, Supabase emails a reset link.</p></form></div>`};
P.profile=()=>{if(!need())return"";seo("My profile – OpenReel","Your OpenReel profile.");
 return `<div class="w pg"><h1>Hi, ${esc(me.name)}</h1><p class="mu">${esc(me.email)} · ${me.role}</p><form class="fm" id="pf" style="margin:24px 0;margin-left:0"><input name="name" value="${esc(me.name)}" aria-label="Display name"><button class="btn">Save profile</button></form>
 <div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn g" href="watchlist.html">Watchlist (${me.wl.length})</a><a class="btn g" href="history.html">Watch history</a>${me.role=="admin"?'<a class="btn" href="admin.html">Admin dashboard</a>':""}<button class="btn g" id="lo">Log out</button></div></div>`};
P.watchlist=()=>{if(!need())return"";seo("Watchlist – OpenReel","Your saved movies.");const L=me.wl.map(i=>DB.movies.find(m=>m.id==i)).filter(Boolean);
 return `<div class="w pg"><h1>Watchlist</h1><div class="gr">${L.map(m=>`<div>${card(m)}<button class="btn g sm" style="margin-top:6px" data-rm="${m.id}">Remove</button></div>`).join("")}</div>${L.length?"":'<p class="mu">Your watchlist is empty. Add a movie from its page.</p>'}</div>`};
P.history=()=>{if(!need())return"";seo("Watch history – OpenReel","Movies you've watched.");const L=me.hist.map(h=>({m:DB.movies.find(m=>m.id==h.id),h})).filter(x=>x.m);
 return `<div class="w pg"><h1>Watch history</h1><div class="gr">${L.map(x=>`<div>${card(x.m)}<p class="mu">${new Date(x.h.at).toLocaleDateString()}</p></div>`).join("")}</div>${L.length?'<button class="btn g sm" id="ch">Clear history</button>':'<p class="mu">Nothing watched yet.</p>'}</div>`};
const INFO={about:["About OpenReel",["OpenReel is a free streaming site for films we have the right to show: public-domain classics, licensed titles and works shared by filmmakers with permission.","Every title records its license type and proof of rights, and administrators can only publish content they are authorized to stream."]],
contact:["Contact",["Questions, takedown requests or filmmaker submissions: contact@your-domain.com (replace before launch)."]],
privacy:["Privacy Policy",["We collect your email, display name, watchlist and watch history to provide the service. We do not sell personal data.","You may request deletion of your account and data at any time. Advertising partners may set cookies. Have this policy reviewed by a lawyer for your jurisdiction (GDPR/CCPA)."]],
terms:["Terms of Service",["Use OpenReel for personal, non-commercial viewing. Do not copy, record or redistribute content.","We may suspend accounts that violate these terms. Content is provided as is. Have these terms reviewed by a lawyer before launch."]],
dmca:["Copyright / DMCA",["OpenReel respects intellectual property. To report infringement, email dmca@your-domain.com with your contact details, the work and URL, a good-faith statement, and a statement under penalty of perjury that you own or are authorized to act for the owner, with your signature.","We remove infringing content promptly and terminate repeat infringers."]]};
const info=k=>()=>{const[t,b]=INFO[k];seo(`${t} – OpenReel`,b[0].slice(0,155));return `<div class="w pg" style="max-width:760px"><h1>${t}</h1>${b.map(p=>`<p style="margin-bottom:14px">${p}</p>`).join("")}${k=="contact"?'<form class="fm" id="cf" style="margin:24px 0 0"><input placeholder="Name" aria-label="Name" required><input type="email" placeholder="Email" aria-label="Email" required><textarea rows="5" placeholder="Message" aria-label="Message" required></textarea><button class="btn">Send message</button></form>':""}</div>`};
Object.keys(INFO).forEach(k=>P[k]=info(k));
P.nf=()=>{seo("Page not found – OpenReel","");return `<div class="w pg"><h1>Page not found</h1><p class="mu">That page doesn't exist. <a href="index.html" style="color:var(--ac)">Go home</a></p></div>`};
let tab="movies",edit=null;
P.admin=()=>{if(!need())return"";if(me.role!="admin"){location.href="index.html";return""}seo("Admin – OpenReel","");
 const f=edit||{lic:"public_domain",pub:1,g:[],cast:[],c:["#3a3358","#a493d9"]};
 const tabs=`<div class="tb">${["movies","genres","users","ads"].map(t=>`<button data-tab="${t}" class="${t==tab?"on":""}">${t}</button>`).join("")}</div>`;
 const st=`<div class="st"><div><b>${DB.movies.length}</b>movies</div><div><b>${DB.users.length}</b>users</div><div><b>${DB.movies.reduce((s,m)=>s+m.views,0)}</b>total views</div><div><b>${DB.users.reduce((s,u)=>s+u.wl.length,0)}</b>watchlist adds</div><div><b>${DB.ads.reduce((s,a)=>s+a.clicks,0)}</b>ad clicks</div></div>`;
 let body="";
 if(tab=="movies")body=`<form class="ad2" id="mf"><input class="f" name="t" placeholder="Title" value="${esc(f.t)}" required><input name="y" type="number" placeholder="Year" value="${f.y||""}"><input name="lang" placeholder="Language" value="${esc(f.lang)}"><input name="rt" type="number" placeholder="Runtime (min)" value="${f.rt||""}"><input name="rate" type="number" step=".1" max="10" placeholder="Rating 0–10" value="${f.rate||""}">
 <input name="g" placeholder="Genres (comma separated)" value="${esc(f.g.join(", "))}"><input name="dir" placeholder="Director" value="${esc(f.dir)}"><input class="f" name="cast" placeholder="Cast (comma separated)" value="${esc(f.cast.join(", "))}">
 <input name="poster" placeholder="Poster image URL (optional)" value="${esc(f.poster)}"><input name="tr" placeholder="Trailer URL" value="${esc(f.tr)}"><input class="f" name="v" placeholder="Authorized video URL or upload below" value="${esc(f.v)}"><input class="f" type="file" id="pfile" accept="image/*" aria-label="Upload poster image"><input class="f" type="file" id="vf" accept="video/*" aria-label="Upload video file">
 <select name="lic"><option value="public_domain" ${f.lic=="public_domain"?"selected":""}>Public domain</option><option value="licensed" ${f.lic=="licensed"?"selected":""}>Licensed</option><option value="creator_permission" ${f.lic=="creator_permission"?"selected":""}>Creator permission</option></select><input name="proof" placeholder="Proof of rights (URL / note) – required" value="${esc(f.proof)}">
 <textarea class="f" name="d" rows="3" placeholder="Description">${esc(f.d)}</textarea><label><input type="checkbox" name="feat" ${f.feat?"checked":""}> Featured</label><label><input type="checkbox" name="pub" ${f.pub?"checked":""}> Published</label><button class="btn f">${edit?"Save changes":"Add movie"}</button></form>
 <table><thead><tr><th>Title</th><th>Year</th><th>License</th><th>Status</th><th></th></tr></thead><tbody>${DB.movies.map(m=>`<tr><td>${esc(m.t)}${m.feat?" ★":""}</td><td>${m.y}</td><td>${m.lic}</td><td>${m.pub?"Live":"Draft"}</td><td><button class="btn g sm" data-ed="${m.id}">Edit</button> <button class="btn g sm" data-del="${m.id}">Delete</button></td></tr>`).join("")}</tbody></table>`;
 if(tab=="genres")body=`<form class="fl" id="gf"><input name="n" placeholder="New genre" required><button class="btn">Add genre</button></form>${DB.genres.map(g=>`<span class="pill">${esc(g)} <button data-dg="${esc(g)}" aria-label="Delete ${esc(g)}" style="background:none;border:0;color:var(--mu);cursor:pointer">×</button></span>`).join("")}`;
 if(tab=="users")body=`<table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr></thead><tbody>${DB.users.map(u=>`<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${u.role}</td><td>${u.id!=me.id?`<button class="btn g sm" data-role="${u.id}">Make ${u.role=="admin"?"user":"admin"}</button> <button class="btn g sm" data-du="${u.id}">Delete</button>`:""}</td></tr>`).join("")}</tbody></table>`;
 if(tab=="ads")body=`<form class="fl" id="af"><select name="place">${["home_banner","movie_below_player"].map(p=>`<option>${p}</option>`).join("")}</select><input name="title" placeholder="Ad text" required><input name="link" placeholder="Link URL" required><button class="btn">Add ad</button></form><table><tbody>${DB.ads.map(a=>`<tr><td>${a.place}</td><td>${esc(a.title)}</td><td>${a.clicks} clicks</td><td><button class="btn g sm" data-ta="${a.id}">${a.on?"Pause":"Activate"}</button> <button class="btn g sm" data-da="${a.id}">Delete</button></td></tr>`).join("")}</tbody></table>`;
 return `<div class="w pg"><h1>Admin dashboard</h1>${st}${tabs}${body}</div>`};
/* ---------- Router + events ---------- */
function route(){const q=Object.fromEntries(new URLSearchParams(location.search));const k=document.body.dataset.page,s=q.slug;
 const fn=P[k||"home"];app.innerHTML=(fn?fn(q,s):P.nf());window.scrollTo(0,0);who();$("#app").querySelectorAll("a[data-ad]").forEach(a=>a.onclick=()=>{DB.ads.find(x=>x.id==a.dataset.ad).clicks++;save()});
 document.querySelectorAll("nav a").forEach(a=>a.classList.toggle("on",a.getAttribute("href").split("?")[0]===(k=="home"?"index.html":k+".html")));bind(k,s,q)}
function bind(k,s){const $$=(sel,fn)=>app.querySelectorAll(sel).forEach(fn),on=(sel,ev,fn)=>{const e=app.querySelector(sel);if(e)e.addEventListener(ev,fn)};
 const fd=e=>{e.preventDefault();return Object.fromEntries(new FormData(e.target))};
 on("#ff","submit",e=>{const d=fd(e);location.href="movies.html?"+new URLSearchParams(Object.entries(d).filter(([,v])=>v))});
 on("#lf","submit",e=>{const d=fd(e),u=DB.users.find(x=>x.email==d.email.toLowerCase()&&x.pw==d.pw);if(!u)return $("#er").textContent="Incorrect email or password.";me=u;localStorage.setItem("or_me",u.id);location.href="profile.html"});
 on("#sf2","submit",e=>{const d=fd(e);if(DB.users.some(x=>x.email==d.email.toLowerCase()))return $("#er").textContent="That email is already registered. Log in instead.";
  const u={id:Date.now(),name:d.name,email:d.email.toLowerCase(),pw:d.pw,role:"user",wl:[],hist:[],joined:new Date().toISOString().slice(0,10)};DB.users.push(u);save();me=u;localStorage.setItem("or_me",u.id);toast("Account created");location.href="profile.html"});
 on("#rf","submit",e=>{const d=fd(e),u=DB.users.find(x=>x.email==d.email.toLowerCase());if(!u)return $("#er").textContent="No account uses that email.";u.pw=d.pw;save();toast("Password updated");location.href="login.html"});
 on("#pf","submit",e=>{me.name=fd(e).name;save();who();toast("Profile saved")});on("#lo","click",()=>{localStorage.removeItem("or_me");me=null;location.href="index.html"});
 on("#cf","submit",e=>{e.preventDefault();e.target.reset();toast("Message sent (demo)")});
 on("#ch","click",()=>{me.hist=[];save();route()});$$("[data-rm]",b=>b.onclick=()=>{me.wl=me.wl.filter(i=>i!=b.dataset.rm);save();route()});
 if(k=="movie"){const m=DB.movies.find(x=>x.slug==s);if(!m)return;
  on("#wl","click",()=>{if(!need())return;me.wl=me.wl.includes(m.id)?me.wl.filter(i=>i!=m.id):[...me.wl,m.id];save();route()});
  const v=$("#vid");if(v){const f=t=>Math.floor(t/60)+":"+String(Math.floor(t%60)).padStart(2,"0");
   $("#pp").onclick=v.onclick=()=>v.paused?v.play():v.pause();
   v.onplay=()=>{$("#pp").textContent="❚❚";m.views++;if(me){me.hist=[{id:m.id,at:Date.now()},...me.hist.filter(h=>h.id!=m.id)];}save()};v.onpause=()=>$("#pp").textContent="▶";
   v.ontimeupdate=()=>{$("#sk").value=v.currentTime/v.duration*100||0;$("#tm").textContent=f(v.currentTime)+" / "+f(v.duration||0)};
   $("#sk").oninput=e=>v.currentTime=e.target.value/100*v.duration;$("#vl").oninput=e=>v.volume=e.target.value;$("#sp").onchange=e=>v.playbackRate=+e.target.value;
   $("#fs").onclick=()=>document.fullscreenElement?document.exitFullscreen():v.parentElement.requestFullscreen();
   v.onerror=()=>toast("Video could not be loaded. Check the source URL.")}}
 if(k=="admin"){$$("[data-tab]",b=>b.onclick=()=>{tab=b.dataset.tab;edit=null;route()});
  $$("[data-ed]",b=>b.onclick=()=>{edit=DB.movies.find(m=>m.id==b.dataset.ed);route()});
  $$("[data-del]",b=>b.onclick=()=>{if(confirm("Delete this movie?")){DB.movies=DB.movies.filter(m=>m.id!=b.dataset.del);save();route()}});
  $$("[data-dg]",b=>b.onclick=()=>{DB.genres=DB.genres.filter(g=>g!=b.dataset.dg);save();route()});
  $$("[data-role]",b=>b.onclick=()=>{const u=DB.users.find(x=>x.id==b.dataset.role);u.role=u.role=="admin"?"user":"admin";save();route()});
  $$("[data-du]",b=>b.onclick=()=>{if(confirm("Delete this user?")){DB.users=DB.users.filter(u=>u.id!=b.dataset.du);save();route()}});
  $$("[data-ta]",b=>b.onclick=()=>{const a=DB.ads.find(x=>x.id==b.dataset.ta);a.on=a.on?0:1;save();route()});$$("[data-da]",b=>b.onclick=()=>{DB.ads=DB.ads.filter(a=>a.id!=b.dataset.da);save();route()});
  on("#gf","submit",e=>{DB.genres.push(fd(e).n);save();route()});on("#af","submit",e=>{DB.ads.push({id:Date.now(),...fd(e),on:1,clicks:0});save();route()});
  on("#mf","submit",e=>{const d=fd(e),c=x=>x.split(",").map(s=>s.trim()).filter(Boolean);
   if(!d.proof&&!confirm("No proof of rights recorded. Only publish content you are authorized to stream. Save anyway?"))return;
   const pfl=$("#pfile").files[0],file=$("#vf").files[0],vurl=file?URL.createObjectURL(file):d.v;if(file)toast("Uploaded files are session-only in demo mode; use storage in production.");
   const m=Object.assign(edit||{id:DB.nextId++,views:0,added:Date.now(),c:["#3a3358","#a493d9"]},{t:d.t,slug:edit?edit.slug:slug(d.t+"-"+d.y),y:+d.y||0,lang:d.lang||"English",rt:+d.rt||0,rate:+d.rate||0,g:c(d.g),dir:d.dir,cast:c(d.cast),v:vurl,tr:d.tr,poster:pfl?URL.createObjectURL(pfl):d.poster,lic:d.lic,proof:d.proof,d:d.d,feat:d.feat?1:0,pub:d.pub?1:0});
   if(m.feat)DB.movies.forEach(x=>{if(x.id!=m.id)x.feat=0});if(!edit)DB.movies.push(m);edit=null;save();route();toast("Saved")})}}
$("#sf").addEventListener("submit",e=>{e.preventDefault();location.href="search.html?q="+encodeURIComponent($("#q").value)});
route();