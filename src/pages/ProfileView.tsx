/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { 
  User, 
  Mail, 
  MapPin, 
  Lock, 
  ShieldAlert, 
  Award, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Sparkles
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, shifts } = useApp();
  
  // Simulated form credentials update
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  // Retrieve user shift details
  const myShift = shifts.find(s => s.id === user.turnoId) || shifts[0];

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setStatusMsg({ type: 'error', text: 'Preencha todos os campos do formulário.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'A confirmação de senha não confere.' });
      return;
    }

    if (newPassword.length < 6) {
      setStatusMsg({ type: 'error', text: 'A nova senha deve possuir no mínimo 6 caracteres.' });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStatusMsg({ type: 'success', text: 'Credencial biométrica atualizada com sucesso!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 800);
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Upper Layout */}
      <div className="bg-[#111113] border border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-bl from-emerald-500/5 to-transparent rounded-bl-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <img 
            src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'} 
            alt={user.nome}
            referrerPolicy="no-referrer"
            className="h-20 w-20 rounded-2xl object-cover border border-zinc-800 shadow-xl"
          />
          <div className="text-center sm:text-left space-y-1">
            <span className="inline-block text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold tracking-wider">
              {user.perfil}
            </span>
            <h2 className="text-zinc-100 text-xl font-bold tracking-tight">{user.nome}</h2>
            <p className="text-zinc-500 text-xs font-mono">{user.departamento} • Colaborador CLT Ativo</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COMPACT INFO SHEET */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Personal info details */}
          <div className="bg-[#111113] border border-zinc-800 rounded-3xl p-6 space-y-5">
            <h3 className="text-zinc-200 text-sm font-semibold tracking-tight pb-3 border-b border-zinc-800/80 flex items-center gap-2">
              <User size={15} className="text-emerald-500" />
              Especificações do Colaborador
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans text-zinc-300">
              <div className="space-y-1.5 p-3.5 bg-zinc-900/5 border border-zinc-850/30 rounded-2xl">
                <span className="text-zinc-500 text-[9px] uppercase font-mono font-bold block">E-mail de Trabalho</span>
                <span className="text-zinc-200 block truncate flex items-center gap-1">
                  <Mail size={12} className="text-zinc-650" />
                  {user.email}
                </span>
              </div>

              <div className="space-y-1.5 p-3.5 bg-zinc-900/5 border border-zinc-850/30 rounded-2xl">
                <span className="text-zinc-500 text-[9px] uppercase font-mono font-bold block">Documento Identificador</span>
                <span className="text-zinc-200 block font-mono">{user.cpf}</span>
              </div>

              <div className="space-y-1.5 p-3.5 bg-zinc-900/5 border border-zinc-850/30 rounded-2xl">
                <span className="text-zinc-500 text-[9px] uppercase font-mono font-bold block">Identificação Funcional</span>
                <span className="text-zinc-200 block font-mono">MAT-941852</span>
              </div>

              <div className="space-y-1.5 p-3.5 bg-zinc-900/5 border border-zinc-850/30 rounded-2xl">
                <span className="text-zinc-500 text-[9px] uppercase font-mono font-bold block">Unidade Física</span>
                <span className="text-zinc-200 block flex items-center gap-1">
                  <MapPin size={12} className="text-emerald-500" />
                  HQ São Paulo
                </span>
              </div>
            </div>
          </div>

          {/* Card: Shift operational details */}
          {myShift && (
            <div className="bg-[#111113] border border-zinc-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-zinc-200 text-sm font-semibold tracking-tight pb-3 border-b border-zinc-800 flex items-center gap-2">
                <Clock size={15} className="text-emerald-500" />
                Turno & Regras de Tolerância Contratual
              </h3>

              <div className="grid grid-cols-3 gap-3.5 text-center font-mono text-[11px] text-zinc-300">
                <div className="bg-[#09090B] p-3 rounded-2xl border border-zinc-800">
                  <span className="text-zinc-500 text-[9px] uppercase block mb-1">Entrada</span>
                  <span className="text-emerald-400 font-bold text-sm block">{myShift.entrada_esperada}</span>
                </div>
                <div className="bg-[#09090B] p-3 rounded-2xl border border-zinc-800">
                  <span className="text-zinc-500 text-[9px] uppercase block mb-1">Carga de Trabalho</span>
                  <span className="text-zinc-200 font-bold text-sm block">{(myShift.carga_horaria_minutos / 60)} HORAS</span>
                </div>
                <div className="bg-[#09090B] p-3 rounded-2xl border border-zinc-800">
                  <span className="text-zinc-500 text-[9px] uppercase block mb-1">Tolerância</span>
                  <span className="text-amber-500 font-bold text-xs block">±{myShift.tolerancia_minutos} MINUTOS</span>
                </div>
              </div>

              <div className="bg-zinc-900/5 p-3 rounded-2xl border border-zinc-800/80 flex items-start gap-3 mt-1.5">
                <ShieldAlert size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-zinc-400 leading-normal text-left">
                  Este registro está vinculado à regra corporativa <strong className="text-zinc-200 font-medium">{myShift.nome}</strong>. Variações que extrapolam a tolerância de {myShift.tolerancia_minutos} minutos são computadas no banco sob regime de acréscimo ou desconto.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SECURITY ADJUSTMENT DRAWER */}
        <div className="lg:col-span-5">
          <div className="bg-[#111113] border border-zinc-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-zinc-200 text-sm font-semibold tracking-tight pb-3 border-b border-zinc-805/85 flex items-center gap-2">
              <Lock size={15} className="text-emerald-500" />
              Segurança & Credenciais
            </h3>

            <p className="text-zinc-400 text-xs leading-relaxed">
              Mantenha sua senha de presença atualizada. Ela é requerida sempre que você registrar pontos em displays de controle presenciais.
            </p>

            {statusMsg && (
              <div className={`p-3 rounded-xl flex gap-2 text-xs font-semibold ${
                statusMsg.type === 'success' 
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
              }`}>
                {statusMsg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-3.5">
              <div>
                <label className="text-zinc-500 text-[10px] uppercase font-mono font-bold block mb-1.5">Senha de Presença Atuante</label>
                <input
                  type="password"
                  placeholder="******"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="bg-[#09090B] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-300 text-xs w-full focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-zinc-500 text-[10px] uppercase font-mono font-bold block mb-1.5">Nova Senha de Presença</label>
                <input
                  type="password"
                  placeholder="Mínimo 6 dígitos"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-[#09090B] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-300 text-xs w-full focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-zinc-500 text-[10px] uppercase font-mono font-bold block mb-1.5">Confirme a Nova Senha</label>
                <input
                  type="password"
                  placeholder="Repita a senha sugerida"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-[#09090B] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-300 text-xs w-full focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-2.5 rounded-xl font-bold text-xs tracking-wider transition shadow-[0_0_15px_rgba(16,185,129,0.1)] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                {loading ? <Clock size={13} className="animate-spin" /> : <Sparkles size={13} />}
                <span>Atualizar Credenciais</span>
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
};
