import React, { useState } from 'react';
import { Item, Location, DriverRoute, User, OperationalArea } from '../types.js';
import { 
  Plus, Edit3, Trash2, Save, X, Layers, MapPin, 
  Users, Key, ShieldAlert, Edit2, CheckCircle, Navigation, ArrowLeftRight
} from 'lucide-react';

interface MaestroItemsProps {
  items: Item[];
  locations: Location[];
  userRole: string;
  onSaveItem: (item: Partial<Item>) => Promise<any>;
  onDeleteItem: (id: string) => Promise<any>;
  onSaveLocation: (location: Partial<Location>) => Promise<any>;
  onDeleteLocation: (id: string) => Promise<any>;
  driversRoutes: DriverRoute[];
  onSaveDriverRoute: (dr: Partial<DriverRoute>) => Promise<any>;
  onDeleteDriverRoute: (id: string) => Promise<any>;
  users: User[];
  currentUser: User;
  onSaveUser: (userData: Partial<User>) => Promise<any>;
  operationalAreas?: OperationalArea[];
  onSaveOperationalArea?: (area: Partial<OperationalArea>) => Promise<any>;
  onDeleteOperationalArea?: (id: string) => Promise<any>;
}

export default function MaestroItems({ 
  items, 
  locations,
  userRole, 
  onSaveItem, 
  onDeleteItem,
  onSaveLocation,
  onDeleteLocation,
  driversRoutes,
  onSaveDriverRoute,
  onDeleteDriverRoute,
  users,
  currentUser,
  onSaveUser,
  operationalAreas = [],
  onSaveOperationalArea,
  onDeleteOperationalArea
}: MaestroItemsProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'items' | 'procedencias' | 'destinos' | 'choferes' | 'usuarios' | 'areas'>('items');

  // Privileges
  const canDelete = userRole === 'Administrador';
  const isSupervisorOrAdmin = userRole === 'Administrador' || userRole === 'Supervisor';

  // Custom iframe-friendly delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'item' | 'location' | 'driver' | 'area';
    id: string;
    name: string;
  } | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // 1. Items state
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [itemFormError, setItemFormError] = useState('');
  const [editItem, setEditItem] = useState<Partial<Item>>({
    code: '',
    name: '',
    description: '',
    color: '#003366',
    capacity: 24,
    status: 'Activo'
  });

  // 1b. Operational Areas state
  const [isEditingArea, setIsEditingArea] = useState(false);
  const [areaFormError, setAreaFormError] = useState('');
  const [editArea, setEditArea] = useState<Partial<OperationalArea>>({
    id: '',
    name: '',
    color: '#0b4a9b'
  });

  // 2. Locations state (Procedencias / Destinos)
  const [isEditingLoc, setIsEditingLoc] = useState(false);
  const [locFormError, setLocFormError] = useState('');
  const [editLoc, setEditLoc] = useState<Partial<Location>>({
    name: '',
    type: 'procedencia'
  });

  // 3. Drivers & Routes state
  const [isEditingDriverRoute, setIsEditingDriverRoute] = useState(false);
  const [drFormError, setDrFormError] = useState('');
  const [editDR, setEditDR] = useState<Partial<DriverRoute>>({
    jefeName: '',
    driverName: '',
    route: '',
    plate: ''
  });
  const [isCreatingNewJefe, setIsCreatingNewJefe] = useState(false);
  const [newJefeName, setNewJefeName] = useState('');

  // Dynamic list of Jefe options combining actual destinos in locations + historical drivers jefes
  const jefeOptions = React.useMemo(() => {
    const set = new Set<string>();
    
    // Add destinations from locations list
    locations.filter(l => l.type === 'destino').forEach(l => {
      set.add(l.name.toUpperCase());
    });
    
    // Add existing jefes from drivers list to prevent any missing ones
    driversRoutes.forEach(dr => {
      if (dr.jefeName) {
        set.add(dr.jefeName.toUpperCase());
      }
    });
    
    return Array.from(set).sort();
  }, [locations, driversRoutes]);

  // 4. Users state (Embedded Usuarios logic)
  const isUserAdmin = currentUser?.role === 'Administrador';
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [userFormError, setUserFormError] = useState('');
  const [userFormSuccess, setUserFormSuccess] = useState('');
  const [editUser, setEditUser] = useState<Partial<User>>({
    username: '',
    name: '',
    role: 'Operador',
    passwordHash: '123456',
    status: 'Activo'
  });

  // --- ITEM CRUD HANDLERS ---
  const handleAddNewItem = () => {
    setEditItem({
      code: '',
      name: '',
      description: '',
      color: '#003366',
      capacity: 24,
      status: 'Activo'
    });
    setItemFormError('');
    setIsEditingItem(true);
  };

  const handleEditItem = (item: Item) => {
    setEditItem(item);
    setItemFormError('');
    setIsEditingItem(true);
  };

  const handleCancelItem = () => {
    setIsEditingItem(false);
    setItemFormError('');
  };

  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem.code || !editItem.name) {
      setItemFormError('El código y la descripción del activo son requeridos.');
      return;
    }

    const uppercaseCode = editItem.code.trim().toUpperCase();
    const uppercaseName = editItem.name.trim().toUpperCase();

    const itemToSave = {
      ...editItem,
      code: uppercaseCode,
      name: uppercaseName,
      description: uppercaseName,
      color: editItem.color || '#003366',
      capacity: editItem.capacity || 24,
      status: editItem.status || 'Activo'
    };

    try {
      await onSaveItem(itemToSave);
      setIsEditingItem(false);
    } catch (err: any) {
      setItemFormError(err.message || 'Error al guardar el item.');
    }
  };

  const handleDeleteItem = (id: string, name: string) => {
    setDeleteError('');
    setDeleteConfirm({ type: 'item', id, name });
  };


  // --- LOCATION CRUD HANDLERS ---
  const handleAddNewLoc = (type: 'procedencia' | 'destino') => {
    setEditLoc({
      name: '',
      type
    });
    setLocFormError('');
    setIsEditingLoc(true);
  };

  const handleEditLoc = (loc: Location) => {
    setEditLoc(loc);
    setLocFormError('');
    setIsEditingLoc(true);
  };

  const handleCancelLoc = () => {
    setIsEditingLoc(false);
    setLocFormError('');
  };

  const handleSubmitLoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLoc.name) {
      setLocFormError('El nombre de la ubicación es requerido.');
      return;
    }

    const uppercaseName = editLoc.name.trim().toUpperCase();
    const locToSave = {
      ...editLoc,
      name: uppercaseName,
      type: activeTab === 'procedencias' ? 'procedencia' as const : 'destino' as const
    };

    try {
      await onSaveLocation(locToSave);
      setIsEditingLoc(false);
    } catch (err: any) {
      setLocFormError(err.message || 'Error al guardar.');
    }
  };

  const handleDeleteLoc = (id: string, name: string) => {
    setDeleteError('');
    setDeleteConfirm({ type: 'location', id, name });
  };


  // --- OPERATIONAL AREA CRUD HANDLERS ---
  const handleAddNewArea = () => {
    setEditArea({
      id: '',
      name: '',
      color: '#0b4a9b'
    });
    setAreaFormError('');
    setIsEditingArea(true);
  };

  const handleEditArea = (area: OperationalArea) => {
    setEditArea(area);
    setAreaFormError('');
    setIsEditingArea(true);
  };

  const handleCancelArea = () => {
    setIsEditingArea(false);
    setAreaFormError('');
  };

  const handleSubmitArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editArea.name) {
      setAreaFormError('El nombre del área de operación es requerido.');
      return;
    }

    const areaToSave = {
      ...editArea,
      name: editArea.name.trim().toUpperCase(),
      color: editArea.color || '#0b4a9b'
    };

    try {
      if (onSaveOperationalArea) {
        await onSaveOperationalArea(areaToSave);
      }
      setIsEditingArea(false);
    } catch (err: any) {
      setAreaFormError(err.message || 'Error al guardar el área.');
    }
  };

  const handleDeleteArea = (id: string, name: string) => {
    setDeleteError('');
    setDeleteConfirm({ type: 'area', id, name });
  };


  // --- DRIVER ROUTE CRUD HANDLERS ---
  const handleAddNewDR = () => {
    const firstDest = locations.find(l => l.type === 'destino')?.name || '';
    setEditDR({
      jefeName: firstDest,
      driverName: '',
      route: '',
      plate: ''
    });
    setDrFormError('');
    setIsCreatingNewJefe(false);
    setNewJefeName('');
    setIsEditingDriverRoute(true);
  };

  const handleEditDR = (dr: DriverRoute) => {
    setEditDR(dr);
    setDrFormError('');
    setIsCreatingNewJefe(false);
    setNewJefeName('');
    setIsEditingDriverRoute(true);
  };

  const handleCancelDR = () => {
    setIsEditingDriverRoute(false);
    setDrFormError('');
    setIsCreatingNewJefe(false);
    setNewJefeName('');
  };

  const handleSubmitDR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDR.driverName) {
      setDrFormError('El nombre del conductor es requerido.');
      return;
    }

    let finalJefeName = editDR.jefeName || '';
    if (isCreatingNewJefe) {
      if (!newJefeName.trim()) {
        setDrFormError('El nombre del nuevo jefe principal es requerido.');
        return;
      }
      try {
        const cleanJefeName = newJefeName.trim().toUpperCase();
        await onSaveLocation({ name: cleanJefeName, type: 'destino' });
        finalJefeName = cleanJefeName;
      } catch (err: any) {
        setDrFormError(err.message || 'Error al guardar el nuevo jefe principal.');
        return;
      }
    }

    if (!finalJefeName) {
      setDrFormError('El jefe principal es requerido.');
      return;
    }

    try {
      await onSaveDriverRoute({
        ...editDR,
        jefeName: finalJefeName.toUpperCase(),
        driverName: editDR.driverName.toUpperCase(),
        route: (editDR.route || '').toUpperCase(),
        plate: (editDR.plate || '').toUpperCase()
      });
      setIsEditingDriverRoute(false);
    } catch (err: any) {
      setDrFormError(err.message || 'Error al guardar el conductor/ruta.');
    }
  };

  const handleDeleteDR = (id: string, name: string) => {
    setDeleteError('');
    setDeleteConfirm({ type: 'driver', id, name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    setDeleteError('');
    try {
      if (deleteConfirm.type === 'item') {
        await onDeleteItem(deleteConfirm.id);
      } else if (deleteConfirm.type === 'location') {
        await onDeleteLocation(deleteConfirm.id);
      } else if (deleteConfirm.type === 'driver') {
        await onDeleteDriverRoute(deleteConfirm.id);
      }
      setDeleteConfirm(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Error al eliminar el registro.');
    } finally {
      setDeleting(false);
    }
  };

  // --- EMBEDDED USER CRUD HANDLERS ---
  const handleAddNewUser = () => {
    setEditUser({
      username: '',
      name: '',
      role: 'Operador',
      passwordHash: '123456',
      status: 'Activo'
    });
    setUserFormError('');
    setUserFormSuccess('');
    setIsEditingUser(true);
  };

  const handleEditUser = (u: User) => {
    setEditUser({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      status: u.status
    });
    setUserFormError('');
    setUserFormSuccess('');
    setIsEditingUser(true);
  };

  const handleCancelUser = () => {
    setIsEditingUser(false);
    setUserFormError('');
    setUserFormSuccess('');
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError('');
    setUserFormSuccess('');

    if (!editUser.username || !editUser.name) {
      setUserFormError('El nombre de usuario y el nombre completo son obligatorios.');
      return;
    }

    try {
      await onSaveUser(editUser);
      setUserFormSuccess('Usuario guardado correctamente.');
      setTimeout(() => {
        setIsEditingUser(false);
        setUserFormSuccess('');
      }, 1000);
    } catch (err: any) {
      setUserFormError(err.message || 'Error al guardar el usuario.');
    }
  };

  // Filter locations based on active tab
  const filteredLocations = locations.filter(l => {
    if (activeTab === 'procedencias') return l.type === 'procedencia';
    if (activeTab === 'destinos') return l.type === 'destino';
    return false;
  });

  return (
    <div className="space-y-4">
      {/* Title Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-base font-bold font-display text-slate-900 leading-tight">
            Maestro y Configuración Logística
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Gestione los ítems retornables (activos), procedencias autorizadas y destinos de entrega para toda la operación.
          </p>
        </div>

        {/* Global Action Button based on active tab */}
        {!isEditingItem && !isEditingLoc && !isEditingDriverRoute && !isEditingUser && (
          <button
            onClick={() => {
              if (activeTab === 'items') handleAddNewItem();
              else if (activeTab === 'procedencias') handleAddNewLoc('procedencia');
              else if (activeTab === 'destinos') handleAddNewLoc('destino');
              else if (activeTab === 'choferes') handleAddNewDR();
              else if (activeTab === 'usuarios') handleAddNewUser();
            }}
            className="flex items-center gap-1.5 bg-[#003366] hover:bg-[#003366]/90 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            {activeTab === 'items' && 'Agregar Activo'}
            {activeTab === 'procedencias' && 'Agregar Procedencia'}
            {activeTab === 'destinos' && 'Agregar Jefe Principal / Destino'}
            {activeTab === 'choferes' && 'Agregar Conductor / Ruta'}
            {activeTab === 'usuarios' && isUserAdmin && 'Registrar Usuario'}
          </button>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap border-b border-slate-200 bg-white px-4 rounded-lg pt-1 shadow-xs border gap-1">
        <button
          onClick={() => { setActiveTab('items'); setIsEditingItem(false); setIsEditingLoc(false); setIsEditingDriverRoute(false); setIsEditingUser(false); }}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'items'
              ? 'border-[#003366] text-[#003366]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Ítems a Controlar
        </button>
        <button
          onClick={() => { setActiveTab('procedencias'); setIsEditingItem(false); setIsEditingLoc(false); setIsEditingDriverRoute(false); setIsEditingUser(false); }}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'procedencias'
              ? 'border-[#003366] text-[#003366]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Procedencias / Orígenes
        </button>
        <button
          onClick={() => { setActiveTab('destinos'); setIsEditingItem(false); setIsEditingLoc(false); setIsEditingDriverRoute(false); setIsEditingUser(false); }}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'destinos'
              ? 'border-[#003366] text-[#003366]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Jefes Principales (Destinos)
        </button>
        <button
          onClick={() => { setActiveTab('choferes'); setIsEditingItem(false); setIsEditingLoc(false); setIsEditingDriverRoute(false); setIsEditingUser(false); }}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'choferes'
              ? 'border-[#003366] text-[#003366]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Choferes y Rutas
        </button>
        <button
          onClick={() => { setActiveTab('usuarios'); setIsEditingItem(false); setIsEditingLoc(false); setIsEditingDriverRoute(false); setIsEditingUser(false); }}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'usuarios'
              ? 'border-[#003366] text-[#003366]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Usuarios del Sistema
        </button>
      </div>


      {/* --- RENDER TAB CONTENTS --- */}

      {/* TAB: ITEMS */}
      {activeTab === 'items' && (
        isEditingItem ? (
          /* Form to add/edit items */
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm max-w-2xl">
            <h3 className="font-semibold text-slate-900 mb-3 text-sm font-display">
              {editItem.id ? 'Modificar Activo' : 'Registrar Nuevo Activo a Controlar'}
            </h3>

            {itemFormError && (
              <div className="mb-3.5 p-2 bg-red-50 text-red-600 rounded-lg text-[11px] font-medium border border-red-100">
                {itemFormError}
              </div>
            )}

            <form onSubmit={handleSubmitItem} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Código del Activo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 9000"
                    value={editItem.code}
                    onChange={e => setEditItem({ ...editItem, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Descripción del Activo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. CANASTILLO"
                    value={editItem.name}
                    onChange={e => setEditItem({ ...editItem, name: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Estado de Uso</label>
                  <select
                    value={editItem.status}
                    onChange={e => setEditItem({ ...editItem, status: e.target.value as 'Activo' | 'Inactivo' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20 text-slate-800"
                  >
                    <option value="Activo" className="text-slate-900 bg-white">Activo</option>
                    <option value="Inactivo" className="text-slate-900 bg-white">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg font-semibold cursor-pointer active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  Guardar Activo
                </button>
                <button
                  type="button"
                  onClick={handleCancelItem}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3.5 py-1.5 rounded-lg font-semibold cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Items table */
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-2.5 px-4">Código</th>
                    <th className="p-2.5 px-4">Descripción del Activo</th>
                    <th className="p-2.5 px-4 text-center">Estado</th>
                    <th className="p-2.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-[11px]">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">
                        <Layers className="w-8 h-8 mx-auto opacity-30 mb-1.5" />
                        <span>No hay activos registrados en la base de datos</span>
                      </td>
                    </tr>
                  ) : (
                    items.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/40">
                        <td className="p-2.5 px-4 font-mono font-bold text-slate-900">{item.code}</td>
                        <td className="p-2.5 px-4 font-semibold text-slate-800">{item.name}</td>
                        <td className="p-2.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold ${
                            item.status === 'Activo' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-500 border border-red-100'
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${item.status === 'Activo' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {item.status}
                          </span>
                        </td>
                        <td className="p-2.5 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleEditItem(item)}
                              className="p-1 text-slate-400 hover:text-[#003366] hover:bg-slate-100 rounded transition-all cursor-pointer"
                              title="Editar"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteItem(item.id, item.name)}
                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded transition-all cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}


      {/* TAB: PROCEDENCIAS & DESTINOS */}
      {(activeTab === 'procedencias' || activeTab === 'destinos') && (
        isEditingLoc ? (
          /* Locations Add/Edit Form */
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm max-w-xl">
            <h3 className="font-semibold text-slate-900 mb-3 text-sm font-display">
              {editLoc.id ? 'Modificar Ubicación' : `Registrar Nueva ${activeTab === 'procedencias' ? 'Procedencia/Origen' : 'Destino'}`}
            </h3>

            {locFormError && (
              <div className="mb-3.5 p-2 bg-red-50 text-red-600 rounded-lg text-[11px] font-medium border border-red-100">
                {locFormError}
              </div>
            )}

            <form onSubmit={handleSubmitLoc} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Nombre / Razón Social *</label>
                <input
                  type="text"
                  required
                  placeholder={activeTab === 'procedencias' ? 'Ej. PLANTA CENTRAL EL ALTO' : 'Ej. DISTRIBUIDOR ZONA SUR'}
                  value={editLoc.name}
                  onChange={e => setEditLoc({ ...editLoc, name: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20 text-slate-800"
                />
                <span className="text-[9px] text-slate-400 mt-1 block">Este nombre aparecerá como sugerencia elegible al registrar movimientos.</span>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg font-semibold cursor-pointer active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  Guardar Ubicación
                </button>
                <button
                  type="button"
                  onClick={handleCancelLoc}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3.5 py-1.5 rounded-lg font-semibold cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Locations list */
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[550px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-2.5 px-4 w-12 text-center">#</th>
                    <th className="p-2.5 px-4">Nombre Registrado (Elegible)</th>
                    <th className="p-2.5 px-4">Tipo</th>
                    <th className="p-2.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-[11px]">
                  {filteredLocations.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">
                        <MapPin className="w-8 h-8 mx-auto opacity-30 mb-1.5" />
                        <span>No hay {activeTab === 'procedencias' ? 'procedencias' : 'destinos'} registrados. Registre uno para que aparezca como opción sugerida.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredLocations.map((loc, index) => (
                      <tr key={loc.id} className="hover:bg-slate-50/40">
                        <td className="p-2.5 px-4 font-mono text-slate-400 text-center">{index + 1}</td>
                        <td className="p-2.5 px-4 font-semibold text-slate-800">{loc.name}</td>
                        <td className="p-2.5 px-4 font-medium text-slate-500 capitalize">{loc.type === 'procedencia' ? 'Procedencia / Origen' : 'Destino / Cliente'}</td>
                        <td className="p-2.5 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleEditLoc(loc)}
                              className="p-1 text-slate-400 hover:text-[#003366] hover:bg-slate-100 rounded transition-all cursor-pointer"
                              title="Editar"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteLoc(loc.id, loc.name)}
                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded transition-all cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}


      {/* TAB: CHOFERES Y RUTAS */}
      {activeTab === 'choferes' && (
        isEditingDriverRoute ? (
          /* Driver Route Add/Edit Form */
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm max-w-xl">
            <h3 className="font-semibold text-slate-900 mb-3 text-sm font-display">
              {editDR.id ? 'Modificar Conductor / Ruta' : 'Asignar Conductor a Jefe y Ruta'}
            </h3>

            {drFormError && (
              <div className="mb-3.5 p-2 bg-red-50 text-red-600 rounded-lg text-[11px] font-medium border border-red-100">
                {drFormError}
              </div>
            )}

            <form onSubmit={handleSubmitDR} className="space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold text-slate-500">
                    Jefe Principal / Destino Asociado *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNewJefe(!isCreatingNewJefe);
                      setNewJefeName('');
                    }}
                    className="text-[9px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer underline"
                  >
                    {isCreatingNewJefe ? 'Seleccionar existente' : '+ Crear Nuevo Jefe Principal'}
                  </button>
                </div>

                {isCreatingNewJefe ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      required
                      placeholder="ESCRIBA EL NOMBRE DEL NUEVO JEFE (Ej. DESAYUNOS VIACHA)"
                      value={newJefeName}
                      onChange={e => setNewJefeName(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border border-slate-250 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20 text-slate-850 font-bold uppercase"
                    />
                    <span className="text-[9px] text-slate-400 block leading-tight">
                      Este nuevo Jefe Principal se guardará automáticamente en el sistema y estará disponible para otros conductores y en el módulo de deudas.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <select
                      value={editDR.jefeName}
                      onChange={e => setEditDR({ ...editDR, jefeName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20 text-slate-800 font-bold"
                    >
                      <option value="" disabled>Seleccione el Jefe o Distribuidor...</option>
                      {jefeOptions.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                      {jefeOptions.length === 0 && (
                        <option value="DESAYUNOS VIACHA">DESAYUNOS VIACHA</option>
                      )}
                    </select>
                    <span className="text-[9px] text-slate-400 block leading-tight">
                      Asocia este chofer a un Jefe Principal para consolidar sus saldos de deuda de canastillos en fin de mes.
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Nombre Completo del Conductor (Chofer) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. JUAN CARLOS CHOQUE"
                  value={editDR.driverName}
                  onChange={e => setEditDR({ ...editDR, driverName: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Ruta de Reparto (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej. RUTA SUR - VIACHA"
                    value={editDR.route}
                    onChange={e => setEditDR({ ...editDR, route: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Número de Placa del Camión (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej. 4589-KLD"
                    value={editDR.plate}
                    onChange={e => setEditDR({ ...editDR, plate: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20 text-slate-800"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg font-semibold cursor-pointer active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  Guardar Chofer/Ruta
                </button>
                <button
                  type="button"
                  onClick={handleCancelDR}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3.5 py-1.5 rounded-lg font-semibold cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Drivers List */
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-2.5 px-4 w-12 text-center">#</th>
                    <th className="p-2.5 px-4">Conductor (Chofer)</th>
                    <th className="p-2.5 px-4">Jefe Principal (Destino)</th>
                    <th className="p-2.5 px-4">Ruta Asignada</th>
                    <th className="p-2.5 px-4">Placa de Vehículo</th>
                    <th className="p-2.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-[11px]">
                  {driversRoutes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        <Navigation className="w-8 h-8 mx-auto opacity-30 mb-1.5" />
                        <span>No hay conductores o rutas registradas.</span>
                      </td>
                    </tr>
                  ) : (
                    driversRoutes.map((dr, index) => (
                      <tr key={dr.id} className="hover:bg-slate-50/40">
                        <td className="p-2.5 px-4 font-mono text-slate-400 text-center">{index + 1}</td>
                        <td className="p-2.5 px-4 font-semibold text-slate-800">{dr.driverName}</td>
                        <td className="p-2.5 px-4">
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-[#003366] px-2 py-0.5 rounded text-[10px] font-bold border border-blue-100">
                            {dr.jefeName}
                          </span>
                        </td>
                        <td className="p-2.5 px-4 text-slate-600 font-medium">{dr.route || 'SIN RUTA'}</td>
                        <td className="p-2.5 px-4 text-slate-500 font-mono font-bold">{dr.plate || 'SIN PLACA'}</td>
                        <td className="p-2.5 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleEditDR(dr)}
                              className="p-1 text-slate-400 hover:text-[#003366] hover:bg-slate-100 rounded transition-all cursor-pointer"
                              title="Editar"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteDR(dr.id, dr.driverName)}
                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded transition-all cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}


      {/* TAB: USUARIOS DEL SISTEMA */}
      {activeTab === 'usuarios' && (
        isEditingUser && isUserAdmin ? (
          /* User Add/Edit Form */
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm max-w-xl">
            <h3 className="font-semibold text-slate-900 mb-3 text-sm font-display">
              {editUser.id ? 'Modificar Cuenta de Usuario' : 'Registrar Nuevo Usuario Corporativo'}
            </h3>

            {userFormError && (
              <div className="mb-3.5 p-2 bg-red-50 text-red-600 rounded-lg text-[11px] font-medium border border-red-100">
                {userFormError}
              </div>
            )}

            {userFormSuccess && (
              <div className="mb-3.5 p-2 bg-emerald-50 text-emerald-600 rounded-lg text-[11px] font-medium border border-emerald-100">
                {userFormSuccess}
              </div>
            )}

            <form onSubmit={handleSubmitUser} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Nombre de Usuario (Login) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. jchoque"
                    disabled={!!editUser.id}
                    value={editUser.username}
                    onChange={e => setEditUser({ ...editUser, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    className="w-full bg-slate-50 disabled:opacity-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20 text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Nombre Completo del Operario *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Choque Mamani"
                    value={editUser.name}
                    onChange={e => setEditUser({ ...editUser, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Rol de Acceso y Seguridad</label>
                  <select
                    value={editUser.role}
                    onChange={e => setEditUser({ ...editUser, role: e.target.value as 'Administrador' | 'Supervisor' | 'Operador' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20 text-slate-800"
                  >
                    <option value="Operador">Operador (Registrar Salidas/Ingresos)</option>
                    <option value="Supervisor">Supervisor (Ver stock, editar ítems, ver reportes)</option>
                    <option value="Administrador">Administrador (Control total + backups)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Estado de la Cuenta</label>
                  <select
                    value={editUser.status}
                    onChange={e => setEditUser({ ...editUser, status: e.target.value as 'Activo' | 'Inactivo' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20 text-slate-800"
                  >
                    <option value="Activo">Activo (Acceso habilitado)</option>
                    <option value="Inactivo">Inactivo (Acceso suspendido)</option>
                  </select>
                </div>
              </div>

              {!editUser.id && (
                <div className="bg-blue-50 border border-blue-100 p-2.5 rounded text-blue-800">
                  <p className="font-bold mb-0.5">Nota de Seguridad:</p>
                  <span>La contraseña predeterminada para esta nueva cuenta será <b>123456</b>. El operario deberá cambiarla en su primer inicio de sesión usando el botón "Contraseña" de la barra superior.</span>
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg font-semibold cursor-pointer active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  Guardar Cuenta
                </button>
                <button
                  type="button"
                  onClick={handleCancelUser}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3.5 py-1.5 rounded-lg font-semibold cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Users list */
          <div className="space-y-3.5">
            {!isUserAdmin && (
              <div className="bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-200 text-xs flex gap-2 items-center">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>Su nivel de rol actual es <b>{currentUser?.role}</b>. Solamente los usuarios con rol de <b>Administrador</b> poseen permisos para dar de alta o modificar cuentas de usuario corporativas.</span>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[550px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="p-2.5 px-4 w-12 text-center">#</th>
                      <th className="p-2.5 px-4">Usuario (Login)</th>
                      <th className="p-2.5 px-4">Nombre Completo</th>
                      <th className="p-2.5 px-4">Nivel de Acceso</th>
                      <th className="p-2.5 px-4">Estado</th>
                      {isUserAdmin && <th className="p-2.5 px-4 text-right">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-[11px]">
                    {users.map((u, index) => (
                      <tr key={u.id} className="hover:bg-slate-50/40">
                        <td className="p-2.5 px-4 font-mono text-slate-400 text-center">{index + 1}</td>
                        <td className="p-2.5 px-4 font-mono font-bold text-[#003366]">{u.username}</td>
                        <td className="p-2.5 px-4 font-semibold text-slate-800">{u.name}</td>
                        <td className="p-2.5 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold ${
                            u.role === 'Administrador' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                            u.role === 'Supervisor' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            'bg-slate-50 text-slate-600 border border-slate-150'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-2.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            u.status === 'Activo' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${u.status === 'Activo' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {u.status}
                          </span>
                        </td>
                        {isUserAdmin && (
                          <td className="p-2.5 px-4 text-right">
                            <button
                              onClick={() => handleEditUser(u)}
                              className="p-1 text-slate-400 hover:text-[#003366] hover:bg-slate-100 rounded transition-all cursor-pointer"
                              title="Editar"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      )}

      {/* Custom delete confirmation modal for cross-origin iframe compatibility */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3 text-red-600">
                <div className="p-2 bg-red-50 rounded-full flex-shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Confirmar Acción</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    ¿Está seguro de que desea eliminar permanentemente el registro de{' '}
                    <span className="font-bold text-slate-800">"{deleteConfirm.name}"</span>? 
                    {deleteConfirm.type === 'item' ? ' Si este activo tiene movimientos de stock registrados, se desactivará automáticamente para conservar su historial en vez de eliminarse por completo.' : ' Esta acción removerá la procedencia/destino o conductor de forma permanente.'}
                  </p>
                </div>
              </div>

              {deleteError && (
                <div className="p-2.5 bg-red-50 border border-red-150 rounded text-red-600 text-[11px] font-medium leading-normal">
                  {deleteError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
