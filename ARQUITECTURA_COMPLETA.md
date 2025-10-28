# 📊 ARQUITECTURA COMPLETA DEL SISTEMA - GIBRAVO TRAVEL

## 🎯 RESUMEN EJECUTIVO

Este documento detalla la arquitectura completa del sistema después de analizar el frontend y backend para asegurar compatibilidad total.

---

## 🗄️ BASE DE DATOS - ESTRUCTURA COMPLETA

### **1. USUARIOS Y AUTENTICACIÓN**

#### `users` - Usuarios del Sistema
```prisma
- id: String (cuid)
- clerkId: String (unique) ⚠️ DEBE SER ACTUALIZADO
- email: String (unique)
- firstName: String
- lastName: String
- role: UserRole (USER, ADMIN, TI)
- isActive: Boolean
```

**Frontend esperado:**
- `/api/users` → GET lista de usuarios
- `/api/user/[id]` → GET/PUT/DELETE usuario específico
- `/api/user/profile` → GET/PUT perfil del usuario autenticado

#### `clients` - Base de Datos de Clientes
```prisma
- id: String (cuid)
- firstName, lastName: String
- fiscalCode: String
- address, phoneNumber, email: String
- birthPlace, birthDate: DateTime
- document1-4: String (URLs Cloudinary)
- createdBy: String (FK a users.clerkId)
```

**Frontend esperado:**
- `/api/clients` → GET lista de clientes
- Filtro `?userOnly=true` para usuarios con rol USER
- Usado en: BIGLIETTERIA, TOUR BUS, TOUR AÉREO

---

### **2. CONFIGURACIÓN BÁSICA (Tablas de Referencia)**

Todas estas tablas son consultadas por múltiples páginas del frontend:

#### `metodo_pagamento` - Métodos de Pago
```prisma
- id, metodoPagamento (unique), isActive
```
**API:** `/api/metodo-pagamento` y `/api/reference/metodo-pagamento`

#### `iata` - Códigos IATA de Aeropuertos
```prisma
- id, iata (unique), isActive
```
**API:** `/api/iata` y `/api/reference/iata`

#### `servizio` - Servicios Disponibles
```prisma
- id, servizio (unique), isActive
```
**API:** `/api/servizio`, `/api/servizi`, `/api/reference/servizio`

#### `fermata_bus` - Paradas de Autobús
```prisma
- id, fermata (unique), isActive
```
**API:** `/api/fermata-bus`

#### `stato_bus` - Estados de Asientos
```prisma
- id, stato (unique), isActive
```
**API:** `/api/stato-bus`

#### `pagamento` - Estados de Pago
```prisma
- id, pagamento (unique), isActive
```
**API:** `/api/pagamento` y `/api/reference/pagamento`

---

### **3. BIGLIETTERIA - Sistema Principal de Ventas**

#### `biglietteria` - Ventas Principales
```prisma
- id: String (cuid)
- pagamento, data, pnr, itinerario: String/DateTime
- metodoPagamento: String
- cliente, codiceFiscale, indirizzo, email, numeroTelefono: String
- creadoPor: String (FK a users.id) ⚠️ NOTA: usa .id no .clerkId
- netoPrincipal, vendutoTotal, acconto, daPagare, feeAgv: Float
- numeroPasajeros, numeroCuotas: Int
- attachedFile, attachedFileName: String
```

**Frontend esperado:**
- `/api/biglietteria` → GET con filtros por fecha y `?userOnly=true`
- `/api/biglietteria/[id]` → GET/PUT/DELETE venta específica
- Incluye relación `creator` con JOIN a `users`
- Calcula automáticamente: `feeAgv = vendutoTotal - netoPrincipal`

#### `pasajeros_biglietteria` - Múltiples Pasajeros por Venta
```prisma
- id, biglietteriaId (FK)
- nombrePasajero, servizio: String
- andata, ritorno: DateTime
- iata: String (dinámico por pasajero)
- netoBiglietteria, vendutoBiglietteria: Float
- tieneExpress, tienePolizza, tieneLetteraInvito, tieneHotel: Boolean
- netoExpress, vendutoExpress, etc.: Float
- estado, fechaPago, fechaActivacion: String/DateTime
- notas: String
```

**Frontend esperado:**
- `/api/biglietteria/pasajero/[id]` → GET/PUT/DELETE pasajero
- Formulario dinámico con servicios adicionales opcionales

#### `cuotas` - Sistema de Pagos Fraccionados
```prisma
- id, biglietteriaId (FK)
- numeroCuota: Int (1 o 2)
- data, prezzo, note: DateTime/Float/String
- isPagato: Boolean
- attachedFile, attachedFileName: String
```

