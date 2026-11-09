/* Solution playback, sound effects, audio generation and video composition. */

// moves + step-by-step playback
const say=m=>{const g=pz.gens[m.g],k=Math.abs(m.a);return g.label+", "+(k*2===g.order?"half turn":k>1?"double turn "+(m.a>0?"clockwise":"counter-clockwise"):m.a>0?"clockwise":"counter-clockwise")};
function run(m){return new Promise(res=>{busy=true;const g=pz.gens[m.g],ms=partsOf(g);
  ms.forEach(b=>pivot.add(b));
  const d=520/speed*(Math.abs(m.a)>1?1.4:1),ang=-m.a*2*Math.PI/g.order,axv=new THREE.Vector3(g.ax[0],g.ax[1],g.ax[2]),t0=performance.now();
  (function tick(now){const t=Math.min(1,(now-t0)/d),e=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
    pivot.quaternion.setFromAxisAngle(axv,ang*e);
    if(t<1)requestAnimationFrame(tick);
    else{pivot.quaternion.identity();turn(pz,col,m);paint();ms.forEach(b=>cube.add(b));busy=false;res()}})(t0)})}
function renderMoves(){$("moves").innerHTML=sol?sol.map(m=>"<span>"+m.t+"</span>").join(""):"";hl()}
function hl(){if(mode!=="solve")return;const el=$("moves").children;
  for(let i=0;i<el.length;i++)el[i].className=i<ix?"done":i===ix?"cur":"";
  if(el[ix])$("moves").scrollLeft=el[ix].offsetLeft-$("moves").clientWidth/2;
  $("play").innerHTML=playing?PAUSE:PLAY;
  if(sol)$("cap").textContent=ix<sol.length?"Step "+(ix+1)+" of "+sol.length+" · "+sol[ix].t+" · "+say(sol[ix]):"Solved in "+sol.length+" moves"}
async function play(){
  if(!sol||busy&&!playing)return;
  if(playing){playing=false;hl();return}
  if(ix>=sol.length){col=start.slice();paint();ix=0}
  playing=true;hl();
  while(playing&&sol&&ix<sol.length){if(recording)rec.kickTarget=1;await run(sol[ix]);if(!sol)return;audTick();ix++;hl();if(ix>=sol.length&&!recording)audChime();if(playing&&ix<sol.length)await sleep(1100/speed)}
  playing=false;hl();
}
async function step(d){if(busy||!sol)return;playing=false;
  if(d>0&&ix<sol.length){await run(sol[ix]);audTick();ix++;if(ix>=sol.length)audChime()}else if(d<0&&ix>0){await run(inv(pz,sol[ix-1]));audTick();ix--}
  hl()}
async function restart(){if(!sol)return;playing=false;while(busy)await sleep(30);await sleep(30);col=start.slice();paint();ix=0;hl();play()}
function Q3(){return new THREE.Quaternion().setFromEuler(new THREE.Euler(.5,-.65,0))}
function set3dUI(){const b=$("d3");b.hidden=mode!=="paint";b.classList.toggle("on",view3d);b.textContent=view3d?"2D":"3D"}
function setMode(m){mode=m;set3dUI();$("pc").hidden=m!=="paint";$("vc").hidden=m!=="solve"}
async function edit(){if(anim)return;if(recording)stopReq=true;playing=false;while(busy)await sleep(30);await sleep(30);
  if(start)col=start.slice();paint();sol=null;ix=0;setMode("paint");hideToast();base=new THREE.Quaternion();sync();await goTo(view3d?Q3():home(),view3d?pz.iso:1);if(pz.snap)base=home();sync()}

