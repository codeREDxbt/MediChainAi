/**
 * Simple in-memory rate limiter.
 * Suitable for single-instance deployments.
 * For multi-instance (e.g. serverless), use Redis-backed rate limiting.
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Periodically clean up expired entries to prevent memory leaks
const CLEANUP_INTERVAL_MS = 60_000; // 1 minute
let lastCleanup = Date.now();

function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
    lastCleanup = now;

    for (const [key, entry] of rateLimitMap.entries()) {
        if (now > entry.resetTime) {
            rateLimitMap.delete(key);
        }
    }
}

interface RateLimitOptions {
    /** Time window in milliseconds */
    windowMs: number;
    /** Maximum number of requests per window */
    maxRequests: number;
}

interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetTime: number;
}

/**
 * Check rate limit for a given identifier (typically an IP address).
 *
 * @param identifier - Unique key for the client (e.g. IP address)
 * @param options - Rate limit configuration
 * @returns Whether the request is allowed and remaining quota
 */
export function checkRateLimit(
    identifier: string,
    options: RateLimitOptions
): RateLimitResult {
    cleanup();

    const now = Date.now();
    const entry = rateLimitMap.get(identifier);

    // No existing entry or window expired — allow and start fresh
    if (!entry || now > entry.resetTime) {
        const resetTime = now + options.windowMs;
        rateLimitMap.set(identifier, { count: 1, resetTime });
        return { success: true, remaining: options.maxRequests - 1, resetTime };
    }

    // Within window — check count
    if (entry.count < options.maxRequests) {
        entry.count++;
        return {
            success: true,
            remaining: options.maxRequests - entry.count,
            resetTime: entry.resetTime,
        };
    }

    // Over limit
    return {
        success: false,
        remaining: 0,
        resetTime: entry.resetTime,
    };
}

/**
 * Extract client IP from request headers.
 * Works with common reverse proxies (Vercel, Cloudflare, nginx).
 */
export function getClientIp(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    const realIp = request.headers.get("x-real-ip");
    if (realIp) {
        return realIp;
    }
    return "unknown";
}
