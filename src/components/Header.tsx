/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { Menu, Sun, Moon, MapPin, Laptop, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileSidebar }) => {
  const { user, theme, setTheme } = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatClock = (d: Date) => {
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    const ss = d.getSeconds().toString().padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };

  const formatHeaderDate = (d: Date) => {
    return d.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  if (!user) return null;

  return (
    <header className="h-16 border-b border-zinc-800/65 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left side mobile layout controls and greeting */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 -ml-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 md:hidden transition-colors"
          title="Menu de navegação"
        >
          <Menu size={20} />
        </button>

        <div className="hidden sm:block">
          <p className="text-zinc-500 font-medium text-xs uppercase tracking-wider font-mono">
            {formatHeaderDate(currentTime)}
          </p>
        </div>
      </div>

      {/* Center dynamic synchronized clocks */}
      <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800/80 px-4 py-1.5 rounded-2xl">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-zinc-100 font-mono text-sm font-semibold tracking-wider">
          {formatClock(currentTime)}
        </span>
        <span className="text-[10px] text-zinc-500 font-mono border-l border-zinc-800 pl-2">
          BRT (GMT-3)
        </span>
      </div>

      {/* Right side parameters: localization mock, dark mode toggle, security indicators */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-1.5 text-zinc-500 font-mono text-[10px] bg-[#111113] px-3 py-1.5 rounded-xl border border-zinc-800">
          <MapPin size={11} className="text-emerald-500" />
          <span>Sede Corporativa (São Paulo, BR)</span>
        </div>

        {/* Theme mode changer */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2.5 rounded-xl border border-zinc-800 w-10 h-10 bg-zinc-900/20 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-900/80 transition-all duration-200 flex items-center justify-center cursor-pointer"
          title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Live system state badge */}
        <div className="hidden md:flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl text-xs font-semibold">
          <ShieldCheck size={14} />
          <span className="font-mono text-[10px] uppercase font-bold tracking-wider">Autenticado</span>
        </div>
      </div>
    </header>
  );
};
