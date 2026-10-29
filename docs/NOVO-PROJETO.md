# Roteiro — novo WebGIS a partir do template

Passo a passo na ordem que funcionou no primeiro projeto derivado (Cyro, outubro de 2026). Comandos em PowerShell. Detalhes de cada etapa (geoide, ogr2ogr, publicação) estão em `docs/CHECKLIST_NOVO_PROJETO.md`; CORS do R2 em `docs/R2_CORS.md`.

Resumo:

1. Clonar o template com o script.
2. `.env.local` e reiniciar o dev.
3. Rasters a partir do XML do Global Mapper.
4. Testar um tile no navegador.
5. `cameraCapture` para a Home (e os bounds).
6. Modelo 3D do Cesium ion (`assetId`).
7. `modelAlignment` para conferir a altura.
8. `cropAuthoring` para o recorte.
9. Desligar todas as `developmentTools`.
10. Vetores com `prepare-geojson`.
11. Repositório privado no GitHub e push.

No final há um exemplo comentado de `src/projects/<slug>.ts` com a estrutura do Cyro.

## 1. Clonar (script)

```powershell
cd C:\Users\Usuario\Desktop\cardeal-map-template
npm.cmd run new-project -- -Slug <slug> -Destination C:\Users\Usuario\Desktop\<slug>
cd C:\Users\Usuario\Desktop\<slug>
npm.cmd ci
```

O script copia com robocopy sem `node_modules`, `.git`, `dist`, `.vercel`, `.npm-cache`, `.vite`, `.verification`, `.env` e `.env.local`; cria `src/projects/<slug>.ts` (registrado em `index.ts`), o aviso "Projeto derivado" no AGENTS.md e a branch `main` com o primeiro commit. Daqui em diante, trabalhe só no clone; correções genéricas voltam ao template em mudança separada.

Preencha logo `name` e `location` em `src/projects/<slug>.ts`. O painel já sai no padrão do template: sem busca de camadas, Mapa base → Modelo 3D → Rasters → Vetores, com Modelo 3D aberto. Para mudar, use `panel` (`showLayerSearch`, `sectionOrder`, `expandedSections`).

## 2. `.env.local` e reiniciar o dev

```powershell
copy .env.example .env.local
# preencher VITE_CESIUM_ION_TOKEN (e VITE_CESIUM_3D_TOKEN, se o modelo usar outro token)
npm.cmd run dev
```

- Token do ion **do projeto**, restrito aos assets dele e com *Allowed URLs* `http://127.0.0.1:5173`, `http://127.0.0.1:4173` e o domínio final. `VITE_*` é público no navegador.
- **O `.env.local` só é lido quando o dev inicia.** Mudou o arquivo: pare o `npm run dev` (Ctrl+C) e rode de novo.
- **"Port 5173 is already in use"** normalmente é um dev já rodando (outro terminal ou outra janela do VS Code). Abra http://127.0.0.1:5173 antes de matar qualquer processo; se for o projeto errado, feche aquele terminal.

## 3. Rasters a partir do XML do Global Mapper

Exportação no Global Mapper (*Export Web Format*, tiles TMS):

- Projeção **EPSG:900913** (Web Mercator), tiles **PNG 256×256**, com `tilemapresource.xml`. JPG não tem transparência: a borda sem dado fica preta.
- O Global Mapper grava os tiles em **TMS** (Y de baixo para cima): na URL use **`{reverseY}`**, não `{y}`.

Envie a pasta para o R2 mantendo a estrutura `<pasta>/{z}/{x}/{y}.png` e gere a entrada da camada a partir do XML:

```powershell
npm.cmd run raster-from-xml -- C:\export\orto\tilemapresource.xml --tiles C:\export\orto --url https://pub-xxx.r2.dev/orto --kind orthomosaic --name "Ortomosaico" --credit "Cardeal Map"
```

