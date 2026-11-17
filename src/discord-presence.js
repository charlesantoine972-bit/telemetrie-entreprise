const RPC = require('discord-rpc');

function buildActivity(snapshot) {
  if (!snapshot || !snapshot.connected || !snapshot.live) return null;
  const game = snapshot.live.game === 'ats' ? 'American Truck Simulator' : 'Euro Truck Simulator 2';
  return {
    details: game,
    state: snapshot.job ? 'En mission' : 'En conduite'
  };
}

class DiscordPresence {
  constructor(rpc = RPC) {
    this.rpc = rpc;
    this.client = null;
    this.clientId = '';
    this.connecting = null;
    this.connected = false;
    this.retryAt = 0;
    this.hasActivity = false;
  }

  async disconnect() {
    const client = this.client;
    this.client = null;
    this.connecting = null;
    this.connected = false;
    this.retryAt = 0;
    this.hasActivity = false;
    if (client) {
      try { await client.clearActivity(); } catch {}
      try { await client.destroy(); } catch {}
    }
  }

  async configure(clientId) {
    const normalized = String(clientId || '').trim();
    await this.setClientId(normalized);
    if (!/^\d{17,20}$/.test(this.clientId)) {
      return { ok: false, error: 'Saisis un ID d’application Discord valide (17 à 20 chiffres).' };
    }
    return this.connect();
  }

  async setClientId(clientId) {
    const normalized = String(clientId || '').trim();
    if (normalized === this.clientId) return;
    await this.disconnect();
    this.clientId = normalized;
  }

  async connect() {
    if (this.connected) return { ok: true };
    if (this.connecting) return this.connecting;
    if (Date.now() < this.retryAt) return { ok: false, error: 'Discord n’est pas connecté. Relance le test dans quelques secondes.' };

    const client = new this.rpc.Client({ transport: 'ipc' });
    client.on('error', (error) => console.error('Discord Rich Presence :', error.message));
    client.on('disconnected', () => {
      if (this.client === client) {
        this.client = null;
        this.connected = false;
        this.hasActivity = false;
        this.connecting = null;
        this.retryAt = Date.now() + 15000;
      }
    });
    this.client = client;
    let connecting;
    connecting = client.login({ clientId: this.clientId })
      .then(() => {
        if (this.client !== client) return { ok: false, error: 'La connexion Discord a été remplacée.' };
        this.connected = true;
        this.retryAt = 0;
        return { ok: true };
      })
      .catch(async (error) => {
        if (this.client === client) {
          this.connected = false;
          this.retryAt = Date.now() + 15000;
          this.client = null;
        }
        try { await client.destroy(); } catch {}
        return { ok: false, error: `Connexion Discord impossible : ${error.message}` };
      })
      .finally(() => { if (this.connecting === connecting) this.connecting = null; });
    this.connecting = connecting;
    return connecting;
  }

  async test(clientId) {
    const result = await this.configure(clientId);
    if (!result.ok) return result;
    try {
      await this.client.setActivity({
        details: 'Truck & Coach Hub',
        state: 'Connexion Rich Presence vérifiée'
      });
      this.hasActivity = true;
      return { ok: true, message: 'Discord est connecté. Le test disparaît à la prochaine mise à jour de présence.' };
    } catch (error) {
      return { ok: false, error: `Discord n’a pas accepté la présence : ${error.message}` };
    }
  }

  async update(snapshot) {
    const activity = buildActivity(snapshot);
    if (!this.clientId) return;
    if (!activity) {
      if (this.connected && this.client && this.hasActivity) {
        await this.client.clearActivity();
        this.hasActivity = false;
      }
      return;
    }
    const result = await this.connect();
    if (result.ok && this.client) {
      await this.client.setActivity(activity);
      this.hasActivity = true;
    }
  }
}

module.exports = { DiscordPresence, buildActivity };
