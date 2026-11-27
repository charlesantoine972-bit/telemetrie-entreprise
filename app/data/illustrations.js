// Illustrations des cartes Truck & Coach Tools (dessinées pour l'appli, en SVG).
// Elles suivent le thème : les couleurs viennent des classes .il-* définies dans fonctionnalites/outils/outils.css (autrefois dans index.html).
(function () {
  const G = 94; // ligne du sol
  const g = (x, y, s, inner, extra = '') => `<g transform="translate(${x} ${y}) scale(${s})"${extra}>${inner}</g>`;
  const wheel = (cx, cy, r = 8) => `<circle class="il-wheel" cx="${cx}" cy="${cy}" r="${r}"/><circle class="il-acc" cx="${cx}" cy="${cy}" r="${r * 0.3}"/>`;

  // ----- Véhicules (repère local : sol en y = 0, avant vers la droite)
  const truck = () =>
    `<rect class="il-dark" x="0" y="-21" width="76" height="7" rx="2"/>` +
    `<rect class="il-dark" x="5" y="-25" width="18" height="4" rx="1"/>` +
    `<path class="il-body" d="M30 -14V-55Q30 -60 35 -60H65Q72 -60 73 -53L77 -21V-14Z"/>` +
    `<path class="il-glass" d="M51 -54H66Q69.5 -54 70 -50.5L72 -37H51Z"/>` +
    `<path class="il-line" d="M34 -34H46"/>` +
    `<rect class="il-acc" x="73" y="-29" width="5" height="4" rx="1"/>` +
    wheel(14, -8) + wheel(31, -8) + wheel(62, -8);
  const trailer = (L = 118) =>
    `<rect class="il-body" x="0" y="-66" width="${L}" height="46" rx="3"/>` +
    `<path class="il-line" d="M8 -43H${L - 8}" opacity=".55"/>` +
    `<rect class="il-dark" x="4" y="-20" width="${L - 8}" height="5" rx="2"/>` +
    `<path class="il-line" d="M${L - 34} -15V-4M${L - 40} -4H${L - 28}"/>` +
    wheel(16, -8) + wheel(34, -8);
  const rig = (L = 118) => trailer(L) + g(L - 26, 0, 1, truck());
  const bus = (num = '') =>
    `<rect class="il-body" x="0" y="-62" width="152" height="50" rx="9"/>` +
    [10, 33, 56, 79].map(x => `<rect class="il-glass" x="${x}" y="-53" width="19" height="19" rx="3"/>`).join('') +
    `<path class="il-glass" d="M128 -53H140Q147 -53 148 -46L150 -34H128Z"/>` +
    `<rect class="il-dark" x="104" y="-53" width="19" height="41" rx="2"/><path class="il-line" d="M113.5 -51V-14" opacity=".6"/>` +
    `<rect class="il-dark" x="12" y="-30" width="80" height="4" rx="2" opacity=".7"/>` +
    `<rect class="il-acc" x="146" y="-24" width="6" height="5" rx="1"/>` +
    (num ? `<rect class="il-dark" x="118" y="-61" width="30" height="7" rx="2"/><text class="il-txt il-sm" x="133" y="-55.4" text-anchor="middle">${num}</text>` : '') +
    wheel(30, -9, 9) + wheel(124, -9, 9);
  const truckFront = () =>
    `<path class="il-body" d="M-34 -6V-70Q-34 -78 -26 -78H26Q34 -78 34 -70V-6Z"/>` +
    `<path class="il-glass" d="M-27 -72H27L25 -50H-25Z"/>` +
    `<rect class="il-dark" x="-24" y="-44" width="48" height="24" rx="3"/>` +
    [-38, -33, -28, -23].map(y => `<path class="il-line" d="M-20 ${y}H20" opacity=".55"/>`).join('') +
    `<rect class="il-acc" x="-31" y="-18" width="12" height="6" rx="2"/><rect class="il-acc" x="19" y="-18" width="12" height="6" rx="2"/>` +
    `<rect class="il-wheel" x="-34" y="-6" width="14" height="8" rx="2"/><rect class="il-wheel" x="20" y="-6" width="14" height="8" rx="2"/>`;

  // ----- Accessoires
  const ground = () => `<path class="il-soft" d="M0 ${G}H320"/><path class="il-dash" d="M0 ${G + 8}H320"/>`;
  const wrench = (x, y, s = 1, r = -40) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><rect class="il-acc" x="-4.5" y="2" width="9" height="46" rx="4.5"/><circle class="il-acc" cx="0" cy="-4" r="13"/><rect class="il-cut" x="-5" y="-20" width="10" height="16" rx="1.5"/></g>`;
  const spark = (x, y, s = 1) => g(x, y, s, `<path class="il-acc" d="M0 -9L2.2 -2.2L9 0L2.2 2.2L0 9L-2.2 2.2L-9 0L-2.2 -2.2Z"/>`);
  const pump = (x) => g(x, G, 1,
    `<rect class="il-body" x="0" y="-66" width="30" height="66" rx="4"/><rect class="il-glass" x="6" y="-58" width="18" height="14" rx="2"/>` +
    `<rect class="il-acc" x="9" y="-38" width="12" height="3" rx="1.5"/><rect class="il-dark" x="-4" y="-4" width="38" height="5" rx="2"/>` +
    `<path class="il-line" d="M30 -50Q46 -50 44 -30T56 -14"/><rect class="il-acc" x="52" y="-20" width="12" height="7" rx="2"/>`);
  const gauge = (cx, cy, r = 27, label = 'km') =>
    `<circle class="il-dark" cx="${cx}" cy="${cy}" r="${r}"/>` +
    `<path class="il-line" d="M${cx - r * 0.72} ${cy + r * 0.4}A${r * 0.82} ${r * 0.82} 0 1 1 ${cx + r * 0.72} ${cy + r * 0.4}"/>` +
    `<path class="il-line" d="M${cx} ${cy}L${cx + r * 0.45} ${cy - r * 0.45}"/><circle class="il-acc" cx="${cx}" cy="${cy}" r="3"/>` +
    `<text class="il-txt il-sm" x="${cx}" y="${cy + r * 0.62}" text-anchor="middle">${label}</text>`;
  const plate = (x, y, w, txt) => `<g transform="translate(${x} ${y})"><rect class="il-plate" x="0" y="0" width="${w}" height="34" rx="5"/><rect class="il-plate-eu" x="2" y="2" width="14" height="30" rx="3"/><text class="il-plate-txt" x="${(w + 14) / 2}" y="23.5" text-anchor="middle">${txt}</text></g>`;
  const swapArrows = (cx, cy) => `<path class="il-line il-thick" d="M${cx - 26} ${cy - 6}Q${cx} ${cy - 30} ${cx + 26} ${cy - 6}"/><path class="il-acc" d="M${cx + 30} ${cy - 2}L${cx + 17} ${cy - 6}L${cx + 28} ${cy - 15}Z"/>` +
    `<path class="il-line il-thick" d="M${cx + 26} ${cy + 6}Q${cx} ${cy + 30} ${cx - 26} ${cy + 6}"/><path class="il-acc" d="M${cx - 30} ${cy + 2}L${cx - 17} ${cy + 6}L${cx - 28} ${cy + 15}Z"/>`;
  const pin = (x, y, s = 1) => g(x, y, s, `<path class="il-acc" d="M0 0C-4 -9 -14 -16 -14 -27A14 14 0 0 1 14 -27C14 -16 4 -9 0 0Z"/><circle class="il-cut" cx="0" cy="-27" r="5.5"/>`);
  const lockOpen = (x, y) => g(x, y, 1, `<path class="il-line il-thick" d="M-11 -24V-36A11 11 0 0 1 10 -40"/><rect class="il-acc" x="-17" y="-25" width="34" height="27" rx="5"/><circle class="il-cut" cx="0" cy="-13" r="4"/><rect class="il-cut" x="-1.6" y="-12" width="3.2" height="8" rx="1"/>`);
  const weight = (x, y, t) => g(x, y, 1, `<path class="il-acc" d="M-24 0L-18 -34H18L24 0Z"/><path class="il-line" d="M-8 -34V-42Q0 -48 8 -42V-34" style="stroke:var(--accent)"/><text class="il-txt il-inv" x="0" y="-11" text-anchor="middle">${t}</text>`);
  const downArrow = (x, y) => `<path class="il-line il-thick" d="M${x} ${y}V${y + 16}"/><path class="il-acc" d="M${x - 6} ${y + 12}H${x + 6}L${x} ${y + 20}Z"/>`;
  const balance = (cx) => g(cx, G, 1, `<path class="il-dark" d="M-26 0H26L18 -8H-18Z"/><rect class="il-acc" x="-3" y="-60" width="6" height="54" rx="3"/><path class="il-line il-thick" d="M-60 -56H60"/>` +
    `<path class="il-line" d="M-60 -56L-74 -30M-60 -56L-46 -30M60 -56L46 -30M60 -56L74 -30"/><path class="il-body" d="M-78 -30H-42Q-46 -20 -60 -20Q-74 -20 -78 -30Z"/><path class="il-body" d="M42 -30H78Q74 -20 60 -20Q46 -20 42 -30Z"/>`);
  const building = (x, w, h, win = true) => `<rect class="il-body" x="${x}" y="${G - h}" width="${w}" height="${h}" rx="2"/>` +
    (win ? Array.from({ length: Math.floor((h - 12) / 14) }, (_, r) => Array.from({ length: Math.floor((w - 6) / 10) }, (_, c) => `<rect class="il-glass" x="${x + 5 + c * 10}" y="${G - h + 7 + r * 14}" width="5" height="7" rx="1"/>`).join('')).join('') : '');
  const person = (x, s = 1) => g(x, G, s, `<circle class="il-acc" cx="0" cy="-44" r="9"/><path class="il-body" d="M-15 0V-18Q-15 -32 0 -32Q15 -32 15 -18V0Z"/>`);
  const star = (cx, cy, r) => { let d = ''; for (let i = 0; i < 10; i++) { const a = Math.PI / 5 * i - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; d += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1); } return `<path class="il-acc" d="${d}Z"/>`; };
  const engine = (x, y) => g(x, y, 1,
    `<rect class="il-body" x="0" y="-44" width="78" height="40" rx="4"/>` + [8, 26, 44].map(cx => `<rect class="il-dark" x="${cx}" y="-58" width="14" height="14" rx="2"/>`).join('') +
    `<path class="il-line" d="M6 -30H64M6 -20H64" opacity=".6"/><circle class="il-dark" cx="86" cy="-24" r="12"/><circle class="il-acc" cx="86" cy="-24" r="4"/><path class="il-line" d="M86 -36V-50H68"/>` +
    `<rect class="il-dark" x="4" y="-4" width="70" height="6" rx="2"/>`);
  const gear = (cx, cy, r) => { let d = ''; const n = 8; for (let i = 0; i < n * 2; i++) { const a = Math.PI / n * i, rr = i % 2 ? r * 0.78 : r; d += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1); } return `<path class="il-acc" d="${d}Z"/><circle class="il-cut" cx="${cx}" cy="${cy}" r="${r * 0.35}"/>`; };
  const wheelSteer = (cx, cy, r) => `<circle class="il-line il-thick" cx="${cx}" cy="${cy}" r="${r}"/><circle class="il-acc" cx="${cx}" cy="${cy}" r="${r * 0.28}"/><path class="il-line il-thick" d="M${cx - r} ${cy}H${cx - r * 0.28}M${cx + r * 0.28} ${cy}H${cx + r}M${cx} ${cy + r * 0.28}V${cy + r}"/>`;
  const card = (x, y, w, h) => `<rect class="il-body" x="${x}" y="${y}" width="${w}" height="${h}" rx="5"/><path class="il-line" d="M${x + 8} ${y + 12}H${x + w - 8}M${x + 8} ${y + 22}H${x + w - 14}M${x + 8} ${y + 32}H${x + w - 20}" opacity=".6"/>`;
  const busStopSign = (x) => g(x, G, 1, `<rect class="il-dark" x="-2" y="-78" width="4" height="78"/><rect class="il-acc" x="-15" y="-90" width="30" height="24" rx="4"/><rect class="il-cut" x="-9" y="-85" width="18" height="11" rx="2"/><circle class="il-cut" cx="-5" cy="-71" r="1.8"/><circle class="il-cut" cx="5" cy="-71" r="1.8"/>`);
  const shelter = (x) => g(x, G, 1, `<path class="il-line il-thick" d="M0 0V-58H64V0"/><path class="il-body" d="M-6 -58H70L64 -66H0Z"/><rect class="il-glass" x="4" y="-52" width="56" height="34" rx="2"/><rect class="il-dark" x="10" y="-16" width="44" height="5" rx="2"/>`);

  const svg = (inner) => `<svg class="il" viewBox="0 0 320 110" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">${ground()}${inner}</svg>`;

  window.ILLU = {
    // ----- Camions
    truckRepair: svg(g(96, G, 1.15, truck()) + wrench(222, 40, 1.05) + spark(250, 24, 0.9) + spark(190, 30, 0.6)),
    truckFuel: svg(g(70, G, 1.15, truck()) + pump(196)),
    truckKm: svg(g(52, G, 1.1, truck()) + gauge(226, 50, 30)),
    truckPlate: svg(g(40, G, 0.8, truck()) + plate(150, 34, 128, 'TCH 01')),
    playerTruck: svg(g(28, G, 0.92, truck()) + swapArrows(160, 52) + g(224, G, 0.92, truck())),
    truckParts: svg(engine(70, 82) + gear(234, 46, 24) + gear(272, 74, 13)),
    removeBadge: svg(g(132, G, 1, truckFront()) + `<circle class="il-acc" cx="132" cy="54" r="7"/>` + `<g transform="translate(232 40)"><circle class="il-dark" r="22"/><path class="il-line il-thick" d="M-10 -10L10 10M10 -10L-10 10"/></g><path class="il-line" d="M142 52Q180 30 210 38" stroke-dasharray="4 5"/>`),
    teleport: svg(`<g opacity=".35">${g(20, G, 0.85, truck())}</g><path class="il-line" d="M96 60Q170 -6 236 50" stroke-dasharray="5 6"/>` + pin(252, 62, 1.15) + g(200, G, 0.85, truck())),
    // ----- Remorques
    cargoMass: svg(g(36, G, 1, rig(130)) + weight(96, 26, '40 t') + downArrow(150, 4)),
    trailerDefMass: svg(balance(160) + g(92, 64, 0.32, trailer(118)) + weight(220, 64, 't')),
    unlockTrailer: svg(g(30, G, 1, trailer(130)) + lockOpen(232, 64) + `<path class="il-line" d="M268 30V82M268 32H296L290 40L296 48H268" />`),
    trailerRepair: svg(g(40, G, 1, trailer(140)) + wrench(232, 36, 1.05) + spark(262, 22, 0.9) + spark(206, 26, 0.6)),
    trailerPlate: svg(`<rect class="il-body" x="70" y="18" width="180" height="62" rx="4"/><path class="il-line" d="M160 22V76" opacity=".5"/>` + `<rect class="il-wheel" x="74" y="80" width="30" height="12" rx="3"/><rect class="il-wheel" x="216" y="80" width="30" height="12" rx="3"/>` + plate(104, 44, 112, 'TR 259') + `<rect class="il-acc" x="76" y="70" width="14" height="6" rx="2"/><rect class="il-acc" x="230" y="70" width="14" height="6" rx="2"/>`),
    playerTrailer: svg(g(14, G, 0.8, trailer(118)) + swapArrows(160, 52) + g(212, G, 0.8, trailer(118))),
    // ----- Profil
    visitAllCities: svg(building(40, 34, 60) + building(78, 26, 42) + building(108, 40, 74) + building(152, 28, 50) + building(184, 44, 66) + building(232, 30, 40) + building(266, 36, 56) + pin(126, 32, 0.8) + pin(206, 40, 0.8) + pin(284, 52, 0.7)),
    unlockDealers: svg(`<rect class="il-body" x="60" y="34" width="200" height="60" rx="3"/><rect class="il-glass" x="70" y="46" width="180" height="44" rx="2"/>` + g(122, G - 6, 0.85, truck()) + `<rect class="il-acc" x="120" y="16" width="80" height="20" rx="4"/>` + star(160, 26, 7) + spark(250, 22, 0.8)),
    unlockRecruitments: svg(building(40, 70, 62) + person(150, 1) + person(188, 1.12) + person(228, 1) + `<rect class="il-acc" x="266" y="30" width="26" height="6" rx="3"/><rect class="il-acc" x="276" y="20" width="6" height="26" rx="3"/>`),
    garages: svg(`<path class="il-body" d="M70 94V44L160 14L250 44V94Z"/><rect class="il-dark" x="100" y="50" width="120" height="44" rx="2"/>` + [58, 66, 74].map(y => `<path class="il-line" d="M104 ${y}H216" opacity=".5"/>`).join('') + g(118, G, 0.8, truck()) + `<rect class="il-acc" x="138" y="22" width="44" height="10" rx="3"/>`),
    copyConfig: svg(card(56, 22, 66, 66) + wheelSteer(89, 70, 13) + `<path class="il-line il-thick" d="M140 55H178"/><path class="il-acc" d="M176 47L190 55L176 63Z"/>` + card(200, 22, 66, 66) + wheelSteer(233, 70, 13)),
    // ----- Cars (Coach Tools)
    coachXp: svg(g(30, G, 0.95, bus('259')) + `<circle class="il-acc" cx="250" cy="48" r="32"/><text class="il-txt il-inv il-big" x="250" y="57" text-anchor="middle">XP</text>` + spark(290, 18, 0.8) + spark(212, 18, 0.6)),
    coachSkills: svg(g(16, G, 0.8, bus()) + [[180, 1], [226, 2], [272, 3]].map(([x, n]) => `<path class="il-body" d="M${x - 9} 58L${x - 14} 90L${x} 82L${x + 14} 90L${x + 9} 58Z"/><circle class="il-dark" cx="${x}" cy="44" r="18"/>` + Array.from({ length: n }, (_, i) => star(x - (n - 1) * 6 + i * 12, 44, 6)).join('')).join('')),
    busStops: svg(shelter(36) + busStopSign(126) + g(152, G, 1, bus('259'))),
    busRepair: svg(g(40, G, 1.05, bus()) + wrench(240, 40, 1.05) + spark(270, 24, 0.9) + spark(212, 28, 0.6)),
    busFuel: svg(g(18, G, 1.05, bus()) + pump(214)),
    busKm: svg(g(18, G, 1, bus()) + gauge(240, 50, 30)),
    busPlate: svg(g(14, G, 0.75, bus()) + plate(156, 34, 140, 'LIGNE 259'))
  };
})();
