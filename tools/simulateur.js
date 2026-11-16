// Simulateur : imite le plugin du jeu pour tester l'application sans lancer ETS2.
// Utilisation : node tools/simulateur.js   (l'application doit être ouverte)
const dgram = require('dgram');
const sock = dgram.createSocket('udp4');
const send = (o) => sock.send(Buffer.from(JSON.stringify(o)), 47311, '127.0.0.1');

const truck = { brand: 'Scania', name: 'S 650 V8', 'license.plate': 'AB-123-CD' };
const job = {
  'source.city': 'Paris', 'source.company': 'Tradeaux', 'destination.city': 'Lyon', 'destination.company': 'Stokes',
  cargo: 'Électronique', 'cargo.mass': 18000, income: 12450, 'planned_distance.km': 465
};
let odo = 154320, t = 0, navLeft = 465000, gameTime = 1 * 1440 + 14 * 60 + 32, fuel = 640;
const speedFactor = Number(process.env.SIM_SPEEDUP || 40); // accélère le trajet pour le test

setInterval(() => {
  t += 0.1;
  const phase = t < 4 ? 'approche' : 'livraison';
  const kmh = phase === 'approche' ? 60 : (t % 20 < 3 ? 112 : 88 + Math.sin(t) * 4);
  const dKm = kmh / 3600 * 0.1 * speedFactor;
  odo += dKm;
  if (phase === 'livraison') navLeft = Math.max(0, navLeft - dKm * 1000);
  fuel -= dKm * 0.3;
  gameTime += 0.05;
  send({
    type: 'state', plugin: 'sim', game: 'eut2', gameVersion: 0x10012, paused: false,
    speed: kmh / 3.6, odometer: odo, x: 0, y: 0, z: 0, heading: 0,
    navDistance: navLeft, navTime: navLeft / 22, speedLimit: 90 / 3.6, fuel, fuelRange: fuel / 0.3,
    cargoDamage: 0.004, gameTime: Math.floor(gameTime), restStop: 412, trailerConnected: phase === 'livraison',
    engine: true, parkingBrake: false, truck, trailer: null, job
  });
  if (navLeft === 0 && !this.done) {
    this.done = true;
    send({ type: 'gameplay', id: 'job.delivered', data: { revenue: 12450, 'cargo.damage': 0.004, 'distance.km': 465 }, odometer: odo });
    console.log('Livraison envoyée');
  }
}, 100);
console.log('Simulation en cours (Ctrl+C pour arrêter)…');
