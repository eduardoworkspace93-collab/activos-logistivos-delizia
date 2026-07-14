export interface Location {
  id: string;
  name: string;
  type: 'procedencia' | 'destino';
}

export interface User {
  id: string;
  username: string;
  passwordHash: string; // Plaintext or simple representation for ease of administration in this local system
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
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  type: 'ingreso' | 'salida';
  itemId: string;
  quantity: number;
  entity: string; // Origen para ingresos, Destino para salidas
  responsible: string;
  details: string; // Motivo o detalles de observaciones
  user: string; // Username of registrant
  
  // Custom logistic fields added for high-impact Delizia operation
  truckPlate?: string; // Placa del camión
  truckDriver?: string; // Conductor
  truckRoute?: string; // Ruta
  clientName?: string; // Cliente que recibe
  crateStatus: 'Planta' | 'Planta_Disponibles' | 'Produccion' | 'Planta_Almacen' | 'Reparto' | 'Clientes' | 'Pendiente' | 'Dañado' | 'Reparación';
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
  entity: string; // Origen/Destino
  details: string; // Observaciones/Motivo
}

export interface AuditEntry {
  id: string;
  user: string;
  date: string;
  time: string;
  ip: string;
  action: string;
  beforeChange: string; // JSON or text
  afterChange: string;  // JSON or text
}

export interface AppConfig {
  companyName: string;
  logoUrl: string; // Base64 or local URL
  primaryColor: string;
  secondaryColor: string;
}

export interface DBBackup {
  name: string;
  date: string;
  size: number;
  content: string; // Base64 or JSON
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

export interface DatabaseSchema {
  users: User[];
  items: Item[];
  movements: Movement[];
  kardex: KardexEntry[];
  audit: AuditEntry[];
  config: AppConfig;
  locations: Location[];
  responsibles?: Responsible[];
  driversRoutes?: DriverRoute[];
}
