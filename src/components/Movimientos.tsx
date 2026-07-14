import React, { useState, useEffect } from 'react';
import { Item, Movement, StockStats, Location, Responsible, DriverRoute } from '../types.js';
import { Save, RefreshCw, PlusCircle, MinusCircle, AlertCircle, Eye, Printer, MapPin } from 'lucide-react';

interface MovimientosProps {
  items: Item[];
  locations: Location[];
  responsibles: Responsible[];
  movements: Movement[];
  stocks: StockStats[];
  userRole: string;
  initialType?: 'ingreso' | 'salida';
  onRegisterMovement: (movement: any) => Promise<any>;
  onShowActa: (movement: Movement) => void;
  prefill?: { entity: string; driver: string } | null;
  onPrefillUsed?: () => void;
  driversRoutes?: DriverRoute[];
}

const crateStatusLabels: Record<string, string> = {
  Planta: 'Planta (General)',
  Planta_Disponibles: 'DISPONIBLES PLANTA',
  Produccion: 'PRODUCCION',
  Planta_Almacen: 'ALMACEN PLANTA',
  Reparto: 'En Reparto',
  Clientes: 'En Clientes',
  Pendiente: 'Pendiente Retorno',
  Dañado: 'Dañado',
  'Reparación': 'En Reparación'
};

