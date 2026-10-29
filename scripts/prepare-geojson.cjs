#!/usr/bin/env node
// Prepares a GeoJSON exported from Global Mapper for upload to the R2.
//
// Usage:
//   node scripts/prepare-geojson.cjs <entrada.geojson> <saida.geojson> --tipo <tipo> [options]
//
// Tipos:
//   generico   only the common steps (e.g. property boundary).
//   curvas     contours: ELEVATION -> cota_m and mestra (true every --intervalo-mestra m).
//   drenagem   drainage: STRAHLER and comprimento_m from the network topology.
//
// Options:
//   --intervalo-mestra <m>   index contour interval, default 15.
//
// Common steps: removes Z, rounds coordinates to 7 decimals (about 1 cm),
// drops repeated vertices left by the rounding and replaces KML_STYLE with a
// sequential id (also used as the feature id). Input must be geographic
// degrees (WGS84/CRS84); output is RFC 7946 without a "crs" member.
//
// Drainage: line endpoints are matched after rounding to 7 decimals. Each
// line flows from its higher end to its lower end, using the Z of its first
// and last vertex; lines drawn uphill are reversed, so the output always runs
// upstream -> downstream. Aborts when a line has no defined direction
// (missing or equal Z, closed line), when a line has more than one outlet
// (bifurcation) or when the network has a cycle. The Strahler order is
// computed from the confluences: lines must be split at every junction.
const fs = require("node:fs");

const DECIMALS = 7;
const SCALE = 10 ** DECIMALS;
const TYPES = ["generico", "curvas", "drenagem"];
// WGS84 ellipsoid, for segment lengths.
const A = 6378137;
const E2 = 6.69437999014e-3;

class PrepareError extends Error {}

const round = (value) => Math.round(value * SCALE) / SCALE;
const key = ([x, y]) => `${round(x).toFixed(DECIMALS)},${round(y).toFixed(DECIMALS)}`;
const describe = (feature) => `id ${feature.properties.id}`;

function list(items, limit = 10) {
  return items.slice(0, limit).join("; ") + (items.length > limit ? `; e mais ${items.length - limit}` : "");
}

function checkPosition(position, where) {
  if (!Array.isArray(position) || position.length < 2 || !position.every((value) => typeof value === "number" && Number.isFinite(value))) {
    throw new PrepareError(`Coordenada inválida em ${where}.`);
  }
  if (Math.abs(position[0]) > 180 || Math.abs(position[1]) > 90) {
    throw new PrepareError(`Coordenada ${position.slice(0, 2).join(", ")} em ${where} não está em graus. Exporte do Global Mapper em WGS84 (EPSG:4326), não em UTM.`);
  }
}

// 2D, rounded, without consecutive duplicates created by the rounding.
function line(positions, where, minimum) {
  const out = [];
  for (const position of positions) {
    checkPosition(position, where);
    const next = [round(position[0]), round(position[1])];
    const last = out.at(-1);
    if (!last || last[0] !== next[0] || last[1] !== next[1]) out.push(next);
  }
  if (out.length < minimum) throw new PrepareError(`Geometria degenerada em ${where}: menos de ${minimum} vértices distintos após arredondar para ${DECIMALS} casas.`);
  return out;
}

function ring(positions, where) {
  const out = line(positions, where, 3);
  const [first, last] = [out[0], out.at(-1)];
  if (first[0] !== last[0] || first[1] !== last[1]) out.push([...first]);
  if (out.length < 4) throw new PrepareError(`Anel degenerado em ${where} após arredondar.`);
  return out;
}

