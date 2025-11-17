# 📊 ANÁLISIS COMPLETO - Consumo de Base de Datos

## 🎯 OBJETIVO
Analizar todas las consultas a la base de datos para identificar oportunidades de optimización y asegurar que no se sobrepase el límite del plan contratado (Prisma Starter: 1M operaciones/mes).

---

## 📈 ESTADO ACTUAL DEL PLAN

**Plan Contratado:** Prisma Starter ($10 USD/mes)
- **Límite de Operaciones:** 1,000,000 ops/mes
- **Conexiones:** 10 conexiones simultáneas (configurado en `src/lib/prisma.ts`)
- **Uso Actual Estimado:** ~15,000-20,000 ops/mes (según análisis previo)

**Margen de Seguridad:** ~98% disponible ✅

---

## ✅ OPTIMIZACIONES YA IMPLEMENTADAS

### 1. **Notificaciones** ✅
- **Estado:** Optimizado
- **Implementación:** Solo 2 cargas al día (8 AM y 9 AM hora Italia)
- **Consumo:** ~360 ops/mes (vs 1,382,400 antes)
- **Ahorro:** 99.97% de reducción

### 2. **useUserRole Hook** ✅
- **Estado:** Optimizado con caché
- **Implementación:** Caché de 5 minutos + localStorage
- **Consumo:** ~1,440 ops/mes (vs 7,200 antes)
- **Ahorro:** 80% de reducción

### 3. **Conexiones a BD** ✅
- **Estado:** Configurado para plan Starter
- **Implementación:** 10 conexiones en producción (`src/lib/prisma.ts:26`)
- **Beneficio:** Permite más consultas simultáneas sin espera

### 4. **Caché con sessionStorage** ✅
- **Estado:** Implementado
- **Ubicación:** `src/utils/cachedFetch.ts`
- **Beneficio:** Caché persiste entre cold starts de Vercel

---

## 🔴 PROBLEMAS IDENTIFICADOS Y OPORTUNIDADES DE OPTIMIZACIÓN

### 🔴 PROBLEMA #1: Dashboard VIAJES - Consultas Múltiples por Mes

**Ubicación:** `src/app/(admin)/dashboard-viajes/page.tsx:173-192`

**Problema:**
```typescript
// Para CADA mes (12 meses) hace 3 consultas:
const monthPromises = Array.from({ length: 12 }, async (_, month) => {
  const [biglietteriaRes, toursBusRes, toursAereoRes] = await Promise.all([
    fetch(`/api/biglietteria?fechaDesde=...&fechaHasta=...`),
    fetch(`/api/tour-bus?fechaDesde=...&fechaHasta=...`),
    fetch(`/api/tour-aereo?fechaDesde=...&fechaHasta=...`)
  ]);
});
```

**Impacto:**
- Cada carga del dashboard: **12 meses × 3 APIs = 36 consultas**
- Cada consulta hace ~2-3 operaciones = **72-108 operaciones por carga**
- Si se carga 5 veces/día: 72 × 5 = **360 ops/día**
- Mensual: **~10,800 ops/mes**

**Solución Propuesta:**
1. Hacer UNA sola consulta sin filtros de fecha para cada tipo (biglietteria, tour-bus, tour-aereo)
2. Filtrar por mes en el frontend usando JavaScript
3. Agregar caché de 2-5 minutos para datos del dashboard

**Ahorro Estimado:** ~8,000 ops/mes (74% reducción)

**Prioridad:** 🔴 ALTA

---

### 🔴 PROBLEMA #2: Componentes Dashboard - Consultas Duplicadas

**Ubicaciones:**
- `src/components/dashboard/AgentRankingChart.tsx:68-72`
- `src/components/dashboard/TotalFeeCard.tsx:40-52`
- `src/components/dashboard/ToursFeeCard.tsx` (si existe)

**Problema:**
Cada componente hace sus propias consultas completas:
```typescript
// AgentRankingChart.tsx
const [biglietteriaResponse, tourAereoResponse, tourBusResponse] = await Promise.all([
  fetch(`/api/biglietteria${userIdParam}`),
  fetch(`/api/tour-aereo${userIdParam}`),
  fetch(`/api/tour-bus${userIdParam}`)
]);

// TotalFeeCard.tsx (hace lo mismo)
const biglietteriaResponse = await fetch(`/api/biglietteria${userIdParam}`);
const tourBusResponse = await fetch(`/api/tour-bus${userIdParam}`);
const tourAereoResponse = await fetch(`/api/tour-aereo${userIdParam}`);
```

