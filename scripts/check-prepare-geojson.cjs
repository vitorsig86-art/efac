// Checks scripts/prepare-geojson.cjs with synthetic data near 10°E 20°N,
// unrelated to any property. No network. Run: node scripts/check-prepare-geojson.cjs
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { prepareGeoJson, lengthMeters, PrepareError } = require("./prepare-geojson.cjs");

const collection = (features) => ({ type: "FeatureCollection", features });
const feature = (geometry, properties = {}) => ({ type: "Feature", properties: { KML_STYLE: "Global Mapper style", ...properties }, geometry });
const lineString = (...coordinates) => ({ type: "LineString", coordinates });
const fails = (data, options, pattern) => assert.throws(() => prepareGeoJson(data, options), (error) => error instanceof PrepareError && pattern.test(error.message), String(pattern));

// 1. Common steps: Z removed, 7 decimals, KML_STYLE -> sequential id, rings kept closed.
let { geojson, notes } = prepareGeoJson(collection([
  feature(lineString([10.123456789, 20.987654321, 812.4], [10.12345681, 20.98765429, 811], [10.2, 21.1, 800]), { nome: "a", id: 99 }),
  feature({ type: "Polygon", coordinates: [[[10, 20, 1], [10.1, 20, 1], [10.1, 20.1, 1], [10, 20, 1]]] }, { nome: "b" }),
  feature({ type: "Point", coordinates: [10.000000049, 20.000000051, 5] }),
]), { type: "generico" });
assert.deepEqual(geojson.features.map((item) => [item.id, item.properties.id]), [[1, 1], [2, 2], [3, 3]]);
assert.ok(geojson.features.every((item) => !("KML_STYLE" in item.properties)));
assert.equal(Object.keys(geojson.features[0].properties)[0], "id");
assert.equal(geojson.features[0].properties.nome, "a");
assert.deepEqual(geojson.features[0].geometry.coordinates, [[10.1234568, 20.9876543], [10.2, 21.1]], "Rounded, 2D, repeated vertex dropped");
assert.deepEqual(geojson.features[1].geometry.coordinates[0].at(-1), [10, 20]);
assert.deepEqual(geojson.features[2].geometry.coordinates, [10, 20.0000001]);
assert.ok(notes.some((note) => /Z removido/.test(note)) && notes.some((note) => /KML_STYLE/.test(note)));
assert.equal(geojson.crs, undefined);
fails(collection([feature(lineString([500000, 7600000, 1], [500100, 7600100, 1]))]), { type: "generico" }, /não está em graus/);
fails({ ...collection([]), crs: { type: "name", properties: { name: "urn:ogc:def:crs:EPSG::31983" } } }, { type: "generico" }, /não é WGS84/);
fails(collection([feature(lineString([10, 20], [10.00000001, 20.00000001]))]), { type: "generico" }, /degenerada/);
fails(collection([]), { type: "outro" }, /--tipo/);

// 2. Contours: ELEVATION -> cota_m, mestra every 15 m (default) or every 10 m.
const contours = collection(Array.from({ length: 16 }, (_, i) => feature(lineString([10, 20 + i / 1000, i * 3], [10.01, 20 + i / 1000, i * 3]), { ELEVATION: i * 3 })));
({ geojson } = prepareGeoJson(contours, { type: "curvas" }));
const masters = (result) => result.features.filter((item) => item.properties.mestra).map((item) => item.properties.cota_m);
assert.deepEqual(masters(geojson), [0, 15, 30, 45]);
assert.ok(geojson.features.every((item) => !("ELEVATION" in item.properties) && typeof item.properties.mestra === "boolean"));
assert.deepEqual(Object.keys(geojson.features[1].properties), ["id", "cota_m", "mestra"]);
assert.deepEqual(masters(prepareGeoJson(contours, { type: "curvas", masterInterval: 10 }).geojson), [0, 30]);
assert.equal(prepareGeoJson(collection([feature(lineString([10, 20], [10.1, 20]), { ELEVATION: "45" })]), { type: "curvas" }).geojson.features[0].properties.cota_m, 45);
fails(collection([feature(lineString([10, 20], [10.1, 20]), { ELEVATION: null })]), { type: "curvas" }, /sem ELEVATION/);
fails(contours, { type: "curvas", masterInterval: 0 }, /intervalo-mestra/);

