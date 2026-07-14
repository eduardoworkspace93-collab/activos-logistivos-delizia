import React, { useState } from 'react';
import { KardexEntry, Item } from '../types.js';
import { Search, Calendar, Filter, FileSpreadsheet, Printer, RefreshCw, ClipboardList } from 'lucide-react';
import { exportToCSV, formatDate, formatTime } from '../utils.js';

interface KardexProps {
  kardex: KardexEntry[];
  items: Item[];
  onRefresh: () => void;
}

export default function Kardex({ kardex, items, onRefresh }: KardexProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedItemCode, setSelectedItemCode] = useState('');
  const [selectedType, setSelectedType] = useState<'Todos' | 'ingreso' | 'salida'>('Todos');
  const [selectedUser, setSelectedUser] = useState('');

  // Extract unique users for filtering
  const operators = Array.from(new Set(kardex.map(k => k.user)));

  // Filter Logic
  const filteredKardex = kardex.filter(k => {
    // Date ranges
    if (startDate && k.date < startDate) return false;
    if (endDate && k.date > endDate) return false;

    // Item code
    if (selectedItemCode && k.code !== selectedItemCode) return false;

    // Movement type
    if (selectedType !== 'Todos' && k.type !== selectedType) return false;

    // User
    if (selectedUser && k.user !== selectedUser) return false;

    return true;
  });

  // Export to Excel CSV
  const handleExportExcel = () => {
    const formatted = filteredKardex.map(k => ({
      date: formatDate(k.date),
      time: formatTime(k.time),
      type: k.type.toUpperCase(),
      orderNumber: k.orderNumber || '-',
      code: k.code,
      item: k.item,
      quantity: k.quantity,
      stockBefore: k.stockBefore,
      stockAfter: k.stockAfter,
      user: k.user,
      entity: k.entity,
      details: k.details
    }));

    const headers = [
      { key: 'date', label: 'Fecha' },
      { key: 'time', label: 'Hora' },
      { key: 'type', label: 'Tipo' },
      { key: 'orderNumber', label: 'Nº Orden' },
      { key: 'code', label: 'Código Canastillo' },
      { key: 'item', label: 'Nombre Canastillo' },
      { key: 'quantity', label: 'Cantidad Operada' },
      { key: 'stockBefore', label: 'Stock Previo' },
      { key: 'stockAfter', label: 'Stock Posterior' },
      { key: 'user', label: 'Operador Responsable' },
      { key: 'entity', label: 'Origen/Destino' },
      { key: 'details', label: 'Detalles / Notas' }
    ];

    exportToCSV(formatted, 'Kardex_Historico_Movimientos_Delizia', headers);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Kardex Filters Box */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold font-display text-slate-900 leading-tight">
              Kardex de Movimiento de Activos
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Registro histórico inmutable de ingresos, salidas y saldos remanentes de canastillos
            </p>
          </div>

          {/* Export Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Excel (CSV)
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Kardex
            </button>
            <button
              onClick={onRefresh}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 rounded-lg cursor-pointer"
              title="Sincronizar"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Multi-parameter Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-1 text-xs">
          {/* Start date */}
          <div className="space-y-1">
            <label className="font-bold text-slate-400 uppercase tracking-wide block text-[9px]">Fecha Inicio</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:bg-white focus:outline-none"
            />
          </div>

          {/* End date */}
          <div className="space-y-1">
            <label className="font-bold text-slate-400 uppercase tracking-wide block text-[9px]">Fecha Fin</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:bg-white focus:outline-none"
            />
          </div>

          {/* Item filter */}
          <div className="space-y-1">
            <label className="font-bold text-slate-400 uppercase tracking-wide block text-[9px]">Tipo Canastillo</label>
            <select
              value={selectedItemCode}
              onChange={e => setSelectedItemCode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:bg-white focus:outline-none text-slate-800"
            >
              <option value="" className="text-slate-900 bg-white">-- Todos los Ítems --</option>
              {items.map(i => (
                <option key={i.id} value={i.code} className="text-slate-900 bg-white">[{i.code}] - {i.name}</option>
              ))}
            </select>
          </div>

          {/* Type filter */}
          <div className="space-y-1">
            <label className="font-bold text-slate-400 uppercase tracking-wide block text-[9px]">Tipo Movimiento</label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:bg-white focus:outline-none text-slate-800"
            >
              <option value="Todos" className="text-slate-900 bg-white">Todos</option>
              <option value="ingreso" className="text-slate-900 bg-white">Solo Ingresos (Recepción)</option>
              <option value="salida" className="text-slate-900 bg-white">Solo Salidas (Despacho)</option>
            </select>
          </div>

          {/* Operator filter */}
          <div className="space-y-1">
            <label className="font-bold text-slate-400 uppercase tracking-wide block text-[9px]">Usuario Registrante</label>
            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:bg-white focus:outline-none text-slate-800"
            >
              <option value="" className="text-slate-900 bg-white">-- Todos los Usuarios --</option>
              {operators.map(op => (
                <option key={op} value={op} className="text-slate-900 bg-white">@{op}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Printable Kardex Table Body */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden print:border-none print:shadow-none">
        {/* Print Only Header details */}
        <div className="hidden print:block p-6 border-b-2 border-black text-black">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="font-extrabold text-xl font-display">DELIZIA - COMPAÑÍA DE ALIMENTOS LTDA.</h1>
              <p className="text-xs">Reporte de Auditoría de Inventarios - KARDEX OFICIAL</p>
            </div>
            <div className="text-right text-xs">
              <p>Fecha de Impresión: {new Date().toLocaleDateString('es-BO')}</p>
              <p>Registros Totales: {filteredKardex.length}</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider print:bg-white print:border-b-2 print:border-black print:text-black">
                <th className="p-2.5 px-4">Fecha / Hora</th>
                <th className="p-2.5 px-4">Tipo</th>
                <th className="p-2.5 px-4">Nº Orden</th>
                <th className="p-2.5 px-4">Canastillo</th>
                <th className="p-2.5 px-4 text-center">Cantidad</th>
                <th className="p-2.5 px-4 text-center">Stock Antes</th>
                <th className="p-2.5 px-4 text-center">Stock Después</th>
                <th className="p-2.5 px-4">Origen / Destino</th>
                <th className="p-2.5 px-4">Observaciones / Motivo</th>
                <th className="p-2.5 px-4">Registrante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-[11px] print:text-black">
              {filteredKardex.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    <ClipboardList className="w-8 h-8 mx-auto opacity-30 mb-1.5" />
                    <span>No existen entradas de Kardex coincidentes con los filtros actuales</span>
                  </td>
                </tr>
              ) : (
                [...filteredKardex].reverse().map(k => (
                  <tr key={k.id} className="hover:bg-slate-50/40 border-b border-slate-100 print:hover:bg-white">
                    <td className="p-2.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-700">{formatDate(k.date)}</span>
                      <span className="text-[9px] text-slate-400 block font-mono">{formatTime(k.time)}</span>
                    </td>
                    <td className="p-2.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-bold text-[9px] print:text-black print:bg-white print:border ${
                        k.type === 'ingreso' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                      }`}>
                        {k.type === 'ingreso' ? 'INGRESO' : 'SALIDA'}
                      </span>
                    </td>
                    <td className="p-2.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                      {k.orderNumber || '-'}
                    </td>
                    <td className="p-2.5 px-4">
                      <span className="font-mono font-bold text-slate-900">{k.code}</span>
                      <span className="text-[9px] text-slate-500 block font-semibold">{k.item}</span>
                    </td>
                    <td className="p-2.5 px-4 text-center font-mono font-extrabold text-sm">
                      <span className={k.type === 'ingreso' ? 'text-emerald-600' : 'text-orange-600'}>
                        {k.type === 'ingreso' ? '+' : '-'}{k.quantity}
                      </span>
                    </td>
                    <td className="p-2.5 px-4 text-center font-mono text-slate-500">{k.stockBefore} u.</td>
                    <td className="p-2.5 px-4 text-center font-mono font-bold text-slate-900">{k.stockAfter} u.</td>
                    <td className="p-2.5 px-4 font-medium text-slate-700 max-w-xs truncate" title={k.entity}>
                      {k.entity || '-'}
                    </td>
                    <td className="p-2.5 px-4 text-slate-500 italic max-w-xs truncate" title={k.details}>
                      {k.details || '-'}
                    </td>
                    <td className="p-2.5 px-4 font-mono font-semibold text-slate-400">@{k.user}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
