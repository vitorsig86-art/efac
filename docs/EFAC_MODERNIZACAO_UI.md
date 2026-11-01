# Modernização visual do EFAC — Cardeal Map

Data: 01/11/2026. Destino exclusivo: `C:/Users/Usuario/Desktop/efac-webgis`. Referência somente de leitura: `C:/Users/Usuario/Desktop/cardeal-map-template`. Fazenda Café não faz parte desta implementação.

## Diagnóstico

As duas bases usam React 19, TypeScript, Vite 6 e Cesium 1.146.0. A versão Cesium foi conferida na declaração, lockfile e pacote instalado do EFAC, sem alteração de dependências.

A interface anterior do EFAC tinha cabeçalho de 76 px, painel de 316 px, cores verdes fixadas nos componentes, checkboxes, ferramentas posicionadas separadamente e gaveta lateral no celular. O template usa cabeçalho de 52 px, painel de 280 px, tema centralizado creme/terracota/sálvia, fontes locais Figtree/Caprasimo, switches e coluna única de ferramentas. No celular, usa barra inferior e painel inferior em duas alturas.

Não foi copiado o App do template: ele contém funcionalidades e contratos ausentes no EFAC, incluindo campanhas, abertura de popup na Home, páginas incorporadas, novas configurações e curação de dados macro. Os componentes existentes do EFAC foram adaptados mantendo a lógica e as props territoriais atuais.

## Reuso e adaptações

- Tema, fontes, licenças, ícones e estilos dos controles vêm do template.
- Cabeçalho com identidade Cardeal Map, identificação do projeto, botão de recolher Camadas e diálogo Sobre os dados.
- Painel de camadas mantém agrupamento, ordem, contagens, seções abertas, visibilidade, opacidades independentes, busca condicional, cenas e ação de enquadramento municipal. Apenas apresentação/estado do painel mudou.
- Navegação e medição ocupam uma coluna à direita. As funções de zoom, Home, norte e GPS permanecem as do EFAC. O template oculta botões de zoom no celular, que continua com os gestos Cesium originais.
- Ferramentas de medição mantêm o mesmo hook, resultados, finalizar/cancelar/limpar e notas altimétricas completas, agora em Sobre as altitudes.
- Popup mantém picking, prioridade, formatação, todas as seções e campos específicos existentes do EFAC; recebeu tipografia, cores, ícone de fechar e separação visual entre rótulo e valor. O catálogo de atributos não foi substituído pelo do template.
- Legendas receberam o cartão e controle de expansão; o componente original de imagem/gradiente e a ampliação por toque permanecem. Nenhuma legenda foi inventada. EFAC não possui legendas próprias cadastradas, portanto a aba Legenda só aparece se houver legenda visível.
- Mobile: Camadas abre painel inferior médio/alto; Medir exibe as ferramentas; Legenda aparece somente quando aplicável. Escape, foco inicial, contenção de Tab e retorno do foco no painel móvel. Uma função de layout assina e remove listener de media query.
- As funcionalidades temporais e de diagnóstico existentes foram preservadas, sem cadastrar campanhas ou percursos da Jurema. O CSS da comparação foi adaptado ao markup do EFAC, que difere do template.

## Arquivos criados

- `src/theme.css`.
- `src/components/icons.tsx`.
- `src/components/AboutDialog.tsx`.
- `src/components/useMobileLayout.ts` — estado de apresentação; não é hook geoespacial.
- `public/fonts/figtree-latin.woff2`, `figtree-latin-ext.woff2`, `caprasimo-latin.woff2`, `caprasimo-latin-ext.woff2`, `OFL-Figtree.txt`, `OFL-Caprasimo.txt`.
- Este relatório.

## Arquivos modificados nesta entrega

- `index.html`: cor do tema.
- `src/main.tsx`: importação do tema.
- `src/App.tsx`: composição da interface e estados de apresentação.
- `src/styles.css`: shell desktop/mobile e tokens de dimensões.
- `src/components/LayerPanel.tsx` e `.css`.
- `src/components/NavigationControls.tsx` e `.css`.
- `src/components/MeasurementToolbar.tsx` e `.css`.
- `src/components/VectorPopup.tsx` e `.css`.
- `src/components/Legend.css`.
- `src/components/ModeSwitcher.css`.
- `src/components/DiagnosticJourney.css`.
- `src/components/TemporalComparison.css`.
- `src/components/TemporalSelector.css`.

