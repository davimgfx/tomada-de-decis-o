# EcoDrive SAD

Sistema de Apoio à Decisão para escolha de veículos (SAW) com dados do PBEV/INMETRO 2026.

- `backend/`: FastAPI (Python). Lê `Tabela_PBEV_2026_colunas_organizadas.xlsx`, aplica o SAW e agrupa em Excelente/Bom/Ruim.
- `frontend/`: Angular 21 + Bootstrap. Telas: login/visitante, início, simulação e classificação por grupos.

## Executar

```powershell
# Back-end (http://localhost:8000, docs em /docs)
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload

# Front-end (http://localhost:4200)
cd frontend
npm install
npm start
```

## Método

- Critérios: consumo urbano (benefício), consumo rodoviário (benefício), preço (custo).
- Normalização: benefício = x / máx; custo = mín / x.
- Pontuação = soma ponderada x 100. Perfis sugerem pesos (urbano 50/10/40, rodoviário 10/50/40, misto 30/30/40) e o usuário pode alterar, mantendo soma 100%.
- Grupos: Excelente (>= 50), Bom (30 a 49,99), Ruim (< 30). Cortes em `backend/app/saw.py`.
- Consumo usado: gasolina/diesel; se ausente, etanol; se ausente, elétrico (km/l equivalente).

## Preços (FIPE)

A planilha do INMETRO não tem preços. Sem dados FIPE, o sistema usa um preço **estimado** (por categoria,
propulsão e marca, com variação determinística), sinalizado na interface. Para preços reais, preencha
`backend/dados/precos_fipe.csv` (`marca;modelo;versao;preco`; versão vazia vale para todo o modelo).
