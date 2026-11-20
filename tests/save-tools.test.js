// Tests des outils Truck Tools sur une fausse sauvegarde au format SCS (texte clair).
const test = require('node:test');
const assert = require('node:assert');
const T = require('../src/save-tools');
const { SaveEditor } = require('../src/save-editor');

const SAVE = `SiiNunit
{
economy : _nameless.100 {
 bank: _nameless.200
 player: _nameless.300
 companies: 3
 companies[0]: company.volatile.tradeaux.paris
 companies[1]: company.volatile.posped.berlin
 companies[2]: company.volatile.lkwlog.lyon
 garages: 3
 garages[0]: garage.paris
 garages[1]: garage.berlin
 garages[2]: garage.lyon
 experience_points: 1000
 visited_cities: 1
 visited_cities[0]: paris
 visited_cities_count: 1
 visited_cities_count[0]: 3
 unlocked_dealers: 1
 unlocked_dealers[0]: paris
 unlocked_recruitments: 0
 game_time: 14400
}
bank : _nameless.200 {
 money_account: 5000
 overdraft: false
 loans: 0
}
player : _nameless.300 {
 hq_city: paris
 trailers: 1
 trailers[0]: _nameless.700
 trucks: 3
 trucks[0]: _nameless.400
 trucks[1]: _nameless.500
 trucks[2]: _nameless.600
 truck_profit_logs: 3
 truck_profit_logs[0]: _nameless.440
 truck_profit_logs[1]: _nameless.540
 truck_profit_logs[2]: _nameless.640
 drivers: 2
 drivers[0]: driver.player
 drivers[1]: driver.bob
 assigned_vehicles: _nameless.900
}
player_vehicles : _nameless.900 {
 vehicle: _nameless.400
 trailer: _nameless.800
 stored_vehicle_placement: (0, 0, 0) (1; 0, 0, 0)
 stored_trailer_placements: 1
 stored_trailer_placements[0]: (0, 0, 0) (1; 0, 0, 0)
 stored_trailer_attached: false
}
vehicle : _nameless.400 {
 accessories: 4
 accessories[0]: _nameless.410
 accessories[1]: _nameless.420
 accessories[2]: _nameless.430
 accessories[3]: _nameless.450
 engine_wear: &3e800000
 transmission_wear: 0.2
 cabin_wear: 0
 chassis_wear: 0.1
 wheels_wear: 2
 wheels_wear[0]: 0.5
 wheels_wear[1]: 0.5
 license_plate: "AB 123 CD|france"
 fuel_relative: 0.3
 odometer: 120000
 integrity_odometer: 120000
 trip_distance_km: 300
}
vehicle_accessory : _nameless.410 {
 data_path: "/def/vehicle/truck/scania.s_2016/data.sii"
}

vehicle_addon_accessory : _nameless.420 {
 data_path: "/def/vehicle/truck/scania.s_2016/accessory/badge/scania_v8.sii"
}

vehicle_accessory : _nameless.430 {
 data_path: "/def/vehicle/truck/scania.s_2016/engine/dc13_500.sii"
}
vehicle_accessory : _nameless.450 {
 data_path: "/def/vehicle/truck/scania.s_2016/transmission/grs905.sii"
}
profit_log : _nameless.440 {
 acc_distance_free: 800
 acc_distance_on_job: 119200
}
profit_log : _nameless.540 {
 acc_distance_free: 0
 acc_distance_on_job: 5000
}
profit_log : _nameless.640 {
 acc_distance_free: 0
 acc_distance_on_job: 0
}
vehicle : _nameless.600 {
 accessories: 3
 accessories[0]: _nameless.610
 accessories[1]: _nameless.630
 accessories[2]: _nameless.650
 engine_wear: 0
 license_plate: "SC 2|france"
 fuel_relative: 1
 odometer: 10
}
vehicle_accessory : _nameless.610 {
 data_path: "/def/vehicle/truck/scania.s_2016/data.sii"
}
vehicle_accessory : _nameless.630 {
 data_path: "/def/vehicle/truck/scania.s_2016/engine/dc16_770.sii"
}
vehicle_accessory : _nameless.650 {
 data_path: "/def/vehicle/truck/scania.s_2016/transmission/grso926r.sii"
}
vehicle : _nameless.500 {
 accessories: 1
 accessories[0]: _nameless.510
 engine_wear: 0.9
 license_plate: "XY 999 ZZ|germany"
 fuel_relative: 0.1
 odometer: 5000
}
vehicle_accessory : _nameless.510 {
 data_path: "/def/vehicle/truck/volvo.fh16_2012/data.sii"
}
trailer : _nameless.700 {
 trailer_definition: _nameless.750
 cargo_mass: 0
 cargo_damage: 0
 slave_trailer: null
 trailer_body_wear: 0.4
 chassis_wear: 0
 license_plate: "TR 1|france"
}
trailer : _nameless.800 {
 trailer_definition: _nameless.850
 cargo_mass: 20000
 cargo_damage: 0.3
 slave_trailer: _nameless.810
 trailer_body_wear: 0.2
 chassis_wear: 0.2
 license_plate: "JOB 1|france"
}
trailer : _nameless.810 {
 trailer_definition: _nameless.850
 cargo_mass: 15000
 cargo_damage: 0
 slave_trailer: null
 trailer_body_wear: 0.1
 chassis_wear: 0
 license_plate: "JOB 2|france"
}
trailer_def : _nameless.750 {
 body_mass: 5000
 chassis_mass: 2000
 country_validity: 0
 source_name: null
}
trailer_def : _nameless.850 {
 body_mass: 6000
 chassis_mass: 2500
 country_validity: 2
 country_validity[0]: france
 country_validity[1]: germany
 source_name: "company.lyon"
}
garage : garage.paris {
 vehicles: 1
 vehicles[0]: _nameless.400
 drivers: 1
 drivers[0]: driver.player
 trailers: 0
 status: 6
}
garage : garage.berlin {
 vehicles: 3
 vehicles[0]: _nameless.500
 vehicles[1]: null
 vehicles[2]: null
 drivers: 3
 drivers[0]: driver.bob
 drivers[1]: null
 drivers[2]: null
 trailers: 0
 status: 2
}
garage : garage.lyon {
 vehicles: 0
 drivers: 0
 trailers: 0
 status: 0
}
}
`;
const { unit, get, arr } = T._internal;
const body = (t, id) => unit(t, id).body;
const valid = t => assert.deepStrictEqual(SaveEditor.checkText(t, ['economy', 'bank', 'player']).issues, []);

