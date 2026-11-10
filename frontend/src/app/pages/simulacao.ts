import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Opcoes, Perfil, PerfilInfo, Pesos } from '../models';
import { ApiService } from '../services/api.service';
import { EstadoService } from '../services/estado.service';

type Chave = keyof Pesos;

@Component({
  selector: 'app-simulacao',
  template: `
    <h1 class="fw-bold">Simulador de Decisão Multicritério</h1>
    <p class="text-secondary">Escolha seu perfil de utilização, revise os pesos sugeridos e ajuste conforme sua preferência.</p>

    @if (erro()) {
      <div class="alert alert-danger">{{ erro() }}</div>
    }

    <div class="row g-3">
      <div class="col-lg-8">
        <section class="cartao mb-3">
          <h2 class="h5">1. Perfil de utilização</h2>
          <div class="row g-2">
            @for (p of perfis; track p.id) {
              <div class="col-md-4">
                <button type="button" class="perfil w-100 text-start" [class.sel]="perfil() === p.id"
                        (click)="escolherPerfil(p.id)" [attr.aria-pressed]="perfil() === p.id">
                  <strong>{{ p.nome }}</strong><br /><small>{{ infos()[p.id]?.descricao }}</small>
                </button>
              </div>
            }
          </div>
        </section>

        <section class="cartao mb-3">
          <div class="d-flex justify-content-between align-items-center">
            <h2 class="h5 mb-0">2. Pesos dos critérios</h2>
            <span class="badge fs-6" [class.text-bg-success]="soma() === 100" [class.text-bg-danger]="soma() !== 100">
              Soma: {{ soma() }}%
            </span>
          </div>
          <small class="text-secondary">Ao mover um peso, os demais são reajustados para manter 100%.</small>
          @for (c of criterios; track c.chave) {
            <div class="mt-3">
              <div class="d-flex justify-content-between">
                <label [for]="c.chave" class="fw-semibold">{{ c.nome }}
                  <small class="text-secondary fw-normal d-block">{{ c.desc }}</small></label>
                <span class="fs-4 fw-bold text-success">{{ pesos()[c.chave] }}%</span>
              </div>
              <input type="range" class="form-range" [id]="c.chave" min="0" max="100" step="1"
                     [value]="pesos()[c.chave]" (input)="mudarPeso(c.chave, $any($event.target).valueAsNumber)" />
            </div>
          }
          <button type="button" class="btn btn-sm btn-outline-secondary mt-2" (click)="escolherPerfil(perfil())">
            Restaurar pesos sugeridos
          </button>
        </section>

        <section class="cartao">
          <div class="d-flex justify-content-between">
            <h2 class="h5">3. Filtros</h2>
            <div class="d-flex gap-3">
              <button type="button" class="acao" (click)="limparFiltros()"><span aria-hidden="true">✓</span> Selecionar tudo</button>
              <button type="button" class="acao limpar" (click)="desmarcarFiltros()"><span aria-hidden="true">✕</span> Desmarcar tudo</button>
            </div>
          </div>
          <div class="d-flex justify-content-between align-items-end mt-2 mb-1">
            <div class="rotulo-sup">Tipo de propulsão ({{ propSel().size }} de {{ opcoes()?.propulsoes?.length ?? 0 }})</div>
            <div class="d-flex gap-2">
              <button type="button" class="acao" (click)="definir(propSel, opcoes()?.propulsoes ?? [], true)"><span aria-hidden="true">✓</span> Selecionar todos</button>
              <button type="button" class="acao limpar" (click)="definir(propSel, opcoes()?.propulsoes ?? [], false)"><span aria-hidden="true">✕</span> Desmarcar todos</button>
            </div>
          </div>
          <div class="d-flex flex-wrap gap-2">
            @for (p of opcoes()?.propulsoes ?? []; track p) {
              <label class="chip" [class.on]="propSel().has(p)">
                <input type="checkbox" class="form-check-input me-1" [checked]="propSel().has(p)" (change)="alternar(propSel, p)" />{{ p }}
              </label>
            }
          </div>
          <div class="d-flex justify-content-between align-items-end mt-3 mb-1">
            <div class="rotulo-sup">Categoria ({{ catSel().size }} de {{ opcoes()?.categorias?.length ?? 0 }})</div>
            <div class="d-flex gap-2">
              <button type="button" class="acao" (click)="definir(catSel, opcoes()?.categorias ?? [], true)"><span aria-hidden="true">✓</span> Selecionar todas</button>
              <button type="button" class="acao limpar" (click)="definir(catSel, opcoes()?.categorias ?? [], false)"><span aria-hidden="true">✕</span> Desmarcar todas</button>
            </div>
          </div>
          <div class="d-flex flex-wrap gap-2">
            @for (c of opcoes()?.categorias ?? []; track c) {
              <label class="chip" [class.on]="catSel().has(c)">
                <input type="checkbox" class="form-check-input me-1" [checked]="catSel().has(c)" (change)="alternar(catSel, c)" />{{ c }}
              </label>
            }
          </div>
          <div class="d-flex justify-content-between align-items-end mt-3 mb-1">
            <div class="rotulo-sup">Marca ({{ marSel().size }} de {{ opcoes()?.marcas?.length ?? 0 }})</div>
            <div class="d-flex gap-2">
              <input class="form-control form-control-sm" type="search" placeholder="Buscar marca" aria-label="Buscar marca"
                     [value]="buscaMarca()" (input)="buscaMarca.set($any($event.target).value)" />
              <button type="button" class="acao" (click)="definir(marSel, opcoes()?.marcas ?? [], true)"><span aria-hidden="true">✓</span> Selecionar todas</button>
              <button type="button" class="acao limpar" (click)="definir(marSel, opcoes()?.marcas ?? [], false)"><span aria-hidden="true">✕</span> Desmarcar todas</button>
            </div>
          </div>
          <div class="lista-chips d-flex flex-wrap gap-2">
            @for (m of marcasVisiveis(); track m) {
              <label class="chip" [class.on]="marSel().has(m)">
                <input type="checkbox" class="form-check-input me-1" [checked]="marSel().has(m)" (change)="alternar(marSel, m)" />{{ m }}
              </label>
            }
          </div>

          <div class="d-flex justify-content-between align-items-end mt-3 mb-1">
            <div class="rotulo-sup">Motor ({{ motSel().size }} de {{ opcoes()?.motores?.length ?? 0 }})</div>
            <div class="d-flex gap-2">
              <input class="form-control form-control-sm" type="search" placeholder="Buscar motor" aria-label="Buscar motor"
                     [value]="buscaMotor()" (input)="buscaMotor.set($any($event.target).value)" />
              <button type="button" class="acao" (click)="definir(motSel, opcoes()?.motores ?? [], true)"><span aria-hidden="true">✓</span> Selecionar todos</button>
              <button type="button" class="acao limpar" (click)="definir(motSel, opcoes()?.motores ?? [], false)"><span aria-hidden="true">✕</span> Desmarcar todos</button>
            </div>
          </div>
          <div class="lista-chips d-flex flex-wrap gap-2">
            @for (m of motoresVisiveis(); track m) {
              <label class="chip" [class.on]="motSel().has(m)">
                <input type="checkbox" class="form-check-input me-1" [checked]="motSel().has(m)" (change)="alternar(motSel, m)" />{{ m }}
              </label>
            }
          </div>
        </section>
      </div>

      <div class="col-lg-4">
        <div class="cartao text-white mb-3" style="background: var(--verde)">
          <div class="rotulo-sup text-white-50">Universo da simulação</div>
          <div class="display-5 fw-bold">{{ elegiveis() ?? '…' }}</div>
          <div>veículos elegíveis</div>
        </div>
        <button class="btn btn-eco w-100 py-3" [disabled]="soma() !== 100 || calculando() || elegiveis() === 0"
                (click)="calcular()">
          {{ calculando() ? 'Calculando…' : 'Calcular e ver grupos' }}
        </button>
        @if (soma() !== 100) {
          <small class="text-danger">A soma dos pesos deve ser 100%.</small>
        }
      </div>
    </div>
  `,
  styles: `
    .perfil { border: 2px solid #e0e2f0; background: #fff; border-radius: 12px; padding: .8rem; }
    .perfil.sel { border-color: var(--verde); background: var(--verde-claro); }
    .chip { background: #f1f2fb; border-radius: 10px; padding: .35rem .7rem; font-size: .85rem; cursor: pointer; }
    .acao { display: inline-flex; align-items: center; gap: .3rem; white-space: nowrap; border: 1px solid #b6ebd0; background: var(--verde-claro); color: var(--verde); font-size: .75rem; font-weight: 600; padding: .25rem .7rem; border-radius: 999px; transition: background .15s, color .15s, transform .1s; }
    .acao:hover { background: var(--verde); color: #fff; }
    .acao:active { transform: scale(.96); }
    .acao:focus-visible { outline: 2px solid var(--verde); outline-offset: 2px; }
    .acao.limpar { border-color: #f3c6c2; background: #fdeceb; color: var(--ruim); }
    .acao.limpar:hover { background: var(--ruim); color: #fff; }
    .lista-chips { max-height: 150px; overflow-y: auto; }
    .chip.on { background: var(--verde-claro); color: var(--verde); font-weight: 600; }
  `,
})
export class SimulacaoPage implements OnInit {
  private api = inject(ApiService);
  private estado = inject(EstadoService);
  private router = inject(Router);

