import { DecimalPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApexChart, ApexDataLabels, ApexLegend, ApexResponsive, ApexTooltip, ChartComponent } from 'ng-apexcharts';
import { ResumoGeral } from '../models';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DecimalPipe, ChartComponent],
  template: `
    <section class="hero mb-4">
      <div class="rotulo-sup mb-2">Sistema de apoio à decisão</div>
      <h1 class="fw-bold">Escolha seu veículo equilibrando <span class="text-success">consumo, energia e emissões</span>.</h1>
      <p class="text-secondary col-lg-8">
        O EcoDrive SAD integra o consumo urbano e rodoviário do PBEV/INMETRO ao consumo energético e às emissões de CO₂ e aplica o método
        SAW (Soma Ponderada) para classificar os veículos em três grupos: Excelente, Bom e Ruim.
      </p>
      <a class="btn btn-eco" routerLink="/simulacao">Iniciar simulação</a>
    </section>

    @if (erro()) {
      <div class="alert alert-danger">
        Não foi possível carregar os dados. Verifique se o back-end está rodando em http://localhost:8000.
      </div>
    }

    @if (r(); as r) {
      <section class="row g-3 mb-4">
        <div class="col-6 col-lg-3"><div class="cartao h-100">
          <div class="rotulo-sup">Veículos na base</div><div class="fs-2 fw-bold">{{ r.total_veiculos }}</div>
          <small class="text-secondary">versões do PBEV 2026</small></div></div>
        <div class="col-6 col-lg-3"><div class="cartao h-100">
          <div class="rotulo-sup">Consumo urbano médio</div>
          <div class="fs-2 fw-bold">{{ r.consumo_urbano_medio | number: '1.1-1' }} <small class="fs-6">km/l</small></div></div></div>
        <div class="col-6 col-lg-3"><div class="cartao h-100">
          <div class="rotulo-sup">Consumo rodoviário médio</div>
          <div class="fs-2 fw-bold">{{ r.consumo_rodoviario_medio | number: '1.1-1' }} <small class="fs-6">km/l</small></div></div></div>
        <div class="col-6 col-lg-3"><div class="cartao h-100">
          <div class="rotulo-sup">CO₂ fóssil médio</div>
          <div class="fs-2 fw-bold">{{ r.co2_medio | number: '1.0-0' }} <small class="fs-6">g/km</small></div></div></div>
      </section>

      <section class="row g-3 mb-4">
        <div class="col-lg-7"><div class="cartao h-100">
          <h2 class="h5">Veículos por categoria</h2>
          <apx-chart [series]="serie()" [chart]="chart" [labels]="rotulos()" [colors]="cores" [legend]="legenda"
                     [responsive]="responsivo" [dataLabels]="rotulosDados" [tooltip]="dica" />
        </div></div>
        <div class="col-lg-5"><div class="cartao h-100">
          <h2 class="h5">Sumarização por propulsão</h2>
          @for (p of propulsoes(r); track p[0]) {
            <div class="mb-2">
              <div class="d-flex justify-content-between small"><span>{{ p[0] }}</span><span>{{ p[1] }}</span></div>
              <div class="progress" style="height: 8px"><div class="progress-bar bg-success"
                [style.width.%]="(100 * p[1]) / r.total_veiculos"></div></div>
            </div>
          }
        </div></div>
        <div class="col-12"><div class="cartao h-100">
          <h2 class="h5">Como o SAW calcula a pontuação</h2>
          <ol class="small text-secondary ps-3 mb-0">
            <li>Consumo urbano e rodoviário (km/l) são critérios de <strong>benefício</strong>: valor / maior valor.</li>
            <li>Consumo energético (MJ/km) e emissão de CO₂ (g/km) são critérios de <strong>custo</strong>: menor valor / valor.</li>
            <li>Os pesos do perfil (urbano, rodoviário ou misto) ponderam os critérios; a soma deve ser 100%.</li>
            <li>A pontuação (0 a 100) define o grupo: Excelente, Bom ou Ruim, sem ranking individual.</li>
          </ol>
        </div></div>
      </section>

      <section class="cartao">
        <h2 class="h5">Exemplos de veículos bem avaliados (perfil misto)</h2>
        <div class="row g-3">
          @for (v of r.destaques; track v.id) {
            <div class="col-md-4"><div class="border rounded-3 p-3 h-100">
              <small class="text-secondary">{{ v.marca }} • {{ v.categoria }} • {{ v.propulsao }}</small>
              <div class="fw-bold">{{ v.modelo }} {{ v.versao }}</div>
              <div class="small mt-2">Urbano {{ v.consumo_urbano | number: '1.1-1' }} km/l • Estrada
                {{ v.consumo_rodoviario | number: '1.1-1' }} km/l</div>
              <div class="small">{{ v.energia_mj_km | number: '1.2-2' }} MJ/km • {{ v.co2_fossil_g_km | number: '1.0-0' }} g/km CO₂</div>
              <span class="badge text-bg-success mt-2">{{ v.grupo }}</span>
            </div></div>
          }
        </div>
      </section>
    } @else if (!erro()) {
      <div class="text-center py-5 text-secondary">Carregando…</div>
    }
  `,
  styles: `
    .hero { background: linear-gradient(135deg, #eaf7f1, #eef0ff); border-radius: 20px; padding: 2.5rem; }
  `,
})
export class Dashboard implements OnInit {
  private api = inject(ApiService);
  r = signal<ResumoGeral | null>(null);
  erro = signal(false);

  ngOnInit() {
    this.api.resumo().subscribe({ next: (d) => this.r.set(d), error: () => this.erro.set(true) });
  }

  readonly cores = ['#0a7a4d', '#1d6fb8', '#e08a00', '#8e44ad', '#b3261e', '#17a2b8', '#6c757d'];
  readonly chart: ApexChart = { type: 'pie', height: 340, fontFamily: 'inherit' };
  readonly legenda: ApexLegend = { position: 'right', fontSize: '14px' };
  readonly rotulosDados: ApexDataLabels = { enabled: true, formatter: (v: number) => `${v.toFixed(1)}%` };
  readonly dica: ApexTooltip = { y: { formatter: (v: number) => `${v} veículos` } };
  readonly responsivo: ApexResponsive[] = [{ breakpoint: 576, options: { legend: { position: 'bottom' } } }];

  /** Categorias ordenadas da maior para a menor quantidade. */
  private categorias = computed(() =>
    Object.entries(this.r()?.por_categoria ?? {}).sort((a, b) => b[1] - a[1]),
  );
  rotulos = computed(() => this.categorias().map(([nome]) => nome));
  serie = computed(() => this.categorias().map(([, qtd]) => qtd));
  propulsoes(r: ResumoGeral) {
    return Object.entries(r.por_propulsao).sort((a, b) => b[1] - a[1]);
  }
}
