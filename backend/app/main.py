from __future__ import annotations

from statistics import mean

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import saw
from .dados import carregar_veiculos

app = FastAPI(title="EcoDrive SAD API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_methods=["*"],
    allow_headers=["*"],
)


class Pesos(BaseModel):
    consumo_urbano: float = Field(ge=0, le=100)
    consumo_rodoviario: float = Field(ge=0, le=100)
    consumo_energetico: float = Field(ge=0, le=100)
    emissao_co2: float = Field(ge=0, le=100)


class Filtros(BaseModel):
    propulsoes: list[str] = []
    categorias: list[str] = []
    marcas: list[str] = []
    motores: list[str] = []
    preco_max: float | None = None  # reservado; não utilizado


class SimulacaoIn(BaseModel):
    perfil: str = "misto"
    pesos: Pesos
    filtros: Filtros = Filtros()


def _filtrar(f: Filtros) -> list[dict]:
    itens = carregar_veiculos()
    if f.propulsoes:
        itens = [v for v in itens if v["propulsao"] in f.propulsoes]
    if f.categorias:
        itens = [v for v in itens if v["categoria"] in f.categorias]
    if f.marcas:
        itens = [v for v in itens if v["marca"] in f.marcas]
    if f.motores:
        itens = [v for v in itens if v["motor"] in f.motores]
    return itens


@app.get("/api/perfis")
def perfis():
    return saw.PERFIS


@app.get("/api/opcoes")
def opcoes():
    v = carregar_veiculos()
    return {
        "propulsoes": sorted({i["propulsao"] for i in v}),
        "categorias": sorted({i["categoria"] for i in v}),
        "marcas": sorted({i["marca"] for i in v}),
        "motores": sorted({i["motor"] for i in v}),
        "limites_grupos": saw.LIMITES,
    }


@app.get("/api/resumo")
def resumo():
    """Sumarização geral da base (dashboard)."""
    v = carregar_veiculos()
    por_prop: dict[str, int] = {}
    por_cat: dict[str, int] = {}
    for i in v:
        por_prop[i["propulsao"]] = por_prop.get(i["propulsao"], 0) + 1
        por_cat[i["categoria"]] = por_cat.get(i["categoria"], 0) + 1
    # Destaques no perfil misto
    calc = saw.calcular(v, saw.PERFIS["misto"])
    destaques = sorted(calc, key=lambda x: -x["score"])[:3]
    return {
        "total_veiculos": len(v),
        "consumo_urbano_medio": round(mean(i["consumo_urbano"] for i in v), 1),
        "consumo_rodoviario_medio": round(mean(i["consumo_rodoviario"] for i in v), 1),
        "energia_media": round(mean(i["energia_mj_km"] for i in v), 2),
        "co2_medio": round(mean(i["co2_fossil_g_km"] for i in v)),
        "por_propulsao": por_prop,
        "por_categoria": por_cat,
        "destaques": destaques,
    }


@app.post("/api/simular")
def simular(dados: SimulacaoIn):
    soma = sum(dados.pesos.model_dump().values())
    if abs(soma - 100) > 0.01:
        raise HTTPException(422, f"A soma dos pesos deve ser 100% (recebido {soma:g}%).")
    itens = _filtrar(dados.filtros)
    if not itens:
        raise HTTPException(404, "Nenhum veículo atende aos filtros informados.")
    calc = saw.calcular(itens, dados.pesos.model_dump())
    calc.sort(key=lambda x: x["marca"] + x["modelo"] + x["versao"])  # ordem neutra: sem ranking individual
    grupos = {g: [i for i in calc if i["grupo"] == g] for g in saw.GRUPOS}
    return {
        "perfil": dados.perfil,
        "pesos": dados.pesos,
        "total": len(calc),
        "limites": saw.LIMITES,
        "resumo": saw.sumarizar(calc),
        "grupos": grupos,
    }


@app.get("/api/contagem")
def contagem(propulsoes: str = "", categorias: str = "", marcas: str = "", motores: str = ""):
    def lista(s: str) -> list[str]:
        return [x for x in s.split("|") if x]

    f = Filtros(propulsoes=lista(propulsoes), categorias=lista(categorias), marcas=lista(marcas), motores=lista(motores))
    return {"total": len(_filtrar(f))}

