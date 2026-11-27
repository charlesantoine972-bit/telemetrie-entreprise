/* Bord du menu latéral : calcul de la largeur pendant le glissement (fonction pure, testée dans tools/verify.test.js).
   - Le bord suit la souris en continu entre NAV_MIN et NAV_MAX (aucune zone morte, aucun saut).
   - Sous NAV_MIN, le menu reste à NAV_MIN et annonce qu'il va se replier ; il ne se replie qu'au relâchement.
   - Menu réduit : il ne se redéplie qu'au-delà de NAV_MIN + marge (hystérésis : pas de clignotement). */
const NAV_HYST = 24;
function largeurMenu(x, reduit, o){
  const min = o.min, max = o.max, hyst = o.hyst == null ? NAV_HYST : o.hyst;
  const borne = v => Math.round(Math.min(max, Math.max(min, v)));
  if (reduit) return x >= min + hyst ? { etat: 'large', largeur: borne(x) } : { etat: 'reduit', largeur: null };
  if (x < min) return { etat: 'replier', largeur: min };
  return { etat: 'large', largeur: borne(x) };
}
// Au relâchement : « replier » devient le menu réduit, le reste ne change pas.
function finGlissement(etat){ return etat === 'replier' || etat === 'reduit' ? 'reduit' : 'large'; }
if (typeof module !== 'undefined' && module.exports) module.exports = { largeurMenu, finGlissement, NAV_HYST };
