export interface Location {
  id: string;
  name: string;
  type: 'procedencia' | 'destino';
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'Administrador' | 'Supervisor' | 'Operador';
  status: 'Activo' | 'Inactivo';
}

export interface Item {
  id: string;
  code: string;
  name: string;
  description: string;
  color: string;
  capacity: number;
  status: 'Activo' | 'Inactivo';
}

export interface Movement {
  id: string;
  movementNumber: string;
  documentNumber?: string; // Número de documento alfanumérico (formerly orderNumber)
  orderNumber?: string; // For backward compatibility
  date: string;
  time: string;
  type: 'ingreso' | 'salida';
  itemId: string;
  quantity: number;
  entity: string;
  responsible: string;
  details: string;
  user: string;
  
  // Custom logistics fields
  truckPlate?: string;
  truckDriver?: string;
  truckRoute?: string;
  clientName?: string;
  crateStatus: 'Planta' | 'Planta_Disponibles' | 'Produccion' | 'Planta_Almacen' | 'Reparto' | 'Clientes' | 'Pendiente' | 'Dañado' | 'Reparación';

  // Resolved fields
  itemCode?: string;
  itemName?: string;
  itemColor?: string;
}

export interface KardexEntry {
  id: string;
  documentNumber?: string; // (formerly orderNumber)
  orderNumber?: string; // For backward compatibility
  date: string;
  time: string;
  type: 'ingreso' | 'salida';
  code: string;
  item: string;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  user: string;
  entity: string;
  details: string;
}

export interface AuditEntry {
  id: string;
  user: string;
  date: string;
  time: string;
  ip: string;
  action: string;
  beforeChange: string;
  afterChange: string;
}

export interface AppConfig {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface StockStats {
  id: string;
  code: string;
  name: string;
  color: string;
  capacity: number;
  totalIngresos: number;
  totalSalidas: number;
  stockActual: number;
  status: 'Activo' | 'Inactivo';
  breakdown: {
    planta: number;
    plantaDisponibles: number;
    produccion: number;
    plantaAlmacen: number;
    reparto: number;
    clientes: number;
    pendientes: number;
    danado: number;
    reparacion: number;
  };
}

export interface DashboardStats {
  totalCratesRegistered: number;
  totalCurrentStock: number;
  todayIngresos: number;
  todaySalidas: number;
  stockAlerts: {
    itemId: string;
    code: string;
    name: string;
    color: string;
    stockActual: number;
    alertType: 'Critico' | 'Bajo';
  }[];
  dailyChartData: {
    date: string;
    label: string;
    ingresos: number;
    salidas: number;
  }[];
  recentMovements: Movement[];
  logisticsBreakdown: {
    planta: number;
    plantaDisponibles: number;
    produccion: number;
    plantaAlmacen: number;
    reparto: number;
    clientes: number;
    pendientes: number;
    danado: number;
    reparacion: number;
  };
}

export interface BackupFile {
  filename: string;
  date: string;
  size: string;
}

export interface Responsible {
  id: string;
  name: string;
}

export interface DriverRoute {
  id: string;
  jefeName: string;
  driverName: string;
  route: string;
  plate: string;
}

