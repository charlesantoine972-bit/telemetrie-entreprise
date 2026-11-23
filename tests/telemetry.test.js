const test = require('node:test');
const assert = require('node:assert/strict');
const { Telemetry } = require('../src/telemetry');

function createTelemetry() {
  return new Telemetry('C:/tmp/tch-tests', () => ({
    vehicleType: 'truck',
    limitTruck: 100,
    limitCar: 110,
    racePct: 5
  }));
}

test('Telemetry accepts world coordinates at the origin', () => {
  const telemetry = createTelemetry();

  telemetry.onState({
    speed: 0,
    paused: false,
    odometer: 1,
    x: 0,
    z: 0,
    job: null,
    trailerConnected: false,
    fuel: 50,
    game: 'ets2'
  });

  assert.deepStrictEqual(telemetry.trail, [[0, 0, 0]]);
});

test('Telemetry ignores missing coordinates instead of treating zero as missing', () => {
  const telemetry = createTelemetry();

  telemetry.onState({
    speed: 0,
    paused: false,
    odometer: 2,
    x: undefined,
    z: 5,
    job: null,
    trailerConnected: false,
    fuel: 50,
    game: 'ets2'
  });

  assert.deepStrictEqual(telemetry.trail, []);
});

test('Telemetry records trip fuel and game-reported expenses on the mission', () => {
  const telemetry = createTelemetry();
  telemetry.save = () => {};
  const mission = {
    'source.city': 'Paris', 'source.company': 'Tradeaux',
    'destination.city': 'Lyon', 'destination.company': 'Stokes',
    'source.city.id': 'paris', 'destination.city.id': 'lyon',
    cargo: 'Électronique', 'cargo.mass': 18000, income: 12000,
    'planned_distance.km': 450
  };
  const truck = { brand: 'Scania', name: 'S 650', 'fuel.capacity': 900 };
  const state = (fuel, odometer) => telemetry.onState({
    speed: 0, paused: false, odometer, x: 0, z: 0, job: mission,
    trailerConnected: true, fuel, truck, game: 'ets2'
  });

  state(100, 1);
  state(120, 1.1);
  state(125, 1.2);
  state(124, 1.3);
  telemetry.onGameplay({ id: 'player.tollgate.paid', data: { 'pay.amount': 200 } });
  telemetry.onGameplay({ id: 'player.use.ferry', data: { 'pay.amount': 450 } });
  telemetry.onGameplay({ id: 'player.fined', data: { 'fine.amount': 800 } });
  telemetry.onGameplay({ id: 'job.delivered', data: { revenue: 12000 } });

  const trip = telemetry.data.jobs[0];
  assert.equal(trip.from, 'Paris');
  assert.equal(trip.to, 'Lyon');
  assert.equal(trip.fuelAdded, 25);
  assert.equal(trip.fuelUsed, 1);
  assert.equal(trip.fuelStops.length, 1);
  assert.equal(trip.expenses, 1450);
  assert.deepEqual(trip.expenseItems.map(item => item.type), ['péage', 'ferry', 'amende']);
  assert.equal(telemetry.data.totals.fuelAdded, 25);
  assert.equal(telemetry.data.totals.fuelUsed, 1);
  assert.equal(telemetry.data.totals.expenses, 1450);
  assert.deepEqual(telemetry.data.totals.money.ets2, { revenue: 12000, expenses: 1450 });
});

test('Telemetry counts expenses outside a mission and ignores fuel jumps while paused or moving', () => {
  const telemetry = createTelemetry();
  telemetry.save = () => {};
  const truck = { brand: 'Scania', name: 'S 650' };
  const state = (fuel, extra = {}) => telemetry.onState({ speed: 0, paused: false, odometer: 1, x: 0, z: 0, job: null, trailerConnected: false, fuel, truck, game: 'ats', ...extra });
  state(100);
  state(400, { paused: true });   // chargement d'une sauvegarde
  state(500, { speed: 20 });      // téléportation / saut en roulant
  state(520);                     // vrai plein, à l'arrêt
  telemetry.onGameplay({ id: 'player.tollgate.paid', data: { 'pay.amount': 30 } });
  assert.equal(telemetry.data.totals.fuelAdded, 20);
  assert.equal(telemetry.data.totals.expenses, 30);
  assert.deepEqual(telemetry.data.totals.money.ats, { revenue: 0, expenses: 30 });
});

