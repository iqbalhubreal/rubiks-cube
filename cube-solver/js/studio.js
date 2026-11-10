/* Studio environment, presentation camera, recording and video export workflow. */

// ---------- studio: a styled room with a round table; the puzzle floats above it ----------
const sc=$("sc"),r2=new THREE.WebGLRenderer({canvas:sc,antialias:true,preserveDrawingBuffer:true}),cam2=new THREE.PerspectiveCamera(30,1,.1,200),ST=new THREE.Group(),room=new THREE.Group(),WD=36;
r2.setClearColor(0x0a0f1c);ST.visible=false;ST.add(room);scene.add(ST);
const std=o=>new THREE.MeshStandardMaterial(o);
function ctex(w,h,f,rx,ry){const c=document.createElement("canvas");c.width=w;c.height=h;f(c.getContext("2d"),w,h);const t=new THREE.CanvasTexture(c);t.anisotropy=4;if(rx){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry)}return t}
function bx(w,h,d,c,x,y,z,p,o){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),std(Object.assign({color:c,roughness:.7},o)));m.position.set(x,y,z);p.add(m);return m}
function cyl(rt,rb,h,c,x,y,z,p,o){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,40),std(Object.assign({color:c,roughness:.6},o)));m.position.set(x,y,z);p.add(m);return m}
// floor, rug, walls (one group per wall so decor is placed in wall-local coordinates), ceiling
const floor=new THREE.Mesh(new THREE.PlaneGeometry(120,120),std({roughness:.55,map:ctex(512,512,(g,w,h)=>{for(let i=0;i<8;i++){g.fillStyle=["#b98b5e","#aa7c52","#c19566","#a37550"][i%4];g.fillRect(0,i*h/8,w,h/8-2);g.fillStyle="rgba(0,0,0,.25)";g.fillRect(0,i*h/8+h/8-2,w,2);for(let k=0;k<6;k++){g.fillStyle="rgba(0,0,0,.06)";g.fillRect((k*97+i*53)%w,i*h/8+6,70,2)}}},12,12)}));
floor.rotation.x=-Math.PI/2;floor.position.y=-6;room.add(floor);
const rug=new THREE.Mesh(new THREE.CircleGeometry(10,64),std({roughness:1,map:ctex(256,256,(g,w,h)=>{["#7d3b3a","#e9e2d3","#2f5568","#e9e2d3","#c9a45c"].forEach((c,i)=>{g.fillStyle=c;g.beginPath();g.arc(w/2,h/2,w/2*(1-i*.17),0,7);g.fill()})})}));
rug.rotation.x=-Math.PI/2;rug.position.y=-5.98;room.add(rug);
const ceil=new THREE.Mesh(new THREE.PlaneGeometry(120,120),std({color:"#f1ebe0",roughness:1}));ceil.rotation.x=Math.PI/2;ceil.position.y=12;room.add(ceil);
const wt=ctex(1024,512,(g,w,h)=>{const q=g.createLinearGradient(0,0,0,h);q.addColorStop(0,"#2f5568");q.addColorStop(1,"#3a6578");g.fillStyle=q;g.fillRect(0,0,w,h);const wy=h*.62;g.fillStyle="#e9e2d3";g.fillRect(0,wy,w,h-wy);g.fillStyle="rgba(0,0,0,.12)";for(let x=0;x<w;x+=128)g.fillRect(x,wy+10,3,h);g.fillStyle="#f6f1e6";g.fillRect(0,wy-8,w,10);g.fillStyle="#d8cfbc";g.fillRect(0,h-26,w,26)});
const W=[0,1,2,3].map(k=>{const g=new THREE.Group(),a=k*Math.PI/2;g.position.set(-Math.sin(a)*WD,0,-Math.cos(a)*WD);g.rotation.y=a;room.add(g);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(WD*2,18),std({map:wt,roughness:.9}));m.position.y=3;g.add(m);return g});
// big window on the back wall
const sky=ctex(256,256,(g,w,h)=>{const q=g.createLinearGradient(0,0,0,h);q.addColorStop(0,"#bfe3ff");q.addColorStop(.7,"#fff3d6");q.addColorStop(1,"#ffd9a0");g.fillStyle=q;g.fillRect(0,0,w,h);g.fillStyle="rgba(255,255,255,.75)";[[60,70,38],[150,52,28],[196,104,34],[110,120,24]].forEach(c=>{g.beginPath();g.arc(c[0],c[1],c[2],0,7);g.fill()})});
const pane=new THREE.Mesh(new THREE.PlaneGeometry(11,9),new THREE.MeshBasicMaterial({map:sky}));pane.position.set(0,4,.06);W[0].add(pane);
[[11.8,.5,.6,0,8.75],[12.4,.5,.9,0,-.75],[.25,9,.3,0,4],[11,.25,.3,0,4]].forEach(a=>bx(a[0],a[1],a[2],"#f6f1e6",a[3],a[4],.25,W[0]));
[-5.75,5.75].forEach(x=>bx(.5,9.5,.6,"#f6f1e6",x,4,.25,W[0]));
// bookcase
const bkStart=W[0].children.length;{const x=-17;bx(8,12,.4,"#6b4a30",x,0,.2,W[0]);[-3.8,3.8].forEach(d=>bx(.4,12,1.8,"#7a5436",x+d,0,.9,W[0]));
 for(let r=0;r<5;r++){const y=-5.9+r*3;bx(7.6,.25,1.6,"#8a6240",x,y,1,W[0]);
  if(r<4)for(let i=0;i<9;i++){const hh=.65+.3*Math.abs(Math.sin(i*7+r*3));bx(.6,2.3*hh,1.3,COL6[(i+r*2)%6],x-3.4+i*.85,y+.12+1.15*hh,1,W[0],{roughness:.8})}}}
const BKS=W[0].children.slice(bkStart);
// framed art built from the puzzle's colours
function art(p,x,y,s,seed){bx(s+.5,s+.5,.25,"#2b2118",x,y,.15,p);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(s,s),new THREE.MeshBasicMaterial({map:ctex(128,128,(g,w,h)=>{g.fillStyle="#f4f1ea";g.fillRect(0,0,w,h);for(let i=0;i<4;i++)for(let j=0;j<4;j++){g.fillStyle=COL6[(i*3+j*5+seed)%6];g.fillRect(i*32+4,j*32+4,24,24)}})}));m.position.set(x,y,.3);p.add(m)}

