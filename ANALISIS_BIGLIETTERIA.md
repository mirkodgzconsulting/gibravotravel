# 📋 Análisis Completo del Módulo BIGLIETTERIA

## 🎯 Descripción General

**BIGLIETTERIA** es el módulo principal de venta de boletos y servicios de viaje del sistema GiBravo Travel. Permite gestionar ventas complejas con múltiples pasajeros, servicios adicionales, pagos fraccionados y generación de recibos (ricevuta).

---

## 🏗️ Arquitectura del Módulo

### 1. **Modelo de Datos (Prisma Schema)**

#### Tabla Principal: `Biglietteria`
```prisma
model Biglietteria {
  id               String
  pagamento        String              // Estado de pago (Acconto, Ricevuto, etc.)
  data             DateTime            // Fecha de la venta
  pnr              String?             // Código PNR
  itinerario       String              // Itinerario del viaje
  metodoPagamento  String              // JSON array de métodos de pago
  cliente          String              // Nombre del cliente
  codiceFiscale    String              // Código fiscal
  indirizzo        String              // Dirección
  email            String              // Email
  numeroTelefono   String              // Teléfono
  creadoPor        String              // ID del usuario creador
  isActive         Boolean
  netoPrincipal    Float               // Total neto (suma de netos de pasajeros)
  vendutoTotal     Float               // Total vendido (suma de vendutos)
  acconto          Float               // Pago inicial
  daPagare         Float               // Saldo pendiente
  feeAgv           Float               // Fee/AGV calculado
  numeroPasajeros  Int                 // Cantidad de pasajeros
  numeroCuotas     Int?                // Número de cuotas
  notaDiVendita    String?             // Nota interna
  notaDiRicevuta    String?            // Nota para el recibo
  attachedFile     String?             // Archivo adjunto (Cloudinary URL)
  attachedFileName String?
  
  // Relaciones
  creator          User
  cuotas           Cuota[]             // Pagos fraccionados
  pasajeros        PasajeroBiglietteria[]  // Múltiples pasajeros
}
```

#### Tabla: `PasajeroBiglietteria`
Cada venta puede tener múltiples pasajeros, cada uno con sus propios servicios:

```prisma
model PasajeroBiglietteria {
  id                   String
  biglietteriaId       String
  nombrePasajero       String
  servizio             String              // Servicios separados por comas
  andata               DateTime?           // Fecha de ida
  ritorno              DateTime?          // Fecha de vuelta
  iata                 String?            // JSON con IATAs por servicio
  
  // Servicios principales con precios
  netoBiglietteria     Float?
  vendutoBiglietteria  Float?
  
  tieneExpress         Boolean?
  netoExpress          Float?
  vendutoExpress       Float?
  
  tienePolizza         Boolean?
  netoPolizza          Float?
  vendutoPolizza       Float?
  
  tieneLetteraInvito   Boolean?
  netoLetteraInvito    Float?
  vendutoLetteraInvito Float?
  
  tieneHotel           Boolean?
  netoHotel            Float?
  vendutoHotel         Float?
  
  estado               String              // Pendiente, Pagado
  fechaPago            DateTime?
  fechaActivacion      DateTime?
  notas                String?            // JSON con notas y servicios dinámicos
  
  // Relaciones
  biglietteria         Biglietteria
  serviciosDetalle     PasajeroServicioBiglietteria[]  // Detalles por servicio
}
```

#### Tabla: `PasajeroServicioBiglietteria`
Detalles individuales de cada servicio por pasajero:

```prisma
model PasajeroServicioBiglietteria {
  id               String
  pasajeroId       String
  servicio         String              // Nombre del servicio
  metodoDiAcquisto String?             // Método de compra
  andata           DateTime?
  ritorno          DateTime?
  iata             String?
  neto             Float?
  venduto          Float?
  estado           String              // Pendiente, Pagado
  fechaPago        DateTime?
  fechaActivacion  DateTime?
  notas            String?
}
```