const solvedNow=c=>pz.sudoku?eq(c,pz.solved):uniform(c);
const uniform=c=>{for(let f=0;f<pz.nf;f++)for(let k=1;k<pz.per;k++)if(c[f*pz.per+k]!==c[f*pz.per])return false;return true};
async function solve(rec){
  if(busy||anim)return;
  if(col.includes(-1)){dlg("Colouring incomplete","Some stickers are still grey. Paint every side first. Swipe to reach the other sides.");return}
  const cnt=Array(pz.nf).fill(0);if(!pz.sudoku)col.forEach(c=>cnt[c]++);
  if(!pz.sudoku&&cnt.some(n=>n!==pz.per)){dlg("Wrong colour count","Each colour must appear exactly "+pz.per+" times. Right now: "+cnt.map((n,i)=>pz.cnames[i]+" "+n).join(", ")+".");return}
  if(pz.fixedCentres&&new Set(Array.from({length:pz.nf},(_,f)=>col[pz.centre(f)])).size<pz.nf){dlg("Centres must differ","The centre square of each side must be a different colour. Check the middle square of every side.");return}
  if(solvedNow(col)){toast("This puzzle is already solved.");return}
  if(pz.libMissing&&pz.libMissing()){dlg("Solver not loaded","The solver library didn’t load. Check your connection and reload the page.");return}
  const s0=col.slice();
  if(pz.prep&&!pz.prepped){toast("Preparing the solver. The first time takes a few seconds…",0);await sleep(80);pz.prep();pz.prepped=true}
  else if(!pz.warm&&pz.mlist){toast("Preparing the solver…",0);await sleep(80);pz.warm=true}
  toast("Solving…",0);await sleep(30);
  let r;try{r=pz.solve(s0)}catch(e){r={err:["Something went wrong","The solver hit an unexpected problem. Please try again."]}}
  if(r.err){dlg(r.err[0],r.err[1]);return}
  const chk=s0.slice();r.moves.forEach(m=>turn(pz,chk,m));
  if(!solvedNow(chk)){dlg("Something went wrong","The solution didn’t check out. Please try again.");return}
  if(!r.moves.length){toast("This puzzle is already solved.");return}
  start=s0;sol=r.moves;ix=0;setMode("solve");renderMoves();hideToast();
  await goTo(Q3(),pz.iso);if(rec==="studio")openStudio();else if(rec)recordRun();else play()}


// ---------- sound: generated music bed + move ticks, mixed into the recording ----------
const AUD={ac:null,dst:null,m:null,dl:null,tm:0,beat:0,on:false,lastNote:0};
function audStart(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;const ac=AUD.ac=new A();ac.resume&&ac.resume();
  AUD.dst=ac.createMediaStreamDestination();const m=AUD.m=ac.createGain();m.gain.value=0;
  const lp=ac.createBiquadFilter();lp.type="lowpass";lp.frequency.value=2600;m.connect(lp);lp.connect(AUD.dst);
  const dl=ac.createDelay(1);dl.delayTime.value=.375;const fb=ac.createGain();fb.gain.value=.38;const wet=ac.createGain();wet.gain.value=.34;
  dl.connect(fb);fb.connect(dl);dl.connect(wet);wet.connect(lp);AUD.dl=dl;
  m.gain.setValueAtTime(0,ac.currentTime);m.gain.linearRampToValueAtTime(.9,ac.currentTime+2.5);
  AUD.on=true;AUD.beat=0;AUD.tm=ac.currentTime+.1;AUD.timer=setInterval(audSched,120);audSched();return AUD.dst.stream.getAudioTracks()[0]}catch(e){AUD.on=false;return null}}
