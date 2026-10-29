# EFAC - Analise Macro: inspecao e integracao

Origem: F:/EFAC 2026/webgis/vetores. Os dez nomes previstos foram encontrados. Nenhum GeoJSON foi copiado para o repositorio.

## Implementacao

efacMacro.ts cadastra dez camadas em tres subsecoes existentes. Todas iniciam desligadas, com loadOnDemand: true e autoZoom: false. O hook existente mantem uma fonte por ID, evita cargas simultaneas duplicadas e libera os recursos no encerramento. IDs macro independentes dos vetores do drone.

Andrelandia e a documentacao do Template V3 foram consultados. Nenhum dado territorial foi transplantado. Viewer, loaders, hooks e componentes do painel nao foram alterados.

CRS declarado em todos os arquivos: CRS84 (WGS84, longitude/latitude em graus). Drenagem simulada possui vertices XY e XYZ; o Z original e preservado. Datum vertical nao declarado. clampToGround segue o comportamento visual existente, sem offsets ou transformacao de datum.

Microbacias simuladas: 355 poligonos, 352 STREAM_ID distintos. Cores suaves atribuidas aos identificadores ordenados; identificadores iguais compartilham a cor. NEXT_STREAM_ID ausente em 3 feicoes; ISLAND_AREA presente em 1. Nenhuma simplificacao ou rotulo permanente.

Unidades textuais preservadas: PERIMETER em km; ENCLOSED_AREA, ISLAND_AREA e DRAIN_AREA em ha. Campos ANA nuareakm2, nuareaha e nuperimkm indicam unidade no nome. wts_gm_area e demais valores sem unidade declarada nao receberam unidades presumidas. Shape_Area/Shape_Leng nao foram convertidos em medidas metricas.

Campos principais IBGE: nm_unidade/letra_simb (geologia), nm_unidade/categoria (geomorfologia), nom_unidad/legenda (pedologia), legenda/nm_uantr (vegetacao; nm_uveg vazio), ZONA/DESC_COMPL (clima). Popups identificam esses dados como mapeamento regional.

ANA N7: codigo Pfafstetter 8686649, nivel 7. Hidrografia ANA: 22 linhas e 1 poligono, sem classificacao Strahler simulada.

Drenagem simulada: campo STRAHLER numerico, ordens 1-6. Contagens: 1088, 481, 312, 140, 33, 82. Espessuras: 1.2, 1.8, 2.6, 3.8, 5.2 e 6 pixels. Sem recalculo; valores futuros fora dessas classes usam azul uniforme.

Popups preservam nomes originais e valores (raw nos campos principais), com rotulos legiveis; includeAllFields permite consultar os demais atributos. Indicadores municipais tem ano de referencia nao confirmado.

## Inspecao por arquivo

### microbacia_ana.geojson

- FeatureCollection: estrutura de feicoes e coordenadas valida na inspecao. Nao foi feita auditoria topologica.
- Feicoes: 1; geometria: {"Polygon":1}.
- CRS: `urn:ogc:def:crs:OGC:1.3:CRS84`; dimens?es dos vertices: `{"2":1397}`.
- Extensao [m?nimo, m?ximo] por eixo: `[[-44.9913879,-44.7877744],[-21.9104238,-21.7701431]]`.
- URL: `https://pub-35704a8663af43efb1306042dbd871ec.r2.dev/vetores/microbacia_ana.geojson`.

| Atributo | Tipos JSON | Nulos | Ausentes | Strings vazias | Exemplo da fonte |
|---|---|---:|---:|---:|---|
| wts_pk | number | 0 | 0 | 0 | 1057731 |
| wts_cd_pfafstetterbasin | number | 0 | 0 | 0 | 8686649 |
| wts_cd_pfafstetterbasincodeleve | number | 0 | 0 | 0 | 7 |
| wts_gm_area | string | 0 | 0 | 0 | "165.503032454926" |

