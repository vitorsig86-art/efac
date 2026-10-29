# EFAC WebGIS

Escola Família Agrícola de Cruzília — MG.

Cópia independente do Cardeal Map Template V3, com React, TypeScript, Vite e CesiumJS 1.146.0. Preserva componentes, loaders, medições, suporte a 3D Tiles e simbologia consolidada de drenagem por Strahler.

A configuração ativa está em `src/projects/efac.ts`, registrada em `src/projects/index.ts`. Há somente Bing Aerial com rótulos cadastrado, pelo provider consolidado do template. O fallback automático OpenStreetMap foi preservado para indisponibilidade do Bing; não é uma segunda camada no painel. Tokens não foram copiados; `.env.example` contém somente os nomes das variáveis.

O painel mantém Mapa base → Modelo 3D → Rasters → Vetores, sem buscador. Não há rasters, vetores ou modelos cadastrados. A câmera é global e neutra, sem bounds, clipping ou cenas de outras propriedades. Os exemplos de `template.ts` permanecem genéricos e inativos.

## Integração posterior

- TMS: obter `tilemapresource.xml`, conferir bounds e níveis reais e cadastrar em `efac.ts`. O utilitário `scripts/raster-from-xml.cjs` auxilia a preparação; TMS usa `{reverseY}`.
- GeoJSON: verificar EPSG:4326 e atributos antes de cadastrar fontes reais em `efac.ts`. Preservar `src/projects/drainageStyle.ts`; para drenagem simulada com `STRAHLER`, usar `kind: "drainage"` e `source.symbology: "simulated-drainage-strahler"`.
- Cesium ion: cadastrar o asset real com `format: "3d-tiles"`, `source: "ion"` e token próprio. Conferir referência vertical antes de configurar offsets ou clipping.
- Câmera/Home e navegação: configurar somente a partir da área real da escola.

Roteiro técnico preservado em `docs/NOVO-PROJETO.md`. Etapas de Git, publicação e validações adicionais não integram esta entrega.

## Validação desta etapa

Somente `npm run typecheck`. Sem build, Playwright, commit, push ou deploy.
