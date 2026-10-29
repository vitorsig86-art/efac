// Local panel rendering and interaction checks. No browser or network required.
// Run: node scripts/check-workspace.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.join(__dirname, "..");

// Components are called as plain functions to inspect their element trees.
// Hooks therefore run outside a React renderer: state keeps its initial value.
const react = require("react");
const reactShim = {
  ...react,
  useState: (initial) => [typeof initial === "function" ? initial() : initial, () => {}],
  useEffect: () => {},
  useLayoutEffect: () => {},
  useId: () => "test-id",
};
const modules = new Map();
function resolveLocal(from, name) {
  const base = path.join(path.dirname(from), name);
  const match = ["", ".ts", ".tsx"].map((extension) => base + extension).find((candidate) => fs.existsSync(path.join(root, candidate)) && fs.statSync(path.join(root, candidate)).isFile());
  if (!match) throw new Error(`Cannot resolve ${name} from ${from}`);
  return match;
}
function load(file) {
  if (modules.has(file)) return modules.get(file);
  const exports = {};
  modules.set(file, exports);
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, require: (name) => name.endsWith(".css") ? {}
    : name === "react" ? reactShim
    : name.startsWith(".") ? load(resolveLocal(file, name))
    : require(name) });
  return exports;
}

function elements(node, parents = []) {
  if (Array.isArray(node)) return node.flatMap((child) => elements(child, parents));
  if (!node || typeof node !== "object" || !node.props) return [];
  return [{ node, parents }, ...elements(node.props.children, [...parents, node])];
}

const { templateProject, exampleLayers } = load("src/projects/template.ts");
const project = { ...templateProject, layers: [...templateProject.layers.filter(layer => layer.kind === "basemap"), ...exampleLayers] };
const { LayerPanel, getWorkspaceSections } = load("src/components/LayerPanel.tsx");
const sections = getWorkspaceSections(project.layers);
assert.equal(JSON.stringify(sections.map((section) => [section.title, section.layers.length])), JSON.stringify([
  ["Mapa base", 1], ["Modelo 3D", 1], ["Rasters", 2], ["Vetores", 1], ["Análise Macro", 0],
]));
assert.equal(new Set(sections.flatMap((section) => section.layers.map((layer) => layer.id))).size, project.layers.length);
let visible = new Set(project.layers.filter((layer) => layer.defaultVisible).map((layer) => layer.id));
const opacities = {};
const toggles = [];
const opacityChanges = [];
const render = () => LayerPanel({
  project, visible, statuses: {}, rasterOpacities: opacities,
  onToggle: (id) => { toggles.push(id); if (visible.has(id)) visible.delete(id); else visible.add(id); },
  onOpacityChange: (id, value) => { opacityChanges.push([id, value]); opacities[id] = value; },
  onClose() {},
});
const initialTree = render();
const markup = renderToStaticMarkup(initialTree);
assert.doesNotMatch(markup, /<select|<option/);
assert.doesNotMatch(markup.replace(/<[^>]*>/g, " "), /PROJECT WORKSPACE|\bProject\b|\bLayers\b|\bactive\b|Choose what/);
assert.ok(markup.includes(project.name));
assert.ok(markup.includes(project.location));
assert.equal(elements(initialTree).filter(({ node }) => node.type === "input" && node.props.type === "range").length, 0);

for (const section of sections) {
  for (const layer of section.layers) {
    const row = elements(render()).find(({ node }) => node.key === layer.id).node;
    const checkbox = elements(row).find(({ node }) => node.type === "input" && node.props.type === "checkbox").node;
    const initial = visible.has(layer.id);
    assert.equal(checkbox.props.checked, initial);
    checkbox.props.onChange();
    assert.equal(visible.has(layer.id), !initial);
    checkbox.props.onChange();
    assert.equal(visible.has(layer.id), initial);
    assert.equal(toggles.at(-1), layer.id);
  }
}

