/* Marketplace : aperçu animé du module « Tablette in-game » (section v-tablette, recopiée dans la fiche du module).
   Déplacé depuis fonctionnalites/hub/hub.js lors du retrait des anciennes pages VTC (bêta 5, étape A). */

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
