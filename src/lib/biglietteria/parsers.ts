import type { Prisma } from '@prisma/client';
import type { UploadApiResponse } from 'cloudinary';

export interface ServicioExtraForm extends Record<string, unknown> {
  iata?: unknown;
  neto?: unknown;
  venduto?: unknown;
  metodoDiAcquisto?: unknown;
}

export interface ServicioDetalleFormPayload extends Record<string, unknown> {
  servicio?: unknown;
  metodoDiAcquisto?: unknown;
  andata?: unknown;
  ritorno?: unknown;
  iata?: unknown;
  neto?: unknown;
  venduto?: unknown;
  estado?: unknown;
  fechaPago?: unknown;
  fechaActivacion?: unknown;
  notas?: unknown;
}

export interface PasajeroFormPayload extends Record<string, unknown> {
  nombrePasajero?: unknown;
  servicios?: unknown;
  servizio?: unknown;
  serviciosDetalle?: unknown;
  serviciosData?: Record<string, ServicioExtraForm>;
  notas?: unknown;
  estado?: unknown;
  fechaPago?: unknown;
  fechaActivacion?: unknown;
  andata?: unknown;
  ritorno?: unknown;
  iata?: unknown;
  iataBiglietteria?: unknown;
  iataExpress?: unknown;
  iataPolizza?: unknown;
  iataLetteraInvito?: unknown;
  iataHotel?: unknown;
  netoBiglietteria?: unknown;
  vendutoBiglietteria?: unknown;
  tieneExpress?: unknown;
  netoExpress?: unknown;
  vendutoExpress?: unknown;
  tienePolizza?: unknown;
  netoPolizza?: unknown;
  vendutoPolizza?: unknown;
  tieneLetteraInvito?: unknown;
  netoLetteraInvito?: unknown;
  vendutoLetteraInvito?: unknown;
  tieneHotel?: unknown;
  netoHotel?: unknown;
  vendutoHotel?: unknown;
  metodoAcquistoBiglietteria?: unknown;
  metodoAcquistoExpress?: unknown;
  metodoAcquistoPolizza?: unknown;
  metodoAcquistoLetteraInvito?: unknown;
  metodoAcquistoHotel?: unknown;
}

export interface ServicioDetalleNormalized {
  servicio: string;
  metodoDiAcquisto: string | null;
  andata: Date | null;
  ritorno: Date | null;
  iata: string | null;
  neto: number | null;
  venduto: number | null;
  estado: string;
  fechaPago: Date | null;
  fechaActivacion: Date | null;
  notas: string | null;
}

export interface ServicioExtraNormalized {
  iata: string | null;
  neto: number | null;
  venduto: number | null;
  metodoDiAcquisto: string | null;
}

export interface CuotaFormPayload extends Record<string, unknown> {
  numeroCuota?: unknown;
  data?: unknown;
  prezzo?: unknown;
  note?: unknown;
  isPagato?: unknown;
  attachedFile?: unknown;
  attachedFileName?: unknown;
}

export interface CuotaNormalized {
  numeroCuota: number;
  data: Date | null;
  prezzo: number;
  note: string | null;
  isPagato: boolean;
  attachedFile: string | null;
  attachedFileName: string | null;
}

export interface PasajeroBuildResult {
  createInput: Prisma.PasajeroBiglietteriaCreateWithoutBiglietteriaInput;
  netoContribution: number;
  vendutoContribution: number;
}

export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const toSafeString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
};

export const toNullableString = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
};

export const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['true', '1', 'si', 'sí', 'yes'].includes(normalized);
  }
  return false;
};

export const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const normalized = trimmed.replace(',', '.');
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

export const toIntegerOrNull = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

export const parseDateOrNull = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
};

export const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item : toSafeString(item)))
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
};