### drenagem_ana.geojson

- FeatureCollection: estrutura de feicoes e coordenadas valida na inspecao. Nao foi feita auditoria topologica.
- Feicoes: 23; geometria: {"Polygon":1,"LineString":22}.
- CRS: `urn:ogc:def:crs:OGC:1.3:CRS84`; dimens?es dos vertices: `{"2":2020}`.
- Extensao [m?nimo, m?ximo] por eixo: `[[-44.988908386216664,-44.7888643],[-21.907551,-21.77015136878115]]`.
- URL: `https://pub-35704a8663af43efb1306042dbd871ec.r2.dev/vetores/drenagem_ana.geojson`.

| Atributo | Tipos JSON | Nulos | Ausentes | Strings vazias | Exemplo da fonte |
|---|---|---:|---:|---:|---|
| gid | number | 0 | 22 | 0 | 124915 |
| esp_cd | number | 0 | 22 | 0 | 72930 |
| cod_snisb | string | 0 | 22 | 1 | - |
| cod_sar | string | 0 | 22 | 1 | - |
| nmoriginal | string | 0 | 22 | 1 | - |
| nmalternat | string | 0 | 22 | 1 | - |
| nmgenerico | string | 0 | 22 | 1 | - |
| nmligacao | string | 0 | 22 | 1 | - |
| nmespecifi | string | 0 | 22 | 1 | - |
| detipomass | string | 0 | 22 | 0 | "Artificial" |
| dedominial | string | 0 | 0 | 22 | "Estadual" |
| dedominio | string | 0 | 22 | 0 | "Corpo Hídrico Estadual" |
| defiscaliz | string | 0 | 22 | 0 | "ESTADO" |
| nmemp | string | 0 | 22 | 1 | - |
| fonmemp | string | 0 | 22 | 1 | - |
| dtreserv | string | 0 | 22 | 1 | - |
| fodtreserv | string | 0 | 22 | 1 | - |
| nuvolumhm3 | string | 0 | 22 | 1 | - |
| fonuvolume | string | 0 | 22 | 1 | - |
| nuperimkm | string | 0 | 22 | 0 | "0.422659958355394" |
| nuareakm2 | string | 0 | 22 | 0 | "0.007446672216332" |
| nuareaha | string | 0 | 22 | 0 | "0.744667221633199" |
| nucompgeom | string | 0 | 22 | 0 | "1.3812080325599" |
| usoprinc | string | 0 | 22 | 1 | - |
| fousoprinc | string | 0 | 22 | 1 | - |
| detipoapr | string | 0 | 22 | 1 | - |
| detipomda | string | 0 | 22 | 1 | - |
| salinidade | string | 0 | 22 | 1 | - |
| regime | string | 0 | 22 | 1 | - |
| nmriocomp | string | 0 | 22 | 1 | - |
| nmufe | string | 0 | 22 | 0 | "MINAS GERAIS" |
| nmmun | string | 0 | 22 | 0 | "CRUZÍLIA" |
| defonte | string | 0 | 22 | 1 | - |
| desatelite | string | 0 | 22 | 0 | "Rapideye (MMA)" |
| deversao | string | 0 | 22 | 0 | "FBDS (2017)" |
| deobs | string | 0 | 22 | 1 | - |
| nuvzreg | string | 0 | 22 | 1 | - |
| nuvzlago | string | 0 | 22 | 1 | - |
| nuvzdeflu | string | 0 | 22 | 1 | - |
| cdtipooper | string | 0 | 22 | 1 | - |
| detipooper | string | 0 | 22 | 1 | - |
| fovzlago | string | 0 | 22 | 1 | - |
| fovzdeflu | string | 0 | 22 | 1 | - |
| fovzreg | string | 0 | 22 | 1 | - |
| cobarprin | string | 0 | 22 | 1 | - |
| cotrecho | string | 0 | 22 | 1 | - |
| nuvzrecebe | string | 0 | 22 | 1 | - |
| nuvztransf | string | 0 | 22 | 1 | - |
| deobsvazao | string | 0 | 22 | 1 | - |
| cocda2013 | string | 0 | 22 | 1 | - |
| cocda2017 | string | 0 | 22 | 1 | - |
| wtc_pk | number | 0 | 1 | 0 | 81484 |
| idcda | number | 0 | 1 | 0 | 81484 |
| cocursodag | number | 0 | 1 | 0 | 868864974 |
| nudistbacc | string | 0 | 1 | 0 | "3896.2053618085" |
| nucompcda | string | 0 | 1 | 0 | "4.93573591030749" |
| nuareabacc | string | 0 | 1 | 0 | "6.96683004005164" |
| cocdadesag | number | 0 | 1 | 0 | 868864 |
| nunivotcda | number | 0 | 1 | 0 | 9 |
| nuordemcda | number | 0 | 1 | 0 | 7 |
| dsversao | string | 0 | 1 | 0 | "BHO bho_2017_v_01_05_5k de 2018-06-20" |