  readonly perfis: { id: Perfil; nome: string }[] = [
    { id: 'urbano', nome: 'Urbano' },
    { id: 'rodoviario', nome: 'Rodoviário' },
    { id: 'misto', nome: 'Misto' },
  ];
  readonly criterios: { chave: Chave; nome: string; desc: string }[] = [
    { chave: 'consumo_urbano', nome: 'Consumo urbano (km/l)', desc: 'Benefício: maior é melhor.' },
    { chave: 'consumo_rodoviario', nome: 'Consumo rodoviário (km/l)', desc: 'Benefício: maior é melhor.' },
    { chave: 'consumo_energetico', nome: 'Consumo energético (MJ/km)', desc: 'Custo: menor é melhor.' },
    { chave: 'emissao_co2', nome: 'Emissão de gases - CO₂ fóssil (g/km)', desc: 'Custo: menor é melhor.' },
  ];

  infos = signal<Partial<Record<Perfil, PerfilInfo>>>({});
  opcoes = signal<Opcoes | null>(null);
  perfil = signal<Perfil>('misto');
  pesos = signal<Pesos>({ consumo_urbano: 25, consumo_rodoviario: 25, consumo_energetico: 25, emissao_co2: 25 });
  propSel = signal(new Set<string>());
  catSel = signal(new Set<string>());
  marSel = signal(new Set<string>());
  motSel = signal(new Set<string>());
  buscaMarca = signal('');
  buscaMotor = signal('');
  marcasVisiveis = computed(() => this.filtrarTexto(this.opcoes()?.marcas ?? [], this.buscaMarca()));
  motoresVisiveis = computed(() => this.filtrarTexto(this.opcoes()?.motores ?? [], this.buscaMotor()));
  elegiveis = signal<number | null>(null);
  calculando = signal(false);
  erro = signal('');
  soma = computed(() => Object.values(this.pesos()).reduce((a, b) => a + b, 0));

