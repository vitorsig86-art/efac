# Recursos genéricos do template

A abertura permanece com `layers: [basemap]`, câmera global neutra e nenhuma
camada territorial. Exemplos com `example.invalid` continuam fora da lista ativa.
Não basta marcar um raster ou vetor como invisível: o loader existente inicializa
essas fontes mesmo assim. Configure e valide as fontes antes de incluí-las.

## Configuração em src/projects/

- `group`: `basemap`, `raster`, `vector`, `model` ou `macro`. Sem configuração,
  o painel infere o grupo pelo tipo da camada. Grupos vazios ficam ocultos.
- `subsection`: título livre de subseção, inclusive para Análise Macro. Mantenha
  camadas da mesma subseção contíguas na lista.
- `panel` (opcional, só apresentação; não liga camadas):
  - `showLayerSearch` (padrão `false`): mostra o campo "Buscar camada".
  - `sectionOrder` (padrão Mapa base, Modelo 3D, Rasters, Vetores, Análise
    Macro): seções não listadas seguem na ordem padrão; nenhuma some.
  - `expandedSections` (padrão `["model"]`): seções abertas ao carregar, além
    das que têm camada ativa; `[]` deixa abertas só as ativas.
- Busca (com `showLayerSearch: true`) ignora acentos e considera nome, descrição e subseção. Durante a busca,
  os resultados ficam expandidos; limpar a busca restaura os grupos recolhidos.
  Contadores mostram ativo/total do grupo completo, sem alterar visibilidade.
- `legendMode: "embedded"`: a legenda já está nos pixels da fonte; mostra uma
  indicação no painel e evita duplicar a legenda externa. Não gera uma legenda.
  Sem essa opção, `legend` mantém as imagens e gradientes externos existentes.
- `source.credit` em GeoJSON (opcional): atribuição nos créditos nativos do
  Cesium. Aparece enquanto a camada estiver carregada, mesmo desligada, porque
  vetores ocultos continuam anexados ao viewer.
- `source.popup` em GeoJSON preserva título, campos, rótulos, unidades e formatos
  numéricos configuráveis. Nenhum atributo de imóvel foi acrescentado.
- Sliders continuam disponíveis para XYZ/TMS e vetores com `opacityControl`.
  Os estados do hook existente agora são apresentados no painel: carregamento,
  erro de inicialização e mapa base alternativo. Isso não representa progresso
  individual dos tiles nem acrescenta retentativa automática para vetores/rasters.
- `scenes`: lista opcional de `{ id, label, description?, layerIds, camera? }`. Cada
  cena define o conjunto exato de camadas visíveis; inclua o mapa base se desejado.
  IDs desconhecidos são ignorados. Com `camera` (formato de `initialCamera`,
  capturável no painel de captura), a cena também voa até a vista salva.
- `diagnostic.steps`: etapas opcionais com `title`, `text`, `layerIds?`, `facts?`
  e `references?`. Sem etapas, o seletor Explorar/Diagnóstico não aparece.
  Cada etapa pode aplicar um conjunto exato de camadas; omitir `layerIds`
  preserva a seleção atual. Voltar a Explorar mantém a última seleção.
- `exclusiveGroup`: permite exclusividade entre camadas. Vale para a abertura,
  seleção manual, cenas e etapas; a última camada solicitada do grupo prevalece.
- `temporalCampaign: { label, description, comparisonLabel? }` em overlays
  XYZ/TMS habilita o seletor temporal. Há uma única série por projeto, com um
  período visível de cada vez no modo simples, mesmo sem `exclusiveGroup`.
- `temporalComparison: { left, right }` habilita o comparador somente quando os
  IDs apontam para períodos configurados e existem pelo menos duas campanhas.
  A comparação permite dois períodos simultâneos, inclusive o mesmo em ambos
  os lados. Sair restaura a seleção temporal simples; alterações em outras
  camadas e opacidades permanecem. Cenas e diagnóstico encerram a comparação.
  Rasters acima dos períodos podem cobrir a imagem; o controle avisa sobre eles.
  O divisor responde a toque, mouse, setas e teclas Home/End.

GPS é iniciado apenas pelo botão Minha localização. Recentrar, precisão estimada,
erros de permissão e desativação são tratados sem gravar a posição. Requer
geolocalização do navegador e contexto seguro (HTTPS ou localhost). Com limite de
navegação (`bounds`), uma posição fora da área mostra o marcador, não move a câmera
e exibe por 5 s "Sua posição está fora da área do projeto".

