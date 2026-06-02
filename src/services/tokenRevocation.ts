/**
 * In-memory token revocation store.
 *
 * Keys are JWT IDs (`jti`); values are expiration timestamps in seconds. This
 * process-local store is useful for local mock behavior but should be replaced
 * by shared storage when multiple gateway instances need to honor revocations.
 */
const revoked = new Map<string, number>();

/**
 * Token revocation service for JWT IDs.
 */
export const tokenRevocation = {
    /**
     * Revokes a token until its JWT expiration, or for two hours when no expiration is known.
     */
    revoke(jti: string, exp?: number): void {
        revoked.set(jti, exp ?? Math.floor(Date.now() / 1000) + 2 * 60 * 60);
    },

    /**
     * Returns whether a token id is currently revoked.
     *
     * Expired revocation entries are removed lazily on read.
     */
    isRevoked(jti?: string | null): boolean {
        if (!jti) {
            return false;
        }

        const exp = revoked.get(jti);

        if (exp === undefined) {
            return false;
        }

        if (exp < Math.floor(Date.now() / 1000)) {
            revoked.delete(jti);
            return false;
        }
        return true;
    },

    /**
     * Removes expired revocation entries from the in-memory store.
     */
    sweep(): void {
        const now = Math.floor(Date.now() / 1000);

        for (const [j, e] of revoked) {
            if (e < now) {
                revoked.delete(j);
            }
        }
    },
};

/**
 * Periodic cleanup for long-running local processes.
 */
setInterval(() => tokenRevocation.sweep(), 20 * 60_000).unref();
