import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EstadoService } from '../services/estado.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <div class="d-flex min-vh-100">
      <aside class="lado d-none d-lg-flex flex-column justify-content-between p-5 text-white">
        <div>
          <div class="d-flex align-items-center gap-2 mb-5">
            <span class="logo">🌿</span><strong>EcoDrive SAD</strong>
          </div>
          <h1 class="fw-bold mb-3">Decisões veiculares pautadas por dados.</h1>
          <p class="opacity-75">
            Cruzamos os dados de consumo do PBEV/INMETRO com indicadores de energia e emissões e aplicamos o método
            multicritério SAW para ajudar você a escolher o veículo certo para o seu perfil de uso.
          </p>
          <div class="destaque mt-4"><strong>Consumo urbano e rodoviário</strong><br /><small>Indicadores em km/l oficiais do INMETRO.</small></div>
          <div class="destaque mt-3"><strong>Energia e emissões</strong><br /><small>Consumo energético (MJ/km) e CO₂ fóssil (g/km).</small></div>
        </div>
        <small class="opacity-50">Dados: PBE Veicular 2026 - INMETRO</small>
      </aside>

      <main class="flex-fill d-flex align-items-center justify-content-center bg-white p-4">
        <form class="w-100" style="max-width: 440px" (ngSubmit)="entrar()">
          <h2 class="fw-bold">Acesse o Sistema de Apoio</h2>
          <p class="text-secondary">Configure pesos, simule perfis de uso e compare grupos de veículos.</p>
          <hr />
          <label class="form-label fw-semibold small" for="email">E-mail</label>
          <input id="email" name="email" type="email" class="form-control form-control-lg mb-3"
                 placeholder="voce@email.com" [(ngModel)]="email" required />
          <label class="form-label fw-semibold small" for="senha">Senha</label>
          <div class="input-group input-group-lg mb-3">
            <input id="senha" name="senha" [type]="ver() ? 'text' : 'password'" class="form-control"
                   [(ngModel)]="senha" required />
            <button type="button" class="btn btn-outline-secondary" (click)="ver.set(!ver())"
                    [attr.aria-label]="ver() ? 'Ocultar senha' : 'Mostrar senha'">
              {{ ver() ? '🙈' : '👁' }}
            </button>
          </div>
          <button class="btn btn-eco w-100" type="submit" [disabled]="!email || !senha">Entrar no Sistema →</button>
          <div class="text-center text-secondary small my-3">OU SIMULE DIRETAMENTE</div>
          <button type="button" class="btn w-100 visitante" (click)="visitante()">
            Acessar como Visitante (sem login)
          </button>
        </form>
      </main>
    </div>
  `,
  styles: `
    .lado { width: 44%; background: linear-gradient(160deg, #037a57, #004d33); }
    .logo { background: rgba(255,255,255,.15); border-radius: 10px; padding: 4px 8px; }
    .destaque { background: rgba(255,255,255,.1); border-radius: 12px; padding: 14px 16px; }
    .visitante { background: var(--verde-claro); color: var(--verde); border: 1px solid #b6ebd0; font-weight: 600; padding: .75rem; border-radius: 12px; }
  `,
})
export class Login {
  private estado = inject(EstadoService);
  private router = inject(Router);
  email = '';
  senha = '';
  ver = signal(false);

  entrar() {
    // Autenticação simulada: o escopo do SAD não exige cadastro de usuários.
    this.estado.entrar(this.email);
    this.router.navigateByUrl('/dashboard');
  }

  visitante() {
    this.estado.entrar('Visitante');
    this.router.navigateByUrl('/dashboard');
  }
}