## Drenagem simulada por Strahler

A simbologia genérica fica em `src/projects/drainageStyle.ts`, reproduzindo a
classificação já validada em produção, inspirada na hierarquia do Global
Mapper. A função `resolveDrainageStyle` fornece a configuração ao loader
existente, sem duplicar a aplicação de estilo nas entidades.

- Ordem 1: `#15DEEF`, **1.2 px**, `zIndex: 20`.
- Ordem 2: `#08B5ED`, **1.8 px**, `zIndex: 21`.
- Ordem 3: `#0087EB`, **2.6 px**, `zIndex: 22`.
- Ordem 4: `#0062E8`, **3.8 px**, `zIndex: 23`.
- Ordem 5: `#003DE0`, **5.2 px**, `zIndex: 24`.

As larguras usam `PolylineGraphics.width`, em pixels de tela. Atributos,
geometria, IDs, popup e seleção seguem o fluxo existente. O estilo não transforma
coordenadas nem ignora altitudes por conta própria.

Para habilitar, configure explicitamente `kind: "drainage"` e
`source.symbology: "simulated-drainage-strahler"` em uma fonte GeoJSON cujos
segmentos tenham o atributo `STRAHLER`. Exemplo de configuração futura em
`src/projects/` (substitua a URL antes de incluir na lista ativa):

```ts
{
  id: "simulated-drainage",
  name: "Drenagem simulada",
  description: "Rede simulada; não confirmada em campo",
  kind: "drainage",
  defaultVisible: false,
  source: {
    format: "geojson",
    url: "https://example.invalid/drainage.geojson",
    autoZoom: false,
    symbology: "simulated-drainage-strahler",
    popup: { fields: [{ property: "STRAHLER", label: "Ordem de Strahler", format: "integer" }] },
  },
}
```

O loader existente compara as chaves textuais das classes: números `1` a `5`
e strings exatas `"1"` a `"5"` recebem as respectivas classes. Ordens acima de
5, ausentes, nulas ou valores sem correspondência (inclusive strings vazias,
fracionários e strings como `"01"`) recebem o fallback da referência:
`#2457B2`, **1.2 px**, `zIndex: 20`. Nenhuma feição é ocultada ou tem seu atributo
normalizado/modificado. A classificação pressupõe dados estáticos no GeoJSON.

Para personalizar, forneça `source.style` no projeto: seus campos substituem os
defaults. Por exemplo, `style: { stroke: "#226699", strokeWidth: 2 }` altera o
fallback e mantém as cinco classes padrão. Para mudar as classes, forneça
`style.classification: { property: "STRAHLER", classes: { ... } }` junto com
`stroke` e `strokeWidth`: essa classificação substitui **toda** a classificação
padrão; declare todas as ordens desejadas. Classes omitidas usam o fallback.
Também é possível omitir `symbology` e fornecer um estilo inteiramente próprio.

O opt-in não é inferido por LineString, nome, ID ou presença de atributo.
Curvas de nível e hidrografia oficial da ANA mantêm sua simbologia. Nenhuma
camada foi adicionada ao template: a abertura continua somente com o mapa base.

## Compatibilidade e escopo

Comparados os módulos de painel, navegação/GPS, temporalidade e diagnóstico de
projetos de produção anteriores. Sliders, popups, legendas externas e estrutura responsiva
já existiam e foram preservados. Nenhum App.tsx foi transplantado integralmente.

`package.json` declara `^1.145.0`; lockfile e pacote instalado registram Cesium
**1.146.0**. Os tipos locais confirmam `ImageryLayer.splitDirection`,
`Scene.splitPosition`, propriedades de entidades e `HeightReference.CLAMP_TO_TERRAIN`.
Referências públicas: [ImageryLayer](https://cesium.com/learn/cesiumjs/ref-doc/ImageryLayer.html)
e [Scene](https://cesium.com/learn/cesiumjs/ref-doc/Scene.html).
Não foram alterados dependências, loaders, viewer, Home, medições ou tratamentos
de compatibilidade. A única adaptação no hook existente aplica/remove o split
das camadas temporais, inclusive quando terminam de carregar assincronamente.

Validação desta atualização: somente `npm.cmd run typecheck`. Build, testes de
navegador, Playwright, auditorias gerais, commit e push não foram executados.
Interações em navegador e URLs de futuros projetos ainda devem ser validadas
quando suas fontes reais forem configuradas.
