(()=>{
const $=id=>document.getElementById(id);
const show=id=>{['menu','pause','over','err'].forEach(k=>$(k).classList.toggle('on',k===id))};
if(!window.THREE){show('err');return}
// ---- save (versioned, validated)
const KEY='jungle-rush-save';let S={v:1,best:0,bestDist:0,coins:0,gems:0,bestCoins:0,sound:true};
try{const d=JSON.parse(localStorage.getItem(KEY));if(d&&d.v===1)for(const k in S)if(typeof d[k]===typeof S[k])S[k]=d[k]}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
// ---- audio
let ac;const beep=(f,d=.08,t='square',v=.05)=>{if(!S.sound)return;try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),g=ac.createGain();o.type=t;o.frequency.value=f;g.gain.value=v;g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+d);o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+d)}catch(e){}};
// ---- renderer
let R;try{R=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'})}catch(e){show('err');return}
R.setPixelRatio(Math.min(devicePixelRatio||1,1.5));R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.35;document.body.prepend(R.domElement);
const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(68,1,.1,160);
scene.fog=new THREE.Fog(0x4f8a62,20,105);scene.background=new THREE.Color(0x4f8a62);
scene.add(new THREE.HemisphereLight(0xdfffd0,0x2a3a1a,.9));
const sun=new THREE.DirectionalLight(0xfff0c0,.9);sun.position.set(-6,12,4);scene.add(sun);
function resize(){const w=innerWidth,h=innerHeight;R.setSize(w,h);cam.aspect=w/h;cam.fov=w/h<.8?72:60;cam.updateProjectionMatrix()}
addEventListener('resize',resize);resize();
// ---- materials/geometry
const M=(c,o={})=>new THREE.MeshLambertMaterial(Object.assign({color:c},o));
const rnd=Math.random;
function tex(w,draw,rx,ry){const c=document.createElement('canvas');c.width=c.height=w;draw(c.getContext('2d'),w);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.anisotropy=2;return t}
const moss=(x,w,n)=>{for(let i=0;i<n;i++){x.fillStyle=`rgba(${40+rnd()*40|0},${100+rnd()*70|0},40,${.2+rnd()*.35})`;x.beginPath();x.arc(rnd()*w,rnd()*w,3+rnd()*14,0,7);x.fill()}};
const dStone=(x,w)=>{x.fillStyle='#26251d';x.fillRect(0,0,w,w);const bh=w/4,bw=w/2;for(let r=0;r<4;r++)for(let k=-1;k<3;k++){const s=105+rnd()*45|0;x.fillStyle=`rgb(${s+20},${s+8},${s-18})`;x.fillRect(k*bw+(r%2)*bw/2+2,r*bh+2,bw-4,bh-4)}moss(x,w,70);for(let i=0;i<300;i++){x.fillStyle=`rgba(0,0,0,${rnd()*.15})`;x.fillRect(rnd()*w,rnd()*w,2,2)}};
const tPath=tex(256,dStone,2,7),tPil=tex(256,dStone,1,3);
const tGrass=tex(128,(x,w)=>{x.fillStyle='#3d7a30';x.fillRect(0,0,w,w);for(let i=0;i<500;i++){x.strokeStyle=`rgba(${40+rnd()*60|0},${110+rnd()*90|0},${30+rnd()*30|0},.6)`;const a=rnd()*w,b=rnd()*w;x.beginPath();x.moveTo(a,b);x.lineTo(a+rnd()*4-2,b-3-rnd()*6);x.stroke()}moss(x,w,12)},18,6);
const tBark=tex(64,(x,w)=>{x.fillStyle='#5a3a1e';x.fillRect(0,0,w,w);for(let i=0;i<40;i++){x.fillStyle=`rgba(${rnd()<.5?20:90},${rnd()<.5?10:60},10,.5)`;x.fillRect(rnd()*w,0,1+rnd()*3,w)}},1,2);
const tLeaf=tex(64,(x,w)=>{x.fillStyle='#2c7a2c';x.fillRect(0,0,w,w);for(let i=0;i<200;i++){x.fillStyle=`rgba(${30+rnd()*60|0},${110+rnd()*100|0},40,.6)`;x.beginPath();x.arc(rnd()*w,rnd()*w,1+rnd()*3,0,7);x.fill()}},3,3);
const mGround=M(0xb8e0a0,{map:tGrass}),mPath=M(0xffffff,{map:tPath}),mTrunk=M(0xffffff,{map:tBark}),mLeaf=M(0xffffff,{map:tLeaf}),mStone=M(0xffffff,{map:tPil}),mWater=M(0x3aa0c0,{transparent:true,opacity:.8}),
mLog=M(0x7a4a22),mRock=M(0x777a73),mBranch=M(0x4a2e14),mGold=M(0xffc400,{emissive:0x553300}),mGem=M(0xb06bff,{emissive:0x5a22aa}),mShield=M(0x44ccff,{emissive:0x114466}),mMag=M(0xff4466,{emissive:0x440011});
const box=(w,h,d,m)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
const gTrunk=new THREE.CylinderGeometry(.4,.6,6,6),gCone=new THREE.ConeGeometry(2.4,5,7),gPil=new THREE.BoxGeometry(1.4,7,1.4),gPlane=new THREE.PlaneGeometry(1,1);const gVine=new THREE.CylinderGeometry(.05,.05,3,4),gBush=new THREE.IcosahedronGeometry(1,0);
// ---- themes: 0 trail, 1 temple, 2 river
const TH=[{g:0xb8e0a0,f:0x4f8a62},{g:0xd0c8a0,f:0x7f9a6a},{g:0x9fd0c0,f:0x4f9aa0}];
const cur={g:new THREE.Color(TH[0].g),f:new THREE.Color(TH[0].f)};
const SEGL=30,NSEG=6,segs=[];
function decorate(s,th){s.trees.visible=th!==1;s.pil.visible=th===1;s.water.visible=th===2;s.arch.visible=th!==2&&rnd()<.5;s.bush.children.forEach(b=>{b.position.z=(rnd()-.5)*SEGL});
 s.trees.children.forEach(t=>{t.position.z=(Math.random()-.5)*SEGL})}
for(let i=0;i<NSEG;i++){const g=new THREE.Group();
 const gr=new THREE.Mesh(gPlane,mGround);gr.rotation.x=-Math.PI/2;gr.scale.set(90,SEGL,1);g.add(gr);
 const pa=new THREE.Mesh(gPlane,mPath);pa.rotation.x=-Math.PI/2;pa.position.y=.02;pa.scale.set(7.4,SEGL,1);g.add(pa);
 const trees=new THREE.Group(),pil=new THREE.Group(),water=new THREE.Group();
 for(let k=0;k<10;k++){const side=k%2?1:-1,t=new THREE.Group(),tr=new THREE.Mesh(gTrunk,mTrunk);tr.position.y=3;const c=new THREE.Mesh(gCone,mLeaf);c.position.y=7.5;t.add(tr,c);t.position.x=side*(7+Math.random()*10);t.scale.setScalar(.8+Math.random()*.7);trees.add(t)}
 for(let k=0;k<6;k++){const p=new THREE.Mesh(gPil,mStone);p.position.set((k%2?1:-1)*(6.2+(k>>1)*.2),3.5,-12+(k>>1)*12);pil.add(p)}
 for(const sx of[-1,1]){const w=new THREE.Mesh(gPlane,mWater);w.rotation.x=-Math.PI/2;w.position.set(sx*9,.05,0);w.scale.set(8,SEGL,1);water.add(w)}
 const arch=new THREE.Group(),bush=new THREE.Group();
 for(const sx of[-1,1]){const p=box(1.6,8,1.6,mStone);p.position.set(sx*4.9,4,0);arch.add(p)}
 const lin=box(11.4,1.6,1.8,mStone);lin.position.y=8.6;arch.add(lin);
 for(let k=0;k<7;k++){const v=new THREE.Mesh(gVine,mLeaf);v.position.set(-4.5+k*1.5,7.2-rnd(),.1);v.scale.y=.6+rnd();arch.add(v)}
 arch.position.z=-6;
 for(let k=0;k<14;k++){const b=new THREE.Mesh(gBush,mLeaf);b.position.set((k%2?1:-1)*(4.6+rnd()*3.5),.4,0);b.scale.set(1+rnd(),.6+rnd()*.5,1+rnd());bush.add(b)}
 g.add(trees,pil,water,arch,bush);g.position.z=15-i*SEGL;g.trees=trees;g.pil=pil;g.water=water;g.arch=arch;g.bush=bush;decorate(g,0);scene.add(g);segs.push(g)}
// ---- player (procedural articulated explorer)
const P=new THREE.Group(),skin=M(0xe0b080),shirt=M(0xb8903c),pants=M(0x9a7a3c),hat=M(0x7a5426);
const body=box(.7,.9,.4,shirt);body.position.y=1.25;
const head=new THREE.Mesh(new THREE.SphereGeometry(.28,10,8),skin);head.position.y=1.9;
const brim=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.06,10),hat);brim.position.y=2.03;
const crown=new THREE.Mesh(new THREE.CylinderGeometry(.26,.3,.2,10),hat);crown.position.y=2.12;
const pack=box(.5,.6,.3,M(0x556b2f));pack.position.set(0,1.3,.33);
function limb(x,y,w,h,m){const g=new THREE.Group();g.position.set(x,y,0);const l=box(w,h,w,m);l.position.y=-h/2;g.add(l);return g}
const legL=limb(-.18,.85,.25,.85,pants),legR=limb(.18,.85,.25,.85,pants),armL=limb(-.47,1.6,.2,.7,skin),armR=limb(.47,1.6,.2,.7,skin);
[legL,legR].forEach(l=>{const b=box(.3,.22,.42,M(0x3a2412));b.position.set(0,-.78,-.06);l.add(b)});
const shadow=new THREE.Mesh(new THREE.CircleGeometry(.6,12),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.35}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.04;
const Pm=new THREE.Group();Pm.add(body,head,brim,crown,pack,legL,legR,armL,armR);P.add(Pm,shadow);scene.add(P);
const shieldMesh=new THREE.Mesh(new THREE.SphereGeometry(1.3,12,10),new THREE.MeshBasicMaterial({color:0x44ccff,transparent:true,opacity:.25}));shieldMesh.position.y=1.1;shieldMesh.visible=false;P.add(shieldMesh);
// ---- pools & items
const pools={},items=[];
function take(k,f){const p=pools[k]||(pools[k]=[]);const m=p.pop()||f();scene.add(m);return m}
function give(k,m){scene.remove(m);(pools[k]||(pools[k]=[])).push(m)}
const LX=[-2.4,0,2.4];
const mk={
 log:()=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,2.2,8),mLog);m.rotation.z=Math.PI/2;const g=new THREE.Group();g.add(m);m.position.y=.5;return g},
 rock:()=>{const g=new THREE.Group(),r=new THREE.Mesh(new THREE.DodecahedronGeometry(1.3),mRock);r.position.y=1.1;r.scale.set(1,1.2,1);g.add(r);return g},
 branch:()=>{const g=new THREE.Group(),b=box(2.3,.5,.5,mBranch);b.position.y=1.35;const a=box(.3,1.3,.3,mBranch);a.position.set(-1,.65,0);const c=box(.3,1.3,.3,mBranch);c.position.set(1,.65,0);g.add(b,a,c);return g},
 coin:()=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(.4,.4,.1,12),mGold);m.rotation.x=Math.PI/2;const g=new THREE.Group();g.add(m);return g},
 shield:()=>{const g=new THREE.Group(),m=new THREE.Mesh(new THREE.OctahedronGeometry(.5),mShield);g.add(m);return g},
 magnet:()=>{const g=new THREE.Group(),m=new THREE.Mesh(new THREE.TorusGeometry(.35,.15,6,10),mMag);g.add(m);return g}};
