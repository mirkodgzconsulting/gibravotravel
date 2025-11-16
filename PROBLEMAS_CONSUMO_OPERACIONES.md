# 🚨 PROBLEMAS ENCONTRADOS - Consumo Excesivo de Operaciones

## 📊 Resumen
**Uso Real:** 101,020 operaciones/mes  
**Uso Estimado Normal:** ~42,525 operaciones/mes  
**Diferencia:** +58,495 operaciones (138% más) ❌

---

## 🔴 PROBLEMA #1: Notificaciones - CRÍTICO ⚠️

### Ubicación: `src/components/header/NotificationDropdown.tsx`

**Problema:**
```typescript
// Línea 25-31
useEffect(() => {
  fetchNotificaciones();
  
  // Recargar cada 30 segundos
  const interval = setInterval(fetchNotificaciones, 30000);
  return () => clearInterval(interval);
}, []);
```

**Impacto:**
- ✅ Este componente está presente en **TODAS las 24 páginas** (header global)
- ✅ Se ejecuta cada **30 segundos** automáticamente
- ✅ Cada consulta hace **2 operaciones** (findUnique user + findMany notificaciones)

**Cálculo del consumo:**
- Por página: 2 ops cada 30 segundos = 4 ops/minuto = 240 ops/hora
- Con 24 páginas activas simultáneamente: 240 × 24 = **5,760 ops/hora**
- Por día (8 horas de uso): 5,760 × 8 = **46,080 ops/día**
- Por mes: 46,080 × 30 = **1,382,400 ops/mes** ❌❌❌

**Solución:**
1. Aumentar intervalo a **5 minutos** (300,000ms)
2. Agregar caché en el endpoint `/api/notificaciones`
3. Solo recargar cuando el usuario abra el dropdown

**Ahorro estimado:** ~1,300,000 ops/mes

---

## 🔴 PROBLEMA #2: Dashboard VIAJES - Consultas Múltiples

### Ubicación: `src/app/(admin)/dashboard-viajes/page.tsx`

**Problema:**
```typescript
// Línea 173-192
const monthPromises = Array.from({ length: 12 }, async (_, month) => {
  // Para CADA mes (12 meses) hace 3 consultas:
  const [biglietteriaRes, toursBusRes, toursAereoRes] = await Promise.all([
    fetch(`/api/biglietteria?fechaDesde=...&fechaHasta=...`),
    fetch(`/api/tour-bus?fechaDesde=...&fechaHasta=...`),
    fetch(`/api/tour-aereo?fechaDesde=...&fechaHasta=...`)
  ]);
});
```

**Impacto:**
- ✅ Cada carga del dashboard hace: **12 meses × 3 APIs = 36 consultas**
- ✅ Cada consulta hace ~2 operaciones = **72 operaciones por carga**
- ✅ Si se carga 5 veces/día: 72 × 5 = **360 ops/día**
- ✅ Mensual: **10,800 ops/mes**

**Solución:**
1. Hacer UNA sola consulta sin filtros de fecha y filtrar en el frontend
2. O hacer consultas solo para el año actual, no todos los meses
3. Agregar caché de 1-2 minutos

**Ahorro estimado:** ~8,000 ops/mes

---

## 🔴 PROBLEMA #3: useUserRole Sin Caché (ANTES)

### Ubicación: `src/hooks/useUserRole.ts`

**Problema (YA CORREGIDO):**
- Antes: Se ejecutaba en cada render de cada página
- 24 páginas × múltiples renders = cientos de consultas/día
- Sin caché: ~7,200 ops/mes

**Solución (YA IMPLEMENTADA):**
- ✅ Caché de 5 minutos implementado
- ✅ localStorage como fallback
- ✅ Reducción a ~1,440 ops/mes

**Ahorro:** ~5,760 ops/mes ✅

---

## 🔴 PROBLEMA #4: fetchData en Biglietteria - Dependencias

### Ubicación: `src/app/(admin)/biglietteria/page.tsx`

**Problema:**
```typescript
// Línea 1124-1126
useEffect(() => {
  fetchData();
}, [fetchData]); // fetchData cambia si roleLoading o isUser cambian
```

**Impacto:**
- Si `roleLoading` o `isUser` cambian, se vuelve a ejecutar
- Puede ejecutarse múltiples veces en una sola sesión
- 8 APIs × múltiples ejecuciones = consumo extra

