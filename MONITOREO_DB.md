# 📊 Guía de Monitoreo de Base de Datos

## Endpoint de Health Check
```
https://systems.gibravo.it/api/health/database
```

## Interpretación de Métricas

### ✅ Estado Normal
```json
{
  "status": "healthy",
  "database": { "status": "connected" },
  "metrics": {
    "total_connections": 8-20,        // ✅ Normal
    "active_connections": 1-3,        // ✅ Normal
    "idle_connections": 5-17          // ✅ Normal
  }
}
```

### ⚠️ Advertencia (Monitorear)
```json
{
  "status": "healthy",
  "metrics": {
    "total_connections": 25-35,       // ⚠️ Monitorear
    "active_connections": 10-15,      // ⚠️ Mucha actividad
    "idle_connections": 5-10          // ⚠️ Pool siendo usado
  }
}
```
**Acción**: Verificar si hay lentitud en la app. Considerar si hay queries lentas.

### 🚨 Crítico (Acción Inmediata)
```json
{
  "status": "healthy",
  "metrics": {
    "total_connections": 40+,         // 🚨 CRÍTICO
    "active_connections": 35+,        // 🚨 Pool saturado
    "idle_connections": 0-5           // 🚨 Sin conexiones libres
  }
}
```
**Acción**: 
- Verificar logs de Vercel para queries lentas
- Posible necesidad de escalamiento de plan
- Revisar si algún usuario está haciendo queries pesadas

### 💥 Crítico (Sistema Caído)
```json
{
  "status": "unhealthy",              // 💥 Sistema caído
  "error": "Health check failed",
  "details": "Connection timeout"
}
```
**Acción**: 
- Verificar estado de Vercel
- Verificar estado de Prisma Accelerate
- Revisar logs de errores

## Configuración Recomendada para Uptime Robot

1. **URL**: `https://systems.gibravo.it/api/health/database`
2. **Tipo**: HTTPS
3. **Intervalo**: Cada 5 minutos
4. **Alertas**:
   - Si `status` != "healthy" → Email inmediato
   - Si `total_connections` > 40 → Email de advertencia
   - Si timeout → Email crítico

## Límites de Tu Plan (Prisma Accelerate Gratuito)
- **Máximo**: 100 conexiones simultáneas
- **Tu configuración**: connection_limit=5 (por instancia cliente)
- **Recomendado**: Mantener < 50 para margen de seguridad

## Acciones Preventivas

1. ✅ **Singleton de PrismaClient** (Ya implementado)
2. ✅ **Connection pooling** con límite (Ya configurado)
3. ✅ **Reconexión automática** (Implementado)
4. 📊 **Monitoreo activo** (Configurar en Uptime Robot)
5. 📋 **Logs de queries lentas** (Revisar periódicamente en Vercel)

## Sistema de Reconexión Automática

### 🔄 Reconexión Automática
El sistema detecta automáticamente saturación crítica y reinicia las conexiones:

**Condiciones de activación:**
- `total_connections >= 45` → Reconexión automática inmediata
- `total_connections >= 35 && active_connections >= 30` → Advertencia
- Timeout en health check → Intento de reconexión

**Límites de seguridad:**
- Máximo 3 intentos de reconexión por minuto
- Espera de 1 segundo entre intentos
- No bloquea el sistema con reintentos infinitos

### 🔧 Reconexión Manual
Si necesitas forzar una reconexión manual:

```bash
POST https://systems.gibravo.it/api/health/reconnect
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Database reconnected successfully",
  "timestamp": "2025-10-31T..."
}
```

## Contacto para Problemas
- Dashboard Vercel: https://vercel.com/dashboard
- Logs en tiempo real: Vercel → Tu app → Functions → Logs
- Prisma Dashboard: https://accelerate.prisma.io/