const CH=[[57,60,64],[53,57,60],[48,55,64],[55,59,62]],hz=n=>440*Math.pow(2,(n-69)/12);
function audSched(){const ac=AUD.ac;if(!ac||!AUD.on)return;const sp=60/84/2;
  while(AUD.tm<ac.currentTime+.6){const t=AUD.tm,b=AUD.beat,ch=CH[(b>>3)%4];
    if(b%8===0){ch.concat([ch[0]-12]).forEach((n,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.type=i===3?"sine":"triangle";o.frequency.value=hz(n);o.detune.value=(i-1)*4;
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(i===3?.2:.075,t+1.1);g.gain.linearRampToValueAtTime(0,t+sp*8+.5);o.connect(g);g.connect(AUD.m);o.start(t);o.stop(t+sp*8+.6)})}
    if(b%2===0||b%8===3){const seq=[0,1,2,1,2,1,0,2],n=ch[seq[b%8]]+12+(b%16>=8?12:0),o=ac.createOscillator(),g=ac.createGain();o.type="sine";o.frequency.value=hz(n);
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.13,t+.012);g.gain.exponentialRampToValueAtTime(.0008,t+.7);o.connect(g);g.connect(AUD.m);g.connect(AUD.dl);o.start(t);o.stop(t+.8)}
    if(b%4===0){const o=ac.createOscillator(),g=ac.createGain();o.type="sine";o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(48,t+.14);
      g.gain.setValueAtTime(.2,t);g.gain.exponentialRampToValueAtTime(.001,t+.3);o.connect(g);g.connect(AUD.m);o.start(t);o.stop(t+.35)}
    AUD.tm+=sp;AUD.beat++}}
function tickOn(ac,out){const t=ac.currentTime,len=ac.sampleRate*.07|0,buf=ac.createBuffer(1,len,ac.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3);
  const n=ac.createBufferSource();n.buffer=buf;const f=ac.createBiquadFilter();f.type="bandpass";f.frequency.value=1900;f.Q.value=1.3;const g=ac.createGain();g.gain.value=.7;n.connect(f);f.connect(g);g.connect(out);n.start(t);
  [[260,110,.09,.34],[900,420,.04,.14]].forEach(a=>{const o=ac.createOscillator(),g2=ac.createGain();o.type="triangle";o.frequency.setValueAtTime(a[0],t);o.frequency.exponentialRampToValueAtTime(a[1],t+a[2]);
    g2.gain.setValueAtTime(a[3],t);g2.gain.exponentialRampToValueAtTime(.001,t+a[2]+.04);o.connect(g2);g2.connect(out);o.start(t);o.stop(t+a[2]+.06)})}
// live sound (outside recording): one click per move, plus a chime when the puzzle is solved
const SFX={ac:null};
function sfxAc(){if($("sn")&&$("sn").value==="0")return null;try{if(!SFX.ac)SFX.ac=new (window.AudioContext||window.webkitAudioContext)();if(SFX.ac.state==="suspended")SFX.ac.resume();return SFX.ac}catch(e){return null}}
function audTick(){if(recording){if(AUD.ac&&AUD.on)tickOn(AUD.ac,AUD.m);return}const ac=sfxAc();if(ac){const g=ac.createGain();g.gain.value=.8;g.connect(ac.destination);tickOn(ac,g)}}
function chimeOn(ac,out,dly){const t=ac.currentTime;[69,73,76,81].forEach((n,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.type="sine";o.frequency.value=hz(n);
  g.gain.setValueAtTime(0,t+i*.11);g.gain.linearRampToValueAtTime(.2,t+i*.11+.02);g.gain.exponentialRampToValueAtTime(.001,t+i*.11+1.9);o.connect(g);g.connect(out);if(dly)g.connect(dly);o.start(t+i*.11);o.stop(t+i*.11+2)})}
