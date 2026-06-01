/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Usuario, Turno, Marcacao, JornadaDiaria, SolicitacaoAjuste } from '../types';

// Helper to format dates relative to today
const getRelativeDateStr = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().split('T')[0];
};

const getRelativeDateTimeStr = (offsetDays: number, timeStr: string): string => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const [hours, minutes] = timeStr.split(':').map(Number);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

export const INITIAL_SHIFTS: Turno[] = [
  {
    id: 't1',
    nome: 'Comercial Matutino',
    tolerancia_minutos: 10,
    carga_horaria_minutos: 480, // 8h
    entrada_esperada: '08:00',
    saida_esperada: '17:00', // including 1h lunch
    almoco_inicio: '12:00',
    almoco_fim: '13:00'
  },
  {
    id: 't2',
    nome: 'Turno Flexível 6h',
    tolerancia_minutos: 15,
    carga_horaria_minutos: 360, // 6h
    entrada_esperada: '09:00',
    saida_esperada: '15:00',
    almoco_inicio: '12:00',
    almoco_fim: '12:15'
  },
  {
    id: 't3',
    nome: 'Suporte Corporativo',
    tolerancia_minutos: 10,
    carga_horaria_minutos: 480, // 8h
    entrada_esperada: '10:00',
    saida_esperada: '19:00',
    almoco_inicio: '14:00',
    almoco_fim: '15:00'
  }
];

export const INITIAL_USERS: Usuario[] = [
  {
    id: 'user-admin',
    nome: 'Guilherme Henrique Tassinari',
    cpf: '000.000.000-00',
    email: 'tassinariadmin@primetime.com',
    perfil: 'ADMIN',
    saldo_banco_horas: 180, // +3h  
    turnoId: 't1',
    ativo: true,
    departamento: 'Diretoria de Tecnologia',
    avatar: 'https://avatars.githubusercontent.com/u/102005103?v=4'
  },
  {
    id: 'user-manager',
    nome: 'Walter Dias Marques Pereira',
    cpf: '111.111.111-11',
    email: 'gestor@primetime.com',
    perfil: 'GESTOR',
    saldo_banco_horas: 90, // +1.5h
    turnoId: 't1',
    ativo: true,
    departamento: 'Analista de Sistemas',
    avatar: 'https://avatars.githubusercontent.com/u/142507624?v=4'
  },
  {
    id: 'user-colab1',
    nome: 'Dyogo Henrique',
    cpf: '222.222.222-22',
    email: 'dyogo@primetime.com',
    perfil: 'COLABORADOR',
    saldo_banco_horas: 120, // +2h
    turnoId: 't1',
    ativo: true,
    departamento: 'Engenharia de Software',
    avatar: 'https://avatars.githubusercontent.com/u/140459642?v=4'
  },
  {
    id: 'user-colab2',
    nome: 'Línicker Mota',
    cpf: '333.333.333-33',
    email: 'olinicker@primetime.com',
    perfil: 'COLABORADOR',
    saldo_banco_horas: -45, // -45min
    turnoId: 't2',
    ativo: true,
    departamento: 'Design UX/UI',
    avatar: 'https://avatars.githubusercontent.com/u/142761503?v=4'
  },
  {
    id: 'user-colab3',
    nome: 'Emerson Assis de Carvalho',
    cpf: '444.444.444-44',
    email: 'emerson@primetime.com',
    perfil: 'COLABORADOR',
    saldo_banco_horas: 0,
    turnoId: 't3',
    ativo: true,
    departamento: 'Suporte de Sistemas',
    avatar: 'https://avatars.githubusercontent.com/u/18271218?v=4'
  }
];

