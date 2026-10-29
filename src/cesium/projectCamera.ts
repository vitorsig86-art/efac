import { Cartesian3, Math as CesiumMath, type Viewer } from "cesium";
import type { ProjectConfig, CameraConfig } from "../projects/types";

export function createCameraView(camera: CameraConfig) {
  return {
    destination: Cartesian3.fromDegrees(camera.longitude, camera.latitude, camera.height),
    orientation: {
      heading: CesiumMath.toRadians(camera.heading),
      pitch: CesiumMath.toRadians(camera.pitch),
      roll: CesiumMath.toRadians(camera.roll),
    },
  };
}

// Immediate opening view.
export function applyProjectCamera(viewer: Viewer, project: ProjectConfig): void {
  if (viewer.isDestroyed()) return;
  viewer.camera.cancelFlight();
  viewer.camera.setView(createCameraView(project.initialCamera));
  viewer.scene.requestRender();
}

// Flights started by the app (Home, scenes, GPS) may arc outside the
// navigation limit; the limit waits until they complete or are cancelled.
const managedFlights = new WeakMap<Viewer, number>();

export function beginManagedFlight(viewer: Viewer): () => void {
  managedFlights.set(viewer, (managedFlights.get(viewer) ?? 0) + 1);
  let ended = false;
  return () => {
    if (ended) return;
    ended = true;
    managedFlights.set(viewer, Math.max(0, (managedFlights.get(viewer) ?? 1) - 1));
    if (!viewer.isDestroyed()) viewer.scene.requestRender();
  };
}

export function isManagedFlightActive(viewer: Viewer): boolean {
  return (managedFlights.get(viewer) ?? 0) > 0;
}

// Animated move to a configured view: Home and scenes with a camera.
export function flyToCamera(viewer: Viewer, camera: CameraConfig, duration = 1.2): void {
  if (viewer.isDestroyed()) return;
  const end = beginManagedFlight(viewer);
  viewer.camera.flyTo({ ...createCameraView(camera), duration, complete: end, cancel: end });
  viewer.scene.requestRender();
}
