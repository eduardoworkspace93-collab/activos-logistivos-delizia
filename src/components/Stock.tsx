import React, { useState } from 'react';
import { StockStats } from '../types.js';
import { Search, ArrowUpDown, FileSpreadsheet, Filter, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { exportToCSV } from '../utils.js';

interface StockProps {
  stocks: StockStats[];
  userRole?: string;
}

type SortField = 'code' | 'name' | 'totalIngresos' | 'totalSalidas' | 'stockActual';
type SortOrder = 'asc' | 'desc';

export default function Stock({ stocks, userRole }: StockProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Activo' | 'Inactivo' | 'Bajo Stock'>('Todos');
  const [sortField, setSortField] = useState<SortField>('stockActual');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Handle Excel CSV Export
  const handleExportExcel = () => {
    const formattedData = stocks.map(s => ({
      code: s.code,
      name: s.name,
      totalIngresos: s.totalIngresos,
      totalSalidas: s.totalSalidas,
      plantaGeneral: s.breakdown.planta,
      plantaDisponibles: s.breakdown.plantaDisponibles || 0,
      produccion: s.breakdown.produccion || 0,
      plantaAlmacen: s.breakdown.plantaAlmacen || 0,
      reparto: s.breakdown.reparto,
      clientes: s.breakdown.clientes,
      pendientes: s.breakdown.pendientes,
      danado: s.breakdown.danado,
      reparacion: s.breakdown.reparacion,
      status: s.status
    }));

    const headers = [
      { key: 'code', label: 'Código' },
      { key: 'name', label: 'Tipo de Activo' },
      { key: 'totalIngresos', label: 'Ingresos Totales' },
      { key: 'totalSalidas', label: 'Salidas Totales' },
      { key: 'plantaGeneral', label: 'STOCK GENERAL PLANTA' },
      { key: 'plantaDisponibles', label: 'STOCK DISPONIBLE PLANTA' },
      { key: 'produccion', label: 'STOCK PRODUCCION' },
      { key: 'plantaAlmacen', label: 'STOCK ALMACEN PLANTA' },
      { key: 'reparto', label: 'En Reparto (Camión)' },
      { key: 'clientes', label: 'En Clientes' },
      { key: 'pendientes', label: 'Pendiente de Devolución' },
      { key: 'danado', label: 'Dañado / Merma' },
      { key: 'reparacion', label: 'En Reparación' },
      { key: 'status', label: 'Estado' }
    ];

    exportToCSV(formattedData, 'Control_Inventario_Activos_Delizia', headers);
  };

  // Sorting Handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Filter & Search Logic
  const filteredStocks = stocks
    .filter(s => {
      const matchesSearch = 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      if (statusFilter === 'Todos') return true;
      if (statusFilter === 'Activo') return s.status === 'Activo';
      if (statusFilter === 'Inactivo') return s.status === 'Inactivo';
      if (statusFilter === 'Bajo Stock') return s.stockActual < 50 && s.status === 'Activo';
      
      return true;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });

  return (
    <div className="space-y-4">
      {/* Header and Quick Filters */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold font-display text-slate-900 leading-tight">
              Control e Inventario Físico de Ítems
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Stock actual en planta con desglose de logística externa por sucursal, camión y clientes.
            </p>
          </div>
          
          {/* Export to Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer shadow-sm transition-all active:scale-95 self-start md:self-auto"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Exportar a Excel (CSV)
          </button>
        </div>

        {/* Search Input and Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por código o nombre de item..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
            />
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
            >
              <option value="Todos">Filtro: Todos los Ítems</option>
              <option value="Activo">Solo Activos</option>
              <option value="Inactivo">Solo Inactivos</option>
              <option value="Bajo Stock">Solo Alerta Bajo Stock (&lt;50 u)</option>
            </select>
          </div>

          {/* Quick Counter label */}
          <div className="bg-slate-50 p-1.5 px-3 rounded-lg border border-slate-150 flex items-center justify-between text-[11px] text-slate-500">
            <span>Resultados:</span>
            <span className="font-bold font-mono text-[#003366]">{filteredStocks.length} Items</span>
          </div>
        </div>
      </div>

      {/* Inventory Table Grid */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              {/* Double-layer table headers to represent category splits */}
              <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th colSpan={2} className="p-2 px-4 border-r border-slate-200">Datos del Activo</th>
                <th colSpan={2} className="p-2 text-center border-r border-slate-200 bg-slate-50/50">Histórico General</th>
                <th colSpan={4} className="p-2 text-center border-r border-slate-200 bg-sky-50/20 text-[#003366]">PLANTA GENERAL (Desglose de Áreas)</th>
                <th colSpan={3} className="p-2 text-center bg-orange-50/15 text-orange-700">LOGÍSTICA EXTERNA</th>
                <th className="p-2 text-center">Estado</th>
              </tr>
              <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-2.5 px-4 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('code')}>
                  <div className="flex items-center gap-1">
                    Código <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-2.5 px-4 cursor-pointer hover:bg-slate-100/50 border-r border-slate-200" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-1">
                    Descripción <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-2.5 text-center cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('totalIngresos')}>
                  Ingresos
                </th>
                <th className="p-2.5 text-center cursor-pointer hover:bg-slate-100/50 border-r border-slate-200" onClick={() => handleSort('totalSalidas')}>
                  Salidas
                </th>
                {/* Planta breakdown detailed columns */}
                <th className="p-2.5 text-center font-extrabold text-[#003366] bg-[#003366]/5">STOCK GENERAL PLANTA</th>
                <th className="p-2.5 text-center font-medium text-slate-500">STOCK DISPONIBLE PLANTA</th>
                <th className="p-2.5 text-center font-medium text-slate-500">STOCK PRODUCCION</th>
                <th className="p-2.5 text-center font-medium text-slate-500 border-r border-slate-200">STOCK ALMACEN PLANTA</th>
                {/* Logistics columns */}
                <th className="p-2.5 text-center text-sky-700 font-bold bg-sky-50/10">Tránsito</th>
                <th className="p-2.5 text-center text-blue-700 font-bold bg-blue-50/10">Clientes</th>
                <th className="p-2.5 text-center text-red-600 font-bold bg-red-50/10 border-r border-slate-200">Dañados/Reparar</th>
                <th className="p-2.5 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-[11px]">
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400">
                    <Layers className="w-6 h-6 mx-auto opacity-30 mb-1.5" />
                    <span>No hay resultados que coincidan con los filtros</span>
                  </td>
                </tr>
              ) : (
                filteredStocks.map(s => {
                  const isLow = s.stockActual < 50;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/40">
                      <td className="p-2.5 px-4 font-mono font-bold text-slate-900">{s.code}</td>
                      <td className="p-2.5 px-4 border-r border-slate-200 font-semibold text-slate-800">{s.name}</td>
                      <td className="p-2.5 text-center font-mono text-emerald-600">+{s.totalIngresos}</td>
                      <td className="p-2.5 text-center font-mono text-orange-600 border-r border-slate-200">-{s.totalSalidas}</td>
                      
                      {/* Planta breakdown cells */}
                      <td className="p-2.5 text-center font-mono font-extrabold text-sm text-[#003366] bg-[#003366]/5">
                        <span className={isLow ? 'text-red-500 font-extrabold' : ''}>
                          {s.breakdown.planta}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-mono font-medium text-slate-600">
                        {s.breakdown.plantaDisponibles || 0}
                      </td>
                      <td className="p-2.5 text-center font-mono font-medium text-slate-600">
                        {s.breakdown.produccion || 0}
                      </td>
                      <td className="p-2.5 text-center font-mono font-medium text-slate-600 border-r border-slate-200">
                        {s.breakdown.plantaAlmacen || 0}
                      </td>

                      {/* Logistics columns */}
                      <td className="p-2.5 text-center font-mono text-sky-700 font-bold bg-sky-50/10">
                        {s.breakdown.reparto} u.
                      </td>
                      <td className="p-2.5 text-center font-mono text-blue-700 font-bold bg-blue-50/10">
                        {s.breakdown.clientes} u.
                      </td>
                      <td className="p-2.5 text-center font-mono text-red-600 font-bold bg-red-50/10 border-r border-slate-200">
                        {s.breakdown.danado + s.breakdown.reparacion} u.
                      </td>

                      {/* Status */}
                      <td className="p-2.5 text-center">
                        {isLow && s.status === 'Activo' ? (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-extrabold text-[8px] border border-red-100">
                            <AlertTriangle className="w-2 h-2" />
                            CRÍTICO
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold ${
                            s.status === 'Activo' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${s.status === 'Activo' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {s.status === 'Activo' ? 'OK' : 'INACTIVO'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
