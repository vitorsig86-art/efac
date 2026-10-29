# Changelog

Mudanças do Cardeal Map template, da mais recente para a mais antiga. Projetos derivados registram suas próprias mudanças a partir do commit de origem anotado no AGENTS.md do clone.

## Consolidação do Cyro — 2026-10-28

Lições do primeiro projeto derivado (Cyro) trazidas para o template.

### Adicionado
- `docs/NOVO-PROJETO.md`: roteiro passo a passo de um WebGIS (clonar → `.env.local` → rasters do XML do Global Mapper → teste de tile → Home com `cameraCapture` → modelo do ion → `modelAlignment` → `cropAuthoring` → desligar `developmentTools` → vetores com `prepare-geojson` → repositório privado e push), com as lições do Cyro e um exemplo comentado de `src/projects/<slug>.ts`. Referenciado no AGENTS.md (Projetos derivados), no README e no checklist.
- `scripts/prepare-geojson.cjs` (`npm run prepare-geojson`): GeoJSON do Global Mapper pronto para o R2 (sem Z, 7 casas, `KML_STYLE` → `id` sequencial); curvas com `cota_m` e `mestra` (a cada 15 m, configurável); drenagem com `STRAHLER` pela topologia e `comprimento_m`, abortando em trecho com mais de uma saída ou rede sem sentido definido. Teste sintético em `scripts/check-prepare-geojson.cjs`, incluído no `npm run check`.
- Opções de painel `ProjectConfig.panel` (portadas do Cyro): `showLayerSearch`, `sectionOrder`, `expandedSections`.
- `kind: "aspect"` (orientação de vertentes); o Cyro precisou usar `solar-orientation`.
- `credit` opcional em camadas GeoJSON (`GeoJsonDataSource` `credit`); aparece enquanto a camada estiver carregada, mesmo desligada.

### Alterado
- Padrão do painel: sem busca de camadas, ordem Mapa base, Modelo 3D, Rasters, Vetores (e Análise Macro), com Modelo 3D aberto. Projetos que queiram o comportamento anterior: `panel: { showLayerSearch: true, sectionOrder: ["basemap", "raster", "vector", "model"], expandedSections: [] }`.
- `scripts/new-project.ps1`: robocopy exclui por nome `node_modules`, `.git`, `dist`, `.vercel`, `.npm-cache`, `.vite`, `.verification`, `.env` e `.env.local` (exit code < 8 = sucesso); cria a branch `main` com o primeiro commit e lembra, no final, de preencher o `.env.local` e criar o repositório privado no GitHub.

### Corrigido
- `scripts/raster-from-xml.cjs`: o tile de teste é o do centro do BoundingBox, não o da borda. Com o BoundingBox de tiles inteiros do Global Mapper, a faixa de tiles ganhava uma linha/coluna vizinha (2×2 contado como 9). A saída avisa que esses bounds não são os do projeto.

## [Não lançado] — 2026-10-28

### Adicionado
- Limite de navegação a partir de `bounds` (margem `navigation.marginRatio`, padrão 25%; altura máxima `navigation.maximumZoomDistance`, padrão derivado dos bounds); `bounds` passa a ser opcional e sem ele não há limite.
- GPS fora da área: marcador visível, câmera mantida no limite e aviso curto.
- Cenas com `camera` opcional (voam até a vista salva).
- Painel de captura de câmera em DEV: Home, cena e bounds da vista, com chave para ignorar o limite.
- Título da aba "<nome do projeto> | Cardeal Map".
- Painel de camadas: `group`, `subsection`, busca sem acentos, seções recolhíveis com contadores ativo/total, mensagens de status, `legendMode: "embedded"` e `exclusiveGroup`.
- Cenas rápidas (`scenes`): botões que aplicam um conjunto exato de camadas.
- Série temporal (`temporalCampaign`) e comparação lado a lado (`temporalComparison`).
- Modo Diagnóstico (`diagnostic.steps`).
- Botão "Minha localização" (GPS).
- Ferramenta "Diferença de cota" (ΔZ, distâncias, inclinação e declividade, com procedência da superfície).
- Simbologia de drenagem simulada por Strahler (`symbology: "simulated-drainage-strahler"`).
- `uniqueFeatureIds` preserva o id original no atributo `source_id`, exibível no popup.
- `scripts/new-project.ps1`: cria um projeto derivado (cópia sem artefatos/segredos, skills como pasta real, `src/projects/<slug>.ts`, aviso no AGENTS.md, `git init`).
- `scripts/raster-from-xml.cjs`: gera a entrada de raster a partir do `tilemapresource.xml` e testa tile/CORS remotos.
- Documentação: `docs/CHECKLIST_NOVO_PROJETO.md`, `docs/R2_CORS.md` + `docs/r2-cors.json`, `docs/TEMPLATE_FEATURES.md`, pesquisa de Vector Tiles e plano da POC de drenagem.
- `CLAUDE.md` (importa o AGENTS.md); AGENTS.md com protocolo de compatibilidade Cesium, "Projetos derivados" e a lista de exceções de internals.

### Alterado
- Cesium fixado em `1.146.0` (sem `^`).
- Avisos de medição: cotas vêm do World Terrain ou do modelo 3D, não do MDT do projeto.
- Checks: `check-workspace` e `check-measurements` atualizados, `.env.example` tolerante a CRLF, `check-projects` aceita projetos derivados, novo `check-raster-xml`.
- README com os recursos novos; relatórios antigos movidos para `docs/historico/`.

### Removido
- `allowMissingTiles` (sem efeito), abertura por `bounds` inalcançável, prop `formatValue` da legenda, CSS sem uso, `public/favicon.svg`, logo duplicado na raiz e nomes de projetos anteriores nos docs.

## [2.0.0] — 2026-10-04 (`9144d32`)

Promoção da arquitetura de produção para o template. Detalhes em `docs/historico/TEMPLATE_V2_REPORT.md`.

- Popup Cardeal com seleção por prioridade, formatação pt-BR e campos ausentes omitidos.
- Classificação de polígonos/linhas por atributo, paleta de contorno por índice e bordas como polylines.
- `prepareGeoJson`: `ignoreAltitude` e `uniqueFeatureIds`.
- Modelo 3D por URL ou ion com token dedicado, `heightOffsetMeters`, recorte por polígono e `terrainCutout`.
- Ferramentas de desenvolvimento (altura, recorte, captura de câmera) só em DEV.
- Lacunas 404/410 de tiles recuperáveis e diagnóstico de fonte sem cobertura.

## [1.0.0] — 2026-10-03 (`d84948b`)

Template genérico sincronizado do projeto de referência. Detalhes em `docs/historico/SYNC_REPORT.md`.

- Viewer Cesium com Bing Aerial e World Terrain via ion, com fallback OpenStreetMap e elipsoide.
- Câmera inicial/Home, bússola e zoom; medições de coordenadas, distância e área.
- Rasters TMS/XYZ com opacidade, GeoJSON, 3D Tiles, legendas em imagem/gradiente.
- Layout desktop e mobile (drawer, backdrop, cabeçalho compacto) e atribuição nativa do Cesium.
- Skills CesiumJS para agentes.
