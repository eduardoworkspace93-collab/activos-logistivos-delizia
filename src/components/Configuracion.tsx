import React, { useState } from 'react';
import { AppConfig, BackupFile } from '../types.js';
import { Save, Shield, Download, RefreshCw, UploadCloud, FileJson, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';

interface ConfiguracionProps {
  config: AppConfig;
  backups: BackupFile[];
  userRole: string;
  onSaveConfig: (newConfig: AppConfig) => Promise<any>;
  onCreateBackup: () => Promise<any>;
  onRestoreBackup: (filename: string) => Promise<any>;
  onRestoreUpload: (jsonContent: string) => Promise<any>;
  onClearDatabase: (password: string) => Promise<any>;
}

export default function Configuracion({
  config,
  backups,
  userRole,
  onSaveConfig,
  onCreateBackup,
  onRestoreBackup,
  onRestoreUpload,
  onClearDatabase
}: ConfiguracionProps) {
  const isAdmin = userRole === 'Administrador';

  const [companyName, setCompanyName] = useState(config.companyName || '');
  const [logoUrl, setLogoUrl] = useState(config.logoUrl || '');
  const [primaryColor, setPrimaryColor] = useState(config.primaryColor || '#0b4a9b');
  const [secondaryColor, setSecondaryColor] = useState(config.secondaryColor || '#f15a24');

  const [statusMsg, setStatusMsg] = useState('');
  const [statusError, setStatusError] = useState('');

  // Backup Upload State
  const [dragOver, setDragOver] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Database Clear Modal States
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearPasswordInput, setClearPasswordInput] = useState('');
  const [clearError, setClearError] = useState('');

  const handleOpenClearModal = () => {
    setClearPasswordInput('');
    setClearError('');
    setShowClearModal(true);
  };

  const handleConfirmClearDatabase = async () => {
    if (!clearPasswordInput) {
      setClearError('Por favor, ingrese la contraseña de seguridad.');
      return;
    }
    if (clearPasswordInput !== '76259984') {
      setClearError('Contraseña incorrecta. Acción cancelada por seguridad.');
      return;
    }

    setClearing(true);
    setClearError('');
    setStatusMsg('');
    setStatusError('');
    try {
      await onClearDatabase(clearPasswordInput);
      setStatusMsg('La base de datos se ha vaciado por completo con éxito. El sistema ha quedado a cero para nuevos registros.');
      setShowClearModal(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setClearError(err.message || 'Error al vaciar la base de datos.');
      setStatusError(err.message || 'Error al vaciar la base de datos.');
    } finally {
      setClearing(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('');
    setStatusError('');

    try {
      await onSaveConfig({ companyName, logoUrl, primaryColor, secondaryColor });
      setStatusMsg('Configuración corporativa actualizada con éxito.');
    } catch (err: any) {
      setStatusError(err.message || 'Error al guardar la configuración.');
    }
  };

  const handleCreateBackup = async () => {
    setStatusMsg('');
    setStatusError('');
    try {
      const res = await onCreateBackup();
      setStatusMsg(`Copia de seguridad generada con éxito: ${res.filename}`);
    } catch (err: any) {
      setStatusError(err.message || 'Error al generar la copia de seguridad.');
    }
  };

  const handleRestore = async (filename: string) => {
    if (confirm(`⚠️ ATENCIÓN: ¿Está absolutamente seguro de que desea restaurar la base de datos al respaldo "${filename}"? Todo dato actual posterior será sobrescrito.`)) {
      setStatusMsg('');
      setStatusError('');
      try {
        await onRestoreBackup(filename);
        setStatusMsg('Base de datos restaurada correctamente a partir del respaldo.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err: any) {
        setStatusError(err.message || 'Error al restaurar el respaldo.');
      }
    }
  };

  // Drag and drop file reading to restore
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readAndRestoreFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    readAndRestoreFile(file);
  };

  const readAndRestoreFile = (file: File) => {
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setStatusError('El archivo debe ser un JSON de respaldo válido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (confirm('⚠️ ADVERTENCIA CRÍTICA: Ha cargado un archivo JSON externo de respaldo. ¿Confirma que desea restaurar el sistema completo con este archivo? Se creará una copia de seguridad automática de rollback antes del cambio.')) {
        setStatusMsg('');
        setStatusError('');
        try {
          await onRestoreUpload(content);
          setStatusMsg('Carga completada: Base de datos restaurada con éxito a partir de archivo JSON externo.');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err: any) {
          setStatusError(err.message || 'Error al restaurar el archivo de respaldo subido.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      {/* Alert Messages */}
      {statusMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200 flex gap-2 items-center">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}
      {statusError && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs font-semibold border border-red-200 flex gap-2 items-center">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{statusError}</span>
        </div>
      )}

      {/* Grid Settings vs Backups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Settings Box */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 font-display text-xs uppercase tracking-wider">Configuración Corporativa DELIZIA</h3>
            <p className="text-[11px] text-slate-500">Ajuste la marca visual y los colores primarios en la interfaz de usuario</p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Nombre Comercial de la Empresa</label>
              <input
                type="text"
                disabled={!isAdmin}
                required
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed text-xs"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Enlace URL del Isologo Corporativo</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                placeholder="Ej. https://url-isologo-corporativo.png"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none disabled:bg-slate-100 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Color Principal</label>
                <div className="flex gap-1.5">
                  <input
                    type="color"
                    disabled={!isAdmin}
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5 disabled:cursor-not-allowed flex-shrink-0"
                  />
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Color Secundario (Acentos)</label>
                <div className="flex gap-1.5">
                  <input
                    type="color"
                    disabled={!isAdmin}
                    value={secondaryColor}
                    onChange={e => setSecondaryColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5 disabled:cursor-not-allowed flex-shrink-0"
                  />
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={secondaryColor}
                    onChange={e => setSecondaryColor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="pt-1.5">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-[#003366] hover:bg-[#003366]/95 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  Aplicar Configuración Visual
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Backups Panel */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center gap-2">
            <div>
              <h3 className="font-bold text-slate-900 font-display text-xs uppercase tracking-wider">Copias de Seguridad (Backup)</h3>
              <p className="text-[11px] text-slate-500">Genere instantáneas locales o cargue bases de datos externas</p>
            </div>

            {isAdmin && (
              <button
                onClick={handleCreateBackup}
                className="flex items-center gap-1 bg-[#003366] hover:bg-[#003366]/90 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all active:scale-95 shadow-sm flex-shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Generar Respaldo
              </button>
            )}
          </div>

          {!isAdmin ? (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-400 text-xs">
              Debe contar con credenciales de Administrador para gestionar las copias de seguridad del servidor.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Drag and Drop JSON Upload Direct Restore */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border border-dashed rounded-lg p-4 text-center transition-all cursor-pointer relative ${
                  dragOver 
                    ? 'border-[#003366] bg-blue-50/20' 
                    : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  type="file"
                  id="backup-file-picker"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                <span className="font-bold text-slate-700 text-[11px] block">
                  Cargar Base de Datos Externa (.json)
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  Arrastre aquí el archivo o haga clic para seleccionar
                </span>
              </div>

              {/* Existing Backups List */}
              <div className="space-y-1.5">
                <span className="font-bold text-[9px] uppercase tracking-wider text-slate-400 block">
                  Copias de Seguridad Disponibles en el Servidor
                </span>

                <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1">
                  {backups.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 text-[10px] bg-slate-50 rounded-lg border border-slate-150">
                      No se han registrado copias de seguridad locales todavía
                    </div>
                  ) : (
                    backups.map(b => (
                      <div 
                        key={b.filename} 
                        className="p-2 bg-slate-50 rounded-lg border border-slate-150 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileJson className="text-amber-600 w-4 h-4 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="font-mono font-bold text-slate-800 text-[10px] block truncate max-w-[170px]" title={b.filename}>
                              {b.filename}
                            </span>
                            <span className="text-[9px] text-slate-400 block">
                              {b.date} • {b.size}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleRestore(b.filename)}
                            className="bg-[#003366]/10 hover:bg-[#003366]/20 text-[#003366] font-bold px-2 py-1 rounded text-[10px] cursor-pointer"
                          >
                            Restaurar
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Danger Zone Full Width */}
      {isAdmin && (
        <div className="bg-red-50/40 border border-red-200 rounded-lg p-4 space-y-3 mt-1.5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-red-800 text-xs uppercase tracking-wider">Zona de Peligro / Mantenimiento de Datos</h4>
              <p className="text-[11px] text-red-600/80 mt-0.5">
                Acciones de reajuste estructural que modifican el estado global de la base de datos de producción.
              </p>
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg border border-red-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-slate-800 block">Vaciar Base de Datos (Reiniciar a Cero)</span>
              <p className="text-[11px] text-slate-500 max-w-xl leading-relaxed">
                Elimina de forma permanente todos los registros de movimientos, kardex histórico, ubicaciones, responsables de operación y conductores. Conserva únicamente los usuarios registrados y la configuración visual para garantizar el acceso al sistema.
              </p>
            </div>

            <button
              onClick={handleOpenClearModal}
              disabled={clearing}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold px-3.5 py-2 rounded-lg text-xs cursor-pointer shadow-sm active:scale-95 transition-all whitespace-nowrap self-end sm:self-center"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {clearing ? 'Vaciando...' : 'Vaciar Base de Datos'}
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM CLEAR DATABASE MODAL */}
      {showClearModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex gap-3 items-start text-red-600">
              <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider font-display">⚠️ Confirmación de Vaciado</h3>
                <p className="text-xs text-red-600 font-semibold">Esta acción es irreversible y vaciará completamente el sistema.</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Se eliminarán permanentemente todos los registros de movimientos, el kardex, las ubicaciones, responsables y conductores. Los usuarios y la configuración corporativa se mantendrán intactos. Se generará un respaldo de seguridad automático antes del vaciado.
            </p>

            <div className="space-y-1.5 pt-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Ingrese la contraseña de seguridad para proceder:
              </label>
              <input
                type="password"
                value={clearPasswordInput}
                onChange={e => {
                  setClearPasswordInput(e.target.value);
                  setClearError('');
                }}
                placeholder="Contraseña de seguridad"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none"
              />
              {clearError && (
                <p className="text-[11px] text-red-600 font-semibold">{clearError}</p>
              )}
            </div>

            <div className="flex gap-2.5 pt-2 justify-end">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClearDatabase}
                disabled={clearing}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-sm"
              >
                {clearing ? 'Vaciando...' : 'Confirmar Vaciado Total'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
