import { useEffect, useRef, useState } from "react";
import { Cesium3DTileset, GeoJsonDataSource, ImageryLayer, SplitDirection, type Viewer } from "cesium";
import { applyProjectCamera, beginManagedFlight } from "../cesium/projectCamera";
import { assertImageryLayerReady, attachLayer, createBasemapFallback, isBasemapFallback, loadLayer, removeLayer, setVectorOpacity, setVectorVisibility, type LoadedLayer } from "../cesium/loadLayer";
import { createImageryTileErrorHandler } from "../cesium/imageryTileErrors";
import { createModelTerrainCutout } from "../cesium/modelTerrainCutout";
import type { LayerStatus, ProjectConfig, TemporalComparisonSelection } from "../projects/types";
import { isTemporalLayer } from "../projects/layerVisibility";
import { resolveDrainageStyle } from "../projects/drainageStyle";

export function useProjectLayers(viewer: Viewer | null, project: ProjectConfig, visible: Set<string>, comparison: TemporalComparisonSelection | null = null) {
  const loaded = useRef(new Map<string, LoadedLayer>());
  const opacityRef = useRef(new Map<string, number>());
  const [rasterOpacities, setRasterOpacities] = useState<Record<string, number>>({});
  const visibleRef = useRef(visible);
  const loadVisibleTilesRef = useRef<(() => void) | null>(null);
  const loadVisibleVectorsRef = useRef<(() => void) | null>(null);
  const terrainCutouts = useRef(new Map<string, ReturnType<typeof createModelTerrainCutout>>());
  visibleRef.current = visible;
  const comparisonRef = useRef(comparison);
  comparisonRef.current = comparison;

  function applyTemporalSplit(id: string, layer: ImageryLayer) {
    if (!project.layers.some(definition => definition.id === id && isTemporalLayer(definition))) return;
    const selection = comparisonRef.current;
    layer.splitDirection = !selection || selection.left === selection.right ? SplitDirection.NONE
      : id === selection.left ? SplitDirection.LEFT
      : id === selection.right ? SplitDirection.RIGHT : SplitDirection.NONE;
  }
  const [statuses, setStatuses] = useState<Record<string, LayerStatus>>({});
  const [mapWarning, setMapWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;
    let cancelled = false;
    const resources = new Map<string, LoadedLayer>();
    loaded.current = resources;
    const unsubscribe: (() => void)[] = [];
    setMapWarning(null);
    setStatuses(Object.fromEntries(project.layers.map((layer) => [layer.id,
      layer.source.format === "3d-tiles" || (layer.source.format === "geojson" && layer.source.loadOnDemand) ? "idle" : "loading",
    ])));
    applyProjectCamera(viewer, project);

    const pendingTiles = new Set<string>();
    const failedTiles = new Set<string>();
    const loadVisibleTiles = () => {
      if (cancelled || viewer.isDestroyed()) return;
      for (const definition of project.layers) {
        if (definition.source.format !== "3d-tiles") continue;
        if (!visibleRef.current.has(definition.id)) {
          failedTiles.delete(definition.id);
          continue;
        }
        if (resources.has(definition.id) || pendingTiles.has(definition.id) || failedTiles.has(definition.id)) continue;
        pendingTiles.add(definition.id);
        setStatuses((current) => ({ ...current, [definition.id]: "loading" }));
        void (async () => {
          try {
            const layer = await loadLayer(definition);
            if (!(layer instanceof Cesium3DTileset)) throw new Error("Expected a 3D Tiles layer.");
            if (cancelled || viewer.isDestroyed()) {
              if (!layer.isDestroyed()) layer.destroy();
              return;
            }
            resources.set(definition.id, layer);
            layer.show = visibleRef.current.has(definition.id);
            let reportedTileFailure = false;
            unsubscribe.push(layer.tileFailed.addEventListener(() => {
              if (cancelled || reportedTileFailure) return;
              reportedTileFailure = true;
              console.warn(`Tile loading failed for ${definition.name}; further tile errors are suppressed.`);
            }));
            await attachLayer(viewer, layer);
            if (cancelled || viewer.isDestroyed()) {
              removeLayer(viewer, layer);
              return;
            }
            if (definition.source.format === "3d-tiles" && definition.source.terrainCutout && definition.source.clipping && definition.source.clipping.enabled !== false) {
              const cutout = createModelTerrainCutout(viewer, definition.source.clipping);
              terrainCutouts.current.set(definition.id, cutout);
              cutout.setVisible(layer.show);
            }
            setStatuses((current) => ({ ...current, [definition.id]: "ready" }));
            viewer.scene.requestRender();
          } catch {
            if (cancelled || viewer.isDestroyed()) return;
            const failedLayer = resources.get(definition.id);
            if (failedLayer) {
              terrainCutouts.current.get(definition.id)?.dispose();
              terrainCutouts.current.delete(definition.id);
              removeLayer(viewer, failedLayer);
              resources.delete(definition.id);
            }
            if (visibleRef.current.has(definition.id)) failedTiles.add(definition.id);
            console.error(`Unable to load ${definition.name}. Check the configured source and local token.`);
            setStatuses((current) => ({ ...current, [definition.id]: "error" }));
          } finally {
            pendingTiles.delete(definition.id);
          }
        })();
      }
    };
    loadVisibleTilesRef.current = loadVisibleTiles;
    loadVisibleTiles();

    const pendingVectors = new Set<string>();
    const failedVectors = new Set<string>();
    const loadVisibleVectors = () => {
      if (cancelled || viewer.isDestroyed()) return;
      for (const definition of project.layers) {
        if (definition.source.format !== "geojson" || !definition.source.loadOnDemand) continue;
        if (!visibleRef.current.has(definition.id)) {
          failedVectors.delete(definition.id);
          continue;
        }
        if (resources.has(definition.id) || pendingVectors.has(definition.id) || failedVectors.has(definition.id)) continue;
        pendingVectors.add(definition.id);
        setStatuses((current) => ({ ...current, [definition.id]: "loading" }));
        void (async () => {
          let pendingLayer: GeoJsonDataSource | undefined;
          try {
            const layer = await loadLayer(resolveDrainageStyle(definition));
            if (!(layer instanceof GeoJsonDataSource)) throw new Error("Expected a GeoJSON datasource.");
            pendingLayer = layer;
            if (cancelled || viewer.isDestroyed()) {
              removeLayer(viewer, layer);
              layer.entities.removeAll();
              return;
            }
            setVectorVisibility(layer, false);
            await attachLayer(viewer, layer);
            if (cancelled || viewer.isDestroyed()) {
              removeLayer(viewer, layer);
              layer.entities.removeAll();
              return;
            }
            resources.set(definition.id, layer);
            if (definition.opacityControl) setVectorOpacity(layer, opacityRef.current.get(definition.id) ?? 1);
            setVectorVisibility(layer, visibleRef.current.has(definition.id));
            setStatuses((current) => ({ ...current, [definition.id]: "ready" }));
            // Lazy loading must not move the configured opening/Home camera.
            viewer.scene.requestRender();
          } catch {
            if (pendingLayer) {
              removeLayer(viewer, pendingLayer);
              pendingLayer.entities.removeAll();
            }
            resources.delete(definition.id);
            if (cancelled || viewer.isDestroyed()) return;
            if (visibleRef.current.has(definition.id)) failedVectors.add(definition.id);
            console.error(`Unable to load vector layer ${definition.id}. Check the configured source.`);
            setStatuses((current) => ({ ...current, [definition.id]: "error" }));
            viewer.scene.requestRender();
          } finally {
            pendingVectors.delete(definition.id);
          }
        })();
      }
    };
    loadVisibleVectorsRef.current = loadVisibleVectors;
    loadVisibleVectors();

    // Sequential attachment preserves imagery stack order. React cleanup guards
    // late async results when a project changes or StrictMode remounts the app.
    void (async () => {
      for (const definition of project.layers) {
        if (cancelled || viewer.isDestroyed()) return;
        if (definition.source.format === "3d-tiles") continue;
        if (definition.source.format === "geojson" && definition.source.loadOnDemand) continue;
        let pendingLayer: LoadedLayer | undefined;
        try {
          const layer = await loadLayer(resolveDrainageStyle(definition));
          pendingLayer = layer;
          if (cancelled || viewer.isDestroyed()) {
            if (layer instanceof ImageryLayer && !layer.isDestroyed()) layer.destroy();
            return;
          }
          const isRaster = definition.source.format === "tms" || definition.source.format === "xyz";
          // Keep newly constructed rasters hidden until attachment completes.
          // Publish only attached layers so the toggle effect cannot expose one
          // while the attachment promise is pending.
          layer.show = isRaster ? false : visibleRef.current.has(definition.id);
          if (layer instanceof GeoJsonDataSource) setVectorVisibility(layer, layer.show);
          if (definition.kind === "basemap" && layer instanceof ImageryLayer) {
            viewer.imageryLayers.add(layer, 0);
          } else {
            await attachLayer(viewer, layer);
          }
          if (cancelled || viewer.isDestroyed()) {
            removeLayer(viewer, layer);
            return;
          }
          resources.set(definition.id, layer);
          if (layer instanceof ImageryLayer) applyTemporalSplit(definition.id, layer);
          if (isRaster && layer instanceof ImageryLayer) layer.alpha = opacityRef.current.get(definition.id) ?? 1;
          if (definition.opacityControl && layer instanceof GeoJsonDataSource) setVectorOpacity(layer, opacityRef.current.get(definition.id) ?? 1);
          if (layer instanceof ImageryLayer) {
            const handleTileError = createImageryTileErrorHandler(definition, setMapWarning, import.meta.env.DEV, layer.imageryProvider);
            unsubscribe.push(handleTileError.dispose);
            unsubscribe.push(layer.imageryProvider.errorEvent.addEventListener((tileError) => {
              if (cancelled) return;
              if (definition.source.format === "ion-world-imagery" && !isBasemapFallback(layer)) {
                if (viewer.isDestroyed() || resources.get(definition.id) !== layer) return;
                tileError.retry = false;
                // Replace only the failed basemap; preserve overlay order and visibility.
                const fallback = createBasemapFallback(definition);
                fallback.show = visibleRef.current.has(definition.id);
                viewer.imageryLayers.remove(layer, true);
                viewer.imageryLayers.add(fallback, 0);
                resources.set(definition.id, fallback);
                unsubscribe.push(fallback.imageryProvider.errorEvent.addEventListener((error) => {
                  if (!cancelled) handleTileError(error);
                }));
                console.warn("Bing Aerial unavailable · OpenStreetMap fallback");
                setStatuses((current) => ({ ...current, [definition.id]: "fallback" }));
                viewer.scene.requestRender();
                return;
              }
              handleTileError(tileError);
            }));
          }
          setStatuses((current) => ({ ...current, [definition.id]: isBasemapFallback(layer) ? "fallback" : "ready" }));
          if (isRaster) layer.show = visibleRef.current.has(definition.id);
          if (layer instanceof GeoJsonDataSource && layer.show
            && definition.source.format === "geojson" && definition.source.autoZoom !== false) {
            await viewer.zoomTo(layer);
          }
          if (!cancelled && !viewer.isDestroyed()) viewer.scene.requestRender();
        } catch (cause) {
          if (cancelled || viewer.isDestroyed()) return;
          if (pendingLayer) removeLayer(viewer, pendingLayer);
          resources.delete(definition.id);
          console.error(`Unable to load layer ${definition.id}`, cause);
          setStatuses((current) => ({ ...current, [definition.id]: "error" }));
          if (definition.source.format === "tms" || definition.source.format === "xyz") {
            setMapWarning(`Não foi possível inicializar ${definition.name}. Verifique a configuração, a URL e os níveis de zoom da fonte.`);
          }
        }
      }
    })();

    return () => {
      cancelled = true;
      if (loadVisibleTilesRef.current === loadVisibleTiles) loadVisibleTilesRef.current = null;
      if (loadVisibleVectorsRef.current === loadVisibleVectors) loadVisibleVectorsRef.current = null;
      if (!viewer.isDestroyed()) viewer.camera.cancelFlight();
      unsubscribe.forEach((remove) => remove());
      for (const cutout of terrainCutouts.current.values()) cutout.dispose();
      terrainCutouts.current.clear();
      for (const layer of resources.values()) removeLayer(viewer, layer);
      resources.clear();
      if (!viewer.isDestroyed()) viewer.scene.requestRender();
    };
  }, [viewer, project]);

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;
    for (const [id, layer] of loaded.current) {
      if (layer instanceof ImageryLayer) {
        assertImageryLayerReady(layer);
        applyTemporalSplit(id, layer);
      }
      layer.show = visible.has(id);
      if (layer instanceof GeoJsonDataSource) setVectorVisibility(layer, layer.show);
      terrainCutouts.current.get(id)?.setVisible(layer.show);
    }
    loadVisibleTilesRef.current?.();
    loadVisibleVectorsRef.current?.();
    viewer.scene.requestRender();
  }, [viewer, visible, comparison]);

  function setRasterOpacity(id: string, percent: number): void {
    const definition = project.layers.find((layer) => layer.id === id);
    if (!definition || definition.kind === "basemap"
      || (definition.source.format !== "tms" && definition.source.format !== "xyz" && !(definition.source.format === "geojson" && definition.opacityControl))
      || !Number.isFinite(percent)) return;
    const value = Math.min(100, Math.max(0, percent));
    opacityRef.current.set(id, value / 100);
    setRasterOpacities((current) => ({ ...current, [id]: value }));
    const layer = loaded.current.get(id);
    if (!viewer || viewer.isDestroyed()) return;
    if (layer instanceof ImageryLayer && !layer.isDestroyed()) layer.alpha = value / 100;
    else if (layer instanceof GeoJsonDataSource) setVectorOpacity(layer, value / 100);
    else return;
    viewer.scene.requestRender();
  }

  function getModel(id: string): Cesium3DTileset | null {
    const layer = loaded.current.get(id);
    return layer instanceof Cesium3DTileset && !layer.isDestroyed() ? layer : null;
  }

  async function viewLayerExtent(id: string): Promise<void> {
    const layer = loaded.current.get(id);
    if (!viewer || viewer.isDestroyed() || !(layer instanceof GeoJsonDataSource) || !layer.show) return;
    const end = beginManagedFlight(viewer);
    try {
      await viewer.flyTo(layer, { duration: 1.2 });
    } catch {
      if (!viewer.isDestroyed()) setMapWarning("Não foi possível enquadrar a camada. Aguarde o carregamento e tente novamente.");
    } finally {
      end();
    }
  }

  return { statuses, mapWarning, rasterOpacities, setRasterOpacity, getModel, viewLayerExtent };
}
