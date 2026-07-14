import React from 'react';
import { Movement, AppConfig } from '../types.js';
import { formatDate, formatTime } from '../utils.js';
import { Printer, X, ShieldAlert, FileText, CheckCircle } from 'lucide-react';

interface PrintActaProps {
  movement: Movement;
  config: AppConfig;
  onClose: () => void;
}

export default function PrintActa({ movement, config, onClose }: PrintActaProps) {
  const isSalida = movement.type === 'salida';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm print:p-0 print:bg-white print:static print:h-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full p-5 shadow-lg border border-slate-200 flex flex-col relative print:shadow-none print:border-none print:p-0">
        
        {/* Modal Controls - Hidden in Print */}
        <div className="flex justify-between items-center pb-2.5 mb-4 border-b border-slate-150 print:hidden">
          <div className="flex items-center gap-1.5">
            <FileText className="text-[#003366] w-4 h-4" />
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider font-display">Acta de Movimiento de Canastillos</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-[#003366] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#003366]/90 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / PDF
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRINT CONTENT BODY */}
        <div id="acta-print-area" className="flex flex-col text-slate-800 text-[11px] print:text-black">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-300 pb-4 mb-4">
            <div className="flex flex-col">
              <span className="font-bold text-sm text-[#003366] font-display print:text-black">{config.companyName || 'DELIZIA'}</span>
              <span className="text-[10px] text-slate-500">División de Operaciones y Control Logístico</span>
              <span className="text-[10px] text-slate-500">Planta Central - La Paz, Bolivia</span>
            </div>
            <div className="flex flex-col items-end text-right">
              <span className="bg-blue-50 text-[#003366] text-[9px] font-bold px-2.5 py-0.5 rounded border border-blue-200 print:border-black print:text-black print:bg-white uppercase">
                {isSalida ? 'Acta de Entrega / Salida' : 'Acta de Recepción / Ingreso'}
              </span>
              <span className="font-mono font-bold text-slate-900 text-sm">{movement.movementNumber}</span>
              <span className="text-[9px] text-slate-400">Fecha: {formatDate(movement.date)} - {formatTime(movement.time)}</span>
            </div>
          </div>

          {/* Description Intro */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 print:bg-white print:border-slate-300">
            <p className="text-[10px] text-slate-600 leading-relaxed">
              Mediante la presente acta se hace constar formalmente el {isSalida ? 'despacho y entrega' : 'retorno y recepción'} de canastillos retornables de la empresa DELIZIA, detallados a continuación para su control de stock e inventario físico en tránsito.
            </p>
          </div>

          {/* Core Grid Info */}
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-b border-slate-200 pb-4 mb-4">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Responsable del Registro</span>
              <span className="font-semibold text-slate-800">{movement.responsible || 'No asignado'}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">{isSalida ? 'Destino / Sucursal' : 'Procedencia / Origen'}</span>
              <span className="font-semibold text-slate-800">{movement.entity || 'No asignado'}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Registrado por Usuario</span>
              <span className="font-mono text-slate-700">@{movement.user}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Nº de Orden (Alfanumérico)</span>
              <span className="font-mono font-bold text-[#003366] print:text-black">{movement.orderNumber || '-'}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Estado Físico en Tránsito</span>
              <span className={`inline-flex items-center gap-1 font-semibold ${
                movement.crateStatus === 'Dañado' || movement.crateStatus === 'Reparación' ? 'text-red-600' : 'text-emerald-600'
              }`}>
                {movement.crateStatus}
              </span>
            </div>
          </div>

          {/* Logistics / Transport Info */}
          <div className="mb-4">
            <h4 className="font-bold text-[9px] uppercase tracking-wider text-slate-400 mb-2 font-display">Información de Transporte y Distribución</h4>
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-150 print:bg-white print:border-slate-300">
              <div>
                <span className="text-[9px] text-slate-500 block">Placa Vehículo</span>
                <span className="font-bold font-mono text-slate-800">{movement.truckPlate || 'S/N'}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block">Conductor Asignado</span>
                <span className="font-semibold text-slate-800">{movement.truckDriver || 'S/N'}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block">Ruta de Distribución</span>
                <span className="font-semibold text-slate-800">{movement.truckRoute || 'S/N'}</span>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden mb-4 print:border-slate-400">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-600 print:bg-white print:border-b-2 print:border-black">
                  <th className="p-2 px-3 w-20">CÓDIGO</th>
                  <th className="p-2 px-3">DESCRIPCIÓN DEL CANASTILLO</th>
                  <th className="p-2 px-3 text-right">CAPACIDAD</th>
                  <th className="p-2 px-3 text-right w-24">CANTIDAD</th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-slate-800 border-b border-slate-150 print:border-b">
                  <td className="p-2 px-3 font-mono font-semibold">{movement.itemCode || '-'}</td>
                  <td className="p-2 px-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full print:hidden"
                        style={{ backgroundColor: movement.itemColor || '#888' }}
                      />
                      <span>{movement.itemName || 'Canastillo Registrado'}</span>
                    </div>
                  </td>
                  <td className="p-2 px-3 text-right text-slate-500">Caja de {movement.itemId === 'i1' ? 24 : movement.itemId === 'i2' ? 18 : 30} ud.</td>
                  <td className="p-2 px-3 text-right font-mono font-bold text-xs text-slate-900">{movement.quantity} Unidades</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Observations */}
          {movement.details && (
            <div className="mb-4 bg-amber-50/50 p-3 rounded-lg border border-amber-200 print:bg-white print:border-slate-300">
              <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wider block mb-0.5">Detalles / Observaciones Especiales</span>
              <p className="text-[10px] text-slate-700 leading-relaxed italic">"{movement.details}"</p>
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 mt-10 pt-6 border-t border-dashed border-slate-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-40 border-b border-slate-300 mb-1.5"></div>
              <span className="font-bold text-[10px] text-slate-800">Entregado Por</span>
              <span className="text-[9px] text-slate-500">Firma y C.I. Responsable Despacho</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-40 border-b border-slate-300 mb-1.5"></div>
              <span className="font-bold text-[10px] text-slate-800">Recibido Conforme</span>
              <span className="text-[9px] text-slate-500">Firma y C.I. Conductor / Cliente</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[9px] text-slate-400 mt-8 border-t border-slate-100 pt-3 print:text-black font-sans">
            <span>Este documento constituye una constancia legal de control interno de activos retornables. Delizia Ltda. © 2026</span>
          </div>

        </div>

      </div>
    </div>
  );
}
