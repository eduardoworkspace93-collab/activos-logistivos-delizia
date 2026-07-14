import React, { useState } from 'react';
import { Movement, StockStats, AppConfig } from '../types.js';
import { FileText, Printer, FileSpreadsheet, Calendar, TrendingUp, TrendingDown, Layers, BarChart3 } from 'lucide-react';
import { exportToCSV, formatDate, formatTime } from '../utils.js';

interface ReportesProps {
  movements: Movement[];
  stocks: StockStats[];
  config: AppConfig;
}

export default function Reportes({ movements, stocks, config }: ReportesProps) {
  const [reportType, setReportType] = useState<'movimientos_diarios' | 'movimientos_mensuales' | 'stock_actual' | 'resumen_flujo'>('movimientos_diarios');

  // 1. Calculations for Daily Movements Summary
  const todayStr = new Date().toISOString().split('T')[0];
  const dailyMovements = movements.filter(m => m.date === todayStr);
  const totalDailyIngresos = dailyMovements.filter(m => m.type === 'ingreso').reduce((sum, m) => sum + m.quantity, 0);
  const totalDailySalidas = dailyMovements.filter(m => m.type === 'salida').reduce((sum, m) => sum + m.quantity, 0);

  // 2. Monthly Calculations
  const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM
  const monthlyMovements = movements.filter(m => m.date.startsWith(currentMonthStr));
  const totalMonthlyIngresos = monthlyMovements.filter(m => m.type === 'ingreso').reduce((sum, m) => sum + m.quantity, 0);
  const totalMonthlySalidas = monthlyMovements.filter(m => m.type === 'salida').reduce((sum, m) => sum + m.quantity, 0);

  // Handle Export based on selected report
  const handleExport = () => {
    let dataToExport: any[] = [];
    let filename = '';
    let headers: { key: string; label: string }[] = [];

    if (reportType === 'movimientos_diarios' || reportType === 'movimientos_mensuales') {
      const targetMoves = reportType === 'movimientos_diarios' ? dailyMovements : monthlyMovements;
      filename = reportType === 'movimientos_diarios' ? 'Reporte_Movimientos_Diarios_Delizia' : 'Reporte_Movimientos_Mensuales_Delizia';
      
      dataToExport = targetMoves.map(m => ({
        folio: m.movementNumber,
        fecha: formatDate(m.date),
        hora: formatTime(m.time),
        tipo: m.type.toUpperCase(),
        item: m.itemName,
        cantidad: m.quantity,
        entidad: m.entity,
        responsable: m.responsible,
        estado: m.crateStatus,
        usuario: m.user
      }));

      headers = [
        { key: 'folio', label: 'Folio' },
        { key: 'fecha', label: 'Fecha' },
        { key: 'hora', label: 'Hora' },
        { key: 'tipo', label: 'Tipo Operación' },
        { key: 'item', label: 'Canastillo' },
        { key: 'cantidad', label: 'Cantidad' },
        { key: 'entidad', label: 'Origen/Destino' },
        { key: 'responsable', label: 'Responsable Firma' },
        { key: 'estado', label: 'Estado Físico' },
        { key: 'usuario', label: 'Registrante' }
      ];
    } else if (reportType === 'stock_actual') {
      filename = 'Reporte_Existencias_Stock_Canastillos_Delizia';
      dataToExport = stocks.map(s => ({
        codigo: s.code,
        nombre: s.name,
        capacidad: s.capacity,
        ingresos: s.totalIngresos,
        salidas: s.totalSalidas,
        stock: s.stockActual,
        planta: s.breakdown.planta,
        reparto: s.breakdown.reparto,
        clientes: s.breakdown.clientes,
        dañados: s.breakdown.danado,
        reparacion: s.breakdown.reparacion
      }));

      headers = [
        { key: 'codigo', label: 'Código' },
        { key: 'nombre', label: 'Canastillo' },
        { key: 'capacidad', label: 'Capacidad Unit.' },
        { key: 'ingresos', label: 'Total Entradas' },
        { key: 'salidas', label: 'Total Salidas' },
        { key: 'stock', label: 'Stock Planta' },
        { key: 'planta', label: 'En Bodega' },
        { key: 'reparto', label: 'En Camiones' },
        { key: 'clientes', label: 'Entregados Clientes' },
        { key: 'dañados', label: 'Dañados/Mermas' },
        { key: 'reparacion', label: 'En Taller Reparación' }
      ];
    } else {
      filename = 'Resumen_Operativo_Flujo_Canastillos_Delizia';
      // Summarize by item type total flow
      dataToExport = stocks.map(s => ({
        codigo: s.code,
        nombre: s.name,
        totalOperado: s.totalIngresos + s.totalSalidas,
        tasaRetorno: s.totalIngresos > 0 ? `${((s.totalIngresos - s.breakdown.danado) / s.totalIngresos * 100).toFixed(1)}%` : '0%'
      }));

      headers = [
        { key: 'codigo', label: 'Código' },
        { key: 'nombre', label: 'Canastillo' },
        { key: 'totalOperado', label: 'Flujo Total Operado' },
        { key: 'tasaRetorno', label: 'Tasa Estimada de Retorno Útil' }
      ];
    }

    exportToCSV(dataToExport, filename, headers);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Selector Panel */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold font-display text-slate-900 leading-tight">
              Generador de Reportes y Auditoría Logística
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Seleccione el criterio analítico para compilar y exportar información de activos retornables
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer active:scale-95 shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Descargar Excel
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer active:scale-95 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Reporte
            </button>
          </div>
        </div>

        {/* Criterias Switcher tabs */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => setReportType('movimientos_diarios')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              reportType === 'movimientos_diarios'
                ? 'bg-[#003366] text-white shadow-sm'
                : 'bg-slate-50 text-slate-500 hover:text-slate-950 border border-slate-200'
            }`}
          >
            Movimientos Diarios ({dailyMovements.length})
          </button>
          <button
            onClick={() => setReportType('movimientos_mensuales')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              reportType === 'movimientos_mensuales'
                ? 'bg-[#003366] text-white shadow-sm'
                : 'bg-slate-50 text-slate-500 hover:text-slate-950 border border-slate-200'
            }`}
          >
            Movimientos Mensuales ({monthlyMovements.length})
          </button>
          <button
            onClick={() => setReportType('stock_actual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              reportType === 'stock_actual'
                ? 'bg-[#003366] text-white shadow-sm'
                : 'bg-slate-50 text-slate-500 hover:text-slate-950 border border-slate-200'
            }`}
          >
            Existencias & Merma Actual
          </button>
          <button
            onClick={() => setReportType('resumen_flujo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              reportType === 'resumen_flujo'
                ? 'bg-[#003366] text-white shadow-sm'
                : 'bg-slate-50 text-slate-500 hover:text-slate-950 border border-slate-200'
            }`}
          >
            Resumen de Flujos Operativos
          </button>
        </div>
      </div>

      {/* RENDER SELECTED REPORT */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0">
        
        {/* Document Header (Always visible in prints, styles clean) */}
        <div className="border-b-2 border-slate-200 pb-4 mb-4 flex justify-between items-start">
          <div>
            <h1 className="font-extrabold text-lg font-display text-slate-900">{config.companyName || 'DELIZIA'}</h1>
            <p className="text-[11px] text-slate-500">División de Cadena de Suministros y Logística Interna</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Cochabamba - Santa Cruz - La Paz, Bolivia</p>
          </div>
          <div className="text-right text-xs text-slate-500 space-y-0.5">
            <span className="bg-[#003366]/10 text-[#003366] px-2.5 py-0.5 rounded font-bold uppercase tracking-wide inline-block text-[9px] mb-1.5 print:border">
              Informe Oficial de Auditoría
            </span>
            <p className="font-semibold text-[11px]">Fecha Emisión: {new Date().toLocaleDateString('es-BO')}</p>
            <p className="font-mono text-[10px]">Período Operativo: {new Date().toLocaleDateString('es-BO', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        {reportType === 'movimientos_diarios' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 bg-sky-50/60 p-3 rounded-lg border border-sky-100">
              <Calendar className="text-[#003366] w-5 h-5" />
              <div>
                <h3 className="font-bold text-slate-900 text-xs">Resumen de Carga del Día</h3>
                <p className="text-[11px] text-slate-600">Total de canastillos movilizados hoy en planta central</p>
              </div>
            </div>

            {/* Quick stats columns */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-150">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Registros Totales</span>
                <span className="text-lg font-extrabold font-mono text-slate-800">{dailyMovements.length}</span>
              </div>
              <div className="p-3 bg-emerald-50/55 rounded-lg border border-emerald-100">
                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">Ingresos Totales</span>
                <span className="text-lg font-extrabold font-mono text-emerald-700">+{totalDailyIngresos} u.</span>
              </div>
              <div className="p-3 bg-orange-50/55 rounded-lg border border-orange-100">
                <span className="text-[9px] font-bold text-orange-600 uppercase tracking-wider block">Salidas Totales</span>
                <span className="text-lg font-extrabold font-mono text-orange-700">-{totalDailySalidas} u.</span>
              </div>
            </div>

            {/* Daily Grid Table */}
            <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
              <table className="w-full text-left min-w-[750px]">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 border-b border-slate-200">
                    <th className="p-2 px-3">Folio</th>
                    <th className="p-2 px-3">Hora</th>
                    <th className="p-2 px-3">Tipo</th>
                    <th className="p-2 px-3">Canastillo</th>
                    <th className="p-2 px-3 text-right">Cantidad</th>
                    <th className="p-2 px-3">Origen / Destino</th>
                    <th className="p-2 px-3">Responsable</th>
                    <th className="p-2 px-3 pr-4">Registrador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-[11px]">
                  {dailyMovements.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400">
                        No se registraron movimientos en la fecha de hoy
                      </td>
                    </tr>
                  ) : (
                    dailyMovements.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50/40">
                        <td className="p-2 px-3 font-mono font-bold text-slate-900">{m.movementNumber}</td>
                        <td className="p-2 px-3 text-slate-500">{formatTime(m.time)}</td>
                        <td className="p-2 px-3">
                          <span className={`inline-block px-1.5 py-0.5 rounded font-bold text-[9px] ${
                            m.type === 'ingreso' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                          }`}>
                            {m.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-2 px-3 font-semibold text-slate-800">{m.itemName}</td>
                        <td className="p-2 px-3 text-right font-mono font-bold text-slate-900">{m.quantity} u.</td>
                        <td className="p-2 px-3 text-slate-500">{m.entity}</td>
                        <td className="p-2 px-3 font-medium text-slate-700">{m.responsible}</td>
                        <td className="p-2 px-3 pr-4 font-mono text-slate-400">@{m.user}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'movimientos_mensuales' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 bg-indigo-50/60 p-3 rounded-lg border border-indigo-100">
              <TrendingUp className="text-indigo-700 w-5 h-5" />
              <div>
                <h3 className="font-bold text-slate-900 text-xs">Resumen de Flujos Mensuales</h3>
                <p className="text-[11px] text-slate-600">Volumen consolidado del mes de {new Date().toLocaleDateString('es-BO', { month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-150">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Operaciones</span>
                <span className="text-lg font-extrabold font-mono text-slate-800">{monthlyMovements.length}</span>
              </div>
              <div className="p-3 bg-emerald-50/55 rounded-lg border border-emerald-100">
                <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">Ingreso Consolidado</span>
                <span className="text-lg font-extrabold font-mono text-emerald-700">+{totalMonthlyIngresos} u.</span>
              </div>
              <div className="p-3 bg-orange-50/55 rounded-lg border border-orange-100">
                <span className="text-[9px] font-bold text-orange-600 uppercase tracking-wider block">Salida Consolidada</span>
                <span className="text-lg font-extrabold font-mono text-orange-700">-{totalMonthlySalidas} u.</span>
              </div>
            </div>

            {/* Monthly Grid Table */}
            <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
              <table className="w-full text-left min-w-[750px]">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 border-b border-slate-200">
                    <th className="p-2 px-3">Folio</th>
                    <th className="p-2 px-3">Fecha</th>
                    <th className="p-2 px-3">Tipo</th>
                    <th className="p-2 px-3">Canastillo</th>
                    <th className="p-2 px-3 text-right">Cantidad</th>
                    <th className="p-2 px-3">Origen / Destino</th>
                    <th className="p-2 px-3">Responsable</th>
                    <th className="p-2 px-3 pr-4">Registrador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-[11px]">
                  {monthlyMovements.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400">
                        No se registran operaciones en el período mensual vigente
                      </td>
                    </tr>
                  ) : (
                    monthlyMovements.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50/40">
                        <td className="p-2 px-3 font-mono font-bold text-slate-900">{m.movementNumber}</td>
                        <td className="p-2 px-3 text-slate-500">{formatDate(m.date)}</td>
                        <td className="p-2 px-3">
                          <span className={`inline-block px-1.5 py-0.5 rounded font-bold text-[9px] ${
                            m.type === 'ingreso' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                          }`}>
                            {m.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-2 px-3 font-semibold text-slate-800">{m.itemName}</td>
                        <td className="p-2 px-3 text-right font-mono font-bold text-slate-900">{m.quantity} u.</td>
                        <td className="p-2 px-3 text-slate-500">{m.entity}</td>
                        <td className="p-2 px-3 font-medium text-slate-700">{m.responsible}</td>
                        <td className="p-2 px-3 pr-4 font-mono text-slate-400">@{m.user}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'stock_actual' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 bg-teal-50/60 p-3 rounded-lg border border-teal-100">
              <Layers className="text-teal-700 w-5 h-5" />
              <div>
                <h3 className="font-bold text-slate-900 text-xs">Resumen de Inventario Físico</h3>
                <p className="text-[11px] text-slate-600">Control de mermas, existencias disponibles y activos en reparto exterior</p>
              </div>
            </div>

            {/* Inventory table */}
            <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 border-b border-slate-200">
                    <th className="p-2 px-3 pl-4">Código</th>
                    <th className="p-2 px-3">Canastillo</th>
                    <th className="p-2 px-3 text-center">Capacidad</th>
                    <th className="p-2 px-3 text-center text-emerald-600">Ingresos Totales</th>
                    <th className="p-2 px-3 text-center text-orange-600">Salidas Totales</th>
                    <th className="p-2 px-3 text-center bg-slate-50/50">Stock Bodega</th>
                    <th className="p-2 px-3 text-center text-sky-600">En Reparto</th>
                    <th className="p-2 px-3 text-center text-red-600 pr-4">Bajas / Daños</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-[11px]">
                  {stocks.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/40">
                      <td className="p-2 px-3 pl-4 font-mono font-bold text-slate-900">{s.code}</td>
                      <td className="p-2 px-3 font-semibold text-slate-800">{s.name}</td>
                      <td className="p-2 px-3 text-center font-mono">{s.capacity} ud.</td>
                      <td className="p-2 px-3 text-center font-mono font-medium text-emerald-600">+{s.totalIngresos}</td>
                      <td className="p-2 px-3 text-center font-mono font-medium text-orange-600">-{s.totalSalidas}</td>
                      <td className="p-2 px-3 text-center font-mono font-extrabold text-slate-900 bg-slate-50/30">{s.stockActual}</td>
                      <td className="p-2 px-3 text-center font-mono text-sky-600 font-semibold">{s.breakdown.reparto}</td>
                      <td className="p-2 px-3 text-center font-mono text-red-600 font-semibold pr-4">
                        {s.breakdown.danado} u.
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'resumen_flujo' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 bg-purple-50/60 p-3 rounded-lg border border-purple-100">
              <BarChart3 className="text-purple-700 w-5 h-5" />
              <div>
                <h3 className="font-bold text-slate-900 text-xs">Rendimiento Operativo y Tasa de Retorno</h3>
                <p className="text-[11px] text-slate-600">Análisis logístico de rotación útil de canastillos en el circuito de distribución</p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
              <table className="w-full text-left min-w-[650px]">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 border-b border-slate-200">
                    <th className="p-3 pl-6">Código Canastillo</th>
                    <th className="p-3">Canastillo</th>
                    <th className="p-3 text-center">Flujo Acumulado (Entradas + Salidas)</th>
                    <th className="p-3 text-center pr-6">Tasa Estimada de Recuperación Útil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-[11px]">
                  {stocks.map(s => {
                    const totalFlow = s.totalIngresos + s.totalSalidas;
                    const recoveryRate = s.totalIngresos > 0 
                      ? ((s.totalIngresos - s.breakdown.danado) / s.totalIngresos * 100).toFixed(1) 
                      : '100';

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/40 border-b border-slate-100">
                        <td className="p-3 pl-6 font-mono font-bold text-slate-900">{s.code}</td>
                        <td className="p-3 font-semibold text-slate-800">{s.name}</td>
                        <td className="p-3 text-center font-mono font-bold text-slate-700">{totalFlow} canastillos</td>
                        <td className="p-3 text-center pr-6">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-mono font-extrabold text-emerald-600">{recoveryRate}%</span>
                            <div className="w-24 bg-slate-100 h-1.5 rounded overflow-hidden">
                              <div className="bg-emerald-500 h-full animate-pulse" style={{ width: `${recoveryRate}%` }}></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Signature placeholders for hard copy audit archiving */}
        <div className="grid grid-cols-2 gap-12 mt-12 pt-6 border-t border-slate-200 hidden print:grid text-xs">
          <div className="flex flex-col items-center text-center">
            <div className="w-40 border-b border-slate-400 mb-1.5"></div>
            <span className="font-bold text-slate-900">Jefe de Logística y Distribución</span>
            <span className="text-[10px] text-slate-500">Autorización y Cotejo General</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-40 border-b border-slate-400 mb-1.5"></div>
            <span className="font-bold text-slate-900">Auditor de Planta Central</span>
            <span className="text-[10px] text-slate-500">Certificación de Existencias Físicas</span>
          </div>
        </div>

      </div>
    </div>
  );
}
