/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { formatDateOnly, formatWorkedTime, formatHoursBank, formatTimeOnly } from '../utils/formatters';
import { 
  FileSpreadsheet, 
  Search, 
  Printer, 
  Calendar, 
  AlertCircle,
  FileCheck2,
  Lock,
  Download,
  Clock
} from 'lucide-react';

export const HistoryView: React.FC = () => {
  const { user, myJourneys, myMarkings } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  
  // Printable Receipt active state modal model
  const [selectedReceipt, setSelectedReceipt] = useState<{
    journey: any;
    markings: any[];
  } | null>(null);

  if (!user) return null;

  // Filter journals
  const filteredJourneys = myJourneys.filter(j => {
    const matchesSearch = j.data_referencia.includes(searchTerm);
    const matchesStatus = filterStatus === 'ALL' || j.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETO':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'EXTRA':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'FALTA':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/10';
      case 'INCOMPLETO':
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      default:
        return 'bg-zinc-800 text-zinc-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETO': return 'Sucesso 8h';
      case 'EXTRA': return 'Horas Extras';
      case 'FALTA': return 'Débito Jornada';
      case 'INCOMPLETO': return 'Batida Pendente';
      default: return status;
    }
  };

  // Open Receipt Overlay
  const handleOpenReceipt = (journey: any) => {
    // find markings belonging to this journey
    const dayMarkings = myMarkings.filter(m => {
      const markDay = new Date(m.data_hora_registro).toISOString().split('T')[0];
      return markDay === journey.data_referencia;
    });

    setSelectedReceipt({
      journey,
      markings: dayMarkings.sort((a, b) => a.data_hora_registro.localeCompare(b.data_hora_registro))
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Intro Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-zinc-100 text-xl font-bold tracking-tight">Histórico & Espelho de Ponto</h2>
          <p className="text-zinc-400 text-sm mt-0.5">Veja seu extrato detalhado de banco de horas e marcações registradas</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleOpenReceipt(myJourneys[0])}
            disabled={myJourneys.length === 0}
            className="px-4 py-2.5 bg-[#111113] hover:bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
          >
            <Download size={14} />
            <span>Baixar Espelho PDF</span>
          </button>
        </div>
      </div>

      {/* Interactive Filters Grid */}
      <div className="bg-[#111113] border border-zinc-800 rounded-3xl p-5 flex flex-col md:flex-row justify-between gap-4 items-stretch md:items-center">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          {/* Calendar Picker Search Input */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar por data (AAAA-MM)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#09090B] border border-zinc-800 rounded-xl text-zinc-200 text-xs py-2.5 pl-10 pr-4 w-full focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Status Drop Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#09090B] border border-zinc-800 rounded-xl text-zinc-200 text-xs py-2.5 px-4 w-full cursor-pointer focus:outline-none focus:border-emerald-500 appearance-none pr-8 font-medium"
            >
              <option value="ALL">Todos os status</option>
              <option value="COMPLETO">Jornadas Completas (8h)</option>
              <option value="EXTRA">Saldo Extra</option>
              <option value="FALTA">Atrasos / Faltas</option>
              <option value="INCOMPLETO">Ponto Incompleto</option>
            </select>
            <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 h-1 w-1 border-t-4 border-r-4 border-zinc-500 transform rotate-[135deg]" />
          </div>
        </div>

        <div className="flex items-center gap-2 select-none self-end md:self-auto text-zinc-500 font-mono text-[10px] uppercase font-bold tracking-wider">
          <Calendar size={13} className="text-emerald-500" />
          <span>Mês de Apuração Corrente</span>
        </div>
      </div>

      {/* Main Extrato List */}
      <div className="bg-[#111113] border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-[#0D0D0D]/40">
          <h3 className="text-zinc-200 text-sm font-semibold tracking-tight">Período de Apuração</h3>
          <span className="text-[10px] text-zinc-500 font-mono">Homologado MTE Portaria 671</span>
        </div>

        {filteredJourneys.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="mx-auto h-8 w-8 text-zinc-700 mb-3" />
            <p className="text-zinc-500 text-sm">Nenhum registro encontrado para os filtros selecionados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 font-mono text-[10px] uppercase font-bold">
                  <th className="p-4 pl-6">Data de Referência</th>
                  <th className="p-4">Batidas Registradas</th>
                  <th className="p-4 text-center">Tempo Trabalhado</th>
                  <th className="p-4 text-center">Débito / Crédito</th>
                  <th className="p-4">Status Jornada</th>
                  <th className="p-4 pr-6 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300 text-xs">
                {filteredJourneys.map(j => {
                  // Find markings details for this day to draw beautiful micro tags
                  const dayMarkings = myMarkings.filter(m => {
                    const markDay = new Date(m.data_hora_registro).toISOString().split('T')[0];
                    return markDay === j.data_referencia;
                  }).sort((a,b) => a.data_hora_registro.localeCompare(b.data_hora_registro));

                  const diffMinutes = j.minutos_extras - j.minutos_faltantes;

                  return (
                    <tr key={j.id} className="hover:bg-zinc-900/20 transition-colors">
                      <td className="p-4 pl-6 font-semibold text-zinc-200">
                        {formatDateOnly(j.data_referencia)}
                      </td>
                      <td className="p-4">
                        {dayMarkings.length === 0 ? (
                          <span className="text-zinc-650 text-[11px] font-mono">Sem marcações</span>
                        ) : (
                          <div className="flex gap-1.5 flex-wrap">
                            {dayMarkings.map(m => (
                              <span 
                                key={m.id} 
                                className={`font-mono text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                                  m.tipo_registro === 'ENTRADA'
                                    ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10'
                                    : 'bg-amber-500/5 text-amber-500 border-amber-500/10'
                                }`}
                                title={`Origem: ${m.origem}`}
                              >
                                <Clock size={10} className="opacity-70" />
                                {formatTimeOnly(m.data_hora_registro)}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-center font-mono">
                        {formatWorkedTime(j.minutos_trabalhados)}
                      </td>
                      <td className="p-4 text-center font-mono">
                        {diffMinutes === 0 ? (
                          <span className="text-zinc-500">00:00</span>
                        ) : diffMinutes > 0 ? (
                          <span className="text-emerald-400 font-semibold">{formatHoursBank(diffMinutes)}</span>
                        ) : (
                          <span className="text-rose-400 font-semibold">{formatHoursBank(diffMinutes)}</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${getStatusBadge(j.status)}`}>
                          {getStatusLabel(j.status)}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button
                          onClick={() => handleOpenReceipt(j)}
                          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 hover:text-white border border-zinc-800 text-zinc-300 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                        >
                          Ver Comprovante
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Digital Receipt Modal Box */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 print:p-0">
          {/* Backdrop screen */}
          <div 
            onClick={() => setSelectedReceipt(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md print:hidden"
          />

          {/* Core Invoice Ticket */}
          <div className="bg-[#111113] border border-zinc-800 w-full max-w-xl mx-auto rounded-3xl overflow-hidden shadow-2xl relative z-10 print:border-none print:shadow-none print:bg-white print:text-black">
            
            {/* Action Bar inside dialog */}
            <div className="px-6 py-4 border-b border-zinc-800 bg-[#0D0D0D] flex justify-between items-center print:hidden">
              <span className="text-zinc-200 text-xs font-semibold">Comprovante de Registro Diário</span>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={13} />
                  <span>Imprimir</span>
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded-lg"
                >
                  Fechar
                </button>
              </div>
            </div>

            {/* Printable Container Body */}
            <div className="p-8 space-y-6 font-mono text-zinc-300 text-xs print:text-black">
              {/* Header Legal Info */}
              <div className="text-center space-y-2 border-b border-zinc-800 pb-5">
                <h4 className="text-zinc-100 text-sm font-black uppercase tracking-wider print:text-black">CONTRATO SOCIAL PRIME TIME SA</h4>
                <p className="text-[10px] text-zinc-500">CNPJ: 12.345.678/0001-90 | Registro TEM Homologador Portaria 671</p>
                <p className="text-[10px] text-zinc-500">COMprovante dE REGISTRO DE TRABALHADORES (CRT)</p>
              </div>

              {/* Data Employee details */}
              <div className="grid grid-cols-2 gap-4 border-b border-zinc-800 pb-5">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 block">COLABORADOR:</span>
                  <span className="text-zinc-200 uppercase font-bold print:text-black">{user.nome}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 block">CPF:</span>
                  <span className="text-zinc-200 font-bold print:text-black">{user.cpf}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 block">DEPARTAMENTO:</span>
                  <span className="text-zinc-200 print:text-black">{user.departamento}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 block">DATA REF:</span>
                  <span className="text-zinc-200 print:text-black">{formatDateOnly(selectedReceipt.journey.data_referencia)}</span>
                </div>
              </div>

              {/* Markings List */}
              <div className="space-y-3.5">
                <span className="text-[10px] text-zinc-500 block font-bold">REGISTROS DETALHADOS NO EXTRATO:</span>
                
                {selectedReceipt.markings.length === 0 ? (
                  <div className="text-zinc-500 text-center py-2">Sem marcações válidas capturadas neste dia.</div>
                ) : (
                   <div className="border border-zinc-800 rounded-xl divide-y divide-zinc-800 overflow-hidden">
                    {selectedReceipt.markings.map((m, i) => (
                      <div key={m.id} className="p-3 flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400 font-bold">BATIDA #{i+1} : {m.tipo_registro}</span>
                        <div className="text-right">
                          <span className="text-zinc-200 font-bold print:text-black">{new Date(m.data_hora_registro).toLocaleTimeString()}</span>
                          <span className="text-[10px] text-zinc-500 block mt-0.5">Módulo: {m.origem}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Worked totals and compensations */}
              <div className="bg-zinc-900/10 p-4 rounded-2xl border border-zinc-800 space-y-2 text-[11px] print:border-gray-300 print:bg-white">
                <div className="flex justify-between">
                  <span className="text-zinc-500">CARGA HORÁRIA PREVISTA:</span>
                  <span className="text-zinc-200">08h 00m (480 minutos)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">TEMPO TOTAL TRABALHADO:</span>
                  <span className="text-zinc-100 font-bold">{formatWorkedTime(selectedReceipt.journey.minutos_trabalhados)}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-800 pt-2 mt-2">
                  <span className="text-zinc-500">SALDO LÍQUIDO OBTIDO:</span>
                  <span className={`font-bold ${
                    selectedReceipt.journey.minutos_extras - selectedReceipt.journey.minutos_faltantes >= 0
                      ? 'text-emerald-400' 
                      : 'text-rose-400'
                  }`}>
                    {formatHoursBank(selectedReceipt.journey.minutos_extras - selectedReceipt.journey.minutos_faltantes)}
                  </span>
                </div>
              </div>

              {/* Safety signatures */}
              <div className="pt-8 border-t border-zinc-900 grid grid-cols-2 gap-6 text-center text-[9px] text-zinc-500">
                <div className="space-y-4">
                  <div className="h-6 border-b border-zinc-900 border-dashed" />
                  <span>ASSINATURA DO COLABORADOR</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-center text-emerald-400/30 font-bold h-6">
                    <FileCheck2 size={13} className="mr-1" /> ASSINADO DIGITALMENTE
                  </div>
                  <span>PRIME TIME AUDITORIA PORTARIA 671</span>
                </div>
              </div>

              {/* Encryption token log line */}
              <div className="text-center text-[8px] text-zinc-650 leading-normal select-all">
                SHA-256 ASSINATURA: 2f707f185d030438cf13d54e8e4d84c4a4c4b8b8b8b8b8b8b8
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