const normalizeServicioDetalle = (
  detalle: ServicioDetalleFormPayload
): ServicioDetalleNormalized | null => {
  const servicio = toNullableString(detalle.servicio);
  if (!servicio) {
    return null;
  }

  return {
    servicio,
    metodoDiAcquisto: toNullableString(detalle.metodoDiAcquisto),
    andata: parseDateOrNull(detalle.andata),
    ritorno: parseDateOrNull(detalle.ritorno),
    iata: toNullableString(detalle.iata),
    neto: toNumberOrNull(detalle.neto),
    venduto: toNumberOrNull(detalle.venduto),
    estado: toNullableString(detalle.estado) ?? 'Pendiente',
    fechaPago: parseDateOrNull(detalle.fechaPago),
    fechaActivacion: parseDateOrNull(detalle.fechaActivacion),
    notas: toNullableString(detalle.notas),
  };
};

export const normalizeServiciosDetalleArray = (
  value: unknown
): ServicioDetalleNormalized[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isPlainObject(item)) {
        return null;
      }
      return normalizeServicioDetalle(item as ServicioDetalleFormPayload);
    })
    .filter((detalle): detalle is ServicioDetalleNormalized => detalle !== null);
};

export const normalizeServiciosData = (
  value: Record<string, ServicioExtraForm> | undefined
): Map<string, ServicioExtraNormalized> => {
  if (!value) {
    return new Map();
  }

  return Object.entries(value).reduce<Map<string, ServicioExtraNormalized>>((acc, [key, data]) => {
    if (!isPlainObject(data)) {
      return acc;
    }

    acc.set(key.toLowerCase(), {
      iata: toNullableString(data.iata),
      neto: toNumberOrNull(data.neto),
      venduto: toNumberOrNull(data.venduto),
      metodoDiAcquisto: toNullableString(data.metodoDiAcquisto),
    });
    return acc;
  }, new Map());
};

export const extractServiciosSeleccionados = (
  pasajero: PasajeroFormPayload
): string[] => {
  const servicios = toStringArray(pasajero.servicios);
  if (servicios.length > 0) {
    return servicios;
  }
  return toStringArray(pasajero.servizio);
};

export const normalizeCuota = (
  cuota: CuotaFormPayload,
  fallbackNumero: number
): CuotaNormalized => {
  const numeroCuota = toIntegerOrNull(cuota.numeroCuota) ?? fallbackNumero;
  const prezzo = toNumberOrNull(cuota.prezzo) ?? 0;
  return {
    numeroCuota,
    data: parseDateOrNull(cuota.data),
    prezzo,
    note: toNullableString(cuota.note),
    isPagato: toBoolean(cuota.isPagato),
    attachedFile: toNullableString(cuota.attachedFile),
    attachedFileName: toNullableString(cuota.attachedFileName),
  };
};

export const parseUploadResult = (
  resolve: (value: UploadApiResponse) => void,
  reject: (reason?: unknown) => void
) => (error: unknown, result: UploadApiResponse | undefined) => {
  if (error) {
    reject(error);
    return;
  }
  if (!result) {
    reject(new Error('No se recibió respuesta de Cloudinary'));
    return;
  }
  resolve(result);
};

const buildNotas = (
  notasUsuario: string | null,
  serviciosData: Map<string, ServicioExtraNormalized>
): string | null => {
  const serviciosDinamicos = Array.from(serviciosData.entries()).reduce<
    Record<string, ServicioExtraNormalized>
  >((acc, [key, data]) => {
    if (
      data.iata !== null ||
      data.neto !== null ||
      data.venduto !== null ||
      (data.metodoDiAcquisto && data.metodoDiAcquisto.length > 0)
    ) {
      acc[key] = data;
    }
    return acc;
  }, {});

  if (Object.keys(serviciosDinamicos).length > 0) {
    return JSON.stringify({
      notasUsuario: notasUsuario ?? '',
      serviciosDinamicos,
    });
  }

  return notasUsuario;
};

