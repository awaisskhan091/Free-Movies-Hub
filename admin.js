"use strict";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const slug=s=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const PAL=[["#2f6f4e","#d8a24a"],["#7a2d4f","#e0785a"],["#1d4e7a","#69b6d6"],["#5a3b7a","#c9a0e0"],["#6b4a2b","#e1c999"],["#2b3a67","#e8c15a"]];
let C={movies:[],genres:[],ads:[]},editId=null,slugTouched=false,MODE="server",GH=null,SHA=null,lastUp=new Set();
function toast(m,bad){const t=$("#toast");t.textContent=m;t.style.background=bad?"#ff8a8a":"var(--ac)";t.style.opacity=1;clearTimeout(toast.t);toast.t=setTimeout(()=>t.style.opacity=0,3800)}
function view(v){$("#login").hidden=v!=="login";$("#panel").hidden=v!=="panel"}
async function api(url,opt={}){const r=await fetch(url,{credentials:"same-origin",...opt,headers:{"X-OR":"1","Content-Type":"application/json",...(opt.headers||{})}});let j={};try{j=await r.json()}catch(e){}
 if(r.status===401&&url!=="/api/login"){view("login");throw new Error("Please log in again.")}if(!r.ok)throw new Error(j.error||"Request failed ("+r.status+")");return j}
async function load(){if(MODE==="github")return loadGH();const r=await fetch("movies.json?"+Date.now(),{cache:"no-store"});C=await r.json()}
const saveCat=()=>MODE==="github"?saveGH():api("/api/catalog",{method:"PUT",body:JSON.stringify(C)});
async function persist(msg){try{await saveCat();toast(msg||"Saved. It's live on the site now.");render();return true}catch(e){toast(e.message,true);await load().catch(()=>{});render();return false}}
function tab(t){$$("#tabs button").forEach(b=>b.classList.toggle("on",b.dataset.t===t));["movies","form","genres","ads","stats"].forEach(x=>$("#t-"+x).hidden=x!==t);if(t!=="form")$("#tabform").textContent="Add movie"}
/* ---- movie list ---- */
function renderMovies(){const q=$("#ms").value.toLowerCase(),L=C.movies.filter(m=>!q||(m.t+" "+m.y+" "+(m.g||[]).join(" ")).toLowerCase().includes(q)).sort((a,b)=>b.id-a.id);
 $("#ml").innerHTML=L.map(m=>`<div class="mv">${m.poster?`<img class="th" src="${esc(m.poster)}" alt="" loading="lazy">`:`<div class="th" style="background:linear-gradient(160deg,${m.c[0]},${m.c[1]})"></div>`}
 <div class="ti"><b>${esc(m.t)}</b> ${m.feat?"★":""}<div class="mu">${m.y} · ${esc((m.g||[]).join(", "))} · ${m.lic.replace("_"," ")}${m.v?"":" · no video"}</div></div><span class="bd ${m.pub?"live":""}">${m.pub?"Live":"Draft"}</span>
 <div><button class="btn g sm" data-a="edit" data-id="${m.id}">Edit</button> <button class="btn g sm" data-a="pub" data-id="${m.id}">${m.pub?"Hide":"Publish"}</button> <button class="btn g sm" data-a="feat" data-id="${m.id}">${m.feat?"Unfeature":"Feature"}</button> <a class="btn g sm" href="movie.html?slug=${esc(m.slug)}" target="_blank" rel="noopener">View</a> <button class="btn g sm" data-a="del" data-id="${m.id}">Delete</button></div></div>`).join("")||`<p class="mu" style="padding:20px 0">${C.movies.length?"No movies match your search.":"No movies yet. Click “Add movie” to create your first one."}</p>`}
