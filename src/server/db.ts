import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { DatabaseSchema, User, Item, Movement, KardexEntry, AuditEntry, AppConfig } from './types.js';

const DB_FILE_PATH = path.resolve(process.cwd(), 'db.json');
const BACKUPS_DIR = path.resolve(process.cwd(), 'backups');

let firestore: any = null;

// Read firebase configuration
let firebaseConfig: any = null;
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('Firebase Applet Config loaded. Project ID:', firebaseConfig.projectId);
  }
} catch (e) {
  console.error('Error reading firebase-applet-config.json:', e);
}

if (firebaseConfig && firebaseConfig.projectId) {
  try {
    const adminApp = initializeApp({
      projectId: firebaseConfig.projectId,
    });
    // Specify custom databaseId if configured
    const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
    firestore = getFirestore(adminApp, dbId);
    console.log(`Firebase Admin initialized successfully. Using Database: ${dbId}`);
  } catch (err) {
    console.error('Error initializing Firebase Admin:', err);
  }
} else {
  console.log('Firebase Applet Config not found or invalid. Firestore persistence disabled.');
}

// Default initial state
const defaultDb: DatabaseSchema = {
  users: [
    {
      id: 'u1',
      username: 'admin',
      passwordHash: 'admin123', // Plaintext for simplicity & ease of use/demonstration
      name: 'Eduardo Workspace (Admin)',
      role: 'Administrador',
      status: 'Activo',
      area: 'general'
    },
    {
      id: 'u2',
      username: 'supervisor',
      passwordHash: 'super123',
      name: 'Carlos Supervisor',
      role: 'Supervisor',
      status: 'Activo',
      area: 'general'
    },
    {
      id: 'u3',
      username: 'operador',
      passwordHash: 'op123',
      name: 'Operador Estándar (Activos)',
      role: 'Operador',
      status: 'Activo',
      area: 'activos'
    },
    {
      id: 'u4',
      username: 'opc',
      passwordHash: 'opc123',
      name: 'Operador Canastillos',
      role: 'OPC',
      status: 'Activo',
      area: 'activos'
    },
    {
      id: 'u5',
      username: 'opp',
      passwordHash: 'opp123',
      name: 'Operador de Producción',
      role: 'OPP',
      status: 'Activo',
      area: 'produccion'
    },
    {
      id: 'u6',
      username: 'opa',
      passwordHash: 'opa123',
      name: 'Operador de Almacén',
      role: 'OPA',
      status: 'Activo',
      area: 'almacen'
    }
  ],
  items: [
    {
      "id": "i1",
      "code": "9000",
      "name": "CANASTILLO",
      "description": "CANASTILLO PLASTICO DE DISTRIBUCION",
      "color": "#003366",
      "capacity": 24,
      "status": "Activo"
    },
    {
      "id": "i2",
      "code": "9006",
      "name": "REJILLA METALICA",
      "description": "REJILLA METALICA REFORZADA",
      "color": "#64748b",
      "capacity": 18,
      "status": "Activo"
    },
    {
      "id": "i3",
      "code": "9004",
      "name": "PALET DE MADERA",
      "description": "PALET DE MADERA RETORNABLE",
      "color": "#b45309",
      "capacity": 30,
      "status": "Activo"
    }
  ],
  movements: [
    {
      id: 'm1',
      movementNumber: 'MOV-0001',
      date: '2026-07-08',
      time: '08:30:00',
      type: 'ingreso',
      itemId: 'i1',
      quantity: 150,
      entity: 'Fábrica Central El Alto',
      responsible: 'Juan Pérez (Producción)',
      details: 'Lote inicial de producción diario de helados Delizia',
      user: 'admin',
      truckPlate: '4822-LKP',
      truckDriver: 'Roberto Choque',
      truckRoute: 'Ruta Sopocachi-Miraflores',
      crateStatus: 'Planta'
    },
    {
      id: 'm2',
      movementNumber: 'MOV-0002',
      date: '2026-07-08',
      time: '10:15:00',
      type: 'salida',
      itemId: 'i1',
      quantity: 50,
      entity: 'Distribuidor Zona Sur (Agencia Calacoto)',
      responsible: 'Marcos Vargas',
      details: 'Despacho de canastillos con helado de crema',
      user: 'supervisor',
      truckPlate: '9381-ZXC',
      truckDriver: 'Gualberto Quispe',
      truckRoute: 'Ruta Sur 1',
      crateStatus: 'Reparto'
    },
    {
      id: 'm3',
      movementNumber: 'MOV-0003',
      date: '2026-07-09',
      time: '14:20:00',
      type: 'ingreso',
      itemId: 'i2',
      quantity: 100,
      entity: 'Sucursal Cochabamba (Retorno)',
      responsible: 'Jaime Flores',
      details: 'Devolución de canastillos de despacho interdepartamental',
      user: 'operador',
      truckPlate: '3819-BHY',
      truckDriver: 'Hernán Silva',
      truckRoute: 'Ruta Interdepartamental La Paz-Cochabamba',
      crateStatus: 'Pendiente'
    },
    {
      id: 'm4',
      movementNumber: 'MOV-0004',
      date: '2026-07-09',
      time: '16:00:00',
      type: 'salida',
      itemId: 'i3',
      quantity: 20,
      entity: 'Merma - Canastillos Dañados',
      responsible: 'Ángela Choque (Calidad)',
      details: 'Canastillos rotos retirados de circulación para reparación',
      user: 'admin',
      truckPlate: '-',
      truckDriver: '-',
      truckRoute: '-',
      crateStatus: 'Dañado'
    }
  ],
  kardex: [
    {
      id: 'k1',
      date: '2026-07-08',
      time: '08:30:00',
      type: 'ingreso',
      code: '9000',
      item: 'CANASTILLO',
      quantity: 150,
      stockBefore: 0,
      stockAfter: 150,
      user: 'admin',
      entity: 'Fábrica Central El Alto',
      details: 'Lote inicial de producción diario de helados Delizia'
    },
    {
      id: 'k2',
      date: '2026-07-08',
      time: '10:15:00',
      type: 'salida',
      code: '9000',
      item: 'CANASTILLO',
      quantity: 50,
      stockBefore: 150,
      stockAfter: 100,
      user: 'supervisor',
      entity: 'Distribuidor Zona Sur (Agencia Calacoto)',
      details: 'Despacho de canastillos con helado de crema'
    },
    {
      id: 'k3',
      date: '2026-07-09',
      time: '14:20:00',
      type: 'ingreso',
      code: '9006',
      item: 'REJILLA METALICA',
      quantity: 100,
      stockBefore: 0,
      stockAfter: 100,
      user: 'operador',
      entity: 'Sucursal Cochabamba (Retorno)',
      details: 'Devolución de canastillos de despacho interdepartamental'
    },
    {
      id: 'k4',
      date: '2026-07-09',
      time: '16:00:00',
      type: 'salida',
      code: '9004',
      item: 'PALET DE MADERA',
      quantity: 20,
      stockBefore: 0,
      stockAfter: -20, // (This handles initial negatives if starting from scratch, but we prevent it going forward based on available stock)
      user: 'admin',
      entity: 'Merma - Canastillos Dañados',
      details: 'Canastillos rotos retirados de circulación para reparación'
    }
  ],
  audit: [
    {
      id: 'a1',
      user: 'admin',
      date: '2026-07-08',
      time: '08:30:15',
      ip: '192.168.1.50',
      action: 'CREACIÓN DE MOVIMIENTO (INGRESO)',
      beforeChange: '{}',
      afterChange: '{"movementNumber":"MOV-0001","itemId":"i1","quantity":150,"entity":"Fábrica Central El Alto"}'
    },
    {
      id: 'a2',
      user: 'supervisor',
      date: '2026-07-08',
      time: '10:16:02',
      ip: '192.168.1.102',
      action: 'CREACIÓN DE MOVIMIENTO (SALIDA)',
      beforeChange: '{}',
      afterChange: '{"movementNumber":"MOV-0002","itemId":"i1","quantity":50,"entity":"Distribuidor Zona Sur"}'
    }
  ],
  config: {
    companyName: 'DELIZIA - COMPAÑÍA DE ALIMENTOS LTDA.',
    logoUrl: 'https://www.delizia.com.bo/wp-content/uploads/2019/12/logo-delizia.png',
    primaryColor: '#0b4a9b', // Corporate blue
    secondaryColor: '#f15a24' // Corporate orange
  },
  locations: [
    { id: 'l1', name: 'Planta Central El Alto', type: 'procedencia' },
    { id: 'l2', name: 'Fábrica Central El Alto', type: 'procedencia' },
    { id: 'l3', name: 'Planta de Producción Achachicala', type: 'procedencia' },
    { id: 'l4', name: 'Distribuidor Zona Sur (Agencia Calacoto)', type: 'destino' },
    { id: 'l5', name: 'Distribuidor Zona Norte', type: 'destino' },
    { id: 'l6', name: 'Agencia Central Sopocachi', type: 'destino' },
    { id: 'l7', name: 'Cliente Particular', type: 'destino' },
    { id: 'l8', name: 'DESAYUNOS VIACHA', type: 'destino' }
  ],
  responsibles: [
    { id: 'r1', name: 'JUAN PÉREZ' },
    { id: 'r2', name: 'MARCOS VARGAS' },
    { id: 'r3', name: 'JAIME FLORES' },
    { id: 'r4', name: 'ÁNGELA CHOQUE' }
  ],
  driversRoutes: [
    { id: 'dr1', jefeName: 'DESAYUNOS VIACHA', driverName: 'HUGO APALA', route: 'VIACHA CENTRO', plate: '4820-KDL' },
    { id: 'dr2', jefeName: 'DESAYUNOS VIACHA', driverName: 'EDDY CALLE', route: 'VIACHA PERIFÉRICA', plate: '2938-ZMX' },
    { id: 'dr3', jefeName: 'DESAYUNOS VIACHA', driverName: 'WILMER CONDORI', route: 'VIACHA CARRETERA', plate: '9301-BHP' }
  ],
  operationalAreas: [
    { id: 'Planta_Disponibles', name: 'ACTIVOS LOGÍSTICOS (Vacíos/Lavado)', color: '#0b4a9b' },
    { id: 'Produccion', name: 'PRODUCCIÓN (Llenado/Envasado)', color: '#f15a24' },
    { id: 'Planta_Almacen', name: 'ALMACÉN DE PRODUCTO TERMINADO (Cámaras)', color: '#10b981' },
    { id: 'Reparto', name: 'En Reparto (Distribución)', color: '#6366f1' },
    { id: 'Clientes', name: 'En Clientes (Mercado)', color: '#f43f5e' },
    { id: 'Pendiente', name: 'Pendiente Retorno (Choferes)', color: '#8b5cf6' },
    { id: 'Dañado', name: 'Dañado (Merma)', color: '#ef4444' },
    { id: 'Reparación', name: 'En Reparación', color: '#6b7280' }
  ]
};

