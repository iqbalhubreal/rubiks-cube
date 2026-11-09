/* Puzzle definitions, move permutations, search helpers and solver adapters. */

//CORE
// ---------- vector helpers ----------
const V3={
  add:(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],
  sub:(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],
  mul:(a,s)=>[a[0]*s,a[1]*s,a[2]*s],
  dot:(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],
  cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
  len:a=>Math.hypot(a[0],a[1],a[2]),
  unit:a=>{const l=Math.hypot(a[0],a[1],a[2]);return[a[0]/l,a[1]/l,a[2]/l]},
  mean:l=>{const s=[0,0,0];l.forEach(v=>{s[0]+=v[0];s[1]+=v[1];s[2]+=v[2]});return V3.mul(s,1/l.length)}
};
function rotv(v,k,th){const c=Math.cos(th),s=Math.sin(th),d=V3.dot(k,v)*(1-c),x=V3.cross(k,v);
  return[v[0]*c+x[0]*s+k[0]*d,v[1]*c+x[1]*s+k[1]*d,v[2]*c+x[2]*s+k[2]*d]}

// ---------- shared constants ----------
const FACES="URFDLB",AXI={U:[1,1],D:[1,-1],R:[0,1],L:[0,-1],F:[2,1],B:[2,-1]};
const FN={U:"Top",D:"Bottom",R:"Right",L:"Left",F:"Front",B:"Back"};
const COL6=["#f4f4f0","#d7263d","#27a844","#ffd400","#ff8a1f","#2563eb"],NM6=["white","red","green","yellow","orange","blue"];
const faceVec=f=>{const[i,s]=AXI[f],v=[0,0,0];v[i]=s;return v};
const normA=(a,o)=>{a=((a%o)+o)%o;if(a>o/2)a-=o;return a};
const eq=(a,b)=>{for(let i=0;i<a.length;i++)if(a[i]!==b[i])return false;return true};
const bad=["Impossible puzzle","This colouring can’t exist on a real puzzle (for example a twisted corner, a flipped edge or two swapped pieces). Check your colours."];

// ---------- moves ----------
// a move is {g: generator index, a: signed number of steps, t: label}
function mv(pz,g,a){const o=pz.gens[g].order;a=normA(a,o);return{g,a,t:pz.gens[g].name+(a===1?"":a===-1?"'":a===2?"2":"2'")}}
const inv=(pz,m)=>mv(pz,m.g,-m.a);
function turn(pz,c,m){const g=pz.gens[m.g],P=g.pows[((m.a%g.order)+g.order)%g.order],o=c.slice();for(let i=0;i<c.length;i++)c[P[i]]=o[i]}
// builds every move's sticker permutation from geometry: stickers in g.sel rotate clockwise (seen from outside) about g.ax
function finish(pz){const st=pz.st;pz.ns=st.length;pz.solved=st.map(s=>s.f);pz.per=pz.ns/pz.nf;
  const hk=c=>Math.round(c[0]*2)+","+Math.round(c[1]*2)+","+Math.round(c[2]*2),hash=pz.kind==="cube"?new Map(st.map((x,j)=>[hk(x.c),j])):null;
  pz.gens.forEach(g=>{const th=-2*Math.PI/g.order,perm=st.map((_,i)=>i),S=new Set(g.sel),used=new Set();
    g.sel.forEach(i=>{const t=rotv(st[i].c,g.ax,th);let b=-1,bd=1e9;
      if(hash){const j=hash.get(hk(t));if(j!==undefined){b=j;bd=0}}
      else for(let j=0;j<st.length;j++){const d=V3.len(V3.sub(st[j].c,t));if(d<bd){bd=d;b=j}}
      if(bd>1e-6||!S.has(b)||used.has(b))throw new Error(pz.id+": move "+g.name+" is inconsistent");
      used.add(b);perm[i]=b});
    g.perm=perm;g.pows=[st.map((_,i)=>i)];for(let k=1;k<g.order;k++)g.pows.push(g.pows[k-1].map(x=>perm[x]))});
  return pz}
function mlistOf(pz,gi,as){const L=[];
  gi.forEach(g=>as.forEach(a=>{const o=pz.gens[g].order;L.push({g,a:normA(a,o),P:pz.gens[g].pows[((a%o)+o)%o]})}));
  L.forEach(M=>{const o=pz.gens[M.g].order;M.i=L.findIndex(x=>x.g===M.g&&x.a===normA(-M.a,o))});return L}