$("#ml").addEventListener("click",async e=>{const b=e.target.closest("button[data-a]");if(!b)return;const m=C.movies.find(x=>x.id==b.dataset.id);if(!m)return;
 if(b.dataset.a==="edit")return openForm(m);
 if(b.dataset.a==="pub"){if(!m.pub&&!String(m.proof||"").trim())return toast("Add proof of rights (Edit → Rights) before publishing.",true);m.pub=m.pub?0:1;return persist(m.pub?"Published.":"Hidden from the site.")}
 if(b.dataset.a==="feat"){const on=!m.feat;C.movies.forEach(x=>x.feat=0);m.feat=on?1:0;return persist(on?"Now featured on the home page.":"Removed from the banner.")}
 if(b.dataset.a==="del"&&confirm(`Delete “${m.t}”? Its uploaded files are deleted too. This can't be undone.`)){C.movies=C.movies.filter(x=>x.id!==m.id);persist("Deleted.")}});
/* ---- form ---- */
const F=id=>$("#f-"+id);
function renderChips(sel=[]){$("#chips").innerHTML=C.genres.map(g=>`<label><input type="checkbox" value="${esc(g)}" ${sel.includes(g)?"checked":""}><span>${esc(g)}</span></label>`).join("")}
const chosen=()=>$$("#chips input:checked").map(i=>i.value);
function openForm(m){editId=m?m.id:null;slugTouched=!!m;m=m||{};
 $("#ft").textContent=m.id?"Edit movie":"Add a movie";$("#tabform").textContent=m.id?"Edit movie":"Add movie";$("#fe").textContent="";
 F("title").value=m.t||"";F("year").value=m.y||"";F("lang").value=m.lang||"English";F("rt").value=m.rt||"";F("rate").value=m.rate||"";F("desc").value=m.d||"";F("dir").value=m.dir||"";F("cast").value=(m.cast||[]).join(", ");
 F("poster").value=m.poster||"";F("video").value=m.v||"";F("trailer").value=m.tr||"";F("lic").value=m.lic||"public_domain";F("proof").value=m.proof||"";F("pub").checked=m.id?!!m.pub:true;F("feat").checked=!!m.feat;F("slug").value=m.slug||"";
 renderChips(m.g||[]);poster();slugUrl();tab("form");window.scrollTo(0,0);F("title").focus()}
function poster(){const u=F("poster").value.trim(),i=$("#pv");i.hidden=!u;if(u)i.src=u}
function slugUrl(){$("#su").textContent=F("slug").value?`movie.html?slug=${F("slug").value}`:""}
function autoSlug(){if(!slugTouched){F("slug").value=slug(F("title").value+(F("year").value?"-"+F("year").value:""));slugUrl()}}
["title","year"].forEach(i=>F(i).addEventListener("input",autoSlug));F("slug").addEventListener("input",()=>{slugTouched=true;F("slug").value=slug(F("slug").value);slugUrl()});F("poster").addEventListener("change",poster);
F("desc").addEventListener("input",()=>$("#dc").textContent=`${F("desc").value.length} characters. The first 155 appear in Google results.`);
$("#ang").onclick=()=>{const n=F("ng").value.trim();if(!n)return;if(!C.genres.some(g=>g.toLowerCase()===n.toLowerCase()))C.genres.push(n);const s=chosen();s.push(C.genres.find(g=>g.toLowerCase()===n.toLowerCase()));renderChips(s);F("ng").value=""};
function upload(kind,file,bar,done){if(MODE==="github")return ghUpload(kind,file,bar,done);return new Promise(res=>{const x=new XMLHttpRequest();x.open("POST","/api/upload?kind="+kind);x.withCredentials=true;x.setRequestHeader("X-OR","1");x.setRequestHeader("X-Filename",encodeURIComponent(file.name));
 x.upload.onprogress=e=>{if(e.lengthComputable){bar.hidden=false;bar.value=e.loaded/e.total*100}};
 x.onload=()=>{bar.hidden=true;let j={};try{j=JSON.parse(x.responseText)}catch(e){}if(x.status===200){done(j.url);toast("Upload finished. Remember to save the movie.")}else{if(x.status===401)view("login");toast(j.error||"Upload failed.",true)}res()};
 x.onerror=()=>{bar.hidden=true;toast("Upload failed. Check your connection.",true);res()};x.send(file)})}
