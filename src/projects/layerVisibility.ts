import type { ProjectLayerConfig } from "./types";

export function isTemporalLayer(layer: ProjectLayerConfig): layer is ProjectLayerConfig & {
  temporalCampaign: NonNullable<ProjectLayerConfig["temporalCampaign"]>;
} {
  return Boolean(layer.temporalCampaign) && layer.kind !== "basemap"
    && (layer.source.format === "tms" || layer.source.format === "xyz");
}

// Shared by defaults, scenes, diagnostic steps and manual selection. Unknown IDs
// are ignored; the last requested layer wins within each exclusive group.
export function configuredVisibility(layers: ProjectLayerConfig[], ids: Iterable<string>): Set<string> {
  const visible = new Set<string>();
  for (const id of ids) {
    const layer = layers.find(candidate => candidate.id === id);
    if (!layer) continue;
    for (const activeId of visible) {
      const active = layers.find(candidate => candidate.id === activeId);
      if (active && ((layer.exclusiveGroup && active.exclusiveGroup === layer.exclusiveGroup)
        || (isTemporalLayer(layer) && isTemporalLayer(active)))) visible.delete(activeId);
    }
    visible.add(id);
  }
  return visible;
}