// plants
const PLG=new THREE.Group();room.add(PLG);
function plant(x,z,s){const g=new THREE.Group();g.position.set(x,-6,z);g.scale.setScalar(s);PLG.add(g);cyl(1.1,.8,1.6,"#b8613c",0,.8,0,g,{roughness:.8});
  for(let i=0;i<9;i++){const l=new THREE.Mesh(new THREE.SphereGeometry(.8,12,10),std({color:i%2?"#2f7d4f":"#3d9a60",roughness:.7})),a=i*2.4;l.scale.set(.7,1.5,.7);l.position.set(Math.cos(a)*.7,2.6+i*.18,Math.sin(a)*.7);l.rotation.set(Math.sin(a)*.5,0,-Math.cos(a)*.5);g.add(l)}}

// warm ceiling lights (fixtures removed, light kept)
[-5,5].forEach(x=>{const l=new THREE.PointLight(0xffd9a0,.55,45);l.position.set(x,3,-8);room.add(l)});
// round walnut table, brass trim, a few props
const tbl=cyl(4.2,4.2,.35,"#6b4428",0,-2.775,0,room,{roughness:.35});cyl(4.25,4.25,.1,"#c9a45c",0,-3,0,room,{roughness:.35,metalness:.3});
cyl(.5,.6,3,"#3a2a1e",0,-4.5,0,room);cyl(2.1,2.3,.25,"#3a2a1e",0,-5.9,0,room);
bx(1.8,.3,1.3,"#2563eb",2.4,-2.45,1.2,room);const bk=bx(1.6,.25,1.2,"#f4f4f0",2.4,-2.18,1.2,room);bk.rotation.y=.4;
cyl(.35,.3,.6,"#f4f4f0",-2.6,-2.3,1.8,room);cyl(.35,.35,.1,"#6b4428",-2.6,-1.95,1.8,room);

const blob=new THREE.Mesh(new THREE.PlaneGeometry(7,7),new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,map:ctex(128,128,(g,w,h)=>{const q=g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);q.addColorStop(0,"rgba(0,0,0,.6)");q.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=q;g.fillRect(0,0,w,h)})}));
blob.rotation.x=-Math.PI/2;blob.position.y=-2.59;room.add(blob);
const hemi=new THREE.HemisphereLight(0xfff4e0,0x6b5a4a,.85),sun=new THREE.DirectionalLight(0xfff0d0,.55),tl=new THREE.PointLight(0xffd9a0,.7,40);sun.position.set(-10,20,15);tl.position.set(0,5,3);ST.add(hemi,sun,tl);r2.shadowMap.enabled=true;r2.shadowMap.type=THREE.PCFSoftShadowMap;sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:1,far:90});sun.shadow.bias=-.0006;sun.shadow.radius=3;tbl.receiveShadow=true;
function markShadow(){[cube,pivot].forEach(o=>o.traverse(m=>{if(m.isMesh)m.castShadow=true}))}
// ---- places & lighting presets ----
// the original living room lives in its own group; every other place is a separate outdoor world
const house=new THREE.Group();room.add(house);[floor,rug,ceil,PLG,...W].forEach(o=>house.add(o));
cam2.far=400;cam2.updateProjectionMatrix();
const mkr=s=>()=>(s=s*16807%2147483647)/2147483647;
const lam=o=>new THREE.MeshLambertMaterial(o);
function disc(r,y,m){const o=new THREE.Mesh(new THREE.CircleGeometry(r,72),m);o.rotation.x=-Math.PI/2;o.position.y=y;return o}
function ringM(a,b,c,op,y){const o=new THREE.Mesh(new THREE.RingGeometry(a,b,72),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:op,depthWrite:false}));o.rotation.x=-Math.PI/2;o.position.y=y;return o}
function noiseTex(w,base,spots,rep){return ctex(w,w,(g,ww,hh)=>{g.fillStyle=base;g.fillRect(0,0,ww,hh);spots.forEach(s=>{g.fillStyle=s[0];for(let i=0;i<s[1];i++)g.fillRect(Math.random()*ww,Math.random()*hh,s[2],s[2])})},rep,rep)}
function put(geo,mat,x,y,z,p){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);if(p)p.add(m);return m}
function stripes(w,h,cols,vert){return ctex(w,h,(g,ww,hh)=>{const n=cols.length;cols.forEach((c,i)=>{g.fillStyle=c;if(vert)g.fillRect(i*ww/n,0,ww/n+1,hh);else g.fillRect(0,i*hh/n,ww,hh/n+1)})})}