function geometry(value, where) {
  if (!value) return value;
  const c = value.coordinates;
  switch (value.type) {
    case "Point": checkPosition(c, where); return { type: "Point", coordinates: [round(c[0]), round(c[1])] };
    case "MultiPoint": return { type: "MultiPoint", coordinates: c.map((position) => { checkPosition(position, where); return [round(position[0]), round(position[1])]; }) };
    case "LineString": return { type: "LineString", coordinates: line(c, where, 2) };
    case "MultiLineString": return { type: "MultiLineString", coordinates: c.map((part) => line(part, where, 2)) };
    case "Polygon": return { type: "Polygon", coordinates: c.map((part) => ring(part, where)) };
    case "MultiPolygon": return { type: "MultiPolygon", coordinates: c.map((polygon) => polygon.map((part) => ring(part, where))) };
    case "GeometryCollection": return { type: "GeometryCollection", geometries: value.geometries.map((item) => geometry(item, where)) };
    default: throw new PrepareError(`Tipo de geometria não suportado em ${where}: ${value.type}.`);
  }
}

// Geodesic length on the WGS84 ellipsoid with local radii per segment
// (error far below 1 mm for the short segments of a drainage line).
function lengthMeters(positions) {
  let total = 0;
  for (let i = 1; i < positions.length; i++) {
    const [lon1, lat1] = positions[i - 1];
    const [lon2, lat2] = positions[i];
    const phi = ((lat1 + lat2) / 2) * Math.PI / 180;
    const w = Math.sqrt(1 - E2 * Math.sin(phi) ** 2);
    const meridian = A * (1 - E2) / w ** 3;
    const normal = A / w;
    const dx = ((lon2 - lon1) * Math.PI / 180) * normal * Math.cos(phi);
    const dy = ((lat2 - lat1) * Math.PI / 180) * meridian;
    total += Math.hypot(dx, dy);
  }
  return total;
}

function checkCrs(data) {
  const name = data.crs?.properties?.name;
  if (name && !/CRS84|EPSG::?4326|EPSG:4326/i.test(name)) {
    throw new PrepareError(`CRS "${name}" não é WGS84 geográfico. Exporte do Global Mapper em WGS84 (EPSG:4326).`);
  }
}

function prepareContours(features, notes, interval) {
  if (!(interval > 0)) throw new PrepareError("--intervalo-mestra deve ser um número maior que zero.");
  const missing = [];
  for (const feature of features) {
    const { ELEVATION, ...rest } = feature.properties;
    const cota = typeof ELEVATION === "string" && ELEVATION.trim() !== "" ? Number(ELEVATION) : ELEVATION;
    if (typeof cota !== "number" || !Number.isFinite(cota)) { missing.push(describe(feature)); continue; }
    const remainder = Math.abs(cota % interval);
    const mestra = remainder < 1e-6 || Math.abs(remainder - interval) < 1e-6;
    feature.properties = { id: rest.id, cota_m: cota, mestra, ...rest };
  }
  if (missing.length) throw new PrepareError(`${missing.length} curva(s) sem ELEVATION numérico: ${list(missing)}. Confira o atributo exportado pelo Global Mapper.`);
  const masters = features.filter((feature) => feature.properties.mestra).length;
  notes.push(`Curvas: ELEVATION renomeado para cota_m; ${masters} de ${features.length} são mestras (a cada ${interval} m).`);
}