test('lecture : camion, remorque attelée, flotte', () => {
  const o = T.overview(SAVE);
  assert.strictEqual(o.trucks.length, 3);
  const cur = o.trucks.find(t => t.current);
  assert.strictEqual(cur.id, '_nameless.400');
  assert.strictEqual(cur.brand, 'Scania'); assert.strictEqual(cur.plate, 'AB 123 CD'); assert.strictEqual(cur.garage, 'paris');
  assert.ok(Math.abs(cur.wear - 0.5) < 1e-6);
  assert.strictEqual(o.attached.parts, 2); assert.deepStrictEqual(o.attached.cargoMass, [20000, 15000]);
  assert.strictEqual(o.attached.restricted, true); assert.strictEqual(o.attached.owned, false);
  assert.deepStrictEqual(o.garages, { total: 3, owned: 2, tiny: 1, small: 1, large: 0 });
  assert.strictEqual(o.cities, 3);
});

test('réparation du camion actuel seulement', () => {
  const t = T.repairTrucks(SAVE, 'current').text; valid(t);
  assert.strictEqual(get(body(t, '_nameless.400'), 'engine_wear'), '0');
  assert.deepStrictEqual(arr(body(t, '_nameless.400'), 'wheels_wear'), ['0', '0']);
  assert.strictEqual(get(body(t, '_nameless.500'), 'engine_wear'), '0.9');
});

test('réparation de la remorque attelée et de sa remorque esclave', () => {
  const t = T.repairTrailers(SAVE, 'current').text; valid(t);
  assert.strictEqual(get(body(t, '_nameless.800'), 'trailer_body_wear'), '0');
  assert.strictEqual(get(body(t, '_nameless.810'), 'trailer_body_wear'), '0');
  assert.strictEqual(get(body(t, '_nameless.700'), 'trailer_body_wear'), '0.4');
});