#### Tabla: `Cuota`
Sistema de pagos fraccionados:

```prisma
model Cuota {
  id               String
  biglietteriaId   String
  numeroCuota      Int
  data             DateTime?
  prezzo           Float
  note             String?
  isPagato         Boolean
  attachedFile     String?             // Comprobante de pago
  attachedFileName String?
}
```

---

## 🔄 Flujo de Funcionamiento

### **1. Creación de una Venta (POST /api/biglietteria)**

#### Paso 1: Recepción de Datos
- El formulario envía `FormData` con:
  - Datos del cliente (nombre, código fiscal, dirección, etc.)
  - Fecha de venta, PNR, itinerario
  - Estado de pago (`pagamento`)
  - Métodos de pago (array JSON)
  - Número de pasajeros
  - Array JSON de pasajeros
  - Array JSON de cuotas
  - Archivos adjuntos

#### Paso 2: Procesamiento de Pasajeros
```typescript
// Cada pasajero puede tener:
- Nombre del pasajero
- Servicios seleccionados (array): ["Volo", "Express", "Polizza", "Lettera Invito", "Hotel"]
- Para cada servicio:
  * IATA específico
  * Precio neto
  * Precio venduto
  * Método de compra
- Fechas de ida y vuelta
- Estado y fechas de pago/activación
- Notas
```

#### Paso 3: Cálculo de Totales
```typescript
// El sistema calcula automáticamente:
netoPrincipal = suma de todos los netos de servicios de todos los pasajeros
vendutoTotal = suma de todos los vendutos de servicios de todos los pasajeros
feeAgv = vendutoTotal - netoPrincipal
daPagare = vendutoTotal - acconto
```

#### Paso 4: Construcción de Servicios Detalle
Para cada servicio seleccionado por cada pasajero, se crea un registro en `PasajeroServicioBiglietteria` con:
- Información específica del servicio
- IATA, precios, fechas
- Estado y fechas de seguimiento

#### Paso 5: Almacenamiento
- Se crea el registro principal en `Biglietteria`
- Se crean los pasajeros en `PasajeroBiglietteria`
- Se crean los detalles de servicios en `PasajeroServicioBiglietteria`
- Se crean las cuotas en `Cuota` (si aplica)
- Se suben archivos a Cloudinary

---

### **2. Visualización y Gestión (GET /api/biglietteria)**

#### Filtros Disponibles:
- **Por usuario**: Solo ventas del usuario actual (`userOnly=true`)
- **Por rango de fechas**: `fechaDesde` y `fechaHasta`
- **Por usuario específico**: `userId` (para dashboard)

#### Datos Incluidos:
- Información del cliente
- Totales calculados
- Lista de pasajeros con sus servicios
- Cuotas con estado de pago
- Información del creador

---

### **3. Edición de Venta (PUT /api/biglietteria/[id])**

#### Proceso:
1. Se obtiene el registro existente
2. Se eliminan todos los pasajeros y cuotas actuales
3. Se procesan los nuevos datos (igual que en creación)
4. Se recrean pasajeros y cuotas con los nuevos datos
5. Se actualiza el registro principal

**Nota**: La edición es destructiva (elimina y recrea relaciones) para mantener consistencia.

---

### **4. Actualización Parcial (PATCH /api/biglietteria/[id])**

Permite actualizar campos específicos sin recrear todo:
- Útil para cambios rápidos (ej: cambiar `pagamento`)
- **Restricción de roles**: Usuarios `USER` solo pueden usar "Acconto" o "Ricevuto" en `pagamento`

---

### **5. Eliminación (DELETE /api/biglietteria/[id])**

#### Proceso:
1. Se obtiene el registro completo con relaciones
2. Se registra en `AuditoriaEliminacion`:
   - Tipo: "biglietteria"
   - Datos completos del registro
   - Usuario que eliminó
   - IP y User Agent
