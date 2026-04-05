const CACHE_TTL_MS = 2 * 60 * 1000 // 2 minutos (D-05)

interface CacheEntry<T> {
  data: T
  expires: number
}

const cache = new Map<string, CacheEntry<unknown>>()

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (!entry || Date.now() > entry.expires) {
    if (entry) cache.delete(key)
    return null
  }
  return entry.data
}

export function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL_MS })
}

export function invalidateCache(key: string): void {
  cache.delete(key)
}
