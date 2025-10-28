-- Script para hacer backup de datos de Biglietteria antes de la migración
-- Este script debe ejecutarse ANTES de hacer el reset

-- Crear tabla temporal para backup
CREATE TABLE IF NOT EXISTS biglietteria_backup AS 
SELECT * FROM biglietteria;

-- Verificar cuántos registros se respaldaron
SELECT COUNT(*) as total_registros_respaldados FROM biglietteria_backup;


