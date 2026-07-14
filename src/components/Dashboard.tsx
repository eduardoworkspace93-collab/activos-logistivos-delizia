import React from 'react';
import { DashboardStats, StockStats, AppConfig } from '../types.js';
import { 
  Package, TrendingUp, TrendingDown, ClipboardList, 
  AlertTriangle, Truck, Users, RefreshCw, Layers, CheckCircle2, Warehouse
} from 'lucide-react';
import { formatDate, formatTime } from '../utils.js';

interface DashboardProps {
  stats: DashboardStats;
  stocks: StockStats[];
  config: AppConfig;
  onRefresh: () => void;
  onNavigateToMovements: (type: 'ingreso' | 'salida') => void;
}

export default function Dashboard({ stats, stocks, config, onRefresh, onNavigateToMovements }: DashboardProps) {
  // Find largest stock and lowest stock
  const lowStockThreshold = 50;
  const criticalStockCount = stats.stockAlerts.filter(a => a.alertType === 'Critico').length;
  const lowStockCount = stats.stockAlerts.filter(a => a.alertType === 'Bajo').length;

  // Render SVG chart
  const maxMoveValue = Math.max(...stats.dailyChartData.map(d => Math.max(d.ingresos, d.salidas, 50)));
  const chartHeight = 180;
  const chartWidth = 500;
  const barPadding = 12;
  const groupWidth = (chartWidth / stats.dailyChartData.length);

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
          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-all cursor-pointer border border-slate-200 active:scale-95"
          title="Actualizar datos"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Stock Total */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Stock Actual</span>
            <span className="text-2xl font-extrabold font-mono text-[#003366]">{stats.totalCurrentStock}</span>
            <span className="text-[10px] text-slate-500 block">Activos en circulación</span>
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
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">STOCK GENERAL PLANTA</span>
                <span className="text-base font-black font-mono text-[#003366]">
                  {stats.logisticsBreakdown.planta}
                </span>
                <span className="text-[8px] text-slate-500 block">Suma de Áreas</span>
              </div>

              {/* Disponibles */}
              <div className="bg-white p-2.5 rounded-lg border border-emerald-100 text-center space-y-0.5 shadow-xs">
                <div className="flex justify-center mb-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span></div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">STOCK DISPONIBLE PLANTA</span>
                <span className="text-base font-black font-mono text-emerald-600">
                  {stats.logisticsBreakdown.plantaDisponibles || 0}
                </span>
                <span className="text-[8px] text-slate-500 block">Listos para usar</span>
              </div>

              {/* Producción */}
              <div className="bg-white p-2.5 rounded-lg border border-blue-100 text-center space-y-0.5 shadow-xs">
                <div className="flex justify-center mb-0.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span></div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">STOCK PRODUCCION</span>
                <span className="text-base font-black font-mono text-blue-600">
                  {stats.logisticsBreakdown.produccion || 0}
                </span>
                <span className="text-[8px] text-slate-500 block">En envasado</span>
              </div>

              {/* Almacén */}
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center space-y-0.5 shadow-xs">
                <div className="flex justify-center mb-0.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span></div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">STOCK ALMACEN PLANTA</span>
                <span className="text-base font-black font-mono text-slate-700">
                  {stats.logisticsBreakdown.plantaAlmacen || 0}
                </span>
                <span className="text-[8px] text-slate-500 block">Reservas</span>
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
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-800">{m.itemName}</div>
                      <div className="text-[9px] text-slate-400 uppercase font-bold">
                        {m.entity} {m.orderNumber ? `• ORD: ${m.orderNumber}` : ''} • {formatTime(m.time)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
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

    </div>
  );
}
