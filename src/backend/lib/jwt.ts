/**
 * Centralized JWT secret helper.
 * Requires JWT_SECRET in production.
 * Allows a local-dev fallback to keep development setup simple.
 */
export function getJwtSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET;
    if (secret) {
        return new TextEncoder().encode(secret);
    }

    if (process.env.NODE_ENV !== "production") {
        const devFallback = process.env.JWT_SECRET_DEV_FALLBACK || "medichain-local-dev-secret";
        return new TextEncoder().encode(devFallback);
    }

    throw new Error(
        "JWT_SECRET environment variable is not set. " +
        "The application cannot start without a secure signing key."
    );
}
