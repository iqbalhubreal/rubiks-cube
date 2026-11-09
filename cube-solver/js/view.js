/* Shared state, Three.js scene construction, painting, camera and touch controls. */

// ---------- UI state ----------
const GRAY="#7b7b78";
let pz=null,puzzleId="",col=[],start=null,sel=0,sol=null,ix=0,playing=false,busy=false,speed=1.5,mode="paint",anim=false,zoom=1,view3d=false,ver=0,recording=false,stopReq=false,studioOn=false,sudokuOrientationLocked=false;
let stickers=[],cubies=[],tiles=[],sws=[],base=null;
const $=id=>document.getElementById(id),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const PLAY='<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',PAUSE='<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
const isLight=h=>{const n=parseInt(h.slice(1),16);return(.299*(n>>16)+.587*(n>>8&255)+.114*(n&255))>150};

// snackbar + dialog
let tt;
function toast(t,ms=2800){const s=$("snack");s.textContent=t;s.classList.add("on");clearTimeout(tt);if(ms)tt=setTimeout(hideToast,ms)}
function hideToast(){clearTimeout(tt);$("snack").classList.remove("on")}
function dlg(t,m){hideToast();$("dt").textContent=t;$("dm").textContent=m;$("pv").hidden=true;$("sv").hidden=true;$("scrim").classList.add("on")}
$("ok").onclick=()=>{$("pv").pause();$("scrim").classList.remove("on")};

// scene
const cv=$("cv"),renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(30,1,.1,100),cube=new THREE.Group(),pivot=new THREE.Group();
cube.add(pivot);scene.add(cube);
const bodyMat=new THREE.MeshBasicMaterial({color:0x151515}),bodyGeo=new THREE.BoxGeometry(.98,.98,.98),stGeo=new THREE.PlaneGeometry(.9,.9);
const darkMat=new THREE.MeshBasicMaterial({color:0x151515,side:THREE.DoubleSide});
function clearScene(){ver++;[...cube.children].forEach(o=>{if(o!==pivot)cube.remove(o)});[...pivot.children].forEach(o=>pivot.remove(o));cubies=[];tiles=[];stickers=[]}
const NT={};
function numTex(k){if(NT[k])return NT[k];const c=document.createElement("canvas");c.width=c.height=64;const g=c.getContext("2d");
  g.fillStyle="#fff";g.fillRect(0,0,64,64);g.fillStyle="#111";g.font="600 "+(k>9?34:42)+"px Roboto,system-ui,sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText(k,32,35);
  const t=new THREE.CanvasTexture(c);t.anisotropy=4;return NT[k]=t}
function buildCubeScene(){const by={};
  pz.st.forEach((s,i)=>{const k=s.p.join();let b=by[k];
    if(!b){b=new THREE.Mesh(bodyGeo,bodyMat);b.position.set(s.p[0],s.p[1],s.p[2]);b.userData.p=s.p;cube.add(b);cubies.push(b);by[k]=b}
    const n=s.n,m=new THREE.Mesh(stGeo,new THREE.MeshBasicMaterial(pz.sudoku?{color:0xffffff,map:numTex(1)}:{color:0xffffff}));
    m.position.set(n[0]*.495,n[1]*.495,n[2]*.495);
    if(n[2]===-1)m.rotation.y=Math.PI;else if(n[0]===1)m.rotation.y=Math.PI/2;else if(n[0]===-1)m.rotation.y=-Math.PI/2;else if(n[1]===1)m.rotation.x=-Math.PI/2;else if(n[1]===-1)m.rotation.x=Math.PI/2;
    m.userData.i=i;b.add(m);stickers[i]=m})}
// flat-sided pieces (Skewb, Pyraminx, Megaminx): each sticker is a small dark block with a coloured top
function fanGeo(pts,flat){const pos=[],idx=[],n=pts.length;pts.forEach(v=>pos.push(v[0],v[1],v[2]));
  for(let i=1;i<n-1;i++)idx.push(0,i,i+1);return{pos,idx}}