  ngOnInit() {
    this.api.perfis().subscribe({
      next: (p) => {
        this.infos.set(p);
        this.escolherPerfil('misto');
      },
      error: () => this.erro.set('Não foi possível conectar ao back-end (http://localhost:8000).'),
    });
    this.api.opcoes().subscribe((o) => {
      this.opcoes.set(o);
      this.limparFiltros();
    });
  }

  escolherPerfil(p: Perfil) {
    this.perfil.set(p);
    const i = this.infos()[p];
    if (i) {
      this.pesos.set({
        consumo_urbano: i.consumo_urbano,
        consumo_rodoviario: i.consumo_rodoviario,
        consumo_energetico: i.consumo_energetico,
        emissao_co2: i.emissao_co2,
      });
    }
  }

  /** Altera um peso e redistribui o restante proporcionalmente, mantendo soma = 100. */
  mudarPeso(chave: Chave, valor: number) {
    const atual = this.pesos();
    const outras = (Object.keys(atual) as Chave[]).filter((k) => k !== chave);
    const restante = 100 - valor;
    const somaOutras = outras.reduce((s, k) => s + atual[k], 0);
    const novo = { ...atual, [chave]: valor } as Pesos;
    // Maior resto: parte inteira proporcional + distribuição das unidades que sobram (nunca negativo).
    const ideais = outras.map((k) => (somaOutras ? (atual[k] / somaOutras) * restante : restante / outras.length));
    const base = ideais.map(Math.floor);
    let sobra = restante - base.reduce((s, x) => s + x, 0);
    ideais
      .map((x, i) => ({ i, resto: x - Math.floor(x) }))
      .sort((a, b) => b.resto - a.resto)
      .forEach(({ i }) => {
        if (sobra > 0) {
          base[i]++;
          sobra--;
        }
      });
    outras.forEach((k, i) => (novo[k] = base[i]));
    this.pesos.set(novo);
  }

