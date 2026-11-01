import type { VectorPopupConfig } from "./types";

// Copied from andrelandia-webgis/src/projects/andrelandia.ts (2026-10-31).
// Keep field order, labels, titles and formatting aligned with that reference.
// Missing/empty source attributes are omitted; never append uncurated fields.
export const efacMacroPopups: Record<string, VectorPopupConfig> = {
  "ana-basin": {
    "title": "Microbacias ANA",
    "fields": [
      {
        "property": "wts_cd_pfafstetterbasin",
        "label": "Código da microbacia",
        "format": "integer"
      },
      {
        "property": "wts_cd_pfafstetterbasincodeleve",
        "label": "Nível Pfafstetter",
        "format": "integer"
      },
      {
        "property": "wts_gm_area",
        "label": "Área",
        "unit": "km²",
        "decimals": 4
      }
    ]
  },
  "ana-hydrography": {
    "title": "Drenagem ANA",
    "fields": [
      {
        "property": "nuordemcda",
        "label": "Ordem",
        "format": "integer"
      },
      {
        "property": "nunivotcda",
        "label": "Nível Otto",
        "format": "integer"
      },
      {
        "property": "nuareabacc",
        "label": "Área da bacia",
        "unit": "km²",
        "decimals": 3
      },
      {
        "property": "nucompcda",
        "label": "Comprimento",
        "unit": "km",
        "decimals": 3
      },
      {
        "property": "dsversao",
        "label": "Versão/base"
      }
    ]
  },
  "simulated-basins": {
    "title": "Microbacia simulada",
    "fields": [
      {
        "property": "STREAM_ID",
        "label": "STREAM ID",
        "format": "integer"
      },
      {
        "property": "ENCLOSED_AREA",
        "label": "Área",
        "unit": "ha",
        "decimals": 2
      },
      {
        "property": "PERIMETER",
        "label": "Perímetro",
        "unit": "km",
        "decimals": 3
      }
    ]
  },
  "simulated-drainage": {
    "title": "Simulação de drenagem ANADEM",
    "fields": [
      {
        "property": "STRAHLER",
        "label": "Ordem Strahler",
        "format": "integer"
      },
      {
        "property": "DRAIN_AREA",
        "label": "Área drenada",
        "unit": "ha",
        "decimals": 4
      }
    ]
  },
  "geology": {
    "title": "Geologia IBGE",
    "fields": [
      {
        "property": "nm_unidade",
        "label": "Unidade"
      },
      {
        "property": "letra_simb",
        "label": "Símbolo"
      },
      {
        "property": "nm_tempo_g",
        "label": "Tempo geológico"
      },
      {
        "property": "nm_provinc",
        "label": "Província"
      },
      {
        "property": "nm_sub_pro",
        "label": "Subprovíncia"
      },
      {
        "property": "nm_lito1",
        "label": "Litologia"
      },
      {
        "property": "nm_lito2",
        "label": "Litologia"
      },
      {
        "property": "nm_lito3",
        "label": "Litologia"
      },
      {
        "property": "nm_lito4",
        "label": "Litologia"
      }
    ]
  },
  "geomorphology": {
    "title": "Geomorfologia IBGE",
    "fields": [
      {
        "property": "nm_dominio",
        "label": "Domínio"
      },
      {
        "property": "nm_regiao",
        "label": "Região"
      },
      {
        "property": "nm_unidade",
        "label": "Unidade"
      },
      {
        "property": "categoria",
        "label": "Categoria"
      },
      {
        "property": "natureza",
        "label": "Natureza"
      },
      {
        "property": "caract",
        "label": "Característica"
      },
      {
        "property": "forma",
        "label": "Forma"
      },
      {
        "property": "dens_dren",
        "label": "Densidade de drenagem"
      },
      {
        "property": "aprof_inci",
        "label": "Aprofundamento da incisão"
      },
      {
        "property": "compartime",
        "label": "Compartimento"
      }
    ]
  },
  "soils": {
    "title": "Pedologia IBGE",
    "fields": [
      {
        "property": "nom_unidad",
        "label": "Unidade"
      },
      {
        "property": "legenda",
        "label": "Solo"
      },
      {
        "property": "ordem",
        "label": "Ordem"
      },
      {
        "property": "subordem",
        "label": "Subordem"
      },
      {
        "property": "grande_gru",
        "label": "Grande grupo"
      },
      {
        "property": "subgrupos",
        "label": "Subgrupo"
      },
      {
        "property": "textura",
        "label": "Textura"
      },
      {
        "property": "horizonte",
        "label": "Horizonte"
      },
      {
        "property": "relevo",
        "label": "Relevo"
      },
      {
        "property": "componente",
        "label": "Componente",
        "section": "Associação de solos"
      },
      {
        "property": "component1",
        "label": "Componente",
        "section": "Associação de solos"
      },
      {
        "property": "component2",
        "label": "Componente",
        "section": "Associação de solos"
      },
      {
        "property": "component3",
        "label": "Componente",
        "section": "Associação de solos"
      },
      {
        "property": "inclu_p1",
        "label": "Inclusão",
        "section": "Associação de solos"
      },
      {
        "property": "inclu_p2",
        "label": "Inclusão",
        "section": "Associação de solos"
      },
      {
        "property": "inclu_p3",
        "label": "Inclusão",
        "section": "Associação de solos"
      }
    ]
  },
  "vegetation": {
    "title": "Vegetação IBGE",
    "fields": [
      {
        "property": "nm_uveg",
        "label": "Vegetação atual/principal"
      },
      {
        "property": "nm_pretet",
        "label": "Vegetação pretérita"
      },
      {
        "property": "nm_sec1",
        "label": "Uso associado"
      },
      {
        "property": "nm_sec2",
        "label": "Classe associada"
      },
      {
        "property": "leg_sup",
        "label": "Dominância"
      }
    ]
  },
  "climate": {
    "title": "Clima IBGE",
    "fields": [
      {
        "property": "ZONA",
        "label": "Zona"
      },
      {
        "property": "TP_UMIDADE",
        "label": "Umidade"
      },
      {
        "property": "DISTR_UMID",
        "label": "Distribuição de umidade"
      },
      {
        "property": "TEMPERATUR",
        "label": "Temperatura"
      },
      {
        "property": "DESC_COMPL",
        "label": "Descrição completa"
      }
    ]
  },
  "municipality": {
    "title": "Contexto Municipal IBGE",
    "fields": [
      {
        "property": "BaseRurU_2",
        "label": "Município"
      },
      {
        "property": "BaseRurUrb",
        "label": "UF",
        "valueLabels": {
          "Minas Gerais": "MG"
        }
      },
      {
        "property": "Pop_Tot_Mu",
        "label": "População total",
        "format": "integer",
        "suffix": " habitantes"
      },
      {
        "property": "Pop_Urb_Mu",
        "label": "População urbana",
        "format": "integer"
      },
      {
        "property": "Perc_Urb_U",
        "label": "Percentual urbano",
        "decimals": 2,
        "suffix": "%"
      },
      {
        "property": "Pop_Rur_Mu",
        "label": "População rural",
        "format": "integer"
      },
      {
        "property": "Pop_Rur_Mu",
        "label": "Percentual rural",
        "ratioTo": "Pop_Tot_Mu",
        "decimals": 2,
        "suffix": "%"
      },
      {
        "property": "Tipologia_",
        "label": "Tipologia territorial",
        "valueLabels": {
          "IntermediarioAdjacente": "Intermediário Adjacente"
        }
      },
      {
        "property": "Classes_Pe",
        "label": "Urbanização"
      }
    ]
  }
};