- **No r2.dev o nome do bucket não entra na URL**: `https://pub-xxx.r2.dev/<pasta>/{z}/{x}/{reverseY}.png`. O bucket só aparece nas URLs da API S3 (`<ACCOUNT_ID>.r2.cloudflarestorage.com/<bucket>/...`), usadas para upload.
- `--tiles` confere TMS/XYZ e níveis pelos arquivos reais. Cole o objeto impresso em `layers` (o último item da lista fica por cima).
- **O `BoundingBox` do `tilemapresource.xml` é a extensão de tiles inteiros do nível mínimo, não o contorno dos dados.** Ele serve de `bounds` da camada (limite de requisição de tiles), mas **não use como `bounds` do projeto**: o limite de navegação ficaria grande demais. Os bounds do projeto vêm da etapa 5.
- **MDT, MDS, declividade e aspecto** saem do Global Mapper como mapas de cores com a legenda desenhada no próprio raster: `legendMode: "embedded"` e nenhuma `legend`. Ponha todos no mesmo `exclusiveGroup` para ligar **um derivado por vez** sobre o orto. Kinds: `dtm`, `dsm`, `slope`, `aspect`.

```powershell
npm.cmd run raster-from-xml -- C:\export\mdt\tilemapresource.xml --tiles C:\export\mdt --url https://pub-xxx.r2.dev/mdt --kind dtm --name "Modelo Digital de Terreno" --credit "Cardeal Map"
```

## 4. Testar um tile no navegador

O `raster-from-xml` imprime "Teste remoto do tile z/x/y: <url>", escolhido no **centro** do BoundingBox, e confere HTTP 200, `Content-Type` de imagem e CORS para as origens locais.

- Abra essa URL no navegador: tem de aparecer a imagem. 404 = pasta ou URL errada (bucket na URL do r2.dev, `{y}` no lugar de `{reverseY}`, nível inexistente).
- `FALHA` só de CORS: aplique `docs/r2-cors.json` no bucket (`docs/R2_CORS.md`).
- Depois, no `npm run dev`: camada no lugar certo sobre o Bing, opacidade e nenhum aviso de tiles ausentes.

## 5. `cameraCapture` para a Home

Com `developmentTools.cameraCapture: true` (o script já gera assim) e `npm run dev`, use o painel "Captura de câmera (dev)":

1. **Capturar Home**: enquadre a vista de abertura; cole `initialCamera` no arquivo do projeto.
2. **Capturar bounds da vista**: enquadre a área inteira vista de cima; cole `bounds`. Isso liga o limite de navegação. Não use o BoundingBox do XML (etapa 3).
3. Cenas (opcional): **Capturar cena** para cada entrada de `scenes`.

Recarregue e confira abertura, Home e limite.

## 6. Modelo 3D do Cesium ion (`assetId`)

Suba o modelo (Metashape → 3D Tiles) no Cesium ion e use o `assetId`:

```ts
source: { format: "3d-tiles", source: "ion", assetId: 1234567, tokenEnv: "VITE_CESIUM_ION_TOKEN", heightOffsetMeters: 0, terrainCutout: false },
```

O token precisa ter acesso ao asset. `tokenEnv: "VITE_CESIUM_ION_TOKEN"` reaproveita o token do Bing/World Terrain; use `VITE_CESIUM_3D_TOKEN` se o modelo tiver token próprio.

## 7. `modelAlignment` para conferir a altura

Ligue `developmentTools.modelAlignment: true`, ative o modelo e compare com o terreno e o orto.

- **O modelo do Cyro assentou sem offset** (`heightOffsetMeters: 0`). Não assuma isso nos próximos: **confira no ion qual referência de altura foi usada no upload** (altura elipsoidal, ortométrica, ajuste de *Adjust Tileset Location*) e **registre no comentário de `heightOffsetMeters`** do projeto.
- Se o modelo flutuar ou afundar de forma constante, a causa típica é altura ortométrica sem a ondulação geoidal N; corrija no asset ou com `heightOffsetMeters = N` (ver `docs/CHECKLIST_NOVO_PROJETO.md`, etapa 2). O valor configurado vem da referência de altura, não do ajuste visual.

## 8. `cropAuthoring` para o recorte

Ligue `developmentTools.cropAuthoring: true`, desenhe o polígono sobre o modelo, **Copiar coordenadas** e cole em `source.clipping` (`enabled: true`, `inverse: true`, `positions`). Decida `terrainCutout`.

## 9. Desligar todas as `developmentTools`

```ts
developmentTools: { modelAlignment: false, cropAuthoring: false, cameraCapture: false },
```

Elas já não aparecem no build de produção, mas desligadas o dev fica igual ao site publicado.

## 10. Vetores com `prepare-geojson`

