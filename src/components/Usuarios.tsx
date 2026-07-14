import React, { useState } from 'react';
import { User } from '../types.js';
import { Plus, Save, X, Edit2, Users, CheckCircle, ShieldAlert } from 'lucide-react';

interface UsuariosProps {
  users: User[];
  currentUser: User;
  onSaveUser: (userData: Partial<User>) => Promise<any>;
}

export default function Usuarios({ users, currentUser, onSaveUser }: UsuariosProps) {
  const isAdmin = currentUser.role === 'Administrador';

  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [editUser, setEditUser] = useState<Partial<User>>({
    username: '',
    name: '',
    role: 'Operador',
    passwordHash: '123456', // Plain text representational passwords
    status: 'Activo'
  });

  const handleAddNew = () => {
    setEditUser({
      username: '',
      name: '',
      role: 'Operador',
      passwordHash: '123456',
      status: 'Activo'
    });
    setFormError('');
    setFormSuccess('');
    setIsEditing(true);
  };

  const handleEdit = (user: User) => {
    setEditUser({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      status: user.status
    });
    setFormError('');
    setFormSuccess('');
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!editUser.username || !editUser.name) {
      setFormError('El nombre de usuario y el nombre completo son campos obligatorios.');
      return;
    }

    try {
      await onSaveUser(editUser);
      setFormSuccess('Usuario guardado correctamente.');
      setIsEditing(false);
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar el usuario.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Panel */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-base font-bold font-display text-slate-900 leading-tight">
            Control de Usuarios y Roles de Seguridad
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Gestión de credenciales, niveles de acceso y auditoría de permisos
          </p>
        </div>
        {isAdmin && !isEditing && (
          <button
            onClick={handleAddNew}
            className="flex items-center gap-1.5 bg-[#003366] hover:bg-[#003366]/90 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Registrar Usuario
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-200 text-xs flex gap-2 items-center">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>Su nivel de rol actual es <b>{currentUser.role}</b>. Solamente los usuarios con rol de <b>Administrador</b> poseen permisos para modificar o dar de alta cuentas de usuario corporativas.</span>
        </div>
      )}

      {isEditing && isAdmin ? (
        /* Edit user panel */
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm max-w-xl">
          <h3 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider font-display">
            {editUser.id ? 'Modificar Registro de Usuario' : 'Registrar Nuevo Usuario Logístico'}
          </h3>

          {formError && (
            <div className="mb-3 p-2 px-3 bg-red-50 text-red-600 rounded-lg text-xs font-medium border border-red-100">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Nombre Completo *</label>
              <input
                type="text"
                required
                placeholder="Ej. Juan Carlos Mamani"
                value={editUser.name}
                onChange={e => setEditUser({ ...editUser, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Nombre de Usuario *</label>
                <input
                  type="text"
                  required
                  disabled={!!editUser.id}
                  placeholder="Ej. jmamani"
                  value={editUser.username}
                  onChange={e => setEditUser({ ...editUser, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>

              {!editUser.id && (
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Contraseña Inicial</label>
                  <input
                    type="text"
                    placeholder="Contraseña por defecto"
                    value={editUser.passwordHash}
                    onChange={e => setEditUser({ ...editUser, passwordHash: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Rol Operativo</label>
                <select
                  value={editUser.role}
                  onChange={e => setEditUser({ ...editUser, role: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white focus:outline-none text-slate-800"
                >
                  <option value="Administrador" className="text-slate-900 bg-white">Administrador (Todo)</option>
                  <option value="Supervisor" className="text-slate-900 bg-white">Supervisor (Registro y Consulta)</option>
                  <option value="Operador" className="text-slate-900 bg-white">Operador (Solo Registro)</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Estado Cuenta</label>
                <select
                  value={editUser.status}
                  onChange={e => setEditUser({ ...editUser, status: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:bg-white focus:outline-none text-slate-800"
                >
                  <option value="Activo" className="text-slate-900 bg-white">Activo</option>
                  <option value="Inactivo" className="text-slate-900 bg-white">Inactivo</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-150">
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Guardar Cambios
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Users List table */
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          {formSuccess && (
            <div className="m-3 p-2 px-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-100">
              {formSuccess}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-2.5 px-4">Nombre de Usuario</th>
                  <th className="p-2.5 px-4">Nombre Completo</th>
                  <th className="p-2.5 px-4">Rol Asignado</th>
                  <th className="p-2.5 px-4">Estado</th>
                  <th className="p-2.5 px-4">Permisos Clave</th>
                  {isAdmin && <th className="p-2.5 px-4 text-right">Editar</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-[11px]">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/40">
                    <td className="p-2.5 px-4 font-mono font-bold text-[#003366]">@{u.username}</td>
                    <td className="p-2.5 px-4 font-semibold text-slate-800">{u.name}</td>
                    <td className="p-2.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                        u.role === 'Administrador' 
                          ? 'bg-purple-50 text-purple-700 border-purple-100' 
                          : u.role === 'Supervisor' 
                            ? 'bg-blue-50 text-blue-700 border-blue-100' 
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-2.5 px-4">
                      <span className={`inline-flex items-center gap-1 font-bold ${
                        u.status === 'Activo' ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Activo' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {u.status}
                      </span>
                    </td>
                    <td className="p-2.5 px-4 text-slate-500">
                      {u.role === 'Administrador' && 'Acceso total y configuración de respaldos'}
                      {u.role === 'Supervisor' && 'Registro de movimientos y visualización de kardex'}
                      {u.role === 'Operador' && 'Permiso único de registro de ingresos/salidas'}
                    </td>
                    {isAdmin && (
                      <td className="p-2.5 px-4 text-right">
                        <button
                          onClick={() => handleEdit(u)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