const buildIataJson = (
  pasajero: PasajeroFormPayload,
  serviciosData: Map<string, ServicioExtraNormalized>
): string | null => {
  const iataObject: Record<string, string> = {};
  const addIata = (key: string, value: unknown) => {
    const normalized = toNullableString(value);
    if (normalized) {
      iataObject[key] = normalized;
    }
  };

  addIata('biglietteria', pasajero.iataBiglietteria);
  addIata('express', pasajero.iataExpress);
  addIata('polizza', pasajero.iataPolizza);
  addIata('letteraInvito', pasajero.iataLetteraInvito);
  addIata('hotel', pasajero.iataHotel);

  serviciosData.forEach((data, key) => {
    if (data.iata) {
      iataObject[key] = data.iata;
    }
  });

  if (Object.keys(iataObject).length > 0) {
    return JSON.stringify(iataObject);
  }

  return toNullableString(pasajero.iata);
};

const buildCompatDetalle = (
  servicioNombre: string,
  pasajero: PasajeroFormPayload,
  serviciosData: Map<string, ServicioExtraNormalized>,
  andata: Date | null,
  ritorno: Date | null,
  estado: string,
  fechaPago: Date | null,
  fechaActivacion: Date | null,
  notas: string | null
): ServicioDetalleNormalized => {
  const servicioNormalizado = servicioNombre.trim().toUpperCase();
  const detalle: ServicioDetalleNormalized = {
    servicio: servicioNombre,
    metodoDiAcquisto: null,
    andata,
    ritorno,
    iata: null,
    neto: null,
    venduto: null,
    estado,
    fechaPago,
    fechaActivacion,
    notas,
  };

  const getMetodo = (campo: unknown): string | null => toNullableString(campo);
  const getNumero = (campo: unknown): number | null => toNumberOrNull(campo);

  if (servicioNormalizado.includes('VOLO') || servicioNormalizado.includes('BIGLIETTERIA')) {
    detalle.iata = toNullableString(pasajero.iataBiglietteria) ?? toNullableString(pasajero.iata);
    detalle.neto = getNumero(pasajero.netoBiglietteria);
    detalle.venduto = getNumero(pasajero.vendutoBiglietteria);
    detalle.metodoDiAcquisto = getMetodo(pasajero.metodoAcquistoBiglietteria);
  } else if (servicioNormalizado.includes('EXPRESS')) {
    detalle.iata = toNullableString(pasajero.iataExpress);
    detalle.neto = getNumero(pasajero.netoExpress);
    detalle.venduto = getNumero(pasajero.vendutoExpress);
    detalle.metodoDiAcquisto = getMetodo(pasajero.metodoAcquistoExpress);
  } else if (servicioNormalizado.includes('POLIZZA')) {
    detalle.iata = toNullableString(pasajero.iataPolizza);
    detalle.neto = getNumero(pasajero.netoPolizza);
    detalle.venduto = getNumero(pasajero.vendutoPolizza);
    detalle.metodoDiAcquisto = getMetodo(pasajero.metodoAcquistoPolizza);
  } else if (
    servicioNormalizado.includes('INVITO') ||
    servicioNormalizado.includes('LETTERA')
  ) {
    detalle.iata = toNullableString(pasajero.iataLetteraInvito);
    detalle.neto = getNumero(pasajero.netoLetteraInvito);
    detalle.venduto = getNumero(pasajero.vendutoLetteraInvito);
    detalle.metodoDiAcquisto = getMetodo(pasajero.metodoAcquistoLetteraInvito);
  } else if (servicioNormalizado.includes('HOTEL')) {
    detalle.iata = toNullableString(pasajero.iataHotel);
    detalle.neto = getNumero(pasajero.netoHotel);
    detalle.venduto = getNumero(pasajero.vendutoHotel);
    detalle.metodoDiAcquisto = getMetodo(pasajero.metodoAcquistoHotel);
  } else {
    const servicioKey = servicioNormalizado.toLowerCase();
    const servicioData =
      serviciosData.get(servicioKey) ?? serviciosData.get(servicioNombre.trim().toLowerCase());
    if (servicioData) {
      detalle.iata = servicioData.iata;
      detalle.neto = servicioData.neto;
      detalle.venduto = servicioData.venduto;
      detalle.metodoDiAcquisto = servicioData.metodoDiAcquisto;
    }
  }

  return detalle;
};