// ---------- bidirectional search (forward table from solved + backward search from the puzzle) ----------
const defKey=s=>String.fromCharCode.apply(null,s);
function ap(s,P){const o=s.slice();for(let i=0;i<s.length;i++)o[P[i]]=s[i];return o}
function fwd(pz){if(pz.F)return pz.F;
  const key=pz.keyOf||defKey,L=pz.mlist,F=new Map();let fr=[pz.solved.slice()],lg=[-1];F.set(key(fr[0]),null);
  for(let d=0;d<pz.df;d++){const nf=[],ng=[];
    for(let q=0;q<fr.length;q++){const s=fr[q],pk=key(s);
      for(let mi=0;mi<L.length;mi++){const M=L[mi];if(M.g===lg[q])continue;
        const t=ap(s,M.P),k=key(t);if(F.has(k))continue;F.set(k,[mi,pk]);nf.push(t);ng.push(M.g)}}
    fr=nf;lg=ng}
  return pz.F=F}
function bwd(pz,start){const F=fwd(pz),key=pz.keyOf||defKey,L=pz.mlist;
  let fr=[start],lg=[-1],ph=[[]];const seen=new Set([key(start)]);
  for(let d=0;d<=pz.db;d++){
    for(let q=0;q<fr.length;q++){const k=key(fr[q]);
      if(F.has(k)){const out=ph[q].map(mi=>L[mi]);let e=F.get(k),kk=k;
        while(e){out.push(L[L[e[0]].i]);kk=e[1];e=F.get(kk)}
        return out.map(M=>mv(pz,M.g,M.a))}}
    if(d===pz.db)break;
    const nf=[],ng=[],np=[];
    for(let q=0;q<fr.length;q++){const s=fr[q];
      for(let mi=0;mi<L.length;mi++){const M=L[mi];if(M.g===lg[q])continue;
        const t=ap(s,M.P),k=key(t);if(seen.has(k))continue;seen.add(k);nf.push(t);ng.push(M.g);np.push(ph[q].concat(mi))}}
    fr=nf;lg=ng;ph=np}
  return null}
function check(pz,norm,mvs){const s=norm.slice();mvs.forEach(m=>turn(pz,s,m));return eq(s,pz.solved)}

// ---------- cube-shaped puzzles (2x2, 3x3) ----------
function cubeFp(h){const g=c=>c-h;
  return{U:(r,c)=>[g(c),h,g(r)],R:(r,c)=>[h,-g(r),-g(c)],F:(r,c)=>[g(c),-g(r),h],D:(r,c)=>[g(c),-h,-g(r)],L:(r,c)=>[-h,-g(r),g(c)],B:(r,c)=>[-g(c),-g(r),-h]}}
function cornersOf(pz){const m=new Map();
  pz.st.forEach((s,i)=>{if(!s.c.every(x=>Math.abs(x)>.3))return;const k=s.c.map(Math.sign).join();if(!m.has(k))m.set(k,[]);m.get(k).push(i)});
  pz.corners=[...m.values()];pz.q=[...m.keys()].indexOf("-1,-1,-1")}
// puzzles with no fixed centres: the corner at (-,-,-) never moves, so its colours define the frame
function cornerSolve(pz,col){
  const nc=pz.nf,adj=Array.from({length:nc},()=>new Set());
  pz.corners.forEach(gp=>{const cs=gp.map(i=>col[i]);cs.forEach(a=>cs.forEach(b=>{if(a!==b)adj[a].add(b)}))});
  const fo=Array(nc).fill(-1),qg=pz.corners[pz.q];
  for(const i of qg){const c=col[i];if(fo[c]!==-1)return{err:bad};fo[c]=pz.st[i].f}
  for(const i of qg){const a=col[i],o=[];for(let x=0;x<nc;x++)if(x!==a&&!adj[a].has(x))o.push(x);
    if(o.length!==1||fo[o[0]]!==-1)return{err:bad};fo[o[0]]=(pz.st[i].f+3)%6}
  const norm=col.map(c=>fo[c]);
  if(eq(norm,pz.solved))return{moves:[]};
  const r=bwd(pz,norm);
  return r&&check(pz,norm,r)?{moves:r}:{err:bad}}
