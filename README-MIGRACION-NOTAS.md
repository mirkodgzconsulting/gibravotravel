# Migración de Campos de Notas - Producción

## 📋 Resumen

Esta migración agrega campos de notas a las tablas `ventas_tour_bus` y `tour_bus` sin borrar ningún dato existente.

## 🔄 Campos Agregados

### Tabla: `ventas_tour_bus`
- `notaEsternaRicevuta` (TEXT, nullable)
- `notaInterna` (TEXT, nullable)

### Tabla: `tour_bus`
- `notas` (TEXT, nullable)
- `notasCoordinador` (TEXT, nullable)

## ✅ Características de Seguridad

- ✅ **No borra datos**: Solo agrega columnas nuevas
- ✅ **Idempotente**: Se puede ejecutar múltiples veces sin problemas
- ✅ **Verificación previa**: Verifica si las columnas ya existen antes de agregarlas
- ✅ **Transaccional**: Usa transacciones para garantizar atomicidad
- ✅ **Logs detallados**: Proporciona información clara del proceso

## 🚀 Ejecución Automática

La migración se ejecuta automáticamente durante el despliegue en producción a través del script `post-install-production.js`.

## 🔧 Ejecución Manual

### Opción 1: Script Node.js (Recomendado)
```bash
npm run migrate:notas
```

### Opción 2: SQL Directo
```bash
# Conectarse a la base de datos y ejecutar:
psql $DATABASE_URL -f scripts/migrate-production-notas.sql
```

### Opción 3: Script Node.js con SQL
```bash
npm run migrate:notas:sql
```

## 📝 Verificación

Después de ejecutar la migración, puedes verificar que las columnas fueron agregadas:

```sql
-- Verificar columnas en ventas_tour_bus
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'ventas_tour_bus' 
AND column_name IN ('notaEsternaRicevuta', 'notaInterna');

-- Verificar columnas en tour_bus
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'tour_bus' 
AND column_name IN ('notas', 'notasCoordinador');
```

## ⚠️ Notas Importantes

1. **Datos existentes**: Los registros existentes tendrán `NULL` en estos campos (es normal)
2. **No destructivo**: Esta migración NO modifica ni elimina datos existentes
3. **Reversible**: Si necesitas revertir, puedes eliminar las columnas manualmente (aunque no es necesario)

## 🔍 Archivos de Migración

- `prisma/migrations/20250117000000_add_notas_to_venta_tour_bus/migration.sql`
- `prisma/migrations/20250117000001_add_notas_to_tour_bus/migration.sql`
- `scripts/migrate-production-notas-safe.js` (Script seguro para producción)
- `scripts/migrate-production-notas.sql` (SQL directo)

## 📞 Soporte

Si encuentras algún problema durante la migración:
1. Verifica los logs del script
2. Revisa que la conexión a la base de datos sea correcta
3. Verifica que tengas permisos para alterar las tablas

