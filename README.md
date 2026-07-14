# DELIZIA - Sistema de Control y Trazabilidad de Canastillos Retornables

Este es el sistema centralizado de control logístico desarrollado para **DELIZIA**, diseñado para la gestión en tiempo real del ingreso, salida, stock físico y trazabilidad exterior de canastillos retornables.

---

## 🚀 Características del Sistema

1. **Dashboard en Tiempo Real:** Indicadores KPI de existencias, flujos diarios, alertas de desabastecimiento, semáforo de estados físicos logísticos (en planta, reparto, entregados, mermas) y gráficos históricos.
2. **Maestro de Ítems:** CRUD completo de tipos de canastillos con validación de códigos únicos, descripciones y colores representativos de marca.
3. **Módulo de Ingresos y Recepción:** Registra retornos de canastillos, incrementando el inventario físico útil automáticamente.
4. **Módulo de Salidas y Despachos:** Despacho controlado de canastillos con protección para evitar salidas superiores al stock disponible.
5. **Control de Stock Dinámico:** Grilla interactiva de stock disponible en bodega, canastillos en tránsito (camiones de reparto) y canastillos en clientes finales.
6. **Kardex de Operaciones:** Historial completo inmutable de cada movimiento con registro de stock anterior, stock posterior, responsable y detalles de traslado.
7. **Generador de Reportes:** Generación de resúmenes operativos diarios, mensuales y flujos de recuperación exportables a Excel y listos para imprimir.
8. **Seguridad y Roles:** Niveles de permisos operacionales (Administrador, Supervisor y Operador) con control total de acceso.
9. **Auditoría del Sistema:** Bitácora inmutable de tazas de log, inicios de sesión, cambios de estados y trazabilidad IP.
10. **Configuración y Respaldos:** Edición de identidad corporativa (logos, nombres, paletas) con capacidad de generar copias de seguridad descargables e importación de respaldos externos por archivos JSON.

---

## 🔐 Credenciales de Acceso

El sistema viene preconfigurado con tres usuarios de prueba para validar los distintos niveles de permisos y roles:

* **Administrador:**
  * Usuario: `admin`
  * Contraseña: `admin123`
  * *Permiso:* Acceso total a todos los módulos, gestión de cuentas de usuario, y generación/restauración de copias de seguridad.

* **Supervisor:**
  * Usuario: `supervisor`
  * Contraseña: `super123`
  * *Permiso:* Consulta general de inventario, auditoría, registro de ingresos/salidas, y visualización de Kardex histórico. No puede modificar usuarios ni configuraciones del sistema.

* **Operador:**
  * Usuario: `operador`
  * Contraseña: `op123`
  * *Permiso:* Módulo exclusivo de registro rápido de ingresos y salidas físicas de canastillos.

---

## 🛠️ Tecnologías Utilizadas

* **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion.
* **Backend:** Node.js, Express, tsx, esbuild, TypeScript.
* **Persistencia de Datos:** Base de Datos JSON transaccional autocontenida en `db.json` con soporte inmutable y restauración de emergencias.

---

## ⚙️ Instrucciones de Instalación y Ejecución Local

Para ejecutar el proyecto fuera de AI Studio en su máquina local:

1. **Clonar o descargar** los archivos del proyecto.
2. **Instalar dependencias:**
   ```bash
   npm install
   ```
3. **Correr en modo desarrollo (Backend + Frontend integrado):**
   ```bash
   npm run dev
   ```
4. **Abrir el navegador** en la dirección:
   ```
   http://localhost:3000
   ```
5. **Compilar para producción:**
   ```bash
   npm run build
   ```
6. **Correr servidor de producción:**
   ```bash
   npm start
   ```

---

*Desarrollado para DELIZIA por Google AI Studio Coding Assistant.*