$("#u-poster").onchange=async e=>{const f=e.target.files[0];if(f)await upload("poster",f,$("#b-poster"),u=>{F("poster").value=u;poster()});e.target.value=""};
$("#u-video").onchange=async e=>{const f=e.target.files[0];if(f)await upload("video",f,$("#b-video"),u=>F("video").value=u);e.target.value=""};
$("#save").onclick=async()=>{const err=t=>($("#fe").textContent=t,toast(t,true),false);const t=F("title").value.trim(),y=+F("year").value,g=chosen(),pub=F("pub").checked,proof=F("proof").value.trim();
 if(!t)return err("Enter a title.");if(!y||y<1888)return err("Enter a valid release year.");if(!g.length)return err("Pick at least one genre.");if(pub&&!proof)return err("Add proof of rights, or untick Published to save as a draft.");
 let s=slug(F("slug").value||t+"-"+y);if(C.movies.some(m=>m.slug===s&&m.id!==editId))return err("Another movie already uses this web name. Change it under “Web address”.");
 const old=C.movies.find(m=>m.id===editId),list=s=>s.split(",").map(x=>x.trim()).filter(Boolean);
 const m=Object.assign(old||{id:Math.max(0,...C.movies.map(x=>x.id))+1,views:0,added:Math.max(0,...C.movies.map(x=>x.added||0))+1,c:PAL[Math.floor(Math.random()*PAL.length)]},
  {slug:s,t,y,lang:F("lang").value.trim()||"English",rt:+F("rt").value||0,rate:+F("rate").value||0,g,d:F("desc").value.trim(),dir:F("dir").value.trim(),cast:list(F("cast").value),
   v:F("video").value.trim(),poster:F("poster").value.trim(),tr:F("trailer").value.trim(),lic:F("lic").value,proof,pub:pub?1:0,feat:F("feat").checked?1:0});
 if(m.feat)C.movies.forEach(x=>{if(x!==m)x.feat=0});if(!old)C.movies.push(m);
 $("#save").disabled=true;const ok=await persist(pub?`“${t}” is saved and live on the site.`:`“${t}” saved as a draft.`);$("#save").disabled=false;if(ok){tab("movies")}};