test('Telemetry reads bus mission endpoints and advances the next stop', () => {
  const telemetry = createTelemetry();
  telemetry.save = () => {};
  const busJob = (stageCurrent) => ({
    bus_job_id: 'route-42',
    'bus_job.market': 'company_job',
    'bus.stages.count': 2,
    'bus.stages.current': stageCurrent,
    income: 7200,
    'planned_distance.km': 510,
    'source_stop.name': { '0': 'Bratislava', '1': 'Košice' },
    'source_stop.id': { '0': 'bratislava', '1': 'kosice' },
    'destination_stop.name': { '0': 'Košice', '1': 'Ostrava' },
    'destination_stop.id': { '0': 'kosice', '1': 'ostrava' }
  });
  const state = (route) => telemetry.onState({
    speed: 0, paused: false, odometer: 1, x: 0, z: 0,
    job: null, busJob: route, trailerConnected: false, fuel: 80,
    truck: { brand: 'Volvo', name: '9700' }, game: 'ets2'
  });

  state(busJob(0));
  telemetry.lastPacket = Date.now();
  let mission = telemetry.snapshot().job;
  assert.equal(mission.missionType, 'bus');
  assert.equal(mission.from, 'Bratislava');
  assert.equal(mission.to, 'Ostrava');
  assert.equal(mission.nextStop, 'Košice');

  state(busJob(1));
  mission = telemetry.snapshot().job;
  assert.equal(mission.from, 'Bratislava');
  assert.equal(mission.to, 'Ostrava');
  assert.equal(mission.nextStop, 'Ostrava');
  assert.equal(mission.stageCurrent, 1);

  state(null);
  assert.ok(telemetry.pendingFinish);
  telemetry.onGameplay({ id: 'bus_job.completed', data: { revenue: 7200 } });
  assert.equal(telemetry.current, null);
  assert.equal(telemetry.pendingFinish, null);
  assert.equal(telemetry.data.jobs[0].from, 'Bratislava');
  assert.equal(telemetry.data.jobs[0].to, 'Ostrava');
  assert.equal(telemetry.data.jobs[0].revenue, 7200);
});

test('Telemetry ignores fuel increases caused by switching vehicles', () => {
  const telemetry = createTelemetry();
  telemetry.save = () => {};
  const mission = { 'source.city': 'Paris', 'destination.city': 'Lyon', cargo: 'Colis', income: 1000 };
  const state = (fuel, name) => telemetry.onState({
    speed: 0, paused: false, odometer: 1, x: 0, z: 0, job: mission,
    trailerConnected: true, fuel, truck: { brand: 'Volvo', name }, game: 'ets2'
  });

  state(50, 'FH');
  state(300, 'FH16');
  state(305, 'FH16');

  assert.equal(telemetry.current.fuelAdded, 5);
});

test('vehicle mode follows the selected career profile instead of switching on truck missions', () => {
  const telemetry = createTelemetry();
  telemetry.getSettings = () => ({
    vehicleType: 'car',
    limitTruck: 100,
    limitCar: 110,
    racePct: 5
  });
  telemetry.lastPacket = Date.now();
  telemetry.live = { busJob: null };
  let snapshot = telemetry.snapshot();
  assert.equal(snapshot.vehicleType, 'car');
  assert.equal(snapshot.thresholds.limit, 110);

  telemetry.live = { busJob: null, job: { 'delivery.time': 100 } };
  telemetry.lastPacket = Date.now();
  snapshot = telemetry.snapshot();
  assert.equal(snapshot.vehicleType, 'car');
  assert.equal(snapshot.thresholds.limit, 110);

  telemetry.getSettings = () => ({ vehicleType: 'camion', limitTruck: 100, limitCar: 110, racePct: 5 });
  telemetry.live = { job: { 'delivery.time': 100 } };
  telemetry.lastPacket = Date.now();
  snapshot = telemetry.snapshot();
  assert.equal(snapshot.vehicleType, 'camion');
  assert.equal(snapshot.thresholds.limit, 100);

  telemetry.live = { busJob: { route: 'received' }, job: { 'delivery.time': 100 } };
  telemetry.lastPacket = Date.now();
  snapshot = telemetry.snapshot();
  assert.equal(snapshot.vehicleType, 'car');
  assert.equal(snapshot.thresholds.limit, 110);

  telemetry.lastPacket = 0;
  snapshot = telemetry.snapshot();
  assert.equal(snapshot.connected, false);
  assert.equal(snapshot.vehicleType, 'camion');
});

test('Telemetry records bus stops served and where a mission was abandoned', () => {
  const telemetry = createTelemetry();
  telemetry.save = () => {};
  const busJob = (stageCurrent) => ({
    bus_job_id: 'line-7', 'bus.stages.count': 3, 'bus.stages.current': stageCurrent, income: 900,
    'source_stop.name': { '0': 'Lille', '1': 'Arras', '2': 'Amiens' },
    'destination_stop.name': { '0': 'Arras', '1': 'Amiens', '2': 'Rouen' }
  });
  let odo = 1;
  const state = (route, km = 0) => { odo += km; telemetry.onState({
    speed: 10, paused: false, odometer: odo, x: 0, z: 0,
    job: null, busJob: route, trailerConnected: false, fuel: 80,
    truck: { brand: 'Setra', name: 'S 516' }, game: 'ets2'
  }); };

  state(busJob(0));
  for (let i = 0; i < 100; i++) state(busJob(0), 0.4);   // 40 km jusqu'à Arras
  state(busJob(1));
  for (let i = 0; i < 50; i++) state(busJob(1), 0.4);    // 20 km de plus
  telemetry.onGameplay({ id: 'bus_job.cancelled', data: { 'cancel.penalty': 300 } });

  const job = telemetry.data.jobs[0];
  assert.equal(job.missionType, 'bus');
  assert.equal(job.abandoned, true);
  assert.equal(job.revenue, 0);
  assert.equal(job.expenses, 300);
  assert.deepEqual(job.stops.map(s => [s.kind, s.name]), [['départ', 'Lille'], ['arrêt', 'Arras'], ['abandon', 'Amiens']]);
  assert.ok(Math.abs(job.stops[1].km - 40) < 0.5);
  assert.ok(Math.abs(job.stops[2].km - 60) < 0.5);
});