// ===== Beach =====
function buildBeach(){const g=new THREE.Group(),R=mkr(11);
  g.add(disc(26,-6,std({map:noiseTex(512,"#e8d3a2",[["#d9c08a",1400,2],["#f4e6c0",900,2],["#c9ae78",300,3]],10),roughness:1})));
  g.add(disc(148,-6.45,std({color:"#2a8db3",roughness:.25,metalness:.15})));
  g.add(ringM(25,29,"#d6f6f4",.55,-6.43),ringM(29,38,"#5ccfd8",.35,-6.44),ringM(19,26,"#8f7a50",.28,-5.97));
  const leaf=std({color:"#2f8a4a",roughness:.7,side:THREE.DoubleSide}),bark=std({color:"#8a6a45",roughness:.9}),nut=std({color:"#4a3222",roughness:.8});
  const sph=new THREE.SphereGeometry(1,10,6);
  const palm=(x,z,lean,h)=>{const p=new THREE.Group();p.position.set(x,-6,z);p.rotation.y=R()*6.28;g.add(p);
    const segs=6,sh=h/segs;let px=0,py=0;
    for(let i=0;i<segs;i++){const a=lean*(i+.5)/segs;
      const s=put(new THREE.CylinderGeometry(.46-.05*i,.52-.05*i,sh*1.06,8),bark,px+Math.sin(a)*sh/2,py+Math.cos(a)*sh/2,0,p);s.rotation.z=-a;
      px+=Math.sin(a)*sh;py+=Math.cos(a)*sh}
    const c=new THREE.Group();c.position.set(px,py,0);p.add(c);
    for(let k=0;k<9;k++){const y=new THREE.Group();y.rotation.y=k*6.2832/9+R()*.3;c.add(y);
      const f1=new THREE.Group();f1.rotation.z=.2+R()*.15;y.add(f1);
      const l1=put(sph,leaf,1.3,0,0,f1);l1.scale.set(1.4,.07,.75);
      const f2=new THREE.Group();f2.position.x=2.6;f2.rotation.z=-.8-R()*.3;f1.add(f2);
      const l2=put(sph,leaf,1.5,0,0,f2);l2.scale.set(1.6,.07,.6)}
    for(let k=0;k<3;k++)put(new THREE.SphereGeometry(.34,8,6),nut,Math.cos(k*2.1)*.5,-.4,Math.sin(k*2.1)*.5,c)};
  palm(15,-9,.55,14);palm(-17,-4,-.5,15);palm(-5,-18,.35,13);palm(10,17,-.45,12.5);
  // umbrella
  const um=new THREE.Group();um.position.set(-6.5,-6,7.5);um.rotation.z=.12;um.scale.setScalar(.55);g.add(um);
  put(new THREE.CylinderGeometry(.07,.07,6.4,6),std({color:"#e8e8e8"}),0,3.2,0,um);
  put(new THREE.ConeGeometry(3.7,1.5,16,1,true),std({map:stripes(256,8,["#e63946","#ffffff","#e63946","#ffffff","#e63946","#ffffff","#e63946","#ffffff"],true),side:THREE.DoubleSide,roughness:.8}),0,6.7,0,um);
  put(new THREE.SphereGeometry(.14,8,6),std({color:"#e8e8e8"}),0,7.5,0,um);
  // towels, ball, sandcastle, board
  const tw=(x,z,r,c)=>{const t=put(new THREE.BoxGeometry(3,.07,5.4),std({map:stripes(64,64,c,false),roughness:1}),x,-5.96,z,g);t.rotation.y=r};
  tw(-3.5,5,.35,["#2563eb","#ffffff","#2563eb","#ffffff","#2563eb"]);tw(2.2,9.5,-.5,["#ff8a1f","#ffd400","#ff8a1f","#ffd400","#ff8a1f"]);
  put(new THREE.SphereGeometry(.8,16,12),std({map:stripes(128,32,["#e63946","#ffffff","#2563eb","#ffffff","#ffd400","#ffffff"],true),roughness:.5}),6.5,-5.2,5.5,g);
  const sand=std({color:"#dcc690",roughness:1}),cs=new THREE.Group();cs.position.set(9,-6,-6);g.add(cs);
  put(new THREE.CylinderGeometry(1.3,1.6,1.6,14),sand,0,.8,0,cs);put(new THREE.ConeGeometry(1.1,1,14),sand,0,2.1,0,cs);
  [[1.9,1.9],[-1.9,1.9],[1.9,-1.9],[-1.9,-1.9]].forEach(a=>{put(new THREE.CylinderGeometry(.45,.55,1.2,10),sand,a[0],.6,a[1],cs);put(new THREE.ConeGeometry(.5,.6,10),sand,a[0],1.5,a[1],cs)});
  const bd=put(sph,std({color:"#ff7a45",roughness:.4}),-10.5,-2.9,3,g);bd.scale.set(.75,3.2,.14);bd.rotation.z=.14;
  for(let i=0;i<7;i++){const r=put(new THREE.DodecahedronGeometry(1,0),std({color:"#8a8f94",roughness:1}),12+R()*8,-5.7,-12+R()*12,g);r.scale.set(.6+R()*1.2,.5+R()*.8,.6+R()*1.2);r.rotation.y=R()*6}
  // distant islands
  [[-85,-100,18,13],[95,-95,10,8]].forEach(a=>{put(new THREE.ConeGeometry(a[2],a[3],7),std({color:"#2f6b4a",roughness:1}),a[0],-6.4+a[3]/2,a[1],g)});
  return g}