**Frontend esperado:**
- `/api/biglietteria/cuota/[id]` → GET/PUT/DELETE cuota
- `/api/biglietteria/generate-ricevuta` → POST generar recibo

---

### **4. TOURS BUS - Sistema Completo**

#### `tour_bus` - Tours con Costos Detallados
```prisma
- id: String (cuid)
- titulo: String
- precioAdulto, precioNino: Float
- cantidadAsientos: Int (default 53)
- fechaViaje, fechaFin: DateTime
- acc: String
- bus, pasti, parking, coordinatore1, coordinatore2, ztl, hotel, polizza, tkt: Float
- autoservicio: String
- feeAgv: Float (acumulado de ventas)
- coverImage, coverImageName, pdfFile, pdfFileName, descripcion: String
- createdBy: String (FK a users.clerkId)
```

**Frontend esperado:**
- `/api/tour-bus` → GET lista de todos los tours (sin filtro de usuario)
- `/api/tour-bus/[id]` → GET/PUT/DELETE tour específico
- Incluye relación `creator` y `_count.ventas`
- Formulario con 3 columnas por fila (campos de costos)

#### `asientos_bus` - 53 Asientos por Tour
```prisma
- id, tourBusId (FK)
- numeroAsiento: Int (1-53)
- fila: Int, columna: String (A,B,C,D)
- tipo: TipoAsiento (NORMAL, CONDUCTOR)
- stato: String (Libero, Prenotato, Venduto, Ocupado)
- isVendido: Boolean
- precioVenta, fechaVenta: Float/DateTime
- clienteNombre, clienteTelefono, clienteEmail, observaciones: String
```

**Frontend esperado:**
- `/api/tour-bus/[id]` → Incluye array de `asientos`
- `/api/tour-bus/asiento/[id]` → PUT actualizar asiento
- Visualización CSS Grid con layout realista (2+2 columnas)
- Dropdown "seleziona posto" debe incluir TODOS los asientos libres

#### `ventas_tour_bus` - Ventas Principales
```prisma
- id, tourBusId (FK)
- clienteNombre, codiceFiscale, indirizzo, email, numeroTelefono: String
- fechaNacimiento: DateTime
- fermata: String
- numeroAsiento: Int
- tieneMascotas, numeroMascotas, tieneInfantes, numeroInfantes: Boolean/Int
- totalAPagar, acconto, daPagare: Float
- metodoPagamento, estadoPago: String
- numeroAcompanantes, numeroCuotas: Int
- createdBy: String (FK a users.id) ⚠️ NOTA: usa .id no .clerkId
```

**Frontend esperado:**
- `/api/tour-bus/venta` → POST crear venta
- `/api/tour-bus/venta/[id]` → GET/PUT/DELETE venta específica
- `/api/tour-bus/ventas` → GET lista de ventas
- Incluye relación `creator` con JOIN a `users`
- Tabla "ANALISI COSTI E RICAVI" con columna "AGENTE" mostrando nombre del agente

#### `acompanantes_tour_bus` - Acompañantes
```prisma
- id, ventaTourBusId (FK)
- nombreCompleto, telefono, codiceFiscale: String
- esAdulto: Boolean
- fermata: String
- numeroAsiento: Int
```

**Frontend esperado:**
- Formulario dinámico para agregar múltiples acompañantes
- Cada acompañante tiene su propio asiento

#### `cuotas_tour_bus` - Pagos Fraccionados
```prisma
- id, ventaTourBusId (FK)
- numeroCuota: Int
- fechaPago, precioPagar: DateTime/Float
- metodoPagamento: String
- isPagado: Boolean
```

---

### **5. TOUR AÉREO - Sistema Completo**

#### `tour_aereo` - Tours Aéreos
```prisma
- id: String (cuid)
- titulo: String
- precioAdulto, precioNino: Float
- fechaViaje, fechaFin: DateTime
- meta: Int (número de metas)
- acc: String
- guidaLocale, coordinatore, transporte: Float
- notas, notasCoordinador: String
- feeAgv: Float (acumulado de ventas)
- coverImage, coverImageName, pdfFile, pdfFileName, descripcion: String
- createdBy: String (FK a users.clerkId)
```

**Frontend esperado:**
- `/api/tour-aereo` → GET lista de todos los tours
- `/api/tour-aereo/[id]` → GET/PUT/DELETE tour específico
- Incluye relación `creator` y `_count.ventas`
- Formulario con 3 columnas por fila

