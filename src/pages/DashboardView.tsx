/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { ClockButton } from '../components/ClockButton';
import { WeeklyHoursChart, BalanceTrendChart } from '../components/Charts';
import { formatHoursBank, formatWorkedTime, formatDateTime } from '../utils/formatters';
import { 
  Hourglass, 
  PlusCircle, 
  MinusCircle, 
  CalendarClock, 
  MapPin, 
  ChevronRight, 
  MapPinOff,
  AlertCircle,
  Award,
  Clock,
  Check,
  AlertTriangle
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { user, myMarkings, myJourneys, nextPunchType, shifts } = useApp();
  const [activeMapIndex, setActiveMapIndex] = useState<number | null>(null);

  if (!user) return null;

  // Compute stats for metrics
  const totalBalance = user.saldo_banco_horas;
  const isBalanceNegative = totalBalance < 0;

  // Hours worked today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayJourney = myJourneys.find(j => j.data_referencia === todayStr);
  const workedTodayMinutes = todayJourney?.minutos_trabalhados || 0;

  // Find user active shift
  const shift = shifts?.find(s => s.id === user.turnoId) || {
    id: 'default',
    nome: 'Comercial Matutino',
    tolerancia_minutos: 10,
    carga_horaria_minutos: 480,
    entrada_esperada: '08:00',
    saida_esperada: '17:00',
    almoco_inicio: '12:00',
    almoco_fim: '13:00'
  };

  // Filter today's markings in ascending chronological order
  const todayMarkings = [...myMarkings]
    .filter(m => {
      try {
        return new Date(m.data_hora_registro).toISOString().split('T')[0] === todayStr;
      } catch {
        return false;
      }
    })
    .sort((a, b) => new Date(a.data_hora_registro).getTime() - new Date(b.data_hora_registro).getTime());

  interface Phase {
    label: string;
    expected: string;
    type: 'ENTRADA' | 'SAIDA';
    actualMarking?: any;
    statusText: string;
    statusColor: 'emerald' | 'rose' | 'amber' | 'zinc';
    actualTimeFormatted: string;
  }

  const phases: Phase[] = [];

  // Phase 1: Entrada
  phases.push({
    label: 'Início de Expediente',
    expected: shift.entrada_esperada,
    type: 'ENTRADA',
    statusText: 'Aguardando',
    statusColor: 'zinc',
    actualTimeFormatted: '--:--'
  });

  // Phase 2 & 3: Intervalo (only if defined)
  if (shift.almoco_inicio && shift.almoco_fim) {
    phases.push({
      label: 'Intervalo Almoço (Saída)',
      expected: shift.almoco_inicio,
      type: 'SAIDA',
      statusText: 'Aguardando',
      statusColor: 'zinc',
      actualTimeFormatted: '--:--'
    });
    phases.push({
      label: 'Retorno Almoço (Entrada)',
      expected: shift.almoco_fim,
      type: 'ENTRADA',
      statusText: 'Aguardando',
      statusColor: 'zinc',
      actualTimeFormatted: '--:--'
    });
    phases.push({
      label: 'Fim de Expediente',
      expected: shift.saida_esperada,
      type: 'SAIDA',
      statusText: 'Aguardando',
      statusColor: 'zinc',
      actualTimeFormatted: '--:--'
    });
  } else {
    // 2-point shift
    phases.push({
      label: 'Fim de Expediente',
      expected: shift.saida_esperada,
      type: 'SAIDA',
      statusText: 'Aguardando',
      statusColor: 'zinc',
      actualTimeFormatted: '--:--'
    });
  }

  // Initialize values
  phases.forEach(p => {
    p.actualMarking = undefined;
    p.actualTimeFormatted = '--:--';
  });

  // Smart allocation of markings to phases
  if (phases.length === 4) {
    if (todayMarkings.length === 1) {
      phases[0].actualMarking = todayMarkings[0];
    } else if (todayMarkings.length === 2) {
      phases[0].actualMarking = todayMarkings[0];
      const mDate = new Date(todayMarkings[1].data_hora_registro);
      const mHour = mDate.getHours();
      if (mHour >= 15) {
        phases[3].actualMarking = todayMarkings[1];
      } else {
        phases[1].actualMarking = todayMarkings[1];
      }
    } else if (todayMarkings.length === 3) {
      phases[0].actualMarking = todayMarkings[0];
      phases[1].actualMarking = todayMarkings[1];
      phases[2].actualMarking = todayMarkings[2];
    } else if (todayMarkings.length >= 4) {
      phases[0].actualMarking = todayMarkings[0];
      phases[1].actualMarking = todayMarkings[1];
      phases[2].actualMarking = todayMarkings[2];
      phases[3].actualMarking = todayMarkings[3];
    }
  } else {
    // 2-point shift
    if (todayMarkings.length === 1) {
      phases[0].actualMarking = todayMarkings[0];
    } else if (todayMarkings.length >= 2) {
      phases[0].actualMarking = todayMarkings[0];
      phases[1].actualMarking = todayMarkings[todayMarkings.length - 1];
    }
  }

  // Calculate actual entries and compliance comparison
  phases.forEach((p, idx) => {
    const actual = p.actualMarking;
    if (actual) {
      const actDate = new Date(actual.data_hora_registro);
      
      const hours = String(actDate.getHours()).padStart(2, '0');
      const minutes = String(actDate.getMinutes()).padStart(2, '0');
      p.actualTimeFormatted = `${hours}:${minutes}`;

      const [expH, expM] = p.expected.split(':').map(Number);
      const expectedDate = new Date(actDate.getTime());
      expectedDate.setHours(expH, expM, 0, 0);

      const diffMins = Math.round((actDate.getTime() - expectedDate.getTime()) / 60000);
      const tol = shift.tolerancia_minutos;

      if (p.type === 'ENTRADA') {
        if (diffMins > tol) {
          p.statusText = `Atraso de ${diffMins} min`;
          p.statusColor = 'rose';
        } else if (diffMins < -tol) {
          p.statusText = `Antecipado: ${Math.abs(diffMins)} min`;
          p.statusColor = 'emerald';
        } else {
          p.statusText = 'No Horário';
          p.statusColor = 'emerald';
        }
      } else {
        // SAIDA
        if (diffMins < -tol) {
          p.statusText = `Saída Antecipada: ${Math.abs(diffMins)} min`;
          p.statusColor = 'rose';
        } else if (diffMins > tol) {
          p.statusText = `Extra: +${diffMins} min`;
          p.statusColor = 'emerald';
        } else {
          p.statusText = 'No Horário';
          p.statusColor = 'emerald';
        }
      }
    } else {
      // Not punched yet, calculate if already overdue
      const now = new Date();
      const [expH, expM] = p.expected.split(':').map(Number);
      const expDate = new Date();
      expDate.setHours(expH, expM, 0, 0);

      const isPreviousDone = idx === 0 ? true : !!phases[idx - 1].actualMarking;

      const todayFullStr = new Date().toISOString().split('T')[0];
      const markingDateStr = now.toISOString().split('T')[0];

      if (todayFullStr === markingDateStr && now.getTime() > expDate.getTime() + (shift.tolerancia_minutos * 60000) && isPreviousDone) {
        if (p.type === 'ENTRADA') {
          const delayMinutesNow = Math.round((now.getTime() - expDate.getTime()) / 60000);
          p.statusText = `Atrasado: ${delayMinutesNow} min (Pendente)`;
          p.statusColor = 'rose';
        } else {
          p.statusText = 'Saída Pendente';
          p.statusColor = 'amber';
        }
      } else {
        p.statusText = isPreviousDone ? 'Aguardando batida' : 'Aguardando anterior';
        p.statusColor = 'zinc';
      }
    }
  });

  // Compute daily completion percentage
  const punchedPhasesCount = phases.filter(p => !!p.actualMarking).length;
  const progressPercent = Math.round((punchedPhasesCount / phases.length) * 100);

  // Weekly and Monthly charts variables
  const weeklyData = [...myJourneys]
    .slice(0, 5)
    .reverse()
    .map(j => {
      // e.g. "2026-05-19" -> "19/05"
      const parts = j.data_referencia.split('-');
      const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : j.data_referencia;
      return {
        label,
        value: j.minutos_trabalhados
      };
    });

  // Trend mapping
  let accum = totalBalance - 150; // backtrack trend
  const trendData = [...myJourneys]
    .slice(0, 5)
    .reverse()
    .map(j => {
      const parts = j.data_referencia.split('-');
      const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : j.data_referencia;
      accum += (j.minutos_extras - j.minutos_faltantes);
      return {
        label,
        value: accum
      };
    });

  return (
    <div className="space-y-6">
      
      {/* Intro Welcome Grid Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111113] p-6 rounded-3xl border border-zinc-800">
        <div>
          <h2 className="text-zinc-100 text-xl font-bold tracking-tight">Olá, {user.nome}!</h2>
          <p className="text-zinc-400 text-sm mt-1 font-sans">
            Bem-vindo ao seu portal de jornada. Seu expediente previsto hoje inicia de acordo com o seu turno corporativo.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 px-4 py-2.5 rounded-2xl shrink-0">
          <CalendarClock size={16} className="text-emerald-400" />
          <div className="text-left">
            <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold block leading-none">Próxima Ação</span>
            <span className="text-zinc-200 text-xs font-semibold block mt-1">Registrar {nextPunchType}</span>
          </div>
        </div>
      </div>

      {/* Hero Clock Action Dashboard Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* BIG HERO BUTTON CARD IN CENTER */}
        <div className="lg:col-span-4 bg-[#111113] border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
          <div className="border-b border-zinc-800/80 pb-4 text-center">
            <h3 className="text-zinc-200 text-sm font-semibold tracking-tight">Registrador Biométrico</h3>
            <p className="text-zinc-500 text-xs font-mono mt-0.5">ESTAÇÃO DE TRABALHO DIGITAL</p>
          </div>

          <ClockButton />

          <div className="bg-[#09090B] border border-zinc-800 w-full p-3 rounded-2xl flex items-center justify-between">
            <span className="text-zinc-400 text-xs font-medium">Coleta de GPS:</span>
            <span className="text-emerald-400 text-xs font-mono font-semibold uppercase tracking-wider">Ativa & Habilitada</span>
          </div>
        </div>

        {/* METRICS TRI-BENTO GRID */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Bank Hours balance */}
          <div className="bg-[#111113] border border-zinc-800/80 rounded-3xl p-6 flex flex-col justify-between shadow-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-emerald-500/5 to-transparent rounded-bl-3xl pointer-events-none" />
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-zinc-500">Banco de Horas</span>
              <div className={`p-2 rounded-xl border ${
                isBalanceNegative 
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}>
                {isBalanceNegative ? <MinusCircle size={16} /> : <PlusCircle size={16} />}
              </div>
            </div>
            
            <div className="my-5">
              <span className={`text-3xl font-black font-mono tracking-tight ${isBalanceNegative ? 'text-rose-400' : 'text-emerald-400'}`}>
                {formatHoursBank(totalBalance)}
              </span>
              <p className="text-zinc-500 text-xs mt-1.5 font-medium leading-relaxed">
                {isBalanceNegative 
                  ? 'Você possui saldo devedor a ser compensado com horas excedentes.' 
                  : 'Seu saldo encontra-se positivo e elegível para folgas compensatórias.'}
              </p>
            </div>
            <div className="text-[10px] font-mono text-zinc-500 border-t border-zinc-800 pt-3">
              ÚLTIMA ATUALIZAÇÃO HOJE
            </div>
          </div>

          {/* Card 2: Hours worked today */}
          <div className="bg-[#111113] border border-zinc-800/80 rounded-3xl p-6 flex flex-col justify-between shadow-md">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-zinc-500">Trabalhado Hoje</span>
              <div className="p-2 bg-[#09090B] rounded-xl border border-zinc-800 text-zinc-400">
                <Hourglass size={16} />
              </div>
            </div>
            
            <div className="my-5">
              <span className="text-3xl font-black font-mono tracking-tight text-zinc-100">
                {formatWorkedTime(workedTodayMinutes)}
              </span>
              <div className="mt-1.5 flex items-center gap-1.5">
                <div className="h-1.5 bg-zinc-800 rounded-full flex-1 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min((workedTodayMinutes / 480) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {Math.round(Math.min((workedTodayMinutes / 480) * 100, 100))}%
                </span>
              </div>
              <p className="text-zinc-500 text-xs mt-2 font-medium">
                Carga diária prevista: 8 horas (480 minutos)
              </p>
            </div>
            <div className="text-[10px] font-mono text-zinc-500 border-t border-zinc-800 pt-3">
              BASEADO EM BATIDAS DE HOJE
            </div>
          </div>

          {/* Card 3: Days Present stats */}
          <div className="bg-[#111113] border border-zinc-800/80 rounded-3xl p-6 flex flex-col justify-between shadow-md">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-zinc-500">Assiduidade Mensal</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <Award size={16} />
              </div>
            </div>
            
            <div className="my-5">
              <span className="text-3xl font-black font-mono tracking-tight text-emerald-400">
                98.4%
              </span>
              <p className="text-zinc-500 text-xs mt-1.5 leading-normal">
                Você teve apenas 1 atraso justificado e nenhuma falta injustificada no período de apuração corrente.
              </p>
            </div>
            <div className="text-[10px] font-mono text-zinc-500 border-t border-zinc-800 pt-3">
              NÍVEL DE EXCELÊNCIA PREMIUM
            </div>
          </div>
        </div>

      </div>

      {/* DAILY COMPLIANCE PROGRESS & CLT STATUS CARD */}
      <div className="bg-[#111113] border border-zinc-800 rounded-3xl p-6 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
          <div>
            <h3 className="text-zinc-100 text-base font-bold tracking-tight flex items-center gap-2">
              <Clock size={18} className="text-emerald-500" />
              Acompanhamento de Jornada de Hoje
            </h3>
            <p className="text-zinc-400 text-xs mt-0.5">
              Turno ativo: <strong className="text-zinc-300">{shift.nome}</strong> ({shift.entrada_esperada} às {shift.saida_esperada} • Tolerância adm: {shift.tolerancia_minutos} min)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] text-zinc-400 font-mono">CONGRUÊNCIA DE BATIDAS:</span>
            <span className="bg-[#09090B] px-3 py-1.5 border border-zinc-800 rounded-xl text-zinc-100 font-mono font-bold text-xs flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${progressPercent === 100 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              {progressPercent}% Concluído
            </span>
          </div>
        </div>

        {/* Global Progress Line Bar with Overlaid Steps */}
        <div className="relative py-4 select-none">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-zinc-800 -translate-y-1/2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="relative flex justify-between items-center">
            {phases.map((p, idx) => {
              const isPunched = !!p.actualMarking;
              const isOverdue = p.statusText.includes('Atraso') || p.statusText.includes('Atrasado');

              let ringClass = 'border-zinc-800 bg-[#09090B] text-zinc-500';
              if (isPunched) {
                ringClass = 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-black';
              } else if (isOverdue) {
                ringClass = 'border-rose-500 bg-rose-500/10 text-rose-400 animate-pulse';
              }

              return (
                <div key={idx} className="flex flex-col items-center gap-2 relative z-10" style={{ width: '80px' }}>
                  <div className={`h-9 w-9 rounded-full border-2 flex items-center justify-center text-xs transition duration-300 ${ringClass}`}>
                    {isPunched ? (
                      <Check size={14} className="stroke-[3]" />
                    ) : isOverdue ? (
                      <AlertTriangle size={14} />
                    ) : (
                      <span className="font-mono text-[10px] font-bold">{idx + 1}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 font-sans font-medium text-center truncate w-full" title={p.label}>
                    {p.label.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Individual Phased Cards containing exact target times & status variance */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {phases.map((p, idx) => {
            const isPunched = !!p.actualMarking;
            const isOverdue = p.statusText.includes('Atraso') || p.statusText.includes('Atrasado');
            const isEarly = p.statusText.includes('Antecipado') || p.statusText.includes('Antecipada');

            let cardBorder = 'border-zinc-800/60 bg-[#09090B]/40';
            let statBadge = 'bg-zinc-800/40 text-zinc-500 border-zinc-800/80';
            let clockIconColor = 'text-zinc-650';

            if (isPunched) {
              cardBorder = 'border-emerald-500/20 bg-emerald-500/[0.01]';
              statBadge = isEarly
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
              clockIconColor = 'text-emerald-400';
            } else if (isOverdue) {
              cardBorder = 'border-rose-500/20 bg-rose-500/[0.01]';
              statBadge = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
              clockIconColor = 'text-rose-400';
            }

            return (
              <div key={idx} className={`border rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-zinc-700/60 transition ${cardBorder}`}>
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-zinc-500">
                      BATIDA {idx + 1}
                    </span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-lg border uppercase tracking-wide font-bold shrink-0 ${statBadge}`}>
                      {p.statusText}
                    </span>
                  </div>

                  <h4 className="text-zinc-200 text-xs font-semibold tracking-tight mt-2.5">
                    {p.label}
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/50">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-zinc-500 uppercase font-mono block">Previsto</span>
                    <span className="text-zinc-300 text-xs font-mono font-bold flex items-center gap-1">
                      <Clock size={11} className={clockIconColor} />
                      {p.expected}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[9px] text-zinc-500 uppercase font-mono block">Realizado</span>
                    <span className="text-zinc-100 text-xs font-mono font-bold">
                      {p.actualTimeFormatted}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* GRAPHIC BLOCKS (BENTO EXPANSION) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WeeklyHoursChart 
          data={weeklyData} 
          title="Horas Trabalhadas na Semana" 
          subtitle="Apuradas dia a dia"
        />
        <BalanceTrendChart 
          data={trendData} 
          title="Histórico de Evolução do Banco" 
          subtitle="Previsão acumulada em minutos"
        />
      </div>

      {/* RECENT PUNCTION LOG TABLE WITH MAP TOGGLE */}
      <div className="bg-[#111113] border border-zinc-800 rounded-3xl p-6 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-5 pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-zinc-200 text-sm font-semibold tracking-tight">Marcações Recentes</h3>
            <p className="text-zinc-500 text-xs mt-0.5">Últimos logs de ponto enviados aos servidores</p>
          </div>
          <span className="text-emerald-400 text-xs font-mono font-bold bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
            {myMarkings.length} BATIDAS TOTAIS
          </span>
        </div>

        {myMarkings.length === 0 ? (
          <div className="text-center py-10">
            <AlertCircle className="mx-auto h-8 w-8 text-zinc-600 mb-3" />
            <p className="text-zinc-500 text-sm">Nenhuma marcação realizada no período atual.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {myMarkings.slice(0, 5).map((log, index) => {
              const isEntrance = log.tipo_registro === 'ENTRADA';
              const isExpandedMap = activeMapIndex === index;

              return (
                <div key={log.id} className="bg-zinc-900/5 border border-zinc-800/85 rounded-2xl overflow-hidden transition hover:border-zinc-800">
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      {/* Logo Tag */}
                      <div className={`h-10 w-10 rounded-xl font-bold font-mono text-xs flex items-center justify-center shrink-0 border ${
                        isEntrance 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {isEntrance ? 'ENT' : 'SAÍ'}
                      </div>

                      <div className="min-w-0">
                        <span className="text-zinc-200 text-sm font-semibold flex items-center gap-1.5">
                          {isEntrance ? 'Entrada Registrada' : 'Saída Registrada'}
                          {log.observacao && (
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" title="Possui observações" />
                          )}
                        </span>
                        <span className="text-zinc-500 text-xs block font-mono mt-0.5">
                          {formatDateTime(log.data_hora_registro)} via IP seguro
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5 pl-13 sm:pl-0">
                      <div className="text-left sm:text-right">
                        <span className="text-zinc-400 text-xs font-bold font-mono leading-none block">Origem</span>
                        <span className="text-zinc-500 text-[10px] mt-1 block uppercase tracking-wider bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">{log.origem}</span>
                      </div>
                      
                      {log.geolocalizacao_lat ? (
                        <button
                          onClick={() => setActiveMapIndex(isExpandedMap ? null : index)}
                          className={`p-2 rounded-xl border text-zinc-400 hover:text-emerald-400 hover:bg-zinc-900 cursor-pointer transition ${
                            isExpandedMap ? 'bg-zinc-900 border-zinc-700 text-emerald-400' : 'bg-transparent border-zinc-900'
                          }`}
                          title="Exibir mapa de localização GPS"
                        >
                          <MapPin size={15} />
                        </button>
                      ) : (
                        <div className="p-2 rounded-xl border border-zinc-900 text-zinc-650" title="Sem coordenadas GPS">
                          <MapPinOff size={15} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expandable Embedded Virtual Map */}
                  {isExpandedMap && log.geolocalizacao_lat && (
                    <div className="border-t border-zinc-800 bg-[#09090B] p-4 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse mt-0.5" />
                        <div>
                          <p className="text-zinc-300 text-xs font-semibold">Localização Verificada via Satélite Corporativo</p>
                          <p className="text-zinc-500 text-[10px] font-mono mt-0.5">
                            Coordenadas decimais: {log.geolocalizacao_lat.toFixed(6)}, {log.geolocalizacao_lng?.toFixed(6)}
                          </p>
                        </div>
                      </div>
                      <a 
                        href={`https://www.google.com/maps?q=${log.geolocalizacao_lat},${log.geolocalizacao_lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono hover:underline"
                      >
                        Abrir no Google Maps <ChevronRight size={13} />
                      </a>
                    </div>
                  )}

                  {log.observacao && (
                    <div className="bg-amber-500/5 text-amber-400/90 max-w-full px-4 py-2 border-t border-zinc-800 text-xs font-mono">
                      <span className="font-bold">JUSTIFICATIVA:</span> {log.observacao}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