function buildCube(n){
  const h=(n-1)/2,fp=cubeFp(h),st=[];
  [...FACES].forEach((f,fi)=>{const nn=faceVec(f);
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){const p=fp[f](r,c);st.push({f:fi,p,n:nn,c:[p[0]+nn[0]/2,p[1]+nn[1]/2,p[2]+nn[2]/2]})}});
  const gens=[...FACES].map(f=>{const[ai,sg]=AXI[f];
    return{name:f,label:FN[f]+" side",ax:faceVec(f),order:4,ai,sg,lv:sg*h,sel:st.map((s,i)=>s.p[ai]===sg*h?i:-1).filter(i=>i>=0)}});
  // bigger cubes also get inner slice turns (layer 2, 3 … counted from the top, right and front)
  if(n>=4)[0,1,2].forEach(fi=>{const f=FACES[fi],[ai,sg]=AXI[f];
    for(let d=1;d<n-1;d++){const lv=sg*(h-d);
      gens.push({name:(d+1)+f,label:"Layer "+(d+1)+" from "+FN[f].toLowerCase(),ax:faceVec(f),order:4,ai,sg,lv,sel:st.map((s,i)=>s.p[ai]===lv?i:-1).filter(i=>i>=0)})}});
  const pz={id:n+"x"+n,kind:"cube",n,h,nf:6,st,gens,snap:true,fixedCentres:n===3,colors:COL6,cnames:NM6,
    fname:[...FACES].map(f=>FN[f]),chip:[...FACES],fn:[...FACES].map(faceVec),centre:f=>n===3?f*9+4:-1,
    scale:3/n,iso:1.45,home:0,swipe:"swipe to turn the cube",file:"rubiks-cube-solve",
    rpool:gens.map((_,i)=>i),ra:[1,2,-1],rn:n===2?14:n===3?22:Math.min(40,16+n)};
  finish(pz);
  if(n===2){cornersOf(pz);pz.mlist=mlistOf(pz,[0,1,2],[1,2,-1]);pz.df=6;pz.db=5;pz.solve=function(c){return cornerSolve(this,c)};
    pz.hint="Tap a colour, then tap squares to paint. Swipe to turn to the next side."}
  else if(n>3)pz.hint="Paint squares or tap Random. Solve works on Random scrambles at this size.";
  else pz.hint="Tap a colour, then tap squares to paint. Swipe to turn to the next side.";
  return pz}

// ---------- Sudoku cube: 9x9x9, every face is a complete 9x9 Sudoku when solved ----------
// the state holds each sticker's identity (not a colour), so the digits travel with the stickers
const SUDB={6:[2,3],9:[3,3],12:[3,4],16:[4,4],25:[5,5]};   // box height x width
function buildSudoku(n){
  const [br,bc]=SUDB[n],p=buildCube(n),per=n*n;
  p.id="sudoku";p.sudoku=true;p.rn=Math.min(40,12+2*n);p.file="sudoku-cube-solve";p.box=[br,bc];
  const perm=[];for(let f=0;f<6;f++){const a=[...Array(n).keys()];
    if(f){let x=f*7919+n;for(let i=n-1;i>0;i--){x=x*48271%2147483647;const j=x%(i+1);[a[i],a[j]]=[a[j],a[i]]}}perm.push(a)}
  p.par=new Uint8Array(p.st.length);
  p.st.forEach((s,i)=>{const f=Math.floor(i/per),r=Math.floor(i%per/n),c=i%n,v=(bc*(r%br)+Math.floor(r/br)+c)%n;
    s.dg=perm[f][v]+1;p.par[i]=(Math.floor(r/br)+Math.floor(c/bc))&1});
  p.solved=p.st.map((_,i)=>i);
  p.hint="Each face is a "+n+"×"+n+" Sudoku grid. Tap Random to scramble, Solve to put it right.";
  return p}

// ---------- 3x3 validity (used with the cubejs solver) ----------
const CF=[[8,9,20],[6,18,38],[0,36,47],[2,45,11],[29,26,15],[27,44,24],[33,53,42],[35,17,51]];
const EF=[[5,10],[7,19],[3,37],[1,46],[32,16],[28,25],[30,43],[34,52],[23,12],[21,41],[50,39],[48,14]];
const ud=v=>v===0||v===3;
function valid(c,S){
  const rc=CF.map(t=>t.map(i=>S[i])),re=EF.map(t=>t.map(i=>S[i]));
  let seen=new Set(),os=0,cp=[],ep=[];
  for(const t of CF){const x=t.map(i=>c[i]),o=x.findIndex(ud);if(o<0)return false;
    const y=[x[o],x[(o+1)%3],x[(o+2)%3]];
    const k=rc.findIndex(r=>{const j=r.findIndex(ud);return r[j]===y[0]&&r[(j+1)%3]===y[1]&&r[(j+2)%3]===y[2]});
    if(k<0||seen.has(k))return false;seen.add(k);os+=o;cp.push(k)}
  if(os%3)return false;
  seen=new Set();let es=0;
  for(const t of EF){const x=t.map(i=>c[i]);let k=-1,fl=0;
    re.forEach((r,j)=>{if(r[0]===x[0]&&r[1]===x[1]){k=j;fl=0}else if(r[0]===x[1]&&r[1]===x[0]){k=j;fl=1}});
    if(k<0||seen.has(k))return false;seen.add(k);es+=fl;ep.push(k)}
  if(es%2)return false;
  const par=a=>{let p=0;for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)if(a[i]>a[j])p++;return p%2};
  return par(cp)===par(ep)}

