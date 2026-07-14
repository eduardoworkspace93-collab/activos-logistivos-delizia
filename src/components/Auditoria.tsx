import React, { useState } from 'react';
import { AuditEntry } from '../types.js';
import { Search, History, Eye, EyeOff, Terminal, Shield } from 'lucide-react';
import { formatDate, formatTime } from '../utils.js';

interface AuditoriaProps {
  audit: AuditEntry[];
}

export default function Auditoria({ audit }: AuditoriaProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  // Filter logs by action or user
  const filteredLogs = audit.filter(log => {
    const term = searchTerm.toLowerCase();
    return (
      log.user.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      log.ip.includes(term)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold font-display text-slate-900 leading-tight">
              Bitácora de Auditoría Logística e Inmutable
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Registro inalterable de transacciones, modificaciones de stock, inicios de sesión y accesos IP
            </p>
          </div>
          <div className="flex items-center gap-1 text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded">
            <Shield className="w-3 h-3" />
            PROTECCIÓN ACTIVA
          </div>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filtrar bitácora por usuario, acción registrada o dirección IP..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]/20"
          />
        </div>
      </div>

      {/* Audit logs timeline list */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden divide-y divide-slate-150">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <History className="w-6 h-6 mx-auto opacity-30 mb-1.5" />
            <span>No se encontraron registros de auditoría que coincidan con la búsqueda</span>
          </div>
        ) : (
          filteredLogs.map(log => {
            const isExpanded = expandedLogId === log.id;
            
            // Format state changes safely
            let beforeObj = {};
            let afterObj = {};
            try {
              beforeObj = JSON.parse(log.beforeChange);
              afterObj = JSON.parse(log.afterChange);
            } catch (e) {}

            return (
              <div key={log.id} className="p-3 hover:bg-slate-50/30 transition-colors text-xs space-y-2.5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="flex items-start md:items-center gap-2.5">
                    {/* User Badge */}
                    <div className="p-1 px-2 bg-slate-50 font-mono font-bold text-[#003366] rounded border border-slate-200">
                      @{log.user}
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-slate-800 uppercase tracking-wide block">
                        {log.action}
                      </span>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-medium">
                        <span>IP: {log.ip}</span>
                        <span>•</span>
                        <span>{formatDate(log.date)} - {formatTime(log.time)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Toggle expand JSON details */}
                  <button
                    onClick={() => toggleExpand(log.id)}
                    className="flex items-center gap-1 text-[9px] font-bold text-slate-500 hover:text-slate-900 bg-slate-100/50 hover:bg-slate-150 px-2 py-1 rounded transition-all cursor-pointer self-start md:self-auto"
                  >
                    {isExpanded ? (
                      <>
                        <EyeOff className="w-3 h-3" /> Ocultar Trazabilidad
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" /> Ver Trazabilidad
                      </>
                    )}
                  </button>
                </div>

                {/* Collapsible Trace JSON */}
                {isExpanded && (
                  <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[10px] overflow-x-auto space-y-3 border border-slate-800 shadow-inner">
                    <div className="flex items-center gap-2 text-slate-400 border-b border-slate-800 pb-1 mb-1.5">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Comparación de Estados de Auditoría</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Before state */}
                      <div className="space-y-1">
                        <span className="text-red-400 font-bold uppercase tracking-wider block text-[8px]">
                          [ESTADO ANTERIOR]
                        </span>
                        <pre className="p-2 bg-black/40 rounded border border-slate-800 max-h-[150px] overflow-y-auto">
                          {JSON.stringify(beforeObj, null, 2)}
                        </pre>
                      </div>

                      {/* After state */}
                      <div className="space-y-1">
                        <span className="text-emerald-400 font-bold uppercase tracking-wider block text-[8px]">
                          [ESTADO POSTERIOR]
                        </span>
                        <pre className="p-2 bg-black/40 rounded border border-slate-800 max-h-[150px] overflow-y-auto">
                          {JSON.stringify(afterObj, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
