// Module partagé Node / navigateur. Le SDK exprime navTime en secondes de jeu.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TCHMission = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const valid = v => typeof v === 'number' && Number.isFinite(v) && v >= 0;
  function calculate(live, now = Date.now()) {
    if (!live) return { available: false };
    const scale = valid(live.localScale) && live.localScale > 0 ? live.localScale : null;
    const gameSeconds = valid(live.navTime) && (live.navTime > 0 || live.navDistance > 0) ? live.navTime : null;
    const realSeconds = gameSeconds != null && scale ? gameSeconds / scale : null;
    const deadline = live.job && live.job['delivery.time'];
    const remaining = valid(deadline) && valid(live.gameTime) ? (deadline - live.gameTime) * 60 : null;
    const paused = !!live.paused;
    return { available: true, paused, scale, gameSeconds, realSeconds,
      arrivalGameMinutes: gameSeconds != null && valid(live.gameTime) ? live.gameTime + gameSeconds / 60 : null,
      arrivalReal: realSeconds != null && !paused ? now + realSeconds * 1000 : null,
      deadlineGameSeconds: remaining, deadlineRealSeconds: remaining != null && scale ? remaining / scale : null,
      coach: !!live.busJob, scope: live.busJob ? 'prochain arrêt GPS' : 'destination GPS' };
  }
  function duration(seconds) {
    if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return '—';
    const n = Math.ceil(Math.abs(seconds) / 60);
    return (seconds < 0 ? '−' : '') + Math.floor(n / 60) + ' h ' + String(n % 60).padStart(2, '0');
  }
  return { calculate, duration };
});