// ---------- Skewb ----------
function buildSkewb(){
  const fp=cubeFp(1),st=[];
  [...FACES].forEach((f,fi)=>{const nn=faceVec(f),q=fp[f];
    const C=[q(0,0),q(0,2),q(2,2),q(2,0)],M=[q(0,1),q(1,2),q(2,1),q(1,0)];
    st.push({f:fi,n:nn,poly:M,c:V3.mean(M)});
    for(let k=0;k<4;k++){const poly=[C[k],M[k],M[(k+3)%4]];st.push({f:fi,n:nn,poly,c:V3.mean(poly)})}});
  const axes=[[1,1,1],[-1,1,1],[1,-1,1],[1,1,-1]],nm=["U","L","R","B"],lb=["Top-right-front corner","Top-left-front corner","Bottom-right-front corner","Top-right-back corner"];
  const gens=axes.map((a,i)=>{const ax=V3.unit(a);return{name:nm[i],label:lb[i],ax,order:3,sel:st.map((s,j)=>V3.dot(s.c,ax)>0?j:-1).filter(j=>j>=0)}});
  const pz={id:"skewb",kind:"poly",nf:6,st,gens,snap:false,fixedCentres:false,colors:COL6,cnames:NM6,
    fname:[...FACES].map(f=>FN[f]),chip:[...FACES],fn:[...FACES].map(faceVec),centre:f=>f*5,
    scale:1.5,iso:1.45,home:2,swipe:"swipe to change side",file:"skewb-solve",rpool:[0,1,2,3],ra:[1,-1],rn:25,
    hint:"Tap a colour, then pieces to paint. Swipe or tap a side to bring it forward."};
  finish(pz);cornersOf(pz);pz.mlist=mlistOf(pz,[0,1,2,3],[1,-1]);pz.df=6;pz.db=5;
  pz.solve=function(c){return cornerSolve(this,c)};
  return pz}