// Past markings for the active users to fill charts
export const getInitialMarkings = (): Marcacao[] => {
  const markings: Marcacao[] = [];
  const users = ['user-colab1', 'user-colab2', 'user-colab3', 'user-manager', 'user-admin'];

  // Past 5 days
  for (let offset = 5; offset >= 1; offset--) {
    const isWeekend = new Date(Date.now() - offset * 24 * 60 * 60 * 1000).getDay() % 6 === 0;
    if (isWeekend) continue; // Skip weekend markings

    users.forEach(userId => {
      const isColab2 = userId === 'user-colab2';
      const isColab3 = userId === 'user-colab3';

      // Morning entry: around 08:00 or 09:00 depending on shift
      const entHour = isColab2 ? '09:03' : isColab3 ? '10:05' : '07:58';
      const exitHour = isColab2 ? '15:10' : isColab3 ? '19:02' : '17:05';

      markings.push({
        id: `m-${userId}-${offset}-in`,
        usuario_id: userId,
        data_hora_registro: getRelativeDateTimeStr(offset, entHour),
        tipo_registro: 'ENTRADA',
        origem: 'WEB',
        geolocalizacao_lat: -23.55052,
        geolocalizacao_lng: -46.633308,
        observacao: offset === 3 && isColab2 ? 'Consulta odontológica de manhã' : undefined
      });

      markings.push({
        id: `m-${userId}-${offset}-out`,
        usuario_id: userId,
        data_hora_registro: getRelativeDateTimeStr(offset, exitHour),
        tipo_registro: 'SAIDA',
        origem: 'WEB',
        geolocalizacao_lat: -23.55052,
        geolocalizacao_lng: -46.633308
      });
    });
  }

  // Preload structured today punches (Início, Saída Almoço, Retorno Almoço) for all users
  const todayUsers = [
    { id: 'user-admin', in: '07:58', lunchOut: '11:59', lunchIn: '13:00' },
    { id: 'user-manager', in: '08:05', lunchOut: '12:00', lunchIn: '13:02' },
    { id: 'user-colab1', in: '07:55', lunchOut: '12:02', lunchIn: '13:01' },
    { id: 'user-colab2', in: '08:58', lunchOut: '12:01', lunchIn: '12:16' },
    { id: 'user-colab3', in: '09:55', lunchOut: '14:02', lunchIn: '15:01' },
  ];

  todayUsers.forEach(tu => {
    // 1. Início de Expediente (ENTRADA)
    markings.push({
      id: `m-${tu.id}-today-in`,
      usuario_id: tu.id,
      data_hora_registro: getRelativeDateTimeStr(0, tu.in),
      tipo_registro: 'ENTRADA',
      origem: 'WEB',
      geolocalizacao_lat: -23.55052,
      geolocalizacao_lng: -46.633308
    });

    // 2. Saída para Almoço (SAIDA)
    markings.push({
      id: `m-${tu.id}-today-lunch-out`,
      usuario_id: tu.id,
      data_hora_registro: getRelativeDateTimeStr(0, tu.lunchOut),
      tipo_registro: 'SAIDA',
      origem: 'WEB',
      geolocalizacao_lat: -23.55052,
      geolocalizacao_lng: -46.633308
    });

    // 3. Retorno de Almoço (ENTRADA)
    markings.push({
      id: `m-${tu.id}-today-lunch-in`,
      usuario_id: tu.id,
      data_hora_registro: getRelativeDateTimeStr(0, tu.lunchIn),
      tipo_registro: 'ENTRADA',
      origem: 'WEB',
      geolocalizacao_lat: -23.55052,
      geolocalizacao_lng: -46.633308
    });
  });

  return markings;
};

export const getInitialDailyJourneys = (): JornadaDiaria[] => {
  const journeys: JornadaDiaria[] = [];
  const users = ['user-colab1', 'user-colab2', 'user-colab3', 'user-manager', 'user-admin'];

  // Calculate back-history daily journeys
  for (let offset = 5; offset >= 1; offset--) {
    const isWeekend = new Date(Date.now() - offset * 24 * 60 * 60 * 1000).getDay() % 6 === 0;
    if (isWeekend) continue;

    users.forEach(userId => {
      const isColab2 = userId === 'user-colab2';
      const isColab3 = userId === 'user-colab3';

      let workedMin = 480;
      let extras = 5;
      let short = 0;
      let stat = 'COMPLETO';

      if (isColab2) {
        workedMin = 367;
        extras = 7;
        short = 0;
        stat = 'EXTRA';
      } else if (isColab3) {
        workedMin = 477;
        extras = 0;
        short = 3;
        stat = 'COMPLETO';
      } else if (userId === 'user-colab1') {
        workedMin = 487;
        extras = 7;
        short = 0;
        stat = 'EXTRA';
      }

      journeys.push({
        id: `j-${userId}-${offset}`,
        usuario_id: userId,
        data_referencia: getRelativeDateStr(offset),
        minutos_trabalhados: workedMin,
        minutos_extras: extras,
        minutos_faltantes: short,
        status: stat as any,
        marcacoes_ids: [`m-${userId}-${offset}-in`, `m-${userId}-${offset}-out`]
      });
    });
  }

  return journeys;
};

export const INITIAL_ADJUSTMENTS = (): SolicitacaoAjuste[] => [
  {
    id: 'adj-1',
    usuario_id: 'user-colab2',
    tipo_solicitacao: 'ESQUECIMENTO_BATIDA',
    descricao: 'Esqueci de registrar a saída do dia, fiquei em reunião com cliente até as 18:30.',
    status: 'PENDENTE',
    data_solicitacao: getRelativeDateTimeStr(1, '09:30'),
    data_alvo: getRelativeDateStr(1),
    registro_sugestao_hora: '18:30',
    tipo_registro_sugestao: 'SAIDA'
  },
  {
    id: 'adj-2',
    usuario_id: 'user-colab1',
    tipo_solicitacao: 'ATESTADO_MEDICO',
    descricao: 'Atestado de consulta medica periódica.',
    anexo_url: 'https://vancare.com.br/wp-content/uploads/2021/04/atestado-medico-modelo.jpg',
    status: 'PENDENTE',
    data_solicitacao: getRelativeDateTimeStr(2, '14:20'),
    data_alvo: getRelativeDateStr(2)
  },
  {
    id: 'adj-3',
    usuario_id: 'user-colab3',
    tipo_solicitacao: 'VIAGEM_TRABALHO',
    descricao: 'Visita técnica à filial de Curitiba para implantação de servidores corporativos.',
    status: 'APROVADO',
    aprovado_por_id: 'user-admin',
    data_solicitacao: getRelativeDateTimeStr(4, '10:00'),
    data_alvo: getRelativeDateStr(4),
    resposta_gestor: 'Aprovado conforme diário de bordo e despesas de viagem aprovadas.'
  }
];