#### `ventas_tour_aereo` - Ventas Principales
```prisma
- id, tourAereoId (FK)
- pasajero, codiceFiscale, indirizzo, email, numeroTelefono: String
- paisOrigen: String
- iata, pnr: String
- hotel, transfer: Float
- venduto, acconto, daPagare: Float
- metodoPagamento, metodoCompra, stato: String
- attachedFile, attachedFileName: String
- createdBy: String (FK a users.id) ⚠️ NOTA: usa .id no .clerkId
```

**Frontend esperado:**
- `/api/tour-aereo/ventas` → GET lista de ventas (sin [id] en ruta)
- `/api/tour-aereo/[id]/ventas` → GET ventas de un tour específico
- `/api/tour-aereo/ventas/[id]` → PUT/DELETE venta específica
- Incluye relación `creator` con JOIN a `users`
- Radio buttons "Niño"/"Adulto" que auto-rellenan el campo "Venduto"
- Tabla con columna "AGENTE" mostrando nombre del agente

#### `cuotas_venta_tour_aereo` - Pagos Fraccionados
```prisma
- id, ventaTourAereoId (FK)
- numeroCuota: Int
- fechaPago, monto: DateTime/Float
- nota, estado: String
- attachedFile, attachedFileName: String
```

---

### **6. AGENDAS Y CALENDARIO**

#### `agendas_personales` - Agendas Personales
```prisma
- id: String (cuid)
- titulo, descripcion: String
- fecha: DateTime (fecha única, no inicio/fin)
- tipo: AgendaTipo (PERSONAL, REUNION, CITA, RECORDATORIO, TAREA)
- color: String (default "bg-purple-500")
- createdBy: String (FK a users.id)
```

**Frontend esperado:**
- `/api/calendario` → GET eventos combinados (TOUR BUS + TOUR AÉREO + AGENDAS)
- `/api/agendas-personales` → POST/GET agendas del usuario autenticado
- `/api/agendas-personales/[id]` → GET/PUT/DELETE agenda específica
- Cada usuario solo ve sus propias agendas
- Todos ven los tours (TOUR BUS y TOUR AÉREO)

#### `recordatorios_agenda` - Sistema de Alarmas
```prisma
- id, agendaId (FK unique)
- minutosAntes: Int (5, 15, 30, 60, 1440)
- isActivo: Boolean
```

---

### **7. PLANTILLAS Y CONTENIDO**

#### `info` - Plantillas de Información (PARTENZE/NOTE)
```prisma
- id, title, textContent: String
- coverImage, coverImageName, pdfFile, pdfFileName: String
- createdBy: String (FK a users.clerkId)
- isDeleted: Boolean
```

**Frontend esperado:**
- `/api/info` → GET/POST plantillas
- `/api/info/[id]` → GET/PUT/DELETE plantilla específica
- Incluye relación `creator`

#### `routes` - Plantillas de Rutas (PERCORSI)
```prisma
- Misma estructura que `info`
```

**Frontend esperado:**
- `/api/route` → GET/POST plantillas
- `/api/percorsi` → Alias de `/api/route`

#### `stops` - Plantillas de Paradas (FERMATE)
```prisma
- Misma estructura que `info`
```

**Frontend esperado:**
- `/api/stop` → GET/POST plantillas

#### `departures` - Salidas Programadas
```prisma
- id, title, description: String
- departureDate, returnDate: DateTime
- price, capacity: Float/Int
- available: Boolean
```

---

## 🔌 API ENDPOINTS - MAPA COMPLETO

### **Autenticación y Usuarios**
```
GET    /api/users
GET    /api/user/[id]
PUT    /api/user/[id]
DELETE /api/user/[id]
GET    /api/user/profile
PUT    /api/user/profile
POST   /api/user/create
PUT    /api/user/role
```

### **Clientes**
```
GET    /api/clients              → { clients: [] }
GET    /api/clients?userOnly=true
POST   /api/clients
GET    /api/clients/[id]
PUT    /api/clients/[id]
DELETE /api/clients/[id]
```

### **Configuración (Tablas de Referencia)**
```
GET    /api/metodo-pagamento     → { metodosPagamento: [] }
POST   /api/metodo-pagamento
GET    /api/iata                 → Array directo
POST   /api/iata
GET    /api/servizio             → { servizios: [] }
GET    /api/servizi              → Array directo
POST   /api/servizio
GET    /api/fermata-bus          → { fermate: [] }
POST   /api/fermata-bus
GET    /api/stato-bus            → { stati: [] }
POST   /api/stato-bus
GET    /api/pagamento            → { pagamenti: [] }
POST   /api/pagamento
```

