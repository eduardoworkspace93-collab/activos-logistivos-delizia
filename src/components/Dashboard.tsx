import React from 'react';
import { DashboardStats, StockStats, AppConfig, Item } from '../types.js';
import { 
  Package, TrendingUp, TrendingDown, ClipboardList, 
  AlertTriangle, Truck, Users, RefreshCw, Layers, CheckCircle2, Warehouse, Building2,
  ArrowRight, ArrowRightLeft, Info, Sparkles, ChevronRight, PlusCircle, Activity, X
} from 'lucide-react';
import { formatDate, formatTime } from '../utils.js';

interface DashboardProps {
  stats: DashboardStats;
  stocks: StockStats[];
  config: AppConfig;
  items: Item[];
  responsibles: { id: string; name: string }[];
  onRefresh: () => void;
  onNavigateToMovements: (type: 'ingreso' | 'salida') => void;
  onRegisterMovement: (movementData: any) => Promise<any>;
  currentUser?: any;
  operationalAreas?: any;
}

const crateStatusLabels: Record<string, string> = {
  Planta_Disponibles: 'ACTIVOS LOGÍSTICOS (Vacíos/Lavado)',
  Produccion: 'PRODUCCIÓN (Llenado/Envasado)',
  Planta_Almacen: 'ALMACÉN DE PRODUCTO TERMINADO (Cámaras)',
  Reparto: 'En Reparto (Distribución)',
  Clientes: 'En Clientes (Mercado)',
  Pendiente: 'Pendiente Retorno (Choferes)',
  Dañado: 'Dañado (Merma)',
  'Reparación': 'En Reparación'
};

