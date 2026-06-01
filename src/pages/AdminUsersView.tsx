/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Usuario, Perfil } from '../types';
import { formatHoursBank, formatCPF } from '../utils/formatters';
import { 
  Users, 
  Plus, 
  Trash2, 
  UserPlus, 
  Edit, 
  X, 
  AlertTriangle, 
  Check, 
  UserCheck2, 
  UserMinus2,
  CalendarCheck2
} from 'lucide-react';

export const AdminUsersView: React.FC = () => {
  const { users, shifts, createUser, updateUser } = useApp();
  
  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Form Fields
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [perfil, setPerfil] = useState<Perfil>('COLABORADOR');
  const [turnoId, setTurnoId] = useState('t1');
  const [departamento, setDepartamento] = useState('');
  const [saldo, setSaldo] = useState<number>(0);
  const [ativo, setAtivo] = useState(true);
  const [avatar, setAvatar] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Open Creator Modal
  const handleOpenCreate = () => {
    setNome('');
    setCpf('');
    setEmail('');
    setPerfil('COLABORADOR');
    setTurnoId(shifts[0]?.id || 't1');
    setDepartamento('');
    setSaldo(0);
    setAtivo(true);
    setAvatar('');
    setErrorMsg(null);
    setModalMode('create');
    setSelectedUserId(null);
    setIsOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: Usuario) => {
    setNome(user.nome);
    setCpf(user.cpf);
    setEmail(user.email);
    setPerfil(user.perfil);
    setTurnoId(user.turnoId);
    setDepartamento(user.departamento);
    setSaldo(user.saldo_banco_horas);
    setAtivo(user.ativo);
    setAvatar(user.avatar || '');
    setErrorMsg(null);
    setModalMode('edit');
    setSelectedUserId(user.id);
    setIsOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nome.trim() || !cpf.trim() || !email.trim() || !departamento.trim()) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nome,
        cpf,
        email,
        perfil,
        turnoId,
        departamento,
        saldo_banco_horas: Number(saldo) || 0,
        ativo,
        avatar: avatar.trim() || undefined
      };

      if (modalMode === 'create') {
        await createUser(payload);
      } else if (selectedUserId) {
        await updateUser(selectedUserId, payload);
      }
      
      setIsOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar colaborador.');
    } finally {
      setSaving(false);
    }
  };

  const toggleUserActiveStatus = async (user: Usuario) => {
    try {
      await updateUser(user.id, { ativo: !user.ativo });
    } catch (err) {
      console.error('Error toggling active status:', err);
    }
  };

  const getPerfilBadge = (perfil: string) => {
    switch (perfil) {
      case 'ADMIN': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'GESTOR': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default: return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Intro Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111113] p-6 rounded-3xl border border-zinc-800">
        <div>
          <h2 className="text-zinc-100 text-xl font-bold tracking-tight text-left">Gestão Integrada de Colaboradores</h2>
          <p className="text-zinc-400 text-sm mt-0.5">Cadastre profissionais, administre permissões corporativas e gerencie saldos contratuais diretamente.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] cursor-pointer shrink-0"
        >
          <UserPlus size={15} />
          <span>Cadastrar Colaborador</span>
        </button>
      </div>

      {/* Main Table view */}
      <div className="bg-[#111113] border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950/40 select-none">
          <span className="text-zinc-200 text-sm font-semibold flex items-center gap-2">
            <Users size={16} className="text-emerald-500" />
            Quadro Geral de Profissionais Ativos
          </span>
          <span className="text-zinc-550 text-xs font-mono">{users.length} Colaboradores listados</span>
        </div>

        <div className="overflow-x-auto select-none">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800/80 text-zinc-500 font-mono text-[10px] uppercase font-bold">
                <th className="p-4 pl-6">Profissional / Identificador</th>
                <th className="p-4">Contato / Departamento</th>
                <th className="p-4 text-center">Permissões</th>
                <th className="p-4">Turno Vinculado</th>
                <th className="p-4 text-center">Saldo Banco</th>
                <th className="p-4 text-center">Acesso</th>
                <th className="p-4 pr-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300 text-xs">
              {users.map(u => {
                const isNegative = u.saldo_banco_horas < 0;
                const activeShift = shifts.find(s => s.id === u.turnoId);

                return (
                  <tr key={u.id} className="hover:bg-zinc-800/10 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <img 
                          src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'} 
                          alt={u.nome}
                          referrerPolicy="no-referrer"
                          className="h-10 w-10 rounded-xl object-cover border border-zinc-800 bg-[#09090B]"
                        />
                        <div>
                          <span className="text-zinc-200 text-sm font-semibold block leading-tight">{u.nome}</span>
                          <span className="text-zinc-500 text-[10px] font-mono leading-none block mt-1">CPF: {u.cpf}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <span className="text-zinc-200 block truncate">{u.email}</span>
                        <span className="text-zinc-500 text-[10px] block mt-0.5">{u.departamento}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded font-bold ${getPerfilBadge(u.perfil)}`}>
                        {u.perfil}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-zinc-400">
                      <span className="flex items-center gap-1">
                        <CalendarCheck2 size={13} className="text-zinc-600" />
                        {activeShift?.nome || '--'}
                      </span>
                    </td>
                    <td className="p-4 text-center font-mono font-semibold">
                      <span className={isNegative ? 'text-rose-400' : 'text-emerald-400'}>
                        {formatHoursBank(u.saldo_banco_horas)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleUserActiveStatus(u)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-mono leading-none font-bold uppercase tracking-wider transition ${
                          u.ativo 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-rose-500/5 hover:text-rose-400 hover:border-rose-500/10 cursor-pointer' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-emerald-500/5 hover:text-emerald-400 hover:border-emerald-500/10 cursor-pointer'
                        }`}
                        title={u.ativo ? 'Clique para desativar acesso' : 'Clique para restaurar acesso'}
                      >
                        {u.ativo ? <UserCheck2 size={11} /> : <UserMinus2 size={11} />}
                        <span>{u.ativo ? 'ATIVO' : 'SUSPENSO'}</span>
                      </button>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 bg-[#09090B] border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 rounded-lg cursor-pointer transition"
                          title="Editar colaborador"
                        >
                          <Edit size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal Window (AnimatePresence substitute) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/85 backdrop-blur-sm" />

          {/* Core box wrapper */}
          <div className="bg-[#111113] border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden relative z-10 shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-[#0D0D0D]">
              <span className="text-zinc-200 text-sm font-semibold flex items-center gap-1.5">
                <Users size={15} className="text-emerald-500" />
                {modalMode === 'create' ? 'Adicionar Novo Colaborador' : 'Editar Dados Cadastrais'}
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

              {/* Grid Name and CPF */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs block mb-1.5 font-bold font-mono">Nome do Profissional</label>
                  <input
                    type="text"
                    placeholder="Nome completo CLT"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-xs w-full focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 text-xs block mb-1.5 font-bold font-mono">CPF</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                    disabled={modalMode === 'edit'}
                    className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-zinc-300 text-xs w-full focus:outline-none focus:border-emerald-500 font-mono disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Grid Email and Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs block mb-1.5 font-bold font-mono">E-mail Corporativo</label>
                  <input
                    type="email"
                    placeholder="colaborador@primetime.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-xs w-full focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 text-xs block mb-1.5 font-bold font-mono">Departamento</label>
                  <input
                    type="text"
                    placeholder="Ex: Engenharia de Software"
                    value={departamento}
                    onChange={(e) => setDepartamento(e.target.value)}
                    className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-xs w-full focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Parameters Selector Config */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs block mb-1.5 font-bold font-mono">Perfil de Acesso</label>
                  <select
                    value={perfil}
                    onChange={(e) => setPerfil(e.target.value as Perfil)}
                    className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-xs w-full focus:outline-none"
                  >
                    <option value="COLABORADOR">Colaborador (Permissão Standard)</option>
                    <option value="GESTOR">Gestor de Times (RH Hub)</option>
                    <option value="ADMIN">Administrador Geral</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 text-xs block mb-1.5 font-bold font-mono">Turno Contratual</label>
                  <select
                    value={turnoId}
                    onChange={(e) => setTurnoId(e.target.value)}
                    className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-xs w-full focus:outline-none"
                  >
                    {shifts.map(s => (
                      <option key={s.id} value={s.id}>{s.nome} ({s.carga_horaria_minutos / 60}h)</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Balance adjusters and avatar parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-zinc-400 text-xs block mb-1.5 font-bold font-mono">Banco de Horas Acumulado (Minutos)</label>
                  <input
                    type="number"
                    placeholder="Apenas números (Ex: 120)"
                    value={saldo}
                    onChange={(e) => setSaldo(Number(e.target.value))}
                    className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-xs w-full focus:outline-none focus:border-emerald-500 font-sans"
                  />
                  <span className="text-[10px] text-zinc-550 block mt-1">Insira saldo positivo (+) em minutos, ou negativo (-) para débitos.</span>
                </div>

                <div>
                  <label className="text-zinc-400 text-xs block mb-1.5 font-bold font-mono">Link Foto de Perfil / Avatar</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="bg-[#09090B] border border-zinc-800 rounded-xl py-2 px-3 text-zinc-200 text-xs w-full focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>
              </div>

              {/* Status active switcher toggle info */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer select-none py-1 text-zinc-300 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                    className="accent-emerald-500 h-4.5 w-4.5 rounded bg-zinc-900"
                  />
                  <span>Conta de Colaborador Habilitada para Login</span>
                </label>
              </div>

              {/* Buttons action toolbar */}
              <div className="flex gap-3 justify-end pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-transparent text-zinc-400 hover:text-zinc-250 text-xs font-semibold"
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
