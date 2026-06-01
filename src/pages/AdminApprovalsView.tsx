/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { SolicitacaoAjuste } from '../types';
import { formatDateOnly, formatDateTime } from '../utils/formatters';
import { 
  CheckSquare, 
  User, 
  HelpCircle, 
  X, 
  Check, 
  AlertTriangle,
  Send,
  UserCheck2,
  CalendarDays,
  Clock,
  ShieldCheck
} from 'lucide-react';

export const AdminApprovalsView: React.FC = () => {
  const { 
    adjustments, 
    users, 
    approveAdjustment, 
    rejectAdjustment, 
    addManualMarking 
  } = useApp();

  // Dialog reviews states
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manual marking states
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualUser, setManualUser] = useState('');
  const [manualDate, setManualDate] = useState('');
  const [manualTime, setManualTime] = useState('');
  const [manualType, setManualType] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA');
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSuccess, setManualSuccess] = useState<boolean>(false);

  // Filter requests
  const pendingRequests = adjustments.filter(a => a.status === 'PENDENTE');
  const historicalRequests = adjustments.filter(a => a.status !== 'PENDENTE');

  const handleOpenReview = (id: string) => {
    setActiveReviewId(id);
    setFeedback('');
    setErrorMsg(null);
  };

  const handleApprove = async () => {
    if (!activeReviewId) return;
    setErrorMsg(null);
    try {
      await approveAdjustment(activeReviewId, feedback.trim() || 'Solicitação de justificativa de ponto aprovada pelo RH.');
      setActiveReviewId(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao aprovar solicitação.');
    }
  };

  const handleReject = async () => {
    if (!activeReviewId) return;
    setErrorMsg(null);
    try {
      await rejectAdjustment(activeReviewId, feedback.trim() || 'Solicitação recusada pelo avaliador de jornada.');
      setActiveReviewId(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao rejeitar solicitação.');
    }
  };

  const handleManualPunchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);
    setManualSuccess(false);

    if (!manualUser || !manualDate || !manualTime) {
      setManualError('Por favor, preencha todos os campos do formulário.');
      return;
    }

    try {
      await addManualMarking(manualUser, manualDate, manualTime, manualType);
      setManualSuccess(true);
      setManualUser('');
      setManualDate('');
      setManualTime('');
      // close after delay
      setTimeout(() => {
        setIsManualOpen(false);
        setManualSuccess(false);
      }, 1500);
    } catch (err: any) {
      setManualError(err.message || 'Erro ao cadastrar marcação manual.');
    }
  };

  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.nome || 'Colaborador Desconhecido';
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'ESQUECIMENTO_BATIDA': return 'Esquecimento de Batida';
      case 'ATESTADO_MEDICO': return 'Atestado Médico CLT';
      case 'VIAGEM_TRABALHO': return 'Viagem a Serviço';
      default: return 'Compensação Banco';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APROVADO': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      default: return 'bg-rose-500/10 text-rose-400 border border-rose-500/15';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Intro Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111113] p-6 rounded-3xl border border-zinc-800">
        <div>
          <h2 className="text-zinc-100 text-xl font-bold tracking-tight text-left">Central de Homologação (Módulo RH)</h2>
          <p className="text-zinc-400 text-sm mt-0.5">Analise atestados, avalie esquecimentos de batidas ou registre batidas manuais retroativas homologadas.</p>
        </div>
        <button
          onClick={() => {
            setManualUser(users[0]?.id || '');
            setManualDate(new Date().toISOString().split('T')[0]);
            setManualTime('09:00');
            setManualType('ENTRADA');
            setManualError(null);
            setManualSuccess(false);
            setIsManualOpen(true);
          }}
          className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] cursor-pointer shrink-0"
        >
          <CalendarDays size={15} />
          <span>Inserir Batida Manual</span>
        </button>
      </div>

      {/* Grid: Pending requests vs historical audit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: PENDING AUDIT */}
        <div className="lg:col-span-8 bg-[#111113] border border-zinc-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-zinc-200 text-sm font-semibold border-b border-zinc-800/80 pb-3 flex items-center gap-2">
            <CheckSquare size={16} className="text-emerald-500" />
            Solicitações Aguardando Homologação ({pendingRequests.length})
          </h3>

          {pendingRequests.length === 0 ? (
            <div className="text-center py-14">
              <ShieldCheck className="mx-auto h-9 w-9 text-emerald-500/60 mb-2.5 animate-pulse" />
              <p className="text-zinc-200 text-sm font-bold">Fila de Pendências Zerada!</p>
              <p className="text-zinc-500 text-xs mt-1">Todos os pedidos de ajustes de ponto foram saneados pelo RH.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map(req => (
                <div key={req.id} className="w-full border border-zinc-800/80 bg-zinc-900/5 rounded-2xl p-5 hover:border-zinc-800 transition">
                  <div className="flex justify-between items-start border-b border-zinc-800/80 pb-3 mb-3">
                    <div>
                      <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">{getTipoLabel(req.tipo_solicitacao)}</span>
                      <h4 className="text-zinc-205 text-sm font-semibold mt-0.5">{getUserName(req.usuario_id)}</h4>
                    </div>
                    <span className="text-[9px] font-mono bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                      PENDENTE
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-sans text-zinc-300 pb-3">
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase font-mono font-bold block">Data Solicitada</span>
                      <span className="text-zinc-200 block text-[13px] font-mono mt-1">{formatDateOnly(req.data_alvo)}</span>
                    </div>

                    {req.tipo_solicitacao === 'ESQUECIMENTO_BATIDA' && (
                      <div>
                        <span className="text-zinc-500 text-[10px] uppercase font-mono font-bold block">Ajuste Sugerido</span>
                        <span className="text-zinc-200 block mt-1 font-mono">
                          <strong className="text-emerald-400 font-bold">{req.tipo_registro_sugestao}</strong> às <strong className="font-bold">{req.registro_sugestao_hora}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {req.anexo_url && (
                    <div className="py-2.5">
                      <a 
                        href={req.anexo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 font-mono text-xs hover:underline font-bold flex items-center gap-1"
                      >
                        [Ver Documento Anexo]
                      </a>
                    </div>
                  )}

                  <div className="bg-[#09090B] p-3 rounded-xl border border-zinc-800 text-xs text-zinc-400 leading-normal mb-4">
                    <span className="text-zinc-500 font-bold font-mono"> justificativa:</span> {req.descricao}
                  </div>

                  <div className="flex gap-2.5 justify-end">
                    <button
                      onClick={() => handleOpenReview(req.id)}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Processar Solicitação
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: HISTORICAL LOGS */}
        <div className="lg:col-span-4 bg-[#111113] border border-zinc-800 rounded-3xl p-6 space-y-4">
          <h3 className="text-zinc-300 text-sm font-semibold border-b border-zinc-800/80 pb-3 flex items-center gap-2">
            <Clock size={15} className="text-zinc-500" />
            Logs de Saneamento Recentes
          </h3>

          {historicalRequests.length === 0 ? (
            <div className="text-zinc-500 text-center py-6 text-xs font-mono">Nenhum log anterior.</div>
          ) : (
            <div className="space-y-3.5 max-h-[450px] overflow-y-auto custom-scrollbar pr-1">
              {historicalRequests.map(req => (
                <div key={req.id} className="bg-zinc-900/5 border border-zinc-800/60 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-200 font-semibold text-xs truncate max-w-[140px]">{getUserName(req.usuario_id)}</span>
                    <span className={`text-[8px] font-mono uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${getStatusBadge(req.status)}`}>
                      {req.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-450 space-y-0.5 font-mono">
                    <p>Tipo: {getTipoLabel(req.tipo_solicitacao)}</p>
                    <p>Data Alvo: {formatDateOnly(req.data_alvo)}</p>
                  </div>
                  {req.resposta_gestor && (
                    <p className="text-[10px] text-zinc-500 italic mt-1 bg-zinc-950/40 p-1.5 rounded border border-zinc-850/40 truncate">
                      "{req.resposta_gestor}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Review Dialog modal overlay */}
      {activeReviewId && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div onClick={() => setActiveReviewId(null)} className="fixed inset-0 bg-black/85 backdrop-blur-sm" />

          {/* review form box */}
          <div className="bg-[#111113] border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden relative z-10 shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-800 flex justify-between bg-[#0D0D0D]">
              <span className="text-zinc-350 text-xs font-bold font-mono">PAINEL DE AVALIAÇÃO CONTRATUAL</span>
              <button onClick={() => setActiveReviewId(null)} className="p-1 text-zinc-550 hover:text-white">
                <X size={15} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-rose-400 text-xs flex gap-2 font-semibold">
                  <AlertTriangle size={15} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="text-zinc-500 text-[10px] uppercase font-mono font-bold block mb-1.5">Feedback de Retorno / Parecer Técnico</label>
                <textarea
                  placeholder="Justifique o deferimento ou indeferimento da solicitação do colaborador..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-xs w-full focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleReject}
                  className="py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <X size={13} />
                  <span>Indeferir / Recusar</span>
                </button>
                
                <button
                  onClick={handleApprove}
                  className="py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Check size={13} />
                  <span>Deferir / Aprovar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual injection modal overlay */}
      {isManualOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div onClick={() => setIsManualOpen(false)} className="fixed inset-0 bg-black/85 backdrop-blur-sm" />

          {/* Form wrapper */}
          <div className="bg-[#111113] border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden relative z-10 shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-[#0D0D0D]">
              <span className="text-zinc-200 text-sm font-semibold flex items-center gap-1.5">
                <Clock size={15} className="text-emerald-500" />
                Registrar Ponto Manual Retroativo
              </span>
              <button onClick={() => setIsManualOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleManualPunchSubmit} className="p-6 space-y-4">
              {manualError && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-rose-400 text-xs flex gap-2 font-medium">
                  <AlertTriangle size={15} />
                  <span>{manualError}</span>
                </div>
              )}

              {manualSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-emerald-400 text-xs flex gap-2 font-semibold">
                  <CheckSquare size={15} />
                  <span>Marcação injetada no banco corporativo!</span>
                </div>
              )}

              {/* Select User list dropdown */}
              <div>
                <label className="text-zinc-400 text-xs block mb-1.5 font-bold font-mono">Colaborador Beneficiário</label>
                <select
                  value={manualUser}
                  onChange={(e) => setManualUser(e.target.value)}
                  className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-xs w-full focus:outline-none"
                >
                  <option value="">Selecione o profissional...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.nome} ({u.departamento})</option>
                  ))}
                </select>
              </div>

              {/* Grid date and hour */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs block mb-1.5 font-bold font-mono">Data do Ponto</label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-xs w-full focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 text-xs block mb-1.5 font-bold font-mono">Horário Registro</label>
                  <input
                    type="time"
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-xs w-full focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Radio selection */}
              <div>
                <label className="text-zinc-400 text-xs block mb-1.5 font-bold font-mono">Tipo do Registro</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-zinc-300 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      checked={manualType === 'ENTRADA'}
                      onChange={() => setManualType('ENTRADA')}
                      className="accent-emerald-500 h-4 w-4 bg-zinc-900"
                    />
                    <span>ENTRADA</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-zinc-300 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      checked={manualType === 'SAIDA'}
                      onChange={() => setManualType('SAIDA')}
                      className="accent-emerald-500 h-4 w-4 bg-zinc-900"
                    />
                    <span>SAÍDA</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2.5 justify-end pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsManualOpen(false)}
                  className="px-3 py-2 bg-transparent text-zinc-450 hover:text-white text-xs font-semibold"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  <Send size={12} />
                  <span>Cadastrar Ponto</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
