/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LocalDatabase } from '../mocks/database';
import { Usuario, Turno, Marcacao, JornadaDiaria, SolicitacaoAjuste, Perfil } from '../types';

const LATENCY_MS = 400;

const delay = (ms: number = LATENCY_MS) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  async login(cpf: string, password?: string): Promise<{ user: Usuario; token: string }> {
    await delay();
    const cleanCpf = cpf.replace(/\D/g, '');
    const users = LocalDatabase.getUsers();
    
    // Find matching user (remove characters for loose matching)
    const user = users.find(u => u.cpf.replace(/\D/g, '') === cleanCpf);
    
    if (!user) {
      throw new Error('Colaborador não encontrado com este CPF.');
    }
    
    if (!user.ativo) {
      throw new Error('Esta conta de colaborador foi desativada pelo RH.');
    }

    // Mock a JSON web token for architecture validation
    const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.user_${user.id}_mock_session`;
    LocalDatabase.saveSession(user);
    
    return { user, token: mockToken };
  },

  async logout(): Promise<void> {
    await delay(150);
    LocalDatabase.saveSession(null);
  },

  async getCurrentSession(): Promise<Usuario | null> {
    await delay(50);
    return LocalDatabase.getSession();
  },

  async recoverPassword(email: string): Promise<{ success: boolean; message: string }> {
    await delay(600);
    const users = LocalDatabase.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      throw new Error('Nenhum colaborador localizado com este e-mail corporativo.');
    }
    
    return {
      success: true,
      message: `Um link de redefinição de credenciais de acesso seguro foi enviado para ${email}.`
    };
  }
};

export const timeTrackingService = {
  async getMyMarkings(userId: string): Promise<Marcacao[]> {
    await delay(200);
    const markings = LocalDatabase.getMarkings();
    return markings
      .filter(m => m.usuario_id === userId)
      .sort((a, b) => new Date(b.data_hora_registro).getTime() - new Date(a.data_hora_registro).getTime());
  },

  async getMyJourneys(userId: string): Promise<JornadaDiaria[]> {
    await delay(200);
    const journeys = LocalDatabase.getJourneys();
    return journeys
      .filter(j => j.usuario_id === userId)
      .sort((a, b) => b.data_referencia.localeCompare(a.data_referencia));
  },

  async determineNextPunchType(userId: string): Promise<'ENTRADA' | 'SAIDA'> {
    const markings = LocalDatabase.getMarkings();
    const userMarkings = markings
      .filter(m => m.usuario_id === userId)
      .sort((a, b) => new Date(a.data_hora_registro).getTime() - new Date(b.data_hora_registro).getTime());
    
    if (userMarkings.length === 0) return 'ENTRADA';
    
    const lastMarking = userMarkings[userMarkings.length - 1];
    
    // Check if the last marking is from today.
    const todayStr = new Date().toISOString().split('T')[0];
    const lastMarkingDateStr = new Date(lastMarking.data_hora_registro).toISOString().split('T')[0];
    
    if (lastMarkingDateStr !== todayStr) {
      return 'ENTRADA';
    }
    
    return lastMarking.tipo_registro === 'ENTRADA' ? 'SAIDA' : 'ENTRADA';
  },

  async registerPunch(
    userId: string,
    lat?: number,
    lng?: number,
    fotoBase64?: string
  ): Promise<{ marking: Marcacao; type: 'ENTRADA' | 'SAIDA'; currentBalance: number }> {
    await delay(800); // realistic time for GPS / face verification processes
    
    const users = LocalDatabase.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error('Usuário inválido.');
    
    const user = users[userIndex];
    if (!user.ativo) throw new Error('Colaborador inativo.');

    const nextType = await this.determineNextPunchType(userId);
    const timeNow = new Date().toISOString();
    
    const newMarking: Marcacao = {
      id: `m-punch-${Date.now()}`,
      usuario_id: userId,
      data_hora_registro: timeNow,
      tipo_registro: nextType,
      origem: 'WEB',
      geolocalizacao_lat: lat || -23.55052,
      geolocalizacao_lng: lng || -46.633308,
      foto_base64: fotoBase64 || 'data:image/svg+xml;utf8,<svg ...>'
    };

    // Save marking
    const markings = LocalDatabase.getMarkings();
    markings.push(newMarking);
    LocalDatabase.saveMarkings(markings);

    // Dynamic calculations for JornadaDiaria
    const todayStr = new Date().toISOString().split('T')[0];
    const journeys = LocalDatabase.getJourneys();
    
    let journey = journeys.find(j => j.usuario_id === userId && j.data_referencia === todayStr);
    
    if (!journey) {
      journey = {
        id: `journey-${userId}-${todayStr}`,
        usuario_id: userId,
        data_referencia: todayStr,
        minutos_trabalhados: 0,
        minutos_extras: 0,
        minutos_faltantes: 0,
        status: 'INCOMPLETO',
        marcacoes_ids: [newMarking.id]
      };
      journeys.push(journey);
    } else {
      journey.marcacoes_ids.push(newMarking.id);
    }

    // Attempt to compute worked hours if we have entries & exits for today
    const shift = LocalDatabase.getShifts().find(s => s.id === user.turnoId) || LocalDatabase.getShifts()[0];
    
    const todayMarkings = markings
      .filter(m => m.usuario_id === userId && new Date(m.data_hora_registro).toISOString().split('T')[0] === todayStr)
      .sort((a, b) => new Date(a.data_hora_registro).getTime() - new Date(b.data_hora_registro).getTime());
    
    if (todayMarkings.length >= 2) {
      let totalWorkedMinutes = 0;
      
      for (let i = 0; i < todayMarkings.length - 1; i += 2) {
        if (todayMarkings[i].tipo_registro === 'ENTRADA' && todayMarkings[i + 1].tipo_registro === 'SAIDA') {
          const inTime = new Date(todayMarkings[i].data_hora_registro).getTime();
          const outTime = new Date(todayMarkings[i + 1].data_hora_registro).getTime();
          totalWorkedMinutes += Math.round((outTime - inTime) / 60000);
        }
      }

      journey.minutos_trabalhados = totalWorkedMinutes;
      const expectedWork = shift.carga_horaria_minutos;
      
      if (totalWorkedMinutes >= expectedWork - shift.tolerancia_minutos && totalWorkedMinutes <= expectedWork + shift.tolerancia_minutos) {
        journey.status = 'COMPLETO';
        journey.minutos_extras = 0;
        journey.minutos_faltantes = 0;
      } else if (totalWorkedMinutes > expectedWork + shift.tolerancia_minutos) {
        journey.status = 'EXTRA';
        const diff = totalWorkedMinutes - expectedWork;
        journey.minutos_extras = diff;
        journey.minutos_faltantes = 0;
        
        // Update user's bank of hours
        user.saldo_banco_horas += diff;
      } else {
        journey.status = 'FALTA';
        const diff = expectedWork - totalWorkedMinutes;
        journey.minutos_faltantes = diff;
        journey.minutos_extras = 0;
        
        // Deduct from bank of hours
        user.saldo_banco_horas -= diff;
      }
    } else {
      journey.status = 'INCOMPLETO';
    }

    // Save updated journey
    const journeyIndex = journeys.findIndex(j => j.id === journey?.id);
    if (journeyIndex !== -1 && journey) {
      journeys[journeyIndex] = journey;
    }
    LocalDatabase.saveJourneys(journeys);

    // Save updated user balance
    users[userIndex] = user;
    LocalDatabase.saveUsers(users);
    
    // Update active session locally if the clocked-in user is the logged-in session user
    const currentSession = LocalDatabase.getSession();
    if (currentSession && currentSession.id === userId) {
      LocalDatabase.saveSession(user);
    }

    return {
      marking: newMarking,
      type: nextType,
      currentBalance: user.saldo_banco_horas
    };
  }
};

export const adjustmentsService = {
  async getAdjustments(): Promise<SolicitacaoAjuste[]> {
    await delay(300);
    return LocalDatabase.getAdjustments();
  },

  async getMyAdjustments(userId: string): Promise<SolicitacaoAjuste[]> {
    await delay(200);
    return LocalDatabase.getAdjustments().filter(a => a.usuario_id === userId);
  },

  async createAdjustment(
    userId: string,
    data: Omit<SolicitacaoAjuste, 'id' | 'usuario_id' | 'status' | 'data_solicitacao'>
  ): Promise<SolicitacaoAjuste> {
    await delay(500);
    const adjustments = LocalDatabase.getAdjustments();
    
    const newRequest: SolicitacaoAjuste = {
      ...data,
      id: `adj-${Date.now()}`,
      usuario_id: userId,
      status: 'PENDENTE',
      data_solicitacao: new Date().toISOString()
    };
    
    adjustments.push(newRequest);
    LocalDatabase.saveAdjustments(adjustments);
    return newRequest;
  },

  async reviewAdjustment(
    id: string,
    status: 'APROVADO' | 'REJEITADO',
    approverId: string,
    feedback?: string
  ): Promise<SolicitacaoAjuste> {
    await delay(400);
    const adjustments = LocalDatabase.getAdjustments();
    const adjIdx = adjustments.findIndex(a => a.id === id);
    
    if (adjIdx === -1) throw new Error('Solicitação não localizada.');
    
    const adj = adjustments[adjIdx];
    adj.status = status;
    adj.aprovado_por_id = approverId;
    adj.resposta_gestor = feedback;
    
    adjustments[adjIdx] = adj;
    LocalDatabase.saveAdjustments(adjustments);

    // If approved and is "ESQUECIMENTO_BATIDA", let's inject a point marking automatically!
    if (status === 'APROVADO') {
      if (adj.tipo_solicitacao === 'ESQUECIMENTO_BATIDA' && adj.registro_sugestao_hora && adj.tipo_registro_sugestao) {
        const targetDateAndHour = `${adj.data_alvo}T${adj.registro_sugestao_hora}:00`;
        const timeISO = new Date(targetDateAndHour).toISOString();
        
        const markings = LocalDatabase.getMarkings();
        const nextId = `m-adj-${Date.now()}`;
        markings.push({
          id: nextId,
          usuario_id: adj.usuario_id,
          data_hora_registro: timeISO,
          tipo_registro: adj.tipo_registro_sugestao,
          origem: 'WEB',
          observacao: 'Inserido retroativamente via solicitação de ajuste pelo RH/Gestor'
        });
        LocalDatabase.saveMarkings(markings);
        
        // Recalculate that day's journey as well
        const journeys = LocalDatabase.getJourneys();
        let journey = journeys.find(j => j.usuario_id === adj.usuario_id && j.data_referencia === adj.data_alvo);
        
        if (!journey) {
          journey = {
            id: `journey-${adj.usuario_id}-${adj.data_alvo}`,
            usuario_id: adj.usuario_id,
            data_referencia: adj.data_alvo,
            minutos_trabalhados: 0,
            minutos_extras: 0,
            minutos_faltantes: 0,
            status: 'INCOMPLETO',
            marcacoes_ids: [nextId]
          };
          journeys.push(journey);
        } else {
          journey.marcacoes_ids.push(nextId);
        }
        
        // Complete mathematical journey update
        const users = LocalDatabase.getUsers();
        const userIdx = users.findIndex(u => u.id === adj.usuario_id);
        
        if (userIdx !== -1) {
          const user = users[userIdx];
          const shift = LocalDatabase.getShifts().find(s => s.id === user.turnoId) || LocalDatabase.getShifts()[0];
          const todayMarkings = markings
            .filter(m => m.usuario_id === adj.usuario_id && new Date(m.data_hora_registro).toISOString().split('T')[0] === adj.data_alvo)
            .sort((a, b) => new Date(a.data_hora_registro).getTime() - new Date(b.data_hora_registro).getTime());
          
          if (todayMarkings.length >= 2) {
            let totalWorkedMinutes = 0;
            for (let i = 0; i < todayMarkings.length - 1; i += 2) {
              if (todayMarkings[i].tipo_registro === 'ENTRADA' && todayMarkings[i + 1].tipo_registro === 'SAIDA') {
                const inTime = new Date(todayMarkings[i].data_hora_registro).getTime();
                const outTime = new Date(todayMarkings[i + 1].data_hora_registro).getTime();
                totalWorkedMinutes += Math.round((outTime - inTime) / 60000);
              }
            }
            
            journey.minutos_trabalhados = totalWorkedMinutes;
            const expectedWork = shift.carga_horaria_minutos;
            
            if (totalWorkedMinutes >= expectedWork - shift.tolerancia_minutos && totalWorkedMinutes <= expectedWork + shift.tolerancia_minutos) {
              journey.status = 'COMPLETO';
              journey.minutos_extras = 0;
              journey.minutos_faltantes = 0;
            } else if (totalWorkedMinutes > expectedWork + shift.tolerancia_minutos) {
              journey.status = 'EXTRA';
              const diff = totalWorkedMinutes - expectedWork;
              journey.minutos_extras = diff;
              journey.minutos_faltantes = 0;
              user.saldo_banco_horas += diff;
            } else {
              journey.status = 'FALTA';
              const diff = expectedWork - totalWorkedMinutes;
              journey.minutos_faltantes = diff;
              journey.minutos_extras = 0;
              user.saldo_banco_horas -= diff;
            }
          }
          users[userIdx] = user;
          LocalDatabase.saveUsers(users);
        }
        
        const journeyIndex = journeys.findIndex(j => j.id === journey?.id);
        if (journeyIndex !== -1 && journey) {
          journeys[journeyIndex] = journey;
        }
        LocalDatabase.saveJourneys(journeys);
      }
    }

    return adj;
  }
};

export const adminService = {
  // Configured with full CRUD for users and shifts
  async getAllUsers(): Promise<Usuario[]> {
    await delay(150);
    return LocalDatabase.getUsers();
  },

  async createUser(data: Omit<Usuario, 'id'>): Promise<Usuario> {
    await delay(300);
    const users = LocalDatabase.getUsers();
    
    // Generate clean safe ID
    const newUser: Usuario = {
      ...data,
      id: `user-${Date.now()}`
    };
    
    users.push(newUser);
    LocalDatabase.saveUsers(users);
    return newUser;
  },

  async updateUser(id: string, updates: Partial<Usuario>): Promise<Usuario> {
    await delay(300);
    const users = LocalDatabase.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('Usuário não encontrado.');
    
    const updatedUser = { ...users[idx], ...updates };
    users[idx] = updatedUser;
    LocalDatabase.saveUsers(users);
    return updatedUser;
  },

  async getShifts(): Promise<Turno[]> {
    await delay(100);
    return LocalDatabase.getShifts();
  },

  async createShift(data: Omit<Turno, 'id'>): Promise<Turno> {
    await delay(300);
    const shifts = LocalDatabase.getShifts();
    const newShift: Turno = {
      ...data,
      id: `shift-${Date.now()}`
    };
    shifts.push(newShift);
    LocalDatabase.saveShifts(shifts);
    return newShift;
  },

  async updateShift(id: string, updates: Partial<Turno>): Promise<Turno> {
    await delay(300);
    const shifts = LocalDatabase.getShifts();
    const idx = shifts.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Turno não encontrado.');
    
    const updatedShift = { ...shifts[idx], ...updates };
    shifts[idx] = updatedShift;
    LocalDatabase.saveShifts(shifts);
    return updatedShift;
  },

  injectManualMarking: async (userId: string, dateStr: string, timeStr: string, type: 'ENTRADA' | 'SAIDA') => {
    await delay(300);
    const markings = LocalDatabase.getMarkings();
    const nextId = `m-manual-${Date.now()}`;
    const datetime = `${dateStr}T${timeStr}:00`;
    markings.push({
      id: nextId,
      usuario_id: userId,
      data_hora_registro: new Date(datetime).toISOString(),
      tipo_registro: type,
      origem: 'PRESENCIAL',
      observacao: 'Marcação retroativa inserida via painel administrativo do gestor.'
    });
    LocalDatabase.saveMarkings(markings);
  }
};