3. Se elimina el registro (cascada elimina pasajeros y cuotas)

---

## 📄 Generación de Recibos (Ricevuta)

### Endpoint: `POST /api/biglietteria/generate-ricevuta`

#### Proceso:

1. **Obtención de Datos**:
   - Se obtiene el registro con todos los pasajeros y cuotas
   - Se extrae información del creador (agente)

2. **Procesamiento de Datos**:
   ```typescript
   // Combina todos los servicios únicos de todos los pasajeros
   servizioCombinado = servicios únicos separados por comas
   
   // Combina todos los nombres de pasajeros
   nombresPasajeros = nombres separados por comas
   
   // Formatea método de pago
   metodoPagamentoFormateado = array unido por comas
   ```

3. **Plantilla HTML**:
   - Ubicación: `public/templates/ricevuta-template-v3.html`
   - Sistema de placeholders tipo Handlebars:
     - `{{cliente}}`, `{{passeggero}}`, `{{pnr}}`, etc.
     - `{{#cuotas}}...{{/cuotas}}` para loops
     - `{{#tieneCuotas}}...{{/tieneCuotas}}` para condicionales

4. **Reemplazo de Placeholders**:
   - Se procesan arrays primero (cuotas, pasajeros)
   - Luego condicionales
   - Finalmente campos simples

5. **Generación de PDF**:
   - Usa Puppeteer (local) o Puppeteer-core con Chromium (producción)
   - Convierte HTML a PDF A4
   - Incluye logo en base64
   - Retorna PDF como respuesta

---

## 🎨 Interfaz de Usuario

### Página Principal: `/biglietteria`

#### Características:

1. **Tabla de Registros**:
   - Muestra todas las ventas con filtros
   - Columnas: Cliente, Fecha, PNR, Itinerario, Totales, Estado
   - Acciones: Ver, Editar, Eliminar, Generar Recibo

2. **Filtros**:
   - Por fecha (desde/hasta)
   - Por usuario creador (solo ADMIN/TI)
   - Por estado de pago (`pagamento`)
   - Búsqueda por texto (cliente, PNR, etc.)

3. **Formulario de Creación/Edición**:
   - **Sección Cliente**: 
     - Dropdown con búsqueda de clientes existentes
     - O campos manuales
   - **Sección Principal**:
     - Fecha, PNR, Itinerario
     - Estado de pago (dropdown)
     - Métodos de pago (multi-select)
     - Notas internas y externas
   - **Sección Pasajeros**:
     - Agregar múltiples pasajeros
     - Para cada pasajero:
       * Nombre
       * Servicios (multi-select)
       * Para cada servicio: IATA, Neto, Venduto, Método de compra
       * Fechas de ida/vuelta
       * Estado y fechas de seguimiento
   - **Sección Cuotas**:
     - Número de cuotas
     - Para cada cuota: Fecha, Precio, Notas, Archivo adjunto

4. **Tabla de Detalles de Pasajeros**:
   - Modal completo con todos los servicios de todos los pasajeros
   - Filtros avanzados:
     * Por IATA, PNR, Servicio, Estado
     * Por fechas (registro, ida, vuelta, activación)
   - Edición inline:
     * Estado (solo ADMIN/TI)
     * Fecha de pago (solo ADMIN/TI)
     * Fecha de activación (todos los usuarios)
     * Notas (todos los usuarios)
   - Exportación a Excel
   - Paginación y búsqueda

---

## 🔧 Funcionalidades Avanzadas

### 1. **Sistema de Servicios Dinámicos**

Además de los servicios predefinidos (Express, Polizza, Lettera Invito, Hotel), el sistema permite:
- Agregar servicios adicionales desde la tabla de `Servizio`
- Cada servicio dinámico puede tener:
  * IATA específico
  * Precio neto y venduto
  * Método de compra
- Se almacenan en `serviciosData` (JSON) dentro de las notas del pasajero

### 2. **Gestión de IATAs**

