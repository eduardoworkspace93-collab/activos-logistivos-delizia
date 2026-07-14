import React, { useState, useMemo } from 'react';
import { Item, Movement, StockStats, Responsible } from '../types.js';
import { 
  Trash2, ArrowRightLeft, FileText, AlertCircle, 
  TrendingDown, ClipboardList, CheckCircle2, ShieldAlert,
  Calendar, Clock, User, HardDrive
} from 'lucide-react';

interface AlmacenDanadosProps {
  items: Item[];
  movements: Movement[];
  stocks: StockStats[];
  responsibles: Responsible[];
  onRegisterMovement: (movement: any) => Promise<any>;
  currentUser: any;
}

export default function AlmacenDanados({
  items,
  movements,
  stocks,
  responsibles,
  onRegisterMovement,
  currentUser
}: AlmacenDanadosProps) {
  // Tabs for the damaged panel
  const [activeSubTab, setActiveSubTab] = useState<'inventario' | 'transferir' | 'baja'>('inventario');

  // Form 1: Mandar a Almacén de Dañados
  const [transItemId, setTransItemId] = useState('');
  const [transFromStatus, setTransFromStatus] = useState('Planta_Almacen'); // Default Almacén PT
  const [transQuantity, setTransQuantity] = useState<number | ''>('');
  const [transResponsible, setTransResponsible] = useState('');
  const [transDocNumber, setTransDocNumber] = useState('');
  const [transDetails, setTransDetails] = useState('');
  const [transError, setTransError] = useState('');
  const [transSuccess, setTransSuccess] = useState('');

  // Form 2: Dar de Baja Definitiva
  const [bajaItemId, setBajaItemId] = useState('');
  const [bajaQuantity, setBajaQuantity] = useState<number | ''>('');
  const [bajaResponsible, setBajaResponsible] = useState('');
  const [bajaDocNumber, setBajaDocNumber] = useState(''); // Asiento Contable
  const [bajaDetails, setBajaDetails] = useState('');
  const [bajaError, setBajaError] = useState('');
  const [bajaSuccess, setBajaSuccess] = useState('');

  // Autocomplete suggestions
  const [showTransRespSuggestions, setShowTransRespSuggestions] = useState(false);
  const [showBajaRespSuggestions, setShowBajaRespSuggestions] = useState(false);

  // Status mapping labels
  const areaLabels: Record<string, string> = {
    Planta_Almacen: 'Almacén de Producto Terminado (PT)',
    Planta_Disponibles: 'Activos Logísticos (Planta)',
    Produccion: 'Stock Producción'
  };

  // Helper to find stock stats for a given item
  const getItemStockInfo = (id: string) => {
    return stocks.find(s => s.id === id) || null;
  };

  // Calculate current stock in specific areas for selected item
  const transAvailableStock = useMemo(() => {
    if (!transItemId) return 0;
    const stockStats = getItemStockInfo(transItemId);
    if (!stockStats) return 0;

    if (transFromStatus === 'Planta_Almacen') return stockStats.breakdown.plantaAlmacen || 0;
    if (transFromStatus === 'Planta_Disponibles') return stockStats.breakdown.plantaDisponibles || 0;
    if (transFromStatus === 'Produccion') return stockStats.breakdown.produccion || 0;
    return 0;
  }, [transItemId, transFromStatus, stocks]);

  const bajaAvailableStock = useMemo(() => {
    if (!bajaItemId) return 0;
    const stockStats = getItemStockInfo(bajaItemId);
    return stockStats ? (stockStats.breakdown.danado || 0) : 0;
  }, [bajaItemId, stocks]);

  // Handle transfer to damaged warehouse
  const handleRegisterTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransError('');
    setTransSuccess('');

    if (!transItemId) {
      setTransError('Debe seleccionar un tipo de activo.');
      return;
    }
    if (!transFromStatus) {
      setTransError('Debe seleccionar el área de origen.');
      return;
    }
    const qty = Number(transQuantity);
    if (isNaN(qty) || qty <= 0) {
      setTransError('La cantidad debe ser un número positivo mayor a 0.');
      return;
    }
    if (qty > transAvailableStock) {
      setTransError(`Stock insuficiente. El área de origen solo tiene ${transAvailableStock} unidades.`);
      return;
    }
    if (!transResponsible.trim()) {
      setTransError('El nombre del responsable es obligatorio.');
      return;
    }
    if (!transDocNumber.trim()) {
      setTransError('Debe ingresar un número de documento de control o asiento.');
      return;
    }

    try {
      const detailsText = transDetails.trim() 
        ? `Traspaso a Dañados: ${transDetails.trim()}` 
        : 'Traspaso rutinario a Almacén de Productos Dañados (Activo Roto)';

      await onRegisterMovement({
        itemId: transItemId,
        quantity: qty,
        fromStatus: transFromStatus,
        crateStatus: 'Dañado',
        type: 'salida',
        entity: 'ALMACÉN DE DAÑADOS',
        responsible: transResponsible.trim().toUpperCase(),
        documentNumber: transDocNumber.trim().toUpperCase(),
        details: detailsText
      });

      setTransSuccess(`¡Transferencia de ${qty} unidades registrada correctamente!`);
      // Reset form fields
      setTransQuantity('');
      setTransDetails('');
      setTransDocNumber('');
    } catch (err: any) {
      setTransError(err.message || 'Error al registrar el traspaso a dañados.');
    }
  };

  // Handle permanent write-off (baja definitiva)
  const handleRegisterBaja = async (e: React.FormEvent) => {
    e.preventDefault();
    setBajaError('');
    setBajaSuccess('');

    if (!bajaItemId) {
      setBajaError('Debe seleccionar un tipo de activo.');
      return;
    }
    const qty = Number(bajaQuantity);
    if (isNaN(qty) || qty <= 0) {
      setBajaError('La cantidad debe ser un número positivo mayor a 0.');
      return;
    }
    if (qty > bajaAvailableStock) {
      setBajaError(`Stock insuficiente en dañados. Solo tiene ${bajaAvailableStock} unidades rotas disponibles.`);
      return;
    }
    if (!bajaDocNumber.trim()) {
      setBajaError('El N° de Asiento Contable de Baja es obligatorio para proceder.');
      return;
    }
    if (!bajaResponsible.trim()) {
      setBajaError('El nombre del responsable es obligatorio.');
      return;
    }

    try {
      const detailsText = `BAJA DEFINITIVA CONTABLE - Asiento N°: ${bajaDocNumber.trim().toUpperCase()}. ${bajaDetails.trim()}`;

      await onRegisterMovement({
        itemId: bajaItemId,
        quantity: qty,
        fromStatus: 'Dañado',
        crateStatus: 'Baja_Definitiva',
        type: 'salida',
        entity: 'BAJA DEFINITIVA POR MERMA',
        responsible: bajaResponsible.trim().toUpperCase(),
        documentNumber: bajaDocNumber.trim().toUpperCase(),
        details: detailsText
      });

      setBajaSuccess(`¡Baja definitiva de ${qty} unidades con Asiento N° ${bajaDocNumber.toUpperCase()} registrada con éxito!`);
      // Reset form fields
      setBajaQuantity('');
      setBajaDetails('');
      setBajaDocNumber('');
    } catch (err: any) {
      setBajaError(err.message || 'Error al registrar la baja definitiva.');
    }
  };

  // Filter recent movements specifically for damaged / written-off entries
  const damagedHistory = useMemo(() => {
    return movements
      .filter(m => m.crateStatus === 'Dañado' || m.fromStatus === 'Dañado' || m.crateStatus === 'Baja_Definitiva')
      .sort((a, b) => {
        const dateA = `${a.date}T${a.time}`;
        const dateB = `${b.date}T${b.time}`;
        return dateB.localeCompare(dateA);
      });
  }, [movements]);

  // List of filtered active items
  const activeItems = useMemo(() => {
    return items.filter(i => i.status === 'Activo');
  }, [items]);

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 dark:bg-slate-900 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="bg-red-100 text-red-800 text-[9px] font-black uppercase px-2 py-0.5 rounded dark:bg-red-950/40 dark:text-red-400">
              Área Administrativa Exclusiva
            </span>
          </div>
          <h2 className="text-base font-bold font-display text-slate-900 dark:text-white leading-tight flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-600 shrink-0" />
            Almacén de Productos Dañados y Bajas Definitivas
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Traspase canastillos rotos a dañados, controle su stock y ejecute bajas contables permanentes con número de asiento.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold shrink-0 dark:bg-slate-950 dark:border-slate-800">
          <button
            onClick={() => setActiveSubTab('inventario')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              activeSubTab === 'inventario'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Inventario Dañado
          </button>
          <button
            onClick={() => setActiveSubTab('transferir')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              activeSubTab === 'transferir'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Mandar a Dañados
          </button>
          <button
            onClick={() => setActiveSubTab('baja')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              activeSubTab === 'baja'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Dar de Baja Definitiva
          </button>
        </div>
      </div>

      {/* Main Content Areas */}
      {activeSubTab === 'inventario' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Current Stock Table */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden dark:bg-slate-900 dark:border-slate-800 flex flex-col">
            <div className="p-3 bg-slate-50 border-b border-slate-200 dark:bg-slate-950 dark:border-slate-800 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="text-xs font-black text-slate-800 dark:text-white uppercase">Stock en Almacén de Dañados</span>
            </div>
            
            <div className="p-3 divide-y divide-slate-100 dark:divide-slate-800 flex-1">
              {stocks.map(s => {
                const damagedQty = s.breakdown.danado || 0;
                return (
                  <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <div>
                        <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">{s.code}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">{s.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block font-mono text-xs font-black px-2.5 py-1 rounded ${
                        damagedQty > 0 
                          ? 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30' 
                          : 'bg-slate-50 text-slate-400 border border-slate-100 dark:bg-slate-950 dark:text-slate-600 dark:border-slate-800'
                      }`}>
                        {damagedQty} u. rotas
                      </span>
                      <p className="text-[9px] text-slate-400 mt-0.5">No Disponibles</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Direct Warning Banner */}
            <div className="p-3 bg-red-50/50 border-t border-slate-200 text-[10px] text-red-800 dark:bg-red-950/10 dark:border-red-900/30 dark:text-red-400 space-y-1">
              <div className="flex items-start gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-600 mt-0.5 shrink-0 dark:text-red-400" />
                <div>
                  <span className="font-bold">Política de Stock Dañado:</span> Estos activos ya no se encuentran disponibles en los flujos operativos activos (Reparto, Producción o Almacén PT). Permanecerán en este almacén virtual hasta que se formalice su baja definitiva con su correspondiente asiento contable.
                </div>
              </div>
            </div>
          </div>

          {/* Ledger History List */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden dark:bg-slate-900 dark:border-slate-800 flex flex-col">
            <div className="p-3 bg-slate-50 border-b border-slate-200 dark:bg-slate-950 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span className="text-xs font-black text-slate-800 dark:text-white uppercase">Historial de Traspasos y Bajas</span>
              </div>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold font-mono dark:bg-slate-800 dark:text-slate-300">
                {damagedHistory.length} registros
              </span>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-bold text-slate-450 uppercase tracking-wider dark:bg-slate-950 dark:border-slate-800">
                    <th className="p-2.5 px-3">Fecha / Hora</th>
                    <th className="p-2.5">Activo / Código</th>
                    <th className="p-2.5 text-center">Cant.</th>
                    <th className="p-2.5">Operación / Flujo</th>
                    <th className="p-2.5">Asiento / Documento</th>
                    <th className="p-2.5">Responsable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[10px] dark:divide-slate-800">
                  {damagedHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                        No se han registrado movimientos de daños o bajas definitivas.
                      </td>
                    </tr>
                  ) : (
                    damagedHistory.map(m => {
                      const item = items.find(i => i.id === m.itemId);
                      const isBaja = m.crateStatus === 'Baja_Definitiva';
                      
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/45 transition-colors">
                          <td className="p-2.5 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400 font-medium">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 shrink-0" />
                              <span>{m.date}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[9px] mt-0.5 opacity-80">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>{m.time}</span>
                            </div>
                          </td>
                          <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">
                            <div className="font-mono font-bold text-slate-900 dark:text-white">{item?.code || '-'}</div>
                            <div className="text-[9px] text-slate-500 dark:text-slate-400 leading-none">{item?.name || '-'}</div>
                          </td>
                          <td className="p-2.5 text-center font-mono font-black text-xs text-slate-950 dark:text-white">
                            {m.quantity} u.
                          </td>
                          <td className="p-2.5 font-medium whitespace-nowrap">
                            {isBaja ? (
                              <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded font-black text-[9px] uppercase border border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30">
                                ⚠️ Baja Definitiva
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-black text-[9px] uppercase border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30">
                                🔧 Traspaso a Dañado
                              </span>
                            )}
                            <div className="text-[9px] text-slate-400 mt-0.5">
                              {isBaja ? 'Origen: Dañados' : `Origen: ${areaLabels[m.fromStatus || ''] || m.fromStatus || '-'}`}
                            </div>
                          </td>
                          <td className="p-2.5 font-bold font-mono text-slate-700 dark:text-slate-300">
                            {m.documentNumber || m.orderNumber || 'S/N'}
                            <div className="text-[8px] text-slate-400 max-w-[120px] truncate leading-none mt-0.5 font-sans" title={m.details}>
                              {m.details || 'Sin detalles'}
                            </div>
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-semibold uppercase">
                              <User className="w-3 h-3 shrink-0 text-slate-400" />
                              <span>{m.responsible}</span>
                            </div>
                            <div className="text-[8px] text-slate-400 mt-0.5">Reg: @{m.user}</div>
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
      )}

      {/* Action 1: Send to Damaged Warehouse */}
      {activeSubTab === 'transferir' && (
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <div className="p-4 bg-[#003366] text-white flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider">Traspaso a Almacén de Dañados</h3>
              <p className="text-[10px] text-blue-200 opacity-90 mt-0.5">Mueva activos rotos o defectuosos desde áreas operativas de planta.</p>
            </div>
          </div>

          <form onSubmit={handleRegisterTransfer} className="p-5 space-y-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {transError && (
              <div className="p-3 bg-red-50 border border-red-150 text-red-600 rounded-lg font-bold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{transError}</span>
              </div>
            )}
            {transSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-150 text-emerald-700 rounded-lg font-bold flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{transSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Asset selection */}
              <div>
                <label className="block text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1">Tipo de Activo / Canastillo</label>
                <select
                  required
                  value={transItemId}
                  onChange={e => {
                    setTransItemId(e.target.value);
                    setTransError('');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:bg-white text-slate-900 font-sans"
                >
                  <option value="">-- Seleccionar Canastillo --</option>
                  {activeItems.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.code} - {i.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source Area selection */}
              <div>
                <label className="block text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1">Área Origen (Dónde se rompió)</label>
                <select
                  required
                  value={transFromStatus}
                  onChange={e => {
                    setTransFromStatus(e.target.value);
                    setTransError('');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:bg-white text-slate-900 font-sans"
                >
                  <option value="Planta_Almacen">ALMACÉN DE PRODUCTO TERMINADO (PT)</option>
                  <option value="Planta_Disponibles">ACTIVOS LOGÍSTICOS (DISPONIBLES)</option>
                  <option value="Produccion">STOCK EN PRODUCCIÓN</option>
                </select>
              </div>

            </div>

            {/* Current Stock warning */}
            {transItemId && (
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg dark:bg-slate-950 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Stock Disponible en {areaLabels[transFromStatus] || transFromStatus}:</span>
                <span className={`font-mono font-black text-sm px-2.5 py-0.5 rounded ${
                  transAvailableStock > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-red-100 text-red-850 dark:bg-red-950/20 dark:text-red-400'
                }`}>
                  {transAvailableStock} unidades
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Quantity */}
              <div>
                <label className="block text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1">Cantidad de Activos Dañados</label>
                <input
                  type="number"
                  required
                  placeholder="Ej. 15"
                  value={transQuantity}
                  onChange={e => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setTransQuantity(val);
                    setTransError('');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white text-slate-900 font-sans"
                />
              </div>

              {/* Document Number / Asiento */}
              <div>
                <label className="block text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1">N° de Documento / Asiento de Control</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. TRS-4859"
                  value={transDocNumber}
                  onChange={e => {
                    setTransDocNumber(e.target.value);
                    setTransError('');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white text-slate-900 font-sans"
                />
              </div>

            </div>

            {/* Responsible (With suggestions) */}
            <div className="relative">
              <label className="block text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1">Personal Responsable / Entrega</label>
              <input
                type="text"
                required
                placeholder="Ej. JAVIER QUISPE"
                value={transResponsible}
                onFocus={() => setShowTransRespSuggestions(true)}
                onBlur={() => setTimeout(() => setShowTransRespSuggestions(false), 200)}
                onChange={e => {
                  setTransResponsible(e.target.value);
                  setTransError('');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white text-slate-900 font-sans uppercase"
              />
              {showTransRespSuggestions && responsibles.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto dark:bg-slate-800 dark:border-slate-700">
                  {responsibles
                    .filter(r => r.name.toLowerCase().includes(transResponsible.toLowerCase()))
                    .map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setTransResponsible(r.name);
                          setShowTransRespSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2 text-[11px] hover:bg-slate-50 cursor-pointer text-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        {r.name}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Details / Notes */}
            <div>
              <label className="block text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1">Detalles / Motivo del Daño (Opcional)</label>
              <textarea
                placeholder="Describa brevemente cómo se dañaron o el estado físico actual..."
                value={transDetails}
                onChange={e => setTransDetails(e.target.value)}
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white text-slate-900 font-sans"
              />
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={!transItemId || transAvailableStock === 0}
                className="bg-[#003366] hover:bg-[#003366]/90 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold px-4 py-2 rounded-lg cursor-pointer transition-all active:scale-95 text-xs shadow-sm"
              >
                Mandar a Almacén de Dañados
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Action 2: Permanent Write-Off (Baja Definitiva) */}
      {activeSubTab === 'baja' && (
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <div className="p-4 bg-red-600 text-white flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider">Baja Definitiva de Activos Dañados</h3>
              <p className="text-[10px] text-red-100 opacity-90 mt-0.5">Registre la destrucción o desecho contable definitivo del canastillo.</p>
            </div>
          </div>

          <form onSubmit={handleRegisterBaja} className="p-5 space-y-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {bajaError && (
              <div className="p-3 bg-red-50 border border-red-150 text-red-600 rounded-lg font-bold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{bajaError}</span>
              </div>
            )}
            {bajaSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-150 text-emerald-700 rounded-lg font-bold flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{bajaSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Asset selection */}
              <div>
                <label className="block text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1">Tipo de Activo a Dar de Baja</label>
                <select
                  required
                  value={bajaItemId}
                  onChange={e => {
                    setBajaItemId(e.target.value);
                    setBajaError('');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 focus:bg-white text-slate-900 font-sans"
                >
                  <option value="">-- Seleccionar Canastillo Dañado --</option>
                  {stocks
                    .filter(s => (s.breakdown.danado || 0) > 0)
                    .map(s => (
                      <option key={s.id} value={s.id}>
                        {s.code} - {s.name} ({s.breakdown.danado} u. dañadas)
                      </option>
                    ))}
                </select>
                {stocks.filter(s => (s.breakdown.danado || 0) > 0).length === 0 && (
                  <p className="text-[10px] text-emerald-600 mt-1">¡No existen activos acumulados en el almacén de dañados!</p>
                )}
              </div>

              {/* Accounting entry - CRITICAL REQUIRED AS REQUESTED */}
              <div>
                <label className="block text-[10px] text-slate-550 font-black uppercase tracking-wider mb-1 text-red-600">
                  N° de Asiento Contable de Baja *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. AC-2026-8941"
                  value={bajaDocNumber}
                  onChange={e => {
                    setBajaDocNumber(e.target.value);
                    setBajaError('');
                  }}
                  className="w-full bg-slate-50 border border-red-200 rounded-lg px-3 py-2.5 focus:bg-white text-slate-900 font-sans font-bold"
                />
              </div>

            </div>

            {/* Current Stock Warning */}
            {bajaItemId && (
              <div className="p-3 bg-red-50/40 border border-red-100 rounded-lg dark:bg-slate-950 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[10px] text-red-800 font-black uppercase tracking-wider dark:text-red-400">Stock Acumulado Roto (Esperando Baja):</span>
                <span className="font-mono font-black text-sm bg-red-50 text-red-600 px-2.5 py-0.5 rounded dark:bg-red-950/20 dark:text-red-400">
                  {bajaAvailableStock} unidades dañadas
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Quantity */}
              <div>
                <label className="block text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1">Cantidad a Dar de Baja Definitiva</label>
                <input
                  type="number"
                  required
                  placeholder="Ej. 10"
                  value={bajaQuantity}
                  onChange={e => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setBajaQuantity(val);
                    setBajaError('');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white text-slate-900 font-sans"
                />
              </div>

              {/* Responsible */}
              <div className="relative">
                <label className="block text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1">Autorizado / Validado Por</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. CARLOS MARQUEZ (CONTABILIDAD)"
                  value={bajaResponsible}
                  onFocus={() => setShowBajaRespSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowBajaRespSuggestions(false), 200)}
                  onChange={e => {
                    setBajaResponsible(e.target.value);
                    setBajaError('');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white text-slate-900 font-sans uppercase"
                />
                {showBajaRespSuggestions && responsibles.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto dark:bg-slate-800 dark:border-slate-700">
                    {responsibles
                      .filter(r => r.name.toLowerCase().includes(bajaResponsible.toLowerCase()))
                      .map(r => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => {
                            setBajaResponsible(r.name);
                            setShowBajaRespSuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2 text-[11px] hover:bg-slate-50 cursor-pointer text-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          {r.name}
                        </button>
                      ))}
                  </div>
                )}
              </div>

            </div>

            {/* details */}
            <div>
              <label className="block text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1">Notas contables adicionales / Motivo de destrucción</label>
              <textarea
                placeholder="Ej. Canastillos rotos en reparto irrecuperables. Destrucción física realizada bajo acta..."
                value={bajaDetails}
                onChange={e => setBajaDetails(e.target.value)}
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white text-slate-900 font-sans"
              />
            </div>

            <div className="bg-red-50/50 p-3 rounded-lg border border-red-100 text-[10px] text-red-800 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400">
              ⚠️ <span className="font-bold">ADVERTENCIA:</span> Esta operación de baja definitiva es irreversible. Al procesarla, los canastillos indicados saldrán completamente de la contabilidad de activos físicos de Delizia y la cantidad aparecerá restada de los stocks globales definitivamente.
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={!bajaItemId || bajaAvailableStock === 0}
                className="bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold px-4 py-2 rounded-lg cursor-pointer transition-all active:scale-95 text-xs shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Registrar Baja Definitiva
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
