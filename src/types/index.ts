/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Perfil = 'ADMIN' | 'GESTOR' | 'COLABORADOR';

export interface Usuario {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  perfil: Perfil;
  saldo_banco_horas: number; // in minutes (can be negative)
  turnoId: string;
  ativo: boolean;
  avatar?: string;
  departamento: string;
}

export interface Turno {
  id: string;
  nome: string;
  tolerancia_minutos: number;
  carga_horaria_minutos: number; // standard e.g. 480 min (8h)
  entrada_esperada: string; // "09:00"
  saida_esperada: string; // "18:00"
  almoco_inicio?: string; // "12:00"
  almoco_fim?: string; // "13:00"
}

export interface Marcacao {
  id: string;
  usuario_id: string;
  data_hora_registro: string; // ISO string
  tipo_registro: 'ENTRADA' | 'SAIDA';
  origem: 'WEB' | 'MOBILE' | 'PRESENCIAL';
  geolocalizacao_lat?: number;
  geolocalizacao_lng?: number;
  foto_base64?: string;
  comprovante_url?: string;
  observacao?: string;
}

export type StatusJornada = 'COMPLETO' | 'INCOMPLETO' | 'EXTRA' | 'FALTA' | 'AJUSTE_PENDENTE' | 'FOLGA';

export interface JornadaDiaria {
  id: string;
  usuario_id: string;
  data_referencia: string; // YYYY-MM-DD
  minutos_trabalhados: number;
  minutos_extras: number;
  minutos_faltantes: number;
  status: StatusJornada;
  marcacoes_ids: string[];
}

export type StatusSolicitacao = 'PENDENTE' | 'APROVADO' | 'REJEITADO';

export interface SolicitacaoAjuste {
  id: string;
  usuario_id: string;
  jornada_id?: string;
  tipo_solicitacao: 'ESQUECIMENTO_BATIDA' | 'ATESTADO_MEDICO' | 'VIAGEM_TRABALHO' | 'COMPENSACAO';
  descricao: string;
  anexo_url?: string;
  status: StatusSolicitacao;
  aprovado_por_id?: string;
  data_solicitacao: string; // ISO string
  data_alvo: string; // YYYY-MM-DD
  registro_sugestao_hora?: string; // "09:05" (if forgot to punch)
  tipo_registro_sugestao?: 'ENTRADA' | 'SAIDA';
  resposta_gestor?: string;
}
