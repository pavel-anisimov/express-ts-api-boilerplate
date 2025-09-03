// Simple in-memory "blacklist" jti with auto-cleaning by exp.
const revoked = new Map<string, number>(); // jti -> exp(sec epoch)

export const tokenRevocation = {
    revoke(jti: string, exp?: number) {
        // exp comes in seconds; if not, hold for 2 hours
        revoked.set(jti, exp ?? Math.floor(Date.now() / 1000) + 2 * 60 * 60);
    },
    isRevoked(jti?: string | null) {
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
    sweep() {
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