// ===== Forest =====
function buildForest(){const g=new THREE.Group(),R=mkr(5);
  g.add(disc(146,-6,std({map:noiseTex(512,"#3f7a3c",[["#2f6a32",1800,3],["#58934a",1500,2],["#3a5e2c",500,3]],26),roughness:1})));
  g.add(disc(10,-5.97,std({map:noiseTex(256,"#7a5b3a",[["#6a4d30",900,2],["#8c6a45",700,2]],3),roughness:1})));
  const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),sv=new THREE.Vector3(),pp=new THREE.Vector3(),cc=new THREE.Color();
  const mk=(geo,n,c)=>{const o=new THREE.InstancedMesh(geo,lam({color:c||"#ffffff"}),n);o.frustumCulled=false;g.add(o);return o};
  const put4=(o,i,x,y,z,a,b,c)=>{sv.set(a,b,c);pp.set(x,y,z);m4.compose(pp,q,sv);o.setMatrixAt(i,m4)};
  // tall trees stay well outside the camera orbit so they never block the view
  const N=85,trunks=mk(new THREE.CylinderGeometry(.6,.9,1,7),N+36,"#5a3e28"),cones=[0,1,2].map(()=>mk(new THREE.ConeGeometry(1,1,9),N));
  for(let i=0;i<N;i++){const a=R()*6.283,r=54+R()*72,h=20+R()*16,x=Math.cos(a)*r,z=Math.sin(a)*r,w=.9+R()*.5;
    put4(trunks,i,x,-6+h*.17,z,w,h*.35,w);cc.setHSL(.33+R()*.05,.5,.15+R()*.1);
    for(let k=0;k<3;k++){const ch=h*(.5-k*.1),cr=h*.2*(1.2-k*.22);put4(cones[k],i,x,-6+h*.3+k*h*.2+ch*.5,z,cr,ch,cr);cones[k].setColorAt(i,cc)}}
  const balls=mk(new THREE.SphereGeometry(1,10,8),72);
  for(let i=0;i<36;i++){const a=R()*6.283,r=54+R()*72,h=17+R()*8,x=Math.cos(a)*r,z=Math.sin(a)*r;
    put4(trunks,N+i,x,-6+h*.3,z,.8,h*.6,.8);cc.setHSL(.24+R()*.09,.5,.27+R()*.08);
    put4(balls,i*2,x,-6+h*.66,z,h*.3,h*.26,h*.3);put4(balls,i*2+1,x+h*.12,-6+h*.54,z+h*.08,h*.2,h*.18,h*.2);balls.setColorAt(i*2,cc);balls.setColorAt(i*2+1,cc)}
  // grass tufts
  const tf=mk(new THREE.ConeGeometry(.16,1.2,4),240);
  for(let i=0;i<240;i++){const a=R()*6.283,r=5+R()*24,s=.7+R()*1.1;put4(tf,i,Math.cos(a)*r,-6+.6*s,Math.sin(a)*r,.8+R()*.8,s,.8+R()*.8);tf.setColorAt(i,cc.setHSL(.26+R()*.1,.55,.24+R()*.15))}
  // stump seats, fallen log, rocks, ferns, mushrooms, flowers
  [[7.5,5],[-8,6.5]].forEach(a=>{put(new THREE.CylinderGeometry(1.1,1.3,1.1,14),std({color:"#6f5033",roughness:1}),a[0],-5.45,a[1],g);put(new THREE.CylinderGeometry(.95,.95,.04,14),std({color:"#d1a974",roughness:.8}),a[0],-4.9,a[1],g)});
  const lg=put(new THREE.CylinderGeometry(.85,.85,7,12),std({color:"#5c4129",roughness:1}),-9,-5.15,-7,g);lg.rotation.z=Math.PI/2;lg.rotation.y=.5;
  for(let i=0;i<9;i++){const a=R()*6.283,r=11+R()*10,k=put(new THREE.DodecahedronGeometry(1,0),std({color:"#7d8480",roughness:1}),Math.cos(a)*r,-5.6,Math.sin(a)*r,g);k.scale.set(.6+R()*1.2,.5+R()*.9,.6+R()*1.2);k.rotation.y=R()*6}
  const fern=std({color:"#2e7d3a",roughness:.9,side:THREE.DoubleSide}),fg=new THREE.ConeGeometry(.35,2.3,5);
  for(let i=0;i<24;i++){const a=R()*6.283,r=8+R()*18,c=new THREE.Group();c.position.set(Math.cos(a)*r,-6,Math.sin(a)*r);g.add(c);
    for(let k=0;k<6;k++){const f=put(fg,fern,Math.cos(k*1.05)*.5,1,Math.sin(k*1.05)*.5,c);f.rotation.z=Math.cos(k*1.05)*.9;f.rotation.x=-Math.sin(k*1.05)*.9}}
  for(let i=0;i<7;i++){const a=R()*6.283,r=7+R()*9,c=new THREE.Group();c.position.set(Math.cos(a)*r,-6,Math.sin(a)*r);g.add(c);
    for(let k=0;k<3;k++){const s=.6+R()*.6,x=k*.7-.7;put(new THREE.CylinderGeometry(.1*s,.13*s,.8*s,8),std({color:"#efe6d4"}),x,.4*s,0,c);put(new THREE.SphereGeometry(.42*s,10,6,0,6.283,0,1.57),std({color:"#c0392b",roughness:.6}),x,.8*s,0,c)}}
  const fc=["#ffd400","#ffffff","#ff7eb6","#b58cf0"];
  for(let i=0;i<40;i++){const a=R()*6.283,r=6+R()*18,x=Math.cos(a)*r,z=Math.sin(a)*r;put(new THREE.CylinderGeometry(.03,.03,.9,5),std({color:"#3d8a3d"}),x,-5.55,z,g);put(new THREE.SphereGeometry(.17,8,6),std({color:fc[i%4],roughness:.6}),x,-5.08,z,g)}
  return g}

// ===== Rooftop city =====
const FAC=["#6c7380","#8a7f73","#5b6575","#7d8794"],FACN=["#141824","#1a1722","#101a24","#181c20"];
function facTex(night,i){const rr=mkr(i*13+3);return ctex(256,256,(c,w,h)=>{c.fillStyle=night?FACN[i]:FAC[i];c.fillRect(0,0,w,h);
  for(let a=0;a<4;a++)for(let b=0;b<4;b++){const x=a*64+14,y=b*64+10,lit=rr()<.5;
    c.fillStyle=night?(lit?(rr()<.3?"#ffe9a8":"#ffd27a"):"#222a3a"):(lit?"#cfe6f5":"#8fb4cc");c.fillRect(x,y,36,42);
    if(!night){c.fillStyle="rgba(255,255,255,.25)";c.fillRect(x,y,36,12)}}},1,1)}
