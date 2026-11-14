"""Carga e tratamento da tabela PBEV 2026 (INMETRO)."""
from __future__ import annotations

import hashlib
import re
from functools import lru_cache
from pathlib import Path

import openpyxl

RAIZ = Path(__file__).resolve().parents[2]
XLSX = RAIZ / "Tabela_PBEV_2026_colunas_organizadas.xlsx"

# Índices das colunas na planilha
C_CATEGORIA, C_MARCA, C_MODELO, C_VERSAO, C_MOTOR, C_PROP, C_TRANS, C_COMB = 1, 2, 3, 4, 5, 6, 7, 10
C_ET_CID, C_ET_EST = 18, 19
C_GAS_CID, C_GAS_EST = 21, 22
C_EL_CID, C_EL_EST, C_ELF_CID, C_ELF_EST = 24, 25, 26, 27
# No PDF original os rótulos de CO2 estão deslocados: col. 15 = CO2 total e col. 16 = CO2 fóssil (g/km)
C_MJ, C_AUT, C_PBE_REL, C_PBE_ABS, C_CONPET, C_CO2_TOTAL, C_CO2 = 28, 29, 30, 31, 32, 15, 16

PROPULSAO_NORM = {"combustão": "Combustão", "elétrico": "Elétrico", "híbrido": "Híbrido", "plug-in": "Plug-in"}
COMBUSTIVEL = {"F": "Flex", "G": "Gasolina", "E": "Elétrico", "D": "Diesel", "E100": "Etanol"}
CATEGORIA_NORM = {"Compacta": "Compacto", "Compacto 4x4": "Compacto"}

# PREÇO ESTIMADO (R$): a planilha do INMETRO não tem preços. Valores-base aproximados por
# categoria x propulsão, definidos como premissa do sistema (não vêm da FIPE). Usado apenas como filtro.
BASE = {
    "Compacto": {"Combustão": 95_000, "Híbrido": 140_000, "Plug-in": 180_000, "Elétrico": 140_000},
    "Médio": {"Combustão": 150_000, "Híbrido": 200_000, "Plug-in": 250_000, "Elétrico": 220_000},
    "Grande": {"Combustão": 260_000, "Híbrido": 330_000, "Plug-in": 380_000, "Elétrico": 350_000},
    "Grande 4x4": {"Combustão": 400_000, "Híbrido": 450_000, "Plug-in": 500_000, "Elétrico": 480_000},
    "Estrada Grande": {"Combustão": 300_000, "Híbrido": 350_000, "Plug-in": 400_000, "Elétrico": 380_000},
    "Picape": {"Combustão": 200_000, "Híbrido": 280_000, "Plug-in": 330_000, "Elétrico": 300_000},
    "Minivan": {"Combustão": 220_000, "Híbrido": 280_000, "Plug-in": 330_000, "Elétrico": 300_000},
}
PREMIUM = {
    "BMW", "MERCEDES-BENZ", "AUDI", "VOLVO", "PORSCHE", "LAND ROVER", "JAGUAR", "LEXUS", "MINI",
    "MASERATI", "FERRARI", "LAMBORGHINI", "BENTLEY", "ROLLS-ROYCE", "MCLAREN", "ASTON MARTIN", "LOTUS",
}


def _preco_estimado(categoria: str, propulsao: str, marca: str, chave: str) -> float:
    base = BASE.get(categoria, BASE["Médio"]).get(propulsao, BASE["Médio"]["Combustão"])
    fator_marca = 1.8 if marca.upper() in PREMIUM else 1.0
    h = int(hashlib.md5(chave.encode()).hexdigest()[:8], 16) / 0xFFFFFFFF  # 0..1, determinístico
    return round(base * fator_marca * (0.8 + 0.4 * h), -2)  # variação de ±20%


def _num(valor) -> float | None:
    """Converte '58,59' em 58.59; símbolos '\\', 'ND', '-' viram None."""
    if valor is None:
        return None
    if isinstance(valor, (int, float)):
        return float(valor)
    s = str(valor).strip().replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def _consumo(r) -> tuple[float | None, float | None, str]:
    """Consumo urbano/rodoviário (km/l ou km/l equivalente) e a fonte utilizada."""
    for (c, e), nome in (
        ((C_GAS_CID, C_GAS_EST), "gasolina/diesel"),
        ((C_ET_CID, C_ET_EST), "etanol"),
        ((C_EL_CID, C_EL_EST), "elétrico (km/l eq.)"),
        ((C_ELF_CID, C_ELF_EST), "elétrico (km/l eq.)"),
    ):
        u, rod = _num(r[c]), _num(r[e])
        if u and rod:
            return u, rod, nome
    return None, None, ""


@lru_cache(maxsize=1)
def carregar_veiculos() -> list[dict]:
    """Veículos com todos os critérios do SAW disponíveis (consumo, energia e CO2)."""
    ws = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)["Dados organizados"]
    veiculos: list[dict] = []
    for i, r in enumerate(list(ws.iter_rows(values_only=True))[1:], start=1):
        if not r[C_MARCA] or not r[C_MODELO]:
            continue
        urbano, rodov, fonte = _consumo(r)
        energia = _num(r[C_MJ])
        propulsao = PROPULSAO_NORM.get(str(r[C_PROP]).strip().lower(), str(r[C_PROP]))
        co2 = _num(r[C_CO2])
        if co2 is None:
            co2 = _num(r[C_CO2_TOTAL])
        if co2 is None and propulsao == "Elétrico":
            co2 = 0.0  # sem emissão no escapamento
        if urbano is None or energia is None or co2 is None:
            continue  # sem dado suficiente para o cálculo
        cat_original = str(r[C_CATEGORIA]).strip()
        categoria = CATEGORIA_NORM.get(cat_original, cat_original)
        marca = str(r[C_MARCA]).strip()
        veiculos.append({
            "id": i,
            "marca": marca,
            "modelo": str(r[C_MODELO]).strip(),
            "versao": str(r[C_VERSAO] or "").strip(),
            "categoria": categoria,
            "motor": re.sub(r"\s+", "", str(r[C_MOTOR] or "")).upper() or "N/I",
            "propulsao": propulsao,
            "combustivel": COMBUSTIVEL.get(str(r[C_COMB]).strip(), str(r[C_COMB])),
            "transmissao": str(r[C_TRANS] or ""),
            "consumo_urbano": urbano,
            "consumo_rodoviario": rodov,
            "fonte_consumo": fonte,
            "energia_mj_km": energia,
            "co2_fossil_g_km": co2,
            "autonomia_eletrica_km": _num(r[C_AUT]),
            "pbe_relativa": r[C_PBE_REL],
            "pbe_absoluta": r[C_PBE_ABS],
            "selo_conpet": str(r[C_CONPET]).strip().upper() == "SIM",
            "preco_estimado": _preco_estimado(categoria, propulsao, marca, f"{marca}|{r[C_MODELO]}|{r[C_VERSAO]}|{r[C_MOTOR]}|{i}"),
        })
    return veiculos
