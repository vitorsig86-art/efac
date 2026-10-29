import type { LayerSource } from "./types";

// Paleta suave para os até 23 STREAM_ID distintos, ordenados pelo loader.
// Um mesmo identificador conserva a cor ao alternar a visibilidade da camada.
export const microbasinStyle = {
  stroke: "#6E8C83",
  strokeWidth: 1,
  fill: "#B4D8C4",
  fillByProperty: {
    property: "STREAM_ID",
    colors: Array.from({ length: 23 }, (_, index) => `hsl(${(index * 137.508) % 360}, 40%, 76%)`),
  },
  fillOpacity: 0.2,
  clampToGround: true,
  zIndex: 2,
} satisfies NonNullable<Extract<LayerSource, { format: "geojson" }>["style"]>;
