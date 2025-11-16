type CacheEntry<T = any> = {
  timestamp: number;
  data: T;
};

const memoryCache = new Map<string, CacheEntry>();

// Prefijo para sessionStorage para evitar conflictos
const STORAGE_PREFIX = 'cache_';

export function getCacheKey(url: string, init?: RequestInit): string {
  const method = init?.method || 'GET';
  const body = init?.body ? JSON.stringify(init.body) : '';
  return `${method}:${url}:${body}`;
}

// Función auxiliar para verificar si un caché es válido
function isCacheValid(cached: CacheEntry, ttlMs: number): boolean {
  const now = Date.now();
  return cached && (now - cached.timestamp) < ttlMs;
}

// Función para obtener datos del caché SIN hacer fetch (solo lectura)
// Verifica primero memoria, luego sessionStorage
export function getCachedData<T = any>(
  url: string,
  options: { ttlMs?: number; init?: RequestInit; key?: string } = {}
): T | null {
  const { ttlMs = 15000, init, key } = options;
  const cacheKey = key || getCacheKey(url, init);

  // 1. Verificar caché en memoria primero (más rápido)
  const now = Date.now();
  const memoryCached = memoryCache.get(cacheKey);
  if (memoryCached && isCacheValid(memoryCached, ttlMs)) {
    return memoryCached.data as T;
  }

  // 2. Verificar sessionStorage (persiste entre cold starts)
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(`${STORAGE_PREFIX}${cacheKey}`);
      if (stored) {
        const sessionCached: CacheEntry = JSON.parse(stored);
        if (isCacheValid(sessionCached, ttlMs)) {
          // Restaurar en memoria para acceso rápido
          memoryCache.set(cacheKey, sessionCached);
          return sessionCached.data as T;
        } else {
          // Eliminar si expiró
          sessionStorage.removeItem(`${STORAGE_PREFIX}${cacheKey}`);
        }
      }
    } catch (error) {
      // Si sessionStorage falla (puede estar lleno o deshabilitado), continuar
      console.warn('Error reading from sessionStorage:', error);
    }
  }

  return null;
}

export async function cachedFetch<T = any>(
  url: string,
  options: { ttlMs?: number; init?: RequestInit; key?: string } = {}
): Promise<T> {
  const { ttlMs = 15000, init, key } = options;
  const cacheKey = key || getCacheKey(url, init);

  // Verificar caché primero
  const cached = getCachedData<T>(url, options);
  if (cached !== null) {
    return cached;
  }

  // Si no hay caché, hacer fetch
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  const data = (await response.json()) as T;
  const now = Date.now();
  const cacheEntry: CacheEntry = { timestamp: now, data };

  // Guardar en memoria
  memoryCache.set(cacheKey, cacheEntry);

  // Guardar en sessionStorage (persiste entre cold starts)
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(`${STORAGE_PREFIX}${cacheKey}`, JSON.stringify(cacheEntry));
    } catch (error) {
      // Si sessionStorage está lleno, intentar limpiar entradas viejas
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        try {
          // Limpiar entradas más viejas (más de 1 hora)
          const oneHourAgo = now - 3600000;
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key?.startsWith(STORAGE_PREFIX)) {
              try {
                const entry: CacheEntry = JSON.parse(sessionStorage.getItem(key) || '{}');
                if (entry.timestamp < oneHourAgo) {
                  sessionStorage.removeItem(key);
                }
              } catch {
                sessionStorage.removeItem(key);
              }
            }
          }
          // Intentar guardar de nuevo
          sessionStorage.setItem(`${STORAGE_PREFIX}${cacheKey}`, JSON.stringify(cacheEntry));
        } catch {
          // Si aún falla, solo usar memoria (no crítico)
          console.warn('Could not save to sessionStorage, using memory cache only');
        }
      }
    }
  }

  return data;
}

export function invalidateCache(key: string) {
  memoryCache.delete(key);
  // También limpiar de sessionStorage
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch (error) {
      console.warn('Error removing from sessionStorage:', error);
    }
  }
}

export function invalidateCacheByPrefix(prefix: string) {
  // Limpiar de memoria
  for (const k of memoryCache.keys()) {
    if (k.includes(prefix)) {
      memoryCache.delete(k);
    }
  }
  // Limpiar de sessionStorage
  if (typeof window !== 'undefined') {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(STORAGE_PREFIX) && key.includes(prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
    } catch (error) {
      console.warn('Error removing from sessionStorage:', error);
    }
  }
}

export function setCache<T = any>(key: string, data: T) {
  const now = Date.now();
  const cacheEntry: CacheEntry = { timestamp: now, data };
  memoryCache.set(key, cacheEntry);
  // También guardar en sessionStorage
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn('Error saving to sessionStorage:', error);
    }
  }
}