function buildPolyScene(){
  pz.st.forEach((s,i)=>{const grp=new THREE.Group();let poly=s.poly.slice();
    if(V3.dot(V3.cross(V3.sub(poly[1],poly[0]),V3.sub(poly[2],poly[0])),s.n)<0)poly.reverse();
    const n=poly.length,inner=poly.map(v=>V3.mul(v,.55)),pos=[],idx=[];
    poly.concat(inner).forEach(v=>pos.push(v[0],v[1],v[2]));
    for(let k=1;k<n-1;k++){idx.push(0,k,k+1);idx.push(n,n+k,n+k+1)}
    for(let k=0;k<n;k++){const j=(k+1)%n;idx.push(k,j,n+j,k,n+j,n+k)}
    const bg=new THREE.BufferGeometry();bg.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));bg.setIndex(idx);
    grp.add(new THREE.Mesh(bg,darkMat));
    const m=V3.mean(poly),top=poly.map(v=>V3.add(V3.add(m,V3.mul(V3.sub(v,m),.84)),V3.mul(s.n,.012))),f=fanGeo(top);
    const cg=new THREE.BufferGeometry();cg.setAttribute("position",new THREE.Float32BufferAttribute(f.pos,3));cg.setIndex(f.idx);
    const cm=new THREE.Mesh(cg,new THREE.MeshBasicMaterial({color:0xffffff}));cm.userData.i=i;grp.add(cm);
    cube.add(grp);tiles[i]=grp;stickers[i]=cm})}
function partsOf(g){return pz.kind==="cube"?cubies.filter(b=>b.userData.p[g.ai]===g.lv):g.sel.map(i=>tiles[i])}

// palette + side chips (rebuilt for each puzzle)
function buildPalette(){const pal=$("pal");pal.innerHTML="";pal.className=pz.nf>6?"many":"";sel=0;
  sws=pz.colors.map((c,i)=>{const w=document.createElement("div");w.className="sw"+(i?"":" on");
    w.innerHTML='<button aria-label="Paint '+pz.cnames[i]+'"></button><span></span>';w.firstChild.style.background=c;
    w.firstChild.onclick=()=>{sel=i;sws.forEach((x,j)=>x.classList.toggle("on",j===i))};pal.appendChild(w);return w})}
function paint(){ver++;
  if(pz.sudoku){const T=pz.tint||(pz.tint=[0,1].map(k=>pz.colors.map((c,f)=>f===0?new THREE.Color(["#ffffff","#cdd2de"][k]):f===3?new THREE.Color(["#fff7b8","#ffdd3f"][k]):f===4?new THREE.Color(c).lerp(new THREE.Color(1,1,1),[.76,.5][k]):new THREE.Color(c).lerp(new THREE.Color(1,1,1),[.84,.56][k]))));
    // colour and number travel with the sticker; the box checkerboard stays on the grid
    for(let i=0;i<col.length;i++){const o=pz.st[col[i]],mt=stickers[i].material;mt.color.copy(T[pz.par[i]][o.f]);mt.map=numTex(o.dg)}
    return}
  const cnt=Array(pz.nf).fill(0);
  col.forEach((c,i)=>{stickers[i].material.color.set(c<0?GRAY:pz.colors[c]);if(c>=0)cnt[c]++});
  sws.forEach((w,i)=>{const s=w.lastChild;s.textContent=cnt[i]+"/"+pz.per;s.className=cnt[i]>pz.per?"bad":""});}
function updateCam(){cam.position.z=7.9/Math.min(1,cam.aspect)*zoom}
function fit(){ver++;const s=$("stage"),w=s.clientWidth,h=s.clientHeight;if(!w||!h)return;
  renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();updateCam()}
