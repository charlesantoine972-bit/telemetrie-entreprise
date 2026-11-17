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

test('vehicle mode follows live bus telemetry and uses the saved choice only offline', () => {
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
  assert.equal(snapshot.vehicleType, 'camion');
  assert.equal(snapshot.thresholds.limit, 100);

  telemetry.live = { busJob: { route: 'received' } };
  telemetry.lastPacket = Date.now();
  snapshot = telemetry.snapshot();
  assert.equal(snapshot.vehicleType, 'car');
  assert.equal(snapshot.thresholds.limit, 110);

  telemetry.lastPacket = 0;
  snapshot = telemetry.snapshot();
  assert.equal(snapshot.connected, false);
  assert.equal(snapshot.vehicleType, 'car');
});
