import { efacMacroPopups } from "./efacMacroPopups";
import type { LayerSource, ProjectLayerConfig } from "./types";

type GeoStyle = NonNullable<Extract<LayerSource, { format: "geojson" }>["style"]>;
const baseUrl = "https://pub-35704a8663af43efb1306042dbd871ec.r2.dev/vetores";
const hydrology = "Hidrologia e microbacias";
const physical = "Caracterização física — IBGE";
const territorial = "Contexto territorial";

// PNG cartográfico, não fonte de elevação. Extensão do XML local em EPSG:4326.
// Separado dos vetores para anexar a imagem abaixo dos rasters do drone.
export const efacMacroDem: ProjectLayerConfig = {
  id: "efac-macro-dem",
  name: "DEM Macro",
  description: "Representação cartográfica regional do relevo; não fornece elevação ao terreno ou às medições.",
  kind: "raster",
  group: "macro",
  defaultVisible: false,
  opacityControl: true,
  source: {
    format: "tms",
    url: "https://pub-35704a8663af43efb1306042dbd871ec.r2.dev/dem_macro/{z}/{x}/{reverseY}.png",
    credit: "EFAC — DEM Macro",
    minimumLevel: 5,
    maximumLevel: 14,
    tileWidth: 256,
    tileHeight: 256,
    bounds: [-56.25, -31.952162238, -33.75, -11.178401874],
  },
};

const polygon = (stroke: string, fill: string, fillOpacity: number, strokeWidth = 1): GeoStyle => ({
  stroke, fill, fillOpacity, strokeWidth, clampToGround: true, zIndex: 1,
});

function macro(id: string, name: string, filename: string, subsection: string, style: GeoStyle,
  credit: string, description = name): ProjectLayerConfig {
  return {
    id: `efac-macro-${id}`, name, description, kind: "vector", group: "macro", subsection,
    defaultVisible: false, opacityControl: true,
    extentActionLabel: id === "municipality" ? "Ver limites do município" : undefined,
    source: {
      format: "geojson", url: `${baseUrl}/${filename}.geojson`, credit,
      loadOnDemand: true, autoZoom: false, style,
      // Keep source coordinates, Z and attributes. No offsets or generated files.
      popup: { ...efacMacroPopups[id], presentation: "andrelandia" },
    },
  };
}

// Sources inspected locally in F:\EFAC 2026\webgis\vetores.
// Popup units and precision follow Andrelândia; source files remain unchanged.
export const efacMacroLayers: ProjectLayerConfig[] = [
  macro("ana-basin", "Microbacia ANA — Nível 7", "microbacia_ana", hydrology,
    polygon("#183F78", "#93BFE8", 0.08, 2.5), "ANA"),
  macro("ana-hydrography", "Hidrografia ANA", "drenagem_ana", hydrology,
    { ...polygon("#287AB4", "#8CC5E8", 0.18, 2), zIndex: 12 }, "ANA"),
  macro("simulated-basins", "Microbacias simuladas — Macro", "simu_microbacias", hydrology,
    { ...polygon("#798C83", "#B4D8C4", 0.18), fillByProperty: {
      property: "STREAM_ID",
      colors: Array.from({ length: 355 }, (_, index) => `hsl(${(index * 137.508) % 360}, 38%, 76%)`),
    } }, "EFAC — dados simulados", "Microbacias simuladas em escala macro; independentes das microbacias do drone."),
  macro("simulated-drainage", "Drenagem simulada — Macro", "simu_drenagens", hydrology,
    { stroke: "#2457B2", strokeWidth: 1.2, fill: "#00000000", clampToGround: true, zIndex: 20,
      classification: { property: "STRAHLER", classes: {
        "1": { stroke: "#15DEEF", strokeWidth: 1.2, zIndex: 20 },
        "2": { stroke: "#08B5ED", strokeWidth: 1.8, zIndex: 21 },
        "3": { stroke: "#0087EB", strokeWidth: 2.6, zIndex: 22 },
        "4": { stroke: "#0062E8", strokeWidth: 3.8, zIndex: 23 },
        "5": { stroke: "#003DE0", strokeWidth: 5.2, zIndex: 24 },
        "6": { stroke: "#002C9C", strokeWidth: 6, zIndex: 25 },
      } },
    }, "EFAC — dados simulados", "Drenagem simulada macro; larguras em pixels. Valores fora de 1–6 usam azul uniforme, sem recalcular ordens."),
  macro("geology", "Geologia", "geologia_ibge", physical, polygon("#94745E", "#C9A98F", 0.18), "IBGE — cartografia regional", "Geologia regional do IBGE; não constitui diagnóstico de campo na EFAC."),
  macro("geomorphology", "Geomorfologia", "geomorfologia_ibge", physical, polygon("#B58C64", "#E2BD94", 0.18), "IBGE — cartografia regional", "Geomorfologia regional do IBGE; não constitui diagnóstico de campo na EFAC."),
  macro("soils", "Pedologia", "pedologia_ibge", physical, polygon("#96775B", "#C8AB8C", 0.18), "IBGE — cartografia regional", "Pedologia regional do IBGE; não substitui análise de solo ou diagnóstico de campo."),
  macro("vegetation", "Vegetação", "vegetacao_ibge", physical, polygon("#688B68", "#A8C9A2", 0.18), "IBGE — cartografia regional", "Vegetação e usos regionais do IBGE; não constitui inventário de campo da escola."),
  macro("climate", "Clima", "clima_ibge", physical, polygon("#7195AE", "#A9CCDF", 0.15), "IBGE — cartografia regional", "Clima regional do IBGE; não representa medições meteorológicas locais na EFAC."),
  macro("municipality", "Município de Cruzília", "info_municipio", territorial,
    { ...polygon("#FFD166", "#CCD1D4", 0.02, 3), zIndex: 40 }, "Contexto municipal — arquivo fornecido", "Contexto territorial de Cruzília. Indicadores reproduzem a fonte, sem ano de referência confirmado."),
];