  alternar(sig: { (): Set<string>; set(v: Set<string>): void }, valor: string) {
    const s = new Set(sig());
    s.has(valor) ? s.delete(valor) : s.add(valor);
    sig.set(s);
    this.atualizarContagem();
  }

  limparFiltros() {
    const o = this.opcoes();
    if (!o) return;
    this.propSel.set(new Set(o.propulsoes));
    this.catSel.set(new Set(o.categorias));
    this.marSel.set(new Set(o.marcas));
    this.motSel.set(new Set(o.motores));
    this.atualizarContagem();
  }

  desmarcarFiltros() {
    this.propSel.set(new Set());
    this.catSel.set(new Set());
    this.marSel.set(new Set());
    this.motSel.set(new Set());
    this.atualizarContagem();
  }

  /** Marca todas as opções de um filtro (marcar = true) ou desmarca todas (marcar = false). */
  definir(sig: { set(v: Set<string>): void }, valores: string[], marcar: boolean) {
    sig.set(new Set(marcar ? valores : []));
    this.atualizarContagem();
  }

  private filtrarTexto(lista: string[], busca: string) {
    const t = busca.trim().toLowerCase();
    return t ? lista.filter((x) => x.toLowerCase().includes(t)) : lista;
  }

  /** Todos marcados = sem filtro. Nenhum marcado = nada elegível (valor inexistente). */
  private sel(s: Set<string>, total: number): string[] {
    return s.size === total ? [] : s.size ? [...s] : ['_nenhum_'];
  }

  private filtros() {
    const o = this.opcoes();
    return {
      propulsoes: this.sel(this.propSel(), o?.propulsoes.length ?? 0),
      categorias: this.sel(this.catSel(), o?.categorias.length ?? 0),
      marcas: this.sel(this.marSel(), o?.marcas.length ?? 0),
      motores: this.sel(this.motSel(), o?.motores.length ?? 0),
    };
  }

  private atualizarContagem() {
    this.api.contagem(this.filtros()).subscribe((r) => this.elegiveis.set(r.total));
  }

  calcular() {
    this.calculando.set(true);
    this.erro.set('');
    this.api.simular(this.perfil(), this.pesos(), this.filtros()).subscribe({
      next: (s) => {
        this.estado.salvarSimulacao(s);
        this.router.navigateByUrl('/ranking');
      },
      error: (e) => {
        this.calculando.set(false);
        const detalhe = e.error?.detail;
        this.erro.set(
          e.status === 0
            ? 'Não foi possível conectar ao back-end (http://localhost:8000).'
            : typeof detalhe === 'string' ? detalhe : 'Erro ao calcular a simulação. Revise os pesos e filtros.',
        );
      },
    });
  }
}
