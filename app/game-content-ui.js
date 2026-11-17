(function () {
  const button = document.getElementById('contentScan');
  if (!button) return;
  let busy = false, checked = false;
  function text(tag, value) { const el = document.createElement(tag); el.textContent = value; return el; }
  async function refresh(force = false) {
    if (busy || (checked && !force)) return;
    const status = document.getElementById('contentStatus'), details = document.getElementById('contentDetails');
    if (!window.tel || !window.tel.gameContent) { status.textContent = 'Vérification disponible dans l’application de bureau.'; return; }
    busy = true; button.disabled = true; status.textContent = 'Lecture des dossiers de jeux…';
    try {
      const result = await window.tel.gameContent();
      details.replaceChildren();
      for (const g of Object.values(result.games)) {
        const section = document.createElement('details'); section.style.marginTop = '12px';
        const dlcs = g.files.filter(f => f.kind === 'dlc');
        section.append(text('summary', `${g.name} — ${g.installed ? dlcs.length + ' archives DLC présentes' : 'installation non trouvée'}`));
        if (!g.installed) {
          section.append(text('p', 'Aucune installation nécessaire pour utiliser l’autre jeu. Si le jeu est installé ailleurs, sélectionne son dossier dans les réglages du plugin.'));
        } else {
          section.append(text('p', g.dir));
          if (g.error) section.append(text('p', 'Lecture impossible : ' + g.error));
          section.append(text('p', 'La présence d’un DLC ne met pas automatiquement à jour le fond de carte. Pour inclure le contenu installé, génère une carte avec TsMap puis importe son dossier dans la section Carte.'));
          section.append(text('p', `Mods .scs dans Documents : ${g.mods.length}. Leur présence ne garantit pas leur activation ; les mods Workshop ne sont pas inventoriés ici.`));
          const list = document.createElement('ul');
          for (const f of dlcs) list.append(text('li', `${f.name} · ${f.format || f.error} · ${f.mountedInLastLog ? 'monté dans le dernier journal' : 'activation non confirmée'}`));
          section.append(list);
          if (g.log.modified) section.append(text('p', 'Journal consulté : ' + new Date(g.log.modified).toLocaleString('fr-FR') + (g.log.truncated ? ' (lecture limitée aux 4 premiers Mo)' : '')));
        }
        details.append(section);
      }
      const cap = await window.tel.telemetryCapabilities();
      details.append(text('p', !cap.connected ? 'HUD : lance une mission pour vérifier les données de télémétrie.' :
        `HUD · plugin ${cap.plugin || '?'} · conversion temps réel ${cap.localScale ? 'disponible' : 'indisponible (plugin récent requis)'} · mission car ${cap.busJob ? 'détectée' : 'non détectée'}.`));
      if (cap.busJob) details.append(text('p', 'Champs car reçus (interprétation à valider) : ' + cap.busFields.join(', ')));
      status.textContent = 'Vérifié à ' + new Date(result.checkedAt).toLocaleTimeString('fr-FR') + '. Aucun fichier du jeu modifié.';
      checked = true;
    } catch (e) { status.textContent = 'Vérification impossible : ' + e.message; }
    finally { busy = false; button.disabled = false; }
  }
  button.onclick = () => refresh(true);
  window.TCHContent = { refresh };
})();