### **BIGLIETTERIA**
```
GET    /api/biglietteria                    → { records: [] }
GET    /api/biglietteria?userOnly=true
GET    /api/biglietteria?fechaDesde=...&fechaHasta=...
POST   /api/biglietteria
GET    /api/biglietteria/[id]
PUT    /api/biglietteria/[id]
DELETE /api/biglietteria/[id]
GET    /api/biglietteria/pasajero/[id]
PUT    /api/biglietteria/pasajero/[id]
DELETE /api/biglietteria/pasajero/[id]
GET    /api/biglietteria/cuota/[id]
PUT    /api/biglietteria/cuota/[id]
DELETE /api/biglietteria/cuota/[id]
POST   /api/biglietteria/generate-ricevuta
```

### **TOURS BUS**
```
GET    /api/tour-bus                        → { tours: [] }
GET    /api/tour-bus?fechaDesde=...&fechaHasta=...
POST   /api/tour-bus
GET    /api/tour-bus/[id]                   → { tour: {..., asientos: [], ventasTourBus: []} }
PUT    /api/tour-bus/[id]
DELETE /api/tour-bus/[id]
PUT    /api/tour-bus/asiento/[id]
POST   /api/tour-bus/venta
GET    /api/tour-bus/ventas
GET    /api/tour-bus/venta/[id]
PUT    /api/tour-bus/venta/[id]
DELETE /api/tour-bus/venta/[id]
```

### **TOUR AÉREO**
```
GET    /api/tour-aereo                      → { tours: [] }
GET    /api/tour-aereo?fechaDesde=...&fechaHasta=...
POST   /api/tour-aereo
GET    /api/tour-aereo/[id]                 → { tour: {...} }
PUT    /api/tour-aereo/[id]
DELETE /api/tour-aereo/[id]
GET    /api/tour-aereo/[id]/ventas          → { ventas: [] }
GET    /api/tour-aereo/ventas/[id]
PUT    /api/tour-aereo/ventas/[id]
DELETE /api/tour-aereo/ventas/[id]
```

### **CALENDARIO Y AGENDAS**
```
GET    /api/calendario                      → { events: [], stats: {} }
POST   /api/agendas-personales
GET    /api/agendas-personales
GET    /api/agendas-personales/[id]
PUT    /api/agendas-personales/[id]
DELETE /api/agendas-personales/[id]
```

### **PLANTILLAS**
```
GET    /api/info                            → { templates: [] }
POST   /api/info
GET    /api/info/[id]
PUT    /api/info/[id]
DELETE /api/info/[id]
GET    /api/route                           → { templates: [] }
GET    /api/percorsi                        → Alias
POST   /api/route
GET    /api/stop                            → { templates: [] }
POST   /api/stop
```

---

## 🖥️ PÁGINAS DE ADMINISTRACIÓN

### **Dashboard**
- `/` → Dashboard principal (E-commerce)
- `/dashboard-viajes` → Dashboard de análisis de ventas
  - Gráficos ApexCharts con filtros por mes/año
  - 3 gráficos de ventas por usuario (BIGLIETTERIA, TOUR AÉREO, TOUR BUS)
  - 3 cards de FEE/AGV (Tours, Biglietteria, Total)
  - Ranking de agentes (línea de tiempo)
  - Tabla desplegable con desglose mensual

### **BIGLIETTERIA**
- `/biglietteria` → Lista de ventas
  - Tabla con filtros dinámicos (Agente, Método de pago, Búsqueda)
  - Exportación a Excel
  - Columnas: NETO, VENDUTO, FEE/AGV, AGENTE
  - Modal de registro con múltiples pasajeros

### **TOURS BUS**
- `/tour-bus` → Lista de tours
  - Formulario de creación/edición (3 columnas)
  - Campos de costos detallados
  - Cover image y PDF
- `/tour-bus/[id]/asientos` → Visualización de asientos
  - Grid CSS 2+2 con 53 asientos
  - Formulario de venta con acompañantes
  - Tabla "ANALISI COSTI E RICAVI" con columna AGENTE
  - Tabla "INFORMAZIONI SUI PASSEGGERI" con columna AGENTE

### **TOUR AÉREO**
- `/tour-aereo` → Lista de tours
  - Formulario de creación/edición (3 columnas)
  - Cover image y PDF
- `/venta-tour-aereo/[id]` → Ventas del tour
  - Radio buttons "Niño"/"Adulto" que auto-rellenan "Venduto"
  - Tabla con filtros y exportación
  - Columna AGENTE mostrando nombre del agente

