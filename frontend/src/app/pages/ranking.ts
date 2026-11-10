import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Grupo, Veiculo } from '../models';
import { EstadoService } from '../services/estado.service';

const GRUPOS: Grupo[] = ['Excelente', 'Bom', 'Ruim'];
const TEXTOS: Record<Grupo, string> = {
  Excelente: 'Baixo consumo de combustível, baixo consumo energético e poucas emissões.',
  Bom: 'Equilíbrio satisfatório entre consumo, energia e emissões.',
  Ruim: 'Consumo, gasto energético ou emissões elevados em relação às demais alternativas.',
};
const PASSO = 12;

@Component({
  selector: 'app-ranking',
  imports: [DecimalPipe, FormsModule, RouterLink],
  template: `
    @if (sim(); as s) {
      <div class="d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div>
          <h1 class="fw-bold">Classificação por Grupos</h1>
          <p class="text-secondary mb-2">
            Veículos agrupados pela pontuação SAW, sem ordenação individual. Perfil:
            <strong class="text-capitalize">{{ s.perfil }}</strong>.
          </p>
        </div>
        <button class="btn btn-eco" (click)="exportar()">Exportar CSV</button>
      </div>

      <div class="cartao mb-3 small">
        <strong>Pesos aplicados:</strong>
        <span class="badge text-bg-light border ms-2">Consumo urbano {{ s.pesos.consumo_urbano }}%</span>
        <span class="badge text-bg-light border ms-1">Consumo rodoviário {{ s.pesos.consumo_rodoviario }}%</span>
        <span class="badge text-bg-light border ms-1">Consumo energético {{ s.pesos.consumo_energetico }}%</span>
        <span class="badge text-bg-light border ms-1">Emissão CO₂ {{ s.pesos.emissao_co2 }}%</span>
        <a routerLink="/simulacao" class="ms-3">Alterar</a>
      </div>

      <div class="d-flex flex-wrap gap-2 mb-3" role="tablist">
        @for (g of grupos; track g) {
          <button type="button" class="resumo-chip" [class.sel]="filtro() === g" (click)="filtro.set(filtro() === g ? null : g)">
            <span class="ponto" [style.background]="cor(g)"></span> {{ g }}
            <span class="badge text-bg-light">{{ s.resumo[g].quantidade }}</span>
          </button>
        }
        <input class="form-control ms-auto" style="max-width: 280px" type="search" placeholder="Buscar marca ou modelo"
               [ngModel]="busca()" (ngModelChange)="busca.set($event); resetar()" aria-label="Buscar" />
      </div>

      @for (g of visiveis(); track g) {
        <section class="grupo mb-4" [style.border-left-color]="cor(g)">
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-1">
            <h2 class="h4 mb-0" [style.color]="cor(g)">Grupo {{ g }}</h2>
            <span class="badge" [style.background]="cor(g)">{{ faixa(g) }}</span>
          </div>
          <p class="text-secondary small">{{ textos[g] }}</p>

          <div class="row g-2 mb-3 text-center">
            <div class="col-6 col-md-3"><div class="mini"><div class="rotulo-sup">Veículos</div>
              <strong>{{ s.resumo[g].quantidade }}</strong> ({{ s.resumo[g].percentual }}%)</div></div>
            <div class="col-6 col-md-3"><div class="mini"><div class="rotulo-sup">Urbano médio</div>
              <strong>{{ s.resumo[g].consumo_urbano_medio | number: '1.1-1' }}</strong> km/l</div></div>
            <div class="col-6 col-md-3"><div class="mini"><div class="rotulo-sup">Rodoviário médio</div>
              <strong>{{ s.resumo[g].consumo_rodoviario_medio | number: '1.1-1' }}</strong> km/l</div></div>
            <div class="col-6 col-md-3"><div class="mini"><div class="rotulo-sup">CO₂ fóssil / energia médios</div>
              <strong>{{ s.resumo[g].co2_medio | number: '1.0-0' }}</strong> g/km •
              <strong>{{ s.resumo[g].energia_media | number: '1.2-2' }}</strong> MJ/km</div></div>
          </div>

          @let lista = filtrada(g);
          @if (lista.length === 0) {
            <p class="text-secondary">Nenhum veículo neste grupo.</p>
          }
          <div class="row g-2">
            @for (v of lista.slice(0, limite()[g]); track v.id) {
              <div class="col-md-6 col-xl-4">
                <article class="veiculo h-100">
                  <div class="d-flex justify-content-between gap-2">
                    <div>
                      <small class="text-secondary">{{ v.marca }} • {{ v.categoria }} • {{ v.propulsao }}</small>
                      <div class="fw-bold">{{ v.modelo }}</div>
                      <small>{{ v.versao }} {{ v.motor }}</small>
                    </div>
                    <span class="score" [style.background]="cor(g)" title="Pontuação SAW">{{ v.score | number: '1.1-1' }}</span>
                  </div>
                  <div class="row g-1 text-center mt-2 small">
                    <div class="col-4"><div class="metrica">{{ v.consumo_urbano | number: '1.1-1' }}<br /><span>urbano km/l</span></div></div>
                    <div class="col-4"><div class="metrica">{{ v.consumo_rodoviario | number: '1.1-1' }}<br /><span>estrada km/l</span></div></div>
                    <div class="col-4"><div class="metrica">{{ v.co2_fossil_g_km === null ? '—' : (v.co2_fossil_g_km | number: '1.0-0') }}<br /><span>CO₂ fóssil g/km</span></div></div>
                    <div class="col-12"><div class="metrica">{{ v.energia_mj_km === null ? '—' : (v.energia_mj_km | number: '1.2-2') }} MJ/km<br /><span>consumo energético</span></div></div>
                  </div>
                </article>
              </div>
            }
          </div>
          @if (lista.length > limite()[g]) {
            <button class="btn btn-outline-secondary btn-sm mt-3" (click)="maisItens(g)">
              Mostrar mais ({{ lista.length - limite()[g] }} restantes)
            </button>
          }
        </section>
      }

      <section class="cartao">
        <h2 class="h5">Comparação entre grupos (médias)</h2>
        @for (g of grupos; track g) {
          <div class="mb-2">
            <div class="d-flex justify-content-between small">
              <span>{{ g }}</span><span>pontuação média {{ s.resumo[g].score_medio | number: '1.1-1' }}</span>
            </div>
            <div class="progress" style="height: 10px"><div class="progress-bar" [style.background]="cor(g)"
              [style.width.%]="s.resumo[g].score_medio"></div></div>
          </div>
        }
      </section>
    } @else {
      <div class="cartao text-center py-5">
        <p>Nenhuma simulação realizada ainda.</p>
        <a class="btn btn-eco" routerLink="/simulacao">Ir para a simulação</a>
      </div>
    }
  `,
  styles: `
    .grupo { background: #fff; border: 1px solid #e8e9f3; border-left: 6px solid; border-radius: 16px; padding: 1.25rem 1.5rem; }
    .resumo-chip { border: 1px solid #dfe1f0; background: #fff; border-radius: 999px; padding: .35rem .9rem; font-weight: 600; font-size: .9rem; }
    .resumo-chip.sel { border-color: var(--verde); background: var(--verde-claro); }
    .ponto { display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
    .mini { background: #f6f7fd; border-radius: 10px; padding: .5rem; }
    .veiculo { border: 1px solid #e8e9f3; border-radius: 12px; padding: .9rem; background: #fcfcff; }
    .score { color: #fff; border-radius: 10px; padding: .25rem .55rem; font-weight: 700; height: fit-content; }
    .metrica { background: #f1f2fb; border-radius: 8px; padding: .35rem .2rem; font-weight: 600; }
    .metrica span { font-weight: 400; font-size: .7rem; color: var(--suave); }
  `,
})
export class Ranking {
  private estado = inject(EstadoService);
  sim = this.estado.simulacao;
  readonly grupos = GRUPOS;
  readonly textos = TEXTOS;
  filtro = signal<Grupo | null>(null);
  busca = signal('');
  limite = signal<Record<Grupo, number>>({ Excelente: PASSO, Bom: PASSO, Ruim: PASSO });
  visiveis = computed(() => (this.filtro() ? [this.filtro()!] : GRUPOS));

