/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Turno } from '../types';
import { 
  Calendar, 
  Plus, 
  Clock, 
  Settings, 
  X, 
  AlertTriangle, 
  Check, 
  Edit, 
  ShieldAlert
} from 'lucide-react';

export const AdminShiftsView: React.FC = () => {
  const { shifts, createShift, updateShift } = useApp();
  
  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  // Form Fields
  const [nome, setNome] = useState('');
  const [tolerancia, setTolerancia] = useState<number>(10);
  const [cargaMinutos, setCargaMinutos] = useState<number>(480);
  const [entrada, setEntrada] = useState('08:00');
  const [saida, setSaida] = useState('17:00');
  const [almocoInicio, setAlmocoInicio] = useState('12:00');
  const [almocoFim, setAlmocoFim] = useState('13:00');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setNome('');
    setTolerancia(10);
    setCargaMinutos(480);
    setEntrada('08:00');
    setSaida('17:00');
    setAlmocoInicio('12:00');
    setAlmocoFim('13:00');
    setErrorMsg(null);
    setModalMode('create');
    setSelectedShiftId(null);
    setIsOpen(true);
  };

  const handleOpenEdit = (shift: Turno) => {
    setNome(shift.nome);
    setTolerancia(shift.tolerancia_minutos);
    setCargaMinutos(shift.carga_horaria_minutos);
    setEntrada(shift.entrada_esperada);
    setSaida(shift.saida_esperada);
    setAlmocoInicio(shift.almoco_inicio || '');
    setAlmocoFim(shift.almoco_fim || '');
    setErrorMsg(null);
    setModalMode('edit');
    setSelectedShiftId(shift.id);
    setIsOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nome.trim() || !entrada.trim() || !saida.trim()) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nome,
        tolerancia_minutos: Number(tolerancia) || 0,
        carga_horaria_minutos: Number(cargaMinutos) || 480,
        entrada_esperada: entrada,
        saida_esperada: saida,
        almoco_inicio: almocoInicio || undefined,
        almoco_fim: almocoFim || undefined
      };

      if (modalMode === 'create') {
        await createShift(payload);
      } else if (selectedShiftId) {
        await updateShift(selectedShiftId, payload);
      }
      
      setIsOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar turno.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Intro Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111113] p-6 rounded-3xl border border-zinc-800">
        <div>
          <h2 className="text-zinc-100 text-xl font-bold tracking-tight text-left font-sans">Configuração de Turnos & Tolerâncias</h2>
          <p className="text-zinc-400 text-sm mt-0.5">Defina turnos de trabalho sob portaria federal, parametrizando regimes de ponto, extras e atrasos.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] cursor-pointer shrink-0"
        >
          <Plus size={15} />
          <span>Criar Novo Turno</span>
        </button>
      </div>

      {/* Grid of Shifts Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shifts.map(s => (
          <div key={s.id} className="bg-[#111113] border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between shadow-sm relative group hover:border-zinc-700 transition">
            
            <div>
              <div className="flex justify-between items-start border-b border-zinc-800 pb-3 mb-4">
                <div>
                  <h4 className="text-zinc-200 text-sm font-semibold tracking-tight">{s.nome}</h4>
                  <span className="text-[10px] text-zinc-500 font-mono">REGISTRO: {s.id.toUpperCase()}</span>
                </div>
                
                <button
                  onClick={() => handleOpenEdit(s)}
                  className="p-1.5 hover:bg-zinc-800 w-8 h-8 rounded-lg border border-zinc-800 bg-[#09090B] text-zinc-400 hover:text-emerald-400 transition flex items-center justify-center cursor-pointer"
                  title="Configurar turno"
                >
                  <Edit size={13} />
                </button>
              </div>

              {/* Data grids */}
              <div className="grid grid-cols-2 gap-4 pb-4 font-mono text-[11px] text-zinc-450 border-b border-zinc-800/60">
                <div className="space-y-1">
                  <span className="text-zinc-500 text-[9px] uppercase font-bold block">Entrada</span>
                  <span className="text-zinc-100 text-xs font-black flex items-center gap-1.5">
                    <Clock size={12} className="text-emerald-500" />
                    {s.entrada_esperada}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-zinc-500 text-[9px] uppercase font-bold block">Intervalo (Saída)</span>
                  <span className="text-zinc-100 text-xs font-black flex items-center gap-1.5">
                    <Clock size={12} className="text-rose-400" />
                    {s.almoco_inicio || '00:00'}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-zinc-500 text-[9px] uppercase font-bold block">Retorno</span>
                  <span className="text-zinc-100 text-xs font-black flex items-center gap-1.5">
                    <Clock size={12} className="text-emerald-400" />
                    {s.almoco_fim || '00:00'}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-zinc-500 text-[9px] uppercase font-bold block">Saída Final</span>
                  <span className="text-zinc-100 text-xs font-black flex items-center gap-1.5">
                    <Clock size={12} className="text-amber-500" />
                    {s.saida_esperada}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 pb-1 font-mono text-[11px] text-zinc-450">
                <div className="space-y-1">
                  <span className="text-zinc-550 text-[9px] uppercase font-bold block">Carga Diária</span>
                  <span className="text-zinc-250 font-bold block">{(s.carga_horaria_minutos / 60)} HORAS ({s.carga_horaria_minutos} min)</span>
                </div>

                <div className="space-y-1">
                  <span className="text-zinc-550 text-[9px] uppercase font-bold block">Tolerância Gás</span>
                  <span className="text-amber-500 font-bold block">±{s.tolerancia_minutos} minutos</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-zinc-800/60 flex items-center gap-2">
              <ShieldAlert size={14} className="text-zinc-600 shrink-0" />
              <span className="text-[10px] text-zinc-500 tracking-tight leading-normal">
                Regulamentação CLT artigo 58 § 1º (Variação de 5 minutos, limite de 10 minutos diários).
              </span>
            </div>

          </div>
        ))}
      </div>

      {/* Editor Modal View */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/85 backdrop-blur-sm animate-fade-in" />

          {/* Form wrapper */}
          <div className="bg-[#111113] border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden relative z-10 shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-[#0D0D0D]">
              <span className="text-zinc-200 text-sm font-semibold flex items-center gap-1.5">
                <Settings size={15} className="text-emerald-500" />
                {modalMode === 'create' ? 'Configurar Ajuste de Turno' : 'Processar Ajuste de Turno'}
              </span>
              <button onClick={() => setIsOpen(false)} className="p-1 text-zinc-500 hover:text-zinc-300">
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

              {/* Shift Name */}
              <div>
                <label className="text-zinc-400 text-xs block mb-1.5 font-bold font-mono">Nome da Regra / Turno</label>
                <input
                  type="text"
                  placeholder="Ex: Comercial Administrativo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-xs w-full focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Grid times expected */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs block mb-1.5 font-bold font-mono">Entrada Prevista</label>
                  <input
                    type="time"
                    value={entrada}
                    onChange={(e) => setEntrada(e.target.value)}
                    className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-xs w-full focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 text-xs block mb-1.5 font-bold font-mono">Saída Prevista</label>
                  <input
                    type="time"
                    value={saida}
                    onChange={(e) => setSaida(e.target.value)}
                    className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-xs w-full focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Grid lunch interval */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs block mb-1.5 font-bold font-mono">Início Almoço (Saída)</label>
                  <input
                    type="time"
                    value={almocoInicio}
                    onChange={(e) => setAlmocoInicio(e.target.value)}
                    className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-xs w-full focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 text-xs block mb-1.5 font-bold font-mono">Retorno Almoço (Entrada)</label>
                  <input
                    type="time"
                    value={almocoFim}
                    onChange={(e) => setAlmocoFim(e.target.value)}
                    className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-xs w-full focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Grid Workloads and Tolerances */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs block mb-1.5 font-bold font-mono">Carga de Trabalho (Minutos)</label>
                  <input
                     type="number"
                     placeholder="Ex: 480"
                     value={cargaMinutos}
                     onChange={(e) => setCargaMinutos(Number(e.target.value))}
                     className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-xs w-full focus:outline-none focus:border-emerald-500 font-mono"
                   />
                   <span className="text-[9px] text-zinc-550 block mt-1">480 minutos correspondem a 8h de expediente CLT ordinário.</span>
                 </div>
 
                 <div>
                   <label className="text-zinc-400 text-xs block mb-1.5 font-bold font-mono">Tolerância Geral (Minutos)</label>
                   <input
                     type="number"
                     placeholder="Ex: 10"
                     value={tolerancia}
                     onChange={(e) => setTolerancia(Number(e.target.value))}
                     className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-xs w-full focus:outline-none focus:border-emerald-500 font-mono"
                   />
                   <span className="text-[9px] text-zinc-550 block mt-1">Variações abaixo desta margem não afetam o banco de horas.</span>
                 </div>
               </div>
 
               {/* Action Toolbar */}
               <div className="flex gap-3 justify-end pt-3 border-t border-zinc-800 animate-fade-in">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-transparent text-zinc-400 hover:text-zinc-200 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
                >
                  <Check size={13} />
                  <span>{saving ? 'Gravando...' : 'Salvar Alterações'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
