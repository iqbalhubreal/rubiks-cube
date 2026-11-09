/* Control bindings, puzzle sidebar construction and application startup. */

$("sv").onclick=async()=>{try{const d=window.claude&&await claude.use("downloads");
  if(!d){toast("Saving isn’t available here. Try the video’s own menu to download it.");return}
  await d.save({filename:vidName,data:vidBlob});toast("Video saved.")}catch(e){if(!e||e.code!=="declined")toast("Couldn’t save the video.")}};
$("solve").onclick=()=>solve(false);$("rec").onclick=record;$("rec2").onclick=record;$("play").onclick=play;$("next").onclick=()=>step(1);$("prev").onclick=()=>step(-1);$("rep").onclick=restart;$("edit").onclick=edit;
$("sp").oninput=e=>{speed=+e.target.value;$("spv").textContent=speed+"×"};
function randomize(){col=pz.solved.slice();const hist=[];let l=-1;
  for(let k=0;k<pz.rn;k++){let g;do g=pz.rpool[Math.random()*pz.rpool.length|0];while(g===l);l=g;
    const m=mv(pz,g,pz.ra[Math.random()*pz.ra.length|0]);turn(pz,col,m);hist.push(m)}
  pz.hist=hist;paint();sync()}
$("rnd").onclick=()=>randomize();
$("rst").onclick=()=>{col=pz.solved.slice();pz.hist=[];paint();sync()};

$("sz").oninput=e=>{const v=+e.target.value;$("szv").textContent=v+"×"+v+"×"+v};
$("sz").onchange=async e=>{const v=+e.target.value;if(v===cubeN&&puzzleId==="cube")return;
  while(anim||busy)await sleep(30);
  cubeN=v;closeNav();if(v>=12){toast("Building "+v+"×"+v+"×"+v+"…",0);await sleep(60)}await setPuzzle("cube",false,true)};

// puzzle sidebar
const PUZZLES=[
  {g:"Cubes",items:[{id:"cube",n:"Cube",title:"Cube Solver"},{id:"sudoku",n:"Sudoku Cube",title:"Sudoku Cube"}]},
  {g:"Other twisty puzzles",items:[{id:"pyra",n:"Pyraminx",title:"Pyraminx Solver"},{id:"skewb",n:"Skewb",title:"Skewb Solver"},{id:"mega",n:"Megaminx",title:"Megaminx Solver"}]}
];
const IC=b=>'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+b+'</svg>';
const ICONS={cube:IC('<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12L4 7.5M12 12v9"/>'),sudoku:IC('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9.3 4v16M14.7 4v16M4 9.3h16M4 14.7h16" stroke-width="1.1"/><path d="M6.7 6.7h.01M12 12h.01M17.3 17.3h.01" stroke-width="2.6"/>'),pyra:IC('<path d="M12 3L3 20h18z"/><path d="M7.5 11.5h9M12 11.5V20"/>'),skewb:IC('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 12l8-8 8 8-8 8z"/>'),mega:IC('<path d="M12 3l8.5 6.2-3.2 10H6.7L3.5 9.2z"/><path d="M12 8l4.3 3.1-1.6 5H9.3l-1.6-5z"/>')};
const PZ={},nav=$("nav"),navBtns={};
function getPz(id){const key=id==="cube"?"cube"+cubeN:id==="sudoku"?"sudoku"+sudokuN:id;
  if(!PZ[key]){const p=BUILD[id]();if(id==="cube"){if(cubeN===3)attach3(p);else if(cubeN>3)attachBig(p)}else if(id==="sudoku")attachBig(p);PZ[key]=p}return PZ[key]}