test('carburant : actuel, tous, réservoir géant borné à 10', () => {
  let t = T.setFuel(SAVE, 'current', 1).text;
  assert.strictEqual(get(body(t, '_nameless.400'), 'fuel_relative'), '1');
  assert.strictEqual(get(body(t, '_nameless.500'), 'fuel_relative'), '0.1');
  t = T.setFuel(SAVE, 'all', 50).text; valid(t);
  assert.strictEqual(get(body(t, '_nameless.500'), 'fuel_relative'), '10');
});

test('kilométrage et plaque (pays conservé, couleur en AABBGGRR)', () => {
  let t = T.setTruckKm(SAVE, 42).text;
  assert.strictEqual(get(body(t, '_nameless.400'), 'odometer'), '42');
  assert.strictEqual(get(body(t, '_nameless.400'), 'integrity_odometer'), '42');
  assert.strictEqual(get(body(t, '_nameless.400'), 'trip_distance_km'), '42');
  assert.strictEqual(get(body(t, '_nameless.440'), 'acc_distance_on_job'), '42');
  assert.strictEqual(get(body(t, '_nameless.440'), 'acc_distance_free'), '0');
  assert.strictEqual(get(body(t, '_nameless.540'), 'acc_distance_on_job'), '5000');
  t = T.setPlate(t, 'truck', 'TCH 01', '#ff8a3d').text; valid(t);
  assert.strictEqual(get(body(t, '_nameless.400'), 'license_plate'), '"<color value=ff3d8aff>TCH 01|france"');
  assert.throws(() => T.setPlate(SAVE, 'truck', 'a|b'));
});

test('cargaison : remorque et remorque esclave', () => {
  let t = T.setCargoMass(SAVE, 40000, true).text; valid(t);
  assert.strictEqual(get(body(t, '_nameless.800'), 'cargo_mass'), '40000');
  assert.strictEqual(get(body(t, '_nameless.810'), 'cargo_mass'), '40000');
  t = T.setCargoMass(SAVE, 1, false).text;
  assert.strictEqual(get(body(t, '_nameless.810'), 'cargo_mass'), '15000');
  assert.throws(() => T.setCargoMass(SAVE, -5));
});

test('remorque autorisée partout + poids à vide', () => {
  let t = T.unlockTrailer(SAVE).text; valid(t);
  const d = body(t, '_nameless.850');
  assert.strictEqual(get(d, 'country_validity'), '0'); assert.deepStrictEqual(arr(d, 'country_validity'), []);
  assert.strictEqual(get(d, 'source_name'), 'null');
  t = T.setTrailerDefMass(t, 1000, '').text;
  assert.strictEqual(get(body(t, '_nameless.850'), 'body_mass'), '1000');
  assert.strictEqual(get(body(t, '_nameless.850'), 'chassis_mass'), '2500');
});

test('changer de camion : chauffeurs échangés, QG déplacé, attelage mis à jour', () => {
  const t = T.setPlayerTruck(SAVE, '_nameless.500').text; valid(t);
  assert.strictEqual(get(body(t, '_nameless.900'), 'vehicle'), '_nameless.500');
  assert.strictEqual(get(body(t, '_nameless.300'), 'hq_city'), 'berlin');
  assert.strictEqual(arr(body(t, 'garage.paris'), 'drivers')[0], 'driver.bob');
  assert.strictEqual(arr(body(t, 'garage.berlin'), 'drivers')[0], 'driver.player');
  assert.strictEqual(T.current(t).truck, '_nameless.500');
  assert.throws(() => T.setPlayerTruck(SAVE, '_nameless.400'));
});

test('changer de remorque', () => {
  const t = T.setPlayerTrailer(SAVE, '_nameless.700').text; valid(t);
  assert.strictEqual(T.current(t).trailer, '_nameless.700');
  assert.throws(() => T.setPlayerTrailer(SAVE, '_nameless.800')); // remorque de mission : pas dans la flotte
});

