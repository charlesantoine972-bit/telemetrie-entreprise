/* Hub : classement, fiche chauffeur, Ma VTC, tablette, carte simulée (pages en préparation).
   Fonctions et déclarations déplacées telles quelles depuis app/index.html.
   Le branchement au démarrage (boutons, état initial, premiers affichages) est dans app/demarrage.js. */

const DRIVERS = [
  { id:'lucas',  name:'Lucas_R',    ini:'LR', truck:'Scania S 650',      loaded:6840, empty:1210, deliveries:21, money:184300, fuel:2410, damage:1.2, hours:112, online:true },
  { id:'karim',  name:'Karim.T',    ini:'KT', truck:'Volvo FH16',        loaded:5920, empty:1890, deliveries:18, money:151900, fuel:2380, damage:2.1, hours:109, online:false },
  { id:'sophie', name:'Sophie M.',  ini:'SM', truck:'DAF XG+',           loaded:5310, empty:740,  deliveries:19, money:162400, fuel:1840, damage:0.6, hours:88,  online:true },
  { id:'nico',   name:'Nico972',    ini:'N9', truck:'Renault T High',    loaded:4180, empty:1650, deliveries:12, money:103700, fuel:1910, damage:3.4, hours:84,  online:true },
  { id:'antoine',name:'Antoine B.', ini:'AB', truck:'Mercedes Actros',   loaded:3990, empty:980,  deliveries:14, money:118200, fuel:1520, damage:1.0, hours:71,  online:false },
  { id:'jade',   name:'Jade_L',     ini:'JL', truck:'MAN TGX',           loaded:2750, empty:1320, deliveries:9,  money:74600,  fuel:1290, damage:1.8, hours:60,  online:false },
];
const PERIOD_FACTOR = { semaine:0.24, mois:1, total:7.3 };
/* ---------- Ma VTC : onglets Missions / Convois / Défis & duels ---------- */
const VTC_TABS = [['missions', 'Missions'], ['convois', 'Convois'], ['defis', 'Défis & duels'], ['classement', 'Classement'], ['carte', 'Chauffeurs live']];
let vtcTab = 'missions';
function renderVtcBars(active){
  document.querySelectorAll('.vtcbar').forEach(bar => {
    bar.innerHTML = VTC_TABS.map(([k, l]) => `<button data-vtab="${k}" class="${k === active ? 'on' : ''}">${l}</button>`).join('');
    bar.querySelectorAll('[data-vtab]').forEach(b => b.onclick = () => openVtcTab(b.dataset.vtab));
  });
}
function openVtcTab(tab){
  vtcTab = tab;
  if (tab === 'classement' || tab === 'carte') { go(tab); return; }
  if (state.view !== 'vtc') go('vtc');
  const d = SOON[tab];
  document.getElementById('vtcText').textContent = d.d;
  document.getElementById('vtcList').innerHTML = d.l.map(x => '<li>' + x + '</li>').join('');
  renderVtcBars(tab);
}
/* ---------- classement ---------- */
function scaled(d){ const f = PERIOD_FACTOR[state.period];
  return { ...d, loaded:Math.round(d.loaded*f), empty:Math.round(d.empty*f), deliveries:Math.round(d.deliveries*f) }; }
