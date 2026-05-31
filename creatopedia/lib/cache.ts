import { unstable_cache } from 'next/cache'

/**
 * Higher-order function to cache API queries using Next.js unstable_cache.
 * @param fn The function that performs the API query
 * @param keyParts Array of strings to form the cache key
 * @param revalidate Time in seconds to cache the result (default: 3600 / 1 hour)
 */
export async function cachedQuery<T>(
  fn: () => Promise<T>,
  keyParts: string[],
  revalidate: number = 3600
): Promise<T> {
  const cachedFn = unstable_cache(
    async () => fn(),
    keyParts,
    { revalidate }
  )
  return cachedFn()
}