Exporte do Global Mapper em GeoJSON **WGS84 (EPSG:4326)**; a drenagem **com Z** (3D), porque o sentido do escoamento vem do Z de início e fim de cada trecho. Depois:

```powershell
npm.cmd run prepare-geojson -- C:\export\curvas_gm.geojson C:\export\curvas_3m.geojson --tipo curvas
npm.cmd run prepare-geojson -- C:\export\drenagem_gm.geojson C:\export\linhas_drenagem.geojson --tipo drenagem
npm.cmd run prepare-geojson -- C:\export\perimetro_gm.geojson C:\export\area_perimetro.geojson --tipo generico
```

- Todos: remove Z, arredonda para 7 casas e troca `KML_STYLE` por `id` sequencial.
- `curvas`: `ELEVATION` → `cota_m` e `mestra` (true a cada 15 m; mude com `--intervalo-mestra 10`).
- `drenagem`: calcula `STRAHLER` pela topologia (pontos finais casados com 7 casas, de montante para jusante pelo Z) e `comprimento_m`. Aborta com mensagem se um trecho tiver mais de uma saída ou se a rede não tiver sentido definido (Z igual nas pontas, sem Z ou ciclo). As linhas precisam estar quebradas nas confluências; o script avisa quando um trecho termina no meio de outro.

Suba os arquivos gerados para o R2 (`.../geojson/<arquivo>.geojson`, `Content-Type: application/geo+json`) e configure as camadas com `autoZoom: false`. Simbologia que funcionou no Cyro:

- **Curvas**: pretas, 1 px; mestras com 2 px (`classification` por `mestra`).
- **Drenagem** por `STRAHLER`: 1 `#00E5FF`/1, 2 `#14B8F0`/1.6, 3 `#1E88E5`/2.4, 4 `#1546D8`/3.4 (cor/largura em px). A drenagem fica pouco visível sobre o MDT: avalie sobre o orto.
- **Perímetro**: `#FFD400`, 3 px, sem preenchimento (`fillOpacity: 0`).

`credit` é opcional em vetores; aparece nos créditos do Cesium enquanto a camada estiver carregada.

## 11. Repositório privado e push

```powershell
npm.cmd run typecheck; npm.cmd run check; npm.cmd run build
git add -A; git commit -m "Add <slug> layers"
gh repo create <slug> --private --source . --remote origin --push
```

Sem o `gh`: crie o repositório em github.com/new como **Private** e rode `git remote add origin <url>` e `git push -u origin main`. O `.env.local` nunca vai para o Git; na publicação, os tokens entram como variáveis de build da plataforma.

**GPS ("Minha localização") só funciona em HTTPS ou em localhost.** Não teste pelo IP da rede local (`http://192.168...`): o navegador bloqueia. Teste no `npm run dev`/`preview` em `127.0.0.1` ou no site publicado.

## Exemplo comentado: estrutura do `cyro.ts`

Exemplo real resumido do Cyro, com URL do R2, `assetId`, câmera e recorte trocados por marcadores. Os valores reais ficam só no repositório do cliente.