export default function Dashboard({ 
  stats, 
  stocks, 
  config, 
  items, 
  responsibles, 
  onRefresh, 
  onNavigateToMovements,
  onRegisterMovement,
  currentUser,
  operationalAreas = []
}: DashboardProps) {
  // Find largest stock and lowest stock
  const lowStockThreshold = 50;

  const dynamicLabels = React.useMemo(() => {
    const labels: Record<string, string> = {};
    Object.assign(labels, crateStatusLabels);
    if (operationalAreas && Array.isArray(operationalAreas)) {
      operationalAreas.forEach(area => {
        labels[area.id] = area.name;
      });
    }
    return labels;
  }, [operationalAreas]);

  // Determine if user has restricted access
  const isRestrictedOperator = currentUser?.role === 'Operador' && currentUser?.area && currentUser?.area !== 'general';
  const defaultArea = isRestrictedOperator ? currentUser.area : 'general';

  // Active Area selection: 'general' | 'activos' | 'produccion' | 'almacen'
  const [activeArea, setActiveArea] = React.useState<'general' | 'activos' | 'produccion' | 'almacen'>(defaultArea);

  // Sync activeArea if currentUser loads or changes
  React.useEffect(() => {
    if (isRestrictedOperator) {
      setActiveArea(currentUser.area);
    }
  }, [currentUser, isRestrictedOperator]);

  // Dynamic stock alerts based on active sucursal area
  const currentAlerts = React.useMemo(() => {
    return stocks
      .filter(item => item.status === 'Activo')
      .map(item => {
        let stockInSucursal = 0;
        if (activeArea === 'general') {
          stockInSucursal = (item.breakdown.plantaDisponibles || 0) + 
                            (item.breakdown.produccion || 0) + 
                            (item.breakdown.plantaAlmacen || 0);
        } else if (activeArea === 'activos') {
          stockInSucursal = item.breakdown.plantaDisponibles || 0;
        } else if (activeArea === 'produccion') {
          stockInSucursal = item.breakdown.produccion || 0;
        } else if (activeArea === 'almacen') {
          stockInSucursal = item.breakdown.plantaAlmacen || 0;
        }
        
        let alertType: 'Critico' | 'Bajo' | null = null;
        if (stockInSucursal === 0) {
          alertType = 'Critico';
        } else if (stockInSucursal < lowStockThreshold) {
          alertType = 'Bajo';
        }
        
        return {
          itemId: item.id,
          code: item.code,
          name: item.name,
          color: item.color,
          stockActual: stockInSucursal,
          alertType
        };
      })
      .filter((a): a is { itemId: string; code: string; name: string; color: string; stockActual: number; alertType: 'Critico' | 'Bajo' } => a.alertType !== null);
  }, [stocks, activeArea, lowStockThreshold]);

  const criticalStockCount = currentAlerts.filter(a => a.alertType === 'Critico').length;
  const lowStockCount = currentAlerts.filter(a => a.alertType === 'Bajo').length;

  // Dynamic metrics based on selected Sucursal
  const currentSucursalStock = React.useMemo(() => {
    switch (activeArea) {
      case 'activos':
        return stats.logisticsBreakdown.plantaDisponibles || 0;
      case 'produccion':
        return stats.logisticsBreakdown.produccion || 0;
      case 'almacen':
        return stats.logisticsBreakdown.plantaAlmacen || 0;
      case 'general':
      default:
        return (stats.logisticsBreakdown.plantaDisponibles || 0) + 
               (stats.logisticsBreakdown.produccion || 0) + 
               (stats.logisticsBreakdown.plantaAlmacen || 0);
    }
  }, [stats.logisticsBreakdown, activeArea]);

  const sucursalLabel = {
    general: 'Planta El Alto',
    activos: 'Activos Logísticos',
    produccion: 'Producción',
    almacen: 'Almacén de PT'
  }[activeArea];

  const sucursalSubtitle = {
    general: 'Suma de Áreas de la Planta',
    activos: 'Disponibles / Vacíos',
    produccion: 'En proceso / Envasado',
    almacen: 'En Cámaras de Frío'
  }[activeArea];

  // Render SVG chart
  const maxMoveValue = Math.max(...stats.dailyChartData.map(d => Math.max(d.ingresos, d.salidas, 50)));
  const chartHeight = 180;
  const chartWidth = 500;
  const barPadding = 12;
  const groupWidth = (chartWidth / stats.dailyChartData.length);

  // Quick Transfer Modal State
  const [showTransferModal, setShowTransferModal] = React.useState(false);
  const [transferSource, setTransferSource] = React.useState<string>('Planta_Disponibles');
  const [transferTarget, setTransferTarget] = React.useState<string>('Produccion');
  const [transferItem, setTransferItem] = React.useState<string>('');
  const [transferQty, setTransferQty] = React.useState<number>(50);
  const [transferResponsible, setTransferResponsible] = React.useState<string>('');
  const [transferDetails, setTransferDetails] = React.useState<string>('');
  const [transferDocNum, setTransferDocNum] = React.useState<string>('');
  const [transferError, setTransferError] = React.useState<string>('');
  const [transferSuccess, setTransferSuccess] = React.useState<string>('');
  const [isSubmittingTransfer, setIsSubmittingTransfer] = React.useState(false);

  // Prefill helper for Quick Transfers
  const openTransfer = (source: string, target: string, defaultDetails: string) => {
    const activeItems = items.filter(i => i.status === 'Activo');
    if (activeItems.length > 0) {
      setTransferItem(activeItems[0].id);
    } else {
      setTransferItem('');
    }

    if (responsibles.length > 0) {
      setTransferResponsible(responsibles[0].name);
    } else {
      setTransferResponsible('OPERADOR TURNO');
    }

    setTransferSource(source);
    setTransferTarget(target);
    setTransferQty(30);
    // Auto-generate order/document number
    const rand = Math.floor(100 + Math.random() * 900);
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    setTransferDocNum(`TR-${dateStr}-${rand}`);
    setTransferDetails(defaultDetails);
    setTransferError('');
    setTransferSuccess('');
    setShowTransferModal(true);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    setTransferSuccess('');

    if (!transferItem) {
      setTransferError('Por favor seleccione un canastillo.');
      return;
    }
    if (Number(transferQty) <= 0) {
      setTransferError('La cantidad debe ser mayor a cero.');
      return;
    }
    if (!transferResponsible.trim()) {
      setTransferError('Por favor ingrese o seleccione un responsable.');
      return;
    }

    setIsSubmittingTransfer(true);
    try {
      const payload = {
        documentNumber: transferDocNum,
        type: 'salida',
        itemId: transferItem,
        quantity: Number(transferQty),
        entity: 'PLANTA EL ALTO (TRASPASO INTERNO)',
        responsible: transferResponsible.trim().toUpperCase(),
        details: transferDetails.trim() || `Traspaso rápido interno en Planta El Alto`,
        crateStatus: transferTarget,
        fromStatus: transferSource
      };

      await onRegisterMovement(payload);
      setTransferSuccess('¡Traspaso registrado con éxito en la base de datos!');
      
      // Refresh after 1.2s
      setTimeout(() => {
        setShowTransferModal(false);
        onRefresh();
      }, 1200);
    } catch (err: any) {
      setTransferError(err.message || 'Error al procesar el traspaso interno.');
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Welcome Title */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-bold font-display text-slate-900 leading-tight">
            Panel de Control Logístico
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Gestión en tiempo real para <span className="font-semibold text-[#003366]">{config.companyName || 'DELIZIA'}</span>
          </p>
        </div>
        <button 
          onClick={onRefresh}
          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-all cursor-pointer border border-slate-200 active:scale-95 animate-pulse"
          title="Actualizar datos"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Sucursal / Area Selector Grid */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-1.5">
          <Warehouse className="w-4 h-4 text-[#003366]" />
          <h3 className="font-bold text-slate-900 text-xs font-display uppercase tracking-wider">
            Seleccionar Sucursal o Área de Trabajo (Filtro de Stock)
          </h3>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Option 1: ACTIVOS LOGISTICOS */}
          <button
            onClick={() => setActiveArea('activos')}
            disabled={isRestrictedOperator && currentUser.area !== 'activos'}
            className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between space-y-2 active:scale-[0.98] ${
              isRestrictedOperator && currentUser.area !== 'activos'
                ? 'border-slate-100 bg-slate-50/30 opacity-40 cursor-not-allowed'
                : activeArea === 'activos' 
                  ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500 shadow-xs cursor-pointer' 
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer'
            }`}
          >
            <div className="flex justify-between items-start w-full">
              <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <Warehouse className="w-4 h-4" />
              </div>
              {isRestrictedOperator && currentUser.area !== 'activos' ? (
                <span className="text-[9px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-extrabold flex items-center gap-1">
                  🔒 BLOQUEADO
                </span>
              ) : (
                <span className={`w-2 h-2 rounded-full ${activeArea === 'activos' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
              )}
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Área de Planta</span>
              <h4 className="font-bold text-slate-800 text-xs uppercase leading-tight mt-0.5">Activos Logísticos</h4>
              <p className="text-[9px] text-slate-500 mt-0.5 leading-none">Recepción de Vacíos / Lavado</p>
            </div>
            <div className="pt-2 border-t border-slate-100/80 flex items-baseline justify-between w-full">
              <span className="text-[9px] text-slate-400 font-bold font-mono">STOCK DISP:</span>
              <span className="text-sm font-black font-mono text-emerald-600">{stats.logisticsBreakdown.plantaDisponibles || 0} u.</span>
            </div>
          </button>

          {/* Option 2: PRODUCCION */}
          <button
            onClick={() => setActiveArea('produccion')}
            disabled={isRestrictedOperator && currentUser.area !== 'produccion'}
            className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between space-y-2 active:scale-[0.98] ${
              isRestrictedOperator && currentUser.area !== 'produccion'
                ? 'border-slate-100 bg-slate-50/30 opacity-40 cursor-not-allowed'
                : activeArea === 'produccion' 
                  ? 'border-blue-500 bg-blue-50/20 ring-1 ring-blue-500 shadow-xs cursor-pointer' 
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer'
            }`}
          >
            <div className="flex justify-between items-start w-full">
              <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <Package className="w-4 h-4" />
              </div>
              {isRestrictedOperator && currentUser.area !== 'produccion' ? (
                <span className="text-[9px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-extrabold flex items-center gap-1">
                  🔒 BLOQUEADO
                </span>
              ) : (
                <span className={`w-2 h-2 rounded-full ${activeArea === 'produccion' ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`}></span>
              )}
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Área de Planta</span>
              <h4 className="font-bold text-slate-800 text-xs uppercase leading-tight mt-0.5">Producción</h4>
              <p className="text-[9px] text-slate-500 mt-0.5 leading-none">Envasado y Llenado</p>
            </div>
            <div className="pt-2 border-t border-slate-100/80 flex items-baseline justify-between w-full">
              <span className="text-[9px] text-slate-400 font-bold font-mono">EN FAJA:</span>
              <span className="text-sm font-black font-mono text-blue-600">{stats.logisticsBreakdown.produccion || 0} u.</span>
            </div>
          </button>

          {/* Option 3: ALMACEN DE PRODUCTO TERMINADO */}
          <button
            onClick={() => setActiveArea('almacen')}
            disabled={isRestrictedOperator && currentUser.area !== 'almacen'}
            className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between space-y-2 active:scale-[0.98] ${
              isRestrictedOperator && currentUser.area !== 'almacen'
                ? 'border-slate-100 bg-slate-50/30 opacity-40 cursor-not-allowed'
                : activeArea === 'almacen' 
                  ? 'border-slate-600 bg-slate-50/30 ring-1 ring-slate-600 shadow-xs cursor-pointer' 
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer'
            }`}
          >
            <div className="flex justify-between items-start w-full">
              <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              {isRestrictedOperator && currentUser.area !== 'almacen' ? (
                <span className="text-[9px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-extrabold flex items-center gap-1">
                  🔒 BLOQUEADO
                </span>
              ) : (
                <span className={`w-2 h-2 rounded-full ${activeArea === 'almacen' ? 'bg-slate-600 animate-pulse' : 'bg-slate-300'}`}></span>
              )}
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">Área de Planta</span>
              <h4 className="font-bold text-slate-800 text-xs uppercase leading-tight mt-0.5">Almacén de PT</h4>
              <p className="text-[9px] text-slate-500 mt-0.5 leading-none">Cámaras y Despacho</p>
            </div>
            <div className="pt-2 border-t border-slate-100/80 flex items-baseline justify-between w-full">
              <span className="text-[9px] text-slate-400 font-bold font-mono">READY PT:</span>
              <span className="text-sm font-black font-mono text-slate-700">{stats.logisticsBreakdown.plantaAlmacen || 0} u.</span>
            </div>
          </button>

          {/* Option 4: PLANTA EL ALTO (TOTAL) */}
          <button
            onClick={() => setActiveArea('general')}
            disabled={isRestrictedOperator}
            className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between space-y-2 active:scale-[0.98] ${
              isRestrictedOperator
                ? 'border-slate-100 bg-slate-50/30 opacity-40 cursor-not-allowed'
                : activeArea === 'general' 
                  ? 'border-amber-500 bg-amber-50/20 ring-1 ring-amber-500 shadow-xs cursor-pointer' 
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer'
            }`}
          >
            <div className="flex justify-between items-start w-full">
              <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                <Building2 className="w-4 h-4" />
              </div>
              {isRestrictedOperator ? (
                <span className="text-[9px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-extrabold flex items-center gap-1">
                  🔒 BLOQUEADO
                </span>
              ) : (
                <span className={`w-2 h-2 rounded-full ${activeArea === 'general' ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`}></span>
              )}
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase text-amber-600/80 tracking-wider block">PLANTA TOTAL</span>
              <h4 className="font-black text-[#003366] text-xs uppercase leading-tight mt-0.5">Planta El Alto</h4>
              <p className="text-[9px] text-slate-500 mt-0.5 leading-none">Suma de las 3 Áreas Internas</p>
            </div>
            <div className="pt-2 border-t border-slate-100/80 flex items-baseline justify-between w-full">
              <span className="text-[9px] text-slate-400 font-bold font-mono">STOCK TOTAL:</span>
              <span className="text-sm font-black font-mono text-[#003366]">
                {(stats.logisticsBreakdown.plantaDisponibles || 0) + 
                 (stats.logisticsBreakdown.produccion || 0) + 
                 (stats.logisticsBreakdown.plantaAlmacen || 0)} u.
              </span>
            </div>
          </button>

        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Stock Total */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Stock Actual • {sucursalLabel}</span>
            <span className="text-2xl font-extrabold font-mono text-[#003366]">{currentSucursalStock}</span>
            <span className="text-[10px] text-slate-500 block">
              {sucursalSubtitle} <span className="text-slate-400">({stats.totalCurrentStock} en circ.)</span>
            </span>
          </div>
          <div className="p-2.5 bg-[#003366]/10 rounded-lg text-[#003366]">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Ingresos del día */}
        <div 
          onClick={() => onNavigateToMovements('ingreso')}
          className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Ingresos de Hoy</span>
            <span className="text-2xl font-extrabold font-mono text-emerald-600">+{stats.todayIngresos}</span>
            <span className="text-[10px] text-emerald-600 group-hover:underline block font-bold">Registrar nuevo ingreso</span>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Salidas del día */}
        <div 
          onClick={() => onNavigateToMovements('salida')}
          className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Salidas de Hoy</span>
            <span className="text-2xl font-extrabold font-mono text-orange-600">-{stats.todaySalidas}</span>
            <span className="text-[10px] text-orange-600 group-hover:underline block font-bold">Registrar nueva salida</span>
          </div>
          <div className="p-2.5 bg-orange-50 rounded-lg text-orange-600 group-hover:scale-105 transition-transform">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Alertas */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Alertas de Stock</span>
            <span className={`text-2xl font-extrabold font-mono ${
              criticalStockCount > 0 ? 'text-red-500' : lowStockCount > 0 ? 'text-amber-500' : 'text-slate-400'
            }`}>
              {criticalStockCount + lowStockCount}
            </span>
            <span className="text-[10px] text-slate-500 block">
              {criticalStockCount} Crítico | {lowStockCount} Bajo
            </span>
          </div>
          <div className={`p-2.5 rounded-lg ${
            criticalStockCount > 0 ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* PLANTA EL ALTO Division Hub (Majestic Centered Control Section) */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-5 rounded-xl text-white shadow-lg space-y-4 border border-blue-900/40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/25 text-blue-300 border border-blue-500/40 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 animate-spin" />
                Sección Principal
              </span>
              <span className="text-xs text-slate-400 font-semibold">• Planta El Alto</span>
            </div>
            <h2 className="text-lg font-black tracking-tight font-display text-white">🏢 CONTROL DE ÁREAS Y TRABAJO INTERNO</h2>
            <p className="text-[11px] text-slate-300 max-w-2xl leading-relaxed">
              El flujo de los activos se divide en tres áreas secuenciales. Las devoluciones de choferes inflan <strong>Activos Logísticos</strong>; éstos se lavan y transfieren a <strong>Producción</strong>, donde se cargan de producto terminado para ser custodiados en <strong>Almacén PT</strong> y finalmente despachados a las CDs de distribución.
            </p>
          </div>
          
          <button
            onClick={() => openTransfer('Planta_Disponibles', 'Produccion', 'Lavado diario y envío rápido de canastillos a Producción')}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg shadow-md font-extrabold text-[11px] uppercase tracking-wider transition-all cursor-pointer active:scale-95"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Traspaso Rápido
          </button>
        </div>

        {/* Division Selector Tabs */}
        <div className="flex flex-wrap gap-1 bg-black/40 p-1 rounded-lg border border-blue-900/30 text-[11px] font-bold">
          <button
            onClick={() => setActiveArea('general')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeArea === 'general' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/30'
            }`}
          >
            📊 Mapa de Flujo General
          </button>
          <button
            onClick={() => setActiveArea('activos')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeArea === 'activos' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/30'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            🧼 1. Activos Logísticos
          </button>
          <button
            onClick={() => setActiveArea('produccion')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeArea === 'produccion' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/30'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            🏭 2. Producción
          </button>
          <button
            onClick={() => setActiveArea('almacen')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeArea === 'almacen' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/30'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            📦 3. Almacén PT
          </button>
        </div>

        {activeArea === 'general' && (
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col space-y-4">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              Esquema de Conexión de Activos Retornables (Planta El Alto)
            </span>

            {/* Visual connected cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 relative">
              
              {/* Box 1: ACTIVOS LOGISTICOS */}
              <div className="bg-slate-950/80 p-3.5 rounded-lg border border-emerald-500/30 hover:border-emerald-500/60 transition-all flex flex-col justify-between space-y-3 shadow-md relative group">
                <div className="absolute top-2.5 right-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                  Recepción Vacíos
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <Warehouse className="w-4 h-4" />
                    <span className="text-xs font-extrabold uppercase tracking-wider">1. Activos Logísticos</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Punto de entrada de choferes y CDs. Custodia los canastillos vacíos que están listos para lavado y clasificación.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-baseline justify-between">
                  <span className="text-[9px] text-slate-500 font-bold">STOCK VACÍO:</span>
                  <span className="text-xl font-mono font-black text-emerald-400">
                    {stats.logisticsBreakdown.plantaDisponibles || 0} <span className="text-[9px] font-sans font-medium text-slate-500">unids</span>
                  </span>
                </div>
                <button
                  onClick={() => openTransfer('Planta_Disponibles', 'Produccion', 'Canastillos vacíos limpios enviados a faja de producción')}
                  className="w-full py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase rounded border border-emerald-500/20 hover:border-emerald-500/40 cursor-pointer transition-all active:scale-95"
                >
                  Lavar y Enviar a Producción ➔
                </button>
              </div>

              {/* Box 2: PRODUCCIÓN */}
              <div className="bg-slate-950/80 p-3.5 rounded-lg border border-blue-500/30 hover:border-blue-500/60 transition-all flex flex-col justify-between space-y-3 shadow-md relative group">
                <div className="absolute top-2.5 right-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                  Envasado / Llenado
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-blue-400">
                    <Package className="w-4 h-4" />
                    <span className="text-xs font-extrabold uppercase tracking-wider">2. Producción</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Recibe los canastillos limpios. Se cargan de helado u otros productos lácteos y se despachan de forma inmediata a cámaras.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-baseline justify-between">
                  <span className="text-[9px] text-slate-500 font-bold">EN PROCESO:</span>
                  <span className="text-xl font-mono font-black text-blue-400">
                    {stats.logisticsBreakdown.produccion || 0} <span className="text-[9px] font-sans font-medium text-slate-500">unids</span>
                  </span>
                </div>
                <button
                  onClick={() => openTransfer('Produccion', 'Planta_Almacen', 'Canastillos llenos de helado envasado transferidos a Almacén PT')}
                  className="w-full py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase rounded border border-blue-500/20 hover:border-blue-500/40 cursor-pointer transition-all active:scale-95"
                >
                  Enviar Llenos a Almacén PT ➔
                </button>
              </div>

              {/* Box 3: ALMACEN DE PRODUCTO TERMINADO */}
              <div className="bg-slate-950/80 p-3.5 rounded-lg border border-slate-500/30 hover:border-slate-500/60 transition-all flex flex-col justify-between space-y-3 shadow-md relative group">
                <div className="absolute top-2.5 right-2.5 bg-slate-500/15 text-slate-300 border border-slate-500/20 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                  Cámaras / Despacho
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs font-extrabold uppercase tracking-wider">3. Almacén Producto Terminado</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Depósito refrigerado central. Custodia las canastillas llenas listas para ser cargadas en camiones de reparto a CDs de todo el país.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-baseline justify-between">
                  <span className="text-[9px] text-slate-500 font-bold">READY / DISPONIBLE PT:</span>
                  <span className="text-xl font-mono font-black text-slate-200">
                    {stats.logisticsBreakdown.plantaAlmacen || 0} <span className="text-[9px] font-sans font-medium text-slate-500">unids</span>
                  </span>
                </div>
                <button
                  onClick={() => onNavigateToMovements('salida')}
                  className="w-full py-1.5 bg-slate-100 hover:bg-white text-slate-900 text-[10px] font-bold uppercase rounded border border-slate-200 cursor-pointer transition-all active:scale-95"
                >
                  Registrar Despacho a CDs 🚚
                </button>
              </div>

            </div>

            {/* Plant General item-by-item breakdown */}
            <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 space-y-3 mt-2">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Activity className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-extrabold uppercase tracking-wider">Saldos Consolidados de Planta El Alto</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Suma total del inventario de canastillas en los tres sectores (Activos Logísticos + Producción + Almacén PT).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                {stocks.map(item => {
                  const plantStock = (item.breakdown.plantaDisponibles || 0) + 
                                     (item.breakdown.produccion || 0) + 
                                     (item.breakdown.plantaAlmacen || 0);
                  return (
                    <div key={item.id} className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded border border-slate-800 font-mono text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                        <span className="font-bold truncate text-slate-200">{item.name}</span>
                        <span className="text-[9px] text-slate-500 font-sans">[{item.code}]</span>
                      </div>
                      <div className="text-right flex flex-col">
                        <span className="text-amber-400 font-extrabold text-sm">{plantStock} u.</span>
                        <span className="text-[8px] text-slate-500 font-sans tracking-wide">
                          ({item.breakdown.plantaDisponibles || 0} L • {item.breakdown.produccion || 0} P • {item.breakdown.plantaAlmacen || 0} A)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}���


        {activeArea === 'activos' && (
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <Warehouse className="w-5 h-5" />
              <span className="font-extrabold text-sm uppercase tracking-wider">Detalle del Área: Activos Logísticos (Recepción de Canastillos)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-slate-950/50 p-3 rounded-lg border border-slate-800 space-y-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block">Propósito y Funcionamiento</span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Todo ingreso de canastillos vacíos proveniente de los Centros de Distribución o de las devoluciones de rutas del mercado ingresa a este departamento. Este inventario representa las canastillas que deben lavarse e higienizarse antes de ser suministradas a la línea de envasado industrial.
                </p>
                <div className="bg-emerald-500/10 p-2.5 rounded border border-emerald-500/20 flex gap-2 items-start text-[10px] text-emerald-300">
                  <Info className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
                  <div>
                    <span className="font-bold">Efecto Operativo:</span> Las entradas de choferes o CDs (ej. ingresos rápidos de vacíos) inflan directamente este stock. Es el pulmón de reservas de planta.
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 space-y-2.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block">Saldos de Activos en Lavado</span>
                <div className="space-y-1.5 font-mono text-xs">
                  {stocks.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-900/40 p-1.5 rounded border border-slate-800">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span className="font-bold truncate text-slate-300">{item.name}</span>
                      </div>
                      <span className="text-emerald-400 font-extrabold">{item.breakdown.plantaDisponibles} u.</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeArea === 'produccion' && (
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-blue-400">
              <Package className="w-5 h-5" />
              <span className="font-extrabold text-sm uppercase tracking-wider">Detalle del Área: Departamento de Producción (Envasado)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-slate-950/50 p-3 rounded-lg border border-slate-800 space-y-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block">Propósito y Funcionamiento</span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Producción retira los activos limpios de Activos Logísticos. En las fajas de embotellado y envasado, los canastillos se llenan con helados de crema, agua, postres o lácteos Delizia listos. El activo pasa a albergar producto y debe ser transferido al Almacén de Producto Terminado para mantener liberada la zona de fajas.
                </p>
                <div className="bg-blue-500/10 p-2.5 rounded border border-blue-500/20 flex gap-2 items-start text-[10px] text-blue-300">
                  <Info className="w-4 h-4 flex-shrink-0 text-blue-400 mt-0.5" />
                  <div>
                    <span className="font-bold">Efecto Operativo:</span> La cantidad acumulada aquí debe ser envasada y movida con prontitud a Almacén PT. Evite cuellos de botella en la zona de fajas de planta.
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 space-y-2.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block">Saldos de Activos en Faja</span>
                <div className="space-y-1.5 font-mono text-xs">
                  {stocks.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-900/40 p-1.5 rounded border border-slate-800">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span className="font-bold truncate text-slate-300">{item.name}</span>
                      </div>
                      <span className="text-blue-400 font-extrabold">{item.breakdown.produccion} u.</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeArea === 'almacen' && (
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-extrabold text-sm uppercase tracking-wider">Detalle del Área: Almacén de Producto Terminado (Despacho PT)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-slate-950/50 p-3 rounded-lg border border-slate-800 space-y-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block">Propósito y Funcionamiento</span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Las canastillas llenas y congeladas provenientes de producción se guardan bajo temperaturas extremas en las cámaras de producto terminado. Desde aquí se cargan los pedidos de los camiones de distribución interdepartamentales o locales de reparto a las distintas CDs del país.
                </p>
                <div className="bg-slate-500/10 p-2.5 rounded border border-slate-500/20 flex gap-2 items-start text-[10px] text-slate-300">
                  <Info className="w-4 h-4 flex-shrink-0 text-slate-400 mt-0.5" />
                  <div>
                    <span className="font-bold">Efecto Operativo:</span> Es el último paso del activo en Planta El Alto. Al ser despachados a CDs, salen de las dependencias de Planta El Alto e ingresan a la categoría de "En Reparto" o "En Distribución CD".
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 space-y-2.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block">Saldos en Cámara PT</span>
                <div className="space-y-1.5 font-mono text-xs">
                  {stocks.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-900/40 p-1.5 rounded border border-slate-800">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span className="font-bold truncate text-slate-300">{item.name}</span>
                      </div>
                      <span className="text-slate-300 font-extrabold">{item.breakdown.plantaAlmacen} u.</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Returnable Logistics Breakdown - Interactive Semaphores Split */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3.5">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm font-display">Semáforo de Ubicación e Inventario de Activos</h3>
          <p className="text-[11px] text-slate-500">
            Vista agrupada del stock físico actual, dividido entre las dependencias internas de Planta y el flujo de distribución externo.
          </p>
        </div>

        {/* Main Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Group 1: PLANTA GENERAL */}
          <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center gap-1.5 px-1">
              <Warehouse className="w-4 h-4 text-[#003366]" />
              <span className="text-[10px] font-extrabold text-[#003366] uppercase tracking-wider">
                PLANTA GENERAL (Control Interno)
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* General Planta Total */}
              <div className="bg-white p-2.5 rounded-lg border border-slate-150 text-center space-y-0.5 shadow-xs">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">GLOBAL DE STOCK</span>
                <span className="text-base font-black font-mono text-[#003366]">
                  {stats.logisticsBreakdown.planta}
                </span>
                <span className="text-[8px] text-slate-500 block">Suma de Áreas</span>
              </div>

              {/* Disponibles */}
              <div 
                onClick={() => setActiveArea('activos')}
                className="bg-white p-2.5 rounded-lg border border-emerald-100 text-center space-y-0.5 shadow-xs cursor-pointer hover:border-emerald-500 transition-all"
              >
                <div className="flex justify-center mb-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span></div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">ACTIVOS LOGÍSTICOS</span>
                <span className="text-base font-black font-mono text-emerald-600">
                  {stats.logisticsBreakdown.plantaDisponibles || 0}
                </span>
                <span className="text-[8px] text-emerald-500 block">Listos / Vacíos</span>
              </div>

              {/* Producción */}
              <div 
                onClick={() => setActiveArea('produccion')}
                className="bg-white p-2.5 rounded-lg border border-blue-100 text-center space-y-0.5 shadow-xs cursor-pointer hover:border-blue-500 transition-all"
              >
                <div className="flex justify-center mb-0.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span></div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">PRODUCCIÓN</span>
                <span className="text-base font-black font-mono text-blue-600">
                  {stats.logisticsBreakdown.produccion || 0}
                </span>
                <span className="text-[8px] text-blue-500 block">En envasado</span>
              </div>

              {/* Almacén */}
              <div 
                onClick={() => setActiveArea('almacen')}
                className="bg-white p-2.5 rounded-lg border border-slate-200 text-center space-y-0.5 shadow-xs cursor-pointer hover:border-slate-500 transition-all"
              >
                <div className="flex justify-center mb-0.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span></div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">ALMACÉN DE PT</span>
                <span className="text-base font-black font-mono text-slate-700">
                  {stats.logisticsBreakdown.plantaAlmacen || 0}
                </span>
                <span className="text-[8px] text-slate-500 block">Cámaras PT</span>
              </div>
            </div>
          </div>

          {/* Group 2: LOGÍSTICA EXTERNA EN CIRCULACIÓN */}
          <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center gap-1.5 px-1">
              <Truck className="w-4 h-4 text-orange-600" />
              <span className="text-[10px] font-extrabold text-orange-600 uppercase tracking-wider">
                DISTRIBUCIÓN EXTERNA (Fuera de Planta)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* En Reparto */}
              <div className="bg-white p-2.5 rounded-lg border border-sky-100 text-center space-y-0.5 shadow-xs">
                <div className="flex justify-center mb-0.5"><span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span></div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">EN REPARTO</span>
                <span className="text-base font-black font-mono text-sky-600">{stats.logisticsBreakdown.reparto}</span>
                <span className="text-[8px] text-slate-500 block">En camión</span>
              </div>

              {/* En Clientes */}
              <div className="bg-white p-2.5 rounded-lg border border-blue-150 text-center space-y-0.5 shadow-xs">
                <div className="flex justify-center mb-0.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span></div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">EN CLIENTES</span>
                <span className="text-base font-black font-mono text-blue-700">{stats.logisticsBreakdown.clientes}</span>
                <span className="text-[8px] text-slate-500 block">Entregados</span>
              </div>

              {/* Pendientes */}
              <div className="bg-white p-2.5 rounded-lg border border-amber-100 text-center space-y-0.5 shadow-xs">
                <div className="flex justify-center mb-0.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span></div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">PENDIENTES</span>
                <span className="text-base font-black font-mono text-amber-600">{stats.logisticsBreakdown.pendientes}</span>
                <span className="text-[8px] text-slate-500 block">Por retornar</span>
              </div>

              {/* Dañados & Reparación grouped */}
              <div className="bg-white p-2.5 rounded-lg border border-red-100 text-center space-y-0.5 shadow-xs">
                <div className="flex justify-center mb-0.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span></div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">RECHAZADOS</span>
                <span className="text-base font-black font-mono text-red-500">
                  {stats.logisticsBreakdown.danado + stats.logisticsBreakdown.reparacion}
                </span>
                <span className="text-[8px] text-slate-500 block">Rotas/Taller</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Main Section: Chart & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Movements Chart Card */}
        <div className="lg:col-span-2 bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col space-y-3">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm font-display">Histórico de Movimientos (Últimos 7 Días)</h3>
            <p className="text-[11px] text-slate-500">Volumen comparativo de ingresos y salidas diarias</p>
          </div>

          {/* Custom Interactive SVG Chart */}
          <div className="flex-1 flex flex-col justify-center items-center min-h-[200px]">
            <svg 
              className="w-full h-auto max-w-lg overflow-visible" 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            >
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
                const y = chartHeight - (p * (chartHeight - 40)) - 25;
                const value = Math.round(p * maxMoveValue);
                return (
                  <g key={idx}>
                    <line 
                      x1="45" 
                      y1={y} 
                      x2={chartWidth} 
                      y2={y} 
                      stroke="#f1f5f9" 
                      strokeWidth="1" 
                    />
                    <text 
                      x="35" 
                      y={y + 3} 
                      fill="#94a3b8" 
                      fontSize="9" 
                      textAnchor="end" 
                      fontFamily="monospace"
                    >
                      {value}
                    </text>
                  </g>
                );
              })}

              {/* Data Bars */}
              {stats.dailyChartData.map((d, i) => {
                const xBase = i * groupWidth + 60;
                
                // Calculate height proportionally
                const ingHeight = d.ingresos > 0 ? (d.ingresos / maxMoveValue) * (chartHeight - 40) : 0;
                const salHeight = d.salidas > 0 ? (d.salidas / maxMoveValue) * (chartHeight - 40) : 0;

                const yBaseline = chartHeight - 25;

                return (
                  <g key={i}>
                    {/* Ingresos bar (Green) */}
                    {d.ingresos > 0 && (
                      <g className="group/bar">
                        <rect 
                          x={xBase - barPadding} 
                          y={yBaseline - ingHeight} 
                          width="10" 
                          height={ingHeight} 
                          fill="#10b981" 
                          rx="2"
                          className="transition-all hover:fill-emerald-400"
                        />
                        <title>{`Ingresos: ${d.ingresos}`}</title>
                      </g>
                    )}

                    {/* Salidas bar (Orange) */}
                    {d.salidas > 0 && (
                      <g className="group/bar">
                        <rect 
                          x={xBase + 2} 
                          y={yBaseline - salHeight} 
                          width="10" 
                          height={salHeight} 
                          fill="#f97316" 
                          rx="2"
                          className="transition-all hover:fill-orange-400"
                        />
                        <title>{`Salidas: ${d.salidas}`}</title>
                      </g>
                    )}

                    {/* X Label */}
                    <text 
                      x={xBase} 
                      y={chartHeight - 6} 
                      fill="#64748b" 
                      fontSize="9" 
                      textAnchor="middle"
                      className="font-medium"
                    >
                      {d.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Chart Legend */}
            <div className="flex gap-4 mt-2 text-[10px] font-semibold">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-[#10b981] rounded"></span>
                <span className="text-slate-600">Ingresos</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-[#f97316] rounded"></span>
                <span className="text-slate-600">Salidas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Movements List */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col space-y-3">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm font-display">Últimos Registros</h3>
            <p className="text-[11px] text-slate-500">Monitoreo del flujo logístico inmediato</p>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-[220px] pr-1">
            {stats.recentMovements.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-8">
                <ClipboardList className="w-6 h-6 opacity-40 mb-1" />
                <span className="text-[11px]">No hay movimientos registrados hoy</span>
              </div>
            ) : (
              stats.recentMovements.map(m => (
                <div key={m.id} className="p-2 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-100 text-[11px]">
                  <div className="flex items-center gap-2">
                    <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${
                      m.type === 'ingreso' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {m.type === 'ingreso' ? 'ING' : 'SAL'}
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-semibold text-slate-800 truncate">{m.itemName}</div>
                      <div className="text-[9px] text-slate-400 uppercase font-bold truncate">
                        {m.entity} {m.orderNumber ? `• ORD: ${m.orderNumber}` : ''} • {formatTime(m.time)}
                      </div>
                      {m.fromStatus && (
                        <div className="text-[8px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded inline-block font-medium">
                          🔄 Traspaso: {dynamicLabels[m.fromStatus] || m.fromStatus} ➔ {dynamicLabels[m.crateStatus] || m.crateStatus}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-0.5 flex-shrink-0">
                    <div className={`font-mono font-bold text-xs ${
                      m.type === 'ingreso' ? 'text-emerald-600' : 'text-orange-600'
                    }`}>
                      {m.type === 'ingreso' ? '+' : '-'}{m.quantity}
                    </div>
                    <div className="text-[9px] text-slate-400">@{m.user}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Stock Alerts Panel */}
      {stats.stockAlerts.length > 0 && (
        <div className="bg-amber-50/30 border border-amber-200 p-4 rounded-lg">
          <div className="flex gap-1.5 items-center text-amber-800 font-bold text-xs font-display mb-2.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Alertas Preventivas de Stock Crítico
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {stats.stockAlerts.map(alert => (
              <div 
                key={alert.itemId} 
                className="bg-white p-2.5 rounded-lg border border-amber-150 shadow-sm flex items-center justify-between text-[11px]"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-800">{alert.name}</div>
                  <div className="font-mono text-slate-400 text-[9px]">{alert.code}</div>
                </div>
                <div className="text-right space-y-0.5">
                  <div className="font-bold text-red-600 font-mono text-xs">{alert.stockActual} items</div>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-semibold ${
                    alert.alertType === 'Critico' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'
                  }`}>
                    {alert.alertType === 'Critico' ? 'Inexistente' : 'Stock Bajo'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TRASPASO RÁPIDO MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/65 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-900 to-slate-950 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-orange-400" />
                <h3 className="font-bold font-display text-sm tracking-tight">Traspaso Interno • Planta El Alto</h3>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="p-4 space-y-3.5">
              {transferError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-[11px] p-2.5 rounded-lg font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  {transferError}
                </div>
              )}

              {transferSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-[11px] p-2.5 rounded-lg font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 animate-bounce" />
                  {transferSuccess}
                </div>
              )}

              {/* Readonly transition schematic */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-center">
                <div className="flex-1">
                  <div className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400">Origen</div>
                  <div className="text-[10px] font-bold text-slate-700 uppercase mt-0.5 truncate">
                    {transferSource === 'Planta_Disponibles' ? 'Clean Activos' : 'Fajas Producción'}
                  </div>
                </div>
                <div className="p-1.5 bg-slate-200 rounded-full text-slate-500">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400">Destino</div>
                  <div className="text-[10px] font-bold text-slate-700 uppercase mt-0.5 truncate">
                    {transferTarget === 'Produccion' ? 'Fajas Producción' : 'Cámaras PT'}
                  </div>
                </div>
              </div>

              {/* Item selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tipo de Canastillo / Rejilla</label>
                <select
                  value={transferItem}
                  onChange={(e) => setTransferItem(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Seleccione Canastillo --</option>
                  {items.filter(i => i.status === 'Activo').map(i => {
                    const stockStats = stocks.find(s => s.id === i.id);
                    const sourceKey = transferSource === 'Planta_Disponibles' ? 'plantaDisponibles' : 'produccion';
                    const availableInSource = stockStats ? (stockStats.breakdown[sourceKey] || 0) : 0;
                    return (
                      <option key={i.id} value={i.id}>
                        {i.name} [{i.code}] - (Disponibles en Origen: {availableInSource})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Quantity */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={transferQty}
                    onChange={(e) => setTransferQty(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white font-mono font-bold"
                  />
                </div>

                {/* Doc number */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nº de Documento / Traspaso</label>
                  <input
                    type="text"
                    value={transferDocNum}
                    onChange={(e) => setTransferDocNum(e.target.value.toUpperCase())}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white font-mono font-bold"
                    placeholder="TR-..."
                  />
                </div>
              </div>

              {/* Responsible */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Responsable de Operación</label>
                <div className="flex gap-1.5">
                  <select
                    value={transferResponsible}
                    onChange={(e) => setTransferResponsible(e.target.value)}
                    className="flex-1 text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Seleccionar Responsable --</option>
                    {responsibles.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={transferResponsible}
                    onChange={(e) => setTransferResponsible(e.target.value.toUpperCase())}
                    placeholder="OTRO / ESCRIBIR"
                    className="w-1/3 text-xs p-2.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              {/* Details */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Detalles / Motivo del Traspaso</label>
                <textarea
                  value={transferDetails}
                  onChange={(e) => setTransferDetails(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white h-14 resize-none"
                  placeholder="Ej: Lavado completado de lote turno mañana..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  disabled={isSubmittingTransfer}
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 py-2.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold rounded-lg cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTransfer}
                  className="flex-1 py-2.5 text-xs text-white bg-gradient-to-r from-[#003366] to-blue-800 hover:from-blue-900 hover:to-blue-950 font-bold rounded-lg cursor-pointer text-center active:scale-95 transition-all shadow-sm flex justify-center items-center gap-1.5"
                >
                  {isSubmittingTransfer ? 'Procesando...' : 'Confirmar Traspaso'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
