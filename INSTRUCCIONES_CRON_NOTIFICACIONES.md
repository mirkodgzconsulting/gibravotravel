# 📋 Configuración del Cron Job de Notificaciones

## 🎯 Descripción

El sistema de notificaciones funciona mediante un cron job que ejecuta diariamente el endpoint `/api/cron/notificaciones`. Este job revisa todas las agendas personales con recordatorios activos y genera notificaciones según los días configurados (`diasAntes`).

## ⚙️ Configuración

### 1. Agregar Variable de Entorno

Agregar en `.env`:

```env
CRON_SECRET=tu_secret_seguro_aqui
```

### 2. Configurar Cron Job

#### ✅ Configuración Automática (Ya Implementada)

El cron job ya está configurado automáticamente en `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/notificaciones",
      "schedule": "0 1 * * *"
    }
  ]
}
```

Esto ejecutará el job **diariamente a las 01:00 UTC** (2:00 AM hora europea en verano).

**NOTA**: El cron solo funcionará cuando el proyecto esté desplegado en **Vercel**. Para desarrollo local, debes ejecutarlo manualmente.

#### Opción B: Cron Local (Para desarrollo/testing)

Usar el script `scripts/test-cron-notificaciones.js` para probar manualmente:

```bash
node scripts/test-cron-notificaciones.js
```

#### Opción C: External Cron Service

Usar servicios como:
- **cron-job.org**
- **EasyCron**
- **zapier.com**

Configurar para hacer POST a:
```
https://tu-dominio.com/api/cron/notificaciones
Authorization: Bearer tu_secret_seguro_aqui
```

## 📝 Cómo Funciona

1. **El cron job se ejecuta diariamente** a las 00:00
2. **Busca todas las agendas personales** con recordatorios activos
3. **Calcula la fecha de notificación**: `fechaAgenda - diasAntes`
4. **Si hoy es la fecha de notificación**, crea una notificación
5. **Evita duplicados**: no crea notificaciones si ya existe una para ese día

## 🧪 Testing Manual

Puedes probar el cron manualmente:

```bash
curl -X POST https://tu-dominio.com/api/cron/notificaciones \
  -H "Authorization: Bearer tu_secret_seguro_aqui"
```

O crear una agenda de prueba:

1. Crear agenda con fecha de hoy (diasAntes = 0)
2. Ejecutar el cron manualmente
3. Verificar que se creó la notificación

## 📊 Ejemplo de Uso

### Crear Agenda con Recordatorio

1. Ir a "CALENDARIO"
2. Click en "+ Nueva Agenda"
3. Completar datos:
   - Título: "Reunión con cliente"
   - Fecha: Mañana a las 10:00
   - Activar recordatorio: ✅
   - Días antes: 1 día

### Ver Notificación

1. El cron se ejecuta diariamente
2. Si hoy es el día anterior a la agenda, se crea la notificación
3. El usuario verá un badge rojo en el icono de notificaciones
4. Click para ver: "📅 Mañana: 'Reunión con cliente'"

## 🔒 Seguridad

El endpoint está protegido por el header `Authorization: Bearer {CRON_SECRET}`. Solo requests con el secret correcto pueden ejecutar el cron.

## ⚠️ Notas Importantes

- Las notificaciones son **SOLO para agendas personales**
- Los TOURS BUS y TOUR AEREO NO generan notificaciones
- Las notificaciones se eliminan automáticamente si se elimina la agenda (onDelete: Cascade)
- El sistema evita crear notificaciones duplicadas

## 🐛 Troubleshooting

### Las notificaciones no se crean

1. Verificar que el cron job está configurado correctamente
2. Verificar que `CRON_SECRET` está configurado en `.env`
3. Revisar logs del servidor para errores
4. Verificar que la agenda tiene `isActive: true` y `recordatorio.isActivo: true`

### Notificaciones duplicadas

El sistema tiene protección contra duplicados, pero si ocurre:
1. Verificar la lógica de `existeNotificacion`
2. Revisar si hay múltiples cron jobs ejecutándose
