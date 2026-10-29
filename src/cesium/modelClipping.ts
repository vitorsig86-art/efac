import { Cartesian3, ClippingPolygon, ClippingPolygonCollection, type Cesium3DTileset } from "cesium";
import type { ModelClippingConfig } from "../projects/types";

export function validateClipping(config: ModelClippingConfig): void {
  const points = config.positions;
  if (typeof config.inverse !== "boolean" || points.length < 3
    || points.some(([lon, lat]) => !Number.isFinite(lon) || !Number.isFinite(lat) || Math.abs(lon) > 180 || Math.abs(lat) > 90)) {
    throw new Error("O recorte exige pelo menos 3 coordenadas geográficas válidas.");
  }
  // Local geographic polygons must be simple and have area. Reject crossed edges
  // instead of letting a malformed authoring polygon reach the renderer.
  const cross = (a: number[], b: number[], c: number[]) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const on = (a: number[], b: number[], p: number[]) => Math.abs(cross(a, b, p)) < 1e-14
    && p[0] >= Math.min(a[0], b[0]) && p[0] <= Math.max(a[0], b[0])
    && p[1] >= Math.min(a[1], b[1]) && p[1] <= Math.max(a[1], b[1]);
  let area = 0;
  const origin = points[0];
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    if (a[0] === b[0] && a[1] === b[1]) throw new Error("Remova os pontos repetidos do recorte.");
    area += (a[0] - origin[0]) * (b[1] - origin[1]) - (b[0] - origin[0]) * (a[1] - origin[1]);
    for (let j = i + 1; j < points.length; j++) {
      if (j === i + 1 || (i === 0 && j === points.length - 1)) continue;
      const c = points[j], d = points[(j + 1) % points.length];
      if ((cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0)
        || on(a, b, c) || on(a, b, d) || on(c, d, a) || on(c, d, b)) {
        throw new Error("As bordas do recorte não podem se cruzar.");
      }
    }
  }
  if (Math.abs(area) < 1e-14) throw new Error("Os pontos do recorte devem formar uma área.");
}

export function createModelClipping(config: ModelClippingConfig): ClippingPolygonCollection {
  validateClipping(config);
  return new ClippingPolygonCollection({
    enabled: config.enabled ?? true,
    inverse: config.inverse,
    polygons: [new ClippingPolygon({ positions: config.positions.map(([lon, lat]) => Cartesian3.fromDegrees(lon, lat)) })],
  });
}

export function applyModelClipping(tileset: Cesium3DTileset, config: ModelClippingConfig): ClippingPolygonCollection {
  if (tileset.isDestroyed()) throw new Error("Cannot clip a destroyed tileset.");
  const collection = createModelClipping(config);
  // The tileset owns and destroys its collection. The loader calls this once
  // per instance; visibility changes reuse the same tileset and clipping.
  try {
    tileset.clippingPolygons = collection;
  } catch (error) {
    if (!collection.isDestroyed()) collection.destroy();
    throw error;
  }
  return collection;
}
