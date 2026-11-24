// TCH Map — conversion des coordonnées du jeu (x, z en mètres) en longitude / latitude réelles.
//
// Copyright (C) 2026 Truck & Coach Hub — TCH Map
// Adapté de truckermudgeon/maps (packages/libs/map/projections.ts), GPL-3.0-or-later.
// Ce fichier est un logiciel libre : GNU General Public License v3 ou ultérieure (voir LICENSE).
//
// SCS projette ses cartes en Lambert conique conforme (def/climate.sii). On inverse cette projection sur une
// sphère (rayon de Clarke 1866 ; il s'annule dans le calcul). La projection est écrite ici directement,
// sans bibliothèque, pour rester légère.

const R = 6370997;
const DEG = Math.PI / 180;
const lengthOfDegree = R * DEG;

function lambert(lat1, lat2, lat0, lon0) {
  const p1 = lat1 * DEG, p2 = lat2 * DEG, p0 = lat0 * DEG;
  const t = (p) => Math.tan(Math.PI / 4 + p / 2);
  const n = Math.log(Math.cos(p1) / Math.cos(p2)) / Math.log(t(p2) / t(p1));
  const F = (Math.cos(p1) * Math.pow(t(p1), n)) / n;
  const rho0 = (R * F) / Math.pow(t(p0), n);
  return {
    // x, y projetés (mètres) → [longitude, latitude] en degrés
    inverse(x, y) {
      const s = Math.sign(n);
      const rho = s * Math.hypot(x, rho0 - y);
      const theta = Math.atan2(s * x, s * (rho0 - y));
      const lat = 2 * Math.atan(Math.pow((R * F) / rho, 1 / n)) - Math.PI / 2;
      const lon = lon0 * DEG + theta / n;
      return [lon / DEG, lat / DEG];
    },
  };
}

// ATS (def/climate.sii)
const ATS = { mapFactor: [-0.00017706234, 0.000176689948] };
const atsLcc = lambert(33, 45, 39, -96);
export function fromAts(x, z) {
  return atsLcc.inverse(x * ATS.mapFactor[1] * lengthOfDegree, z * ATS.mapFactor[0] * lengthOfDegree);
}

// ETS2 (def/climate.sii)
const ETS2 = { mapOffset: [16660, 4150], mapFactor: [-0.000171570875, 0.0001729241463] };
const ets2Lcc = lambert(37, 65, 50, 15);
export function fromEts2(x, z) {
  const sx = Math.floor(x / 4000), sy = Math.floor(z / 4000);
  x -= ETS2.mapOffset[0];
  z -= ETS2.mapOffset[1];
  // Le Royaume-Uni est dessiné à une échelle un peu plus grande (~14,37 contre ~19,15).
  // Repère : le secteur de Calais. La borne en y exclut l'Islande (correction de truckermudgeon, nov. 2026).
  const isUk = sx <= -8 && sy <= -2 && !(sx === -8 && sy === -2) && sy >= -14;
  if (isUk) {
    x = (x + -31100 / 2) * 0.75;
    z = (z + -5500 / 2) * 0.75;
  }
  return ets2Lcc.inverse(x * ETS2.mapFactor[1] * lengthOfDegree, z * ETS2.mapFactor[0] * lengthOfDegree);
}

export function toLngLat(game, x, z) {
  return game === 'ats' ? fromAts(x, z) : fromEts2(x, z);
}