export default function Movimientos({ 
  items, 
  locations,
  responsibles,
  movements, 
  stocks, 
  userRole, 
  initialType = 'ingreso', 
  onRegisterMovement, 
  onShowActa,
  prefill,
  onPrefillUsed,
  driversRoutes = []
}: MovimientosProps) {
  const [activeTab, setActiveTab] = useState<'registro' | 'historial'>('registro');
  const [type, setType] = useState<'ingreso' | 'salida'>(initialType);
  const [itemId, setItemId] = useState('');
  const [orderNumber, setOrderNumber] = useState(''); // Serves as "N° de Documento"
  const [quantity, setQuantity] = useState<number | ''>('');
  const [entity, setEntity] = useState('');
  const [responsible, setResponsible] = useState('');
  const [details, setDetails] = useState('');
  
  // Custom logistic fields for Delizia
  const [truckPlate, setTruckPlate] = useState('');
  const [truckDriver, setTruckDriver] = useState('');
  const [truckRoute, setTruckRoute] = useState('');
  const [clientName, setClientName] = useState('');
  const [crateStatus, setCrateStatus] = useState<any>('Planta_Disponibles');

  // Multiple items under a single document list
  interface DocumentItem {
    itemId: string;
    quantity: number;
    crateStatus: string;
    itemName: string;
    itemCode: string;
  }
  const [documentItems, setDocumentItems] = useState<DocumentItem[]>([]);

  // Clear draft items and sync default status on type change
  const handleTypeChange = (newType: 'ingreso' | 'salida') => {
    setType(newType);
    setCrateStatus(newType === 'ingreso' ? 'Planta_Disponibles' : 'Reparto');
    setDocumentItems([]);
    setItemId('');
    setQuantity('');
    setFormError('');
  };

  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedStockInfo, setSelectedStockInfo] = useState<StockStats | null>(null);

  // Suggestions state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showRespSuggestions, setShowRespSuggestions] = useState(false);
  const [showDriverSuggestions, setShowDriverSuggestions] = useState(false);

  // Sync types with prop changes (e.g. from Dashboard navigations)
  useEffect(() => {
    setType(initialType);
    setCrateStatus(initialType === 'ingreso' ? 'Planta_Disponibles' : 'Reparto');
    setDocumentItems([]);
    setActiveTab('registro');
  }, [initialType]);

  // Handle prefill parameters from the Deudas de Choferes screen
  useEffect(() => {
    if (prefill) {
      if (prefill.entity) {
        setEntity(prefill.entity);
      }
      if (prefill.driver) {
        setTruckDriver(prefill.driver);
      }
      setActiveTab('registro');
      if (onPrefillUsed) {
        onPrefillUsed();
      }
    }
  }, [prefill, onPrefillUsed]);

  // Update selected item stock status for real-time validation warnings
  useEffect(() => {
    if (itemId) {
      const stock = stocks.find(s => s.id === itemId);
      setSelectedStockInfo(stock || null);
    } else {
      setSelectedStockInfo(null);
    }
    setFormError('');
  }, [itemId, stocks]);

  // Live validation on quantities typed
  const isOutOfStock = type === 'salida' && selectedStockInfo && quantity !== '' && Number(quantity) > selectedStockInfo.stockActual;

  // Autocomplete Suggestions
  const availableSuggestions = locations.filter(l => {
    const locType = type === 'ingreso' ? 'procedencia' : 'destino';
    if (l.type !== locType) return false;
    
    if (!entity) return true; // Show all if empty
    return l.name.toLowerCase().includes(entity.toLowerCase());
  });

  const availableRespSuggestions = (responsibles || []).filter(r => {
    if (!responsible) return true; // Show all if empty
    return r.name.toLowerCase().includes(responsible.toLowerCase());
  });

  const availableDriverSuggestions = React.useMemo(() => {
    if (!driversRoutes) return [];
    
    const search = (truckDriver || '').toLowerCase().trim();
    const cleanEntity = (entity || '').trim().toUpperCase();
    
    const uniqueDriversMap = new Map<string, DriverRoute>();
    
    // First pass: add drivers matching the selected entity
    driversRoutes.forEach(dr => {
      const isMatchEntity = cleanEntity && dr.jefeName.toUpperCase() === cleanEntity;
      if (isMatchEntity) {
        uniqueDriversMap.set(dr.driverName.toUpperCase(), dr);
      }
    });
    
    // Second pass: add other drivers if they aren't already in the map
    driversRoutes.forEach(dr => {
      const uName = dr.driverName.toUpperCase();
      if (!uniqueDriversMap.has(uName)) {
        uniqueDriversMap.set(uName, dr);
      }
    });
    
    const list = Array.from(uniqueDriversMap.values());
    if (!search) return list;
    return list.filter(dr => dr.driverName.toLowerCase().includes(search));
  }, [driversRoutes, entity, truckDriver]);

  const handleAddDraftItem = () => {
    setFormError('');
    setSuccessMsg('');
    if (!itemId) {
      setFormError('Debe seleccionar un item (canastillo) de la lista.');
      return;
    }
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      setFormError('La cantidad debe ser un número entero mayor a cero.');
      return;
    }

    const selectedItem = items.find(i => i.id === itemId);
    if (!selectedItem) {
      setFormError('El item seleccionado no es válido.');
      return;
    }

    // Check stock if it's a 'salida'
    if (type === 'salida') {
      const alreadyAddedQty = documentItems
        .filter(di => di.itemId === itemId)
        .reduce((sum, di) => sum + di.quantity, 0);
      
      const totalRequestedQty = alreadyAddedQty + Number(quantity);
      
      if (selectedStockInfo && totalRequestedQty > selectedStockInfo.stockActual) {
        setFormError(`Stock insuficiente para "${selectedItem.name}". Stock disponible: ${selectedStockInfo.stockActual}. Ya has agregado ${alreadyAddedQty} a la lista, e intentas agregar ${quantity} más.`);
        return;
      }
    }

    // Add to list or update quantity if same itemId and crateStatus
    const existingIndex = documentItems.findIndex(
      di => di.itemId === itemId && di.crateStatus === crateStatus
    );

    if (existingIndex > -1) {
      const updated = [...documentItems];
      updated[existingIndex].quantity += Number(quantity);
      setDocumentItems(updated);
    } else {
      setDocumentItems([
        ...documentItems,
        {
          itemId,
          quantity: Number(quantity),
          crateStatus,
          itemName: selectedItem.name,
          itemCode: selectedItem.code
        }
      ]);
    }

    // Reset draft fields
    setItemId('');
    setQuantity('');
  };

  const handleRemoveDraftItem = (index: number) => {
    setFormError('');
    setSuccessMsg('');
    const updated = [...documentItems];
    updated.splice(index, 1);
    setDocumentItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    const docNum = (orderNumber || '').trim();
    if (!docNum) {
      setFormError('El número de documento es obligatorio.');
      return;
    }

    if (documentItems.length === 0) {
      setFormError('Debe agregar al menos un canastillo a la lista antes de poder guardar el documento.');
      return;
    }

    // Validate mandatory conductor for destinations containing DESAYUNOS (e.g., DESAYUNOS VIACHA, DESAYUNOS EL ALTO)
    const cleanEntity = (entity || '').trim().toUpperCase();
    if (cleanEntity.includes('DESAYUNOS')) {
      const cleanDriver = (truckDriver || '').trim();
      if (!cleanDriver || cleanDriver === '-' || cleanDriver === 'SIN CONDUCTOR') {
        setFormError(`El "Conductor Asignado" es de carácter obligatorio para el destino ${cleanEntity}.`);
        return;
      }
    }

    try {
      const res = await onRegisterMovement({
        type,
        documentNumber: docNum,
        orderNumber: docNum, // legacy field fallback
        entity: (entity || '').trim() || (type === 'ingreso' ? 'PLANTA GENERAL' : 'CLIENTE PARTICULAR'),
        responsible,
        details,
        truckPlate,
        truckDriver,
        truckRoute,
        clientName: type === 'salida' ? clientName || entity : '',
        items: documentItems.map(di => ({
          itemId: di.itemId,
          quantity: di.quantity,
          crateStatus: di.crateStatus
        }))
      });

      setSuccessMsg(`¡Documento registrado con éxito! Folio generado: ${res.movementNumber || 'OK'}`);
      
      // Reset form completely
      setOrderNumber('');
      setDocumentItems([]);
      setItemId('');
      setQuantity('');
      setEntity('');
      setResponsible('');
      setDetails('');
      setTruckPlate('');
      setTruckDriver('');
      setTruckRoute('');
      setClientName('');
      setCrateStatus(type === 'ingreso' ? 'Planta_Disponibles' : 'Reparto');

      // Scroll to top of panel to see message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setFormError(err.message || 'Ocurrió un error al registrar el movimiento.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Header */}
      <div className="flex justify-between items-center bg-white p-2 px-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveTab('registro')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'registro' 
                ? 'bg-[#003366] text-white shadow-sm' 
                : 'bg-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Registrar Movimiento
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'historial' 
                ? 'bg-[#003366] text-white shadow-sm' 
                : 'bg-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Ver Movimientos Recientes
          </button>
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          Rol actual: <span className="font-bold text-[#003366] uppercase">{userRole}</span>
        </div>
      </div>

      {activeTab === 'registro' ? (
        /* Register Movement Panel */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Main Form Panel */}
          <div className="lg:col-span-2 bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm font-display">Ingreso o Salida de Ítems</h3>
                <p className="text-[11px] text-slate-500">Formulario homologado para control de activos de distribución</p>
              </div>

              {/* Type Switcher */}
              <div className="bg-slate-100 p-0.5 rounded-lg flex">
                <button
                  type="button"
                  onClick={() => handleTypeChange('ingreso')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    type === 'ingreso'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Ingreso (Recepción)
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('salida')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    type === 'salida'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <MinusCircle className="w-3.5 h-3.5" />
                  Salida (Despacho)
                </button>
              </div>
            </div>

            {/* Notifications */}
            {successMsg && (
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-100 animate-fade-in">
                {successMsg}
              </div>
            )}
            {formError && (
              <div className="p-2.5 bg-red-50 text-red-700 rounded-lg text-xs font-semibold border border-red-100 animate-fade-in">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {/* Document and Logistics header info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">N° de Documento * (Alfanumérico)</label>
                  <input
                    type="text"
                    required
                    value={orderNumber}
                    onChange={e => setOrderNumber(e.target.value.toUpperCase())}
                    placeholder="Ej. DOC-1234"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20 text-slate-800 font-bold uppercase"
                  />
                </div>

                <div className="relative">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    {type === 'ingreso' ? 'Procedencia / Planta Origen *' : 'Lugar de Destino / Agencia *'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={entity}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      onChange={e => setEntity(e.target.value)}
                      placeholder={type === 'ingreso' ? "Ej. PLANTA CENTRAL" : "Ej. AGENCIA SUR"}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20 font-bold uppercase text-slate-800"
                    />
                    {showSuggestions && availableSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 divide-y divide-slate-100 dark:divide-slate-700">
                        {availableSuggestions.map(suggestion => (
                          <button
                            key={suggestion.id}
                            type="button"
                            onMouseDown={() => {
                              setEntity(suggestion.name);
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-xs truncate cursor-pointer block"
                          >
                            {suggestion.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Responsable Operación *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={responsible}
                      onFocus={() => setShowRespSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowRespSuggestions(false), 200)}
                      onChange={e => setResponsible(e.target.value)}
                      placeholder="Nombre del responsable"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20 text-slate-800 font-bold uppercase"
                    />
                    {showRespSuggestions && availableRespSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 divide-y divide-slate-100 dark:divide-slate-700">
                        {availableRespSuggestions.map(suggestion => (
                          <button
                            key={suggestion.id}
                            type="button"
                            onMouseDown={() => {
                              setResponsible(suggestion.name);
                              setShowRespSuggestions(false);
                            }}
                            className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-xs truncate cursor-pointer block"
                          >
                            {suggestion.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Advanced Logistics Details */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
                <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-500 block border-b border-slate-200 pb-1">
                  Información Logística del Camión y Distribución (Recomendado)
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Placa Camión</label>
                    <input
                      type="text"
                      value={truckPlate}
                      onChange={e => setTruckPlate(e.target.value.toUpperCase())}
                      placeholder="Ej. 4821-LKP"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20 text-slate-800 font-bold uppercase"
                    />
                  </div>
                   <div className="relative">
                    <label className="block text-[10px] font-bold text-slate-600 mb-1 flex justify-between">
                      <span>Conductor Asignado</span>
                      {entity.trim().toUpperCase().includes('DESAYUNOS') && <span className="text-red-500 font-extrabold text-[8px] animate-pulse">● OBLIGATORIO</span>}
                    </label>
                    <input
                      type="text"
                      value={truckDriver}
                      onFocus={() => setShowDriverSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowDriverSuggestions(false), 200)}
                      onChange={e => setTruckDriver(e.target.value)}
                      placeholder="Ej. Roberto Quispe"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20 text-slate-800 font-bold uppercase"
                    />
                    {showDriverSuggestions && availableDriverSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 divide-y divide-slate-100 dark:divide-slate-700">
                        {availableDriverSuggestions.map(suggestion => (
                          <button
                            key={suggestion.id}
                            type="button"
                            onMouseDown={() => {
                              setTruckDriver(suggestion.driverName);
                              if (suggestion.route) setTruckRoute(suggestion.route);
                              if (suggestion.plate) setTruckPlate(suggestion.plate);
                              setShowDriverSuggestions(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer block"
                          >
                            <div className="flex flex-col">
                              <span className="text-slate-900 dark:text-slate-100 font-bold text-[12px]">
                                {suggestion.driverName}
                              </span>
                              {(suggestion.route || suggestion.plate) && (
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                  {suggestion.route ? `Ruta: ${suggestion.route}` : ''} {suggestion.plate ? ` | Placa: ${suggestion.plate}` : ''}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Ruta de Reparto</label>
                    <input
                      type="text"
                      value={truckRoute}
                      onChange={e => setTruckRoute(e.target.value)}
                      placeholder="Ej. Ruta Sopocachi"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20 text-slate-800 font-bold uppercase"
                    />
                  </div>
                </div>

                {type === 'salida' && (
                  <div className="pt-0.5">
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Cliente Receptor (Si aplica)</label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      placeholder="Ej. Tiendas de Barrio Asociadas"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20 text-slate-800 font-bold uppercase"
                    />
                  </div>
                )}
              </div>

              {/* MULTI-ITEM MANAGER SECTION */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-[#003366]">
                    Ítems en este Documento
                  </span>
                  <span className="font-mono text-[9px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                    {documentItems.length} {documentItems.length === 1 ? 'Ítem agregado' : 'Ítems agregados'}
                  </span>
                </div>

                {/* Adder Inputs Row */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Tipo de Canastillo</label>
                    <select
                      value={itemId}
                      onChange={e => setItemId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20 text-slate-800 font-bold"
                    >
                      <option value="">-- Seleccione un Canastillo --</option>
                      {items.filter(i => i.status === 'Activo').map(i => (
                        <option key={i.id} value={i.id}>
                          [{i.code}] - {i.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Estado de Destino</label>
                    <select
                      value={crateStatus}
                      onChange={e => setCrateStatus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20 text-slate-800 font-bold"
                    >
                      {Object.entries(crateStatusLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Cantidad</label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={e => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="u."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20 text-slate-800 font-bold"
                      />
                      <button
                        type="button"
                        onClick={handleAddDraftItem}
                        className="px-3.5 bg-[#003366] hover:bg-[#003366]/90 text-white rounded-lg transition-all cursor-pointer font-bold shrink-0 self-center flex items-center justify-center h-[34px]"
                        title="Agregar item"
                      >
                        <PlusCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Warning message if selected stock is insufficient */}
                {isOutOfStock && (
                  <div className="text-red-600 text-[10px] font-bold bg-red-50 p-2 rounded border border-red-100 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>⚠️ Stock insuficiente para realizar esta salida. Stock actual en planta: {selectedStockInfo?.stockActual} u.</span>
                  </div>
                )}

                {/* Added Items table */}
                {documentItems.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white max-h-48 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                          <th className="p-2 px-3">Código</th>
                          <th className="p-2 px-3">Nombre Canastillo</th>
                          <th className="p-2 px-3">Estado Asignado</th>
                          <th className="p-2 px-3 text-center">Cantidad</th>
                          <th className="p-2 px-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {documentItems.map((di, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-2 px-3 font-mono font-bold text-slate-500">[{di.itemCode}]</td>
                            <td className="p-2 px-3 font-bold text-slate-800">{di.itemName}</td>
                            <td className="p-2 px-3">
                              <span className="inline-block bg-sky-50 text-[#003366] text-[9px] font-bold px-1.5 py-0.5 rounded border border-sky-100">
                                {crateStatusLabels[di.crateStatus] || di.crateStatus}
                              </span>
                            </td>
                            <td className="p-2 px-3 text-center font-mono font-bold text-slate-950">{di.quantity} u.</td>
                            <td className="p-2 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveDraftItem(idx)}
                                className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded cursor-pointer transition-all active:scale-95 inline-flex items-center"
                                title="Quitar item"
                              >
                                <MinusCircle className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-400 bg-white rounded-lg border border-dashed border-slate-200 text-[11px]">
                    No hay ítems agregados a este documento todavía. Seleccione un canastillo arriba y haga clic en el botón (+) para agregarlo.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Observaciones / Motivo</label>
                <textarea
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder="Comentarios adicionales referentes al traslado, lote de helados, mermas, etc."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20 text-slate-800"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={documentItems.length === 0}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer text-white shadow-sm active:scale-95 transition-all ${
                    documentItems.length === 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : type === 'ingreso'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  {type === 'ingreso' ? 'Confirmar Ingreso de Stock' : 'Confirmar Salida de Stock'}
                </button>
              </div>
            </form>
          </div>

          {/* Quick Info Sidebar */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col space-y-3">
              <h4 className="font-bold text-slate-900 text-xs font-display border-b border-slate-100 pb-2">
                Consulta de Inventario Rápido
              </h4>

              {selectedStockInfo ? (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2">
                    <div>
                      <span className="font-bold text-xs block text-slate-800">{selectedStockInfo.name}</span>
                      <span className="font-mono text-[9px] text-slate-400">{selectedStockInfo.code}</span>
                    </div>
                  </div>

                  {/* Stock Progress Indicators */}
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="flex justify-between items-center text-slate-500 text-[11px]">
                      <span>Stock Total Activo</span>
                      <span className="font-mono font-bold text-slate-800">{selectedStockInfo.stockActual} u.</span>
                    </div>
                    {/* Planta Breakdown list */}
                    <div className="pl-2 border-l-2 border-slate-150 space-y-1">
                      <div className="flex justify-between items-center text-slate-400 text-[10px]">
                        <span>• Disponibles Planta</span>
                        <span className="font-mono text-slate-700">{selectedStockInfo.breakdown.plantaDisponibles || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400 text-[10px]">
                        <span>• En Producción</span>
                        <span className="font-mono text-slate-700">{selectedStockInfo.breakdown.produccion || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400 text-[10px]">
                        <span>• Almacén Planta</span>
                        <span className="font-mono text-slate-700">{selectedStockInfo.breakdown.plantaAlmacen || 0}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 text-[11px] pt-1">
                      <span>Total de Ingresos</span>
                      <span className="font-mono font-medium text-emerald-600">+{selectedStockInfo.totalIngresos}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 text-[11px]">
                      <span>Total de Salidas</span>
                      <span className="font-mono font-medium text-orange-600 font-semibold">-{selectedStockInfo.totalSalidas}</span>
                    </div>
                  </div>

                  {/* Interactive progress level */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#003366] h-full transition-all" 
                      style={{ 
                        width: `${Math.min(100, (selectedStockInfo.stockActual / (selectedStockInfo.totalIngresos || 1)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-400 py-4">
                  <AlertCircle className="w-6 h-6 mx-auto opacity-30 mb-1.5" />
                  <p className="text-[11px] leading-relaxed">
                    Seleccione un activo en el formulario para visualizar su stock disponible en tiempo real
                  </p>
                </div>
              )}
            </div>

            {/* Operational Instructions Card */}
            <div className="bg-sky-50/30 p-4 rounded-lg border border-sky-150 text-[11px] text-sky-800 space-y-2">
              <span className="font-bold font-display uppercase tracking-wider block text-[9px]">Pautas del Proceso</span>
              <ul className="list-disc list-inside space-y-1 leading-relaxed text-sky-900/80">
                <li>Todo ingreso aumenta automáticamente el stock central.</li>
                <li>No se permite registrar salidas que superen el stock.</li>
                <li>Los camiones en reparto conservan sus canastillos asignados.</li>
                <li>Toda operación lograda genera un <b>Acta de Traspaso</b> para imprimir.</li>
              </ul>
            </div>
          </div>

        </div>
      ) : (
        /* Movement History Table List */
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-2.5 px-4">Movimiento</th>
                  <th className="p-2.5 px-4">N° Documento</th>
                  <th className="p-2.5 px-4">Fecha / Hora</th>
                  <th className="p-2.5 px-4">Tipo</th>
                  <th className="p-2.5 px-4">Ítem</th>
                  <th className="p-2.5 px-4 text-center">Cantidad</th>
                  <th className="p-2.5 px-4">Origen / Destino</th>
                  <th className="p-2.5 px-4 text-right">Imprimir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-[11px]">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      <AlertCircle className="w-6 h-6 mx-auto opacity-30 mb-1.5" />
                      <span>No hay movimientos registrados</span>
                    </td>
                  </tr>
                ) : (
                  [...movements].reverse().slice(0, 50).map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/40">
                      <td className="p-2.5 px-4 font-mono font-bold text-slate-900">{m.movementNumber}</td>
                      <td className="p-2.5 px-4 font-mono text-slate-700 font-bold">{m.documentNumber || m.orderNumber || '-'}</td>
                      <td className="p-2.5 px-4 text-slate-500">
                        {m.date} <span className="text-[9px] text-slate-400 block">{m.time}</span>
                      </td>
                      <td className="p-2.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          m.type === 'ingreso' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                        }`}>
                          {m.type === 'ingreso' ? 'INGRESO' : 'SALIDA'}
                        </span>
                      </td>
                      <td className="p-2.5 px-4">
                        <span className="font-semibold text-slate-800">{m.itemName}</span>
                      </td>
                      <td className="p-2.5 px-4 text-center font-mono font-extrabold text-slate-800">
                        {m.quantity} u.
                      </td>
                      <td className="p-2.5 px-4 text-slate-500 font-bold uppercase">
                        {m.entity}
                      </td>
                      <td className="p-2.5 px-4 text-right">
                        <button
                          onClick={() => onShowActa(m)}
                          className="px-2 py-0.5 bg-[#003366]/5 hover:bg-[#003366]/10 text-[#003366] rounded transition-all cursor-pointer font-bold inline-flex items-center gap-0.5 active:scale-95 text-[10px]"
                        >
                          <Eye className="w-3 h-3" />
                          Acta
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