  cor(g: Grupo) {
    return { Excelente: '#0a7a4d', Bom: '#1d6fb8', Ruim: '#b3261e' }[g];
  }

  faixa(g: Grupo) {
    const l = this.sim()?.limites;
    if (!l) return '';
    if (g === 'Excelente') return `Pontuação ≥ ${l.Excelente}`;
    if (g === 'Bom') return `${l.Bom} a ${l.Excelente - 0.01}`;
    return `Pontuação < ${l.Bom}`;
  }

  filtrada(g: Grupo): Veiculo[] {
    const t = this.busca().trim().toLowerCase();
    const lista = this.sim()?.grupos[g] ?? [];
    return t ? lista.filter((v) => `${v.marca} ${v.modelo} ${v.versao}`.toLowerCase().includes(t)) : lista;
  }

  maisItens(g: Grupo) {
    this.limite.update((l) => ({ ...l, [g]: l[g] + PASSO }));
  }

  resetar() {
    this.limite.set({ Excelente: PASSO, Bom: PASSO, Ruim: PASSO });
  }

  exportar() {
    const s = this.sim();
    if (!s) return;
    const cab = ['Grupo', 'Marca', 'Modelo', 'Versão', 'Categoria', 'Propulsão', 'Urbano km/l', 'Rodoviário km/l', 'CO2 fóssil g/km', 'Energia MJ/km', 'Pontuação SAW'];
    const linhas = GRUPOS.flatMap((g) =>
      s.grupos[g].map((v) => [g, v.marca, v.modelo, v.versao, v.categoria, v.propulsao, v.consumo_urbano, v.consumo_rodoviario, v.co2_fossil_g_km, v.energia_mj_km, v.score]),
    );
    const csv = [cab, ...linhas].map((l) => l.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ecodrive-grupos.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