function audChime(){if(recording){if(AUD.ac&&AUD.on)chimeOn(AUD.ac,AUD.m,AUD.dl);return}const ac=sfxAc();if(ac){const g=ac.createGain();g.gain.value=.7;g.connect(ac.destination);chimeOn(ac,g)}}
function audStop(){const ac=AUD.ac;if(!ac)return;AUD.on=false;clearInterval(AUD.timer);try{AUD.m.gain.cancelScheduledValues(ac.currentTime);AUD.m.gain.setValueAtTime(AUD.m.gain.value,ac.currentTime);AUD.m.gain.linearRampToValueAtTime(0,ac.currentTime+.8)}catch(e){}setTimeout(()=>{try{ac.close()}catch(e){}AUD.ac=null},1000)}
// recorder: composites the 3D canvas, background and step caption into a 2D canvas and records it
const rc=document.createElement("canvas");let vidBlob=null,vidName="";
const rec={ph:"",tag:"",label:"",sub:"",prog:0,yaw:-.65,pitch:.45,tt:0,last:0,t0:0,endT:0,endSide:-1,endFromYaw:0,endFromPitch:.45};
const LOGO=["#f4f4f0","#2563eb","#ff8a1f","#27a844","#ffd400","#d7263d","#ff8a1f","#f4f4f0","#27a844"],RF="Roboto,system-ui,sans-serif";
function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
// camera rig: the puzzle orbits smoothly during the solve and eases through a
// deliberate six-side showcase after the final move.
const SHOWCASE=[
  {yaw:0,pitch:.38,label:"Front side"},
  {yaw:Math.PI/2,pitch:.38,label:"Right side"},
  {yaw:Math.PI,pitch:.38,label:"Back side"},
  {yaw:Math.PI*1.5,pitch:.38,label:"Left side"},
  {yaw:Math.PI,pitch:1.05,label:"Top side"},
  {yaw:0,pitch:-.62,label:"Bottom side"}
];
const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
function showcase(n){
  const sideMs=1200,holdMs=280,elapsed=Math.max(0,n-(rec.endT||n));
  const side=Math.min(SHOWCASE.length-1,Math.floor(elapsed/sideMs));
  if(side!==rec.endSide){
    rec.endSide=side;rec.endFromYaw=rec.yaw;rec.endFromPitch=rec.pitch;
  }
  const target=SHOWCASE[side],local=Math.min(1,(elapsed-side*sideMs)/(sideMs-holdMs));
  const e=local<.5?2*local*local:1-Math.pow(-2*local+2,2)/2;
  rec.yaw=rec.endFromYaw+angleDelta(rec.endFromYaw,target.yaw)*e;
  rec.pitch=rec.endFromPitch+(target.pitch-rec.endFromPitch)*e;
  rec.tag=target.label;
}
function rig(){const n=performance.now(),dt=Math.min(.1,(n-(rec.last||n))/1000);rec.last=n;rec.tt+=dt;
  if(rec.ph==="end"){if(!rec.endT){rec.endT=n;rec.endSide=-1;rec.endFromYaw=rec.yaw;rec.endFromPitch=rec.pitch}showcase(n)}
  else{
  const tg=({intro:.45,scr:.75,hold:1.15,solve:.34,end:1.1,prev:.5}[rec.ph]||.4)*(rec.studio&&rec.ph!=="hold"?.45:1);rec.rate=(rec.rate||0)+(tg-(rec.rate||0))*Math.min(1,dt*2.5);rec.yaw+=rec.rate*dt;
  }
  if(rec.studio){if(recording&&rec.ph!=="end")so.yaw+=({intro:.1,scr:.16,hold:.28,solve:.12,end:.22}[rec.ph]||.1)*dt;else if(!recording&&!sptr.size&&n-so.touched>3500)so.yaw+=.06*dt;
    cube.position.y=1.5+(rec.ph==="end"?0:.12*Math.sin(rec.tt*.9));cube.quaternion.setFromEuler(new THREE.Euler(rec.ph==="end"?rec.pitch:0,rec.yaw,0,"YXZ"));return}
  const e=Math.min(1,(n-rec.t0)/2000),ez=e*e*(3-2*e);
  zoom=pz.iso*(1+.3*(1-ez));updateCam();
  cube.quaternion.setFromEuler(new THREE.Euler(rec.ph==="end"?rec.pitch:.45+.9*Math.sin(rec.tt*.5),rec.yaw,0))}
