"""Método SAW (Simple Additive Weighting) e classificação em grupos."""
from __future__ import annotations

from statistics import mean

CRITERIOS = ["consumo_urbano", "consumo_rodoviario", "consumo_energetico", "emissao_co2"]

# Pesos sugeridos por perfil - somam 100
PERFIS = {
    "urbano": {"consumo_urbano": 40, "consumo_rodoviario": 10, "consumo_energetico": 25, "emissao_co2": 25,
               "descricao": "Uso predominante na cidade: trânsito, paradas e semáforos."},
    "rodoviario": {"consumo_urbano": 10, "consumo_rodoviario": 40, "consumo_energetico": 25, "emissao_co2": 25,
                   "descricao": "Uso predominante em estradas e viagens longas."},
    "misto": {"consumo_urbano": 25, "consumo_rodoviario": 25, "consumo_energetico": 25, "emissao_co2": 25,
              "descricao": "Uso equilibrado entre cidade e estrada."},
}

# Intervalos de pontuação (SAW normalizado em 0..1, multiplicado por 100).
# Pontuação 100 = veículo que seria o melhor em todos os critérios ao mesmo tempo.
# Os cortes foram calibrados na distribuição das pontuações da base (ver README):
# >= LIMITES["Excelente"]: Excelente | >= LIMITES["Bom"]: Bom | abaixo: Ruim.
LIMITES = {"Excelente": 60.0, "Bom": 30.0}
GRUPOS = ["Excelente", "Bom", "Ruim"]


def classificar(score: float) -> str:
    if score >= LIMITES["Excelente"]:
        return "Excelente"
    if score >= LIMITES["Bom"]:
        return "Bom"
    return "Ruim"


def _beneficio(x: float, maximo: float) -> float:
    return x / maximo if maximo else 0.0


def _custo(x: float, minimo: float, maximo: float) -> float:
    """Critério de custo: mín/x. Se há valor zero (ex.: elétricos em CO2), usa (máx - x)/máx."""
    if minimo > 0:
        return minimo / x
    return (maximo - x) / maximo if maximo else 1.0


def calcular(veiculos: list[dict], pesos: dict[str, float]) -> list[dict]:
    """Normaliza (benefício ou custo), pondera e classifica."""
    if not veiculos:
        return []
    max_u = max(v["consumo_urbano"] for v in veiculos)
    max_r = max(v["consumo_rodoviario"] for v in veiculos)
    e = [v["energia_mj_km"] for v in veiculos]
    c = [v["co2_fossil_g_km"] for v in veiculos]
    total = sum(pesos[k] for k in CRITERIOS) or 1
    w = {k: pesos[k] / total for k in CRITERIOS}
    saida = []
    for v in veiculos:
        n = {
            "consumo_urbano": _beneficio(v["consumo_urbano"], max_u),
            "consumo_rodoviario": _beneficio(v["consumo_rodoviario"], max_r),
            "consumo_energetico": _custo(v["energia_mj_km"], min(e), max(e)),
            "emissao_co2": _custo(v["co2_fossil_g_km"], min(c), max(c)),
        }
        score = round(sum(w[k] * n[k] for k in CRITERIOS) * 100, 2)
        saida.append({**v, "normalizado": {k: round(x, 4) for k, x in n.items()},
                      "score": score, "grupo": classificar(score)})
    return saida


def _media(valores: list, casas: int = 0) -> float:
    v = [x for x in valores if x is not None]
    return round(mean(v), casas) if v else 0


def sumarizar(itens: list[dict]) -> dict:
    """Sumarização por grupo (contagem e médias)."""
    resumo = {}
    for g in GRUPOS:
        sub = [i for i in itens if i["grupo"] == g]
        resumo[g] = {
            "quantidade": len(sub),
            "percentual": round(100 * len(sub) / len(itens), 1) if itens else 0,
            "score_medio": _media([i["score"] for i in sub], 2),
            "consumo_urbano_medio": _media([i["consumo_urbano"] for i in sub], 1),
            "consumo_rodoviario_medio": _media([i["consumo_rodoviario"] for i in sub], 1),
            "co2_medio": _media([i["co2_fossil_g_km"] for i in sub]),
            "energia_media": _media([i["energia_mj_km"] for i in sub], 2),
        }
    return resumo