new ResizeObserver(fit).observe($("stage"));
// Sudoku digits: keep each visible face's numbers upright on screen by turning them in quarter steps about the sticker's own normal
const UPC=[[0,0,-1],[0,1,0],[0,1,0],[0,0,1],[0,1,0],[0,1,0]],HP=Math.PI/2;
function orient(){if(sudokuOrientationLocked||!pz||!pz.sudoku||!stickers.length)return;const q=cube.quaternion;if(!pz.roll)pz.roll=[0,0,0,0,0,0];
  for(let f=0;f<6;f++){const nw=new THREE.Vector3(...pz.fn[f]).applyQuaternion(q);if(nw.z<.1)continue;
    const uw=new THREE.Vector3(...UPC[f]).applyQuaternion(q),want=-Math.atan2(-uw.x,uw.y);let e=want-pz.roll[f]*HP;e=Math.atan2(Math.sin(e),Math.cos(e));
    if(Math.abs(e)>.9||pz.rollNew!==ver0){pz.roll[f]+=Math.round(e/HP);const z=pz.roll[f]*HP,a=f*pz.per;for(let j=0;j<pz.per;j++)stickers[a+j].rotation.z=z}}
  pz.rollNew=ver0}
let ver0=0;
let lastSig="";
(function loop(){if(recording||studioOn)rig();const q=cube.quaternion,p=pivot.quaternion,sig=[q.x,q.y,q.z,q.w,p.x,p.y,p.z,p.w,cam.position.z,cube.scale.x,ver].join();
  if(sig!==lastSig||recording||studioOn){lastSig=sig;orient();renderer.render(scene,cam);if(studioOn)renderStudio();if(recording)drawFrame()}
  requestAnimationFrame(loop)})();

// orientation helpers
const V={x:new THREE.Vector3(1,0,0),y:new THREE.Vector3(0,1,0)},Qa=(a,r)=>new THREE.Quaternion().setFromAxisAngle(V[a],r);
base=new THREE.Quaternion();
const FQ=[Qa("x",Math.PI/2),Qa("y",-Math.PI/2),new THREE.Quaternion(),Qa("x",-Math.PI/2),Qa("y",Math.PI/2),Qa("y",Math.PI)];
function faceQ(f){const n=new THREE.Vector3(...pz.fn[f]),h=new THREE.Vector3(0,1,0);if(Math.abs(n.y)>.99)h.set(0,0,-1);
  const x=new THREE.Vector3().crossVectors(h,n).normalize(),y=new THREE.Vector3().crossVectors(n,x);
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,y,n)).invert()}
const home=()=>pz.snap?new THREE.Quaternion():faceQ(pz.home);
function snap(q){const m=new THREE.Matrix4().makeRotationFromQuaternion(q);m.elements=m.elements.map(Math.round);return new THREE.Quaternion().setFromRotationMatrix(m)}
function tween(ms,fn){return new Promise(res=>{anim=true;const t0=performance.now();(function f(now){const t=Math.min(1,(now-t0)/ms);fn(t*t*(3-2*t));if(t<1)requestAnimationFrame(f);else{anim=false;res()}})(t0)})}
function goTo(q2,z2){const q1=cube.quaternion.clone(),z1=zoom;return tween(480,e=>{cube.quaternion.copy(q1).slerp(q2,e);zoom=z1+(z2-z1)*e;updateCam()})}
function curFace(){const q=pz.snap&&!view3d?base:cube.quaternion;let b=0,bz=-2;
  for(let f=0;f<pz.nf;f++){const v=new THREE.Vector3(...pz.fn[f]).applyQuaternion(q);if(v.z>bz){bz=v.z;b=f}}return b}
function sync(){if(mode!=="paint")return;
  if(view3d){$("cap").textContent="3D view · drag to rotate · tap to paint";return}
  const f=curFace();
  const ci=pz.centre(f),cc=ci>=0?col[ci]:null;
  $("cap").textContent=pz.fname[f]+" side"+(cc!==null?" · "+(cc<0?"unpainted":pz.cnames[cc])+" centre":"")+" · "+pz.swipe}