### simu_microbacias.geojson

- FeatureCollection: estrutura de feicoes e coordenadas valida na inspecao. Nao foi feita auditoria topologica.
- Feicoes: 355; geometria: {"Polygon":355}.
- CRS: `urn:ogc:def:crs:OGC:1.3:CRS84`; dimens?es dos vertices: `{"2":45498}`.
- Extensao [m?nimo, m?ximo] por eixo: `[[-44.99004125095752,-44.78777456477674],[-21.909885053096662,-21.7701431]]`.
- URL: `https://pub-35704a8663af43efb1306042dbd871ec.r2.dev/vetores/simu_microbacias.geojson`.

| Atributo | Tipos JSON | Nulos | Ausentes | Strings vazias | Exemplo da fonte |
|---|---|---:|---:|---:|---|
| STREAM_ID | number | 0 | 0 | 0 | 1 |
| PERIMETER | string | 0 | 0 | 0 | "3.819 km" |
| ENCLOSED_AREA | string | 0 | 0 | 0 | "26.859 ha" |
| NEXT_STREAM_ID | number | 0 | 3 | 0 | 1 |
| ISLAND_AREA | string | 0 | 354 | 0 | "0.0834 ha" |

### simu_drenagens.geojson

- FeatureCollection: estrutura de feicoes e coordenadas valida na inspecao. Nao foi feita auditoria topologica.
- Feicoes: 2136; geometria: {"LineString":2136}.
- CRS: `urn:ogc:def:crs:OGC:1.3:CRS84`; dimens?es dos vertices: `{"2":11,"3":15092}`.
- Extensao [m?nimo, m?ximo] por eixo: `[[-44.99125323509575,-44.78979453834046],[-21.908134913028977,-21.77027772615905],[908.1530151367188,1205.9520263671875]]`.
- URL: `https://pub-35704a8663af43efb1306042dbd871ec.r2.dev/vetores/simu_drenagens.geojson`.

| Atributo | Tipos JSON | Nulos | Ausentes | Strings vazias | Exemplo da fonte |
|---|---|---:|---:|---:|---|
| STREAM_ID | number | 0 | 0 | 0 | 1 |
| IN_FLOW | number | 0 | 0 | 0 | 197940 |
| OUT_FLOW | number | 0 | 0 | 0 | 198103 |
| DRAIN_AREA | string | 0 | 0 | 0 | "16528 ha" |
| STRAHLER | number | 0 | 0 | 0 | 6 |

### geologia_ibge.geojson

- FeatureCollection: estrutura de feicoes e coordenadas valida na inspecao. Nao foi feita auditoria topologica.
- Feicoes: 1; geometria: {"Polygon":1}.
- CRS: `urn:ogc:def:crs:OGC:1.3:CRS84`; dimens?es dos vertices: `{"2":3045}`.
- Extensao [m?nimo, m?ximo] por eixo: `[[-45.055237385999895,-44.319573003],[-21.8911252259999,-21.4544881369999]]`.
- URL: `https://pub-35704a8663af43efb1306042dbd871ec.r2.dev/vetores/geologia_ibge.geojson`.

