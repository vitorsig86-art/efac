import type { LayerSource, ProjectLayerConfig, VectorPopupConfig } from "./types";

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
const fields = (entries: [string, string][]): VectorPopupConfig["fields"] => entries.map(([property, label]) => ({
  property, label: `${label} (${property})`, format: "raw",
}));

function macro(id: string, name: string, filename: string, subsection: string, style: GeoStyle,
  entries: [string, string][], credit: string, description = name): ProjectLayerConfig {
  return {
    id: `efac-macro-${id}`, name, description, kind: "vector", group: "macro", subsection,
    defaultVisible: false, opacityControl: true,
    extentActionLabel: id === "municipality" ? "Ver limites do município" : undefined,
    source: {
      format: "geojson", url: `${baseUrl}/${filename}.geojson`, credit,
      loadOnDemand: true, autoZoom: false, style,
      // Keep source coordinates, Z and attributes. No offsets or generated files.
      popup: {
        title: subsection === physical ? `${name} — IBGE (mapeamento regional)` : name,
        includeAllFields: true, fields: fields(entries),
      },
    },
  };
}

// Sources inspected locally in F:\EFAC 2026\webgis\vetores.
// Field units are preserved as supplied; bare numeric values gain no assumed unit.
export const efacMacroLayers: ProjectLayerConfig[] = [
  macro("ana-basin", "Microbacia ANA — Nível 7", "microbacia_ana", hydrology,
    polygon("#183F78", "#93BFE8", 0.08, 2.5), [
      ["wts_cd_pfafstetterbasin", "Código Pfafstetter"],
      ["wts_cd_pfafstetterbasincodeleve", "Nível Pfafstetter"],
      ["wts_gm_area", "Área — valor da fonte"], ["wts_pk", "Identificador ANA"],
    ], "ANA"),
  macro("ana-hydrography", "Hidrografia ANA", "drenagem_ana", hydrology,
    { ...polygon("#287AB4", "#8CC5E8", 0.18, 2), zIndex: 12 }, [
      ["wtc_pk", "Identificador do trecho"], ["idcda", "Código do trecho"],
      ["cocursodag", "Código do curso d’água"], ["nuordemcda", "Ordem oficial"],
      ["nunivotcda", "Nível Otto"], ["nuareabacc", "Área da bacia — valor da fonte"],
      ["nucompcda", "Comprimento — valor da fonte"], ["dedominial", "Dominialidade"],
      ["dsversao", "Versão da base"], ["detipomass", "Tipo de corpo d’água"],
      ["nmmun", "Município"], ["nuareakm2", "Área (km² conforme campo da fonte)"],
      ["nuareaha", "Área (ha conforme campo da fonte)"], ["nuperimkm", "Perímetro (km conforme campo da fonte)"],
    ], "ANA"),
  macro("simulated-basins", "Microbacias simuladas — Macro", "simu_microbacias", hydrology,
    { ...polygon("#798C83", "#B4D8C4", 0.18), fillByProperty: {
      property: "STREAM_ID",
      colors: Array.from({ length: 355 }, (_, index) => `hsl(${(index * 137.508) % 360}, 38%, 76%)`),
    } }, [
      ["STREAM_ID", "Identificador"], ["NEXT_STREAM_ID", "Trecho de jusante"],
      ["ENCLOSED_AREA", "Área"], ["PERIMETER", "Perímetro"], ["ISLAND_AREA", "Área de ilha"],
    ], "EFAC — dados simulados", "Microbacias simuladas em escala macro; independentes das microbacias do drone."),
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
    }, [
      ["STRAHLER", "Ordem de Strahler"], ["STREAM_ID", "Identificador do trecho"],
      ["DRAIN_AREA", "Área de contribuição"], ["IN_FLOW", "IN_FLOW"], ["OUT_FLOW", "OUT_FLOW"],
    ], "EFAC — dados simulados", "Drenagem simulada macro; larguras em pixels. Valores fora de 1–6 usam azul uniforme, sem recalcular ordens."),
  macro("geology", "Geologia", "geologia_ibge", physical, polygon("#94745E", "#C9A98F", 0.18), [
    ["nm_unidade", "Unidade geológica"], ["letra_simb", "Símbolo"], ["id_unidade", "Código da unidade"],
    ["nm_tempo_g", "Tempo geológico"], ["nm_provinc", "Província"], ["nm_sub_pro", "Subprovíncia"],
    ["nm_lito1", "Litologia 1"], ["nm_lito2", "Litologia 2"], ["nm_lito3", "Litologia 3"], ["nm_lito4", "Litologia 4"],
  ], "IBGE — cartografia regional", "Geologia regional do IBGE; não constitui diagnóstico de campo na EFAC."),
  macro("geomorphology", "Geomorfologia", "geomorfologia_ibge", physical, polygon("#B58C64", "#E2BD94", 0.18), [
    ["nm_unidade", "Unidade geomorfológica"], ["id_unidade", "Código da unidade"], ["nm_dominio", "Domínio"],
    ["nm_regiao", "Região"], ["letra_simb", "Símbolo"], ["categoria", "Categoria"], ["natureza", "Natureza"],
    ["caract", "Característica"], ["forma", "Forma"], ["dens_dren", "Densidade de drenagem"],
    ["aprof_inci", "Incisão"], ["compartime", "Compartimento"],
  ], "IBGE — cartografia regional", "Geomorfologia regional do IBGE; não constitui diagnóstico de campo na EFAC."),
  macro("soils", "Pedologia", "pedologia_ibge", physical, polygon("#96775B", "#C8AB8C", 0.18), [
    ["nom_unidad", "Unidade"], ["cod_simbol", "Símbolo"], ["legenda", "Classificação"],
    ["ordem", "Ordem"], ["subordem", "Subordem"], ["grande_gru", "Grande grupo"], ["subgrupos", "Subgrupo"],
    ["textura", "Textura"], ["horizonte", "Horizonte"], ["relevo", "Relevo"],
    ["componente", "Associação de solos"], ["component1", "Associação — continuação"],
  ], "IBGE — cartografia regional", "Pedologia regional do IBGE; não substitui análise de solo ou diagnóstico de campo."),
  macro("vegetation", "Vegetação", "vegetacao_ibge", physical, polygon("#688B68", "#A8C9A2", 0.18), [
    ["legenda", "Classificação"], ["nm_uantr", "Uso antrópico"], ["leg_uantr", "Código de uso"],
    ["nm_uveg", "Unidade de vegetação"], ["nm_pretet", "Vegetação pretérita"], ["veg_pretet", "Código pretérito"],
    ["nm_sec1", "Classe associada 1"], ["nm_sec2", "Classe associada 2"], ["leg_sup", "Dominância"],
    ["cd_fito", "Código fitogeográfico"],
  ], "IBGE — cartografia regional", "Vegetação e usos regionais do IBGE; não constitui inventário de campo da escola."),
  macro("climate", "Clima", "clima_ibge", physical, polygon("#7195AE", "#A9CCDF", 0.15), [
    ["ZONA", "Zona climática"], ["TP_UMIDADE", "Umidade"], ["DISTR_UMID", "Distribuição da umidade"],
    ["TEMPERATUR", "Temperatura"], ["DESC_COMPL", "Descrição da classificação"],
  ], "IBGE — cartografia regional", "Clima regional do IBGE; não representa medições meteorológicas locais na EFAC."),
  macro("municipality", "Município de Cruzília", "info_municipio", territorial,
    { ...polygon("#FFD166", "#CCD1D4", 0.02, 3), zIndex: 40 }, [
    ["BaseRurU_2", "Município"], ["BaseRurU_1", "Código municipal"], ["BaseRurUrb", "Estado"],
    ["BaseRurU_3", "Código UF"], ["Tipologia_", "Tipologia da fonte"],
    ["Classes_Po", "Classe populacional da fonte"], ["Classes_Pe", "Classe de urbanização da fonte"],
  ], "Contexto municipal — arquivo fornecido", "Contexto territorial de Cruzília. Indicadores reproduzem a fonte, sem ano de referência confirmado."),
];