function buildCity(){const g=new THREE.Group(),R=mkr(9);
  const mats=[0,1,2,3].map(()=>new THREE.MeshBasicMaterial({}));
  g.userData.facade=id=>{const n=id==="night"||id==="neon";mats.forEach((m,i)=>swapMap(m,facTex(n,i)))};
  g.add(disc(148,-95,new THREE.MeshBasicMaterial({color:"#12141d"})));
  const bld=(x,z,w,d,h,i)=>{const b=new THREE.BoxGeometry(w,h,d),uv=b.attributes.uv;
    for(let k=0;k<uv.count;k++){const f=k>>2;if(f===2||f===3){uv.setXY(k,.01,.01);continue}
      const su=f<2?d/5:w/5,sv=f<2||f>3?h/6:d/6;uv.setXY(k,uv.getX(k)*su,uv.getY(k)*sv)}
    return put(b,mats[i%4],x,-90+h/2,z,g)};
  for(let i=0;i<46;i++){const a=R()*6.283,r=34+R()*40;bld(Math.cos(a)*r,Math.sin(a)*r,6+R()*9,6+R()*9,70+R()*13,i)}
  for(let i=0;i<80;i++){const a=R()*6.283,r=64+R()*80;bld(Math.cos(a)*r,Math.sin(a)*r,8+R()*10,8+R()*10,45+R()*105,i)}
  // roof deck
  const dt=ctex(512,512,(c,w,h)=>{c.fillStyle="#9a9a98";c.fillRect(0,0,w,h);for(let i=0;i<2000;i++){c.fillStyle=R()>.5?"#8c8c8a":"#a8a8a5";c.fillRect(R()*w,R()*h,2,2)}c.strokeStyle="rgba(0,0,0,.3)";c.lineWidth=2;for(let i=0;i<=4;i++){c.beginPath();c.moveTo(i*w/4,0);c.lineTo(i*w/4,h);c.moveTo(0,i*h/4);c.lineTo(w,i*h/4);c.stroke()}},12,12);
  const dk=put(new THREE.PlaneGeometry(60,60),std({map:dt,roughness:.9}),0,-6,0,g);dk.rotation.x=-Math.PI/2;
  g.add(disc(9,-5.97,std({map:ctex(512,512,(c,w,h)=>{for(let i=0;i<10;i++){c.fillStyle=["#b8895a","#a97c50","#c19566"][i%3];c.fillRect(0,i*h/10,w,h/10-2)}},1,1),roughness:.8})));
  const pc=std({color:"#b4b2ac",roughness:.9});
  [[60.4,1.2,0,30.2],[60.4,1.2,0,-30.2]].forEach(a=>put(new THREE.BoxGeometry(a[0],2.2,a[1]),pc,a[2],-4.9,a[3],g));
  [30.2,-30.2].forEach(x=>put(new THREE.BoxGeometry(1.2,2.2,60.4),pc,x,-4.9,0,g));
  // rooftop props, kept low so they never hide the puzzle
  const gm=std({color:"#9aa2a8",roughness:.6,metalness:.3});
  [[-18,-14,.3],[19,-17,-.2],[-21,12,.1]].forEach(a=>{const u=put(new THREE.BoxGeometry(4.2,1.7,2.6),gm,a[0],-5.1,a[1],g);u.rotation.y=a[2];put(new THREE.CylinderGeometry(.8,.8,.15,16),std({color:"#444"}),a[0],-4.2,a[1],g)});
  [[-13,15],[14,14],[-6,-20],[12,-20]].forEach(a=>{put(new THREE.BoxGeometry(4,1.2,1.4),std({color:"#7a5436",roughness:.9}),a[0],-5.4,a[1],g);for(let k=0;k<3;k++)put(new THREE.SphereGeometry(.8,10,8),std({color:["#2f7d4f","#3d9a60","#2a6e44"][k],roughness:.8}),a[0]-1.2+k*1.2,-4.5,a[1],g)});
  const lc=[[9,3.5,.4],[9.5,-2,-.3]];lc.forEach(a=>{const c=new THREE.Group();c.position.set(a[0]+4.5,-6,a[1]);c.rotation.y=a[2];g.add(c);
    put(new THREE.BoxGeometry(2,.15,4.6),std({color:"#e9e2d3"}),0,-.0+.55,0,c);const bk=put(new THREE.BoxGeometry(2,.15,1.8),std({color:"#e9e2d3"}),0,1.1,-2.1,c);bk.rotation.x=-.7;
    [[.8,2],[-.8,2],[.8,-2],[-.8,-2]].forEach(l=>put(new THREE.CylinderGeometry(.06,.06,.5,6),std({color:"#555"}),l[0],.25,l[1],c))});
  return g}

// ===== Moon =====
function buildMoon(){const g=new THREE.Group(),R=mkr(3);
  const mt=ctex(1024,1024,(c,w,h)=>{c.fillStyle="#8d8d92";c.fillRect(0,0,w,h);for(let i=0;i<7000;i++){c.fillStyle=R()>.5?"#7e7e84":"#9c9ca2";c.fillRect(R()*w,R()*h,2,2)}
    for(let i=0;i<80;i++){const x=R()*w,y=R()*h,r=14+R()*90,q=c.createRadialGradient(x,y,r*.2,x,y,r);q.addColorStop(0,"rgba(60,60,66,.45)");q.addColorStop(.8,"rgba(60,60,66,.25)");q.addColorStop(.92,"rgba(195,195,200,.5)");q.addColorStop(1,"rgba(195,195,200,0)");c.fillStyle=q;c.beginPath();c.arc(x,y,r,0,7);c.fill()}},3,3);
  g.add(disc(146,-6,std({map:mt,roughness:1})));
  const et=ctex(512,256,(c,w,h)=>{c.fillStyle="#1f5fa8";c.fillRect(0,0,w,h);c.fillStyle="#3f8f4e";[[90,90,50,30],[170,70,35,45],[300,100,55,35],[390,70,30,25],[260,170,45,30],[120,180,30,22],[440,160,40,18]].forEach(a=>{c.beginPath();c.ellipse(a[0],a[1],a[2],a[3],R(),0,7);c.fill()});
    c.fillStyle="#c9b27a";c.beginPath();c.ellipse(310,110,22,14,0,0,7);c.fill();c.fillStyle="#f4f7fb";c.fillRect(0,0,w,18);c.fillRect(0,h-18,w,18);
    c.globalAlpha=.55;for(let i=0;i<26;i++){c.beginPath();c.ellipse(R()*w,R()*h,20+R()*40,5+R()*8,R()*3,0,7);c.fill()}c.globalAlpha=1},0,0);
  const ea=put(new THREE.SphereGeometry(24,40,24),std({map:et,roughness:1,emissive:"#1a2a55",emissiveIntensity:.55}),-62,38,-92,g);ea.rotation.set(.3,2,.2);
  put(new THREE.SphereGeometry(25.4,32,20),new THREE.MeshBasicMaterial({color:"#6ab0ff",transparent:true,opacity:.22,side:THREE.BackSide,depthWrite:false}),-62,38,-92,g);
  for(let i=0;i<16;i++){const a=R()*6.283,r=10+R()*22,k=put(new THREE.DodecahedronGeometry(1,0),std({color:"#7a7a80",roughness:1}),Math.cos(a)*r,-5.7,Math.sin(a)*r,g);k.scale.set(.5+R()*1.5,.4+R()*.9,.5+R()*1.5);k.rotation.set(R()*3,R()*6,R()*3)}
  // small lander
  const ld=new THREE.Group();ld.position.set(13,-6,-9);ld.rotation.y=.6;g.add(ld);
  const foil=std({color:"#c9a24a",roughness:.35,metalness:.6}),mt2=std({color:"#cfd3d8",roughness:.5,metalness:.4});
  put(new THREE.CylinderGeometry(1.7,1.7,2,8),foil,0,3.3,0,ld);put(new THREE.CylinderGeometry(.9,1.6,.8,8),mt2,0,4.7,0,ld);
  put(new THREE.CylinderGeometry(.06,.06,1.6,6),mt2,0,5.9,0,ld);put(new THREE.SphereGeometry(.45,12,8,0,6.283,0,1.57),mt2,.4,6.5,0,ld);
  for(let k=0;k<4;k++){const a=k*Math.PI/2+Math.PI/4,l=put(new THREE.CylinderGeometry(.07,.07,3.4,6),mt2,Math.cos(a)*1.9,1.6,Math.sin(a)*1.9,ld);
    l.rotation.z=Math.cos(a)*.55;l.rotation.x=-Math.sin(a)*.55;put(new THREE.CylinderGeometry(.5,.5,.08,12),mt2,Math.cos(a)*2.7,.04,Math.sin(a)*2.7,ld)}
  return g}