| Atributo | Tipos JSON | Nulos | Ausentes | Strings vazias | Exemplo da fonte |
|---|---|---:|---:|---:|---|
| id1 | number | 0 | 0 | 0 | 898773 |
| ordem | number | 0 | 0 | 0 | 11 |
| cd_fcim | string | 0 | 0 | 0 | "SF23" |
| leg_carga | string | 0 | 0 | 0 | "93.757/gn/aft/qt/mum" |
| id_unidade | number | 0 | 0 | 0 | 757 |
| nm_unidade | string | 0 | 0 | 0 | "Mantiqueira" |
| letra_simb | string | 0 | 0 | 0 | "PP2ma" |
| nm_lito1 | string | 0 | 0 | 0 | "gnaisse" |
| nm_lito2 | string | 0 | 0 | 0 | "anfibolito" |
| nm_lito3 | string | 0 | 0 | 0 | "quartzito" |
| nm_lito4 | string | 0 | 0 | 0 | "metaultramáfica" |
| ar_poli_km | string | 0 | 0 | 0 | "1169.2792" |
| nm_tempo_g | string | 0 | 0 | 0 | "Proterozoico Paleoproterozoica Riaciano" |
| nm_provinc | string | 0 | 0 | 0 | "Tocantins" |
| nm_sub_pro | string | 0 | 0 | 0 | "Socorro-Guaxupé" |
| cd_prov_id | number | 0 | 0 | 0 | 14 |
| cd_sub_pro | number | 0 | 0 | 0 | 93 |

### geomorfologia_ibge.geojson

- FeatureCollection: estrutura de feicoes e coordenadas valida na inspecao. Nao foi feita auditoria topologica.
- Feicoes: 1; geometria: {"Polygon":1}.
- CRS: `urn:ogc:def:crs:OGC:1.3:CRS84`; dimens?es dos vertices: `{"2":483}`.
- Extensao [m?nimo, m?ximo] por eixo: `[[-44.86864775039329,-44.4625766609841],[-21.8820301400788,-21.4398504188617]]`.
- URL: `https://pub-35704a8663af43efb1306042dbd871ec.r2.dev/vetores/geomorfologia_ibge.geojson`.

| Atributo | Tipos JSON | Nulos | Ausentes | Strings vazias | Exemplo da fonte |
|---|---|---:|---:|---:|---|
| id1 | number | 0 | 0 | 0 | 1456270 |
| cd_fcim | string | 0 | 0 | 0 | "SF23" |
| leg_carga | string | 0 | 0 | 0 | "717Dc31" |
| nm_dominio | string | 0 | 0 | 0 | "Cinturões Móveis Neoproterozóicos" |
| nm_regiao | string | 0 | 0 | 0 | "Planalto do Alto Rio Grande" |
| id_unidade | number | 0 | 0 | 0 | 717 |
| nm_unidade | string | 0 | 0 | 0 | "Planalto de Andrelândia" |
| letra_simb | string | 0 | 0 | 0 | "Dc" |
| categoria | string | 0 | 0 | 0 | "Homogênea convexa" |
| natureza | string | 0 | 0 | 0 | "dissecação" |
| caract | string | 0 | 0 | 0 | "dissecação homogênea ou diferencial" |
| forma | string | 0 | 0 | 0 | "topo convexo" |
| dens_dren | string | 0 | 0 | 0 | "média" |
| aprof_inci | string | 0 | 0 | 0 | "muito fraco : até 50m" |
| niv_alt | string | 0 | 0 | 1 | - |
| leg_sup | string | 0 | 0 | 0 | "Planalto de Andrelândia" |
| cd_leg_sup | number | 0 | 0 | 0 | 3 |
| legenda | string | 0 | 0 | 0 | "3Planalto de Andrelândia" |
| ar_poli_km | string | 0 | 0 | 0 | "993.2225" |
| compartime | string | 0 | 0 | 0 | "Planaltos" |
| cd_comp_id | number | 0 | 0 | 0 | 4 |
| cd_dominio | number | 0 | 0 | 0 | 2 |
| cd_unid_id | number | 0 | 0 | 0 | 282 |

