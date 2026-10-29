# Clipping permanente da EFAC

O modelo ion 4993094 usa `source.clipping` em `src/projects/efac.ts`, com os sete
vértices fornecidos, sem arredondamento, repetição do primeiro vértice ou offsets.
`ClippingPolygon` fecha o anel. `Cartesian3.fromDegrees` converte os pares.
`ClippingPolygonCollection.inverse: true` remove o exterior e mantém o interior.
A coleção pertence exclusivamente ao tileset, nunca ao globo. `terrainCutout`
não está configurado. O carregamento sob demanda e a visibilidade inicial
desligada do modelo permanecem.

O loader associa a coleção uma vez ao criar o tileset. Alternar a visibilidade
reutiliza ambos; a remoção/destruição do tileset libera sua coleção. Nenhum
listener de renderização recria ou modifica o clipping.

Para diagnóstico, alterar somente `source.clipping.enabled` para `false` e
recarregar a aplicação. Isso mantém o modelo e desativa apenas o recorte.

## Compatibilidade e histórico de NaN

Versão declarada, lockfile e pacote instalado: Cesium 1.146.0. Os tipos e o
código distribuído confirmam as APIs públicas e a semântica de `inverse`.
O mecanismo consolidado de criação foi mantido. Nesta cópia, por exigência de
usar exclusivamente APIs públicas, foi removido o guard privado
`guardClippingRectangles` herdado do template. Não foi alterado `node_modules`.

O histórico do template registra `DeveloperError: cartesian has a NaN component`
durante inicialização do conteúdo de alguns modelos. Não há comprovação nesta
etapa de que o asset 4993094 apresente esse erro. TypeScript não comprova
estabilidade visual durante streaming/LOD. Se o erro ocorrer, desabilitar apenas
o clipping pela configuração acima e registrar o caso antes de propor outra
API pública; não modificar coordenadas, aplicar patches privados ou trocar
automaticamente a técnica de recorte.

A ferramenta provisória de captura foi removida, incluindo componente, estilos,
estados e listeners. As ferramentas de medição permanecem independentes.

Validação autorizada: somente `npm.cmd run typecheck`. Sem teste em navegador.