const PLACES={
 living:{n:"Living room",sw:"#2f5568",indoor:1,table:"#6b4428"},
 beach:{n:"Beach",sw:"#e8d3a2",table:"#8a6a45",build:buildBeach},
 forest:{n:"Forest",sw:"#2f6a32",table:"#5c4129",build:buildForest,hills:["#2c5a3c","#0d2418"]},
 city:{n:"Rooftop city",sw:"#6b7078",table:"#2d2d30",build:buildCity},
 moon:{n:"Moon",sw:"#8d8d92",table:"#e9ecf2",build:buildMoon,space:1,hills:["#6a6a70","#2b2b32"]}};
const LIGHTS={
 day:{n:"Daylight",h:[0xfff4e0,0x6b5a4a,.9],s:[0xfff0d0,.6,[-10,20,15]],t:[0xffd9a0,.6],w:[0xffd9a0,.5],sky:["#bfe3ff","#fff3d6","#ffd9a0"],dot:"#ffe9b0"},
 golden:{n:"Golden hour",h:[0xffd9b0,0x5a3a2a,.6],s:[0xff9a4d,.95,[-20,6,12]],t:[0xffb870,.7],w:[0xffb060,.8],sky:["#ffb36b","#ff8a5c","#7a3f6b"],dot:"#ff9a4d"},
 night:{n:"Night",h:[0x7f95d9,0x1d2038,.32],s:[0x8fb0ff,.25,[10,20,5]],t:[0xffd9a0,.5],w:[0xffd9a0,1.2],sky:["#0b1330","#1b2a5a","#34447a"],stars:1,dot:"#3a4f9a"},
 soft:{n:"Soft studio",h:[0xffffff,0xaab0bb,1],s:[0xffffff,.8,[0,25,20]],t:[0xffffff,.4],w:[0xffffff,.25],sky:["#e9eef7","#f4f6fb","#ffffff"],dot:"#ffffff"},
 neon:{n:"Neon",h:[0x6a4cff,0x201040,.55],s:[0xff3da8,.8,[-12,10,12]],t:[0x33e0ff,.9],w:[0xff4fd8,1.1],sky:["#14052e","#3a0f66","#ff3da8"],stars:1,dot:"#ff3da8"}};
function swapMap(m,t){if(m.map)m.map.dispose();m.map=t;m.needsUpdate=true}
function skyTex(c,st){return ctex(256,256,(g,w,h)=>{const q=g.createLinearGradient(0,0,0,h);q.addColorStop(0,c[0]);q.addColorStop(.7,c[1]);q.addColorStop(1,c[2]);g.fillStyle=q;g.fillRect(0,0,w,h);
  if(st){g.fillStyle="#fff";for(let i=0;i<40;i++){g.globalAlpha=.4+.6*Math.abs(Math.sin(i*5.1));g.fillRect((i*83)%w,(i*47)%(h*.7),2,2)}g.globalAlpha=1;g.beginPath();g.arc(190,60,18,0,7);g.fillStyle="#f6f1d9";g.fill()}
  else{g.fillStyle="rgba(255,255,255,.7)";[[60,70,38],[150,52,28],[196,104,34],[110,120,24]].forEach(c=>{g.beginPath();g.arc(c[0],c[1],c[2],0,7);g.fill()})}})}
// sky dome for the outdoor places (sun, moon, stars, clouds and a horizon line that follow the lighting)
const dome=new THREE.Mesh(new THREE.SphereGeometry(150,48,24),new THREE.MeshBasicMaterial({side:THREE.BackSide,depthWrite:false}));dome.renderOrder=-10;dome.visible=false;room.add(dome);
const SUNS={day:["#fffbe8",.31,30],golden:["#ffb36b",.43,44],night:["#f6f1d9",.27,20],neon:["#ff3da8",.36,56]};
function domeTex(P,L,id){const rr=mkr(21);return ctex(1024,512,(g,w,h)=>{const hz=h*.5;
  if(P.space){const q=g.createLinearGradient(0,0,0,h);q.addColorStop(0,"#01020a");q.addColorStop(.5,"#0a0d24");q.addColorStop(1,"#0a0d24");g.fillStyle=q;g.fillRect(0,0,w,h);
    g.save();g.translate(w*.6,h*.28);g.rotate(-.35);const mw=g.createLinearGradient(0,-60,0,60);mw.addColorStop(0,"rgba(120,130,255,0)");mw.addColorStop(.5,"rgba(150,160,255,.22)");mw.addColorStop(1,"rgba(120,130,255,0)");g.fillStyle=mw;g.fillRect(-w,-60,w*2,120);g.restore();
    for(let i=0;i<1000;i++){g.globalAlpha=.3+.7*rr();g.fillStyle=i%9?"#fff":"#bcd0ff";const s=rr()<.07?2.4:1.3;g.fillRect(rr()*w,rr()*hz,s,s)}g.globalAlpha=1}
  else{const c=L.sky,q=g.createLinearGradient(0,0,0,h);q.addColorStop(0,c[0]);q.addColorStop(.28,c[1]);q.addColorStop(.5,c[2]);q.addColorStop(1,c[2]);g.fillStyle=q;g.fillRect(0,0,w,h);
    if(L.stars){g.fillStyle="#fff";for(let i=0;i<320;i++){g.globalAlpha=.35+.65*rr();g.fillRect(rr()*w,rr()*hz*.95,rr()<.1?2.4:1.3,1.5)}g.globalAlpha=1}
    const S=SUNS[id];
    if(S){const x=w*.73,y=h*S[1],r=S[2],q2=g.createRadialGradient(x,y,r*.4,x,y,r*4);q2.addColorStop(0,S[0]+"aa");q2.addColorStop(1,S[0]+"00");g.fillStyle=q2;g.fillRect(x-r*4,y-r*4,r*8,r*8);g.fillStyle=S[0];g.beginPath();g.arc(x,y,r,0,7);g.fill()}
    if(!L.stars){g.fillStyle=id==="golden"?"rgba(255,205,170,.6)":"rgba(255,255,255,.7)";
      for(let i=0;i<14;i++){const x=rr()*w,y=h*(.07+.27*rr()),s=.7+rr()*.9;for(let k=0;k<5;k++){g.beginPath();g.ellipse(x+(k-2)*22*s,y+Math.abs(k-2)*-3*s,30*s,12*s,0,0,7);g.fill()}}}}
  if(P.hills){g.beginPath();g.moveTo(0,h);for(let x=0;x<=w;x+=8){const a=6.2832*x/w;g.lineTo(x,hz+4-(12*Math.sin(a*2)+9*Math.sin(a*5+1)+6*Math.sin(a*11)+16))}g.lineTo(w,h);g.closePath();g.fillStyle=(P.space||L.stars)?P.hills[1]:P.hills[0];g.fill()}})}
