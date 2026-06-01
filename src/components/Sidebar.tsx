/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../store/AppContext';
import { 
  Clock, 
  History, 
  FileText, 
  UploadCloud, 
  User, 
  Users, 
  Calendar, 
  CheckSquare, 
  BarChart3, 
  LogOut, 
  Sparkles
} from 'lucide-react';
import { PrimeTimeLogo } from './PrimeTimeLogo';

interface SidebarProps {
  currentRoute: string;
  onRouteChange: (route: string) => void;
  isOpenOnMobile: boolean;
  setIsOpenOnMobile: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentRoute, 
  onRouteChange, 
  isOpenOnMobile, 
  setIsOpenOnMobile 
}) => {
  const { user, logout } = useApp();

  if (!user) return null;

  const menuItems = [
    { id: 'dashboard', label: 'Monitor Geral', icon: Clock, roles: ['ADMIN', 'GESTOR', 'COLABORADOR'] },
    { id: 'history', label: 'Banco de Horas', icon: History, roles: ['ADMIN', 'GESTOR', 'COLABORADOR'] },
    { id: 'adjustments', label: 'Solicitações', icon: FileText, roles: ['ADMIN', 'GESTOR', 'COLABORADOR'] },
    { id: 'upload', label: 'Atestados Médicos', icon: UploadCloud, roles: ['ADMIN', 'GESTOR', 'COLABORADOR'] },
    { id: 'profile', label: 'Meu Perfil', icon: User, roles: ['ADMIN', 'GESTOR', 'COLABORADOR'] },
  ];

  const adminItems = [
    { id: 'admin-approvals', label: 'Aprovações Pendentes', icon: CheckSquare, roles: ['ADMIN', 'GESTOR'] },
    { id: 'admin-reports', label: 'Relatórios & Export', icon: BarChart3, roles: ['ADMIN', 'GESTOR'] },
    { id: 'admin-users', label: 'Gestão de Usuários', icon: Users, roles: ['ADMIN'] },
    { id: 'admin-shifts', label: 'Turnos e Regras', icon: Calendar, roles: ['ADMIN'] },
  ];

  const handleNav = (route: string) => {
    onRouteChange(route);
    setIsOpenOnMobile(false);
  };

  const getBadgeColor = (perfil: string) => {
    switch (perfil) {
      case 'ADMIN': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'GESTOR': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default: return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpenOnMobile && (
        <div 
          onClick={() => setIsOpenOnMobile(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Main Sidebar Panel */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#0D0D0D] border-r border-zinc-800/80 
        flex flex-col transform md:translate-x-0 transition-transform duration-300 ease-out
        ${isOpenOnMobile ? 'translate-x-0' : '-translate-x-full md:relative md:flex'}
      `}>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-800/80 bg-[#0D0D0D]">
          <PrimeTimeLogo size={34} showText={true} />
        </div>

        {/* User Quick Bar */}
        <div className="p-5 border-b border-zinc-800/50 bg-zinc-900/5">
          <div className="flex items-center gap-3.5">
            <img 
              src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'} 
              alt={user.nome}
              referrerPolicy="no-referrer"
              className="h-11 w-11 rounded-xl object-cover border border-zinc-800/80 shadow-md bg-zinc-800"
            />
            <div className="min-w-0 flex-1">
              <span className="text-zinc-200 text-sm font-semibold block truncate leading-tight">
                {user.nome}
              </span>
              <span className="text-zinc-500 text-xs truncate block leading-normal mt-0.5">
                {user.departamento}
              </span>
              <span className={`inline-block text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-md mt-1.5 font-bold ${getBadgeColor(user.perfil)}`}>
                {user.perfil}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation lists */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-7 custom-scrollbar">
          {/* Main User Section */}
          <div className="space-y-1.5">
            <span className="px-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest block mb-2">
              Jornada Pessoal
            </span>
            {menuItems
              .filter(item => item.roles.includes(user.perfil))
              .map(item => {
                const Icon = item.icon;
                const isActive = currentRoute === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`
                      w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                      ${isActive 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[inset_0_1px_1px_rgba(16,185,129,0.05)]' 
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 border border-transparent'
                      }
                    `}
                  >
                    <Icon 
                      size={17} 
                      className={`transition-colors duration-200 group-hover:scale-105 transform ${isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-400'}`} 
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
          </div>

          {/* Admin / HR Section */}
          {adminItems.some(item => item.roles.includes(user.perfil)) && (
            <div className="space-y-1.5">
              <span className="px-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest block mb-2">
                Painel Corporativo
              </span>
              {adminItems
                .filter(item => item.roles.includes(user.perfil))
                .map(item => {
                  const Icon = item.icon;
                  const isActive = currentRoute === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={`
                        w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                        ${isActive 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 border border-transparent'
                        }
                      `}
                    >
                      <Icon 
                        size={17} 
                        className={`transition-colors duration-200 group-hover:scale-105 transform ${isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-400'}`} 
                      />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
            </div>
          )}
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-zinc-800 mt-auto bg-zinc-900/90 backdrop-blur-md">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-rose-400 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/10 transition-all duration-200"
          >
            <LogOut size={17} className="text-zinc-500 group-hover:text-rose-400" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>
    </>
  );
};