visible = new Set(project.layers.map((layer) => layer.id));
assert.equal(elements(render()).filter(({ node }) => node.type === "input" && node.props.type === "range").length, 2);
for (const layer of sections.find((section) => section.id === "raster").layers) {
  const row = elements(render()).find(({ node }) => node.key === layer.id).node;
  const slider = elements(row).find(({ node }) => node.type === "input" && node.props.type === "range");
  assert.ok(!slider.parents.some((parent) => parent.type === "label"), "Moving opacity must not activate the checkbox label");
  assert.equal(slider.node.props.value, 100);
  assert.equal(slider.node.props.min, 0);
  assert.equal(slider.node.props.max, 100);
  slider.node.props.onChange({ currentTarget: { value: "65" } });
  assert.equal(JSON.stringify(opacityChanges.at(-1)), JSON.stringify([layer.id, 65]));
  assert.ok(visible.has(layer.id), "Opacity must not change visibility");
  const updatedRow = elements(render()).find(({ node }) => node.key === layer.id).node;
  assert.match(renderToStaticMarkup(updatedRow), /65%/);
}
for (const layer of sections.filter((section) => section.id !== "raster").flatMap((section) => section.layers)) {
  const row = elements(render()).find(({ node }) => node.key === layer.id).node;
  assert.ok(!elements(row).some(({ node }) => node.type === "input" && node.props.type === "range"));
}
assert.match(renderToStaticMarkup(render()), /model-layer-card/);
const { Legend } = load("src/components/Legend.tsx");
for (const layer of project.layers.filter(layer => layer.legend)) {
  assert.equal(Legend({ ...layer.legend, visibility: false }), null);
  const markup = renderToStaticMarkup(Legend({ ...layer.legend, visibility: true }));
  assert.ok(markup.includes(layer.legend.imageUrl));
  assert.ok(markup.includes(layer.legend.imageAlt));
  assert.doesNotMatch(markup, /raster-legend-gradient/);
  assert.match(renderToStaticMarkup(Legend({ ...layer.legend, imageUrl: "/future-legend.png", visibility: true })), /future-legend\.png/);
}
const gradientLegend = { title: "Gradient", min: 0, max: 10, tickValues: [0, 10], gradientStops: [{ position: 0, color: "blue" }, { position: 100, color: "red" }], visibility: true };
assert.match(renderToStaticMarkup(Legend(gradientLegend)), /raster-legend-gradient/);
assert.equal(Legend({ ...gradientLegend, max: 0 }), null);
assert.doesNotMatch(renderToStaticMarkup(render()), /Análise Macro/, "Empty sections stay hidden");
assert.doesNotMatch(renderToStaticMarkup(render()), /Cenas rápidas/, "No scenes, no scene block");
const scenes = [{ id: "s1", label: "Cena 1", layerIds: ["basemap"] }];
let applied = null;
const withScenes = LayerPanel({ project, visible: new Set(["basemap"]), statuses: {}, rasterOpacities: {}, onToggle() {}, onOpacityChange() {}, onClose() {}, scenes, onApplyScene: (scene) => applied = scene });
const sceneButton = elements(withScenes).find(({ node }) => node.type === "button" && node.props.className === "workspace-scene").node;
assert.equal(sceneButton.props["aria-pressed"], true);
sceneButton.props.onClick();
assert.equal(applied, scenes[0]);
assert.match(renderToStaticMarkup(withScenes), />0\/2</, "Raster counter is active/total of the whole group");
// panel options. Template defaults: no search, Mapa base, Modelo 3D, Rasters,
// Vetores, with Modelo 3D open. Configured values change only presentation.
const sectionIds = (tree) => elements(tree).filter(({ node }) => node.type === "section" && node.props.className === "workspace-section").map(({ node }) => node.key);
const openIds = (tree) => elements(tree).filter(({ node }) => node.type === "button" && node.props.className === "workspace-section-toggle" && node.props["aria-expanded"]).map(({ node }) => node.props["aria-controls"].replace("workspace-list-", ""));
const defaultVisible = new Set(["basemap"]);
const panelProps = { visible: defaultVisible, statuses: {}, rasterOpacities: {}, onToggle() {}, onOpacityChange() {}, onClose() {} };
const defaultPanel = LayerPanel({ project, ...panelProps });
assert.doesNotMatch(renderToStaticMarkup(defaultPanel), /Buscar camada|workspace-search/);
assert.equal(JSON.stringify(sectionIds(defaultPanel)), JSON.stringify(["basemap", "model", "raster", "vector"]));
assert.equal(JSON.stringify(openIds(defaultPanel)), JSON.stringify(["basemap", "model"]));
assert.equal(JSON.stringify([...defaultVisible]), JSON.stringify(["basemap"]), "Opening Modelo 3D does not turn the model on");
const configured = LayerPanel({ project: { ...project, panel: { showLayerSearch: true, sectionOrder: ["vector", "raster", "raster", "basemap"], expandedSections: ["raster"] } }, ...panelProps });
assert.match(renderToStaticMarkup(configured), /Buscar camada/);
assert.equal(JSON.stringify(sectionIds(configured)), JSON.stringify(["vector", "raster", "basemap", "model"]), "Unlisted sections follow in default order; duplicates ignored");
assert.equal(JSON.stringify(openIds(configured)), JSON.stringify(["raster", "basemap"]));
const none = LayerPanel({ project: { ...project, panel: { expandedSections: [] } }, ...panelProps });
assert.equal(JSON.stringify(openIds(none)), JSON.stringify(["basemap"]), "expandedSections: [] keeps only active sections open");
assert.equal(JSON.stringify([...defaultVisible]), JSON.stringify(["basemap"]), "Expanding a section does not turn its layers on");
assert.equal(JSON.stringify(getWorkspaceSections(project.layers, ["macro", "vector"]).map((section) => section.id)), JSON.stringify(["macro", "vector", "basemap", "model", "raster"]));
const { configuredVisibility } = load("src/projects/layerVisibility.ts");
const exclusive = [
  { ...project.layers[1], exclusiveGroup: "x" }, { ...project.layers[2], exclusiveGroup: "x" }, project.layers[0],
];
assert.equal(JSON.stringify([...configuredVisibility(exclusive, [exclusive[0].id, exclusive[1].id, "basemap", "unknown"])]), JSON.stringify([exclusive[1].id, "basemap"]));
console.log("Workspace passed: Portuguese sections, checkbox callbacks, independent sliders, 3D card, reusable image legends, hidden legends, gradient compatibility, hidden empty sections, scenes, exclusive groups and panel options (search, section order, expanded sections).");