**Solución:**
1. Usar dependencias más específicas
2. Agregar flag para evitar múltiples ejecuciones
3. Mejorar caché de 15s a 30-60s

**Ahorro estimado:** ~2,000 ops/mes

---

## 🔴 PROBLEMA #5: Componentes de Dashboard - Consultas Duplicadas

### Ubicación: `src/components/dashboard/*.tsx`

**Problema:**
- `AgentRankingChart.tsx`: Hace 3 consultas completas (biglietteria, tour-aereo, tour-bus)
- `TotalFeeCard.tsx`: Hace 3 consultas completas
- `ToursFeeCard.tsx`: Hace consultas adicionales
- Todos se ejecutan cuando se carga el dashboard

**Impacto:**
- Dashboard carga: 36 ops (problema #2) + 9 ops (componentes) = **45 ops por carga**
- 5 cargas/día = 225 ops/día = **6,750 ops/mes**

**Solución:**
1. Compartir datos entre componentes (Context API)
2. Hacer consultas una sola vez y pasar datos como props
3. Agregar caché compartido

**Ahorro estimado:** ~4,000 ops/mes

---

## 🔴 PROBLEMA #6: API Clients - Consulta N+1

### Ubicación: `src/app/api/clients/route.ts`

**Problema:**
```typescript
// Línea 44-73: Primero obtiene todos los clientes
const clients = await prisma.client.findMany({...});

// Línea 76-89: Luego obtiene los creadores por separado
const creators = await prisma.user.findMany({
  where: { clerkId: { in: creatorIds } }
});
```

**Impacto:**
- Hace 2 consultas cuando podría hacer 1 con `include`
- Se ejecuta cada vez que se carga la página de clientes
- ~3 ops por carga (podría ser 2)

**Solución:**
1. Usar `include` en la primera consulta
2. O usar `select` con relaciones

**Ahorro estimado:** ~500 ops/mes

---

## 📊 RESUMEN DE PROBLEMAS Y SOLUCIONES

| Problema | Consumo Actual | Consumo Optimizado | Ahorro |
|----------|----------------|-------------------|--------|
| **Notificaciones (cada 30s)** | ~1,382,400/mes | ~2,880/mes | **1,379,520** |
| Dashboard VIAJES (12 meses) | ~10,800/mes | ~2,000/mes | **8,800** |
| useUserRole (sin caché) | ~7,200/mes | ~1,440/mes | **5,760** ✅ |
| Biglietteria (múltiples ejec) | ~13,000/mes | ~11,000/mes | **2,000** |
| Componentes Dashboard | ~6,750/mes | ~2,750/mes | **4,000** |
| API Clients (N+1) | ~2,000/mes | ~1,500/mes | **500** |
| **TOTAL** | **~1,422,150/mes** | **~21,570/mes** | **~1,400,580** |

---

## 🎯 CONCLUSIÓN

**El problema principal es el componente de Notificaciones que se ejecuta cada 30 segundos en todas las páginas.**

Si se corrige solo ese problema, el consumo bajaría de **101,020 ops/mes** a aproximadamente **~25,000 ops/mes**, que está muy por debajo del límite de 100,000 ops/mes del plan Free.

---

## ✅ PRIORIDAD DE CORRECCIONES

1. **🔴 CRÍTICO:** Notificaciones - Cambiar intervalo a 5 minutos
2. **🟡 ALTO:** Dashboard VIAJES - Optimizar consultas de meses
3. **🟡 ALTO:** Componentes Dashboard - Compartir datos
4. **🟢 MEDIO:** Biglietteria - Mejorar dependencias
5. **🟢 BAJO:** API Clients - Optimizar consulta N+1

---

## 💡 RECOMENDACIONES ADICIONALES

1. **Monitorear uso en tiempo real:**
   - Agregar logging de operaciones por endpoint
   - Dashboard de métricas de uso

2. **Implementar rate limiting:**
   - Limitar recargas automáticas
   - Throttling en componentes que hacen polling

3. **Caché más agresivo:**
   - Aumentar TTL de datos de referencia (IATA, Servizi, etc.) a 5-10 minutos
   - Usar React Query o SWR para mejor gestión de caché

4. **Lazy loading:**
   - Cargar datos de dashboard solo cuando se visualiza
   - Cargar notificaciones solo cuando se abre el dropdown