// 3. Drainage: Strahler from topology, Z gives the direction, endpoints matched with 7 decimals.
//   A, B -> J1 (order 2) -> J2 <- C (stays 2) -> J4 <- J3 (2, from D and E) -> outlet (3)
const A = [10.000, 20.010], B = [10.010, 20.010], C = [10.020, 20.006], D = [10.030, 20.010], E = [10.040, 20.010];
const J1 = [10.005, 20.005], J2 = [10.010, 20.000], J3 = [10.035, 20.004], J4 = [10.020, 19.995], O = [10.020, 19.985];
const z = (position, height) => [...position, height];
const network = [
  feature(lineString(z(A, 100), z(J1, 80)), { nome: "s1" }),
  feature(lineString(z(J1, 80), z(B, 100)), { nome: "s2 desenhado para montante" }),
  feature(lineString(z(J1, 80), [10.008, 20.002, 70], z(J2, 60)), { nome: "s3" }),
  feature(lineString(z(C, 90), [J2[0] + 3e-9, J2[1] - 3e-9, 61]), { nome: "s4 casado em 7 casas" }),
  feature(lineString(z(J2, 60), z(J4, 40)), { nome: "s5" }),
  feature(lineString(z(D, 95), z(J3, 70)), { nome: "s6" }),
  feature(lineString(z(E, 95), z(J3, 70)), { nome: "s7" }),
  feature(lineString(z(J3, 70), z(J4, 41)), { nome: "s8" }),
  feature(lineString(z(J4, 40), z(O, 30)), { nome: "s9", STRAHLER: 7 }),
];
({ geojson, notes } = prepareGeoJson(collection(network), { type: "drenagem" }));
const byName = Object.fromEntries(geojson.features.map((item) => [item.properties.nome, item.properties]));
assert.deepEqual(geojson.features.map((item) => item.properties.STRAHLER), [1, 1, 2, 1, 2, 1, 1, 2, 3]);
assert.deepEqual(geojson.features[1].geometry.coordinates, [B, J1], "Line drawn uphill is reversed to run downstream");
assert.ok(geojson.features.every((item) => item.geometry.coordinates.every((position) => position.length === 2)));
assert.deepEqual(Object.keys(byName.s9).slice(0, 3), ["id", "STRAHLER", "comprimento_m"]);
assert.ok(Math.abs(byName.s9.comprimento_m - lengthMeters([J4, O])) < 0.05);
assert.ok(notes.some((note) => /1 exutório/.test(note)) && notes.some((note) => /invertidos/.test(note)) && notes.some((note) => /recalculados/.test(note)));
// Lengths on the WGS84 ellipsoid: 1° of longitude on the equator and 0.01° of latitude at 20°.
assert.ok(Math.abs(lengthMeters([[0, 0], [1, 0]]) - 111319.49) < 0.1);
assert.ok(Math.abs(lengthMeters([[10, 19.995], [10, 20.005]]) - 1107.04) < 0.1);
// A tributary ending on an inner vertex is reported, not silently counted.
({ notes } = prepareGeoJson(collection([...network, feature(lineString([10.009, 20.009, 99], [10.008, 20.002, 70]), { nome: "afluente no meio" })]), { type: "drenagem" }));
assert.ok(notes.some((note) => /meio de outra linha/.test(note)));

// 4. Drainage aborts with a clear message.
fails(collection([...network, feature(lineString(z(J1, 80), [10.0, 20.0, 50]), { nome: "braço" })]), { type: "drenagem" }, /mais de uma saída.*id 1 -> id 3 e id 10/);
fails(collection([...network.slice(0, 2), feature(lineString(z(J1, 80), z(J2, 80)))]), { type: "drenagem" }, /sem sentido definido.*id 3 \(Z inicial = Z final = 80\)/);
fails(collection([feature(lineString(A, J1))]), { type: "drenagem" }, /sem sentido definido.*sem Z/);
fails(collection([
  feature(lineString(z(A, 10), z(B, 5))), feature(lineString(z(B, 8), z(C, 3))), feature(lineString(z(C, 9), z(A, 2))),
]), { type: "drenagem" }, /ciclo entre 3/);
fails(collection([feature({ type: "MultiLineString", coordinates: [[z(A, 2), z(B, 1)]] })]), { type: "drenagem" }, /só aceita LineString/);

// 5. CLI: writes one feature per line and exits 1 with the message on errors.
const folder = fs.mkdtempSync(path.join(os.tmpdir(), "cardeal-prepare-geojson-"));
try {
  const input = path.join(folder, "drenagem_global_mapper.geojson");
  const output = path.join(folder, "drenagem.geojson");
  fs.writeFileSync(input, "﻿" + JSON.stringify(collection(network)));
  const script = path.join(__dirname, "prepare-geojson.cjs");
  const stdout = execFileSync(process.execPath, [script, input, output, "--tipo", "drenagem"], { encoding: "utf8" });
  assert.match(stdout, /Gerado .*drenagem\.geojson/);
  const written = fs.readFileSync(output, "utf8");
  assert.equal(written.split("\n").length, network.length + 3);
  assert.deepEqual(JSON.parse(written).features.map((item) => item.properties.STRAHLER), [1, 1, 2, 1, 2, 1, 1, 2, 3]);
  fs.writeFileSync(input, JSON.stringify(collection([feature(lineString(A, J1))])));
  assert.throws(() => execFileSync(process.execPath, [script, input, output, "--tipo", "drenagem"], { stdio: "pipe" }), (error) => error.status === 1 && /Erro: Rede sem sentido definido/.test(String(error.stderr)));
  assert.throws(() => execFileSync(process.execPath, [script, input], { stdio: "pipe" }), (error) => error.status === 1 && /Uso:/.test(String(error.stderr)));
} finally {
  fs.rmSync(folder, { recursive: true, force: true });
}

console.log("Prepare GeoJSON passed: Z removed, 7 decimals, KML_STYLE -> sequential id, contours (cota_m, mestra, interval), drainage Strahler from topology (Z direction, reversed lines, 7-decimal endpoints, WGS84 lengths), aborts on bifurcation/flat/missing Z/cycle/MultiLineString, CLI output and errors.");
