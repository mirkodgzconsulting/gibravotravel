-- =====================================================
-- SCRIPT DE MIGRACIÓN PARA PRODUCCIÓN
-- Gibravo Travel - Estructura completa de base de datos
-- =====================================================

-- CreateEnum
CREATE TYPE "TipoAsiento" AS ENUM ('NORMAL', 'PREMIUM', 'DISCAPACITADO', 'CONDUCTOR');

-- CreateEnum
CREATE TYPE "AgendaTipo" AS ENUM ('PERSONAL', 'REUNION', 'CITA', 'RECORDATORIO', 'TAREA');

-- CreateEnum
CREATE TYPE "VisibilidadAgenda" AS ENUM ('PRIVADO', 'PUBLICO');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'TI');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phoneNumber" TEXT,
    "photo" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departures" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3),
    "price" DOUBLE PRECISION,
    "capacity" INTEGER,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "info" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "textContent" TEXT NOT NULL,
    "coverImage" TEXT,
    "coverImageName" TEXT,
    "pdfFile" TEXT,
    "pdfFileName" TEXT,
    "createdBy" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "textContent" TEXT NOT NULL,
    "coverImage" TEXT,
    "coverImageName" TEXT,
    "pdfFile" TEXT,
    "pdfFileName" TEXT,
    "createdBy" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stops" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "textContent" TEXT NOT NULL,
    "coverImage" TEXT,
    "coverImageName" TEXT,
    "pdfFile" TEXT,
    "pdfFileName" TEXT,
    "createdBy" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fiscalCode" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "birthPlace" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "document1" TEXT,
    "document1Name" TEXT,
    "document2" TEXT,
    "document2Name" TEXT,
    "document3" TEXT,
    "document3Name" TEXT,
    "document4" TEXT,
    "document4Name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamento" (
    "id" TEXT NOT NULL,
    "pagamento" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iata" (
    "id" TEXT NOT NULL,
    "iata" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servizio" (
    "id" TEXT NOT NULL,
    "servizio" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servizio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metodo_pagamento" (
    "id" TEXT NOT NULL,
    "metodoPagamento" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metodo_pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biglietteria" (
    "id" TEXT NOT NULL,
    "pagamento" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "pnr" TEXT,
    "itinerario" TEXT NOT NULL,
    "metodoPagamento" TEXT NOT NULL,
    "cliente" TEXT NOT NULL,
    "codiceFiscale" TEXT NOT NULL,
    "indirizzo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "numeroTelefono" TEXT NOT NULL,
    "creadoPor" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "netoPrincipal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vendutoTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "acconto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "daPagare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feeAgv" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attachedFile" TEXT,
    "attachedFileName" TEXT,
    "numeroCuotas" INTEGER,
    "numeroPasajeros" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "biglietteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pasajeros_biglietteria" (
    "id" TEXT NOT NULL,
    "biglietteriaId" TEXT NOT NULL,
    "nombrePasajero" TEXT NOT NULL,
    "servizio" TEXT NOT NULL,
    "andata" TIMESTAMP(3),
    "ritorno" TIMESTAMP(3),
    "iata" TEXT,
    "netoBiglietteria" DOUBLE PRECISION,
    "vendutoBiglietteria" DOUBLE PRECISION,
    "tieneExpress" BOOLEAN DEFAULT false,
    "netoExpress" DOUBLE PRECISION,
    "vendutoExpress" DOUBLE PRECISION,
    "tienePolizza" BOOLEAN DEFAULT false,
    "netoPolizza" DOUBLE PRECISION,
    "vendutoPolizza" DOUBLE PRECISION,
    "tieneLetteraInvito" BOOLEAN DEFAULT false,
    "netoLetteraInvito" DOUBLE PRECISION,
    "vendutoLetteraInvito" DOUBLE PRECISION,
    "tieneHotel" BOOLEAN DEFAULT false,
    "netoHotel" DOUBLE PRECISION,
    "vendutoHotel" DOUBLE PRECISION,
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "fechaPago" TIMESTAMP(3),
    "fechaActivacion" TIMESTAMP(3),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pasajeros_biglietteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuotas" (
    "id" TEXT NOT NULL,
    "biglietteriaId" TEXT NOT NULL,
    "numeroCuota" INTEGER NOT NULL,
    "data" TIMESTAMP(3),
    "prezzo" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "isPagato" BOOLEAN NOT NULL DEFAULT false,
    "attachedFile" TEXT,
    "attachedFileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuotas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_bus" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "precioAdulto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "precioNino" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cantidadAsientos" INTEGER NOT NULL DEFAULT 53,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaViaje" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "acc" TEXT,
    "bus" DOUBLE PRECISION,
    "pasti" DOUBLE PRECISION,
    "parking" DOUBLE PRECISION,
    "coordinatore1" DOUBLE PRECISION,
    "coordinatore2" DOUBLE PRECISION,
    "ztl" DOUBLE PRECISION,
    "hotel" DOUBLE PRECISION,
    "polizza" DOUBLE PRECISION,
    "tkt" DOUBLE PRECISION,
    "autoservicio" TEXT,
    "feeAgv" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "coverImage" TEXT,
    "coverImageName" TEXT,
    "pdfFile" TEXT,
    "pdfFileName" TEXT,
    "descripcion" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tour_bus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tour_aereo" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "precioAdulto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "precioNino" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fechaViaje" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "meta" INTEGER NOT NULL DEFAULT 0,
    "acc" TEXT,
    "guidaLocale" DOUBLE PRECISION,
    "coordinatore" DOUBLE PRECISION,
    "transporte" DOUBLE PRECISION,
    "notas" TEXT,
    "notasCoordinador" TEXT,
    "feeAgv" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "coverImage" TEXT,
    "coverImageName" TEXT,
    "pdfFile" TEXT,
    "pdfFileName" TEXT,
    "descripcion" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tour_aereo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asientos_bus" (
    "id" TEXT NOT NULL,
    "tourBusId" TEXT NOT NULL,
    "numeroAsiento" INTEGER NOT NULL,
    "fila" INTEGER NOT NULL,
    "columna" TEXT NOT NULL,
    "tipo" "TipoAsiento" NOT NULL DEFAULT 'NORMAL',
    "isVendido" BOOLEAN NOT NULL DEFAULT false,
    "stato" TEXT NOT NULL DEFAULT 'Libero',
    "precioVenta" DOUBLE PRECISION,
    "fechaVenta" TIMESTAMP(3),
    "clienteNombre" TEXT,
    "clienteTelefono" TEXT,
    "clienteEmail" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asientos_bus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas_asientos" (
    "id" TEXT NOT NULL,
    "tourBusId" TEXT NOT NULL,
    "numeroAsiento" INTEGER NOT NULL,
    "clienteNombre" TEXT NOT NULL,
    "clienteTelefono" TEXT,
    "clienteEmail" TEXT,
    "precioVenta" DOUBLE PRECISION NOT NULL,
    "fechaVenta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodoPago" TEXT,
    "observaciones" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ventas_asientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas_tour_bus" (
    "id" TEXT NOT NULL,
    "tourBusId" TEXT NOT NULL,
    "clienteId" TEXT,
    "clienteNombre" TEXT NOT NULL,
    "codiceFiscale" TEXT NOT NULL,
    "indirizzo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "numeroTelefono" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "fermata" TEXT NOT NULL,
    "numeroAsiento" INTEGER NOT NULL,
    "tieneMascotas" BOOLEAN NOT NULL DEFAULT false,
    "numeroMascotas" INTEGER,
    "tieneInfantes" BOOLEAN NOT NULL DEFAULT false,
    "numeroInfantes" INTEGER,
    "totalAPagar" DOUBLE PRECISION NOT NULL,
    "acconto" DOUBLE PRECISION NOT NULL,
    "daPagare" DOUBLE PRECISION NOT NULL,
    "metodoPagamento" TEXT NOT NULL,
    "estadoPago" TEXT NOT NULL,
    "numeroAcompanantes" INTEGER NOT NULL DEFAULT 0,
    "numeroCuotas" INTEGER,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ventas_tour_bus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acompanantes_tour_bus" (
    "id" TEXT NOT NULL,
    "ventaTourBusId" TEXT NOT NULL,
    "clienteId" TEXT,
    "nombreCompleto" TEXT NOT NULL,
    "telefono" TEXT,
    "codiceFiscale" TEXT,
    "esAdulto" BOOLEAN NOT NULL DEFAULT true,
    "fermata" TEXT NOT NULL,
    "numeroAsiento" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acompanantes_tour_bus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuotas_tour_bus" (
    "id" TEXT NOT NULL,
    "ventaTourBusId" TEXT NOT NULL,
    "numeroCuota" INTEGER NOT NULL,
    "fechaPago" TIMESTAMP(3),
    "precioPagar" DOUBLE PRECISION NOT NULL,
    "metodoPagamento" TEXT NOT NULL,
    "isPagado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuotas_tour_bus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fermata_bus" (
    "id" TEXT NOT NULL,
    "fermata" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fermata_bus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stato_bus" (
    "id" TEXT NOT NULL,
    "stato" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stato_bus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas_tour_aereo" (
    "id" TEXT NOT NULL,
    "tourAereoId" TEXT NOT NULL,
    "clienteId" TEXT,
    "pasajero" TEXT NOT NULL,
    "codiceFiscale" TEXT NOT NULL,
    "indirizzo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "numeroTelefono" TEXT NOT NULL,
    "paisOrigen" TEXT NOT NULL,
    "iata" TEXT NOT NULL,
    "pnr" TEXT,
    "hotel" DOUBLE PRECISION,
    "transfer" DOUBLE PRECISION,
    "attachedFile" TEXT,
    "attachedFileName" TEXT,
    "venduto" DOUBLE PRECISION NOT NULL,
    "acconto" DOUBLE PRECISION NOT NULL,
    "daPagare" DOUBLE PRECISION NOT NULL,
    "metodoPagamento" TEXT NOT NULL,
    "metodoCompra" TEXT,
    "stato" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ventas_tour_aereo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuotas_venta_tour_aereo" (
    "id" TEXT NOT NULL,
    "ventaTourAereoId" TEXT NOT NULL,
    "numeroCuota" INTEGER NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "nota" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "attachedFile" TEXT,
    "attachedFileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cuotas_venta_tour_aereo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agendas_personales" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tipo" "AgendaTipo" NOT NULL DEFAULT 'PERSONAL',
    "color" TEXT NOT NULL DEFAULT 'bg-purple-200 text-gray-800',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "visibilidad" "VisibilidadAgenda" NOT NULL DEFAULT 'PRIVADO',

    CONSTRAINT "agendas_personales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recordatorios_agenda" (
    "id" TEXT NOT NULL,
    "agendaId" TEXT NOT NULL,
    "isActivo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "diasAntes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "recordatorios_agenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agendaId" TEXT,
    "mensaje" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'AGENDA',
    "isLeida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- =====================================================
-- ÍNDICES DE RENDIMIENTO
-- =====================================================

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "idx_users_email" ON "users"("email");
CREATE INDEX "idx_users_role" ON "users"("role");

CREATE UNIQUE INDEX "clients_email_key" ON "clients"("email");
CREATE UNIQUE INDEX "pagamento_pagamento_key" ON "pagamento"("pagamento");
CREATE UNIQUE INDEX "iata_iata_key" ON "iata"("iata");
CREATE UNIQUE INDEX "servizio_servizio_key" ON "servizio"("servizio");
CREATE UNIQUE INDEX "metodo_pagamento_metodoPagamento_key" ON "metodo_pagamento"("metodoPagamento");

CREATE INDEX "idx_biglietteria_cliente" ON "biglietteria"("cliente");
CREATE INDEX "idx_biglietteria_created_at" ON "biglietteria"("createdAt");
CREATE INDEX "idx_biglietteria_data" ON "biglietteria"("data");

CREATE INDEX "idx_pasajeros_biglietteria_estado" ON "pasajeros_biglietteria"("estado");
CREATE INDEX "idx_cuotas_is_pagato" ON "cuotas"("isPagato");

CREATE INDEX "idx_asientos_bus_estado" ON "asientos_bus"("stato");
CREATE UNIQUE INDEX "asientos_bus_tourBusId_numeroAsiento_key" ON "asientos_bus"("tourBusId", "numeroAsiento");

CREATE INDEX "idx_ventas_tour_bus_created_at" ON "ventas_tour_bus"("createdAt");
CREATE UNIQUE INDEX "fermata_bus_fermata_key" ON "fermata_bus"("fermata");
CREATE UNIQUE INDEX "stato_bus_stato_key" ON "stato_bus"("stato");
CREATE INDEX "idx_ventas_tour_aereo_created_at" ON "ventas_tour_aereo"("createdAt");

CREATE INDEX "idx_agendas_personales_fecha" ON "agendas_personales"("fecha");
CREATE INDEX "idx_agendas_personales_tipo" ON "agendas_personales"("tipo");
CREATE UNIQUE INDEX "recordatorios_agenda_agendaId_key" ON "recordatorios_agenda"("agendaId");
CREATE INDEX "idx_notificaciones_created_at" ON "notificaciones"("createdAt");

-- =====================================================
-- FOREIGN KEYS
-- =====================================================

-- AddForeignKey
ALTER TABLE "info" ADD CONSTRAINT "info_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "routes" ADD CONSTRAINT "routes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stops" ADD CONSTRAINT "stops_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "clients" ADD CONSTRAINT "clients_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "biglietteria" ADD CONSTRAINT "biglietteria_creadoPor_fkey" FOREIGN KEY ("creadoPor") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pasajeros_biglietteria" ADD CONSTRAINT "pasajeros_biglietteria_biglietteriaId_fkey" FOREIGN KEY ("biglietteriaId") REFERENCES "biglietteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cuotas" ADD CONSTRAINT "cuotas_biglietteriaId_fkey" FOREIGN KEY ("biglietteriaId") REFERENCES "biglietteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tour_bus" ADD CONSTRAINT "tour_bus_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tour_aereo" ADD CONSTRAINT "tour_aereo_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "asientos_bus" ADD CONSTRAINT "asientos_bus_tourBusId_fkey" FOREIGN KEY ("tourBusId") REFERENCES "tour_bus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ventas_asientos" ADD CONSTRAINT "ventas_asientos_tourBusId_fkey" FOREIGN KEY ("tourBusId") REFERENCES "tour_bus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ventas_tour_bus" ADD CONSTRAINT "ventas_tour_bus_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ventas_tour_bus" ADD CONSTRAINT "ventas_tour_bus_tourBusId_fkey" FOREIGN KEY ("tourBusId") REFERENCES "tour_bus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "acompanantes_tour_bus" ADD CONSTRAINT "acompanantes_tour_bus_ventaTourBusId_fkey" FOREIGN KEY ("ventaTourBusId") REFERENCES "ventas_tour_bus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cuotas_tour_bus" ADD CONSTRAINT "cuotas_tour_bus_ventaTourBusId_fkey" FOREIGN KEY ("ventaTourBusId") REFERENCES "ventas_tour_bus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ventas_tour_aereo" ADD CONSTRAINT "ventas_tour_aereo_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ventas_tour_aereo" ADD CONSTRAINT "ventas_tour_aereo_tourAereoId_fkey" FOREIGN KEY ("tourAereoId") REFERENCES "tour_aereo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cuotas_venta_tour_aereo" ADD CONSTRAINT "cuotas_venta_tour_aereo_ventaTourAereoId_fkey" FOREIGN KEY ("ventaTourAereoId") REFERENCES "ventas_tour_aereo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agendas_personales" ADD CONSTRAINT "agendas_personales_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recordatorios_agenda" ADD CONSTRAINT "recordatorios_agenda_agendaId_fkey" FOREIGN KEY ("agendaId") REFERENCES "agendas_personales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_agendaId_fkey" FOREIGN KEY ("agendaId") REFERENCES "agendas_personales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =====================================================
-- DATOS DE REFERENCIA INICIALES
-- =====================================================

-- Insertar datos de referencia básicos
INSERT INTO "pagamento" ("id", "pagamento", "isActive") VALUES 
('ref_pag_1', 'Efectivo', true),
('ref_pag_2', 'Transferencia', true),
('ref_pag_3', 'Tarjeta', true);

INSERT INTO "metodo_pagamento" ("id", "metodoPagamento", "isActive") VALUES 
('ref_met_1', 'Efectivo', true),
('ref_met_2', 'Transferencia Bancaria', true),
('ref_met_3', 'Tarjeta de Crédito', true),
('ref_met_4', 'Tarjeta de Débito', true);

INSERT INTO "servizio" ("id", "servizio", "isActive") VALUES 
('ref_serv_1', 'Vuelo', true),
('ref_serv_2', 'Hotel', true),
('ref_serv_3', 'Transfer', true),
('ref_serv_4', 'Excursión', true);

INSERT INTO "iata" ("id", "iata", "isActive") VALUES 
('ref_iata_1', 'FCO', true),
('ref_iata_2', 'MAD', true),
('ref_iata_3', 'BCN', true),
('ref_iata_4', 'LHR', true);

INSERT INTO "fermata_bus" ("id", "fermata", "isActive") VALUES 
('ref_ferm_1', 'Roma Termini', true),
('ref_ferm_2', 'Fiumicino', true),
('ref_ferm_3', 'Ciampino', true);

INSERT INTO "stato_bus" ("id", "stato", "isActive") VALUES 
('ref_stato_1', 'Libero', true),
('ref_stato_2', 'Ocupado', true),
('ref_stato_3', 'Reservado', true),
('ref_stato_4', 'Mantenimiento', true);

-- =====================================================
-- FIN DEL SCRIPT DE MIGRACIÓN
-- =====================================================
