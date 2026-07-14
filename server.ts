import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { LocalDatabase } from './src/server/db.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize DB
  const db = new LocalDatabase();
  await db.initFirestore();

  // Middleware
  app.use(express.json({ limit: '10mb' }));

  // Helper to extract client IP
  const getClientIp = (req: express.Request): string => {
    const forward = req.headers['x-forwarded-for'];
    if (forward) {
      const ip = typeof forward === 'string' ? forward.split(',')[0] : forward[0];
      if (ip) return ip;
    }
    return req.socket.remoteAddress || '127.0.0.1';
  };

  // Helper to verify auth and role
  const checkAuth = (allowedRoles?: ('Administrador' | 'Supervisor' | 'Operador')[]) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'No autorizado. Inicie sesión.' });
      }

      const token = authHeader.replace('Bearer ', '');
      // In this local applet, we use simple JSON base64 or plaintext user objects as tokens for ease of state management
      try {
        const userData = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
        const user = db.getUsers().find(u => u.username === userData.username && u.passwordHash === userData.passwordHash);

        if (!user || user.status === 'Inactivo') {
          return res.status(401).json({ error: 'Sesión inválida o usuario inactivo.' });
        }

        if (allowedRoles && !allowedRoles.includes(user.role)) {
          return res.status(403).json({ error: `Acceso denegado. Su rol de ${user.role} no tiene permisos para esta acción.` });
        }

        req.user = user;
        next();
      } catch (err) {
        return res.status(401).json({ error: 'Token inválido. Reautentíquese.' });
      }
    };
  };

  // 1. Authentication Endpoints
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos.' });
    }

    const user = db.authenticate(username, password);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas o usuario inactivo.' });
    }

    // Return simple token (base64 of user info)
    const token = Buffer.from(JSON.stringify({ username: user.username, passwordHash: user.passwordHash })).toString('base64');
    
    // Log audit for login
    db.logAudit(user.username, 'INICIO DE SESIÓN', {}, { username: user.username, role: user.role }, getClientIp(req));

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  });

  app.post('/api/auth/change-password', checkAuth(), (req: any, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = req.user;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Contraseña actual y nueva requeridas.' });
    }

    if (user.passwordHash !== oldPassword) {
      return res.status(400).json({ error: 'La contraseña actual es incorrecta.' });
    }

    const success = db.changePassword(user.id, newPassword, user.username, getClientIp(req));
    if (success) {
      res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
    } else {
      res.status(500).json({ error: 'No se pudo actualizar la contraseña.' });
    }
  });

  // 2. Users Management
  app.get('/api/users', checkAuth(['Administrador', 'Supervisor']), (req, res) => {
    // Hide password hashes
    const safeUsers = db.getUsers().map(({ passwordHash, ...rest }) => rest);
    res.json(safeUsers);
  });

  app.post('/api/users', checkAuth(['Administrador']), (req: any, res) => {
    try {
      const user = db.saveUser(req.body, req.user.username, getClientIp(req));
      const { passwordHash, ...safeUser } = user;
      res.json(safeUser);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // 3. Items (Canastillos) Management
  app.get('/api/items', checkAuth(), (req, res) => {
    res.json(db.getItems());
  });

  app.post('/api/items', checkAuth(['Administrador', 'Supervisor', 'Operador']), (req: any, res) => {
    try {
      const item = db.saveItem(req.body, req.user.username, getClientIp(req));
      res.json(item);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete('/api/items/:id', checkAuth(['Administrador']), (req: any, res) => {
    try {
      const success = db.removeItem(req.params.id, req.user.username, getClientIp(req));
      if (success) {
        res.json({ success: true, message: 'Item eliminado correctamente.' });
      } else {
        res.status(404).json({ error: 'Item no encontrado.' });
      }
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // 3b. Locations Management (Procedencias y Destinos)
  app.get('/api/locations', checkAuth(), (req, res) => {
    res.json(db.getLocations());
  });

  app.post('/api/locations', checkAuth(['Administrador', 'Supervisor', 'Operador']), (req: any, res) => {
    try {
      const location = db.saveLocation(req.body, req.user.username, getClientIp(req));
      res.json(location);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete('/api/locations/:id', checkAuth(['Administrador']), (req: any, res) => {
    try {
      const success = db.removeLocation(req.params.id, req.user.username, getClientIp(req));
      if (success) {
        res.json({ success: true, message: 'Ubicación eliminada correctamente.' });
      } else {
        res.status(404).json({ error: 'Ubicación no encontrada.' });
      }
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // 3c. Responsibles Management (Responsables de Operación)
  app.get('/api/responsibles', checkAuth(), (req, res) => {
    res.json(db.getResponsibles());
  });

  app.post('/api/responsibles', checkAuth(['Administrador', 'Supervisor', 'Operador']), (req: any, res) => {
    try {
      const responsible = db.saveResponsible(req.body, req.user.username, getClientIp(req));
      res.json(responsible);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete('/api/responsibles/:id', checkAuth(['Administrador']), (req: any, res) => {
    try {
      const success = db.removeResponsible(req.params.id, req.user.username, getClientIp(req));
      if (success) {
        res.json({ success: true, message: 'Responsable eliminado correctamente.' });
      } else {
        res.status(404).json({ error: 'Responsable no encontrado.' });
      }
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // 3d. Drivers and Routes Management
  app.get('/api/drivers-routes', checkAuth(), (req, res) => {
    res.json(db.getDriversRoutes());
  });

  app.post('/api/drivers-routes', checkAuth(['Administrador', 'Supervisor', 'Operador']), (req: any, res) => {
    try {
      const driverRoute = db.saveDriverRoute(req.body, req.user.username, getClientIp(req));
      res.json(driverRoute);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete('/api/drivers-routes/:id', checkAuth(['Administrador']), (req: any, res) => {
    try {
      const success = db.removeDriverRoute(req.params.id, req.user.username, getClientIp(req));
      if (success) {
        res.json({ success: true, message: 'Conductor/Ruta eliminado correctamente.' });
      } else {
        res.status(404).json({ error: 'Conductor/Ruta no encontrado.' });
      }
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // 4. Movements (Ingresos / Salidas)
  app.get('/api/movements', checkAuth(), (req, res) => {
    // Return all movements, resolved with item code/name for frontend comfort
    const items = db.getItems();
    const movements = db.getMovements().map(m => {
      const item = items.find(i => i.id === m.itemId);
      return {
        ...m,
        itemCode: item ? item.code : 'Desconocido',
        itemName: item ? item.name : 'Desconocido',
        itemColor: item ? item.color : '#888888'
      };
    });
    res.json(movements);
  });

  app.post('/api/movements', checkAuth(), (req: any, res) => {
    try {
      if (req.body.items && Array.isArray(req.body.items)) {
        const movements = db.registerMovementBatch(req.body, req.user.username, getClientIp(req));
        res.json(movements[0]); // return first generated movement for compatibility
      } else {
        const movement = db.registerMovement(req.body, req.user.username, getClientIp(req));
        res.json(movement);
      }
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // 5. Stock status
  app.get('/api/stock', checkAuth(), (req, res) => {
    res.json(db.getStockData());
  });

  // 6. Kardex History
  app.get('/api/kardex', checkAuth(), (req, res) => {
    res.json(db.getKardex());
  });

  // 7. Audit trail
  app.get('/api/audit', checkAuth(['Administrador', 'Supervisor']), (req, res) => {
    res.json(db.getAudit());
  });

  // 8. Configuration Setup
  app.get('/api/config', (req, res) => {
    res.json(db.getConfig());
  });

  app.post('/api/config', checkAuth(['Administrador']), (req: any, res) => {
    try {
      const config = db.saveConfig(req.body, req.user.username, getClientIp(req));
      res.json(config);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // 9. Backups (Copia de Seguridad y Restauración)
  app.get('/api/backups', checkAuth(['Administrador']), (req, res) => {
    res.json(db.getBackups());
  });

  app.post('/api/backups/create', checkAuth(['Administrador']), (req: any, res) => {
    try {
      const filename = db.createBackup(req.user.username, getClientIp(req));
      res.json({ success: true, filename, message: 'Copia de seguridad creada con éxito.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/backups/restore', checkAuth(['Administrador']), (req: any, res) => {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ error: 'Nombre de archivo requerido.' });

    try {
      const success = db.restoreBackup(filename, req.user.username, getClientIp(req));
      res.json({ success, message: 'Copia de seguridad restaurada correctamente.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/backups/restore-upload', checkAuth(['Administrador']), (req: any, res) => {
    const { jsonContent } = req.body;
    if (!jsonContent) return res.status(400).json({ error: 'Contenido JSON requerido.' });

    try {
      const success = db.restoreBackupFromUpload(jsonContent, req.user.username, getClientIp(req));
      res.json({ success, message: 'Copia de seguridad cargada y restaurada correctamente.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Clear Database completely (Reset to zero)
  app.post('/api/database/clear', checkAuth(['Administrador']), (req: any, res) => {
    try {
      db.clearDatabase(req.user.username, getClientIp(req));
      res.json({ success: true, message: 'La base de datos se ha vaciado por completo con éxito.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 10. Dashboard Stats & Analytics Endpoints
  app.get('/api/stats', checkAuth(), (req, res) => {
    const stockData = db.getStockData();
    const movements = db.getMovements();
    const items = db.getItems();

    // Aggregates
    const totalCratesRegistered = items.length;
    const totalCurrentStock = stockData.reduce((sum, s) => sum + s.stockActual, 0);

    const todayStr = new Date().toISOString().split('T')[0];
    
    // Day's entries and exits
    const todayMovements = movements.filter(m => m.date === todayStr);
    const todayIngresos = todayMovements.filter(m => m.type === 'ingreso').reduce((sum, m) => sum + m.quantity, 0);
    const todaySalidas = todayMovements.filter(m => m.type === 'salida').reduce((sum, m) => sum + m.quantity, 0);

    // Stock Alerts (Alerts when stock level is less than capacity * 1.5, or customizable, say < 30)
    const stockAlerts = stockData
      .filter(s => s.stockActual < 50 && s.status === 'Activo')
      .map(s => ({
        itemId: s.id,
        code: s.code,
        name: s.name,
        color: s.color,
        stockActual: s.stockActual,
        alertType: s.stockActual === 0 ? 'Critico' : 'Bajo'
      }));

    // Daily Movements chart data (last 7 days of entries and exits)
    const dailyChartData: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dayMoves = movements.filter(m => m.date === dateStr);
      const dayIngresos = dayMoves.filter(m => m.type === 'ingreso').reduce((sum, m) => sum + m.quantity, 0);
      const daySalidas = dayMoves.filter(m => m.type === 'salida').reduce((sum, m) => sum + m.quantity, 0);

      // Short date label for UI (e.g., "10 Jul")
      const label = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

      dailyChartData.push({
        date: dateStr,
        label,
        ingresos: dayIngresos,
        salidas: daySalidas
      });
    }

    // Last 5 movements with full details
    const recentMovements = movements
      .slice(-5)
      .reverse()
      .map(m => {
        const item = items.find(i => i.id === m.itemId);
        return {
          ...m,
          itemName: item ? item.name : 'Desconocido',
          itemCode: item ? item.code : 'Desconocido',
          itemColor: item ? item.color : '#888888'
        };
      });

    // Returnable Crates Logistics Breakdown Aggregates
    const logisticsBreakdown = {
      planta: stockData.reduce((sum, s) => sum + s.breakdown.planta, 0),
      plantaDisponibles: stockData.reduce((sum, s) => sum + s.breakdown.plantaDisponibles, 0),
      produccion: stockData.reduce((sum, s) => sum + s.breakdown.produccion, 0),
      plantaAlmacen: stockData.reduce((sum, s) => sum + s.breakdown.plantaAlmacen, 0),
      reparto: stockData.reduce((sum, s) => sum + s.breakdown.reparto, 0),
      clientes: stockData.reduce((sum, s) => sum + s.breakdown.clientes, 0),
      pendientes: stockData.reduce((sum, s) => sum + s.breakdown.pendientes, 0),
      danado: stockData.reduce((sum, s) => sum + s.breakdown.danado, 0),
      reparacion: stockData.reduce((sum, s) => sum + s.breakdown.reparacion, 0),
    };

    res.json({
      totalCratesRegistered,
      totalCurrentStock,
      todayIngresos,
      todaySalidas,
      stockAlerts,
      dailyChartData,
      recentMovements,
      logisticsBreakdown
    });
  });

  // Vite development integration or production build serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware integrated.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve index.html for SPA fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static asset serving enabled.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
}

// Global declaration for TypeScript Request extensions
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

startServer().catch(err => {
  console.error('Fatal error starting Express server:', err);
});