- Cada servicio puede tener su propio IATA
- Se almacenan como JSON en el campo `iata` del pasajero:
  ```json
  {
    "biglietteria": "MAD",
    "express": "BCN",
    "polizza": "ROM",
    "letteraInvito": "MIL",
    "hotel": "PAR"
  }
  ```

### 3. **Sistema de Notas**

Las notas pueden ser:
- **Texto simple**: Nota directa
- **JSON estructurado**: 
  ```json
  {
    "notasUsuario": "Nota del usuario",
    "serviciosDinamicos": {
      "servicio1": {
        "iata": "XXX",
        "neto": 100,
        "venduto": 150
      }
    }
  }
  ```

### 4. **Cálculo Automático de Totales**

El sistema calcula automáticamente:
- `netoPrincipal`: Suma de todos los netos
- `vendutoTotal`: Suma de todos los vendutos
- `feeAgv`: Diferencia (ganancia)
- `daPagare`: Saldo pendiente

---

## 🔐 Control de Acceso y Permisos

### Por Rol:

- **USER**:
  - Puede crear y editar sus propias ventas
  - Solo puede usar "Acconto" o "Ricevuto" en `pagamento`
  - Puede editar fechas de activación y notas en detalles

- **ADMIN**:
  - Acceso completo a todas las ventas
  - Puede usar cualquier valor en `pagamento`
  - Puede editar estados y fechas de pago

- **TI**:
  - Acceso completo
  - Mismas capacidades que ADMIN

---

## 📊 Integración con Dashboard

El módulo se integra con el dashboard (`/dashboard-viajes`):
- Muestra ventas por usuario
- Calcula FEE/AGV por período
- Gráficos de ventas
- Ranking de agentes

---

## 🚀 Optimizaciones Implementadas

1. **Índices de Base de Datos**:
   - `idx_biglietteria_cliente`
   - `idx_biglietteria_created_at`
   - `idx_biglietteria_data`
   - `idx_biglietteria_created_by`
   - `idx_biglietteria_active_data`

2. **Caché**:
   - Respuestas GET con `Cache-Control: private, max-age=15`
   - Caché de roles en localStorage

3. **Parsing Optimizado**:
   - Pre-parseado de `metodoPagamento` para evitar JSON.parse repetido
   - Normalización de datos en el frontend

---

## 📝 Archivos Clave

- **Frontend**: `src/app/(admin)/biglietteria/page.tsx` (5141 líneas)
- **API Principal**: `src/app/api/biglietteria/route.ts`
- **API por ID**: `src/app/api/biglietteria/[id]/route.ts`
- **Generación PDF**: `src/app/api/biglietteria/generate-ricevuta/route.ts`
- **Parsers**: `src/lib/biglietteria/parsers.ts`
- **Componente Detalles**: `src/components/PassengerDetailsTable.tsx`

---

## 🎯 Casos de Uso Principales

1. **Venta Simple**: Un pasajero, un servicio (Volo)
2. **Venta Múltiple**: Varios pasajeros, varios servicios
3. **Venta con Servicios Adicionales**: Express, Polizza, Hotel, etc.
4. **Venta con Cuotas**: Pago fraccionado en múltiples cuotas
5. **Seguimiento de Servicios**: Actualización de estados y fechas
6. **Generación de Recibos**: PDF profesional para el cliente

---

## ⚠️ Consideraciones Importantes

1. **Edición Destructiva**: Al editar, se eliminan y recrean pasajeros/cuotas
2. **Validación de Roles**: Restricciones en `pagamento` según rol
3. **Auditoría**: Todas las eliminaciones se registran
4. **Archivos**: Se almacenan en Cloudinary, no en el servidor
5. **Cálculos**: Los totales se calculan automáticamente, no se pueden editar manualmente

---

Este módulo es el corazón del sistema de ventas, permitiendo gestionar transacciones complejas con múltiples pasajeros, servicios y formas de pago de manera eficiente y organizada.