// Storage Keys
const KEYS = {
  USERS: 'pt_users',
  SHIFTS: 'pt_shifts',
  MARKINGS: 'pt_markings',
  JOURNEYS: 'pt_journeys',
  ADJUSTMENTS: 'pt_adjustments',
  SESSION: 'pt_session'
};

export class LocalDatabase {
  static init() {
    const DB_VERSION_KEY = 'pt_db_version_key';
    const CURRENT_VERSION = 'v1.4.3';
    const savedVersion = localStorage.getItem(DB_VERSION_KEY);

    if (savedVersion !== CURRENT_VERSION) {
      // Force database reload on update
      localStorage.removeItem(KEYS.USERS);
      localStorage.removeItem(KEYS.SHIFTS);
      localStorage.removeItem(KEYS.MARKINGS);
      localStorage.removeItem(KEYS.JOURNEYS);
      localStorage.removeItem(KEYS.ADJUSTMENTS);
      localStorage.removeItem(KEYS.SESSION);
      localStorage.setItem(DB_VERSION_KEY, CURRENT_VERSION);
    }

    if (!localStorage.getItem(KEYS.USERS)) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(KEYS.SHIFTS)) {
      localStorage.setItem(KEYS.SHIFTS, JSON.stringify(INITIAL_SHIFTS));
    }
    if (!localStorage.getItem(KEYS.MARKINGS)) {
      localStorage.setItem(KEYS.MARKINGS, JSON.stringify(getInitialMarkings()));
    }
    if (!localStorage.getItem(KEYS.JOURNEYS)) {
      localStorage.setItem(KEYS.JOURNEYS, JSON.stringify(getInitialDailyJourneys()));
    }
    if (!localStorage.getItem(KEYS.ADJUSTMENTS)) {
      localStorage.setItem(KEYS.ADJUSTMENTS, JSON.stringify(INITIAL_ADJUSTMENTS()));
    }
  }

  static getUsers(): Usuario[] {
    this.init();
    return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  }

  static saveUsers(users: Usuario[]) {
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  }

  static getShifts(): Turno[] {
    this.init();
    return JSON.parse(localStorage.getItem(KEYS.SHIFTS) || '[]');
  }

  static saveShifts(shifts: Turno[]) {
    localStorage.setItem(KEYS.SHIFTS, JSON.stringify(shifts));
  }

  static getMarkings(): Marcacao[] {
    this.init();
    return JSON.parse(localStorage.getItem(KEYS.MARKINGS) || '[]');
  }

  static saveMarkings(markings: Marcacao[]) {
    localStorage.setItem(KEYS.MARKINGS, JSON.stringify(markings));
  }

  static getJourneys(): JornadaDiaria[] {
    this.init();
    return JSON.parse(localStorage.getItem(KEYS.JOURNEYS) || '[]');
  }

  static saveJourneys(journeys: JornadaDiaria[]) {
    localStorage.setItem(KEYS.JOURNEYS, JSON.stringify(journeys));
  }

  static getAdjustments(): SolicitacaoAjuste[] {
    this.init();
    return JSON.parse(localStorage.getItem(KEYS.ADJUSTMENTS) || '[]');
  }

  static saveAdjustments(adjustments: SolicitacaoAjuste[]) {
    localStorage.setItem(KEYS.ADJUSTMENTS, JSON.stringify(adjustments));
  }

  static getSession(): Usuario | null {
    const session = localStorage.getItem(KEYS.SESSION);
    if (!session) return null;
    try {
      return JSON.parse(session);
    } catch {
      return null;
    }
  }

  static saveSession(user: Usuario | null) {
    if (user) {
      localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
    } else {
      localStorage.removeItem(KEYS.SESSION);
    }
  }

  static clearAll() {
    localStorage.removeItem(KEYS.USERS);
    localStorage.removeItem(KEYS.SHIFTS);
    localStorage.removeItem(KEYS.MARKINGS);
    localStorage.removeItem(KEYS.JOURNEYS);
    localStorage.removeItem(KEYS.ADJUSTMENTS);
    localStorage.removeItem(KEYS.SESSION);
    this.init();
  }
}
