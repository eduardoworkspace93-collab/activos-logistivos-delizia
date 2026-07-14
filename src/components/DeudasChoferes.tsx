import React, { useState, useMemo } from 'react';
import { Movement, Item, StockStats } from '../types.js';
import { 
  Users, User, Search, ArrowRightLeft, FileText, ChevronRight, 
  TrendingUp, Calendar, AlertCircle, CheckCircle, BookOpen, 
  Printer, ArrowUpRight, ArrowDownLeft, Filter, Scale, RefreshCw, X
} from 'lucide-react';

function isInternalArea(name: string): boolean {
  const norm = (name || '').trim().toUpperCase();
  if (!norm || norm === '-' || norm === 'S/N') return true;
  
  // Checks for Producción
  if (
    norm === 'PRODUCCION' || 
    norm === 'PRODUCCIÓN' || 
    norm === 'EN PRODUCCION' || 
    norm === 'EN PRODUCCIÓN' || 
    norm.includes('AREA DE PRODUCCION') || 
    norm.includes('ÁREA DE PRODUCCIÓN')
  ) {
    return true;
  }
  // Checks for Almacén
  if (
    norm === 'ALMACEN' || 
    norm === 'ALMACÉN' || 
    norm === 'ALMACEN PLANTA' || 
    norm === 'ALMACÉN PLANTA' || 
    norm === 'ALMACEN DE PRODUCTO TERMINADO' || 
    norm === 'ALMACÉN DE PRODUCTO TERMINADO' || 
    norm.includes('ALMACEN PLANTA') || 
    norm.includes('ALMACÉN PLANTA') ||
    norm.includes('ALMACEN DE PRODUCTO TERMINADO') ||
    norm.includes('ALMACÉN DE PRODUCTO TERMINADO')
  ) {
    return true;
  }
  // Checks for Planta/Activos Logísticos
  if (
    norm === 'PLANTA' || 
    norm === 'PLANTA GENERAL' || 
    norm === 'PLANTA CENTRAL' || 
    norm === 'PLANTA CENTRAL EL ALTO' || 
    norm === 'PLANTA EL ALTO' || 
    norm === 'ACTIVOS LOGÍSTICOS' || 
    norm === 'ACTIVOS LOGISTICOS' || 
    norm.includes('LOGISTICOS') || 
    norm.includes('LOGÍSTICOS')
  ) {
    return true;
  }
  
  return false;
}

function isInternalStatus(status: string): boolean {
  if (!status) return false;
  return ['Planta_Disponibles', 'Produccion', 'Planta_Almacen'].includes(status);
}


interface DeudasChoferesProps {
  movements: Movement[];
  items: Item[];
  stocks: StockStats[];
  onNavigateToMovements: (moveType: 'ingreso' | 'salida', prefill?: { entity: string; driver: string }) => void;
  locations?: any[];
  driversRoutes?: any[];
}

interface DriverDebt {
  driverName: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  itemColor: string;
  totalLoans: number;   // total salidas
  totalReturns: number; // total ingresos
  balance: number;      // loans - returns
}

interface GroupedDriver {
  name: string;
  debts: { [itemId: string]: DriverDebt };
  totalBalance: number;
}

interface JefeDebt {
  jefeName: string;
  drivers: { [driverName: string]: GroupedDriver };
  debts: { [itemId: string]: {
    itemId: string;
    itemName: string;
    itemCode: string;
    itemColor: string;
    totalLoans: number;
    totalReturns: number;
    balance: number;
  }};
  totalBalance: number;
}

