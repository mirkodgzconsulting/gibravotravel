-- =====================================================
-- SCRIPT DE ÍNDICES DE RENDIMIENTO - GIBRAVO TRAVEL
-- =====================================================
-- Este script SOLO AGREGA índices, no modifica existentes
-- Todos los índices usan CONCURRENTLY para no bloquear la BD

-- =====================================================
-- ÍNDICES PARA BIGLIETTERIA
-- =====================================================

-- Índice para filtros por fecha (usado en dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_biglietteria_fecha 
ON biglietteria(data);

-- Índice para filtros por usuario creador
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_biglietteria_creado_por 
ON biglietteria(creado_por);

-- Índice para filtros por estado activo
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_biglietteria_is_active 
ON biglietteria("isActive");

-- Índice compuesto para consultas frecuentes del dashboard
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_biglietteria_fecha_activo 
ON biglietteria(data, "isActive");

-- =====================================================
-- ÍNDICES PARA TOURS BUS
-- =====================================================

-- Índice para filtros por fecha de viaje
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tour_bus_fecha_viaje 
ON tour_bus("fechaViaje");

-- Índice para filtros por fecha de fin
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tour_bus_fecha_fin 
ON tour_bus("fechaFin");

-- Índice para filtros por creador
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tour_bus_created_by 
ON tour_bus("createdBy");

-- Índice para filtros por estado activo
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tour_bus_is_active 
ON tour_bus("isActive");

-- =====================================================
-- ÍNDICES PARA VENTAS TOUR BUS
-- =====================================================

-- Índice para filtros por fecha de creación
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ventas_tour_bus_fecha 
ON ventas_tour_bus("createdAt");

-- Índice para filtros por tour bus
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ventas_tour_bus_tour_id 
ON ventas_tour_bus("tourBusId");

-- Índice para filtros por creador
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ventas_tour_bus_created_by 
ON ventas_tour_bus("createdBy");

-- Índice para filtros por estado de pago
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ventas_tour_bus_estado_pago 
ON ventas_tour_bus("estadoPago");

-- =====================================================
-- ÍNDICES PARA TOURS AEREO
-- =====================================================

-- Índice para filtros por fecha de viaje
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tour_aereo_fecha_viaje 
ON tour_aereo("fechaViaje");

-- Índice para filtros por fecha de fin
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tour_aereo_fecha_fin 
ON tour_aereo("fechaFin");

-- Índice para filtros por creador
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tour_aereo_created_by 
ON tour_aereo("createdBy");

-- =====================================================
-- ÍNDICES PARA VENTAS TOUR AEREO
-- =====================================================

-- Índice para filtros por fecha de creación
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ventas_tour_aereo_fecha 
ON ventas_tour_aereo("createdAt");

-- Índice para filtros por tour aereo
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ventas_tour_aereo_tour_id 
ON ventas_tour_aereo("tourAereoId");

-- Índice para filtros por creador
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ventas_tour_aereo_created_by 
ON ventas_tour_aereo("createdBy");

-- =====================================================
-- ÍNDICES PARA AGENDAS PERSONALES
-- =====================================================

-- Índice para filtros por fecha (usado en calendario)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agendas_fecha 
ON agendas_personales(fecha);

-- Índice para filtros por creador
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agendas_created_by 
ON agendas_personales("createdBy");

-- Índice para filtros por tipo
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agendas_tipo 
ON agendas_personales(tipo);

-- Índice para filtros por estado activo
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agendas_is_active 
ON agendas_personales("isActive");

-- =====================================================
-- ÍNDICES PARA NOTIFICACIONES
-- =====================================================

-- Índice para filtros por usuario (usado en header)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notificaciones_user_id 
ON notificaciones("userId");

-- Índice para filtros por estado leído
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notificaciones_is_leida 
ON notificaciones("isLeida");

-- Índice para filtros por tipo
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notificaciones_tipo 
ON notificaciones(tipo);

-- Índice compuesto para consultas frecuentes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notificaciones_user_leida 
ON notificaciones("userId", "isLeida");

-- =====================================================
-- ÍNDICES PARA ASIENTOS BUS
-- =====================================================

-- Índice para filtros por tour bus
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_asientos_tour_bus_id 
ON asientos_bus("tourBusId");

-- Índice para filtros por estado de venta
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_asientos_is_vendido 
ON asientos_bus("isVendido");

-- Índice para filtros por número de asiento
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_asientos_numero 
ON asientos_bus("numeroAsiento");

-- =====================================================
-- ÍNDICES PARA PASAJEROS BIGLIETTERIA
-- =====================================================

-- Índice para filtros por biglietteria
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pasajeros_biglietteria_id 
ON pasajeros_biglietteria("biglietteriaId");

-- Índice para filtros por estado
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pasajeros_estado 
ON pasajeros_biglietteria(estado);

-- =====================================================
-- ÍNDICES PARA CUOTAS
-- =====================================================

-- Índice para filtros por biglietteria
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cuotas_biglietteria_id 
ON cuotas("biglietteriaId");

-- Índice para filtros por estado de pago
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cuotas_is_pagato 
ON cuotas("isPagato");

-- =====================================================
-- ÍNDICES PARA USUARIOS
-- =====================================================

-- Índice para filtros por rol (usado en autorización)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role 
ON users(role);

-- Índice para filtros por estado activo
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_is_active 
ON users("isActive");

-- =====================================================
-- ÍNDICES PARA CLIENTES
-- =====================================================

-- Índice para filtros por creador
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_created_by 
ON clients("createdBy");

-- Índice para filtros por estado activo
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_is_active 
ON clients("isActive");

-- Índice para búsquedas por nombre
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_nombre 
ON clients("firstName", "lastName");

-- =====================================================
-- VERIFICACIÓN DE ÍNDICES CREADOS
-- =====================================================

-- Consulta para verificar que los índices se crearon correctamente
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