function applyLight(id){const L=LIGHTS[id],P=PLACES[curP];hemi.color.set(L.h[0]);hemi.groundColor.set(L.h[1]);hemi.intensity=L.h[2];sun.color.set(L.s[0]);sun.intensity=L.s[1];sun.position.set(L.s[2][0],L.s[2][1],L.s[2][2]);tl.color.set(L.t[0]);tl.intensity=L.t[1];
  room.children.forEach(o=>{if(o.isPointLight){o.color.set(L.w[0]);o.intensity=P.indoor?L.w[1]:0}});
  if(P.indoor)swapMap(pane.material,skyTex(L.sky,L.stars));else swapMap(dome.material,domeTex(P,L,id));
  if(P.grp&&P.grp.userData.facade)P.grp.userData.facade(id);
  if(P.space){hemi.intensity=Math.min(hemi.intensity,.3);sun.intensity=Math.max(sun.intensity,1.15);if(id==="day"||id==="soft"){sun.color.set(0xffffff);sun.position.set(-26,18,22)}}}
let curP="living",curL="day";
function paintPlace(id){const P=PLACES[id];if(P.build&&!P.grp){P.grp=P.build();room.add(P.grp)}
  Object.keys(PLACES).forEach(k=>{if(PLACES[k].grp)PLACES[k].grp.visible=k===id});
  house.visible=!!P.indoor;dome.visible=!P.indoor;tbl.material.color.set(P.table);applyLight(curL)}
function chips(el,obj,get,set,sw){el.innerHTML="";Object.keys(obj).forEach(k=>{const b=document.createElement("button");b.className="chip"+(k===get()?" on":"");b.innerHTML='<i style="background:'+sw(obj[k])+'"></i>'+obj[k].n;b.onclick=()=>{set(k);[...el.children].forEach(c=>c.classList.toggle("on",c===b))};el.appendChild(b)})}
chips($("cp"),PLACES,()=>curP,k=>{curP=k;paintPlace(k)},p=>p.sw);chips($("cl"),LIGHTS,()=>curL,k=>{curL=k;applyLight(k)},l=>l.dot);
paintPlace(curP);
// ---- drag to orbit the room, pinch / wheel to zoom (only while not recording) ----
const so={yaw:0,pitch:.1,zoom:1,touched:0},sptr=new Map();
sc.onpointerdown=e=>{if(recording)return;sc.setPointerCapture(e.pointerId);sptr.set(e.pointerId,[e.clientX,e.clientY]);so.touched=performance.now()};
sc.onpointermove=e=>{if(recording||!sptr.has(e.pointerId))return;const o=sptr.get(e.pointerId),n=[e.clientX,e.clientY];so.touched=performance.now();
  if(sptr.size>1){const q=[...sptr].find(a=>a[0]!==e.pointerId)[1],d0=Math.hypot(o[0]-q[0],o[1]-q[1]),d1=Math.hypot(n[0]-q[0],n[1]-q[1]);if(d1>0)so.zoom=Math.max(.6,Math.min(1.25,so.zoom*d0/d1))}
  else{so.yaw+=(n[0]-o[0])*.006;so.pitch=Math.max(-.15,Math.min(.9,so.pitch+(n[1]-o[1])*.004))}sptr.set(e.pointerId,n)};
sc.onpointerup=sc.onpointercancel=e=>sptr.delete(e.pointerId);
sc.onwheel=e=>{if(recording)return;e.preventDefault();so.zoom=Math.max(.6,Math.min(1.25,so.zoom*(1+e.deltaY*.001)));so.touched=performance.now()};
function sizeStudio(){const e=$("studio"),w=e.clientWidth,h=e.clientHeight;if(!w||!h||recording)return;r2.setPixelRatio(Math.min(devicePixelRatio||1,2));r2.setSize(w,h,false);cam2.aspect=w/h;cam2.updateProjectionMatrix()}
new ResizeObserver(sizeStudio).observe($("studio"));
// gentle camera drift + the room slowly turning behind the floating puzzle
function renderStudio(){const a=cam2.aspect,now=performance.now(),e=Math.min(1,(now-rec.t0)/2200),ez=e*e*(3-2*e),el0=Math.max(.02,Math.min(1.1,.18+so.pitch));
  let D=Math.max(15/a,20)*so.zoom*(1+.12*(1-ez)),el=el0,lx=0,ly=-.3,sway=0;
  if(recording){const t=(now-rec.t0)/1000,n=sol?sol.length:1,pr=rec.ph==="solve"?Math.min(1,ix/n):rec.ph==="end"?1:0;
    rec.kickTarget=Math.max(0,(rec.kickTarget||0)-.045);
    rec.kick=(rec.kick||0)+(rec.kickTarget-(rec.kick||0))*.12;
    // shot design: wide opener, slow push-in while solving, gentle pull-back on the reveal
    const dz={hold:1.08-.05*Math.min(1,t/6),solve:1.0-.22*pr,end:.78+.24*Math.min(1,(now-(rec.endT||(rec.endT=now)))/3000)}[rec.ph]||1;
    if(rec.ph!=="end")rec.endT=0;
    D*=dz*(1-.018*rec.kick);el=el0+.1*Math.sin(t*.32)+(rec.ph==="solve"?.08*pr:0)+(rec.ph==="end"?.06:0);
    lx=.35*Math.sin(t*.21);ly=-.3+.5*Math.sin(t*.27)*(rec.ph==="solve"?1:.4);sway=1}
  const sx=recording?0:(sway?.035*Math.sin(now*.0011)+.02*Math.sin(now*.0027):0),sy=recording?0:(sway?.03*Math.sin(now*.0013+1):0);
  cam2.position.set(lx+sx*D,ly+D*Math.sin(el)+sy*D,D*Math.cos(el));cam2.lookAt(lx,ly+(sway?cube.position.y*.12:0),0);room.rotation.y=so.yaw;blob.scale.setScalar(1-(cube.position.y-1.5)*.2);blob.material.opacity=.55;
  ST.visible=true;r2.render(scene,cam2);ST.visible=false}