export const buildPasajeroCreateInput = (
  pasajero: PasajeroFormPayload
): PasajeroBuildResult => {
  const andata = parseDateOrNull(pasajero.andata);
  const ritorno = parseDateOrNull(pasajero.ritorno);
  const estado = toNullableString(pasajero.estado) ?? 'Pendiente';
  const fechaPago = parseDateOrNull(pasajero.fechaPago);
  const fechaActivacion = parseDateOrNull(pasajero.fechaActivacion);
  const notas = toNullableString(pasajero.notas);

  const serviciosSeleccionados = extractServiciosSeleccionados(pasajero);
  const serviciosDetalleFormulario = normalizeServiciosDetalleArray(pasajero.serviciosDetalle);
  const serviciosDataMap = normalizeServiciosData(pasajero.serviciosData);

  const serviciosDetalleCompat = serviciosSeleccionados.map((servicioNombre) =>
    buildCompatDetalle(
      servicioNombre,
      pasajero,
      serviciosDataMap,
      andata,
      ritorno,
      estado,
      fechaPago,
      fechaActivacion,
      notas
    )
  );

  const serviciosDetalleFinal =
    serviciosDetalleFormulario.length > 0 ? serviciosDetalleFormulario : serviciosDetalleCompat;

  const serviciosDetalleCreate = serviciosDetalleFinal.map((detalle) => ({
    servicio: detalle.servicio,
    metodoDiAcquisto: detalle.metodoDiAcquisto,
    andata: detalle.andata,
    ritorno: detalle.ritorno,
    iata: detalle.iata,
    neto: detalle.neto,
    venduto: detalle.venduto,
    estado: detalle.estado,
    fechaPago: detalle.fechaPago,
    fechaActivacion: detalle.fechaActivacion,
    notas: detalle.notas,
  }));

  const serviciosString =
    serviciosSeleccionados.length > 0 ? serviciosSeleccionados.join(', ') : 'SIN SERVICIO';

  const notasFinales = buildNotas(notas, serviciosDataMap);
  const iataJson = buildIataJson(pasajero, serviciosDataMap);

  const createInput: Prisma.PasajeroBiglietteriaCreateWithoutBiglietteriaInput = {
    nombrePasajero: toNullableString(pasajero.nombrePasajero) ?? '',
    servizio: serviciosString,
    andata,
    ritorno,
    iata: iataJson,
    netoBiglietteria: toNumberOrNull(pasajero.netoBiglietteria),
    vendutoBiglietteria: toNumberOrNull(pasajero.vendutoBiglietteria),
    tieneExpress: toBoolean(pasajero.tieneExpress),
    netoExpress: toNumberOrNull(pasajero.netoExpress),
    vendutoExpress: toNumberOrNull(pasajero.vendutoExpress),
    tienePolizza: toBoolean(pasajero.tienePolizza),
    netoPolizza: toNumberOrNull(pasajero.netoPolizza),
    vendutoPolizza: toNumberOrNull(pasajero.vendutoPolizza),
    tieneLetteraInvito: toBoolean(pasajero.tieneLetteraInvito),
    netoLetteraInvito: toNumberOrNull(pasajero.netoLetteraInvito),
    vendutoLetteraInvito: toNumberOrNull(pasajero.vendutoLetteraInvito),
    tieneHotel: toBoolean(pasajero.tieneHotel),
    netoHotel: toNumberOrNull(pasajero.netoHotel),
    vendutoHotel: toNumberOrNull(pasajero.vendutoHotel),
    estado,
    fechaPago,
    fechaActivacion,
    notas: notasFinales,
    serviciosDetalle: serviciosDetalleCreate.length > 0 ? { create: serviciosDetalleCreate } : undefined,
  };

  const netoContribution = serviciosDetalleFinal.reduce((acc, detalle) => {
    return acc + (detalle.neto ?? 0);
  }, 0);

  const vendutoContribution = serviciosDetalleFinal.reduce((acc, detalle) => {
    return acc + (detalle.venduto ?? 0);
  }, 0);

  return {
    createInput,
    netoContribution,
    vendutoContribution,
  };
};