**Impacto:**
- Dashboard carga: 36 ops (problema #1) + 9 ops (componentes) = **45 ops por carga**
- 5 cargas/día = 225 ops/día = **~6,750 ops/mes**

**Solución Propuesta:**
1. Crear un Context API para compartir datos del dashboard
2. Hacer consultas una sola vez en el componente padre (`dashboard-viajes/page.tsx`)
3. Pasar datos como props a los componentes hijos
4. Agregar caché compartido de 2-5 minutos

**Ahorro Estimado:** ~4,000 ops/mes (59% reducción en componentes)

**Prioridad:** 🔴 ALTA

---

### 🟡 PROBLEMA #3: API Clients - Consulta N+1

**Ubicación:** `src/app/api/clients/route.ts:44-89`

**Problema:**
```typescript
// Primero obtiene todos los clientes
const clients = await prisma.client.findMany({...});

// Luego obtiene los creadores por separado
const creators = await prisma.user.findMany({
  where: { clerkId: { in: creatorIds } }
});
```

**Impacto:**
- Hace 2 consultas cuando podría hacer 1 con `include`
- Se ejecuta cada vez que se carga la página de clientes
- ~3 ops por carga (podría ser 2)
- Si se carga 10 veces/día: 30 ops/día = **~900 ops/mes**

**Solución Propuesta:**
```typescript
// Usar include en la primera consulta
const clients = await prisma.client.findMany({
  where: whereCondition,
  include: {
    creator: {
      select: {
        clerkId: true,
        firstName: true,
        lastName: true,
        email: true,
      }
    }
  },
  orderBy: [...]
});
```

**Ahorro Estimado:** ~300 ops/mes (33% reducción)

**Prioridad:** 🟡 MEDIA

---

### 🟡 PROBLEMA #4: Tour Aereo/Bus - Consultas Separadas para Ventas

**Ubicación:** `src/app/api/tour-aereo/route.ts:212-249`

**Problema:**
```typescript
// Primero obtiene tours
const rawTours = await prisma.$queryRawUnsafe(sqlQuery, ...params);

// Luego obtiene ventas por separado
const ventas = await prisma.ventaTourAereo.findMany({
  where: { tourAereoId: { in: tourIds } }
});
```

**Impacto:**
- Hace 2 consultas cuando podría hacer 1 con JOIN
- Se ejecuta cada vez que se carga la página de tours
- ~4 ops por carga (podría ser 2-3)
- Si se carga 20 veces/día: 80 ops/día = **~2,400 ops/mes**

**Nota:** Este patrón se repite en `tour-bus/route.ts`

**Solución Propuesta:**
1. Usar `include` en Prisma cuando sea posible
2. O hacer un JOIN en la consulta SQL raw
3. Agregar caché de 30-60 segundos

**Ahorro Estimado:** ~800 ops/mes (33% reducción)

**Prioridad:** 🟡 MEDIA

---

### 🟡 PROBLEMA #5: Biglietteria - Múltiples Ejecuciones por Dependencias

**Ubicación:** `src/app/(admin)/biglietteria/page.tsx:1049-1177`

**Problema:**
```typescript
useEffect(() => {
  fetchData();
}, [fetchData]); // fetchData cambia si roleLoading o isUser cambian
```

**Impacto:**
- Si `roleLoading` o `isUser` cambian, se vuelve a ejecutar
- Puede ejecutarse múltiples veces en una sola sesión
- 8 APIs × múltiples ejecuciones = consumo extra
- **~2,000 ops/mes adicionales**

**Solución Propuesta:**
1. Usar dependencias más específicas: `[roleLoading, isUser]`
2. Agregar flag para evitar múltiples ejecuciones simultáneas
3. Mejorar caché de 30s a 60s para datos de referencia

**Ahorro Estimado:** ~1,000 ops/mes (50% reducción en ejecuciones extra)

**Prioridad:** 🟡 MEDIA

---

### 🟢 PROBLEMA #6: API Route - Consulta Separada para Creator

**Ubicación:** `src/app/api/route/route.ts:13-66`

**Problema:**
```typescript
// Primero obtiene templates
const templates = await prisma.route.findMany({...});

// Luego obtiene creadores por separado
const creators = await prisma.user.findMany({
  where: { clerkId: { in: creatorIds } }
});
```

**Impacto:**
- Similar al problema #3
- Se ejecuta raramente (página de rutas)
- **~100 ops/mes**

**Solución Propuesta:**
Usar `include` en la primera consulta

**Ahorro Estimado:** ~50 ops/mes

**Prioridad:** 🟢 BAJA

---

## 📊 RESUMEN DE CONSUMO ACTUAL Y PROYECTADO

### Consumo Actual Estimado (con optimizaciones ya implementadas):

| Componente | Consumo Mensual | Estado |
|------------|----------------|--------|
| Notificaciones | ~360 ops/mes | ✅ Optimizado |
| useUserRole | ~1,440 ops/mes | ✅ Optimizado |
| Dashboard VIAJES | ~10,800 ops/mes | 🔴 Por optimizar |
| Componentes Dashboard | ~6,750 ops/mes | 🔴 Por optimizar |
| Biglietteria | ~11,000 ops/mes | 🟡 Parcialmente optimizado |
| API Clients | ~900 ops/mes | 🟡 Por optimizar |
| Tour Aereo/Bus | ~2,400 ops/mes | 🟡 Por optimizar |
| Otras APIs | ~2,000 ops/mes | ✅ Normal |
| **TOTAL ACTUAL** | **~35,650 ops/mes** | **3.6% del límite** |

### Consumo Proyectado (después de optimizaciones):

| Componente | Consumo Optimizado | Ahorro |
|------------|-------------------|--------|
| Notificaciones | ~360 ops/mes | ✅ Ya optimizado |
| useUserRole | ~1,440 ops/mes | ✅ Ya optimizado |
| Dashboard VIAJES | ~2,800 ops/mes | -8,000 ops |
| Componentes Dashboard | ~2,750 ops/mes | -4,000 ops |
| Biglietteria | ~10,000 ops/mes | -1,000 ops |
| API Clients | ~600 ops/mes | -300 ops |
| Tour Aereo/Bus | ~1,600 ops/mes | -800 ops |
| Otras APIs | ~2,000 ops/mes | - |
| **TOTAL OPTIMIZADO** | **~21,550 ops/mes** | **-14,100 ops (39% reducción)** |

---

## 🎯 PLAN DE ACCIÓN RECOMENDADO

### Fase 1: Optimizaciones de Alto Impacto (Prioridad ALTA)

1. **Optimizar Dashboard VIAJES** 🔴
   - Hacer una sola consulta sin filtros de fecha
   - Filtrar por mes en el frontend
   - Agregar caché de 2-5 minutos
   - **Ahorro:** ~8,000 ops/mes

2. **Compartir Datos entre Componentes Dashboard** 🔴
   - Crear Context API para dashboard
   - Hacer consultas una sola vez en el padre
   - Pasar datos como props
   - **Ahorro:** ~4,000 ops/mes

**Total Fase 1:** -12,000 ops/mes (34% reducción)

### Fase 2: Optimizaciones de Impacto Medio (Prioridad MEDIA)

3. **Optimizar API Clients** 🟡
   - Usar `include` en lugar de consulta separada
   - **Ahorro:** ~300 ops/mes

4. **Optimizar Tour Aereo/Bus** 🟡
   - Usar `include` o JOIN en SQL
   - Agregar caché de 30-60s
   - **Ahorro:** ~800 ops/mes

5. **Optimizar Biglietteria** 🟡
   - Mejorar dependencias de useEffect
   - Aumentar TTL de caché
   - **Ahorro:** ~1,000 ops/mes

**Total Fase 2:** -2,100 ops/mes (6% reducción adicional)

### Fase 3: Optimizaciones Menores (Prioridad BAJA)

6. **Optimizar API Route** 🟢
   - Usar `include` en lugar de consulta separada
   - **Ahorro:** ~50 ops/mes

**Total Fase 3:** -50 ops/mes

---

## 📈 PROYECCIÓN FINAL

### Después de Todas las Optimizaciones:

- **Consumo Total:** ~21,550 ops/mes
- **Porcentaje del Límite:** 2.15% del límite (1M ops/mes)
- **Margen de Seguridad:** 97.85% disponible ✅
- **Reducción Total:** 39% menos operaciones

### Escalabilidad:

Con el consumo optimizado (~21,550 ops/mes), el sistema puede:
- ✅ Manejar **46x más carga** antes de alcanzar el límite
- ✅ Agregar nuevas funcionalidades sin preocupación
- ✅ Escalar a más usuarios sin problemas

---

## 🔍 ANÁLISIS DE CONSULTAS POR ENDPOINT

### Endpoints con Mayor Consumo:

1. **`/api/biglietteria`** - ~11,000 ops/mes
   - Se usa en múltiples páginas
   - Tiene caché de 15s (podría aumentarse a 30-60s)

2. **`/api/tour-aereo`** - ~4,200 ops/mes
   - Dashboard: 12 meses × 3 consultas = 36 consultas
   - Componentes: 3 consultas adicionales
   - Páginas individuales: ~20 consultas/día

3. **`/api/tour-bus`** - ~4,200 ops/mes
   - Similar a tour-aereo

4. **`/api/clients`** - ~900 ops/mes
   - Consulta N+1 (2 consultas cuando podría ser 1)

5. **`/api/notificaciones`** - ~360 ops/mes ✅
   - Ya optimizado (solo 2 veces al día)

### Endpoints con Caché Implementado:

- ✅ `/api/user/role` - Caché de 5 minutos
- ✅ `/api/notificaciones` - Caché de 30 minutos
- ✅ `/api/biglietteria` - Caché de 15 segundos (podría aumentarse)
- ⚠️ `/api/tour-aereo` - Sin caché explícito
- ⚠️ `/api/tour-bus` - Sin caché explícito
- ⚠️ `/api/clients` - Sin caché explícito

---

## 💡 RECOMENDACIONES ADICIONALES

### 1. **Agregar Caché a Endpoints Frecuentes**

Endpoints que deberían tener caché:
- `/api/tour-aereo` - 30-60 segundos
- `/api/tour-bus` - 30-60 segundos
- `/api/clients` - 2-5 minutos (datos de referencia)

### 2. **Monitoreo de Consumo**

Implementar logging para monitorear:
- Número de consultas por endpoint
- Tiempo de respuesta
- Uso de caché (hits/misses)

### 3. **Índices en Base de Datos**

Verificar que existan índices en:
- `fechaViaje` (tour_aereo, tour_bus)
- `data` (biglietteria)
- `createdBy` (todas las tablas)
- `isActive` (todas las tablas)

### 4. **Lazy Loading**

Considerar lazy loading para:
- Componentes de dashboard que no se ven inicialmente
- Datos históricos (años anteriores)

---

## ✅ CONCLUSIÓN

**Estado Actual:** ✅ **SALUDABLE**
- Consumo actual: ~35,650 ops/mes (3.6% del límite)
- Margen de seguridad: 96.4%

**Después de Optimizaciones:** ✅ **MUY SALUDABLE**
- Consumo proyectado: ~21,550 ops/mes (2.15% del límite)
- Margen de seguridad: 97.85%
- Reducción: 39% menos operaciones

**Recomendación:** 
Las optimizaciones propuestas son **opcionales pero recomendadas** para:
1. Mejorar rendimiento (menos latencia)
2. Reducir costos si se escala
3. Preparar el sistema para crecimiento futuro

**Prioridad de Implementación:**
1. 🔴 **ALTA:** Dashboard VIAJES y Componentes Dashboard (Fase 1)
2. 🟡 **MEDIA:** APIs individuales (Fase 2)
3. 🟢 **BAJA:** Optimizaciones menores (Fase 3)

---

**Fecha de Análisis:** 2025-01-17
**Plan Actual:** Prisma Starter ($10 USD/mes - 1M ops/mes)
**Estado:** ✅ Sistema saludable con margen amplio para crecimiento