test('garages : seuls les garages vides sont achetés, jamais réduits', () => {
  const r = T.buyGarages(SAVE, 3); valid(r.text);
  assert.strictEqual(r.count, 1); // lyon seulement (paris et berlin ont un camion)
  const g = body(r.text, 'garage.lyon');
  assert.strictEqual(get(g, 'status'), '3'); assert.strictEqual(arr(g, 'vehicles').length, 5); assert.strictEqual(arr(g, 'drivers').length, 5);
  assert.strictEqual(T.buyGarages(r.text, 6).count, 0);
});

test('concessionnaires et agences pour toutes les villes', () => {
  let t = T.unlockList(SAVE, 'unlocked_dealers').text;
  t = T.unlockList(t, 'unlocked_recruitments').text; valid(t);
  const eco = body(t, '_nameless.100');
  assert.deepStrictEqual(arr(eco, 'unlocked_dealers').sort(), ['berlin', 'lyon', 'paris']);
  assert.strictEqual(get(eco, 'unlocked_recruitments'), '3');
});

test('téléportation depuis cams.txt', () => {
  const cams = T.parseCams('# commentaire\nfree;-100.5;20;3000.25;0.9;0;0.4;0;\nautre;1;2;3;1;0;0;0;\n');
  assert.strictEqual(cams.length, 2);
  const t = T.teleport(SAVE, cams[0]).text; valid(t);
  const pv = body(t, '_nameless.900');
  assert.strictEqual(get(pv, 'stored_vehicle_placement'), '(-100.5, 20, 3000.25) (0.9; 0, 0.4, 0)');
  assert.strictEqual(get(pv, 'stored_trailer_attached'), 'true');
});

test('lot complet via SaveEditor.applyToText', () => {
  const { text, report } = SaveEditor.applyToText(SAVE, { truckRepair: 'all', trailerRepair: 'all', truckFuel: { target: 'all', level: 1 }, cargoMass: { mass: 10000 }, unlockTrailer: true, garages: 6, unlockDealers: true });
  valid(text);
  assert.ok(report.length >= 7, report.join(', '));
});

test('moteur et boîte : pièces des camions du même modèle', () => {
  const info = T.partsInfo(SAVE);
  assert.strictEqual(info.model, 'scania.s_2016'); assert.strictEqual(info.badge, true);
  assert.strictEqual(info.engines.length, 2); assert.strictEqual(info.transmissions.length, 2);
  let t = T.setPart(SAVE, 'engine', '/def/vehicle/truck/scania.s_2016/engine/dc16_770.sii').text;
  t = T.setPart(t, 'transmission', '/def/vehicle/truck/scania.s_2016/transmission/grso926r.sii').text; valid(t);
  assert.strictEqual(get(body(t, '_nameless.430'), 'data_path'), '"/def/vehicle/truck/scania.s_2016/engine/dc16_770.sii"');
  assert.strictEqual(get(body(t, '_nameless.450'), 'data_path'), '"/def/vehicle/truck/scania.s_2016/transmission/grso926r.sii"');
  assert.throws(() => T.setPart(SAVE, 'engine', '/def/vehicle/truck/volvo.fh16_2012/engine/d16.sii'));
});

test('badge retiré : accessoire enlevé de la liste et bloc supprimé', () => {
  const r = T.removeBadge(SAVE); valid(r.text);
  assert.strictEqual(unit(r.text, '_nameless.420'), null);
  assert.deepStrictEqual(arr(body(r.text, '_nameless.400'), 'accessories'), ['_nameless.410', '_nameless.430', '_nameless.450']);
  assert.strictEqual(get(body(r.text, '_nameless.400'), 'accessories'), '3');
  assert.strictEqual(T.partsInfo(r.text).badge, false);
  assert.throws(() => T.removeBadge(r.text));
});

test('cargaison : toutes les remorques chargées de la sauvegarde', () => {
  const r = T.setCargoMass(SAVE, 30000, true, true); valid(r.text);
  assert.strictEqual(r.count, 2); // la remorque 700 est vide : non touchée
  assert.strictEqual(get(body(r.text, '_nameless.700'), 'cargo_mass'), '0');
});