test('Telemetry records a truck delivery from A to B', () => {
  const telemetry = createTelemetry();
  telemetry.save = () => {};
  const mission = { 'source.city': 'Lille', 'source.company': 'Tradeaux', 'destination.city': 'Lyon', 'destination.company': 'Fle', cargo: 'Colis', income: 5000 };
  telemetry.onState({ speed: 0, paused: false, odometer: 1, x: 0, z: 0, job: mission, trailerConnected: true, fuel: 50, truck: { brand: 'Volvo', name: 'FH' }, game: 'ets2' });
  telemetry.onGameplay({ id: 'job.delivered', data: { revenue: 5200 } });
  const job = telemetry.data.jobs[0];
  assert.equal(job.abandoned, false);
  assert.deepEqual(job.stops.map(s => [s.kind, s.name, s.company]), [['départ', 'Lille', 'Tradeaux'], ['arrivée', 'Lyon', 'Fle']]);
});

test('Force G : lissage, pic et à-coups comptés une fois par secousse pendant un service', () => {
  const telemetry = createTelemetry();
  telemetry.current = { key: 'bus|x', missionType: 'bus', loaded: 0, empty: 0 };
  const tick = (ax, az, speed = 20) => telemetry.trackG({ accel: [ax, 0, az], speed, paused: false });
  for (let i = 0; i < 12; i++) tick(4.9, 0);      // virage franc (~0,5 G)
  assert.ok(telemetry.g.lat > 0.45 && telemetry.g.lat <= 0.5);
  for (let i = 0; i < 12; i++) tick(0, 0);        // retour au calme
  for (let i = 0; i < 12; i++) tick(0, 3.9);      // freinage (~0,4 G, z vers l'arrière)
  assert.ok(telemetry.g.lon < -0.35);
  assert.equal(telemetry.current.jolts, 2);
  assert.ok(telemetry.current.gMax >= 0.45);
  for (let i = 0; i < 12; i++) tick(0, 0, 0);
  for (let i = 0; i < 12; i++) tick(6, 0, 0);     // à l'arrêt : ignoré
  assert.equal(telemetry.current.jolts, 2);
  telemetry.trackG({ speed: 0, paused: false }); // ancien plugin : pas d'accélération
  assert.equal(telemetry.g, null);
});

test('Télémétrie : la livraison affichée est celle du jeu, même si un ancien service car est resté', () => {
  const telemetry = createTelemetry();
  telemetry.lastPacket = Date.now();
  telemetry.onState({
    speed: 20, paused: false, odometer: 1000, x: 0, z: 0, fuel: 400, game: 'ets2', trailerConnected: true,
    navDistance: 520000, navTime: 25000, gameTime: 3000, cargoDamage: 0.01,
    truck: { id: 'vehicle.scania.s_2016', brand: 'Scania', name: 'S' },
    busJob: { 'destination_stop.name': { 0: 'Farah' }, 'source_stop.name': { 0: 'Paris' }, 'bus.stages.count': 1 },
    job: { 'source.city': 'Paris', 'source.company': 'Tradeaux', 'destination.city': 'Prague', 'destination.company': 'Posped',
      cargo: 'Pommes', 'cargo.mass': 20000, income: 9800, 'planned_distance.km': 1040, 'delivery.time': 4200, 'is.cargo.loaded': true }
  });
  const sn = telemetry.snapshot();
  assert.equal(sn.mission.type, 'truck');
  assert.equal(sn.mission.from, 'Paris');
  assert.equal(sn.mission.to, 'Prague');
  assert.equal(sn.mission.toCompany, 'Posped');
  assert.equal(Math.round(sn.mission.progress * 100), 50);   // 520 km restants sur 1 040 prévus
  assert.equal(sn.mission.timeLeft, 1200);
  assert.equal(sn.live.busJob, null);
  assert.equal(sn.mission.tracked, true);
  assert.equal(sn.job.to, 'Prague');
});

test('Télémétrie : sans livraison dans le jeu, rien n’est affiché', () => {
  const { gameMission } = require('../src/telemetry');
  assert.equal(gameMission({ job: null, busJob: null }), null);
  const m = gameMission({ job: { 'destination.city': 'Prague' } });
  assert.equal(m.from, null);
  assert.equal(m.progress, null);
});
