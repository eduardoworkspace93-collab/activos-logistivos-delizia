/**
 * Utility functions for exporting CSV, formatting, and logistical assistance.
 */

// Helper to download CSV in Excel-friendly format (UTF-8 with BOM)
export function exportToCSV(data: any[], filename: string, headers: { key: string; label: string }[]) {
  const csvRows: string[] = [];
  
  // 1. Headers row
  const headerRow = headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(',');
  csvRows.push(headerRow);
  
  // 2. Data rows
  for (const row of data) {
    const values = headers.map(h => {
      const val = row[h.key];
      const stringVal = val === undefined || val === null ? '' : String(val);
      return `"${stringVal.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }
  
  // 3. Create blob with UTF-8 BOM for proper Spanish characters in Excel
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Format date to local friendly representation
export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
}

// Format hour string
export function formatTime(timeStr: string): string {
  if (!timeStr) return '-';
  return timeStr.substring(0, 5); // HH:MM
}

// Generate printable delivery voucher (Acta de Entrega/Devolución) mock-up details
export interface DeliveryActaData {
  companyName: string;
  logoUrl: string;
  movementNumber: string;
  date: string;
  time: string;
  type: 'ingreso' | 'salida';
  itemName: string;
  itemCode: string;
  quantity: number;
  entity: string;
  responsible: string;
  details: string;
  user: string;
  truckPlate?: string;
  truckDriver?: string;
  truckRoute?: string;
  clientName?: string;
  crateStatus: string;
}
