-- Script para optimizar PostgreSQL para la aplicación
-- Ejecutar como superusuario (postgres)

-- 1. Aumentar conexiones máximas
ALTER SYSTEM SET max_connections = 200;

-- 2. Configurar pool de conexiones
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';

-- 3. Optimizar timeouts
ALTER SYSTEM SET statement_timeout = '30s';
ALTER SYSTEM SET idle_in_transaction_session_timeout = '10min';

-- 4. Configurar logging para debugging
ALTER SYSTEM SET log_statement = 'mod';
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1s

-- 5. Optimizar memoria
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';

-- 6. Configurar conexiones por usuario
-- Crear usuario específico para la aplicación si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'gibravotravel_user') THEN
        CREATE ROLE gibravotravel_user WITH LOGIN PASSWORD 'secure_password';
    END IF;
END
$$;

-- 7. Configurar límites de conexión por usuario
ALTER ROLE gibravotravel_user CONNECTION LIMIT 50;

-- 8. Otorgar permisos
GRANT CONNECT ON DATABASE gibravotravel TO gibravotravel_user;
GRANT USAGE ON SCHEMA public TO gibravotravel_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gibravotravel_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO gibravotravel_user;

-- 9. Aplicar cambios
SELECT pg_reload_conf();

-- 10. Verificar configuración
SELECT name, setting, unit, context 
FROM pg_settings 
WHERE name IN (
    'max_connections', 
    'shared_buffers', 
    'effective_cache_size', 
    'work_mem',
    'statement_timeout'
);

-- 11. Verificar conexiones actuales
SELECT 
    count(*) as total_connections,
    count(*) FILTER (WHERE state = 'active') as active_connections,
    count(*) FILTER (WHERE state = 'idle') as idle_connections,
    count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
FROM pg_stat_activity 
WHERE datname = current_database();