```ts
import type { ProjectConfig } from "./types";
import { templateProject } from "./template";

const basemap = templateProject.layers[0];
const R2 = "https://pub-xxx.r2.dev"; // r2.dev: sem o nome do bucket
type Layer = ProjectConfig["layers"][number];

// Ortomosaico: saída do raster-from-xml. bounds = tiles inteiros do XML, não o contorno.
const orto: Layer = {
  id: "orto", name: "Ortomosaico", description: "", kind: "orthomosaic", defaultVisible: true,
  source: { format: "tms", url: `${R2}/orto/{z}/{x}/{reverseY}.png`, credit: "Cardeal Map",
    bounds: [W, S, E, N], minimumLevel: 11, maximumLevel: 20, tileWidth: 256, tileHeight: 256 },
};

// Derivados do relevo: legenda no próprio raster, um por vez (mesmo exclusiveGroup).
const derivado = (id: string, name: string, kind: Layer["kind"], folder: string, bounds: [number, number, number, number], minimumLevel: number, maximumLevel: number): Layer => ({
  id, name, description: "", kind, defaultVisible: false,
  legendMode: "embedded", exclusiveGroup: "derivados",
  source: { format: "tms", url: `${R2}/${folder}/{z}/{x}/{reverseY}.png`, credit: "Cardeal Map",
    bounds, minimumLevel, maximumLevel, tileWidth: 256, tileHeight: 256 },
});
const mdt = derivado("mdt", "Modelo Digital de Terreno", "dtm", "mdt", relevoBounds, 9, 18);
const mds = derivado("mds", "Modelo Digital de Superfície", "dsm", "mds", relevoBounds, 9, 18);
const declividade = derivado("declividade", "Declividade", "slope", "decli", relevoBounds, 9, 18);
const aspecto = derivado("aspecto", "Orientação de Vertentes", "aspect", "aspect", aspectoBounds, 10, 19);

// Curvas (prepare-geojson --tipo curvas): pretas, mestras com 2 px.
const curvas: Layer = {
  id: "curvas", name: "Curvas de Nível (3 m)", description: "", kind: "contours", defaultVisible: false,
  source: { format: "geojson", url: `${R2}/geojson/curvas_3m.geojson`, autoZoom: false,
    popup: { title: "Curva de nível", fields: [{ property: "cota_m", label: "Cota", suffix: " m", format: "integer" }] },
    style: { stroke: "#000000", strokeWidth: 1, clampToGround: true, zIndex: 5,
      classification: { property: "mestra", classes: {
        false: { stroke: "#000000", strokeWidth: 1 },
        true: { stroke: "#000000", strokeWidth: 2 },
      } } } },
};

// Drenagem (prepare-geojson --tipo drenagem): classes por STRAHLER.
const drenagem: Layer = {
  id: "drenagem", name: "Drenagem", description: "", kind: "drainage", defaultVisible: false,
  source: { format: "geojson", url: `${R2}/geojson/linhas_drenagem.geojson`, autoZoom: false,
    popup: { title: "Drenagem", fields: [
      { property: "STRAHLER", label: "Ordem de Strahler", format: "integer" },
      { property: "comprimento_m", label: "Comprimento", decimals: 0, suffix: " m" },
    ] },
    style: { stroke: "#00E5FF", strokeWidth: 1, clampToGround: true, zIndex: 10,
      classification: { property: "STRAHLER", classes: {
        1: { stroke: "#00E5FF", strokeWidth: 1, zIndex: 10 },
        2: { stroke: "#14B8F0", strokeWidth: 1.6, zIndex: 11 },
        3: { stroke: "#1E88E5", strokeWidth: 2.4, zIndex: 12 },
        4: { stroke: "#1546D8", strokeWidth: 3.4, zIndex: 13 },
      } } } },
};

// Perímetro: amarelo, 3 px, sem preenchimento.
const perimetro: Layer = {
  id: "perimetro", name: "Perímetro da Área", description: "", kind: "property-boundary", defaultVisible: true,
  source: { format: "geojson", url: `${R2}/geojson/area_perimetro.geojson`, autoZoom: false,
    style: { stroke: "#FFD400", strokeWidth: 3, fillOpacity: 0, clampToGround: true, zIndex: 20 } },
};

// Modelo 3D do ion, recortado com o polígono do cropAuthoring.
const modelo: Layer = {
  id: "modelo", name: "Modelo 3D", description: "", kind: "3d-tiles", defaultVisible: false,
  source: { format: "3d-tiles", source: "ion", assetId: 1234567, tokenEnv: "VITE_CESIUM_ION_TOKEN",
    clipping: { enabled: true, inverse: true, positions: [[lon, lat], /* ... */] },
    // Cyro: 0, assentou sem offset. Registre aqui a referência de altura usada no upload do ion.
    heightOffsetMeters: 0,
    terrainCutout: false },
};

export const project: ProjectConfig = {
  ...templateProject,
  id: "<slug>", name: "<Nome>", location: "<Município-UF>",
  bounds: [W, S, E, N],            // "Capturar bounds da vista", nunca o BoundingBox do XML
  initialCamera: { /* "Capturar Home" */ },
  layers: [basemap, orto, mdt, mds, declividade, aspecto, curvas, drenagem, perimetro, modelo],
  scenes: [],
  diagnostic: { steps: [] },
  developmentTools: { modelAlignment: false, cropAuthoring: false, cameraCapture: false },
};
```

No Cyro, o aspecto entrou como `solar-orientation` e o painel foi configurado à mão; no template atual há `kind: "aspect"` e o painel já sai nesse padrão, por isso `panel` não aparece no exemplo.
