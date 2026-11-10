import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { EstadoService } from '../services/estado.service';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar bg-white border-bottom px-3 px-lg-5 sticky-top">
      <a class="navbar-brand fw-bold d-flex align-items-center gap-2" routerLink="/dashboard">
        <span class="logo">🌿</span> EcoDrive SAD
      </a>
      <div class="d-flex gap-1 flex-wrap">
        <a class="nav-link-eco" routerLink="/dashboard" routerLinkActive="ativo">Início</a>
        <a class="nav-link-eco" routerLink="/simulacao" routerLinkActive="ativo">Simulação</a>
        <a class="nav-link-eco" routerLink="/ranking" routerLinkActive="ativo">Ranking por Grupos</a>
      </div>
      <div class="d-flex align-items-center gap-2 small">
        <span class="text-secondary">{{ estado.usuario() }}</span>
        <button class="btn btn-sm btn-outline-secondary" (click)="sair()">Sair</button>
      </div>
    </nav>
    <main class="container-xl py-4 flex-fill"><router-outlet /></main>
    <footer class="rodape border-top bg-white px-3 px-lg-5 py-3 small text-secondary">
      <div class="container-xl d-flex flex-wrap justify-content-between gap-2">
        <span>Dados do INMETRO (PBEV) atualizados em <strong>agosto de 2026</strong></span>
        <span>EcoDrive SAD • Versão <strong>{{ versao }}</strong></span>
      </div>
    </footer>
  `,
  styles: `
    :host { display: flex; flex-direction: column; min-height: 100vh; }
    .logo { background: var(--verde); border-radius: 8px; padding: 2px 6px; font-size: .9rem; }
    .nav-link-eco { padding: .4rem .9rem; border-radius: 10px; color: var(--suave); text-decoration: none; font-weight: 600; font-size: .9rem; }
    .nav-link-eco.ativo { background: #e6e8fb; color: var(--texto); }
  `,
})
export class Layout {
  readonly versao = '1.0';
  estado = inject(EstadoService);
  private router = inject(Router);

  sair() {
    this.estado.sair();
    this.router.navigateByUrl('/login');
  }
}
