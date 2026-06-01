/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { SolicitacaoAjuste } from '../types';
import { formatDateOnly, formatDateTime } from '../utils/formatters';
import { 
  FileText, 
  Plus, 
  HelpCircle, 
  X, 
  Check, 
  AlertTriangle,
  History,
  FileCheck2,
  CalendarDays
} from 'lucide-react';

export const AdjustmentsView: React.FC = () => {
  const { user, adjustments, submitAdjustment } = useApp();
  const [isOpenModal, setIsOpenModal] = useState(false);
  
  // New Adjustment Request Form
  const [tipo, setTipo] = useState<any>('ESQUECIMENTO_BATIDA');
  const [dataAlvo, setDataAlvo] = useState('');
  const [horaSugestao, setHoraSugestao] = useState('');
  const [tipoRegistroSugestao, setTipoRegistroSugestao] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA');
  const [descricao, setDescricao] = useState('');
  const [anexoUrl, setAnexoUrl] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!user) return null;

  // Filter requests corresponding to logged-in user
  const myRequests = adjustments
    .filter(a => a.usuario_id === user.id)
    .sort((a, b) => b.data_solicitacao.localeCompare(a.data_solicitacao));

  const handleOpenForm = () => {
    setTipo('ESQUECIMENTO_BATIDA');
    setDataAlvo(new Date().toISOString().split('T')[0]);
    setHoraSugestao('09:00');
    setTipoRegistroSugestao('ENTRADA');
    setDescricao('');
    setAnexoUrl('');
    setErrorMsg(null);
    setIsOpenModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!dataAlvo || !descricao.trim()) {
      setErrorMsg('Por favor, indique a data alvo e forneça uma descrição justificativa do ajuste.');
      return;
    }

    setSubmitting(true);
    try {
      await submitAdjustment({
        tipo_solicitacao: tipo,
        data_alvo: dataAlvo,
        registro_sugestao_hora: tipo === 'ESQUECIMENTO_BATIDA' ? horaSugestao : undefined,
        tipo_registro_sugestao: tipo === 'ESQUECIMENTO_BATIDA' ? tipoRegistroSugestao : undefined,
        descricao,
        anexo_url: anexoUrl.trim() || undefined
      });
      setIsOpenModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao registrar solicitação.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDENTE': return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case 'APROVADO': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      default: return 'bg-rose-500/10 text-rose-400 border border-rose-500/15';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'ESQUECIMENTO_BATIDA': return 'Esquecimento de Batida';
      case 'ATESTADO_MEDICO': return 'Atestado Médico';
      case 'VIAGEM_TRABALHO': return 'Viagem Corporativa';
      default: return 'Compensação Banco';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Upper header action */}
      <div className="flex justify-between items-center bg-[#111113] p-6 rounded-3xl border border-zinc-800">
        <div>
          <h2 className="text-zinc-100 text-xl font-bold tracking-tight text-left">Central de Ajustes & Ausências</h2>
          <p className="text-zinc-400 text-sm mt-0.5 max-w-xl text-left">Crie e acompanhe pedidos de abono de faltas, correções de atrasos ou exclusões retroativas.</p>
        </div>
        <button
          onClick={handleOpenForm}
          className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] cursor-pointer shrink-0"
        >
          <Plus size={15} />
          <span>Solicitar Ajuste</span>
        </button>
      </div>

      {/* Grid displays history list with detail panels */}
      <div className="bg-[#111113] border border-zinc-800 rounded-3xl p-6">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800/80">
          <span className="text-zinc-200 text-sm font-semibold flex items-center gap-2">
            <History size={16} className="text-emerald-500" />
            Minhas Solicitações Registradas
          </span>
          <span className="text-zinc-500 text-xs font-mono">{myRequests.length} total encontradas</span>
        </div>

        {myRequests.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="mx-auto h-9 w-9 text-zinc-700 mb-2.5" />
            <p className="text-zinc-500 text-sm">Nenhuma solicitação de abono computada ainda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myRequests.map((req) => (
              <div 
                key={req.id} 
                className="bg-zinc-900/5 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-800 transition"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900/80 pb-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <h4 className="text-zinc-200 text-sm font-semibold">{getTipoLabel(req.tipo_solicitacao)}</h4>
                      <p className="text-zinc-500 text-[10px] uppercase font-mono mt-0.5">Criado em {formatDateTime(req.data_solicitacao)}</p>
                    </div>
                  </div>
                  
                  <span className={`text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full ${getStatusBadge(req.status)}`}>
                    {req.status}
                  </span>
                </div>

                {/* Info Fields body */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans text-zinc-300">
                  <div className="space-y-1">
                    <span className="text-zinc-500 text-[10px] uppercase font-mono font-bold block leading-none">Data do Fato:</span>
                    <span className="text-zinc-200 block text-[13px] font-mono mt-1">{formatDateOnly(req.data_alvo)}</span>
                  </div>
                  
                  {req.tipo_solicitacao === 'ESQUECIMENTO_BATIDA' && (
                    <div className="space-y-1">
                      <span className="text-zinc-500 text-[10px] uppercase font-mono font-bold block leading-none">Registro Solicitado:</span>
                      <span className="text-zinc-200 block mt-1">
                        <strong className="text-emerald-400 font-mono">{req.tipo_registro_sugestao}</strong> às <strong className="font-mono">{req.registro_sugestao_hora}</strong>
                      </span>
                    </div>
                  )}

                  {req.anexo_url && (
                    <div className="space-y-1">
                      <span className="text-zinc-500 text-[10px] uppercase font-mono font-bold block leading-none">Anexo:</span>
                      <a 
                        href={req.anexo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 font-mono hover:underline block mt-1 font-bold flex items-center gap-1"
                      >
                        <FileCheck2 size={13} /> Visualizar Documento
                      </a>
                    </div>
                  )}
                </div>

                <div className="mt-3.5 bg-[#09090B] p-3 rounded-xl border border-zinc-800/80 text-xs text-zinc-400 font-sans leading-relaxed">
                  <span className="text-zinc-500 font-bold font-mono">JUSTIFICATIVA:</span> {req.descricao}
                </div>

                {/* Manager Review response section */}
                {req.ano_aprovacao_id || req.status !== 'PENDENTE' ? (
                  <div className="mt-3 bg-[#09090B] p-3 rounded-xl border border-zinc-800 w-full text-xs text-zinc-400 flex items-start gap-2.5">
                    <FileCheck2 size={15} className="text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-zinc-200 font-bold">Retorno do RH / Gestor:</p>
                      <p className="text-zinc-500 text-[11px] leading-relaxed mt-0.5">
                        {req.resposta_gestor || 'Solicitação revisada e atualizada no banco de horas corporativo.'}
                      </p>
                    </div>
                  </div>
                ) : null}

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Overlay Creator (AnimatePresence fallback style) */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div onClick={() => setIsOpenModal(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Form Content body wrapper */}
          <div className="bg-[#111113] border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden relative z-10 shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-[#0D0D0D]">
              <span className="text-zinc-300 text-sm font-semibold flex items-center gap-1.5">
                <CalendarDays size={15} className="text-emerald-500" />
                Criar Nova Solicitação
              </span>
              <button onClick={() => setIsOpenModal(false)} className="p-1 rounded/8 text-zinc-500 hover:text-zinc-300">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-rose-400 text-xs flex gap-2 font-medium">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Type select */}
              <div>
                <label className="text-zinc-400 text-xs block mb-1.5 font-bold font-mono">Tipo de Solicitação</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-xs w-full focus:outline-none focus:border-emerald-500 font-sans"
                >
                  <option value="ESQUECIMENTO_BATIDA">Esquecimento de Batida (Ajustar Registro)</option>
                  <option value="ATESTADO_MEDICO">Justificativa de Falta (Atestado Médico)</option>
                  <option value="VIAGEM_TRABALHO">Viagem Corporativa Extra-Sede</option>
                  <option value="COMPENSACAO">Pedido de Compensação de Banco</option>
                </select>
              </div>

              {/* Grid 2 target date and hours */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs block mb-1.5 font-bold font-mono">Data do Fato</label>
                  <input
                     type="date"
                     value={dataAlvo}
                     onChange={(e) => setDataAlvo(e.target.value)}
                     className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-xs w-full focus:outline-none focus:border-emerald-500 font-mono"
                   />
                 </div>
 
                 {tipo === 'ESQUECIMENTO_BATIDA' && (
                   <div>
                     <label className="text-zinc-400 text-xs block mb-1.5 font-bold font-mono">Hora Sugerida</label>
                     <input
                       type="time"
                       value={horaSugestao}
                       onChange={(e) => setHoraSugestao(e.target.value)}
                       className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-xs w-full focus:outline-none focus:border-emerald-500 font-mono"
                     />
                   </div>
                 )}
               </div>

              {tipo === 'ESQUECIMENTO_BATIDA' && (
                <div>
                  <label className="text-zinc-400 text-xs block mb-1.5 font-bold font-mono">Tipo do Registro</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 text-zinc-300 text-xs font-semibold cursor-pointer select-none">
                      <input
                        type="radio" 
                        name="pt_type_sug"
                        checked={tipoRegistroSugestao === 'ENTRADA'}
                        onChange={() => setTipoRegistroSugestao('ENTRADA')}
                        className="accent-emerald-500 h-4 w-4 bg-zinc-900"
                      />
                      <span>ENTRADA</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-zinc-300 text-xs font-semibold cursor-pointer select-none">
                      <input
                        type="radio" 
                        name="pt_type_sug"
                        checked={tipoRegistroSugestao === 'SAIDA'}
                        onChange={() => setTipoRegistroSugestao('SAIDA')}
                        className="accent-emerald-500 h-4 w-4 bg-zinc-900"
                      />
                      <span>SAÍDA</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Link Attachment input */}
              <div>
                <label className="text-zinc-400 text-xs block mb-1.5 font-bold font-mono">Link URL do Documento / Comprovante (Opcional)</label>
                <input
                  type="text"
                  placeholder="https://example.com/atestado.jpg"
                  value={anexoUrl}
                  onChange={(e) => setAnexoUrl(e.target.value)}
                  className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-xs w-full focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-zinc-500 block mt-1 leading-normal">Ou use o menu "Atestados Médicos" no sidebar para testar o painel interativo de OCR!</span>
              </div>

              {/* Justification Textarea block */}
              <div>
                <label className="text-zinc-400 text-xs block mb-1.5 font-bold font-mono">Justificativa Detalhada</label>
                <textarea
                  placeholder="Explique os fatos detalhadamente para avaliação do RH..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={4}
                  className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-xs w-full focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 justify-end pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsOpenModal(false)}
                  className="px-4 py-2 bg-transparent text-zinc-400 hover:text-zinc-200 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-45"
                >
                  {submitting ? 'Registrando...' : 'Enviar Solicitação'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