### pedologia_ibge.geojson

- FeatureCollection: estrutura de feicoes e coordenadas valida na inspecao. Nao foi feita auditoria topologica.
- Feicoes: 1; geometria: {"Polygon":1}.
- CRS: `urn:ogc:def:crs:OGC:1.3:CRS84`; dimens?es dos vertices: `{"2":3910}`.
- Extensao [m?nimo, m?ximo] por eixo: `[[-45.358681823847895,-44.7643616024465],[-22.1277563793962,-21.801722004343198]]`.
- URL: `https://pub-35704a8663af43efb1306042dbd871ec.r2.dev/vetores/pedologia_ibge.geojson`.

| Atributo | Tipos JSON | Nulos | Ausentes | Strings vazias | Exemplo da fonte |
|---|---|---:|---:|---:|---|
| id1 | number | 0 | 0 | 0 | 104588 |
| cd_fcim | string | 0 | 0 | 0 | "SF23" |
| nom_unidad | string | 0 | 0 | 0 | "LVd19" |
| cod_simbol | string | 0 | 0 | 0 | "LVd" |
| val_ncompo | number | 0 | 0 | 0 | 3 |
| legenda | string | 0 | 0 | 0 | "LVd - Latossolo Vermelho Distrófico" |
| ordem | string | 0 | 0 | 0 | "LATOSSOLO" |
| subordem | string | 0 | 0 | 0 | "VERMELHO" |
| grande_gru | string | 0 | 0 | 0 | "Distrófico" |
| subgrupos | string | 0 | 0 | 0 | "típico" |
| textura | string | 0 | 0 | 0 | "argilosa e muito argilosa" |
| horizonte | string | 0 | 0 | 0 | "A \nmoderado e A proeminente" |
| erosao | string | 0 | 0 | 1 | - |
| pedregosid | string | 0 | 0 | 1 | - |
| rochosidad | string | 0 | 0 | 1 | - |
| relevo | string | 0 | 0 | 0 | "forte \nondulado, ondulado e suave \nondulado" |
| componente | string | 0 | 0 | 0 | "D LATOSSOLO VERMELHO Distrófico típico argilosa e muito argilosa A  moderado e A proeminente epiálico forte  ondulado, ondulado e suave  ondulado + S LATOSSOLO VERMELHO Ácrico típico argilosa e muito argilosa A  moderado forte  ondulado, ondulado e" |
| component1 | string | 0 | 0 | 0 | "suave  ondulado + S CAMBISSOLO HÁPLICO Tb Distrófico típico argilosa A  moderado álico forte  ondulado" |
| component2 | string | 0 | 0 | 1 | - |
| component3 | string | 0 | 0 | 1 | - |
| inclu_p1 | string | 0 | 0 | 1 | - |
| inclu_p2 | string | 0 | 0 | 1 | - |
| inclu_p3 | string | 0 | 0 | 1 | - |
| ar_poli_km | string | 0 | 0 | 0 | "744.2012" |
| leg_ordem | string | 0 | 0 | 0 | "LATOSSOLO" |
| legenda_2 | string | 0 | 0 | 0 | "LATOSSOLO VERMELHO" |
| cd_ord_id | number | 0 | 0 | 0 | 6 |
| cd_leg2_id | number | 0 | 0 | 0 | 23 |

### vegetacao_ibge.geojson

