// VTC du joueur, lue sur les plateformes existantes à partir de son SteamID64 (préparation).
//
// TruckersMP : API publique, sans clé. https://api.truckersmp.com/v2/player/{steamID64}
//   → response.vtc = { id, name, tag, inVTC, memberID }, puis /v2/vtc/{id}/member/{memberID} → rôle dans la VTC.
// Trucky : API publique pour lire, jeton fourni par la VTC pour le reste (à brancher plus tard).
// HaulMP : pas d'API publique connue à ce jour.
//
// Non testé avec la vraie API : la lecture est volontairement tolérante (champs absents → null).
const API = 'https://api.truckersmp.com/v2';

function parsePlayerVtc(json) {
  const r = json && !json.error && json.response;
  const v = r && r.vtc;
  if (!v || !v.inVTC || !v.id) return null;
  return { platform: 'truckersmp', vtcId: Number(v.id), name: String(v.name || ''), tag: String(v.tag || ''), memberId: v.memberID ? Number(v.memberID) : null, player: String(r.name || '') };
}

function parseMemberRole(json) {
  const r = json && !json.error && json.response;
  if (!r) return null;
  const role = r.role && typeof r.role === 'object' ? r.role.name : r.role;
  return role ? String(role) : null;
}

async function truckersmpVtc(steamId, fetchImpl = globalThis.fetch) {
  if (!/^\d{17}$/.test(String(steamId || ''))) throw new Error('Renseigne ton SteamID64 dans Steam & Discord.');
  const get = async (url) => {
    const r = await fetchImpl(url, { headers: { Accept: 'application/json', 'User-Agent': 'Truck-and-Coach-Hub' } });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error('TruckersMP a répondu ' + r.status);
    return r.json();
  };
  const p = await get(`${API}/player/${steamId}`);
  if (!p || p.error) return { found: false, reason: 'Aucun compte TruckersMP lié à ce SteamID.' };
  const vtc = parsePlayerVtc(p);
  if (!vtc) return { found: true, vtc: null, reason: 'Ce joueur n’est dans aucune VTC sur TruckersMP.' };
  let role = null;
  if (vtc.memberId) { try { role = parseMemberRole(await get(`${API}/vtc/${vtc.vtcId}/member/${vtc.memberId}`)); } catch { role = null; } }
  return { found: true, vtc: { ...vtc, role } };
}

// Le fondateur d'une VTC associe les rôles de sa VTC (« Driver », « Event Manager »…) à des rangs de l'appli.
function mapVtcRole(roleName, mapping) {
  if (!roleName || !mapping) return null;
  const key = String(roleName).trim().toLowerCase();
  const hit = Object.entries(mapping).find(([k]) => k.trim().toLowerCase() === key);
  return hit ? hit[1] : null;
}

module.exports = { parsePlayerVtc, parseMemberRole, truckersmpVtc, mapVtcRole };
