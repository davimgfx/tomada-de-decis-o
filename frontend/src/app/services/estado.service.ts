import { Injectable, signal } from '@angular/core';
import { Simulacao } from '../models';

/** Guarda a última simulação e a sessão (login ou visitante). */
@Injectable({ providedIn: 'root' })
export class EstadoService {
  readonly simulacao = signal<Simulacao | null>(this.ler('ecodrive.simulacao'));
  readonly usuario = signal<string | null>(localStorage.getItem('ecodrive.usuario'));

  salvarSimulacao(s: Simulacao) {
    this.simulacao.set(s);
    sessionStorage.setItem('ecodrive.simulacao', JSON.stringify(s));
  }

  entrar(nome: string) {
    this.usuario.set(nome);
    localStorage.setItem('ecodrive.usuario', nome);
  }

  sair() {
    this.usuario.set(null);
    localStorage.removeItem('ecodrive.usuario');
  }

  private ler(chave: string): Simulacao | null {
    try {
      return JSON.parse(sessionStorage.getItem(chave) ?? 'null');
    } catch {
      return null;
    }
  }
}