// If backups dir doesn't exist, create it
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

export class LocalDatabase {
  private db: DatabaseSchema;

  constructor() {
    this.db = defaultDb;
    this.load();
  }

  async initFirestore() {
    if (!firestore) {
      console.log('Firestore is not configured. Running with local database file only.');
      return;
    }

    console.log('Synchronizing with Firestore database...');
    try {
      const collections = ['users', 'items', 'movements', 'kardex', 'audit', 'config', 'locations', 'responsibles', 'driversRoutes', 'operationalAreas'];
      
      // Fetch all collections in parallel from Firestore, catching errors individually to prevent unhandled promise rejections
      const snapshots = await Promise.all(
        collections.map(async (col) => {
          try {
            const snap = await firestore.collection('app_data').doc(col).get();
            return { colName: col, exists: snap.exists, data: () => snap.data() };
          } catch (e: any) {
            console.error(`Error loading collection ${col} from Firestore:`, e.message || e);
            return { colName: col, exists: false, data: () => undefined };
          }
        })
      );

      let foundAny = false;
      const loadedData: any = {};

      snapshots.forEach((snap) => {
        const colName = snap.colName;
        if (snap.exists) {
          const docData = snap.data();
          if (docData && docData.data !== undefined) {
            loadedData[colName] = docData.data;
            foundAny = true;
          }
        }
      });

      if (foundAny) {
        console.log('Found remote state in Firestore. Loading remote data.');
        // Update local memory
        this.db = {
          ...defaultDb,
          ...loadedData
        };
        this.ensureDefaultOperationalAreas();
        // Save locally to keep in sync
        try {
          fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.db, null, 2), 'utf8');
          console.log('Updated local db.json with Firestore state.');
        } catch (e) {
          console.error('Error writing local database file during sync:', e);
        }
      } else {
        console.log('Firestore is empty. Initializing Firestore with current data...');
        // Write current db (which is defaultDb or loaded from db.json) to Firestore, catching errors individually
        await Promise.all(
          collections.map(async (col) => {
            try {
              await firestore.collection('app_data').doc(col).set({
                data: (this.db as any)[col] || []
              });
            } catch (e: any) {
              console.error(`Error initializing collection ${col} in Firestore:`, e.message || e);
            }
          })
        );
        console.log('Firestore initialized with current database state.');
      }
    } catch (err) {
      console.error('Error during Firestore database sync:', err);
    }
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf8');
        this.db = JSON.parse(fileContent);
        if (!this.db.locations) {
          this.db.locations = [
            { id: 'l1', name: 'Planta Central El Alto', type: 'procedencia' },
            { id: 'l2', name: 'Fábrica Central El Alto', type: 'procedencia' },
            { id: 'l3', name: 'Planta de Producción Achachicala', type: 'procedencia' },
            { id: 'l4', name: 'Distribuidor Zona Sur (Agencia Calacoto)', type: 'destino' },
            { id: 'l5', name: 'Distribuidor Zona Norte', type: 'destino' },
            { id: 'l6', name: 'Agencia Central Sopocachi', type: 'destino' },
            { id: 'l7', name: 'Cliente Particular', type: 'destino' }
          ];
          this.save();
        }
        if (!this.db.responsibles) {
          this.db.responsibles = [
            { id: 'r1', name: 'JUAN PÉREZ' },
            { id: 'r2', name: 'MARCOS VARGAS' },
            { id: 'r3', name: 'JAIME FLORES' },
            { id: 'r4', name: 'ÁNGELA CHOQUE' }
          ];
          this.save();
        }
        if (!this.db.driversRoutes) {
          this.db.driversRoutes = [
            { id: 'dr1', jefeName: 'DESAYUNOS VIACHA', driverName: 'HUGO APALA', route: 'VIACHA CENTRO', plate: '4820-KDL' },
            { id: 'dr2', jefeName: 'DESAYUNOS VIACHA', driverName: 'EDDY CALLE', route: 'VIACHA PERIFÉRICA', plate: '2938-ZMX' },
            { id: 'dr3', jefeName: 'DESAYUNOS VIACHA', driverName: 'WILMER CONDORI', route: 'VIACHA CARRETERA', plate: '9301-BHP' }
          ];
          this.save();
        }
        if (!this.db.operationalAreas) {
          this.db.operationalAreas = [
            { id: 'Planta_Disponibles', name: 'ACTIVOS LOGÍSTICOS (Vacíos/Lavado)', color: '#0b4a9b' },
            { id: 'Produccion', name: 'PRODUCCIÓN (Llenado/Envasado)', color: '#f15a24' },
            { id: 'Planta_Almacen', name: 'ALMACÉN DE PRODUCTO TERMINADO (Cámaras)', color: '#10b981' },
            { id: 'Reparto', name: 'En Reparto (Distribución)', color: '#6366f1' },
            { id: 'Clientes', name: 'En Clientes (Mercado)', color: '#f43f5e' },
            { id: 'Pendiente', name: 'Pendiente Retorno (Choferes)', color: '#8b5cf6' },
            { id: 'Dañado', name: 'Dañado (Merma)', color: '#ef4444' },
            { id: 'Reparación', name: 'En Reparación', color: '#6b7280' }
          ];
          this.save();
        }

        // Auto-seed missing restricted operator users
        const seedUsers = [
          {
            id: 'u4',
            username: 'opc',
            passwordHash: 'opc123',
            name: 'Operador Canastillos',
            role: 'OPC' as const,
            status: 'Activo' as const,
            area: 'activos' as const
          },
          {
            id: 'u5',
            username: 'opp',
            passwordHash: 'opp123',
            name: 'Operador de Producción',
            role: 'OPP' as const,
            status: 'Activo' as const,
            area: 'produccion' as const
          },
          {
            id: 'u6',
            username: 'opa',
            passwordHash: 'opa123',
            name: 'Operador de Almacén',
            role: 'OPA' as const,
            status: 'Activo' as const,
            area: 'almacen' as const
          }
        ];
        let usersUpdated = false;
        seedUsers.forEach(su => {
          if (!this.db.users.some(u => u.username === su.username)) {
            this.db.users.push(su);
            usersUpdated = true;
          }
        });
        if (usersUpdated) {
          this.save();
        }
        this.ensureDefaultOperationalAreas();
        console.log('Database loaded successfully from', DB_FILE_PATH);
      } else {
        this.db = defaultDb;
        this.ensureDefaultOperationalAreas();
        this.save();
        console.log('Database file not found, initialized with default values.');
      }
    } catch (e) {
      console.error('Error loading database, using default values', e);
      this.db = defaultDb;
      this.ensureDefaultOperationalAreas();
    }
  }

  private ensureDefaultOperationalAreas() {
    if (!this.db.operationalAreas) {
      this.db.operationalAreas = [];
    }
    
    const defaults = [
      { id: 'Planta_Disponibles', name: 'ACTIVOS LOGÍSTICOS', color: '#0b4a9b' },
      { id: 'Produccion', name: 'PRODUCCIÓN', color: '#f15a24' },
      { id: 'Planta_Almacen', name: 'ALMACÉN DE PRODUCTO TERMINADO', color: '#10b981' },
      { id: 'Reparto', name: 'En Reparto (Distribución)', color: '#6366f1' },
      { id: 'Clientes', name: 'En Clientes (Mercado)', color: '#f43f5e' },
      { id: 'Pendiente', name: 'Pendiente Retorno (Choferes)', color: '#8b5cf6' },
      { id: 'Dañado', name: 'Dañado (Merma)', color: '#ef4444' },
      { id: 'Reparación', name: 'En Reparación', color: '#6b7280' }
    ];

    let changed = false;
    defaults.forEach(def => {
      const existingById = this.db.operationalAreas.find((a: any) => a.id === def.id);
      if (!existingById) {
        // Double check: if there is an area with the exact same name but a different (random) ID, migrate its ID to the standard ID
        const existingByName = this.db.operationalAreas.find((a: any) => 
          a.name.trim().toUpperCase() === def.name.toUpperCase() || 
          (a.name.trim().toUpperCase() === 'PLANTA_DISPONIBLES' && def.id === 'Planta_Disponibles')
        );
        if (existingByName) {
          existingByName.id = def.id;
          existingByName.name = def.name;
          existingByName.color = def.color;
        } else {
          this.db.operationalAreas.push(def);
        }
        changed = true;
      } else {
        if (existingById.name !== def.name) {
          existingById.name = def.name;
          changed = true;
        }
      }
    });

    // Also, remove duplicates
    const uniqueAreas: any[] = [];
    const seenNames = new Set<string>();
    const seenIds = new Set<string>();

    this.db.operationalAreas.forEach((area: any) => {
      const normalizedName = area.name.trim().toUpperCase();
      if (!seenIds.has(area.id)) {
        const isStandard = defaults.some(d => d.id === area.id);
        if (isStandard) {
          uniqueAreas.push(area);
          seenNames.add(normalizedName);
          seenIds.add(area.id);
        } else if (!seenNames.has(normalizedName)) {
          uniqueAreas.push(area);
          seenNames.add(normalizedName);
          seenIds.add(area.id);
        } else {
          changed = true;
        }
      } else {
        changed = true;
      }
    });

    if (changed) {
      this.db.operationalAreas = uniqueAreas;
      this.save();
    }

    this.migrateLegacyMovements();
  }

  private migrateLegacyMovements() {
    let changed = false;
    if (this.db.movements && Array.isArray(this.db.movements)) {
      this.db.movements.forEach(m => {
        const entityName = (m.entity || '').trim().toUpperCase();
        
        // Let's check if it matches PRODUCCION
        if (entityName.includes('PRODUCCION') || entityName.includes('PRODUCCIÓN')) {
          if (m.crateStatus !== 'Produccion') {
            m.crateStatus = 'Produccion' as any;
            changed = true;
          }
          if (!m.fromStatus) {
            m.fromStatus = 'Planta_Disponibles';
            changed = true;
          }
        }
        
        // Let's check if it matches ALMACEN DE PRODUCTO TERMINADO
        if (entityName.includes('ALMACEN') || entityName.includes('ALMACÉN') || entityName.includes('TERMINADO')) {
          if (m.crateStatus !== 'Planta_Almacen') {
            m.crateStatus = 'Planta_Almacen' as any;
            changed = true;
          }
          if (!m.fromStatus) {
            // If registered by OPP, it likely came from Produccion
            if (m.user === 'opp') {
              m.fromStatus = 'Produccion';
            } else {
              m.fromStatus = 'Planta_Disponibles';
            }
            changed = true;
          }
        }
      });
    }

    if (this.db.kardex && Array.isArray(this.db.kardex)) {
      this.db.kardex.forEach(k => {
        const entityName = (k.entity || '').trim().toUpperCase();
        if (entityName.includes('PRODUCCION') || entityName.includes('PRODUCCIÓN')) {
          if (k.crateStatus !== 'Produccion') {
            k.crateStatus = 'Produccion';
            changed = true;
          }
          if (!k.fromStatus) {
            k.fromStatus = 'Planta_Disponibles';
            changed = true;
          }
        }
        if (entityName.includes('ALMACEN') || entityName.includes('ALMACÉN') || entityName.includes('TERMINADO')) {
          if (k.crateStatus !== 'Planta_Almacen') {
            k.crateStatus = 'Planta_Almacen';
            changed = true;
          }
          if (!k.fromStatus) {
            if (k.user === 'opp') {
              k.fromStatus = 'Produccion';
            } else {
              k.fromStatus = 'Planta_Disponibles';
            }
            changed = true;
          }
        }
      });
    }

    if (changed) {
      this.save();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.db, null, 2), 'utf8');
      
      // Background Firestore Save
      this.syncToFirestore().catch(err => {
        console.error('Background Firestore sync failed:', err);
      });
    } catch (e) {
      console.error('Error writing database file', e);
    }
  }

  private async syncToFirestore() {
    if (!firestore) return;
    try {
      const collections = ['users', 'items', 'movements', 'kardex', 'audit', 'config', 'locations', 'responsibles', 'driversRoutes', 'operationalAreas'];
      await Promise.all(
        collections.map(async (col) => {
          try {
            await firestore.collection('app_data').doc(col).set({
              data: (this.db as any)[col] || []
            });
          } catch (e: any) {
            console.error(`Error background syncing collection ${col} to Firestore:`, e.message || e);
          }
        })
      );
      console.log('Background Firestore synchronization complete.');
    } catch (err) {
      console.error('Background Firestore sync error:', err);
    }
  }

  // Getters for frontend consumption
  getUsers(): User[] {
    return this.db.users;
  }

  getItems(): Item[] {
    return this.db.items;
  }

  getMovements(): Movement[] {
    return this.db.movements;
  }

  getKardex(): KardexEntry[] {
    return this.db.kardex;
  }

  getAudit(): AuditEntry[] {
    return this.db.audit;
  }

  getConfig(): AppConfig {
    return this.db.config;
  }

  // Stock Calculation Helper
  getStockData(): any[] {
    return this.db.items.map(item => {
      // Filter movements for this item
      const itemMovements = this.db.movements.filter(m => m.itemId === item.id);
      
      const totalIngresos = itemMovements
        .filter(m => m.type === 'ingreso')
        .reduce((sum, m) => sum + m.quantity, 0);

      const isInternalStatus = (status: string) => {
        return ['Planta', 'Planta_Disponibles', 'Produccion', 'Planta_Almacen', 'Dañado', 'Reparación'].includes(status);
      };

      const totalSalidas = itemMovements
        .filter(m => m.type === 'salida' && !isInternalStatus(m.crateStatus || 'Planta_Disponibles'))
        .reduce((sum, m) => sum + m.quantity, 0);

      const stockActual = totalIngresos - totalSalidas;

      // Realistic flow calculation of breakdown
      let plantaDisponibles = 0;
      let produccion = 0;
      let plantaAlmacen = 0;
      let reparto = 0;
      let clientes = 0;
      let pendientes = 0;
      let danado = 0;
      let reparacion = 0;

      const customAreaStocks: Record<string, number> = {};

      const isInternalEntity = (entityName: string) => {
        const name = (entityName || '').trim().toUpperCase();
        if (!name || name === '-' || name === 'S/N') return true;
        if (
          name.includes('PLANTA') || 
          name.includes('PRODUCCION') || 
          name.includes('PRODUCCIÓN') || 
          name.includes('ALMACEN') || 
          name.includes('ALMACÉN') || 
          name.includes('ACTIVOS LOGISTICOS') || 
          name.includes('ACTIVOS LOGÍSTICOS') || 
          name.includes('LOGISTICOS') || 
          name.includes('LOGÍSTICOS')
        ) {
          return true;
        }
        return false;
      };

      itemMovements.forEach(m => {
        const qty = Number(m.quantity) || 0;
        const status = m.crateStatus || 'Planta_Disponibles';
        const fromStatus = (m as any).fromStatus;

        const alterCustomStock = (statusId: string, amount: number) => {
          if (statusId) {
            customAreaStocks[statusId] = (customAreaStocks[statusId] || 0) + amount;
          }
        };

        if (fromStatus) {
          // Decrement fromStatus
          if (fromStatus === 'Planta' || fromStatus === 'Planta_Disponibles') {
            plantaDisponibles -= qty;
          } else if (fromStatus === 'Produccion') {
            produccion -= qty;
          } else if (fromStatus === 'Planta_Almacen') {
            plantaAlmacen -= qty;
          } else if (fromStatus === 'Reparto') {
            reparto -= qty;
          } else if (fromStatus === 'Clientes') {
            clientes -= qty;
          } else if (fromStatus === 'Pendiente') {
            pendientes -= qty;
          } else if (fromStatus === 'Dañado') {
            danado -= qty;
          } else if (fromStatus === 'Reparación') {
            reparacion -= qty;
          } else {
            alterCustomStock(fromStatus, -qty);
          }

          // Increment status (toStatus)
          if (status === 'Planta' || status === 'Planta_Disponibles') {
            plantaDisponibles += qty;
          } else if (status === 'Produccion') {
            produccion += qty;
          } else if (status === 'Planta_Almacen') {
            plantaAlmacen += qty;
          } else if (status === 'Reparto') {
            reparto += qty;
          } else if (status === 'Clientes') {
            clientes += qty;
          } else if (status === 'Pendiente') {
            pendientes += qty;
          } else if (status === 'Dañado') {
            danado += qty;
          } else if (status === 'Reparación') {
            reparacion += qty;
          } else {
            alterCustomStock(status, qty);
          }
        } else {
          if (m.type === 'ingreso') {
            // It enters the target status
            if (status === 'Planta' || status === 'Planta_Disponibles') {
              plantaDisponibles += qty;
            } else if (status === 'Produccion') {
              produccion += qty;
            } else if (status === 'Planta_Almacen') {
              plantaAlmacen += qty;
            } else if (status === 'Reparto') {
              reparto += qty;
            } else if (status === 'Clientes') {
              clientes += qty;
            } else if (status === 'Pendiente') {
              pendientes += qty;
            } else if (status === 'Dañado') {
              danado += qty;
            } else if (status === 'Reparación') {
              reparacion += qty;
            } else {
              alterCustomStock(status, qty);
            }

            // If it is a return from outside, it must decrease the outside category (reparto or clientes)
            if (!isInternalEntity(m.entity) || (m.truckDriver && m.truckDriver.trim() !== '-')) {
              let amountToDecrease = qty;
              if (m.truckDriver && m.truckDriver.trim() !== '' && m.truckDriver.trim() !== '-') {
                // Return from a driver: prefer to decrease from reparto first, then clientes if needed
                if (reparto >= amountToDecrease) {
                  reparto -= amountToDecrease;
                } else {
                  amountToDecrease -= Math.max(0, reparto);
                  reparto = 0;
                  clientes -= amountToDecrease;
                }
              } else {
                // Return from a client direct: prefer to decrease from clientes first, then reparto if needed
                if (clientes >= amountToDecrease) {
                  clientes -= amountToDecrease;
                } else {
                  amountToDecrease -= Math.max(0, clientes);
                  clientes = 0;
                  reparto -= amountToDecrease;
                }
              }
            }
          } else if (m.type === 'salida') {
            // It leaves Planta_Disponibles (all departures originate from available stock in the plant)
            plantaDisponibles -= qty;

            // It enters the target status
            if (status === 'Planta' || status === 'Planta_Disponibles') {
              plantaDisponibles += qty; // If they say output to Planta_Disponibles, no net change
            } else if (status === 'Produccion') {
              produccion += qty;
            } else if (status === 'Planta_Almacen') {
              plantaAlmacen += qty;
            } else if (status === 'Reparto') {
              reparto += qty;
            } else if (status === 'Clientes') {
              clientes += qty;
            } else if (status === 'Pendiente') {
              pendientes += qty;
            } else if (status === 'Dañado') {
              danado += qty;
            } else if (status === 'Reparación') {
              reparacion += qty;
            } else {
              alterCustomStock(status, qty);
            }
          }
        }
      });

      const plantaTotal = plantaDisponibles + produccion + plantaAlmacen;

      return {
        id: item.id,
        code: item.code,
        name: item.name,
        color: item.color,
        capacity: item.capacity,
        totalIngresos,
        totalSalidas,
        stockActual,
        status: item.status,
        breakdown: {
          planta: Math.max(0, plantaTotal),
          plantaDisponibles: Math.max(0, plantaDisponibles),
          produccion: Math.max(0, produccion),
          plantaAlmacen: Math.max(0, plantaAlmacen),
          reparto: Math.max(0, reparto),
          clientes: Math.max(0, clientes),
          pendientes: Math.max(0, pendientes),
          danado: Math.max(0, danado),
          reparacion: Math.max(0, reparacion),
          ...customAreaStocks
        }
      };
    });
  }

  // Core Writes & Business Logic

  // 1. Audit logger
  logAudit(user: string, action: string, before: any, after: any, ip: string = '127.0.0.1') {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    const newAudit: AuditEntry = {
      id: `a_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      user,
      date: dateStr,
      time: timeStr,
      ip,
      action,
      beforeChange: JSON.stringify(before),
      afterChange: JSON.stringify(after)
    };

    this.db.audit.unshift(newAudit); // Newest first
    this.save();
  }

  // 2. User CRUD & Auth
  authenticate(username: string, passwordHash: string): User | null {
    const user = this.db.users.find(u => u.username === username && u.passwordHash === passwordHash);
    if (user && user.status === 'Activo') {
      return user;
    }
    return null;
  }

  changePassword(userId: string, newPasswordHash: string, operatorUsername: string, ip: string): boolean {
    const userIndex = this.db.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      const original = { ...this.db.users[userIndex] };
      this.db.users[userIndex].passwordHash = newPasswordHash;
      this.save();

      this.logAudit(
        operatorUsername,
        'CAMBIO DE CONTRASEÑA',
        { id: original.id, username: original.username },
        { id: original.id, username: original.username, action: 'Contraseña actualizada' },
        ip
      );
      return true;
    }
    return false;
  }

  saveUser(user: Partial<User> & { id?: string }, operatorUsername: string, ip: string): User {
    const isOperatorRole = ['Operador', 'OPC', 'OPP', 'OPA'].includes(user.role || '');
    if (isOperatorRole && (!user.area || user.area === 'general')) {
      throw new Error('Los operadores no pueden tener asignada el área "Planta El Alto". Debe asignarle una de las tres áreas de operación específicas.');
    }

    if (user.id) {
      const idx = this.db.users.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        const original = { ...this.db.users[idx] };
        this.db.users[idx] = { ...this.db.users[idx], ...user } as User;
        this.save();
        this.logAudit(operatorUsername, 'MODIFICACIÓN DE USUARIO', original, this.db.users[idx], ip);
        return this.db.users[idx];
      }
      throw new Error('User not found');
    } else {
      // Create user
      const exists = this.db.users.find(u => u.username === user.username);
      if (exists) throw new Error('Nombre de usuario ya está registrado');

      const newUser: User = {
        id: `u_${Date.now()}`,
        username: user.username || '',
        passwordHash: user.passwordHash || '123456',
        name: user.name || '',
        role: user.role || 'Operador',
        status: user.status || 'Activo',
        area: user.area || 'general'
      };

      this.db.users.push(newUser);
      this.save();
      this.logAudit(operatorUsername, 'CREACIÓN DE USUARIO', {}, newUser, ip);
      return newUser;
    }
  }

  // 3. Items CRUD
  saveItem(itemData: Partial<Item> & { id?: string }, operatorUsername: string, ip: string): Item {
    // Check code duplication
    const duplicate = this.db.items.find(
      i => i.code.toLowerCase() === itemData.code?.toLowerCase() && i.id !== itemData.id
    );
    if (duplicate) {
      throw new Error(`El código "${itemData.code}" ya está en uso por otro canastillo.`);
    }

    if (itemData.id) {
      const idx = this.db.items.findIndex(i => i.id === itemData.id);
      if (idx !== -1) {
        const original = { ...this.db.items[idx] };
        this.db.items[idx] = { ...this.db.items[idx], ...itemData } as Item;
        this.save();
        this.logAudit(operatorUsername, 'MODIFICACIÓN DE ITEM', original, this.db.items[idx], ip);
        return this.db.items[idx];
      }
      throw new Error('Item not found');
    } else {
      const newItem: Item = {
        id: `i_${Date.now()}`,
        code: itemData.code || '',
        name: itemData.name || '',
        description: itemData.description || '',
        color: itemData.color || '#3b82f6',
        capacity: Number(itemData.capacity) || 20,
        status: itemData.status || 'Activo'
      };

      this.db.items.push(newItem);
      this.save();
      this.logAudit(operatorUsername, 'CREACIÓN DE ITEM', {}, newItem, ip);
      return newItem;
    }
  }

  removeItem(itemId: string, operatorUsername: string, ip: string): boolean {
    const item = this.db.items.find(i => i.id === itemId);
    if (!item) return false;

    // Check if it has movements
    const linkedMovements = this.db.movements.some(m => m.itemId === itemId);
    if (linkedMovements) {
      // Instead of deleting, deactivate it to preserve references
      const original = { ...item };
      item.status = 'Inactivo';
      this.save();
      this.logAudit(operatorUsername, 'DESACTIVACIÓN DE ITEM POR REFERENCIA DE INVENTARIO', original, item, ip);
      throw new Error('El item tiene movimientos registrados. Se desactivó automáticamente para preservar el historial.');
    }

    const idx = this.db.items.findIndex(i => i.id === itemId);
    this.db.items.splice(idx, 1);
    this.save();
    this.logAudit(operatorUsername, 'ELIMINACIÓN DE ITEM', item, {}, ip);
    return true;
  }

  // Locations management
  getLocations(): any[] {
    if (!this.db.locations) {
      this.db.locations = [];
    }

    // Auto-sync any jefeName from driversRoutes to locations as type 'destino'
    const driversRoutes = this.db.driversRoutes || [];
    let modified = false;
    driversRoutes.forEach(dr => {
      if (dr.jefeName && dr.jefeName.trim()) {
        const nameUpper = dr.jefeName.trim().toUpperCase();
        const exists = this.db.locations.some(
          l => l.type === 'destino' && l.name.toUpperCase() === nameUpper
        );
        if (!exists) {
          this.db.locations.push({
            id: `l_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: nameUpper,
            type: 'destino'
          });
          modified = true;
        }
      }
    });
    if (modified) {
      this.save();
    }

    return this.db.locations;
  }

  saveLocation(locationData: any, operatorUsername: string, ip: string): any {
    if (!this.db.locations) {
      this.db.locations = [];
    }

    const trimmedName = (locationData.name || '').trim().toUpperCase();
    if (!trimmedName) {
      throw new Error('El nombre de la procedencia/destino no puede estar vacío.');
    }

    const type = locationData.type || 'procedencia';

    // Check duplicate
    const duplicate = this.db.locations.find(
      l => l.name.toUpperCase() === trimmedName && l.type === type && l.id !== locationData.id
    );
    if (duplicate) {
      throw new Error(`La ubicación "${trimmedName}" ya está registrada como ${type}.`);
    }

    if (locationData.id) {
      const idx = this.db.locations.findIndex(l => l.id === locationData.id);
      if (idx !== -1) {
        const original = { ...this.db.locations[idx] };
        this.db.locations[idx] = { ...this.db.locations[idx], name: trimmedName, type };
        this.save();
        this.logAudit(operatorUsername, 'MODIFICACIÓN DE UBICACIÓN', original, this.db.locations[idx], ip);
        return this.db.locations[idx];
      }
      throw new Error('Procedencia/Destino no encontrado');
    } else {
      const newLoc = {
        id: `l_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: trimmedName,
        type
      };

      this.db.locations.push(newLoc);
      this.save();
      this.logAudit(operatorUsername, 'CREACIÓN DE UBICACIÓN', {}, newLoc, ip);
      return newLoc;
    }
  }

  removeLocation(id: string, operatorUsername: string, ip: string): boolean {
    if (!this.db.locations) return false;
    const idx = this.db.locations.findIndex(l => l.id === id);
    if (idx === -1) return false;

    const location = this.db.locations[idx];
    const deletedNameUpper = (location.name || '').trim().toUpperCase();

    this.db.locations.splice(idx, 1);

    // Also clear the jefeName for any driver associated with this deleted destino
    if (location.type === 'destino' && this.db.driversRoutes) {
      this.db.driversRoutes.forEach(dr => {
        if (dr.jefeName && dr.jefeName.trim().toUpperCase() === deletedNameUpper) {
          dr.jefeName = '';
        }
      });
    }

    this.save();
    this.logAudit(operatorUsername, 'ELIMINACIÓN DE UBICACIÓN', location, {}, ip);
    return true;
  }

  // Responsibles management
  getResponsibles(): any[] {
    if (!this.db.responsibles) {
      this.db.responsibles = [];
    }
    return this.db.responsibles;
  }

  saveResponsible(responsibleData: any, operatorUsername: string, ip: string): any {
    if (!this.db.responsibles) {
      this.db.responsibles = [];
    }

    const trimmedName = (responsibleData.name || '').trim().toUpperCase();
    if (!trimmedName) {
      throw new Error('El nombre del responsable no puede estar vacío.');
    }

    // Check duplicate
    const duplicate = this.db.responsibles.find(
      r => r.name.toUpperCase() === trimmedName && r.id !== responsibleData.id
    );
    if (duplicate) {
      throw new Error(`El responsable "${trimmedName}" ya está registrado.`);
    }

    if (responsibleData.id) {
      const idx = this.db.responsibles.findIndex(r => r.id === responsibleData.id);
      if (idx !== -1) {
        const original = { ...this.db.responsibles[idx] };
        this.db.responsibles[idx] = { ...this.db.responsibles[idx], name: trimmedName };
        this.save();
        this.logAudit(operatorUsername, 'MODIFICACIÓN DE RESPONSABLE', original, this.db.responsibles[idx], ip);
        return this.db.responsibles[idx];
      }
      throw new Error('Responsable no encontrado');
    } else {
      const newResp = {
        id: `r_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: trimmedName
      };

      this.db.responsibles.push(newResp);
      this.save();
      this.logAudit(operatorUsername, 'CREACIÓN DE RESPONSABLE', {}, newResp, ip);
      return newResp;
    }
  }

  removeResponsible(id: string, operatorUsername: string, ip: string): boolean {
    if (!this.db.responsibles) return false;
    const idx = this.db.responsibles.findIndex(r => r.id === id);
    if (idx === -1) return false;

    const responsible = this.db.responsibles[idx];
    this.db.responsibles.splice(idx, 1);
    this.save();
    this.logAudit(operatorUsername, 'ELIMINACIÓN DE RESPONSABLE', responsible, {}, ip);
    return true;
  }

  // Drivers and Routes management
  getDriversRoutes(): any[] {
    if (!this.db.driversRoutes) {
      this.db.driversRoutes = [];
    }
    return this.db.driversRoutes;
  }

  saveDriverRoute(drData: any, operatorUsername: string, ip: string): any {
    if (!this.db.driversRoutes) {
      this.db.driversRoutes = [];
    }

    const jefeName = (drData.jefeName || '').trim().toUpperCase();
    const driverName = (drData.driverName || '').trim().toUpperCase();
    const route = (drData.route || '').trim().toUpperCase();
    const plate = (drData.plate || '').trim().toUpperCase();

    if (!jefeName || !driverName) {
      throw new Error('El jefe (distribuidor) y el nombre del conductor son obligatorios.');
    }

    if (drData.id) {
      const idx = this.db.driversRoutes.findIndex(dr => dr.id === drData.id);
      if (idx !== -1) {
        const original = { ...this.db.driversRoutes[idx] };
        this.db.driversRoutes[idx] = { ...this.db.driversRoutes[idx], jefeName, driverName, route, plate };
        this.save();
        this.logAudit(operatorUsername, 'MODIFICACIÓN DE CONDUCTOR/RUTA', original, this.db.driversRoutes[idx], ip);
        return this.db.driversRoutes[idx];
      }
      throw new Error('Conductor/Ruta no encontrado');
    } else {
      const newDR = {
        id: `dr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        jefeName,
        driverName,
        route,
        plate
      };
      this.db.driversRoutes.push(newDR);
      this.save();
      this.logAudit(operatorUsername, 'CREACIÓN DE CONDUCTOR/RUTA', {}, newDR, ip);
      return newDR;
    }
  }

  removeDriverRoute(id: string, operatorUsername: string, ip: string): boolean {
    if (!this.db.driversRoutes) return false;
    const idx = this.db.driversRoutes.findIndex(dr => dr.id === id);
    if (idx === -1) return false;

    const dr = this.db.driversRoutes[idx];
    this.db.driversRoutes.splice(idx, 1);
    this.save();
    this.logAudit(operatorUsername, 'ELIMINACIÓN DE CONDUCTOR/RUTA', dr, {}, ip);
    return true;
  }

  getOperationalAreas(): any[] {
    return this.db.operationalAreas || [];
  }

  saveOperationalArea(areaData: any, operatorUsername: string, ip: string): any {
    if (!this.db.operationalAreas) {
      this.db.operationalAreas = [];
    }

    const id = (areaData.id || '').trim();
    const name = (areaData.name || '').trim();
    const color = (areaData.color || '#6b7280').trim();

    if (!name) {
      throw new Error('El nombre del área es obligatorio.');
    }

    // Check if modifying or creating
    const existingIdx = this.db.operationalAreas.findIndex(a => a.id === id);
    if (existingIdx !== -1) {
      // Modify existing area
      const original = { ...this.db.operationalAreas[existingIdx] };
      this.db.operationalAreas[existingIdx] = { ...this.db.operationalAreas[existingIdx], name, color };
      this.save();
      this.logAudit(operatorUsername, 'MODIFICACIÓN DE ÁREA DE OPERACIÓN', original, this.db.operationalAreas[existingIdx], ip);
      return this.db.operationalAreas[existingIdx];
    } else {
      // Create new area
      const finalId = id || `status_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      // Check duplicate ID
      if (this.db.operationalAreas.some(a => a.id === finalId)) {
        throw new Error('Ya existe un área con ese identificador.');
      }
      const newArea = { id: finalId, name, color };
      this.db.operationalAreas.push(newArea);
      this.save();
      this.logAudit(operatorUsername, 'CREACIÓN DE ÁREA DE OPERACIÓN', {}, newArea, ip);
      return newArea;
    }
  }

  removeOperationalArea(id: string, operatorUsername: string, ip: string): boolean {
    if (!this.db.operationalAreas) return false;
    const idx = this.db.operationalAreas.findIndex(a => a.id === id);
    if (idx === -1) return false;

    const area = this.db.operationalAreas[idx];
    this.db.operationalAreas.splice(idx, 1);
    this.save();
    this.logAudit(operatorUsername, 'ELIMINACIÓN DE ÁREA DE OPERACIÓN', area, {}, ip);
    return true;
  }

  // 4. Movements Registration (Ingresos / Salidas)
  registerMovement(moveData: Omit<Movement, 'id' | 'movementNumber' | 'date' | 'time'>, operatorUsername: string, ip: string): Movement {
    let documentNumber = (moveData.documentNumber || moveData.orderNumber || '').trim();
    if (!documentNumber) {
      // Auto-generate a unique document number if not provided
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const rand = Math.floor(100 + Math.random() * 900); // 3 digit random
      documentNumber = `SD-${dateStr}-${rand}`;
    }

    // Check duplicate document numbers
    const duplicate = this.db.movements.find(
      m => {
        const dNum = m.documentNumber || m.orderNumber || '';
        return dNum.trim().toLowerCase() === documentNumber.toLowerCase();
      }
    );
    if (duplicate) {
      throw new Error(`El número de documento "${documentNumber}" ya ha sido registrado (Movimiento ${duplicate.movementNumber}). No se permiten números de documento duplicados.`);
    }

    const item = this.db.items.find(i => i.id === moveData.itemId);
    if (!item) throw new Error('El canastillo especificado no existe.');
    if (item.status === 'Inactivo') throw new Error('El canastillo está inactivo y no puede registrar nuevos movimientos.');

    const quantity = Number(moveData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      throw new Error('La cantidad debe ser un número positivo mayor que cero.');
    }

    // Calculate current stock to check constraints on outlets
    const stockStats = this.getStockData().find(s => s.id === moveData.itemId);
    const currentStock = stockStats ? stockStats.stockActual : 0;

    if (moveData.fromStatus) {
      const fromStatusKey = moveData.fromStatus === 'Planta' ? 'plantaDisponibles' : 
                          moveData.fromStatus === 'Planta_Disponibles' ? 'plantaDisponibles' : 
                          moveData.fromStatus === 'Produccion' ? 'produccion' : 
                          moveData.fromStatus === 'Planta_Almacen' ? 'plantaAlmacen' : 
                          moveData.fromStatus === 'Reparto' ? 'reparto' : 
                          moveData.fromStatus === 'Clientes' ? 'clientes' : 
                          moveData.fromStatus === 'Pendiente' ? 'pendientes' : 
                          moveData.fromStatus === 'Dañado' ? 'danado' : 'reparacion';
      const availableInFromStatus = stockStats ? (stockStats.breakdown[fromStatusKey] || 0) : 0;
      if (availableInFromStatus < quantity) {
        throw new Error(`Stock insuficiente en el área de origen. Intentas traspasar ${quantity} canastillos, pero solo hay ${availableInFromStatus} disponibles en esa área.`);
      }
    } else if (moveData.type === 'salida' && currentStock < quantity) {
      throw new Error(`Stock insuficiente. Intentas registrar una salida de ${quantity} canastillos, pero solo hay ${currentStock} disponibles.`);
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    // Generate consecutive movement number
    const serial = this.db.movements.length + 1;
    const movementNumber = `MOV-${serial.toString().padStart(4, '0')}`;

    // Auto-save entity to locations if it doesn't exist
    if (moveData.entity && moveData.entity.trim()) {
      const entityName = moveData.entity.trim();
      const entityType = moveData.type === 'ingreso' ? 'procedencia' : 'destino';
      
      if (!this.db.locations) {
        this.db.locations = [];
      }
      
      const exists = this.db.locations.some(
        l => l.name.toUpperCase() === entityName.toUpperCase() && l.type === entityType
      );
      
      if (!exists) {
        try {
          this.saveLocation({ name: entityName, type: entityType }, operatorUsername, ip);
        } catch (e) {
          console.error('Error auto-saving location', e);
        }
      }
    }

    // Auto-save responsible to database if it doesn't exist
    if (moveData.responsible && moveData.responsible.trim()) {
      const respName = moveData.responsible.trim();
      
      if (!this.db.responsibles) {
        this.db.responsibles = [];
      }
      
      const exists = this.db.responsibles.some(
        r => r.name.toUpperCase() === respName.toUpperCase()
      );
      
      if (!exists) {
        try {
          this.saveResponsible({ name: respName }, operatorUsername, ip);
        } catch (e) {
          console.error('Error auto-saving responsible', e);
        }
      }
    }

    // Auto-save driver to driversRoutes if it doesn't exist
    if (moveData.truckDriver && moveData.truckDriver.trim() && moveData.truckDriver.trim() !== '-') {
      const drName = moveData.truckDriver.trim().toUpperCase();
      const entityName = (moveData.entity || '').trim().toUpperCase();
      
      if (!this.db.driversRoutes) {
        this.db.driversRoutes = [];
      }
      
      const exists = this.db.driversRoutes.some(
        dr => dr.driverName.toUpperCase() === drName && dr.jefeName.toUpperCase() === entityName
      );
      
      if (!exists && entityName) {
        try {
          this.saveDriverRoute({
            jefeName: entityName,
            driverName: drName,
            route: (moveData.truckRoute || '').trim().toUpperCase(),
            plate: (moveData.truckPlate || '').trim().toUpperCase()
          }, operatorUsername, ip);
        } catch (e) {
          console.error('Error auto-saving driver route', e);
        }
      }
    }

    const newMovement: Movement = {
      id: `m_${Date.now()}`,
      movementNumber,
      documentNumber,
      orderNumber: documentNumber,
      date: dateStr,
      time: timeStr,
      type: moveData.type,
      itemId: moveData.itemId,
      quantity,
      entity: moveData.entity || '',
      responsible: moveData.responsible || '',
      details: moveData.details || '',
      user: operatorUsername,
      truckPlate: moveData.truckPlate || '',
      truckDriver: moveData.truckDriver || '',
      truckRoute: moveData.truckRoute || '',
      clientName: moveData.clientName || '',
      crateStatus: moveData.crateStatus || 'Planta',
      fromStatus: moveData.fromStatus
    };

    // Calculate stock before and after for the Kardex entry
    const stockBefore = currentStock;
    const stockAfter = moveData.type === 'ingreso' ? stockBefore + quantity : stockBefore - quantity;

    // Create Kardex Entry
    const newKardex: KardexEntry = {
      id: `k_${Date.now()}`,
      documentNumber,
      orderNumber: documentNumber,
      date: dateStr,
      time: timeStr,
      type: moveData.type,
      code: item.code,
      item: item.name,
      quantity,
      stockBefore,
      stockAfter,
      user: operatorUsername,
      entity: moveData.entity || '',
      details: moveData.details || '',
      fromStatus: moveData.fromStatus,
      crateStatus: moveData.crateStatus
    };

    // Push and save
    this.db.movements.push(newMovement);
    this.db.kardex.push(newKardex);
    this.save();

    this.logAudit(operatorUsername, `CREACIÓN DE MOVIMIENTO (${moveData.type.toUpperCase()})`, {}, newMovement, ip);

    return newMovement;
  }

  registerMovementBatch(
    batchData: {
      documentNumber: string;
      type: 'ingreso' | 'salida';
      entity: string;
      responsible: string;
      details: string;
      truckPlate?: string;
      truckDriver?: string;
      truckRoute?: string;
      clientName?: string;
      items: Array<{
        itemId: string;
        quantity: number;
        crateStatus: string;
      }>;
    },
    operatorUsername: string,
    ip: string
  ): Movement[] {
    let documentNumber = (batchData.documentNumber || '').trim();
    if (!documentNumber) {
      // Auto-generate a unique document number if not provided
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const rand = Math.floor(100 + Math.random() * 900); // 3 digit random
      documentNumber = `SD-${dateStr}-${rand}`;
    }

    // Check duplicate document numbers
    const duplicate = this.db.movements.find(
      m => {
        const dNum = m.documentNumber || m.orderNumber || '';
        return dNum.trim().toLowerCase() === documentNumber.toLowerCase();
      }
    );
    if (duplicate) {
      throw new Error(`El número de documento "${documentNumber}" ya ha sido registrado (Movimiento ${duplicate.movementNumber}). No se permiten números de documento duplicados.`);
    }

    if (!batchData.items || batchData.items.length === 0) {
      throw new Error('Debe agregar al menos un canastillo al registro.');
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    const registeredMovements: Movement[] = [];

    // Auto-save entity to locations if it doesn't exist
    if (batchData.entity && batchData.entity.trim()) {
      const entityName = batchData.entity.trim();
      const entityType = batchData.type === 'ingreso' ? 'procedencia' : 'destino';
      
      if (!this.db.locations) {
        this.db.locations = [];
      }
      const exists = this.db.locations.some(
        l => l.name.toUpperCase() === entityName.toUpperCase() && l.type === entityType
      );
      if (!exists) {
        try {
          this.saveLocation({ name: entityName, type: entityType }, operatorUsername, ip);
        } catch (e) {
          console.error('Error auto-saving location', e);
        }
      }
    }

    // Auto-save responsible to database if it doesn't exist
    if (batchData.responsible && batchData.responsible.trim()) {
      const respName = batchData.responsible.trim();
      if (!this.db.responsibles) {
        this.db.responsibles = [];
      }
      const exists = this.db.responsibles.some(
        r => r.name.toUpperCase() === respName.toUpperCase()
      );
      if (!exists) {
        try {
          this.saveResponsible({ name: respName }, operatorUsername, ip);
        } catch (e) {
          console.error('Error auto-saving responsible', e);
        }
      }
    }

    // Auto-save driver to driversRoutes if it doesn't exist
    if (batchData.truckDriver && batchData.truckDriver.trim() && batchData.truckDriver.trim() !== '-') {
      const drName = batchData.truckDriver.trim().toUpperCase();
      const entityName = (batchData.entity || '').trim().toUpperCase();
      
      if (!this.db.driversRoutes) {
        this.db.driversRoutes = [];
      }
      
      const exists = this.db.driversRoutes.some(
        dr => dr.driverName.toUpperCase() === drName && dr.jefeName.toUpperCase() === entityName
      );
      
      if (!exists && entityName) {
        try {
          this.saveDriverRoute({
            jefeName: entityName,
            driverName: drName,
            route: (batchData.truckRoute || '').trim().toUpperCase(),
            plate: (batchData.truckPlate || '').trim().toUpperCase()
          }, operatorUsername, ip);
        } catch (e) {
          console.error('Error auto-saving driver route', e);
        }
      }
    }

    // Process each item in the batch
    for (let index = 0; index < batchData.items.length; index++) {
      const itemEntry = batchData.items[index];
      const item = this.db.items.find(i => i.id === itemEntry.itemId);
      if (!item) throw new Error(`El canastillo con ID ${itemEntry.itemId} no existe.`);
      if (item.status === 'Inactivo') throw new Error(`El canastillo "${item.name}" está inactivo y no puede registrar nuevos movimientos.`);

      const quantity = Number(itemEntry.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error(`La cantidad para "${item.name}" debe ser un número positivo mayor que cero.`);
      }

      // Calculate current stock to check constraints on outlets
      // Since they are processed sequentially, let's look up current stock factoring in previous moves in this batch
      const stockStats = this.getStockData().find(s => s.id === itemEntry.itemId);
      let currentStock = stockStats ? stockStats.stockActual : 0;

      // Adjust for other movements of the SAME item in this batch that are already pushed in this.db.movements
      // Because we push them one-by-one, we can just let getStockData do its math! It reads directly from this.db.movements!

      const fromStatus = (itemEntry as any).fromStatus;

      if (fromStatus) {
        const fromStatusKey = fromStatus === 'Planta' ? 'plantaDisponibles' : 
                            fromStatus === 'Planta_Disponibles' ? 'plantaDisponibles' : 
                            fromStatus === 'Produccion' ? 'produccion' : 
                            fromStatus === 'Planta_Almacen' ? 'plantaAlmacen' : 
                            fromStatus === 'Reparto' ? 'reparto' : 
                            fromStatus === 'Clientes' ? 'clientes' : 
                            fromStatus === 'Pendiente' ? 'pendientes' : 
                            fromStatus === 'Dañado' ? 'danado' : 'reparacion';
        const availableInFromStatus = stockStats ? (stockStats.breakdown[fromStatusKey] || 0) : 0;
        if (availableInFromStatus < quantity) {
          throw new Error(`Stock insuficiente en el área de origen para "${item.name}". Intentas traspasar ${quantity} canastillos, pero solo hay ${availableInFromStatus} disponibles en esa área.`);
        }
      } else if (batchData.type === 'salida' && currentStock < quantity) {
        throw new Error(`Stock insuficiente para "${item.name}". Intentas registrar una salida de ${quantity} canastillos, pero solo hay ${currentStock} disponibles.`);
      }

      // Generate consecutive movement number
      const serial = this.db.movements.length + 1;
      const movementNumber = `MOV-${serial.toString().padStart(4, '0')}`;

      const newMovement: Movement = {
        id: `m_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 4)}`,
        movementNumber,
        documentNumber,
        orderNumber: documentNumber,
        date: dateStr,
        time: timeStr,
        type: batchData.type,
        itemId: itemEntry.itemId,
        quantity,
        entity: batchData.entity || '',
        responsible: batchData.responsible || '',
        details: batchData.details || '',
        user: operatorUsername,
        truckPlate: batchData.truckPlate || '',
        truckDriver: batchData.truckDriver || '',
        truckRoute: batchData.truckRoute || '',
        clientName: batchData.clientName || '',
        crateStatus: (itemEntry.crateStatus || 'Planta') as any,
        fromStatus: fromStatus
      };

      const stockBefore = currentStock;
      const stockAfter = batchData.type === 'ingreso' ? stockBefore + quantity : stockBefore - quantity;

      const newKardex: KardexEntry = {
        id: `k_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 4)}`,
        documentNumber,
        orderNumber: documentNumber,
        date: dateStr,
        time: timeStr,
        type: batchData.type,
        code: item.code,
        item: item.name,
        quantity,
        stockBefore,
        stockAfter,
        user: operatorUsername,
        entity: batchData.entity || '',
        details: batchData.details || '',
        fromStatus: fromStatus,
        crateStatus: itemEntry.crateStatus
      };

      this.db.movements.push(newMovement);
      this.db.kardex.push(newKardex);
      registeredMovements.push(newMovement);
    }

    this.save();

    this.logAudit(
      operatorUsername, 
      `REGISTRO MULTI-MOVIMIENTO (${batchData.type.toUpperCase()})`, 
      { documentNumber, itemCount: batchData.items.length }, 
      registeredMovements, 
      ip
    );

    return registeredMovements;
  }

  // 5. Config Save
  saveConfig(newConfig: AppConfig, operatorUsername: string, ip: string): AppConfig {
    const original = { ...this.db.config };
    this.db.config = { ...this.db.config, ...newConfig };
    this.save();
    this.logAudit(operatorUsername, 'ACTUALIZACIÓN DE CONFIGURACIÓN', original, this.db.config, ip);
    return this.db.config;
  }

  // 6. Backups management
  getBackups(): any[] {
    try {
      if (!fs.existsSync(BACKUPS_DIR)) return [];
      const files = fs.readdirSync(BACKUPS_DIR);
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => {
          const filePath = path.join(BACKUPS_DIR, f);
          const stat = fs.statSync(filePath);
          return {
            filename: f,
            date: stat.mtime.toISOString().replace('T', ' ').substr(0, 19),
            size: `${(stat.size / 1024).toFixed(2)} KB`
          };
        })
        .sort((a, b) => b.filename.localeCompare(a.filename)); // newest first
    } catch (e) {
      console.error('Error listing backups', e);
      return [];
    }
  }

  createBackup(operatorUsername: string, ip: string): string {
    try {
      const now = new Date();
      const dateStr = now.toISOString().replace(/[:.]/g, '-');
      const filename = `backup_delizia_${dateStr}.json`;
      const destPath = path.join(BACKUPS_DIR, filename);

      fs.writeFileSync(destPath, JSON.stringify(this.db, null, 2), 'utf8');
      this.logAudit(operatorUsername, 'CREACIÓN DE COPIA DE SEGURIDAD', {}, { file: filename }, ip);
      return filename;
    } catch (e) {
      console.error('Error creating backup', e);
      throw new Error('Error al generar la copia de seguridad: ' + (e as Error).message);
    }
  }

  restoreBackup(filename: string, operatorUsername: string, ip: string): boolean {
    try {
      const filePath = path.join(BACKUPS_DIR, filename);
      if (!fs.existsSync(filePath)) {
        throw new Error('El archivo de respaldo no existe');
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(fileContent);

      // Simple structural validation
      if (!parsed.users || !parsed.items || !parsed.movements || !parsed.kardex || !parsed.audit || !parsed.config) {
        throw new Error('Estructura de base de datos de respaldo inválida.');
      }

      // Save a rollback backup first just in case
      this.createBackup('SYSTEM_AUTO', '127.0.0.1');

      const original = { ...this.db };
      this.db = parsed;
      this.save();

      this.logAudit(operatorUsername, 'RESTAURACIÓN DE COPIA DE SEGURIDAD', { file: filename }, { result: 'Restauración exitosa' }, ip);
      return true;
    } catch (e) {
      console.error('Error restoring backup', e);
      throw new Error('Error al restaurar el respaldo: ' + (e as Error).message);
    }
  }

  restoreBackupFromUpload(jsonContent: string, operatorUsername: string, ip: string): boolean {
    try {
      const parsed = JSON.parse(jsonContent);

      // Simple structural validation
      if (!parsed.users || !parsed.items || !parsed.movements || !parsed.kardex || !parsed.audit || !parsed.config) {
        throw new Error('El archivo cargado no contiene una estructura de base de datos válida.');
      }

      // Save a rollback backup first
      this.createBackup('SYSTEM_AUTO_ROLLBACK', '127.0.0.1');

      this.db = parsed;
      this.save();

      this.logAudit(operatorUsername, 'RESTAURACIÓN DE RESPALDO SUBIDO POR USUARIO', {}, { result: 'Restauración por archivo exitosa' }, ip);
      return true;
    } catch (e) {
      console.error('Error restoring from upload', e);
      throw new Error('Error al restaurar archivo cargado: ' + (e as Error).message);
    }
  }

  clearDatabase(operatorUsername: string, ip: string): void {
    // Save backup before clearing
    try {
      this.createBackup('AUTO_ANTES_DE_VACIADO', ip);
    } catch (e) {
      console.error('No se pudo crear backup de pre-vacidado:', e);
    }

    this.db.movements = [];
    this.db.kardex = [];
    this.db.locations = [];
    this.db.responsibles = [];
    this.db.driversRoutes = [];
    
    // Keep standard items but mark them active or empty them. Let's empty them too to allow fully fresh setups, or keep them.
    // Keeping them empty is cleaner and allows them to define custom codes!
    this.db.items = [];
    this.db.audit = [];

    this.save();
    this.logAudit(operatorUsername, 'VACIADO COMPLETO DE BASE DE DATOS', {}, { info: 'Base de datos reiniciada a cero' }, ip);
  }
}
