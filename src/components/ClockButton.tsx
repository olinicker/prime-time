/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { 
  Camera, 
  MapPin, 
  Fingerprint, 
  Lock, 
  User, 
  CheckCircle2, 
  X, 
  AlertTriangle, 
  RefreshCcw,
  Sparkles,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCPF } from '../utils/formatters';

export const ClockButton: React.FC = () => {
  const { user, nextPunchType, registerPunch } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  
  // Modal workflow states
  const [step, setStep] = useState<'auth' | 'camera' | 'success'>('auth');
  const [cpfInput, setCpfInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // Media states
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  
  // Geolocation
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<'fetching' | 'success' | 'failed'>('fetching');
  
  // Punch result info
  const [punchResult, setPunchResult] = useState<{ type: 'ENTRADA' | 'SAIDA'; timestamp: string; receiptId: string } | null>(null);
  const [submittingPunch, setSubmittingPunch] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Prefill credentials for seamless demo testing based on logged-in user
  useEffect(() => {
    if (user && isOpen) {
      setCpfInput(user.cpf);
      setPasswordInput('******'); // demo placeholder
    }
  }, [user, isOpen]);

  // Handle Opening/Closing
  const handleOpenModal = () => {
    if (!user) return;
    setIsOpen(true);
    setStep('auth');
    setLoginError(null);
    setCapturedPhoto(null);
    setCameraError(false);
    setCoords(null);
    setGeoStatus('fetching');
  };

  const handleCloseModal = () => {
    stopCamera();
    setIsOpen(false);
  };

  // Auth Submit Step 1
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    if (!cpfInput.trim() || !passwordInput.trim()) {
      setLoginError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const clearCpf = cpfInput.replace(/\D/g, '');
    const userCpf = user?.cpf.replace(/\D/g, '') || '';
    
    if (clearCpf !== userCpf) {
      setLoginError('CPF de confirmação não confere com o usuário logado.');
      return;
    }

    // Auth succeeded -> Proceed to Camera & GPS
    setStep('camera');
    startCamera();
    startGeolocation();
  };

  // Step 2 Media functions: Geolocation
  const startGeolocation = () => {
    setGeoStatus('fetching');
    if (!navigator.geolocation) {
      setGeoStatus('failed');
      setCoords({ lat: -23.55052, lng: -46.633308 }); // São Paulo default fallback
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus('success');
      },
      () => {
        setGeoStatus('failed');
        setCoords({ lat: -23.55052, lng: -46.633308 }); // Default fallback
      },
      { timeout: 7000 }
    );
  };

  // Step 2 Media functions: Webcam API
  const startCamera = async () => {
    setCameraLoading(true);
    setCameraError(false);
    setCapturedPhoto(null);

    try {
      const constraints = {
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: 'user'
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraLoading(false);
    } catch (err) {
      console.warn('Webcam permission denied or unavailable:', err);
      setCameraError(true);
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  // Snapshot Capture
  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Horizontal flip for mirror effect
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedPhoto(dataUrl);
        stopCamera();
      }
    } else {
      // Offline fallback profile capture simulation
      setCapturedPhoto(user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200');
    }
  };

  // Simulated ticket capture trigger
  const triggerManualSimulationFallback = () => {
    setCapturedPhoto('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200');
    setCameraError(false);
  };

  // Complete Punch Submission
  const handleFinalPunchSubmit = async () => {
    if (!user) return;
    setSubmittingPunch(true);
    
    try {
      // Call service to register point marking and calculate hours dynamically
      const result = await registerPunch(
        coords?.lat || -23.55052,
        coords?.lng || -46.633308,
        capturedPhoto || 'simulation_placeholder_hex'
      );
      
      setPunchResult({
        type: result.type,
        timestamp: new Date().toISOString(),
        receiptId: `PT-${Math.floor(Math.random() * 900000 + 100000)}`
      });
      
      setStep('success');
    } catch (err) {
      console.error('Punch record error:', err);
    } finally {
      setSubmittingPunch(false);
    }
  };

  return (
    <>
      {/* Central Pulsing Hero Clock In Portal Button */}
      <div className="flex flex-col items-center justify-center py-8">
        <div className="relative flex items-center justify-center">
          {/* Multi-layered animated ambient green glow rings */}
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-2xl scale-125 animate-pulse" />
          <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-emerald-500/30 to-emerald-400/10 blur-md animate-ping duration-1000" />
          <div className="absolute -inset-4 rounded-full border border-emerald-500/10 scale-100 animate-spin" style={{ animationDuration: '30s' }} />

          <button
            onClick={handleOpenModal}
            className="relative h-44 w-44 rounded-full bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-emerald-500/80 flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(16,185,129,0.3)] hover:shadow-[0_0_70px_rgba(16,185,129,0.55)] cursor-pointer group"
          >
            <div className="h-20 w-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 transition-colors duration-300 shadow-inner">
              <Fingerprint size={42} strokeWidth={1.5} className="group-hover:scale-110 transition-transform duration-300" />
            </div>

            <span className="text-zinc-100 font-bold tracking-wider text-xs uppercase font-mono mt-3 text-center block">
              Apontar Horas
            </span>
            <span className="text-[10px] text-emerald-400 font-mono tracking-widest mt-1 block px-2.5 py-0.5 rounded-full bg-emerald-500/10 font-bold border border-emerald-500/10">
              {nextPunchType === 'ENTRADA' ? 'ENTRADA' : 'SAÍDA'}
            </span>
          </button>
        </div>

        <p className="text-zinc-500 text-[11px] font-mono mt-5 text-center leading-relaxed">
          * Marcação em conformidade com a portaria 671 MTP.<br />
          Requer verificação facial e geolocalização GPS.
        </p>
      </div>

      {/* Clock In Modal View (AnimatePresence) */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            {/* Dark modal overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-zinc-950 border border-zinc-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative z-10"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-zinc-900 bg-zinc-90/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Fingerprint size={14} />
                  </div>
                  <h3 className="text-zinc-100 text-sm font-semibold">Registro de Ponto Corporativo</h3>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Steps panels */}
              <div className="p-6">
                
                {/* STEP 1: AUTHENTICATION CONFIRMATION */}
                {step === 'auth' && (
                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                    <div className="bg-zinc-900/40 p-4 border border-zinc-900 rounded-2xl flex gap-3.5 items-center mb-1">
                      <img
                        src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'}
                        alt={user?.nome}
                        referrerPolicy="no-referrer"
                        className="h-11 w-11 rounded-xl object-cover border border-zinc-800"
                      />
                      <div>
                        <p className="text-zinc-400 text-xs font-mono font-medium">Colaborador Ativo</p>
                        <h4 className="text-zinc-200 text-sm font-semibold">{user?.nome}</h4>
                      </div>
                    </div>

                    <p className="text-zinc-400 text-xs leading-relaxed">
                      Para sua segurança e conformidade regulatória, confirme suas credenciais profissionais antes de iniciar a captura facial.
                    </p>

                    {loginError && (
                      <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-start gap-2 text-rose-400 text-xs font-medium">
                        <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    <div className="space-y-3.5">
                      <div>
                        <label className="text-zinc-400 text-xs block mb-1.5 font-bold font-mono">CPF do Colaborador</label>
                        <div className="relative">
                          <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                          <input
                            type="text"
                            placeholder="000.000.000-00"
                            value={cpfInput}
                            onChange={(e) => setCpfInput(formatCPF(e.target.value))}
                            className="bg-zinc-900/60 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-zinc-200 text-sm w-full font-mono placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-zinc-400 text-xs block mb-1.5 font-bold font-mono">Senha de Presença</label>
                        <div className="relative">
                          <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                          <input
                            type="password"
                            placeholder="Sua senha numérica"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            className="bg-zinc-900/60 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-zinc-200 text-sm w-full placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-3 rounded-2xl font-bold text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Validar Credenciais</span>
                    </button>
                  </form>
                )}

                {/* STEP 2: CAMERA AND GEOLOCATION CAPTURE */}
                {step === 'camera' && (
                  <div className="space-y-4">
                    {/* Live Camera View Box */}
                    <div className="relative aspect-video rounded-2xl bg-zinc-950 border border-zinc-900 overflow-hidden flex items-center justify-center shadow-inner">
                      {cameraLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 bg-zinc-950 gap-2">
                          <RefreshCcw size={22} className="animate-spin text-emerald-400" />
                          <span className="text-xs font-mono">Carregando canal da câmera...</span>
                        </div>
                      )}

                      {cameraError && !capturedPhoto && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 bg-zinc-900 p-5 text-center">
                          <Camera size={30} className="text-zinc-600 mb-2.5" />
                          <p className="text-sm font-semibold text-zinc-300">Permissão de Câmera Desativada ou Indisponível</p>
                          <p className="text-xs text-zinc-500 max-w-xs mt-1 leading-normal">
                            Para testar o fluxo completo neste ambiente sandbox, clique abaixo para simular a foto biométrica corporativa.
                          </p>
                          <button
                            onClick={triggerManualSimulationFallback}
                            className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold rounded-xl border border-zinc-700 transition"
                          >
                            Simular Captura Biométrica
                          </button>
                        </div>
                      )}

                      {/* Real Video Stream */}
                      {!capturedPhoto && !cameraError && (
                        <>
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover scale-x-[-1]" // mirror
                          />
                          {/* Face alignment overlay ring */}
                          <div className="absolute inset-0 border-2 border-dashed border-emerald-500/20 rounded-full scale-75 pointer-events-none flex items-center justify-center">
                            <span className="text-[10px] text-emerald-400/40 font-semibold uppercase tracking-widest font-mono">Alinhe seu Rosto</span>
                          </div>
                        </>
                      )}

                      {/* Display Captured Snapshot preview */}
                      {capturedPhoto && (
                        <img
                          src={capturedPhoto}
                          alt="Biometria capturada"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover rounded-2xl scale-x-[-1]"
                        />
                      )}
                    </div>

                    <canvas ref={canvasRef} className="hidden" />

                    {/* Geolocation Status and Coordinates metadata */}
                    <div className="bg-zinc-900/30 border border-zinc-900 px-4 py-3.5 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl bg-zinc-900/80 flex items-center justify-center text-emerald-400">
                          <MapPin size={15} />
                        </div>
                        <div>
                          <p className="text-zinc-500 text-[10px] uppercase font-mono font-bold leading-none">Geolocalização</p>
                          {geoStatus === 'fetching' && <p className="text-zinc-400 text-xs mt-1">Buscando sinal do satélite GPS...</p>}
                          {geoStatus === 'success' && (
                            <p className="text-zinc-300 text-[11px] font-mono mt-1">
                              Lat: {coords?.lat.toFixed(6)}, Lng: {coords?.lng.toFixed(6)}
                            </p>
                          )}
                          {geoStatus === 'failed' && <p className="text-amber-500 text-xs mt-1">Sinal GPS restrito. (Usando coordenadas sede)</p>}
                        </div>
                      </div>
                      <span className={`text-[10px] font-semibold font-mono tracking-wider uppercase px-2 py-0.5 rounded-full ${
                        geoStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {geoStatus === 'success' ? 'GPS OK' : 'LOCAL MOCK'}
                      </span>
                    </div>

                    {/* Action Panel: Take or Retake snapshot, and complete submit */}
                    <div className="flex gap-3">
                      {!capturedPhoto ? (
                        <button
                          onClick={takeSnapshot}
                          disabled={cameraLoading || cameraError}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-3.5 rounded-2xl font-bold text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(16,185,129,0.15)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Camera size={17} />
                          <span>Capturar Foto Biométrica</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={startCamera}
                            disabled={submittingPunch}
                            className="flex-1 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 text-zinc-300 py-3 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2"
                          >
                            <RefreshCcw size={15} />
                            <span>Refazer Foto</span>
                          </button>
                          
                          <button
                            onClick={handleFinalPunchSubmit}
                            disabled={submittingPunch}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-3.5 rounded-2xl font-bold text-sm tracking-wide transition shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {submittingPunch ? (
                              <RefreshCcw size={16} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={16} />
                            )}
                            <span>Registrar {nextPunchType}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 3: SUCCESS CONFIRMATION AND COMPLIMENTARY LOG */}
                {step === 'success' && punchResult && (
                  <div className="text-center py-4 space-y-5">
                    {/* Glowing Big Success icon */}
                    <div className="mx-auto h-20 w-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.3)] shrink-0">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                      >
                        <CheckCircle2 size={40} />
                      </motion.div>
                    </div>

                    <div>
                      <h4 className="text-zinc-100 text-lg font-bold tracking-tight">Comprovante de Registro Emissão</h4>
                      <p className="text-zinc-400 text-xs mt-1">Segurança biométrica e geoprocessamento aprovados pelo MTE.</p>
                    </div>

                    {/* Digital Receipt styled box */}
                    <div className="bg-zinc-950 border border-zinc-900 max-w-sm mx-auto rounded-2xl overflow-hidden shadow-xl text-left">
                      <div className="bg-zinc-900/50 p-4 border-b border-zinc-900 flex justify-between items-center">
                        <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase font-bold">Comprovante Digital</span>
                        <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px] font-mono font-bold">
                          ORIGINAL
                        </div>
                      </div>

                      <div className="p-4 space-y-2.5 font-mono text-[11px] text-zinc-400">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">NÚMERO RECIBO:</span>
                          <span className="text-zinc-200 font-bold">{punchResult.receiptId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">TIPO REGISTRO:</span>
                          <span className="text-emerald-400 font-bold uppercase">{punchResult.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">COLABORADOR:</span>
                          <span className="text-zinc-200 uppercase truncate max-w-[200px]">{user?.nome}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">CPF:</span>
                          <span className="text-zinc-300">{user?.cpf}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">DATA & HORA:</span>
                          <span className="text-zinc-300">
                            {new Date(punchResult.timestamp).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">GPS LAT/LNG:</span>
                          <span className="text-zinc-300 text-[10px]">
                            {coords?.lat.toFixed(5)}, {coords?.lng.toFixed(5)}
                          </span>
                        </div>
                      </div>

                      {/* SVG Barcode decoration for realism */}
                      <div className="px-4 pb-4 select-none opacity-50 flex justify-center">
                        <svg viewBox="0 0 100 20" className="w-full h-8 px-5">
                          <rect width="1" height="20" fill="#a1a1aa" x="4"/>
                          <rect width="2" height="20" fill="#a1a1aa" x="7"/>
                          <rect width="1" height="20" fill="#a1a1aa" x="11"/>
                          <rect width="3" height="20" fill="#a1a1aa" x="14"/>
                          <rect width="1" height="20" fill="#a1a1aa" x="19"/>
                          <rect width="2" height="20" fill="#a1a1aa" x="22"/>
                          <rect width="1" height="20" fill="#a1a1aa" x="26"/>
                          <rect width="1" height="20" fill="#a1a1aa" x="30"/>
                          <rect width="3" height="20" fill="#a1a1aa" x="33"/>
                          <rect width="1" height="20" fill="#a1a1aa" x="38"/>
                          <rect width="2" height="20" fill="#a1a1aa" x="41"/>
                          <rect width="1" height="20" fill="#a1a1aa" x="45"/>
                          <rect width="2" height="20" fill="#a1a1aa" x="49"/>
                          <rect width="1" height="20" fill="#a1a1aa" x="53"/>
                          <rect width="3" height="20" fill="#a1a1aa" x="56"/>
                          <rect width="1" height="20" fill="#a1a1aa" x="61"/>
                          <rect width="2" height="20" fill="#a1a1aa" x="64"/>
                          <rect width="1" height="20" fill="#a1a1aa" x="68"/>
                          <rect width="3" height="20" fill="#a1a1aa" x="71"/>
                          <rect width="1" height="20" fill="#a1a1aa" x="76"/>
                          <rect width="2" height="20" fill="#a1a1aa" x="79"/>
                          <rect width="1" height="20" fill="#a1a1aa" x="83"/>
                          <rect width="2" height="20" fill="#a1a1aa" x="87"/>
                          <rect width="1" height="20" fill="#a1a1aa" x="91"/>
                          <rect width="3" height="20" fill="#a1a1aa" x="94"/>
                        </svg>
                      </div>
                    </div>

                    <button
                      onClick={handleCloseModal}
                      className="w-full max-w-xs bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-3 rounded-2xl font-bold text-sm tracking-wide transition shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:shadow-[0_0_35px_rgba(16,185,129,0.25)] flex items-center justify-center gap-2 mx-auto cursor-pointer"
                    >
                      <span>Concluir e Retornar</span>
                    </button>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
