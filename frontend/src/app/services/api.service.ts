import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Filtros, Opcoes, Pesos, PerfilInfo, Perfil, ResumoGeral, Simulacao } from '../models';

const API = 'http://localhost:8000/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  perfis() {
    return this.http.get<Record<Perfil, PerfilInfo>>(`${API}/perfis`);
  }
  opcoes() {
    return this.http.get<Opcoes>(`${API}/opcoes`);
  }
  resumo() {
    return this.http.get<ResumoGeral>(`${API}/resumo`);
  }
  contagem(f: Filtros) {
    const params = new HttpParams()
      .set('propulsoes', f.propulsoes.join('|'))
      .set('categorias', f.categorias.join('|'))
      .set('marcas', f.marcas.join('|'))
      .set('motores', f.motores.join('|'));
    return this.http.get<{ total: number }>(`${API}/contagem`, { params });
  }
  simular(perfil: Perfil, pesos: Pesos, filtros: Filtros) {
    return this.http.post<Simulacao>(`${API}/simular`, { perfil, pesos, filtros });
  }
}