function prepareDrainage(features, originals, notes) {
  const segments = [];
  const undirected = [];
  for (const [index, feature] of features.entries()) {
    const source = originals[index].geometry;
    if (!source || source.type !== "LineString") {
      throw new PrepareError(`Drenagem só aceita LineString (${describe(feature)} é ${source?.type ?? "sem geometria"}). Separe MultiLineString em linhas simples antes.`);
    }
    const coords = source.coordinates;
    const [z1, z2] = [coords[0][2], coords.at(-1)[2]];
    const start = key(coords[0]);
    const end = key(coords.at(-1));
    if (start === end) { undirected.push(`${describe(feature)} (linha fechada)`); continue; }
    if (!Number.isFinite(z1) || !Number.isFinite(z2)) { undirected.push(`${describe(feature)} (sem Z)`); continue; }
    if (z1 === z2) { undirected.push(`${describe(feature)} (Z inicial = Z final = ${z1})`); continue; }
    const reversed = z1 < z2;
    if (reversed) feature.geometry.coordinates.reverse();
    segments.push({ feature, up: reversed ? end : start, down: reversed ? start : end, reversed });
  }
  if (undirected.length) {
    throw new PrepareError(`Rede sem sentido definido: ${undirected.length} trecho(s) sem Z de início/fim distintos: ${list(undirected)}. Exporte a drenagem com Z (3D) do Global Mapper ou corrija esses trechos.`);
  }

  const leaving = new Map();
  const arriving = new Map();
  for (const segment of segments) {
    if (!leaving.has(segment.up)) leaving.set(segment.up, []);
    leaving.get(segment.up).push(segment);
    if (!arriving.has(segment.down)) arriving.set(segment.down, []);
    arriving.get(segment.down).push(segment);
  }
  const multipleOutlets = segments
    .filter((segment) => (leaving.get(segment.down)?.length ?? 0) > 1)
    .map((segment) => `${describe(segment.feature)} -> ${leaving.get(segment.down).map((next) => describe(next.feature)).join(" e ")}`);
  if (multipleOutlets.length) {
    throw new PrepareError(`${multipleOutlets.length} trecho(s) com mais de uma saída (bifurcação): ${list(multipleOutlets)}. A ordem de Strahler exige uma única saída por trecho; corrija o sentido (Z) ou remova o braço.`);
  }

  // Kahn order: a line is ready when every line arriving at its upstream end is done.
  const pending = new Map(segments.map((segment) => [segment, arriving.get(segment.up)?.length ?? 0]));
  const queue = segments.filter((segment) => pending.get(segment) === 0);
  let done = 0;
  while (queue.length) {
    const segment = queue.shift();
    const inflow = (arriving.get(segment.up) ?? []).map((item) => item.order);
    const top = Math.max(0, ...inflow);
    segment.order = inflow.length === 0 ? 1 : inflow.filter((order) => order === top).length >= 2 ? top + 1 : top;
    done++;
    for (const next of leaving.get(segment.down) ?? []) {
      pending.set(next, pending.get(next) - 1);
      if (pending.get(next) === 0) queue.push(next);
    }
  }
  if (done !== segments.length) {
    const cycle = segments.filter((segment) => segment.order === undefined).map((segment) => describe(segment.feature));
    throw new PrepareError(`Rede sem sentido definido: ciclo entre ${cycle.length} trecho(s) (${list(cycle)}). Confira o Z de início e fim desses trechos.`);
  }

  // A tributary ending on an inner vertex of another line is not a confluence.
  const inner = new Map();
  for (const segment of segments) {
    for (const position of segment.feature.geometry.coordinates.slice(1, -1)) inner.set(key(position), segment);
  }
  const touching = segments
    .filter((segment) => !leaving.has(segment.down) && inner.has(segment.down))
    .map((segment) => `${describe(segment.feature)} em ${describe(inner.get(segment.down).feature)}`);
  if (touching.length) notes.push(`ATENÇÃO: ${touching.length} trecho(s) terminam no meio de outra linha e não contam como confluência: ${list(touching)}. Quebre as linhas nas confluências e rode de novo.`);

  for (const segment of segments) {
    const { STRAHLER, comprimento_m, ...rest } = segment.feature.properties;
    segment.feature.properties = {
      id: rest.id,
      STRAHLER: segment.order,
      comprimento_m: Math.round(lengthMeters(segment.feature.geometry.coordinates) * 10) / 10,
      ...rest,
    };
  }
  const counts = {};
  for (const segment of segments) counts[segment.order] = (counts[segment.order] ?? 0) + 1;
  const outlets = segments.filter((segment) => !leaving.has(segment.down)).length;
  const reversed = segments.filter((segment) => segment.reversed).length;
  notes.push(`Drenagem: ${segments.length} trechos, ${outlets} exutório(s), ordens ${Object.entries(counts).map(([order, count]) => `${order}: ${count}`).join(", ")}.`);
  if (reversed) notes.push(`Drenagem: ${reversed} trecho(s) desenhados de jusante para montante foram invertidos.`);
  if (originals.some((feature) => feature?.properties && ("STRAHLER" in feature.properties || "comprimento_m" in feature.properties))) notes.push("STRAHLER e comprimento_m recalculados pela topologia (valores de entrada descartados).");
}