O diretório `.verification/ui-modernization-before/` guarda a cópia inicial de UI e os manifestos de hashes para comparação local; é artefato de verificação, não para versionamento ou publicação. `dist/` é saída de build local.

## Preservação e alterações preexistentes

Foram registrados e comparados 32 arquivos protegidos: todos os arquivos de `src/cesium`, `src/hooks`, `src/projects`, além de package/lockfile e configurações Vite/TypeScript. Nenhum apresentou alteração em relação ao estado inicial desta missão. Os 12 arquivos de apresentação lidos como referência no template também conservaram os hashes.

As alterações preexistentes em `src/cesium/vectorPopup.ts`, `src/projects/efacMacro.ts`, `src/projects/types.ts`, `src/cesium/andrelandiaPopup.ts` e `src/projects/efacMacroPopups.ts` não foram revertidas ou sobrescritas. `VectorPopup.tsx` já tinha modificações locais; a adaptação foi feita sobre esse estado, sem substituir o componente por uma cópia do template.

Permanecem originais o Viewer, CRS, URLs R2/ion, configuração e ordem das camadas, visibilidade inicial, terrenos, coordenadas, clipping, modelo, câmera/Home, navegação, processamento e regras de negócio. Nenhum `.env`, token ou credencial foi editado. Nenhuma dependência adicionada. Nenhuma alteração estrutural geoespacial foi necessária.

## Validação

O pedido atual autorizou validação ampliada; isso prevalece para esta missão sobre a restrição anterior de somente typecheck registrada no AGENTS.md.

- `npm.cmd run typecheck`: passou.
- `npm.cmd run build`: passou, incluindo o typecheck. Não é evidência de renderização ou acesso remoto bem-sucedido.
- `node scripts/check-workspace.cjs`: passou; callbacks, switches, sliders independentes, grupos, legendas e opções do painel.
- `node scripts/check-raster-lifecycle.cjs`: passou.
- `node scripts/check-measurements.cjs`: passou.
- `node scripts/check-template-v2.cjs`: passou, incluindo popups, formatação, estilos, IDs, clipping e tratamento de tiles sintéticos.
- `node scripts/check-raster-xml.cjs`: passou.
- `node scripts/check-navigation.cjs`: passou.
- `node scripts/check-prepare-geojson.cjs`: passou.
- `git diff --check`: passou, sem erros de whitespace.
- `npm.cmd run check`: já falhava no estado inicial em `check-projects.cjs`, por referência a `src/cesium/captureCamera.ts` ausente. A suíte agregada continua pendente por esse problema preexistente. Não foi reintroduzida ferramenta de captura nem alterado teste para mascarar a falha.
- Lint: não há script/configuração de lint nesta base; nenhuma dependência foi adicionada só para isso.
- Servidor Vite iniciado em `http://127.0.0.1:5175/`. Não confundir inicialização do servidor com carregamento das fontes geoespaciais no navegador.

A inspeção automática no Chrome foi bloqueada pela ferramenta de controle do navegador por não conseguir confirmar a URL atual. Após essa limitação, o usuário autorizou seguir com os arquivos/testes locais e informou que fará a verificação visual. Nenhum teste de navegador ou medição real de desempenho é alegado.

## Roteiro de conferência pelo responsável

1. Desktop: verificar header, recolher/reabrir painel e ajuste do canvas; Home, bússola e zoom; ligar/desligar ortomosaico e rasters; testar opacidades independentes.
2. Ativar modelo 3D, observar streaming/clipping, navegar e voltar à Home. Nenhuma configuração de modelo mudou.
3. Na Análise Macro, ligar vetores, consultar atributos e testar Ver limites do município. Confirmar que conteúdo e unidades dos popups seguem os dados anteriores.
4. Medir coordenadas, distância, área e diferença de cota; finalizar, cancelar e limpar. Abrir a nota Sobre as altitudes.
5. Smartphone/tablet: abrir/reduzir/ampliar/fechar o painel, rolar as seções, alternar para Medir, verificar área livre do mapa, orientação horizontal e créditos nativos. Legenda só aparece com uma camada que a forneça.
6. Testar teclado: Tab/Shift+Tab, Escape no painel e diálogo Sobre os dados; verificar retorno do foco e ausência de controles inacessíveis.

Carregamento real, CORS, posição visual dos produtos, compatibilidade do dispositivo e desempenho permanecem para essa conferência. Não houve commit, push, deploy ou alteração do template, do projeto Fazenda Café ou de dados no Cloudflare R2.