- FeatureCollection: estrutura de feicoes e coordenadas valida na inspecao. Nao foi feita auditoria topologica.
- Feicoes: 1; geometria: {"Polygon":1}.
- CRS: `urn:ogc:def:crs:OGC:1.3:CRS84`; dimens?es dos vertices: `{"2":7889}`.
- Extensao [m?nimo, m?ximo] por eixo: `[[-44.8913270749999,-43.700005651],[-21.9985596069999,-21.1986166529999]]`.
- URL: `https://pub-35704a8663af43efb1306042dbd871ec.r2.dev/vetores/vegetacao_ibge.geojson`.

| Atributo | Tipos JSON | Nulos | Ausentes | Strings vazias | Exemplo da fonte |
|---|---|---:|---:|---:|---|
| id1 | number | 0 | 0 | 0 | 509280 |
| cd_fcim | string | 0 | 0 | 0 | "SF23" |
| leg_carga | string | 0 | 0 | 0 | "Ag+Sgf+Re" |
| cd_fito | string | 0 | 0 | 0 | "S" |
| cd_leg_2 | string | 0 | 0 | 0 | "Ag" |
| clas_domi | string | 0 | 0 | 0 | "Ag" |
| leg_uveg | string | 0 | 0 | 1 | - |
| nm_uveg | string | 0 | 0 | 1 | - |
| leg_uantr | string | 0 | 0 | 0 | "Ag" |
| nm_uantr | string | 0 | 0 | 0 | "Agropecuária" |
| leg_contat | string | 0 | 0 | 1 | - |
| nm_contat | string | 0 | 0 | 1 | - |
| veg_pretet | string | 0 | 0 | 0 | "S" |
| nm_pretet | string | 0 | 0 | 0 | "Savana" |
| leg_sec1 | string | 0 | 0 | 0 | "Sgf" |
| nm_sec1 | string | 0 | 0 | 0 | "Savana Gramíneo-Lenhosa com floresta-de-galeria" |
| leg_sec2 | string | 0 | 0 | 0 | "Re" |
| nm_sec2 | string | 0 | 0 | 0 | "Florestamento/Reflorestamento com Eucaliptos" |
| leg_sup | string | 0 | 0 | 0 | "Área Antrópica Dominante" |
| legenda_1 | string | 0 | 0 | 0 | "Savana" |
| legenda_2 | string | 0 | 0 | 0 | "Agropecuária" |
| legenda | string | 0 | 0 | 0 | "3Ag - Agropecuária" |
| ar_poli_km | string | 0 | 0 | 0 | "4310.7387" |
| leg1_id | number | 0 | 0 | 0 | 8 |
| leg2_id | number | 0 | 0 | 0 | 45 |

### clima_ibge.geojson

- FeatureCollection: estrutura de feicoes e coordenadas valida na inspecao. Nao foi feita auditoria topologica.
- Feicoes: 1; geometria: {"Polygon":1}.
- CRS: `urn:ogc:def:crs:OGC:1.3:CRS84`; dimens?es dos vertices: `{"2":187}`.
- Extensao [m?nimo, m?ximo] por eixo: `[[-45.59197445510843,-43.25587732481411],[-22.017589126062415,-17.649215374097285]]`.
- URL: `https://pub-35704a8663af43efb1306042dbd871ec.r2.dev/vetores/clima_ibge.geojson`.

| Atributo | Tipos JSON | Nulos | Ausentes | Strings vazias | Exemplo da fonte |
|---|---|---:|---:|---:|---|
| MSLINK | number | 0 | 0 | 0 | 0 |
| ZONA | string | 0 | 0 | 0 | "Tropical Brasil Central" |
| TP_UMIDADE | string | 0 | 0 | 0 | "semi-úmido" |
| DISTR_UMID | string | 0 | 0 | 0 | "4 a 5 meses secos" |
| TEMPERATUR | string | 0 | 0 | 0 | "mesotérmico brando - média entre 10 e 15° C" |
| DESC_COMPL | string | 0 | 0 | 0 | "Tropical Brasil Central, mesotérmico brando - média entre 10 e 15° C, semi-úmido 4 a 5 meses" |

