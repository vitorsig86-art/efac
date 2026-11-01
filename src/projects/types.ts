// Thematic data and transport format are separate: several themes share a loader.
export type LayerKind =
  | "raster"
  | "vector"
  | "basemap"
  | "orthomosaic"
  | "dtm"
  | "dsm"
  | "slope"
  | "solar-orientation"
  // Slope aspect (orientação de vertentes), a terrain derivative; not solar exposure.
  | "aspect"
  | "ndvi"
  | "multispectral"
  | "property-boundary"
  | "drainage"
  | "contours"
  | "3d-tiles";

// Geographic rectangles use longitude/latitude degrees.
export type GeographicBounds = [west: number, south: number, east: number, north: number];

export type LayerSource =
  | { format: "3d-tiles"; source?: "url"; url: string; clipping?: ModelClippingConfig; heightOffsetMeters?: number; terrainCutout?: boolean }
  | { format: "3d-tiles"; source: "ion"; assetId: number; tokenEnv?: string; clipping?: ModelClippingConfig; heightOffsetMeters?: number; terrainCutout?: boolean }
  | {
    format: "ion-world-imagery";
    fallback: { url: string; credit: string; maximumLevel: number };
  }
  | {
    format: "xyz" | "tms";
    url: string;
    credit: string;
    // Imagery tile zoom levels, independent of camera height/navigation limits.
    minimumLevel?: number;
    maximumLevel?: number;
    bounds?: GeographicBounds;
    tileWidth?: number;
    tileHeight?: number;
  }
  | {
    format: "geojson";
    url: string;
    // Fetch once on first activation, then retain the loaded datasource while hidden.
    loadOnDemand?: boolean;
    // Optional attribution (GeoJsonDataSource credit). Cesium shows it while the
    // layer is loaded, even when switched off: hidden vectors stay attached.
    credit?: string;
    // Explicit opt-in for simulated drainage only; requires kind: "drainage".
    symbology?: "simulated-drainage-strahler";
    autoZoom?: boolean;
    popup?: VectorPopupConfig;
    ignoreAltitude?: boolean;
    uniqueFeatureIds?: boolean;
    style?: {
      stroke: string;
      strokeWidth: number;
      outline?: { property: string; width: number; colors: string[]; fallbackColor?: string };
      polygonOutline?: boolean;
      classification?: {
        property: string;
        classes: Record<string, { fill?: string; fillOpacity?: number; stroke?: string; strokeWidth?: number; zIndex?: number }>;
      };
      fill?: string;
      fillByProperty?: { property: string; colors: string[] };
      fillOpacity?: number;
      clampToGround?: boolean;
      zIndex?: number;
    };
  };

export interface ProjectLayerConfig {
  id: string;
  name: string;
  description: string;
  kind: LayerKind;
  source: LayerSource;
  defaultVisible: boolean;
  opacityControl?: boolean;
  extentActionLabel?: string;
  legend?: LegendConfig;
  legendMode?: "external" | "embedded";
  group?: "basemap" | "raster" | "vector" | "model" | "macro";
  subsection?: string;
  exclusiveGroup?: string;
  // Opt in only on configured XYZ/TMS overlays. One temporal series per project.
  temporalCampaign?: { label: string; description: string; comparisonLabel?: string };
}

export interface VectorPopupConfig {
  // Opt in only for macro layers curated in the Andrelândia reference.
  presentation?: "andrelandia";
  // Opt in to displaying actual source attributes without assuming a schema.
  includeAllFields?: boolean;
  title?: string;
  titleProperty?: string;
  titlePrefix?: string;
  titleSuffix?: string;
  fields: {
    property: string;
    section?: string;
    unit?: "m" | "km" | "ha" | "km²";
    ratioTo?: string;
    valueLabels?: Record<string, string>;
    label?: string;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    format?: "integer" | "decimal" | "raw";
    numberFormat?: { locale: string; decimalPlaces: number };
  }[];
}

// Geographic polygon vertices in longitude/latitude degrees, without a repeated closing vertex.
export interface ModelClippingConfig {
  enabled?: boolean;
  inverse: boolean;
  positions: [longitude: number, latitude: number][];
}

// Navigation limit derived from ProjectConfig.bounds.
export interface NavigationConfig {
  // Default true when bounds exist.
  enabled?: boolean;
  // Margin on each side as a fraction of the largest bounds dimension. Default 0.25.
  marginRatio?: number;
  // Maximum camera height above the ground, in meters. Default: twice the
  // largest side of the area with margin, at least 2000 m.
  maximumZoomDistance?: number;
}

// Position and orientation angles are degrees; height is meters above the ellipsoid.
export interface CameraConfig {
  longitude: number;
  latitude: number;
  height: number;
  heading: number;
  pitch: number;
  roll: number;
}

export type WorkspaceSectionId = "basemap" | "raster" | "vector" | "model" | "macro";

// Layer panel presentation. Every option keeps the current behavior when omitted.
export interface PanelConfig {
  // Show the "Buscar camada" field. Default false.
  showLayerSearch?: boolean;
  // Section order. Sections left out follow in the default order
  // (basemap, model, raster, vector, macro), so none disappears.
  sectionOrder?: WorkspaceSectionId[];
  // Sections that start open in addition to those with an active layer.
  // Default ["model"]; [] keeps only active sections open.
  // Only the section opens; no layer is turned on.
  expandedSections?: WorkspaceSectionId[];
}

export interface ProjectConfig {
  id: string;
  name: string;
  location: string;
  // Project area [W, S, E, N] in degrees. It defines the navigation limit;
  // when absent there is no limit (e.g. the template's neutral globe view).
  bounds?: GeographicBounds;
  navigation?: NavigationConfig;
  initialCamera: CameraConfig;
  layers: ProjectLayerConfig[];
  scenes?: QuickScene[];
  diagnostic?: { steps: DiagnosticStep[] };
  temporalComparison?: TemporalComparisonSelection;
  panel?: PanelConfig;
  developmentTools?: { modelAlignment?: boolean };
}

export interface QuickScene {
  id: string;
  label: string;
  description?: string;
  // Exact visible set, including the basemap when wanted.
  layerIds: string[];
  // Optional saved view (same format as initialCamera); the scene flies there.
  camera?: CameraConfig;
}

export interface DiagnosticStep {
  title: string;
  text: string;
  layerIds?: string[];
  facts?: { label: string; value: string }[];
  references?: string[];
}

export interface TemporalComparisonSelection {
  left: string;
  right: string;
}

export type LayerStatus = "idle" | "loading" | "ready" | "fallback" | "error";

export type LegendConfig = GradientLegendConfig | ImageLegendConfig;

export interface ImageLegendConfig {
  type: "image";
  title: string;
  imageUrl: string;
  imageAlt: string;
}

export interface GradientLegendConfig {
  type?: "gradient";
  title: string;
  min: number;
  max: number;
  tickValues: number[];
  decimalPlaces?: number;
  // Percentage positions run from the minimum (bottom) to maximum (top).
  gradientStops: { position: number; color: string }[];
}
