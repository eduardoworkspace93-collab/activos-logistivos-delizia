import React, { useState, useEffect } from 'react';
import { 
  User, Item, Movement, StockStats, DashboardStats, AppConfig, BackupFile, Location, Responsible, DriverRoute, OperationalArea 
} from './types.js';
import { 
  Layers, Package, ChevronRight, Menu, LogOut, Lock, 
  Moon, Sun, ClipboardList, Database, ShieldAlert, BarChart3, 
  Settings, UserCheck, Key, RefreshCw, X, ArrowLeftRight, Scale, Trash2
} from 'lucide-react';

import Dashboard from './components/Dashboard.js';
import MaestroItems from './components/MaestroItems.js';
import Movimientos from './components/Movimientos.js';
import Stock from './components/Stock.js';
import Kardex from './components/Kardex.js';
import Reportes from './components/Reportes.js';
import Usuarios from './components/Usuarios.js';
import Auditoria from './components/Auditoria.js';
import Configuracion from './components/Configuracion.js';
import PrintActa from './components/PrintActa.js';
import DeudasChoferes from './components/DeudasChoferes.js';
import AlmacenDanados from './components/AlmacenDanados.js';
import { FullLogo, MobileIcon } from './components/Logo.js';

export default function App() {
  // Session / Authentication state
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');

  // App settings & configuration
  const [appConfig, setAppConfig] = useState<AppConfig>({
    companyName: 'DELIZIA - COMPAÑÍA DE ALIMENTOS LTDA.',
    logoUrl: 'https://www.delizia.com.bo/wp-content/uploads/2019/12/logo-delizia.png',
    primaryColor: '#003366',
    secondaryColor: '#f15a24'
  });

  // Dark mode
  const [darkMode, setDarkMode] = useState(false);

  // Layout / Side Navigation
  const [currentView, setCurrentView] = useState<'dashboard' | 'items' | 'movements' | 'stock' | 'debts' | 'kardex' | 'reports' | 'users' | 'audit' | 'settings' | 'damaged'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [movementInitialType, setMovementInitialType] = useState<'ingreso' | 'salida'>('ingreso');
  const [movementPrefill, setMovementPrefill] = useState<{ entity: string; driver: string } | null>(null);

  // Core inventories data lists
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [responsibles, setResponsibles] = useState<Responsible[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [stocks, setStocks] = useState<StockStats[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [kardex, setKardex] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [driversRoutes, setDriversRoutes] = useState<DriverRoute[]>([]);
  const [operationalAreas, setOperationalAreas] = useState<OperationalArea[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [backups, setBackups] = useState<BackupFile[]>([]);

  // Overlay / Modals states
  const [activePrintActa, setActivePrintActa] = useState<Movement | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  // Global loading
  const [loading, setLoading] = useState(false);

  // Initialize and check saved sessions
  useEffect(() => {
    const savedToken = localStorage.getItem('delizia_token');
    const savedUser = localStorage.getItem('delizia_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      if (user.role === 'Operador' || user.role === 'OPC' || user.role === 'OPP' || user.role === 'OPA') {
        setCurrentView('movements');
      }
    }

    // Force high-contrast light theme for maximum readability as requested
    setDarkMode(false);
    localStorage.setItem('delizia_dark_mode', 'false');
    document.documentElement.classList.remove('dark');

    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }

    // Load initial company colors/config (Unauthenticated endpoint)
    fetchConfig();
  }, []);

  // Fetch colors and settings
  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setAppConfig(data);
      }
    } catch (e) {
      console.error('Error fetching company config', e);
    }
  };

  // Sync data whenever token changes
  useEffect(() => {
    if (token) {
      fetchAllData();
    }
  }, [token]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Parallel fetches for optimization
      const [
        itemsRes, movementsRes, stocksRes, 
        statsRes, kardexRes, locationsRes, responsiblesRes, driversRoutesRes, operationalAreasRes
      ] = await Promise.all([
        fetch('/api/items', { headers }),
        fetch('/api/movements', { headers }),
        fetch('/api/stock', { headers }),
        fetch('/api/stats', { headers }),
        fetch('/api/kardex', { headers }),
        fetch('/api/locations', { headers }),
        fetch('/api/responsibles', { headers }),
        fetch('/api/drivers-routes', { headers }),
        fetch('/api/operational-areas', { headers }),
      ]);

      if (itemsRes.ok) setItems(await itemsRes.json());
      if (movementsRes.ok) setMovements(await movementsRes.json());
      if (stocksRes.ok) setStocks(await stocksRes.json());
      if (statsRes.ok) setDashboardStats(await statsRes.json());
      if (kardexRes.ok) setKardex(await kardexRes.json());
      if (locationsRes.ok) setLocations(await locationsRes.json());
      if (responsiblesRes.ok) setResponsibles(await responsiblesRes.json());
      if (driversRoutesRes.ok) setDriversRoutes(await driversRoutesRes.json());
      if (operationalAreasRes.ok) setOperationalAreas(await operationalAreasRes.json());

      // Only fetch admin/supervisor endpoints if user has privileges
      if (currentUser.role === 'Administrador' || currentUser.role === 'Supervisor') {
        const [usersRes, auditRes, backupsRes] = await Promise.all([
          fetch('/api/users', { headers }),
          fetch('/api/audit', { headers }),
          fetch('/api/backups', { headers })
        ]);

        if (usersRes.ok) setUsers(await usersRes.json());
        if (auditRes.ok) setAudit(await auditRes.json());
        if (backupsRes.ok) setBackups(await backupsRes.json());
      } else {
        setUsers([]);
        setAudit([]);
        setBackups([]);
      }

    } catch (e) {
      console.error('Error fetching data from backend', e);
    } finally {
      setLoading(false);
    }
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const err = await res.json();
        setLoginError(err.error || 'Nombre de usuario o contraseña incorrectos.');
        return;
      }

      const data = await res.json();
      setToken(data.token);
      setCurrentUser(data.user);
      if (data.user.role === 'Operador' || data.user.role === 'OPC' || data.user.role === 'OPP' || data.user.role === 'OPA') {
        setCurrentView('movements');
      } else {
        setCurrentView('dashboard');
      }

      if (rememberMe) {
        localStorage.setItem('delizia_token', data.token);
        localStorage.setItem('delizia_user', JSON.stringify(data.user));
      }
    } catch (e) {
      setLoginError('Error de red. Asegúrese de que el servidor esté activo.');
    }
  };

  // Logout handler
  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('delizia_token');
    localStorage.removeItem('delizia_user');
    setUsername('');
    setPassword('');
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      if (!res.ok) {
        const err = await res.json();
        setPwdError(err.error || 'No se pudo cambiar la contraseña.');
        return;
      }

      setPwdSuccess('Contraseña modificada correctamente.');
      setOldPassword('');
      setNewPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPwdSuccess('');
      }, 1500);

    } catch (e) {
      setPwdError('Error de conexión.');
    }
  };

  // Universal API Wrapper for sub-component operations
  const handleSaveItem = async (itemData: Partial<Item>) => {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(itemData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al guardar el item.');
    }
    await fetchAllData();
  };

  const handleDeleteItem = async (itemId: string) => {
    const res = await fetch(`/api/items/${itemId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al eliminar el item.');
    }
    await fetchAllData();
  };

  const handleSaveLocation = async (locationData: Partial<Location>) => {
    const res = await fetch('/api/locations', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(locationData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al guardar la procedencia/destino.');
    }
    await fetchAllData();
  };

  const handleDeleteLocation = async (id: string) => {
    const res = await fetch(`/api/locations/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al eliminar la procedencia/destino.');
    }
    await fetchAllData();
  };

  const handleRegisterMovement = async (movementData: any) => {
    const res = await fetch('/api/movements', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(movementData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al registrar el movimiento.');
    }
    const savedMove = await res.json();
    await fetchAllData();
    return savedMove;
  };

  const handleSaveUser = async (userData: Partial<User>) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al guardar el usuario.');
    }
    await fetchAllData();
  };

  const handleSaveDriverRoute = async (drData: Partial<DriverRoute>) => {
    const res = await fetch('/api/drivers-routes', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(drData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al guardar el conductor/ruta.');
    }
    await fetchAllData();
  };

  const handleDeleteDriverRoute = async (id: string) => {
    const res = await fetch(`/api/drivers-routes/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al eliminar el conductor/ruta.');
    }
    await fetchAllData();
  };

  const handleSaveOperationalArea = async (areaData: Partial<OperationalArea>) => {
    const res = await fetch('/api/operational-areas', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(areaData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al guardar el área de operación.');
    }
    await fetchAllData();
  };

  const handleDeleteOperationalArea = async (id: string) => {
    const res = await fetch(`/api/operational-areas/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al eliminar el área de operación.');
    }
    await fetchAllData();
  };

  const handleSaveConfig = async (newConfig: AppConfig) => {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(newConfig)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al guardar la configuración.');
    }
    await fetchConfig();
    await fetchAllData();
  };

  const handleCreateBackup = async () => {
    const res = await fetch('/api/backups/create', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al generar el respaldo.');
    }
    const data = await res.json();
    await fetchAllData();
    return data;
  };

  const handleRestoreBackup = async (filename: string) => {
    const res = await fetch('/api/backups/restore', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ filename })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al restaurar respaldo.');
    }
    await fetchAllData();
  };

  const handleRestoreUpload = async (jsonContent: string) => {
    const res = await fetch('/api/backups/restore-upload', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ jsonContent })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al restaurar respaldo subido.');
    }
    await fetchAllData();
  };

  const handleClearDatabase = async (password: string) => {
    const res = await fetch('/api/database/clear', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al vaciar la base de datos.');
    }
    await fetchAllData();
  };

  const handleToggleDarkMode = () => {
    const val = !darkMode;
    setDarkMode(val);
    localStorage.setItem('delizia_dark_mode', String(val));
    if (val) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Helper to jump views
  const handleNavigateToMovements = (moveType: 'ingreso' | 'salida', prefill?: { entity: string; driver: string }) => {
    setMovementInitialType(moveType);
    if (prefill) {
      setMovementPrefill(prefill);
    } else {
      setMovementPrefill(null);
    }
    setCurrentView('movements');
  };

  // If not logged in, render corporate login interface
  if (!token || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 select-none relative overflow-hidden">
        
        {/* Aesthetic background design */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#003366]/5 rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#f15a24]/5 rounded-full filter blur-3xl translate-x-1/2 translate-y-1/2"></div>

        <div className="w-full max-w-sm bg-white border border-slate-200 p-6 rounded-xl shadow-md flex flex-col items-center space-y-5 z-10 relative">
          
          {/* Logo and company headers */}
          <div className="text-center space-y-2 flex flex-col items-center">
            <FullLogo className="h-16 w-auto shadow-sm" />
            <div className="pt-2">
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider font-sans">
                Sistema Centralizado de Control de Canastillos
              </p>
            </div>
          </div>

          {loginError && (
            <div className="w-full p-2.5 bg-red-50 border border-red-150 text-red-600 rounded-lg text-xs font-semibold leading-relaxed">
              ⚠️ {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="w-full space-y-3.5 text-xs font-medium">
            <div>
              <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1 text-[9px]">Nombre de Usuario</label>
              <input
                type="text"
                required
                placeholder="Ej. administrador"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().trim())}
                className="w-full bg-slate-50 border border-slate-250 rounded-lg px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20 text-slate-900 font-sans transition-all"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-bold uppercase tracking-wider mb-1 text-[9px]">Contraseña de Acceso</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-250 rounded-lg px-3 py-2.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20 text-slate-900 font-sans transition-all"
              />
            </div>

            <div className="flex justify-between items-center pt-0.5 text-[10px] text-slate-500">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded text-[#003366] focus:ring-[#003366]"
                />
                <span>Recordar sesión</span>
              </label>
              <span className="text-slate-400 font-medium">Sucursal Central La Paz</span>
            </div>

            <div className="pt-1.5">
              <button
                type="submit"
                className="w-full bg-[#003366] hover:bg-[#003366]/90 text-white font-bold py-2.5 px-4 rounded-lg shadow transition-all text-xs cursor-pointer"
              >
                Iniciar Sesión Logística
              </button>
            </div>
          </form>

          {/* Technical Info Footnote / Quick Login Options */}
          <div className="border-t border-slate-100 w-full pt-3.5 space-y-2.5">
            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Áreas de Operación / Acceso Rápido
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button 
                type="button" 
                onClick={() => { setUsername('admin'); setPassword('admin123'); }}
                className="p-2 bg-slate-50 hover:bg-[#003366]/5 border border-slate-200 hover:border-[#003366]/20 rounded-lg text-left transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between"
                title="Acceso total a Planta El Alto (Solo Administradores)"
              >
                <span className="text-[10px] font-black text-[#003366] leading-snug">🏛️ PLANTA EL ALTO</span>
                <span className="text-[8px] font-mono text-slate-400 mt-0.5 font-bold">admin / admin123</span>
              </button>
              
              <button 
                type="button" 
                onClick={() => { setUsername('opp'); setPassword('opp123'); }}
                className="p-2 bg-slate-50 hover:bg-orange-500/5 border border-slate-200 hover:border-orange-500/20 rounded-lg text-left transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between"
                title="Solo operaciones del área de Producción"
              >
                <span className="text-[10px] font-black text-orange-600 leading-snug">⚙️ PRODUCCIÓN</span>
                <span className="text-[8px] font-mono text-slate-400 mt-0.5 font-bold">opp / opp123</span>
              </button>

              <button 
                type="button" 
                onClick={() => { setUsername('opa'); setPassword('opa123'); }}
                className="p-2 bg-slate-50 hover:bg-emerald-500/5 border border-slate-200 hover:border-emerald-500/20 rounded-lg text-left transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between"
                title="Solo operaciones del área de Almacén Producto Terminado"
              >
                <span className="text-[10px] font-black text-emerald-600 leading-snug">📦 ALMACÉN PROD. TERM.</span>
                <span className="text-[8px] font-mono text-slate-400 mt-0.5 font-bold">opa / opa123</span>
              </button>

              <button 
                type="button" 
                onClick={() => { setUsername('opc'); setPassword('opc123'); }}
                className="p-2 bg-slate-50 hover:bg-blue-500/5 border border-slate-200 hover:border-blue-500/20 rounded-lg text-left transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between"
                title="Solo operaciones del área de Activos Logísticos (Canastillos)"
              >
                <span className="text-[10px] font-black text-blue-600 leading-snug">📥 ACTIVOS LOGÍSTICOS</span>
                <span className="text-[8px] font-mono text-slate-400 mt-0.5 font-bold">opc / opc123</span>
              </button>
            </div>

            {/* Supervisor and standard operator links */}
            <div className="flex justify-between items-center text-[9px] text-slate-400 bg-slate-50/50 p-1.5 px-2.5 rounded-lg border border-slate-100">
              <button 
                type="button" 
                onClick={() => { setUsername('supervisor'); setPassword('super123'); }} 
                className="hover:text-slate-700 font-bold transition-colors cursor-pointer"
              >
                🔑 Super: supervisor / super123
              </button>
              <button 
                type="button" 
                onClick={() => { setUsername('operador'); setPassword('op123'); }} 
                className="hover:text-slate-700 font-bold transition-colors cursor-pointer"
              >
                🔑 Op Estándar: operador / op123
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sidebar link definition
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, roles: ['Administrador', 'Supervisor'] },
    { id: 'items', label: 'Ítems a Controlar', icon: Package, roles: ['Administrador', 'Supervisor', 'Operador', 'OPC', 'OPP', 'OPA'] },
    { id: 'movements', label: 'Ingresos / Salidas', icon: ArrowLeftRight, roles: ['Administrador', 'Supervisor', 'Operador', 'OPC', 'OPP', 'OPA'] },
    { id: 'stock', label: 'Control de Stock', icon: Layers, roles: ['Administrador', 'Supervisor', 'Operador', 'OPC', 'OPP', 'OPA'] },
    { id: 'damaged', label: 'Prod. Dañados', icon: Trash2, roles: ['Administrador'] },
    { id: 'debts', label: 'Préstamos y Deudas', icon: Scale, roles: ['Administrador', 'Supervisor', 'Operador', 'OPC', 'OPP', 'OPA'] },
    { id: 'kardex', label: 'Kardex Histórico', icon: ClipboardList, roles: ['Administrador', 'Supervisor'] },
    { id: 'reports', label: 'Informes & Reportes', icon: Database, roles: ['Administrador', 'Supervisor'] },
    { id: 'users', label: 'Usuarios y Roles', icon: UserCheck, roles: ['Administrador', 'Supervisor'] },
    { id: 'audit', label: 'Auditoría', icon: ShieldAlert, roles: ['Administrador', 'Supervisor'] },
    { id: 'settings', label: 'Configuración & Backup', icon: Settings, roles: ['Administrador', 'Supervisor'] },
  ];

  const allowedMenuItems = menuItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-800 flex flex-col font-sans transition-colors dark:bg-slate-950 dark:text-slate-100">
      
      {/* 1. Header (Navbar) */}
      <header className="bg-white border-b border-slate-200 h-14 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm dark:bg-slate-900 dark:border-slate-800 print:hidden">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white flex-shrink-0"
          >
            <Menu className="w-4.5 h-4.5" />
          </button>
          
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Desktop logo: Full oval blue logo + Control de Canastillos badge */}
            <div className="hidden sm:flex items-center gap-3">
              <FullLogo className="h-8 md:h-9 w-auto" />
              <div className="border-l border-slate-200 dark:border-slate-700 pl-3 py-1 flex flex-col justify-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider dark:text-slate-400 leading-none">
                  Sistema Centralizado
                </span>
                <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5 leading-none">
                  Control de Canastillos
                </span>
              </div>
            </div>

            {/* Mobile logo: Just the red/blue 'D' icon and 'DELIZIA' text */}
            <div className="flex sm:hidden items-center gap-1.5 min-w-0">
              <MobileIcon className="h-7 w-7 flex-shrink-0" />
              <span className="font-black text-sm tracking-widest text-[#13519c] dark:text-white font-display">
                DELIZIA
              </span>
            </div>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 text-xs font-semibold flex-shrink-0">
          
          {/* Current operator badge */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-150 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-lg dark:bg-slate-800 dark:border-slate-700 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
            <span className="text-slate-600 dark:text-slate-300 text-[10px] sm:text-[11px] truncate max-w-[60px] sm:max-w-[100px] md:max-w-none">
              @{currentUser.username} <span className="hidden sm:inline">({currentUser.role})</span>
            </span>
          </div>

          {/* Sync Button */}
          <button 
            onClick={fetchAllData}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all cursor-pointer dark:hover:bg-slate-800"
            title="Sincronizar datos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Password change */}
          <button
            onClick={() => {
              setOldPassword('');
              setNewPassword('');
              setPwdError('');
              setPwdSuccess('');
              setShowPasswordModal(true);
            }}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-900 bg-slate-50 border border-slate-150 px-1.5 py-1 sm:px-2.5 sm:py-1 rounded-lg dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 cursor-pointer text-[10px] sm:text-[11px]"
            title="Cambiar contraseña"
          >
            <Key className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
            <span className="hidden md:inline">Contraseña</span>
          </button>

          {/* Log out */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 px-1.5 py-1 sm:px-2.5 sm:py-1 rounded-lg transition-all cursor-pointer text-[10px] sm:text-[11px]"
            title="Cerrar sesión"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
            <span className="hidden md:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* 2. Main Area (Sidebar + View Panel) */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Sidebar Backdrop on Mobile */}
        {sidebarOpen && (
          <div 
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-30 md:hidden top-14"
          />
        )}

        {/* Sidebar Nav */}
        {sidebarOpen && (
          <aside className="fixed md:sticky top-14 left-0 z-40 md:z-auto w-24 bg-[#003366] border-r border-blue-900 p-2 space-y-3 flex-shrink-0 h-[calc(100vh-56px)] flex flex-col justify-between print:hidden overflow-y-auto text-white transition-all duration-200">
            <div className="space-y-2">
              <span className="text-[8px] font-extrabold text-blue-200/50 uppercase tracking-widest text-center block mb-2 leading-none">
                MENÚ
              </span>

              <div className="flex flex-col gap-1">
                {allowedMenuItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentView(item.id as any);
                        if (window.innerWidth < 768) {
                          setSidebarOpen(false);
                        }
                      }}
                      className={`w-full flex flex-col items-center justify-center text-center p-2 rounded-lg text-[9px] font-bold tracking-tight gap-1 leading-snug transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-700/60 text-white shadow-sm'
                          : 'text-blue-100 hover:text-white hover:bg-blue-800/60'
                      }`}
                      title={item.label}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="whitespace-normal break-words max-w-full leading-tight font-medium">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sidebar bottom indicator */}
            <div className="p-1.5 bg-blue-950/40 rounded-lg border border-blue-800/50 text-[8px] text-blue-200 text-center leading-tight">
              <span className="font-extrabold text-white block">CENTRAL</span>
              <p className="mt-0.5 opacity-80">La Paz</p>
            </div>
          </aside>
        )}

        {/* View Content Canvas */}
        <main className="flex-1 p-5 overflow-y-auto h-[calc(100vh-56px)] print:h-auto print:p-0 print:overflow-visible">
          {loading && (
            <div className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-orange-500 to-emerald-500 animate-pulse z-50 print:hidden" />
          )}

          {/* RENDER DYNAMIC COMPONENT BASED ON VIEW STATE */}
          {currentView === 'dashboard' && dashboardStats && (
            <Dashboard 
              stats={dashboardStats} 
              stocks={stocks}
              config={appConfig}
              items={items}
              responsibles={responsibles}
              onRefresh={fetchAllData}
              onNavigateToMovements={handleNavigateToMovements}
              onRegisterMovement={handleRegisterMovement}
              currentUser={currentUser}
              operationalAreas={operationalAreas}
            />
          )}

          {currentView === 'items' && (
            <MaestroItems 
              items={items}
              locations={locations}
              userRole={currentUser.role}
              onSaveItem={handleSaveItem}
              onDeleteItem={handleDeleteItem}
              onSaveLocation={handleSaveLocation}
              onDeleteLocation={handleDeleteLocation}
              driversRoutes={driversRoutes}
              onSaveDriverRoute={handleSaveDriverRoute}
              onDeleteDriverRoute={handleDeleteDriverRoute}
              users={users}
              currentUser={currentUser}
              onSaveUser={handleSaveUser}
              operationalAreas={operationalAreas}
              onSaveOperationalArea={handleSaveOperationalArea}
              onDeleteOperationalArea={handleDeleteOperationalArea}
            />
          )}

          {currentView === 'movements' && (
            <Movimientos 
              items={items}
              locations={locations}
              responsibles={responsibles}
              movements={movements}
              stocks={stocks}
              userRole={currentUser.role}
              initialType={movementInitialType}
              onRegisterMovement={handleRegisterMovement}
              onShowActa={setActivePrintActa}
              prefill={movementPrefill}
              onPrefillUsed={() => setMovementPrefill(null)}
              driversRoutes={driversRoutes}
              currentUser={currentUser}
              operationalAreas={operationalAreas}
              onSaveOperationalArea={handleSaveOperationalArea}
            />
          )}

          {currentView === 'stock' && (
            <Stock stocks={stocks} userRole={currentUser.role} currentUser={currentUser} />
          )}

          {currentView === 'debts' && (
            <DeudasChoferes 
              movements={movements} 
              items={items} 
              stocks={stocks} 
              onNavigateToMovements={handleNavigateToMovements} 
              locations={locations}
              driversRoutes={driversRoutes}
            />
          )}

          {currentView === 'kardex' && (
            <Kardex kardex={kardex} items={items} onRefresh={fetchAllData} operationalAreas={operationalAreas} />
          )}

          {currentView === 'reports' && (
            <Reportes movements={movements} stocks={stocks} config={appConfig} />
          )}

          {currentView === 'users' && (
            <Usuarios users={users} currentUser={currentUser} onSaveUser={handleSaveUser} />
          )}

          {currentView === 'audit' && (
            <Auditoria audit={audit} />
          )}

          {currentView === 'damaged' && (
            <AlmacenDanados
              items={items}
              movements={movements}
              stocks={stocks}
              responsibles={responsibles}
              onRegisterMovement={handleRegisterMovement}
              currentUser={currentUser}
            />
          )}

          {currentView === 'settings' && (
            <Configuracion 
              config={appConfig} 
              backups={backups}
              userRole={currentUser.role}
              onSaveConfig={handleSaveConfig}
              onCreateBackup={handleCreateBackup}
              onRestoreBackup={handleRestoreBackup}
              onRestoreUpload={handleRestoreUpload}
              onClearDatabase={handleClearDatabase}
            />
          )}
        </main>

      </div>

      {/* 3. PRINT ACTA OVERLAY MODAL */}
      {activePrintActa && (
        <PrintActa 
          movement={activePrintActa} 
          config={appConfig} 
          onClose={() => setActivePrintActa(null)} 
        />
      )}

      {/* 4. PASSWORD CHANGE DIALOG */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white p-5 rounded-lg max-w-sm w-full border border-slate-200 shadow-xl space-y-3.5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 font-display text-xs">Cambiar Contraseña Acceso</h3>
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {pwdError && <div className="p-2.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold">{pwdError}</div>}
            {pwdSuccess && <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold">{pwdSuccess}</div>}

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-400 mb-1 text-[10px]">Contraseña Actual</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 text-[10px]">Nueva Contraseña de Acceso</label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="submit"
                  className="bg-[#003366] hover:bg-[#003366]/90 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs cursor-pointer"
                >
                  Confirmar Cambio
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-3.5 py-1.5 rounded-lg text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
