import { useEffect, useRef } from "react";
import type { ProjectConfig } from "../projects/types";
import { getWorkspaceSections } from "./LayerPanel";
import { altitudeNote, heightNote } from "./MeasurementToolbar";
import { Icon } from "./icons";

// Presentation adapted from Cardeal Map; reads the existing EFAC configuration.
export function AboutDialog({ project, open, onClose }: { project: ProjectConfig; open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  const sections = getWorkspaceSections(project.layers, project.panel?.sectionOrder).filter(section => section.layers.length > 0);
  return (
    <dialog ref={dialogRef} className="about-dialog" aria-labelledby="about-title" onClose={onClose}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="about-dialog-body">
        <header><h2 id="about-title">Sobre os dados</h2><button type="button" className="about-close" onClick={onClose} aria-label="Fechar"><Icon name="close" /></button></header>
        <p>{project.name} — {project.location}.</p>
        <h3>Camadas disponíveis</h3>
        <ul>{sections.map(section => <li key={section.id}>{section.title}: {section.layers.length}</li>)}</ul>
        <h3>Fontes e representações</h3>
        <ul>{project.layers.filter(layer => layer.kind !== "basemap").map(layer => <li key={layer.id}><strong>{layer.name}</strong> — {layer.description}</li>)}</ul>
        <h3>Medições</h3><p>{altitudeNote}</p><p>{heightNote}</p>
        <h3>Créditos</h3><p>As atribuições de imagens e dados permanecem no rodapé do mapa, nos créditos nativos do Cesium.</p>
      </div>
    </dialog>
  );
}
