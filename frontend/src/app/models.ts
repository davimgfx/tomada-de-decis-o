export type Grupo = 'Excelente' | 'Bom' | 'Ruim';
export type Perfil = 'urbano' | 'rodoviario' | 'misto';

export interface Pesos {
  consumo_urbano: number;
  consumo_rodoviario: number;
  consumo_energetico: number;
  emissao_co2: number;
}

export interface Filtros {
  propulsoes: string[];
  categorias: string[];
  marcas: string[];
  motores: string[];
}

export interface Veiculo {
  id: number;
  marca: string;
  modelo: string;
  versao: string;
  categoria: string;
  motor: string;
  propulsao: string;
  combustivel: string;
  transmissao: string;
  consumo_urbano: number;
  consumo_rodoviario: number;
  fonte_consumo: string;
  energia_mj_km: number | null;
  co2_fossil_g_km: number | null;
  autonomia_eletrica_km: number | null;
  pbe_relativa: string;
  pbe_absoluta: string;
  selo_conpet: boolean;
  score?: number;
  grupo?: Grupo;
}

export interface ResumoGrupo {
  quantidade: number;
  percentual: number;
  score_medio: number;
  consumo_urbano_medio: number;
  consumo_rodoviario_medio: number;
  co2_medio: number;
  energia_media: number;
}

export interface Simulacao {
  perfil: Perfil;
  pesos: Pesos;
  total: number;
  limites: { Excelente: number; Bom: number };
  resumo: Record<Grupo, ResumoGrupo>;
  grupos: Record<Grupo, Veiculo[]>;
}

export interface PerfilInfo extends Pesos {
  descricao: string;
}

export interface Opcoes {
  propulsoes: string[];
  categorias: string[];
  marcas: string[];
  motores: string[];
  limites_grupos: { Excelente: number; Bom: number };
}

export interface ResumoGeral {
  total_veiculos: number;
  consumo_urbano_medio: number;
  consumo_rodoviario_medio: number;
  energia_media: number;
  co2_medio: number;
  por_propulsao: Record<string, number>;
  por_categoria: Record<string, number>;
  destaques: Veiculo[];
}
