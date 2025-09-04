// Simple in-memory "blacklist" jti with auto-cleaning by exp.
const revoked = new Map<string, number>(); // jti -> exp(sec epoch)

/**
 * Manages token revocation by storing and validating token identifiers (JTI).
 * Provides utility methods for revoking tokens, checking their revocation status,
 * and periodically cleaning up expired entries.
 *
 * @property {Object} tokenRevocation An object that holds methods for token revocation management.
 * @property {Function} revoke Revokes a token for a specified duration or a default duration of 2 hours.
 *   - @param {string} jti The identifier of the token to be revoked.
 *   - @param {number} [exp] Optional expiration time in seconds since the epoch. If not provided, defaults to 2 hours from the current time.
 *
 * @property {Function} isRevoked Checks if a token is currently revoked.
 *   - @param {string|null} [jti] The identifier of the token to check. If not supplied or null, it is considered not revoked.
 *   - @returns {boolean} True if the token is revoked and the revocation period has not expired, otherwise false.
 *
 * @property {Function} sweep Cleans up expired token revocations.
 *   - Removes all tokens from the internal storage whose revocation period has expired.
 */
export const tokenRevocation = {
    /**
     * Revokes a specific token identified by its JWT ID (jti) and sets an expiration time if provided.
     *
     * @param {string} jti - The JWT ID of the token to be revoked.
     * @param {number} [exp] - Optional expiration time in seconds. Defaults to 2 hours from the current time if not provided.
     * @return {void} This method does not return a value.
     */
    revoke(jti: string, exp?: number): void {
        // exp comes in seconds; if not, hold for 2 hours
        revoked.set(jti, exp ?? Math.floor(Date.now() / 1000) + 2 * 60 * 60);
    },
    /**
     * Checks if a given JWT ID (jti) has been revoked.
     *
     * @param {string | null} [jti] - The JWT ID to check for revocation. This can be a string, null, or undefined.
     * @return {boolean} Returns true if the jti has been revoked and is not expired.
     *                   Returns false if the jti is not revoked, expired, or not provided.
     */
    isRevoked(jti?: string | null): boolean {
        if (!jti) {
            return false;
        }

        const exp = revoked.get(jti);

        if (exp === undefined) {
            return false;
        }
        // if the term has passed, we will clean it and return false
        if (exp < Math.floor(Date.now() / 1000)) {
            revoked.delete(jti);
            return false;
        }
        return true;
    },

    /**
     * Iterates through a collection of revoked items and removes entries that have expired.
     * The expiration is determined by comparing the current timestamp with the expiration time.
     *
     * @return {void} Does not return a value.
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

// We clean it every 20 minutes.
setInterval(() => tokenRevocation.sweep(), 20 * 60_000).unref();