### **CALENDARIO**
- `/calendario` → Vista de calendario
  - Eventos de TOUR BUS (fechaViaje + fechaFin)
  - Eventos de TOUR AÉREO (fechaViaje + fechaFin)
  - Agendas personales (fecha única)
  - Modal para crear agendas personales
  - Recordatorios configurables

### **CONFIGURACIÓN**
- `/clienti` → Gestión de clientes
- `/metodo-pagamento` → Métodos de pago
- `/iata` → Códigos IATA
- `/servizio` → Servicios
- `/fermate` → Paradas de bus
- `/info` → Plantillas de información (PARTENZE/NOTE)
- `/percorsi` → Plantillas de rutas (PERCORSI)
- `/crea-utenti` → Crear usuarios

---

## ⚠️ PUNTOS CRÍTICOS IDENTIFICADOS

### **1. Inconsistencia en `createdBy`**
- **BIGLIETTERIA, TOUR BUS ventas, TOUR AÉREO ventas**: Usan `users.id`
- **TOURS BUS, TOUR AÉREO, Plantillas**: Usan `users.clerkId`
- **AGENDAS**: Usan `users.id`

### **2. Relaciones `creator`**
Todas las APIs deben incluir JOIN con `users` para mostrar nombre del agente:
```javascript
include: {
  creator: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true
    }
  }
}
```

### **3. Cálculos Automáticos**
- **BIGLIETTERIA**: `feeAgv = vendutoTotal - netoPrincipal`
- **TOUR BUS**: `feeAgv` se recalcula con cada venta
- **TOUR AÉREO**: `feeAgv` se recalcula con cada venta

### **4. Filtros de Usuario**
- Parámetro `?userOnly=true` para usuarios con rol USER
- ADMIN y TI ven todos los registros

### **5. Asientos de Bus**
- Siempre 53 asientos por tour
- Layout 2+2 (columnas A,B,C,D)
- Asiento 1 es tipo CONDUCTOR
- Dropdown debe mostrar TODOS los asientos libres

---

## 🎯 ESTADO ACTUAL

### ✅ **COMPLETADO**
1. Análisis completo de frontend y backend
2. Identificación de todas las tablas y relaciones
3. Mapeo de todos los endpoints de API
4. Script de restauración completa ejecutado exitosamente
5. Base de datos restaurada con:
   - 4 usuarios (ADMIN, TI, 2 AGENTES)
   - 4 clientes de ejemplo
   - 7 métodos de pago
   - 15 códigos IATA
   - 8 servicios
   - 8 paradas de bus
   - 5 estados de bus
   - 5 estados de pago
   - 2 tours de bus (con 106 asientos totales)
   - 2 tours aéreos
   - Plantillas de contenido

### ⚠️ **PENDIENTE**
1. **CRÍTICO**: Actualizar `clerkId` de usuarios con cuentas reales de Clerk
2. Crear ventas de prueba para validar funcionalidades
3. Probar todos los flujos del sistema
4. Configurar sistema de backups automáticos

---

## 📋 PRÓXIMOS PASOS

### **PASO 1: Actualizar clerkId**
Necesitas obtener tus `clerkId` reales de Clerk y ejecutar:
```sql
UPDATE users SET "clerkId" = 'tu_clerk_id_real' WHERE email = 'tu_email@example.com';
```

### **PASO 2: Probar APIs**
Verificar que todos los endpoints respondan correctamente:
```bash
curl http://localhost:3000/api/users
curl http://localhost:3000/api/tour-bus
curl http://localhost:3000/api/tour-aereo
curl http://localhost:3000/api/biglietteria
```

### **PASO 3: Crear Ventas de Prueba**
Usar los formularios del frontend para crear ventas reales y validar:
- Cálculos automáticos
- Relaciones entre tablas
- Filtros y búsquedas
- Exportación a Excel
- Gráficos del dashboard

### **PASO 4: Configurar Backups**
Implementar sistema de backups automáticos para evitar pérdida de datos:
```bash
# Backup diario
pg_dump -U postgres -d gibravotravel > backup_$(date +%Y%m%d).sql
```

---

## 📞 SOPORTE

Si encuentras algún problema:
1. Verifica que los `clerkId` estén correctamente actualizados
2. Revisa los logs de la consola del navegador y del servidor
3. Verifica que las relaciones `creator` estén incluidas en las APIs
4. Asegúrate de que los filtros `?userOnly=true` funcionen correctamente

---

**Fecha de restauración:** $(date)
**Versión del sistema:** 1.0
**Estado:** ✅ Base de datos restaurada - Pendiente actualización de clerkId


