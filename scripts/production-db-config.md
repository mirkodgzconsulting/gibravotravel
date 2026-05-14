# Configuración de Base de Datos para Producción

## 🚨 PROBLEMA CRÍTICO IDENTIFICADO

El error "Too many database connections" indica un problema serio que **DEBE** resolverse antes de ir a producción.

## 📋 CHECKLIST PRE-PRODUCCIÓN

### 1. Configuración de PostgreSQL
```bash
# Ejecutar como superusuario
psql -U postgres -d gibravotravel -f scripts/optimize-postgresql.sql
```

### 2. Variables de Entorno para Producción
```env
# Base de datos con pool de conexiones
DATABASE_URL="postgresql://gibravotravel_user:secure_password@localhost:5432/gibravotravel?schema=public&connection_limit=20&pool_timeout=20"

# O para servicios como Railway/Heroku
DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require&connection_limit=10&pool_timeout=20"
```

### 3. Configuración de Servidor Web
```javascript
// next.config.ts
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  },
  // Configurar límites de memoria
  webpack: (config) => {
    config.externals.push({
      'pg-native': 'pg-native',
    })
    return config
  }
}
```

## 🔧 SOLUCIONES IMPLEMENTADAS

### 1. Singleton Pattern Robusto
- ✅ Una sola instancia de PrismaClient por proceso
- ✅ Manejo de reconexión automática
- ✅ Timeouts configurados

### 2. Middleware de Base de Datos
- ✅ Verificación de conexión antes de cada request
- ✅ Reconexión automática en caso de error
- ✅ Métricas de conexión

### 3. Health Check Endpoint
- ✅ `/api/health/database` para monitoreo
- ✅ Métricas de conexiones activas
- ✅ Detección temprana de problemas

## 📊 MONITOREO EN PRODUCCIÓN

### Endpoints de Monitoreo
```bash
# Verificar salud de la base de datos
curl https://www.gibravo.it/api/health/database

# Respuesta esperada:
{
  "database": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  "metrics": {
    "total_connections": 5,
    "active_connections": 2,
    "idle_connections": 3
  }
}
```

### Alertas Recomendadas
- ❌ `active_connections > 80%` del límite
- ❌ `idle_connections > 50` por más de 5 minutos
- ❌ Queries que tomen más de 5 segundos
- ❌ Errores de conexión > 5% de requests

## 🚀 DEPLOYMENT CHECKLIST

### Antes de Deployar:
- [ ] Ejecutar `scripts/optimize-postgresql.sql`
- [ ] Configurar variables de entorno de producción
- [ ] Probar health check endpoint
- [ ] Configurar monitoreo de conexiones
- [ ] Establecer alertas

### Después de Deployar:
- [ ] Verificar métricas de conexión
- [ ] Monitorear logs de errores
- [ ] Probar carga con múltiples usuarios
- [ ] Verificar que no hay memory leaks

## ⚠️ ADVERTENCIAS

1. **NUNCA** deployar sin resolver este problema
2. **SIEMPRE** monitorear conexiones en producción
3. **CONFIGURAR** alertas para conexiones altas
4. **PROBAR** con carga real antes de lanzar

## 🔍 DEBUGGING

### Si el problema persiste:
```bash
# Verificar conexiones actuales
psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'gibravotravel';"

# Ver queries lentas
psql -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Verificar configuración
psql -c "SELECT name, setting FROM pg_settings WHERE name LIKE '%connection%';"
```
