/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Usuario, Turno, Marcacao, JornadaDiaria, SolicitacaoAjuste } from '../types';
import { authService, timeTrackingService, adjustmentsService, adminService, } from '../services/api';
import { LocalDatabase } from '../mocks/database';

interface AppContextType {
  user: Usuario | null;
  users: Usuario[];
  shifts: Turno[];
  adjustments: SolicitacaoAjuste[];
  myMarkings: Marcacao[];
  myJourneys: JornadaDiaria[];
  nextPunchType: 'ENTRADA' | 'SAIDA';
  isLoading: boolean;
  isInitialLoading: boolean;
  login: (cpf: string, password?: string) => Promise<Usuario>;
  logout: () => Promise<void>;
  recoverPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  refreshSelfData: () => Promise<void>;
  
  // Time clock
  registerPunch: (lat?: number, lng?: number, photo?: string) => Promise<{ type: 'ENTRADA' | 'SAIDA'; label: string }>;
  
  // Adjustment requests
  submitAdjustment: (data: Omit<SolicitacaoAjuste, 'id' | 'usuario_id' | 'status' | 'data_solicitacao'>) => Promise<void>;
  approveAdjustment: (id: string, feedback?: string) => Promise<void>;
  rejectAdjustment: (id: string, feedback?: string) => Promise<void>;
  
  // Admin CRUDS
  createUser: (data: Omit<Usuario, 'id'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<Usuario>) => Promise<void>;
  createShift: (data: Omit<Turno, 'id'>) => Promise<void>;
  updateShift: (id: string, updates: Partial<Turno>) => Promise<void>;
  addManualMarking: (userId: string, date: string, time: string, type: 'ENTRADA' | 'SAIDA') => Promise<void>;
  
