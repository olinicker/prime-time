/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { formatCPF } from '../utils/formatters';
import { 
  Lock, 
  User, 
  Mail, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCcw, 
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import { PrimeTimeLogo } from './PrimeTimeLogo';

export const LoginOverlay: React.FC = () => {
  const { login, recoverPassword, isLoading } = useApp();
  
  // Auth view routing states: 'login' | 'recover'
  const [authMode, setAuthMode] = useState<'login' | 'recover'>('login');
  
  // Login input states
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Recovery input states
  const [recEmail, setRecEmail] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  // General submit operations
  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!cpf.trim() || !password.trim()) {
      setLoginError('Por favor, informe seu CPF e senha corporativa de acesso.');
      return;
    }

    try {
      await login(cpf, password);
    } catch (err: any) {
      setLoginError(err.message || 'Falha de login.');
    }
  };

  const handleSubmitRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    setRecoveryMessage(null);

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(recEmail)) {
      setRecoveryError('Por favor, insira um endereço de e-mail corporativo válido.');
      return;
    }

    try {
      const response = await recoverPassword(recEmail);
      setRecoveryMessage(response.message);
      setRecEmail('');
    } catch (err: any) {
      setRecoveryError(err.message || 'Erro ao processar envio.');
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-4 relative overflow-hidden select-none">
      
      {/* Decorative emerald abstract glows as seen in Stripe UI */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-[130px]" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-emerald-500/5 blur-[130px]" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Logo and Greeting Header */}
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <PrimeTimeLogo size={62} />
          <div>
            <h1 className="text-zinc-100 text-2xl font-black tracking-tight uppercase leading-none">PRIME TIME</h1>
            <p className="text-zinc-500 text-xs font-mono font-bold tracking-widest mt-1.5 uppercase">Controle de Jornada</p>
          </div>
        </div>

        {/* Action Panel Container */}
        <div className="bg-[#111113] border border-zinc-800 w-full rounded-2xl p-6 shadow-xl">
          
          {/* LOGIN SCREEN VIEW */}
          {authMode === 'login' && (
            <form onSubmit={handleSubmitLogin} className="space-y-4">
              <div className="border-b border-zinc-800 pb-3 mb-1">
                <h3 className="text-zinc-200 text-sm font-semibold">Acesse seu Espelho de Ponto</h3>
                <p className="text-zinc-500 text-[11px] mt-0.5">Identifique-se com suas credenciais de segurança corporativa</p>
              </div>

              {loginError && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-start gap-2 text-rose-400 text-xs font-semibold leading-relaxed">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-3">
                {/* CPF input */}
                <div>
                  <label className="text-zinc-500 text-[10px] uppercase font-mono font-bold block mb-1.5">CPF do Profissional</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={(e) => setCpf(formatCPF(e.target.value))}
                      className="w-full bg-[#09090B] border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-zinc-300 text-xs font-mono placeholder:text-zinc-755 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-zinc-500 text-[10px] uppercase font-mono font-bold">Senha Numérica</label>
                    <button
                      type="button"
                      onClick={() => setAuthMode('recover')}
                      className="text-emerald-400 hover:text-emerald-300 text-[10px] font-bold"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input
                      type="password"
                      placeholder="Sua senha corporativa"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#09090B] border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-zinc-350 text-xs placeholder:text-zinc-750 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit trigger button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-3 rounded-2xl font-bold text-xs tracking-wider transition shadow-[0_0_20px_rgba(16,185,129,0.15)] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                {isLoading && (
                  <RefreshCcw size={13} className="animate-spin text-zinc-950" />
                )}
                <span>Login</span>
              </button>
            </form>
          )}

          {/* RECOVERY SENHA VIEW */}
          {authMode === 'recover' && (
            <form onSubmit={handleSubmitRecovery} className="space-y-4">
              <div className="border-b border-zinc-800 pb-3 mb-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="p-1.5 hover:bg-zinc-90 w-8 h-8 rounded-lg border border-zinc-900 bg-zinc-950/20 text-zinc-500 hover:text-zinc-350 transition flex items-center justify-center"
                >
                  <ArrowLeft size={14} />
                </button>
                <div>
                  <h3 className="text-zinc-200 text-sm font-semibold leading-tight">Esqueceu sua senha?</h3>
                  <p className="text-zinc-500 text-[10px] leading-none mt-0.5">Recupere de forma automatizada por e-mail</p>
                </div>
              </div>

              {recoveryError && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-rose-400 text-xs flex gap-2 font-semibold">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{recoveryError}</span>
                </div>
              )}

              {recoveryMessage && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl text-emerald-400 text-xs flex gap-2 font-semibold leading-relaxed">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                  <span>{recoveryMessage}</span>
                </div>
              )}

              <div>
                <label className="text-zinc-500 text-[10px] uppercase font-mono font-bold block mb-1.5">E-mail Corporativo</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-650" />
                  <input
                    type="email"
                    placeholder="voce@empresa.com"
                    value={recEmail}
                    onChange={(e) => setRecEmail(e.target.value)}
                    className="w-full bg-[#09090B] border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-zinc-300 text-xs placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-3 rounded-2xl font-bold text-xs tracking-wider transition shadow-[0_0_20px_rgba(16,185,129,0.15)] flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <span>Enviar Link de Confirmação</span>
              </button>
            </form>
          )}

        </div>

      </div>

    </div>
  );
};