### info_municipio.geojson

- FeatureCollection: estrutura de feicoes e coordenadas valida na inspecao. Nao foi feita auditoria topologica.
- Feicoes: 1; geometria: {"Polygon":1}.
- CRS: `urn:ogc:def:crs:OGC:1.3:CRS84`; dimens?es dos vertices: `{"2":307}`.
- Extensao [m?nimo, m?ximo] por eixo: `[[-44.8963279998373,-44.676213999876154],[-21.909527997119312,-21.586494996746637]]`.
- URL: `https://pub-35704a8663af43efb1306042dbd871ec.r2.dev/vetores/info_municipio.geojson`.

| Atributo | Tipos JSON | Nulos | Ausentes | Strings vazias | Exemplo da fonte |
|---|---|---:|---:|---:|---|
| OBJECTID | number | 0 | 0 | 0 | 1972 |
| BaseRurUrb | string | 0 | 0 | 0 | "Minas Gerais" |
| BaseRurU_1 | number | 0 | 0 | 0 | 3120805 |
| BaseRurU_2 | string | 0 | 0 | 0 | "Cruzília" |
| BaseRurU_3 | number | 0 | 0 | 0 | 31 |
| BaseRurU_4 | string | 0 | 0 | 0 | "Cruzília" |
| remotidao_ | number | 0 | 0 | 0 | 238 |
| remotidao1 | number | 0 | 0 | 0 | 99 |
| remotida_1 | number | 0 | 0 | 0 | 41 |
| remotida_2 | string | 0 | 0 | 0 | "0.57211538462" |
| remotida_3 | string | 0 | 0 | 0 | "0.5625" |
| remotida_4 | string | 0 | 0 | 0 | "0.34745762712" |
| remotida_5 | string | 0 | 0 | 0 | "0.95582329317" |
| remotida_6 | string | 0 | 0 | 0 | "0.94285714286" |
| remotida_7 | string | 0 | 0 | 0 | "0.58571428571" |
| Shape_Leng | string | 0 | 0 | 0 | "1.11356446962" |
| Shape_Area | string | 0 | 0 | 0 | "0.0456022762" |
| Pop_Urb_Mu | number | 0 | 0 | 0 | 12730 |
| Pop_Rur_Mu | number | 0 | 0 | 0 | 1692 |
| Pop_Tot_Mu | number | 0 | 0 | 0 | 14422 |
| Pop_Urb_Un | number | 0 | 0 | 0 | 12730 |
| Pop_Rur_Un | number | 0 | 0 | 0 | 1692 |
| Pop_Tot_Un | number | 0 | 0 | 0 | 14422 |
| Perc_Urb_U | string | 0 | 0 | 0 | "88.267924005" |
| Tipologia_ | string | 0 | 0 | 0 | "Urbano" |
| Loc_BR | string | 0 | 0 | 0 | "Adjacente" |
| Loc_UF | string | 0 | 0 | 0 | "Adjacente" |
| Classes_Po | string | 0 | 0 | 0 | "Unidade populacional que possui entre 10.000 e 25.000 habitantes em mancha de ocupação densa" |
| Classes_Pe | string | 0 | 0 | 0 | "Unidade populacional com alto grau de urbanizacao" |

## Validacao e pendencias

Somente npm.cmd run typecheck foi executado: concluido sem erros. Sem build, Playwright, commit, push ou deploy.

A publicacao no R2 foi informada pelo proprietario. Disponibilidade HTTP, CORS e aparencia no navegador nao foram verificadas. Confirmar visualmente sobreposicao, opacidades, popups e desempenho no dispositivo final. Nao ha arquivo local faltante. Camera/Home, modelo/clipping, dados do drone, tokens e dependencias foram preservados.
