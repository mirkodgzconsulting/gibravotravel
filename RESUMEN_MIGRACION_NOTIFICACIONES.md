# 📋 Resumen de Migración: Recordatorios de Minutos a Días

## ✅ Cambios Realizados

### 1. **Schema de Prisma** (`prisma/schema.prisma`)
- Cambiado `minutosAntes` → `diasAntes` en el modelo `RecordatorioAgenda`
- Tipo: `Int` con valor por defecto `0` (0 = mismo día, 1-5 = días antes)

### 2. **Frontend** (`src/app/(admin)/calendario/page.tsx`)
- Actualizado `TourEvent` interface: `minutosAntes` → `diasAntes`
- Modificado modal de agenda:
  - Opciones de recordatorio: "Mismo día", "1-5 días antes"
  - Reemplazadas opciones de minutos/horas por días

### 3. **API Routes**
- `src/app/api/calendario/route.ts`: Actualizado select de recordatorio
- `src/app/api/agendas-personales/route.ts`: Cambiado a `diasAntes`
- `src/app/api/agendas-personales/[id]/route.ts`: Cambiado a `diasAntes`

### 4. **Base de Datos**
- Ejecutado `prisma db push --accept-data-loss`
- Columna `minutosAntes` eliminada
- Columna `diasAntes` creada
- Registros existentes actualizados a `diasAntes = 0` (mismo día)

### 5. **Scripts de Migración**
- `scripts/migrate-recordatorio-dias.js`: Script para convertir minutos a días
- `scripts/recreate-recordatorios.js`: Script para recrear recordatorios con nuevo campo

## 📝 Próximos Pasos

### Sistema de Notificaciones (Pendiente)

1. **Crear tabla `Notificacion`** en Prisma schema
2. **API Endpoints**:
   - `GET /api/notificaciones` - Obtener notificaciones del usuario
   - `POST /api/notificaciones/marcar-todas` - Marcar todas como leídas
   - `POST /api/notificaciones/[id]/leer` - Marcar una como leída
   - `POST /api/cron/notificaciones` - Generar notificaciones pendientes

3. **Cron Job**:
   - Ejecutar diariamente a las 00:00
   - Calcular qué agendas tienen recordatorio activo
   - Crear notificaciones según `diasAntes`

4. **Componente de Notificaciones**:
   - Actualizar `src/components/header/NotificationDropdown.tsx`
   - Mostrar notificaciones reales del usuario
   - Badge con contador de no leídas

## ⚠️ Notas Importantes

- Las notificaciones serán **SOLO para agendas personales**
- TOURS BUS y TOUR AÉREO NO tendrán notificaciones
- El sistema de recordatorios es por **días**, no por minutos/horas
- Opciones disponibles: 0 (mismo día), 1, 2, 3, 4, 5 días antes

## 🧪 Testing

Para probar:
1. Crear una agenda personal con recordatorio activo
2. Seleccionar "1 día antes"
3. El sistema debería crear una notificación el día anterior al evento
4. La notificación aparecerá en el dropdown del header