function val(d){ return state.metric==='loaded'?d.loaded : state.metric==='empty'?d.empty : state.metric==='deliveries'?d.deliveries : d.loaded+d.empty; }
function renderRanking(){
  const periods = [['semaine','Cette semaine'],['mois','Ce mois'],['total','Depuis le début']];
  document.getElementById('periods').innerHTML = periods.map(([k,l]) =>
    `<button class="pill ${state.period===k?'on':''}" data-p="${k}">${l}</button>`).join('');
  document.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { state.period=b.dataset.p; renderRanking(); });

  const tabs = [['total','Km total'],['loaded','Chargés'],['empty','À vide'],['deliveries','Livraisons']];
  document.getElementById('tabs').innerHTML = tabs.map(([k,l]) =>
    `<button class="tab ${state.metric===k?'on':''}" data-m="${k}">${l}</button>`).join('');
  document.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { state.metric=b.dataset.m; renderRanking(); });

  const medal = ['var(--warn)','#C9D2DB','#D9925B'];
  const rows = DRIVERS.map(scaled).sort((a,b) => val(b)-val(a));
  document.getElementById('ranking').innerHTML = rows.map((d,i) => {
    const v = val(d), pct = Math.round(d.loaded/(d.loaded+d.empty)*100);
    return `<button class="item" data-d="${d.id}">
      <div class="rank" style="color:${medal[i]||'#9AA7B4'}">${i+1}</div>
      <div class="av">${d.ini}${d.online?'<span class="dot"></span>':''}</div>
      <div class="grow" style="display:flex;flex-direction:column;gap:6px">
        <div class="between"><b>${d.name}</b><b>${state.metric==='deliveries'? v+' livr.' : fmt(v)+' km'}</b></div>
        <div class="bar thin"><div class="l" style="width:${pct}%"></div><div class="e"></div></div>
      </div></button>`;
  }).join('');
  document.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { state.profile=b.dataset.d; go('profil'); });

  let L=0,E=0; rows.forEach(d => { L+=d.loaded; E+=d.empty; });
  document.getElementById('cTotal').textContent = fmt(L+E)+' km';
  document.getElementById('cLoaded').textContent = fmt(L)+' km';
  document.getElementById('cEmpty').textContent = fmt(E)+' km';
  document.getElementById('cBar').style.width = Math.round(L/(L+E)*100)+'%';
  document.getElementById('onlineCount').textContent = '● '+DRIVERS.filter(d=>d.online).length+' en route';
}
/* ---------- fiche chauffeur ---------- */
function renderProfile(){
  const d = DRIVERS.find(x => x.id===state.profile);
  const tot = d.loaded+d.empty, pct = Math.round(d.loaded/tot*100);
  const opts = DRIVERS.map(x => `<button class="pill ${x.id===d.id?'on':''}" data-pf="${x.id}">${x.name}</button>`).join('');
  document.getElementById('v-profil').innerHTML = `
    <div class="row" style="margin-bottom:18px;flex-wrap:wrap">${opts}</div>
    <div class="row" style="gap:16px;margin-bottom:20px">
      <div class="av" style="width:68px;height:68px;font-size:22px">${d.ini}</div>
      <div><h1 style="margin:0 0 4px">${d.name} <span class="demo">Données d'exemple</span></h1>
        <div class="soft" style="font-size:14px">${d.online?'<span style="color:var(--ok)">● En route</span>':'<span class="muted">Hors ligne</span>'} · ${d.truck}</div></div>
    </div>
    <div class="grid2">
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="panel" style="display:flex;flex-direction:column;gap:12px">
          <span class="muted">Kilomètres ce mois</span>
          <div class="row" style="gap:30px">
            <div class="k"><span class="lbl" style="color:var(--loaded)">CHARGÉ</span><span style="font-size:28px">${fmt(d.loaded)}</span></div>
            <div class="k"><span class="lbl" style="color:var(--empty)">À VIDE</span><span style="font-size:28px">${fmt(d.empty)}</span></div>
            <div class="k"><span class="lbl">TOTAL</span><span style="font-size:28px">${fmt(tot)}</span></div>
          </div>
          <div class="bar"><div class="l" style="width:${pct}%"></div><div class="e"></div></div>
          <span class="soft" style="font-size:13px">${pct} % de la distance avec marchandise</span>
        </div>
        <div class="stats">
          <div class="stat"><span class="muted">Livraisons</span><b>${d.deliveries}</b></div>
          <div class="stat"><span class="muted">Revenus jeu</span><b>${fmt(d.money)} €</b></div>
          <div class="stat"><span class="muted">Carburant</span><b>${fmt(d.fuel)} L</b></div>
          <div class="stat"><span class="muted">Conso moy.</span><b>${(d.fuel/tot*100).toFixed(1).replace('.',',')} L/100</b></div>
          <div class="stat"><span class="muted">Dégâts moy.</span><b>${String(d.damage).replace('.',',')} %</b></div>
          <div class="stat"><span class="muted">Heures de conduite</span><b>${d.hours} h</b></div>
        </div>
      </div>
      <div>
        <h2>Derniers trajets</h2>
        <div class="list">
          ${[['Calais → Paris','Lait, 16 t',289,41,''],['Bruxelles → Calais','Pièces auto, 12 t',212,18,' · ferry exclu'],['Lyon → Strasbourg','Acier, 24 t',494,63,'']].map(t => `
          <div class="panel" style="padding:12px 14px">
            <div class="between"><b>${t[0]}</b><span style="color:var(--ok)">Livré</span></div>
            <div class="soft" style="font-size:13px;margin-top:4px">${t[1]} · <span style="color:var(--loaded)">${t[2]} km chargé</span> · <span style="color:var(--empty)">${t[3]} km à vide</span>${t[4]}</div>
          </div>`).join('')}
        </div>
      </div>
    </div>`;
  document.querySelectorAll('[data-pf]').forEach(b => b.onclick = () => { state.profile=b.dataset.pf; renderProfile(); });
}
/* ---------- carte (simulation) ---------- */
const CITIES = { Calais:[140,60], Bruxelles:[360,70], Paris:[210,210], Strasbourg:[500,190], Lyon:[260,380], Nantes:[60,300], Marseille:[320,470], Francfort:[540,80] };
const ROADS = [['Calais','Paris'],['Calais','Bruxelles'],['Bruxelles','Paris'],['Bruxelles','Francfort'],['Francfort','Strasbourg'],['Paris','Strasbourg'],['Paris','Lyon'],['Paris','Nantes'],['Lyon','Strasbourg'],['Lyon','Marseille'],['Nantes','Lyon']];
const LIVE = [
  { name:'Lucas_R',   from:'Paris',     to:'Lyon',       t:0.45, speed:82, cargo:'Électronique, 18 t', loaded:true },
  { name:'Sophie M.', from:'Bruxelles', to:'Francfort',  t:0.30, speed:74, cargo:'Bois, 22 t',         loaded:true },
  { name:'Nico972',   from:'Nantes',    to:'Paris',      t:0.20, speed:61, cargo:'Va chercher sa remorque', loaded:false },
];
function tickMap(){
  LIVE.forEach((d,i) => {
    d.t += 0.004 + Math.random()*0.002;
    if (d.t >= 1){ const prev=d.from; d.from=d.to; const nexts = ROADS.filter(r=>r.includes(d.from)).map(r=>r[0]===d.from?r[1]:r[0]).filter(c=>c!==prev); d.to = nexts[Math.floor(Math.random()*nexts.length)] || prev; d.t=0; }
    d.speed = Math.max(55, Math.min(90, d.speed + Math.round((Math.random()-0.5)*6)));
    const [x1,y1]=CITIES[d.from],[x2,y2]=CITIES[d.to];
    const el = document.getElementById('tr'+i);
    el.style.left = ((x1+(x2-x1)*d.t)/6)+'%'; el.style.top = ((y1+(y2-y1)*d.t)/5.2)+'%';
    document.getElementById('sp'+i).textContent = d.speed;
  });
  document.getElementById('liveList').innerHTML = LIVE.map(d => {
    const [x1,y1]=CITIES[d.from],[x2,y2]=CITIES[d.to];
    const left = Math.round(Math.hypot(x2-x1,y2-y1)*1.4*(1-d.t));
    return `<div class="panel" style="padding:12px 14px;display:flex;flex-direction:column;gap:6px">
      <div class="between"><b>${d.name}</b><span class="lbl" style="color:${d.loaded?'var(--loaded)':'var(--empty)'}">${d.loaded?'CHARGÉ':'À VIDE'}</span></div>
      <div class="soft" style="font-size:13px">${d.from} → ${d.to} · ${d.cargo}</div>
      <div class="muted" style="font-size:12px">${d.speed} km/h · reste ${left} km</div></div>`;
  }).join('');
}
/* ---------- tablette ---------- */
let tabKm = 251, tabLeft = 214;
function tickTablet(){
  const now = new Date();
  document.getElementById('tabClock').textContent = now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
  if (tabLeft > 0){ tabKm++; tabLeft--; }
  document.getElementById('tabLoaded').textContent = tabKm+' km';
  document.getElementById('tabLeft').textContent = tabLeft+' km';
  document.getElementById('tabProg').style.width = Math.round((1-tabLeft/465)*100)+'%';
}