  setTheme: (theme: 'light' | 'dark') => void;
  theme: 'light' | 'dark';
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [shifts, setShifts] = useState<Turno[]>([]);
  const [adjustments, setAdjustments] = useState<SolicitacaoAjuste[]>([]);
  const [myMarkings, setMyMarkings] = useState<Marcacao[]>([]);
  const [myJourneys, setMyJourneys] = useState<JornadaDiaria[]>([]);
  const [nextPunchType, setNextPunchType] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA');
  const [theme, setThemeState] = useState<'light' | 'dark'>('dark');
  
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Sync theme
  const setTheme = (t: 'light' | 'dark') => {
    setThemeState(t);
    const root = window.document.documentElement;
    if (t === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    localStorage.setItem('pt_theme', t);
  };

  // Sync / setup state
  const syncLocalLists = useCallback(() => {
    setUsers(LocalDatabase.getUsers());
    setShifts(LocalDatabase.getShifts());
    setAdjustments(LocalDatabase.getAdjustments());
  }, []);

  const refreshSelfData = useCallback(async () => {
    if (!user) return;
    try {
      const markings = await timeTrackingService.getMyMarkings(user.id);
      const journeys = await timeTrackingService.getMyJourneys(user.id);
      const type = await timeTrackingService.determineNextPunchType(user.id);
      
      setMyMarkings(markings);
      setMyJourneys(journeys);
      setNextPunchType(type);
    } catch (err) {
      console.error('Error refreshing point logs:', err);
    }
  }, [user]);

  // Initial Boot
  useEffect(() => {
    const boot = async () => {
      try {
        LocalDatabase.init();
        
        // Sync lists
        syncLocalLists();

        // Check active session
        const session = await authService.getCurrentSession();
        if (session) {
          setUser(session);
        }

        // Set theme
        const savedTheme = localStorage.getItem('pt_theme') as 'light' | 'dark';
        if (savedTheme) {
          setTheme(savedTheme);
        } else {
          setTheme('dark'); // default Dark Slate Mode
        }
      } catch (err) {
        console.error('Boot system error:', err);
      } finally {
        setIsInitialLoading(false);
      }
    };
    boot();
  }, [syncLocalLists]);

  // Whenever the active user state updates, fetch related point records
  useEffect(() => {
    if (user) {
      refreshSelfData();
    } else {
      setMyMarkings([]);
      setMyJourneys([]);
    }
  }, [user, refreshSelfData]);

  // Auth Operations
  const login = async (cpf: string, password?: string): Promise<Usuario> => {
    setIsLoading(true);
    try {
      const result = await authService.login(cpf, password);
      setUser(result.user);
      syncLocalLists();
      return result.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const recoverPassword = async (email: string) => {
    setIsLoading(true);
    try {
      return await authService.recoverPassword(email);
    } finally {
      setIsLoading(false);
    }
  };

  // Clock action (APONTAR HORAS)
  const registerPunch = async (
    lat?: number,
    lng?: number,
    photo?: string
  ): Promise<{ type: 'ENTRADA' | 'SAIDA'; label: string }> => {
    if (!user) throw new Error('É necessário estar autenticado para marcar ponto.');
    setIsLoading(true);
    try {
      const result = await timeTrackingService.registerPunch(user.id, lat, lng, photo);
      
      // Sync local collections after punch to ensure all states update
      syncLocalLists();
      
      // Update session metrics if needed or trigger individual user reload
      const usersList = LocalDatabase.getUsers();
      const updatedUser = usersList.find(u => u.id === user.id);
      if (updatedUser) {
        setUser(updatedUser);
      }
      
      await refreshSelfData();
      
      return {
        type: result.type,
        label: result.type === 'ENTRADA' ? 'Entrada Registrada' : 'Saída Registrada'
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Adjustment requests
  const submitAdjustment = async (
    data: Omit<SolicitacaoAjuste, 'id' | 'usuario_id' | 'status' | 'data_solicitacao'>
  ) => {
    if (!user) throw new Error('Autenticação é requerida.');
    setIsLoading(true);
    try {
      await adjustmentsService.createAdjustment(user.id, data);
      syncLocalLists();
    } finally {
      setIsLoading(false);
    }
  };

  const approveAdjustment = async (id: string, feedback?: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await adjustmentsService.reviewAdjustment(id, 'APROVADO', user.id, feedback);
      syncLocalLists();
      if (user.perfil !== 'ADMIN') {
        const usersList = LocalDatabase.getUsers();
        const updatedUser = usersList.find(u => u.id === user.id);
        if (updatedUser) setUser(updatedUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const rejectAdjustment = async (id: string, feedback?: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await adjustmentsService.reviewAdjustment(id, 'REJEITADO', user.id, feedback);
      syncLocalLists();
    } finally {
      setIsLoading(false);
    }
  };

  // Admin CRUDS
  const createUser = async (data: Omit<Usuario, 'id'>) => {
    setIsLoading(true);
    try {
      await adminService.createUser(data);
      syncLocalLists();
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (id: string, updates: Partial<Usuario>) => {
    setIsLoading(true);
    try {
      const updated = await adminService.updateUser(id, updates);
      syncLocalLists();
      if (user && user.id === id) {
        setUser(updated);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createShift = async (data: Omit<Turno, 'id'>) => {
    setIsLoading(true);
    try {
      await adminService.createShift(data);
      syncLocalLists();
    } finally {
      setIsLoading(false);
    }
  };

  const updateShift = async (id: string, updates: Partial<Turno>) => {
    setIsLoading(true);
    try {
      await adminService.updateShift(id, updates);
      syncLocalLists();
    } finally {
      setIsLoading(false);
    }
  };

  const addManualMarking = async (userId: string, date: string, time: string, type: 'ENTRADA' | 'SAIDA') => {
    setIsLoading(true);
    try {
      await adminService.injectManualMarking(userId, date, time, type);
      syncLocalLists();
      if (user && user.id === userId) {
        await refreshSelfData();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        users,
        shifts,
        adjustments,
        myMarkings,
        myJourneys,
        nextPunchType,
        isLoading,
        isInitialLoading,
        login,
        logout,
        recoverPassword,
        refreshSelfData,
        registerPunch,
        submitAdjustment,
        approveAdjustment,
        rejectAdjustment,
        createUser,
        updateUser,
        createShift,
        updateShift,
        addManualMarking,
        setTheme,
        theme
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser utilizado dentro de um AppProvider');
  }
  return context;
};
