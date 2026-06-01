/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useApp } from '../store/AppContext';
import { 
  UploadCloud, 
  FileText, 
  Activity, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ScanEye,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export const AtestadoView: React.FC = () => {
  const { user, submitAdjustment } = useApp();
  const [fileSelected, setFileSelected] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  
  // States of simulated scanning
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'saved'>('idle');
  const [scanProgress, setScanProgress] = useState<number>(0);
  
  // Parsed OCR Mock fields
  const [parsedData, setParsedData] = useState<{
    clinica: string;
    medico: string;
    crm: string;
    cid?: string;
    diasAfastamento: number;
    dataEmissao: string;
    motivo: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  // File Select handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setupFileSim(e.target.files[0].name, e.target.files[0].size);
    }
  };

  const setupFileSim = (name: string, size: number) => {
    setFileName(name);
    // Format size
    const mb = (size / (1024 * 1024)).toFixed(2);
    setFileSize(`${mb} MB`);
    setFileSelected(true);
    setScanStatus('idle');
    setParsedData(null);
  };

  // Drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setupFileSim(e.dataTransfer.files[0].name, e.dataTransfer.files[0].size);
    }
  };

  // Fast autofill mock test file
  const loadMockFileAtestado = () => {
    setupFileSim('atestado_odontologico_conselho_regional.pdf', 1250000);
  };

  // Perform Simulated Vision OCR Analysis
  const triggerOcrScanning = () => {
    setScanStatus('scanning');
    setScanProgress(0);
    
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanStatus('success');
          // Autofill simulated structured medical points
          setParsedData({
            clinica: 'HOSPITAL SÃO LUIZ S.A.',
            medico: 'Doutor Renato Guimarães',
            crm: 'CRM-SP 124.958',
            cid: 'ICD-10: K05 (Gengivite e doenças periodontais)',
            diasAfastamento: 2,
            dataEmissao: new Date().toISOString().split('T')[0],
            motivo: 'Procedimento cirúrgico odontológico sob anestesia local. Recomendado repouso absoluto por 48 horas.'
          });
          return 100;
        }
        return prev + 12; // tick progress
      });
    }, 150);
  };

  // Save the parsed data as an official adjustment request in AppContext
  const handleSaveParsedAtestado = async () => {
    if (!parsedData) return;
    setScanStatus('scanning'); // show loading state
    
    try {
      await submitAdjustment({
        tipo_solicitacao: 'ATESTADO_MEDICO',
        data_alvo: parsedData.dataEmissao,
        descricao: `[ENVIO AUTOMÁTICO VIA IA SCANNER]\n\nHospital: ${parsedData.clinica}\nMédico: ${parsedData.medico} (${parsedData.crm})\nCID: ${parsedData.cid || 'Não informado'}\nPeríodo: ${parsedData.diasAfastamento} dias de afastamento.\n\nJustificativa: ${parsedData.motivo}`,
        anexo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200' // mock file attachment preview
      });
      setScanStatus('saved');
    } catch (err) {
      console.error('Error saving doctor certificate:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Header Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111113] p-6 rounded-3xl border border-zinc-800">
        <div>
          <h2 className="text-zinc-100 text-xl font-bold tracking-tight text-left">Envio de Atestados Inteligente (IA Scanner)</h2>
          <p className="text-zinc-400 text-sm mt-0.5">Nossa inteligência artificial autogerencia a leitura, análise e classificação de laudos médicos em segundos.</p>
        </div>
        <div className="p-2 sm:p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 font-bold font-mono text-[10px] uppercase tracking-wider shrink-0 flex items-center gap-1.5 align-middle">
          <Activity size={13} />
          <span>Homologação Pronta</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT DROP BLOCK */}
        <div className="lg:col-span-6 space-y-4">
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-zinc-800/80 hover:border-emerald-500/50 bg-zinc-900/30 rounded-3xl p-8 text-center transition duration-300 relative group overflow-hidden"
          >
            {/* Design glow background decorations */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/0 via-emerald-500/0 to-emerald-500/0 group-hover:to-emerald-500/2 transition duration-300" />

            <UploadCloud size={44} className="mx-auto text-zinc-600 group-hover:text-emerald-400 group-hover:scale-105 transition transform duration-300 mb-4" />
            <span className="text-zinc-200 text-sm font-semibold block leading-tight">Escolha ou arraste o seu arquivo</span>
            <span className="text-zinc-500 text-xs mt-1 block">Aceita formatos JPEG, PNG, PDF corporativo de até 10MB</span>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              className="hidden" 
              accept=".pdf,.png,.jpg,.jpeg"
            />
            
            <div className="flex gap-3 justify-center mt-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl border border-zinc-800 transition cursor-pointer"
              >
                Selecionar Arquivo
              </button>
              
              <button
                onClick={loadMockFileAtestado}
                className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl border border-emerald-500/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles size={12} />
                <span>Simular Upload Demo</span>
              </button>
            </div>
          </div>

          {/* If File selected details container */}
          {fileSelected && (
            <div className="bg-[#111113] border border-zinc-800 rounded-3xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-[#09090B] flex items-center justify-center text-emerald-400 shrink-0">
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <span className="text-zinc-200 text-xs font-semibold block truncate">{fileName}</span>
                  <span className="text-zinc-500 text-[10px] font-mono mt-0.5 block">{fileSize}</span>
                </div>
              </div>

              {scanStatus === 'idle' && (
                <button
                  onClick={triggerOcrScanning}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <ScanEye size={13} />
                  <span>Analisar com IA</span>
                </button>
              )}

              {scanStatus === 'scanning' && (
                <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-black">
                  <RefreshCw size={13} className="animate-spin text-emerald-400" />
                  <span>Analisando {scanProgress}%</span>
                </div>
              )}

              {scanStatus === 'success' && (
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 uppercase">
                  Concluído
                </span>
              )}
            </div>
          )}
        </div>

        {/* RIGHT ANALYSIS FIELD BAR */}
        <div className="lg:col-span-6 md:sticky md:top-20">
          
          {/* Default blank placeholder */}
          {scanStatus === 'idle' && !parsedData && (
            <div className="bg-[#111113] border border-zinc-800 rounded-3xl p-8 text-center min-h-[350px] flex flex-col justify-center select-none">
              <ScanEye size={40} className="mx-auto text-zinc-800 mb-3" />
              <h3 className="text-zinc-300 text-sm font-semibold">Sem arquivo em processo</h3>
              <p className="text-zinc-500 text-xs max-w-sm mx-auto mt-1 leading-normal">
                Faça o upload do seu comprovante de atestado à esquerda e acione o robô extrator inteligente para auditar dados.
              </p>
            </div>
          )}

          {/* Animated Matrix style scanning visualizer lines bar overlay */}
          {scanStatus === 'scanning' && (
            <div className="bg-[#111113] border border-zinc-800 rounded-3xl p-8 text-center min-h-[350px] flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_15px_#10b981] animate-bounce duration-1000 mt-[40%]" />
              <Activity size={32} className="mx-auto text-emerald-400 animate-pulse mb-3" />
              <h3 className="text-emerald-400 text-sm font-semibold font-mono tracking-wide">EXECUTANDO LEITURA OCR...</h3>
              <p className="text-zinc-500 text-xs max-w-xs mx-auto mt-1 leading-relaxed font-mono">
                Processando metadados médicos estruturados e verificando assinaturas digitais do CFM.
              </p>
              
              <div className="w-48 bg-zinc-900 h-2 rounded-full overflow-hidden mx-auto mt-5">
                <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${scanProgress}%` }} />
              </div>
            </div>
          )}

          {/* Parsed Data Visual Sheet list */}
          {parsedData && scanStatus === 'success' && (
            <div className="bg-[#111113] border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="border-b border-zinc-800/80 pb-3 flex justify-between items-center bg-zinc-950/40">
                <span className="text-zinc-200 text-sm font-semibold flex items-center gap-1.5 leading-none">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  Laudo Extraído com Sucesso
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Precisão de leitura: 99.2%</span>
              </div>

              {/* Data attributes Grid sheet */}
              <div className="space-y-3 text-xs leading-relaxed text-zinc-300 font-sans">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-zinc-500 text-[9px] uppercase font-mono font-bold block">Hospital / Emissor</span>
                    <span className="text-zinc-200 font-bold block mt-1">{parsedData.clinica}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[9px] uppercase font-mono font-bold block">Profissional de Saúde</span>
                    <span className="text-zinc-200 font-bold block mt-1">{parsedData.medico}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-zinc-500 text-[9px] uppercase font-mono font-bold block">Inscrição de Classe</span>
                    <span className="text-zinc-200 font-bold font-mono block mt-1">{parsedData.crm}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[9px] uppercase font-mono font-bold block">CID Classificado</span>
                    <span className="text-emerald-400 font-mono font-bold block mt-1">{parsedData.cid || 'NÃO INFORMADO'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-zinc-500 text-[9px] uppercase font-mono font-bold block">Período Solicitado</span>
                    <span className="text-zinc-100 font-bold block mt-1 text-[13px]">{parsedData.diasAfastamento} Dias de Abono</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[9px] uppercase font-mono font-bold block">Data Recibo</span>
                    <span className="text-zinc-200 font-mono block mt-1">{parsedData.dataEmissao}</span>
                  </div>
                </div>

                <div className="bg-[#09090B] p-3.5 rounded-2xl border border-zinc-850 space-y-1">
                  <span className="text-zinc-500 text-[9px] uppercase font-mono font-bold block">Evolução do Caso / Diagnóstico Extrato:</span>
                  <p className="text-zinc-400 text-[11px] mt-1">{parsedData.motivo}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-zinc-800">
                <p className="text-[10px] text-zinc-550 max-w-[200px] leading-relaxed">
                  * Ao salvar, este registro é anexado à sua folha de ponto pessoal para aprovação formal da diretoria de RH.
                </p>
                
                <button
                  onClick={handleSaveParsedAtestado}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer shrink-0"
                >
                  <CheckCircle2 size={13} />
                  <span>Salvar Homologação</span>
                </button>
              </div>
            </div>
          )}

          {/* Success final state screen */}
          {scanStatus === 'saved' && (
            <div className="bg-[#111113] border border-zinc-800 rounded-3xl p-8 text-center min-h-[350px] flex flex-col justify-center animate-fade-in relative z-10 shadow-xl">
              <div className="mx-auto h-16 w-16 bg-emerald-500/10 border border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center shadow-[0_0_35px_rgba(16,185,129,0.25)] shrink-0 mb-4 animate-bounce">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-zinc-100 text-base font-bold tracking-tight">Compensação Registrada!</h3>
              <p className="text-zinc-400 text-xs max-w-xs mx-auto mt-1.5 leading-relaxed font-sans">
                Seu atestado médico foi analisado pela IA e indexado perfeitamente no extrato de jornada. O gestor homologará a ausência em breve.
              </p>
              
              <button
                onClick={() => {
                  setFileSelected(false);
                  setScanStatus('idle');
                  setParsedData(null);
                }}
                className="mt-6 mx-auto px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Registrar Outro Comprovante
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
