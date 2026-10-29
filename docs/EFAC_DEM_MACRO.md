# DEM Macro — integração

Camada PNG de visualização cartográfica cadastrada exclusivamente em Análise
Macro, inicialmente desligada. Não é TerrainProvider nem fonte de cotas.

## Fonte e compatibilidade

- URL: `https://pub-35704a8663af43efb1306042dbd871ec.r2.dev/dem_macro/{z}/{x}/{reverseY}.png`.
- XML inspecionado: `F:\EFAC 2026\webgis\dem_macro\dem_macro.xml` e
  `dem_macro.gm_source_def.xml`. Os caminhos locais contidos nesses XMLs não
  são usados pela aplicação.
- EPSG:900913 / EPSG:3857, perfil global-mercator, origem inferior esquerda.
- PNG 256 × 256, zoom mínimo 5, máximo 14.
- Extensão em longitude/latitude, obtida de LatLonBounds:
  `[-56.25, -31.952162238, -33.75, -11.178401874]`.
- Loader TMS existente: `WebMercatorTilingScheme`, `UrlTemplateImageryProvider`
  e `ImageryLayer`, compatíveis com o Cesium 1.146.0 instalado.
- `{reverseY}` converte o índice XYZ do Cesium para o arquivo TMS:
  `yTMS = 2^z - 1 - yXYZ`. O diretório publicado continua sendo z/x/y.png;
  a inversão ocorre somente na construção da URL pelo provider.

## Visibilidade, ordem e recursos

O painel usa `group: "macro"`; a camada aparece diretamente sob Análise Macro.
Reutiliza os controles existentes de visibilidade e opacidade e o layout
responsivo. Sua instância é mantida pelo hook existente, sem recriação ao
alternar a visibilidade. Invisível, não solicita imagens para renderização.

O cadastro está após o mapa base e antes dos rasters do drone, preservando
o ortomosaico e demais imagens detalhadas quando ativados simultaneamente.
Os vetores continuam no fluxo de DataSources. Nenhum Viewer, terreno, modelo,
câmera/Home, medição, dependência ou outro projeto foi alterado.

## Verificações e limitações

Foram lidos tiles locais reais correspondentes à posição da EFAC:

| Zoom | X | Y XYZ | Y TMS | Resultado local |
|---|---:|---:|---:|---|
| 5 | 12 | 17 | 14 | PNG, 256 × 256 |
| 10 | 384 | 575 | 448 | PNG, 256 × 256 |
| 14 | 6153 | 9210 | 7173 | PNG, 256 × 256 |

A tentativa de GET público de `dem_macro/5/12/14.png`, com Origin
`http://127.0.0.1:5173`, falhou antes de receber resposta HTTP: acesso ao
soquete proibido pelas permissões da sessão. Não há evidência de erro no
bucket, nem confirmação de disponibilidade HTTP, CORS ou igualdade entre os
tiles locais e os publicados. Os arquivos do R2 não foram modificados.

Validação de código: somente `npm.cmd run typecheck`. Inicialização visual,
ativação/desativação, sobreposição, transições de zoom, console e interação
desktop/mobile não foram testados em navegador nesta sessão. Devem ser
conferidos com acesso ao R2; não se afirma carregamento remoto bem-sucedido.
