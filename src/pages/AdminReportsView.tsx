/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { formatHoursBank, formatWorkedTime } from '../utils/formatters';
import { 
  FileSpreadsheet, 
  Search, 
  Printer, 
  DownloadCloud, 
  AlertCircle,
  FileCheck2,
  Cpu,
  Layers,
  Sparkles,
  BarChart4
} from 'lucide-react';

export const AdminReportsView: React.FC = () => {
  const { users, shifts, adjustments } = useApp();
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // simulated export loaders
  const [exporting, setExporting] = useState<string | null>(null);

  // Compute unique depts
  const departments = Array.from(new Set(users.map(u => u.departamento)));

  // Filtered list
  const filteredUsers = users.filter(u => {
    const matchesDept = deptFilter === 'ALL' || u.departamento === deptFilter;
    const matchesSearch = u.nome.toLowerCase().includes(searchTerm.toLowerCase()) || u.cpf.includes(searchTerm);
    return matchesDept && matchesSearch;
  });

  // Calculate totals
  const totalWorkedMin = filteredUsers.reduce((sum, u) => sum + (u.saldo_banco_horas > 0 ? u.saldo_banco_horas : 0), 0);
  const totalDeficitsMin = filteredUsers.reduce((sum, u) => sum + (u.saldo_banco_horas < 0 ? Math.abs(u.saldo_banco_horas) : 0), 0);

  const triggerExport = (format: 'xls' | 'pdf') => {
    setExporting(format);
    setTimeout(() => {
      setExporting(null);
      // alert or nice feedback
      const alertPlaceholder = document.createElement('div');
      alertPlaceholder.className = "fixed bottom-5 right-5 z-50 bg-emerald-500 text-zinc-950 px-5 py-3 rounded-2xl shadow-xl border border-emerald-400 font-bold text-xs flex items-center gap-2 animate-bounce";
      alertPlaceholder.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg> Relatório exportado com sucesso no formato .${format.toUpperCase()}!`;
      document.body.appendChild(alertPlaceholder);
      setTimeout(() => alertPlaceholder.remove(), 2500);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-zinc-100 text-xl font-bold tracking-tight">Relatórios & Exportação da Folha</h2>
          <p className="text-zinc-400 text-sm mt-0.5">Audite o fechamento consolidado mensal do banco de horas de todos os setores e filtre planilhas fiscais.</p>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={() => triggerExport('pdf')}
            disabled={exporting !== null}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-80 w-full md:w-auto border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40"
          >
            <Printer size={13} />
            <span>Imprimir PDFs RH</span>
          </button>

          <button
            onClick={() => triggerExport('xls')}
            disabled={exporting !== null}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40"
          >
            {exporting === 'xls' ? (
              <Cpu size={13} className="animate-spin" />
            ) : (
              <FileSpreadsheet size={13} />
            )}
            <span>{exporting === 'xls' ? 'Exportando...' : 'Exportar Planilha XLS'}</span>
          </button>
        </div>
      </div>

      {/* Aggregate Bento statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-[#111113] border border-zinc-800 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
          <div className="h-10 w-10 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <span className="text-zinc-500 text-[9px] uppercase font-mono font-bold leading-none block">Total Deferidos Acumulado</span>
            <span className="text-zinc-100 font-mono text-base font-black mt-1.5 block">+{formatHoursBank(totalWorkedMin)}</span>
          </div>
        </div>

        <div className="bg-[#111113] border border-zinc-800 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
          <div className="h-10 w-10 bg-rose-500/10 text-rose-450 rounded-xl border border-rose-500/20 flex items-center justify-center shrink-0">
            <AlertCircle size={18} />
          </div>
          <div>
            <span className="text-zinc-500 text-[9px] uppercase font-mono font-bold leading-none block">Horas de Déficits Globais</span>
            <span className="text-zinc-100 font-mono text-base font-black mt-1.5 block">-{formatHoursBank(totalDeficitsMin)}</span>
          </div>
        </div>

        <div className="bg-[#111113] border border-zinc-800 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
          <div className="h-10 w-10 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 flex items-center justify-center shrink-0">
            <BarChart4 size={18} />
          </div>
          <div>
            <span className="text-zinc-500 text-[9px] uppercase font-mono font-bold leading-none block">Aprovação de Ponto</span>
            <span className="text-emerald-400 font-mono text-base font-black mt-1.5 block">100% Homologado</span>
          </div>
        </div>

      </div>

      {/* Interactive table controller and Search bars */}
      <div className="bg-[#111113] border border-zinc-800 rounded-3xl p-5 flex flex-col md:flex-row justify-between gap-4 items-stretch md:items-center">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          {/* Text Input search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Pesquisar por colaborador CLT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#09090B] border border-zinc-800/80 rounded-xl text-zinc-200 text-xs py-2.5 pl-10 pr-4 w-full focus:outline-none focus:border-emerald-500 font-sans"
            />
          </div>

          {/* Department Filter dropdown */}
          <div className="relative">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-[#09090B] border border-zinc-800/80 rounded-xl text-zinc-200 text-xs py-2.5 px-4 w-full cursor-pointer focus:outline-none appearance-none pr-8 font-medium"
            >
              <option value="ALL">Todos os setores</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 h-1 w-1 border-t-4 border-r-4 border-zinc-500 transform rotate-[135deg]" />
          </div>
        </div>
      </div>

      {/* Spreadsheet List */}
      <div className="bg-[#111113] border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950/40 select-none">
          <span className="text-zinc-200 text-sm font-semibold flex items-center gap-2">
            <Layers size={16} className="text-emerald-500" />
            Consolidado Acumulado de Banco de Horas
          </span>
          <span className="text-zinc-500 text-xs font-mono">{filteredUsers.length} registros no filtro ativo</span>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-14">
            <AlertCircle className="mx-auto h-8 w-8 text-zinc-700 mb-2.5" />
            <p className="text-zinc-500 text-sm">Nenhum profissional localizado com os parâmetros definidos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto select-none">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/80 text-zinc-500 font-mono text-[10px] uppercase font-bold">
                  <th className="p-4 pl-6">Profissional Beneficiário</th>
                  <th className="p-4">CPF CLT</th>
                  <th className="p-4">Departamento / Setor de Lotação</th>
                  <th className="p-4 text-center">Acumulado Horas Extras</th>
                  <th className="p-4 text-center">Saldo Consolidado</th>
                  <th className="p-4 pr-6 text-right">Auditoria</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300 text-xs">
                {filteredUsers.map(u => {
                  const isNegative = u.saldo_banco_horas < 0;
                  return (
                    <tr key={u.id} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="p-4 pl-6 font-semibold text-zinc-200">{u.nome}</td>
                      <td className="p-4 font-mono text-zinc-400">{u.cpf}</td>
                      <td className="p-4 text-zinc-400">{u.departamento}</td>
                      <td className="p-4 text-center font-mono">
                        {u.saldo_banco_horas > 0 ? (
                          <span className="text-emerald-400">+{formatWorkedTime(u.saldo_banco_horas)}</span>
                        ) : '00:00'}
                      </td>
                      <td className="p-4 text-center font-mono">
                        <span className={`font-semibold ${isNegative ? 'text-rose-450' : 'text-emerald-400'}`}>
                          {formatHoursBank(u.saldo_banco_horas)}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <span className="text-[10px] font-mono bg-[#09090B] px-2.5 py-1 border border-zinc-800 text-zinc-500 rounded-lg">
                          OK (AUDITADO)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