export default function DeudasChoferes({ 
  movements, 
  items, 
  stocks,
  onNavigateToMovements,
  locations,
  driversRoutes
}: DeudasChoferesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJefeKey, setSelectedJefeKey] = useState<string | null>(null);
  const [selectedDriverKey, setSelectedDriverKey] = useState<string | null>(null);
  const [onlyWithDebts, setOnlyWithDebts] = useState(true);
  const [selectedItemFilter, setSelectedItemFilter] = useState<string>('ALL');

  // Compute Jefes and Drivers Debts dynamically
  const jefesData = useMemo(() => {
    const jefes: { [key: string]: JefeDebt } = {};
    const itemMap = new Map(items.map(i => [i.id, i]));

    // Pre-populate known Jefes from locations of type 'destino'
    if (locations) {
      locations.forEach(loc => {
        if (loc.type === 'destino') {
          const nameRaw = (loc.name || '').trim();
          if (nameRaw && nameRaw !== '-' && !isInternalArea(nameRaw)) {
            const key = nameRaw.toUpperCase();
            if (!jefes[key]) {
              jefes[key] = {
                jefeName: nameRaw,
                drivers: {},
                debts: {},
                totalBalance: 0
              };
            }
          }
        }
      });
    }

    // Pre-populate Jefes and their drivers from driversRoutes
    if (driversRoutes) {
      driversRoutes.forEach(dr => {
        const nameRaw = (dr.jefeName || '').trim();
        if (nameRaw && nameRaw !== '-' && !isInternalArea(nameRaw)) {
          const key = nameRaw.toUpperCase();
          if (!jefes[key]) {
            jefes[key] = {
              jefeName: nameRaw,
              drivers: {},
              debts: {},
              totalBalance: 0
            };
          }
          
          const driverRaw = (dr.driverName || '').trim();
          if (driverRaw && driverRaw !== '-') {
            const dKey = driverRaw.toUpperCase();
            if (!jefes[key].drivers[dKey]) {
              jefes[key].drivers[dKey] = {
                name: driverRaw,
                debts: {},
                totalBalance: 0
              };
            }
          }
        }
      });
    }

    movements.forEach(m => {
      const jefeRaw = (m.entity || '').trim();

      // Filter out empty/placeholder records, internal plant categories, or internal transfers
      if (!jefeRaw || jefeRaw === '-' || isInternalArea(jefeRaw)) {
        return;
      }

      const fromInt = m.fromStatus ? isInternalStatus(m.fromStatus) : false;
      const destInt = m.crateStatus ? isInternalStatus(m.crateStatus) : false;
      if (fromInt && destInt) {
        return;
      }

      let driverRaw = (m.truckDriver || '').trim();
      if (!driverRaw || driverRaw === '-') {
        driverRaw = 'GENERAL (SIN CHOFER)';
      }

      const jefeKey = jefeRaw.toUpperCase();
      const driverKey = driverRaw.toUpperCase();
      const itemId = m.itemId;
      const item = itemMap.get(itemId);
      if (!item) return;

      // Initialize Jefe
      if (!jefes[jefeKey]) {
        jefes[jefeKey] = {
          jefeName: jefeRaw,
          drivers: {},
          debts: {},
          totalBalance: 0
        };
      }

      // Initialize Driver under Jefe
      if (!jefes[jefeKey].drivers[driverKey]) {
        jefes[jefeKey].drivers[driverKey] = {
          name: driverRaw,
          debts: {},
          totalBalance: 0
        };
      }

      // Initialize Driver Item Debt
      if (!jefes[jefeKey].drivers[driverKey].debts[itemId]) {
        jefes[jefeKey].drivers[driverKey].debts[itemId] = {
          driverName: driverRaw,
          itemId,
          itemName: item.name,
          itemCode: item.code,
          itemColor: item.color,
          totalLoans: 0,
          totalReturns: 0,
          balance: 0
        };
      }

      // Initialize Jefe Item Debt
      if (!jefes[jefeKey].debts[itemId]) {
        jefes[jefeKey].debts[itemId] = {
          itemId,
          itemName: item.name,
          itemCode: item.code,
          itemColor: item.color,
          totalLoans: 0,
          totalReturns: 0,
          balance: 0
        };
      }

      // Aggregate
      const qty = Number(m.quantity) || 0;
      if (m.type === 'salida') {
        jefes[jefeKey].drivers[driverKey].debts[itemId].totalLoans += qty;
        jefes[jefeKey].debts[itemId].totalLoans += qty;
      } else if (m.type === 'ingreso') {
        jefes[jefeKey].drivers[driverKey].debts[itemId].totalReturns += qty;
        jefes[jefeKey].debts[itemId].totalReturns += qty;
      }
    });

    // Compute balances & prune empty values
    return Object.values(jefes).map(jefe => {
      // Balance per item at Jefe level
      Object.keys(jefe.debts).forEach(itemId => {
        const debt = jefe.debts[itemId];
        debt.balance = debt.totalLoans - debt.totalReturns;
      });

      // Balance per item at Driver level
      (Object.values(jefe.drivers) as GroupedDriver[]).forEach(driver => {
        Object.keys(driver.debts).forEach(itemId => {
          const debt = driver.debts[itemId];
          debt.balance = debt.totalLoans - debt.totalReturns;
        });

        // Sum up driver balance
        driver.totalBalance = (Object.values(driver.debts) as DriverDebt[]).reduce((sum, d) => sum + d.balance, 0);
      });

      // Sum up jefe total balance
      jefe.totalBalance = (Object.values(jefe.debts) as any[]).reduce((sum, d) => sum + d.balance, 0);
      return jefe;
    });
  }, [movements, items, locations, driversRoutes]);

  // Filtered Jefes list based on search and "only with debts" toggle
  const filteredJefes = useMemo(() => {
    return jefesData.filter(jefe => {
      // Filter by search text
      const matchesSearch = jefe.jefeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Object.values(jefe.drivers) as GroupedDriver[]).some(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by balance
      const hasActiveDebts = jefe.totalBalance > 0;
      const matchesDebtToggle = !onlyWithDebts || hasActiveDebts;

      // Filter by item type if selected
      const matchesItemFilter = selectedItemFilter === 'ALL' || 
        (jefe.debts[selectedItemFilter] && (!onlyWithDebts || jefe.debts[selectedItemFilter].balance > 0));

      return matchesSearch && matchesDebtToggle && matchesItemFilter;
    }).sort((a, b) => b.totalBalance - a.totalBalance);
  }, [jefesData, searchTerm, onlyWithDebts, selectedItemFilter]);

  // Find active Jefe
  const selectedJefe = useMemo(() => {
    if (!selectedJefeKey) return null;
    return jefesData.find(j => j.jefeName.toUpperCase() === selectedJefeKey.toUpperCase()) || null;
  }, [jefesData, selectedJefeKey]);

  // Find active Driver
  const selectedDriver = useMemo(() => {
    if (!selectedJefe || !selectedDriverKey) return null;
    return selectedJefe.drivers[selectedDriverKey.toUpperCase()] || null;
  }, [selectedJefe, selectedDriverKey]);

  // Get complete chronological ledger for selected Jefe / Driver
  const ledgerMovements = useMemo(() => {
    if (!selectedJefe) return [];
    
    return movements.filter(m => {
      const isSameJefe = (m.entity || '').trim().toUpperCase() === selectedJefe.jefeName.toUpperCase();
      
      let mDriver = (m.truckDriver || '').trim().toUpperCase();
      if (!mDriver || mDriver === '-') {
        mDriver = 'GENERAL (SIN CHOFER)';
      }
      
      const isSameDriver = !selectedDriverKey || mDriver === selectedDriverKey.toUpperCase();
      
      return isSameJefe && isSameDriver;
    }).sort((a, b) => {
      // Sort newest first
      const dateA = `${a.date}T${a.time}`;
      const dateB = `${b.date}T${b.time}`;
      return dateB.localeCompare(dateA);
    });
  }, [movements, selectedJefe, selectedDriverKey]);

  // Aggregate values for stats bar
  const globalStats = useMemo(() => {
    let totalOutstanding = 0;
    const itemTotals: { [key: string]: { name: string; code: string; balance: number; color: string } } = {};

    items.forEach(i => {
      itemTotals[i.id] = { name: i.name, code: i.code, balance: 0, color: i.color };
    });

    jefesData.forEach(j => {
      (Object.values(j.debts) as any[]).forEach(d => {
        if (itemTotals[d.itemId]) {
          itemTotals[d.itemId].balance += d.balance;
          totalOutstanding += d.balance;
        }
      });
    });

    return {
      totalOutstanding,
      itemTotals: (Object.values(itemTotals) as any[]).filter(x => x.balance > 0)
    };
  }, [jefesData, items]);

  return (
    <div className="space-y-4 animate-fade-in text-xs font-sans">
      
      {/* HEADER SECTION */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3 dark:bg-slate-900 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-extrabold text-[#003366] dark:text-blue-400 uppercase tracking-tight flex items-center gap-2">
            <Scale className="w-4 h-4" />
            Control de Préstamos y Deudas de Choferes
          </h2>
          <p className="text-[10px] text-slate-400 mt-1">
            Visualiza y concilia canastillos entregados en calidad de préstamo a distribuidores/choferes y sus devoluciones correspondientes.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onNavigateToMovements('salida')}
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] cursor-pointer shadow-sm active:scale-95 transition-all"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Nuevo Préstamo (Salida)
          </button>
          <button
            onClick={() => onNavigateToMovements('ingreso')}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] cursor-pointer shadow-sm active:scale-95 transition-all"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            Registrar Devolución (Ingreso)
          </button>
        </div>
      </div>

      {/* DASHBOARD STATS ROW */}
      {globalStats.totalOutstanding > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900 text-white border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="absolute right-2 top-2 text-slate-800">
              <Scale className="w-12 h-12 opacity-30" />
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Total Canastillos Prestados
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-black tracking-tight font-mono text-orange-400">
                {globalStats.totalOutstanding}
              </span>
              <span className="text-[10px] text-slate-400 font-bold">unidades</span>
            </div>
            <p className="text-[9px] text-slate-400 mt-1">Pendientes de devolución en calle</p>
          </div>

          {globalStats.itemTotals.map(item => (
            <div key={item.code} className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                Deuda: {item.name}
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-black font-mono text-slate-800 dark:text-white">
                  {item.balance}
                </span>
                <span className="text-[9px] text-slate-500 font-bold">u. [{item.code}]</span>
              </div>
              <p className="text-[9px] text-slate-400 mt-1">Saldos pendientes en ruta</p>
            </div>
          ))}
        </div>
      )}

      {/* SEARCH AND FILTERS PANEL */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between dark:bg-slate-900 dark:border-slate-800">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por Jefe Principal o Chofer..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-250 rounded-lg pl-8 pr-3 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#003366]/20 text-xs text-slate-800"
          />
        </div>

        <div className="flex flex-wrap gap-2.5 w-full md:w-auto items-center justify-end">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 dark:bg-slate-800 dark:border-slate-700">
            <Filter className="w-3 h-3 text-slate-500" />
            <select
              value={selectedItemFilter}
              onChange={e => setSelectedItemFilter(e.target.value)}
              className="bg-transparent text-[10px] font-bold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Todos los Canastillos</option>
              {items.map(i => (
                <option key={i.id} value={i.id}>
                  [{i.code}] - {i.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer select-none transition-all dark:bg-slate-850 dark:border-slate-750">
            <input
              type="checkbox"
              checked={onlyWithDebts}
              onChange={e => setOnlyWithDebts(e.target.checked)}
              className="rounded text-[#003366] focus:ring-[#003366] w-3 h-3 cursor-pointer"
            />
            <span>Solo distribuidores con deuda activa</span>
          </label>
        </div>
      </div>

      {/* MASTER-DETAIL SYSTEM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: LIST OF JEFES PRINCIPALES */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-[520px] dark:bg-slate-900 dark:border-slate-800">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center dark:bg-slate-850 dark:border-slate-750">
            <span className="font-extrabold text-[9px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#003366]" />
              Jefes Principales ({filteredJefes.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-150">
            {filteredJefes.length > 0 ? (
              filteredJefes.map(jefe => {
                const isActive = selectedJefeKey?.toUpperCase() === jefe.jefeName.toUpperCase();
                const driversCount = Object.keys(jefe.drivers).length;

                return (
                  <button
                    key={jefe.jefeName}
                    onClick={() => {
                      setSelectedJefeKey(jefe.jefeName);
                      setSelectedDriverKey(null); // clear driver selection on jefe change
                    }}
                    className={`w-full text-left p-3 flex justify-between items-center transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-blue-50/60 dark:bg-blue-950/40 border-l-4 border-[#003366]' 
                        : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 pr-2">
                      <p className="font-bold text-slate-800 dark:text-white truncate text-xs uppercase">
                        {jefe.jefeName}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold dark:bg-slate-800 dark:text-slate-400">
                          {driversCount} {driversCount === 1 ? 'chofer' : 'choferes'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {jefe.totalBalance > 0 ? (
                        <div className="space-y-0.5">
                          <span className="inline-block bg-orange-50 text-orange-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-orange-100 font-mono">
                            {jefe.totalBalance} u.
                          </span>
                          <span className="block text-[8px] text-slate-400 font-bold">DEUDA ACTIVA</span>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="inline-block bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-100 font-mono">
                            0 u.
                          </span>
                          <span className="block text-[8px] text-slate-400 font-semibold">AL DÍA</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-16 text-slate-400 font-medium p-4">
                No se encontraron jefes principales con los criterios de búsqueda.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DETAIL PANEL FOR SELECTED JEFE */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-[520px] dark:bg-slate-900 dark:border-slate-800">
          {selectedJefe ? (
            <div className="flex flex-col h-full">
              
              {/* JEFE MAIN HEADER */}
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 dark:bg-slate-850 dark:border-slate-750">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] bg-[#003366] text-white px-2 py-0.5 rounded font-black uppercase">
                      Jefe Principal
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold">Saldos Consolidados</span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">
                    {selectedJefe.jefeName}
                  </h3>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onNavigateToMovements('salida', { entity: selectedJefe.jefeName, driver: selectedDriver?.name || '' })}
                    className="bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-bold px-2.5 py-1 rounded text-[10px] cursor-pointer transition-all flex items-center gap-1 active:scale-95"
                    title="Realizar un préstamo directo a este distribuidor"
                  >
                    <ArrowUpRight className="w-3 h-3" />
                    Prestar
                  </button>
                  <button
                    onClick={() => onNavigateToMovements('ingreso', { entity: selectedJefe.jefeName, driver: selectedDriver?.name || '' })}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold px-2.5 py-1 rounded text-[10px] cursor-pointer transition-all flex items-center gap-1 active:scale-95"
                    title="Registrar devolución directa de este distribuidor"
                  >
                    <ArrowDownLeft className="w-3 h-3" />
                    Conciliar
                  </button>
                </div>
              </div>

              {/* OUTSTANDING BALANCES ROW BY ITEM */}
              <div className="p-3 bg-slate-50/50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 dark:bg-slate-900/50 dark:border-slate-750">
                {(Object.values(selectedJefe.debts) as any[]).map(debt => (
                  <div key={debt.itemId} className="p-2 bg-white border border-slate-150 rounded-lg shadow-2xs dark:bg-slate-850 dark:border-slate-750">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: debt.itemColor }} />
                      <span className="text-[8px] font-bold text-slate-400 uppercase truncate">
                        {debt.itemName}
                      </span>
                    </div>
                    <div className="mt-1 flex justify-between items-baseline">
                      <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                        {debt.balance} u.
                      </span>
                      <span className="text-[7px] text-slate-400 font-bold font-mono">
                        [{debt.itemCode}]
                      </span>
                    </div>
                    <div className="flex justify-between text-[7px] text-slate-400 mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span>Sal: {debt.totalLoans}</span>
                      <span>Dev: {debt.totalReturns}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* INNER LAYOUT: CHOFERES ON LEFT, LEDGER/HISTORY ON RIGHT */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
                
                {/* SUB-LIST: DRIVERS (CHOFERES) UNDER JEFE */}
                <div className="md:col-span-5 border-r border-slate-200 overflow-y-auto divide-y divide-slate-150 h-full dark:border-slate-800">
                  <div className="p-2 bg-slate-50/30 text-[9px] font-bold text-slate-400 uppercase tracking-widest sticky top-0 dark:bg-slate-850">
                    Choferes de la Ruta
                  </div>

                  {(Object.values(selectedJefe.drivers) as GroupedDriver[]).map(driver => {
                    const isDrvActive = selectedDriverKey?.toUpperCase() === driver.name.toUpperCase();
                    return (
                      <button
                        key={driver.name}
                        onClick={() => setSelectedDriverKey(isDrvActive ? null : driver.name)}
                        className={`w-full text-left p-2.5 transition-all flex items-center justify-between cursor-pointer ${
                          isDrvActive 
                            ? 'bg-[#003366]/5 dark:bg-blue-950/30 border-r-2 border-[#003366]' 
                            : 'hover:bg-slate-50/30'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500 shrink-0 dark:bg-slate-800 dark:text-slate-400">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 dark:text-white truncate uppercase text-[11px]">
                              {driver.name}
                            </p>
                            <p className="text-[8px] text-slate-400 font-medium">
                              Saldos de Deuda Individual
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          {driver.totalBalance > 0 ? (
                            <span className="inline-block bg-orange-100 text-orange-800 text-[10px] font-bold px-1.5 py-0.5 rounded font-mono border border-orange-200">
                              {driver.totalBalance} u.
                            </span>
                          ) : (
                            <span className="inline-block bg-emerald-50 text-emerald-700 text-[10px] font-medium px-1.5 py-0.5 rounded font-mono border border-emerald-100">
                              0 u.
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* SUB-PANEL: DETAILED CHRONOLOGICAL LEDGER (HISTORIAL) */}
                <div className="md:col-span-7 overflow-y-auto h-full flex flex-col bg-slate-50/10 dark:bg-slate-900/10">
                  <div className="p-2 bg-slate-50/30 border-b border-slate-150 flex justify-between items-center sticky top-0 z-10 dark:bg-slate-850 dark:border-slate-800">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-[#f15a24]" />
                      Ledger de Movimientos {selectedDriver ? `(${selectedDriver.name})` : '(Todos)'}
                    </span>
                    <span className="text-[8px] text-slate-400 font-mono font-bold">
                      {ledgerMovements.length} transacciones
                    </span>
                  </div>

                  <div className="flex-1 p-2 space-y-1.5">
                    {ledgerMovements.length > 0 ? (
                      ledgerMovements.map(m => {
                        const itemDetail = items.find(i => i.id === m.itemId);
                        const isSalida = m.type === 'salida';

                        return (
                          <div 
                            key={m.id} 
                            className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-2xs space-y-2 dark:bg-slate-850 dark:border-slate-750"
                          >
                            <div className="flex justify-between items-start">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className={`inline-block text-[8px] font-extrabold px-1.5 py-0.2 rounded border ${
                                    isSalida 
                                      ? 'bg-orange-50 text-orange-600 border-orange-100' 
                                      : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                  }`}>
                                    {isSalida ? 'PRÉSTAMO (SALIDA)' : 'DEVOLUCIÓN (INGRESO)'}
                                  </span>
                                  <span className="text-[8px] font-mono text-slate-400 font-bold">
                                    {m.documentNumber || m.orderNumber || '-'}
                                  </span>
                                </div>
                                <div className="flex gap-1.5 items-center">
                                  <span className="font-mono text-[9px] font-bold text-slate-600 dark:text-slate-300">
                                    {m.movementNumber}
                                  </span>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-[8px] text-slate-400 flex items-center gap-1 font-semibold">
                                    <Calendar className="w-2.5 h-2.5" />
                                    {m.date} {m.time}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className={`text-xs font-black font-mono block ${isSalida ? 'text-orange-600' : 'text-emerald-600'}`}>
                                  {isSalida ? '-' : '+'}{m.quantity} u.
                                </span>
                                {itemDetail && (
                                  <span className="text-[8px] text-slate-400 font-bold">
                                    {itemDetail.name}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Driver and observations detail inside ledger card */}
                            <div className="text-[9px] bg-slate-50 p-1.5 rounded dark:bg-slate-800 flex flex-col space-y-1 text-slate-600 dark:text-slate-300">
                              <div className="flex justify-between">
                                <span>Chofer: <strong className="text-slate-900 uppercase dark:text-white">{m.truckDriver}</strong></span>
                                <span>Por: <strong className="text-slate-700 dark:text-slate-300">@{m.user}</strong></span>
                              </div>
                              {m.details && (
                                <p className="italic text-slate-400 border-t border-slate-100 pt-1 dark:border-slate-700">
                                  Obs: {m.details}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-24 text-slate-400 font-medium">
                        No hay movimientos logísticos registrados para este chofer.
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-slate-400 p-6 space-y-3">
              <Users className="w-12 h-12 text-slate-300 animate-bounce" />
              <div className="text-center space-y-1">
                <p className="font-bold text-slate-500 text-xs">Ningún Jefe Principal Seleccionado</p>
                <p className="text-[10px] text-slate-450 max-w-xs leading-normal">
                  Haga clic en uno de los distribuidores principales de la lista de la izquierda para desplegar sus choferes, saldos, deudas y ledger de auditoría en tiempo real.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
