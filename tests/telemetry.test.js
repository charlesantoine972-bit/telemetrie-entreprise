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
