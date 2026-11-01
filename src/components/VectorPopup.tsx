import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Cartesian2, Entity, ScreenSpaceEventHandler, ScreenSpaceEventType, type Viewer } from "cesium";
import { readVectorPopup, resolveVectorPopupSelection } from "../cesium/vectorPopup";
import { placePopup, type ScreenPoint } from "./popupPosition";
import { Icon } from "./icons";
import "./VectorPopup.css";

export function VectorPopup({ viewer }: { viewer: Viewer | null }) {
  const [popup, setPopup] = useState<ReturnType<typeof readVectorPopup>>(null);
  const popupRef = useRef<HTMLElement>(null);
  const clickRef = useRef<ScreenPoint | null>(null);
  const [anchor, setAnchor] = useState<ScreenPoint | null>(null);
  const [placement, setPlacement] = useState<{ left: number; top: number; maxWidth: number; maxHeight: number } | null>(null);
  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;
    const canvas = viewer.canvas;
    const handler = new ScreenSpaceEventHandler(canvas);
    const measurementActive = () => Boolean(canvas.closest(".app-shell")?.querySelector('.measurement-toolbar button[aria-pressed="true"]'));
    const update = () => {
      if (viewer.isDestroyed()) return;
      const next = measurementActive() ? null : readVectorPopup(viewer.selectedEntity, viewer.clock.currentTime);
      setPopup(current => JSON.stringify(current) === JSON.stringify(next) ? current : next);
      setAnchor(clickRef.current);
    };
    // Own disposable handler: mouse/touch use Cesium's canvas coordinates,
    // without depending on the native click event or a previous selection.
    handler.setInputAction((event: { position: Cartesian2 }) => {
      if (viewer.isDestroyed()) return;
      if (measurementActive()) { setPopup(null); return; }
      const bounds = canvas.getBoundingClientRect();
      clickRef.current = { x: bounds.left + event.position.x, y: bounds.top + event.position.y };
      const hits = viewer.scene.drillPick(event.position);
      const entities = hits.map(hit => hit.id ?? hit.primitive?.id).filter((id): id is Entity => id instanceof Entity);
      // Use only entities hit by this click, never an entity left selected elsewhere.
      // The resolver preserves measurement entities and prioritizes vector zIndex.
      const selected = resolveVectorPopupSelection(entities[0], entities, viewer.clock.currentTime);
      if (readVectorPopup(selected, viewer.clock.currentTime)) {
        viewer.selectedEntity = selected;
      } else if (readVectorPopup(viewer.selectedEntity, viewer.clock.currentTime)) {
        viewer.selectedEntity = undefined;
      }
      update();
    }, ScreenSpaceEventType.LEFT_CLICK);
    update();
    const remove = viewer.selectedEntityChanged.addEventListener(update);
    const removeRender = viewer.scene.postRender.addEventListener(update);
    return () => {
      removeRender();
      remove();
      handler.destroy();
    };
  }, [viewer]);

  useLayoutEffect(() => {
    if (!popup || !viewer || viewer.isDestroyed() || !popupRef.current) return;
    const element = popupRef.current;
    const shell = element.closest(".app-shell");
    const controls = [...(shell?.querySelectorAll<HTMLElement>(".measurement-controls, .navigation-controls, .raster-legend-stack, .map-alert, .cesium-viewer-bottom, .mobile-bar") ?? [])];
    const position = () => {
      if (viewer.isDestroyed()) return;
      const map = viewer.canvas.getBoundingClientRect();
      const bounds = { left: Math.max(0, map.left), top: Math.max(0, map.top), right: Math.min(window.innerWidth, map.right), bottom: Math.min(window.innerHeight, map.bottom) };
      const maxWidth = Math.max(0, Math.min(300, bounds.right - bounds.left - 24));
      const maxHeight = Math.max(0, bounds.bottom - bounds.top - 24);
      // Constrain before measuring so wrapping is included in collision checks.
      element.style.maxWidth = `${maxWidth}px`;
      element.style.maxHeight = `${maxHeight}px`;
      const rect = element.getBoundingClientRect();
      const obstacles = controls.filter(control => getComputedStyle(control).visibility !== "hidden")
        .map(control => control.getBoundingClientRect()).filter(control => control.width > 0 && control.height > 0);
      const point = anchor ?? { x: bounds.left + (bounds.right - bounds.left) / 2, y: bounds.top + 80 };
      const next = { ...placePopup(point, rect, bounds, obstacles), maxWidth, maxHeight };
      setPlacement(current => current && Object.keys(next).every(key => current[key as keyof typeof next] === next[key as keyof typeof next]) ? current : next);
    };
    position();
    const observer = new ResizeObserver(position);
    [element, viewer.canvas, ...controls].forEach(control => observer.observe(control));
    window.addEventListener("resize", position);
    return () => { observer.disconnect(); window.removeEventListener("resize", position); };
  }, [popup, anchor, viewer]);
  if (!popup) return null;
  return <section ref={popupRef} className="vector-popup" style={placement ?? { visibility: "hidden" }} aria-label="Informações da feição" aria-live="polite">
    <button type="button" className="vector-popup-close" aria-label="Fechar informações" onClick={() => {
      if (viewer && !viewer.isDestroyed()) viewer.selectedEntity = undefined;
      setPopup(null);
    }}><Icon name="close" /></button>
    <strong className="vector-popup-title">{popup.title}</strong>
    {popup.fields.map((field, index) => <div key={index}>
      {field.section && field.section !== popup.fields[index - 1]?.section && <h4 className="vector-popup-section">{field.section}</h4>}
      <p>{field.label && <span className="vector-popup-label">{field.label}</span>}<span>{field.value}</span></p>
    </div>)}
  </section>;
}
