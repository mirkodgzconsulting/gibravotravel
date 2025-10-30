type CacheEntry<T = any> = {
  timestamp: number;
  data: T;
};

const memoryCache = new Map<string, CacheEntry>();

export function getCacheKey(url: string, init?: RequestInit): string {
  const method = init?.method || 'GET';
  const body = init?.body ? JSON.stringify(init.body) : '';
  return `${method}:${url}:${body}`;
}

export async function cachedFetch<T = any>(
  url: string,
  options: { ttlMs?: number; init?: RequestInit; key?: string } = {}
): Promise<T> {
  const { ttlMs = 15000, init, key } = options;
  const cacheKey = key || getCacheKey(url, init);

  const now = Date.now();
  const cached = memoryCache.get(cacheKey);
  if (cached && now - cached.timestamp < ttlMs) {
    return cached.data as T;
  }

  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  const data = (await response.json()) as T;
  memoryCache.set(cacheKey, { timestamp: now, data });
  return data;
}

export function invalidateCache(key: string) {
  memoryCache.delete(key);
}

export function invalidateCacheByPrefix(prefix: string) {
  for (const k of memoryCache.keys()) {
    if (k.includes(prefix)) memoryCache.delete(k);
  }
}

export function setCache<T = any>(key: string, data: T) {
  memoryCache.set(key, { timestamp: Date.now(), data });
}


