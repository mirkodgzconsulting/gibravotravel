-- CreateTable (solo si no existe) - NO BORRA NADA
CREATE TABLE IF NOT EXISTS "auditoria_eliminaciones" (
    "id" TEXT NOT NULL,
    "tipoVenta" TEXT NOT NULL,
    "registroId" TEXT NOT NULL,
    "nombreCliente" TEXT NOT NULL,
    "datosRegistro" JSONB NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "usuarioNombre" TEXT,
    "usuarioEmail" TEXT,
    "fechaEliminacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "auditoria_eliminaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (solo si no existe) - NO BORRA NADA
CREATE INDEX IF NOT EXISTS "idx_auditoria_tipo_venta" ON "auditoria_eliminaciones"("tipoVenta");
CREATE INDEX IF NOT EXISTS "idx_auditoria_registro_id" ON "auditoria_eliminaciones"("registroId");
CREATE INDEX IF NOT EXISTS "idx_auditoria_usuario_id" ON "auditoria_eliminaciones"("usuarioId");
CREATE INDEX IF NOT EXISTS "idx_auditoria_fecha" ON "auditoria_eliminaciones"("fechaEliminacion");
CREATE INDEX IF NOT EXISTS "idx_auditoria_cliente" ON "auditoria_eliminaciones"("nombreCliente");