function hasZ(value) {
  if (!value) return false;
  if (value.type === "GeometryCollection") return value.geometries.some(hasZ);
  let position = value.coordinates;
  while (Array.isArray(position?.[0])) position = position[0];
  return Array.isArray(position) && position.length > 2;
}

// Pure part, shared with checks.
function prepareGeoJson(data, options = {}) {
  const type = options.type ?? "generico";
  if (!TYPES.includes(type)) throw new PrepareError(`--tipo deve ser ${TYPES.join(", ")}.`);
  if (data?.type !== "FeatureCollection" || !Array.isArray(data.features)) throw new PrepareError("A entrada não é um GeoJSON FeatureCollection.");
  checkCrs(data);
  const notes = [];
  const hadStyle = data.features.some((feature) => feature?.properties && "KML_STYLE" in feature.properties);
  const hadZ = data.features.some((feature) => hasZ(feature?.geometry));
  const features = data.features.map((feature, index) => {
    const id = index + 1;
    const { KML_STYLE, id: _previousId, ...properties } = feature?.properties ?? {};
    return {
      type: "Feature",
      id,
      properties: { id, ...properties },
      geometry: geometry(feature?.geometry, `feição ${id}`),
    };
  });
  if (data.features.some((feature) => feature?.properties && "id" in feature.properties)) notes.push("Atributo id da entrada substituído pelo id sequencial.");
  notes.push(`${features.length} feições; id sequencial 1–${features.length}${hadStyle ? " no lugar de KML_STYLE" : ""}.`);
  notes.push(`Coordenadas em 2D${hadZ ? " (Z removido)" : ""}, arredondadas para ${DECIMALS} casas.`);
  if (type === "curvas") prepareContours(features, notes, options.masterInterval ?? 15);
  if (type === "drenagem") prepareDrainage(features, data.features, notes);
  return { geojson: { type: "FeatureCollection", features }, notes };
}

// One feature per line: compact for the R2 and still readable in a diff.
function serialize(collection) {
  return `{"type":"FeatureCollection","features":[\n${collection.features.map((feature) => JSON.stringify(feature)).join(",\n")}\n]}\n`;
}

function parseArgs(argv) {
  const positional = [];
  const options = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) { positional.push(arg); continue; }
    const value = argv[++i];
    if (value === undefined) throw new PrepareError(`Valor ausente para ${arg}.`);
    if (arg === "--tipo") options.type = value;
    else if (arg === "--intervalo-mestra") options.masterInterval = Number(value);
    else throw new PrepareError(`Opção desconhecida: ${arg}`);
  }
  if (positional.length !== 2 || !options.type) {
    throw new PrepareError("Uso: node scripts/prepare-geojson.cjs <entrada.geojson> <saida.geojson> --tipo generico|curvas|drenagem [--intervalo-mestra 15]");
  }
  [options.input, options.output] = positional;
  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.input === options.output) throw new PrepareError("A saída deve ser um arquivo diferente da entrada.");
  const text = fs.readFileSync(options.input, "utf8").replace(/^﻿/, "");
  let data;
  try { data = JSON.parse(text); } catch (error) { throw new PrepareError(`JSON inválido em ${options.input}: ${error.message}`); }
  const { geojson, notes } = prepareGeoJson(data, options);
  const output = serialize(geojson);
  fs.writeFileSync(options.output, output);
  const before = Buffer.byteLength(text);
  const after = Buffer.byteLength(output);
  console.log(`Gerado ${options.output} (${(after / 1024).toFixed(0)} KB; entrada ${(before / 1024).toFixed(0)} KB).`);
  for (const note of notes) console.log(`- ${note}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof PrepareError ? `Erro: ${error.message}` : error);
    process.exitCode = 1;
  }
}

module.exports = { prepareGeoJson, serialize, lengthMeters, PrepareError };
