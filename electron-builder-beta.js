// Construction de « Truck & Coach Hub Bêta » : appli séparée (autre identifiant, autre dossier,
// autre raccourci), publiée en pré-version GitHub. La version normale ne la voit jamais.
// Utilisé par « npm run release:beta » (branche beta).
const base = require('./package.json').build;
module.exports = {
  ...base,
  appId: 'fr.telemetrie.entreprise.beta',
  productName: 'Truck and Coach Hub Beta',
  nsis: {
    ...base.nsis,
    shortcutName: 'Truck & Coach Hub (Bêta)',
    artifactName: 'Truck-and-Coach-Hub-Beta-Setup-${version}.exe'
  },
  // canal « beta » : fichier beta.yml, lu seulement par la bêta (la version normale lit latest.yml)
  publish: base.publish.map(p => ({ ...p, releaseType: 'prerelease', channel: 'beta' })),
  releaseInfo: { ...(base.releaseInfo || {}), releaseName: (base.releaseInfo && base.releaseInfo.releaseName ? base.releaseInfo.releaseName : 'Bêta') }
};