mk.gem=()=>{const g=new THREE.Group(),m=new THREE.Mesh(new THREE.OctahedronGeometry(.45),mGem);m.scale.y=1.4;g.add(m);return g};
const DEPTH={log:1.2,rock:1.8,branch:.8,coin:.8,shield:.8,magnet:.8,gem:.8};
function add(k,lane,z,y=0){const m=take(k,mk[k]);m.position.set(LX[lane],y||(k==='coin'||k==='shield'||k==='magnet'||k==='gem'?1.1:0),z);items.push({k,m,lane,z,y:m.position.y})}
// ---- atmosphere: light shafts, falling leaves/dust, waterfall, mountains, parrot
const rayTex=tex(64,(x,w)=>{const g=x.createLinearGradient(0,0,w,0);g.addColorStop(0,'rgba(255,240,170,0)');g.addColorStop(.5,'rgba(255,240,170,.9)');g.addColorStop(1,'rgba(255,240,170,0)');x.fillStyle=g;x.fillRect(0,0,w,w)},1,1);
const rays=new THREE.Group();for(let i=0;i<5;i++){const m=new THREE.Mesh(gPlane,new THREE.MeshBasicMaterial({map:rayTex,transparent:true,opacity:.13,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));m.scale.set(3+rnd()*3,22,1);m.position.set(-10+i*5,10,-6-i*9);m.rotation.z=.35;rays.add(m)}scene.add(rays);
const NP=90,pg=new THREE.BufferGeometry(),pArr=new Float32Array(NP*3);for(let i=0;i<NP*3;i+=3){pArr[i]=(rnd()-.5)*24;pArr[i+1]=rnd()*9;pArr[i+2]=-rnd()*40}
pg.setAttribute('position',new THREE.BufferAttribute(pArr,3));
const parts=new THREE.Points(pg,new THREE.PointsMaterial({color:0xcfe88a,size:.16,transparent:true,opacity:.8,fog:false}));parts.frustumCulled=false;scene.add(parts);
const fallTex=tex(64,(x,w)=>{x.fillStyle='#bfe6ee';x.fillRect(0,0,w,w);for(let i=0;i<40;i++){x.fillStyle=`rgba(255,255,255,${.3+rnd()*.6})`;x.fillRect(rnd()*w,0,1+rnd()*3,w)}},1,1);
const fall=new THREE.Mesh(gPlane,new THREE.MeshBasicMaterial({map:fallTex,transparent:true,opacity:.9}));fall.scale.set(8,34,1);fall.position.x=16;fall.position.y=14;scene.add(fall);
const mts=new THREE.Group();[[-34,22,26],[0,30,34],[34,18,24]].forEach(a=>{const c=new THREE.Mesh(new THREE.ConeGeometry(a[2],a[1]*2,6),M(0x35564f));c.position.set(a[0],a[1]-6,0);mts.add(c)});scene.add(mts);
const par=new THREE.Group(),pb=new THREE.Mesh(new THREE.SphereGeometry(.25,8,6),M(0xd22a1a));pb.scale.set(.7,.7,1.5);
const wL=box(.9,.05,.35,M(0xe03a22)),wR=box(.9,.05,.35,M(0xe03a22));wL.geometry.translate(-.45,0,0);wR.geometry.translate(.45,0,0);
const tail=box(.12,.04,.8,M(0x2a6ad0));tail.position.z=.7;par.add(pb,wL,wR,tail);scene.add(par);
// ---- game state
let st='menu',speed,dist,coins,gems,score,nextZ,pz,px,py,vy,lane,sliding,slideT,sT,mult,shieldOn,magT,hitFlash,run=0,shake=0,avoided=0,lastLog=0;
const spawnRow=()=>{
 const gap=17+speed*.55,d=Math.min(1,dist/1500),r=Math.random();let z=nextZ;
 const types=['log','branch','rock'];
 if(dist<60){nextZ-=gap;return}  // safe warm-up
 if(r<.38){add(types[Math.random()*3|0],Math.random()*3|0,z)}
 else if(r<.78){ // two rocks max or a full-width jump/slide
  const t=types[Math.random()*3|0];const free=Math.random()*3|0;
  for(let l=0;l<3;l++){ if(t==='rock'&&l===free)continue; add(t,l,z)}}
 else {const pl=Math.random()*3|0;add(Math.random()<.5?'shield':'magnet',pl,z)}
 // coin trail mid-gap in a lane
 if(Math.random()<.7){const cl=Math.random()*3|0;for(let i=0;i<5;i++)add('coin',cl,z-gap*.3-i*1.8);if(Math.random()<.2)add('gem',cl,z-gap*.3-9.5)}
 nextZ-=gap-d*3};
function reset(){items.forEach(i=>give(i.k,i.m));items.length=0;speed=14;dist=0;coins=0;gems=0;score=0;pz=0;px=0;py=0;vy=0;lane=1;sliding=false;slideT=0;sT=0;mult=1;shieldOn=false;magT=0;hitFlash=0;avoided=0;nextZ=-50;
 while(nextZ>-170)spawnRow();segs.forEach((s,i)=>{s.position.z=15-i*SEGL})}
function start(){reset();st='play';show('none');$('hud').style.display='flex'}
function end(){st='over';beep(110,.5,'sawtooth',.08);shake=.6;S.coins+=coins;S.gems+=gems;if(coins>S.bestCoins)S.bestCoins=coins;const nb=score>S.best;if(nb)S.best=score;if(dist>S.bestDist)S.bestDist=dist|0;save();
 $('ovs').innerHTML=`Score: <b>${score}</b><br>Distance: ${dist|0} m<br>Coins: ${coins} · 💎 ${gems}<br>${nb?'🏆 New best score!':'Best: '+S.best}`;setTimeout(()=>{if(st==='over')show('over')},600)}
function menu(){st='menu';$('hud').style.display='none';$('mb').textContent=S.best;$('mc').textContent=S.coins;const mi=[['Run 500 m',S.bestDist>=500],['Collect 50 coins in one run',S.bestCoins>=50],['Collect 3 gems (total)',S.gems>=3]];$('ms').innerHTML='<b>Missions</b> (saved on this device)<br>'+mi.map(m=>(m[1]?'✅ ':'⬜ ')+m[0]).join('<br>');$('snd').textContent='🔊 Sound: '+(S.sound?'on':'off');reset();show('menu')}
function pause(){if(st==='play'){st='pause';show('pause')}}
function resume(){if(st==='pause'){st='play';show('none')}}
// ---- input
function act(a){if(st!=='play')return;
 if(a==='l'&&lane>0){lane--;beep(440,.05)}
 else if(a==='r'&&lane<2){lane++;beep(520,.05)}
 else if(a==='u'&&py<.05&&!sliding){vy=14.5;beep(660,.1,'sine')}
 else if(a==='d'){if(py>.05)vy=-26;else if(!sliding){sliding=true;slideT=.7;beep(220,.1,'sine')}}}
addEventListener('keydown',e=>{const k=e.key;if(k==='ArrowLeft'||k==='a')act('l');else if(k==='ArrowRight'||k==='d')act('r');else if(k==='ArrowUp'||k==='w'||k===' ')act('u');else if(k==='ArrowDown'||k==='s')act('d');else if(k==='p'||k==='Escape')st==='play'?pause():resume()});
let t0=null;const cv=R.domElement;
cv.addEventListener('touchstart',e=>{e.preventDefault();const t=e.changedTouches[0];t0={x:t.clientX,y:t.clientY}},{passive:false});
cv.addEventListener('touchmove',e=>{e.preventDefault();if(!t0)return;const t=e.changedTouches[0],dx=t.clientX-t0.x,dy=t.clientY-t0.y;
 if(Math.max(Math.abs(dx),Math.abs(dy))<26)return;
 act(Math.abs(dx)>Math.abs(dy)?(dx<0?'l':'r'):(dy<0?'u':'d'));t0=null},{passive:false});
cv.addEventListener('touchend',()=>{t0=null});
$('play').onclick=start;$('again').onclick=start;$('rs2').onclick=start;$('res').onclick=resume;$('pb').onclick=pause;$('mn1').onclick=menu;$('mn2').onclick=menu;
$('snd').onclick=()=>{S.sound=!S.sound;save();menu()};
$('rst').onclick=()=>{if(confirm('Erase best score and coins?')){S.best=0;S.bestDist=0;S.coins=0;save();menu()}};
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
document.addEventListener('contextmenu',e=>e.preventDefault());
// ---- loop
let last=performance.now();
function frame(now){requestAnimationFrame(frame);let dt=Math.min(.05,(now-last)/1000);last=now;run+=dt;
 const playing=st==='play';
 if(playing){
  speed=Math.min(32,14+dist/90)*(1);pz-=speed*dt;dist=-pz;
  vy-=38*dt;py+=vy*dt;if(py<=0){py=0;vy=0}
  if(sliding){slideT-=dt;if(slideT<=0)sliding=false}
  px+=(LX[lane]-px)*Math.min(1,dt*14);
  if(magT>0)magT-=dt;
  while(nextZ>pz-170)spawnRow();
  score=Math.floor(dist)+coins*10+gems*50;
  // items
  for(let i=items.length-1;i>=0;i--){const it=items[i],m=it.m,dz=Math.abs(it.z-pz),ix=LX[it.lane];
   if(it.k==='coin'||it.k==='shield'||it.k==='magnet'||it.k==='gem'){
    m.rotation.y+=dt*4;
    if(magT>0&&it.k==='coin'&&dz<8){it.z+=(pz-it.z)*dt*6;m.position.x+=(px-m.position.x)*dt*6;m.position.z=it.z;m.position.y+=(1.1-m.position.y)*dt*6}
    if(Math.abs(it.z-pz)<1&&Math.abs(m.position.x-px)<1.2&&py<2.2){
     if(it.k==='coin'){coins++;beep(900,.06,'sine')}
     else if(it.k==='gem'){gems++;beep(1200,.15,'sine')}else if(it.k==='shield'){shieldOn=true;beep(700,.2,'sine')}
     else{magT=8;beep(300,.2,'sine')}
     give(it.k,m);items.splice(i,1);continue}}
   else if(dz<DEPTH[it.k]/2+.35&&Math.abs(ix-px)<1){
    const hit=it.k==='log'?py<.85:it.k==='rock'?py<2.4:!sliding&&py<1.6;
    if(hit){ if(shieldOn){shieldOn=false;shake=.35;beep(180,.15,'sawtooth');give(it.k,m);items.splice(i,1);continue}
     end();break}}
   if(it.z>pz+10){give(it.k,m);items.splice(i,1)}}
  if(st==='play'){$('sc').textContent=score;$('di').textContent=(dist|0)+' m';$('co').textContent='🪙 '+coins+'  💎 '+gems;
   $('pw').innerHTML=(shieldOn?'🛡️ Shield<br>':'')+(magT>0?'🧲 Magnet '+Math.ceil(magT)+'s':'')}
 }
 // segments & theme
 const th=Math.floor(dist/500)%3;cur.g.lerp(new THREE.Color(TH[th].g),dt*.8);cur.f.lerp(new THREE.Color(TH[th].f),dt*.8);
 mGround.color.copy(cur.g);scene.fog.color.copy(cur.f);scene.background.copy(cur.f);
 for(const s of segs)if(s.position.z>pz+45){s.position.z-=SEGL*NSEG;decorate(s,th)}
 // player pose
 P.position.set(px,py,pz);const ph=run*(7+speed*.25);
 if(st==='over'){Pm.rotation.x=-.6;Pm.position.y=-.2}
 else if(py>.05){legL.rotation.x=-.9;legR.rotation.x=.5;armL.rotation.x=-2.4;armR.rotation.x=-2.4;Pm.rotation.x=0;Pm.position.y=0}
 else if(sliding){Pm.rotation.x=1.25;Pm.position.y=-.55;legL.rotation.x=legR.rotation.x=0;armL.rotation.x=armR.rotation.x=-1.4}
 else{Pm.rotation.x=.12;Pm.position.y=Math.abs(Math.sin(ph))*.08;const a=Math.sin(ph)*.9;legL.rotation.x=a;legR.rotation.x=-a;armL.rotation.x=-a;armR.rotation.x=a}
 P.rotation.z=(LX[lane]-px)*-.06;shieldMesh.visible=shieldOn;shadow.position.y=.04-py;shadow.scale.setScalar(Math.max(.4,1-py*.2));
 // camera
 shake=Math.max(0,shake-dt);const sk=shake*(Math.random()-.5)*.6;
 cam.position.set(px*.6+sk,4.3+py*.3,pz+7.5);cam.lookAt(px*.4,1.4,pz-9);
 rays.position.z=pz;fall.position.z=pz-95;mts.position.z=pz-110;
 par.position.set(px-5+Math.sin(run*.7)*2,4.5+Math.sin(run*2)*.5,pz-14+Math.sin(run*.5)*4);wL.rotation.z=Math.sin(run*14)*.7;wR.rotation.z=-wL.rotation.z;
 const arr=pg.attributes.position.array;for(let i=0;i<NP*3;i+=3){arr[i+1]-=dt*.8;arr[i]+=dt*.4;arr[i+2]+=dt*(playing?speed:0)*.6;if(arr[i+1]<0)arr[i+1]=9;if(arr[i+2]>8)arr[i+2]=-40;if(arr[i]>12)arr[i]=-12}pg.attributes.position.needsUpdate=true;parts.position.z=pz;
 R.render(scene,cam)}
if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('sw.js').catch(()=>{});
menu();requestAnimationFrame(frame);
})();