// ---------- Pyraminx ----------
const PERM4=(()=>{const o=[];(function f(a,r){if(!r.length){o.push(a);return}r.forEach((x,i)=>f(a.concat(x),r.filter((_,j)=>j!==i)))})([],[0,1,2,3]);return o})();
function buildPyra(){
  const r=Math.sqrt(8)/3,y=-1/3,s3=Math.sqrt(3)/2;
  const VV=[[0,1,0],[-r*s3,y,r/2],[r*s3,y,r/2],[0,y,-r]],vn=["U","L","R","B"],vl=["Top","Left","Right","Back"];
  const faces=[[0,1,2],[0,3,1],[0,2,3],[1,3,2]],opp=[3,2,1,0],st=[];
  faces.forEach((fv,f)=>{const[X0,X1,X2]=fv.map(i=>VV[i]),n=V3.unit(V3.mul(VV[opp[f]],-1));
    const pt=(a,b)=>V3.add(X0,V3.add(V3.mul(V3.sub(X1,X0),a/3),V3.mul(V3.sub(X2,X0),b/3)));
    for(let a=0;a<3;a++)for(let b=0;b<3-a;b++){const poly=[pt(a,b),pt(a+1,b),pt(a,b+1)];st.push({f,n,poly,c:V3.mean(poly)})}
    for(let a=0;a<2;a++)for(let b=0;b<2-a;b++){const poly=[pt(a+1,b),pt(a+1,b+1),pt(a,b+1)];st.push({f,n,poly,c:V3.mean(poly)})}});
  const sel=(v,t)=>st.map((s,j)=>V3.dot(s.c,VV[v])>t?j:-1).filter(j=>j>=0);
  const gens=[];
  VV.forEach((v,i)=>gens.push({name:vn[i],label:vl[i]+" corner",ax:v,order:3,sel:sel(i,1/9)}));
  VV.forEach((v,i)=>gens.push({name:vn[i].toLowerCase(),label:vl[i]+" tip",ax:v,order:3,sel:sel(i,5/9)}));
  const pz={id:"pyra",kind:"poly",nf:4,st,gens,snap:false,fixedCentres:false,colors:["#27a844","#d7263d","#2563eb","#ffd400"],cnames:["green","red","blue","yellow"],
    fname:["Front","Left","Right","Bottom"],chip:["F","L","R","D"],fn:faces.map((_,f)=>V3.unit(V3.mul(VV[opp[f]],-1))),centre:()=>-1,
    scale:2,iso:1.15,home:0,swipe:"swipe to change side",file:"pyraminx-solve",rpool:[0,1,2,3,4,5,6,7],ra:[1,-1],rn:20,
    hint:"Tap a colour, then triangles to paint. Swipe or tap a side to bring it forward."};
  finish(pz);
  pz.tipSt=[0,1,2,3].map(v=>gens[4+v].sel);
  const tipAll=new Set(pz.tipSt.flat());pz.core=st.map((_,i)=>i).filter(i=>!tipAll.has(i));
  pz.keyOf=s=>String.fromCharCode.apply(null,pz.core.map(i=>s[i]));
  pz.mlist=mlistOf(pz,[0,1,2,3],[1,-1]);pz.df=6;pz.db=5;
  pz.solve=function(col){let best=null;
    for(const p of PERM4){const norm=col.map(c=>p[c]);const r=bwd(this,norm);if(!r)continue;
      const s=norm.slice();r.forEach(m=>turn(this,s,m));
      const tm=[];
      for(let v=0;v<4;v++){const ts=this.tipSt[v],t=s.slice();let found=-1;
        for(let k=0;k<3;k++){if(ts.every(i=>t[i]===this.st[i].f)){found=k;break}turn(this,t,{g:4+v,a:1})}
        if(found<0)return{err:bad};
        if(found===1)tm.push(mv(this,4+v,1));else if(found===2)tm.push(mv(this,4+v,-1))}
      const all=r.concat(tm);if(!best||all.length<best.length)best=all}
    if(!best)return{err:bad};
    return{moves:best}};
  return pz}

