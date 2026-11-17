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