async function openStudio(){if(!sol)return;playing=false;while(busy||anim)await sleep(30);col=start.slice();paint();ix=0;hl();
  markShadow();studioOn=true;Object.assign(rec,{studio:true,ph:"prev",tag:"",tt:0,last:0,t0:performance.now()});$("studio").hidden=false;sizeStudio()}
function closeStudio(){if(recording)return;studioOn=false;rec.studio=false;rec.ph="";$("studio").hidden=true;cube.position.y=0;room.rotation.y=0;zoom=pz.iso;cube.quaternion.copy(Q3());updateCam()}
function pickRec(m){$("rq").classList.remove("on");
  if(m==="studio"){if(mode==="paint")solve("studio");else openStudio();return}
  if(mode==="paint")solve(true);else recordRun()}
function setRecUI(on){document.querySelectorAll(".recbtn").forEach(b=>b.innerHTML=on?'<i class="sq"></i>Stop':'<i class="dot"></i>Record')}
function syncRecordingAudioUI(){
  const music=$("rqaMusic"),sfx=$("rqaSfx");
  if(music){music.setAttribute("aria-pressed",recordMusic);music.textContent="Music: "+(recordMusic?"On":"Off")}
  if(sfx){sfx.setAttribute("aria-pressed",recordSfx);sfx.textContent="Sound effects: "+(recordSfx?"On":"Off")}
}
$("rqaMusic").onclick=()=>{recordMusic=!recordMusic;syncRecordingAudioUI()};
$("rqaSfx").onclick=()=>{recordSfx=!recordSfx;syncRecordingAudioUI()};
function record(){
  if(recording){stopReq=true;playing=false;return}
  if(typeof MediaRecorder==="undefined"){dlg("Recording not supported","This browser can’t record video from the page. Try a recent version of Chrome, Edge or Safari.");return}
  if(studioOn){recordRun();return}
  syncRecordingAudioUI();$("rq").classList.add("on")}
async function recordRun(){
  if(recording||!sol)return;
  playing=false;while(busy||anim)await sleep(30);
  const [bw0,bh0]=$("ar").value.split("x").map(Number),qs=+$("qa").value||1,vw=Math.round(bw0*qs/2)*2,vh=Math.round(bh0*qs/2)*2;rc.width=vw;rc.height=vh;
  const wantSnd=recordMusic||recordSfx,stream=rc.captureStream(30);let at=null;if(wantSnd)at=audStart();if(at)stream.addTrack(at);
  const mimes=at?["video/mp4;codecs=avc1,mp4a.40.2","video/mp4","video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"]:["video/mp4;codecs=avc1","video/mp4","video/webm;codecs=vp9","video/webm;codecs=vp8","video/webm"];
  const mime=mimes.find(t=>MediaRecorder.isTypeSupported(t)),vbr=Math.round(vw*vh*30*.24),opts={videoBitsPerSecond:Math.min(32e6,Math.max(8e6,vbr)),audioBitsPerSecond:192000};if(mime)opts.mimeType=mime;
  let mr;try{mr=new MediaRecorder(stream,opts)}catch(e){audStop();dlg("Recording failed","Couldn’t start the recorder in this browser.");return}
  const chunks=[];mr.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
  const done=new Promise(r=>mr.onstop=r);
  const sp0=speed,fin=start.slice();sol.forEach(m=>turn(pz,fin,m));
  col=start.slice();paint();ix=0;stopReq=false;recording=true;sudokuOrientationLocked=!!pz.sudoku;setRecUI(true);
  markShadow();Object.assign(rec,{ph:"hold",tag:"Your puzzle",label:"Your puzzle",sub:"A full turn so you can match every side",prog:0,yaw:-.65,tt:0,last:0,t0:performance.now(),studio:studioOn});
  if(studioOn){r2.setPixelRatio(1);r2.setSize(vw,vh,false);cam2.aspect=vw/vh;cam2.updateProjectionMatrix();sc.style.visibility="hidden";$("sbar").classList.add("hid");$("studio").classList.add("recing");
    rc.style.cssText="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#0a0f1c";$("studio").insertBefore(rc,$("sbar"))}
  $("cap").textContent="Recording…";drawFrame();
  mr.start(250);
  $("cap").textContent="Your puzzle";await sleep(6200);hl();
  if(!stopReq){rec.ph="solve";rec.tag="Solving";await play()}
  if(!stopReq){rec.ph="end";rec.tag="Solved";rec.endT=0;rec.endSide=-1;audChime();await sleep(8500)}
  audStop();mr.stop();recording=false;sudokuOrientationLocked=false;rec.ph=studioOn?"prev":"";setRecUI(false);await done;
  if(studioOn){rc.remove();sc.style.visibility="";$("sbar").classList.remove("hid");$("studio").classList.remove("recing");sizeStudio()}
  else{zoom=pz.iso;cube.quaternion.copy(Q3());updateCam()}
  const type=mr.mimeType||mime||"video/webm";vidBlob=new Blob(chunks,{type});
  vidName=pz.file+"."+(type.includes("mp4")?"mp4":"webm");
  $("pv").src=URL.createObjectURL(vidBlob);
  dlg("Recording ready","Your solve video is "+(vidBlob.size/1048576).toFixed(1)+" MB. Watch it, then download.");$("pv").hidden=false;$("sv").hidden=false}