$("#cancel").onclick=()=>tab("movies");$("#addnew").onclick=()=>openForm();
/* ---- genres, ads, stats ---- */
function renderGenres(){$("#gl").innerHTML=C.genres.map(g=>{const n=C.movies.filter(m=>(m.g||[]).includes(g)).length;return `<span class="pill">${esc(g)} <span class="mu">(${n})</span> <button data-g="${esc(g)}" aria-label="Delete ${esc(g)}" style="background:none;border:0;color:var(--mu);cursor:pointer">×</button></span>`}).join("")}
$("#gl").addEventListener("click",e=>{const g=e.target.dataset.g;if(g&&confirm(`Delete genre “${g}”? Movies keep their tag but it won't be listed.`)){C.genres=C.genres.filter(x=>x!==g);persist("Genre deleted.")}});
$("#addg").onclick=()=>{const n=$("#ng").value.trim();if(!n)return;if(C.genres.some(g=>g.toLowerCase()===n.toLowerCase()))return toast("That genre already exists.",true);C.genres.push(n);$("#ng").value="";persist("Genre added.")};
function renderAds(){$("#adl").innerHTML=C.ads.map(a=>`<div class="mv"><div class="ti"><b>${esc(a.title)}</b><div class="mu">${esc(a.place.replace(/_/g," "))} · ${esc(a.link)}</div></div><span class="bd ${a.on?"live":""}">${a.on?"Active":"Paused"}</span><button class="btn g sm" data-ta="${a.id}">${a.on?"Pause":"Activate"}</button> <button class="btn g sm" data-da="${a.id}">Delete</button></div>`).join("")||'<p class="mu">No ads yet.</p>'}
$("#adl").addEventListener("click",e=>{const t=e.target.dataset;if(t.ta){const a=C.ads.find(x=>x.id==t.ta);a.on=a.on?0:1;persist("Ad updated.")}if(t.da&&confirm("Delete this ad?")){C.ads=C.ads.filter(x=>x.id!=t.da);persist("Ad deleted.")}});
$("#aa").onclick=()=>{const t=$("#at").value.trim(),l=$("#al").value.trim();if(!t||!/^https?:\/\//i.test(l)&&!/^[\w./#?=-]+$/.test(l))return toast("Enter the ad text and a link starting with https://",true);C.ads.push({id:Date.now(),place:$("#ap").value,title:t,link:l,on:1,clicks:0});$("#at").value=$("#al").value="";persist("Ad added.")};
function renderStats(){const M=C.movies,n=f=>M.filter(f).length;$("#st").innerHTML=[[M.length,"movies"],[n(m=>m.pub),"live"],[n(m=>!m.pub),"drafts"],[n(m=>m.feat),"featured"],[n(m=>m.v),"with video"],[C.genres.length,"genres"],[C.ads.filter(a=>a.on).length,"active ads"]].map(([a,b])=>`<div><b>${a}</b>${b}</div>`).join("")}
function render(){renderMovies();renderGenres();renderAds();renderStats();if(!$("#t-form").hidden)renderChips(chosen())}
$("#ms").addEventListener("input",renderMovies);$("#tabs").addEventListener("click",e=>{const t=e.target.dataset.t;if(!t)return;if(t==="form"&&$("#tabform").textContent==="Add movie")openForm();else tab(t)});
/* ---- GitHub mode (used when the site is hosted on GitHub Pages, where no server runs) ---- */
const ghStore=()=>JSON.parse(sessionStorage.getItem("or_gh")||localStorage.getItem("or_gh")||"null");
const ghPath=p=>`https://api.github.com/repos/${GH.repo}/contents/${p}`;
const dec=b=>decodeURIComponent(escape(atob(b.replace(/\s/g,"")))),enc=s=>btoa(unescape(encodeURIComponent(s)));
const ups=c=>new Set(c.movies.flatMap(m=>[m.v,m.poster]).filter(u=>u&&u.startsWith("uploads/")));
async function ghReq(url,opt={}){let r;try{r=await fetch(url,{...opt,headers:{Authorization:"Bearer "+GH.token,Accept:"application/vnd.github+json",...(opt.headers||{})}})}catch(e){throw new Error("Could not reach GitHub. Check your connection.")}
 let j={};try{j=await r.json()}catch(e){}if(r.status===401)throw new Error("GitHub rejected the token. Create a new token and connect again.");return {r,j}}
const ghPut=(path,content,msg,sha)=>ghReq(ghPath(path),{method:"PUT",body:JSON.stringify({message:msg,content,branch:GH.branch,...(sha?{sha}:{})})});
async function loadGH(){const {r,j}=await ghReq(ghPath("movies.json")+"?ref="+GH.branch+"&t="+Date.now());
 if(!r.ok)throw new Error(r.status===404?"movies.json was not found on that branch. Check the repository name and that the site files are uploaded.":(j.message||"Could not read movies.json."));SHA=j.sha;C=JSON.parse(dec(j.content));lastUp=ups(C)}
async function saveGH(){const {r,j}=await ghPut("movies.json",enc(JSON.stringify(C,null,2)),"Update movies (admin panel)",SHA);
 if(r.status===409||r.status===422)throw new Error("The catalog was changed somewhere else. It was reloaded, so please redo your last change.");
 if(!r.ok)throw new Error(r.status===403||r.status===404?"The token can't write to this repository. It needs Contents: Read and write access.":(j.message||"Save failed."));SHA=j.content.sha;
 try{const base=location.origin+location.pathname.replace(/[^/]*$/,""),u=["",...["movies","genre","about","contact","privacy","terms","dmca"].map(p=>p+".html"),...C.genres.map(g=>"genre.html?slug="+slug(g)),...C.movies.filter(m=>m.pub).map(m=>"movie.html?slug="+m.slug)];
  const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${u.map(x=>`<url><loc>${base}${x.replace(/&/g,"&amp;")}</loc></url>`).join("\n")}\n</urlset>\n`;
  const cur=await ghReq(ghPath("sitemap.xml")+"?ref="+GH.branch);await ghPut("sitemap.xml",enc(xml),"Update sitemap",cur.r.ok?cur.j.sha:undefined)}catch(e){}
 const now=ups(C);for(const u of lastUp)if(!now.has(u)){try{const g=await ghReq(ghPath(u)+"?ref="+GH.branch);if(g.r.ok)await ghReq(ghPath(u),{method:"DELETE",body:JSON.stringify({message:"Remove unused upload",sha:g.j.sha,branch:GH.branch})})}catch(e){}}lastUp=now}
async function ghUpload(kind,file,bar,done){if(kind==="video")return toast("On GitHub, paste a link to your hosted video instead of uploading.",true);
 const ext=(file.name.match(/\.[^.]+$/)||[""])[0].toLowerCase();if(![".jpg",".jpeg",".png",".webp"].includes(ext))return toast("Posters must be JPG, PNG or WebP.",true);if(file.size>5*1048576)return toast("Posters must be under 5 MB on GitHub.",true);
 bar.hidden=false;bar.removeAttribute("value");
 try{const data=await new Promise((ok,no)=>{const fr=new FileReader();fr.onload=()=>ok(fr.result.split(",")[1]);fr.onerror=no;fr.readAsDataURL(file)});
  const name=`${Date.now().toString(36)}-${slug(file.name.replace(/\.[^.]+$/,"")).slice(0,50)||"poster"}${ext}`,{r,j}=await ghPut("uploads/posters/"+name,data,"Add poster");
  if(!r.ok)throw new Error(j.message||"Upload failed.");done("uploads/posters/"+name);toast("Poster uploaded. It shows on the site in about a minute. Remember to save the movie.")}catch(e){toast(e.message||"Upload failed.",true)}bar.hidden=true}
$("#gf").onsubmit=async e=>{e.preventDefault();$("#ge").textContent="";const repo=$("#g-repo").value.trim().replace(/^https?:\/\/github\.com\//,"").replace(/\.git$/,"").replace(/\/$/,"");
 if(!/^[\w.-]+\/[\w.-]+$/.test(repo))return $("#ge").textContent="Enter the repository as owner/name, for example myname/openreel.";
 GH={repo,token:$("#g-token").value.trim(),branch:$("#g-branch").value.trim()};
 try{const {r,j}=await ghReq("https://api.github.com/repos/"+repo);if(!r.ok)throw new Error("Repository not found, or the token can't access it.");if(j.permissions&&!j.permissions.push)throw new Error("This token can't write to the repository.");
  GH.branch=GH.branch||j.default_branch||"main";await loadGH();(($("#g-rem").checked)?localStorage:sessionStorage).setItem("or_gh",JSON.stringify(GH));$("#g-token").value="";render();view("panel")}catch(x){GH=null;$("#ge").textContent=x.message}};
/* ---- auth ---- */
$("#lf").onsubmit=async e=>{e.preventDefault();$("#le").textContent="";try{await api("/api/login",{method:"POST",body:JSON.stringify({password:$("#pw").value})});$("#pw").value="";await boot()}catch(x){$("#le").textContent=x.message}};
$("#lo").onclick=async()=>{if(MODE==="github"){sessionStorage.removeItem("or_gh");localStorage.removeItem("or_gh");GH=null}else await api("/api/logout",{method:"POST"}).catch(()=>{});view("login")};
async function boot(){let srv=false;try{const r=await fetch("/api/session",{headers:{"X-OR":"1"},credentials:"same-origin"});srv=r.status===200||r.status===401}catch(e){}
 if(srv){MODE="server";$("#lf").hidden=false;$("#gf").hidden=true;try{await api("/api/session");await load();render();view("panel")}catch(e){view("login")}return}
 MODE="github";$("#lf").hidden=true;$("#gf").hidden=false;$("#uvl").hidden=true;
 const m=location.hostname.match(/^([^.]+)\.github\.io$/);if(m&&!$("#g-repo").value){const seg=location.pathname.split("/")[1];$("#g-repo").value=m[1]+"/"+(seg&&!/\./.test(seg)?seg:m[1]+".github.io")}
 const s=ghStore();if(s){GH=s;try{await loadGH();render();view("panel")}catch(e){$("#ge").textContent=e.message;GH=null;view("login")}}else view("login")}
boot();