async function setPuzzle(id,first,resize){
  if(!first){if(mode==="solve")await edit();if(anim||busy)return}
  const p=getPz(id);if(!p.hist&&p.hist!==null)p.hist=[];
  pz=p;puzzleId=id;col=pz.solved.slice();start=null;sol=null;ix=0;playing=false;if(!resize)hideToast();
  buildScene();buildPalette();$("pal").hidden=!!pz.sudoku;
  cube.scale.setScalar(pz.scale);zoom=view3d?pz.iso:1;updateCam();
  base=new THREE.Quaternion();if(pz.snap)base=home();cube.quaternion.copy(view3d?Q3():home());

  setMode("paint");pz.hist=[];randomize();
  Object.keys(navBtns).forEach(k=>navBtns[k].classList.toggle("on",k===id));
  PUZZLES.forEach(g=>g.items.forEach(it=>{if(it.id===id)$("ttl").textContent=it.title}));
  hideToast()}
function buildScene(){clearScene();pz.roll=null;pz.rollNew=undefined;if(pz.kind==="cube")buildCubeScene();else buildPolyScene()}
PUZZLES.forEach(grp=>{const h=document.createElement("h3");h.textContent=grp.g;nav.appendChild(h);
  grp.items.forEach(p=>{const b=document.createElement("button");b.className="pz";b.innerHTML='<i class="pi">'+ICONS[p.id]+'</i><span>'+p.n+'</span>';
    b.onclick=()=>{closeNav();if(p.id!==puzzleId)setPuzzle(p.id)};nav.appendChild(b);navBtns[p.id]=b})});
const arh=document.createElement("h3");arh.textContent="Recording";nav.appendChild(arh);
const arow=document.createElement("div");arow.id="arrow";
arow.innerHTML='<span>Video shape</span><select id="ar" aria-label="Video aspect ratio"><option value="720x1280">9:16 · Reels / Stories</option><option value="720x900">4:5 · Feed</option><option value="720x720">1:1 · Square</option><option value="1280x720">16:9 · Landscape</option></select><span>Quality</span><select id="qa" aria-label="Video quality"><option value="1.5">HD · 1080p (sharper)</option><option value="1">Standard · 720p (faster)</option></select><span>Sound</span><select id="sn" aria-label="Sound"><option value="1">Music + move sounds</option><option value="0">Silent</option></select>';
nav.appendChild(arow);
const nfo=document.createElement("p");nfo.className="nf";nfo.textContent="Paint the stickers to match your puzzle, or tap Random, then press Solve.";nav.appendChild(nfo);
navBtns.cube.after($("szrow"));
const sdrow=document.createElement("div");sdrow.id="sdrow";sdrow.innerHTML="<span>Grid</span>";
Object.keys(SUDB).forEach(k=>{const b=document.createElement("button");b.className="sdb"+(+k===sudokuN?" on":"");b.textContent=k;b.setAttribute("aria-label",k+" by "+k+" Sudoku cube");
  b.onclick=async()=>{const v=+k;if(v===sudokuN&&puzzleId==="sudoku"){closeNav();return}
    while(anim||busy)await sleep(30);
    sudokuN=v;[...sdrow.querySelectorAll(".sdb")].forEach(x=>x.classList.toggle("on",x===b));
    closeNav();if(v>=12){toast("Building "+v+"×"+v+"×"+v+"…",0);await sleep(60)}await setPuzzle("sudoku",false,true)};
  sdrow.appendChild(b)});
navBtns.sudoku.after(sdrow);
function openNav(){nav.classList.add("on");$("navscrim").classList.add("on")}
function closeNav(){nav.classList.remove("on");$("navscrim").classList.remove("on")}
$("menu").onclick=openNav;$("navscrim").onclick=closeNav;

document.querySelectorAll(".rqo").forEach(b=>b.onclick=()=>pickRec(b.dataset.m));$("rqx").onclick=()=>$("rq").classList.remove("on");
$("scus").onclick=()=>{$("sopt").hidden=!$("sopt").hidden};
$("srec").onclick=()=>{if(recording){stopReq=true;playing=false}else recordRun()};$("sx").onclick=closeStudio;
$("play").innerHTML=PLAY;
setPuzzle("cube",true);fit();
