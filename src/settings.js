function mergeSavedSettings(defaults, saved) {
  const settings = { ...defaults, ...(saved || {}) };
  if (settings.theme) {
    const theme = settings.theme;
    delete settings.theme;
    settings.look = { ...defaults.look, theme: theme === 'sombre' ? 'base' : theme };
  }
  settings.look = { ...defaults.look, ...(settings.look || {}) };
  const savedHud = settings.hud || {};
  const hudDefaults = defaults.hud || {};
  const legacyHud = Object.fromEntries(['style', 'position', 'logo', 'opacity', 'scale']
    .filter(key => key in savedHud).map(key => [key, savedHud[key]]));
  settings.hud = {
    truck: { ...(hudDefaults.truck || {}), ...legacyHud, ...(savedHud.truck || {}) },
    bus: { ...(hudDefaults.bus || {}), ...legacyHud, ...(savedHud.bus || {}) }
  };
  return settings;
}

function validateSettingsPatch(patch) {
  const limits = {
    limitTruck: ['Seuil camion', 60, 150],
    limitCar: ['Seuil car', 60, 150],
    racePct: ['Pourcentage de course', 0, 100]
  };
  for (const [key, [label, min, max]] of Object.entries(limits)) {
    if (!(key in patch)) continue;
    const value = patch[key];
    if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
      throw new Error(`${label} doit être un nombre entier entre ${min} et ${max}.`);
    }
  }
}

module.exports = { mergeSavedSettings, validateSettingsPatch };
