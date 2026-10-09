/**
 * Simple fixed-window rate limiter keyed by an arbitrary string (usually an IP).
 * Expired buckets are pruned automatically, so memory is bounded by the number
 * of distinct keys seen in the last two windows.
 *
 * Usage:
 *   const limiter = createRateLimiter({ limit: 10, windowMs: 60_000 });
 *   if (!limiter.allow(ip)) { ... reject ... }
 */
function createRateLimiter({ limit = 60, windowMs = 60_000, now = Date.now } = {}) {
  if (limit < 1) throw new RangeError('limit must be at least 1');
  if (windowMs < 1) throw new RangeError('windowMs must be at least 1');

  const buckets = new Map();
  let lastPruneAt = now();

  function bucketFor(key, timestamp) {
    const bucket = buckets.get(key);
    if (bucket && timestamp - bucket.start < windowMs) return bucket;
    const fresh = { start: timestamp, count: 0 };
    buckets.set(key, fresh);
    return fresh;
  }

  function allow(key) {
    const timestamp = now();
    if (timestamp - lastPruneAt >= windowMs) prune(timestamp);
    const bucket = bucketFor(key, timestamp);
    if (bucket.count >= limit) return false;
    bucket.count += 1;
    return true;
  }

  function remaining(key) {
    const bucket = buckets.get(key);
    if (!bucket || now() - bucket.start >= windowMs) return limit;
    return Math.max(0, limit - bucket.count);
  }

  /**
   * Drop every bucket whose window has elapsed. Called automatically from allow()
   * at most once per window, so inactive keys never outlive two windows; it can
   * also be called manually.
   */
  function prune(timestamp = now()) {
    for (const [key, bucket] of buckets) {
      if (timestamp - bucket.start >= windowMs) buckets.delete(key);
    }
    lastPruneAt = timestamp;
  }

  function reset(key) {
    if (key === undefined) buckets.clear();
    else buckets.delete(key);
  }

  return { allow, remaining, prune, reset, size: () => buckets.size };
}

module.exports = { createRateLimiter };