// ---------- Megaminx ----------
const COLM=["#f4f4f0","#ffd400","#d7263d","#ff8a1f","#27a844","#2563eb","#8e44ad","#ff7eb6","#9be564","#5ec8f2","#d9c79a","#8a5a3b"];
const NMM=["white","yellow","red","orange","green","blue","purple","pink","lime","sky blue","beige","brown"];
function buildMega(){
  const ph=(1+Math.sqrt(5))/2,ip=1/ph,K=.46,T=.3;
  const n0=V3.unit([0,1,ph]),ax=V3.unit(V3.cross(n0,[0,1,0])),an=Math.acos(V3.dot(n0,[0,1,0])),R=v=>rotv(v,ax,an);
  const nr=[];[-1,1].forEach(a=>[-1,1].forEach(b=>{nr.push([0,a,b*ph],[a,b*ph,0],[b*ph,0,a])}));
  const dv=[];for(const x of[-1,1])for(const y of[-1,1])for(const z of[-1,1])dv.push([x,y,z]);
  for(const a of[-1,1])for(const b of[-1,1])dv.push([0,a*ph,b*ip],[a*ip,0,b*ph],[a*ph,b*ip,0]);
  const N=nr.map(v=>R(V3.unit(v))),DV=dv.map(R),idx=N.map((_,i)=>i),az=n=>Math.atan2(n[0],n[2]);
  const top=idx.find(i=>N[i][1]>.99),bot=idx.find(i=>N[i][1]<-.99);
  const up=idx.filter(i=>N[i][1]>.1&&N[i][1]<.99).sort((a,b)=>az(N[a])-az(N[b])),lo=idx.filter(i=>N[i][1]<-.1&&N[i][1]>-.99).sort((a,b)=>az(N[a])-az(N[b]));
  const order=[top,bot,...up,...lo],st=[],fn=[];
  order.forEach((ni,f)=>{const n=N[ni];fn.push(n);
    const m=Math.max(...DV.map(v=>V3.dot(v,n))),vs=DV.filter(v=>V3.dot(v,n)>m-1e-6),c=V3.mean(vs),u=V3.unit(V3.sub(vs[0],c)),w=V3.cross(n,u);
    const ang=v=>Math.atan2(V3.dot(V3.sub(v,c),w),V3.dot(V3.sub(v,c),u));vs.sort((a,b)=>ang(a)-ang(b));
    const wv=vs.map(v=>V3.add(c,V3.mul(V3.sub(v,c),K))),
      pp=vs.map((v,i)=>V3.add(v,V3.mul(V3.sub(vs[(i+1)%5],v),T))),qq=vs.map((v,i)=>V3.sub(vs[(i+1)%5],V3.mul(V3.sub(vs[(i+1)%5],v),T)));
    const add=poly=>st.push({f,n,poly,c:V3.mean(poly)});
    add(wv);
    for(let i=0;i<5;i++)add([vs[i],pp[i],wv[i],qq[(i+4)%5]]);
    for(let i=0;i<5;i++)add([pp[i],qq[i],wv[(i+1)%5],wv[i]])});
  const fname=["Top","Bottom",...[1,2,3,4,5].map(i=>"Upper "+i),...[1,2,3,4,5].map(i=>"Lower "+i)],chip=["T","B","1","2","3","4","5","6","7","8","9","10"];
  const gens=order.map((_,f)=>{const n=fn[f],d=st.map((s,i)=>({i,v:V3.dot(s.c,n)})).sort((a,b)=>b.v-a.v);
    if(d[25].v-d[26].v<.02)throw new Error("megaminx layer cut is ambiguous");
    return{name:chip[f],label:fname[f]+" side",ax:n,order:5,sel:d.slice(0,26).map(x=>x.i)}});
  const pz={id:"mega",kind:"poly",nf:12,st,gens,snap:false,fixedCentres:true,colors:COLM,cnames:NMM,fname,chip,fn,centre:f=>f*11,
    scale:1.04,iso:1.1,home:0,swipe:"swipe to change side",file:"megaminx-solve",rpool:gens.map((_,i)=>i),ra:[1,-1,2,-2],rn:30,hist:[],
    hint:"Tap a side to bring it forward, then paint. Or tap Random, then Solve."};
  finish(pz);
  pz.mlist=mlistOf(pz,gens.map((_,i)=>i),[1,-1,2,-2]);pz.df=3;pz.db=3;
  pz.solve=function(col){const nm=[];for(let f=0;f<12;f++)nm[col[f*11]]=f;const norm=col.map(c=>nm[c]);
    if(eq(norm,this.solved))return{moves:[]};
    if(this.hist){const r=this.hist.slice().reverse().map(m=>inv(this,m));if(check(this,norm,r))return{moves:r}}
    const r=bwd(this,norm);
    if(r&&check(this,norm,r))return{moves:r};
    return{err:["Too scrambled to solve","A Megaminx can only be solved here if it came from the Random button, or is within about 6 turns of solved."]}};
  return pz}
let cubeN=3,sudokuN=9;
const BUILD={cube:()=>buildCube(cubeN),sudoku:()=>buildSudoku(sudokuN),pyra:buildPyra,skewb:buildSkewb,mega:buildMega};
//ENDCORE

// ---------- 3x3 solver (cubejs) ----------
function attach3(p){
  p.libMissing=()=>typeof Cube==="undefined"||!Cube.initSolver;
  p.prep=()=>Cube.initSolver();
  p.solve=function(col){
    const nm=[];[0,1,2,3,4,5].forEach(f=>nm[col[f*9+4]]=f);const norm=col.map(c=>nm[c]);
    if(!valid(norm,this.solved))return{err:["Impossible cube","This colouring can’t exist on a real cube (for example a twisted corner, a flipped edge or two swapped pieces). Check your colours."]};
    if(eq(norm,this.solved))return{moves:[]};
    let s;try{s=Cube.fromString(norm.map(c=>FACES[c]).join("")).solve()}catch(e){s=null}
    if(!s)return{err:["No solution found","Check that your colours match a real cube and try again."]};
    const mvs=s.trim().split(/\s+/).filter(Boolean).map(t=>{const m=mv(this,FACES.indexOf(t[0]),t[1]==="2"?2:t[1]==="'"?-1:1);m.t=t;return m});
    return check(this,norm,mvs)?{moves:mvs}:{err:["Something went wrong","The solution didn’t check out. Please try again."]}}}

// cubes bigger than 3x3x3: no general solver, so Solve replays the Random scramble backwards
function attachBig(p){p.solve=function(col){
  if(this.hist){const r=this.hist.slice().reverse().map(m=>inv(this,m));if(check(this,col,r))return{moves:r}}
  return{err:["Can’t solve this one","Cubes bigger than 3×3×3 can only be solved here when they came from the Random button, with no stickers repainted."]}}}