function drawFrame(){const w=rc.width,h=rc.height,g=rc.getContext("2d"),m=Math.min(w,h),hd=Math.round(m*.13),ft=Math.round(m*.25),pad=Math.round(m*.05),
    S=Math.min(w,h-hd-ft),cy=Math.round(hd+(h-hd-ft-S)/2),mid=hd+(h-hd-ft)/2,Y="#ffd400",done=rec.ph==="end";
  const bg=g.createRadialGradient(w/2,mid,m*.05,w/2,h/2,Math.max(w,h)*.75);bg.addColorStop(0,"#2a3d70");bg.addColorStop(.55,"#142040");bg.addColorStop(1,"#080c18");
  if(rec.studio)g.drawImage(sc,0,0,w,h);
  else{g.fillStyle=bg;g.fillRect(0,0,w,h);
  const sw=cv.width,sh=cv.height,s=Math.min(sw,sh);g.drawImage(cv,(sw-s)/2,(sh-s)/2,s,s,Math.round((w-S)/2),cy,S,S)}
  if(rec.studio){const vg=g.createRadialGradient(w/2,h/2,Math.min(w,h)*.38,w/2,h/2,Math.max(w,h)*.78);vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,"rgba(0,0,0,.42)");g.fillStyle=vg;g.fillRect(0,0,w,h);}
  // header
  if(rec.studio){const q=g.createLinearGradient(0,0,0,hd*1.7);q.addColorStop(0,"rgba(8,12,24,.85)");q.addColorStop(1,"rgba(8,12,24,0)");g.fillStyle=q;g.fillRect(0,0,w,hd*1.7)}
  else{g.fillStyle="rgba(8,12,24,.7)";g.fillRect(0,0,w,hd);g.fillStyle="rgba(255,255,255,.1)";g.fillRect(0,hd-1,w,1)}
  const ls=Math.round(hd*.52),u=ls/3,ly=(hd-ls)/2;g.save();rr(g,pad,ly,ls,ls,Math.round(ls*.18));g.clip();
  LOGO.forEach((c,i)=>{g.fillStyle=c;g.fillRect(pad+(i%3)*u,ly+Math.floor(i/3)*u,u-1,u-1)});g.restore();
  const tx=pad+ls+Math.round(pad*.5);g.textBaseline="middle";g.textAlign="left";
  g.fillStyle="#fff";g.font="600 "+Math.round(m*.043)+"px "+RF;g.fillText($("ttl").textContent,tx,hd*.38);
  g.fillStyle="rgba(255,255,255,.62)";g.font="400 "+Math.round(m*.026)+"px "+RF;g.fillText("Step-by-step solution",tx,hd*.7);
  if(rec.tag){const fs=Math.round(m*.026);g.font="600 "+fs+"px "+RF;const tw=g.measureText(rec.tag).width+fs*1.7,th=fs*2.1;
    rr(g,w-pad-tw,(hd-th)/2,tw,th,Math.round(th*.22));g.fillStyle=done?"#27a844":Y;g.fill();
    g.fillStyle=done?"#fff":"#1d1c1a";g.textAlign="center";g.fillText(rec.tag,w-pad-tw/2,hd/2+1)}
  // footer
  const fy=h-ft,solving=rec.ph==="solve"&&sol,n=sol?sol.length:0,pr=solving?Math.min(1,ix/n):done?1:rec.prog,bw=w-2*pad,bh=Math.max(5,Math.round(m*.009));
  if(rec.studio){const q=g.createLinearGradient(0,fy-ft*.45,0,h);q.addColorStop(0,"rgba(8,12,24,0)");q.addColorStop(.5,"rgba(8,12,24,.8)");q.addColorStop(1,"rgba(8,12,24,.9)");g.fillStyle=q;g.fillRect(0,fy-ft*.45,w,ft*1.45)}
  else{g.fillStyle="rgba(8,12,24,.78)";g.fillRect(0,fy,w,ft);g.fillStyle="rgba(255,255,255,.1)";g.fillRect(0,fy,w,1)}
  const by=fy+Math.round(ft*.1);g.fillStyle="rgba(255,255,255,.16)";rr(g,pad,by,bw,bh,bh/2);g.fill();
  if(pr>0){g.fillStyle=done?"#27a844":Y;rr(g,pad,by,Math.max(bh,bw*pr),bh,bh/2);g.fill()}
  g.textBaseline="middle";
  if(solving){const cur=Math.min(ix,n-1),cf=Math.round(m*.056),sf=Math.round(m*.04),gp=Math.round(m*.018),yc=fy+ft*.55;
    g.font="500 "+Math.round(m*.027)+"px "+RF;g.fillStyle="rgba(255,255,255,.7)";g.textAlign="left";g.fillText("Step "+(cur+1)+" of "+n,pad,fy+ft*.28);
    g.textAlign="right";g.fillText(Math.round(pr*100)+"%",w-pad,fy+ft*.28);
    const it=[];for(let o=-2;o<=2;o++){const k=cur+o;if(k<0||k>=n)continue;const f=o?sf:cf;g.font="600 "+f+"px "+RF;it.push({o,t:sol[k].t,f,w:g.measureText(sol[k].t).width+f*1.3,h:f*1.9})}
    const C=it.find(x=>!x.o);let x0=w/2-C.w/2;const pos=new Map([[0,x0]]);
    for(let o=1;o<=2;o++){const q=it.find(x=>x.o===o);if(q){const pv=it.find(x=>x.o===o-1);pos.set(o,pos.get(o-1)+pv.w+gp)}}
    for(let o=-1;o>=-2;o--){const q=it.find(x=>x.o===o);if(q)pos.set(o,pos.get(o+1)-gp-q.w)}
    it.forEach(q=>{const x=pos.get(q.o);g.globalAlpha=q.o?(Math.abs(q.o)===1?.6:.3):1;rr(g,x,yc-q.h/2,q.w,q.h,Math.round(q.h*.2));
      g.fillStyle=q.o?"rgba(255,255,255,.14)":Y;g.fill();g.fillStyle=q.o?"#fff":"#1d1c1a";g.font="600 "+q.f+"px "+RF;g.textAlign="center";g.fillText(q.t,x+q.w/2,yc+1)});
    g.globalAlpha=1;g.font="400 "+Math.round(m*.03)+"px "+RF;g.fillStyle="rgba(255,255,255,.78)";g.textAlign="center";g.fillText(say(sol[cur]),w/2,fy+ft*.87)}
  else{g.textAlign="center";g.fillStyle="#fff";g.font="600 "+Math.round(m*.06)+"px "+RF;g.fillText(done?"Solved in "+n+" moves":rec.label,w/2,fy+ft*.5);
    g.fillStyle="rgba(255,255,255,.68)";g.font="400 "+Math.round(m*.031)+"px "+RF;g.fillText(done?"Follow along with each step":rec.sub,w/2,fy+ft*.76)}
  // title card that fades out over the first two seconds
  if(rec.ph==="intro"){const p=Math.min(1,(performance.now()-rec.t0)/2000),a=Math.max(0,1-p*1.25);
    g.fillStyle="rgba(8,12,24,"+(.8*a)+")";g.fillRect(0,hd,w,h-hd-ft);g.globalAlpha=a;g.textAlign="center";
    g.fillStyle=Y;g.font="600 "+Math.round(m*.034)+"px "+RF;g.fillText("Step-by-step solution",w/2,mid-m*.07);
    g.fillStyle="#fff";g.font="700 "+Math.round(m*.09)+"px "+RF;g.fillText($("ttl").textContent.replace(/ Solver$/,""),w/2,mid+m*.01);
    g.fillStyle="rgba(255,255,255,.75)";g.font="400 "+Math.round(m*.036)+"px "+RF;g.fillText((sol?sol.length:0)+" moves · every angle",w/2,mid+m*.09);g.globalAlpha=1}}