// gestures: tap paints; swipe turns a cube (snaps to a side) or rotates the other puzzles freely
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),ptr=new Map();let drag=null;
function pickAt(x,y){if(pz.sudoku)return;
  const r=cv.getBoundingClientRect();ndc.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);ray.setFromCamera(ndc,cam);
  const h=ray.intersectObjects(stickers,false)[0];if(!h)return;const i=h.object.userData.i;
  if(!pz.snap&&!view3d){const f=pz.st[i].f;if(f!==curFace()){if(!anim&&!busy)goTo(faceQ(f),1).then(sync);return}}
  col[i]=sel;pz.hist=null;paint();sync()}
cv.addEventListener("pointerdown",e=>{ptr.set(e.pointerId,{x0:e.clientX,y0:e.clientY,x:e.clientX,y:e.clientY,mv:0});cv.setPointerCapture(e.pointerId)});
cv.addEventListener("pointermove",e=>{const p=ptr.get(e.pointerId);if(!p)return;
  const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;p.mv=Math.max(p.mv,Math.hypot(p.x-p.x0,p.y-p.y0));
  if(mode==="solve"||view3d){if(anim||recording)return;cube.quaternion.premultiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(dy*.008,dx*.008,0)));return}
  if(!pz.snap)return;
  if(anim||busy)return;
  if(!drag&&p.mv>10&&![...ptr.values()].some(q=>q!==p&&q.drag)){const h=Math.abs(p.x-p.x0)>Math.abs(p.y-p.y0);p.drag=true;drag={id:e.pointerId,ax:h?"y":"x",o:h?p.x:p.y,ang:0}}
  if(drag&&drag.id===e.pointerId){const raw=(drag.ax==="y"?p.x:p.y)-drag.o;drag.ang=Math.max(-Math.PI/2,Math.min(Math.PI/2,raw*Math.PI/2/170));
    cube.quaternion.copy(Qa(drag.ax,drag.ang)).multiply(base)}});
// non-cube puzzles: a swipe in paint mode flips to the neighbouring side, shown face-on like the cube
async function swipeFace(dx,dy){const cur=curFace(),q=cube.quaternion,L=Math.hypot(dx,dy),d=new THREE.Vector3(-dx/L,dy/L,0);
  const nc=new THREE.Vector3(...pz.fn[cur]).applyQuaternion(q);let best=-1,bs=-2;
  for(let g=0;g<pz.nf;g++){if(g===cur)continue;const v=new THREE.Vector3(...pz.fn[g]).applyQuaternion(q);
    if(v.dot(d)<.2)continue;const sc=v.dot(nc);if(sc>bs){bs=sc;best=g}}
  if(best<0)return;await goTo(faceQ(best),1);sync()}
async function endPtr(e,cancel){const p=ptr.get(e.pointerId);ptr.delete(e.pointerId);if(!p||mode!=="paint")return;
  if(view3d){if(!cancel&&p.mv<10&&!anim&&!busy)pickAt(p.x0,p.y0);return}
  if(!pz.snap){if(cancel||anim||busy)return;if(p.mv<10)pickAt(p.x0,p.y0);else if(p.mv>=24)swipeFace(p.x-p.x0,p.y-p.y0);return}
  if(drag&&drag.id===e.pointerId){const d=drag;drag=null;const to=Math.abs(d.ang)>.4?Math.sign(d.ang)*Math.PI/2:0;
    await tween(220,t=>{cube.quaternion.copy(Qa(d.ax,d.ang+(to-d.ang)*t)).multiply(base)});
    base=snap(Qa(d.ax,to).multiply(base));cube.quaternion.copy(base);sync()}
  else if(!cancel&&p.mv<10&&!anim&&!busy)pickAt(p.x0,p.y0)}
cv.addEventListener("pointerup",e=>endPtr(e,false));cv.addEventListener("pointercancel",e=>endPtr(e,true));

$("d3").onclick=async()=>{if(anim||busy||mode!=="paint")return;const b=$("d3");
  if(!view3d){view3d=true;set3dUI();sync();await goTo(Q3(),pz.iso)}
  else{const f=curFace();view3d=false;set3dUI();
    const t=pz.snap?snap(FQ[f]):faceQ(f);await goTo(t,1);if(pz.snap)base=t;sync()}};
