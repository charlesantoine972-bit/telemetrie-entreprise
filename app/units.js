// Unités d'affichage : métriques (ETS2) ou américaines (ATS : miles, mph, gallons).
// Les calculs restent en km, km/h et litres ; on ne convertit qu'au moment d'afficher.
(function () {
  const MI = 1.609344, GAL = 3.785412;
  const U = {
    mode: 'metric',
    set(m) { this.mode = m === 'imperial' ? 'imperial' : 'metric'; },
    get imperial() { return this.mode === 'imperial'; },
    speed(ms) { return ms * (this.imperial ? 3.6 / MI : 3.6); },   // m/s → km/h ou mph
    fromKmh(kmh) { return this.imperial ? kmh / MI : kmh; },
    toKmh(v) { return this.imperial ? v * MI : v; },
    dist(km) { return this.imperial ? km / MI : km; },
    vol(l) { return this.imperial ? l / GAL : l; },
    get sp() { return this.imperial ? 'mph' : 'km/h'; },
    get d() { return this.imperial ? 'mi' : 'km'; },
    get v() { return this.imperial ? 'gal' : 'L'; },
    // Remplit les libellés marqués data-u="sp" | "d" | "v"
    label(root) { (root || document).querySelectorAll('[data-u]').forEach(e => { const t = this[e.dataset.u]; if (typeof t === 'string' && e.textContent !== t) e.textContent = t; }); }
  };
  if (typeof window !== 'undefined') window.UNITS = U;
  if (typeof module !== 'undefined') module.exports = U;
})();
